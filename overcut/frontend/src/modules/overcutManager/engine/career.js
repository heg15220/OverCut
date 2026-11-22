/**
 * A team principal's career: creation, the race weekend, the gaps between
 * Grands Prix and the end of every season.
 *
 * The career is one plain object, small enough to save whole (a season's world
 * is a few dozen drivers and a dozen teams), and every function here mutates it
 * in place and returns what the interface needs to show. React keeps it in a ref
 * and re-renders on a version counter, the way the GameLock manager does.
 *
 * The f1db bootstrap and the reference tables are not part of the career: they
 * live in a context object, built once per session, because the only time a
 * career needs history again is when a new season starts.
 */

import { clamp, createStream, substream } from "../../overcutTrayectoria/engine/rng";
import { eraProfileFor } from "../../overcutTrayectoria/engine/eras";
import { prepareBootstrap } from "../../overcutTrayectoria/engine/world";
import {
  biasesOf, carFromRating, carRatingOf, expectedGain, failureChance, fieldBestOf, progressProjects,
  aiDevelopmentStep, projectCost, reliabilityOf, slotsFor, isRegulationReset, PROJECT_SIZES, AREAS,
} from "./car";
import { driverSalary, prizeMoney, roundMoney, sponsorIncome } from "./economy";
import { BACKERS, HEADQUARTERS, enginesFor, shortCode } from "./identity";
import { addInbox, addNews } from "./inbox";
import { ledger, startingStaff, userTeam } from "./market";
import { boardAfterRace, checkJobSecurity, generateJobOffers, seasonReview, setObjectives } from "./board";
import { maybeEvent, settlePromises } from "./events";
import { constructorStandings, driverStandings, emptySeason, recordRace, scoreRace } from "./standings";
import { driversOf, fillEmptySeats, prepareReference, signForTeam, teamsByPace } from "./world";
import { eraWithRegulations, roundLineup, worldForSeason } from "./packs/packWorld";
import { classificationOf, createRace, evaluatePlan, runQualifying, runToFinish, suggestPlan, weatherTimeline } from "./race";
import { createStepRace, runStepToFinish } from "./sim";
import { createSession, sessionFormat, sprintLaps } from "./sessionSim";
import { circuitFor } from "./venue";
import { timeShareAtDistance } from "./trackGeometry";
import { rulesFor } from "./rules";
import { createFinance, financeAfterRace, financeSeasonEnd } from "./finance";
import { hqAdvance } from "./hq";
import { deliverHistoryEvents, lineupWithAbsences, raceStarters } from "./history";
import {
  applyAreaGain, developmentAfterRace, developmentCapLeft as developmentCapLeftOf, gridPenaltiesFor, initDevelopment, raceIncidents,
  rivalDevelopmentStep, seatCar,
} from "./development";
import { FEELINGS, SLIDERS, feelingsOf, idealSetup, neutralSetup, practiceRun, satisfactionOf, setupLapTime } from "./setup";
import anchorBalance from "../data/balance/historical-anchors.json";

export const MANAGER_GAME = "overcut-manager";
/**
 * Save schema version (RNF-06). v2: parts, designs, expertise and units (RF-DEV-01..08, RF-SIM-14);
 * v3: books, sponsors, HQ (RF-FIN, RF-HQ); v4: historical mode (RF-CAR-05). save.js migrates older saves.
 */
export const MANAGER_VERSION = 4;

/**
 * RF-CAR-05: Histórico estricto or Libre. Strict (the default, data/balance/historical-anchors.json):
 * rivals the player does not alter tend to their real results race by race (SRS 6.1, guided anchor)
 * and history pulls them hard between seasons (SRS 6.5, k = seasonMix.strict); fixed-in-strict
 * events (SRS 6.4) apply. Free: the pack is only the starting point (k = seasonMix.free).
 */
export const MODES = { STRICT: "strict", FREE: "free" };
export const DEFAULT_MODE = anchorBalance.defaultMode === MODES.FREE ? MODES.FREE : MODES.STRICT;
export const modeOf = (career) => (career?.mode === MODES.FREE ? MODES.FREE : MODES.STRICT);
export const isStrict = (career) => modeOf(career) === MODES.STRICT;
/** SRS 6.5: how far history pulls a rival between seasons in this career's mode. */
export const seasonMixOf = (career) => anchorBalance.seasonMix[modeOf(career)];

export const PHASES = {
  PRESEASON: "preseason",
  RACING: "racing",
  REVIEW: "review",
  OFFSEASON: "offseason",
  ENDED: "ended",
};

/**
 * Built once per session: everything a career may need from history. `packs`
 * holds the validated season packs by year (RF-CAR-02); a year with a pack is
 * built from it, any other from the bootstrap.
 */
export const createContext = (bootstrap, reference, packs = {}) => ({
  bootstrap: bootstrap?.racesByYear && bootstrap.driverProfiles && !Array.isArray(bootstrap.driverProfiles) ? bootstrap : prepareBootstrap(bootstrap),
  reference: prepareReference(reference),
  packs: { ...packs },
});

/** Seasons a career can start in: a validated pack, or real data with a calendar and a grid. */
export const startableYears = (context) => {
  const years = new Set(context.bootstrap.seasonYears.filter((year) => (context.bootstrap.lineupsByYear[String(year)] || []).length >= 2));
  Object.keys(context.packs || {}).forEach((year) => years.add(Number(year)));
  return [...years].sort((a, b) => a - b);
};

/** The world of one season, as every caller must build it (RF-CAR-02). */
export const seasonWorld = (context, year, seed) =>
  worldForSeason({ bootstrap: context.bootstrap, reference: context.reference, year, seed, packs: context.packs });

// ------------------------------------------------------------ creation

/**
 * A team built from nothing. Its first car is placed in the field by how it was
 * funded; the engine it buys moves its power up or down; the drivers the player
 * picks are signed, and any taken from a real team leaves a seat the real team
 * fills from the market.
 */
export const buildCustomTeam = ({ world, custom, year }) => {
  const era = eraProfileFor(year);
  const backer = BACKERS[custom.backer] || BACKERS.corporate;
  const ratings = Object.values(world.teams).map((team) => carRatingOf(team.car)).sort((a, b) => a - b);
  const quantile = (q) => ratings[Math.round(clamp(q, 0, 1) * (ratings.length - 1))];
  const carRating = backer.carPercentile < 0 ? (ratings[0] ?? 60) - 1.5 : quantile(backer.carPercentile);
  const engines = enginesFor(year);
  const engine = engines.find((entry) => entry.id === custom.engineId) || engines[Math.floor(engines.length / 2)];
  const car = carFromRating({ carRating, reliability: era.finishRate, era, teamName: custom.name, year });
  car.power = clamp(car.power + engine.power, 20, 100);
  car.reliability = clamp(backer.reliability + engine.reliability, 5, 99);
  const name = String(custom.name || "OverCut Racing").trim().slice(0, 28) || "OverCut Racing";
  const hq = HEADQUARTERS.find((entry) => entry.id === custom.hq) || HEADQUARTERS[0];
  return {
    id: `custom-${shortCode(name).toLowerCase()}-${year}`,
    name,
    short: (custom.short || shortCode(name)).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || shortCode(name),
    color: custom.color || "#f2b705",
    color2: custom.color2 || "#10294f",
    country: custom.country || hq.country,
    hq: hq.id,
    real: false,
    custom: true,
    car,
    devSlope: 0,
    prestige: backer.prestige,
    drivers: [],
    reserve: null,
    realPosition: null,
    engine: { id: engine.id, name: engine.name, price: engine.price, tier: engine.tier },
    backer: backer.id,
    facility: backer.facility,
  };
};

