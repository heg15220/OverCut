/**
 * The car as parts (RF-DEV-01, SRS 4.1 PartDesign / PartItem / Expertise).
 *
 * The race engines still read four areas - aero, power, chassis, reliability -
 * and must keep reading them unchanged (race.js, engine/sim). This module is the
 * layer underneath: every team has part designs with stats, physical items made
 * from them, and a loadout per car. The four areas are a deterministic function
 * of the loadout:
 *
 *   area(A) = Σ weight(part, stat) × value(part, stat) / Σ weight(part, stat)
 *
 * over the parts the era has (rules.energy decides KERS/ERS) and the stats that
 * belong to A (data/balance/development.json, RNF-07). Every stat belongs to one
 * area only, so a team's starting parts can be seeded from its current areas and
 * give them back exactly: day one races at the same pace as before.
 *
 * Shape of `team.parts` (plain JSON, saved whole):
 *
 *   season      the year these designs belong to
 *   list        part types of this car (era-dependent)
 *   designs     { id: { id, part, version, season, stats, origin } }
 *   items       [{ id, design, part, condition, races }]     body parts only
 *   loadout     [{ part: itemId | designId }, ...]            one per car
 *   pending     { part: designId }  a unit-part spec waiting for its next unit
 *   cars        [areas, areas]  cached four areas per car, what entrantsFor reads
 *   expertise   { part: { stat: value } }                     RF-DEV-03
 *   supply      { manufacturer, works, fee }                  RF-DEV-05
 *
 * Rival teams use the same structure in a cheap form: one design per part and
 * the loadout points straight at designs (no items, no damage).
 */

import { clamp, substream } from "../../../overcutTrayectoria/engine/rng";
import { rulesFor } from "../rules";
import DEV from "../../data/balance/development.json";

export { DEV };

export const AREA_LIST = ["aero", "power", "chassis", "reliability"];
export const PART_TYPES = Object.keys(DEV.parts).filter((key) => !key.startsWith("$"));
export const STAT_LIST = Object.keys(DEV.stats).filter((key) => !key.startsWith("$"));
export const CONDITIONS = DEV.damage.states;

export const statArea = (stat) => DEV.stats[stat]?.area;
export const partSpec = (part) => DEV.parts[part];
export const isBodyPart = (part) => DEV.parts[part]?.kind === "body";
export const isUnitPart = (part) => DEV.parts[part]?.kind === "unit";

const AREA_RANGE = { aero: [5, 100], power: [5, 100], chassis: [5, 100], reliability: [5, 99] };

/** Stats are kept to 3 decimals: far below the 0.1 the areas are rounded to, and saves stay small. */
export const roundStat = (value) => Math.round(value * 1000) / 1000;

export const roundAreas = (car) => Object.fromEntries(AREA_LIST.map((area) => [area, Math.round((car[area] ?? 60) * 10) / 10]));

/**
 * The part types a team's car has in this era (RF-DEV-01): the nine of the
 * modern car, ERS from the hybrid era, KERS in the KERS seasons for the teams
 * that ran it (rules.energy.optOut).
 */
export const partsForEra = (era, teamId = null) => {
  const rules = rulesFor(era);
  return PART_TYPES.filter((part) => {
    const when = DEV.parts[part].era;
    if (when === "ers") return rules.energy.ers;
    if (when === "kers") return rules.energy.kers && !(rules.energy.optOut || []).includes(teamId);
    return true;
  });
};

/** Weights of every (part, stat) pair per area, for a list of part types. */
const weightsFor = (list) => {
  const byArea = Object.fromEntries(AREA_LIST.map((area) => [area, []]));
  list.forEach((part) => {
    Object.entries(DEV.parts[part].stats).forEach(([stat, weight]) => byArea[statArea(stat)].push({ part, stat, weight }));
  });
  return byArea;
};

/** What share of an area a part type carries on this car (0..1). */
export const areaShare = (list, part, area) => {
  const rows = weightsFor(list)[area];
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  return total ? rows.filter((row) => row.part === part).reduce((sum, row) => sum + row.weight, 0) / total : 0;
};

