/**
 * Power unit, gearbox and the car's inertia (RF-SIM-01, RF-SIM-02, RF-DEV-01; docs/manager/SIM-FISICA.md
 * §7, block "Unidad de potencia, marchas e inercia"; tunables in data/balance/race-powertrain.json, RNF-07).
 *
 * What it does, per era (SRS 6.2: nothing outside its era):
 *   - the engine: rev limit, where it shifts, power against rpm (a flat top above the fuel-flow
 *     knee since 2014), engine braking and, with KERS/ERS, the MGU-K harvesting off the throttle;
 *   - the gearbox: 5 to 8 gears, ratios fitted to the circuit's top speed until 2013 and, from 2014,
 *     to the season's fastest circuit (eight ratios fixed for the year, F1 TR 2014 art. 9.6);
 *     gear and rpm along the speed trace the step simulation runs (engine/sim/physics.js);
 *   - throttle, brake and coasting read off the speed the car actually does, so the view sees a
 *     real pedal trace; longitudinal and lateral g, weight transfer, pitch and roll;
 *   - two shapes of the trace that give the time back inside the same lap (SRS 4.2: the quick
 *     mode's lap time is unchanged): the traction-limited launch from the grid, and lift and coast
 *     before the braking zones on the lean fuel mix (its time is the quick mode's lean mix time);
 *   - per power unit (docs/manager/F1M24-GAMEPLAY.md §2.4 `tren-por-pu`, package PT-1): the era's
 *     `manufacturers{}` overrides of the shift point and the gear shape, measured per team in
 *     OpenF1 car_data 2023-25 (a car gets them through `assignPowerUnits`); the pit limiter's fixed
 *     gear (`eras[].pitLimiter`, the `pitLane` option of updateDrive) and the earlier upshift under
 *     the safety car (`shift.underSc`, the `underSc` option). Where a value is "pending" or the
 *     caller passes nothing, the car shifts as before.
 *
 * Determinism (RF-SIM-15, RNF-05): no random draws at all, and only + − × ÷ and Math.sqrt (no pow,
 * exp or trig), so every number is the same bit for bit in every JS engine.
 */

import data from "../../data/balance/race-powertrain.json";
import { carFor, physicsData, topSpeedOf } from "./physics";

export const POWERTRAIN = data;

const KMH = 3.6;
const G = physicsData.constants.g;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
// A sourced number, not "pending" (F1M24-GAMEPLAY §1.4: unmeasured values stay out of the sim).
const measured = (x) => typeof x === "number" && Number.isFinite(x);

// ------------------------------------------------------------------ era and gearbox

/** The era block a year falls in (contiguous blocks; outside them the nearest one). */
export const eraOf = (year = 2020, table = data) => {
  const eras = table.eras;
  const found = eras.find((era) => year >= era.from && year <= era.to);
  if (found) return found;
  return year < eras[0].from ? eras[0] : eras[eras.length - 1];
};

/**
 * Speed per rpm of each gear as a share of the top gear's, for a box of `gears`: the measured
 * eight-speed shape (gearShape.shares, OpenF1 2024) resampled linearly to that many gears.
 */
export const gearShares = (gears, shape = data.gearShape.shares) => {
  const out = new Float64Array(gears);
  const last = shape.length - 1;
  for (let g = 0; g < gears; g += 1) {
    const x = gears === 1 ? last : (g * last) / (gears - 1);
    const i = Math.min(last - 1, Math.floor(x));
    const f = x - i;
    out[g] = shape[i] + (shape[i + 1] - shape[i]) * f;
  }
  out[gears - 1] = 1;
  return out;
};

/** The circuit with the least downforce in race-physics.json: the season's fastest straight. */
const lowestDownforceRef = () => {
  const table = physicsData.downforce.byLayoutRef;
  let best = null;
  Object.keys(table).forEach((ref) => {
    if (best === null || table[ref] < table[best]) best = ref;
  });
  return best;
};

/**
 * The key of a power unit in `eras[].manufacturers`: the pack's engine manufacturer id
 * ("honda-rbpt") or its name ("Honda RBPT", as packWorld.js keeps it on team.engines), lower case
 * with dashes. Null for nothing.
 */
