/**
 * Design -> manufacture -> fit (RF-DEV-02), expertise (RF-DEV-03) and the
 * next-year project (RF-DEV-06), for the player's team.
 *
 *   design       pick a part, a pace (Normal ×1, Accelerated ×1.5, Intense ×3
 *                with +50 % expertise, Emergency ×4), a target season (this car
 *                or next year's) and optionally a stat to focus on. It costs
 *                money (and, from 2021, cost-cap room and wind-tunnel/CFD time),
 *                takes rounds, can fail, and comes out as a new design whose
 *                stats are the old design's plus the gains.
 *   manufacture  body parts are built as units, limited per design; each unit
 *                costs money and a round of build time.
 *   fit          a built unit goes on either car; the one it replaces becomes a
 *                spare. Unit parts (engine, gearbox, ERS/KERS) arrive with each
 *                driver's next power unit or gearbox (RF-SIM-14).
 *
 * Gains follow the old projects' formula (staff, factory, ceiling, saturation,
 * luck) so a season of development is worth what it was; expertise raises the
 * quality and the ceiling of later designs. Every number in development.json.
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import DEV from "../../data/balance/development.json";
import { moneyScale, roundMoney } from "../economy";
import { AREA_LIST, addItem, areaShare, expertiseOf, fitted, isBodyPart, isUnitPart, itemById, roundStat, statArea, syncCar } from "./parts";
import { canDevelop } from "./supply";
import { testingRisk } from "./aero";

export const PACES = Object.keys(DEV.paces).filter((key) => !key.startsWith("$"));

const D = DEV.design;

/** The newest design of a part for the current season (the base a new design starts from). */
export const latestDesign = (parts, part) =>
  Object.values(parts.designs)
    .filter((design) => design.part === part && design.season === parts.season)
    .sort((a, b) => b.version - a.version)[0] || null;

export const designCost = (part, pace, year) => roundMoney(DEV.parts[part].designCost * DEV.paces[pace].cost * moneyScale(year));

export const designRounds = (part, pace) => Math.max(1, Math.round(DEV.parts[part].designRounds * DEV.paces[pace].rounds));

export const unitCost = (part, year, pace = "normal") => roundMoney((DEV.parts[part].unitCost || 0) * DEV.paces[pace].cost * moneyScale(year));

export const designFailure = ({ part, pace, technical = 60, year }) =>
  clamp(DEV.parts[part].risk * (D.riskStaffBase - technical / 100) * DEV.paces[pace].risk * testingRisk(year), D.riskMin, D.riskMax);

/**
 * Expected gains of a design, per stat and per area, before luck.
 * `context`: { parts, car (team.car), bestRival (per area), technical, facility,
 * seasonGain (per area, this target), regulationChange }.
 */
export const expectedDesign = ({ part, pace, target, focus, parts, car, bestRival, technical = 60, facility = 2, seasonGain = {}, regulationChange = false }) => {
  const spec = DEV.parts[part];
  const staff = D.staffBase + technical * D.staffPerPoint;
  const factory = D.factoryBase + facility * D.factoryPerLevel;
  const expertise = expertiseOf(parts, part, focus);
  const quality = 1 + (expertise - 50) * DEV.expertise.quality;
  const nextYear = target === "next" ? (regulationChange ? D.nextYearReset : D.nextYear) : 1;
  const stats = {};
  const areas = {};
  Object.entries(spec.areaGain).forEach(([area, base]) => {
    const share = areaShare(parts.list, part, area);
    if (!share) return;
    const lead = area === "reliability" ? 0 : Math.max(0, (car[area] ?? 60) - (bestRival[area] ?? 60));
    const allowed = (expertise - 50) * DEV.expertise.ceiling;
    const ceiling = clamp(1 - Math.max(0, lead - allowed) / D.leadSoftness, D.ceilingMin, 1);
    const saturation = 1 / (1 + Math.max(0, seasonGain[area] || 0) / (area === "reliability" ? D.saturationReliability : D.saturation));
    const gain = base * staff * factory * ceiling * saturation * quality * DEV.paces[pace].quality * nextYear;
    const own = Object.keys(spec.stats).filter((stat) => statArea(stat) === area);
    own.forEach((stat) => {
      const tilt = focus ? (stat === focus ? D.focusBoost : D.focusOthers) : 1;
      stats[stat] = (gain / share) * tilt;
    });
    // The area moves by the weighted mean of its stats' gains.
    const weights = own.map((stat) => spec.stats[stat]);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    areas[area] = (share * own.reduce((sum, stat, index) => sum + stats[stat] * weights[index], 0)) / total;
  });
  return { stats, areas };
};

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Advance the player's designs one round. Returns { finished } with the new
 * designs (target "now") and the next-year gains (target "next"). `stream` is a
 * seeded substream.
 */
export const progressDesigns = ({ queue, stream }) => {
  const finished = [];
  const active = [];
  queue.forEach((entry) => {
    const next = { ...entry, roundsLeft: entry.roundsLeft - 1 };
    if (next.roundsLeft > 0) {
      active.push(next);
      return;
    }
    const failed = stream.chance(entry.failure);
    const luck = clamp(stream.normal(1, D.luckSd), D.luckMin, D.luckMax);
    const factor = failed ? (stream.chance(0.5) ? D.failedBad : D.failedGood) : luck;
    finished.push({ ...next, failed, factor: round2(factor) });
  });
  return { active, finished };
};

