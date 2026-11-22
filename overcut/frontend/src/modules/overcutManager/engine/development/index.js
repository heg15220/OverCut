/**
 * The car side of a career: parts, designs, expertise, aero resources, engine
 * supply, damage and units (SRS 5.5 RF-DEV-01..08, RF-SIM-14, 6.5), as clear
 * functions career.js and offseason.js call at fixed points:
 *
 *   createCareer        initDevelopment(career)
 *   entrantsFor         seatCar(team, driverId, index)          per-car areas
 *   weekendRaceArgs     gridPenaltiesFor(career, entrants)      RF-SIM-14
 *   completeRace        raceIncidents(state) -> weekend.result.incidents
 *   closeWeekend        developmentAfterRace(career)            designs, builds, damage, units
 *                       rivalDevelopmentStep(career, step)      AI, cheap form
 *   raceFinances        engineFeePerRace(career)                RF-DEV-05
 *   startNextSeason     regulationCutCar(...) before nextYearCar (RF-DEV-07)
 *                       pendingNextGains(career)                RF-DEV-06
 *                       developmentNewSeason(career, ...)       new parts, units, ATR order
 *   save.js migration   ensureDevelopment(career, { backfill })  v1 -> v2 (RNF-06)
 *
 * Money goes through market.ledger (the finance module reroutes categories) and
 * the development cost cap (developmentCapLeft), like the old projects.
 */

import { clamp, substream } from "../../../overcutTrayectoria/engine/rng";
import DEV from "../../data/balance/development.json";
import { costCapFor } from "../economy";
import { addInbox } from "../inbox";
import { ledger } from "../market";
import { constructorStandings } from "../standings";
import { eraWithRegulations } from "../packs/packWorld";
import { rulesFor } from "../rules";
import { isRegulationReset, slotsFor } from "../car";
import {
  AREA_LIST, PART_TYPES, addItem, carOfSeat, fitted, followCar, isBodyPart, isUnitPart, partsForEra, roundStat, seedExpertise, seedParts, statArea, syncCar,
} from "./parts";
import {
  PACES, canDevelop, canFitNow, designCost, designFailure, designRounds, expectedDesign, fitItem, growExpertise, latestDesign, progressDesigns, realiseDesign,
  sparesOf, supplierUpgrade, unitCost, unitsOfDesign,
} from "./design";
import { aeroCostOf, aeroStatus, allocationFor, atrActive, meanAllocation, AERO_BALANCE } from "./aero";
import { engineSupplyFor } from "./supply";
import { rollDamage, worsen } from "./damage";
import { backfillUnits, forceNewUnit, freshUnits, partOfComponent, penaltiesForRound, unitsAfterRace } from "./units";
import { moneyScale, roundMoney } from "../economy";

export { raceIncidents } from "./damage";

const WINTER = new Set(["offseason", "review"]);
const isWinter = (career) => WINTER.has(career.phase);
const userTeamOf = (career) => career.world.teams[career.teamId];
const eraOfCareer = (career) => eraWithRegulations(career.year, career.world.regulations);

// ------------------------------------------------------------------ set-up

const teamPrestige = (career, team) => (team.id === career.teamId ? team.prestige ?? 0.4 : team.prestige ?? 0.4);

/** Seed a team's parts for the career's season if it has none (or old ones). */
const ensureTeamParts = (career, team, era, { expertise = null } = {}) => {
  if (team.parts && team.parts.season === career.year) return team.parts;
  const user = team.id === career.teamId;
  team.parts = seedParts({ team, year: career.year, era, supply: engineSupplyFor(team, career.year), withItems: user, expertise: user ? expertise : null, prestige: teamPrestige(career, team) });
  return team.parts;
};

/** Pace order as the stand-in for last year's table when there is none. */
const paceOrder = (career) =>
  Object.values(career.world.teams)
    .map((team) => ({ id: team.id, rating: team.car.aero * 0.38 + team.car.power * 0.32 + team.car.chassis * 0.3 }))
    .sort((a, b) => b.rating - a.rating)
    .reduce((out, row, index) => ({ ...out, [row.id]: index + 1 }), {});

