/**
 * The headquarters (RF-HQ-01..03).
 *
 * Buildings with a level 1..5 (0 = not built), a condition 0..100 that falls a
 * little every Grand Prix, an upgrade that takes money and rounds, and a yearly
 * maintenance bill. Each building moves one or more effect keys; other modules
 * never look at buildings, they ask for an effect:
 *
 *   hqEffect(careerOrTeam, key, { year, teamId })
 *
 * Effect keys (data/balance/hq.json `effectKeys`; neutral value without the building):
 *
 *   manufacturingSlots  factory       parallel factory projects (integer, neutral 2)
 *   manufacturingCost   factory       cost multiplier on making parts (lower is better, 1)
 *   designSpeed         designCentre  design speed multiplier (higher is faster, 1)
 *   expertiseGain       designCentre  expertise gain multiplier (1)
 *   tunnelEfficiency    windTunnel    aero gain multiplier from tunnel work (1) × cost-cap penalty
 *   cfdEfficiency       cfd           aero gain multiplier from CFD (1, only from 1997) × cost-cap penalty
 *   setupKnowledge      simulator     extra setup knowledge per practice run (0, from 2004)
 *   forecastAccuracy    weatherCentre weight of the truth in the rain forecast, 0..1 (0.5)
 *   hospitalityIncome   hospitality   income per GP in 2024 USD before moneyScale (0)
 *   fanGrowth           hospitality   extra fans per GP (0)
 *   pitStopBonus        pitCrewCentre extra pit crew rating points (0, from 1994)
 *   reliabilityGain     reliabilityLab reliability points per season (0)
 *
 * The player's buildings live on `career.hq` (they persist across seasons); a
 * rival's are derived from its size each time (`team.buildings` if a later
 * module stores them). `team.facility` (used by car.js) is kept equal to the
 * factory level.
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import hqData from "../../data/balance/hq.json";
import { moneyScale, prizeMoney, roundMoney, sponsorIncome } from "../economy";
import { postTransaction } from "../finance/ledger";

export const HQ_BUILDINGS = hqData.buildings;
export const HQ_EFFECT_KEYS = Object.keys(hqData.effectKeys).filter((key) => !key.startsWith("$"));
export const HQ_MAX_LEVEL = hqData.maxLevel;
const SPEC = Object.fromEntries(HQ_BUILDINGS.map((building) => [building.id, building]));

export const buildingSpec = (id) => SPEC[id] || null;
export const buildingAvailable = (id, year) => Boolean(SPEC[id]) && year >= SPEC[id].availableFrom;

/** Which building drives each effect key. */
const SOURCE = {};
HQ_BUILDINGS.forEach((building) => Object.keys(building.effects).forEach((key) => (SOURCE[key] = building.id)));
export const effectSource = (key) => SOURCE[key] || null;

// ------------------------------------------------------------ starting size

/**
 * How big a team is in its start year, 0..1 (RF-HQ-03): prestige, the real
 * constructors' position of that year and its budget against the richest team.
 */
export const teamSizeScore = (team, { teamCount = 10, year = 2024, maxIncome = null } = {}) => {
  const w = hqData.startingLevels;
  const position = team.realPosition ?? Math.ceil(teamCount / 2);
  const positionScore = teamCount > 1 ? 1 - (clamp(position, 1, teamCount) - 1) / (teamCount - 1) : 0.5;
  const income = sponsorIncome(team.prestige ?? 0.4, year) + prizeMoney(position, teamCount, year);
  const budgetScore = maxIncome ? clamp(income / maxIncome, 0, 1) : clamp(team.prestige ?? 0.4, 0, 1);
  return clamp(w.wPrestige * (team.prestige ?? 0.4) + w.wPosition * positionScore + w.wBudget * budgetScore, 0, 1);
};

const fieldMaxIncome = (teams, year) => {
  const count = teams.length;
  return Math.max(1, ...teams.map((team) => sponsorIncome(team.prestige ?? 0.4, year) + prizeMoney(team.realPosition ?? Math.ceil(count / 2), count, year)));
};

/** Level of every building for a team in a year. Custom teams use their backer's factory size. */
export const startingLevels = (team, year, { teamCount = 10, maxIncome = null } = {}) => {
  const levels = {};
  const customBase = team.custom ? clamp(team.facility ?? 2, 1, HQ_MAX_LEVEL) : null;
  const size = customBase === null ? teamSizeScore(team, { teamCount, year, maxIncome }) : null;
  HQ_BUILDINGS.forEach((building) => {
    if (year < building.availableFrom) {
      levels[building.id] = 0;
      return;
    }
    const base = customBase !== null ? customBase : 1 + size * 4;
    levels[building.id] = clamp(Math.round(base + building.startOffset), 1, HQ_MAX_LEVEL);
  });
  return levels;
};

// ------------------------------------------------------------ state

