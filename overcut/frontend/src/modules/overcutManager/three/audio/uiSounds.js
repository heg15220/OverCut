/**
 * Interface and radio sounds of the live view (radio-ui-sounds, AUD-4; RF-CMD-03, RNF-07,
 * RNF-08; F1M24-GAMEPLAY §2.1): a click for the buttons, a whoosh into and out of the replay
 * and on a skip, a rising stair of tones for the race-control alerts of the engine's log, and
 * the engineer's «radio» without a voice (an opening tone, static in the telephone band and a
 * closing tone). All synthesised here with Web Audio, own design, no recording of any game;
 * every number in data/balance/audio.json `ui`.
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

const UI = audioData.ui;
const KINDS = ["click", "whoosh", "alert", "radio"];

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
  if (kind === "radio") {
    const r = cfg.radio;
    const shots = [];
    const tone = (spec, start) => shots.push({ type: "tone", hz: spec.hz, endHz: spec.hz, start, attackSec: r.attackSec, durationSec: spec.durationSec, gain: r.toneGain });
    tone(r.open, 0);
    let at = r.open.durationSec;
    if (opts.alert) {
      tone(r.open, at + r.alertGapSec);
      at += r.alertGapSec + r.open.durationSec;
    }
    // Static in the band: centre the geometric mean of the edges, Q from the bandwidth.
    const centre = Math.sqrt(r.band.lowHz * r.band.highHz);
    shots.push({ type: "noise", start: at, attackSec: r.attackSec * 4, durationSec: r.staticSec, gain: r.staticGain, filter: { type: "bandpass", hz: centre, endHz: centre, q: centre / (r.band.highHz - r.band.lowHz) } });
    tone(r.close, at + r.staticSec);
    return shots;
  }
  return [];
};

/** When the last shot of a cue has finished, in seconds from its start. */
export const cueLength = (shots) => shots.reduce((end, shot) => Math.max(end, shot.start + shot.durationSec), 0);

// ------------------------------------------------------------------ which cues are due (pure)

/** A fresh state for `uiCuesStep` and the controller's own cues. */
export const createUiCueState = () => ({ seenEvents: -1, radioKeys: null, view: undefined, last: {} });

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

const radioKeyOf = (message, index) => (message && message.key != null ? String(message.key) : `${message?.lap ?? ""}|${message?.carId ?? ""}|${message?.kind ?? ""}|${index}`);

/**
 * The cues a view frame calls for. `frame`: { events (the engine's log, appended), radio
 * (optional: the engineer's messages, { key, alert } or engine { lap, carId, kind }), view
 * (the resolved view name), skipped (a jump forward) }. The first frame only takes note of
 * what is already there (no burst when the view opens). At most `maxPerFrame` cues, the
 * most important first (alert, radio, whoosh), each behind its cooldown.
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
      if (fresh.length) cues.push({ kind: "radio", opts: { alert: fresh.some((message) => Boolean(message && message.alert)) } });
    }
    state.radioKeys = new Set(keys);
  }

  const view = frame.view ?? null;
  if (state.view !== undefined && cfg.whoosh.on.replay && (state.view === "replay") !== (view === "replay")) cues.push({ kind: "whoosh", opts: { direction: view === "replay" ? "in" : "out" } });
  else if (state.view !== undefined && frame.skipped && cfg.whoosh.on.skip) cues.push({ kind: "whoosh", opts: { direction: "in" } });
  state.view = view;

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
 * ambience's). Returns how many sources it started (0 for an unknown cue).
 */
export const playCue = (ctx, bus, noise, kind, opts = {}, at = ctx.currentTime, cfg = UI) => {
  const shots = cueShots(kind, opts, cfg);
  shots.forEach((shot) => {
    const t0 = at + shot.start;
    const end = t0 + shot.durationSec;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(shot.gain, t0 + Math.min(shot.attackSec, shot.durationSec * 0.9));
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(bus);
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
      const filter = ctx.createBiquadFilter();
      filter.type = shot.filter.type;
      filter.frequency.setValueAtTime(shot.filter.hz, t0);
      if (shot.filter.endHz !== shot.filter.hz) filter.frequency.exponentialRampToValueAtTime(shot.filter.endHz, end);
      filter.Q.value = shot.filter.q;
      src.connect(filter).connect(env);
    }
    src.start(t0);
    src.stop(end + 0.05);
  });
  return shots.length;
};
