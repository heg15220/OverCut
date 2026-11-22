/**
 * The physical pit lane (RF-SIM-12, RF-SIM-10, SRS §6.2; docs/manager/SIM-FISICA.md §3.8, WP6).
 *
 * The pit lane is its own road: the mesh's (tools/assets/blender/extract_pitlane.py, carried by
 * trackGeometry as `circuit.pit.path`) or the procedural one parallel to the main straight. A car
 * that pits drives it through these phases:
 *
 *   ENTRY_ROAD    off the track at its speed, braking to reach vLimit at the limit line (limitFrom)
 *   LIMITER       at vLimit
 *   BOX_APPROACH  braking to 0 at its own box (team slots between the first and last garage)
 *   QUEUE         a team-mate is still in the box: stopped behind it (double stack)
 *   STATIONARY    v = 0, the stop's stages (pitStop.js)
 *   RELEASE       away from the box up to vLimit (an unsafe release is a car coming down the fast lane)
 *   LIMITER       at vLimit to the end of the zone (limitTo)
 *   EXIT_ROAD     accelerating, back to track speed where the lane blends in (exitBlend)
 *
 * Speeds come from a profile v(s) on a 1 m grid (race-pit.json `pitLane`): a cap from the lane's
 * curvature, the limit in the limited zone, the braking and traction limits, v = 0 at the box.
 * Times come from the same grid (trapezoids in v: exact for constant acceleration), so the time
 * a car spends in the lane is a number, not an outcome of the step size.
 *
 * The time the stop costs - the lane against the same stretch on the track at race pace - is
 * `pitLossFor(circuit, ...)`: the quick mode charges it (race.js pitLaneLoss) and the step mode
 * drives it, from the same profile, so both modes pay the same for stopping (SRS §4.2). Under a
 * safety car or VSC the track stretch is slower by the same factor both modes use for SC laps
 * (race-sim.json safetyCar), so the loss falls by itself.
 *
 * Marks: `limitFrom/limitTo/exitBlend` (shares of the lane) from WP1 (engine/trackData.js
 * pitMarksFor: data/splines.json for a mesh lane, the procedural lane's own geometry otherwise);
 * without them, derived from the garages (race-pit.json `limitMarginMetres`).
 *
 * Only + − × ÷ and Math.sqrt in the tables (RNF-05: bit-identical across JS engines).
 */

import pitBalance from "../../data/balance/race-pit.json";
import simBalance from "../../data/balance/race-sim.json";
import { pitMarksFor } from "../trackData";
import { timeShareAtDistance } from "../trackGeometry";

const LANE = pitBalance.pitLane;
const KMH = 1 / 3.6;

export const PIT_LANE_BALANCE = LANE;

export const PHASE = {
  TRACK: 0,
  ENTRY_ROAD: 1,
  LIMITER: 2,
  BOX_APPROACH: 3,
  QUEUE: 4,
  STATIONARY: 5,
  RELEASE: 6,
  EXIT_ROAD: 7,
};
export const PHASE_NAMES = Object.keys(PHASE);

const frac = (value) => value - Math.floor(value);
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

// ------------------------------------------------------------ geometry

const geometryCache = new WeakMap();

/**
 * The pit marks of this circuit's lane (WP1, engine/trackData.js pitMarksFor): splines.json for a
 * mesh lane, the procedural lane's own geometry otherwise. Shares of the lane; null when absent.
 */
const laneMarks = (circuit) => {
  const marks = pitMarksFor(circuit);
  if (!marks) return {};
  const pick = (key) => (Number.isFinite(marks[key]) ? marks[key] : null);
  return { limitFrom: pick("limitFrom"), limitTo: pick("limitTo"), exitBlend: pick("exitBlend"), source: marks.source };
};

/** Track speed (m/s, on the speed trace) at distance share `d`. */
const traceSpeedAt = (circuit, d) => {
  const shares = circuit.distShare;
  const speed = circuit.speed;
  const x = frac(d);
  let lo = 0;
  let hi = shares.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (shares[mid] <= x) lo = mid;
    else hi = mid;
  }
  const span = shares[hi] - shares[lo] || 1;
  const k = clamp((x - shares[lo]) / span, 0, 1);
  return speed[lo % speed.length] + (speed[hi % speed.length] - speed[lo % speed.length]) * k;
};

/**
 * The pit lane of a circuit resampled every `gridMetres`: distance, radius of curvature, the
 * line, the garages and the limit marks, in metres along the lane. Cached per circuit.
 */
