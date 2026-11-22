/**
 * Framing for the showroom turntable (RF-3D-06): how far the camera must sit so
 * the car never leaves the picture while it turns, whatever the shape of the
 * box it is drawn in.
 *
 * The car spins about the vertical axis, so every heading it can show fits in
 * the upright cylinder that wraps its footprint: radius = half the diagonal of
 * its bounding box seen from above, from its lowest to its highest point. The
 * camera keeps its direction (a low three-quarter view) and only its distance
 * and aim height change: the distance is the smallest one at which every point
 * of that cylinder lands inside the view with `margin` to spare. No three.js
 * here, so it is tested on its own.
 */

const rad = (deg) => (deg * Math.PI) / 180;

/** Normalised device coordinates of the cylinder's extremes for a camera at `distance`. */
const extentAt = ({ radius, minY, maxY, aspect, fov, elevation, distance, targetY, samples = 48 }) => {
  const tan = Math.tan(rad(fov) / 2);
  const cos = Math.cos(elevation);
  const sin = Math.sin(elevation);
  const camW = distance * cos; // horizontal distance from the axis, along the view
  const camY = targetY + distance * sin;
  let maxX = 0;
  let lowY = Infinity;
  let highY = -Infinity;
  for (let k = 0; k < samples; k += 1) {
    const theta = (k / samples) * Math.PI * 2;
    const w = radius * Math.cos(theta);
    const x = radius * Math.sin(theta);
    for (const y of [minY, maxY]) {
      const dw = w - camW;
      const dy = y - camY;
      const depth = -dw * cos - dy * sin;
      if (depth <= 1e-3) return null; // behind or inside the camera: too close
      const up = -dw * sin + dy * cos;
      maxX = Math.max(maxX, Math.abs(x / (depth * tan * aspect)));
      const ndcY = up / (depth * tan);
      lowY = Math.min(lowY, ndcY);
      highY = Math.max(highY, ndcY);
    }
  }
  return { maxX, lowY, highY };
};

/**
 * { distance, targetY } for a turntable car.
 *   radius      horizontal radius of the car about the turntable axis (m)
 *   minY, maxY  lowest and highest point of the car (m)
 *   aspect      width / height of the drawing box
 *   fov         vertical field of view of the camera (degrees)
 *   elevation   angle of the camera above the horizon (radians)
 *   margin      share of the half-view left empty on every side (0..0.5)
 */
export const frameTurntable = ({ radius, minY = 0, maxY = 1, aspect = 2, fov = 24, elevation = 0.26, margin = 0.08 }) => {
  const r = Math.max(0.1, radius);
  const a = Math.max(0.2, aspect);
  const limit = 1 - Math.min(0.45, Math.max(0, margin));
  let targetY = (minY + maxY) / 2;
  let distance = r * 4;
  // Fit, re-aim so the car sits in the vertical middle, and fit again (the last pass only fits).
  for (let pass = 0; pass < 3; pass += 1) {
    let lo = r * 0.5;
    let hi = r * 200;
    for (let step = 0; step < 48; step += 1) {
      const mid = (lo + hi) / 2;
      const e = extentAt({ radius: r, minY, maxY, aspect: a, fov, elevation, distance: mid, targetY });
      if (e && e.maxX <= limit && e.highY <= limit && e.lowY >= -limit) hi = mid;
      else lo = mid;
    }
    distance = hi;
    if (pass === 2) break;
    const e = extentAt({ radius: r, minY, maxY, aspect: a, fov, elevation, distance, targetY });
    const centre = (e.highY + e.lowY) / 2;
    targetY += centre * distance * Math.tan(rad(fov) / 2);
  }
  return { distance, targetY };
};

/** Does the cylinder fit the view at this framing? (for tests and debugging) */
export const fitsView = ({ radius, minY, maxY, aspect, fov = 24, elevation = 0.26, distance, targetY, margin = 0 }) => {
  const e = extentAt({ radius, minY, maxY, aspect, fov, elevation, distance, targetY });
  const limit = 1 - margin + 1e-6;
  return Boolean(e) && e.maxX <= limit && e.highY <= limit && e.lowY >= -limit;
};
