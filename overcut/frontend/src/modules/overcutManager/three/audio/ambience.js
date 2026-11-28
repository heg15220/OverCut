/**
 * Ambience of the live race (RF-3D-04): a crowd bed that swells on passes, a new leader,
 * the start and the flag; wind with the focus car's speed; rain with the track's wetness;
 * the pit lane (air guns while the wheels are changed); tyre squeal on a lock-up or a
 * spin (engine `incident`); a thump on contact; the field bed of the cars without a voice
 * and the kerb rumble under the focus car (AUD-2), both on the engine bus; a thump and a tone
 * per start light and the revs on the grid, read from the engine's `snapshot.start` (AUD-3); the crowd
 * decorrelated left and right and a continuous stereo track bed under TV, helicopter and chase
 * (AUD-C4, F1M24-CHINA §2.7), so the TV is wide and never silent between passes. AUD-C7 (§2.7): the stop as
 * one-shots on the engine's stages (two gun hits per wheel, the jacks, the release) instead of a rattle
 * all through the wheels stage. AUD-C5 (§2.9): the rain split into `drops` (what falls: pink-tilted noise
 * of 1-8 kHz with seeded grains, low-passed on board under the halo) and `spray` (the water each car
 * throws, in its own voice). Synthesised from one shared noise
 * buffer, no recordings. Numbers in data/balance/audio.json `ambience` (RNF-07); the
 * envelopes and curves are pure and tested (audio.test.js).
 */

import audioData from "../../data/balance/audio.json";
import weatherData from "../../data/balance/race-weather.json";
import { sprayLevelOf } from "../../engine/weather";
import { distanceGain } from "./mixer";

const AMB = audioData.ambience;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

/** Event types of the race log (engine/race.js, engine/sim) that lift the crowd, and by how much. */
export const SWELL_OF = { pass: "pass", lead: "lead", contact: "contact", flag: "finish" };

/**
 * Crowd level: the bed plus swells that rise over `attackSec` and fade over `decaySec`
 * (`swells` are { at, amount } in real seconds), saturating at 1.
 */
export const crowdLevel = (swells, now, crowd = AMB.crowd) => {
  let level = crowd.base;
  swells.forEach((swell) => {
    const since = now - swell.at;
    if (since < 0) return;
    const rise = Math.min(1, since / crowd.attackSec);
    const fall = since <= crowd.attackSec ? 1 : Math.exp(-(since - crowd.attackSec) / crowd.decaySec);
    level += swell.amount * rise * fall;
  });
  return clamp(level, 0, 1);
};

/** Swell amount for a race event, scaled down when it happens far from the camera. */
export const swellFor = (event, metres = 0, crowd = AMB.crowd) => {
  const kind = SWELL_OF[event.type];
  if (!kind) return 0;
  const near = kind === "finish" || kind === "lead" ? 1 : clamp(1 - metres / (crowd.nearbyMetres * 2), 0.3, 1);
  return crowd.swell[kind] * near;
};

/** Wind gain and colour from speed (km/h) and the camera's wind share. */
export const windOf = (kmh, share, wind = AMB.wind) => {
  const x = clamp(kmh / wind.fullKmh, 0, 1);
  return { gain: wind.gain * share * x * x, hz: wind.lowHz + (wind.highHz - wind.lowHz) * x };
};

/**
 * The track bed's level for a mix (AUD-C4, F1M24-CHINA §2.7): its gain times the camera's
 * `bed` share (TV, helicopter and chase; none on board or on the map). 0 without the block.
 */
export const trackBedOf = (mix, bed = AMB.trackBed) => (bed && mix && Number.isFinite(mix.bed) ? bed.gain * clamp(mix.bed, 0, 1) : 0);

/**
 * First-order low-pass coefficients for an IIRFilterNode (the -6 dB/octave slope of the
 * track bed): y[n] = b0·x[n] − a1·y[n−1], with a1 = −e^(−2π·fc/fs) and b0 = 1 + a1.
 */
export const onePoleLowpass = (hz, sampleRate) => {
  const a1 = -Math.exp((-2 * Math.PI * hz) / sampleRate);
  return { feedforward: [1 + a1], feedback: [1, a1] };
};

/** Rain gain from the track's wetness 0..1 (nothing under the threshold). */
export const rainOf = (wetness, rain = AMB.rain) => (wetness <= rain.threshold ? 0 : rain.gain * Math.sqrt(clamp((wetness - rain.threshold) / (1 - rain.threshold), 0, 1)));

/**
 * The field bed (field-bed-start): the cars near the ear that have no voice of their own
 * (`voiced` ids), not gone, within `nearbyMetres`, summed as power through the mixer's
 * distance law, times `gain`, up to `maxLevel`. Returns { level, hz } where hz is the mean
 * firing frequency of those cars (their `firingHz`), clamped to the comb range; 0 without any.
 * `cars` are { id, x, y, gone, firingHz }.
 */
