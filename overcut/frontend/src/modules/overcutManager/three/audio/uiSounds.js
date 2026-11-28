/**
 * Interface and radio sounds of the live view (radio-ui-sounds, AUD-4; RF-CMD-03, RNF-07,
 * RNF-08; F1M24-GAMEPLAY §2.1): a click for the buttons, a whoosh into and out of the replay
 * and on a skip, a rising stair of tones for the race-control alerts of the engine's log, and
 * the engineer's «radio» without a voice. All synthesised here with Web Audio, own design, no
 * recording of any game; every number in data/balance/audio.json `ui`.
 *
 * The radio (AUD-C3, F1M24-CHINA §2.7; RF-CMD-03, RF-WKD-02): a fixed sequence of phases so the
 * ear learns «a message is coming» - a whoosh sweeping up, our own three-note motif (not the
 * game's), a gap, static in a wide band (not the telephone one) and a closing tone - all of it
 * panned towards the side of the driver's panel on screen (the frame's `panels`, or the
 * message's own `panel`/`side`), on the ui bus, so its level does not follow the camera or the
 * simulation speed. The same cue serves the race and the playable sessions (engine/sessionSim
 * radio[], SES-C1).
 *
 * Pause and sting (AUD-C12, F1M24-CHINA §2.7, §1.5 «Cortinilla»): a low thump of our own when
 * the view goes from live to a pause or a menu (ui.pause; nothing on the way back), and the
 * replay's sting in three layers - a noise sweep, a low hit and a two-tone shimmer - laid on the
 * length of broadcast.json replay.stingSec, the one source of that length (ui.sting only shapes
 * the layers). It sounds on the replay's own sting phases when the view hands them
 * (`replayPhase` stingIn / stingOut) and otherwise on entering and leaving the replay view, in
 * place of the whoosh there.
 *
 * Two pure layers, tested in audio.test.js: `cueShots` turns a cue into a list of shots
 * (tones and filtered noise with their times and gains), and `uiCuesStep` decides from a view
 * frame which cues are due (new alert events, new radio messages, a change of view, a skip),
 * with a cooldown per cue in audio-context seconds. `playCue` renders the shots on the ui bus
 * of the mixer (its own level and mute). Nothing here reads or writes the race, and nothing
 * draws random numbers: the static and the whoosh reuse the ambience's noise buffer, so the
 * seeded audio stream is the same with and without these sounds (RF-SIM-15, RNF-05).
 */

import audioData from "../../data/balance/audio.json";
import broadcastData from "../../data/balance/broadcast.json";

const UI = audioData.ui;
const KINDS = ["click", "whoosh", "alert", "radio", "pause", "sting"];
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

// ------------------------------------------------------------------ the radio's side (pure)

/**
 * The StereoPannerNode position that puts `db` more on one side than the other for a mono
 * source (equal power: L = cos(θ), R = sin(θ), θ = (pan + 1)·π/4), so R − L = db at
 * pan = 4/π·atan(10^(db/20)) − 1; negative db, the same to the left.
 */
export const panFromDb = (db) => {
  const value = Number(db);
  if (!Number.isFinite(value) || value === 0) return 0;
  return Math.sign(value) * ((4 / Math.PI) * Math.atan(10 ** (Math.abs(value) / 20)) - 1);
};

/** The left and right gains of a mono source at `pan` (-1..1), as the StereoPannerNode applies them. */
export const panGains = (pan) => {
  const theta = ((clamp(Number(pan) || 0, -1, 1) + 1) * Math.PI) / 4;
  return { left: Math.cos(theta), right: Math.sin(theta) };
};

/**
 * Which side of the screen a radio message belongs to: the message's own `side` ("left" or
 * "right") or `panel` (0 left, 1 right), else the place of its `carId` in `panels` (the
 * player's driver cards in screen order, left to right). Null when unknown (centred).
 */
