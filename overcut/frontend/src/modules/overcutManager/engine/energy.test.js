/**
 * Energy and fuel by era (RF-SIM-04, RF-SIM-05, RF-CMD-01; RNF-07; SRS 6.2 coherence; SIM-FISICA §7
 * "Energía y combustible"):
 *   - data/balance/race-energy.json passes its schema and every era block cites a source;
 *   - the regulation limits per era (FIA technical regulations 2009, 2014, 2026 Section C):
 *     KERS 60 kW / 400 kJ a lap, ERS 120 kW / 2 MJ in / 4 MJ out / 4 MJ window, 2026 350 kW with
 *     its speed taper and override curve, 8.5 MJ harvest; nothing before 2009 or in 2010;
 *   - fuel: the flow limit (100 kg/h above 10 500 rpm since 2014, 3000 MJ/h in 2026), the race
 *     maximum (100/105/110 kg, turbo tanks), the start load never above it, the cost of a kg;
 *   - the quick mode: a heavier car is slower by kg x s/kg, and a car left on the rich mix all race
 *     in an era with a fuel limit runs dry (the risk of running out).
 */

import Ajv from "ajv";
import schema from "./packs/schema/race-energy.schema.json";
import data from "../data/balance/race-energy.json";
import { ENERGY, curveAt, deployKwAt, ersSpecOf, flowLimitKgH, fuelEraOf, fuelSpecOf, lapDeployOf, maxRaceKgOf, storeKwAt } from "./energy";
import { lapBudget, raceFuelOf, runToFinish, setMix, stepLap } from "./race";
import { rulesFor } from "./rules";
import { weekend } from "./sim/simTestKit";

describe("race-energy.json (RNF-07)", () => {
  it("passes its JSON schema", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    expect(validate(data) || validate.errors).toBe(true);
  });

  it("covers every year once and cites a source for every era and system", () => {
    const eras = data.fuel.eras;
    for (let k = 1; k < eras.length; k += 1) expect(eras[k].from).toBe(eras[k - 1].to + 1);
    eras.forEach((era) => expect(era.source.length).toBeGreaterThan(10));
    ["kers", "ers", "ers2026"].forEach((key) => expect(data.ers[key].source).toMatch(/V:/));
  });
});