// ----------------------------------------------------------------- lookups

export const itemById = (parts, id) => (parts.items || []).find((item) => item.id === id) || null;

/** The design and condition fitted to `car` for `part`. */
export const fitted = (parts, car, part) => {
  const id = parts.loadout?.[car]?.[part];
  if (!id) return null;
  const item = itemById(parts, id);
  if (item) return { item, design: parts.designs[item.design], condition: item.condition || "perfect" };
  const design = parts.designs[id];
  return design ? { item: null, design, condition: "perfect" } : null;
};

/** Stat values of one design in one condition (RF-DEV-08 penalties). */
export const effectiveStats = (design, condition = "perfect") => {
  const penalty = DEV.damage.penalty[condition] || 0;
  return Object.fromEntries(Object.entries(design.stats).map(([stat, value]) => [stat, value - penalty]));
};

/** The four areas of one car, from its loadout (unrounded, unclamped). */
export const rawAreasOf = (parts, car) => {
  const byArea = weightsFor(parts.list);
  const out = {};
  AREA_LIST.forEach((area) => {
    let sum = 0;
    let total = 0;
    byArea[area].forEach(({ part, stat, weight }) => {
      const hit = fitted(parts, car, part);
      if (!hit) return;
      sum += weight * effectiveStats(hit.design, hit.condition)[stat];
      total += weight;
    });
    out[area] = total ? sum / total : 60;
  });
  return out;
};

export const areasOf = (parts, car) => {
  const raw = rawAreasOf(parts, car);
  return roundAreas(Object.fromEntries(AREA_LIST.map((area) => [area, clamp(raw[area], ...AREA_RANGE[area])])));
};

/** The car of one race seat: what entrantsFor reads (falls back to team.car). */
export const carOfSeat = (team, seat = 0) => {
  const cars = team.parts?.cars;
  if (!cars || !cars.length) return team.car;
  return cars[Math.min(seat, cars.length - 1)] || team.car;
};

/**
 * Recompute the cached cars and the team's headline car (the mean of its two
 * cars). Call after anything changes a design, an item or the loadout.
 */
export const syncCar = (team) => {
  const parts = team.parts;
  if (!parts) return team.car;
  parts.cars = parts.loadout.map((_, car) => areasOf(parts, car));
  const mean = {};
  AREA_LIST.forEach((area) => {
    mean[area] = parts.cars.reduce((sum, car) => sum + car[area], 0) / parts.cars.length;
  });
  team.car = roundAreas(mean);
  return team.car;
};

// ------------------------------------------------------------------ seeding

/**
 * A team's parts at the start of a season, seeded from its four areas
 * (RF-DEV-01). Each (part, stat) gets the area's value plus a stable per-team
 * character; the character is re-centred per area under the weights, so the
 * loadout gives back exactly the car the race engine already knew. The cached
 * cars are that car itself, so no rounding can move day-one pace.
 */
