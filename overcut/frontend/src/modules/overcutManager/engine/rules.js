/**
 * The rules of a race, resolved once per era (SRS 6.2, RNF-07, criterio 7.2).
 *
 * The race engine never asks "which year is it?". It asks this module what the
 * rules are, and this module answers from data only:
 *
 *   1. the season pack's `regulations`, when the era carries them (fixed anchor,
 *      SRS 6.1: packWorld.eraWithRegulations puts them on `era.regulations`);
 *   2. otherwise `data/seasons/curated/era-defaults.json`, the same closed keys
 *      by year range, which reproduces the year thresholds race.js used to hold
 *      in code (and which a test checks against curated/era-rules.json);
 *   3. and the balance numbers of that era from `data/balance/race-eras.json`.
 *
 * Fields the pack does not describe yet (compounds, penalty types, red-flag
 * procedure, unit penalties) always come from era-defaults.
 *
 * `rulesFor(era)` is pure and cached per era object; `commandsFor(era)` lists
 * the pit-wall orders (RF-CMD-01/02) that exist in that era so the UI can hide
 * the rest.
 */

import eraDefaults from "../data/seasons/curated/era-defaults.json";
import balance from "../data/balance/race-eras.json";
import simBalance from "../data/balance/race-sim.json";
import { eraProfileFor } from "../../overcutTrayectoria/engine/eras";

export const RULES_YEAR_MIN = 1950;
export const RULES_YEAR_MAX = 2026;

/** Is `year` inside a {from, to} range (inclusive, open ends allowed)? */
export const inRange = (year, entry) => year >= (entry.from ?? -Infinity) && year <= (entry.to ?? Infinity);

/**
 * The entry of a year-range table that covers `year`. Years outside every range
 * take the nearest one, so 1949 reads 1950's rules and 2030 reads 2026's.
 */
export const byYear = (table, year) => {
  if (!table || !table.length) return undefined;
  const hit = table.find((entry) => inRange(year, entry));
  if (hit) return hit;
  let best = table[0];
  let distance = Infinity;
  table.forEach((entry) => {
    const d = year < (entry.from ?? -Infinity) ? entry.from - year : year - (entry.to ?? Infinity);
    if (d >= 0 && d < distance) {
      distance = d;
      best = entry;
    }
  });
  return best;
};

/** The value of one era-defaults field for a year. */
const defaultField = (field, year) => byYear(eraDefaults.fields[field], year)?.value;

/** Every era-defaults field for a year, in the pack's closed-key shape (plus the extra keys). */
export const defaultRegulationsFor = (year) =>
  Object.fromEntries(Object.keys(eraDefaults.fields).map((field) => [field, clone(defaultField(field, year))]));

const clone = (value) => (value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value);

const yearOf = (eraOrYear) => {
  if (typeof eraOrYear === "number") return eraOrYear;
  if (eraOrYear && typeof eraOrYear.year === "number") return eraOrYear.year;
  if (eraOrYear && typeof eraOrYear.features?.year === "number") return eraOrYear.features.year;
  return RULES_YEAR_MAX;
};

const ENERGY_MODES = {
  none: [],
  kers: ["harvest", "balanced", "deploy"],
  ers: ["harvest", "balanced", "deploy"],
  ers2026: ["harvest", "balanced", "deploy", "overtake"],
};

const PIT_PENALTIES = new Set(["driveThrough", "stopGo"]);

/** SIM-7: the era's track-limits procedure in a closed shape, or null (era-defaults.json trackLimits). */
const trackLimitsOf = (value) => {
  if (!value || !value.race) return null;
  const race = value.race;
  return {
    race: {
      deleteLap: Boolean(race.deleteLap),
      blackWhiteAt: Number.isInteger(race.blackWhiteAt) ? race.blackWhiteAt : null,
      penalties: (race.penalties || [])
        .filter((step) => Number.isInteger(step.at) && typeof step.type === "string")
        .map((step) => ({ at: step.at, type: step.type }))
        .sort((a, b) => a.at - b.at),
    },
    qualifying: { deleteLap: Boolean(value.qualifying && value.qualifying.deleteLap) },
  };
};