describe("energy systems by era (RF-SIM-05, SRS 6.2)", () => {
  it("has no store before 2009 nor in 2010", () => {
    [1976, 1994, 2008, 2010].forEach((year) => expect(ersSpecOf(rulesFor(year))).toBeNull());
  });

  it("KERS 2009 and 2011-13: 60 kW in or out, 400 kJ deployed a lap (2009 TR art. 5.2.3)", () => {
    [2009, 2011, 2012, 2013].forEach((year) => {
      const spec = ersSpecOf(rulesFor(year));
      expect(spec).toBe(ENERGY.ers.kers);
      expect(deployKwAt(spec, 100)).toBe(60);
      expect(deployKwAt(spec, 320)).toBe(60);
      expect(spec.harvestKw).toBe(60);
      expect(spec.deployPerLapMJ).toBe(0.4);
    });
  });

  it("ERS 2014-25: MGU-K 120 kW, 2 MJ harvested and 4 MJ deployed a lap, a 4 MJ window (2014 TR art. 5.2.2-5.2.3)", () => {
    [2014, 2016, 2019, 2022, 2025].forEach((year) => {
      const spec = ersSpecOf(rulesFor(year));
      expect(spec).toBe(ENERGY.ers.ers);
      expect(deployKwAt(spec, 250)).toBe(120);
      expect(spec.harvestKw).toBe(120);
      expect(spec.harvestPerLapMJ).toBe(2);
      expect(spec.deployPerLapMJ).toBe(4);
      expect(spec.storeMJ).toBe(4);
      // The MGU-H's direct feed is part of the MGU-K's 120 kW, not on top of it.
      expect(storeKwAt(spec, 250) + spec.mguhDirectKw).toBe(120);
    });
  });

  it("2026: 350 kW tapering to 0 at 345 km/h, the overtake curve to 355 km/h, 8.5 MJ harvested a lap (Section C, C5.2.7-C5.2.10)", () => {
    const spec = ersSpecOf(rulesFor(2026));
    expect(spec).toBe(ENERGY.ers.ers2026);
    expect(deployKwAt(spec, 200)).toBe(350);
    expect(deployKwAt(spec, 290)).toBe(350);
    // C5.2.8 i: P = 1800 - 5 v below 340 km/h, 6900 - 20 v from 340 to 345.
    expect(deployKwAt(spec, 320)).toBeCloseTo(1800 - 5 * 320, 6);
    expect(deployKwAt(spec, 342)).toBeCloseTo(6900 - 20 * 342, 6);
    expect(deployKwAt(spec, 345)).toBe(0);
    expect(deployKwAt(spec, 350)).toBe(0);
    // C5.2.8 ii: with overtake P = 7100 - 20 v below 355 km/h.
    expect(deployKwAt(spec, 345, true)).toBeCloseTo(7100 - 20 * 345, 6);
    expect(deployKwAt(spec, 300, true)).toBe(350);
    expect(deployKwAt(spec, 355, true)).toBe(0);
    expect(spec.harvestPerLapMJ).toBe(8.5);
    expect(spec.overtakeExtraHarvestMJ).toBe(0.5);
    expect(spec.storeMJ).toBe(4);
    expect(spec.startMinKmh).toBe(50);
  });

  it("never plans to deploy more than the era allows or the store and the harvest hold", () => {
    const plan = { harvestMJ: 2, K: 10, cum: new Float64Array(11), M: 100 };
    const rules = rulesFor(2016);
    const spec = ersSpecOf(rules);
    rules.energy.modes.forEach((mode) => {
      [0, 10, 50, 100].forEach((battery) => {
        const mj = lapDeployOf({ rules, spec, plan, mode, battery });
        expect(mj).toBeLessThanOrEqual(spec.deployPerLapMJ);
        expect(mj).toBeLessThanOrEqual((battery / 100) * spec.storeMJ + plan.harvestMJ + 1e-12);
        expect(mj).toBeGreaterThanOrEqual(0);
      });
    });
    const kers = rulesFor(2012);
    kers.energy.modes.forEach((mode) => expect(lapDeployOf({ rules: kers, spec: ersSpecOf(kers), plan, mode, battery: 100 })).toBeLessThanOrEqual(0.4));
  });

  it("curves are piecewise linear and flat beyond their ends", () => {
    expect(curveAt([[0, 1], [10, 3]], 5)).toBe(2);
    expect(curveAt([[0, 1], [10, 3]], 20)).toBe(3);
  });
});

