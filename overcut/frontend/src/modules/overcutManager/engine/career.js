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
import { costCapFor, driverSalary, moneyScale, operatingCostPerRace, prizeMoney, roundMoney, sponsorIncome } from "./economy";
import { BACKERS, HEADQUARTERS, enginesFor, shortCode } from "./identity";
import { addInbox, addNews } from "./inbox";
import { ledger, startingStaff, userTeam } from "./market";
import { boardAfterRace, checkJobSecurity, generateJobOffers, seasonReview, setObjectives } from "./board";
import { maybeEvent, settlePromises } from "./events";
import { constructorStandings, driverStandings, emptySeason, recordRace, scoreRace } from "./standings";
import { driversOf, fillEmptySeats, prepareReference, signForTeam, teamsByPace } from "./world";
import { eraWithRegulations, roundLineup, worldForSeason } from "./packs/packWorld";
import { classificationOf, createRace, evaluatePlan, runQualifying, runToFinish, suggestPlan, weatherTimeline } from "./race";
import { FEELINGS, SLIDERS, feelingsOf, idealSetup, neutralSetup, practiceRun, satisfactionOf, setupLapTime } from "./setup";

export const MANAGER_GAME = "overcut-manager";
export const MANAGER_VERSION = 1;

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

export const createCareer = (context, { year, teamId = null, custom = null, managerName = "", seed = null }) => {
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

  setObjectives(career);
  addInbox(career, { kind: "welcome", teamId: team.id, year, owner });
  addInbox(career, { kind: "objectives" });
  addNews(career, { kind: owner ? "new-team" : "new-principal", teamId: team.id, manager: career.managerName });
  if (isRegulationReset(year + 1)) addInbox(career, { kind: "regulations", year: year + 1 });
  return career;
};

// ------------------------------------------------------------ the grid

/** The year's era, with the pack's regulations over it when the season has one. */
export const eraOf = (career) => eraWithRegulations(career.year, career.world.regulations);

export const currentRace = (career) => career.world.races[career.round] || null;

/** Every car on the grid as the race engine wants it. */
export const entrantsFor = (career) => {
  const era = eraOf(career);
  const race = currentRace(career);
  const entrants = [];
  career.world.order.forEach((teamId) => {
    const team = career.world.teams[teamId];
    if (!team) return;
    const { powerBias, aeroBias } = biasesOf(team.car);
    const isUser = teamId === career.teamId;
    // The pit crew and the factory's build quality keep cars running.
    const operations = isUser ? (career.staff.operations?.rating ?? 60) : 50 + team.prestige * 30;
    const reliability = clamp(reliabilityOf(team.car, era) + (operations - 60) * 0.0009, 0.25, 0.99);
    // Pack seasons: only the teams and drivers really entered in this Grand Prix (SRS 6.1, criterio 7.2).
    roundLineup({ world: career.world, team, race, isUser }).forEach((driver) => {
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
        carRating: carRatingOf(team.car),
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
    crews[team.id] = team.id === career.teamId ? career.staff.operations?.rating ?? 60 : 48 + team.prestige * 34;
    strategists[team.id] = team.id === career.teamId ? career.staff.engineering?.rating ?? 60 : 45 + team.prestige * 35;
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
  const forecast = substream(weekendSeed(career), "quali-weather");
  const wetness = forecast.chance((race.profile.rain ?? 0.15) * 0.8) ? forecast.range(0.2, 0.8) : 0;
  const entrants = entrantsFor(career);
  const result = runQualifying({ entrants, race, era: eraOf(career), year: career.year, wetness, practice: weekend.practice, risk, stream });
  weekend.qualifying = { ...result, wetness, teams: Object.fromEntries(entrants.map((entrant) => [entrant.id, entrant.teamId])) };
  weekend.stage = "strategy";
  // The strategist's plan for both cars, which the player may change.
  driversOf(career.world, career.teamId).forEach((driver) => {
    weekend.plans[driver.id] = defaultPlan(career);
  });
  return weekend.qualifying;
};

export const defaultPlan = (career) => {
  const race = currentRace(career);
  const plan = suggestPlan({ year: career.year, laps: race.laps, baseLap: race.baseLap, profile: race.profile, crew: career.staff.operations?.rating ?? 60 });
  return { stops: plan.stops, compounds: plan.compounds };
};

export const setPlan = (career, driverId, plan) => {
  if (!career.weekend) return career;
  career.weekend.plans[driverId] = { stops: [...(plan.stops || [])], compounds: [...(plan.compounds || [])] };
  return career;
};

/**
 * Sunday, ready to run: the live view steps it lap by lap, a quick sim runs it
 * to the flag. Rival strategies are the strategist's best plan with a little
 * spread on the stop laps, so the field does not pit in formation.
 */
export const createWeekendRace = (career) => {
  const weekend = startWeekend(career);
  if (!weekend) return null;
  if (!weekend.qualifying) runQualifyingSession(career, {});
  const race = currentRace(career);
  const entrants = entrantsFor(career);
  const stream = substream(weekendSeed(career), "plans");
  const base = defaultPlan(career);
  const plans = {};
  entrants.forEach((entrant) => {
    if (entrant.isUser && weekend.plans[entrant.id]) {
      plans[entrant.id] = weekend.plans[entrant.id];
      return;
    }
    plans[entrant.id] = { stops: base.stops.map((lap) => clamp(lap + stream.int(-3, 3), 2, race.laps - 2)), compounds: base.compounds };
  });
  const { crews, strategists } = crewsFor(career);
  // Anyone who has lost their seat since Saturday starts from the back.
  const grid = weekend.qualifying.order.filter((id) => entrants.some((entrant) => entrant.id === id));
  entrants.forEach((entrant) => {
    if (!grid.includes(entrant.id)) grid.push(entrant.id);
  });
  return createRace({
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
  });
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
  const args = { year: career.year, laps: race.laps, baseLap: race.baseLap, profile: race.profile, crew };
  const best = suggestPlan(args);
  return Math.max(0, evaluatePlan({ ...args, plan }) - best.cost);
};

/** Commit a finished race to the season. */
export const completeRace = (career, state) => {
  const weekend = startWeekend(career);
  if (!weekend || weekend.result) return weekend?.result || null;
  if (!state.finished) runToFinish(state);
  const names = Object.fromEntries(state.cars.map((car) => [car.id, car.name]));
  const classification = classificationOf(state);
  const fastestLap = state.fastestLap?.carId || null;
  const { driverPoints, teamPoints } = scoreRace({ rows: classification, fastestLapDriverId: fastestLap, year: career.year, era: eraOf(career) });
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
  };
  recordRace(career.season, summary);
  // The lap chart lives on the weekend only - the season keeps the summary, saves stay small.
  weekend.result = { ...summary, chart: lapChartOf(state) };
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

  progressDevelopment(career);
  rivalDevelopment(career);
  raceFinances(career);
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

  if (career.round >= raceCount) endSeason(career);
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
      team.car[project.area] = clamp(team.car[project.area] + project.gain, 5, 100);
      career.rd.seasonGain[project.area] = (career.rd.seasonGain[project.area] || 0) + Math.max(0, project.gain);
    }
    career.rd.done.unshift({ ...project, year: career.year, round: career.round + 1 });
    addInbox(career, { kind: project.failed ? "rd-failed" : "rd-done", area: project.area, size: project.size, target: project.target, gain: project.gain });
  });
  career.rd.done = career.rd.done.slice(0, 16);
  career.rd.projects = active;
};

