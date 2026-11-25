/**
 * Race audio for the live view (RF-3D-04; RNF-02): engines synthesised per car and era
 * (engineSynth.js), spatialised with distance, Doppler and a mix per camera (mixer.js),
 * and the ambience (ambience.js). Nothing plays until the viewer clicks the sound button
 * (browser autoplay policy); the context is suspended while the tab is hidden; at most
 * `mixer.maxVoices` engines sound at once, pooled.
 *
 * The view hands one frame per repaint: race time, playing or not, the camera, the focus
 * car, every car's pose (raceClock: x, y, heading, v, pitPhase, pitStage, incident; and
 * rpm/gear when the engine has a powertrain), the wetness and the race log. Audio never
 * writes back to the race. Randomness (crackle, noise) only from a seeded stream
 * (RF-SIM-15, RNF-05): no unseeded randomness and no wall clock.
 *
 * Per view (AUD-2, F1M24-GAMEPLAY §2.1): the frame may name the screen's view (`replay`,
 * `menu`; a stopped clock is `paused`, the map camera `map`) and the mix crossfades to its
 * snapshot; the TV and helicopter ear sits on the camera on air (`camera`, or the hook's
 * `cameraBus` ref that Race3D fills), the virtual post when there is none. The cars without a
 * voice of their own sound as the field bed, and the focus car's kerbs (data/circuits/
 * <splineId>/kerbs.json, with `circuit`) rumble under it. Everything optional: a frame
 * without them sounds as before.
 *
 * The start (AUD-3, F1M24-GAMEPLAY §2.13): with the engine's `snapshot.start` in the frame
 * (`start`, §1.7, SIM-3) each light that comes on sounds a thump and a tone, the lights going
 * out does not, and the cars standing on the grid idle and then hold their launch revs
 * (ambience.startLights, ambience.gridRevs). Without `start` none of that happens.
 *
 * Interface and radio (AUD-4, radio-ui-sounds, F1M24-GAMEPLAY §2.1; uiSounds.js) on their own
 * bus: a rising stair of tones for the race-control events of the log (audio.json
 * ui.alert.events), a whoosh into and out of the replay view and on a skip forward, the
 * «radio» without a voice for each new message of the frame's optional `radio` list (the
 * engineer's feed; absent, no radio sound), and `cue(kind)` for the view's own moments. The
 * hook clicks every button of the page while the live view is mounted (ui.click.selector).
 * None of it draws from the seeded stream or touches the race.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createStream } from "../../../overcutTrayectoria/engine/rng";
import { loadSeasonPack } from "../../engine/packs/seasonPacks";
import audioData from "../../data/balance/audio.json";
import { createEngineVoice, driveStep, engineSpecFor } from "./engineSynth";
import { assignVoices, blendMix, busGains, cameraListener, cameraUsable, createMixer, distanceGain, dopplerFactor, listenerFor, loadSettings, resolveView, saveSettings, selectVoices, viewMix } from "./mixer";
import { airGunsOn, createAmbience, crowdLevel, fieldBedOf, gridRevsOf, kerbRumble, makeNoiseBuffer, rainOf, squeals, startLightsStep, swellFor, windOf } from "./ambience";
import { firingFrequency } from "./engineSynth";
import { kerbZonesFor, onKerb } from "./kerbs";
import { clickCueFor, createUiCueState, gateCue, isUiCue, playCue, uiCuesStep } from "./uiSounds";

export { engineSpecFor, eraFor, firingFrequency, nextGear, parseFormula } from "./engineSynth";
export { gridRevsOf, startLightsStep } from "./ambience";
export { blendMix, cameraMix, distanceGain, dopplerFactor, loadSettings, resolveView, saveSettings, sliderToGain, viewMix } from "./mixer";
export { mixLevels } from "./levels";
export { clickCueFor, cueShots, uiCuesStep } from "./uiSounds";

const KMH = 3.6;
const VOICING = audioData.voicing;

/** teamId → { id, formula, manufacturer } from a season pack (f1db engines; the first one a team entered). */
export const teamEnginesOf = (pack) => {
  const out = {};
  (pack?.teams || []).forEach((team) => {
    const engine = team.engines && team.engines[0];
    if (engine) out[team.id] = { id: engine.id, formula: engine.formula, manufacturer: engine.manufacturer || null };
  });
  return out;
};