export const radioSideOf = (message, panels = null) => {
  if (!message || typeof message !== "object") return null;
  if (message.side === "left" || message.side === "right") return message.side;
  if (message.panel === 0) return "left";
  if (message.panel === 1) return "right";
  if (Array.isArray(panels) && message.carId != null) {
    const index = panels.indexOf(message.carId);
    if (index === 0) return "left";
    if (index === 1) return "right";
  }
  return null;
};

/** The pan of a radio message (ui.radio.pan): towards its panel's side, 0 without one or with the option off. */
export const radioPanOf = (message, panels = null, cfg = UI) => {
  const pan = cfg.radio && cfg.radio.pan;
  if (!pan || !pan.byPanelSide) return 0;
  const side = radioSideOf(message, panels);
  if (!side) return 0;
  return (side === "left" ? -1 : 1) * panFromDb(pan.db);
};

/**
 * The radio's phases in seconds from the start of the cue (ui.radio.sequence): whoosh, motif
 * (an alert repeats its first note before it), gap, static and tail, each { start, end }.
 */
export const radioTimeline = ({ alert = false } = {}, cfg = UI) => {
  const seq = cfg.radio.sequence;
  const notes = alert ? [seq.motif.notes[0], ...seq.motif.notes] : seq.motif.notes;
  const whoosh = { start: 0, end: seq.whoosh.durationSec };
  const motif = { start: whoosh.end, end: whoosh.end + (notes.length - 1) * seq.motif.spacingSec + seq.motif.noteSec, notes };
  const gap = { start: motif.end, end: motif.end + seq.gapSec };
  const noise = { start: gap.end, end: gap.end + seq.static.durationSec };
  const tail = { start: noise.end, end: noise.end + seq.tail.durationSec };
  return { whoosh, motif, gap, static: noise, tail };
};

// ------------------------------------------------------------------ sting length (pure)

/**
 * How long the replay's sting lasts (s): broadcast.json replay.stingSec (CAM-C3, VIEW-13), the
 * one source; ui.sting.fallbackSec only when that is missing; 0 without a sting block.
 */
export const stingSecOf = (cfg = UI, broadcast = broadcastData) => {
  if (!cfg.sting) return 0;
  const sec = Number(broadcast?.replay?.stingSec);
  return Number.isFinite(sec) && sec > 0 ? sec : cfg.sting.fallbackSec;
};

// ------------------------------------------------------------------ shots (pure)

/**
 * The shots of one cue. `kind`: click | whoosh | alert | radio; `opts`: { direction: "in"|"out" }
 * for the whoosh, { level } for an alert (a key of alert.levels), { alert } for a radio
 * message. A shot is { type: "tone", hz, endHz, start, attackSec, durationSec, gain } or
 * { type: "noise", start, attackSec, durationSec, gain, filter: { type, hz, endHz, q } } with
 * `start` in seconds from the cue. An unknown kind or level gives no shots.
 */
