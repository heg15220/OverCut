/**
 * The career loop.
 *
 * `season.js` knows how to race one year. This is what turns that into a game:
 * the order the screens come in, which decision is live at each point, and every
 * rule that spans more than one season - the flags an event sets now and the
 * market honours later, the idolatry that saves a seat, the age that eventually
 * takes it away.
 *
 * A run is one plain object. Every function here takes a career and returns a new
 * career, so the whole thing is a reducer the UI renders and a test can drive in
 * a loop without touching React.
 *
 * The shape of a career, per step:
 *
 *   SETUP ─▶ OFFERS ─▶ NEGOTIATION ─▶ PRESEASON ─▶ SEASON ─▶ EVENT ─▶ PRESS ─▶ MARKET ─┐
 *                ▲            ▲                                                          │
 *                │            └── CLAUSE ◀── somebody pays to break a running deal ──────┤
 *                │                   │                                                   │
 *                │                   └── refused ─▶ PRESEASON, same team                 │
 *                └──────────────────────── seat lost or contract expired ────────────────┤
 *                                                                                        │
 *                                                                        age / no seat ──▶ RETIRED
 *
 * The bootstrap and the world cache are passed in rather than stored on the
 * career: they are large, shared and derivable, and a save file should not carry
 * a copy of Formula 1 history inside it.
 */

import { clamp, substream } from "./rng.js";
import { worldForYear } from "./world.js";
import { createDriverAttributes, growAttributes, overallOf, PRESEASON_FOCUS } from "./attributes.js";
import { simulateSeason } from "./season.js";
import {
  buildOffers,
  clauseBuyout,
  evaluateObjective,
  isUnderContract,
  leverageOf,
  negotiate,
  reputationOf,
  sign,
  tickContract,
} from "./contract.js";
import { applyChoice, drawEvents, findEvent, marketFlagModifier, presentEvent } from "./events.js";
import { rollUpgrade, upgradeChanceFor, worldWithUpgrade } from "./upgrade.js";
import { headlinesFor, resetIdolatryOnMove, seasonIdolatry } from "./press.js";
import { chooseRival, rivalComparison, updateRival } from "./rival.js";
import {
  emptyTotals,
  foldSeasonIntoTotals,
  milestonesFor,
  recordStandings,
  retirementVerdict,
  shouldRetire,
} from "./records.js";

export const PHASES = {
  SETUP: "setup",
  OFFERS: "offers",
  NEGOTIATION: "negotiation",
  PRESEASON: "preseason",
  SEASON: "season",
  EVENT: "event",
  PRESS: "press",
  CLAUSE: "clause",
  MARKET: "market",
  RETIRED: "retired",
};

export const DIFFICULTY = {
  PROSPECT: { key: "prospect", talent: 88, label: "prospect" },
  BALANCED: { key: "balanced", talent: 80, label: "balanced" },
  UNDERDOG: { key: "underdog", talent: 71, label: "underdog" },
};

const DEBUT_AGE = 21;

/** Everything the reducer needs that is not part of the save. */
export const createContext = (bootstrap, seed = "trayectoria") => ({
  bootstrap,
  seed,
  worldCache: {},
});

export const worldOf = (context, year) =>
  worldForYear({ bootstrap: context.bootstrap, year, seed: context.seed, cache: context.worldCache });

// ------------------------------------------------------------------- creation

export const createCareer = ({ name, nationality, debutYear, difficulty = DIFFICULTY.BALANCED, helmet, seed, locale = "es" }) => {
  const careerSeed = seed || `${name}-${debutYear}-${Date.now()}`;

  return {
    version: 1,
    seed: careerSeed,
    locale,
    phase: PHASES.OFFERS,
    year: debutYear,
    debutYear,
    driver: {
      name,
      nationality,
      age: DEBUT_AGE,
      helmet: helmet || { primary: "#f5b71d", secondary: "#0e2a53", style: "solid" },
      difficulty: difficulty.key,
      attributes: createDriverAttributes({ seed: careerSeed, talent: difficulty.talent }),
    },
    contract: null,
    yearsAtTeam: 0,
    idolatry: 0,
    money: 0,
    flags: [],
    seenEvents: [],
    history: [],
    totals: emptyTotals(),
    rival: null,
    seasonsWithoutSeat: 0,
    focus: PRESEASON_FOCUS.CONSISTENCY,
    upgrade: null,
    offers: [],
    selectedOffer: null,
    clauseOffer: null,
    pendingEvents: [],
    lastSeason: null,
    headlines: [],
    milestones: [],
    verdict: null,
  };
};

