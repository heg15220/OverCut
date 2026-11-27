/**
 * Ambience of the live race (RF-3D-04): a crowd bed that swells on passes, a new leader,
 * the start and the flag; wind with the focus car's speed; rain with the track's wetness;
 * the pit lane (air guns while the wheels are changed); tyre squeal on a lock-up or a
 * spin (engine `incident`); a thump on contact; the field bed of the cars without a voice
 * and the kerb rumble under the focus car (AUD-2), both on the engine bus; a thump and a tone
 * per start light and the revs on the grid, read from the engine's `snapshot.start` (AUD-3); the crowd
 * decorrelated left and right and a continuous stereo track bed under TV, helicopter and chase
 * (AUD-C4, F1M24-CHINA §2.7), so the TV is wide and never silent between passes. Synthesised from one shared noise
 * buffer, no recordings. Numbers in data/balance/audio.json `ambience` (RNF-07); the
 * envelopes and curves are pure and tested (audio.test.js).
 */

import audioData from "../../data/balance/audio.json";
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

/** Kerb rumble (kerbs-wind): the bumps of the kerb pass under the wheel at v / stripeM Hz; nothing slower than minKmh. */
export const kerbRumble = (kmh, onKerb, kerb = AMB.kerb) => {
  if (!onKerb || !(kmh >= kerb.minKmh)) return { gain: 0, hz: kerb.minHz };
  return { gain: kerb.gain, hz: clamp(kmh / 3.6 / kerb.stripeM, kerb.minHz, kerb.maxHz) };
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

/** Is a stop stage one where the air guns run? */
export const airGunsOn = (stage) => Boolean(stage) && AMB.pit.stages.includes(stage);

/** Does an engine incident squeal the tyres? */
export const squeals = (incident) => Boolean(incident) && AMB.squeal.kinds.includes(incident);

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
  const rain = loop("highpass", AMB.rain.hz, AMB.rain.q);
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

  return {
    /**
     * `frame`: { time, crowd (0..1), crowdShare, wind {gain, hz}, rain, guns (0..1) } and,
     * optional, bed { level, hz } (the field bed), kerb { gain, hz } (the rumble) and
     * trackBed (the stereo track bed's level, trackBedOf; absent, silent).
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
      set(rain.gain.gain, frame.rain, at, 0.5);
      const gun = AMB.pit.airGunGain * frame.guns;
      set(guns.gain.gain, gun / 2, at, 0.02);
      set(rattleDepth.gain, gun / 2, at, 0.02);
    },
    squeal,
    impact,
    startLight,
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
