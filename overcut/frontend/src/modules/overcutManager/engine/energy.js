/**
 * Energy and fuel by era (RF-SIM-04, RF-SIM-05, RF-CMD-01; docs/manager/SIM-FISICA.md §7, block
 * "Energía y combustible"; tunables and their sources in data/balance/race-energy.json, RNF-07).
 * Both race modes read it (SRS 4.2): the quick mode for the fuel on board in kg, what each kg costs
 * a lap and the race's fuel limit; the step mode also for the energy store and the fuel flow it
 * measures step by step.
 *
 *   fuel     the circuit's fuel per lap is the flow of the era's engine along the circuit's speed
 *            trace (the gear, rpm and pedals the step simulation drives): the fuel-flow limit
 *            since 2014 (100 kg/h, 3000 MJ/h in 2026), the engine's power over its thermal
 *            efficiency before. A kg on board costs `secPerKg` a lap (scaled by the lap). The
 *            start load outside refuelling is the race plus a margin, never more than the
 *            era's maximum (turbo tanks 1984-88, 100/105/110 kg 2014-2025).
 *   energy   KERS (2009, 2011-13: 60 kW, 400 kJ deployed a lap), ERS (2014-25: MGU-K 120 kW,
 *            2 MJ harvested and 4 MJ deployed a lap, a 4 MJ window, the MGU-H unlimited),
 *            2026 (350 kW tapering with speed, 8.5 MJ harvested a lap, the overtake curve).
 *            The store is deployed first where the trace is slowest on full throttle (most time
 *            per joule), so the deployment runs out at the end of the long straights: clipping.
 *
 * Determinism (RF-SIM-15, RNF-05): no random draws; results are cached per circuit and year.
 */

import data from "../data/balance/race-energy.json";
import simBalance from "../data/balance/race-sim.json";
import { buildTrackTables } from "./sim/trackTables";
import { pedalsOf, powerShareAt, powertrainFor, rpmOf, shiftGear } from "./sim/powertrain";
import { physicsData } from "./sim/physics";

export const ENERGY = data;

const G = 9.80665;

const eraIn = (eras, year) => {
  const found = eras.find((era) => year >= era.from && year <= era.to);
  if (found) return found;
  return year < eras[0].from ? eras[0] : eras[eras.length - 1];
};

// ------------------------------------------------------------------ fuel

/** The fuel block of a year (race-energy.json fuel.eras). */
export const fuelEraOf = (year = 2020) => eraIn(data.fuel.eras, year);

/** RF-SIM-04: the era's most fuel a car may start a race with (kg), or null without a limit. */
export const maxRaceKgOf = (year) => {
  const era = fuelEraOf(year);
  if (era.maxRaceKg !== undefined && era.maxRaceKg !== null) return era.maxRaceKg;
  return era.maxRaceL ? era.maxRaceL * data.fuel.densityKgL : null;
};

/** The era's flow limit at `rpm` (kg/h), or null before 2014 (no flow limit). */
export const flowLimitKgH = (era, rpm) => {
  const f = era.flow;
  if (!f) return null;
  const top = f.unit === "MJ/h" ? f.maxMJh : f.maxKgH;
  const curve = rpm >= f.kneeRpm ? top : Math.min(top, f.slope * rpm + f.offset);
  return f.unit === "MJ/h" ? curve / f.lhvMJkg : curve;
};

/**
 * Fuel flow (kg/s) of a car with power unit `pt` at engine load `throttle` (0..1) and `rpm`: since
 * 2014 the era's flow limit at that rpm times the power used; before, the engine's power there over its thermal
 * efficiency and the fuel's heating value. `powerShare` is the car's share of the era's peak power.
 */
export const fuelFlowOf = (era, pt, throttle, rpm, powerShare = 1) => {
  const idle = data.fuel.idleKgH / 3600;
  if (!(throttle > 0)) return idle;
  // The fuel feeds the engine's own friction too (powertrain.js frictionKw, rising with rpm): at part
  // load the flow falls less than the power (the indicated power is brake + friction).
  const full = pt.power * powerShareAt(pt, rpm);
  const friction = pt.frictionW * (rpm / pt.limitRpm);
  const share = full > 0 ? (throttle * powerShare * full + friction) / (full + friction) : 0;
  const limit = flowLimitKgH(era, rpm);
  const flow = limit !== null ? (share * limit) / 3600 : (share * full) / (era.efficiency * data.fuel.lhvMJkg * 1e6);
  return flow > idle ? flow : idle;
};