// --------------------------------------------------------------------- market

/**
 * Open the market for the current year.
 *
 * Reputation is what the offers are priced against, and the flags a career has
 * collected move it - which is where "you walked out on them in 1972" finally
 * costs something.
 */
export const openMarket = (career, context) => {
  const world = worldOf(context, career.year);
  const rookie = career.history.length === 0;

  const flagShift = marketFlagModifier(career.flags);
  const shadowCareer = {
    ...career,
    // The market reads reputation through the flags, not around them.
    history: career.history.map((season) => ({
      ...season,
      overperformance: season.overperformance + flagShift * 0.1,
    })),
  };

  const offers = buildOffers({ world, career: shadowCareer, seed: `${career.seed}-${career.year}`, rookie });

  return {
    ...career,
    phase: PHASES.OFFERS,
    offers,
    selectedOffer: null,
  };
};

export const selectOffer = (career, teamId) => {
  const offer = career.offers.find((entry) => entry.teamId === teamId);
  if (!offer) return career;
  return {
    ...career,
    phase: PHASES.NEGOTIATION,
    selectedOffer: { ...offer, grantedAsks: [], refusedAsks: [], trust: offer.trust ?? 50 },
  };
};

export const makeAsk = (career, { ask, tone }) => {
  if (!career.selectedOffer) return career;

  const stream = substream(career.seed, "negotiation", career.year, career.selectedOffer.refusedAsks.length + career.selectedOffer.grantedAsks.length);
  const leverage = leverageOf({ career, offerCount: career.offers.length });
  const result = negotiate({ offer: career.selectedOffer, ask, tone, leverage, stream });

  return {
    ...career,
    selectedOffer: result.offer,
    lastAsk: { ask, tone, won: result.won, odds: result.odds },
  };
};

/**
 * Sign, and set up the season.
 *
 * Changing team costs most of the standing built at the old one; staying adds a
 * year to it. The rival is chosen on the very first signing, from the grid the
 * player is about to join.
 */
export const signSelected = (career, context) => {
  if (!career.selectedOffer) return career;

  const contract = sign(career.selectedOffer, career.year);
  const movedTeam = career.contract?.teamId !== contract.teamId;
  const world = worldOf(context, career.year);

  const rival =
    career.rival ||
    chooseRival({ world, playerAge: career.driver.age, teamId: contract.teamId, seed: career.seed });

  return {
    ...career,
    phase: PHASES.PRESEASON,
    contract,
    yearsAtTeam: movedTeam ? 1 : career.yearsAtTeam + 1,
    idolatry: movedTeam ? resetIdolatryOnMove(career.idolatry) : career.idolatry,
    money: career.money + contract.salary,
    offers: [],
    selectedOffer: null,
    lastAsk: null,
    seasonsWithoutSeat: 0,
    rival,
  };
};

export const setFocus = (career, focus) => ({ ...career, focus });

// --------------------------------------------------------------------- clause

/**
 * Take the money and go.
 *
 * The buyout only opens the door: what you get on the other side is still a
 * negotiation, and it is the only one where you have no other offer to play
 * against - which the leverage already reflects, because there is exactly one
 * team in the room.
 */
export const acceptClause = (career) => {
  if (!career.clauseOffer) return career;

  return {
    ...career,
    phase: PHASES.NEGOTIATION,
    offers: [career.clauseOffer],
    selectedOffer: {
      ...career.clauseOffer,
      grantedAsks: [],
      refusedAsks: [],
      trust: career.clauseOffer.trust ?? 50,
      viaClause: true,
    },
    clauseOffer: null,
    lastAsk: null,
  };
};

/**
 * Back out of a negotiation.
 *
 * "See the other offers" means the market for a driver who came from the market,
 * and the clause decision for one who came from a buyout - where there is no
 * market to go back to, only the choice of whether to leave at all.
 */
export const backToOffers = (career) =>
  career.selectedOffer?.viaClause
    ? {
        ...career,
        phase: PHASES.CLAUSE,
        clauseOffer: career.selectedOffer,
        offers: [],
        selectedOffer: null,
        lastAsk: null,
      }
    : { ...career, phase: PHASES.OFFERS, selectedOffer: null, lastAsk: null };

