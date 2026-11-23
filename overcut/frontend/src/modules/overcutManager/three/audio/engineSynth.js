/**
 * Engine sound, synthesised (RF-3D-04 live view; RNF-02 cost): no recordings, our own
 * Web Audio graph per car.
 *
 * The car's engine comes from f1db through the season pack (`teams[].engines[]`:
 * "3.0 V10", "1.5 V6 turbo", "1.6 V6 turbo hybrid", "3.0 F12"...), so a 1990 grid mixes
 * V8s, V10s and V12s as it really did, and the 2006 Toro Rosso runs its restricted V10.
 * Rev limits, gearboxes and the hybrid parts per era are data (data/balance/audio.json,
 * RNF-07; every figure with its source or marked NV). Coherence per era (SRS 6.2):
 * turbo whine only on turbo engines, KERS/MGU-K only in the years that had them, the
 * MGU-H only in 2014-2025.
 *
 * The maths, pure and tested (audio.test.js):
 *   firing frequency  f = rpm / 60 × cylinders / 2  (a four-stroke fires every cylinder once per two turns)
 *   cycle frequency   rpm / 120, the base of the wave: harmonic `cylinders` is the firing note
 *   gear and rpm      from speed through the era's gearbox when the snapshot has no
 *                     rpm/gear yet (`pose.rpm` / `pose.gear` win when present)
 *
 * The voice (Web Audio, only in the browser after a click):
 *   oscillator(PeriodicWave per cylinder count) ─┐
 *   noise ► band-pass at the exhaust order ──────┼─► low-pass (load) ► cut (shift, limiter) ► out
 *   noise ► band-pass at the intake order ───────┤
 *   turbo / MGU-K / MGU-H tones (their era) ─────┘
 */

import audioData from "../../data/balance/audio.json";

const VOICING = audioData.voicing;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
const KMH = 3.6;

/** The era record for a season (audio.json eras[]): the one whose years hold it, else the nearest. */
export const eraFor = (year, eras = audioData.eras) => {
  const hit = eras.find((era) => year >= era.from && year <= era.to);
  if (hit) return hit;
  return year < eras[0].from ? eras[0] : eras[eras.length - 1];
};

/**
 * "3.0 V10", "1.5 L4 turbo", "1.6 V6 turbo hybrid", "3.5 W12" (f1db engine formula, as
 * the season pack carries it) to { litres, layout, cylinders, aspiration }.
 */
export const parseFormula = (formula = "") => {
  const match = /(\d+(?:\.\d+)?)\s*([VFWL])(\d+)/i.exec(String(formula));
  if (!match) return null;
  const text = String(formula).toLowerCase();
  const aspiration = text.includes("hybrid") ? "hybrid" : text.includes("turbo") ? "turbo" : "na";
  return { litres: Number(match[1]), layout: match[2].toUpperCase(), cylinders: Number(match[3]), aspiration };
};

/** What the era's engines usually were, when the car has no pack engine (fallback). */
const ERA_DEFAULT_FORMULA = (era) => {
  if (era.electric && era.turbo) return "1.6 V6 turbo hybrid";
  if (era.turbo) return "1.5 V6 turbo";
  if (era.from >= 2006) return "2.4 V8";
  if (era.from >= 1995) return "3.0 V10";
  if (era.from >= 1989) return "3.5 V10";
  return "3.0 V8";
};

const matches = (rule, engine) =>
  Object.entries(rule.match || {}).every(([key, value]) => {
    if (key === "aspiration") return value === "turbo" ? engine.aspiration !== "na" : engine.aspiration === value;
    return engine[key] === value;
  });

/** Linear interpolation over { year: rpm } anchors, held flat outside them. */
export const rpmByYear = (anchors, year) => {
  const points = Object.entries(anchors)
    .map(([key, value]) => [Number(key), value])
    .sort((a, b) => a[0] - b[0]);
  if (year <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i += 1) {
    if (year <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      return Math.round(y0 + ((y1 - y0) * (year - x0)) / (x1 - x0));
    }
  }
  return points[points.length - 1][1];
};