export const seedParts = ({ team, year, era, supply = null, expertise = null, withItems = false, prestige = team.prestige ?? 0.4 }) => {
  const list = partsForEra(era, team.id);
  const stream = substream("parts-seed", team.id, year);
  const designs = {};
  const offsets = {};
  list.forEach((part) => {
    offsets[part] = {};
    Object.keys(DEV.parts[part].stats).forEach((stat) => {
      offsets[part][stat] = stream.normal(0, DEV.seed.spread);
    });
  });
  const byArea = weightsFor(list);
  AREA_LIST.forEach((area) => {
    const rows = byArea[area];
    const total = rows.reduce((sum, row) => sum + row.weight, 0);
    const mean = total ? rows.reduce((sum, row) => sum + row.weight * offsets[row.part][row.stat], 0) / total : 0;
    rows.forEach((row) => {
      offsets[row.part][row.stat] -= mean;
    });
  });
  list.forEach((part) => {
    const id = `${team.id}-${year}-${part}-1`;
    const stats = {};
    Object.keys(DEV.parts[part].stats).forEach((stat) => {
      stats[stat] = roundStat((team.car[statArea(stat)] ?? 60) + offsets[part][stat]);
    });
    designs[id] = { id, part, version: 1, season: year, stats, origin: "seed" };
  });
  const parts = {
    season: year,
    list,
    designs,
    items: [],
    loadout: [{}, {}],
    pending: {},
    cars: [{ ...team.car }, { ...team.car }],
    supply,
    expertise: expertise || null,
    serial: 0,
  };
  list.forEach((part) => {
    const designId = `${team.id}-${year}-${part}-1`;
    if (withItems && isBodyPart(part)) {
      [0, 1].forEach((car) => {
        parts.loadout[car][part] = addItem(parts, designId, part).id;
      });
      for (let spare = 0; spare < (DEV.parts[part].spares || 0); spare += 1) addItem(parts, designId, part);
    } else {
      parts.loadout[0][part] = designId;
      parts.loadout[1][part] = designId;
    }
  });
  if (withItems && !parts.expertise) parts.expertise = seedExpertise(list, prestige);
  return parts;
};

export const addItem = (parts, designId, part, extra = {}) => {
  parts.serial = (parts.serial || 0) + 1;
  const item = { id: `i${parts.season}-${parts.serial}`, design: designId, part, condition: "perfect", races: 0, ...extra };
  parts.items.push(item);
  return item;
};

/** RF-DEV-03: starting expertise, from the team's standing. */
export const seedExpertise = (list, prestige = 0.4) => {
  const value = clamp(DEV.expertise.base + DEV.expertise.perPrestige * clamp(prestige, 0, 1), 0, DEV.expertise.max);
  const out = {};
  PART_TYPES.forEach((part) => {
    out[part] = Object.fromEntries(Object.keys(DEV.parts[part].stats).map((stat) => [stat, Math.round(value * 10) / 10]));
  });
  return out;
};

export const expertiseOf = (parts, part, focus = null) => {
  const table = parts?.expertise?.[part];
  if (!table) return 50;
  const stats = Object.keys(DEV.parts[part].stats);
  if (focus && table[focus] !== undefined) return (table[focus] * 2 + stats.reduce((sum, stat) => sum + (table[stat] ?? 50), 0)) / (stats.length + 2);
  return stats.reduce((sum, stat) => sum + (table[stat] ?? 50), 0) / stats.length;
};

// --------------------------------------------------------------- AI / shift

/**
 * Move one area of a team by `delta` points through its parts: every fitted
 * design's stats in that area rise by delta, so the weighted mean - the area -
 * rises by exactly delta. The rivals' cheap development and the legacy area
 * projects both go through here.
 */
export const shiftArea = (team, area, delta) => {
  const parts = team.parts;
  if (!parts || !delta) return;
  const touched = new Set();
  parts.loadout.forEach((_, car) => {
    parts.list.forEach((part) => {
      const hit = fitted(parts, car, part);
      if (hit && !touched.has(hit.design.id)) touched.add(hit.design.id);
    });
  });
  touched.forEach((id) => {
    const design = parts.designs[id];
    Object.keys(design.stats).forEach((stat) => {
      if (statArea(stat) === area) design.stats[stat] = roundStat(design.stats[stat] + delta);
    });
  });
};

/**
 * Bring a rival's parts to a new four-area car (aiDevelopmentStep's output),
 * then cache it exactly. The parts follow the car; the car stays what the old
 * model would have produced (RF-DEV-09 balance).
 */
export const followCar = (team, car) => {
  if (!team.parts) {
    team.car = car;
    return car;
  }
  const before = rawAreasOf(team.parts, 0);
  AREA_LIST.forEach((area) => shiftArea(team, area, car[area] - before[area]));
  team.parts.cars = team.parts.loadout.map(() => ({ ...car }));
  team.car = car;
  return car;
};