const rdDefaults = (career) => {
  const rd = career.rd || (career.rd = { projects: [], done: [], nextGains: {}, seasonGain: {}, spend: 0 });
  rd.projects ||= [];
  rd.done ||= [];
  rd.nextGains ||= {};
  rd.seasonGain ||= {};
  rd.designs ||= [];
  rd.built ||= [];
  rd.aero ||= null;
  rd.atrStart ||= paceOrder(career);
  return rd;
};

/** A new career's parts, units and R&D state (RF-DEV-01). */
export const initDevelopment = (career) => {
  const era = eraOfCareer(career);
  Object.values(career.world.teams).forEach((team) => ensureTeamParts(career, team, era));
  rdDefaults(career);
  career.units = freshUnits(era, career.year, career.world.races.length);
  return career;
};

/**
 * Idempotent: anything a career lacks gets its default (RNF-06 migration and a
 * safety net after a team switch). `backfill` gives a v1 save, mid-season, the
 * units a nominal rotation would have used by now.
 */
export const ensureDevelopment = (career, { backfill = false } = {}) => {
  const era = eraOfCareer(career);
  Object.values(career.world.teams).forEach((team) => ensureTeamParts(career, team, era));
  rdDefaults(career);
  if (!career.units || career.units.year !== career.year) {
    career.units = freshUnits(era, career.year, career.world.races.length);
    if (backfill && career.round > 0) {
      const ids = Object.values(career.world.teams).flatMap((team) => team.drivers || []);
      backfillUnits(career.units, ids, career.round);
    }
  }
  return career;
};

// ------------------------------------------------------------- the grid

/** The seat (0/1) a driver races in for his team. */
export const seatOf = (team, driverId, index = 0) => {
  const seat = (team.drivers || []).indexOf(driverId);
  return seat >= 0 ? Math.min(seat, 1) : Math.min(index, 1);
};

/** The car one entrant races: that seat's loadout, or the team's car (RF-DEV-01). */
export const seatCar = (team, driverId, index = 0) => carOfSeat(team, seatOf(team, driverId, index));

export const gridPenaltiesFor = (career, entrants) => penaltiesForRound(career.units, career.round, entrants.map((entrant) => entrant.id));

// ------------------------------------------------------------------- money

/** Development money left under the cost cap (from 2021); winter spend is next year's. */
export const developmentCapLeft = (career) => {
  const winter = isWinter(career);
  const cap = costCapFor(winter ? career.year + 1 : career.year);
  const spent = winter ? career.rd.nextSpend || 0 : career.rd.spend;
  return cap === null ? null : Math.max(0, cap - spent);
};

const canPay = (career, cost) => {
  if (career.finances.balance < cost) return "money";
  const left = developmentCapLeft(career);
  if (left !== null && cost > left) return "cap";
  return null;
};

const charge = (career, cost, meta) => {
  career.finances.balance -= cost;
  if (isWinter(career)) career.rd.nextSpend = (career.rd.nextSpend || 0) + cost;
  else career.rd.spend += cost;
  ledger(career, -cost, "development", meta);
};

/** RF-DEV-05: the engine bill for one Grand Prix (customers only; custom teams pay their engine's price). */
export const engineFeePerRace = (career, team = userTeamOf(career)) => {
  const supply = team.parts?.supply || engineSupplyFor(team, career.year);
  if (supply.works) return 0;
  return roundMoney((supply.fee * moneyScale(career.year)) / Math.max(1, career.world.races.length));
};

export const engineSupplyOf = (career, team = userTeamOf(career)) => {
  const supply = team.parts?.supply || engineSupplyFor(team, career.year);
  return { ...supply, annualFee: supply.works ? 0 : roundMoney(supply.fee * moneyScale(career.year)) };
};

// ------------------------------------------------------------ aero (ATR)

const positionFor = (career, teamId) => {
  const races = career.world.races.length || 1;
  if (!isWinter(career) && career.round / races >= AERO_BALANCE.recalcAtShare && career.season?.results?.length) {
    return constructorStandings(career).find((row) => row.teamId === teamId)?.position;
  }
  if (isWinter(career)) return constructorStandings(career).find((row) => row.teamId === teamId)?.position;
  return career.rd.atrStart?.[teamId] ?? Math.ceil(Object.keys(career.world.teams).length / 2);
};

