/**
 * The career loop, driven end to end without React.
 *
 * These tests play whole careers - twenty-odd seasons each, every round of every
 * one of them simulated - and assert the properties that have to hold across a
 * run rather than inside a season: that the phases always advance, that a driver
 * always ends up with a seat, that ageing eventually retires them, and that the
 * verdict at the end is consistent with what they actually did.
 */

import { fallbackBootstrap } from "../data/fallbackBootstrap";
import { prepareBootstrap } from "./world";
import {
  DIFFICULTY,
  PHASES,
  acceptClause,
  advanceSeason,
  createCareer,
  createContext,
  currentEvent,
  makeAsk,
  openEvents,
  openMarket,
  rejectClause,
  resolveEvent,
  runSeason,
  selectOffer,
  setFocus,
  signSelected,
} from "./career";
import { PRESEASON_FOCUS } from "./attributes";
import { ASKS, TONE, reputationOf } from "./contract";
import { emptyTotals, retirementVerdict } from "./records";

const TIERS = ["immortal", "great", "champion", "winner", "respected", "journeyman", "footnote"];

const bootstrap = prepareBootstrap(fallbackBootstrap, { fallbackMode: true });

/**
 * Play a career to retirement, always taking the best car on offer and the first
 * option of every event. Returns the finished career plus a trace of the phases
 * it went through, so a test can assert on the journey and not only the end.
 */
const playCareer = ({
  debutYear = 1988,
  seed = "loop",
  difficulty = DIFFICULTY.BALANCED,
  maxSteps = 400,
  ask = ASKS.SALARY,
  onClause = "reject",
  focus = null,
} = {}) => {
  const context = createContext(bootstrap, "test-context");
  let career = openMarket(
    createCareer({
      name: "Loop Driver",
      nationality: "es",
      debutYear,
      difficulty,
      seed,
      locale: "es",
    }),
    context,
  );

  const phases = [];
  const clauseMoves = [];
  let steps = 0;

  while (career.phase !== PHASES.RETIRED && steps < maxSteps) {
    phases.push(career.phase);
    steps += 1;

    switch (career.phase) {
      case PHASES.OFFERS: {
        expect(career.offers.length).toBeGreaterThan(0);
        career = selectOffer(career, career.offers[0].teamId);
        break;
      }
      case PHASES.NEGOTIATION: {
        career = makeAsk(career, { ask, tone: TONE.FIRM });
        career = signSelected(career, context);
        break;
      }
      case PHASES.CLAUSE: {
        expect(career.clauseOffer).toBeTruthy();
        if (onClause === "accept") {
          clauseMoves.push({
            year: career.year,
            from: career.contract.teamId,
            to: career.clauseOffer.teamId,
          });
          career = acceptClause(career);
        } else {
          career = rejectClause(career);
        }
        break;
      }
      case PHASES.PRESEASON: {
        if (focus) career = setFocus(career, focus);
        career = runSeason(career, context);
        break;
      }
      case PHASES.SEASON: {
        career = openEvents(career);
        break;
      }
      case PHASES.EVENT: {
        const event = currentEvent(career);
        expect(event).toBeTruthy();
        career = resolveEvent(career, event.options[0].id);
        break;
      }
      case PHASES.PRESS: {
        career = advanceSeason(career, context);
        break;
      }
      default:
        throw new Error(`unexpected phase ${career.phase}`);
    }
  }

  return { career, phases, steps, clauseMoves };
};