export const fieldBedOf = (cars, listener, voiced = [], bed = AMB.fieldBed) => {
  const skip = new Set(voiced.filter(Boolean));
  let power = 0;
  let hzSum = 0;
  let count = 0;
  cars.forEach((car) => {
    if (car.gone || skip.has(car.id)) return;
    const metres = Math.hypot(car.x - listener.x, car.y - listener.y, listener.z || 0);
    if (metres > bed.nearbyMetres) return;
    power += distanceGain(metres) ** 2;
    if (Number.isFinite(car.firingHz) && car.firingHz > 0) {
      hzSum += car.firingHz;
      count += 1;
    }
  });
  const level = Math.min(bed.maxLevel, bed.gain * Math.sqrt(power));
  const hz = count ? clamp(hzSum / count, bed.minHz, bed.maxHz) : 0;
  return { level, hz, cars: count };
};

/**
 * Kerb rumble (kerbs-wind, AUD-C8): the bumps of the kerb pass under the wheel at v / stripeM Hz;
 * nothing slower than minKmh. `stripeM` is the kerb's own measured pitch (kerbs.json, extract_kerbs.py
 * v2); without it, audio.json ambience.kerb.stripeM.
 */
export const kerbRumble = (kmh, onKerb, kerb = AMB.kerb, stripeM = null) => {
  if (!onKerb || !(kmh >= kerb.minKmh)) return { gain: 0, hz: kerb.minHz };
  const pitch = Number.isFinite(stripeM) && stripeM > 0 ? stripeM : kerb.stripeM;
  return { gain: kerb.gain, hz: clamp(kmh / 3.6 / pitch, kerb.minHz, kerb.maxHz) };
};

/**
 * The start lights (start-lights-sound-and-timing, F1M24-GAMEPLAY §2.13): which lights to
 * sound this frame from the engine's `snapshot.start` ({ phase, lights, t }, §1.7, SIM-3).
 * `seen` is the light count already heard (null: nothing known yet). On the grid or the
 * formation lap the count is 0, so the first light sounds; the first sight of a sequence
 * already lit, a skip (`reset`) or the lights going out only set the count, silently.
 * Without a `start` nothing sounds and the count is forgotten. Returns { seen, hits }.
 */
export const startLightsStep = (seen, start, { reset = false } = {}, lights = AMB.startLights) => {
  if (!start || typeof start !== "object") return { seen: null, hits: [] };
  if (start.phase === "formation" || start.phase === "grid") return { seen: 0, hits: [] };
  const lit = clamp(Math.floor(Number(start.lights) || 0), 0, lights.maxLights);
  if (start.phase !== "lights" || reset || !Number.isFinite(seen)) return { seen: lit, hits: [] };
  const hits = [];
  for (let n = seen + 1; n <= lit; n += 1) hits.push(n);
  return { seen: lit, hits };
};

/** The grid-revs entry measured for `year` (ambience.gridRevs.byEra), or null. */
export const gridRevsFor = (year, revs = AMB.gridRevs) => revs.byEra.find((entry) => year >= entry.from && year <= entry.to) || null;

/**
 * rpm and load of a car standing on the grid (gridRevs): idle while `start.phase` is
 * "grid", then from light `fromLight` up to its hold rpm over `riseSec` (`sinceRise`, race
 * seconds since that light) and held until the lights go out. `pick` { idle, hold } in 0..1
 * places the car inside the measured ranges (seeded per car); an era without a measurement
 * uses its own idle and launch rpm (`spec`). Null outside the grid and lights phases.
 */
export const gridRevsOf = (spec, start, sinceRise, pick = { idle: 0.5, hold: 0.5 }, revs = AMB.gridRevs) => {
  if (!start || (start.phase !== "grid" && start.phase !== "lights")) return null;
  const entry = gridRevsFor(spec.year, revs);
  const shape = entry || revs.fallback;
  const within = ([lo, hi], share) => lo + (hi - lo) * clamp(share, 0, 1);
  const idle = entry ? within(entry.idleRpm, pick.idle) : spec.idleRpm;
  const hold = Math.min(spec.revLimit, entry ? within(entry.holdRpm, pick.hold) : spec.launchRpm);
  const lit = Number(start.lights) || 0;
  if (start.phase === "grid" || lit < revs.fromLight || !(sinceRise >= 0)) return { rpm: idle, load: 0 };
  const x = clamp(sinceRise / shape.riseSec, 0, 1);
  const eased = x * x * (3 - 2 * x);
  return { rpm: idle + (hold - idle) * eased, load: shape.holdLoad * eased };
};

/** The name of a pose's `pitStage`: the engine's string, or PIT-C2's `{ name, t, ... }` (null without one). */
export const pitStageName = (stage) => {
  if (!stage) return null;
  if (typeof stage === "string") return stage;
  return typeof stage === "object" ? stage.name || stage.stage || null : null;
};

/** Is a stop stage one where the air guns run? (the loop of before AUD-C7; a string or `{ name }`) */
export const airGunsOn = (stage) => {
  const name = pitStageName(stage);
  return Boolean(name) && AMB.pit.stages.includes(name);
};

// ------------------------------------------------------------ AUD-C7: the pit stop, by stages

const WHEELS = ["fl", "fr", "rl", "rr"];
/** The one-shots of a stop (engine/sim/pitStop.js stopEvents kinds). */
export const PIT_EVENT_KINDS = ["jackUp", "gunOff", "gunOn", "jackDown", "release"];

