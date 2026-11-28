/**
 * Drops on the lens of the onboard cameras (VIEW-07 modules, LOOK-C2; RF-SIM-11, RF-3D-04, RNF-05, RNF-07).
 *
 * Only onboards get drops (rain.lens.onboardOnly): a trackside or helicopter lens is shielded and wiped.
 * They come from the rain (dropsPerSecAtMmH per mm/h of snapshot.weather.rainRate) and from the spray of
 * the car ahead (sprayDropsPerSec × its snapshot.spray level); with speed the airflow clears them sooner
 * (life / (1 + v / speedClearMps)). Stateless and seeded like the spray: maxDrops slots, each cycling with
 * the drop's life; a slot holds a drop in a cycle when its seeded draw is under the expected share, so more
 * rain never removes a drop that was there. `lensOffsetAt` is the CPU reference of LensDropShader.
 *
 * Values in data/balance/view-look.json rain.lens. Not wired until LOOK-C4.
 */

import { Vector4 } from "three";
import LOOK from "../../data/balance/view-look.json";
import { hash01x2, mix32 } from "./seeded";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const lerp = (a, b, t) => a + (b - a) * t;

/** Whether a camera kind gets lens drops (`onboard` from Race3D.js camera kinds). */
export const lensActiveFor = (cameraKind, cfg = LOOK.rain.lens) => (cfg.onboardOnly ? cameraKind === "onboard" : true);

/** Drops per second arriving on the lens. */
export const lensRateOf = ({ rainRate = 0, sprayAhead = 0 } = {}, cfg = LOOK.rain.lens) =>
  Math.max(0, finite(rainRate)) * cfg.dropsPerSecAtMmH + clamp(finite(sprayAhead), 0, 1) * cfg.sprayDropsPerSec;

/** Life (s) of a drop at a speed. */
export const lensLifeOf = (speedMps, cfg = LOOK.rain.lens) => cfg.lifeSec / (1 + Math.max(0, finite(speedMps)) / cfg.speedClearMps);

/**
 * The drops on the lens at race time `t`: `[{u, v, r, alpha}]` in uv (0..1, r in v units). Empty for a
 * camera that is not an onboard, or with no rain and no spray.
 */
export const lensDrops = ({ seed, t, rainRate = 0, sprayAhead = 0, speedMps = 0, cameraKind = "onboard", cfg = LOOK.rain.lens }) => {
  if (!lensActiveFor(cameraKind, cfg)) return [];
  const rate = lensRateOf({ rainRate, sprayAhead }, cfg);
  if (!(rate > 0) || !cfg.maxDrops) return [];
  const life = lensLifeOf(speedMps, cfg);
  const share = clamp((rate * life) / cfg.maxDrops, 0, 1);
  const clock = finite(t);
  const out = [];
  for (let k = 0; k < cfg.maxDrops; k += 1) {
    const slot = mix32(seed, k);
    const cycles = clock / life + hash01x2(slot, 0, 0);
    const cycle = Math.floor(cycles);
    if (hash01x2(slot, cycle, 1) >= share) continue;
    const age = cycles - cycle;
    out.push({
      u: hash01x2(slot, cycle, 2),
      v: hash01x2(slot, cycle, 3),
      r: lerp(cfg.radiusUv[0], cfg.radiusUv[1], hash01x2(slot, cycle, 4)),
      alpha: 1 - age,
    });
  }
  return out;
};

/** Refraction offset (uv) a pixel at (u, v) gets from the drops; aspect = width / height. */
export const lensOffsetAt = (u, v, drops, { aspect = 16 / 9, cfg = LOOK.rain.lens } = {}) => {
  let du = 0;
  let dv = 0;
  drops.forEach((drop) => {
    const x = (u - drop.u) * aspect;
    const y = v - drop.v;
    const d = Math.hypot(x, y) / drop.r;
    if (d >= 1) return;
    const lens = (1 - d * d) * cfg.refraction * drop.alpha;
    du -= (x / aspect / Math.max(1e-6, drop.r)) * lens;
    dv -= (y / Math.max(1e-6, drop.r)) * lens;
  });
  return [du, dv];
};

export const LENS_MAX_DROPS = 64;

/** ShaderPass definition with the same formula as lensOffsetAt. */
export const LensDropShader = {
  name: "OverCutLensDropShader",
  uniforms: {
    tDiffuse: { value: null },
    drops: { value: Array.from({ length: LENS_MAX_DROPS }, () => new Vector4(0, 0, 1, 0)) },
    dropCount: { value: 0 },
    aspect: { value: 16 / 9 },
    refraction: { value: LOOK.rain.lens.refraction },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    #define MAX_DROPS ${LENS_MAX_DROPS}
    uniform sampler2D tDiffuse;
    uniform vec4 drops[MAX_DROPS];
    uniform int dropCount;
    uniform float aspect;
    uniform float refraction;
    varying vec2 vUv;
    void main() {
      vec2 offset = vec2(0.0);
      for (int i = 0; i < MAX_DROPS; i++) {
        if (i >= dropCount) break;
        vec4 drop = drops[i];
        vec2 q = vec2((vUv.x - drop.x) * aspect, vUv.y - drop.y);
        float d = length(q) / drop.z;
        if (d < 1.0) {
          float lens = (1.0 - d * d) * refraction * drop.w;
          offset -= vec2(q.x / aspect, q.y) / max(1e-6, drop.z) * lens;
        }
      }
      gl_FragColor = texture2D(tDiffuse, vUv + offset);
    }`,
};

/** Copy drops into a pass's uniforms (a ShaderPass made from LensDropShader). */
export const applyLens = (uniforms, drops, { aspect = 16 / 9 } = {}) => {
  const n = Math.min(LENS_MAX_DROPS, drops.length);
  for (let i = 0; i < n; i += 1) {
    const d = drops[i];
    uniforms.drops.value[i].set(d.u, d.v, d.r, d.alpha);
  }
  uniforms.dropCount.value = n;
  uniforms.aspect.value = aspect;
  return uniforms;
};