export const laneGeometry = (circuit) => {
  const known = geometryCache.get(circuit);
  if (known) return known;
  const pit = circuit.pit;
  const path = pit.path;
  const along = [0];
  for (let k = 1; k < path.length; k += 1) {
    const dx = path[k].x - path[k - 1].x;
    const dy = path[k].y - path[k - 1].y;
    along.push(along[k - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const total = along[along.length - 1];
  const ds = LANE.gridMetres;
  const N = Math.max(8, Math.round(total / ds));
  const step = total / N;
  const xs = new Float64Array(N + 1);
  const ys = new Float64Array(N + 1);
  let seg = 0;
  for (let i = 0; i <= N; i += 1) {
    const s = i * step;
    while (seg < path.length - 2 && along[seg + 1] < s) seg += 1;
    const len = along[seg + 1] - along[seg] || 1;
    const t = clamp((s - along[seg]) / len, 0, 1);
    xs[i] = path[seg].x + (path[seg + 1].x - path[seg].x) * t;
    ys[i] = path[seg].y + (path[seg + 1].y - path[seg].y) * t;
  }
  // Radius from the circle through three points `span` metres apart.
  const span = Math.max(1, Math.round(LANE.curvatureSpanMetres / step));
  const radius = new Float64Array(N + 1);
  for (let i = 0; i <= N; i += 1) {
    const a = Math.max(0, i - span);
    const c = Math.min(N, i + span);
    if (c - a < 2) {
      radius[i] = 1e6;
      continue;
    }
    const ax = xs[a]; const ay = ys[a];
    const bx = xs[i]; const by = ys[i];
    const cx = xs[c]; const cy = ys[c];
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const ab = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
    const bc = Math.sqrt((cx - bx) * (cx - bx) + (cy - by) * (cy - by));
    const ca = Math.sqrt((ax - cx) * (ax - cx) + (ay - cy) * (ay - cy));
    const area2 = Math.abs(cross);
    radius[i] = area2 < 1e-9 ? 1e6 : (ab * bc * ca) / (2 * area2);
  }

  const lineS = pit.lineAt * total;
  const boxFromShare = Number.isFinite(pit.boxFrom) ? pit.boxFrom : pit.lineAt * 0.25;
  const boxToShare = Number.isFinite(pit.boxTo) ? pit.boxTo : pit.lineAt * 0.85;
  const boxFromS = boxFromShare * total;
  const boxToS = boxToShare * total;
  const marks = laneMarks(circuit);
  const derived = marks.limitFrom === null || marks.limitFrom === undefined;
  const limitFromS = derived
    ? clamp(boxFromS - LANE.limitMarginMetres, Math.min(LANE.entryRoadMinMetres, total * 0.2), lineS - 1)
    : marks.limitFrom * total;
  const limitToS = marks.limitTo !== null && marks.limitTo !== undefined
    ? marks.limitTo * total
    : clamp(Math.max(boxToS, lineS) + LANE.limitMarginMetres, lineS + 1, total - Math.min(LANE.exitRoadMinMetres, total * 0.2));
  const exitBlendS = marks.exitBlend !== null && marks.exitBlend !== undefined ? marks.exitBlend * total : total;
  // Garages for the stops: before the line, so a stop lap ends as it does in the quick mode
  // (the stationary time belongs to the in-lap).
  const slotFrom = Math.max(limitFromS + LANE.boxSlotMarginMetres, boxFromS);
  const slotTo = Math.max(slotFrom, Math.min(boxToS, lineS - LANE.boxSlotMarginMetres));

  const geo = {
    total,
    N,
    step,
    radius,
    lineS,
    boxFromS,
    boxToS,
    slotFrom,
    slotTo,
    limitFromS,
    limitToS,
    exitBlendS,
    marks: derived ? "derived" : marks.source === "mesh" ? "spline" : "procedural",
    source: pit.source,
    entry: pit.entry,
    exit: pit.exit,
  };
  geometryCache.set(circuit, geo);
  return geo;
};

/** Where box slot `slot` of `slots` is, metres along the lane. */
export const boxPosition = (geo, slot, slots) => {
  if (slots <= 1) return (geo.slotFrom + geo.slotTo) / 2;
  return geo.slotFrom + ((geo.slotTo - geo.slotFrom) * (slot + 0.5)) / slots;
};

// ------------------------------------------------------------ track side

/** Track speed scale: the trace is drawn for `simulatedLap`, the race runs on `baseLap`. */
const trackScale = (circuit, baseLap) => (circuit.simulatedLap > 0 && baseLap > 0 ? circuit.simulatedLap / baseLap : 1);

/** Seconds the track takes from the lane's entry to its exit at race pace (`baseLap`). */
export const trackSpanTime = (circuit, baseLap) => {
  const geo = laneGeometry(circuit);
  const a = timeShareAtDistance(circuit, geo.entry);
  const b = timeShareAtDistance(circuit, geo.exit);
  return (b + 1 - a) * baseLap;
};

/** The equivalent track distance share for `s` metres along the lane (for the timing tower). */
export const trackShareAt = (geo, s) => {
  if (s <= geo.lineS) return geo.entry + (1 - geo.entry) * (s / Math.max(1e-9, geo.lineS));
  return 1 + geo.exit * ((s - geo.lineS) / Math.max(1e-9, geo.total - geo.lineS));
};

// ------------------------------------------------------------ speed profile

/**
 * The lane speed limit in m/s for a limit in km/h (null = no limit: the track speed at the line
 * less `noLimitMarginKmh`, the speed the geometry lets a car carry past the garages).
 */
export const limitSpeed = (circuit, kmh, baseLap) => {
  if (kmh) return kmh * KMH;
  const scale = trackScale(circuit, baseLap);
  return Math.max(20, traceSpeedAt(circuit, 0) * scale - LANE.noLimitMarginKmh * KMH);
};

const accelAt = (v) => {
  const top = LANE.accel.topKmh * KMH;
  const r = v / top;
  return Math.max(0.5, LANE.accel.max * (1 - r * r));
};

/**
 * Speed and time along the lane for one pass. `vLimit` m/s; `stopAt` metres (null = drive
 * through); `over` = { kmh, metres } for a car late on the limiter (speeding). Returns
 * { v, t, T, tStop, vLimit } where t[i] is the time to reach grid point i (stop excluded:
 * the stationary time is added on top at `tStop`).
 */
export const buildProfile = (circuit, { vLimit, baseLap, stopAt = null, over = null }) => {
  const geo = laneGeometry(circuit);
  const { N, step, radius } = geo;
  const scale = trackScale(circuit, baseLap);
  const vEntry = traceSpeedAt(circuit, geo.entry) * scale;
  const vExit = traceSpeedAt(circuit, geo.exit) * scale;
  const road = LANE.roadMaxKmh * KMH;
  const cap = new Float64Array(N + 1);
  const overTo = over ? geo.limitFromS + over.metres : -1;
  for (let i = 0; i <= N; i += 1) {
    const s = i * step;
    let c = Math.min(road, Math.sqrt(LANE.lateralAccel * radius[i]));
    // A cell that touches the zone is in it, so no point of the zone is reached above the limit.
    if (s > geo.limitFromS - step && s < geo.limitToS + step) c = Math.min(c, s <= overTo ? vLimit + over.kmh * KMH : vLimit);
    if (s >= geo.exitBlendS) c = Math.min(c, Math.max(vExit, vLimit));
    cap[i] = c;
  }
  cap[0] = Math.min(cap[0], vEntry);
  cap[N] = Math.min(cap[N], Math.max(vExit, vLimit));
  const stopIndex = stopAt === null ? -1 : clamp(Math.round(stopAt / step), 1, N - 1);
  if (stopIndex >= 0) cap[stopIndex] = 0;

  // Backward pass: braking. Into the limit line at the entry-road rate; to the box at the box rate.
  const v = new Float64Array(N + 1);
  v[N] = cap[N];
  for (let i = N - 1; i >= 0; i -= 1) {
    const decel = i * step >= geo.limitFromS - 1 ? LANE.boxDecel : LANE.brakeDecel;
    v[i] = Math.min(cap[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * decel * step));
  }
  // Forward pass: traction. The entry starts at the track speed (or what braking allows).
  for (let i = 1; i <= N; i += 1) {
    const a = accelAt(v[i - 1]);
    v[i] = Math.min(v[i], Math.sqrt(v[i - 1] * v[i - 1] + 2 * a * step));
  }
  if (stopIndex >= 0) v[stopIndex] = 0;

  const t = new Float64Array(N + 1);
  for (let i = 1; i <= N; i += 1) {
    const mean = v[i - 1] + v[i];
    t[i] = t[i - 1] + (mean > 1e-9 ? (2 * step) / mean : 0);
  }
  return { v, t, T: t[N], tStop: stopIndex >= 0 ? t[stopIndex] : -1, stopIndex, step, N, vLimit, overTo };
};

/** Metres along the lane and speed at `elapsed` seconds of driving (stop excluded) on `profile`. */
export const sampleProfile = (profile, elapsed) => {
  const { t, v, N, step } = profile;
  if (elapsed <= 0) return { s: 0, v: v[0] };
  if (elapsed >= t[N]) return { s: N * step, v: v[N] };
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid] <= elapsed) lo = mid;
    else hi = mid;
  }
  // Constant acceleration inside the cell: v(τ) linear in time.
  const dtCell = t[hi] - t[lo];
  const k = dtCell > 0 ? (elapsed - t[lo]) / dtCell : 0;
  const vNow = v[lo] + (v[hi] - v[lo]) * k;
  const s = lo * step + (v[lo] + vNow) * 0.5 * (elapsed - t[lo]);
  return { s: Math.min(hi * step, s), v: vNow };
};