/**
 * AUD-C7 (F1M24-CHINA §2.7; RF-SIM-12, RF-3D-04): the one-shots a stop's stage implies, each with
 * its race time `at`, from the pose's `pitStage` at race time `tau`. The engine's clock places
 * them, never the view's frames:
 *  - PIT-C2's `{ name, t, start, duration }` (pitStop.js stageInfoAt; `t` the seconds since the
 *    stage began, `start` the stage's start after the car stopped): the stage began at `tau − t`;
 *    with the stop's `events` (pitStop.js stopEvents, on `pitStage.events` or `pose.pitEvents`) each
 *    one-shot sits at its own time after the stop began (`tau − t − start + event.t`); with the
 *    wheels' own times (`pitStage.wheels`, planStop's corners) each wheel has its two hits, gunOff at
 *    its start and gunOn at its end; otherwise the four wheels share the stage's start and end.
 *  - the engine's string stage of before (no `t`): the stage began now (one frame of error).
 * Returns [{ kind, wheel, at }]; empty without a stage. Pure.
 */
export const pitStageEvents = (stage, tau, pose = {}) => {
  const name = pitStageName(stage);
  if (!name || !Number.isFinite(tau)) return [];
  const info = typeof stage === "object" ? stage : null;
  const since = info && Number.isFinite(info.t) ? Math.max(0, info.t) : 0;
  const began = tau - since;
  const list = info && Array.isArray(info.events) ? info.events : pose && Array.isArray(pose.pitEvents) ? pose.pitEvents : null;
  if (list && info && Number.isFinite(info.start)) {
    const stopBegan = began - info.start;
    return list
      .filter((event) => event && PIT_EVENT_KINDS.includes(event.kind) && Number.isFinite(event.t))
      .map((event) => ({ kind: event.kind, wheel: event.wheel || null, at: stopBegan + event.t }));
  }
  const duration = info && Number.isFinite(info.duration) ? Math.max(0, info.duration) : null;
  if (name === "jackUp") return [{ kind: "jackUp", wheel: null, at: began }];
  if (name === "jackDown") return [{ kind: "jackDown", wheel: null, at: began }];
  if (name === "release") return [{ kind: "release", wheel: null, at: duration !== null ? began + duration : began }];
  if (name !== "wheels") return [];
  const base = info && Number.isFinite(info.start) ? info.start : null;
  const corners =
    info && Array.isArray(info.wheels) && base !== null
      ? info.wheels.filter((c) => c && Number.isFinite(c.start)).map((c) => ({ wheel: c.wheel, start: began + (c.start - base), duration: Number.isFinite(c.duration) ? c.duration : null }))
      : WHEELS.map((wheel) => ({ wheel, start: began, duration }));
  const out = [];
  corners.forEach((corner) => {
    out.push({ kind: "gunOff", wheel: corner.wheel, at: corner.start });
    if (corner.duration !== null) out.push({ kind: "gunOn", wheel: corner.wheel, at: corner.start + corner.duration });
  });
  return out;
};

/** The per-car memory of pitSoundStep. */
export const createPitSoundState = () => new Map();

/**
 * AUD-C7: the one-shots of car `carId` to play this frame (race time `tau`), each once per stop.
 * A stop opens with a stage (or the STATIONARY phase) and closes when both are gone. An event is
 * handed out as soon as it is at most `lookahead` race seconds ahead (so the caller can schedule
 * it on the audio clock to the millisecond) and dropped when it is more than `stale` race seconds
 * old (a skip, a seek). With the string stage of before, the guns tighten when the wheels stage
 * ends. Returns [{ kind, wheel, at }] sorted by time; mutates `memo`.
 */
export const pitSoundStep = (memo, carId, pose, tau, { lookahead = AMB.pit.events.lookaheadSec, stale = AMB.pit.events.staleSec } = {}) => {
  const stage = pose ? pose.pitStage : null;
  const name = pitStageName(stage);
  let m = memo.get(carId);
  if (!name && !(pose && pose.pitPhase === "STATIONARY")) {
    if (m) m.open = false;
    return [];
  }
  if (!m || !m.open) {
    m = { open: true, heard: new Set(), last: null };
    memo.set(carId, m);
  }
  const implied = pitStageEvents(stage, tau, pose);
  if (m.last === "wheels" && name !== "wheels") WHEELS.forEach((wheel) => implied.push({ kind: "gunOn", wheel, at: tau }));
  m.last = name;
  const out = [];
  implied.forEach((event) => {
    const key = `${event.kind}:${event.wheel || ""}`;
    if (m.heard.has(key) || event.at > tau + lookahead) return;
    m.heard.add(key);
    if (tau - event.at <= stale) out.push(event);
  });
  return out.sort((a, b) => a.at - b.at);
};

/**
 * Audio time of a race-time event: `now` plus the race seconds still to go over the playback
 * `speed` (race seconds per audio second), never before `now`.
 */
export const pitEventTime = (now, tau, at, speed = 1) => now + Math.max(0, (at - tau) / (Number.isFinite(speed) && speed > 0 ? speed : 1));

