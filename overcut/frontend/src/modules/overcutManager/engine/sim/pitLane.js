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
 * Two read-only views on the same lane (PIT-1, docs/manager/F1M24-GAMEPLAY.md §1.7, §2.2):
 * `previewPit(state, carId)` - what a stop would cost now, for the pit dialog - and
 * `garageExitProfile(circuit, era, box)` - the drive from a team's box out of the lane, for the
 * sessions' garage exit. Neither draws from any stream nor writes the state (RF-SIM-15, RNF-05).
 *
 * The white lines (PIT-2, F1M24-GAMEPLAY.md §2.2 `incorporacion-pit`): `pitLinesFor(circuit)`
 * gives the entry and exit lines (exitLineTo from data/splines.json when reviewed, else from the
 * geometry), `pitExitStep` the merge of a car leaving the lane - lane PIT_EXIT on the pit-side
 * edge until the line ends, then the racing line only with mergeGapMetres clear behind, else it
 * lifts and slots in behind - and `pitLineOffence` the stewards' case for crossing a line
 * (race-eras.json pitExitLine / pitEntryLine, years pending). All pure; the step simulator
 * (stepRace.js, SIM lane) calls them.
 *
 * One definition for the estimate and the stopwatch (PIT-C1, GS-15; docs/manager/F1M24-CHINA.md
 * §1.5, §2.2): `timingLinesFor(circuit)` names the two timing lines (the lane leaves the track →
 * the lane ends, where `pose.inPit` starts and stops the HUD's pit clock), and previewPit times a
 * stop between them on the clock it will really run on - the step simulator's own box and pace,
 * or the quick mode's charge - so `lineToLine` is the stopwatch and `loss* = lineToLine* − track*`.
 *
 * Only + − × ÷ and Math.sqrt in the tables (RNF-05: bit-identical across JS engines).
 */

import pitBalance from "../../data/balance/race-pit.json";
import raceBalance from "../../data/balance/race-eras.json";
import simBalance from "../../data/balance/race-sim.json";
import calibrated from "../../data/splines.json";
import { skillZ } from "../drivers/skills";
import { pitLaneSpeedFor, rulesFor } from "../rules";
import { pitMarksFor, trackDataFor } from "../trackData";
import { distanceAtTimeShare, timeShareAtDistance } from "../trackGeometry";
import { expectedStationary } from "./pitStop";
import { SC_PHASE, gapToSc } from "./safetyCar";

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

// ------------------------------------------------------------ the pit-stop preview (PIT-1)

/** The race's rules, as race.js rulesOf reads them (an era object with its year, or the year). */
const rulesOfState = (state) => rulesFor(state.era && typeof state.era === "object" && (state.era.year !== undefined || state.era.regulations) ? state.era : state.year);

const isRunning = (car) => Boolean(car) && car.status === "running";

/** Does `car` stop at the end of `lap`: a planned stop on that lap, or a call for the next entry (race.js requestPit). */
const stopsOn = (car, lap) => Boolean(car.pitRequest && (car.pitRequest.lap === undefined || car.pitRequest.lap === lap)) || Boolean(car.plan?.stops?.includes(lap));

/** Laps of fuel a stop on `lap` adds in a refuelling era, as race.js pitDecision loads a called stop. */
const refuelLapsFor = (state, car, lap) => {
  const remaining = Math.max(0, state.laps - lap);
  const stintsLeft = Math.max(1, (car.plan?.stops || []).filter((stop) => stop > lap).length + 1);
  return Math.ceil(remaining / stintsLeft);
};

/** The lane's loss (stationary excluded) green / SC / VSC: the race's own (state.pitLane), or the circuit's. */
const laneLossesOf = (state, circuit) => {
  if (state.pitLane && Number.isFinite(state.pitLane.stop)) {
    return { green: state.pitLane.stop, sc: state.pitLane.sc ?? null, vsc: state.pitLane.vsc ?? null };
  }
  if (!circuit || !circuit.pit || !circuit.pit.path || !(state.race?.baseLap > 0)) return null;
  const lane = pitLaneFor(circuit, { kmh: state.pitLane?.kmh ?? null, baseLap: state.race.baseLap, circuitId: state.pitLane?.circuitId ?? null });
  return { green: lane.stop, sc: lane.sc, vsc: lane.vsc };
};

// ------------------------------------------------------------ the stopwatch's lines (PIT-C1, GS-15)

/**
 * RF-SIM-12, RF-CMD-02 (PIT-C1, GS-15; docs/manager/F1M24-CHINA.md §1.5, §2.2): the two timing
 * lines of the pit lane, the one definition the estimate and the stopwatch share:
 *
 *   entry   where the lane leaves the track (circuit.pit.entry, lap distance share): the step
 *           simulator puts the car in the lane there (trackTables pitEntryTau) and its pose turns
 *           `inPit`, so the HUD's stopwatch (components/pitTimer.js) starts there
 *   exit    the lane's end (circuit.pit.exit): the car is back on the track and `inPit` turns
 *           false, so the stopwatch stops there. The painted white line runs on past it
 *           (pitLinesFor exit.toShare) but is a rule of the merge, not a timing line
 *
 * The line-to-line time is the stopwatch's; the net loss is that time less the same stretch of
 * track (entry → exit) at the car's pace. Null for a circuit without a lane. Pure.
 */
export const timingLinesFor = (circuit) => {
  if (!circuit || !circuit.pit || !circuit.pit.path) return null;
  const geo = laneGeometry(circuit);
  return { entryShare: frac(circuit.pit.entry), exitShare: frac(circuit.pit.exit), laneMetres: geo.total, definition: "laneEnds" };
};

const driveCache = new WeakMap();

/**
 * Seconds of driving from the entry line to the exit line (stationary excluded) for a stop at
 * `stopAt` metres along the lane (null = drive-through), on the same profile the step simulator
 * drives (buildProfile). Cached per circuit, limit, pace and box.
 */
export const laneDriveTime = (circuit, { vLimit, baseLap, stopAt = null }) => {
  let byKey = driveCache.get(circuit);
  if (!byKey) {
    byKey = new Map();
    driveCache.set(circuit, byKey);
  }
  const key = `${vLimit}|${baseLap}|${stopAt}`;
  if (!byKey.has(key)) byKey.set(key, buildProfile(circuit, { vLimit, baseLap, stopAt }).T);
  return byKey.get(key);
};

/**
 * How car `index` runs on the track under the safety car in a step race, read the way the step
 * simulator paces it (safetyCar.js scRateCap; race-sim.json safetyCar): `{ closing, train,
 * joinMetres }` in seconds per lap and metres. In the train (within trainGapMetres of the car
 * ahead, or of the SC for the leader) at the SC's pace (baseLap × lapFactor); still closing up at
 * catchUp × that rate, for `joinMetres` more; a lapped car waved by, or the restart, at its own
 * pace - never quicker than its own. With no SC on the ring it is the train's pace from the start:
 * what a stop would save once the field is behind the car.
 */
const scPaceOf = (state, index, own, baseLap) => {
  const sc = simBalance.safetyCar;
  const train = baseLap * sc.lapFactor;
  const sim = state._sim;
  const N = sim && sim.neutral;
  const none = { closing: Math.max(own, train), train: Math.max(own, train), joinMetres: 0 };
  if (!state.safetyCar || state.safetyCar.virtual || !N || N.virtual || N.ref !== state.safetyCar || index < 0) return none;
  if ((N.unlap && N.unlap[index] === 1) || N.phase === SC_PHASE.RESTART) return { closing: own, train: own, joinMetres: 0 };
  // The slack between this car and the safety car: every gap over trainGapMetres up the road from
  // it to the SC (the leader's gap to the SC on the ring, gapToSc, or the road to it while the SC is
  // still more than half a lap away). A car held close behind another that is still closing up keeps
  // being let go again (scRateCap), so it is in the train only once the whole slack ahead is gone.
  const scAhead = (k) => {
    const gap = gapToSc(sim, N, k);
    if (Number.isFinite(gap)) return gap;
    return Number.isFinite(N.P) && !N.gone ? frac(N.P - sim.P[k]) * sim.tables.length : 0;
  };
  let slack = 0;
  let k = index;
  for (let guard = 0; guard < sim.n && k >= 0; guard += 1) {
    const gap = k === N.leader ? scAhead(k) : sim.ahead[k] >= 0 ? sim.gapM[k] : 0;
    slack += Math.max(0, gap - sc.trainGapMetres);
    if (k === N.leader) break;
    k = sim.ahead[k];
  }
  const closing = Math.max(own, train / sc.catchUp);
  const trainLap = Math.max(own, train);
  // Metres this car covers before it has closed the slack (closing at closing pace on a train at the SC's).
  const joinMetres = slack > 0 ? (closing < trainLap ? (slack * trainLap) / (trainLap - closing) : Infinity) : 0;
  return { closing, train: trainLap, joinMetres };
};

/**
 * Seconds car `index` takes on the track from the entry line to the exit line in a step race, the
 * way the step simulator spends its lap budget `pace` over the lap (stepRace: the time share of
 * cell j costs pace × (1 − dev + dev × sens[j]), trackTables `sens` with mean 1 and the car's
 * `dev`), no quicker per cell than `capLap` seconds per lap (the SC / VSC pace; 0 = none). The
 * driver's corner shape and the sector shares of a wet lap average out over a lap and are left out.
 */
const stretchTime = (sim, index, pace, capLap, capBins = null) => {
  const tables = sim.tables;
  const from = tables.pitEntryTau;
  let to = tables.pitExitTau;
  if (to <= from) to += 1;
  const M = tables.M || 0;
  const sens = tables.sens;
  const dev = sim.dev && index >= 0 && Number.isFinite(sim.dev[index]) ? sim.dev[index] : 0;
  if (!M || !sens) return (to - from) * Math.max(pace, capLap);
  let total = 0;
  for (let k = Math.floor(from * M); k < Math.ceil(to * M); k += 1) {
    const lo = Math.max(from, k / M);
    const hi = Math.min(to, (k + 1) / M);
    if (!(hi > lo)) continue;
    const own = pace * (1 - dev + dev * sens[k % M]);
    // capBins: seconds per lap of time share in each bin (the safety car's own profile), else flat.
    const cap = capBins ? capBins[k % M] : capLap;
    total += (hi - lo) * Math.max(own, cap);
  }
  return total;
};

/**
 * The safety car's pace bin by bin (seconds per lap of time share), from the profile the step
 * simulator drives it on (safetyCar.js profileOf, cached on the sim as `scProfile` once a SC is
 * out): bin j of width dd_j of the lap at v_j m/s costs dd_j × L / v_j, i.e. M × dd_j × L / v_j
 * seconds per lap. Null before any safety car has been out (then the flat lapFactor pace).
 */
const scBinsOf = (sim) => {
  const profile = sim.scProfile;
  const tables = sim.tables;
  if (!profile || !profile.v || !tables.dOfTau || !(tables.length > 0)) return null;
  const M = tables.M;
  const out = new Float64Array(M);
  for (let j = 0; j < M; j += 1) {
    const dd = tables.dOfTau[j + 1] - tables.dOfTau[j];
    out[j] = profile.v[j] > 0 ? (M * dd * tables.length) / profile.v[j] : 0;
  }
  return out;
};

/**
 * The clock a stop will be timed on, for previewPit: `{ mode, drive, track, extra }` per
 * condition. `drive` = seconds from line to line without the stop, `track` = the same stretch on
 * the track, `extra` = the per-circuit correction the quick mode charges (race-pit.json extraLoss).
 *
 *   step   the race in the step simulator (state._sim.lane): the car drives the lane to its own
 *          team's box (stepRace laneSetup boxOf, moved back by queueOffsetMetres when it queues)
 *          and the track stretch runs at its own lap budget (sim.budget), or at the SC / VSC
 *          pace (race-sim.json safetyCar) while one is out. No extraLoss: the step mode drives
 *          the lane, it does not charge a correction
 *   quick  the quick mode: the middle garage (pitLaneFor), the track at `baseLap`, the
 *          correction included - exactly what race.js charges (state.pitLane)
 */
const stopClockOf = (state, circuit, index, car, queued) => {
  const L = state._sim && state._sim.lane && state._sim.lane.circuit && state._sim.lane.geo ? state._sim.lane : null;
  const sc = simBalance.safetyCar;
  if (L) {
    const geo = L.geo;
    const own = L.boxOf?.[car.teamId] ?? (geo.slotFrom + geo.slotTo) / 2;
    const box = Math.max(geo.limitFromS + 1, own - (queued ? LANE.queueOffsetMetres : 0));
    const drive = laneDriveTime(L.circuit, { vLimit: L.vLimit, baseLap: L.baseLap, stopAt: box });
    const budget = state._sim.budget && index >= 0 && index < state._sim.budget.length ? state._sim.budget[index] : NaN;
    const pace = Number.isFinite(budget) && budget > 1 ? budget : L.baseLap;
    const green = stretchTime(state._sim, index, pace, 0);
    // Under the SC: closing up until the slack is gone, then at the train's pace (blended by the
    // share of the stretch, entry line → exit line, the car drives in the train).
    const scPace = scPaceOf(state, index, pace, L.baseLap);
    const lapMetres = state._sim.tables.length || lapMetresOf(L.circuit);
    const here = index >= 0 && state._sim.P ? frac(state._sim.P[index]) : 0;
    const toEntry = frac(frac(L.circuit.pit.entry) - here) * lapMetres;
    const stretchMetres = frac(frac(L.circuit.pit.exit) - frac(L.circuit.pit.entry)) * lapMetres;
    const inTrain = stretchMetres > 0 ? clamp((toEntry + stretchMetres - scPace.joinMetres) / stretchMetres, 0, 1) : 1;
    const closingT = stretchTime(state._sim, index, pace, scPace.closing);
    const bins = scPace.train > pace ? scBinsOf(state._sim) : null;    const trainT = stretchTime(state._sim, index, pace, scPace.train, bins);
    return {
      mode: "step",
      drive,
      extra: 0,
      track: { green, sc: closingT + (trainT - closingT) * inTrain, vsc: stretchTime(state._sim, index, pace, L.baseLap * sc.virtualLapFactor) },
      lines: timingLinesFor(L.circuit),
    };
  }
  if (!circuit || !circuit.pit || !circuit.pit.path || !(state.race?.baseLap > 0)) return null;
  const circuitId = state.pitLane?.circuitId ?? null;
  const lane = pitLaneFor(circuit, { kmh: state.pitLane ? state.pitLane.kmh : null, baseLap: state.race.baseLap, circuitId });
  const extra = (circuitId && LANE.extraLoss.circuits[circuitId]) ?? LANE.extraLoss.default;
  return { mode: "quick", drive: lane.lane, extra, track: { green: lane.track, sc: lane.track * sc.lapFactor, vsc: lane.track * sc.virtualLapFactor }, lines: timingLinesFor(circuit) };
};

/** Distance share of the lap car `index` has covered: given, the step simulator's (its time share on the trace), or the line. */
const shareOfCar = (state, circuit, index, given) => {
  if (Number.isFinite(given)) return frac(given);
  const sim = state._sim;
  if (sim && sim.tau && index >= 0 && index < sim.tau.length) return frac(distanceAtTimeShare(circuit, frac(sim.tau[index])));
  return 0;
};

/**
 * RF-CMD-02, RF-SIM-12, RF-SIM-13 (PIT-1, F1M24-GAMEPLAY.md §1.7 `previewPit`): what a stop at the
 * end of the lap would cost car `carId`, for the pit dialog (HUD-3). Pure: it reads the race and
 * writes nothing, and draws from no stream (the crew's stream is not even created), so asking
 * never changes a result (RF-SIM-15, RNF-05).
 *
 * GS-15 (PIT-C1, F1M24-CHINA.md §1.5, §2.2): the estimate and the stopwatch share one definition.
 * Both are timed between the same two lines (timingLinesFor: the lane leaves the track → the lane
 * ends), on the clock the stop will really run on (`clock`): in a step race the car's own box and
 * its own pace on the track, in the quick mode the middle garage and the charge race.js makes. So
 * `lineToLine` is what the HUD stopwatch (pitTimer.js, from `pose.inPit`) will read when the car
 * is out, and `lossGreen = lineToLine − trackGreen` exactly.
 *
 * What each number measures - the `loss*` fields are net losses, never the line-to-line lane time
 * that f1db's pit_stop.time or a timing screen shows (F1M24-GAMEPLAY §1.6); the `lineToLine*`
 * fields are that line-to-line time:
 *
 *   lossGreen   seconds lost against staying out, under green: the lane at the limit with the
 *               braking into the box and the launch out of it, less the same stretch of track
 *               at race pace (quick mode: state.pitLane.stop, the loss both modes charge, SRS
 *               4.2; step mode: the car's own box and lap budget), plus `stopMedian`, plus
 *               `queueSec`
 *   lineToLine  the stopwatch: seconds from the entry line to the exit line, stop and queue
 *               included (= lossGreen + trackGreen). `lineToLineSc` / `lineToLineVsc` the same
 *               under a SC / VSC: the lane is driven at its limit either way, so they differ
 *               from `lineToLine` only by the quick mode's floor at zero loss
 *   trackGreen  seconds the same stretch (entry line → exit line) takes on the track: the car's
 *               pace (step) or `baseLap` (quick); `trackSc` / `trackVsc` at the SC / VSC pace
 *               (race-sim.json safetyCar lapFactor / virtualLapFactor)
 *   laneDrive   the driving part of `lineToLine` (no stop, no queue), from the profile
 *   extraLoss   the per-circuit correction inside the quick mode's loss (race-pit.json
 *               extraLoss); 0 in a step race, which drives the lane and charges no correction
 *   clock       "step" | "quick": which of the two clocks above; `lines` the timing lines
 *   lossSc      the same with the track stretch at safety-car pace (state.pitLane.sc), `lossVsc`
 *               at VSC pace: derived, not configured (§2.11). Whether the era has a SC or a VSC
 *               at all is `scAllowed` / `vscAllowed` (rules.raceControl)
 *   stopMedian  the typical stationary time for this car's crew and era (pitStop.js
 *               expectedStationary without the rare error), with the fuel of a refuelling era
 *   queueSec    a double stack: the team-mate stops on the same lap and is ahead on the road,
 *               so this car waits for its stop (0 otherwise)
 *   exitPos     the race position the car would rejoin in: rivals whose race time stays below
 *               this car's time + the loss (green, or SC/VSC while one is out); a rival that
 *               stops on the same lap is charged its own loss too
 *   teamMateSameLap      the team-mate stops at the end of the same lap
 *   distanceToPitEntry   metres from the car to the lane's entry along the track (null without
 *               a circuit: the quick mode passes `opts.circuit`)
 *
 * Options: `lap` (the in-lap; default the lap being run, state.lap + 1, as requestPit), `tyres`
 * (default: the era's rule), `refuelLaps` (default the strategist's load), `crew`, `circuit`,
 * `share` (the car's distance share of the lap; default the step simulator's own, or the line).
 * A missing car returns null; a race without a lane loss gives null losses and positions.
 */
export const previewPit = (state, carId, opts = {}) => {
  if (!state || !Array.isArray(state.cars)) return null;
  const index = state.cars.findIndex((entry) => entry.id === carId);
  const car = state.cars[index];
  if (!car) return null;
  const rules = rulesOfState(state);
  const lap = Number.isFinite(opts.lap) ? opts.lap : (state.lap ?? 0) + 1;
  const circuit = opts.circuit || state._sim?.lane?.circuit || null;
  const tyres = opts.tyres ?? rules.tyres?.changesInRace !== false;
  const fuelFor = (who) => (rules.refuelling ? refuelLapsFor(state, who, lap) : 0);
  const refuelLaps = rules.refuelling && Number.isFinite(opts.refuelLaps) ? opts.refuelLaps : fuelFor(car);
  const kgPerLap = state.fuelSpec?.kgPerLap ?? null;
  const stopOf = (who, laps) => expectedStationary({ rules, crew: (who === car ? opts.crew : undefined) ?? who.crew ?? undefined, tyres, refuelLaps: laps, kgPerLap, errors: false });
  const stopMedian = stopOf(car, refuelLaps);

  // The double stack: the team-mate in the box first makes this car wait for its whole stop.
  const mate = state.cars.find((other) => other.id !== car.id && other.teamId === car.teamId && isRunning(other));
  const teamMateSameLap = Boolean(mate && stopsOn(mate, lap));
  const mateFirst = teamMateSameLap && Number.isFinite(mate.time) && Number.isFinite(car.time) && mate.time < car.time;
  const queueSec = mateFirst ? stopOf(mate, fuelFor(mate)) : 0;

  // GS-15: the clock the stop will be timed on - the step simulator's own lane and box, or the
  // quick mode's charge - so the estimate is what the stopwatch will show (one definition).
  const clock = stopClockOf(state, circuit, index, car, queueSec > 0);
  const lane = clock && clock.mode === "step"
    ? { green: clock.drive - clock.track.green, sc: Math.max(0, clock.drive - clock.track.sc), vsc: Math.max(0, clock.drive - clock.track.vsc) }
    : laneLossesOf(state, circuit);
  const total = (laneLoss) => (laneLoss === null || laneLoss === undefined ? null : laneLoss + stopMedian + queueSec);
  const lossGreen = lane ? total(lane.green) : null;
  const lossSc = lane ? total(lane.sc) : null;
  const lossVsc = lane ? total(lane.vsc) : null;
  // Line to line = the net loss + the same stretch of track (the definition, both ways round).
  const lineOf = (loss, track) => (loss === null || !clock ? null : loss + track);
  const lineToLine = clock ? lineOf(lossGreen, clock.track.green) : null;
  const lineToLineSc = clock ? lineOf(lossSc, clock.track.sc) : null;
  const lineToLineVsc = clock ? lineOf(lossVsc, clock.track.vsc) : null;

  // Where it rejoins, with the condition on track now (a safety car out lowers everybody's loss).
  const neutral = state.safetyCar;
  const laneNow = lane ? (neutral ? (neutral.virtual ? lane.vsc : lane.sc) ?? lane.green : lane.green) : null;
  let exitPos = null;
  if (laneNow !== null && Number.isFinite(car.time)) {
    const after = car.time + laneNow + stopMedian + queueSec;
    const rivalLoss = (other) => (stopsOn(other, lap) ? laneNow + stopOf(other, fuelFor(other)) : 0);
    exitPos = 1 + state.cars.filter((other) => other.id !== car.id && (isRunning(other) || other.status === "finished") && Number.isFinite(other.time) && other.time + rivalLoss(other) < after).length;
  }

  let distanceToPitEntry = null;
  if (circuit && circuit.pit && circuit.pit.path) {
    const geo = laneGeometry(circuit);
    const lapMetres = (circuit.km || state.track?.km || 0) * 1000;
    if (lapMetres > 0) distanceToPitEntry = frac(geo.entry - shareOfCar(state, circuit, index, opts.share)) * lapMetres;
  }

  return {
    carId: car.id,
    lap,
    lossGreen,
    lossSc,
    lossVsc,
    stopMedian,
    queueSec,
    exitPos,
    teamMateSameLap,
    distanceToPitEntry,
    // The parts, so the dialog can say what the total is made of.
    laneGreen: lane ? lane.green : null,
    laneSc: lane ? lane.sc : null,
    laneVsc: lane ? lane.vsc : null,
    refuelLaps,
    tyres,
    scAllowed: Boolean(rules.raceControl?.safetyCar),
    vscAllowed: Boolean(rules.raceControl?.vsc),
    measures: "net",
    // GS-15: what the stopwatch will show, between the same two lines (timingLinesFor).
    lineToLine,
    lineToLineSc,
    lineToLineVsc,
    trackGreen: clock ? clock.track.green : null,
    trackSc: clock ? clock.track.sc : null,
    trackVsc: clock ? clock.track.vsc : null,
    laneDrive: clock ? clock.drive : null,
    extraLoss: clock ? clock.extra : null,
    clock: clock ? clock.mode : null,
    lines: clock ? clock.lines : null,
  };
};

// ------------------------------------------------------------ the garage exit (PIT-1, for sessions)

/** Metres along the lane of `box`: `{ metres }`, `{ slot, slots }` (stepRace's garages) or a share 0..1 (race.js car.boxSlot). */
const boxMetres = (geo, box) => {
  if (box && typeof box === "object") {
    if (Number.isFinite(box.metres)) return clamp(box.metres, 0, geo.total);
    if (Number.isFinite(box.slot) && Number.isFinite(box.slots)) return boxPosition(geo, box.slot, box.slots);
  }
  if (Number.isFinite(box)) return geo.slotFrom + (geo.slotTo - geo.slotFrom) * clamp(box, 0, 1);
  return boxPosition(geo, 0, 1);
};

/**
 * RF-WKD-02, RF-SIM-12 (PIT-1, part of `salida-boxes-sesion`, F1M24-GAMEPLAY.md §2.2): the drive
 * out of the lane from a team's box, on the same physical profile the race uses - from rest at
 * the box, up to the era's limit for this circuit and date (era-defaults.json pitLaneSpeed; none
 * before 1994: the lane's own speed), along the limited zone, out of the lane and along the
 * track's pit-side edge to the end of the white exit line (`exitLineTo`, PIT-2: pitLinesFor).
 * `laneEndS` / `toLaneEnd` mark where the lane itself ends; past it the car is on the track.
 *
 * `era`: rules, an era object or a year. `box`: see boxMetres (default: the middle garage).
 * Options: `circuitId`, `date`, `kmh` (overrides the rule), `baseLap` (the track pace the lane
 * blends into; default the trace's own lap).
 *
 * Returns { fromS, toS, metres, kmh, vLimit, T, toLimitEnd, N, step, s0, v, t, marks }: v[k] and
 * t[k] are the speed and the time since the release at `s0 + k × step` metres along the lane;
 * `garageExitAt` samples it. null for a circuit without a lane. Pure: no stream, no state.
 */
export const garageExitProfile = (circuit, era, box = null, opts = {}) => {
  if (!circuit || !circuit.pit || !circuit.pit.path) return null;
  const geo = laneGeometry(circuit);
  const rules = rulesFor(era);
  const circuitId = opts.circuitId ?? circuitIdOf({}, circuit.ref);
  const kmh = opts.kmh !== undefined ? opts.kmh : pitLaneSpeedFor(rules, { circuitId, date: opts.date ?? null });
  const baseLap = opts.baseLap ?? circuit.simulatedLap;
  const vLimit = limitSpeed(circuit, kmh, baseLap);
  const profile = buildProfile(circuit, { vLimit, baseLap, stopAt: boxMetres(geo, box) });
  const first = profile.stopIndex;
  const step = profile.step;
  const laneCells = Math.max(1, profile.N - first);
  // PIT-2: past the lane's end, along the track's pit-side edge to the end of the white line
  // (pitLinesFor), accelerating on the traction limit up to the track's own speed.
  const lines = pitLinesFor(circuit);
  const past = lines ? lines.exit.pastLaneEnd : 0;
  const extra = past > 0 ? Math.max(1, Math.round(past / step)) : 0;
  const N = laneCells + extra;
  const v = new Float64Array(N + 1);
  const t = new Float64Array(N + 1);
  for (let k = 0; k <= laneCells; k += 1) {
    v[k] = profile.v[first + k];
    t[k] = profile.t[first + k] - profile.t[first];
  }
  if (extra > 0) {
    const lap = lapMetresOf(circuit);
    const scale = trackScale(circuit, baseLap);
    for (let k = laneCells + 1; k <= N; k += 1) {
      const d = lines.exit.laneEndShare + ((k - laneCells) * step) / lap;
      const v0 = v[k - 1];
      v[k] = Math.min(traceSpeedAt(circuit, d) * scale, Math.sqrt(v0 * v0 + 2 * accelAt(v0) * step));
      const mean = v0 + v[k];
      t[k] = t[k - 1] + (mean > 1e-9 ? (2 * step) / mean : 0);
    }
  }
  const shape = { v, t, N, step };
  return {
    fromS: first * step,
    toS: first * step + N * step,
    metres: N * step,
    kmh,
    vLimit,
    T: t[N],
    toLimitEnd: timeAtS(shape, clamp(geo.limitToS - first * step, 0, laneCells * step)),
    toLaneEnd: t[laneCells],
    N,
    step,
    s0: first * step,
    laneEndS: (first + laneCells) * step,
    laneEndShare: lines ? lines.exit.laneEndShare : frac(circuit.pit.exit),
    lapMetres: lapMetresOf(circuit),
    exitLineShare: lines ? lines.exit.toShare : null,
    v,
    t,
    marks: extra > 0 ? "exitLine" : "laneEnd",
  };
};

/**
 * Where the car is `elapsed` seconds after the release, on a garageExitProfile: metres `s` along
 * the lane (past `laneEndS` it is on the track: `onTrack`, at lap distance share `share`, still on
 * the pit-side edge, lane PIT_EXIT, until the white line ends), its speed and whether it is done.
 */
export const garageExitAt = (exit, elapsed) => {
  const at = sampleProfile(exit, elapsed);
  const s = exit.s0 + at.s;
  const laneEnd = Number.isFinite(exit.laneEndS) ? exit.laneEndS : Infinity;
  const onTrack = s > laneEnd + 1e-9;
  const share = onTrack && exit.lapMetres > 0 ? frac(exit.laneEndShare + (s - laneEnd) / exit.lapMetres) : null;
  return { s, v: at.v, done: elapsed >= exit.T, onTrack, share, lane: onTrack || s >= laneEnd - 1e-9 ? "PIT_EXIT" : "PIT" };
};

// ------------------------------------------------------------ the white lines (PIT-2)

const EXIT_LINE = LANE.exitLine;
const linesCache = new WeakMap();

/** The circuit's lap length in metres (the built geometry's, or its km). */
const lapMetresOf = (circuit) => (circuit.length > 0 ? circuit.length : (circuit.km || 0) * 1000);

/** Index of the trace sample at or before distance share `x`. */
const traceIndexAt = (circuit, x) => {
  const shares = circuit.distShare;
  let lo = 0;
  let hi = shares.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (shares[mid] <= x) lo = mid;
    else hi = mid;
  }
  return lo;
};