/**
 * `mode` is RF-CAR-05's historical mode (default DEFAULT_MODE). `spectator` (validation, criterio
 * 7.2) runs the season with no principal at all: the nominal team races, develops and is guided as
 * a rival, and no board, books, events or mail are processed.
 */
export const createCareer = (context, { year, teamId = null, custom = null, managerName = "", seed = null, mode = DEFAULT_MODE, spectator = false }) => {
  const careerSeed = seed || `M${year}-${teamId || "custom"}-${Date.now().toString(36)}`;
  const world = seasonWorld(context, year, careerSeed);
  let team = teamId ? world.teams[teamId] : null;
  // A team that did not enter every Grand Prix of the year cannot be run (fixed anchor, SRS 6.1).
  if (team?.partial) team = null;
  const owner = Boolean(custom);
  let signingCosts = 0;

  if (custom) {
    team = buildCustomTeam({ world, custom, year });
    world.teams[team.id] = team;
    world.order.push(team.id);
    (custom.driverIds || []).slice(0, 2).forEach((driverId) => {
      const driver = world.drivers[driverId];
      if (!driver) return;
      const salary = driverSalary(driver.rating, team.prestige, year);
      // Taking a driver off a real team costs that team's release fee.
      if (driver.status === "grid" && driver.contract) signingCosts += roundMoney(driver.contract.salary * 0.8);
      signForTeam(world, driver, team, { year, until: year + 1, salary, role: "equal" });
    });
    fillEmptySeats(world, year);
  }
  if (!team) throw new Error("team-unavailable");

  const teamCount = Object.keys(world.teams).length;
  const expected = teamsByPace(world).findIndex((entry) => entry.id === team.id) + 1;
  const lastPosition = owner ? teamCount : team.realPosition ?? expected;
  const seasonIncome = sponsorIncome(team.prestige, year) + prizeMoney(lastPosition, teamCount, year);
  const backer = BACKERS[team.backer];
  const hq = HEADQUARTERS.find((entry) => entry.id === team.hq);

  const career = {
    game: MANAGER_GAME,
    v: MANAGER_VERSION,
    seed: careerSeed,
    mode: mode === MODES.FREE ? MODES.FREE : MODES.STRICT,
    ...(spectator ? { spectator: true } : {}),
    created: new Date().toISOString(),
    managerName: String(managerName || "").trim().slice(0, 32) || "Team Principal",
    startYear: year,
    year,
    teamId: team.id,
    owner,
    phase: PHASES.PRESEASON,
    round: 0,
    globalRound: 0,
    world,
    season: emptySeason(year),
    weekend: null,
    staff: startingStaff({ prestige: team.prestige, year, seed: careerSeed, headquarters: hq?.staff ?? 0 }),
    rd: { projects: [], done: [], nextGains: {}, seasonGain: {}, spend: 0 },
    finances: {
      balance: roundMoney(seasonIncome * (owner ? backer?.balance ?? 0.5 : 0.4) - signingCosts),
      seasonIncome,
      lastPosition,
      sponsors: [],
      ledger: [],
      season: { income: 0, spend: 0 },
    },
    board: { objectives: [], confidence: owner ? 70 : 62, warned: false, expected },
    reputation: owner ? 22 : clamp(25 + team.prestige * 35, 10, 80),
    fans: 60,
    market: { talks: {}, signed: {}, leaving: [], shortlist: [], poached: {}, staffRefresh: 0 },
    inbox: [],
    news: [],
    promises: [],
    history: [],
    trophies: [],
    jobOffers: [],
    review: null,
    ended: null,
    serial: { inbox: 0, news: 0, events: 0, projects: 0 },
    flags: { stops: [] },
    eventCooldown: {},
    version: 0,
  };
  if (signingCosts) ledger(career, -signingCosts, "buyout");
  // RF-DEV-01..08, RF-SIM-14: every team's parts seeded from its car, the player's R&D and the grid's units.
  initDevelopment(career);
  // RF-HQ-01..03, RF-FIN-01..05: buildings by real size, books, sponsor offers and the board.
  createFinance(career);

  setObjectives(career);
  addInbox(career, { kind: "welcome", teamId: team.id, year, owner });
  addInbox(career, { kind: "objectives" });
  addNews(career, { kind: owner ? "new-team" : "new-principal", teamId: team.id, manager: career.managerName });
  if (isRegulationReset(year + 1)) addInbox(career, { kind: "regulations", year: year + 1 });
  // RF-INB-02: historical events already due at the start of the career.
  deliverHistoryEvents(career);
  return career;
};

// ------------------------------------------------------------ the grid

/** The year's era, with the pack's regulations over it when the season has one. */
export const eraOf = (career) => eraWithRegulations(career.year, career.world.regulations);

export const currentRace = (career) => career.world.races[career.round] || null;

/** Every car on the grid as the race engine wants it. */
/** Is this team run by the player (a spectator career has no player)? */
const playerRuns = (career, teamId) => !career.spectator && teamId === career.teamId;

/**
 * RF-CAR-05, SRS 6.1 (guided anchor): in strict mode, how many rating points each
 * rival's car moves this Grand Prix towards the pace it really had that day. The
 * anchor is what the team really did (car and drivers together: a qualifying gap and
 * a race result), so it is compared with the team's car plus what its drivers of the
 * day add, in car-rating points (the era's driver and car weights). Targets are
 * re-centred on the guided rivals' current mean, so the anchor orders the rivals
 * without inflating or deflating the field against the player's car. Free mode, the
 * player's team and a custom team are never guided.
 */