/**
 * AUD-C7 (F1M24-CHINA §2.7; RF-SIM-12): the pit phase the engine sound uses, with the limiter cut on
 * the `pitExitLine` event (pitLane.js pitExitLineEvents, line "limit", race time `exitAt`) instead of
 * on the snapshot the view is nearest to (up to half a step late). Within `window` race seconds of
 * the line: LIMITER past it becomes EXIT_ROAD, EXIT_ROAD before it stays LIMITER. Without the event,
 * the pose's own phase (as before).
 */
export const limiterPhaseOf = (pose, exitAt, tau, window = AMB.pit.events.exitWindowSec) => {
  const phase = pose ? pose.pitPhase : null;
  if (!Number.isFinite(exitAt) || !Number.isFinite(tau)) return phase;
  if (phase === "LIMITER" && tau >= exitAt && tau - exitAt <= window) return "EXIT_ROAD";
  if (phase === "EXIT_ROAD" && tau < exitAt && exitAt - tau <= window) return "LIMITER";
  return phase;
};

/** The engine's level standing in the box (pit.idleDb): the stationary and queueing phases. */
export const idleGainOf = (pose, pit = AMB.pit) => (pose && (pose.pitPhase === "STATIONARY" || pose.pitPhase === "QUEUE") && Number.isFinite(pit.idleDb) ? 10 ** (pit.idleDb / 20) : 1);

// ------------------------------------------------------------ AUD-C5: rain, drops and spray

const RAIN_STATES = Object.fromEntries((weatherData.states?.list || []).map((s) => [s.id, s.rainMmPerHour]));

/** The rain rate (mm/h) of the engine's `snapshot.weather` ({ rainRate } or the rate of its `state`); null without one. */
export const rainRateOf = (weather) => {
  if (!weather || typeof weather !== "object") return null;
  if (Number.isFinite(weather.rainRate)) return Math.max(0, weather.rainRate);
  if (Number.isFinite(weather.rainMmPerHour)) return Math.max(0, weather.rainMmPerHour);
  return weather.state in RAIN_STATES ? RAIN_STATES[weather.state] : null;
};

/** The water on the racing line (mm) of `snapshot.weather` ({ waterMm: { line } } or a number); null without it. */
export const lineWaterOf = (weather) => {
  if (!weather || typeof weather !== "object") return null;
  const w = weather.waterMm;
  if (Number.isFinite(w)) return Math.max(0, w);
  return w && Number.isFinite(w.line) ? Math.max(0, w.line) : null;
};

/**
 * AUD-C5: the level of the falling rain (`drops`, 0..1 times drops.gain), from the engine's rain
 * rate: only what falls, never the water left on the track (a drying track has spray, no drops).
 * The square root of the rate over the heaviest state's (race-weather.json states). Without a
 * `weather` from the engine, the old reading of the wetness (rainOf).
 */
export const dropsOf = (weather, wetness = 0, rain = AMB.rain) => {
  const rate = rainRateOf(weather);
  if (rate === null) return rainOf(wetness, rain) * (rain.drops.gain / rain.gain);
  if (!(rate > 0)) return 0;
  return rain.drops.gain * Math.sqrt(clamp(rate / rain.drops.fullMmPerHour, 0, 1));
};

/**
 * AUD-C5: the spray car `index` throws, 0..1, as the engine publishes it (`car.spray`, `pose.spray`,
 * the frame's `spray[]` by index or `{ id: level }`; §1.5 «Spray»), else the engine's own level of
 * the water on the line (engine/weather sprayLevelOf, read, not recomputed), else 0.
 */
export const sprayLevelFor = ({ car = null, index = -1, spray = null, weather = null, year } = {}) => {
  const own = car && (Number.isFinite(car.spray) ? car.spray : car.pose && Number.isFinite(car.pose.spray) ? car.pose.spray : null);
  if (own !== null && own !== undefined) return clamp(own, 0, 1);
  if (Array.isArray(spray) && Number.isFinite(spray[index])) return clamp(spray[index], 0, 1);
  if (spray && typeof spray === "object" && car && Number.isFinite(spray[car.id])) return clamp(spray[car.id], 0, 1);
  const h = lineWaterOf(weather);
  return h !== null && h > 0 ? sprayLevelOf(h, year) : 0;
};

/**
 * AUD-C5: the hiss of a car's spray in its own voice - level × speed (the water a tyre clears goes
 * with h × v, race-weather.json spray.sprayAt) × gain, the colour of its compound (spray.byCompound;
 * a car on slicks or unknown takes `default`). Nothing slower than minKmh. Returns { gain, hz, q }.
 */
export const sprayVoiceOf = (level, kmh, compound = null, spray = AMB.rain.spray) => {
  const tone = (compound && spray.byCompound[compound]) || spray.byCompound.default;
  if (!(level > 0) || !(kmh >= spray.minKmh)) return { gain: 0, hz: tone.hz, q: tone.q };
  return { gain: spray.gain * tone.gain * clamp(level, 0, 1) * clamp(kmh / spray.fullKmh, 0, 1), hz: tone.hz, q: tone.q };
};

/** The camera's rain shares (mixer.cameras.mix.*.rain): { drops, spray, lowpassHz }; a mix without them, the defaults. */
export const rainShareOf = (mix, rain = AMB.rain) => {
  const share = mix && mix.rain && typeof mix.rain === "object" ? mix.rain : null;
  return {
    drops: share && Number.isFinite(share.drops) ? share.drops : 1,
    spray: share && Number.isFinite(share.spray) ? share.spray : 1,
    lowpassHz: share && Number.isFinite(share.lowpassHz) ? share.lowpassHz : rain.drops.lowpassHz,
  };
};