/**
 * Everything the synth needs for one car: era, engine (from the pack's f1db formula and
 * id), rev limit and shift point for that year, gearbox, voicing, hybrid parts.
 */
export const engineSpecFor = (year, engine = null) => {
  const era = eraFor(year);
  const parsed = parseFormula(engine?.formula) || parseFormula(ERA_DEFAULT_FORMULA(era));
  const facts = { ...parsed, engineId: engine?.id || null };
  const rule = era.engines.find((candidate) => matches(candidate, facts)) || era.engines[era.engines.length - 1];
  const revLimit = rule.revLimitByYear ? rpmByYear(rule.revLimitByYear, year) : rule.revLimit;
  const shiftRpm = rule.revLimitByYear ? Math.round(revLimit * rule.shiftShare) : rule.shiftRpm;
  const voice = VOICING.byCylinders[String(facts.cylinders)] || VOICING.byCylinders["10"];
  const charged = facts.aspiration !== "na";
  return {
    year,
    era: era.id,
    engine: facts,
    revLimit,
    shiftRpm,
    idleRpm: era.idleRpm,
    launchRpm: Math.min(era.launchRpm, shiftRpm),
    gears: era.gears,
    gearShares: era.gearShares,
    gearingPerTrack: era.gearingPerTrack,
    refTopKmh: era.refTopKmh,
    shiftCutMs: era.shiftCutMs,
    // A turbo only on a charged engine (1988 had atmospheric DFZs beside the turbos).
    turbo: charged ? era.turbo : null,
    electric: era.electric,
    crackle: era.crackle,
    voice,
    halfOrder: voice.halfOrder * (VOICING.layoutHalfOrder[facts.layout] ?? 1),
    source: rule.source,
  };
};

/** Firing frequency in Hz: rpm / 60 × cylinders / 2 (four-stroke). */
export const firingFrequency = (rpm, cylinders) => (rpm / 60) * (cylinders / 2);

/** Base of the periodic wave (one four-stroke cycle, two turns): rpm / 120. */
export const cycleFrequency = (rpm) => rpm / 120;

/**
 * Harmonic amplitudes over the cycle frequency (index 0 is DC). Harmonic `c` (the
 * cylinder count) is the firing note, its multiples the overtones, harmonic c/2 the
 * half order, and a small seeded "roughness" on the rest (cylinder-to-cylinder spread).
 */
export const harmonicWeights = (cylinders, voice, halfOrder, maxHarmonics = VOICING.maxHarmonics, random = null) => {
  const size = Math.min(maxHarmonics, cylinders * voice.overtones.length) + 1;
  const weights = new Float32Array(size);
  voice.overtones.forEach((amp, k) => {
    const index = cylinders * (k + 1);
    if (index < size) weights[index] = amp;
  });
  const half = Math.round(cylinders / 2);
  if (half > 0 && half < size) weights[half] += halfOrder;
  for (let n = 1; n < size; n += 1) {
    if (weights[n] === 0) weights[n] = voice.roughness * (random ? 0.4 + 0.6 * random() : 0.7) / Math.sqrt(n);
  }
  return weights;
};

/** Top speed (km/h) of each gear at the shift point. `topKmh` is where the last gear meets it. */
export const gearSpeeds = (spec, topKmh = spec.refTopKmh) => spec.gearShares.map((share) => share * topKmh);

/** rpm in `gear` (1-based) at `kmh`, before the limiter: shift rpm at that gear's top. */
export const rpmInGear = (spec, gear, kmh, topKmh) => (spec.shiftRpm * kmh) / gearSpeeds(spec, topKmh)[gear - 1];

/**
 * The gearbox: gear and rpm from speed, with the gear held between calls (so it shifts up
 * at the shift rpm and down when the rpm falls under `downshiftShare` of it in the lower
 * gear). Clutch slip at a launch, the limiter in top gear past its speed.
 * Returns { gear, rpm, limiter, shifted }.
 */