/** RF-DEV-04: the player's wind tunnel / CFD status right now. */
export const aeroResourcesOf = (career) => {
  const year = isWinter(career) ? career.year + 1 : career.year;
  return aeroStatus({
    state: career.rd.aero,
    era: isWinter(career) ? eraWithRegulations(year, null) : eraOfCareer(career),
    year,
    round: career.round,
    raceCount: career.world.races.length,
    winter: isWinter(career),
    position: positionFor(career, career.teamId),
  });
};

const spendAero = (career, cost) => {
  const status = aeroResourcesOf(career);
  if (!status.active || !cost) return;
  const year = isWinter(career) ? career.year + 1 : career.year;
  const used = status.used;
  career.rd.aero = { year, period: status.period, used: { windTunnelRuns: used.windTunnelRuns + cost.windTunnelRuns, cfdItems: used.cfdItems + cost.cfdItems } };
};

// ---------------------------------------------------------------- designs

const bestRivalOf = (career) => {
  const best = {};
  AREA_LIST.forEach((area) => {
    best[area] = Math.max(0, ...Object.values(career.world.teams).filter((team) => team.id !== career.teamId).map((team) => team.car[area] ?? 0));
  });
  return best;
};

/** Expected area gains already in the factory for a target (saturation). */
const inFactory = (career, target) => {
  const out = {};
  career.rd.designs.filter((entry) => entry.target === target).forEach((entry) => {
    Object.entries(entry.expected.areas).forEach(([area, gain]) => {
      out[area] = (out[area] || 0) + gain;
    });
  });
  career.rd.projects.filter((project) => project.target === target).forEach((project) => {
    out[project.area] = (out[project.area] || 0) + project.expected;
  });
  return out;
};

/** What a design would cost, take and deliver - and what blocks it. */
export const designQuote = (career, { part, pace = "normal", target = "now", focus = null }) => {
  const team = userTeamOf(career);
  const parts = team.parts;
  const effectiveTarget = isWinter(career) ? "next" : target;
  if (!parts || !parts.list.includes(part) || !DEV.paces[pace]) return { error: "invalid" };
  const validFocus = focus && DEV.parts[part].stats[focus] !== undefined ? focus : null;
  const technical = career.staff.technical?.rating ?? 60;
  const base = effectiveTarget === "now" ? career.rd.seasonGain : career.rd.nextGains;
  const pending = inFactory(career, effectiveTarget);
  const seasonGain = Object.fromEntries(AREA_LIST.map((area) => [area, (base[area] || 0) + (pending[area] || 0)]));
  const expected = expectedDesign({
    part, pace, target: effectiveTarget, focus: validFocus, parts, car: team.car, bestRival: bestRivalOf(career), technical, facility: team.facility ?? 2, seasonGain, regulationChange: isRegulationReset(career.year + 1),
  });
  const rounds = designRounds(part, pace);
  const left = career.world.races.length - career.round;
  const aeroCost = DEV.parts[part].aero ? aeroCostOf(part, pace) : null;
  const aero = aeroResourcesOf(career);
  const blocked = [];
  if (!canDevelop(parts.supply, part)) blocked.push("customer");
  if (effectiveTarget === "now" && rounds > left) blocked.push("late");
  if (aero.active && aeroCost && (aeroCost.windTunnelRuns > aero.left.windTunnelRuns || aeroCost.cfdItems > aero.left.cfdItems)) blocked.push("aero");
  if (career.rd.designs.length + career.rd.projects.length >= slotsFor(team.facility)) blocked.push("slots");
  return {
    part,
    pace,
    target: effectiveTarget,
    focus: validFocus,
    cost: designCost(part, pace, career.year),
    rounds,
    failure: designFailure({ part, pace, technical, year: career.year }),
    expected: { stats: round2map(expected.stats), areas: round2map(expected.areas) },
    aeroCost: aero.active ? aeroCost : null,
    late: blocked.includes("late"),
    blocked,
  };
};

const round2map = (map) => Object.fromEntries(Object.entries(map).map(([key, value]) => [key, Math.round(value * 100) / 100]));