export const cueShots = (kind, opts = {}, cfg = UI) => {
  if (kind === "click") {
    const c = cfg.click;
    return [
      { type: "noise", start: 0, attackSec: c.durationSec * 0.1, durationSec: c.durationSec, gain: c.noiseGain, filter: { type: "highpass", hz: c.noiseHz, endHz: c.noiseHz, q: 0.7 } },
      { type: "tone", hz: c.toneHz, endHz: c.toneHz, start: 0, attackSec: c.durationSec * 0.1, durationSec: c.durationSec, gain: c.toneGain },
    ];
  }
  if (kind === "whoosh") {
    const w = cfg.whoosh;
    const out = opts.direction === "out";
    return [
      {
        type: "noise",
        start: 0,
        attackSec: w.durationSec * w.attackShare,
        durationSec: w.durationSec,
        gain: w.gain,
        filter: { type: "bandpass", hz: out ? w.toHz : w.fromHz, endHz: out ? w.fromHz : w.toHz, q: w.q },
      },
    ];
  }
  if (kind === "alert") {
    const a = cfg.alert;
    const level = a.levels[opts.level];
    if (!level) return [];
    return a.steps.slice(0, level.steps).map((step, i) => ({ type: "tone", hz: step.hz, endHz: step.hz, start: i * a.stepSec, attackSec: a.attackSec, durationSec: a.toneSec, gain: a.gain }));
  }
  if (kind === "pause") {
    // AUD-C12: a falling low tone and a low-passed body of noise under it.
    const p = cfg.pause;
    if (!p) return [];
    return [
      { type: "tone", layer: "thump", hz: p.thump.fromHz, endHz: p.thump.toHz, start: 0, attackSec: p.attackSec, durationSec: p.durationSec, gain: p.thump.gain },
      { type: "noise", layer: "body", start: 0, attackSec: p.attackSec, durationSec: p.durationSec * p.body.durationShare, gain: p.body.gain, filter: { type: "lowpass", hz: p.body.lowpassHz, endHz: p.body.lowpassHz, q: p.body.q } },
    ];
  }
  if (kind === "sting") {
    // AUD-C12: three layers on the sting's length (opts.stingSec, else broadcast.json's).
    const s = cfg.sting;
    if (!s) return [];
    const length = Number.isFinite(opts.stingSec) && opts.stingSec > 0 ? opts.stingSec : stingSecOf(cfg);
    const out = opts.direction === "out";
    const { sweep, hit, shimmer } = s;
    const shots = [
      {
        type: "noise",
        layer: "sweep",
        start: sweep.startShare * length,
        attackSec: sweep.lengthShare * length * sweep.attackShare,
        durationSec: sweep.lengthShare * length,
        gain: sweep.gain,
        filter: { type: "bandpass", hz: out ? sweep.toHz : sweep.fromHz, endHz: out ? sweep.fromHz : sweep.toHz, q: sweep.q },
      },
      { type: "tone", layer: "hit", hz: hit.fromHz, endHz: hit.toHz, start: hit.startShare * length, attackSec: hit.attackSec, durationSec: hit.lengthShare * length, gain: hit.gain },
    ];
    // The shimmer's notes come in one after another and all end with the sting.
    const end = (shimmer.startShare + shimmer.lengthShare) * length;
    shimmer.notes.forEach((note, i) => {
      const start = (shimmer.startShare + i * shimmer.spacingShare) * length;
      shots.push({ type: "tone", layer: "shimmer", hz: note.hz, endHz: note.hz, start, attackSec: shimmer.attackSec, durationSec: Math.max(0.01, end - start), gain: shimmer.gain });
    });
    return shots;
  }
  if (kind === "radio") {
    const r = cfg.radio;
    const seq = r.sequence;
    const line = radioTimeline(opts, cfg);
    const shots = [];
    const w = seq.whoosh;
    shots.push({ type: "noise", phase: "whoosh", start: line.whoosh.start, attackSec: w.durationSec * w.attackShare, durationSec: w.durationSec, gain: w.gain, filter: { type: "bandpass", hz: w.fromHz, endHz: w.toHz, q: w.q } });
    line.motif.notes.forEach((note, i) => shots.push({ type: "tone", phase: "motif", hz: note.hz, endHz: note.hz, start: line.motif.start + i * seq.motif.spacingSec, attackSec: r.attackSec, durationSec: seq.motif.noteSec, gain: seq.motif.gain }));
    // The static in the band: a high-pass at its low edge and a low-pass at its high edge (flat inside, no resonance).
    const low = { type: "highpass", hz: r.band.lowHz, endHz: r.band.lowHz, q: 0.7 };
    const high = { type: "lowpass", hz: r.band.highHz, endHz: r.band.highHz, q: 0.7 };
    shots.push({ type: "noise", phase: "static", start: line.static.start, attackSec: r.attackSec * 4, durationSec: seq.static.durationSec, gain: seq.static.gain, filter: low, filters: [low, high] });
    shots.push({ type: "tone", phase: "tail", hz: seq.tail.hz, endHz: seq.tail.hz, start: line.tail.start, attackSec: r.attackSec, durationSec: seq.tail.durationSec, gain: seq.motif.gain });
    return shots;
  }
  return [];
};

/** When the last shot of a cue has finished, in seconds from its start. */
export const cueLength = (shots) => shots.reduce((end, shot) => Math.max(end, shot.start + shot.durationSec), 0);