export const guidanceFor = (career) => {
  const anchors = career.world.anchors;
  if (!isStrict(career) || !anchors) return {};
  const model = anchorBalance.guidance;
  const round = career.round;
  const race = currentRace(career);
  const era = eraOf(career);
  const field = career.world.order.map((teamId) => career.world.teams[teamId]).filter(Boolean);
  const lineups = Object.fromEntries(field.map((team) => [team.id, roundLineup({ world: career.world, team, race, isUser: playerRuns(career, team.id), userTeamId: career.spectator ? null : career.teamId })]));
  const guided = field.filter((team) => !team.custom && !playerRuns(career, team.id) && lineups[team.id].length && Number.isFinite(anchors[team.id]?.[round]));
  if (guided.length < 2) return {};
  const racing = field.filter((team) => lineups[team.id].length);
  const cars = racing.map((team) => carRatingOf(team.car));
  const drivers = racing.flatMap((team) => lineups[team.id].map((driver) => driver.rating));
  const sd = (values) => {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return { mean, sd: Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length)) || 1 };
  };
  const carMoments = sd(cars);
  const driverMoments = sd(drivers);
  const driverToCar = model.driverShare * (era.driverWeight / era.carWeight) * (carMoments.sd / driverMoments.sd);
  const strengthOf = (team) => {
    const lineup = lineups[team.id];
    const driverMean = lineup.reduce((sum, driver) => sum + driver.rating, 0) / lineup.length;
    return carRatingOf(team.car) + driverToCar * (driverMean - driverMoments.mean);
  };
  const current = Object.fromEntries(guided.map((team) => [team.id, strengthOf(team)]));
  const meanCurrent = guided.reduce((sum, team) => sum + current[team.id], 0) / guided.length;
  const meanTarget = guided.reduce((sum, team) => sum + anchors[team.id][round], 0) / guided.length;
  return Object.fromEntries(
    guided.map((team) => {
      const pace = model.strength * (anchors[team.id][round] - meanTarget - (current[team.id] - meanCurrent));
      const reliability = Number.isFinite(team.realReliability) ? model.reliabilityStrength : 0;
      return [team.id, { pace, reliability, target: team.realReliability }];
    }),
  );
};

export const entrantsFor = (career) => {
  const era = eraOf(career);
  const race = currentRace(career);
  const entrants = [];
  const guidance = guidanceFor(career);
  career.world.order.forEach((teamId) => {
    const team = career.world.teams[teamId];
    if (!team) return;
    const isUser = playerRuns(career, teamId);
    const guide = guidance[teamId];
    // The pit crew and the factory's build quality keep cars running.
    const operations = isUser ? (career.staff.operations?.rating ?? 60) : 50 + team.prestige * 30;
    // Pack seasons: only the teams and drivers really entered in this Grand Prix (SRS 6.1, criterio 7.2).
    const lineup = roundLineup({ world: career.world, team, race, isUser, userTeamId: career.spectator ? null : career.teamId });
    // SRS 6.1 fixed anchors: the player's driver who really missed this GP (injury, ban) is replaced by the reserve.
    (isUser ? lineupWithAbsences(career, team, lineup) : lineup).forEach((driver, index) => {
      // RF-DEV-01: each car races on its own loadout (the same areas as team.car on day one).
      const car = seatCar(team, driver.id, index);
      const { powerBias, aeroBias } = biasesOf(car);
      const own = reliabilityOf(car, era) + (operations - 60) * 0.0009;
      const reliability = clamp(guide?.reliability ? own + guide.reliability * (guide.target - own) : own, 0.25, 0.99);
      const morale = ((driver.morale ?? 70) - 65) * (isUser ? 0.05 : 0.01);
      entrants.push({
        id: driver.id,
        driverId: driver.id,
        driverName: driver.name,
        nat: driver.nat || null,
        teamId,
        teamName: team.name,
        short: team.short,
        color: team.color,
        color2: team.color2,
        carRating: carRatingOf(car) + (guide?.pace ?? 0),
        reliability,
        developmentSlope: 0,
        powerBias,
        aeroBias,
        driverRating: clamp(driver.rating + morale, 30, 99),
        qualifying: driver.attributes.qualifying,
        racecraft: driver.attributes.racecraft,
        consistency: driver.attributes.consistency,
        wet: driver.attributes.wet,
        technical: driver.attributes.technical,
        isUser,
      });
    });
  });
  return entrants;
};

const crewsFor = (career) => {
  const crews = {};
  const strategists = {};
  Object.values(career.world.teams).forEach((team) => {
    const own = playerRuns(career, team.id);
    crews[team.id] = own ? career.staff.operations?.rating ?? 60 : 48 + team.prestige * 34;
    strategists[team.id] = own ? career.staff.engineering?.rating ?? 60 : 45 + team.prestige * 35;
  });
  return { crews, strategists };
};

// ------------------------------------------------------------ weekend

export const PRACTICE_PROGRAMS = ["setup", "longrun", "quali"];
export const QUALI_STYLES = ["safe", "normal", "push"];

export const startWeekend = (career) => {
  if (career.phase === PHASES.PRESEASON) career.phase = PHASES.RACING;
  const race = currentRace(career);
  if (!race || career.ended) return null;
  if (career.weekend?.round === career.round) return career.weekend;
  career.weekend = { round: career.round, stage: "practice", practice: null, qualifying: null, plans: {}, result: null, setups: {}, runs: {} };
  return career.weekend;
};

const weekendSeed = (career) => `${career.seed}::${career.year}::${career.round}`;

/** Runs each driver gets in practice; a setup programme buys one more. */
export const PRACTICE_RUNS = 4;

const practiceRunsFor = (program) => PRACTICE_RUNS + (program === "setup" ? 1 : 0);

/** The setup a driver of the player's team wants at this weekend's circuit (hidden from the UI). */
const idealFor = (career, driverId) => idealSetup({ driverId, profile: currentRace(career)?.profile, seed: weekendSeed(career) });

/** The player's current sliders for a driver, and what practice has learnt so far. */
export const setupStateOf = (career, driverId) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  weekend.setups = weekend.setups || {};
  weekend.runs = weekend.runs || {};
  return {
    setup: weekend.setups[driverId] || neutralSetup(),
    runs: weekend.runs[driverId] || { count: 0, knowledge: 0, report: null, history: [] },
  };
};

export const setSetup = (career, driverId, setup) => {
  const weekend = startWeekend(career);
  if (!weekend) return career;
  weekend.setups = { ...(weekend.setups || {}), [driverId]: Object.fromEntries(SLIDERS.map((slider) => [slider, clamp(Math.round(setup[slider] ?? 50), 0, 100)])) };
  return career;
};

/**
 * One run in practice for one of the player's drivers, on the current sliders:
 * the driver's report on the five feelings and a narrower idea of the ideal.
 */
export const runSetupLap = (career, driverId, program = "setup") => {
  const weekend = startWeekend(career);
  if (!weekend || weekend.practice) return null;
  const driver = career.world.drivers[driverId];
  if (!driver) return null;
  const { setup, runs } = setupStateOf(career, driverId);
  if (runs.count >= practiceRunsFor(program)) return runs;
  const stream = substream(weekendSeed(career), `run::${driverId}::${runs.count}`);
  const result = practiceRun({
    setup,
    ideal: idealFor(career, driverId),
    knowledge: runs.knowledge,
    technical: driver.attributes?.technical ?? 50,
    engineering: career.staff.engineering?.rating ?? 60,
    stream,
  });
  const next = {
    count: runs.count + 1,
    knowledge: result.knowledge,
    report: result.report,
    satisfaction: result.satisfaction,
    history: [...(runs.history || []), Math.round(result.satisfaction * 100)],
  };
  weekend.runs = { ...(weekend.runs || {}), [driverId]: next };
  return next;
};

