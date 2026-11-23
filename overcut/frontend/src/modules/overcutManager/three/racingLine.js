/**
 * The racing line: where on the road a car actually drives (RF-3D-03; SIM-FISICA §3.1, WP9).
 *
 * The line is the engine's (engine/trackData.js trackDataFor): on a calibrated circuit the
 * minimum-curvature line inside the measured asphalt of splines.json; on a sketch, the same
 * solver inside the procedural width. The view no longer draws its own out-in-out arcs with a
 * fixed half road: what the cars drive on screen is what the speed trace was computed on. The
 * view adds the offset to each car's position and turns the car by the line's own angle.
 */

import { trackDataFor } from "../engine/trackData";

const cache = new WeakMap();

/** Lateral offset (metres, positive to the right of travel) for every centreline sample, its angle, and the road's half widths. */
export const racingLine = (circuit) => {
  if (cache.has(circuit)) return cache.get(circuit);
  const n = circuit.points.length;
  const data = trackDataFor(circuit);
  const offsets = Float32Array.from(data.line);
  // The angle the line makes with the centreline at every sample.
  const angles = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const step = Math.max(1, (circuit.dist[i + 1] ?? circuit.length) - circuit.dist[i]);
    angles[i] = Math.atan((offsets[(i + 1) % n] - offsets[(i - 1 + n) % n]) / (2 * step));
  }
  const line = { offsets, angles, wl: data.wl, wr: data.wr, marginM: data.marginM };
  cache.set(circuit, line);
  return line;
};

/**
 * Move a centreline pose onto the racing line. Poses in the pit lane, on the
 * grid, parked or in a garage are left where they are.
 */
export const onRacingLine = (circuit, pose) => {
  if (pose.inPit || pose.onGrid || pose.parked || pose.garage || pose.progress === undefined) return pose;
  const { offsets, angles } = racingLine(circuit);
  const n = offsets.length;
  const share = ((pose.progress % 1) + 1) % 1;
  const f = share * n;
  const i = Math.floor(f) % n;
  const j = (i + 1) % n;
  const k = f - Math.floor(f);
  // Catmull-Rom across the samples: the line bends smoothly, with no corners of its own.
  const h = (q0, q1, q2, q3) => 0.5 * (2 * q1 + (q2 - q0) * k + (2 * q0 - 5 * q1 + 4 * q2 - q3) * k * k + (3 * q1 - q0 - 3 * q2 + q3) * k * k * k);
  const before = (i - 1 + n) % n;
  const after = (j + 1) % n;
  let offset = h(offsets[before], offsets[i], offsets[j], offsets[after]);
  const angle = h(angles[before], angles[i], angles[j], angles[after]);
  // The engine's sideways move (pose.lateral, already in x/y) plus the line stay on the asphalt:
  // within the measured half widths less the car's half width and clearance (WP9).
  const { wl, wr, marginM } = racingLine(circuit);
  const lat = pose.lateral ?? 0;
  if (wl && wr) {
    const left = -(wl[i] + (wl[j] - wl[i]) * k - marginM);
    const right = wr[i] + (wr[j] - wr[i]) * k - marginM;
    const total = Math.max(Math.min(left, right), Math.min(Math.max(left, right), offset + lat));
    offset = total - lat;
  }
  return {
    ...pose,
    x: pose.x - Math.sin(pose.heading) * offset,
    y: pose.y + Math.cos(pose.heading) * offset,
    heading: pose.heading + angle,
    lineOffset: offset,
  };
};