/** Commission a design (RF-DEV-02). */
export const startDesign = (career, request) => {
  if (career.phase === "ended" || career.ended) return { error: "ended" };
  if (!PACES.includes(request.pace || "normal")) return { error: "invalid" };
  const quote = designQuote(career, request);
  if (quote.error) return quote;
  if (quote.blocked.length) return { error: quote.blocked[0] };
  const money = canPay(career, quote.cost);
  if (money) return { error: money };
  const team = userTeamOf(career);
  career.serial.projects += 1;
  const entry = {
    id: `ds-${career.serial.projects}`,
    teamId: team.id,
    part: quote.part,
    pace: quote.pace,
    target: quote.target,
    focus: quote.focus,
    roundsLeft: quote.rounds,
    rounds: quote.rounds,
    cost: quote.cost,
    expected: quote.expected,
    failure: quote.failure,
    base: latestDesign(team.parts, quote.part)?.id || null,
    started: career.round,
    winter: isWinter(career),
    season: quote.target === "next" ? career.year + 1 : career.year,
  };
  career.rd.designs.push(entry);
  charge(career, quote.cost, { part: quote.part, stage: "design", pace: quote.pace });
  spendAero(career, quote.aeroCost);
  return { ok: true, design: entry };
};

/** Build units of a design (RF-DEV-02); `fit` = 0, 1 or "both" fits them when they are ready. */
export const manufactureParts = (career, { designId, count = 1, fit = null }) => {
  if (career.phase === "ended" || career.ended) return { error: "ended" };
  if (isWinter(career)) return { error: "winter" };
  const team = userTeamOf(career);
  const design = team.parts?.designs[designId];
  if (!design || !isBodyPart(design.part) || design.season !== career.year) return { error: "invalid" };
  const room = DEV.parts[design.part].maxUnits - unitsOfDesign(team.parts, career.rd.built, designId);
  const units = Math.max(0, Math.min(Math.round(count), room));
  if (units < 1) return { error: "units" };
  const cost = unitCost(design.part, career.year) * units;
  const money = canPay(career, cost);
  if (money) return { error: money };
  const targets = fit === "both" ? [0, 1] : fit === 0 || fit === 1 ? [fit] : [];
  for (let index = 0; index < units; index += 1) {
    career.rd.built.push({ design: designId, part: design.part, roundsLeft: DEV.parts[design.part].buildRounds, fit: targets[index] ?? null });
  }
  charge(career, cost, { part: design.part, stage: "manufacture", units });
  return { ok: true, units, cost };
};

/** Fit a built part to a car (RF-DEV-02); not under parc fermé. */
export const fitPart = (career, { itemId, car }) => {
  if (!canFitNow(career)) return { error: "parc-ferme" };
  return fitItem(userTeamOf(career), itemId, car);
};

/** The player takes a fresh power unit / gearbox now to bring the newest spec (RF-SIM-14). */
export const fitNewUnitNow = (career, { driverId, comp }) => {
  if (!canFitNow(career)) return { error: "parc-ferme" };
  const team = userTeamOf(career);
  if (!(team.drivers || []).includes(driverId) || !career.units.components.some((entry) => entry.id === comp)) return { error: "invalid" };
  const penalty = forceNewUnit({ units: career.units, era: eraOfCareer(career), driverId, comp });
  newUnitSpec(career, driverId, comp);
  return { ok: true, penalty };
};

/** A new unit carries the newest spec of its part to that driver's car. */
const newUnitSpec = (career, driverId, comp) => {
  const part = partOfComponent(comp);
  if (!part) return;
  const team = Object.values(career.world.teams).find((entry) => (entry.drivers || []).includes(driverId));
  const pending = team?.parts?.pending?.[part];
  if (!pending) return;
  const seat = seatOf(team, driverId);
  team.parts.loadout[seat][part] = pending;
  if (team.parts.loadout.every((car) => car[part] === pending)) delete team.parts.pending[part];
  syncCar(team);
};

/** A unit-part spec in an era that does not count that unit goes straight on both cars. */
const fitSpecIfUncounted = (career, team, design) => {
  const counted = (career.units?.components || []).some((comp) => partOfComponent(comp.id) === design.part);
  if (counted) return;
  team.parts.loadout.forEach((car) => {
    car[design.part] = design.id;
  });
  delete team.parts.pending[design.part];
};

// -------------------------------------------------------------- after race

