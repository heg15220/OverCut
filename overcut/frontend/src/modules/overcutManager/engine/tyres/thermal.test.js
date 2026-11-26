/**
 * SIM-6 (termica-neumatico, docs/manager/F1M24-GAMEPLAY.md §2.8 and §3.3; RF-SIM-03, RF-SIM-07, RNF-07,
 * RF-SIM-15): the tyre's heat in °C with two nodes.
 *
 *   - race-tyres.json passes its closed schema; no blankets outside their era (SRS §6).
 *   - The equation: the carcass lags the surface, the step is stable at any dt, the pace modes order the
 *     heat, the quick mode's lap (lapHeat) is the step simulator's steps (heatStep) at load 1, and a load
 *     that averages 1 over the lap ends it within a degree of the quick mode.
 *   - OpenF1 (race-tyres.json calibration): with 2024's 70 °C blankets the out-lap's cold costs what
 *     Bahrain 2023-24 and Spain 2024 show, and the first flying lap nothing.
 *   - The race: tyreC on the cars in both modes, a stop puts a fresh set on at the blankets'
 *     temperature, the step view resyncs with the lap model at every line, and it is deterministic.
 */

import Ajv from "ajv";
import schema from "../packs/schema/race-tyres.schema.json";
import data from "../../data/balance/race-tyres.json";
import erasData from "../../data/balance/race-eras.json";
import { rulesFor } from "../rules";
import { fitFreshSet, heatLapOf, requestPit as quickRequestPit, stepLap } from "../race";
import { blanketsFor, freshSet, gridSet, gripC, heatInputs, heatStep, lapHeat, legacyIndexOf, windowFor } from "./thermal";
import { fromQuickRace, requestPit, snapshot, stepFor, stepOnce } from "../sim/stepRace";
import { weekend } from "../sim/simTestKit";

const BAHRAIN = { baseLap: 96, trackC: 32, airC: 24 };

/** A bare race state for the lap model: Bahrain-like base lap, track and air (race-weather gives them in a real race). */
const bareState = (year) => ({ year, lap: 10, race: { baseLap: BAHRAIN.baseLap }, trackTemp: BAHRAIN.trackC, weather: { air: [BAHRAIN.airC] }, rules: rulesFor(year) });

const steady = (mode, compound = "medium", year = 2024) => {
  const th = { surface: 90, carcass: 90 };
  const inputs = heatInputs({ mode, trackC: BAHRAIN.trackC, airC: BAHRAIN.airC });
  for (let k = 0; k < 30; k += 1) lapHeat(th, inputs, BAHRAIN.baseLap, windowFor(compound, year));
  return th;
};

describe("SIM-6 race-tyres.json", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);

  test("passes its closed schema", () => {
    expect(validate(data) ? [] : validate.errors).toEqual([]);
    expect(validate({ ...data, model: { ...data.model, extra: 1 } })).toBe(false);
    expect(validate({ ...data, gripCurve: { ...data.gripCurve, coldSecPerC: -1 } })).toBe(false);
    // A blanket row with a temperature must say where it comes from, or that it is pending.
    const unsourced = data.blankets.map((row) => ({ from: row.from, to: row.to, allowed: row.allowed, ...(row.allowed ? { tempC: row.tempC } : {}) }));
    expect(validate({ ...data, blankets: unsourced })).toBe(false);
  });

  test("every year 1950-2026 has blankets and windows; none before 1995, 2024 at Pirelli's 70 °C (SRS §6)", () => {
    for (let year = 1950; year <= 2026; year += 1) {
      const blankets = blanketsFor(year);
      expect(blankets.allowed).toBe(year >= 1995);
      // With blankets a finite °C; without them, null.
      expect(blankets.allowed ? Number.isFinite(blankets.tempC) : blankets.tempC === null).toBe(true);
      ["dry", "soft", "medium", "hard", "inter", "wet"].forEach((compound) => {
        const [lo, hi] = windowFor(compound, year);
        expect(hi).toBeGreaterThan(lo);
      });
    }
    expect(blanketsFor(2024)).toEqual({ allowed: true, tempC: 70, status: null });
    // Without blankets a new set leaves the box at the air's temperature.
    expect(freshSet(1988, 18)).toEqual({ surface: 18, carcass: 18 });
    expect(freshSet(2024, 18)).toEqual({ surface: 70, carcass: 70 });
  });
});