const freshBuilding = (level) => ({ level, condition: level > 0 ? hqData.condition.start : 0, upgrade: null });

export const createHq = (career) => {
  const team = career.world.teams[career.teamId];
  const teams = Object.values(career.world.teams);
  const levels = startingLevels(team, career.year, { teamCount: teams.length, maxIncome: fieldMaxIncome(teams, career.year) });
  career.hq = {
    teamId: career.teamId,
    since: career.year,
    buildings: Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, freshBuilding(level)])),
    log: [],
  };
  syncFacility(career);
  return career.hq;
};

/** RNF-06: give an old save its headquarters (idempotent). */
export const ensureHq = (career) => {
  if (!career?.world?.teams?.[career.teamId]) return career?.hq || null;
  if (!career.hq || career.hq.teamId !== career.teamId) return createHq(career);
  HQ_BUILDINGS.forEach((building) => {
    if (!career.hq.buildings[building.id]) career.hq.buildings[building.id] = freshBuilding(0);
  });
  if (!Array.isArray(career.hq.log)) career.hq.log = [];
  return career.hq;
};

/** car.js reads team.facility for slots and factory quality: keep it equal to the factory level. */
export const syncFacility = (career) => {
  const team = career.world.teams[career.teamId];
  const factory = career.hq?.buildings?.factory;
  if (team && factory?.level) team.facility = factory.level;
};

// ------------------------------------------------------------ effects

const conditionFactor = (condition) => {
  const c = hqData.condition;
  if (condition >= c.goodCondition) return 1;
  return c.effectAtZero + (1 - c.effectAtZero) * clamp(condition / c.goodCondition, 0, 1);
};

const effectAt = (key, level, condition) => {
  const meta = hqData.effectKeys[key];
  const source = SPEC[SOURCE[key]];
  if (!meta || !source) return undefined;
  if (!level) return meta.neutral;
  const value = source.effects[key][clamp(level, 1, HQ_MAX_LEVEL) - 1];
  const effective = meta.neutral + (value - meta.neutral) * conditionFactor(condition);
  return meta.integer ? Math.round(effective) : Math.round(effective * 1000) / 1000;
};

const PENALISED = new Set(["tunnelEfficiency", "cfdEfficiency"]);

/** Cost-cap breach penalty on aero testing this season (RF-FIN-02), 1 = none. */
export const capPenaltyFactor = (career) => {
  const penalty = career?.finances?.capPenalty;
  return penalty && penalty.year === career.year ? penalty.developmentFactor : 1;
};

/**
 * The value of an effect key. `subject` is a career (the player's team, or
 * `teamId` if given) or a team object (needs `year` in opts for era availability).
 */
export const hqEffect = (subject, key, opts = {}) => {
  if (!hqData.effectKeys[key] || key.startsWith("$")) throw new Error(`hqEffect: unknown key ${key}`);
  const source = SOURCE[key];
  if (subject?.world) {
    const career = subject;
    const teamId = opts.teamId || career.teamId;
    let building;
    if (teamId === career.teamId && career.hq?.teamId === career.teamId) building = career.hq.buildings[source];
    else {
      const team = career.world.teams[teamId];
      if (!team) return hqData.effectKeys[key].neutral;
      building = teamBuilding(team, source, career.year, Object.keys(career.world.teams).length);
    }
    const value = effectAt(key, building?.level || 0, building?.condition ?? 100);
    return PENALISED.has(key) && teamId === career.teamId ? Math.round(value * capPenaltyFactor(career) * 1000) / 1000 : value;
  }
  const building = teamBuilding(subject || {}, source, opts.year ?? 2024, opts.teamCount ?? 10);
  return effectAt(key, building?.level || 0, building?.condition ?? 100);
};

const teamBuilding = (team, source, year, teamCount) => {
  if (team.buildings?.[source]) return team.buildings[source];
  const level = startingLevels(team, year, { teamCount })[source];
  return { level, condition: 100 };
};

/** Every effect key for the subject: handy for the UI and for debugging. */
export const hqEffects = (subject, opts = {}) => Object.fromEntries(HQ_EFFECT_KEYS.map((key) => [key, hqEffect(subject, key, opts)]));

// ------------------------------------------------------------ forecast (weather centre)

/** Weather-centre accuracy for the player's team (0..1). */
export const forecastAccuracy = (career, teamId) => hqEffect(career, "forecastAccuracy", { teamId });

/**
 * Friday's rain forecast with the team's accuracy. `kind` is the weather the
 * race will really have ("dry" | "mixed" | "wet"), `rain` the circuit's rain
 * share (profile.rain), `stream` a seeded stream. Pure: the weekend code calls
 * it in place of race.js's fixed-weight forecast.
 */