const progressUserDesigns = (career, team) => {
  const stream = substream(career.seed, "design", career.year, career.round);
  const { active, finished } = progressDesigns({ queue: career.rd.designs, stream });
  career.rd.designs = active;
  finished.forEach((entry) => {
    growExpertise(team.parts, entry);
    const areas = Object.fromEntries(Object.entries(entry.expected.areas).map(([area, gain]) => [area, Math.round(gain * entry.factor * 100) / 100]));
    if (entry.target === "next") {
      Object.entries(areas).forEach(([area, gain]) => {
        career.rd.nextGains[area] = (career.rd.nextGains[area] || 0) + gain;
      });
    } else {
      const design = realiseDesign(team.parts, entry);
      entry.designId = design.id;
      Object.entries(areas).forEach(([area, gain]) => {
        career.rd.seasonGain[area] = (career.rd.seasonGain[area] || 0) + Math.max(0, gain);
      });
      if (isUnitPart(design.part)) fitSpecIfUncounted(career, team, design);
    }
    career.rd.done.unshift({ id: entry.id, part: entry.part, pace: entry.pace, target: entry.target, failed: entry.failed, areas, designId: entry.designId || null, year: career.year, round: career.round + 1 });
    addInbox(career, { kind: entry.failed ? "design-failed" : "design-done", part: entry.part, target: entry.target, areas, designId: entry.designId || null });
  });
  career.rd.done = career.rd.done.slice(0, DEV.design.historyKept);
};

const progressBuilds = (career, team) => {
  const still = [];
  const ready = [];
  career.rd.built.forEach((entry) => {
    const next = { ...entry, roundsLeft: entry.roundsLeft - 1 };
    if (next.roundsLeft > 0) still.push(next);
    else ready.push(next);
  });
  career.rd.built = still;
  ready.forEach((entry) => {
    const item = addItem(team.parts, entry.design, entry.part);
    if (entry.fit === 0 || entry.fit === 1) fitItem(team, item.id, entry.fit);
  });
  if (ready.length) addInbox(career, { kind: "parts-built", count: ready.length, parts: [...new Set(ready.map((entry) => entry.part))] });
};

/** RF-DEV-08: the race's incidents as damage on the player's cars; destroyed parts need a spare. */
const applyDamage = (career, team) => {
  const incidents = career.weekend?.result?.incidents || [];
  const parts = team.parts;
  const body = parts.list.filter(isBodyPart);
  const report = [];
  (team.drivers || []).forEach((driverId, index) => {
    const own = incidents.filter((incident) => incident.driverId === driverId);
    const seat = seatOf(team, driverId, index);
    body.forEach((part) => {
      const hit = fitted(parts, seat, part);
      if (hit?.item) hit.item.races = (hit.item.races || 0) + 1;
    });
    if (!own.length) return;
    rollDamage({ incidents: own, seed: career.seed, year: career.year, round: career.round, driverId, parts: body }).forEach(({ part, severity }) => {
      const hit = fitted(parts, seat, part);
      if (!hit?.item) return;
      const before = hit.item.condition;
      hit.item.condition = worsen(before, severity);
      if (hit.item.condition === before) return;
      const row = { driverId, part, condition: hit.item.condition, replaced: null };
      const version = parts.designs[hit.item.design]?.version || 0;
      // Heavy damage: the mechanics fit a perfect spare of the same or a newer spec if there is one.
      const swap = hit.item.condition === "heavy" ? sparesOf(parts, part).find((item) => item.condition === "perfect" && (parts.designs[item.design]?.version || 0) >= version) : null;
      if (swap) {
        parts.loadout[seat][part] = swap.id;
        row.replaced = "spare";
      } else if (hit.item.condition === "destroyed") {
        const spare = sparesOf(parts, part)[0];
        if (spare) {
          parts.loadout[seat][part] = spare.id;
          row.replaced = "spare";
        } else {
          const cost = unitCost(part, career.year, "emergency");
          const fresh = addItem(parts, hit.item.design, part);
          parts.loadout[seat][part] = fresh.id;
          charge(career, cost, { part, stage: "emergency" });
          row.replaced = "emergency";
          row.cost = cost;
        }
      }
      report.push(row);
    });
  });
  // Destroyed parts off the cars are scrap.
  const onCars = new Set(parts.loadout.flatMap((car) => Object.values(car)));
  parts.items = parts.items.filter((item) => item.condition !== "destroyed" || onCars.has(item.id));
  if (report.length) addInbox(career, { kind: "part-damage", damage: report });
};

