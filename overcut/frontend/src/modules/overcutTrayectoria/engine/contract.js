/**
 * Seats, and what it costs to get one.
 *
 * A Formula 1 career is decided in the winter far more than on Sunday, so the
 * market is modelled properly rather than as a dice roll: who wants you depends
 * on what you did and on what they can get instead, and what you can ask for
 * depends on how badly they need you.
 *
 * Leverage is the whole system in one number. A champion out of contract with
 * three teams circling can demand anything; a driver coming off a season in the
 * worst car takes what is offered. Every ask is priced against it.
 */

import { clamp, substream } from "./rng.js";

export const SEAT_STATUS = {
  LEAD: "lead",
  EQUAL: "equal",
  SECOND: "second",
};

export const TONE = {
  HUMBLE: "humble",
  FIRM: "firm",
  BOLD: "bold",
};

export const ASKS = {
  SALARY: "salary",
  LENGTH: "length",
  SHORTEN: "shorten",
  LEAD_STATUS: "leadStatus",
  RELEASE_CLAUSE: "releaseClause",
  DEVELOPMENT: "development",
};

/** Nobody signs for longer than this, however well the winter goes. */
export const MAX_YEARS = 5;

/**
 * Standing in the paddock, 0..100.
 *
 * Weighted towards the recent past because the market is: two good years wipe
 * out an old bad one, and a title never fully stops counting.
 */
export const reputationOf = (career) => {
  const seasons = career.history || [];
  if (seasons.length === 0) return clamp(38 + (career.driver.attributes.talent - 78) * 0.4, 25, 60);

  let weightSum = 0;
  let score = 0;
  seasons.slice(-6).forEach((season, index) => {
    // Most recent season carries roughly three times the weight of one six years old.
    const weight = 1 + index * 0.4;
    const positionScore = clamp(100 - (season.position - 1) * 4.2, 10, 100);
    const overperformanceBonus = clamp(season.overperformance * 3.2, -18, 22);
    score += (positionScore + overperformanceBonus) * weight;
    weightSum += weight;
  });

  const titles = seasons.filter((season) => season.champion).length;
  const base = weightSum > 0 ? score / weightSum : 45;
  return clamp(base + titles * 6.5, 15, 100);
};

/**
 * How much the market wants you right now: reputation, plus being young enough
 * to be an investment, minus being old enough to be a risk.
 */
export const leverageOf = ({ career, offerCount }) => {
  const reputation = reputationOf(career);
  const age = career.driver.age;
  const ageFactor = age <= 24 ? 6 : age <= 31 ? 2 : -(age - 31) * 2.4;
  const competition = clamp((offerCount - 1) * 5, 0, 18);
  return clamp(reputation * 0.72 + ageFactor + competition, 5, 100);
};

/**
 * Which teams will talk to you.
 *
 * A team's interest is the distance between what your reputation buys and what
 * their car is worth. Nobody at the front calls a driver with nothing behind
 * them, and the back of the grid will always take someone with a name.
 */
/** Where a team sits on the grid: 1 is the fastest car, 0 the slowest. */
const carPercentileOf = (index, teamCount) => 1 - index / Math.max(1, teamCount - 1);

/**
 * How far your reputation is above what a seat like this normally costs.
 * Positive means you are overqualified for the car, which is what makes a team
 * want you and what makes a rival worth paying to get you out of it.
 */
const reputationGapFor = ({ reputation, carPercentile }) => reputation - (22 + carPercentile * 72);