describe("fuel by era (RF-SIM-04)", () => {
  it("has the regulation's race maximum: turbo tanks 1984-88, none 1989-2013, 100/105/110 kg 2014-25", () => {
    expect(maxRaceKgOf(1984)).toBeCloseTo(220 * data.fuel.densityKgL, 6);
    expect(maxRaceKgOf(1986)).toBeCloseTo(195 * data.fuel.densityKgL, 6);
    expect(maxRaceKgOf(1988)).toBeCloseTo(150 * data.fuel.densityKgL, 6);
    [1976, 1990, 2005, 2012].forEach((year) => expect(maxRaceKgOf(year)).toBeNull());
    expect(maxRaceKgOf(2014)).toBe(100);
    expect(maxRaceKgOf(2016)).toBe(100);
    expect(maxRaceKgOf(2017)).toBe(105);
    expect(maxRaceKgOf(2018)).toBe(105);
    expect(maxRaceKgOf(2019)).toBe(110);
    expect(maxRaceKgOf(2025)).toBe(110);
  });

  it("limits the flow since 2014: 100 kg/h from 10 500 rpm, 0.009 N + 5.5 below; 3000 MJ/h in 2026", () => {
    const hybrid = fuelEraOf(2016);
    expect(flowLimitKgH(hybrid, 12000)).toBe(100);
    expect(flowLimitKgH(hybrid, 9000)).toBeCloseTo(0.009 * 9000 + 5.5, 9);
    expect(flowLimitKgH(fuelEraOf(2026), 11000)).toBeCloseTo(3000 / fuelEraOf(2026).flow.lhvMJkg, 9);
    expect(flowLimitKgH(fuelEraOf(2026), 9000)).toBeCloseTo((0.27 * 9000 + 165) / fuelEraOf(2026).flow.lhvMJkg, 9);
    [1988, 2005, 2012].forEach((year) => expect(flowLimitKgH(fuelEraOf(year), 12000)).toBeNull());
  });

  it("costs secPerKg a kg a lap on a refLapSec lap, scaled by the lap; starts with the race plus a margin, never above the limit", () => {
    const at = (year, baseLap = data.fuel.refLapSec, laps = 57) => fuelSpecOf({ rules: rulesFor(year), circuit: null, laps, baseLap });
    expect(at(2016).secPerKg).toBeCloseTo(0.035, 9);
    expect(at(2016, 45).secPerKg).toBeCloseTo(0.0175, 9);
    [1988, 2012, 2016, 2018, 2024].forEach((year) => {
      const spec = at(year);
      const max = maxRaceKgOf(year);
      expect(spec.startLaps).toBeLessThanOrEqual(57 + data.fuel.margin + 1e-9);
      expect(spec.startLaps * spec.kgPerLap).toBeLessThanOrEqual((max ?? Infinity) + 1e-9);
    });
    // Refuelling: the load is set at each stop.
    expect(at(2005).startLaps).toBeNull();
  });
});

describe("fuel in the race (RF-SIM-04, quick mode)", () => {
  const { make, race } = weekend({ year: 2016, teamId: "ferrari", seed: "fuel", circuit: "bahrain" });

  it("measures the circuit's fuel a lap from the trace: Bahrain 2016 1.3-2.0 kg, a race inside the 100 kg limit plus saving", () => {
    const state = make();
    const spec = state.fuelSpec;
    expect(spec).toEqual(raceFuelOf({ race, rules: rulesFor(2016), laps: state.laps }));
    expect(spec.kgPerLap).toBeGreaterThan(1.3);
    expect(spec.kgPerLap).toBeLessThan(2.0);
    expect(state.fuelStart * spec.kgPerLap).toBeLessThanOrEqual(100 + 1e-9);
  });

  it("a heavier car is slower by kg x s/kg (half the start load against an empty tank)", () => {
    const state = make();
    const car = state.cars[0];
    const spec = state.fuelSpec;
    const copy = (fuel) => {
      const twin = JSON.parse(JSON.stringify(car));
      twin.fuel = fuel;
      return lapBudget(state, twin, { lap: 2, wetness: 0, sc: null }).expected;
    };
    const full = copy(state.fuelStart);
    const empty = copy(0);
    expect(full - empty).toBeCloseTo(state.fuelStart * spec.kgPerLap * spec.secPerKg, 6);
  });

  it("a car left on the rich mix all race runs dry before the flag", () => {
    const state = make();
    const users = state.cars.filter((car) => car.isUser);
    let guard = 0;
    while (!state.finished && guard < 400) {
      users.forEach((car) => car.status === "running" && setMix(state, car.id, "rich"));
      stepLap(state);
      guard += 1;
    }
    // Neither sees the flag; any that was not taken out by something else ran dry.
    users.forEach((car) => expect(car.status).not.toBe("finished"));
    expect(users.some((car) => car.retireReason === "fuel")).toBe(true);
  });

  it("finishes a normal race with no car out of fuel", () => {
    const done = runToFinish(make());
    expect(done.cars.filter((car) => car.retireReason === "fuel")).toHaveLength(0);
  });
});