const reliabilityByDriver = (career) => {
  const out = {};
  Object.values(career.world.teams).forEach((team) => {
    (team.drivers || []).forEach((driverId) => {
      out[driverId] = seatCar(team, driverId).reliability ?? 60;
    });
  });
  return out;
};

/**
 * closeWeekend's car step for the player's team and the unit counts of the
 * whole grid: designs and builds advance, the race's damage lands, customer
 * engines get their supplier's upgrade, units wear and the next race's grid
 * penalties are set.
 */
export const developmentAfterRace = (career) => {
  ensureDevelopment(career);
  const team = userTeamOf(career);
  const summary = career.weekend?.result;
  progressBuilds(career, team);
  progressUserDesigns(career, team);
  if (summary) applyDamage(career, team);
  supplierUpgrade(team, career.world.races.length);
  syncCar(team);
  if (summary) {
    const reliability = reliabilityByDriver(career);
    unitsAfterRace({
      units: career.units,
      era: eraOfCareer(career),
      rows: summary.rows,
      seed: career.seed,
      year: career.year,
      round: career.round,
      hasNextRace: career.round + 1 < career.world.races.length,
      reliabilityOf: (driverId) => reliability[driverId] ?? 60,
      onNewUnit: (driverId, comp) => newUnitSpec(career, driverId, comp),
    });
    const mine = (team.drivers || []).map((driverId) => ({ driverId, ...(career.units.penalties.byDriver[driverId] || {}) })).filter((row) => row.places > 0);
    if (mine.length) addInbox(career, { kind: "unit-penalty", penalties: mine.map((row) => ({ driverId: row.driverId, places: row.places, items: row.items })) });
  }
  return career;
};

/**
 * RF-DEV-09 (task 9): rivals develop through the same parts, cheaply. The
 * season-long amount is still aiDevelopmentStep's (passed in as `step`, so the
 * balance does not move); from 2021 the aero share is weighted by the team's
 * wind-tunnel allocation over the field's mean (RF-DEV-04).
 */
export const rivalDevelopmentStep = (career, step) => {
  const raceCount = career.world.races.length;
  const era = eraOfCareer(career);
  const atr = atrActive(era, career.year);
  const teams = Object.values(career.world.teams);
  const mean = atr ? meanAllocation(career.year, teams.length) : 100;
  const positions = atr ? Object.fromEntries(teams.map((team) => [team.id, positionFor(career, team.id)])) : {};
  teams.forEach((team) => {
    if (team.id === career.teamId) return;
    ensureTeamParts(career, team, era);
    const stream = substream(career.seed, "ai-dev", career.year, career.round, team.id);
    const next = step({ team, raceCount, stream });
    if (atr) {
      const factor = 1 + AERO_BALANCE.aiElasticity * (allocationFor(career.year, positions[team.id]) / mean - 1);
      next.aero = Math.round(clamp(team.car.aero + (next.aero - team.car.aero) * factor, 20, 100) * 10) / 10;
    }
    followCar(team, next);
  });
};

/** Apply a legacy area project's gain (v1 saves) through the parts. */
export const applyAreaGain = (team, area, gain) => {
  if (!team.parts) {
    team.car[area] = clamp(team.car[area] + gain, 5, 100);
    return;
  }
  const parts = team.parts;
  const touched = new Set();
  parts.loadout.forEach((_, car) => parts.list.forEach((part) => {
    const hit = fitted(parts, car, part);
    if (hit) touched.add(hit.design.id);
  }));
  touched.forEach((id) => {
    const design = parts.designs[id];
    Object.keys(design.stats).forEach((stat) => {
      if (statArea(stat) === area) design.stats[stat] = roundStat(design.stats[stat] + gain);
    });
  });
  syncCar(team);
};

// -------------------------------------------------------------- the winter

/** RF-DEV-06: next-year designs still in the factory at the turn of the year. */
export const pendingNextGains = (career) => {
  const gains = {};
  (career.rd.designs || []).filter((entry) => entry.target === "next").forEach((entry) => {
    const share = entry.winter ? 1 : DEV.design.nextYearUnfinished;
    Object.entries(entry.expected.areas).forEach(([area, gain]) => {
      gains[area] = (gains[area] || 0) + gain * share;
    });
  });
  return gains;
};

