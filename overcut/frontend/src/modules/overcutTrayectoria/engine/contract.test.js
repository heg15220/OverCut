/**
 * Contracts: what you can get at the table, and what the deal binds you to
 * afterwards.
 *
 * The negotiation tests drive `negotiate` with a stubbed coin so the outcome is
 * the thing under test rather than the roll. The clause tests go through the
 * real career loop, because the whole point of a multi-season deal is what it
 * does to the winter, and that only exists in `advanceSeason`.
 */

import { fallbackBootstrap } from "../data/fallbackBootstrap";
import { prepareBootstrap } from "./world";
import {
  PHASES,
  acceptClause,
  advanceSeason,
  backToOffers,
  createCareer,
  createContext,
  rejectClause,
  selectOffer,
  signSelected,
  worldOf,
} from "./career";
import {
  ASKS,
  SEAT_STATUS,
  TONE,
  askOdds,
  isAskAvailable,
  negotiate,
  sign,
} from "./contract";

const offerWith = (over = {}) => ({
  teamId: "brabham",
  teamName: "Brabham",
  carRating: 80,
  carRank: 4,
  reliability: 0.7,
  salary: 6,
  years: 3,
  status: SEAT_STATUS.EQUAL,
  renewal: false,
  releaseClause: false,
  developmentPromise: false,
  objective: "points",
  trust: 50,
  grantedAsks: [],
  refusedAsks: [],
  ...over,
});

const alwaysWins = { chance: () => true };
const alwaysLoses = { chance: () => false };

const ask = (offer, entry, stream = alwaysWins) =>
  negotiate({ offer, ask: entry, tone: TONE.FIRM, leverage: 70, stream }).offer;

describe("negotiating the length of a contract", () => {
  it("takes a season off the deal when the shorten ask lands", () => {
    const next = ask(offerWith({ years: 3 }), ASKS.SHORTEN);
    expect(next.years).toBe(2);
  });

  it("leaves the length alone when the shorten ask is refused", () => {
    const next = ask(offerWith({ years: 3 }), ASKS.SHORTEN, alwaysLoses);
    expect(next.years).toBe(3);
  });

  it("will not shorten a deal that is already a single season", () => {
    const offer = offerWith({ years: 1 });
    expect(isAskAvailable({ offer, ask: ASKS.SHORTEN })).toBe(false);
    expect(ask(offer, ASKS.SHORTEN).years).toBe(1);
  });

  it("will not extend a deal that is already the longest on offer", () => {
    const offer = offerWith({ years: 5 });
    expect(isAskAvailable({ offer, ask: ASKS.LENGTH })).toBe(false);
    expect(ask(offer, ASKS.LENGTH).years).toBe(5);
  });

  it("locks out asking for the opposite length once you have asked either way", () => {
    const shortened = ask(offerWith({ years: 3 }), ASKS.SHORTEN);
    expect(isAskAvailable({ offer: shortened, ask: ASKS.LENGTH })).toBe(false);

    const extended = ask(offerWith({ years: 3 }), ASKS.LENGTH);
    expect(isAskAvailable({ offer: extended, ask: ASKS.SHORTEN })).toBe(false);
  });

  it("still lets you ask for anything else after settling the length", () => {
    const shortened = ask(offerWith({ years: 3 }), ASKS.SHORTEN);
    expect(isAskAvailable({ offer: shortened, ask: ASKS.SALARY })).toBe(true);
    expect(isAskAvailable({ offer: shortened, ask: ASKS.RELEASE_CLAUSE })).toBe(true);
  });

  it("costs less credit to give back a year than to win one", () => {
    const offer = offerWith({ years: 3 });
    const shortenOdds = negotiate({
      offer,
      ask: ASKS.SHORTEN,
      tone: TONE.FIRM,
      leverage: 40,
      stream: alwaysLoses,
    });
    const lengthOdds = negotiate({
      offer,
      ask: ASKS.LENGTH,
      tone: TONE.FIRM,
      leverage: 40,
      stream: alwaysLoses,
    });
    expect(shortenOdds.odds).toBeGreaterThan(lengthOdds.odds);
  });
});

