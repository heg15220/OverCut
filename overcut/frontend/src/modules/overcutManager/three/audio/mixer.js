/**
 * The race-audio mixer (RF-3D-04 live view, RNF-02 cost): volumes, mute and their
 * persistence per viewer, the listener per camera, distance and Doppler, and which cars
 * get one of the pooled engine voices. All numbers in data/balance/audio.json `mixer`
 * (RNF-07). The pure parts are tested in audio.test.js.
 *
 * Graph: voices ► panner ► engine bus ┐
 *        ambience ──────► ambience bus ┼► master ► compressor ► destination
 */

import audioData from "../../data/balance/audio.json";

const MIXER = audioData.mixer;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

// ------------------------------------------------------------------ settings

/** A mixer slider (0..1) to a gain: linear in dB from `minDb` to 0, and 0 at the bottom. */
export const sliderToGain = (value, minDb = MIXER.volumeCurve.minDb) => {
  const v = clamp(Number(value) || 0, 0, 1);
  if (v <= 0) return 0;
  return 10 ** ((minDb * (1 - v)) / 20);
};

/** Bus gains from the settings: engine and ambience each through master, and mute. */
export const busGains = (settings) => {
  const master = settings.muted ? 0 : sliderToGain(settings.master);
  return { master, engine: sliderToGain(settings.engine), ambience: sliderToGain(settings.ambience) };
};

const sanitize = (raw) => {
  const base = MIXER.defaults;
  const out = { ...base };
  if (raw && typeof raw === "object") {
    ["master", "engine", "ambience"].forEach((key) => {
      if (Number.isFinite(raw[key])) out[key] = clamp(raw[key], 0, 1);
    });
    if (typeof raw.muted === "boolean") out.muted = raw.muted;
  }
  return out;
};

/** The browser's storage (reading it can throw when site data is blocked: callers wrap it). */
const defaultStorage = () => (typeof window === "undefined" ? null : window.localStorage);

/** The viewer's saved mix (localStorage, per browser). Never throws: private windows and blocked storage give the defaults. */
export const loadSettings = (storage) => {
  try {
    const store = storage === undefined ? defaultStorage() : storage;
    const text = store ? store.getItem(MIXER.storageKey) : null;
    return sanitize(text ? JSON.parse(text) : null);
  } catch (error) {
    return sanitize(null);
  }
};

/** Save the viewer's mix; a failing storage only loses the preference. */
export const saveSettings = (settings, storage) => {
  const clean = sanitize(settings);
  try {
    const store = storage === undefined ? defaultStorage() : storage;
    if (store) store.setItem(MIXER.storageKey, JSON.stringify(clean));
  } catch (error) {
    /* storage blocked: keep the mix for this session only */
  }
  return clean;
};

// ------------------------------------------------------------------ space

/** Camera mode of LiveRace (tv, chase, heli, tcam...) to its mix group and preset. */
export const cameraMix = (mode) => {
  const groups = MIXER.cameras.groups;
  const group = Object.keys(groups).find((key) => groups[key].includes(mode)) || "tv";
  return { group, ...MIXER.cameras.mix[group] };
};

/**
 * Where the ear is, for the camera: on the focus car (onboard, chase: offsets in metres
 * back/side/up, moving with it), above it (helicopter, map) or on a TV post beside the
 * track ahead of it that stays put until the car is `passBehind` metres past, so the car
 * drives by the microphone (`post` is the previous post, kept by the caller).
 * Returns { x, y, z, vx, vy, post }.
 */
export const listenerFor = (mix, focus, post = null) => {
  if (!focus) return { x: 0, y: 0, z: 100, vx: 0, vy: 0, post: null };
  const fx = Math.cos(focus.heading || 0);
  const fy = Math.sin(focus.heading || 0);
  // Right of travel, as raceClock offsets a pose (positive = right).
  const rx = -fy;
  const ry = fx;
  const v = Number.isFinite(focus.v) ? focus.v : 0;
  if (mix.listener === "post") {
    let next = post;
    const along = next ? (focus.x - next.x) * fx + (focus.y - next.y) * fy : Infinity;
    const far = next ? Math.hypot(focus.x - next.x, focus.y - next.y) > mix.ahead * 2.5 : true;
    if (!next || along > mix.passBehind || far) {
      next = { x: focus.x + fx * mix.ahead + rx * mix.side, y: focus.y + fy * mix.ahead + ry * mix.side };
    }
    return { x: next.x, y: next.y, z: mix.up, vx: 0, vy: 0, post: next };
  }
  const back = mix.back || 0;
  const side = mix.side || 0;
  return { x: focus.x - fx * back + rx * side, y: focus.y - fy * back + ry * side, z: mix.up, vx: fx * v, vy: fy * v, post: null };
};

/** Web Audio's 'inverse' distance law (what the PannerNode applies): g = ref / (ref + rolloff·(max(d, ref) − ref)). */
export const distanceGain = (metres, distance = MIXER.distance) => {
  const d = clamp(metres, distance.refDistance, distance.maxDistance);
  return distance.refDistance / (distance.refDistance + distance.rolloff * (d - distance.refDistance));
};