/** The RF-DEV-07 changes of a season, or null. */
export const regulationChangeFor = (year) => DEV.regulationChanges[String(year)] || null;

/**
 * RF-DEV-07: a real rule change cuts the advantage a team carries into the new
 * era in the stats it rewrote. Ratings are relative to the season, so the cut
 * is applied to each area's edge over the field mean, in proportion to the
 * weight the affected stats have in that area on this car.
 */
export const regulationCutCar = ({ car, fieldMean, year, list = PART_TYPES }) => {
  const change = regulationChangeFor(year);
  if (!change) return car;
  const next = { ...car };
  AREA_LIST.forEach((area) => {
    let weightAll = 0;
    let cut = 0;
    list.forEach((part) => {
      Object.entries(DEV.parts[part].stats).forEach(([stat, weight]) => {
        if (statArea(stat) !== area) return;
        weightAll += weight;
        change.changes.forEach((entry) => {
          if (entry.stats.includes(stat)) cut += weight * entry.edgeCut;
        });
      });
    });
    if (!weightAll || !cut) return;
    const edge = (car[area] ?? 60) - (fieldMean[area] ?? 60);
    next[area] = (fieldMean[area] ?? 60) + edge * (1 - Math.min(1, cut / weightAll));
  });
  return next;
};

/**
 * The new season's parts for every team, the player's expertise carried over
 * (eroded by a regulation reset), the units reset and the ATR order from the
 * table just finished. Called by startNextSeason once the new world is built.
 */
export const developmentNewSeason = (career, { previousTeamId, previousParts, lastStandings }) => {
  const era = eraOfCareer(career);
  const team = userTeamOf(career);
  let expertise = null;
  if (previousTeamId === career.teamId && previousParts?.expertise) {
    const reset = isRegulationReset(career.year) || Boolean(regulationChangeFor(career.year));
    const seed = seedExpertise(partsForEra(era, team.id), team.prestige);
    expertise = {};
    Object.entries(previousParts.expertise).forEach(([part, stats]) => {
      expertise[part] = {};
      Object.entries(stats).forEach(([stat, value]) => {
        const floor = seed[part]?.[stat] ?? value;
        expertise[part][stat] = Math.round((reset ? floor + (value - floor) * (1 - DEV.expertise.resetDecay) : value) * 10) / 10;
      });
    });
  }
  Object.values(career.world.teams).forEach((entry) => {
    delete entry.parts;
    ensureTeamParts(career, entry, era, { expertise: entry.id === career.teamId ? expertise : null });
  });
  const rd = rdDefaults(career);
  rd.designs = [];
  rd.built = [];
  rd.aero = null;
  rd.atrStart = lastStandings && lastStandings.length ? Object.fromEntries(lastStandings.map((row) => [row.teamId, row.position])) : paceOrder(career);
  // Teams new to the grid start behind last year's field.
  Object.keys(career.world.teams).forEach((id) => {
    if (rd.atrStart[id] === undefined) rd.atrStart[id] = Object.keys(rd.atrStart).length + 1;
  });
  career.units = freshUnits(era, career.year, career.world.races.length);
  return career;
};

// ------------------------------------------------------------- for the UI

/** Everything the R&D screen shows about one car. */
export const loadoutOf = (career, seat) => {
  const team = userTeamOf(career);
  const parts = team.parts;
  return parts.list.map((part) => {
    const hit = fitted(parts, seat, part);
    return { part, design: hit?.design || null, item: hit?.item || null, condition: hit?.condition || "perfect", pending: parts.pending?.[part] || null };
  });
};

export const unitsOfDriver = (career, driverId) => {
  const units = career.units;
  if (!units) return [];
  const record = units.drivers[driverId];
  return units.components.map((comp) => ({
    ...comp,
    used: record?.[comp.id]?.used ?? 1,
    wear: record?.[comp.id]?.wear ?? 0,
    races: record?.[comp.id]?.races ?? 0,
  }));
};

export const pendingPenaltyOf = (career, driverId) => (career.units?.penalties?.round === career.round ? career.units.penalties.byDriver[driverId] || null : null);

export const rulesOfCareer = (career) => rulesFor(eraOfCareer(career));

export { sparesOf, PACES };