/** Time (s of driving) at which `profile` reaches `s` metres. */
export const timeAtS = (profile, s) => {
  const { t, v, N, step } = profile;
  const x = clamp(s / step, 0, N);
  const i = Math.min(N - 1, Math.floor(x));
  const f = x - i;
  if (f === 0) return t[i];
  // Inside a cell of constant acceleration.
  const v0 = v[i];
  const v1 = v[i + 1];
  const a = (v1 * v1 - v0 * v0) / (2 * step);
  const d = f * step;
  const vd = Math.sqrt(Math.max(0, v0 * v0 + 2 * a * d));
  return t[i] + (v0 + vd > 1e-9 ? (2 * d) / (v0 + vd) : 0);
};

// ------------------------------------------------------------ the loss

const lossCache = new WeakMap();

/**
 * What a stop costs on this circuit, in seconds, stationary time excluded:
 * `{ stop, through, sc, vsc, lane, laneThrough, track, vLimit, vLimitKmh, geometry }`.
 * `stop` = lane time with the stop's braking and launch at the middle garage − the same
 * stretch on the track at `baseLap` pace; `through` = a drive-through; `sc`/`vsc` = the stop
 * with the track stretch at the safety-car / VSC pace of both modes (race-sim.json safetyCar).
 */
export const pitLaneFor = (circuit, { kmh = null, baseLap, circuitId = null } = {}) => {
  let byKey = lossCache.get(circuit);
  if (!byKey) {
    byKey = new Map();
    lossCache.set(circuit, byKey);
  }
  const key = `${kmh}|${baseLap}|${circuitId}`;
  if (byKey.has(key)) return byKey.get(key);
  const geo = laneGeometry(circuit);
  const vLimit = limitSpeed(circuit, kmh, baseLap);
  const stopProfile = buildProfile(circuit, { vLimit, baseLap, stopAt: boxPosition(geo, 0, 1) });
  const throughProfile = buildProfile(circuit, { vLimit, baseLap });
  const track = trackSpanTime(circuit, baseLap);
  const extra = (circuitId && LANE.extraLoss.circuits[circuitId]) ?? LANE.extraLoss.default;
  const sc = simBalance.safetyCar;
  const out = {
    stop: stopProfile.T - track + extra,
    through: throughProfile.T - track + extra,
    sc: Math.max(0, stopProfile.T - track * sc.lapFactor + extra),
    vsc: Math.max(0, stopProfile.T - track * sc.virtualLapFactor + extra),
    lane: stopProfile.T,
    laneThrough: throughProfile.T,
    track,
    vLimit,
    vLimitKmh: kmh,
    geometry: geo,
  };
  byKey.set(key, out);
  return out;
};