const resolve = (eraOrYear) => {
  const year = yearOf(eraOrYear);
  // A bare year reads as its era profile (no pack).
  const era = typeof eraOrYear === "object" && eraOrYear ? eraOrYear : eraProfileFor(year);
  const pack = era.regulations || null;
  const defaults = defaultRegulationsFor(year);
  // The pack wins on every key it has; era-defaults fills the rest.
  const regs = { ...defaults, ...(pack ? clone(pack) : {}) };

  const energySystem = regs.energySystem || "none";
  const energyBalance = energySystem === "none" ? null : balance.energy[energySystem];
  const kersOptOut = energySystem === "kers" ? balance.energy.kers.optOut?.[String(year)] || [] : [];
  // 2009: KERS was optional (era-rules oneOf none|kers); teams could leave it off.
  const energyOptional = energySystem === "kers" && kersOptOut.length > 0;

  // Points and the fastest-lap rule live on the era profile (eras.js, or the pack via eraWithRegulations).
  const fastestLap = { point: era.fastestLap?.point ?? 0, requiresTopTen: Boolean(era.fastestLap?.requiresTopTen) };

  const qualifyingFormats = regs.qualifyingFormats || ["TWO_SESSION"];
  const red = regs.redFlag || { restart: "standing", aggregate: false, tyreChanges: true };
  const penaltyTypes = regs.penaltyTypes || [];
  const scBalance = byYear(balance.raceControl.safetyCar, year);

  return {
    resolvedRules: true,
    year,
    source: pack ? "pack" : "era-defaults",
    regulations: regs,
    refuelling: Boolean(regs.refuelling),
    energy: {
      system: energySystem,
      kers: energySystem === "kers",
      ers: energySystem === "ers" || energySystem === "ers2026",
      overtakeMode: energySystem === "ers2026",
      optional: energyOptional,
      optOut: kersOptOut,
      modes: ENERGY_MODES[energySystem] || [],
      balance: energyBalance,
    },
    tyres: {
      compounds: regs.compounds || ["dry"],
      type: regs.tyreType,
      suppliers: regs.tyreSuppliers || [],
      changesInRace: regs.tyreChangesInRace !== false,
      mandatoryDryCompounds: regs.mandatoryDryCompounds || 0,
      topTenStartTyres: regs.topTenStartTyres || "none",
      scale: byYear(balance.tyres.eraScale, year),
    },
    qualifying: {
      formats: qualifyingFormats,
      knockout: qualifyingFormats.includes("KNOCKOUT"),
      raceFuel: Boolean(regs.qualifyingRaceFuel),
    },
    drs: {
      enabled: Boolean(regs.drs),
      ...balance.drs,
    },
    activeAero: Boolean(regs.activeAero),
    raceControl: {
      yellowFlags: true,
      safetyCar: Boolean(regs.safetyCar),
      vsc: Boolean(regs.vsc),
      scDeployChance: scBalance && regs.safetyCar ? scBalance.deployChance : 0,
      redFlag: { available: true, ...red },
      // SIM-5 reglas-sc-era (F1M24-GAMEPLAY §2.11, RF-SIM-10): how the era runs a safety car and a VSC - lapped cars
      // unlapping, the pit lane closed until the train forms, where overtaking is allowed again ("control" line or
      // "sc1" line) and the VSC ENDING warning. Null in an era without the procedure (criterio 7.2).
      sc: regs.safetyCar
        ? {
            unlapping: Boolean(regs.scUnlapping),
            pitClosed: Boolean(regs.scPitClosed),
            restartLine: regs.scRestartLine === "sc1" ? "sc1" : "control",
            overtakeBeforeLine: Boolean(regs.scOvertakeBeforeLine),
          }
        : null,
      vscEndingWarn: regs.vsc && regs.vscEndingWarn ? { minSec: regs.vscEndingWarn.minSec, maxSec: regs.vscEndingWarn.maxSec } : null,
      // SIM-7 errores-visibles (F1M24-GAMEPLAY §2.10, RF-SIM-10): track limits as a general procedure - each offence
      // deletes the lap, the black-and-white flag at `blackWhiteAt`, then the penalties of the ladder - and the lap
      // deleted in qualifying. Null in an era without it (era-defaults.json trackLimits): nobody is judged.
      trackLimits: trackLimitsOf(regs.trackLimits),
      penaltyTypes,
      pitPenalties: penaltyTypes.filter((type) => PIT_PENALTIES.has(type)),
      timePenalties: penaltyTypes.filter((type) => type === "time5" || type === "time10"),
    },
    unitLimits: regs.unitLimits || { enginesPerDriver: null, engineRaceWeekends: null, gearboxRaces: null },
    unitPenalties: regs.unitPenalties || null,
    points: {
      race: era.points,
      fastestLap,
    },
    teamOrdersBanned: Boolean(regs.teamOrdersBanned),
    parcFerme: Boolean(regs.parcFerme),
    budgetCap: regs.budgetCap ?? null,
    strategy: {
      minStops: regs.refuelling ? 1 : 0,
      maxStops: byYear(balance.strategy.maxStops, year).value,
      twoCompoundPenalty: balance.strategy.twoCompoundPenalty,
      refuelNoStopCost: balance.strategy.refuelNoStopCost,
    },
    dirtyAir: byYear(balance.dirtyAir.byYear, year).value,
    stationary: byYear(balance.pit.stationary, year),
    // RF-SIM-12 / SRS 6.2: the pit-lane speed limit, as dated periods with per-circuit
    // exceptions (pack regulations.pitLaneSpeed or era-defaults); read with pitLaneSpeedFor.
    pitLaneSpeed: regs.pitLaneSpeed || [{ fromDate: null, race: null, circuits: {} }],
  };
};

/**
 * RF-SIM-12 / SRS 6.2: the pit-lane speed limit (km/h, or null before there was one) for a
 * race: the last period of `rules.pitLaneSpeed` that started on or before the race's `date`
 * (2013 changed at the Hungarian GP), then that period's exception for `circuitId` (f1db id).
 */
