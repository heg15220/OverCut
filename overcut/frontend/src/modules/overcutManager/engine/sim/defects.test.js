/**
 * WP11 of docs/manager/SIM-FISICA.md (RF-SIM-10, RF-SIM-13): defects seen in the 2026-11-22 probe.
 *
 *   - Laps that cannot be: after a red flag (the step race placed the field on the grid at once,
 *     53-75 s laps at Silverstone) or a safety car (the quick mode closed a 30 s gap in one lap).
 *     No completed lap is quicker than 0.9 x baseLap, in either mode.
 *   - Stops out of all proportion (Monaco 2012: 70-106 against 26 real): the circuit's tyre wear,
 *     or in refuelling years what a stop is worth, comes from the real stops of that Grand Prix
 *     (pack calendar[].pitStops, f1db; race.js strategyScales), an unplanned stop takes the place
 *     of a planned one due soon, and an overcut call no longer stops now and two laps later.
 *     Stops per finisher in dry races within ±50 % of the real median.
 */

import { runToFinish } from "../race";
import { fromQuickRace, runStepToFinish } from "./index";
import { packContext, weekend } from "./simTestKit";

let context = null;
beforeAll(async () => {
  context = await packContext();
});

const both = (year, circuit, seed) => {
  const w = weekend({ year, circuit, context, seed });
  return { race: w.race, quick: runToFinish(w.make()), step: runStepToFinish(fromQuickRace(w.make(), { race: w.race })) };
};

const shortLaps = (state) =>
  state.cars.flatMap((car) => car.history.filter((entry) => !entry.retired && entry.lap > 1 && entry.end - entry.start < 0.9 * state.race.baseLap).map((entry) => `${car.id} L${entry.lap} ${(entry.end - entry.start).toFixed(1)}`));

const stopsPerFinisher = (state) => {
  const finished = state.cars.filter((car) => car.status === "finished");
  return finished.reduce((sum, car) => sum + car.history.filter((entry) => entry.pit).length, 0) / Math.max(1, finished.length);
};

const dry = (state) => state.weather.wetness.every((value) => value < 0.2);

describe("WP11 · no lap quicker than 0.9 x baseLap after a red flag or a safety car (RF-SIM-10)", () => {
  // Silverstone 2005 with these seeds has a red flag (the case of SIM-FISICA §2.6; "r40" in the step race
  // since WX-C2 - "r13" was a wet race and the measured spray loss, GS-11, moved it; "r13" after SIM-C1,
  // "r10" before, "r6" before the fuel's real weight, RF-SIM-04 - and "r2" in the quick one); Monza 2012
  // safety cars. r40 is a dry race, so later weather changes do not move it.
  const cases = [...["r40", "r1", "r2"].map((seed) => [2005, "silverstone", seed]), ...["r8", "r3"].map((seed) => [2012, "monza", seed])];
  let runs = [];
  beforeAll(() => {
    runs = cases.map(([year, circuit, seed]) => both(year, circuit, seed));
  });

  it("the sample has red flags and safety cars to test on", () => {
    const events = runs.flatMap((run) => [...run.quick.events, ...run.step.events]);
    expect(events.some((event) => event.type === "sc" && !event.virtual)).toBe(true);
    expect(runs.some((run) => run.step.events.some((event) => event.type === "red" || (event.type === "flag" && event.red)) || run.step.safetyCarSpells.some((spell) => spell.red))).toBe(true);
  });

  it("quick mode", () => {
    expect(runs.flatMap((run) => shortLaps(run.quick))).toEqual([]);
  });

  it("step mode", () => {
    expect(runs.flatMap((run) => shortLaps(run.step))).toEqual([]);
  });
});

describe("WP11 · stops per finisher within ±50 % of the real median (RF-SIM-13)", () => {
  it.each([
    [2012, "monaco"],
    [2012, "monza"],
    [2012, "bahrain"],
    [2024, "bahrain"],
    [2024, "monaco"],
    [2024, "suzuka"],
    [1998, "monaco"],
    [2008, "monza"],
  ])("%i %s", (year, circuit) => {
    const run = both(year, circuit, "stops");
    const real = run.race.pitStops.median;
    [run.quick, run.step].filter(dry).forEach((state) => {
      expect(Math.abs(stopsPerFinisher(state) / real - 1)).toBeLessThanOrEqual(0.5);
    });
  });
});
