/**
 * Asymmetric auto exposure (VIEW-06, LOOK-C1; RF-3D-04, RNF-05, RNF-07).
 *
 * A broadcast camera does not jump to the right exposure on a backlit cut: it closes quickly most of
 * the way and then creeps, and it never fully compensates (a backlit shot stays bright). The state
 * is an EV offset (log2) made of two first-order parts, a fast one carrying `fastShare` of the
 * target and a slow tail with the rest, each with its own time constant for brightening and for
 * darkening scenes. The target compensates only `completeness` of the scene's deviation from `key`.
 * A camera cut keeps the state (each shot starts with the previous shot's exposure).
 *
 * Deterministic: it advances only with the `dt` it is given (the race clock's step in the view),
 * never with the wall clock. Values in data/balance/view-look.json exposure. Not wired until LOOK-C3.
 */

import LOOK from "../../data/balance/view-look.json";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** EV the meter asks for at a mean luminance (0..1, display-referred): −completeness·log2(lum/key). */
export const targetEvFor = (meanLuminance, cfg = LOOK.exposure) => {
  const lum = Math.max(cfg.meter.lowClip, meanLuminance);
  return clamp(-cfg.completeness * Math.log2(lum / cfg.key), cfg.minEv, cfg.maxEv);
};

/** A fresh exposure state, already settled on `meanLuminance` when given (first shot of a session). */
export const createExposure = (meanLuminance, cfg = LOOK.exposure) => {
  const target = Number.isFinite(meanLuminance) ? targetEvFor(meanLuminance, cfg) : 0;
  return { fast: target * cfg.fastShare, slow: target * (1 - cfg.fastShare) };
};

/** Total EV of a state. */
export const evOf = (state) => state.fast + state.slow;

/** Tone-mapping exposure multiplier for a state over a base exposure (studio.js exposureFor). */
export const exposureMultiplier = (state, base = LOOK.exposure.baseAces) => base * 2 ** evOf(state);

const approach = (value, target, tau, dt) => (dt <= 0 ? value : tau > 0 ? target + (value - target) * Math.exp(-dt / tau) : target);

/**
 * Advance the exposure by `dt` seconds of race clock towards the scene's mean luminance. A scene
 * brighter than the exposure expects (target EV below the current one) uses the brighten constants.
 * Returns a new state (the input is not changed).
 */
export const stepExposure = (state, meanLuminance, dt, cfg = LOOK.exposure) => {
  const step = Math.max(0, Number.isFinite(dt) ? dt : 0);
  const target = targetEvFor(meanLuminance, cfg);
  const brighter = target < evOf(state);
  const tau = cfg.tauSec;
  return {
    fast: approach(state.fast, target * cfg.fastShare, brighter ? tau.brightenFast : tau.darkenFast, step),
    slow: approach(state.slow, target * (1 - cfg.fastShare), brighter ? tau.brightenSlow : tau.darkenSlow, step),
  };
};

/** A camera cut: the new shot keeps the exposure of the previous one. */
export const cutExposure = (state) => ({ fast: state.fast, slow: state.slow });

/**
 * The scene's luminance behind a meter reading taken on a frame already drawn with `state`'s
 * exposure (first-order: the reading divided by the exposure's gain), so the loop does not chase
 * its own correction.
 */
export const sceneLuminanceFrom = (measured, state) => Math.max(0, measured) / 2 ** evOf(state);

/**
 * Mean display luminance of an RGBA byte buffer (the meter's small readback, view-look.json
 * exposure.meter.sizePx square), with the grade's Rec. 709 weights. Pure.
 */
export const meanLuminanceOf = (rgba, weights = LOOK.grade.lumaWeights) => {
  const n = Math.floor(rgba.length / 4);
  if (!n) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const o = i * 4;
    sum += (weights[0] * rgba[o] + weights[1] * rgba[o + 1] + weights[2] * rgba[o + 2]) / 255;
  }
  return sum / n;
};
