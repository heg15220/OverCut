/**
 * Phase 5 balance (SRS 7.4), RF-FIN-01..04: a whole season on autopilot - the
 * strategist's plans, no R&D, every dilemma answered with its first option - for a
 * top, a midfield and a back-of-the-grid team in 2008, 2012 (season packs) and
 * 2024 (bootstrap). The board must not sack a principal whose team does roughly
 * what it should (confidence > 20 at the flag; a title contender finishing first
 * or second keeps a healthy board), and the books must stay plausible: no team
 * ends the year with three times the money it started with (data/balance/
 * finance.json and board.json, RNF-07).
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import { PHASES, closeWeekend, constructorStandings, createCareer, createContext, simulateWeekend } from "../career";
import { resolveEvent } from "../events";
import { loadSeasonPack } from "../packs/seasonPacks";

let context = null;

beforeAll(async () => {
  const loaded = await Promise.all([2008, 2012].map((year) => loadSeasonPack(year)));
  context = createContext(fallbackBootstrap, reference, Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack])));
});

const autopilotSeason = (year, teamId) => {
  const career = createCareer(context, { year, teamId, seed: `balance-${year}-${teamId}` });
  const start = career.finances.balance;
  let guard = 0;
  while (career.phase !== PHASES.REVIEW && !career.ended && guard < 40) {
    simulateWeekend(career);
    closeWeekend(career);
    career.inbox
      .filter((item) => item.kind === "event" && !item.event.resolved)
      .forEach((item) => resolveEvent(career, item.id, item.event.options[0].id));
    guard += 1;
  }
  const own = constructorStandings(career).find((row) => row.teamId === career.teamId);
  return { career, start, position: own.position, expected: career.board.expected };
};

const CASES = [
  [2008, "ferrari", "top"],
  [2008, "toyota", "mid"],
  [2008, "force-india", "back"],
  [2012, "red-bull", "top"],
  [2012, "sauber", "mid"],
  [2012, "hrt", "back"],
  [2024, "mclaren", "top"],
  [2024, "williams", "mid"],
  [2024, "sauber", "back"],
];

describe("phase 5 · board and money over a full season (RF-FIN-01..04)", () => {
  it.each(CASES)("%i %s (%s team) keeps its principal and sane books", (year, teamId, tier) => {
    const { career, start, position, expected } = autopilotSeason(year, teamId);
    expect(career.ended).toBeFalsy();
    expect(career.phase).toBe(PHASES.REVIEW);
    // Doing roughly what the car says must never get the principal sacked.
    expect(career.board.confidence).toBeGreaterThan(20);
    if (tier === "top" && position <= 2) expect(career.board.confidence).toBeGreaterThan(45);
    expect(Math.abs(position - expected)).toBeLessThanOrEqual(4);
    // Money: no ×3 in one season on autopilot (the spare is the development budget it did not spend).
    expect(start).toBeGreaterThan(0);
    expect(career.finances.balance / start).toBeGreaterThan(0.5);
    expect(career.finances.balance / start).toBeLessThan(1.75);
  });
});
