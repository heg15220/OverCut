/**
 * Failures, incidents and the first corner against f1db (RF-SIM-09, RF-SIM-14, RF-SIM-10,
 * RF-DEV-08; RNF-07 tunables in data/balance/race-reliability.json with a schema; RF-SIM-15 /
 * RNF-05 determinism; SRS 4.2 both modes play the same start).
 *
 *   - the balance file matches its schema and its f1db block covers every playable season;
 *   - the hazards: the field's mean failure rate is the era's real one, a less reliable car
 *     fails more, a worn unit and a damaged part raise their own group only;
 *   - the first corner: a longer run to it brings the field in closer (more overlap), lower
 *     consistency means more touches, the same seed gives the same plan, both modes read it;
 *   - whole quick-mode races over every circuit of a season per era reproduce the real mechanical
 *     retirements per car-race (±15 %), solo accidents plus collisions after the opening laps
 *     (±30 %, fewer events) and opening-lap incident retirements per race (the six seasons pooled
 *     ±20 %; one season's circuits only ±60 %, f1db's own seasons vary that much);
 *   - a mechanical retirement breaks the counted unit of its real failure group (units.js).
 */

import Ajv from "ajv";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { createStream } from "../../overcutTrayectoria/engine/rng";
import { reference } from "../data/reference";
import REL from "../data/balance/race-reliability.json";
import schema from "./packs/schema/race-reliability.schema.json";
import { createCareer, createContext, currentRace, runPractice, runQualifyingSession, seasonWorld, weekendRaceArgs } from "./career";
import { calibrationFor, measuredFor, raceHazards, timeToCover, turnOnePlan, unitWearOf, wearFactorOf } from "./incidents";
import { createRace, runToFinish } from "./race";
import { fromQuickRace } from "./sim";
import { loadSeasonPack, seasonPackYears } from "./packs/seasonPacks";
import { freshUnits, unitsAfterRace } from "./development/units";
import { eraProfileFor } from "../../overcutTrayectoria/engine/eras";
import simBalance from "../data/balance/race-sim.json";

let context = null;
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  context = createContext(fallbackBootstrap, reference, Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack])));
});

describe("RNF-07 · race-reliability.json", () => {
  it("matches its schema", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(REL) || validate.errors).toBe(true);
  });

  it("has f1db figures for every playable season, consistent with themselves", () => {
    seasonPackYears().forEach((year) => {
      const era = measuredFor(year);
      expect(year).toBeGreaterThanOrEqual(era.years[0]);
      expect(year).toBeLessThanOrEqual(era.years[1]);
    });
    REL.measured.eras.forEach((era) => {
      const sum = Object.values(era.mechanicalByGroup).reduce((total, value) => total + value, 0);
      expect(Math.abs(sum - era.mechanicalPerCarRace)).toBeLessThan(0.002);
      expect(era.racesWithOpeningIncidentRetirement).toBeLessThanOrEqual(era.openingIncidentRetirementsPerRace + 1e-9);
    });
  });
});

const field = (n, overrides = {}) => Array.from({ length: n }, (_, k) => ({ id: `c${k}`, reliability: 0.9, consistency: 55, racecraft: 50, pace: { dry: 0 }, ...overrides }));