export const pitLaneSpeedFor = (rulesOrEra, { circuitId = null, date = null } = {}) => {
  const periods = rulesFor(rulesOrEra).pitLaneSpeed;
  let period = periods[0];
  for (let k = 1; k < periods.length; k += 1) {
    if (!periods[k].fromDate || (date && date >= periods[k].fromDate)) period = periods[k];
  }
  if (!period) return null;
  if (circuitId && period.circuits && period.circuits[circuitId] !== undefined) return period.circuits[circuitId];
  return period.race ?? null;
};

const cacheByEra = new WeakMap();
const cacheByYear = new Map();

/**
 * The effective rules for an era profile (with or without pack regulations) or
 * a bare year. Same input, same object: callers must not mutate it.
 */
export const rulesFor = (eraOrYear) => {
  // Already resolved: pass it through, so helpers take rules, an era or a year alike.
  if (eraOrYear && eraOrYear.resolvedRules === true) return eraOrYear;
  if (eraOrYear && typeof eraOrYear === "object") {
    const hit = cacheByEra.get(eraOrYear);
    if (hit) return hit;
    const rules = resolve(eraOrYear);
    cacheByEra.set(eraOrYear, rules);
    return rules;
  }
  const year = yearOf(eraOrYear);
  if (!cacheByYear.has(year)) cacheByYear.set(year, resolve(year));
  return cacheByYear.get(year);
};

/**
 * RF-SIM-08: is DRS open for a car this lap? Era, zones on this circuit, from
 * lap `fromLap`, `restartLaps` laps after any restart, dry track, and the car
 * within `detectionGap` of the one ahead (pass gapAhead = undefined to ask only
 * whether DRS is enabled on the lap).
 */
export const drsOpen = (rules, { lap, wetness = 0, zones = 1, restartLap = 0, gapAhead } = {}) => {
  const drs = rules.drs;
  if (!drs.enabled || !(zones > 0)) return false;
  if (lap < drs.fromLap) return false;
  if (restartLap && lap <= restartLap + drs.restartLaps) return false;
  if (wetness >= drs.wetLimit) return false;
  if (gapAhead === undefined) return true;
  return gapAhead !== null && gapAhead < drs.detectionGap;
};

/** The penalty an offence earns in this era: the first of its list the era has, or null (no further action). */
export const penaltyFor = (rules, offence) => {
  const spec = balance.penalties.offences[offence];
  if (!spec || rules.year < spec.from) return null;
  return spec.penalties.find((type) => rules.raceControl.penaltyTypes.includes(type)) || null;
};

/**
 * RF-SIM-14: grid places lost for a power-unit or gearbox element over the
 * era's limit. `component` is "engine" or "gearbox"; `over` how many units past
 * the allocation this one is (1 = the first extra). 0 when the era has no limit.
 */
export const gridPenaltyFor = (rules, { component, over = 1 }) => {
  const table = rules.unitPenalties;
  if (!table || over < 1) return 0;
  const limits = rules.unitLimits || {};
  if (component === "engine") {
    if (limits.enginesPerDriver == null && limits.engineRaceWeekends == null) return 0;
    return over === 1 ? table.engine : table.engineRepeat;
  }
  if (component === "gearbox") return limits.gearboxRaces == null ? 0 : table.gearbox;
  return 0;
};

/**
 * RF-CMD-01/02: which orders the pit wall has in this era. The live view reads
 * this to hide what does not exist (no battery before 2009, no fuel-mix calls
 * when the stint's fuel is set at the stop, no fuel in the stop outside the
 * refuelling years, no overtake button before 2026).
 */
export const commandsFor = (eraOrYear) => {
  const rules = rulesFor(eraOrYear);
  return {
    pace: Object.keys(balance.modes),
    energy: rules.energy.modes,
    overtakeMode: rules.energy.overtakeMode,
    fuelMix: rules.refuelling ? [] : Object.keys(balance.fuel.mixes),
    liftAndCoast: !rules.refuelling,
    pit: {
      compounds: [...rules.tyres.compounds, "inter", "wet"],
      tyres: rules.tyres.changesInRace,
      fuel: rules.refuelling,
      frontWing: true,
    },
    teamOrders: ["free", "hold", "swap"],
    teamOrdersBanned: rules.teamOrdersBanned,
    drs: rules.drs.enabled,
    activeAero: rules.activeAero,
    // SIM-7 tacticas (F1M24-GAMEPLAY §2.8): the driver's tactics in both modes (race.js / stepRace.js setTactics,
    // race-sim.json tactics); the battle assist only with KERS/ERS. Attack risk and defence style (setOvertakeRisk,
    // setDefence) exist in every era.
    tactics: { avoidKerbs: true, cleanAir: true, battleAssist: rules.energy.modes.length > 0 },
    overtakeRisk: Object.keys(simBalance.risk.levels),
    defence: Object.keys(simBalance.defence.styles),
  };
};

export { balance as raceBalance };
