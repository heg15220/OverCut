/**
 * A schematic circuit for the live view.
 *
 * Not the real layout - OverCut has no licence-free track maps - but a closed
 * loop drawn from the circuit's name, so every venue has its own recognisable
 * shape every time, and its character shows: a power circuit is long and
 * stretched, a downforce circuit twists. The live view only needs somewhere to
 * put the dots, and a way to say where along the lap a car is.
 */

import { createStream } from "../../overcutTrayectoria/engine/rng";

const SAMPLES = 360;

const catmull = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return [0, 1].map((axis) =>
    0.5 * (2 * p1[axis] + (-p0[axis] + p2[axis]) * t + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 + (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3),
  );
};

export const makeTrack = (name = "", profile = {}) => {
  const stream = createStream(`track::${name}`);
  const corners = 9 + Math.round((profile.aero ?? 0.6) * 6);
  const stretch = 1 + (profile.power ?? 0.6) * 0.55;
  const control = Array.from({ length: corners }, (_, index) => {
    const angle = (index / corners) * Math.PI * 2;
    const radius = 0.62 + stream.range(-0.22, 0.3);
    return [Math.cos(angle) * radius * stretch, Math.sin(angle) * radius];
  });
  const points = [];
  for (let index = 0; index < corners; index += 1) {
    const p0 = control[(index - 1 + corners) % corners];
    const p1 = control[index];
    const p2 = control[(index + 1) % corners];
    const p3 = control[(index + 2) % corners];
    const steps = Math.round(SAMPLES / corners);
    for (let step = 0; step < steps; step += 1) points.push(catmull(p0, p1, p2, p3, step / steps));
  }
  // Fit into a 0..100 x 0..60 box.
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(92 / (maxX - minX), 52 / (maxY - minY));
  const fitted = points.map(([x, y]) => [4 + (x - minX) * scale + (92 - (maxX - minX) * scale) / 2, 4 + (y - minY) * scale + (52 - (maxY - minY) * scale) / 2]);
  const lengths = [0];
  for (let index = 1; index <= fitted.length; index += 1) {
    const [ax, ay] = fitted[index - 1];
    const [bx, by] = fitted[index % fitted.length];
    lengths.push(lengths[index - 1] + Math.hypot(bx - ax, by - ay));
  }
  const path = `M${fitted.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" L")} Z`;
  return { points: fitted, lengths, total: lengths[lengths.length - 1], path };
};

/** Where along the lap a car is, 0..1 from the start line. */
export const pointAt = (track, fraction) => {
  const share = ((fraction % 1) + 1) % 1;
  const target = share * track.total;
  let low = 0;
  let high = track.lengths.length - 1;
  while (low < high - 1) {
    const mid = (low + high) >> 1;
    if (track.lengths[mid] <= target) low = mid;
    else high = mid;
  }
  const a = track.points[low % track.points.length];
  const b = track.points[(low + 1) % track.points.length];
  const span = track.lengths[low + 1] - track.lengths[low] || 1;
  const t = (target - track.lengths[low]) / span;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
};
