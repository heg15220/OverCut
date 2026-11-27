/**
 * Rain fog and rain streaks (VIEW-07 modules, LOOK-C2; RF-SIM-11, RF-3D-04, RNF-05, RNF-07).
 *
 * Fog: extinction coefficients add (Koschmieder: β = 3,912 / visibility), so the rain's β from
 * rain.fog.visibilityKmByRainMmH (interpolated in β, 0 without rain, proportional past the last row) is
 * summed to the haze of sky.js fogDensityFor(humidity) and clamped like it (view-look.json fog). The rain
 * rate is the engine's snapshot.weather.rainRate (mm/h); the view computes no weather.
 *
 * Streaks: rain.streaks.count by quality × min(1, rain / countAtMmH) segments in a box of boxM around the
 * camera, falling at fallMps (terminal velocity of a 2 mm drop, Gunn and Kinzer 1949), positions from
 * seedOf and the race clock (replaces the unseeded streaks of Race3D.js in LOOK-C4).
 */

import LOOK from "../../data/balance/view-look.json";
import { fogDensityFor } from "../sky";
import { hash01x2, mix32 } from "./seeded";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

/** Extinction coefficient (1/m) of the rain alone at `mmH`. */
export const rainExtinctionOf = (mmH, cfg = LOOK.rain.fog, k = LOOK.fog.koschmieder) => {
  const rate = Math.max(0, finite(mmH));
  if (!(rate > 0)) return 0;
  const rows = cfg.visibilityKmByRainMmH;
  const beta = (row) => k / (row.km * 1000);
  if (rate <= rows[0].mmH) return beta(rows[0]) * (rate / rows[0].mmH);
  for (let i = 1; i < rows.length; i += 1) {
    if (rate <= rows[i].mmH) {
      const t = (rate - rows[i - 1].mmH) / (rows[i].mmH - rows[i - 1].mmH);
      return beta(rows[i - 1]) + (beta(rows[i]) - beta(rows[i - 1])) * t;
    }
  }
  const last = rows[rows.length - 1];
  return beta(last) * (rate / last.mmH);
};

/** Fog density of haze plus rain (same convention and limits as sky.js fogDensityFor). */
export const rainFogDensity = ({ humidity = 50, rainMmH = 0 } = {}) => {
  const { minDensity, maxDensity } = LOOK.fog;
  return clamp(fogDensityFor(humidity) + rainExtinctionOf(rainMmH), minDensity, maxDensity);
};

/** Contrast left at `metres` with a FogExp2 of `density`, as three.js draws it: exp(−(ρ·d)²). */
export const renderedContrastAt = (density, metres) => Math.exp(-((density * metres) ** 2));

/** How many streaks are drawn at a rain rate and quality level. */
export const streakCountFor = (rainMmH, quality = "medium", cfg = LOOK.rain.streaks) => {
  const total = cfg.count[quality] ?? cfg.count.medium;
  const rate = Math.max(0, finite(rainMmH));
  if (!(rate > 0)) return 0;
  return Math.max(1, Math.round(total * clamp(rate / cfg.countAtMmH, 0, 1)));
};

/**
 * Streak segments at race time `t` around `centre` {x, y, z}: Float32Array of count × 2 vertices (top and
 * bottom of each streak). Each streak falls at fallMps and wraps in the box; its column is seeded.
 */
export const streakPositions = ({ seed, t, count, centre = { x: 0, y: 0, z: 0 }, cfg = LOOK.rain.streaks, out = null }) => {
  const array = out && out.length >= count * 6 ? out : new Float32Array(Math.max(0, count) * 6);
  const box = cfg.boxM;
  const clock = finite(t);
  for (let k = 0; k < count; k += 1) {
    const s = mix32(seed, k);
    const x = centre.x + (hash01x2(s, 0, 1) - 0.5) * box;
    const z = centre.z + (hash01x2(s, 0, 2) - 0.5) * box;
    const fall = (hash01x2(s, 0, 3) * box + cfg.fallMps * clock) % box;
    const y = centre.y + box * 0.5 - fall;
    const o = k * 6;
    array[o] = x;
    array[o + 1] = y;
    array[o + 2] = z;
    array[o + 3] = x;
    array[o + 4] = y - cfg.lengthM;
    array[o + 5] = z;
  }
  return array;
};