/** Turn a finished design into a stored design of the team (target "now"). */
export const realiseDesign = (parts, entry) => {
  const base = parts.designs[entry.base] || latestDesign(parts, entry.part);
  const version = Math.max(0, ...Object.values(parts.designs).filter((design) => design.part === entry.part && design.season === parts.season).map((design) => design.version)) + 1;
  const id = `${entry.teamId}-${parts.season}-${entry.part}-${version}`;
  const stats = {};
  Object.keys(DEV.parts[entry.part].stats).forEach((stat) => {
    stats[stat] = roundStat((base?.stats[stat] ?? 60) + (entry.expected.stats[stat] || 0) * entry.factor);
  });
  parts.designs[id] = { id, part: entry.part, version, season: parts.season, stats, origin: "design", pace: entry.pace, focus: entry.focus || null, failed: entry.failed };
  if (isUnitPart(entry.part)) parts.pending = { ...(parts.pending || {}), [entry.part]: id };
  return parts.designs[id];
};

/** RF-DEV-03: expertise grows with every design, more at the Intense pace and on the focused stat. */
export const growExpertise = (parts, entry) => {
  if (!parts.expertise) return;
  const table = (parts.expertise[entry.part] ||= {});
  Object.keys(DEV.parts[entry.part].stats).forEach((stat) => {
    const growth = DEV.expertise.growth * DEV.paces[entry.pace].expertise * (entry.focus === stat ? DEV.expertise.focusGrowth : 1) * (entry.failed ? DEV.expertise.failedGrowth : 1);
    table[stat] = Math.round(clamp((table[stat] ?? 50) + growth, 0, DEV.expertise.max) * 10) / 10;
  });
};

/** Units of a design that exist or are being built. */
export const unitsOfDesign = (parts, built, designId) =>
  (parts.items || []).filter((item) => item.design === designId && item.condition !== "destroyed").length + (built || []).filter((entry) => entry.design === designId).reduce((sum, entry) => sum + 1, 0);

export const canFitNow = (career) => !career.weekend || (career.weekend.stage === "practice" && !career.weekend.practice) || career.weekend.stage === "result";

/**
 * Fit an item to a car (0 or 1). The item that was there becomes a spare; an
 * item taken from the other car swaps places with it.
 */
export const fitItem = (team, itemId, car) => {
  const parts = team.parts;
  const item = itemById(parts, itemId);
  if (!item || !isBodyPart(item.part)) return { error: "invalid" };
  if (item.condition === "destroyed") return { error: "destroyed" };
  if (car !== 0 && car !== 1) return { error: "invalid" };
  const current = parts.loadout[car][item.part];
  const other = 1 - car;
  if (parts.loadout[other][item.part] === itemId) parts.loadout[other][item.part] = current;
  parts.loadout[car][item.part] = itemId;
  syncCar(team);
  return { ok: true };
};

/** Spares of a part type: built, not fitted, not destroyed - best first. */
export const sparesOf = (parts, part) => {
  const onCars = new Set(parts.loadout.map((car) => car[part]));
  return (parts.items || [])
    .filter((item) => item.part === part && !onCars.has(item.id) && item.condition !== "destroyed")
    .sort((a, b) => conditionRank(a.condition) - conditionRank(b.condition) || versionOf(parts, b) - versionOf(parts, a));
};

const conditionRank = (state) => DEV.damage.states.indexOf(state);
const versionOf = (parts, item) => parts.designs[item.design]?.version || 0;

/** The weighted value of a design for its part (to compare specs in the UI). */
export const designScore = (design) => {
  const stats = DEV.parts[design.part].stats;
  const total = Object.values(stats).reduce((sum, weight) => sum + weight, 0);
  return Object.entries(stats).reduce((sum, [stat, weight]) => sum + (design.stats[stat] ?? 60) * weight, 0) / total;
};

/** Customer engine upgrades: the supplier's development, spread over the season (RF-DEV-05). */
export const supplierUpgrade = (team, raceCount) => {
  const parts = team.parts;
  if (!parts?.supply || parts.supply.works) return;
  const supplied = parts.list.filter((part) => DEV.parts[part].supplied);
  const share = supplied.reduce((sum, part) => sum + areaShare(parts.list, part, "power"), 0);
  if (!share) return;
  const delta = DEV.engineSupply.customerUpgrade / Math.max(1, raceCount) / share;
  const touched = new Set();
  parts.loadout.forEach((_, car) => {
    supplied.forEach((part) => {
      const hit = fitted(parts, car, part);
      if (hit) touched.add(hit.design.id);
    });
  });
  touched.forEach((id) => {
    const design = parts.designs[id];
    Object.keys(design.stats).forEach((stat) => {
      if (statArea(stat) === "power") design.stats[stat] = roundStat(design.stats[stat] + delta);
    });
  });
};

export { canDevelop, addItem, AREA_LIST };
