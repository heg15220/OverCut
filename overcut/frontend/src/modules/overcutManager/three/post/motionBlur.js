/**
 * Onboard motion blur with the own car masked out (VIEW-05, LOOK-C1; RF-3D-04, RNF-02, RNF-05, RNF-07).
 *
 * Forward motion makes the world stream out of the focus of expansion; a yaw adds a sideways sweep.
 * The blur follows that flow: per pixel the offset is (uv − centre) × radial + (yaw, 0), scaled by a
 * ramp that is 0 inside `centreRadius` (the road ahead stays sharp) and 1 from `edgeRadius` (the
 * sides, the kerbs and the grass smear), capped at `maxOffset`. The own car is drawn into a mask
 * (layer `maskLayer`) and keeps its pixels; samples that land on the car are skipped so it does not
 * smear into the background.
 *
 * The taps are fixed and symmetric (no noise), so the pass is deterministic: the same frame, mask,
 * speed and yaw give the same image. `blurImage` is the CPU reference of the shader (tests); both
 * read the same `blurParams`. Values in data/balance/view-look.json blur and quality. Not wired until
 * LOOK-C3.
 */

import LOOK from "../../data/balance/view-look.json";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Quality level → whether the blur runs and with how many taps (view-look.json quality.levels). */
export const blurTapsFor = (quality = "medium") => {
  const level = LOOK.quality.levels[quality] || LOOK.quality.levels.medium;
  return level.post && level.motionBlur ? level.blurTaps : 0;
};

/**
 * Uniform values of the pass for the camera's speed (m/s, from the pose `v`) and yaw rate (rad/s,
 * from the pose heading's change over the race clock step). Off (`enabled: false`) below
 * `minSpeedMps`, in a quality level without blur, or with fewer than two taps.
 */
export const blurParams = ({ speedMps = 0, yawRate = 0, aspect = 16 / 9, quality = "medium", cfg = LOOK.blur } = {}) => {
  const taps = blurTapsFor(quality);
  const speed = Number.isFinite(speedMps) ? speedMps : 0;
  const enabled = taps >= 2 && speed >= cfg.minSpeedMps;
  const offsets = [];
  for (let i = 0; i < taps; i += 1) offsets.push(taps > 1 ? i / (taps - 1) - 0.5 : 0);
  return {
    enabled,
    taps,
    offsets,
    radial: enabled ? speed * cfg.radialPerMps : 0,
    yaw: enabled ? (Number.isFinite(yawRate) ? yawRate : 0) * cfg.yawPerRadPerSec : 0,
    aspect,
    centreRadius: cfg.centreRadius,
    edgeRadius: cfg.edgeRadius,
    maxOffset: cfg.maxOffset,
  };
};

/** Normalised distance from the centre: 0 at the centre, 1 at a corner (aspect-corrected). */
export const radiusAt = (u, v, aspect) => {
  const dx = (u - 0.5) * aspect;
  const dy = v - 0.5;
  return Math.hypot(dx, dy) / Math.hypot(0.5 * aspect, 0.5);
};

/** The blur's flow vector (in uv) at a pixel. */
export const flowAt = (u, v, p) => {
  const ramp = smoothstep(p.centreRadius, p.edgeRadius, radiusAt(u, v, p.aspect));
  let fx = ((u - 0.5) * p.radial + p.yaw) * ramp;
  let fy = (v - 0.5) * p.radial * ramp;
  const len = Math.hypot(fx, fy);
  if (len > p.maxOffset) {
    fx *= p.maxOffset / len;
    fy *= p.maxOffset / len;
  }
  return [fx, fy];
};