/** The reviewed marks of a mesh lane in data/splines.json (`pit.exitLineTo`, a lap share), or null. */
const reviewedPitOf = (circuit) => {
  if (!circuit.pit || circuit.pit.source !== "mesh") return null;
  const id = circuit.splineId || (typeof circuit.id === "string" && circuit.id.startsWith("spline:") ? circuit.id.slice(7) : null);
  return id ? calibrated.splines?.[id]?.pit || null : null;
};

/**
 * Metres of white line past the lane's end, from the geometry: along the speed trace from where
 * the lane meets the track to the first braking (speed `brakeDropKmh` under the stretch's best),
 * between `minMetres` and `maxMetres` (race-pit.json pitLane.exitLine).
 */
const derivedLineMetres = (circuit, fromShare, lap) => {
  const shares = circuit.distShare;
  const speed = circuit.speed;
  const n = speed.length;
  const drop = EXIT_LINE.brakeDropKmh * KMH;
  let k = traceIndexAt(circuit, fromShare) % n;
  let metres = 0;
  let best = speed[k];
  for (let guard = 0; guard < n && metres < EXIT_LINE.maxMetres; guard += 1) {
    const next = (k + 1) % n;
    const span = next === 0 ? 1 - shares[k] + shares[0] : shares[next] - shares[k];
    metres += span * lap;
    if (speed[next] < best - drop) break;
    if (speed[next] > best) best = speed[next];
    k = next;
  }
  return clamp(metres, EXIT_LINE.minMetres, EXIT_LINE.maxMetres);
};