const traceCache = new WeakMap();

/** The step simulation's tables of a circuit (same size, so the cache is shared). */
export const tablesOf = (circuit) => buildTrackTables(circuit, { size: simBalance.step.tableSize, approachMetres: simBalance.duel.approachMetres });

/**
 * The drive along the circuit's reference trace (per time-share cell): speed, gear, rpm, engine load
 * and whether the cell is on full power, as the step simulation's powertrain sees it (powertrain.js
 * shiftGear, pedalsOf). Two laps round so the gear at the line is settled. Null without a trace.
 *
 * With `lapSec`, the lap a car of that pace drives in clean air: the step
 * simulation's budget spread by band (race-physics.json budget, stepRace devOf: the extra time to
 * the corners), each cell's speed from its time, and the car's power share from its straights
 * (stepRace beginLap). `cell[j]` is then each cell's own time (s).
 */
export const traceDriveOf = (tables, pt, lapSec = null) => {
  const { M, vRef, traceLap, sens } = tables;
  if (!traceLap) return null;
  const cellSec = traceLap / M;
  const lap = lapSec > 0 ? lapSec : traceLap;
  const [lo, hi] = physicsData.budget.share;
  const devRaw = (lap - traceLap) / lap;
  const dev = devRaw < lo ? lo : devRaw > hi ? hi : devRaw;
  const cell = new Float64Array(M);
  const speed = new Float64Array(M);
  let straightSens = Infinity;
  for (let j = 0; j < M; j += 1) {
    cell[j] = lap === traceLap ? cellSec : (lap * (1 - dev + dev * sens[j])) / M;
    speed[j] = (vRef[j] * cellSec) / cell[j];
    if (sens[j] < straightSens) straightSens = sens[j];
  }
  const straight = lap === traceLap ? 1 : traceLap / (lap * (1 - dev + dev * straightSens));
  const powerShare = straight >= 1 ? 1 : straight * straight * straight;
  const gear = new Int8Array(M);
  const rpm = new Float64Array(M);
  const throttle = new Float64Array(M);
  const full = new Uint8Array(M);
  const accel = new Float64Array(M);
  let g = 1;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let j = 0; j < M; j += 1) {
      const v = speed[j];
      const next = speed[(j + 1) % M];
      const a = (next - v) / cell[j];
      g = shiftGear(pt, g, v, a);
      if (pass === 0) continue;
      const r = rpmOf(pt, g, v);
      const isFull = vRef[(j + 1) % M] > vRef[j] * 1.0005 ? 1 : 0;
      gear[j] = g;
      rpm[j] = r;
      full[j] = isFull;
      accel[j] = a;
      // The engine's load is the power the trace asks for (pedalsOf), not the pedal: on the
      // power at full load, out of a corner on the grip only what the tyres take.
      throttle[j] = pedalsOf(pt, v, a, r, powerShare).throttle;
    }
  }
  return { cellSec, cell, powerShare, gear, rpm, throttle, full, accel };
};

/**
 * RF-SIM-04: fuel (kg) one lap of this circuit burns on the standard mix at race pace (`baseLap`) in
 * `year`: the era's flow integrated along the clean-air lap the step simulation drives at that pace
 * (traceDriveOf with lapSec), times `raceLoadShare` (what the step race's green laps measured). Cached per circuit, year and pace. Without
 * a trace, the era's full flow over `fallbackFullShare` of `baseLap`. `traceKg` is the same at the
 * trace's own (qualifying) pace.
 */