export const manufacturerKey = (name) => {
  if (name === null || name === undefined) return null;
  const key = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return key || null;
};

/**
 * The era's override for a power unit (`sameAs` followed once), or null when the era has none for
 * it (every era before 2022, and a manufacturer nobody measured): the car keeps the era's values.
 */
export const manufacturerOf = (era, name) => {
  const table = era && era.manufacturers;
  const key = manufacturerKey(name);
  if (!table || !key || key === "$comment") return null;
  let entry = table[key] || null;
  if (entry && entry.sameAs) entry = table[entry.sameAs] || null;
  return entry && measured(entry.shiftRpm) ? entry : null;
};

/** The share of the shift rpm the cars upshift at under the safety car in `year` (1: none measured). */
export const scShiftShareOf = (year) => {
  const spans = (data.shift.underSc && data.shift.underSc.spans) || [];
  const span = spans.find((entry) => year >= entry.from && year <= entry.to);
  return span && measured(span.shiftRpmShare) ? span.shiftRpmShare : 1;
};

/** The era's pit limiter: { gear, rpm } when both are measured, else null (the box shifts as on track). */
export const pitLimiterOf = (era) => {
  const limiter = era && era.pitLimiter;
  if (!limiter || !Number.isInteger(limiter.gear) || !measured(limiter.rpm)) return null;
  if (limiter.gear < 1 || limiter.gear > era.gearbox.gears) return null;
  return { gear: limiter.gear, rpm: limiter.rpm };
};

/**
 * The power unit and gearbox of a car of `year` at a circuit (`layoutRef` for its downforce level),
 * with the ratios fitted to `circuitTop` (m/s, the circuit's reference top speed) until 2013 and to
 * the season's fastest circuit since 2014 (gearbox.ratios "perSeason"). `fuelKg` the fuel on board
 * for the mass (default: the era's race start load, `raceFuelKg`). `manufacturer` the car's engine
 * manufacturer (id or name): its measured shift point and gear shape where the era has them
 * (F1M24-GAMEPLAY §2.4 `tren-por-pu`); the top gear's ratio stays the era's fit.
 */
export const powertrainFor = ({ year = 2020, layoutRef = null, circuitTop = null, fuelKg = null, manufacturer = null } = {}) => {
  const era = eraOf(year);
  const car = carFor({ year, layoutRef, fuelKg: fuelKg === null ? era.raceFuelKg : fuelKg });
  const { engine, gearbox, chassis } = era;
  const fit = data.fit;
  const perSeason = gearbox.ratios === "perSeason";
  const vFit = perSeason || !(circuitTop > 0)
    ? topSpeedOf(carFor({ year, layoutRef: lowestDownforceRef() })) * fit.seasonTopShare
    : circuitTop * (1 + fit.towMargin);
  const topPerRpm = vFit / gearbox.topGearRpm;
  const pu = manufacturerOf(era, manufacturer);
  const base = gearShares(gearbox.gears);
  const own = pu && Array.isArray(pu.gearShares) && pu.gearShares.length === gearbox.gears ? pu.gearShares : null;
  const shares = own ? Float64Array.from(base, (share, g) => (measured(own[g]) ? own[g] : share)) : base;
  const speedPerRpm = Float64Array.from(shares, (share) => share * topPerRpm);
  const limiter = pitLimiterOf(era);
  return {
    year,
    // How it was built, so assignPowerUnits can build the same car with another power unit.
    args: { year, layoutRef, circuitTop, fuelKg },
    manufacturer: pu ? manufacturerKey(manufacturer) : null,
    gears: gearbox.gears,
    ratios: gearbox.ratios,
    speedPerRpm,
    limitRpm: engine.limitRpm,
    shiftRpm: pu ? pu.shiftRpm : engine.shiftRpm,
    // F1M24-GAMEPLAY §2.4: upshift share under the safety car, the pit limiter's gear (0: none) and rpm.
    scShiftShare: scShiftShareOf(year),
    pitGear: limiter ? limiter.gear : 0,
    pitRpm: limiter ? limiter.rpm : 0,
    pitHoldShare: data.shift.pitLaneHoldShare,
    downRpm: engine.downRpm,
    floorRpm: engine.floorRpm,
    idleRpm: engine.idleRpm,
    launchRpm: engine.launchRpm,
    curve: engine.curve,
    frictionW: engine.frictionKw * 1000,
    harvestW: engine.harvestKw * 1000,
    power: car.power,
    mass: car.mass,
    drag: (0.5 * car.rho * car.CdA) / car.mass,
    lift: (0.5 * car.rho * car.ClA) / car.mass,
    roll: car.crr * car.g,
    brakeMax: car.brakeMax,
    launchMu: era.launchMu,
    wheelbase: chassis.wheelbaseM,
    cgHeight: chassis.cgHeightM,
    frontShare: chassis.frontShare,
    pitchPerG: chassis.pitchDegPerG,
    rollPerG: chassis.rollDegPerG,
    brakingG: data.shift.brakingG,
    accelSec: data.smoothing.accelSec,
  };
};