/**
 * RF-SIM-12, RF-SIM-10 (PIT-2, incorporacion-pit; F1M24-GAMEPLAY.md §2.2): the pit lane's white
 * lines (FIA ISC Appendix L, ch. IV, 4(d) entry, 6(c) exit), as lap distance shares:
 *
 *   exit.fromShare     where the lane meets the track's edge (the lane's exitBlend mark)
 *   exit.laneEndShare  where the lane's path ends (circuit.pit.exit)
 *   exit.toShare       exitLineTo: the end of the painted line - data/splines.json pit.exitLineTo
 *                      (reviewed by hand) or derived from the geometry (derivedLineMetres)
 *   exit.metres        the line's length; exit.pastLaneEnd its metres beyond the lane's end
 *   entry.fromShare    where the lane leaves the track; entry.toLaneS the lane's entryLine mark,
 *                      metres along the lane (the part of the lane the entry line runs beside)
 *   side               +1 / −1, the side of the track the lane is on (circuit.pit.side)
 *
 * null for a circuit without a lane. Pure and cached per circuit.
 */
export const pitLinesFor = (circuit) => {
  if (!circuit || !circuit.pit || !circuit.pit.path || !circuit.distShare || !circuit.speed) return null;
  if (linesCache.has(circuit)) return linesCache.get(circuit);
  const lap = lapMetresOf(circuit);
  if (!(lap > 0)) return null;
  const geo = laneGeometry(circuit);
  const pit = circuit.pit;
  const laneEndShare = frac(pit.exit);
  const fromShare = frac(laneEndShare - Math.max(0, geo.total - geo.exitBlendS) / lap);
  const reviewed = reviewedPitOf(circuit);
  let pastLaneEnd;
  let source;
  if (reviewed && Number.isFinite(reviewed.exitLineTo)) {
    const ahead = frac(reviewed.exitLineTo - laneEndShare) * lap;
    pastLaneEnd = ahead < lap / 2 ? ahead : 0;
    source = "spline";
  } else {
    pastLaneEnd = derivedLineMetres(circuit, laneEndShare, lap);
    source = "derived";
  }
  const toShare = frac(laneEndShare + pastLaneEnd / lap);
  const marks = pitMarksFor(circuit);
  const entryLine = marks && Number.isFinite(marks.entryLine) ? clamp(marks.entryLine, 0, 1) : 0;
  const out = {
    exit: { fromShare, laneEndShare, toShare, metres: frac(toShare - fromShare) * lap, pastLaneEnd },
    entry: { fromShare: frac(pit.entry), toLaneS: entryLine * geo.total },
    side: pit.side < 0 ? -1 : 1,
    lapMetres: lap,
    source,
  };
  linesCache.set(circuit, out);
  return out;
};