/** Stay. A driver who could have left and did not is worth more in the garage. */
export const rejectClause = (career) => {
  if (!career.clauseOffer) return career;

  return {
    ...career,
    phase: PHASES.PRESEASON,
    contract: { ...career.contract, trust: clamp((career.contract.trust ?? 50) + 8, 0, 100) },
    idolatry: clamp(career.idolatry + 4, 0, 100),
    yearsAtTeam: career.yearsAtTeam + 1,
    clauseOffer: null,
  };
};

// --------------------------------------------------------------------- season

/**
 * Race the year.
 *
 * This is the one call that does real work: every round of the calendar is
 * simulated, the standings are settled under that era's rules, and everything
 * downstream - growth, press, the market - reads the result rather than
 * re-deciding it.
 */
export const runSeason = (career, context) => {
  if (!career.contract) return career;

  const grid = worldOf(context, career.year);
  // Should be unreachable - advanceSeason voids a contract whose team folded -
  // but racing a seat that is not on the grid would silently produce a season
  // with no player in it, so it is worth being explicit.
  if (!grid.teams.some((team) => team.id === career.contract.teamId)) {
    return openMarket({ ...career, contract: null }, context);
  }

  // A winter in the factory, settled before the first race. The world is copied
  // rather than edited: it is cached per year and shared, so an upgrade written
  // into it would follow the player into seasons they never raced.
  const upgrade = rollUpgrade({
    career,
    stream: substream(career.seed, "upgrade", career.year),
  });
  const world = worldWithUpgrade(grid, career.contract.teamId, upgrade.gain);

  const season = simulateSeason({
    world,
    player: career.driver,
    teamId: career.contract.teamId,
    focus: career.focus,
    seed: `${career.seed}-${career.year}`,
  });

  const stats = season.player;
  const objective = evaluateObjective({ contract: career.contract, stats, teammate: season.teammate });

  const previousTotals = career.totals;
  const totals = foldSeasonIntoTotals(previousTotals, stats);
  const milestones = milestonesFor({
    totals,
    previousTotals,
    recordBook: context.bootstrap.recordBook,
  });

  const attributes = growAttributes({
    attributes: career.driver.attributes,
    age: career.driver.age,
    focus: career.focus,
    seasonScore: stats?.seasonScore ?? 0.45,
    seed: career.seed,
    year: career.year,
  });

  const historyEntry = {
    year: career.year,
    team: stats?.team ?? career.contract.teamName,
    teamId: career.contract.teamId,
    position: stats?.position ?? 99,
    points: stats?.points ?? 0,
    starts: stats?.starts ?? 0,
    wins: stats?.wins ?? 0,
    podiums: stats?.podiums ?? 0,
    poles: stats?.poles ?? 0,
    fastestLaps: stats?.fastestLaps ?? 0,
    retirements: stats?.retirements ?? 0,
    champion: Boolean(stats?.champion),
    carRank: stats?.carRank ?? 0,
    teamCount: stats?.teamCount ?? 0,
    overperformance: stats?.overperformance ?? 0,
    objectiveMet: objective.met,
    upgrade: upgrade.granted,
  };

  const pendingEvents = drawEvents({
    career: { ...career, year: career.year },
    stats,
    contract: career.contract,
    seed: `${career.seed}-${career.year}`,
    count: 1,
  });

  return {
    ...career,
    phase: PHASES.SEASON,
    upgrade,
    driver: { ...career.driver, attributes },
    lastSeason: {
      year: season.year,
      generated: season.generated,
      raceCount: season.raceCount,
      countingRounds: season.countingRounds,
      races: season.races,
      standings: season.standings.slice(0, 24),
      constructorStandings: season.constructorStandings,
      champion: season.champion,
      constructorChampion: season.constructorChampion,
      teammate: season.teammate,
      teammateName: season.teammateName,
      displaced: season.displaced,
      wetRaces: season.wetRaces,
      player: stats,
    },
    history: [...career.history, historyEntry],
    totals,
    milestones,
    objective,
    rival: updateRival({ rival: career.rival, season }),
    pendingEvents: pendingEvents.map((event) => event.id),
  };
};

// --------------------------------------------------------------------- events

export const openEvents = (career) => {
  if (career.pendingEvents.length === 0) return openPress(career);
  return { ...career, phase: PHASES.EVENT };
};

export const currentEvent = (career) => {
  const id = career.pendingEvents[0];
  if (!id) return null;
  const event = findEvent(id);
  return event ? presentEvent(event, career.locale) : null;
};