/**
 * Doppler factor of a moving source heard by a moving listener (the PannerNode no longer
 * does it): f' = f · (c − v_l·u) / (c − v_s·u), u the unit vector from source to listener.
 * A car closing on the ear sounds higher, one driving away lower.
 */
export const dopplerFactor = (source, listener, doppler = MIXER.doppler) => {
  const dx = listener.x - source.x;
  const dy = listener.y - source.y;
  const dz = (listener.z || 0) - (source.z || 0);
  const d = Math.hypot(dx, dy, dz);
  if (d < 1e-6) return 1;
  const ux = dx / d;
  const uy = dy / d;
  const c = doppler.speedOfSound;
  const vs = (source.vx || 0) * ux + (source.vy || 0) * uy;
  const vl = (listener.vx || 0) * ux + (listener.vy || 0) * uy;
  return clamp((c - vl) / (c - vs), doppler.minFactor, doppler.maxFactor);
};

/**
 * Which cars get a voice (RNF-02: at most `max`): the focus car always, then the loudest
 * by distance at the ear, only those over `audibleGain`. `cars` are { id, x, y, gone }.
 */
export const selectVoices = (cars, listener, focusId, max = MIXER.maxVoices) => {
  const ranked = cars
    .filter((car) => !car.gone)
    .map((car) => ({ id: car.id, gain: distanceGain(Math.hypot(car.x - listener.x, car.y - listener.y, listener.z || 0)) }))
    .filter((car) => car.id === focusId || car.gain >= MIXER.distance.audibleGain)
    .sort((a, b) => (b.id === focusId) - (a.id === focusId) || b.gain - a.gain);
  return ranked.slice(0, max).map((car) => car.id);
};

/** Keep cars on the voice they had (no re-wiring mid-sound); hand free voices to newcomers. */
export const assignVoices = (previous, wanted, size) => {
  const next = new Array(size).fill(null);
  wanted.forEach((id) => {
    const slot = previous.indexOf(id);
    if (slot >= 0) next[slot] = id;
  });
  wanted.forEach((id) => {
    if (next.includes(id)) return;
    const free = next.indexOf(null);
    if (free >= 0) next[free] = id;
  });
  return next;
};

// ------------------------------------------------------------------ Web Audio buses

/** Master, engine and ambience buses with a gentle compressor at the end. */
export const createMixer = (ctx) => {
  const master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = MIXER.masterLimiter.threshold;
  comp.knee.value = MIXER.masterLimiter.knee;
  comp.ratio.value = MIXER.masterLimiter.ratio;
  master.connect(comp).connect(ctx.destination);
  const engine = ctx.createGain();
  const ambience = ctx.createGain();
  engine.connect(master);
  ambience.connect(master);

  const panner = () => {
    const node = ctx.createPanner();
    node.panningModel = MIXER.panningModel;
    node.distanceModel = MIXER.distance.model;
    node.refDistance = MIXER.distance.refDistance;
    node.rolloffFactor = MIXER.distance.rolloff;
    node.maxDistance = MIXER.distance.maxDistance;
    node.connect(engine);
    return node;
  };

  const place = (param, value, at) => {
    if (param && typeof param.setTargetAtTime === "function") param.setTargetAtTime(value, at, 0.03);
  };

  return {
    engine,
    ambience,
    panner,
    /** Scene metres (x, y on the ground, z up) to Web Audio (x right, y up, z towards the viewer). */
    setPosition(node, x, y, z, at) {
      if (node.positionX) {
        place(node.positionX, x, at);
        place(node.positionY, z, at);
        place(node.positionZ, y, at);
      } else if (node.setPosition) node.setPosition(x, z, y);
    },
    setListener(listener, heading, at) {
      const l = ctx.listener;
      const fx = Math.cos(heading || 0);
      const fy = Math.sin(heading || 0);
      if (l.positionX) {
        place(l.positionX, listener.x, at);
        place(l.positionY, listener.z, at);
        place(l.positionZ, listener.y, at);
        place(l.forwardX, fx, at);
        place(l.forwardY, 0, at);
        place(l.forwardZ, fy, at);
        place(l.upX, 0, at);
        place(l.upY, 1, at);
        place(l.upZ, 0, at);
      } else if (l.setPosition) {
        l.setPosition(listener.x, listener.z, listener.y);
        if (l.setOrientation) l.setOrientation(fx, 0, fy, 0, 1, 0);
      }
    },
    apply(settings, at) {
      const gains = busGains(settings);
      master.gain.setTargetAtTime(gains.master, at, 0.05);
      engine.gain.setTargetAtTime(gains.engine, at, 0.05);
      ambience.gain.setTargetAtTime(gains.ambience, at, 0.05);
    },
    disconnect() {
      master.disconnect();
    },
  };
};