const sampler = (data, w, h, channels) => (u, v, c) => {
  const x = clamp(u * w - 0.5, 0, w - 1);
  const y = clamp(v * h - 0.5, 0, h - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const at = (xx, yy) => data[(yy * w + xx) * channels + c];
  return (at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) + (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty;
};

/**
 * CPU reference of the pass: `image` w×h×channels floats (0..1), `mask` w×h (1 = own car) or null.
 * Returns a new Float32Array.
 */
export const blurImage = (image, w, h, mask, p, channels = 1) => {
  const out = new Float32Array(image.length);
  if (!p.enabled) {
    out.set(image);
    return out;
  }
  const sample = sampler(image, w, h, channels);
  const sampleMask = mask ? sampler(mask, w, h, 1) : null;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x;
      const m = mask ? mask[idx] : 0;
      if (m >= 1) {
        for (let c = 0; c < channels; c += 1) out[idx * channels + c] = image[idx * channels + c];
        continue;
      }
      const u = (x + 0.5) / w;
      const v = (y + 0.5) / h;
      const [fx, fy] = flowAt(u, v, p);
      const acc = new Array(channels).fill(0);
      let total = 0;
      p.offsets.forEach((t) => {
        const su = u + fx * t;
        const sv = v + fy * t;
        const wgt = sampleMask ? 1 - clamp(sampleMask(su, sv, 0), 0, 1) : 1;
        if (wgt <= 0) return;
        total += wgt;
        for (let c = 0; c < channels; c += 1) acc[c] += sample(su, sv, c) * wgt;
      });
      for (let c = 0; c < channels; c += 1) {
        const original = image[idx * channels + c];
        const blurred = total > 0 ? acc[c] / total : original;
        out[idx * channels + c] = blurred * (1 - m) + original * m;
      }
    }
  }
  return out;
};

const MAX_TAPS = 16;

/** ShaderPass definition: the same flow and taps as blurImage (tDiffuse = frame, tMask = own car). */
export const MotionBlurShader = {
  name: "OverCutMotionBlurShader",
  defines: { MAX_TAPS },
  uniforms: {
    tDiffuse: { value: null },
    tMask: { value: null },
    useMask: { value: 0 },
    taps: { value: 0 },
    radial: { value: 0 },
    yaw: { value: 0 },
    aspect: { value: 16 / 9 },
    centreRadius: { value: LOOK.blur.centreRadius },
    edgeRadius: { value: LOOK.blur.edgeRadius },
    maxOffset: { value: LOOK.blur.maxOffset },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tMask;
    uniform float useMask;
    uniform int taps;
    uniform float radial;
    uniform float yaw;
    uniform float aspect;
    uniform float centreRadius;
    uniform float edgeRadius;
    uniform float maxOffset;
    varying vec2 vUv;
    void main() {
      vec4 original = texture2D(tDiffuse, vUv);
      float m = useMask > 0.5 ? texture2D(tMask, vUv).r : 0.0;
      if (taps < 2 || m >= 1.0) { gl_FragColor = original; return; }
      vec2 d = vUv - 0.5;
      float r = length(d * vec2(aspect, 1.0)) / length(vec2(0.5 * aspect, 0.5));
      float ramp = smoothstep(centreRadius, edgeRadius, r);
      vec2 flow = (d * radial + vec2(yaw, 0.0)) * ramp;
      float len = length(flow);
      if (len > maxOffset) flow *= maxOffset / len;
      vec4 acc = vec4(0.0);
      float total = 0.0;
      for (int i = 0; i < MAX_TAPS; i++) {
        if (i >= taps) break;
        float t = float(i) / float(taps - 1) - 0.5;
        vec2 suv = vUv + flow * t;
        float w = useMask > 0.5 ? 1.0 - clamp(texture2D(tMask, suv).r, 0.0, 1.0) : 1.0;
        acc += texture2D(tDiffuse, suv) * w;
        total += w;
      }
      vec4 blurred = total > 0.0 ? acc / total : original;
      gl_FragColor = mix(blurred, original, m);
    }`,
};

/** Copy blurParams into a pass's uniforms. */
export const applyBlur = (uniforms, p, maskTexture = null) => {
  uniforms.taps.value = p.enabled ? Math.min(MAX_TAPS, p.taps) : 0;
  uniforms.radial.value = p.radial;
  uniforms.yaw.value = p.yaw;
  uniforms.aspect.value = p.aspect;
  uniforms.centreRadius.value = p.centreRadius;
  uniforms.edgeRadius.value = p.edgeRadius;
  uniforms.maxOffset.value = p.maxOffset;
  uniforms.tMask.value = maskTexture;
  uniforms.useMask.value = maskTexture ? 1 : 0;
  return uniforms;
};
