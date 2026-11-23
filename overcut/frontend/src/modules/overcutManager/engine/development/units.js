/**
 * RF-SIM-14: power-unit, gearbox and (from 2014) PU-element usage per driver,
 * wear accumulated between races, the era's allocation and the grid penalties
 * for going past it.
 *
 * Which components are counted, and how, comes from the era's rules
 * (rulesFor(era).unitLimits / unitPenalties via gridPenaltyFor in rules.js) and
 * from development.json `units`:
 *
 *   season limit    enginesPerDriver (2009-): N units for the year. A unit lasts
 *                   races × lifeMargin / N races; every unit past N costs grid
 *                   places (first one `engine`, later ones `engineRepeat`).
 *   weekend limit   engineRaceWeekends (2004-2008), gearboxRaces (2008-2017):
 *                   a unit must last that many consecutive races; changing it
 *                   early is a penalty, except after a retirement when the era
 *                   allowed a free change (freeChangeAfterDnf, pending).
 *   PU elements     ice, tc, mguh, mguk, es, ce (2014-2025; no MGU-H from 2026),
 *                   each with its own count.
 *
 * Units fail in the race (a mechanical retirement is put on one component by
 * data weights) and before it (a practice failure drawn per weekend from wear
 * and the car's reliability). Every draw is on a seeded substream (RF-SIM-15),
 * so AI teams follow exactly the same rules, deterministically.
 *
 * State lives on career.units:
 *   { year, components: [{ id, mode, limit, life, penalty }],
 *     drivers: { driverId: { compId: { used, wear, races, failed } } },
 *     penalties: { round, byDriver: { driverId: { places, items: [{ comp, over, reason }] } } } }
 */

import { clamp, substream } from "../../../overcutTrayectoria/engine/rng";
import DEV from "../../data/balance/development.json";
import REL from "../../data/balance/race-reliability.json";
import { gridPenaltyFor, inRange, rulesFor } from "../rules";

const U = DEV.units;

const elementsFor = (year) => U.elements.find((row) => inRange(year, row)) || null;

/** The components this era counts, with how each is limited. */
export const unitComponents = (era, year, raceCount) => {
  const rules = rulesFor(era);
  const limits = rules.unitLimits || {};
  const out = [];
  const races = Math.max(1, raceCount || 1);
  const seasonLife = (limit) => Math.max(1, (races * U.lifeMargin) / Math.max(1, limit));
  const elements = rules.energy.ers ? elementsFor(year) : null;
  if (elements && limits.enginesPerDriver != null) {
    elements.list.forEach((id) => {
      let limit = limits.enginesPerDriver;
      if (elements.limits?.[id] === "enginesMinus" && year >= U.enginesMinusFrom) limit = Math.max(1, limit - 1);
      out.push({ id, mode: "season", limit, life: seasonLife(limit), penalty: "engine" });
    });
  } else if (limits.enginesPerDriver != null) {
    out.push({ id: "engine", mode: "season", limit: limits.enginesPerDriver, life: seasonLife(limits.enginesPerDriver), penalty: "engine" });
  } else if (limits.engineRaceWeekends != null) {
    out.push({ id: "engine", mode: "weekend", limit: limits.engineRaceWeekends, life: limits.engineRaceWeekends, penalty: "engine" });
  }
  if (limits.gearboxRaces != null) out.push({ id: "gearbox", mode: "weekend", limit: limits.gearboxRaces, life: limits.gearboxRaces, penalty: "gearbox" });
  return out;
};

/** Which part type's spec a component carries (a new unit takes the newest spec). */
export const partOfComponent = (comp) => (comp === "gearbox" ? "gearbox" : comp === "engine" || comp === "ice" ? "engine" : comp === "mguk" || comp === "es" ? "ers" : null);

export const freshUnits = (era, year, raceCount) => ({ year, components: unitComponents(era, year, raceCount), drivers: {}, penalties: { round: 0, byDriver: {} } });

const recordOf = (units, driverId) => {
  if (!units.drivers[driverId]) {
    units.drivers[driverId] = Object.fromEntries(units.components.map((comp) => [comp.id, { used: 1, wear: 0, races: 0, failed: false }]));
  }
  const record = units.drivers[driverId];
  units.components.forEach((comp) => {
    if (!record[comp.id]) record[comp.id] = { used: 1, wear: 0, races: 0, failed: false };
  });
  return record;
};

export const unitRecord = (units, driverId) => (units ? recordOf(units, driverId) : null);

/**
 * A v1 save, or a driver joining mid-season: the units a nominal rotation would
 * have used by `round`, with no penalty.
 */
export const backfillUnits = (units, driverIds, round) => {
  driverIds.forEach((driverId) => {
    const record = recordOf(units, driverId);
    units.components.forEach((comp) => {
      const life = comp.life;
      const done = Math.max(0, round);
      const unitsUsed = Math.min(comp.mode === "season" ? comp.limit : Infinity, 1 + Math.floor(done / life));
      record[comp.id] = { used: Math.max(1, unitsUsed), wear: clamp((done % life) / life, 0, 0.95), races: done % Math.max(1, Math.round(life)), failed: false };
    });
  });
  return units;
};

const pickWeighted = (stream, weights) => {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = stream.range(0, total);
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1]?.[0] || null;
};