describe("RF-SIM-14 · hazards from f1db, the car, its units and its parts", () => {
  const perRace = (perLap, laps) => 1 - Math.pow(1 - perLap, laps);

  it("the field's mean failure rate is the era's real one; a less reliable car fails more", () => {
    [1988, 2004, 2012, 2024].forEach((year) => {
      const cars = field(20).map((car, k) => ({ ...car, reliability: 0.8 + k * 0.009 }));
      const hazards = raceHazards({ cars, year, laps: 60 });
      const mean = cars.reduce((sum, car) => sum + perRace(hazards[car.id].mech, 60), 0) / cars.length;
      const target = measuredFor(year).mechanicalPerCarRace * calibrationFor(year).mechanical;
      expect(Math.abs(mean / target - 1)).toBeLessThan(0.08);
      expect(hazards.c0.mech).toBeGreaterThan(hazards.c19.mech);
    });
  });

  it("a worn unit raises its own group, a fresh one lowers it; a damaged part raises its group", () => {
    expect(wearFactorOf(1)).toBeGreaterThan(1);
    expect(wearFactorOf(0)).toBeLessThan(1);
    expect(wearFactorOf(undefined)).toBe(1);
    expect(unitWearOf({ ice: { wear: 0.9 }, tc: { wear: 0.2 }, gearbox: { wear: 0.4 }, es: { wear: 0.1 } })).toEqual({ engine: 0.9, gearbox: 0.4, electrics: 0.1 });
    const share = (hazard, group) => {
      const index = hazard.groups.findIndex(([name]) => name === group);
      return hazard.groups[index][1] - (index > 0 ? hazard.groups[index - 1][1] : 0);
    };
    const base = raceHazards({ cars: field(2), year: 2016, laps: 55 });
    const worn = raceHazards({ cars: [{ ...field(1)[0], unitWear: { engine: 1 } }, field(2)[1]], year: 2016, laps: 55 });
    expect(worn.c0.mech).toBeGreaterThan(base.c0.mech);
    expect(share(worn.c0, "engine")).toBeGreaterThan(share(base.c0, "engine"));
    const damaged = raceHazards({ cars: [{ ...field(1)[0], bodyDamage: { suspension: "heavy" } }, field(2)[1]], year: 2016, laps: 55 });
    expect(share(damaged.c0, "suspension")).toBeGreaterThan(share(base.c0, "suspension"));
  });

  it("a less consistent driver crashes more on his own", () => {
    const hazards = raceHazards({ cars: [field(1, { consistency: 35 })[0], { ...field(1, { consistency: 75 })[0], id: "c1" }], year: 2010, laps: 60 });
    expect(hazards.c0.accident).toBeGreaterThan(hazards.c1.accident);
  });
});

describe("RF-SIM-09 · the start and the first corner", () => {
  const circuitAt = (metres) => ({ length: 5000, corners: [{ number: 1, from: metres / 5000, kmh: 90 }] });
  const plan = (cars, circuit, seed, year = 2012) => turnOnePlan({ cars, circuit, year, grid: simBalance.grid, stream: createStream(seed) });

  it("from standstill the gap in time between grid slots shrinks as the run to the corner grows", () => {
    const gap = (metres) => timeToCover(metres + 8, 11, 85) - timeToCover(metres, 11, 85);
    expect(gap(600)).toBeLessThan(gap(150));
    const bunching = (metres) => {
      let sum = 0;
      for (let s = 0; s < 60; s += 1) sum += plan(field(20), circuitAt(metres), `b${s}`).bunching;
      return sum;
    };
    expect(bunching(700)).toBeGreaterThan(bunching(120));
  });

  it("less consistent drivers touch more often; the same seed gives the same start", () => {
    const touches = (consistency) => {
      let count = 0;
      for (let s = 0; s < 300; s += 1) count += plan(field(20, { consistency }), circuitAt(500), `t${s}`).contacts.length;
      return count;
    };
    expect(touches(30)).toBeGreaterThan(touches(80));
    expect(plan(field(20), circuitAt(500), "same")).toEqual(plan(field(20), circuitAt(500), "same"));
  });

  it("both modes play the same first corner (SRS 4.2)", () => {
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "t1" });
    runPractice(career, {});
    runQualifyingSession(career, {});
    const args = weekendRaceArgs(career);
    let found = null;
    for (let k = 0; k < 40 && !found; k += 1) {
      const quick = createRace({ ...args, seed: `t1-${k}` });
      if (quick.turnOne.contacts.length) found = { quick, step: fromQuickRace(createRace({ ...args, seed: `t1-${k}` }), { race: currentRace(career) }) };
    }
    expect(found).not.toBeNull();
    expect(found.step.turnOne).toEqual(found.quick.turnOne);
    runToFinish(found.quick);
    const firstLap = found.quick.events.filter((event) => event.type === "contact" && event.turnOne).map((event) => event.carId).sort();
    expect(firstLap).toEqual(found.quick.turnOne.contacts.flatMap((contact) => contact.ids).sort());
  });
});