/** The pit loss in seconds for a circuit (stationary excluded): green, or under `sc` ({ virtual }). */
export const pitLossFor = (circuit, { kmh = null, baseLap, circuitId = null, sc = null, through = false } = {}) => {
  const lane = pitLaneFor(circuit, { kmh, baseLap, circuitId });
  if (through) return lane.through;
  if (sc) return sc.virtual ? lane.vsc : lane.sc;
  return lane.stop;
};

/** Map a sketch reference (layouts.js) to an f1db circuit id for the limit's exceptions. */
export const circuitIdOf = (race = {}, ref = null) => race.packCircuitId || race.circuitId || (ref && (LANE.circuitAliases[ref] || ref)) || null;

// ------------------------------------------------------------ the step simulator's lane

/**
 * Per-car lane state for the step simulator (typed arrays, RNF-01). `prof[i]` holds the car's
 * profile for this pass; the rest is plain numbers.
 */
export const createLaneState = (n) => ({
  phase: new Uint8Array(n),
  s: new Float64Array(n),
  v: new Float64Array(n),
  enteredAt: new Float64Array(n),
  stopFor: new Float64Array(n),
  boxS: new Float64Array(n),
  maxInZone: new Float64Array(n),
  queue: new Float64Array(n),
  over: new Array(n).fill(null),
  prof: new Array(n).fill(null),
  plan: new Array(n).fill(null),
  stage: new Array(n).fill(null),
});