// ------------------------------------------------------------------ engine

/** Engine rpm in `gear` (1-based) at speed v (m/s), between idle and the limiter. */
export const rpmOf = (pt, gear, v) => {
  const rpm = v / pt.speedPerRpm[gear - 1];
  return rpm < pt.idleRpm ? pt.idleRpm : rpm > pt.limitRpm ? pt.limitRpm : rpm;
};

/** Share of peak power at `rpm` (engine.curve: [rpm / limit, share] points, linear between). */
export const powerShareAt = (pt, rpm) => {
  const x = rpm / pt.limitRpm;
  const c = pt.curve;
  if (x <= c[0][0]) return c[0][1] * (x / c[0][0]);
  for (let k = 1; k < c.length; k += 1) {
    if (x <= c[k][0]) return c[k - 1][1] + ((c[k][1] - c[k - 1][1]) * (x - c[k - 1][0])) / (c[k][0] - c[k - 1][0]);
  }
  return c[c.length - 1][1];
};

/**
 * Deceleration (m/s², positive) off the throttle and off the brakes at v and rpm: drag, rolling
 * resistance, engine braking (friction and pumping, rising with rpm) and the MGU-K harvesting.
 */
export const coastDecel = (pt, v, rpm = pt.shiftRpm) => {
  const u = v > 1 ? v : 1;
  const engineW = pt.frictionW * (rpm / pt.limitRpm) + pt.harvestW;
  return pt.drag * u * u + pt.roll + engineW / (pt.mass * u);
};

/**
 * Next gear from `gear` at speed v with longitudinal acceleration `a` (m/s², smoothed): up at the
 * era's shift rpm on the power, down under braking (or coasting) while the gear below stays under
 * the era's downshift rpm, and never lugging below the floor on the power. `up`: the upshift rpm
 * (default the car's own; lower under the safety car and in the pit lane, see updateDrive).
 */
export const shiftGear = (pt, gear, v, a, up = pt.shiftRpm) => {
  let g = gear < 1 ? 1 : gear > pt.gears ? pt.gears : gear;
  const per = pt.speedPerRpm;
  if (a >= 0) {
    while (g < pt.gears && v / per[g - 1] >= up) g += 1;
    while (g > 1 && v / per[g - 1] < pt.floorRpm && v / per[g - 2] < up) g -= 1;
  } else {
    while (g < pt.gears && v / per[g - 1] > pt.limitRpm) g += 1;
    if (-a >= pt.brakingG * G) while (g > 1 && v / per[g - 2] <= pt.downRpm) g -= 1;
    else while (g > 1 && v / per[g - 1] < pt.floorRpm && v / per[g - 2] <= pt.downRpm) g -= 1;
  }
  return g;
};

/**
 * Pedals from the speed the car does: the force it needs (m·a + drag + rolling) against what the
 * engine gives at that rpm (`powerShare`: the car's own share of the era's best, from its pace)
 * or, slowing, against coasting and the brakes. Returns { throttle, brake } in 0..1.
 */