describe("RF-SIM-09 / RF-SIM-14 · whole quick-mode races against f1db, by era", () => {
  const ERAS = [1988, 1997, 2004, 2012, 2018, 2024];
  // Every round of the season (the run to the first corner differs a lot between circuits), a few seeds each.
  const SEEDS = 10;

  const measure = (year) => {
    const acc = { races: 0, starts: 0, mech: 0, later: 0, opening: 0 };
    const rounds = seasonWorld(context, year, "probe").races.length;
    for (let round = 0; round < rounds; round += 1) {
      const career = createCareer(context, { year, seed: `rel-${year}`, mode: "strict", spectator: true, teamId: Object.keys(seasonWorld(context, year, "probe").teams)[0] });
      career.round = round;
      runPractice(career, {});
      runQualifyingSession(career, {});
      const args = weekendRaceArgs(career);
      for (let s = 0; s < SEEDS; s += 1) {
        const state = runToFinish(createRace({ ...args, seed: `rel-${year}-${round}-${s}` }));
        acc.races += 1;
        acc.starts += state.cars.length;
        state.cars.forEach((car) => {
          if (car.status !== "retired") return;
          if (car.retireReason === "mechanical") acc.mech += 1;
          else if (car.retireReason === "accident" || car.retireReason === "collision") {
            if (car.retiredLap <= 2) acc.opening += 1;
            else acc.later += 1;
          }
        });
      }
    }
    return acc;
  };

  const pooled = { sim: 0, real: 0 };
  it.each(ERAS)("%i", (year) => {
    const acc = measure(year);
    const real = measuredFor(year);
    const mech = acc.mech / acc.starts;
    const later = acc.later / acc.starts;
    const opening = acc.opening / acc.races;
    const realLater = real.incidentsPerCarRace.accident.later + real.incidentsPerCarRace.collision.later;
    // eslint-disable-next-line no-console
    console.log(
      `${year}: mechanical ${mech.toFixed(4)} / real ${real.mechanicalPerCarRace}; accidents+collisions later ${later.toFixed(4)} / ${realLater.toFixed(4)}; ` +
        `opening per race ${opening.toFixed(3)} / ${real.openingIncidentRetirementsPerRace} (${acc.races} races)`,
    );
    expect(Math.abs(mech / real.mechanicalPerCarRace - 1)).toBeLessThan(0.15);
    expect(Math.abs(later / realLater - 1)).toBeLessThan(0.3);
    // One season's circuits are a small sample of first corners (f1db itself: 0.31 per race in 1988
    // against 0.73 for 1980-1988), so per season the opening laps only have to be of the right size;
    // the six seasons pooled must match the eras' real rate within 20 %.
    expect(Math.abs(opening / real.openingIncidentRetirementsPerRace - 1)).toBeLessThan(0.6);
    pooled.sim += opening;
    pooled.real += real.openingIncidentRetirementsPerRace;
  });

  it("opening-lap incident retirements per race, the six seasons pooled, within 20 % of f1db", () => {
    // eslint-disable-next-line no-console
    console.log(`opening per race pooled: ${(pooled.sim / ERAS.length).toFixed(3)} / real ${(pooled.real / ERAS.length).toFixed(3)}`);
    expect(pooled.real).toBeGreaterThan(0);
    expect(Math.abs(pooled.sim / pooled.real - 1)).toBeLessThan(0.2);
  });
});

describe("RF-SIM-14 · a mechanical retirement breaks the unit of its failure group", () => {
  it("engine and gearbox groups take their unit; hydraulics takes none", () => {
    const era = eraProfileFor(2012);
    const run = (component) => {
      const units = freshUnits(era, 2012, 20);
      unitsAfterRace({ units, era, rows: [{ driverId: "d", status: "mechanical", component }], seed: "u", year: 2012, round: 0, hasNextRace: false });
      return Object.fromEntries(Object.entries(units.drivers.d).map(([comp, unit]) => [comp, unit.failed]));
    };
    expect(run("engine")).toEqual({ engine: true, gearbox: false });
    expect(run("gearbox")).toEqual({ engine: false, gearbox: true });
    expect(run("hydraulics")).toEqual({ engine: false, gearbox: false });
  });
});