const audioContextClass = () => {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
};

/** Can this browser play the race sound at all? */
export const audioSupported = () => Boolean(audioContextClass());

/**
 * The controller. `start()` must run inside a user gesture; until then `frame()` is a
 * no-op, so the view can call it from the first render.
 */
export const createRaceAudio = ({ seed = "race", year = 2012, engines = {}, circuitId = null, date = null, cameraBus = null, circuit = null } = {}) => {
  let ctx = null;
  let mixer = null;
  let ambience = null;
  let noiseBuffer = null;
  const uiState = createUiCueState();
  let voices = [];
  let panners = [];
  let slots = [];
  let settings = loadSettings();
  let teamEngines = engines;
  const specs = new Map();
  const drive = new Map();
  const incidents = new Map();
  let swells = [];
  let seen = -1;
  let started = false;
  let lastTau = null;
  let lastTime = null;
  let post = null;
  let ear = null;
  let fade = null;
  let shownMix = null;
  let kerbCircuit = circuit;
  let kerbZones = kerbZonesFor(circuit);
  const VIEWS = audioData.mixer.views;
  const LIGHTS = audioData.ambience.startLights;
  const GRID = audioData.ambience.gridRevs;
  let lightsSeen = null;
  let riseAt = null;
  const gridPicks = new Map();
  const random = createStream(`${seed}::audio`).next;
  // Where each car sits inside the measured grid ranges: its own seeded stream (RF-SIM-15), so
  // it never moves the shared audio stream and is the same whichever frame first sees the car.
  const gridPickOf = (id) => {
    if (!gridPicks.has(id)) {
      const stream = createStream(`${seed}::audio::grid::${id}`);
      gridPicks.set(id, { idle: stream.next(), hold: stream.next() });
    }
    return gridPicks.get(id);
  };

  const specOf = (teamId) => {
    if (!specs.has(teamId)) specs.set(teamId, engineSpecFor(year, teamEngines[teamId] || null, { circuitId, date }));
    return specs.get(teamId);
  };

  const onVisibility = () => {
    if (!ctx || typeof document === "undefined") return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  };

  const controller = {
    get running() {
      return Boolean(ctx);
    },
    get settings() {
      return settings;
    },
    /** Build the graph and resume the context. Call from a click. Returns false without Web Audio. */
    start() {
      if (ctx) {
        ctx.resume().catch(() => {});
        return true;
      }
      const Ctx = audioContextClass();
      if (!Ctx) return false;
      ctx = new Ctx();
      mixer = createMixer(ctx);
      const noise = makeNoiseBuffer(ctx, random);
      noiseBuffer = noise;
      ambience = createAmbience(ctx, mixer.ambience, noise, mixer.engine);
      const size = audioData.mixer.maxVoices;
      voices = Array.from({ length: size }, () => createEngineVoice(ctx, noise, random));
      panners = voices.map((voice) => {
        const panner = mixer.panner();
        voice.out.connect(panner);
        return panner;
      });
      slots = new Array(size).fill(null);
      mixer.apply(settings, ctx.currentTime);
      if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
      ctx.resume().catch(() => {});
      return true;
    },
    setSettings(next) {
      settings = saveSettings({ ...settings, ...next });
      if (ctx) mixer.apply(settings, ctx.currentTime);
      return settings;
    },
    /**
     * Play an interface cue now (click, whoosh, alert, radio; uiSounds.cueShots for `opts`),
     * behind its cooldown and only when the ui bus is audible. Returns whether it sounded.
     */
    cue(kind, opts = {}) {
      if (!ctx || ctx.state === "closed" || !isUiCue(kind)) return false;
      const gains = busGains(settings);
      if (gains.master <= 0 || gains.ui <= 0) return false;
      if (!gateCue(uiState, kind, ctx.currentTime)) return false;
      return playCue(ctx, mixer.ui, noiseBuffer, kind, opts, ctx.currentTime) > 0;
    },
    setEngines(map) {
      teamEngines = map || {};
      specs.clear();
    },
    /**
     * One view frame: { tau, playing, mode, focusId, cars: [{ id, teamId, pose }],
     * wetness, events, started } and, optional, start (the engine's snapshot.start).
     */
    frame({ tau = 0, playing = true, mode = "tv", focusId = null, cars = [], wetness = 0, events = [], started: startedFlag = false, view = null, camera, circuit: frameCircuit, start: frameStart = null, radio }) {
      if (!ctx || ctx.state === "closed") return;
      const now = ctx.currentTime;
      const dt = lastTime === null ? 0 : Math.max(0, now - lastTime);
      lastTime = now;
      let dtau = lastTau === null ? 0 : tau - lastTau;
      lastTau = tau;
      // A skip (next event, a lap, to the flag) is not driving: start every car afresh.
      const skipped = dtau < 0 || dtau > 3;
      const skippedAhead = dtau > 3;
      if (skipped) {
        drive.clear();
        dtau = 0;
      }
      // The start: only what the engine's snapshot says (§1.7); nothing without it.
      const start = frameStart && typeof frameStart === "object" ? frameStart : null;
      const lightsOut = Boolean(startedFlag) || start?.phase === "out";
      const lights = startLightsStep(lightsSeen, start, { reset: skipped });
      lightsSeen = lights.seen;
      const rising = Boolean(start) && start.phase === "lights" && (Number(start.lights) || 0) >= GRID.fromLight;
      if (!rising) riseAt = null;
      else if (riseAt === null || skipped) riseAt = tau;
      if (frameCircuit !== undefined && frameCircuit !== kerbCircuit) {
        kerbCircuit = frameCircuit;
        kerbZones = kerbZonesFor(frameCircuit);
      }
      // The view's snapshot on the camera's mix, crossfaded on a cut or a change of view.
      const viewName = resolveView({ view, playing, mode });
      // Interface cues (AUD-4): new alert events and radio messages, the replay, a skip.
      const uiCues = uiCuesStep(uiState, { events, radio, view: viewName, skipped: skippedAhead }, now);
      const uiGains = busGains(settings);
      if (uiGains.master > 0 && uiGains.ui > 0) uiCues.forEach((cue, k) => playCue(ctx, mixer.ui, noiseBuffer, cue.kind, cue.opts, now + k * audioData.ui.cueSpacingSec));
      const target = viewMix(mode, viewName);
      const onAir = camera !== undefined ? camera : cameraBus ? cameraBus.current : null;
      const useCamera = cameraUsable(onAir, mode, target);
      const fadeKey = `${target.group}|${viewName || ""}|${useCamera ? onAir.id ?? "" : ""}`;
      if (!fade || fade.key !== fadeKey) {
        const viewChanged = fade && fade.view !== viewName;
        fade = { key: fadeKey, view: viewName, from: shownMix, at: now, ms: viewChanged ? VIEWS.snapshotFadeMs : VIEWS.crossfadeMs };
      }
      const mix = blendMix(fade.from, target, fade.ms > 0 ? ((now - fade.at) * 1000) / fade.ms : 1);
      shownMix = mix;
      mixer.applyView(mix, now);

      // Every car's drivetrain, cheap pure maths (22 cars).
      const placed = [];
      cars.forEach(({ id, teamId, pose }) => {
        if (!pose) return;
        const spec = specOf(teamId);
        const state = driveStep(spec, drive.get(id), pose, dtau, dt);
        drive.set(id, state);
        // Standing on the grid: idle, then the launch revs from the light (unless the engine gives rpm).
        if (start && !Number.isFinite(pose.rpm) && state.v * KMH < GRID.stationaryKmh) {
          const revs = gridRevsOf(spec, start, riseAt === null ? -1 : tau - riseAt, gridPickOf(id));
          if (revs) {
            state.rpm = revs.rpm;
            state.load = revs.load;
            state.limiter = false;
          }
        }
        const heading = pose.heading || 0;
        placed.push({ id, spec, state, pose, x: pose.x, y: pose.y, vx: Math.cos(heading) * state.v, vy: Math.sin(heading) * state.v, gone: Boolean(pose.gone || (pose.finished && state.v < 1)) });
      });
      const byId = new Map(placed.map((car) => [car.id, car]));
      const focus = byId.get(focusId) || placed[0];
      let listener;
      let heading;
      if (useCamera) {
        // The ear on the camera that is on screen (cameraBus, §1.7): what is left of the picture is on the left.
        listener = cameraListener(onAir, ear, dtau);
        heading = listener.heading;
        ear = listener;
      } else {
        listener = listenerFor(mix, focus ? { ...focus.pose, v: focus.state.v } : null, post);
        post = listener.post;
        ear = null;
        heading = mix.listener === "post" && focus ? Math.atan2(focus.y - listener.y, focus.x - listener.x) : focus?.pose.heading || 0;
      }
      mixer.setListener(listener, heading, now);

      // Voices: the focus car and the loudest others, kept on their voice.
      slots = assignVoices(slots, selectVoices(placed, listener, focus?.id), voices.length);
      slots.forEach((id, index) => {
        const voice = voices[index];
        const car = id && byId.get(id);
        if (!car) {
          voice.silence(now);
          return;
        }
        voice.assign(car.spec);
        // Onboard and chase ride with the car: its own engine sits at the ear.
        const atEar = car.id === focus?.id && mix.listener === "car";
        const sx = atEar ? listener.x : car.x;
        const sy = atEar ? listener.y : car.y;
        mixer.setPosition(panners[index], sx, sy, atEar ? listener.z : 0.6, now);
        const doppler = atEar ? 1 : dopplerFactor({ x: car.x, y: car.y, z: 0.6, vx: car.vx, vy: car.vy }, listener);
        const share = car.id === focus?.id ? mix.focus : mix.field;
        const overrun = car.state.load < 0.2 && car.state.rpm > car.spec.revLimit * 0.5;
        const crackle = overrun && random() < VOICING.crackleRatePerSec * car.spec.crackle * Math.max(dt, 0.016) ? 1 : 0;
        voice.update(
          { ...car.state },
          { gain: share, doppler, interior: atEar ? mix.interior : 0, lowpassHz: mix.lowpassHz, time: now, crackle },
        );
      });

      // Race log: the crowd and the bangs (only what is new since the last frame).
      if (seen < 0) seen = events.length;
      events.slice(seen).forEach((event) => {
        const car = byId.get(event.carId);
        const metres = car ? Math.hypot(car.x - listener.x, car.y - listener.y) : 0;
        const amount = swellFor(event, metres);
        if (amount > 0) swells.push({ at: now, amount });
        if (event.type === "contact" && car && metres < audioData.ambience.impact.audibleMetres) ambience.impact(now, distanceGain(metres));
      });
      seen = Math.max(seen, events.length);
      // One thump and tone per light that came on (several in one frame at high speed are spaced).
      if (playing) lights.hits.forEach((_, k) => ambience.startLight(now + LIGHTS.delaySec + k * LIGHTS.burstSpacingSec));
      if (lightsOut && !started) swells.push({ at: now, amount: audioData.ambience.crowd.swell.start });
      started = Boolean(lightsOut);
      swells = swells.filter((swell) => now - swell.at < audioData.ambience.crowd.decaySec * 6);

      // Lock-ups and spins squeal when they start; air guns while a stop changes wheels near the ear.
      let guns = 0;
      placed.forEach((car) => {
        const metres = Math.hypot(car.x - listener.x, car.y - listener.y, listener.z || 0);
        const was = incidents.get(car.id) || null;
        const is = car.pose.incident || null;
        if (is !== was && squeals(is) && metres < audioData.ambience.impact.audibleMetres && playing) ambience.squeal(now, distanceGain(metres));
        incidents.set(car.id, is);
        if (airGunsOn(car.pose.pitStage) && metres < audioData.ambience.pit.audibleMetres) guns = Math.max(guns, distanceGain(metres));
      });

      const focusKmh = focus ? focus.state.v * KMH : 0;
      // The field bed: the cars near the ear without a voice, at their mean firing frequency.
      const bed = fieldBedOf(
        placed.map((car) => ({ id: car.id, x: car.x, y: car.y, gone: car.gone, firingHz: firingFrequency(car.state.rpm, car.spec.engine.cylinders) })),
        listener,
        slots,
      );
      // The kerb under the focus car (only when it is heard up close: its gain goes with the distance).
      const kerbOn = Boolean(focus && playing && !focus.pose.inPit && onKerb(kerbZones, focus.pose.progress, focus.pose.lateral, audioData.ambience.kerb.reachM));
      const rumble = kerbRumble(focusKmh, kerbOn);
      const kerbNear = mix.listener === "car" || !focus ? 1 : distanceGain(Math.hypot(focus.x - listener.x, focus.y - listener.y, listener.z || 0));
      ambience.update({
        bed: { level: bed.level * mix.field, hz: bed.hz },
        kerb: { gain: rumble.gain * mix.focus * kerbNear, hz: rumble.hz },
        time: now,
        crowd: crowdLevel(swells, now),
        crowdShare: mix.crowd,
        wind: windOf(playing ? focusKmh : 0, mix.wind),
        rain: rainOf(wetness),
        guns: playing ? guns : 0,
      });
    },
    dispose() {
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
      if (!ctx) return;
      voices.forEach((voice) => voice.stop());
      if (ambience) ambience.stop();
      if (mixer) mixer.disconnect();
      ctx.close().catch(() => {});
      ctx = null;
    },
  };
  return controller;
};

