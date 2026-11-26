/**
 * SRS 4.2: "El modo rápido usa el mismo modelo, pero vuelta a vuelta y sin duelos
 * individuales. Su salida debe ser estadísticamente equivalente: misma media y varianza
 * de tiempos por vuelta ± 2 %."
 *
 * Both modes run the same weekend (same grid, weather and plans) for several seeds.
 *
 *   alone    one car on an empty track: every lap but the first, in-laps and out-laps
 *            and mistakes - the like-for-like check of the shared lap model.
 *   field    the full field. Comparing each mode's own clean-air laps is biased: traffic
 *            decides *which* laps are clean differently in each mode (early heavy-fuel
 *            laps against late ones, so the spread moves with the selection, not the
 *            model). The fair comparison takes, per car and seed, only the laps that
 *            were clean in BOTH modes - the same lap numbers, so the same fuel load and
 *            stint phase - and leaves out the cars that stopped on different laps in the two
 *            modes (a safety car in one mode only), the laps the rival pit wall drove on a different
 *            pace mode or fuel mix in each mode (RF-SIM-13: its calls read the gaps, which traffic
 *            makes differ), and those whose race carried a lasting incident
 *            (damage from a contact, a misfire): a handful of discrete draws per race on
 *            different streams would otherwise decide the spread. Per-car means and
 *            deviations are then averaged over the field. Only dry laps count here (a rain
 *            weekend's drying line, 6-8 s of spread per car, decided the field's average); the
 *            wet laps are compared on their own below.
 *
 * Also: the step sim's own clean laps, its passes (switchbacks apart) and its contacts
 * against the quick mode's, so traffic stays plausible.
 */

import { createRace, runToFinish } from "../race";
import { eraOf, entrantsFor } from "../career";
import { createStepRace, fromQuickRace, runStepToFinish } from "./index";
import { carsWithIncidents, cleanLaps, cleanLapsByLap, meanOf, stdOf, weekend } from "./simTestKit";

const SEEDS = ["eq1", "eq2", "eq3", "eq4"];
// RF-SIM-11: wet laps scatter five times more than dry ones (the line drying): eight weekends.
const WET_SEEDS = Array.from({ length: 8 }, (_, k) => `eq${k + 1}`);
// 128 races: the field's spread ratio is the ratio of two estimates from different random draws,
// whose standard error with 32 races (~2 %) equalled the ±2 % tolerance (SIM-FISICA §7: 0.97,
// 1.00 and 1.03 on three sets of 32 seeds). With 64 it was still ~1.4 %: after the era-correct
// trace (26/11/2026) three sets of 64 gave 0.972, 1.019 and 0.986 (no bias, mean 0.992). The
// tolerance is unchanged; the sample is larger again.
const FIELD_SEEDS = Array.from({ length: 128 }, (_, k) => `eq${k + 1}`);
// The field test's laps are dry ones (water on the line below this, engine/weather wetness 0-1).
const DRY_BELOW = 0.05;

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

/**
 * The fair pool: per car and seed, the laps clean in both modes, cars without lasting incidents.
 * `dryBelow`: only laps run (and begun) on a line with less water than that - the field test's,
 * because one rain weekend among 64 (per-car spread 6-8 s on a drying line against ~0.7 s dry)
 * decided the whole field's average spread; the wet laps have their own test (alone, wet).
 */