export const buildOffers = ({ world, career, seed, rookie = false }) => {
  const stream = substream(seed, "market", career.year);
  const reputation = rookie
    ? clamp(30 + (career.driver.attributes.talent - 78) * 0.5, 18, 52)
    : reputationOf(career);

  const teams = [...world.teams].sort((a, b) => b.carRating - a.carRating);
  const teamCount = teams.length || 1;

  const offers = [];
  teams.forEach((team, index) => {
    const carPercentile = carPercentileOf(index, teamCount);
    const gap = reputationGapFor({ reputation, carPercentile });

    // Interest falls away fast above your level and never quite dies below it.
    const interest = clamp(0.5 + gap * 0.035 + stream.normal(0, 0.12), 0, 0.97);
    const loyaltyBonus = team.id === career.contract?.teamId ? 0.22 : 0;

    if (!stream.chance(clamp(interest + loyaltyBonus, 0, 0.98))) return;

    offers.push(
      buildOffer({ team, carPercentile, reputation, career, stream, renewal: team.id === career.contract?.teamId }),
    );
  });

  // A career should never dead-end because of one bad roll: if the market went
  // quiet, the worst car on the grid always needs a driver.
  if (offers.length === 0 && teams.length > 0) {
    const last = teams[teams.length - 1];
    offers.push({
      ...buildOffer({ team: last, carPercentile: 0, reputation, career, stream, renewal: false }),
      lastResort: true,
    });
  }

  return offers.sort((a, b) => b.carRating - a.carRating);
};

const buildOffer = ({ team, carPercentile, reputation, career, stream, renewal }) => {
  const seniority = clamp((reputation - 45) / 55, -0.6, 1);

  // Salary in millions, on a scale the eras share: this is a game currency, not
  // an inflation-adjusted historical figure, and the UI says so.
  const salary = clamp(
    Math.round((1.2 + carPercentile * 14 + seniority * 9 + stream.normal(0, 1.3)) * 10) / 10,
    0.4,
    42,
  );

  const status =
    seniority > 0.55 && carPercentile > 0.35
      ? SEAT_STATUS.LEAD
      : seniority > 0.1
        ? SEAT_STATUS.EQUAL
        : SEAT_STATUS.SECOND;

  const years = seniority > 0.4 ? stream.int(2, 4) : stream.int(1, 2);

  return {
    teamId: team.id,
    teamName: team.name,
    carRating: team.carRating,
    carRank: team.standingPosition ?? null,
    reliability: team.reliability,
    salary,
    years,
    status,
    renewal: Boolean(renewal),
    releaseClause: false,
    developmentPromise: false,
    // What they will consider a successful year. Missing it does not end a
    // career on its own, but missing it while losing to your team-mate does.
    objective: objectiveFor({ carPercentile, status }),
    trust: 50,
  };
};

const objectiveFor = ({ carPercentile, status }) => {
  if (carPercentile > 0.82) return status === SEAT_STATUS.LEAD ? "title" : "topThree";
  if (carPercentile > 0.55) return "podiums";
  if (carPercentile > 0.3) return "points";
  return "beatTeammate";
};

// ----------------------------------------------------------------- negotiation

/**
 * Whether an ask lands.
 *
 * Odds come from leverage against how expensive the ask is, and the tone shifts
 * them - but never for free. A bold ask that works buys more than a humble one;
 * a bold ask that fails costs trust, and trust is what the team remembers when
 * they decide whether to keep you after a bad year.
 */
const ASK_COST = {
  [ASKS.SALARY]: 26,
  [ASKS.LENGTH]: 18,
  // Handing a year back costs the team nothing today, so they say yes more
  // readily than to anything else - which is the point: a short deal is easy to
  // get and expensive later, when the seat is gone and the market is quiet.
  [ASKS.SHORTEN]: 12,
  [ASKS.LEAD_STATUS]: 42,
  [ASKS.RELEASE_CLAUSE]: 30,
  [ASKS.DEVELOPMENT]: 22,
};

const TONE_EFFECT = {
  [TONE.HUMBLE]: { odds: -0.06, trustOnWin: 3, trustOnLoss: 0 },
  [TONE.FIRM]: { odds: 0.05, trustOnWin: 1, trustOnLoss: -3 },
  [TONE.BOLD]: { odds: 0.14, trustOnWin: -2, trustOnLoss: -9 },
};