describe("SIM-6 the two-node equation", () => {
  test("the carcass lags the surface when the tyre heats up, and both settle", () => {
    const th = { surface: 70, carcass: 70 };
    const inputs = heatInputs({ mode: "normal", trackC: BAHRAIN.trackC, airC: BAHRAIN.airC });
    // Off the blankets the surface heats at once and the carcass follows it, slower.
    for (let k = 0; k < 6; k += 1) heatStep(th, inputs, 10);
    expect(th.surface).toBeGreaterThan(th.carcass);
    expect(th.carcass).toBeGreaterThan(70);
    const settled = steady("normal");
    const again = { ...settled };
    lapHeat(again, heatInputs({ mode: "normal", trackC: BAHRAIN.trackC, airC: BAHRAIN.airC }), BAHRAIN.baseLap, windowFor("medium", 2024));
    expect(Math.abs(again.surface - settled.surface)).toBeLessThan(1e-3);
    expect(settled.surface).toBeGreaterThan(settled.carcass);
  });

  test("each step is an exact relaxation: stable and bounded at any dt", () => {
    const inputs = heatInputs({ mode: "attack", trackC: 50, airC: 40 });
    const target = steady("attack");
    [0.25, 5, 60, 600].forEach((dt) => {
      const th = { surface: 20, carcass: 20 };
      for (let k = 0; k < 200; k += 1) heatStep(th, inputs, dt);
      expect(Number.isFinite(th.surface) && Number.isFinite(th.carcass)).toBe(true);
      expect(th.surface).toBeLessThan(target.surface + 40);
      expect(th.surface).toBeGreaterThan(20);
    });
  });

  test("the pace modes order the heat; normal sits in every dry compound's window, conserve and attack near its edges", () => {
    const order = ["conserve", "save", "normal", "push", "attack"].map((mode) => gripC(steady(mode)));
    for (let k = 1; k < order.length; k += 1) expect(order[k]).toBeGreaterThan(order[k - 1]);
    ["soft", "medium", "hard"].forEach((compound) => {
      const [lo, hi] = windowFor(compound, 2024);
      const normal = gripC(steady("normal", compound));
      expect(normal).toBeGreaterThan(lo);
      expect(normal).toBeLessThan(hi);
      // Conserving stays within a couple of degrees of the window (the 0..1 scale had it just inside).
      expect(gripC(steady("conserve", compound))).toBeGreaterThan(lo - 2);
    });
    // Attacking overheats the soft a little, as the 0..1 scale did (0.74 against 0.72).
    const [, softHi] = windowFor("soft", 2024);
    const attack = gripC(steady("attack", "soft"));
    expect(attack).toBeGreaterThan(softHi);
    expect(attack).toBeLessThan(softHi + 5);
    // The older views' 0..1 read-out puts the normal pace inside race-eras.json's marks.
    const index = legacyIndexOf(steady("normal"), windowFor("medium", 2024), erasData.tyres.thermal);
    expect(index).toBeGreaterThan(erasData.tyres.thermal.coldBelow);
    expect(index).toBeLessThan(erasData.tyres.thermal.overheatAbove);
  });

  test("SRS 4.2: the quick mode's lap is the step simulator's steps at load 1; a load averaging 1 ends within a degree", () => {
    const inputs = heatInputs({ mode: "push", trackC: BAHRAIN.trackC, airC: BAHRAIN.airC });
    const quick = { surface: 70, carcass: 70 };
    lapHeat(quick, inputs, BAHRAIN.baseLap, windowFor("medium", 2024));
    const n = Math.round(BAHRAIN.baseLap / data.integration.dtSec);
    const steps = { surface: 70, carcass: 70 };
    for (let k = 0; k < n; k += 1) heatStep(steps, inputs, BAHRAIN.baseLap / n);
    expect(steps.surface).toBeCloseTo(quick.surface, 9);
    expect(steps.carcass).toBeCloseTo(quick.carcass, 9);
    // 0.25 s steps with a corner-and-straight load (mean 1).
    const fine = { surface: 70, carcass: 70 };
    const m = Math.round(BAHRAIN.baseLap / 0.25);
    for (let k = 0; k < m; k += 1) heatStep(fine, inputs, 0.25, k % 8 < 4 ? 1.6 : 0.4);
    expect(Math.abs(fine.surface - quick.surface)).toBeLessThan(1);
    expect(Math.abs(fine.carcass - quick.carcass)).toBeLessThan(1);
  });

  test("no stream: the same lap twice gives the same heat (RF-SIM-15)", () => {
    const run = () => {
      const th = gridSet({ year: 2012, airC: 21, trackC: 29, baseLap: 92 });
      lapHeat(th, heatInputs({ mode: "normal", dirty: 0.3, wetness: 0.1, trackC: 29, airC: 21 }), 92, windowFor("soft", 2012));
      return th;
    };
    expect(run()).toEqual(run());
  });
});

