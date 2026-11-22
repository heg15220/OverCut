/**
 * The racing line: where on the road a car actually drives.
 *
 * Racing drivers use the full width: they arrive at a corner on the outside,
 * clip the apex on the inside and let the car run out to the outside again on
 * exit - the widest, fastest arc. For every corner of a circuit this builds
 * that out-in-out shape as a lateral offset from the centreline, blends
 * neighbouring corners (a chicane becomes a straighter line through), smooths
 * it and keeps it inside the white lines. The view adds the offset to each
 * car's position and turns the car by the line's own angle, so cars visibly
 * swing across the track instead of running down the middle.
 */

const HALF_ROAD = 6.5;
const MARGIN = 1.6;

const cache = new WeakMap();

/** Lateral offset (metres, positive to the right of travel) for every centreline sample. */
export const racingLine = (circuit) => {
  if (cache.has(circuit)) return cache.get(circuit);
  const n = circuit.points.length;
  const L = circuit.length;
  const width = HALF_ROAD - MARGIN;
  const sum = new Float32Array(n);
  const weight = new Float32Array(n);
  circuit.corners.forEach((corner) => {
    const sign = corner.sign || 1;
    // Turn-in starts further back for fast corners; the exit runs out longer than the entry.
    const entryMetres = corner.kind === "fast" ? 140 : corner.kind === "medium" ? 105 : 80;
    const exitMetres = corner.kind === "fast" ? 170 : corner.kind === "medium" ? 130 : 110;
    const entry = corner.from - entryMetres / L;
    const exit = corner.to + exitMetres / L;
    const apex = corner.apex;
    const span = (from, to) => (to - from + 1) % 1;
    const total = span(entry, exit);
    const toApex = span(entry, apex) || total / 2;
    const start = Math.floor(entry * n);
    const end = Math.ceil((entry + total) * n);
    for (let k = start; k <= end; k += 1) {
      const i = ((k % n) + n) % n;
      const u = span(entry, k / n);
      if (u > total) continue;
      let offset;
      if (u <= toApex) offset = -sign * width * Math.cos((Math.PI * u) / toApex);
      else offset = sign * width * Math.cos((Math.PI * (u - toApex)) / Math.max(1e-6, total - toApex));
      // Weight peaks mid-corner so neighbours blend rather than fight.
      const w = Math.sin((Math.PI * u) / total) + 0.05;
      sum[i] += offset * w;
      weight[i] += w;
    }
  });
  let offsets = new Float32Array(n);
  for (let i = 0; i < n; i += 1) offsets[i] = weight[i] > 0 ? sum[i] / weight[i] : 0;
  // Smooth: a car cannot jink sideways.
  for (let pass = 0; pass < 8; pass += 1) {
    const next = new Float32Array(n);
    for (let i = 0; i < n; i += 1) next[i] = (offsets[(i - 2 + n) % n] + offsets[(i - 1 + n) % n] * 2 + offsets[i] * 3 + offsets[(i + 1) % n] * 2 + offsets[(i + 2) % n]) / 9;
    offsets = next;
  }
  for (let i = 0; i < n; i += 1) offsets[i] = Math.max(-width, Math.min(width, offsets[i]));
  // The angle the line makes with the centreline at every sample.
  const angles = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const step = Math.max(1, circuit.dist[i + 1] - circuit.dist[i]);
    angles[i] = Math.atan((offsets[(i + 1) % n] - offsets[(i - 1 + n) % n]) / (2 * step));
  }
  const line = { offsets, angles };
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
  const offset = h(offsets[before], offsets[i], offsets[j], offsets[after]);
  const angle = h(angles[before], angles[i], angles[j], angles[after]);
  return {
    ...pose,
    x: pose.x - Math.sin(pose.heading) * offset,
    y: pose.y + Math.cos(pose.heading) * offset,
    heading: pose.heading + angle,
    lineOffset: offset,
  };
};