// ------------------------------------------------------------------ which cues are due (pure)

/** A fresh state for `uiCuesStep` and the controller's own cues. */
export const createUiCueState = () => ({ seenEvents: -1, radioKeys: null, view: undefined, replayPhase: undefined, phaseDriven: false, last: {} });

/** Is a cue of this kind allowed at `now` (its cooldown since the last one)? Marks it played when it is. */
export const gateCue = (state, kind, now, cfg = UI) => {
  const cooldown = cfg[kind]?.cooldownSec ?? 0;
  const last = state.last[kind];
  if (Number.isFinite(last) && now - last < cooldown) return false;
  state.last[kind] = now;
  return true;
};

/** The alert level of an engine event (alert.events), or null. */
export const alertLevelOf = (event, cfg = UI) => (event && cfg.alert.events[event.type] && cfg.alert.levels[cfg.alert.events[event.type]] ? cfg.alert.events[event.type] : null);

/**
 * A radio message's identity across frames: the feed's `key`; for an engine message with its
 * time `t` (sessions, SES-C1), segment, time, car and kind (the list is cut per segment and by
 * time, so its index moves); otherwise lap, car, kind and place in the list.
 */
const radioKeyOf = (message, index) => {
  if (message && message.key != null) return String(message.key);
  if (message && Number.isFinite(message.t)) return `${message.segment ?? ""}|${message.t}|${message.carId ?? ""}|${message.kind ?? ""}`;
  return `${message?.lap ?? ""}|${message?.carId ?? ""}|${message?.kind ?? ""}|${index}`;
};

/**
 * The cues a view frame calls for. `frame`: { events (the engine's log, appended), radio
 * (optional: the engineer's messages, { key, alert } or engine { lap, carId, kind, t?, segment? }),
 * panels (optional: the player's cards' carIds in screen order, for the radio's side), view
 * (the resolved view name), skipped (a jump forward), replayPhase (optional: the replay
 * overlay's phase, stingIn / stingOut / ...) }. The first frame only takes note of what is
 * already there (no burst when the view opens). At most `maxPerFrame` cues, the most important
 * first (alert, radio, sting or whoosh, pause), each behind its cooldown.
 * Returns [{ kind, opts }] and updates `state`.
 */
export const uiCuesStep = (state, frame, now, cfg = UI) => {
  const cues = [];
  const events = Array.isArray(frame.events) ? frame.events : [];
  if (state.seenEvents < 0 || state.seenEvents > events.length) state.seenEvents = events.length;
  let best = null;
  events.slice(state.seenEvents).forEach((event) => {
    const level = alertLevelOf(event, cfg);
    if (level && (!best || cfg.alert.levels[level].rank > cfg.alert.levels[best].rank)) best = level;
  });
  state.seenEvents = events.length;
  if (best) cues.push({ kind: "alert", opts: { level: best } });

  if (Array.isArray(frame.radio)) {
    const keys = frame.radio.map(radioKeyOf);
    if (state.radioKeys) {
      const fresh = frame.radio.filter((message, i) => !state.radioKeys.has(keys[i]));
      if (fresh.length) {
        // One cue for what came in together: an alert first, and its side (AUD-C3).
        const lead = fresh.find((message) => Boolean(message && message.alert)) || fresh[0];
        cues.push({ kind: "radio", opts: { alert: fresh.some((message) => Boolean(message && message.alert)), pan: radioPanOf(lead, frame.panels, cfg) } });
      }
    }
    state.radioKeys = new Set(keys);
  }

  const view = frame.view ?? null;
  const known = state.view !== undefined;
  const replayToggled = known && (state.view === "replay") !== (view === "replay");
  // AUD-C12: the sting takes the replay's place of the whoosh; on the overlay's own phases when
  // the view hands them, else on entering and leaving the replay view.
  const sting = Boolean(cfg.sting && cfg.sting.on && cfg.sting.on.replay);
  const phase = typeof frame.replayPhase === "string" ? frame.replayPhase : null;
  if (sting && phase !== null) {
    if (known && phase !== state.replayPhase && (phase === "stingIn" || phase === "stingOut")) cues.push({ kind: "sting", opts: { direction: phase === "stingIn" ? "in" : "out" } });
  } else if (sting && replayToggled && !state.phaseDriven) cues.push({ kind: "sting", opts: { direction: view === "replay" ? "in" : "out" } });
  else if (!sting && replayToggled && cfg.whoosh.on.replay) cues.push({ kind: "whoosh", opts: { direction: view === "replay" ? "in" : "out" } });
  if (!cues.some((cue) => cue.kind === "sting" || cue.kind === "whoosh") && known && frame.skipped && cfg.whoosh.on.skip) cues.push({ kind: "whoosh", opts: { direction: "in" } });
  // AUD-C12: into a pause or a menu from a live view, the thump; leaving it, nothing.
  const pauseViews = cfg.pause ? cfg.pause.views : [];
  if (known && pauseViews.includes(view) && !pauseViews.includes(state.view)) cues.push({ kind: "pause", opts: {} });
  state.view = view;
  state.replayPhase = phase;
  // A replay whose overlay handed its phases already stung on them: leaving it adds nothing.
  if (view !== "replay") state.phaseDriven = false;
  else if (phase !== null) state.phaseDriven = true;

  return cues.filter((cue) => gateCue(state, cue.kind, now, cfg)).slice(0, cfg.maxPerFrame);
};