const OPPOSITE_LENGTH_ASK = {
  [ASKS.LENGTH]: ASKS.SHORTEN,
  [ASKS.SHORTEN]: ASKS.LENGTH,
};

const askWasMade = (offer, ask) =>
  Boolean(offer.grantedAsks?.includes(ask) || offer.refusedAsks?.includes(ask));

/**
 * Whether an ask can still be put on the table.
 *
 * Length is one negotiation, not two: haggling a year off and then asking for
 * one back is not a negotiation, it is a rerolled dice, so settling the length
 * either way closes the subject.
 */
export const isAskAvailable = ({ offer, ask }) => {
  if (askWasMade(offer, ask)) return false;

  const opposite = OPPOSITE_LENGTH_ASK[ask];
  if (opposite && askWasMade(offer, opposite)) return false;

  if (ask === ASKS.SHORTEN && offer.years <= 1) return false;
  if (ask === ASKS.LENGTH && offer.years >= MAX_YEARS) return false;

  return true;
};

/**
 * Where an ask stops being a long shot: the leverage you need over its price for
 * an even chance, and how quickly the odds swing either side of that.
 *
 * The spread is wide on purpose: narrow it and the cheapest asks pile up on the
 * ceiling again for anyone with a good year behind them.
 *
 * A curve rather than a straight line, because a straight line ran out of room.
 * The old one added leverage to a flat 0.42 and clipped at the ceiling, so from a
 * standing of about 60 every ask but number one status read 95% and the screen
 * stopped telling you anything. A logistic keeps every ask inside the range at
 * every standing, which is what makes the number worth reading before you ask.
 */
const ODDS_MIDPOINT = 28;
const ODDS_SPREAD = 26;

/** Even a champion can be told no. Nothing here is ever a formality. */
const ODDS_CEILING = 0.92;

export const askOdds = ({ offer, ask, tone, leverage }) => {
  const cost = ASK_COST[ask] ?? 25;
  const base = 1 / (1 + Math.exp(-((leverage - cost - ODDS_MIDPOINT) / ODDS_SPREAD)));
  const alreadyGranted = grantedCount(offer) * 0.13;
  const renewalWarmth = offer.renewal ? 0.07 : 0;
  return clamp(
    base + (TONE_EFFECT[tone]?.odds ?? 0) + renewalWarmth - alreadyGranted,
    0.03,
    ODDS_CEILING,
  );
};

const grantedCount = (offer) => offer.grantedAsks?.length ?? 0;

export const negotiate = ({ offer, ask, tone, leverage, stream }) => {
  const odds = askOdds({ offer, ask, tone, leverage });
  const won = stream.chance(odds);
  const effect = TONE_EFFECT[tone] ?? TONE_EFFECT[TONE.FIRM];

  const next = {
    ...offer,
    grantedAsks: [...(offer.grantedAsks || [])],
    refusedAsks: [...(offer.refusedAsks || [])],
    trust: clamp((offer.trust ?? 50) + (won ? effect.trustOnWin : effect.trustOnLoss), 0, 100),
  };

  if (!won) {
    next.refusedAsks.push(ask);
    return { offer: next, won, odds };
  }

  next.grantedAsks.push(ask);
  switch (ask) {
    case ASKS.SALARY:
      next.salary = Math.round(next.salary * 1.28 * 10) / 10;
      break;
    case ASKS.LENGTH:
      next.years = clamp(next.years + 1, 1, MAX_YEARS);
      break;
    case ASKS.SHORTEN:
      next.years = clamp(next.years - 1, 1, MAX_YEARS);
      break;
    case ASKS.LEAD_STATUS:
      next.status = SEAT_STATUS.LEAD;
      break;
    case ASKS.RELEASE_CLAUSE:
      next.releaseClause = true;
      break;
    case ASKS.DEVELOPMENT:
      next.developmentPromise = true;
      break;
    default:
      break;
  }

  return { offer: next, won, odds };
};

/**
 * Sign. The contract is what the season, the press and next winter all read.
 */
