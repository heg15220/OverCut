/**
 * WP10 of docs/manager/SIM-FISICA.md (RF-SIM-02, RF-WKD-02): the season packs carry the real
 * pole, fastest race lap and winner's average of every Grand Prix (refLaps, f1db), the race
 * reference lap comes from them, and the quickest car in qualifying - quick mode and playable
 * session alike - lands within ±1.5 % of the real pole.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { substream } from "../../../overcutTrayectoria/engine/rng";
import { reference } from "../../data/reference";
import { createCareer, createContext, currentRace, entrantsFor, eraOf, runPractice } from "../career";
import { runQualifying } from "../race";
import { createSession, runSessionToEnd, sessionResult } from "../sessionSim";
import { loadSeasonPack, seasonPackYears } from "./seasonPacks";
import { referenceLapsOf } from "./refLaps";
import balance from "../../data/balance/pack-world.json";

const YEARS = [2005, 2012, 2024];
let packs = null;
let context = null;
beforeAll(async () => {
  const loaded = await Promise.all(YEARS.map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

/** Dry rounds of a pack (pole not slower than the race's fastest lap by more than the wet ratio). */
const dryRounds = (pack) =>
  pack.calendar
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.refLaps.pole && event.refLaps.fastestRaceLap && event.refLaps.pole <= event.refLaps.fastestRaceLap * balance.refLaps.wetPoleRatio);

describe("refLaps in the season packs", () => {
  test("every raced round of every pack has a real pole, fastest race lap and winner's average", async () => {
    const all = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
    all.forEach(({ pack }) => {
      pack.calendar.filter((event) => event.resultsAvailable).forEach((event) => {
        expect({ year: pack.year, round: event.round, pole: event.refLaps.pole > 40 }).toEqual({ year: pack.year, round: event.round, pole: true });
        // Spa 2021 had no racing laps (two behind the safety car): f1db records no fastest lap.
        if (pack.year === 2021 && event.round === 12) expect(event.refLaps.fastestRaceLap).toBeNull();
        else {
          expect(event.refLaps.fastestRaceLap).toBeGreaterThan(40);
          expect(event.refLaps.winnerAvg).toBeGreaterThanOrEqual(event.refLaps.fastestRaceLap);
        }
      });
    });
  });

  test("f1db's own numbers: Monza 2012 and Bahrain 2024 (SIM-FISICA §4.1)", () => {
    const monza = packs[2012].calendar.find((event) => event.layoutId === "monza-7").refLaps;
    expect(monza).toEqual({ pole: 84.01, fastestRaceLap: 87.239, winnerAvg: 90.212 });
    const bahrain = packs[2024].calendar.find((event) => event.layoutId === "bahrain-1").refLaps;
    expect(bahrain.pole).toBe(89.165);
    expect(bahrain.fastestRaceLap).toBe(92.608);
    // 2005's aggregate format: the pole is the best single lap, not the two-lap sum.
    expect(packs[2005].calendar[0].qualifyingFormat).toBe("AGGREGATE");
    expect(packs[2005].calendar[0].refLaps.pole).toBeLessThan(100);
  });

  test("baseLap comes from the fastest race lap, and wet sessions fall back to the other lap", () => {
    expect(referenceLapsOf({ pole: 84.01, fastestRaceLap: 87.239, winnerAvg: 90.212 })).toEqual({
      baseLap: Math.round(87.239 * balance.refLaps.raceFromFastest * 100) / 100,
      qualifyingRef: 84.01,
    });
    // Interlagos 2024: wet qualifying (83.405) and a dry-ish fastest lap (80.472).
    const wet = referenceLapsOf({ pole: 83.405, fastestRaceLap: 80.472, winnerAvg: 90 });
    expect(wet.qualifyingRef).toBeCloseTo(80.472 * balance.refLaps.poleFromFastest, 3);
    expect(referenceLapsOf({ pole: null, fastestRaceLap: null, winnerAvg: null })).toBeNull();
  });
});

describe("RF-WKD-02 qualifying of the fastest car within ±1.5 % of the real pole", () => {
  const raceOf = (career, index) => {
    career.round = index;
    runPractice(career, {});
    return currentRace(career);
  };

  test.each(YEARS)("quick qualifying, %i", (year) => {
    const career = createCareer(context, { year, teamId: "ferrari", seed: `ref-${year}` });
    dryRounds(packs[year]).forEach(({ event, index }) => {
      const race = raceOf(career, index);
      expect(race.qualifyingRef).toBe(event.refLaps.pole);
      const result = runQualifying({ entrants: entrantsFor(career), race, era: eraOf(career), year, wetness: 0, practice: career.weekend?.practice || {}, stream: substream(`ref-${year}`, String(index)) });
      const best = Math.min(...Object.values(result.times));
      expect({ round: event.round, ok: Math.abs(best / event.refLaps.pole - 1) <= 0.015 }).toEqual({ round: event.round, ok: true });
    });
  });

  test.each(YEARS)("playable qualifying session, %i", (year) => {
    const career = createCareer(context, { year, teamId: "ferrari", seed: `ses-${year}` });
    dryRounds(packs[year]).slice(0, 4).forEach(({ event, index }) => {
      const race = raceOf(career, index);
      const state = createSession({ kind: "qualifying", entrants: entrantsFor(career), race, era: eraOf(career), seed: `ses-${year}-${index}`, practice: career.weekend?.practice || {} });
      runSessionToEnd(state);
      // Best single lap of any segment (2005's aggregate ranks by the sum of two).
      const times = sessionResult(state).segments.flatMap((segment) => segment.rows.map((row) => row.time)).filter(Number.isFinite);
      const best = Math.min(...times);
      expect({ round: event.round, ok: Math.abs(best / event.refLaps.pole - 1) <= 0.015, best, pole: event.refLaps.pole }).toEqual({ round: event.round, ok: true, best, pole: event.refLaps.pole });
    });
  });
});