/** What the engineers would run without the player: the ideal plus an error their skill shrinks. */
const engineersSetup = (career, driverId, stream) => {
  const ideal = idealFor(career, driverId);
  const error = 16 * (1.1 - (career.staff.engineering?.rating ?? 60) / 110);
  return Object.fromEntries(SLIDERS.map((slider) => [slider, clamp(ideal[slider] + stream.normal(0, error), 0, 100)]));
};

/**
 * Friday. Each of the player's drivers runs one programme - chasing the setup
 * (an extra run), long runs on race fuel (better tyre life on Sunday) or
 * qualifying runs - on the setup the player has worked out, or, if they never
 * touched it, the engineers' own. Rivals do their own, as well as their money
 * and engineers allow.
 */
export const runPractice = (career, programs = {}) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  const stream = substream(weekendSeed(career), "practice");
  const practice = {};
  const feedback = {};
  entrantsFor(career).forEach((entrant) => {
    const team = career.world.teams[entrant.teamId];
    if (entrant.isUser) {
      const program = PRACTICE_PROGRAMS.includes(programs[entrant.id]) ? programs[entrant.id] : "setup";
      const state = setupStateOf(career, entrant.id);
      const touched = state.runs.count > 0 || Boolean(weekend.setups?.[entrant.id]);
      const setup = touched ? state.setup : engineersSetup(career, entrant.id, stream);
      if (!touched) weekend.setups[entrant.id] = Object.fromEntries(SLIDERS.map((slider) => [slider, Math.round(setup[slider])]));
      const ideal = idealFor(career, entrant.id);
      const satisfaction = satisfactionOf(setup, ideal);
      const now = feelingsOf(setup);
      const want = feelingsOf(ideal);
      const balance = now.oversteer - want.oversteer > 0.08 ? "oversteer" : want.oversteer - now.oversteer > 0.08 ? "understeer" : "good";
      practice[entrant.id] = {
        program,
        score: satisfaction,
        confidence: satisfaction,
        setup: setupLapTime(satisfaction),
        wear: program === "longrun" ? 0.88 : 1,
        quali: program === "quali" ? -0.12 : 0,
        // Wings against what the circuit asks: below it the car is quick on the
        // straights and slides in the corners; above it, the reverse - and safer in the rain.
        wing: (setup.frontWing + setup.rearWing - ideal.frontWing - ideal.rearWing) / 200,
        traction: Math.abs(now.traction - want.traction),
      };
      feedback[entrant.id] = {
        program,
        score: Math.round(satisfaction * 100),
        balance,
        feelings: Object.fromEntries(FEELINGS.map((feeling) => [feeling, Math.round(Math.max(0, 1 - Math.abs(now[feeling] - want[feeling]) / 0.22) * 100)])),
      };
    } else {
      const score = clamp(0.45 + team.prestige * 0.15 + stream.normal(0, 0.08), 0, 1);
      practice[entrant.id] = {
        program: "setup", score, confidence: 0.55 + score * 0.1, setup: -(score - 0.5) * 0.5, wear: 0.97, quali: 0,
        wing: clamp(stream.normal(0, 0.06), -0.18, 0.18), traction: clamp(Math.abs(stream.normal(0, 0.12)) * (1.2 - score), 0, 0.4),
      };
    }
  });
  weekend.practice = practice;
  weekend.feedback = feedback;
  weekend.stage = "qualifying";
  return feedback;
};

/** Saturday. Returns the grid. */
export const runQualifyingSession = (career, risk = {}) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  if (!weekend.practice) runPractice(career, {});
  const race = currentRace(career);
  const stream = substream(weekendSeed(career), "qualifying");
  const wetness = qualifyingWetness(career);
  const entrants = entrantsFor(career);
  const result = runQualifying({ entrants, race, era: eraOf(career), year: career.year, wetness, practice: weekend.practice, risk, stream });
  weekend.qualifying = { ...result, wetness, teams: Object.fromEntries(entrants.map((entrant) => [entrant.id, entrant.teamId])) };
  weekend.stage = afterQualifyingStage(career);
  // The strategist's plan for both cars, which the player may change.
  driversOf(career.world, career.teamId).forEach((driver) => {
    weekend.plans[driver.id] = defaultPlan(career);
  });
  return weekend.qualifying;
};

/** Saturday's weather: the same seeded draw for the quick and the played qualifying. */
const qualifyingWetness = (career) => {
  const race = currentRace(career);
  const forecast = substream(weekendSeed(career), "quali-weather");
  return forecast.chance((race.profile.rain ?? 0.15) * 0.8) ? forecast.range(0.2, 0.8) : 0;
};

/** Friday's weather for the played practice (its own draw: the quick practice has none). */
const practiceWetness = (career) => {
  const race = currentRace(career);
  const forecast = substream(weekendSeed(career), "practice-weather");
  return forecast.chance((race.profile.rain ?? 0.15) * 0.6) ? forecast.range(0.2, 0.7) : 0;
};

/** RF-WKD-01: is this a sprint weekend in an era that has them (2021-)? */
export const isSprintWeekend = (career) => {
  const race = currentRace(career);
  return Boolean(race?.sprint) && career.year >= 2021;
};

/** 2023-: a sprint shootout sets the sprint grid; 2021-2022: qualifying does, and the sprint sets Sunday's. */
export const sprintHasShootout = (career) => isSprintWeekend(career) && career.year >= 2023;

const afterQualifyingStage = (career) => (isSprintWeekend(career) ? "sprint" : "strategy");

/**
 * The arguments of a playable session (engine/sessionSim createSession, RF-WKD-02/03):
 * every entrant, the circuit's sector lines and pit entry, the day's weather, the
 * practice preparation, the race fuel each rival will declare where the era fuels for
 * the race in qualifying (its strategist's first stint), the single-lap run order
 * (reverse of the last race, else of car pace) and the tyre sets left (RF-WKD-05).
 */
export const sessionOptions = (career, kind) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  const race = currentRace(career);
  const era = eraOf(career);
  const rules = rulesFor(era);
  const entrants = entrantsFor(career);
  const circuit = circuitFor(race, career.year);
  const seed = weekendSeed(career);
  const raceFuel = {};
  if (kind === "qualifying" && rules.qualifying.raceFuel) {
    const base = defaultPlan(career);
    const first = base.stops[0] ?? Math.round(race.laps / 3);
    const stream = substream(seed, "quali-fuel");
    entrants.forEach((entrant) => {
      const spread = stream.int(-3, 3);
      // Rivals declare their strategist's first stint; the player starts from the plain one and may change it.
      raceFuel[entrant.id] = clamp(first + (entrant.isUser ? 0 : spread), 4, race.laps - 2);
    });
  }
  const last = career.season.results[career.season.results.length - 1];
  const previous = last ? last.rows.slice().sort((a, b) => (a.status === "finished" ? a.position : 99) - (b.status === "finished" ? b.position : 99)).map((row) => row.driverId) : [];
  const byPace = entrants.slice().sort((a, b) => b.carRating + b.driverRating * 0.3 - (a.carRating + a.driverRating * 0.3)).map((entrant) => entrant.id);
  const ranked = [...previous.filter((id) => byPace.includes(id)), ...byPace.filter((id) => !previous.includes(id))];
  return {
    kind,
    entrants,
    race,
    era,
    seed: `${seed}::${kind}`,
    wetness: kind === "practice" ? practiceWetness(career) : qualifyingWetness(career),
    practice: kind === "practice" ? {} : weekend.practice || {},
    raceFuel,
    runOrder: ranked.slice().reverse(),
    sectorShares: [timeShareAtDistance(circuit, 1 / 3), timeShareAtDistance(circuit, 2 / 3)],
    pitEntryShare: timeShareAtDistance(circuit, circuit.pit.entry),
    tyres: kind === "practice" ? null : weekend.tyres || null,
  };
};