export const lapFuelOf = (circuit, year, baseLap = 90) => {
  let byYear = circuit ? traceCache.get(circuit) : null;
  if (circuit && !byYear) {
    byYear = new Map();
    traceCache.set(circuit, byYear);
  }
  const key = `${year}|${Math.round(baseLap * 10)}`;
  if (byYear && byYear.has(key)) return byYear.get(key);
  const era = fuelEraOf(year);
  const tables = circuit && circuit.simulatedLap > 0 ? tablesOf(circuit) : null;
  let top = 0;
  if (tables) for (let j = 0; j < tables.M; j += 1) if (tables.vRef[j] > top) top = tables.vRef[j];
  const pt = powertrainFor({ year, layoutRef: circuit?.ref || null, circuitTop: top > 0 ? top : null });
  const drive = tables ? traceDriveOf(tables, pt) : null;
  const race = tables ? traceDriveOf(tables, pt, baseLap) : null;
  let kg = 0;
  let traceKg = 0;
  if (drive) {
    for (let j = 0; j < tables.M; j += 1) {
      traceKg += fuelFlowOf(era, pt, drive.throttle[j], drive.rpm[j]) * drive.cellSec;
      kg += fuelFlowOf(era, pt, race.throttle[j], race.rpm[j], race.powerShare) * race.cell[j];
    }
    // Racing laps (traffic, worn tyres, the car's own pace) burn a little less than the clean-air lap.
    kg *= data.fuel.raceLoadShare;
  } else {
    kg = fuelFlowOf(era, pt, 1, pt.shiftRpm) * baseLap * data.fuel.fallbackFullShare;
    traceKg = kg;
  }
  const out = { kg, traceKg, tables, pt, drive, era };
  if (byYear) byYear.set(key, out);
  return out;
};

/**
 * RF-SIM-04: the fuel of one race - `kgPerLap` (standard mix, lapFuelOf), `secPerKg` (a kg on board
 * this lap, scaled by the circuit's lap), `secPerLap` (what a lap of fuel on board costs a lap, the
 * unit the race's fuel ledger is kept in), `maxKg` (the era's limit, or null) and, outside the
 * refuelling years, `startLaps`: the race plus `margin`, cut to the limit (a car that must save).
 * `lengthKm` the race's real lap (the pack); `geometryScale` its ratio to the engine's circuit.
 */
export const fuelSpecOf = ({ rules, circuit, laps, baseLap, lengthKm = null }) => {
  const year = rules.year ?? 2020;
  // The geometry the engine has may be another layout of the circuit than the race's (Paul Ricard
  // 1986-90: the 3.8 km short circuit on the 5.8 km spline). Both modes drive that geometry in the
  // race's lap time; the fuel is scaled to the real lap length.
  const geo = geometryScaleOf(circuit, lengthKm);
  const { kg: drawn } = lapFuelOf(circuit, year, baseLap);
  const kg = drawn * geo;
  const kgPerLap = kg > 0 ? kg : 1;
  const secPerKg = (data.fuel.secPerKg * (baseLap > 0 ? baseLap : data.fuel.refLapSec)) / data.fuel.refLapSec;
  const maxKg = maxRaceKgOf(year);
  const wanted = laps + data.fuel.margin;
  const startLaps = rules.refuelling ? null : maxKg !== null ? Math.min(wanted, maxKg / kgPerLap) : wanted;
  return { kgPerLap, secPerKg, secPerLap: kgPerLap * secPerKg, maxKg, startLaps, geometryScale: geo };
};

/** The race's real lap length over the engine's circuit length (1 when unknown or within 3 %). */
export const geometryScaleOf = (circuit, lengthKm) => {
  if (!(lengthKm > 0) || !circuit || !(circuit.length > 0)) return 1;
  const ratio = (lengthKm * 1000) / circuit.length;
  return Math.abs(ratio - 1) < 0.03 ? 1 : ratio;
};

// ------------------------------------------------------------------ energy

/** RF-SIM-05: the era's energy system's limits (race-energy.json ers), or null without one. */
export const ersSpecOf = (rules) => (rules.energy.system === "none" ? null : data.ers[rules.energy.system] || null);