export const pedalsOf = (pt, v, a, rpm, powerShare = 1) => {
  const u = v > 1 ? v : 1;
  const need = a + pt.drag * u * u + pt.roll;
  if (need >= 0) {
    const available = (pt.power * powerShare * powerShareAt(pt, rpm)) / pt.mass;
    return { throttle: available > 0 ? clamp01((need * u) / available) : 0, brake: 0 };
  }
  // Slowing more than drag alone: engine braking and harvesting first, then the brakes.
  const coast = coastDecel(pt, u, rpm);
  if (-a <= coast) return { throttle: 0, brake: 0 };
  const grip = pt.brakeMax + pt.drag * u * u;
  return { throttle: 0, brake: clamp01((-a - coast) / grip) };
};

/**
 * Traction-limited launch acceleration (m/s²) at v: the rear axle's grip with the load it gains
 * accelerating (a = μ·(g + q·v²)·(1 − f) / (1 − μ·h/L), μ the era's launchMu), against power over speed, less drag.
 */
export const launchAccel = (pt, v) => {
  const mu = pt.launchMu;
  const rear = 1 - pt.frontShare;
  const transfer = 1 - (mu * pt.cgHeight) / pt.wheelbase;
  const traction = (mu * rear * (G + pt.lift * v * v)) / (transfer > 0.2 ? transfer : 0.2);
  const u = v > 1 ? v : 1;
  const power = pt.power / (pt.mass * u);
  return (traction < power ? traction : power) - pt.drag * v * v - pt.roll;
};

/** Body motion from the accelerations (g): pitch (deg, + nose down), roll (deg, + to the outside), front load share. */
export const bodyOf = (pt, lonG, latG) => ({
  pitch: -lonG * pt.pitchPerG,
  roll: latG * pt.rollPerG,
  front: pt.frontShare - (pt.cgHeight / pt.wheelbase) * lonG,
});

// ------------------------------------------------------------------ circuit tables

/**
 * Curvature (1/m, + left) per distance bin of a circuit (M bins), from its heading along the
 * lap, smoothed over ±3 samples: lateral g = v²·κ / g. Heading jumps of 2π are unwrapped.
 */
export const curvatureBins = (circuit, M) => {
  const H = circuit.heading;
  const dist = circuit.dist;
  const out = new Float64Array(M);
  if (!H || !dist || H.length < 4) return out;
  const n = H.length;
  const length = circuit.length || dist[n - 1];
  const twoPi = 2 * Math.PI;
  const raw = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    let dh = H[j] - H[i];
    while (dh > Math.PI) dh -= twoPi;
    while (dh < -Math.PI) dh += twoPi;
    const ds = j === 0 ? length - dist[i] + (dist[0] || 0) : dist[j] - dist[i];
    raw[i] = ds > 1e-6 ? dh / ds : 0;
  }
  const smooth = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    for (let k = -3; k <= 3; k += 1) sum += raw[(i + k + n) % n];
    smooth[i] = sum / 7;
  }
  let s = 0;
  for (let b = 0; b < M; b += 1) {
    const at = ((b + 0.5) / M) * length;
    while (s < n - 1 && dist[s + 1] <= at) s += 1;
    out[b] = smooth[s];
  }
  return out;
};

/**
 * Lift and coast for the lean fuel mix (race-powertrain.json liftCoast): the braking points of the
 * circuit's reference trace (`tables.vRef` per time-share bin) that end a long straight, and the
 * lift distance at which coasting there loses the quick mode's lean-mix time `credit` (s) on the
 * reference lap. Returns { zoneOf (bin -> zone + 1, 0 outside), zones: [{ loss }], liftMetres, loss }
 * or null when nothing on the circuit qualifies.
 */