/**
 * Which counted component a mechanical retirement broke. RF-SIM-14: the race says which
 * failure group it was (classification row `component`, engine/incidents.js, from f1db);
 * the counted unit of that group takes it (race-reliability.json mechanical.unitGroups). A
 * group with no counted unit (hydraulics, brakes, ...) breaks none. Rows without a group
 * (older saves) fall back to development.json units.mechanical.
 */
const brokenComponent = (units, stream, group = null) => {
  if (group) {
    const comps = REL.mechanical.unitGroups[group] || [];
    const ids = units.components.map((comp) => comp.id);
    return comps.find((id) => ids.includes(id)) || null;
  }
  return legacyBrokenComponent(units, stream);
};

const legacyBrokenComponent = (units, stream) => {
  const group = pickWeighted(stream, U.mechanical);
  const ids = units.components.map((comp) => comp.id);
  if (group === "engine") return ids.find((id) => id === "engine" || id === "ice") || null;
  if (group === "gearbox") return ids.includes("gearbox") ? "gearbox" : null;
  if (group === "energy") return ids.find((id) => id === "mguk" || id === "es") || null;
  return null;
};

/**
 * Take a new unit of `comp` for a driver. Returns the penalty item (or null)
 * for the next race. `free` = the era allows this change without penalty.
 */
export const takeUnit = (units, rules, driverId, comp, { reason = "scheduled", free = false } = {}) => {
  const spec = units.components.find((entry) => entry.id === comp);
  const record = recordOf(units, driverId)[comp];
  const early = spec.mode === "weekend" && record.races < spec.life;
  record.used += 1;
  record.wear = 0;
  record.races = 0;
  record.failed = false;
  let over = 0;
  if (spec.mode === "season") over = Math.max(0, record.used - spec.limit);
  else if (early && !free) over = 1;
  const places = over > 0 ? gridPenaltyFor(rules, { component: spec.penalty, over }) : 0;
  return places > 0 ? { comp, over, places, reason } : null;
};

const addPenalty = (units, driverId, item) => {
  if (!item) return;
  const entry = (units.penalties.byDriver[driverId] ||= { places: 0, items: [] });
  entry.items.push(item);
  const sum = entry.items.reduce((total, row) => total + row.places, 0);
  entry.places = sum > U.backOfGridOver ? U.backOfGridPlaces : sum;
};

/**
 * After a race: wear for everyone who started, the unit a mechanical
 * retirement broke, then the preparation for the next race (practice failures
 * and scheduled changes), with the penalties that brings. `rows` are the race
 * summary rows; `reliabilityOf(driverId)` gives the car's reliability area.
 * `onNewUnit(driverId, comp)` lets the parts layer fit the newest spec.
 */
export const unitsAfterRace = ({ units, era, rows, seed, year, round, hasNextRace, reliabilityOf = () => 60, onNewUnit = () => {} }) => {
  const rules = rulesFor(era);
  units.penalties = { round: round + 1, byDriver: {} };
  if (!units.components.length) return units;
  rows.forEach((row) => {
    const stream = substream(seed, "units", year, round, row.driverId);
    const record = recordOf(units, row.driverId);
    const finished = row.status === "finished";
    units.components.forEach((comp) => {
      const unit = record[comp.id];
      unit.races += 1;
      unit.wear += (1 / comp.life) * (finished || comp.mode === "weekend" ? 1 : U.dnfWear);
    });
    let raceFailure = null;
    if (row.status === "mechanical") {
      raceFailure = brokenComponent(units, stream, row.component || null);
      if (raceFailure) {
        record[raceFailure].failed = true;
        record[raceFailure].wear = 1;
      }
    }
    if (!hasNextRace) return;
    const reliability = clamp((100 - reliabilityOf(row.driverId)) / U.reliabilityScale, 0.3, 2.5);
    units.components.forEach((comp) => {
      const unit = record[comp.id];
      let reason = null;
      let free = false;
      if (unit.failed) {
        reason = "failure";
        free = U.freeChangeAfterDnf && !finished;
      } else if (stream.chance(U.practiceFailure * (1 + clamp(unit.wear, 0, 1.5)) * reliability)) {
        reason = "practice";
      } else if (comp.mode === "season" ? unit.wear >= 1 - 1e-9 : unit.races >= comp.life) {
        reason = "scheduled";
        free = true;
      }
      if (!reason) return;
      addPenalty(units, row.driverId, takeUnit(units, rules, row.driverId, comp.id, { reason, free }));
      onNewUnit(row.driverId, comp.id);
    });
  });
  return units;
};

/** The player fits a fresh unit now (e.g. to bring a new spec): penalties go to the next race. */
export const forceNewUnit = ({ units, era, driverId, comp }) => {
  const rules = rulesFor(era);
  const item = takeUnit(units, rules, driverId, comp, { reason: "forced", free: false });
  addPenalty(units, driverId, item);
  return item;
};

/** Grid places per driver for `round` (createRace gridPenalties shape, by car id = driver id). */
export const penaltiesForRound = (units, round, ids) => {
  if (!units?.penalties || units.penalties.round !== round) return {};
  const out = {};
  ids.forEach((id) => {
    const places = units.penalties.byDriver[id]?.places || 0;
    if (places > 0) out[id] = places;
  });
  return out;
};