/** A playable session for the current weekend (practice, qualifying or the sprint shootout). */
export const createWeekendSession = (career, kind) => {
  const options = sessionOptions(career, kind);
  return options ? createSession(options) : null;
};

/** The format of this weekend's qualifying or shootout, for the screens (RF-WKD-01). */
export const weekendSessionFormat = (career, kind) => sessionFormat({ kind, era: eraOf(career), race: currentRace(career), field: entrantsFor(career).length });

/**
 * Friday, played: the tyre sets the session left, the runs your drivers did, then the
 * practice the weekend keeps (runPractice with the programme each driver ran most).
 */
export const commitPracticeSession = (career, result, programmes = {}) => {
  const weekend = startWeekend(career);
  if (!weekend || weekend.practice) return weekend?.feedback || null;
  weekend.tyres = result.tyres;
  weekend.practiceRuns = Object.fromEntries(entrantsFor(career).filter((entrant) => entrant.isUser).map((entrant) => [entrant.id, result.runs[entrant.id] || []]));
  return runPractice(career, programmes);
};

/**
 * Saturday, played (engine/sessionSim sessionResult): the grid in runQualifying's shape,
 * plus the race fuel declared (2003-2009: the first stint, parc fermé) and the tyre the
 * top ten start on (2010-2021).
 */
export const commitQualifyingSession = (career, result) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  if (!weekend.practice) runPractice(career, {});
  const entrants = entrantsFor(career);
  const { tyres, runs, ...kept } = result;
  weekend.tyres = tyres;
  weekend.qualifying = { ...kept, wetness: qualifyingWetness(career), teams: Object.fromEntries(entrants.map((entrant) => [entrant.id, entrant.teamId])) };
  weekend.stage = afterQualifyingStage(career);
  driversOf(career.world, career.teamId).forEach((driver) => {
    weekend.plans[driver.id] = lockedPlan(career, driver.id, defaultPlan(career));
  });
  return weekend.qualifying;
};

/**
 * SRS 6.2 parc fermé: in the eras that qualified on race fuel, the first stop is the fuel
 * declared on Saturday; where the top ten start on their qualifying tyre, that is the
 * first set. A plan is held to both.
 */
const lockedPlan = (career, driverId, plan) => {
  const quali = career.weekend?.qualifying;
  const race = currentRace(career);
  if (!quali || !race) return plan;
  const next = { stops: [...(plan.stops || [])], compounds: [...(plan.compounds || [])] };
  const fuel = quali.fuel?.[driverId];
  if (Number.isFinite(fuel) && rulesFor(eraOf(career)).refuelling && next.stops.length) {
    next.stops[0] = clamp(Math.round(fuel), 2, race.laps - 2);
    next.stops = [...new Set(next.stops)].sort((a, b) => a - b);
  }
  const tyre = quali.startTyres?.[driverId];
  if (tyre && next.compounds.length) next.compounds[0] = tyre;
  return next;
};

/** What Saturday fixed for a driver's race plan (the strategy screen shows it locked). */
export const parcFermeOf = (career, driverId) => {
  const quali = career.weekend?.qualifying;
  return { fuel: quali?.fuel?.[driverId] ?? null, tyre: quali?.startTyres?.[driverId] ?? null };
};

/** The shootout, played or simulated: the sprint grid (2023-). */
export const commitShootout = (career, result) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  const { tyres, runs, ...kept } = result;
  if (tyres) weekend.tyres = tyres;
  weekend.shootout = kept;
  return weekend.shootout;
};

/** The shootout in one go (RF-WKD-02): the quick qualifying model on the shootout's own stream. */
export const runShootout = (career) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  const race = currentRace(career);
  const entrants = entrantsFor(career);
  const result = runQualifying({ entrants, race, era: eraOf(career), year: career.year, wetness: qualifyingWetness(career), practice: weekend.practice || {}, risk: {}, stream: substream(weekendSeed(career), "shootout") });
  return commitShootout(career, result);
};

/** The sprint's one set: the middle compound of the era (it has to last 100 km flat out). */
const sprintCompound = (rules) => {
  const options = rules.tyres.compounds;
  return options[Math.floor((options.length - 1) / 2)] || options[0];
};

/**
 * The sprint (2021-): about 100 km, no compulsory stop, the shootout's grid (2023-) or
 * qualifying's (2021-2022), the sprint's own seed. Same shape as weekendRaceArgs.
 */
export const sprintRaceArgs = (career) => {
  const weekend = startWeekend(career);
  if (!weekend || !isSprintWeekend(career)) return null;
  if (!weekend.qualifying) runQualifyingSession(career, {});
  if (sprintHasShootout(career) && !weekend.shootout) runShootout(career);
  const base = currentRace(career);
  const laps = sprintLaps(base);
  const race = { ...base, laps };
  const era = eraOf(career);
  const rules = rulesFor(era);
  const entrants = raceStarters(career, entrantsFor(career));
  const compound = sprintCompound(rules);
  const plans = Object.fromEntries(entrants.map((entrant) => [entrant.id, { stops: [], compounds: [compound] }]));
  const { crews, strategists } = crewsFor(career);
  const order = (sprintHasShootout(career) ? weekend.shootout.order : weekend.qualifying.order).filter((id) => entrants.some((entrant) => entrant.id === id));
  entrants.forEach((entrant) => {
    if (!order.includes(entrant.id)) order.push(entrant.id);
  });
  return { race, era, year: career.year, entrants, grid: order, plans, practice: weekend.practice, seed: `${weekendSeed(career)}::sprint`, crews, strategists, gridPenalties: {}, sprint: true };
};

/** The sprint quick: to the flag at once (RF-WKD-02). */
export const createSprintRace = (career) => {
  const args = sprintRaceArgs(career);
  return args ? createRace(args) : null;
};

