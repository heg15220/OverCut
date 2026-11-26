/**
 * Recorded engines (RF-3D-04 live view; RNF-03, RNF-04, RNF-07): banks of short loops cut
 * at fixed engine speeds from real rev sweeps (tools/assets/engine_sounds.py, manifest
 * data/manager-sounds.json), crossfaded and pitch-shifted by the car's rpm. A car whose
 * season and engine have a bank (audio.json samples.cars[], safety cars by row in
 * samples.safetyCar) sounds recorded once its bank has loaded; any other car, or every car
 * while a bank is loading or failed, keeps the synthesised voice (engineSynth.js).
 *
 * Every bank is riskRipped (its source declares no licence): public builds
 * (REACT_APP_PUBLIC_BUILD=true) never load them (SRS 3.3, 7.3), and the viewer can turn
 * them off (mixer setting `recorded`).
 *
 * The maths, pure and tested (engineSamples.test.js):
 *   bank speed   a bank loop is one four-stroke cycle repeated, so its pitch is rpm / 120,
 *                the same base as the synth's wave. When the car revs higher than the
 *                recording, the bank is walked at scale k = bankTop / revLimit (so the whole
 *                rev range uses the whole sweep) and the pitch follows the real rpm by
 *                (1 / k) ^ pitchFollow.
 *   speed bins   the two loops either side of the wanted pitch, equal-power by log pitch
 *   load         accel and decel (overrun) sweeps crossfaded by driveStep's load
 *   channels     left the engine (intake side), right the exhaust; onboard brings the engine up
 */

import audioData from "../../data/balance/audio.json";
import soundManifest from "../../data/manager-sounds.json";
import { fetchCached } from "../assets/cacheStore";
import { cycleFrequency, limiterDepthOf, shiftEnvelope } from "./engineSynth";

const SAMPLES = audioData.samples;
const VOICING = audioData.voicing;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

const publicBuild = () => process.env.REACT_APP_PUBLIC_BUILD === "true";

/** The manifest entry of a bank, or null. */
export const bankEntry = (id, manifest = soundManifest) => (manifest.banks || []).find((bank) => bank.id === id) || null;

/** May this bank sound in this build? (riskRipped or unverified: never in a public build.) */
export const bankAllowed = (entry, { isPublic = publicBuild() } = {}) => Boolean(entry) && (!isPublic || entry.riskRipped === false);

/** Does this build have any recorded bank at all (the sound panel only offers the switch then)? */
export const recordedAvailable = (options = {}, manifest = soundManifest) => (manifest.banks || []).some((bank) => bankAllowed(bank, options));

const matches = (rule, engine) =>
  Object.entries(rule.match || {}).every(([key, value]) => {
    if (key === "aspiration") return value === "turbo" ? engine.aspiration !== "na" : engine.aspiration === value;
    return engine[key] === value;
  });

/**
 * The bank id for an engine spec (engineSpecFor or safetyCarSpecFor), or null for the
 * synth: the first samples.cars[] rule whose years hold the season and whose `match` fits
 * the engine; a safety car by its audio.json row (spec.era "safety-car:<row id>"). A rule's
 * bank may be a preference list (F1 2020 first, then GTA V): the first one in the manifest.
 */
export const sampleBankFor = (spec, options = {}, samples = SAMPLES, manifest = soundManifest) => {
  if (!spec) return null;
  let wanted = null;
  if (spec.safetyCar) {
    const row = String(spec.era || "").replace(/^safety-car:/, "");
    wanted = (samples.safetyCar && row !== "$comment" && samples.safetyCar[row]) || null;
  } else {
    const rule = (samples.cars || []).find((candidate) => spec.year >= candidate.from && spec.year <= candidate.to && matches(candidate, spec.engine || {}));
    wanted = rule ? rule.bank : null;
  }
  // A rule names one bank or a preference list: the first one this build has and may play.
  const ids = [].concat(wanted || []);
  return ids.find((id) => bankAllowed(bankEntry(id, manifest), options)) || null;
};