/**
 * AUD-C5: the drop grains of one frame (`dt` audio seconds) at drops `level` (0..drops.gain), each
 * drawn from the seeded stream `random` (RF-SIM-15, RNF-05; never an unseeded draw): Poisson by the
 * fractional part, at most grains.maxPerFrame. Each: { delay (s into the frame), offset (s into the
 * noise buffer), durationSec, gain }.
 */
export const dropGrains = (random, level, dt, rain = AMB.rain) => {
  const g = rain.drops.grains;
  if (!(level > 0) || !(dt > 0)) return [];
  const expected = g.perSecAtFull * (level / rain.drops.gain) * dt;
  const count = Math.min(g.maxPerFrame, Math.floor(expected + random()));
  const out = [];
  for (let k = 0; k < count; k += 1) {
    out.push({
      delay: random() * dt,
      offset: random() * g.bufferSec,
      durationSec: g.durationSec[0] + random() * (g.durationSec[1] - g.durationSec[0]),
      gain: g.gain * (0.4 + 0.6 * random()),
    });
  }
  return out;
};

/**
 * RBJ biquad magnitude squared at `f` Hz (Audio EQ Cookbook; the formulas the Web Audio BiquadFilterNode
 * uses): lowpass, highpass, bandpass (constant 0 dB peak), highshelf (gainDb, S = 1). For the offline
 * rain model (no Web Audio): only the relations of levels mean anything.
 */