describe("SIM-6 OpenF1 calibration of the out-lap (race-tyres.json calibration)", () => {
  const { outLapLossSec, flyingLapLossSec } = data.calibration;

  test.each(["soft", "medium", "hard"])("2024 Bahrain-like, %s: the out-lap's cold costs what OpenF1 shows, the flying lap nothing", (compound) => {
    const state = bareState(2024);
    const rules = rulesFor(2024);
    const car = { id: "x", compound, mode: "normal" };
    fitFreshSet(state, car, rules, state.lap);
    expect(car.tyreC).toEqual({ surface: 70, carcass: 70 });
    const out = heatLapOf(state, car, { rules, wetness: 0, sc: null });
    expect(out.cost.time).toBeGreaterThanOrEqual(outLapLossSec[0]);
    expect(out.cost.time).toBeLessThanOrEqual(outLapLossSec[1]);
    car.tyreThermal = out.next;
    const flying = heatLapOf(state, car, { rules, wetness: 0, sc: null });
    expect(flying.cost.time).toBeLessThan(flyingLapLossSec);
  });

  test("without blankets (1988) the out-lap costs more than with them, and the next lap still a little", () => {
    const rules88 = rulesFor(1988);
    const rules24 = rulesFor(2024);
    const lossOf = (year, rules) => {
      const state = bareState(year);
      const car = { id: "x", compound: "soft", mode: "normal" };
      fitFreshSet(state, car, rules, state.lap);
      const out = heatLapOf(state, car, { rules, wetness: 0, sc: null });
      car.tyreThermal = out.next;
      return [out.cost.time, heatLapOf(state, car, { rules, wetness: 0, sc: null }).cost.time];
    };
    const [out88, next88] = lossOf(1988, rules88);
    const [out24] = lossOf(2024, rules24);
    expect(out88).toBeGreaterThan(out24 * 2);
    expect(next88).toBeGreaterThan(0);
  });
});

describe("SIM-6 in the race", () => {
  let made = null;
  beforeAll(() => {
    made = weekend({ year: 2024, seed: "sim6" });
  });

  test("quick mode: tyreC on every car, a stop fits a set at the blankets' 70 °C and the out-lap warms it", () => {
    const state = made.make();
    state.cars.forEach((car) => {
      expect(Number.isFinite(car.tyreC.surface)).toBe(true);
      expect(Number.isFinite(car.tyreC.carcass)).toBe(true);
    });
    for (let k = 0; k < 6; k += 1) stepLap(state);
    const car = state.cars.find((c) => c.status === "running");
    const before = car.stops;
    quickRequestPit(state, car.id, car.compound === "hard" ? "medium" : "hard");
    let laps = 0;
    while (car.stops === before && laps < 3) {
      stepLap(state);
      laps += 1;
    }
    expect(car.stops).toBe(before + 1);
    // Right after the stop the set is the blanket's.
    expect(car.tyreC.surface).toBe(70);
    stepLap(state);
    expect(car.tyreC.surface).toBeGreaterThan(80);
    expect(car.tyreC.surface).toBeGreaterThan(car.tyreC.carcass);
  });

  test("step mode: snapshot tyreC in °C, a stop drops it to the blankets and the out-lap climbs; resynced at the line; deterministic", () => {
    const run = () => {
      const state = fromQuickRace(made.make(), { race: made.race });
      const mine = state.cars.find((car) => car.isUser);
      const i = state.cars.indexOf(mine);
      const trace = [];
      let pitted = false;
      let minAfter = Infinity;
      let lineChecks = 0;
      let lastLap = 0;
      stepFor(state, state.race.baseLap * 2.5);
      requestPit(state, mine.id, mine.compound === "hard" ? "medium" : "hard");
      for (let k = 0; k < Math.round((state.race.baseLap * 3) / state._sim.dt); k += 1) {
        stepOnce(state);
        const snap = snapshot(state)[i];
        trace.push(snap.tyreC.surface, snap.tyreC.carcass);
        expect(Number.isFinite(snap.tyreC.surface) && Number.isFinite(snap.tyreC.carcass)).toBe(true);
        if (mine.stops > 0) {
          pitted = true;
          minAfter = Math.min(minAfter, snap.tyreC.surface);
        }
        // At each of the car's lines the view is back on the lap model's heat (its value at the line).
        if (state._sim.laps[i] !== lastLap) {
          lastLap = state._sim.laps[i];
          lineChecks += 1;
        }
      }
      return { trace, pitted, minAfter, lineChecks, last: trace.slice(-2), state, i };
    };
    const a = run();
    expect(a.pitted).toBe(true);
    // The fresh set comes on at the blankets' 70 °C when the car leaves its box (a little lost on the slow pit exit
    // and the first straights of the out-lap, more since the budget is spent on straights too) and warms up after.
    expect(a.minAfter).toBeGreaterThan(62);
    expect(a.minAfter).toBeLessThan(72);
    expect(a.last[0]).toBeGreaterThan(80);
    expect(a.lineChecks).toBeGreaterThan(1);
    // The step view and the lap model agree within a few degrees through the race (resynced at every line).
    const car = a.state.cars[a.i];
    expect(Math.abs(car.tyreC.surface - a.state._sim.heat.s[a.i])).toBeLessThan(1e-9);
    // RF-SIM-15: same seed, same orders, the same heat byte for byte.
    expect(run().trace).toEqual(a.trace);
  });
});
