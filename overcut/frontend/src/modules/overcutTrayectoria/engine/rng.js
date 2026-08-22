/**
 * Seeded randomness for Trayectoria.
 *
 * Every roll the game makes goes through a stream created here. Two reasons:
 * a saved career must replay identically when it is loaded back, and the
 * calibration tests need to sweep thousands of seeds without flakiness.
 *
 * The generator is mulberry32 - 32 bits of state, one multiply-shift round per
 * draw. It is not cryptographic and does not need to be; it is fast, has no
 * visible short cycles at the scale of a career (a few hundred thousand draws)
 * and seeds cleanly from a string.
 */

/** FNV-1a. Stable across runs and platforms, unlike String.prototype.hashCode. */
export const hashSeed = (value) => {
  const text = String(value ?? "");
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/**
 * A random stream. `next()` returns [0,1). Streams are independent, so deriving
 * one per race keeps a change in season logic from shifting every later race.
 */
export const createStream = (seed) => {
  let state = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
  // A zero state would lock mulberry32 onto a degenerate path.
  if (state === 0) state = 0x9e3779b9;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** Uniform in [min, max). */
    range: (min, max) => min + next() * (max - min),
    /** Integer in [min, max], both inclusive. */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    /** True with probability p. */
    chance: (probability) => next() < probability,
    /**
     * Standard normal via Box-Muller. Used everywhere a "performance on the day"
     * term is needed: real pace scatter is bell-shaped, not uniform.
     */
    normal: (mean = 0, deviation = 1) => {
      const u1 = Math.max(next(), Number.EPSILON);
      const u2 = next();
      return mean + deviation * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
    /** Gumbel(0,1). The noise that turns a score ranking into Plackett-Luce. */
    gumbel: () => {
      const u = Math.min(Math.max(next(), Number.EPSILON), 1 - Number.EPSILON);
      return -Math.log(-Math.log(u));
    },
    pick: (items) => (items.length === 0 ? null : items[Math.floor(next() * items.length)]),
    /** Weighted pick. `weightOf` must return a non-negative number. */
    pickWeighted: (items, weightOf) => {
      const weights = items.map((item) => Math.max(0, weightOf(item)));
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      if (total <= 0) return items.length ? items[0] : null;
      let roll = next() * total;
      for (let index = 0; index < items.length; index += 1) {
        roll -= weights[index];
        if (roll <= 0) return items[index];
      }
      return items[items.length - 1];
    },
    shuffle: (items) => {
      const copy = [...items];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(next() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
      }
      return copy;
    },
  };
};

/** Derive a child stream so unrelated systems never share a cursor. */
export const substream = (seed, ...parts) => createStream(`${seed}::${parts.join("::")}`);

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Linear interpolation, clamped - used by every ageing and growth curve here. */
export const lerp = (from, to, t) => from + (to - from) * clamp(t, 0, 1);