describe("a multi-season deal and the clause that can break it", () => {
  const YEAR = 1988;
  const context = createContext(prepareBootstrap(fallbackBootstrap, { fallbackMode: true }), "clause-ctx");

  /** The worst car on next year's grid: any buyer is an upgrade. */
  const slowestTeam = () => {
    const grid = worldOf(context, YEAR + 1).teams;
    return [...grid].sort((a, b) => a.carRating - b.carRating)[0];
  };

  const championHistory = () =>
    Array.from({ length: 6 }, (_, index) => ({
      year: YEAR - 5 + index,
      team: "Old Team",
      teamId: "old",
      position: 1,
      points: 90,
      starts: 16,
      wins: 8,
      podiums: 12,
      poles: 6,
      fastestLaps: 4,
      retirements: 1,
      champion: true,
      carRank: 1,
      teamCount: 20,
      overperformance: 2,
      objectiveMet: true,
    }));

  /** A career sitting on the last screen of the year, deal still running. */
  const winterWith = ({ team, years, releaseClause, seed = "clause" }) => {
    const base = createCareer({
      name: "Clause Driver",
      nationality: "es",
      debutYear: YEAR - 6,
      seed,
      locale: "es",
    });

    const contract = sign(
      offerWith({
        teamId: team.id,
        teamName: team.name,
        carRating: team.carRating,
        years,
        releaseClause,
        status: SEAT_STATUS.LEAD,
      }),
      YEAR,
    );

    return {
      ...base,
      year: YEAR,
      phase: PHASES.PRESS,
      driver: { ...base.driver, age: 28 },
      contract,
      history: championHistory(),
      lastSeason: { player: { position: 1, points: 90, champion: true, starts: 16, wins: 8 } },
      objective: { met: true, beatTeammate: true },
      idolatry: 55,
      yearsAtTeam: 1,
    };
  };

  it("keeps a driver at their team for the rest of a deal with no clause", () => {
    const team = slowestTeam();
    const next = advanceSeason(winterWith({ team, years: 3, releaseClause: false }), context);

    expect(next.phase).toBe(PHASES.PRESEASON);
    expect(next.contract.teamId).toBe(team.id);
    expect(next.contract.yearsRemaining).toBe(2);
    expect(next.clauseOffer).toBeFalsy();
  });

  it("brings a faster team to pay the clause when the deal has one", () => {
    const team = slowestTeam();
    const next = advanceSeason(winterWith({ team, years: 3, releaseClause: true }), context);

    expect(next.phase).toBe(PHASES.CLAUSE);
    expect(next.clauseOffer).toBeTruthy();
    expect(next.clauseOffer.teamId).not.toBe(team.id);
    expect(next.clauseOffer.carRating).toBeGreaterThan(team.carRating);
    // The seat you are being bought out of is still yours until you say yes.
    expect(next.contract.teamId).toBe(team.id);
  });

  it("takes the driver into a normal negotiation when they accept", () => {
    const team = slowestTeam();
    const winter = advanceSeason(winterWith({ team, years: 3, releaseClause: true }), context);
    const next = acceptClause(winter);

    expect(next.phase).toBe(PHASES.NEGOTIATION);
    expect(next.selectedOffer.teamId).toBe(winter.clauseOffer.teamId);
    expect(next.selectedOffer.viaClause).toBe(true);
    expect(next.offers).toHaveLength(1);
    expect(next.clauseOffer).toBeNull();
  });

  it("signs the driver at the buying team when they see the negotiation through", () => {
    const team = slowestTeam();
    const winter = advanceSeason(winterWith({ team, years: 3, releaseClause: true }), context);
    const signed = signSelected(acceptClause(winter), context);

    expect(signed.phase).toBe(PHASES.PRESEASON);
    expect(signed.contract.teamId).toBe(winter.clauseOffer.teamId);
    expect(signed.yearsAtTeam).toBe(1);
  });

  it("keeps them where they are, and trusted, when they turn the clause down", () => {
    const team = slowestTeam();
    const winter = advanceSeason(winterWith({ team, years: 3, releaseClause: true }), context);
    const next = rejectClause(winter);

    expect(next.phase).toBe(PHASES.PRESEASON);
    expect(next.contract.teamId).toBe(team.id);
    expect(next.contract.yearsRemaining).toBe(2);
    expect(next.contract.trust).toBeGreaterThan(winter.contract.trust);
    expect(next.clauseOffer).toBeNull();
  });

  it("opens the ordinary market when the deal runs out, clause or not", () => {
    const team = slowestTeam();
    const next = advanceSeason(winterWith({ team, years: 1, releaseClause: true }), context);

    expect(next.phase).toBe(PHASES.OFFERS);
    expect(next.offers.length).toBeGreaterThan(0);
    expect(next.clauseOffer).toBeFalsy();
  });

  it("sends you back to the clause, not to an empty market, if you walk away", () => {
    const team = slowestTeam();
    const winter = advanceSeason(winterWith({ team, years: 3, releaseClause: true }), context);
    const back = backToOffers(acceptClause(winter));

    expect(back.phase).toBe(PHASES.CLAUSE);
    expect(back.clauseOffer.teamId).toBe(winter.clauseOffer.teamId);
    expect(back.selectedOffer).toBeNull();
  });

  it("sends you back to the market when the negotiation started there", () => {
    const team = slowestTeam();
    const market = advanceSeason(winterWith({ team, years: 1, releaseClause: false }), context);
    const back = backToOffers(selectOffer(market, market.offers[0].teamId));

    expect(back.phase).toBe(PHASES.OFFERS);
    expect(back.selectedOffer).toBeNull();
  });

  it("prices the clause off the deal it would buy out", () => {
    const cheap = sign(offerWith({ salary: 4, years: 2, releaseClause: true }), YEAR);
    const dear = sign(offerWith({ salary: 18, years: 4, releaseClause: true }), YEAR);
    const none = sign(offerWith({ salary: 18, years: 4, releaseClause: false }), YEAR);

    expect(cheap.clauseValue).toBeGreaterThan(0);
    expect(dear.clauseValue).toBeGreaterThan(cheap.clauseValue);
    expect(none.clauseValue).toBe(0);
  });
});