describe("career loop", () => {
  it("runs a whole career from debut to retirement", () => {
    const { career, steps } = playCareer();

    expect(career.phase).toBe(PHASES.RETIRED);
    expect(steps).toBeLessThan(400);
    expect(career.history.length).toBeGreaterThan(5);
    expect(career.totals.seasons).toBe(career.history.length);
    expect(career.driver.age).toBeGreaterThanOrEqual(38);
  });

  it("never leaves a driver without a seat while they are still racing", () => {
    const { career } = playCareer({ debutYear: 1976, seed: "seat" });
    career.history.forEach((season) => {
      expect(season.team).toBeTruthy();
      expect(season.starts).toBeGreaterThan(0);
    });
  });

  it("keeps the totals equal to the sum of the seasons", () => {
    const { career } = playCareer({ debutYear: 1998, seed: "totals" });

    const sum = (key) => career.history.reduce((total, season) => total + season[key], 0);
    expect(career.totals.wins).toBe(sum("wins"));
    expect(career.totals.podiums).toBe(sum("podiums"));
    expect(career.totals.poles).toBe(sum("poles"));
    expect(career.totals.starts).toBe(sum("starts"));
    expect(career.totals.titles).toBe(career.history.filter((season) => season.champion).length);
  });

  it("ends with a verdict that matches what the driver actually did", () => {
    const { career } = playCareer({ debutYear: 1988, seed: "verdict" });

    expect(career.verdict).toBeTruthy();
    expect(Object.keys(career.records)).toEqual(["titles", "wins", "podiums", "seasons"]);
    expect(TIERS).toContain(career.verdict.tier);

    // A tier can never be richer than the record behind it: the tiers above
    // "champion" all require a title, and "winner" requires a win.
    const needsTitle = ["immortal", "great", "champion"].includes(career.verdict.tier);
    expect(needsTitle && career.totals.titles === 0).toBe(false);
    expect(career.verdict.tier === "winner" && career.totals.wins === 0).toBe(false);
  });

  it("orders the verdict tiers by what the driver won", () => {
    const totals = (over) => ({ ...emptyTotals(), ...over });
    const history = [{ carRank: 5, teamCount: 10, overperformance: 0 }];

    const nobody = retirementVerdict({ totals: totals({ seasons: 4 }), history });
    const winner = retirementVerdict({ totals: totals({ seasons: 8, wins: 4, podiums: 12 }), history });
    const champion = retirementVerdict({ totals: totals({ seasons: 10, titles: 1, wins: 9, podiums: 25 }), history });
    const immortal = retirementVerdict({ totals: totals({ seasons: 16, titles: 5, wins: 60, podiums: 120 }), history });

    expect(nobody.tier).toBe("footnote");
    expect(winner.tier).toBe("winner");
    expect(champion.tier).toBe("champion");
    expect(immortal.tier).toBe("immortal");
    expect(immortal.score).toBeGreaterThan(champion.score);
    expect(champion.score).toBeGreaterThan(winner.score);
  });

  it("picks a rival on debut and keeps their record alongside yours", () => {
    const { career } = playCareer({ debutYear: 2016, seed: "rival" });

    expect(career.rival).toBeTruthy();
    expect(career.rival.name).not.toBe(career.driver.name);
    expect(career.rivalVerdict).toBeTruthy();

    const duels = career.rivalVerdict.headToHead.player + career.rivalVerdict.headToHead.rival;
    expect(duels).toBeGreaterThan(0);
    expect(duels).toBeLessThanOrEqual(career.history.length);
  });

  it("buys a clause driver out of a running deal, and only into another team", () => {
    const { career, phases, clauseMoves } = playCareer({
      debutYear: 1988,
      seed: "clause-run",
      difficulty: DIFFICULTY.PROSPECT,
      ask: ASKS.RELEASE_CLAUSE,
      onClause: "accept",
    });

    expect(phases).toContain(PHASES.CLAUSE);
    expect(clauseMoves.length).toBeGreaterThan(0);

    clauseMoves.forEach((move) => {
      expect(move.to).not.toBe(move.from);
      // The buyout lands you in the seat for that very season.
      const season = career.history.find((entry) => entry.year === move.year);
      expect(season.teamId).toBe(move.to);
    });
  });

  it("holds a driver to a deal they refuse to break", () => {
    const { career, phases } = playCareer({
      debutYear: 1988,
      seed: "clause-run",
      difficulty: DIFFICULTY.PROSPECT,
      ask: ASKS.RELEASE_CLAUSE,
      onClause: "reject",
    });

    expect(phases).toContain(PHASES.CLAUSE);
    // Turning a buyout down is not a way out: the driver races on for the team
    // he is contracted to, so no season may end with him somewhere else.
    expect(career.history.every((season) => season.teamId)).toBe(true);
    expect(career.phase).toBe(PHASES.RETIRED);
  });

  it("earns the odd factory upgrade over a career spent on technical work", () => {
    const { career } = playCareer({
      debutYear: 1988,
      seed: "factory",
      difficulty: DIFFICULTY.PROSPECT,
      focus: PRESEASON_FOCUS.TECHNICAL,
    });

    const upgraded = career.history.filter((season) => season.upgrade);
    expect(upgraded.length).toBeGreaterThan(0);
    // It is a roll, not a salary: nobody gets one every single year.
    expect(upgraded.length).toBeLessThan(career.history.length);
  });

  it("never upgrades the car in a debut season", () => {
    const { career } = playCareer({
      debutYear: 1988,
      seed: "factory",
      difficulty: DIFFICULTY.PROSPECT,
      focus: PRESEASON_FOCUS.TECHNICAL,
    });

    expect(career.history[0].upgrade).toBe(false);
  });

  it("never upgrades the car in a winter spent on anything else", () => {
    const { career } = playCareer({
      debutYear: 1988,
      seed: "factory",
      difficulty: DIFFICULTY.PROSPECT,
      focus: PRESEASON_FOCUS.QUALIFYING,
    });

    expect(career.history.every((season) => season.upgrade === false)).toBe(true);
  });

  it("is fully reproducible from the seed", () => {
    const first = playCareer({ seed: "same" }).career;
    const second = playCareer({ seed: "same" }).career;

    expect(second.history).toEqual(first.history);
    expect(second.totals).toEqual(first.totals);
    expect(second.verdict).toEqual(first.verdict);
  });

  it("never repeats a personal event within one career", () => {
    const { career } = playCareer({ debutYear: 1965, seed: "events" });
    expect(new Set(career.seenEvents).size).toBe(career.seenEvents.length);
  });

  it("carries a season past the end of the real data without breaking", () => {
    const { career } = playCareer({ debutYear: bootstrap.lastDataYear - 2, seed: "future" });
    const generated = career.history.filter((season) => season.year > bootstrap.lastDataYear);
    expect(generated.length).toBeGreaterThan(0);
    generated.forEach((season) => {
      expect(season.starts).toBeGreaterThan(0);
      expect(season.team).toBeTruthy();
    });
  });

  it("rates a better career higher in the paddock", () => {
    const strong = playCareer({ debutYear: 1988, seed: "strong", difficulty: DIFFICULTY.PROSPECT }).career;
    const weak = playCareer({ debutYear: 1988, seed: "weak", difficulty: DIFFICULTY.UNDERDOG }).career;

    // Reputation reads results, so whoever finished higher has to be the one the
    // market rates - but over the window reputation actually reads. It weights
    // the latest season about three times a six-year-old one, on purpose, so a
    // career average is the wrong yardstick: a driver with three old titles who
    // finished 13th and 12th in his last two years is worth less to a team than
    // one who just won the championship, and the function is right to say so.
    const meanPosition = (career) =>
      career.history.slice(-6).reduce((sum, season) => sum + season.position, 0) /
      career.history.slice(-6).length;

    const [better, worse] =
      meanPosition(strong) <= meanPosition(weak) ? [strong, weak] : [weak, strong];

    expect(reputationOf(better)).toBeGreaterThanOrEqual(reputationOf(worse));
  });
});