export const biquadPower = (type, f0, q, f, fs, gainDb = 0) => {
  const w0 = (2 * Math.PI * f0) / fs;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  let b0;
  let b1;
  let b2;
  let a0;
  let a1;
  let a2;
  if (type === "highshelf") {
    const A = 10 ** (gainDb / 40);
    const alpha = (sin / 2) * Math.sqrt(2);
    const s = 2 * Math.sqrt(A) * alpha;
    b0 = A * (A + 1 + (A - 1) * cos + s);
    b1 = -2 * A * (A - 1 + (A + 1) * cos);
    b2 = A * (A + 1 + (A - 1) * cos - s);
    a0 = A + 1 - (A - 1) * cos + s;
    a1 = 2 * (A - 1 - (A + 1) * cos);
    a2 = A + 1 - (A - 1) * cos - s;
  } else {
    const alpha = sin / (2 * q);
    a0 = 1 + alpha;
    a1 = -2 * cos;
    a2 = 1 - alpha;
    if (type === "lowpass") [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
    else if (type === "highpass") [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha];
  }
  const w = (2 * Math.PI * f) / fs;
  const re = (c0, c1, c2) => c0 + c1 * Math.cos(w) + c2 * Math.cos(2 * w);
  const im = (c1, c2) => -(c1 * Math.sin(w) + c2 * Math.sin(2 * w));
  const num = re(b0, b1, b2) ** 2 + im(b1, b2) ** 2;
  const den = re(a0, a1, a2) ** 2 + im(a1, a2) ** 2;
  return num / den;
};

/** The filters of the drops chain (createAmbience) for a camera's halo low-pass. */
export const dropsFilters = (lowpassHz, rain = AMB.rain) => {
  const d = rain.drops;
  return [
    { type: "highpass", hz: d.bandHz[0], q: d.q },
    { type: "lowpass", hz: d.bandHz[1], q: d.q },
    { type: "highshelf", hz: d.tilt.hz, q: 0.7, gainDb: d.tilt.db },
    { type: "lowpass", hz: lowpassHz, q: 0.7 },
  ];
};

/** The filter of one car's spray voice. */
export const sprayFilters = (tone) => [{ type: "bandpass", hz: tone.hz, q: tone.q }];

/**
 * The offline power spectrum of white noise of unit RMS through `filters`, on a log grid
 * (`bins` points from 20 Hz to Nyquist): [{ f, p, df }], normalised so Σ p·df = 1.
 */
export const filteredSpectrum = (filters, fs = 48000, bins = 400) => {
  const lo = Math.log(20);
  const hi = Math.log(fs / 2 - 1);
  const out = [];
  let total = 0;
  for (let k = 0; k < bins; k += 1) {
    const f = Math.exp(lo + ((k + 0.5) * (hi - lo)) / bins);
    const df = f * ((hi - lo) / bins);
    const p = filters.reduce((acc, flt) => acc * biquadPower(flt.type, flt.hz, flt.q, f, fs, flt.gainDb || 0), 1);
    out.push({ f, p, df });
    total += p * df;
  }
  return out.map((bin) => ({ ...bin, p: total > 0 ? bin.p / total : 0 }));
};

/** Share of a spectrum's power between `from` and `to` Hz. */
export const bandShare = (spectrum, from, to) => spectrum.reduce((acc, bin) => acc + (bin.f >= from && bin.f < to ? bin.p * bin.df : 0), 0);

/** Spectral centroid (Hz) of a sum of layers [{ spectrum, power }]. */
export const centroidOf = (layers) => {
  let num = 0;
  let den = 0;
  layers.forEach(({ spectrum, power }) =>
    spectrum.forEach((bin) => {
      num += bin.f * bin.p * bin.df * power;
      den += bin.p * bin.df * power;
    }),
  );
  return den > 0 ? num / den : 0;
};

/** Does an engine incident squeal the tyres? */
export const squeals = (incident) => Boolean(incident) && AMB.squeal.kinds.includes(incident);

/**
 * AUD-C5: one car's spray, a looped read of the shared noise through its compound's band-pass into
 * `out` (the car's panner: distance and side as its engine). Doppler moves the read rate and the
 * band (the PannerNode does no Doppler). `update({ gain, hz, q, doppler, time })`; `silence(time)`.
 */
export const createSprayVoice = (ctx, noise, out, index = 0) => {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = AMB.rain.spray.byCompound.default.hz;
  band.Q.value = AMB.rain.spray.byCompound.default.q;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(band).connect(gain).connect(out);
  // Each voice reads the buffer from its own place so two cars never hiss in phase.
  const length = Number.isFinite(noise && noise.duration) && noise.duration > 0 ? noise.duration : 2;
  src.start(0, (index * 0.173) % length);
  const set = (param, value, at, tc) => param.setTargetAtTime(value, at, tc);
  // A dry track costs nothing: a voice already silent is not touched again (22 cars × 60 Hz, RNF-02).
  let quiet = true;
  return {
    update({ gain: level = 0, hz, q, doppler = 1, time }) {
      if (!(level > 0)) {
        if (!quiet) set(gain.gain, 0, time, AMB.rain.spray.smoothingSec);
        quiet = true;
        return;
      }
      quiet = false;
      const d = Number.isFinite(doppler) && doppler > 0 ? doppler : 1;
      set(gain.gain, level, time, AMB.rain.spray.smoothingSec);
      if (Number.isFinite(hz)) set(band.frequency, hz * d, time, 0.05);
      if (Number.isFinite(q)) set(band.Q, q, time, 0.05);
      if (src.playbackRate) set(src.playbackRate, d, time, 0.05);
    },
    silence(time) {
      if (!quiet) set(gain.gain, 0, time, AMB.rain.spray.smoothingSec);
      quiet = true;
    },
    stop() {
      try {
        src.stop();
      } catch (error) {
        /* already stopped */
      }
    },
  };
};

/** A mono noise buffer from a seeded stream (RF-SIM-15: never unseeded). */
export const makeNoiseBuffer = (ctx, random, seconds = 2) => {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = random() * 2 - 1;
  return buffer;
};

/**
 * The ambience graph on `bus`: crowd, wind and rain beds always running (gain-driven),
 * the air guns as a gated loop, and one-shot squeal and impact voices.
 */
export const createAmbience = (ctx, bus, noise, engineBus = bus) => {
  const loop = (type, hz, q) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(bus);
    src.start();
    return { src, filter, gain };
  };
  /**
   * A stereo bed (AUD-C4): the shared noise read at two offsets `decorrelateSec` apart, each
   * through its own filters (`chain()` builds them), into the left and the right channel of a
   * merger. Without a merger (an old browser, a mock) both reads sum on one gain: mono.
   */
  const duration = Number.isFinite(noise && noise.duration) && noise.duration > 0 ? noise.duration : 2;
  const stereoLoop = (chain, decorrelateSec) => {
    const merger = typeof ctx.createChannelMerger === "function" ? ctx.createChannelMerger(2) : null;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const sources = [0, 1].map((channel) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const last = chain().reduce((from, node) => from.connect(node), src);
      if (merger) last.connect(merger, 0, channel);
      else last.connect(gain);
      src.start(0, (channel * (decorrelateSec || 0)) % duration);
      return src;
    });
    if (merger) merger.connect(gain);
    gain.connect(bus);
    return { sources, gain };
  };
  const biquad = (type, hz, q) => {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    filter.Q.value = q;
    return filter;
  };
  // The crowd, decorrelated left and right (AUD-C4): before, a mono band-pass.
  const crowd = stereoLoop(() => [biquad("bandpass", AMB.crowd.bandHz, AMB.crowd.q)], AMB.crowd.decorrelateSec);
  // The track bed (AUD-C4): always there in TV, helicopter and chase, -6 dB/octave over lowpassHz.
  const TRACK = AMB.trackBed;
  const trackBed = TRACK
    ? stereoLoop(() => {
        const high = biquad("highpass", TRACK.highpassHz, 0.7);
        let low;
        try {
          const { feedforward, feedback } = onePoleLowpass(TRACK.lowpassHz, ctx.sampleRate);
          low = typeof ctx.createIIRFilter === "function" ? ctx.createIIRFilter(feedforward, feedback) : null;
        } catch (error) {
          low = null;
        }
        return [high, low || biquad("lowpass", TRACK.lowpassHz, 0.5)];
      }, TRACK.decorrelateSec)
    : null;
  // A slow LFO keeps the crowd breathing.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = AMB.crowd.lfoHz;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0;
  lfo.connect(lfoDepth).connect(crowd.gain.gain);
  lfo.start();
  const wind = loop("lowpass", AMB.wind.lowHz, 0.5);
  // AUD-C5: the drops - the noise and its grains through 1-8 kHz, a tilt down towards pink and the
  // camera's halo low-pass (before: a 4.5 kHz high-pass that sat over the engines).
  const DROPS = AMB.rain.drops;
  const dropsChain = dropsFilters(DROPS.lowpassHz).map((spec) => {
    const filter = biquad(spec.type, spec.hz, spec.q);
    if (spec.type === "highshelf" && filter.gain) filter.gain.value = spec.gainDb;
    return filter;
  });
  dropsChain.reduce((from, node) => from.connect(node));
  const halo = dropsChain[dropsChain.length - 1];
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  halo.connect(rainGain).connect(bus);
  const rainSrc = ctx.createBufferSource();
  rainSrc.buffer = noise;
  rainSrc.loop = true;
  const rainBed = ctx.createGain();
  rainBed.gain.value = DROPS.bedShare;
  rainSrc.connect(rainBed).connect(dropsChain[0]);
  rainSrc.start();
  const rain = { src: rainSrc, gain: rainGain, filter: halo };
  // One drop: a few milliseconds of the noise into the drops chain (the grains' level rides on rainGain).
  const dropGrain = (at, grain) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(grain.gain, at + Math.min(0.002, grain.durationSec / 3));
    env.gain.exponentialRampToValueAtTime(0.0001, at + grain.durationSec);
    src.connect(env).connect(dropsChain[0]);
    src.start(at, grain.offset % duration);
    src.stop(at + grain.durationSec + 0.02);
  };
  const guns = loop("bandpass", AMB.pit.airGunBandHz, 3);
  // The rattle: a square LFO gates the gun noise at airGunHz.
  const rattle = ctx.createOscillator();
  rattle.type = "square";
  rattle.frequency.value = AMB.pit.airGunHz;
  const rattleDepth = ctx.createGain();
  rattleDepth.gain.value = 0;
  rattle.connect(rattleDepth).connect(guns.gain.gain);
  rattle.start();

  // The field bed: band-passed noise, some of it straight and the rest through two or three
  // detuned combs (a delay of one period fed back), on the engine bus. Without DelayNode
  // (an old browser) only the noise sounds.
  const BED = AMB.fieldBed;
  const bedSrc = ctx.createBufferSource();
  bedSrc.buffer = noise;
  bedSrc.loop = true;
  const bedBand = ctx.createBiquadFilter();
  bedBand.type = "bandpass";
  bedBand.frequency.value = BED.bandHz;
  bedBand.Q.value = BED.q;
  const bedGain = ctx.createGain();
  bedGain.gain.value = 0;
  bedSrc.connect(bedBand);
  const bedDry = ctx.createGain();
  bedDry.gain.value = BED.noiseShare;
  bedBand.connect(bedDry).connect(bedGain);
  const combs = typeof ctx.createDelay === "function"
    ? BED.combs.map((comb) => {
        const delay = ctx.createDelay(1 / BED.minHz);
        delay.delayTime.value = 1 / BED.maxHz;
        const feedback = ctx.createGain();
        feedback.gain.value = comb.feedback;
        const out = ctx.createGain();
        out.gain.value = (1 - BED.noiseShare) / BED.combs.length;
        bedBand.connect(delay);
        delay.connect(feedback).connect(delay);
        delay.connect(out).connect(bedGain);
        return { delay, ratio: comb.ratio };
      })
    : [];
  bedGain.connect(engineBus);
  bedSrc.start();

  // The kerb rumble: a square wave at v / stripeM through a low-pass, gated by its gain.
  const KERB = AMB.kerb;
  const kerbOsc = ctx.createOscillator();
  kerbOsc.type = "square";
  kerbOsc.frequency.value = KERB.minHz;
  const kerbFilter = ctx.createBiquadFilter();
  kerbFilter.type = "lowpass";
  kerbFilter.frequency.value = KERB.lowpassHz;
  const kerbGain = ctx.createGain();
  kerbGain.gain.value = 0;
  kerbOsc.connect(kerbFilter).connect(kerbGain).connect(engineBus);
  kerbOsc.start();

  const set = (param, value, at, tc = 0.08) => param.setTargetAtTime(value, at, tc);

  const squeal = (at, gain) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = AMB.squeal.hz;
    const vib = ctx.createOscillator();
    vib.frequency.value = AMB.squeal.vibratoHz;
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = AMB.squeal.hz * 0.04;
    vib.connect(vibDepth).connect(osc.frequency);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = AMB.squeal.hz * 1.5;
    filter.Q.value = 2;
    const env = ctx.createGain();
    const end = at + AMB.squeal.durationSec;
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(AMB.squeal.gain * gain, at + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(filter).connect(env).connect(bus);
    osc.start(at);
    vib.start(at);
    osc.stop(end + 0.05);
    vib.stop(end + 0.05);
  };

  const impact = (at, gain) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = AMB.impact.lowHz * 4;
    const thump = ctx.createOscillator();
    thump.frequency.setValueAtTime(AMB.impact.lowHz, at);
    thump.frequency.exponentialRampToValueAtTime(AMB.impact.lowHz * 0.4, at + AMB.impact.durationSec);
    const env = ctx.createGain();
    const end = at + AMB.impact.durationSec;
    env.gain.setValueAtTime(AMB.impact.gain * gain, at);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    src.connect(filter).connect(env);
    thump.connect(env);
    env.connect(bus);
    src.start(at);
    thump.start(at);
    src.stop(end + 0.05);
    thump.stop(end + 0.05);
  };

  // One start light: a low thump falling in pitch and a short tone (startLights, own design).
  const LIGHTS = AMB.startLights;
  const startLight = (at, gain = 1) => {
    const voices = [];
    const shot = (hz, endHz, attackSec, durationSec, peak) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(hz, at);
      if (endHz !== hz) osc.frequency.exponentialRampToValueAtTime(endHz, at + durationSec);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(peak, at + attackSec);
      env.gain.exponentialRampToValueAtTime(0.0001, at + durationSec);
      osc.connect(env).connect(bus);
      osc.start(at);
      osc.stop(at + durationSec + 0.05);
      voices.push(osc);
    };
    const { thump, tone } = LIGHTS;
    shot(thump.hz, thump.endHz, thump.attackSec, thump.durationSec, thump.gain * gain);
    tone.partials.forEach((partial) => shot(tone.hz * partial.ratio, tone.hz * partial.ratio, tone.attackSec, tone.durationSec, tone.gain * partial.gain * gain));
    return voices.length;
  };

  /**
   * AUD-C7: one pit one-shot (pit.events): the guns as band-passed noise hammered at rattleHz
   * (undo, then the higher, shorter tighten), the jacks and the release as a low thump.
   */
  const PIT_SHOTS = AMB.pit.events;
  const pitShot = (kind, at, gain = 1) => {
    const shot = PIT_SHOTS.shots[kind];
    if (!shot || !(gain > 0)) return 0;
    const end = at + shot.durationSec;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(shot.gain * gain, at + shot.attackSec);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(bus);
    if (shot.type === "gun") {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const band = biquad("bandpass", shot.hz, shot.q);
      const hammer = ctx.createGain();
      hammer.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.type = "square";
      lfo.frequency.value = shot.rattleHz;
      const depth = ctx.createGain();
      depth.gain.value = 0.5;
      lfo.connect(depth).connect(hammer.gain);
      src.connect(band).connect(hammer).connect(env);
      src.start(at, (at * 7.3) % duration);
      lfo.start(at);
      src.stop(end + 0.05);
      lfo.stop(end + 0.05);
      return 1;
    }
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(shot.hz, at);
    if (shot.endHz && shot.endHz !== shot.hz) osc.frequency.exponentialRampToValueAtTime(shot.endHz, end);
    osc.connect(env);
    osc.start(at);
    osc.stop(end + 0.05);
    return 1;
  };

  return {
    /**
     * `frame`: { time, crowd (0..1), crowdShare, wind {gain, hz}, rain, guns (0..1) } and,
     * optional, bed { level, hz } (the field bed), kerb { gain, hz } (the rumble) and
     * trackBed (the stereo track bed's level, trackBedOf; absent, silent). AUD-C5: `drops`
     * { gain, lowpassHz, grains[] } in place of `rain` (a bare `rain` is the drops' gain).
     */
    update(frame) {
      const at = frame.time;
      const bed = frame.bed || { level: 0, hz: 0 };
      set(bedGain.gain, bed.level, at, BED.smoothingSec);
      if (bed.hz > 0) combs.forEach((comb) => set(comb.delay.delayTime, 1 / clamp(bed.hz * comb.ratio, BED.minHz, BED.maxHz), at, BED.smoothingSec));
      const kerb = frame.kerb || { gain: 0, hz: KERB.minHz };
      set(kerbGain.gain, kerb.gain, at, 0.03);
      set(kerbOsc.frequency, kerb.hz, at, 0.05);
      const level = frame.crowd * frame.crowdShare;
      set(crowd.gain.gain, level, at, 0.15);
      set(lfoDepth.gain, level * AMB.crowd.lfoDepth, at, 0.3);
      if (trackBed) set(trackBed.gain.gain, Number.isFinite(frame.trackBed) ? frame.trackBed : 0, at, 0.3);
      set(wind.gain.gain, frame.wind.gain, at);
      set(wind.filter.frequency, frame.wind.hz, at);
      const drops = frame.drops && typeof frame.drops === "object" ? frame.drops : { gain: Number.isFinite(frame.rain) ? frame.rain : 0 };
      set(rain.gain.gain, drops.gain || 0, at, DROPS.smoothingSec);
      if (Number.isFinite(drops.lowpassHz)) set(rain.filter.frequency, drops.lowpassHz, at, 0.1);
      (drops.grains || []).forEach((grain) => dropGrain(at + grain.delay, grain));
      const gun = AMB.pit.airGunGain * frame.guns;
      set(guns.gain.gain, gun / 2, at, 0.02);
      set(rattleDepth.gain, gun / 2, at, 0.02);
    },
    squeal,
    impact,
    startLight,
    pitShot,
    stop() {
      [...crowd.sources, ...(trackBed ? trackBed.sources : []), wind.src, rain.src, guns.src, lfo, rattle, bedSrc, kerbOsc].forEach((node) => {
        try {
          node.stop();
        } catch (error) {
          /* already stopped */
        }
      });
    },
  };
};
