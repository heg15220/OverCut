/**
 * Seeded noise for the rain of the view (LOOK-C2; F1M24-CHINA §1.4 rule 7, RNF-05, RF-SIM-15).
 *
 * Every drop, spray puff and puddle comes from `seedOf` (three/cameras.js, FNV-1a of a text) and an
 * integer index, never from an unseeded random or the wall clock: the same seed, car and race clock draw the
 * same particles on every machine and in every replay.
 */

import { seedOf } from "../cameras";

export { seedOf };

/** A 32-bit integer mix of a seed and an index (murmur3 finaliser). */
export const mix32 = (seed, n) => {
  let h = ((seed >>> 0) ^ Math.imul(n | 0, 0x27d4eb2d)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
};

/** A uniform number in [0, 1) for seed and index. */
export const hash01 = (seed, n) => mix32(seed, n) / 4294967296;

/** A uniform number in [0, 1) for seed and two indices (e.g. car and particle). */
export const hash01x2 = (seed, a, b) => hash01(mix32(seed, a), b);

/** The seed of a text plus a sub-key, e.g. `seedFor("spray", carId)`. */
export const seedFor = (...parts) => seedOf(parts.map((part) => String(part)).join("|"));

/**
 * Smooth 1D value noise in [0, 1): `x` in cells, cosine-free smoothstep between seeded lattice values.
 * Used for patches along the lap (puddles).
 */
export const valueNoise1 = (seed, x) => {
  const i = Math.floor(x);
  const f = x - i;
  const t = f * f * (3 - 2 * f);
  const a = hash01(seed, i);
  const b = hash01(seed, i + 1);
  return a + (b - a) * t;
};