export const nextGear = (spec, previousGear, kmh, topKmh = spec.refTopKmh, accelerating = true) => {
  const speeds = gearSpeeds(spec, topKmh);
  let gear = clamp(previousGear || 1, 1, spec.gears);
  // Up while past the shift point of this gear.
  while (gear < spec.gears && kmh >= speeds[gear - 1]) gear += 1;
  // Down while the lower gear would still be under its downshift point.
  while (gear > 1 && kmh < speeds[gear - 2] * VOICING.downshiftShare) gear -= 1;
  let rpm = (spec.shiftRpm * kmh) / speeds[gear - 1];
  // Pulling away: the clutch holds the engine near the launch rpm.
  if (gear === 1 && kmh < speeds[0] * VOICING.launchShare && accelerating) rpm = Math.max(rpm, spec.launchRpm);
  rpm = Math.max(rpm, spec.idleRpm);
  const limiter = rpm >= spec.revLimit;
  rpm = Math.min(rpm, spec.revLimit);
  return { gear, rpm, limiter, shifted: gear !== previousGear && Boolean(previousGear) };
};

/** Throttle load 0..1 from the longitudinal acceleration (m/s²): coasting/braking is overrun. */
export const loadFromAccel = (accel) => {
  const { offAccel, onAccel } = VOICING.load;
  return clamp((accel - offAccel) / (onAccel - offAccel), 0, 1);
};

/** Turbo shaft speed share 0..1 (lags the throttle; spools with rpm and load). */
export const turboTarget = (rpmShare, load) => clamp(rpmShare ** 1.5 * (0.35 + 0.65 * load), 0, 1);

/** Hz of the hybrid tones: MGU-K geared to the crank, turbo/MGU-H at the shaft speed. */
export const hybridTones = (spec, rpm, turboShare) => ({
  turboHz: spec.turbo ? (spec.turbo.maxShaftRpm * turboShare) / 60 : 0,
  electricHz: spec.electric ? (rpm * spec.electric.crankRatio) / 60 : 0,
});

/**
 * Pure per-car drive state, advanced once per view update: speed from the snapshot
 * (`pose.v`, m/s) or from position over race time, then gear, rpm, load, limiter, a shift
 * event, the turbo spool. `pose.rpm` / `pose.gear` (a powertrain in the engine) win.
 * `state` is mutated and returned; `dtau` race seconds, `dt` real seconds.
 */
export const driveStep = (spec, state, pose, dtau, dt) => {
  const s = state || { gear: 1, rpm: spec.idleRpm, v: 0, load: 0, turbo: 0, topKmh: spec.refTopKmh, x: null, y: null, shiftAt: -1 };
  let v = Number.isFinite(pose.v) ? pose.v : null;
  if (v === null && s.x !== null && dtau > 0 && dtau < 2) v = Math.hypot(pose.x - s.x, pose.y - s.y) / dtau;
  if (v === null) v = s.v;
  const accel = dtau > 0 && dtau < 2 ? (v - s.v) / dtau : 0;
  s.x = pose.x;
  s.y = pose.y;
  const kmh = v * KMH;
  // Before 2014 the ratios were chosen per circuit: the top gear meets the shift point at the track's top speed.
  if (spec.gearingPerTrack && kmh > s.topKmh * 0.92) s.topKmh = Math.max(s.topKmh * 0.7, kmh / 0.97);
  const load = s.v === 0 && v === 0 ? 0 : loadFromAccel(accel);
  let drive;
  if (Number.isFinite(pose.rpm) && Number.isFinite(pose.gear)) {
    drive = { gear: pose.gear, rpm: Math.min(pose.rpm, spec.revLimit), limiter: pose.rpm >= spec.revLimit, shifted: pose.gear !== s.gear };
  } else if (pose.pitPhase === "LIMITER" || pose.pitPhase === "ENTRY_ROAD" || pose.pitPhase === "EXIT_ROAD") {
    // The pit limiter holds the car in a low gear and bounces the engine at that rpm.
    const gear = Math.min(VOICING.pitLimiterGear, spec.gears);
    const rpm = clamp(rpmInGear(spec, gear, kmh, s.topKmh), spec.idleRpm, spec.revLimit);
    drive = { gear, rpm, limiter: pose.pitPhase === "LIMITER", shifted: gear !== s.gear };
  } else if (v < 0.3 && (pose.pitPhase === "STATIONARY" || pose.pitPhase === "QUEUE" || pose.parked)) {
    drive = { gear: 1, rpm: spec.idleRpm, limiter: false, shifted: false };
  } else {
    drive = nextGear(spec, s.gear, kmh, s.topKmh, accel >= 0);
  }
  if (drive.shifted) s.shiftAt = 0;
  else if (s.shiftAt >= 0) s.shiftAt += dt;
  s.gear = drive.gear;
  s.rpm = drive.rpm;
  s.limiter = drive.limiter;
  s.shifted = drive.shifted;
  s.v = v;
  s.load = load;
  if (spec.turbo) {
    const k = 1 - Math.exp(-dt / spec.turbo.lagSec);
    s.turbo += (turboTarget(drive.rpm / spec.revLimit, load) - s.turbo) * k;
  }
  return s;
};

