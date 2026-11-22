/**
 * SRS 4.2: "El modo rápido usa el mismo modelo, pero vuelta a vuelta y sin duelos
 * individuales. Su salida debe ser estadísticamente equivalente: misma media y varianza
 * de tiempos por vuelta ± 2 %." Both modes run the same weekend for several seeds and
 * their clean-air lap times (no lap 1, no in/out laps, no safety car, no mistakes, clear
 * air at both lines) are compared.
 */

import { createRace, runToFinish } from "../race";
import { eraOf, entrantsFor } from "../career";
import { createStepRace, fromQuickRace, runStepToFinish } from "./index";
import { cleanLaps, meanOf, stdOf, weekend } from "./simTestKit";

const SEEDS = ["eq1", "eq2", "eq3", "eq4"];

/** Pool clean laps per car over seeds: `{ carId: { quick: [...], step: [...] } }`. */
const pool = (runs) => {
  const out = {};
  runs.forEach(({ quick, step }) => {
    const q = cleanLaps(quick);
    const s = cleanLaps(step);
    Object.keys(q).forEach((id) => {
      out[id] = out[id] || { quick: [], step: [] };
      out[id].quick.push(...q[id]);
      out[id].step.push(...(s[id] || []));
    });
  });
  return out;
};

/** Field-wide figures: the mean of the per-car means and of the per-car deviations. */
const compare = (pooled, minLaps) => {
  const ids = Object.keys(pooled).filter((id) => pooled[id].quick.length >= minLaps && pooled[id].step.length >= minLaps);
  const figures = (key) => ({ mean: meanOf(ids.map((id) => meanOf(pooled[id][key]))), std: meanOf(ids.map((id) => stdOf(pooled[id][key]))), laps: ids.reduce((sum, id) => sum + pooled[id][key].length, 0) });
  const quick = figures("quick");
  const step = figures("step");
  const worstMean = Math.max(...ids.map((id) => Math.abs(meanOf(pooled[id].step) / meanOf(pooled[id].quick) - 1)));
  return { cars: ids.length, quick, step, meanRatio: step.mean / quick.mean, stdRatio: step.std / quick.std, worstMean };
};

const report = (label, result) => {
  // eslint-disable-next-line no-console
  console.log(
    `${label}: ${result.cars} cars, laps quick ${result.quick.laps} / step ${result.step.laps}; mean ${result.quick.mean.toFixed(3)} / ${result.step.mean.toFixed(3)} s ` +
      `(ratio ${result.meanRatio.toFixed(4)}, worst car ${(result.worstMean * 100).toFixed(2)} %); std ${result.quick.std.toFixed(3)} / ${result.step.std.toFixed(3)} s (ratio ${result.stdRatio.toFixed(4)})`,
  );
};

describe("SRS 4.2 statistical equivalence of the step sim (RF-SIM-01) with the quick mode", () => {
  it("one car alone on track: the same lap model gives the same mean and spread within 2 %", () => {
    const runs = [];
    SEEDS.forEach((seed) => {
      const { career, race } = weekend({ seed });
      const era = eraOf(career);
      entrantsFor(career).forEach((entrant) => {
        const args = { race, era, year: career.year, entrants: [entrant], grid: [entrant.id], seed: `${seed}::${entrant.id}` };
        runs.push({ quick: runToFinish(createRace(args)), step: runStepToFinish(createStepRace(args)) });
      });
    });
    const result = compare(pool(runs), 30);
    report("alone", result);
    expect(Math.abs(result.meanRatio - 1)).toBeLessThan(0.02);
    expect(result.worstMean).toBeLessThan(0.02);
    expect(Math.abs(result.stdRatio - 1)).toBeLessThan(0.02);
  });

  it("the full field, with traffic and duels: clean-air laps keep the quick mode's mean and spread", () => {
    const runs = SEEDS.map((seed) => {
      const w = weekend({ seed });
      return { quick: runToFinish(w.make()), step: runStepToFinish(fromQuickRace(w.make(), { race: w.race })) };
    });
    const result = compare(pool(runs), 25);
    report("field", result);
    expect(Math.abs(result.meanRatio - 1)).toBeLessThan(0.02);
    expect(result.worstMean).toBeLessThan(0.02);
    // The spread of clean laps in a full field also depends on *which* laps are clean
    // (traffic decides that differently in each mode), so this bound is looser; the
    // alone test above is the like-for-like check.
    expect(Math.abs(result.stdRatio - 1)).toBeLessThan(0.15);
  });
});