const poolMatched = (runs, { dryBelow = null } = {}) => {
  const out = {};
  runs.forEach(({ quick, step }) => {
    const q = cleanLapsByLap(quick);
    const s = cleanLapsByLap(step);
    const hurt = new Set([...carsWithIncidents(quick), ...carsWithIncidents(step)]);
    // Same lap number is only the same stint phase if the car stopped on the same laps: a
    // safety car one mode has and the other not moves the stops by ten laps (a free stop).
    const stops = (state, id) => state.cars.find((car) => car.id === id).history.filter((entry) => entry.pit).map((entry) => entry.lap).join(",");
    // RF-SIM-13: the rival pit wall picks each lap's pace mode and fuel mix from the gaps around the
    // car, which traffic makes differ between the modes by design; a lap driven on another mode in
    // each (save against normal: ~0.5 s) is not the same lap. Only laps on the same call count.
    const calls = (state, id) => Object.fromEntries(state.cars.find((car) => car.id === id).history.map((entry) => [entry.lap, `${entry.mode}|${entry.mix}`]));
    Object.keys(q).forEach((id) => {
      if (hurt.has(id) || !s[id] || stops(quick, id) !== stops(step, id)) return;
      out[id] = out[id] || { quick: [], step: [] };
      const callQ = calls(quick, id);
      const callS = calls(step, id);
      Object.keys(q[id]).forEach((lap) => {
        if (s[id][lap] === undefined || callQ[lap] !== callS[lap]) return;
        if (dryBelow !== null && ((quick.weather.wetness[Number(lap)] ?? 0) >= dryBelow || (quick.weather.wetness[Number(lap) - 1] ?? 0) >= dryBelow)) return;
        out[id].quick.push(q[id][lap]);
        out[id].step.push(s[id][lap]);
      });
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

  it("RF-SIM-11: one car alone in the rain (light rain at the start, Silverstone): wet laps keep the mean and spread within 2 %", () => {
    const runs = [];
    WET_SEEDS.forEach((seed) => {
      const { career, race } = weekend({ seed, circuit: "silverstone" });
      const era = eraOf(career);
      entrantsFor(career).forEach((entrant) => {
        const args = { race, era, year: career.year, entrants: [entrant], grid: [entrant.id], seed: `${seed}::wet::${entrant.id}`, weatherStart: 4 };
        runs.push({ quick: runToFinish(createRace(args)), step: runStepToFinish(createStepRace(args)) });
      });
    });
    // Every race starts on a wet line in both modes: the comparison is of wet laps (and the drying
    // that follows; each lap's water is recomputed with the cars really running, so a retirement in
    // one mode only changes it from there).
    runs.forEach(({ quick, step }) => {
      expect(quick.weather.wetness[0]).toBeGreaterThan(0.24);
      expect(step.weather.wetness[0]).toBe(quick.weather.wetness[0]);
    });
    // The fair pool of the field test: laps clean in both modes on the same lap numbers, cars that
    // stopped on the same laps (when to go to slicks on a drying line is a stream draw per mode).
    const result = compare(poolMatched(runs), 20);
    report("alone, wet (matched laps)", result);
    expect(result.cars).toBeGreaterThan(12);
    expect(Math.abs(result.meanRatio - 1)).toBeLessThan(0.02);
    expect(result.worstMean).toBeLessThan(0.02);
    expect(Math.abs(result.stdRatio - 1)).toBeLessThan(0.02);
  });

  describe("the full field, with traffic and duels", () => {
    const runs = FIELD_SEEDS.map((seed) => {
      const w = weekend({ seed });
      return { quick: runToFinish(w.make()), step: runStepToFinish(fromQuickRace(w.make(), { race: w.race })) };
    });

    it("laps clean in both modes keep the quick mode's mean and spread within 2 %", () => {
      const result = compare(poolMatched(runs, { dryBelow: DRY_BELOW }), 20);
      report("field (matched laps)", result);
      expect(result.cars).toBeGreaterThan(12);
      expect(Math.abs(result.meanRatio - 1)).toBeLessThan(0.02);
      expect(result.worstMean).toBeLessThan(0.02);
      expect(Math.abs(result.stdRatio - 1)).toBeLessThan(0.02);
      // For the record: each mode's own clean laps (biased by which laps are clean).
      const own = compare(pool(runs), 25);
      report("field (own clean laps)", own);
      expect(Math.abs(own.meanRatio - 1)).toBeLessThan(0.02);
    });

    it("passes and contacts stay in the quick mode's range", () => {
      const count = (states, test) => states.reduce((sum, state) => sum + state.events.filter(test).length, 0);
      const quick = runs.map((run) => run.quick);
      const step = runs.map((run) => run.step);
      const passes = { quick: count(quick, (event) => event.type === "pass"), step: count(step, (event) => event.type === "pass" && !event.switchback) };
      const switchbacks = count(step, (event) => event.type === "pass" && event.switchback);
      const crashes = (event) => event.type === "contact" || (event.type === "dnf" && event.reason === "collision");
      const contacts = { quick: count(quick, crashes), step: count(step, crashes) };
      // eslint-disable-next-line no-console
      console.log(`passes over ${runs.length} races: quick ${passes.quick} / step ${passes.step} (+${switchbacks} switchbacks); contacts quick ${contacts.quick} / step ${contacts.step}`);
      expect(passes.step / passes.quick).toBeGreaterThan(0.8);
      expect(passes.step / passes.quick).toBeLessThan(1.25);
      expect(contacts.step).toBeLessThan(contacts.quick * 2 + 6);
    });
  });
});
