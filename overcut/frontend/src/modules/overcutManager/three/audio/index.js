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
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createStream } from "../../../overcutTrayectoria/engine/rng";
import { loadSeasonPack } from "../../engine/packs/seasonPacks";
import audioData from "../../data/balance/audio.json";
import { createEngineVoice, driveStep, engineSpecFor } from "./engineSynth";
import { assignVoices, cameraMix, createMixer, distanceGain, dopplerFactor, listenerFor, loadSettings, saveSettings, selectVoices } from "./mixer";
import { airGunsOn, createAmbience, crowdLevel, makeNoiseBuffer, rainOf, squeals, swellFor, windOf } from "./ambience";

export { engineSpecFor, eraFor, firingFrequency, nextGear, parseFormula } from "./engineSynth";
export { cameraMix, distanceGain, dopplerFactor, loadSettings, saveSettings, sliderToGain } from "./mixer";

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
export const createRaceAudio = ({ seed = "race", year = 2012, engines = {}, circuitId = null, date = null } = {}) => {
  let ctx = null;
  let mixer = null;
  let ambience = null;
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
  const random = createStream(`${seed}::audio`).next;

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
      ambience = createAmbience(ctx, mixer.ambience, noise);
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
    setEngines(map) {
      teamEngines = map || {};
      specs.clear();
    },
    /**
     * One view frame: { tau, playing, mode, focusId, cars: [{ id, teamId, pose }],
     * wetness, events, started }.
     */
    frame({ tau = 0, playing = true, mode = "tv", focusId = null, cars = [], wetness = 0, events = [], started: lightsOut = false }) {
      if (!ctx || ctx.state === "closed") return;
      const now = ctx.currentTime;
      const dt = lastTime === null ? 0 : Math.max(0, now - lastTime);
      lastTime = now;
      let dtau = lastTau === null ? 0 : tau - lastTau;
      lastTau = tau;
      // A skip (next event, a lap, to the flag) is not driving: start every car afresh.
      if (dtau < 0 || dtau > 3) {
        drive.clear();
        dtau = 0;
      }
      const mix = cameraMix(mode);

      // Every car's drivetrain, cheap pure maths (22 cars).
      const placed = [];
      cars.forEach(({ id, teamId, pose }) => {
        if (!pose) return;
        const spec = specOf(teamId);
        const state = driveStep(spec, drive.get(id), pose, dtau, dt);
        drive.set(id, state);
        const heading = pose.heading || 0;
        placed.push({ id, spec, state, pose, x: pose.x, y: pose.y, vx: Math.cos(heading) * state.v, vy: Math.sin(heading) * state.v, gone: Boolean(pose.gone || (pose.finished && state.v < 1)) });
      });
      const byId = new Map(placed.map((car) => [car.id, car]));
      const focus = byId.get(focusId) || placed[0];
      const listener = listenerFor(mix, focus ? { ...focus.pose, v: focus.state.v } : null, post);
      post = listener.post;
      const heading = mix.listener === "post" && focus ? Math.atan2(focus.y - listener.y, focus.x - listener.x) : focus?.pose.heading || 0;
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
          { gain: playing ? share : 0, doppler, interior: atEar ? mix.interior : 0, lowpassHz: mix.lowpassHz, time: now, crackle },
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
      ambience.update({
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
export const useRaceAudio = ({ seed, year, circuitId = null, date = null }) => {
  const ref = useRef(null);
  if (!ref.current) ref.current = createRaceAudio({ seed, year, circuitId, date });
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
  const update = useCallback((patch) => setLocal(ref.current.setSettings(patch)), []);
  const frame = useCallback((data) => ref.current.frame(data), []);
  return { settings, update, enabled, enable, frame, supported: audioSupported() };
};
