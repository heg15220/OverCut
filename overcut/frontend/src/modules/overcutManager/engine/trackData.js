/**
 * Track data per centreline sample: half widths, racing line and its curvature
 * (docs/manager/SIM-FISICA.md §3.1, WP1; RF-3D-03, criterio 7.2).
 *
 * Calibrated circuits carry them in data/splines.json, measured from the asphalt
 * mesh and solved offline by tools/assets/racing_line.mjs:
 *
 *   wl, wr   half width to the left / right of travel, decimetres, one per point
 *   line     racing line as a lateral offset from the centreline, decimetres,
 *            positive to the right of travel (the sense of three/racingLine.js:
 *            x - sin(h) * m, y + cos(h) * m)
 *   kappa    signed curvature of the racing line, 1e-4 / m (positive: turning
 *            towards the + side)
 *   pit      limitFrom / limitTo (pit speed-limit lines) and entryLine / exitBlend
 *            (where the lane leaves and rejoins the track), shares of the pit lane
 *
 * Index i of every array is point i of `points`, which is also `circuit.points[i]`
 * of the circuit venue.circuitFor builds from that spline (it starts at the line,
 * so nothing is rotated).
 *
 * Procedural (sketch) circuits have no mesh: they take the default widths of
 * splines.json `defaults` (data, RNF-07) and the racing line is solved here with
 * the same function the pipeline uses, so the engine always has a line.
 *
 * The solver (racingLineSolver.js) only uses + - * / and Math.sqrt, so a procedural line is
 * the same in every JS engine (RNF-05, SIM-FISICA §3.11).
 */

import calibrated from "../data/splines.json";
import { lineCurvature, minCurvatureLine } from "./racingLineSolver";

export { lineCurvature, minCurvatureLine, normalsOf } from "./racingLineSolver";

const DEFAULTS = calibrated.defaults || {};

const decode = (values, scale) => Float64Array.from(values, (v) => v / scale);

const cache = new WeakMap();

/**
 * Half widths, racing line and curvature (metres, 1/m) for every point of a built circuit.
 * Calibrated: decoded from its spline in splines.json. Procedural: default widths from
 * splines.json `defaults` and the line solved here (cached per circuit object).
 */
export const trackDataFor = (circuit, splines = calibrated.splines || {}, defaults = DEFAULTS) => {
  if (cache.has(circuit)) return cache.get(circuit);
  const n = circuit.points.length;
  const id = circuit.splineId || (typeof circuit.id === "string" && circuit.id.startsWith("spline:") ? circuit.id.slice(7) : null);
  const spline = id ? splines[id] : null;
  let data;
  if (spline && spline.line && spline.line.length === n && spline.wl?.length === n && spline.wr?.length === n) {
    data = {
      source: "mesh",
      wl: decode(spline.wl, 10),
      wr: decode(spline.wr, 10),
      line: decode(spline.line, 10),
      kappa: spline.kappa?.length === n ? decode(spline.kappa, 1e4) : lineCurvature(circuit.points, decode(spline.line, 10), defaults.curvatureSpan ?? 2),
      marginM: spline.trackMarginM ?? defaults.marginM,
    };
  } else {
    const half = defaults.halfWidthM;
    const margin = defaults.marginM;
    if (!(half > 0) || !(margin >= 0)) throw new Error("splines.json defaults: halfWidthM / marginM missing");
    const wl = new Float64Array(n).fill(half);
    const wr = new Float64Array(n).fill(half);
    const lo = new Float64Array(n).fill(-(half - margin));
    const hi = new Float64Array(n).fill(half - margin);
    const line = minCurvatureLine(circuit.points, lo, hi, defaults.solver || {});
    data = { source: "procedural", wl, wr, line, kappa: lineCurvature(circuit.points, line, defaults.curvatureSpan ?? 2), marginM: margin };
  }
  cache.set(circuit, data);
  return data;
};

/**
 * Pit-lane marks (SIM-FISICA §3.8) as shares of `circuit.pit.path`: entryLine, limitFrom, boxFrom,
 * boxTo, limitTo, exitBlend, in that order. From splines.json when the lane is the mesh's; for the
 * procedural lane, from its own geometry: it leaves the track where its offset passes the default half
 * width and the limiter runs over the part at full offset.
 */
export const pitMarksFor = (circuit, splines = calibrated.splines || {}, defaults = DEFAULTS) => {
  const pit = circuit.pit;
  if (!pit || !pit.path) return null;
  const id = circuit.splineId || (typeof circuit.id === "string" && circuit.id.startsWith("spline:") ? circuit.id.slice(7) : null);
  const marks = id && pit.source === "mesh" ? splines[id]?.pit : null;
  if (marks && Number.isFinite(marks.limitFrom) && Number.isFinite(marks.limitTo)) {
    return { entryLine: marks.entryLine, limitFrom: marks.limitFrom, boxFrom: pit.boxFrom, boxTo: pit.boxTo, limitTo: marks.limitTo, exitBlend: marks.exitBlend, source: "mesh" };
  }
  // Procedural lane: lateral offset of every path point from the nearest lap point.
  const path = pit.path;
  const pts = circuit.points;
  const along = [0];
  for (let k = 1; k < path.length; k += 1) {
    const dx = path[k].x - path[k - 1].x;
    const dy = path[k].y - path[k - 1].y;
    along.push(along[k - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const total = along[along.length - 1] || 1;
  const offset = path.map((p) => {
    let best = Infinity;
    for (let i = 0; i < pts.length; i += 1) {
      const dx = p.x - pts[i].x;
      const dy = p.y - pts[i].y;
      const d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  });
  const full = Math.max(...offset);
  const half = defaults.halfWidthM ?? 0;
  const first = (test) => offset.findIndex(test);
  const last = (test) => {
    for (let k = offset.length - 1; k >= 0; k -= 1) if (test(offset[k])) return k;
    return -1;
  };
  const share = (k) => along[Math.max(0, k)] / total;
  const atFull = (v) => v >= full - 0.5;
  const entryLine = share(first((v) => v >= half));
  const exitBlend = share(last((v) => v >= half));
  const boxAt = pit.boxAt;
  const limitFrom = Math.min(share(first(atFull)), boxAt);
  const limitTo = Math.max(share(last(atFull)), pit.lineAt);
  return { entryLine, limitFrom, boxFrom: boxAt, boxTo: boxAt, limitTo, exitBlend, source: "procedural" };
};