export const sign = (offer, year) => ({
  teamId: offer.teamId,
  teamName: offer.teamName,
  salary: offer.salary,
  years: offer.years,
  yearsRemaining: offer.years,
  signedIn: year,
  status: offer.status,
  objective: offer.objective,
  releaseClause: offer.releaseClause,
  clauseValue: offer.releaseClause ? clauseValueOf(offer) : 0,
  developmentPromise: offer.developmentPromise,
  trust: offer.trust ?? 50,
  grantedAsks: offer.grantedAsks || [],
});

/**
 * What it costs to take you away.
 *
 * A clause is worth the deal it breaks: the salary the old team still owes,
 * marked up because they did not want to sell.
 */
const clauseValueOf = ({ salary, years }) => Math.round(salary * years * 1.6 * 10) / 10;

export const tickContract = (contract) =>
  contract ? { ...contract, yearsRemaining: Math.max(0, contract.yearsRemaining - 1) } : null;

export const isUnderContract = (contract) => Boolean(contract && contract.yearsRemaining > 0);

/**
 * Somebody pays your clause.
 *
 * A contract with years left on it is a wall, and this is the only door through
 * it. Two rules keep the door honest: there has to be a clause to pay in the
 * first place, and nobody pays real money to put a driver in a slower car - so
 * a buyout is always a step up, which is what makes turning one down a decision
 * worth having.
 *
 * The bar is higher than the ordinary market's because a buyer here is paying
 * twice: the clause to the old team, and the salary to you - which is what
 * `CLAUSE_RELUCTANCE` takes off every team's interest.
 */
const CLAUSE_RELUCTANCE = 0.3;

export const clauseBuyout = ({ world, career, seed }) => {
  const contract = career.contract;
  if (!contract?.releaseClause || !isUnderContract(contract)) return null;

  const current = world.teams.find((team) => team.id === contract.teamId);
  if (!current) return null;

  const stream = substream(seed, "clause", career.year);
  const reputation = reputationOf(career);

  const teams = [...world.teams].sort((a, b) => b.carRating - a.carRating);
  const teamCount = teams.length || 1;

  const buyers = [];
  teams.forEach((team, index) => {
    if (team.id === contract.teamId) return;
    if (team.carRating <= current.carRating) return;

    const carPercentile = carPercentileOf(index, teamCount);
    const gap = reputationGapFor({ reputation, carPercentile });

    const interest = clamp(0.5 + gap * 0.035 - CLAUSE_RELUCTANCE + stream.normal(0, 0.1), 0, 0.9);
    if (!stream.chance(interest)) return;

    buyers.push({
      ...buildOffer({ team, carPercentile, reputation, career, stream, renewal: false }),
      viaClause: true,
      clausePaid: contract.clauseValue ?? 0,
      leavingTeamName: contract.teamName,
    });
  });

  if (buyers.length === 0) return null;

  // Only one team actually writes the cheque: the one with the fastest car,
  // because that is the one whose seat is worth the trouble.
  return buyers.sort((a, b) => b.carRating - a.carRating)[0];
};


/**
 * Did the year meet the deal?
 *
 * Judged against the objective the contract set, not against an absolute - which
 * is what makes "you extracted everything that car had" a real verdict rather
 * than a consolation message.
 */
export const evaluateObjective = ({ contract, stats, teammate }) => {
  if (!contract || !stats) return { met: false, reason: "noContract" };

  const beatTeammate = teammate ? stats.points >= teammate.points : true;

  switch (contract.objective) {
    case "title":
      return { met: stats.champion, beatTeammate, reason: "title" };
    case "topThree":
      return { met: stats.position <= 3, beatTeammate, reason: "topThree" };
    case "podiums":
      return { met: stats.podiums >= 2, beatTeammate, reason: "podiums" };
    case "points":
      return { met: stats.points > 0, beatTeammate, reason: "points" };
    case "beatTeammate":
    default:
      return { met: beatTeammate, beatTeammate, reason: "beatTeammate" };
  }
};