export const forecastWithAccuracy = ({ kind, rain = 0.15, accuracy = 0.7, stream }) => {
  const f = hqData.forecast;
  const truth = f.truthByKind[kind] ?? 0;
  const acc = clamp(accuracy, 0, 1);
  const noise = stream ? stream.normal(0, f.noiseAtZero * (1 - acc)) : 0;
  return Math.round(clamp(truth * acc + rain * 100 * (1 - acc) + noise, 0, f.max));
};

// ------------------------------------------------------------ upgrades and upkeep

const scaled = (career, amount) => roundMoney(amount * moneyScale(career.year));

export const upgradeQuote = (career, id) => {
  ensureHq(career);
  const spec = SPEC[id];
  if (!spec) return { error: "invalid" };
  const building = career.hq.buildings[id];
  if (!buildingAvailable(id, career.year)) return { error: "era", availableFrom: spec.availableFrom };
  if (building.upgrade) return { error: "busy" };
  if (building.level >= HQ_MAX_LEVEL) return { error: "max" };
  const index = Math.max(0, building.level - 1);
  return { id, from: building.level, to: building.level + 1, cost: scaled(career, spec.upgradeCost[index]), rounds: spec.upgradeRounds[index] };
};

export const activeUpgrades = (career) => Object.entries(ensureHq(career).buildings).filter(([, building]) => building.upgrade).map(([id, building]) => ({ id, ...building.upgrade }));

export const startUpgrade = (career, id) => {
  if (career.ended) return { error: "ended" };
  const quote = upgradeQuote(career, id);
  if (quote.error) return quote;
  if (activeUpgrades(career).length >= hqData.maxConcurrentUpgrades) return { error: "slots" };
  if (career.finances.balance < quote.cost) return { error: "money" };
  postTransaction(career, { amount: -quote.cost, category: "facilities", kind: "hq-upgrade", meta: { building: id, to: quote.to } });
  career.hq.buildings[id].upgrade = { to: quote.to, roundsLeft: quote.rounds, cost: quote.cost, started: { year: career.year, round: career.round } };
  career.hq.log.unshift({ year: career.year, round: career.round, building: id, kind: "upgrade-start", to: quote.to });
  career.hq.log.length = Math.min(career.hq.log.length, 40);
  return { ok: true, ...quote };
};

export const repairQuote = (career, id) => {
  ensureHq(career);
  const building = career.hq.buildings[id];
  if (!building || !building.level) return { error: "invalid" };
  const missing = Math.max(0, 100 - building.condition);
  return { id, missing: Math.round(missing), cost: scaled(career, missing * hqData.condition.repairCostPerPoint * building.level) };
};

export const repairBuilding = (career, id) => {
  const quote = repairQuote(career, id);
  if (quote.error) return quote;
  if (quote.missing <= 0) return { error: "none" };
  if (career.finances.balance < quote.cost) return { error: "money" };
  postTransaction(career, { amount: -quote.cost, category: "facilities", kind: "hq-repair", meta: { building: id } });
  career.hq.buildings[id].condition = 100;
  return { ok: true, ...quote };
};

/** Season maintenance of every built building, per Grand Prix (scaled dollars). */
export const hqMaintenancePerRace = (career) => {
  ensureHq(career);
  const races = Math.max(1, career.world.races.length);
  const total = Object.entries(career.hq.buildings).reduce((sum, [id, building]) => {
    if (!building.level) return sum;
    return sum + SPEC[id].maintenancePerSeason[building.level - 1];
  }, 0);
  return scaled(career, total / races);
};

/**
 * Advance the headquarters by `rounds` Grands Prix: buildings wear, upgrades
 * progress and finish. Returns the buildings finished this call.
 * Call site: career.closeWeekend, once per race (rounds = 1).
 */
export const hqAdvance = (career, rounds = 1) => {
  ensureHq(career);
  const finished = [];
  for (let step = 0; step < rounds; step += 1) {
    Object.entries(career.hq.buildings).forEach(([id, building]) => {
      if (building.level > 0) building.condition = Math.max(0, Math.round((building.condition - SPEC[id].degradationPerRound) * 10) / 10);
      if (!building.upgrade) return;
      building.upgrade.roundsLeft -= 1;
      if (building.upgrade.roundsLeft > 0) return;
      building.level = building.upgrade.to;
      building.condition = 100;
      building.upgrade = null;
      finished.push({ id, level: building.level });
      career.hq.log.unshift({ year: career.year, round: career.round, building: id, kind: "upgrade-done", to: building.level });
    });
  }
  career.hq.log.length = Math.min(career.hq.log.length, 40);
  syncFacility(career);
  return finished;
};

/**
 * New season: a new team means new buildings; otherwise upgrades started in
 * the winter keep going and buildings newly legal in the era appear (level 0,
 * buildable). Call site: financeNewSeason (engine/finance).
 */
export const hqNewSeason = (career) => {
  ensureHq(career);
  syncFacility(career);
  return career.hq;
};

/** Level of one building for the player (0 = not built). */
export const buildingLevel = (career, id) => ensureHq(career).buildings[id]?.level ?? 0;
