/**
 * The stop in the box, stage by stage (RF-SIM-12, RF-STF-07; docs/manager/SIM-FISICA.md §3.9, WP7).
 *
 * A stop is a fixed sequence of stages, each with the crew role that does it:
 *
 *   marks      driver       stopping on the marks (only an error costs time: overshooting)
 *   jackUp     front/rear jack
 *   wheels     4 × (gun off + wheel off + wheel on + gun on), in parallel: the slowest wheel decides
 *   wing       front-wing adjustment or nose change, in parallel with the wheels (when asked or damaged)
 *   refuel     refueller, in parallel with the wheels, in refuelling eras (rules.refuelling):
 *              engage + litres / flow
 *   jackDown   jacks
 *   release    lollipop / lights
 *
 * stationary = marks + jackUp + max(wheels, wing, refuel) + jackDown + release (+ the error's delay).
 * A fuel-only stop (2005: no tyre changes in the race) is marks + refuel + release.
 *
 * Each stage time is mean + sd × z, z an approximate standard normal from four uniforms (only
 * + and ×, so the draw is bit-identical on every JS engine: RNF-05), scaled by the crew factor
 * `crew.base − crew/crew.divisor` (crew skill 60 → ×1). Each stage that can go wrong rolls its
 * error chance × `crew.errorBase − crew/crew.errorDivisor`; the first stage that errs is the
 * stop's mistake, with a delay drawn in its [min, max]. Every stop draws the same number of
 * values from the stream whatever happens (determinism does not depend on what went wrong).
 *
 * All numbers come from data/balance/race-pit.json `pitStop` (RNF-07), by era; every era has
 * the real median it is calibrated to (`target`, with its source).
 */

import pitBalance from "../../data/balance/race-pit.json";
import energyData from "../../data/balance/race-energy.json";
import { byYear } from "../rules";

const STOP = pitBalance.pitStop;

/**
 * RF-SIM-04 / RF-SIM-12: litres in a lap of fuel - the race's kg a lap (engine/energy.js, the
 * circuit's measured flow) over the fuel's density, or race-pit.json litresPerFuelLap without one.
 */
const litresPerLapOf = (kgPerLap) => (kgPerLap > 0 ? kgPerLap / energyData.fuel.densityKgL : STOP.litresPerFuelLap);

export const STAGES = ["marks", "jackUp", "wheels", "wing", "refuel", "jackDown", "release"];

export const ROLES = {
  marks: "driver",
  jackUp: "jacks",
  wheels: "wheelGuns",
  wing: "frontWing",
  refuel: "refueller",
  jackDown: "jacks",
  release: "lollipop",
};

/** The era's stage table (race-pit.json pitStop.eras). Takes rules (with .year) or a year. */
export const stopEraFor = (rulesOrYear) => byYear(STOP.eras, typeof rulesOrYear === "number" ? rulesOrYear : rulesOrYear.year);

/** Crew factor on stage times (RF-STF-07): skill 60 → 1, 100 → 0.8, 20 → 1.2. */
export const crewFactor = (crew = 60) => STOP.crew.base - crew / STOP.crew.divisor;

/** Crew factor on error chances. */
export const crewErrorFactor = (crew = 60) => Math.max(0, STOP.crew.errorBase - crew / STOP.crew.errorDivisor);

/** Approximate N(0, 1) from four uniforms (Irwin-Hall, variance matched): + and × only. */
const z4 = (stream) => (stream.next() + stream.next() + stream.next() + stream.next() - 2) * 1.7320508075688772;

const timeOf = (stream, spec, factor) => {
  const z = z4(stream);
  if (!spec) return 0;
  return Math.max(0, (spec.mean + spec.sd * z) * factor);
};

/**
 * Plan one stop. `crew` is the team's crew skill (0-100), `stream` the seeded `crew` stream.
 * Options: `tyres` (wheels changed), `refuelLaps` (laps of fuel added; 0 = none), `wing`
 * (null | "adjust" | "change"). Returns { stationary, stages: [{ stage, role, start, duration }],
 * mistake: { stage, role, delay } | null, slow } - `slow` is the mistake's delay (0 without one).
 */