/** Commit a finished sprint: its points (the pack's sprint scheme) and, in 2021-2022, Sunday's grid. */
export const completeSprint = (career, state) => {
  const weekend = startWeekend(career);
  if (!weekend || weekend.sprint) return weekend?.sprint || null;
  if (!state.finished) {
    if (state._sim) runStepToFinish(state);
    else if (state.mode === "step") throw new Error("completeSprint: a step race must be run to the flag in its simulator first");
    else runToFinish(state);
  }
  const era = eraOf(career);
  const scheme = era.sprintPoints || [];
  const names = Object.fromEntries(state.cars.map((car) => [car.id, car.name]));
  const classification = classificationOf(state);
  const driverPoints = {};
  const teamPoints = {};
  const rows = classification.map((row) => {
    const points = row.status === "finished" ? scheme[row.position - 1] ?? 0 : 0;
    if (points) {
      driverPoints[row.driverId] = (driverPoints[row.driverId] || 0) + points;
      teamPoints[row.teamId] = (teamPoints[row.teamId] || 0) + points;
    }
    return { driverId: row.driverId, teamId: row.teamId, name: names[row.id], position: row.position, grid: row.grid, status: row.status, gap: row.gap === null ? null : Math.round(row.gap * 10) / 10, lapsDown: row.lapsDown, points };
  });
  const finished = rows.filter((row) => row.status === "finished").map((row) => row.driverId);
  const others = rows.filter((row) => row.status !== "finished").map((row) => row.driverId);
  weekend.sprint = { laps: state.laps, rows, driverPoints, teamPoints, order: [...finished, ...others], setsGrid: !sprintHasShootout(career) };
  weekend.stage = "strategy";
  return weekend.sprint;
};

export const defaultPlan = (career) => {
  const race = currentRace(career);
  const plan = suggestPlan({ year: career.year, era: eraOf(career), laps: race.laps, baseLap: race.baseLap, profile: race.profile, crew: career.staff.operations?.rating ?? 60 });
  return { stops: plan.stops, compounds: plan.compounds };
};

export const setPlan = (career, driverId, plan) => {
  if (!career.weekend) return career;
  career.weekend.plans[driverId] = lockedPlan(career, driverId, { stops: [...(plan.stops || [])], compounds: [...(plan.compounds || [])] });
  return career;
};

/**
 * Sunday's race arguments (race.js createRace / sim createStepRace take the same):
 * the grid, every car's plan, crews and strategists, the weekend seed. Plain data
 * that survives postMessage, so the live race can be built inside the race worker
 * (SRS 4, engine/worker). Rival strategies are the strategist's best plan with a
 * little spread on the stop laps, so the field does not pit in formation.
 */
export const weekendRaceArgs = (career) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  if (!weekend.qualifying) runQualifyingSession(career, {});
  const race = currentRace(career);
  // SRS 6.1/6.4 fixed anchors: only the real starters (Indianapolis 2005: the six Bridgestone cars).
  const entrants = raceStarters(career, entrantsFor(career));
  const stream = substream(weekendSeed(career), "plans");
  const base = defaultPlan(career);
  const plans = {};
  entrants.forEach((entrant) => {
    if (entrant.isUser && weekend.plans[entrant.id]) {
      plans[entrant.id] = weekend.plans[entrant.id];
      return;
    }
    plans[entrant.id] = { stops: base.stops.map((lap) => clamp(lap + stream.int(-3, 3), 2, race.laps - 2)), compounds: base.compounds };
    // A played qualifying on race fuel: the rival's first stop is the fuel it declared (parc fermé).
    const declared = weekend.qualifying.fuel?.[entrant.id];
    if (Number.isFinite(declared) && plans[entrant.id].stops.length) {
      plans[entrant.id] = { ...plans[entrant.id], stops: [clamp(declared, 2, race.laps - 2), ...plans[entrant.id].stops.slice(1)].sort((a, b) => a - b) };
    }
  });
  const { crews, strategists } = crewsFor(career);
  // Anyone who has lost their seat since Saturday starts from the back. 2021-2022: the sprint sets the grid.
  const source = weekend.sprint?.setsGrid ? weekend.sprint.order : weekend.qualifying.order;
  const grid = source.filter((id) => entrants.some((entrant) => entrant.id === id));
  entrants.forEach((entrant) => {
    if (!grid.includes(entrant.id)) grid.push(entrant.id);
  });
  return {
    race,
    era: eraOf(career),
    year: career.year,
    entrants,
    grid,
    plans,
    practice: weekend.practice,
    seed: weekendSeed(career),
    crews,
    strategists,
    // RF-SIM-14: places lost for units over the era's allocation, set after the previous race.
    gridPenalties: gridPenaltiesFor(career, entrants),
    // A played qualifying: the tyre each of the top ten set its time on (2010-2021).
    ...(weekend.qualifying.startTyres && Object.keys(weekend.qualifying.startTyres).length ? { startTyres: weekend.qualifying.startTyres } : {}),
  };
};

/**
 * Sunday in the quick mode (race.js, lap by lap): what "simulate" runs to the flag
 * at once (RF-WKD-02, RNF-01).
 */
export const createWeekendRace = (career) => {
  const args = weekendRaceArgs(career);
  return args ? createRace(args) : null;
};

/**
 * Sunday in fixed steps (RF-SIM-01): the race the live view watches, where passes,
 * duels and the safety car happen on the road. The live view builds the same race
 * inside the race worker from `weekendRaceArgs`; this in-thread twin gives the same
 * race for the same seed (RF-SIM-15, RNF-05).
 */
export const createLiveWeekendRace = (career) => {
  const args = weekendRaceArgs(career);
  return args ? createStepRace(args) : null;
};

/**
 * Friday's forecast for Sunday: the chance of rain the weather service gives.
 * It reads the same seeded draw the race will use, so it is honest - and only a
 * forecast, so it is sometimes wrong.
 */
export const weekendForecast = (career) => {
  const race = currentRace(career);
  if (!race) return null;
  const stream = createStream(`${weekendSeed(career)}::race`);
  return weatherTimeline({ profile: race.profile, era: eraOf(career), laps: Math.max(5, race.laps || 60), stream }).forecast;
};

/** Seconds a plan gives away to the strategist's best one (0 = it is the best). */
export const planDelta = (career, plan) => {
  const race = currentRace(career);
  if (!race) return 0;
  const crew = career.staff.operations?.rating ?? 60;
  const args = { year: career.year, era: eraOf(career), laps: race.laps, baseLap: race.baseLap, profile: race.profile, crew };
  const best = suggestPlan(args);
  return Math.max(0, evaluatePlan({ ...args, plan }) - best.cost);
};