/**
 * The lateral offset (metres, + = right of travel, the sense of engine/trackData.js `line`) of a
 * car keeping to the pit side of the track at lap share `share`: the measured half width on that
 * side less the car's margin (splines.json, trackData marginM). Where a car on lane PIT_EXIT runs.
 */
export const pitExitLateral = (circuit, share) => {
  const data = trackDataFor(circuit);
  const n = circuit.points.length;
  const i = traceIndexAt(circuit, frac(share)) % n;
  const side = circuit.pit && circuit.pit.side < 0 ? -1 : 1;
  const half = side > 0 ? data.wr[i] : data.wl[i];
  return side * Math.max(0, half - data.marginM);
};

const RACING = { lane: "RACING", lateral: null, merged: true, onLine: false, vCap: null, yieldTo: null, gapBehind: null };

/**
 * RF-SIM-12, RF-SIM-07 (PIT-2): one step of a car leaving the pit lane, for the step simulator
 * (and the view). `me` = { id, share (lap distance share), v (m/s), merged }; `traffic` = the cars
 * on the track (not in the lane) as { id, share, v }. Returns
 *
 *   lane      "PIT_EXIT" while the car is on the white line or waiting at its end; "RACING" once in
 *   lateral   the pit-side offset to hold (pitExitLateral) on PIT_EXIT; null once merged
 *   onLine    still beside the white line (before exitLineTo): never on the racing line
 *   merged    true from the step it takes the racing line: the caller keeps it (me.merged)
 *   vCap      m/s while yielding (the car behind's speed − liftKmh), else null
 *   yieldTo   the car it lets by; gapBehind the metres to the nearest car behind
 *
 * At the end of the line it takes the racing line only when the nearest car behind on the track
 * (up to lookBehindMetres) is mergeGapMetres or more away; otherwise it lifts and slots in behind.
 * Pure: no stream, no state (RF-SIM-15, RNF-05). A circuit without lines merges at once.
 */