/** Gain of the shift cut 0..1, `since` seconds after the shift (a short dip, era length). */
export const shiftCutGain = (spec, since) => {
  if (since < 0) return 1;
  const cut = spec.shiftCutMs / 1000;
  if (since >= cut) return 1;
  return 0.15 + 0.85 * (since / cut) ** 2;
};

// ------------------------------------------------------------------ Web Audio voice

const waveCache = new WeakMap();

/** One PeriodicWave per (context, cylinders, voicing), shared by every car with that engine. */
const waveFor = (ctx, spec, random) => {
  if (!waveCache.has(ctx)) waveCache.set(ctx, new Map());
  const cache = waveCache.get(ctx);
  const key = `${spec.engine.cylinders}:${spec.engine.layout}`;
  if (!cache.has(key)) {
    const weights = harmonicWeights(spec.engine.cylinders, spec.voice, spec.halfOrder, VOICING.maxHarmonics, random);
    const imag = new Float32Array(weights.length);
    // Cosine terms only, zero phases: a pulse train rather than a buzz.
    cache.set(key, ctx.createPeriodicWave(weights, imag, { disableNormalization: false }));
  }
  return cache.get(key);
};

/**
 * A pooled engine voice: built once, re-pointed at another car with `assign(spec)`, fed
 * every update with `drive` (driveStep output) and mix values. `out` goes into a panner
 * (mixer.js); the caller owns position and Doppler.
 */