export const planStop = ({ rules, crew = 60, tyres = true, refuelLaps = 0, wing = null, stream, kgPerLap = null }) => {
  const era = stopEraFor(rules);
  const factor = crewFactor(crew);
  const errorFactor = crewErrorFactor(crew);

  // Fixed draw budget: 4 × (marks, jackUp, wheel × 4, wing, refuel, jackDown, release) normals + 7 error rolls + 1 delay.
  const marks = timeOf(stream, era.marks, factor);
  const jackUp = timeOf(stream, era.jackUp, factor);
  let wheels = 0;
  for (let w = 0; w < 4; w += 1) wheels = Math.max(wheels, timeOf(stream, era.wheel, factor));
  const wingTime = era.wing ? (wing === "change" ? era.wing.change : wing === "adjust" ? era.wing.adjust : 0) : 0;
  const wingZ = z4(stream);
  const wingStage = wingTime > 0 ? Math.max(0, wingTime * (1 + 0.08 * wingZ) * factor) : 0;
  const refuelSpec = rules.refuelling ? era.refuel : null;
  const refuelZ = z4(stream);
  const litres = refuelLaps > 0 ? refuelLaps * litresPerLapOf(kgPerLap) : 0;
  const refuel = refuelSpec && litres > 0 ? Math.max(0, (refuelSpec.engage + litres / refuelSpec.flowLps + refuelSpec.sd * refuelZ) * factor) : 0;
  const jackDown = timeOf(stream, era.jackDown, factor);
  const release = timeOf(stream, era.release, factor);

  // Errors, in stage order; the first one is the stop's mistake.
  const candidates = [
    ["marks", era.marks],
    ["jackUp", tyres ? era.jackUp : null],
    ["wheels", tyres ? era.wheel : null, 4],
    ["refuel", refuel > 0 ? refuelSpec : null],
    ["release", era.release],
  ];
  let mistake = null;
  candidates.forEach(([stage, spec, times = 1]) => {
    for (let k = 0; k < times; k += 1) {
      const roll = stream.next();
      if (!mistake && spec && spec.errorChance && roll < spec.errorChance * errorFactor) mistake = { stage, role: ROLES[stage], spec };
    }
  });
  const delayRoll = stream.next();
  const delay = mistake ? mistake.spec.delay[0] + delayRoll * (mistake.spec.delay[1] - mistake.spec.delay[0]) : 0;

  const stages = [];
  let clock = 0;
  const push = (stage, duration, parallelFrom = null) => {
    const start = parallelFrom === null ? clock : parallelFrom;
    stages.push({ stage, role: ROLES[stage], start, duration });
    if (parallelFrom === null) clock += duration;
    return start + duration;
  };
  push("marks", marks + (mistake?.stage === "marks" ? delay : 0));
  if (tyres) {
    push("jackUp", jackUp + (mistake?.stage === "jackUp" ? delay : 0));
    const from = clock;
    let end = from;
    end = Math.max(end, push("wheels", wheels + (mistake?.stage === "wheels" ? delay : 0), from));
    if (wingStage > 0) end = Math.max(end, push("wing", wingStage, from));
    if (refuel > 0) end = Math.max(end, push("refuel", refuel + (mistake?.stage === "refuel" ? delay : 0), from));
    clock = end;
    push("jackDown", jackDown);
  } else {
    // Fuel only: the car stays on its wheels.
    const from = clock;
    let end = from;
    if (wingStage > 0) end = Math.max(end, push("wing", wingStage, from));
    if (refuel > 0) end = Math.max(end, push("refuel", refuel + (mistake?.stage === "refuel" ? delay : 0), from));
    clock = end;
  }
  push("release", release + (mistake?.stage === "release" ? delay : 0));
  return {
    stationary: clock,
    stages,
    mistake: mistake ? { stage: mistake.stage, role: mistake.role, delay } : null,
    slow: mistake ? delay : 0,
  };
};

/**
 * The expected stationary time (no draws, no errors) - what a strategist plans with
 * (race.js stationaryTime). Same formula as planStop at z = 0, plus the mean error cost.
 */
export const expectedStationary = ({ rules, crew = 60, tyres = true, refuelLaps = 0, kgPerLap = null }) => {
  const era = stopEraFor(rules);
  const factor = crewFactor(crew);
  const litres = refuelLaps > 0 ? refuelLaps * litresPerLapOf(kgPerLap) : 0;
  const refuel = rules.refuelling && era.refuel && litres > 0 ? (era.refuel.engage + litres / era.refuel.flowLps) * factor : 0;
  const mean = (spec) => (spec ? spec.mean * factor : 0);
  // The slowest of four wheels sits ~1.03 sd above the mean.
  const wheels = era.wheel ? (era.wheel.mean + 1.03 * era.wheel.sd) * factor : 0;
  const errorFactor = crewErrorFactor(crew);
  const errorCost = [era.marks, tyres ? era.jackUp : null, tyres ? era.wheel : null, tyres ? era.wheel : null, tyres ? era.wheel : null, tyres ? era.wheel : null, era.release]
    .reduce((sum, spec) => sum + (spec && spec.errorChance ? spec.errorChance * errorFactor * (spec.delay[0] + spec.delay[1]) * 0.5 : 0), 0);
  if (!tyres) return mean(era.marks) + refuel + mean(era.release) + errorCost;
  return mean(era.marks) + mean(era.jackUp) + Math.max(wheels, refuel) + mean(era.jackDown) + mean(era.release) + errorCost;
};

/** The stage a stop is in `t` seconds after the car stopped (for the view: `pitStage`). */
export const stageAt = (plan, t) => {
  if (!plan || t < 0) return null;
  let current = null;
  for (let k = 0; k < plan.stages.length; k += 1) {
    const s = plan.stages[k];
    if (t >= s.start && t < s.start + s.duration) current = current && current.stage === "wheels" ? current : s;
  }
  return current ? current.stage : t >= plan.stationary ? null : "release";
};

export { STOP as PIT_STOP_BALANCE };