export const pitExitStep = (circuit, me, traffic = []) => {
  const lines = pitLinesFor(circuit);
  if (!lines || !me || me.merged || !Number.isFinite(me.share)) return { ...RACING, merged: true };
  const lap = lines.lapMetres;
  const here = frac(me.share);
  const along = frac(here - lines.exit.fromShare) * lap;
  // More than half a lap past the line's start: not leaving this lane any more.
  if (along > lap / 2) return { ...RACING };
  const lateral = pitExitLateral(circuit, here);
  const base = { lane: "PIT_EXIT", lateral, along, toGo: Math.max(0, lines.exit.metres - along) };
  if (along < lines.exit.metres) return { ...base, onLine: true, merged: false, vCap: null, yieldTo: null, gapBehind: null };
  let nearest = null;
  for (let k = 0; k < traffic.length; k += 1) {
    const other = traffic[k];
    if (!other || other.id === me.id || !Number.isFinite(other.share)) continue;
    const behind = frac(here - frac(other.share)) * lap;
    if (!(behind > 0) || behind > EXIT_LINE.lookBehindMetres) continue;
    if (!nearest || behind < nearest.behind) nearest = { id: other.id, behind, v: other.v };
  }
  if (!nearest || nearest.behind >= EXIT_LINE.mergeGapMetres) {
    return { ...RACING, along, gapBehind: nearest ? nearest.behind : null };
  }
  const theirs = Number.isFinite(nearest.v) ? nearest.v : me.v;
  return { ...base, onLine: false, merged: false, vCap: Math.max(0, theirs - EXIT_LINE.liftKmh * KMH), yieldTo: nearest.id, gapBehind: nearest.behind };
};

/** Is pit-lane line offence `offence` ("pitExitLine" / "pitEntryLine") judged in `year`? Not while its year is pending. */
export const pitLineOffenceInForce = (offence, year) => {
  const spec = raceBalance.penalties.offences[offence];
  return Boolean(spec) && Number.isFinite(spec.from) && Number.isFinite(year) && year >= spec.from;
};

/**
 * RF-SIM-10 (PIT-2): does `car` cross the white line on this exit (or entry)? The chance per pass
 * (race-eras.json penalties.offences) scaled by the driver's aggression (skills.js skillZ). Draws
 * exactly one number from `stream` when the offence is judged in `year`, none otherwise - so while
 * its year is pending no seed changes (RNF-05). The caller investigates a true answer.
 */
export const pitLineOffence = (stream, car, year, offence = "pitExitLine") => {
  if (!pitLineOffenceInForce(offence, year)) return false;
  const spec = raceBalance.penalties.offences[offence];
  const per = offence === "pitEntryLine" ? spec.chancePerEntry : spec.chancePerExit;
  const chance = per * Math.max(0, 1 + skillZ(car, "aggression") * spec.aggressionPerZ);
  return stream.next() < chance;
};