/**
 * React hook for LiveRace: one controller per race, the season's f1db engines from its
 * pack, the viewer's mix, and `enable()` for the sound button's click.
 */
export const useRaceAudio = ({ seed, year, circuitId = null, date = null, circuit = null }) => {
  const ref = useRef(null);
  // The camera on air: the view hands this ref to Race3D (its `cameraBus` prop, §1.7) and the TV ear sits on it.
  const cameraBus = useRef(null);
  if (!ref.current) ref.current = createRaceAudio({ seed, year, circuitId, date, cameraBus, circuit });
  const [settings, setLocal] = useState(() => ref.current.settings);
  const [enabled, setEnabled] = useState(false);

  // The season's engines are only fetched once the viewer turns the sound on.
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    loadSeasonPack(year).then(
      ({ pack }) => {
        if (live && ref.current) ref.current.setEngines(teamEnginesOf(pack));
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [year, enabled]);

  useEffect(
    () => () => {
      if (ref.current) ref.current.dispose();
    },
    [],
  );

  const enable = useCallback(() => {
    const ok = ref.current.start();
    setEnabled(ok);
    return ok;
  }, []);

  // Browsers only let audio start inside a gesture: the viewer's first click or key in the
  // live view turns the sound on (their saved mix, mute included, still applies).
  useEffect(() => {
    if (enabled || !audioSupported() || typeof window === "undefined") return undefined;
    const onGesture = () => enable();
    const opts = { once: true, capture: true };
    window.addEventListener("pointerdown", onGesture, opts);
    window.addEventListener("keydown", onGesture, opts);
    return () => {
      window.removeEventListener("pointerdown", onGesture, opts);
      window.removeEventListener("keydown", onGesture, opts);
    };
  }, [enabled, enable]);
  // Interface clicks (AUD-4): every button of the page while this view is mounted and the
  // sound is on (ui.click.selector; data-ui-sound="off" silences a container).
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;
    const onClick = (event) => {
      if (clickCueFor(event.target) && ref.current) ref.current.cue("click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled]);
  const update = useCallback((patch) => setLocal(ref.current.setSettings(patch)), []);
  const frame = useCallback((data) => ref.current.frame(data), []);
  const cue = useCallback((kind, opts) => (ref.current ? ref.current.cue(kind, opts) : false), []);
  return { settings, update, enabled, enable, frame, cue, cameraBus, supported: audioSupported() };
};