/**
 * What the odds have to be worth.
 *
 * The negotiation screen shows its odds before you ask, which is only a decision
 * if the numbers differ. They used to saturate: from a leverage of about 60 every
 * ask but one sat on the 95% ceiling, so tone and ask were free choices with no
 * trade-off in them.
 */
describe("the price of an ask", () => {
  const CHEAPEST_TO_DEAREST = [
    ASKS.SHORTEN,
    ASKS.LENGTH,
    ASKS.DEVELOPMENT,
    ASKS.SALARY,
    ASKS.RELEASE_CLAUSE,
    ASKS.LEAD_STATUS,
  ];

  const oddsAt = (leverage, ask, tone = TONE.FIRM) =>
    askOdds({ offer: offerWith({ years: 3 }), ask, tone, leverage });

  it("keeps a cheap ask likelier than an expensive one at every standing", () => {
    [10, 30, 50, 70, 90, 100].forEach((leverage) => {
      const odds = CHEAPEST_TO_DEAREST.map((ask) => oddsAt(leverage, ask));
      expect(odds).toEqual([...odds].sort((a, b) => b - a));
    });
  });

  it("gives every ask its own number across the standings a career actually reaches", () => {
    // Not at the theoretical maximum: the ceiling exists so that nothing is ever
    // a formality, and at a leverage of 100 the two cheapest asks meet under it.
    [20, 40, 60, 85].forEach((leverage) => {
      const odds = CHEAPEST_TO_DEAREST.map((ask) => oddsAt(leverage, ask));
      expect(new Set(odds).size).toBe(odds.length);
    });
  });

  it("still rewards standing at the very top of the grid", () => {
    // A champion has to be able to ask for more than a points scorer can.
    expect(oddsAt(90, ASKS.SALARY)).toBeGreaterThan(oddsAt(60, ASKS.SALARY) + 0.05);
    expect(oddsAt(60, ASKS.SALARY)).toBeGreaterThan(oddsAt(35, ASKS.SALARY) + 0.05);
  });

  it("never makes an ask a certainty, however good the year was", () => {
    const best = askOdds({
      offer: { ...offerWith(), renewal: true },
      ask: ASKS.SHORTEN,
      tone: TONE.BOLD,
      leverage: 100,
    });

    expect(best).toBeLessThan(0.95);
  });

  it("keeps number one status hard even for a driver who has everything", () => {
    expect(oddsAt(100, ASKS.LEAD_STATUS)).toBeLessThan(0.85);
  });

  it("still lets the tone move the odds", () => {
    expect(oddsAt(60, ASKS.SALARY, TONE.BOLD)).toBeGreaterThan(oddsAt(60, ASKS.SALARY, TONE.HUMBLE));
  });
});