/** The two loops either side of `hz` (log pitch), equal-power; one loop at either end. */
export const binWeights = (bins, hz) => {
  if (!bins || !bins.length || !(hz > 0)) return [];
  const last = bins.length - 1;
  if (hz <= bins[0].hz) return [{ index: 0, weight: 1 }];
  if (hz >= bins[last].hz) return [{ index: last, weight: 1 }];
  let i = 0;
  while (bins[i + 1].hz < hz) i += 1;
  const t = Math.log(hz / bins[i].hz) / Math.log(bins[i + 1].hz / bins[i].hz);
  return [
    { index: i, weight: Math.cos((t * Math.PI) / 2) },
    { index: i + 1, weight: Math.sin((t * Math.PI) / 2) },
  ];
};

/** Accel and decel shares for driveStep's load (0 overrun .. 1 full throttle), equal-power. */
export const layerWeights = (load, cfg = SAMPLES.load) => {
  const t = clamp(((Number.isFinite(load) ? load : 1) - cfg.decelBelow) / (cfg.accelAbove - cfg.decelBelow), 0, 1);
  return { accel: Math.sin((t * Math.PI) / 2), decel: Math.cos((t * Math.PI) / 2) };
};

/**
 * Where to read the bank for this rpm: `bankHz` the pitch in the recording's sweep and
 * `follow` the extra pitch ratio towards the real rpm (1 when the recording covers it).
 */
export const sampleTargets = (spec, topRpm, rpm, follow = SAMPLES.pitchFollow) => {
  const k = topRpm > 0 && spec?.revLimit > 0 ? Math.min(1, topRpm / spec.revLimit) : 1;
  return { bankHz: cycleFrequency(Math.max(0, rpm) * k), follow: (1 / k) ** follow };
};

/** Playback rate of one loop: its pitch to the wanted one, the follow ratio and Doppler, clamped. */
export const loopRate = (bin, { bankHz, follow }, doppler = 1, samples = SAMPLES) => clamp((bankHz / bin.hz) * follow * doppler, samples.minRate, samples.maxRate);

/** Engine and exhaust channel gains for the onboard share (0 outside .. 1 in the cockpit). */
export const channelGains = (interior = 0, channels = SAMPLES.channels) => {
  const i = clamp(interior || 0, 0, 1);
  return { engine: channels.engine + (channels.interiorEngine - channels.engine) * i, exhaust: channels.exhaust + (channels.interiorExhaust - channels.exhaust) * i };
};