const rivalDevelopment = (career) => {
  const raceCount = career.world.races.length;
  Object.values(career.world.teams).forEach((team) => {
    if (team.id === career.teamId) return;
    const stream = substream(career.seed, "ai-dev", career.year, career.round, team.id);
    team.car = aiDevelopmentStep({ team, raceCount, stream });
  });
};

/** One Grand Prix worth of money in and out. */
const raceFinances = (career) => {
  const team = userTeam(career);
  const year = career.year;
  const raceCount = career.world.races.length || 1;
  const teamCount = Object.keys(career.world.teams).length;
  const commercial = (career.staff.commercial?.rating ?? 60) - 60;
  const sponsors = sponsorIncome(team.prestige, year) * (1 + commercial * 0.004);
  const prize = prizeMoney(career.finances.lastPosition, teamCount, year);
  const extras = career.finances.sponsors.filter((deal) => deal.until >= year).reduce((sum, deal) => sum + deal.perRace, 0);
  const income = roundMoney((sponsors + prize) / raceCount + extras);

  const salaries = driversOf(career.world, team.id).reduce((sum, driver) => sum + (driver.contract?.salary || 0), 0);
  const reserve = team.reserve ? career.world.drivers[team.reserve]?.contract?.salary || 0 : 0;
  const staff = Object.values(career.staff).reduce((sum, person) => sum + (person?.salary || 0), 0);
  const engine = team.engine ? team.engine.price * moneyScale(year) : 0;
  const running = operatingCostPerRace(team.prestige, raceCount, year);
  const costs = roundMoney(running + (salaries + reserve + staff + engine) / raceCount);

  career.finances.balance += income - costs;
  ledger(career, income, "race-income");
  ledger(career, -costs, "race-costs");
};

// ------------------------------------------------------------ R&D

/**
 * What is left under the cost cap. Money spent in the winter is next season's
 * money, so the off-season cannot be used to dodge the cap.
 */
export const developmentCapLeft = (career) => {
  const winter = career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW;
  const cap = costCapFor(winter ? career.year + 1 : career.year);
  const spent = winter ? career.rd.nextSpend || 0 : career.rd.spend;
  return cap === null ? null : Math.max(0, cap - spent);
};

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
  if (career.rd.projects.length >= slotsFor(team.facility)) return { error: "slots" };
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