/** Commit a finished race to the season. */
export const completeRace = (career, state) => {
  const weekend = startWeekend(career);
  if (!weekend || weekend.result) return weekend?.result || null;
  if (!state.finished) {
    // A step race (RF-SIM-01) finishes in its own simulator; one that has lost it
    // (toRaceState, a postMessage copy) cannot be finished here.
    if (state._sim) runStepToFinish(state);
    else if (state.mode === "step") throw new Error("completeRace: a step race must be run to the flag in its simulator first");
    else runToFinish(state);
  }
  const names = Object.fromEntries(state.cars.map((car) => [car.id, car.name]));
  const classification = classificationOf(state);
  const fastestLap = state.fastestLap?.carId || null;
  const scored = scoreRace({ rows: classification, fastestLapDriverId: fastestLap, year: career.year, era: eraOf(career) });
  // The sprint's points count for the round they were scored in (2021-).
  const sprint = weekend.sprint || null;
  const driverPoints = { ...scored.driverPoints };
  const teamPoints = { ...scored.teamPoints };
  if (sprint) {
    Object.entries(sprint.driverPoints).forEach(([id, points]) => {
      driverPoints[id] = (driverPoints[id] || 0) + points;
    });
    Object.entries(sprint.teamPoints).forEach(([id, points]) => {
      teamPoints[id] = (teamPoints[id] || 0) + points;
    });
  }
  const rows = classification.map((row) => ({
    driverId: row.driverId,
    teamId: row.teamId,
    name: names[row.id],
    position: row.position,
    grid: row.grid,
    status: row.status,
    gap: row.gap === null ? null : Math.round(row.gap * 10) / 10,
    lapsDown: row.lapsDown,
    stops: row.stops,
    points: driverPoints[row.driverId] || 0,
    penalty: row.penalty || 0,
    ...(sprint ? { sprintPoints: sprint.driverPoints[row.driverId] || 0 } : {}),
  }));
  const summary = {
    round: career.round + 1,
    name: state.race.name,
    country: state.race.country,
    weather: state.weather.kind,
    wet: Math.round(Math.max(...state.weather.wetness) * 100) / 100,
    laps: state.laps,
    rows,
    fastestLap,
    pole: weekend.qualifying?.order?.[0] || null,
    teamPoints,
    safetyCars: state.events.filter((event) => event.type === "sc").length,
    ...(sprint ? { sprint: { laps: sprint.laps, winner: sprint.rows[0]?.driverId || null } } : {}),
  };
  recordRace(career.season, summary);
  // The lap chart lives on the weekend only - the season keeps the summary, saves stay small.
  // RF-DEV-08: the race's incidents, for the damage closeWeekend applies.
  weekend.result = { ...summary, chart: lapChartOf(state), incidents: raceIncidents(state) };
  weekend.stage = "result";
  afterRaceMorale(career, summary, state);

  const winner = rows[0];
  if (winner) addNews(career, { kind: "race", race: summary.name, driverId: winner.driverId, teamId: winner.teamId, mine: winner.teamId === career.teamId });
  return summary;
};

/** Position of every car at the end of every lap, from the race's own line crossings. */
const lapChartOf = (state) => {
  const laps = state.laps;
  const positions = Object.fromEntries(state.cars.map((car) => [car.id, []]));
  for (let lap = 1; lap <= laps; lap += 1) {
    const crossed = state.cars
      .map((car) => ({ id: car.id, entry: car.history?.[lap - 1] }))
      .filter((row) => row.entry && !row.entry.retired)
      .sort((a, b) => a.entry.end - b.entry.end);
    crossed.forEach((row, index) => positions[row.id].push(index + 1));
  }
  return {
    laps,
    cars: state.cars.map((car) => ({ id: car.id, name: car.name, color: car.color, isUser: car.isUser, grid: car.grid, positions: positions[car.id], stops: (car.history || []).filter((entry) => entry.pit).map((entry) => entry.lap) })),
  };
};

/** Drivers judge a Sunday against their team-mate and against the car. */
const afterRaceMorale = (career, summary, state) => {
  const own = summary.rows.filter((row) => row.teamId === career.teamId);
  const par = (career.board.expected || 5) * 2;
  own.forEach((row) => {
    const driver = career.world.drivers[row.driverId];
    if (!driver) return;
    const mate = own.find((other) => other.driverId !== row.driverId);
    let delta = 0;
    if (row.status === "finished") delta += clamp((par - row.position) * 0.6, -4, 5);
    else delta -= row.status === "mechanical" ? 2 : 3;
    if (mate && row.status === "finished" && mate.status === "finished") delta += row.position < mate.position ? 1.5 : -1.5;
    if (row.position === 1) delta += 4;
    driver.morale = clamp((driver.morale ?? 70) + delta, 0, 100);
  });
  // Being told to move over costs a driver who does not think of himself as a number two.
  state.events
    .filter((event) => event.type === "swap")
    .forEach((event) => {
      const yielded = career.world.drivers[event.otherId];
      if (yielded && yielded.contract?.teamId === career.teamId && yielded.contract.role !== "second") {
        yielded.morale = clamp(yielded.morale - 7, 0, 100);
      }
    });
};

/** The whole weekend in one go, with the strategist's plan and safe choices. */
export const simulateWeekend = (career) => {
  startWeekend(career);
  if (!career.weekend.practice) runPractice(career, {});
  if (!career.weekend.qualifying) runQualifyingSession(career, {});
  const state = createWeekendRace(career);
  runToFinish(state);
  return completeRace(career, state);
};

// ------------------------------------------------------ between races

/**
 * Close the weekend and move on to the next Grand Prix: the factory finishes
 * parts, rivals develop, money moves, the board reacts and something may land
 * on the desk. Returns the stops the interface should show.
 */
export const closeWeekend = (career) => {
  const weekend = career.weekend;
  if (!weekend?.result) return { stops: [] };
  career.flags = { stops: [] };
  const summary = weekend.result;
  const raceCount = career.world.races.length;

  if (career.spectator) return closeSpectatorWeekend(career, summary, raceCount);

  progressDevelopment(career);
  // RF-HQ-01/02: building upgrades progress, maintenance and wear.
  hqAdvance(career, 1);
  // RF-DEV-02/03/08, RF-SIM-14: designs and builds, race damage, supplier upgrades, units and next grid penalties.
  developmentAfterRace(career);
  rivalDevelopment(career);
  // RF-FIN-01/03: sponsorship, prize instalment, bonuses, hospitality, engine sales, fixed costs and damage.
  financeAfterRace(career, summary);
  boardAfterRace(career, summary);
  if (career.ended && !career.jobOffers.length) career.jobOffers = generateJobOffers(career, "sacked");

  const marketRound = Math.ceil(raceCount * 0.55);
  if (career.round + 1 === marketRound) addInbox(career, { kind: "market-open", year: career.year + 1, stop: false });
  if (career.round + 1 === raceCount - 3) {
    const expiring = driversOf(career.world, career.teamId).filter((driver) => driver.contract && driver.contract.until <= career.year);
    if (expiring.length) addInbox(career, { kind: "expiring", drivers: expiring.map((driver) => driver.id) });
  }

  career.weekend = null;
  career.round += 1;
  career.globalRound += 1;
  if (!career.ended) maybeEvent(career);
  // RF-INB-02: historical events due before the next GP.
  deliverHistoryEvents(career);

  if (career.round >= raceCount) endSeason(career);
  return { stops: career.flags.stops, summary };
};

/** A spectator's weekend (criterio 7.2): the grid develops, nobody manages anything. */
const closeSpectatorWeekend = (career, summary, raceCount) => {
  developmentAfterRace(career);
  rivalDevelopment(career);
  career.weekend = null;
  career.round += 1;
  career.globalRound += 1;
  if (career.round >= raceCount) {
    career.phase = PHASES.REVIEW;
    career.flags.stops.push({ kind: "season-review" });
  }
  return { stops: career.flags.stops, summary };
};