export const coastPlan = (tables, pt, credit) => {
  const { M, vRef, traceLap } = tables;
  if (!traceLap || !(credit > 0)) return null;
  const cfg = data.liftCoast;
  const metres = new Float64Array(M);
  for (let j = 0; j < M; j += 1) metres[j] = (vRef[j] * traceLap) / M;
  // Braking points: a local peak of the trace with a real drop after it and a long run before.
  const points = [];
  for (let j = 0; j < M; j += 1) {
    const prev = vRef[(j - 1 + M) % M];
    const next = vRef[(j + 1) % M];
    if (!(vRef[j] >= prev && vRef[j] > next)) continue;
    let k = j;
    let drop = vRef[j];
    for (let s = 0; s < M / 8; s += 1) {
      k = (k + 1) % M;
      if (vRef[k] < drop) drop = vRef[k];
      else break;
    }
    if (drop > vRef[j] * 0.85) continue;
    // The straight: back from the peak while the trace keeps rising.
    let run = 0;
    let b = j;
    for (let s = 0; s < M; s += 1) {
      const a = (b - 1 + M) % M;
      if (vRef[a] > vRef[b]) break;
      run += metres[a];
      b = a;
    }
    if (run >= cfg.minStraightMetres) points.push({ peak: j, run });
  }
  if (!points.length) return null;
  /** Coast from `lift` metres before the peak: the lap time lost, and the bins it covers. */
  const coastOf = (point, lift, mark = null, zone = 0) => {
    const reach = Math.min(lift, point.run * cfg.maxShareOfStraight);
    let back = 0;
    let j = point.peak;
    while (back < reach) {
      j = (j - 1 + M) % M;
      back += metres[j];
    }
    // Lift at the start of bin j at the trace's speed there, then coast bin by bin until the
    // trace (by then its braking curve) is no faster than the coasting car.
    let v = vRef[j];
    let lost = 0;
    for (let s = 0; s < M; s += 1) {
      const d = metres[j];
      const ref = vRef[j];
      const next = v * v - 2 * coastDecel(pt, v) * d;
      const u = next > 1 ? Math.sqrt(next) : 1;
      const mean = (v + u) / 2;
      if (s > 0 && ref <= mean) break;
      if (mark) mark[j] = zone;
      if (ref > mean) lost += d / mean - d / ref;
      v = u;
      j = (j + 1) % M;
    }
    return lost;
  };
  const total = (lift) => points.reduce((sum, point) => sum + coastOf(point, lift), 0);
  let lo = 0;
  let hi = cfg.searchMaxMetres;
  if (total(hi) < credit) lo = hi;
  else {
    for (let it = 0; it < 30; it += 1) {
      const mid = (lo + hi) / 2;
      if (total(mid) < credit) lo = mid;
      else hi = mid;
    }
  }
  const lift = lo === hi ? lo : (lo + hi) / 2;
  const zoneOf = new Uint8Array(M);
  const zones = points.slice(0, 254).map((point, k) => ({ loss: coastOf(point, lift, zoneOf, k + 1) }));
  return { zoneOf, zones, liftMetres: lift, loss: zones.reduce((sum, zone) => sum + zone.loss, 0) };
};

// ------------------------------------------------------------------ per-car state

/** Typed per-car arrays for the step simulation (all zero: gear 1 on the grid). */
export const createDrive = (n) => ({
  gear: new Int8Array(n).fill(1),
  rpm: new Float64Array(n),
  throttle: new Float64Array(n),
  brake: new Float64Array(n),
  lonA: new Float64Array(n),
  latA: new Float64Array(n),
  vPrev: new Float64Array(n),
  // Share of the era's peak power this car has this lap (from its pace against the trace).
  powerShare: new Float64Array(n).fill(1),
  // Launch: 1 until the car reaches the speed of the trace, with its own launch speed.
  launching: new Uint8Array(n),
  vLaunch: new Float64Array(n),
  // Lift and coast: zone being coasted (0 none), coasting speed, the zone already credited.
  coastZone: new Uint8Array(n),
  vCoast: new Float64Array(n),
  coasting: new Uint8Array(n),
  // 1 while the car is actually off the throttle in a lift zone this step (pedals for the view).
  lifted: new Uint8Array(n),
  // RF-SIM-04: the engine's load (0..1), the power the speed asks for over what the engine gives
  // (pedalsOf) - the fuel flow follows it, not the pedal the view shows (engine/energy.js).
  load: new Float64Array(n),
  // Time owed against the lap's budget (s): + behind (launch, coast), repaid within the lap.
  debt: new Float64Array(n),
  allowance: new Float64Array(n),
});

/**
 * F1M24-GAMEPLAY §2.4 `tren-por-pu`: each car's own power unit. `manufacturers[i]` is car i's
 * engine manufacturer (pack id or name, or null); a car whose manufacturer the era measured gets
 * a powertrain with its shift point and gear shape (one per manufacturer, shared), the others the
 * field's `pt` itself. Stored on `drive.pts`, which updateDrive reads; without it every car uses `pt`.
 */