export const resolveEvent = (career, optionId) => {
  const id = career.pendingEvents[0];
  const event = findEvent(id);
  if (!event) return openPress({ ...career, pendingEvents: [] });

  const applied = applyChoice({
    event,
    optionId,
    attributes: career.driver.attributes,
    contract: career.contract,
    flags: career.flags,
  });

  const remaining = career.pendingEvents.slice(1);
  const next = {
    ...career,
    driver: { ...career.driver, attributes: applied.attributes },
    contract: applied.contract,
    flags: applied.flags,
    money: career.money + applied.money,
    seenEvents: [...career.seenEvents, id],
    lastEventTrust: applied.trustDelta,
    pendingEvents: remaining,
  };

  return remaining.length > 0 ? { ...next, phase: PHASES.EVENT } : openPress(next);
};

// ---------------------------------------------------------------------- press

export const openPress = (career) => {
  const stream = substream(career.seed, "press", career.year);
  const stats = career.lastSeason?.player ?? null;

  const idolatry = seasonIdolatry({
    current: career.idolatry,
    stats,
    objectiveMet: career.objective?.met ?? false,
    trustDelta: career.lastEventTrust ?? 0,
    yearsAtTeam: career.yearsAtTeam,
  });

  const headlines = headlinesFor({
    stats,
    season: career.lastSeason || { year: career.year, raceCount: 0, wetRaces: 0 },
    career,
    locale: career.locale,
    stream,
  });

  return {
    ...career,
    phase: PHASES.PRESS,
    idolatry,
    headlines,
    lastEventTrust: 0,
  };
};

// -------------------------------------------------------------- end of season

/**
 * The winter.
 *
 * Three things decide what happens next, in this order: whether the team keeps
 * you, whether anybody else wants you, and whether you are too old for either.
 *
 * Being kept is not just about results. A driver who missed the objective but
 * beat their team-mate has proved the car was the problem, and a driver the
 * garage adores gets a year of grace nobody else would get.
 */
export const advanceSeason = (career, context) => {
  const stats = career.lastSeason?.player ?? null;
  const objective = career.objective || { met: false, beatTeammate: true };

  const survivedOnLove = career.idolatry >= 70;
  const provedThePoint = objective.beatTeammate;
  const fired = !objective.met && !provedThePoint && !survivedOnLove;

  const contract = fired ? null : tickContract(career.contract);
  const nextYear = career.year + 1;
  const age = career.driver.age + 1;

  const retiring = shouldRetire({
    age,
    seasonsWithoutSeat: career.seasonsWithoutSeat,
    lastStats: stats,
  });

  const base = {
    ...career,
    year: nextYear,
    driver: { ...career.driver, age },
    contract,
    fired,
    milestones: [],
  };

  if (retiring) return retire(base, context);

  // A contract is only worth what the team is worth, and teams disappear -
  // Brabham, Lotus, Toleman all went under mid-decade with drivers signed. If
  // the team is not on next year's grid the deal dies with it and the driver is
  // back on the market, which is exactly what happened to those drivers.
  const stillOnTheGrid =
    contract && worldOf(context, nextYear).teams.some((team) => team.id === contract.teamId);

  if (isUnderContract(contract) && stillOnTheGrid) {
    // The deal holds unless somebody buys it out, and only a clause lets them.
    const clauseOffer = clauseBuyout({
      world: worldOf(context, nextYear),
      career: { ...base, contract },
      seed: `${career.seed}-clause`,
    });

    if (clauseOffer) return { ...base, phase: PHASES.CLAUSE, clauseOffer };

    return { ...base, phase: PHASES.PRESEASON, yearsAtTeam: career.yearsAtTeam + 1 };
  }

  return openMarket({ ...base, contract: stillOnTheGrid ? contract : null }, context);
};

// -------------------------------------------------------------------- the end

export const retire = (career, context) => {
  const verdict = retirementVerdict({ totals: career.totals, history: career.history });
  const records = recordStandings({
    recordBook: context.bootstrap.recordBook,
    totals: career.totals,
  });

  return {
    ...career,
    phase: PHASES.RETIRED,
    verdict,
    records,
    rivalVerdict: rivalComparison({ rival: career.rival, totals: career.totals }),
    reputation: reputationOf(career),
  };
};

/** Hang up the helmet by choice, which is always available from the market. */
export const retireNow = (career, context) => retire(career, context);

export { overallOf, PRESEASON_FOCUS };
export { upgradeChanceFor };
