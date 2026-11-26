/**
 * The race-audio mixer (RF-3D-04 live view, RNF-02 cost): volumes, mute and their
 * persistence per viewer, the listener per camera, distance and Doppler, and which cars
 * get one of the pooled engine voices. All numbers in data/balance/audio.json `mixer`
 * (RNF-07). The pure parts are tested in audio.test.js.
 *
 * Graph: voices > panner > engine bus > view trim -+
 *        field bed ------> engine bus            |
 *        ambience -----> ambience bus > view trim -+> master > compressor > destination
 *        clicks, whoosh, alerts, radio > ui bus ---+
 *
 * The ui bus (AUD-4, radio-ui-sounds) has its own level and mute and no view trim, so the
 * interface still clicks in a pause or a menu; the master mute silences it too.
 *
 * Per view (F1M24-GAMEPLAY §2.1, mix-snapshots-per-view): a snapshot (map, paused, replay,
 * menu) on top of the camera's mix, crossfaded on every cut, and the TV and helicopter ear
 * on the camera on air (Race3D `cameraBus`), the virtual post staying as the 2D fallback.
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

/** Bus gains from the settings: engine, ambience and ui each through master, and mute (ui also its own). */
export const busGains = (settings) => {
  const master = settings.muted ? 0 : sliderToGain(settings.master);
  const ui = settings.uiMuted ? 0 : sliderToGain(Number.isFinite(settings.ui) ? settings.ui : MIXER.defaults.ui);
  return { master, engine: sliderToGain(settings.engine), ambience: sliderToGain(settings.ambience), ui };
};

const sanitize = (raw) => {
  const base = MIXER.defaults;
  const out = { ...base };
  if (raw && typeof raw === "object") {
    ["master", "engine", "ambience", "ui"].forEach((key) => {
      if (Number.isFinite(raw[key])) out[key] = clamp(raw[key], 0, 1);
    });
    ["muted", "uiMuted", "recorded"].forEach((key) => {
      if (typeof raw[key] === "boolean") out[key] = raw[key];
    });
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

// ------------------------------------------------------------------ views (mix-snapshots-per-view)

const VIEWS = MIXER.views;
/** The fields a snapshot or a crossfade moves (lowpassHz in log, the rest linearly). */
const BLENDED = ["focus", "field", "interior", "crowd", "wind", "lowpassHz", "engineDb", "bedDb"];

/**
 * Which view snapshot applies (F1M24-GAMEPLAY §2.1): the screen's own (`replay`, `menu`)
 * when it names one; otherwise `paused` while the clock is stopped and the camera group's
 * (`map`); null is the live camera mix as it is.
 */
export const resolveView = ({ view = null, playing = true, mode = "tv" } = {}, views = VIEWS) => {
  if (view && views.snapshots[view]) return view;
  if (!playing) return "paused";
  return views.byGroup[cameraMix(mode).group] || null;
};

/** The camera's mix with the view snapshot on top: { ...cameraMix, engineDb, bedDb, view }. */
export const viewMix = (mode, view = null, views = VIEWS) => {
  const snapshot = view ? views.snapshots[view] : null;
  return { ...cameraMix(mode), engineDb: 0, bedDb: 0, ...(snapshot || {}), view: snapshot ? view : null };
};

/** A crossfade between two mixes at k (0..1): numbers blend, the rest (listener, offsets) are the target's. */
export const blendMix = (from, to, k) => {
  const f = clamp(Number.isFinite(k) ? k : 1, 0, 1);
  if (!from || f >= 1) return to;
  const out = { ...to };
  BLENDED.forEach((key) => {
    const a = from[key];
    const b = to[key];
    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
    out[key] = key === "lowpassHz" && a > 0 && b > 0 ? a * (b / a) ** f : a + (b - a) * f;
  });
  return out;
};

/** dB to a linear gain (the snapshots' bus trims). */
export const dbToGain = (db) => (Number.isFinite(db) ? 10 ** (db / 20) : 1);

/**
 * Is the camera on air (Race3D `cameraBus`, §1.7) usable as the ear for this mix? Only for
 * mixes marked `useCamera` (TV, helicopter), with a position, and from the same camera mode
 * (a bus left over from another view is ignored: the virtual post stays the 2D fallback).
 */
export const cameraUsable = (camera, mode, mix) =>
  Boolean(mix && mix.useCamera && camera && camera.position && Number.isFinite(camera.position.x) && Number.isFinite(camera.position.z) && (camera.mode == null || camera.mode === mode));

/**
 * The ear on the camera on air. three.js is Y up (x, height, z); the mixer's scene is x, y on
 * the ground and z up, as the cars' poses (Race3D draws a pose at (x, height, y)). The height
 * is the camera's above what it looks at, plus the source's own (`sourceUpM`), so a circuit's
 * altitude does not count. Its velocity, for the Doppler, from its last position in race
 * seconds while the same camera stays on air (a cut is a still ear).
 */
export const cameraListener = (camera, previous = null, dtau = 0, cfg = VIEWS.cameraListener) => {
  const p = camera.position;
  const t = camera.target && Number.isFinite(camera.target.y) ? camera.target : p;
  const x = p.x;
  const y = p.z;
  const z = Math.max(cfg.minUpM, (Number.isFinite(p.y) ? p.y : 0) - (Number.isFinite(t.y) ? t.y : 0) + cfg.sourceUpM);
  let vx = 0;
  let vy = 0;
  if (previous && previous.id === camera.id && dtau > 0) {
    vx = (x - previous.x) / dtau;
    vy = (y - previous.y) / dtau;
    const speed = Math.hypot(vx, vy);
    if (speed > cfg.maxSpeed) {
      vx *= cfg.maxSpeed / speed;
      vy *= cfg.maxSpeed / speed;
    }
  }
  const heading = Math.atan2((camera.target?.z ?? p.z) - p.z, (camera.target?.x ?? p.x) - p.x);
  return { x, y, z, vx, vy, post: null, id: camera.id ?? null, heading };
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

/** Master, engine, ambience and ui buses with a gentle compressor at the end. */
export const createMixer = (ctx) => {
  const master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = MIXER.masterLimiter.threshold;
  comp.knee.value = MIXER.masterLimiter.knee;
  comp.ratio.value = MIXER.masterLimiter.ratio;
  master.connect(comp).connect(ctx.destination);
  const engine = ctx.createGain();
  const ambience = ctx.createGain();
  // The view snapshot's trims (engineDb, bedDb) sit after the viewer's own bus volumes.
  const engineView = ctx.createGain();
  const ambienceView = ctx.createGain();
  engine.connect(engineView).connect(master);
  ambience.connect(ambienceView).connect(master);
  // Interface and radio (AUD-4): straight to master, no view trim.
  const ui = ctx.createGain();
  ui.connect(master);

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
    ui,
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
      ui.gain.setTargetAtTime(gains.ui, at, 0.05);
    },
    /** The view snapshot's bus trims (already crossfaded by the caller). */
    applyView(mix, at) {
      engineView.gain.setTargetAtTime(dbToGain(mix.engineDb), at, 0.03);
      ambienceView.gain.setTargetAtTime(dbToGain(mix.bedDb), at, 0.03);
    },
    disconnect() {
      master.disconnect();
    },
  };
};