export const assignPowerUnits = (pt, drive, manufacturers = []) => {
  const era = eraOf(pt.year);
  const built = {};
  drive.pts = manufacturers.map((name) => {
    const key = manufacturerKey(name);
    if (!manufacturerOf(era, key)) return pt;
    if (!built[key]) built[key] = powertrainFor({ ...(pt.args || { year: pt.year }), manufacturer: key });
    return built[key];
  });
  return drive.pts;
};

/**
 * After a car moved one step: its gear, rpm and pedals from its speed `v` (m/s) and the
 * curvature `kappa` (1/m) where it is. `coast`: lifted in a lift-and-coast zone (no pedals);
 * `stopped`: in its box; `full`: where the reference trace accelerates (full throttle).
 * F1M24-GAMEPLAY §2.4 / §1.7 (PT-1), both optional (absent: shifts as on a green track):
 * `pitLane`: moving in the pit lane with the limiter on - at the limiter's speed the car holds the
 * era's limiter gear (eras[].pitLimiter), and pulling away from its box it upshifts at the limiter
 * rpm up to that gear; `underSc`: behind the safety car - upshifts at shift.underSc of the shift rpm.
 * A car given its own power unit (assignPowerUnits) shifts with it instead of `pt`.
 */
export const updateDrive = (pt0, drive, i, v, kappa, dt, { coast = false, stopped = false, full = false, pitLane = false, underSc = false } = {}) => {
  const pt = drive.pts && drive.pts[i] ? drive.pts[i] : pt0;
  const raw = (v - drive.vPrev[i]) / dt;
  drive.vPrev[i] = v;
  const k = dt / (pt.accelSec + dt);
  drive.lonA[i] += (raw - drive.lonA[i]) * k;
  drive.latA[i] += (v * v * kappa - drive.latA[i]) * k;
  if (stopped || v < 0.5) {
    drive.gear[i] = stopped ? 0 : 1;
    drive.rpm[i] = pt.idleRpm;
    drive.throttle[i] = 0;
    drive.brake[i] = stopped ? 1 : 0;
    drive.load[i] = 0;
    return;
  }
  const a = drive.lonA[i];
  const from = drive.gear[i] > 0 ? drive.gear[i] : 1;
  let gear;
  if (pitLane && pt.pitGear > 0 && v <= pt.pitRpm * pt.speedPerRpm[pt.pitGear - 1] * pt.pitHoldShare) {
    const pick = shiftGear(pt, from, v, a, pt.pitRpm);
    gear = pick > pt.pitGear ? pt.pitGear : pick;
  } else {
    gear = shiftGear(pt, from, v, a, underSc ? pt.shiftRpm * pt.scShiftShare : pt.shiftRpm);
  }
  drive.gear[i] = gear;
  const rpm = rpmOf(pt, gear, v);
  drive.rpm[i] = drive.launching[i] && gear === 1 && rpm < pt.launchRpm ? pt.launchRpm : rpm;
  if (coast) {
    drive.throttle[i] = 0;
    drive.brake[i] = 0;
    drive.load[i] = 0;
    return;
  }
  const pedals = pedalsOf(pt, v, a, drive.rpm[i], drive.powerShare[i]);
  drive.load[i] = pedals.throttle;
  // Where the reference trace accelerates the car is on full power (the trace's own definition).
  drive.throttle[i] = full && a > 0 ? 1 : pedals.throttle;
  drive.brake[i] = pedals.brake;
};

/** The snapshot fields of car `i` (RF-SIM-01; the view reads them for body motion and the dash). */
export const driveSnapshot = (pt, drive, i) => {
  const lonG = drive.lonA[i] / G;
  const latG = drive.latA[i] / G;
  const body = bodyOf(pt, lonG, latG);
  return {
    gear: drive.gear[i],
    rpm: Math.round(drive.rpm[i]),
    throttle: drive.throttle[i],
    brake: drive.brake[i],
    lonG,
    latG,
    pitch: body.pitch,
    roll: body.roll,
    frontLoad: body.front,
  };
};

export const toKmh = (v) => v * KMH;