/** Piecewise-linear curve [[x, y], ...] at x (flat beyond the ends). */
export const curveAt = (curve, x) => {
  if (x <= curve[0][0]) return curve[0][1];
  for (let k = 1; k < curve.length; k += 1) {
    if (x <= curve[k][0]) {
      const [x0, y0] = curve[k - 1];
      const [x1, y1] = curve[k];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return curve[curve.length - 1][1];
};

/** Most power (kW) the MGU-K/KERS may propel the car with at `kmh` (2026: the speed taper; `overtake` its curve). */
export const deployKwAt = (spec, kmh, overtake = false) => curveAt(overtake && spec.overtakeCurve ? spec.overtakeCurve : spec.powerCurve, kmh);

/** The part of it that comes out of the store (2014-25: the MGU-H feeds `mguhDirectKw` straight to the MGU-K). */
export const storeKwAt = (spec, kmh, overtake = false) => Math.max(0, deployKwAt(spec, kmh, overtake) - spec.mguhDirectKw);

/**
 * The circuit's energy plan (step mode, once per race): the full-power cells of the reference trace
 * that can take the store's power, ranked slowest first (`rank`, -1 for the others), the energy their
 * deployment uses cumulated by rank (`cum`, MJ), and the energy the braking zones harvest on the
 * trace (`harvestMJ`, within the era's per-lap limit).
 */
export const energyPlanOf = (tables, drive, spec) => {
  if (!spec || !drive) return null;
  const { M, vRef } = tables;
  const { cellSec } = drive;
  const cells = [];
  for (let j = 0; j < M; j += 1) if (drive.full[j] && storeKwAt(spec, vRef[j] * 3.6) > 0) cells.push(j);
  cells.sort((a, b) => vRef[a] - vRef[b] || a - b);
  const rank = new Int32Array(M).fill(-1);
  const cum = new Float64Array(cells.length + 1);
  cells.forEach((j, k) => {
    rank[j] = k;
    cum[k + 1] = cum[k] + (storeKwAt(spec, vRef[j] * 3.6) * cellSec) / 1000;
  });
  let harvest = 0;
  const minA = data.step.brakeHarvestMinG * G;
  for (let j = 0; j < M; j += 1) if (-drive.accel[j] >= minA) harvest += (spec.harvestKw * spec.harvestShare * cellSec) / 1000;
  const harvestMJ = spec.harvestPerLapMJ !== null ? Math.min(spec.harvestPerLapMJ, harvest) : harvest;
  return { rank, cum, K: cells.length, cellSec, harvestMJ, M };
};

/** How many ranked cells a deployment of `mj` fills (the first cell whose cumulated energy reaches it). */
export const cellsFor = (plan, mj) => {
  if (!(mj > 0)) return 0;
  let lo = 0;
  let hi = plan.K;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (plan.cum[mid + 1] >= mj) hi = mid;
    else lo = mid + 1;
  }
  return Math.min(plan.K, lo + 1);
};

/**
 * RF-SIM-05 / RF-CMD-01: the energy (MJ) a car deploys from its store on a lap with energy `mode`
 * (race-eras.json modes), starting it with `battery` % (the quick mode's ledger):
 *   KERS   the mode's share of the 400 kJ a lap;
 *   ERS    what the trace harvests less the mode's net charge, never more than the era's per-lap
 *          limit or what the store and the harvest hold (2026's overtake mode deploys as "deploy";
 *          its extra is run by distance).
 */
export const lapDeployOf = ({ rules, spec, plan, mode, battery }) => {
  const modes = rules.energy.balance?.modes || {};
  if (rules.energy.kers) return ((modes[mode] || modes.balanced)?.use ?? 0) * spec.deployPerLapMJ;
  const row = modes[mode === "overtake" ? "deploy" : mode] || modes.balanced;
  const soc = ((battery ?? 0) / 100) * spec.storeMJ;
  const wanted = plan.harvestMJ - ((row?.charge ?? 0) / 100) * spec.storeMJ;
  const most = Math.min(spec.deployPerLapMJ ?? Infinity, soc + plan.harvestMJ);
  return wanted < 0 ? 0 : wanted > most ? most : wanted;
};

/**
 * The deployment the reference trace already holds, against which the quick mode's energy time is
 * measured: none with KERS (race.js energyStep gives its whole gain), the balanced mode with ERS.
 */
export const referenceDeployOf = ({ rules, spec, plan }) => (rules.energy.kers ? 0 : lapDeployOf({ rules, spec, plan, mode: "balanced", battery: 100 }));