/** A 16-bit PCM WAV to { sampleRate, frames, channels: Float32Array[] }. */
export const parseWav = (arrayBuffer) => {
  const view = new DataView(arrayBuffer);
  const tag = (at) => String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
  if (view.byteLength < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("not a WAV file");
  let fmt = null;
  let data = null;
  let p = 12;
  while (p + 8 <= view.byteLength) {
    const id = tag(p);
    const size = view.getUint32(p + 4, true);
    if (id === "fmt ") fmt = { format: view.getUint16(p + 8, true), channels: view.getUint16(p + 10, true), sampleRate: view.getUint32(p + 12, true), bits: view.getUint16(p + 22, true) };
    if (id === "data") data = { offset: p + 8, size: Math.min(size, view.byteLength - p - 8) };
    p += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.format !== 1 || fmt.bits !== 16 || fmt.channels < 1) throw new Error("unsupported WAV");
  const count = fmt.channels;
  const frames = Math.floor(data.size / (2 * count));
  const channels = Array.from({ length: count }, () => new Float32Array(frames));
  for (let f = 0; f < frames; f += 1) {
    for (let c = 0; c < count; c += 1) channels[c][f] = view.getInt16(data.offset + 2 * (f * count + c), true) / 32768;
  }
  return { sampleRate: fmt.sampleRate, frames, channels };
};

/** URL of a bank's WAV, versioned by its hash so a rebuilt bank is never read stale (RNF-04). */
export const bankUrl = (entry, manifest = soundManifest) => `${process.env.PUBLIC_URL || ""}${manifest.baseUrl || "/manager-assets/"}${entry.file}?v=${String(entry.sha256 || "0").slice(0, 12)}`;

/**
 * Cut a parsed bank into one AudioBuffer per loop. The recording's idle goes under the
 * lowest accel loop when it sits below it. `createBuffer` is the context's.
 */
export const sliceBank = (entry, wav, createBuffer) => {
  const slice = (row) => {
    const buffer = createBuffer(wav.channels.length, row.length, wav.sampleRate);
    wav.channels.forEach((channel, c) => buffer.copyToChannel(channel.subarray(row.offset, row.offset + row.length), c));
    return { hz: row.hz, rpm: row.rpm, buffer };
  };
  const accel = entry.layers.accel.map(slice);
  const decel = (entry.layers.decel || []).map(slice);
  const idle = (entry.layers.idle || []).map(slice);
  const withIdle = idle.length && accel.length && idle[0].hz < accel[0].hz * 0.97 ? [idle[0], ...accel] : accel;
  return {
    id: entry.id,
    topRpm: Math.max(...entry.layers.accel.map((row) => row.rpm)),
    layers: { accel: withIdle, decel: decel.length ? decel : withIdle },
  };
};

const loads = new WeakMap();

/** Load a bank once per audio context (Cache Storage first, RNF-04). Rejects when it is missing or not allowed. */
export const loadEngineBank = (ctx, id, { fetchBytes = fetchCached, manifest = soundManifest, isPublic } = {}) => {
  if (!loads.has(ctx)) loads.set(ctx, new Map());
  const cache = loads.get(ctx);
  if (!cache.has(id)) {
    const entry = bankEntry(id, manifest);
    const job = !bankAllowed(entry, isPublic === undefined ? {} : { isPublic })
      ? Promise.reject(new Error(`engine bank ${id} not available`))
      : Promise.resolve(fetchBytes(bankUrl(entry, manifest))).then((bytes) => sliceBank(entry, parseWav(bytes), (channels, length, rate) => ctx.createBuffer(channels, length, rate)));
    // A failed download may succeed next race: forget it.
    job.catch(() => cache.delete(id));
    cache.set(id, job);
  }
  return cache.get(id);
};

/**
 * A pooled recorded voice, the sampled twin of engineSynth's createEngineVoice: `assign(bank,
 * spec)`, then `update(drive, mix)` with the same arguments. Loops start on demand (at most
 * two speeds per layer sound at once) and stop `releaseSec` after they fall silent.
 * `random` (seeded by the caller) only picks where in its loop each one starts.
 */
export const createSampledVoice = (ctx, random) => {
  const out = ctx.createGain();
  out.gain.value = 0;
  const cut = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = VOICING.filter.q;
  tone.frequency.value = VOICING.filter.maxHz * 2;
  const splitter = ctx.createChannelSplitter(2);
  const engineGain = ctx.createGain();
  const exhaustGain = ctx.createGain();
  const sum = ctx.createGain();
  splitter.connect(engineGain, 0);
  splitter.connect(exhaustGain, 1);
  engineGain.connect(sum);
  exhaustGain.connect(sum);
  sum.connect(tone).connect(cut).connect(out);

  const limiterLfo = ctx.createOscillator();
  limiterLfo.type = "square";
  limiterLfo.frequency.value = VOICING.limiterHz;
  const limiterDepth = ctx.createGain();
  limiterDepth.gain.value = 0;
  limiterLfo.connect(limiterDepth).connect(cut.gain);
  limiterLfo.start();

  const smooth = VOICING.smoothingSec;
  const set = (param, value, at, tau = smooth) => param.setTargetAtTime(value, at, tau);
  const active = new Map();
  let bank = null;
  let spec = null;
  let lastBase = null;
  let cutUntil = 0;
  let silentSince = null;

  const drop = (key) => {
    const loop = active.get(key);
    if (!loop) return;
    try {
      loop.src.stop();
    } catch (error) {
      /* already stopped */
    }
    loop.src.disconnect();
    loop.gain.disconnect();
    active.delete(key);
  };
  const dropAll = () => Array.from(active.keys()).forEach(drop);

  return {
    out,
    get bank() {
      return bank;
    },
    get playing() {
      return active.size;
    },
    assign(nextBank, nextSpec) {
      if (bank !== nextBank) {
        dropAll();
        lastBase = null;
      }
      if (spec !== nextSpec) lastBase = null;
      bank = nextBank;
      spec = nextSpec;
    },
    /** `drive` from driveStep; `mix` { gain, doppler, interior, lowpassHz, time }. */
    update(drive, mix) {
      if (!bank || !spec) return;
      const at = mix.time;
      silentSince = null;
      const doppler = mix.doppler || 1;
      const target = sampleTargets(spec, bank.topRpm, drive.rpm);
      const layers = layerWeights(drive.load ?? 1);
      const wanted = new Map();
      ["accel", "decel"].forEach((layer) => {
        if (layers[layer] < 1e-3) return;
        binWeights(bank.layers[layer], target.bankHz).forEach(({ index, weight }) => {
          const w = weight * layers[layer];
          if (w > 1e-3) wanted.set(`${layer}:${index}`, { bin: bank.layers[layer][index], w });
        });
      });
      wanted.forEach(({ bin }, key) => {
        if (active.has(key)) return;
        const src = ctx.createBufferSource();
        src.buffer = bin.buffer;
        src.loop = true;
        src.playbackRate.value = loopRate(bin, target, doppler);
        const gain = ctx.createGain();
        gain.gain.value = 0;
        src.connect(gain).connect(splitter);
        src.start(at, random() * bin.buffer.duration);
        active.set(key, { src, gain, bin, quietSince: null });
      });
      active.forEach((loop, key) => {
        const want = wanted.get(key);
        set(loop.gain.gain, want ? want.w * SAMPLES.gain : 0, at, SAMPLES.fadeSec);
        set(loop.src.playbackRate, loopRate(loop.bin, target, doppler), at);
        if (want) loop.quietSince = null;
        else if (loop.quietSince === null) loop.quietSince = at;
        else if (at - loop.quietSince > SAMPLES.releaseSec) drop(key);
      });
      const channels = channelGains(mix.interior);
      set(engineGain.gain, channels.engine, at);
      set(exhaustGain.gain, channels.exhaust, at);
      set(tone.frequency, Math.min(VOICING.filter.maxHz * 2, mix.lowpassHz || VOICING.filter.maxHz * 2), at);
      // Gear changes and the limiters on the gain stage, shaped as the synth's (the pitch
      // glides by itself: every loop's rate follows the rpm with the usual smoothing).
      const base = cycleFrequency(drive.rpm) * doppler;
      const change = drive.shifted ? shiftEnvelope(spec, { fromHz: lastBase, toHz: base, blip: Boolean(drive.blip) }, at) : null;
      lastBase = base;
      const depth = limiterDepthOf(drive);
      set(limiterLfo.frequency, drive.pitLimiter ? VOICING.pitLimiter.flutterHz : VOICING.limiterHz, at);
      if (change) {
        cut.gain.cancelScheduledValues(change.gain[0][0]);
        cut.gain.setValueAtTime(change.gain[0][1], change.gain[0][0]);
        change.gain.slice(1).forEach(([time, value]) => cut.gain.linearRampToValueAtTime(value, time));
        cutUntil = change.until;
      } else if (at >= cutUntil) set(cut.gain, 1 - depth / 2, at);
      set(limiterDepth.gain, depth / 2, at);
      set(out.gain, mix.gain, at);
    },
    silence(time) {
      set(out.gain, 0, time);
      if (!active.size) return;
      if (silentSince === null) silentSince = time;
      else if (time - silentSince > SAMPLES.releaseSec) dropAll();
    },
    stop() {
      dropAll();
      try {
        limiterLfo.stop();
      } catch (error) {
        /* already stopped */
      }
      out.disconnect();
    },
  };
};