const progressDevelopment = (career) => {
  const stream = substream(career.seed, "rd", career.year, career.round);
  const { active, finished } = progressProjects({ projects: career.rd.projects, stream });
  const team = userTeam(career);
  finished.forEach((project) => {
    if (project.target === "next") {
      career.rd.nextGains[project.area] = (career.rd.nextGains[project.area] || 0) + project.gain;
    } else {
      applyAreaGain(team, project.area, project.gain);
      career.rd.seasonGain[project.area] = (career.rd.seasonGain[project.area] || 0) + Math.max(0, project.gain);
    }
    career.rd.done.unshift({ ...project, year: career.year, round: career.round + 1 });
    addInbox(career, { kind: project.failed ? "rd-failed" : "rd-done", area: project.area, size: project.size, target: project.target, gain: project.gain });
  });
  career.rd.done = career.rd.done.slice(0, 16);
  career.rd.projects = active;
};

/** Rivals develop through their parts with aiDevelopmentStep's season-long amount (RF-DEV-04, task 9). */
const rivalDevelopment = (career) =>
  // A spectator's nominal team develops like every other rival (the shallow copy shares the world).
  rivalDevelopmentStep(career.spectator ? { ...career, teamId: null } : career, aiDevelopmentStep);


// ------------------------------------------------------------ R&D

/**
 * What is left under the cost cap. Money spent in the winter is next season's
 * money, so the off-season cannot be used to dodge the cap.
 */
export const developmentCapLeft = (career) => developmentCapLeftOf(career);

export const projectQuote = (career, { area, size, target = "now" }) => {
  const team = userTeam(career);
  const teams = Object.values(career.world.teams);
  const best = fieldBestOf(teams);
  const technical = career.staff.technical?.rating ?? 60;
  const cost = projectCost(area, size, career.year);
  const expected = expectedGain({
    area,
    size,
    target,
    technical,
    facility: team.facility ?? 2,
    current: team.car[area],
    fieldBest: best[area],
    // Work already in the factory counts too: three parallel aero projects do not each find the same tenth.
    seasonGain:
      (target === "now" ? career.rd.seasonGain[area] || 0 : career.rd.nextGains[area] || 0) +
      career.rd.projects.filter((project) => project.area === area && project.target === target).reduce((sum, project) => sum + project.expected, 0),
    regulationChange: isRegulationReset(career.year + 1),
  });
  const rounds = PROJECT_SIZES[size].rounds;
  const left = career.world.races.length - career.round;
  return { area, size, target, cost, expected: Math.round(expected * 100) / 100, failure: failureChance(size, technical), rounds, late: target === "now" && rounds > left };
};

export const startProject = (career, request) => {
  if (career.phase === PHASES.ENDED) return { error: "ended" };
  if (!AREAS.includes(request.area) || !PROJECT_SIZES[request.size]) return { error: "invalid" };
  const team = userTeam(career);
  // Area projects (v1) and part designs share the factory's slots (RF-DEV-02).
  if (career.rd.projects.length + (career.rd.designs?.length || 0) >= slotsFor(team.facility)) return { error: "slots" };
  const quote = projectQuote(career, request);
  if (quote.late) return { error: "late" };
  if (career.finances.balance < quote.cost) return { error: "money" };
  const capLeft = developmentCapLeft(career);
  if (capLeft !== null && quote.cost > capLeft) return { error: "cap" };
  career.serial.projects += 1;
  const project = { id: `rd-${career.serial.projects}`, area: quote.area, size: quote.size, target: quote.target, roundsLeft: quote.rounds, cost: quote.cost, expected: quote.expected, failure: quote.failure, started: career.round, winter: career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW };
  career.rd.projects.push(project);
  career.finances.balance -= quote.cost;
  if (career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW) career.rd.nextSpend = (career.rd.nextSpend || 0) + quote.cost;
  else career.rd.spend += quote.cost;
  ledger(career, -quote.cost, "development", { area: quote.area });
  return { ok: true, project };
};

// ------------------------------------------------------------ season end

const endSeason = (career) => {
  const review = seasonReview(career);
  // RF-FIN-02: the cost cap is assessed (fine and next-year aero penalty on a breach).
  financeSeasonEnd(career);
  settlePromises(career);
  const drivers = driverStandings(career);
  const constructors = constructorStandings(career);
  const own = constructors.find((row) => row.teamId === career.teamId);
  const ownDrivers = drivers.filter((row) => row.teamId === career.teamId);
  const team = userTeam(career);
  const championDriver = drivers[0] || null;
  const championTeam = constructors[0] || null;

  career.history.push({
    year: career.year,
    teamId: team.id,
    teamName: team.name,
    color: team.color,
    position: own?.position ?? null,
    points: own?.total ?? 0,
    wins: own?.wins ?? 0,
    podiums: own?.podiums ?? 0,
    drivers: ownDrivers.map((row) => ({ name: row.name, position: row.position, points: row.total })),
    champion: championDriver ? { name: championDriver.name, teamId: championDriver.teamId } : null,
    constructorChampion: championTeam ? championTeam.teamId : null,
    grade: Math.round(review.grade * 100) / 100,
    balance: career.finances.balance,
  });
  if (championTeam?.teamId === career.teamId) career.trophies.push({ year: career.year, kind: "constructors", teamName: team.name });
  if (championDriver?.teamId === career.teamId) career.trophies.push({ year: career.year, kind: "drivers", name: championDriver.name, teamName: team.name });

  addNews(career, { kind: "champion", driverId: championDriver?.driverId, teamId: championTeam?.teamId });
  career.jobOffers = career.ended ? generateJobOffers(career, "sacked") : generateJobOffers(career, "season");
  career.review = { ...review, year: career.year, position: own?.position ?? null, champion: championDriver, constructorChampion: championTeam };
  career.finances.lastPosition = own?.position ?? Object.keys(career.world.teams).length;
  if (!career.ended) career.phase = PHASES.REVIEW;
  career.flags.stops.push({ kind: "season-review" });
  checkJobSecurity(career);
};

export const openOffseason = (career) => {
  if (career.phase === PHASES.REVIEW) career.phase = PHASES.OFFSEASON;
  return career;
};

/** What the Continue button should do right now. */
export const nextAction = (career) => {
  if (career.ended) return { kind: "ended" };
  if (career.phase === PHASES.REVIEW) return { kind: "review" };
  if (career.phase === PHASES.OFFSEASON) return { kind: "new-season", year: career.year + 1 };
  const race = currentRace(career);
  if (!race) return { kind: "review" };
  return { kind: "race", race, stage: career.weekend?.round === career.round ? career.weekend.stage : "preview" };
};

export const unresolvedEvents = (career) => career.inbox.filter((item) => item.kind === "event" && !item.event.resolved);

export { constructorStandings, driverStandings };