export const createEngineVoice = (ctx, noiseBuffer, random) => {
  const out = ctx.createGain();
  out.gain.value = 0;
  const cut = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = VOICING.filter.q;
  tone.connect(cut).connect(out);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.connect(oscGain).connect(tone);

  const band = (gainValue) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = VOICING.noise.bandQ;
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(filter).connect(gain).connect(tone);
    return { src, filter, gain };
  };
  const exhaust = band(VOICING.noise.exhaustGain);
  const intake = band(VOICING.noise.intakeGain);

  const whine = ctx.createOscillator();
  whine.type = "sine";
  const whineGain = ctx.createGain();
  whineGain.gain.value = 0;
  whine.connect(whineGain).connect(cut);
  const electric = ctx.createOscillator();
  electric.type = "triangle";
  const electricGain = ctx.createGain();
  electricGain.gain.value = 0;
  electric.connect(electricGain).connect(cut);

  const limiterLfo = ctx.createOscillator();
  limiterLfo.type = "square";
  limiterLfo.frequency.value = VOICING.limiterHz;
  const limiterDepth = ctx.createGain();
  limiterDepth.gain.value = 0;
  limiterLfo.connect(limiterDepth).connect(cut.gain);

  const sources = [osc, exhaust.src, intake.src, whine, electric, limiterLfo];
  sources.forEach((node) => node.start());
  let cutUntil = 0;

  let spec = null;
  const smooth = VOICING.smoothingSec;
  const set = (param, value, at) => param.setTargetAtTime(value, at, smooth);

  return {
    out,
    get spec() {
      return spec;
    },
    assign(next) {
      if (spec && spec.engine.cylinders === next.engine.cylinders && spec.engine.layout === next.engine.layout) {
        spec = next;
        return;
      }
      spec = next;
      osc.setPeriodicWave(waveFor(ctx, next, random));
    },
    /**
     * `drive` from driveStep; `mix` { gain, doppler, interior, lowpassHz, time, crackle }.
     * `time` is the context time; `crackle` a 0..1 burst this update (seeded by the caller).
     */
    update(drive, mix) {
      if (!spec) return;
      const at = mix.time;
      const doppler = mix.doppler || 1;
      const base = cycleFrequency(drive.rpm) * doppler;
      set(osc.frequency, base, at);
      const firing = firingFrequency(drive.rpm, spec.engine.cylinders) * doppler;
      set(exhaust.filter.frequency, firing * VOICING.noise.exhaustOrder, at);
      set(intake.filter.frequency, firing * VOICING.noise.intakeOrder, at);
      const load = drive.load ?? 1;
      const overrun = VOICING.load.overrunGain;
      const muffle = spec.turbo ? VOICING.turboMuffle : 1;
      set(oscGain.gain, (overrun + (1 - overrun) * load) * muffle, at);
      set(exhaust.gain.gain, VOICING.noise.exhaustGain * (0.4 + 0.6 * load) * (1 - 0.5 * mix.interior) + VOICING.crackleGain * spec.crackle * (mix.crackle || 0), at);
      set(intake.gain.gain, VOICING.noise.intakeGain * (0.3 + 0.7 * load) * (0.5 + mix.interior), at);
      const { minHz, maxHz } = VOICING.filter;
      const open = minHz + (maxHz - minHz) * spec.voice.brightness * (0.35 + 0.65 * load) * (drive.rpm / spec.revLimit);
      set(tone.frequency, Math.min(open, mix.lowpassHz), at);
      // Shift cut (scheduled on the change, the era's length) and rev limiter (a square
      // LFO on the same gain stage, so it bounces at limiterHz whatever the update rate).
      if (drive.shifted) {
        const length = spec.shiftCutMs / 1000;
        cut.gain.cancelScheduledValues(at);
        cut.gain.setValueAtTime(shiftCutGain(spec, 0), at);
        cut.gain.linearRampToValueAtTime(1, at + Math.max(0.005, length));
        cutUntil = at + length;
      } else if (at >= cutUntil) {
        set(cut.gain, drive.limiter ? 1 - VOICING.limiterDepth / 2 : 1, at);
      }
      set(limiterDepth.gain, drive.limiter ? VOICING.limiterDepth / 2 : 0, at);
      const tones = hybridTones(spec, drive.rpm, drive.turbo || 0);
      if (spec.turbo) {
        set(whine.frequency, Math.max(20, tones.turboHz * doppler), at);
        set(whineGain.gain, spec.turbo.gain * (drive.turbo || 0) * (0.6 + 0.4 * mix.interior), at);
      } else set(whineGain.gain, 0, at);
      if (spec.electric) {
        // MGU-K (or KERS) sings loudest harvesting off the throttle; MGU-H rides the turbo.
        set(electric.frequency, Math.max(20, tones.electricHz * doppler), at);
        const mguh = (spec.electric.mguh || 0) * (drive.turbo || 0);
        set(electricGain.gain, spec.electric.gain * (0.3 + 0.7 * (1 - load)) + mguh, at);
      } else set(electricGain.gain, 0, at);
      set(out.gain, mix.gain, at);
    },
    silence(time) {
      set(out.gain, 0, time);
    },
    stop() {
      sources.forEach((node) => {
        try {
          node.stop();
        } catch (error) {
          /* already stopped */
        }
      });
      out.disconnect();
    },
  };
};