/**
 * The cue of a click on `target` (a DOM node): "click" when it is, or sits inside, something
 * that matches click.selector and no ancestor says data-ui-sound="off"; otherwise null.
 */
export const clickCueFor = (target, cfg = UI) => {
  if (!target || typeof target.closest !== "function") return null;
  if (target.closest('[data-ui-sound="off"]')) return null;
  try {
    return target.closest(cfg.click.selector) ? "click" : null;
  } catch (error) {
    return null;
  }
};

export const isUiCue = (kind) => KINDS.includes(kind);

// ------------------------------------------------------------------ Web Audio

/**
 * Render a cue's shots on `bus` at context time `at`. `noise` is a looping noise buffer (the
 * ambience's). With `opts.pan` (the radio's side, AUD-C3) the whole cue goes through one
 * StereoPannerNode; without that node (an old browser) it sounds centred. Returns how many
 * sources it started (0 for an unknown cue).
 */
export const playCue = (ctx, bus, noise, kind, opts = {}, at = ctx.currentTime, cfg = UI) => {
  const shots = cueShots(kind, opts, cfg);
  let out = bus;
  const pan = Number(opts && opts.pan);
  if (shots.length && Number.isFinite(pan) && pan !== 0 && typeof ctx.createStereoPanner === "function") {
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(clamp(pan, -1, 1), at);
    panner.connect(bus);
    out = panner;
  }
  shots.forEach((shot) => {
    const t0 = at + shot.start;
    const end = t0 + shot.durationSec;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(shot.gain, t0 + Math.min(shot.attackSec, shot.durationSec * 0.9));
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(out);
    let src;
    if (shot.type === "tone") {
      src = ctx.createOscillator();
      src.type = "sine";
      src.frequency.setValueAtTime(shot.hz, t0);
      if (shot.endHz !== shot.hz) src.frequency.exponentialRampToValueAtTime(shot.endHz, end);
      src.connect(env);
    } else {
      src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const chain = (Array.isArray(shot.filters) && shot.filters.length ? shot.filters : [shot.filter]).map((spec) => {
        const filter = ctx.createBiquadFilter();
        filter.type = spec.type;
        filter.frequency.setValueAtTime(spec.hz, t0);
        if (spec.endHz !== spec.hz) filter.frequency.exponentialRampToValueAtTime(spec.endHz, end);
        filter.Q.value = spec.q;
        return filter;
      });
      chain.reduce((from, filter) => from.connect(filter), src).connect(env);
    }
    src.start(t0);
    src.stop(end + 0.05);
  });
  return shots.length;
};
