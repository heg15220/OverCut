/**
 * Rules by era (SRS 6.2, RNF-07) and criterio 7.2: no rule outside its era.
 *
 *   - engine/rules.js resolves every rule from the season pack or from
 *     curated/era-defaults.json; the defaults pass curated/era-rules.json for
 *     every year and reproduce the thresholds race.js used to hold in code.
 *   - RF-SIM-04 refuelling, RF-SIM-05 energy, RF-SIM-08 DRS, RF-SIM-10 race
 *     control, RF-SIM-14 unit limits, RF-CMD-01 orders: each only in its era.
 *   - Full races across a sweep of years produce only era-legal events.
 *   - RF-HIS-00: no accident is ever fatal.
 */

import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { eraFeaturesFor, eraProfileFor } from "../../overcutTrayectoria/engine/eras";
import { reference } from "../data/reference";
import eraRules from "../data/seasons/curated/era-rules.json";
import { createCareer, createContext, createWeekendRace, currentRace, entrantsFor, eraOf, runPractice, runQualifyingSession, seasonWorld } from "./career";
import {
  applyGridPenalties, compoundsFor, createRace, energyEra, energyStep, redFlag, refuellingEra, rulesOf, runToFinish, setErs, stationaryTime, stepLap, suggestPlan,
} from "./race";
import { commandsFor, defaultRegulationsFor, drsOpen, gridPenaltyFor, penaltyFor, raceBalance, rulesFor } from "./rules";
import { eraWithRegulations } from "./packs/packWorld";
import { loadSeasonPack, seasonPackYears } from "./packs/seasonPacks";
import { eraRulesFor, satisfiesEraRule } from "./packs/validatePack";
import { blanketsFor } from "./tyres/thermal";

const SWEEP = [1976, 1988, 1993, 1994, 2005, 2008, 2009, 2010, 2012, 2014, 2015, 2021, 2024, 2026];

let packs = {};
let context = null;

beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

const getPath = (object, path) => path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);

/** What race.js decided by year before fase 3, kept here as the reference the data must reproduce. */
const legacy = {
  compounds: (year) => (year < 1982 ? ["dry"] : year < 2007 ? ["soft", "hard"] : ["soft", "medium", "hard"]),
  refuelling: (year) => year >= 1994 && year <= 2009,
  energy: (year) => (year >= 2014 ? "ers" : year === 2009 || (year >= 2011 && year <= 2013) ? "kers" : null),
  dirtyAir: (year) => (year < 1968 ? 0.12 : year < 1977 ? 0.22 : year < 2022 ? 0.42 : 0.24),
  blankets: (year) => year >= 1995,
};

/** Seasons the offline data can field a grid for (bootstrap years and pack years). */
const FIELDED = [1976, 1988, 1998, 2005, 2008, 2012, 2016, 2024];

/**
 * A Grand Prix of `year` ready to start. Pack and bootstrap years run their own
 * weekend; other years borrow the grid of the nearest fielded season and race it
 * under their own era's rules (era profile of `year`, no pack).
 */
const startRace = (year, seed) => {
  const base = FIELDED.reduce((best, candidate) => (Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best), FIELDED[0]);
  const world = seasonWorld(context, base, seed);
  const teamId = world.order.find((id) => !world.teams[id].partial);
  const career = createCareer(context, { year: base, teamId, seed });
  runPractice(career, {});
  runQualifyingSession(career, {});
  if (base === year) return createWeekendRace(career);
  const entrants = entrantsFor(career);
  return createRace({ race: currentRace(career), era: eraProfileFor(year), year, entrants, grid: career.weekend.qualifying.order.filter((id) => entrants.some((entrant) => entrant.id === id)), seed });
};

describe("SRS 6.2 / RNF-07 · the resolver reads data, not years", () => {
  it("era-defaults pass every curated era rule, for every year 1950-2026 (criterio 7.2)", () => {
    for (let year = 1950; year <= 2026; year += 1) {
      const regs = defaultRegulationsFor(year);
      eraRulesFor(year, eraRules.rules).forEach((rule) => {
        const value = getPath(regs, rule.field);
        if (value === undefined) return; // a field only packs carry (points, engine formula, sprints)
        expect({ year, field: rule.field, ok: satisfiesEraRule(rule, value) }).toEqual({ year, field: rule.field, ok: true });
      });
    }
  });

  it("reproduces the year thresholds race.js had in code, for years without a pack", () => {
    for (let year = 1950; year <= 2026; year += 1) {
      const features = eraFeaturesFor(year);
      const rules = rulesFor(eraProfileFor(year));
      expect(rules.source).toBe("era-defaults");
      expect(compoundsFor(year)).toEqual(legacy.compounds(year));
      expect(refuellingEra(year)).toBe(legacy.refuelling(year));
      expect(rules.raceControl.safetyCar).toBe(features.safetyCar);
      expect(rules.raceControl.vsc).toBe(features.virtualSafetyCar);
      expect(rules.qualifying.knockout).toBe(features.knockoutQualifying);
      expect(rules.tyres.mandatoryDryCompounds >= 2).toBe(year >= 2007);
      expect(rules.dirtyAir).toBe(legacy.dirtyAir(year));
      // SIM-6: blankets (race-tyres.json, engine/tyres/thermal.js) exactly where the 0..1 out-lap scale had them.
      expect(blanketsFor(year).allowed).toBe(legacy.blankets(year));
      // WP7 (RF-SIM-12): the stop is by stages now (engine/sim/pitStop.test.js calibrates it per era);
      // here only the era rule: fuel lengthens the stop only where refuelling is legal.
      const dry = stationaryTime({ year, refuel: 0, crew: 70 });
      const fuelled = stationaryTime({ year, refuel: 12, crew: 70 });
      expect(fuelled - dry > 1e-9).toBe(legacy.refuelling(year));
      if (year <= 2025) {
        expect(rules.drs.enabled).toBe(features.drs);
        expect(energyEra(year)).toBe(legacy.energy(year));
      }
    }
  });

  it("corrects 2026: active aero and the overtake mode instead of DRS (SRS 6.2)", () => {
    const rules = rulesFor(2026);
    expect(rules.drs.enabled).toBe(false);
    expect(rules.activeAero).toBe(true);
    expect(rules.energy.system).toBe("ers2026");
    expect(rules.energy.overtakeMode).toBe(true);
  });

  it("uses the pack's regulations in pack years, and the pack wins over the defaults", () => {
    [2005, 2008, 2012].forEach((year) => {
      const rules = rulesFor(eraWithRegulations(year, packs[year].regulations));
      expect(rules.source).toBe("pack");
      expect(rules.refuelling).toBe(packs[year].regulations.refuelling);
      expect(rules.energy.system).toBe(packs[year].regulations.energySystem);
      expect(rules.tyres.changesInRace).toBe(packs[year].regulations.tyreChangesInRace);
      expect(rules.unitLimits).toEqual(packs[year].regulations.unitLimits);
      expect(rules.tyres.suppliers).toEqual(packs[year].regulations.tyreSuppliers);
    });
    expect(rulesFor(eraWithRegulations(2012, packs[2012].regulations)).tyres.topTenStartTyres).toBe("Q3");
    // A (hypothetical) pack that says otherwise is obeyed: the pack is the fixed anchor (SRS 6.1).
    const altered = rulesFor(eraWithRegulations(2012, { ...packs[2012].regulations, drs: false, refuelling: true }));
    expect(altered.drs.enabled).toBe(false);
    expect(altered.refuelling).toBe(true);
  });

  it("career eras reach race.js with the pack's rules (eraOf)", () => {
    const career = createCareer(context, { year: 2005, teamId: "ferrari", seed: "rules-05" });
    expect(rulesOf(eraOf(career), 2005).source).toBe("pack");
    expect(rulesOf(eraOf(career), 2005).tyres.changesInRace).toBe(false);
  });
});

describe("criterio 7.2 · no rule outside its era (sweep)", () => {
  it.each(SWEEP)("%i", (year) => {
    const rules = rulesFor(packs[year] ? eraWithRegulations(year, packs[year].regulations) : eraProfileFor(year));
    const commands = commandsFor(rules);
    expect(rules.drs.enabled).toBe(year >= 2011 && year <= 2025);
    expect(rules.refuelling).toBe(year >= 1994 && year <= 2009);
    expect(rules.raceControl.vsc).toBe(year >= 2015);
    expect(rules.raceControl.safetyCar).toBe(year >= 1993);
    expect(rules.energy.kers).toBe(year === 2009 || (year >= 2011 && year <= 2013));
    expect(rules.energy.ers).toBe(year >= 2014);
    expect(rules.energy.overtakeMode).toBe(year === 2026);
    expect(rules.activeAero).toBe(year === 2026);
    expect(rules.raceControl.penaltyTypes.includes("time5")).toBe(year >= 2014);
    expect(rules.raceControl.penaltyTypes.includes("driveThrough")).toBe(year >= 1989);
    // RF-CMD-01/02: energy orders only with KERS/ERS; fuel-mix calls only outside the refuelling years; fuel in the stop only in them.
    expect(commands.energy.length > 0).toBe(rules.energy.system !== "none");
    expect(commands.energy.includes("overtake")).toBe(year === 2026);
    expect(commands.fuelMix.length > 0).toBe(!rules.refuelling);
    expect(commands.pit.fuel).toBe(rules.refuelling);
    expect(commands.drs).toBe(rules.drs.enabled);
  });
});

describe("SIM-5 reglas-sc-era · the safety-car and VSC procedure only in its era (criterio 7.2)", () => {
  const SC_FIELDS = ["scUnlapping", "scPitClosed", "scRestartLine", "scOvertakeBeforeLine", "vscEndingWarn"];

  it("has every new key in era-defaults for every year, null before its procedure existed, sourced or pending", () => {
    for (let year = 1950; year <= 2026; year += 1) {
      const regs = defaultRegulationsFor(year);
      SC_FIELDS.forEach((field) => expect(regs).toHaveProperty(field));
      const scBefore = year < 1993 ? ["scUnlapping", "scPitClosed", "scRestartLine", "scOvertakeBeforeLine"].map((field) => regs[field]) : [];
      expect(scBefore.filter((value) => value !== null)).toEqual([]);
      expect(year < 2015 ? regs.vscEndingWarn : null).toBeNull();
    }
  });

  it("walks the 38 seasons: no SC procedure before 1993, no VSC warning before 2015, closed keys only", () => {
    const years = seasonPackYears();
    expect(years).toHaveLength(38);
    years.forEach((year) => {
      const rules = rulesFor(eraWithRegulations(year, packs[year].regulations));
      const { sc, vscEndingWarn } = rules.raceControl;
      expect(Boolean(sc)).toBe(year >= 1993);
      expect(Boolean(vscEndingWarn)).toBe(year >= 2015);
      const scShape = sc
        ? { restartLine: ["sc1", "control"].includes(sc.restartLine), unlapping: typeof sc.unlapping, pitClosed: typeof sc.pitClosed, overtakeBeforeLine: sc.overtakeBeforeLine }
        : { restartLine: true, unlapping: "boolean", pitClosed: "boolean", overtakeBeforeLine: false };
      expect(scShape).toEqual({ restartLine: true, unlapping: "boolean", pitClosed: "boolean", overtakeBeforeLine: false });
      const warn = vscEndingWarn || { minSec: 0, maxSec: 0 };
      expect(warn.maxSec).toBeGreaterThanOrEqual(warn.minSec);
    });
  });

  it("reads FIA 2024 (art. 55.8, 55.11, 55.13, 56.7) for 2024", () => {
    const rules = rulesFor(eraWithRegulations(2024, packs[2024].regulations));
    expect(rules.raceControl.sc).toEqual({ unlapping: true, pitClosed: false, restartLine: "control", overtakeBeforeLine: false });
    expect(rules.raceControl.vscEndingWarn).toEqual({ minSec: 10, maxSec: 15 });
  });

  it("carries the measured scRate only on the measured seasons' calendars (pack calendar[].scRate)", () => {
    seasonPackYears().forEach((year) => {
      const rates = packs[year].calendar.map((event) => event.scRate).filter((rate) => rate !== undefined);
      expect(year < 2023 ? rates : []).toEqual([]);
      expect(rates.filter((rate) => !(rate > 0 && rate < 1))).toEqual([]);
    });
    expect(packs[2024].calendar.filter((event) => event.scRate !== undefined).length).toBeGreaterThan(20);
  });
});

describe("RF-SIM-08 · DRS", () => {
  const rules = rulesFor(2012);
  it("opens from lap 3, within a second, in the dry, two laps after a restart, and only where there are zones", () => {
    expect(drsOpen(rules, { lap: 2, gapAhead: 0.5, zones: 2 })).toBe(false);
    expect(drsOpen(rules, { lap: 3, gapAhead: 0.5, zones: 2 })).toBe(true);
    expect(drsOpen(rules, { lap: 3, gapAhead: 1.2, zones: 2 })).toBe(false);
    expect(drsOpen(rules, { lap: 10, gapAhead: 0.5, zones: 2, wetness: 0.4 })).toBe(false);
    expect(drsOpen(rules, { lap: 10, gapAhead: 0.5, zones: 0 })).toBe(false);
    expect(drsOpen(rules, { lap: 11, gapAhead: 0.5, zones: 1, restartLap: 10 })).toBe(false);
    expect(drsOpen(rules, { lap: 12, gapAhead: 0.5, zones: 1, restartLap: 10 })).toBe(false);
    expect(drsOpen(rules, { lap: 13, gapAhead: 0.5, zones: 1, restartLap: 10 })).toBe(true);
    expect(drsOpen(rulesFor(2008), { lap: 10, gapAhead: 0.5, zones: 2 })).toBe(false);
    expect(drsOpen(rulesFor(2026), { lap: 10, gapAhead: 0.5, zones: 2 })).toBe(false);
  });
});

describe("RF-SIM-05 · energy by era", () => {
  it("KERS spends a per-lap budget (~6.7 s at 60 kW) that comes back every lap", () => {
    const rules = rulesFor(2011);
    const spec = raceBalance.energy.kers;
    expect(spec.perLapDeploySeconds).toBeCloseTo(400 / spec.powerKw, 1);
    const deploy = energyStep({ rules, mode: "deploy", battery: 100 });
    expect(deploy.time).toBeCloseTo(-spec.perLapDeploySeconds * spec.gainPerSecond, 6);
    expect(deploy.battery).toBe(0);
    expect(energyStep({ rules, mode: "harvest", battery: 100 }).time).toBeCloseTo(0, 10);
  });

  it("ERS carries a battery from lap to lap and cannot deploy what it has not got", () => {
    const rules = rulesFor(2016);
    const full = energyStep({ rules, mode: "deploy", battery: 100 });
    const empty = energyStep({ rules, mode: "deploy", battery: 6 });
    expect(full.battery).toBe(70);
    expect(empty.battery).toBe(0);
    expect(Math.abs(empty.time)).toBeLessThan(Math.abs(full.time));
    expect(energyStep({ rules, mode: "harvest", battery: 50 }).battery).toBeGreaterThan(50);
  });

  it("2026's overtake mode only works within a second of the car ahead", () => {
    const rules = rulesFor(2026);
    const close = energyStep({ rules, mode: "overtake", battery: 80, gapAhead: 0.6 });
    const far = energyStep({ rules, mode: "overtake", battery: 80, gapAhead: 2.5 });
    expect(close.overtake).toBe(true);
    expect(far.overtake).toBe(false);
    expect(close.time).toBeLessThan(far.time);
    expect(energyStep({ rules: rulesFor(2008), mode: "deploy", battery: 100 })).toEqual({ time: 0, battery: null, overtake: false });
  });

  it("accepts energy orders only in eras that have them (RF-CMD-01)", () => {
    const build = (year) => startRace(year, `energy-${year}`);
    const s2008 = build(2008);
    const car08 = s2008.cars[0];
    setErs(s2008, car08.id, "deploy");
    expect(car08.battery).toBeNull();
    expect(car08.ersMode).toBeNull();

    const s2024 = build(2024);
    const car24 = s2024.cars[0];
    setErs(s2024, car24.id, "overtake");
    expect(car24.ersMode).toBe("balanced");
    setErs(s2024, car24.id, "deploy");
    expect(car24.ersMode).toBe("deploy");

    const s2026 = build(2026);
    const car26 = s2026.cars[0];
    setErs(s2026, car26.id, "overtake");
    expect(car26.ersMode).toBe("overtake");
  });

  it("lets the 2009 non-KERS teams race without it", () => {
    const optOut = raceBalance.energy.kers.optOut["2009"];
    const state = startRace(2009, "kers-2009");
    const without = state.cars.filter((car) => optOut.includes(car.teamId));
    const withKers = state.cars.filter((car) => !optOut.includes(car.teamId));
    expect(withKers.length).toBeGreaterThan(0);
    without.forEach((car) => expect(car.battery).toBeNull());
    withKers.forEach((car) => expect(car.battery).toBe(100));
  });
});

describe("RF-SIM-10 · race control by era", () => {
  it("gives only the penalties the era had", () => {
    expect(penaltyFor(rulesFor(1976), "collision")).toBeNull();
    expect(penaltyFor(rulesFor(1976), "jumpStart")).toBe("postRaceTime");
    expect(penaltyFor(rulesFor(1990), "collision")).toBe("driveThrough");
    expect(penaltyFor(rulesFor(1990), "pitSpeeding")).toBeNull();
    expect(penaltyFor(rulesFor(2005), "pitSpeeding")).toBe("driveThrough");
    expect(penaltyFor(rulesFor(2008), "unsafeRelease")).toBeNull();
    expect(penaltyFor(rulesFor(2014), "collision")).toBe("time10");
    expect(penaltyFor(rulesFor(2024), "pitSpeeding")).toBe("time5");
  });

  it("restarts a red-flagged race by the era's procedure", () => {
    const procedureOf = (year) => {
      const state = startRace(year, `red-${year}`);
      for (let lap = 0; lap < 6; lap += 1) stepLap(state);
      const running = state.cars.filter((car) => car.status === "running");
      const before = running.map((car) => car.time);
      redFlag(state, running, "crash", 0);
      const restart = state.events.find((event) => event.type === "restart");
      return { state, restart, before, running };
    };
    const old = procedureOf(1976);
    expect(old.restart).toMatchObject({ procedure: "standing", aggregate: true });
    expect(old.running.map((car) => car.time)).toEqual(old.before);
    expect(old.state.safetyCar).toBeNull();

    const v8 = procedureOf(2010);
    expect(v8.restart.procedure).toBe("rolling");
    expect(v8.state.safetyCar).toMatchObject({ virtual: false });

    const modern = procedureOf(2024);
    expect(modern.restart).toMatchObject({ procedure: "standing", aggregate: false });
    expect(modern.state.restartLap).toBe(modern.state.lap);
    // Fresh tyres under the red flag where the era allows it.
    modern.running.forEach((car) => expect(car.tyreWear).toBe(0));
  });

  it("applies grid penalties for units only in eras with unit limits (RF-SIM-14)", () => {
    const grid = ["a", "b", "c", "d", "e", "f"];
    const rules2014 = rulesFor(2014);
    const places = gridPenaltyFor(rules2014, { component: "engine", over: 1 });
    expect(places).toBe(10);
    expect(applyGridPenalties(grid, { b: 3 }, rules2014)).toEqual(["a", "c", "d", "e", "b", "f"]);
    expect(applyGridPenalties(grid, { b: 3 }, rulesFor(1990))).toEqual(grid);
    expect(gridPenaltyFor(rulesFor(1990), { component: "engine" })).toBe(0);
  });
});

describe("RF-SIM-04 / RF-SIM-12 · stops by era", () => {
  it("2005: refuelling stops without tyre changes, one set for the race", () => {
    const career = createCareer(context, { year: 2005, teamId: "ferrari", seed: "tyres-2005" });
    runPractice(career, {});
    runQualifyingSession(career, {});
    const state = createWeekendRace(career);
    const dry = state.weather.wetness.every((value) => value < 0.2);
    runToFinish(state);
    const pits = state.events.filter((event) => event.type === "pit");
    expect(pits.length).toBeGreaterThan(0);
    pits.forEach((event) => expect(event.refuel).toBeGreaterThan(0));
    if (dry) pits.filter((event) => !event.repair).forEach((event) => expect(event.tyres).toBe(false));
    state.cars.forEach((car) => expect(new Set(car.plan.compounds).size).toBe(1));
  });

  it("plans for the era: one compound with no tyre changes, two compounds from 2007", () => {
    const profile = { aero: 0.6, attrition: 1 };
    const era2005 = eraWithRegulations(2005, packs[2005].regulations);
    const plan2005 = suggestPlan({ year: 2005, era: era2005, laps: 60, baseLap: 85, profile });
    expect(new Set(plan2005.compounds).size).toBe(1);
    expect(plan2005.stops.length).toBeGreaterThanOrEqual(1);
    const plan2012 = suggestPlan({ year: 2012, laps: 60, baseLap: 95, profile });
    expect(new Set(plan2012.compounds).size).toBeGreaterThanOrEqual(2);
  });

  it("top ten start on the qualifying tyre in 2010-2021", () => {
    const career = createCareer(context, { year: 2012, teamId: "ferrari", seed: "topten" });
    runPractice(career, {});
    runQualifyingSession(career, {});
    const state = createWeekendRace(career);
    if (state.weather.wetness[0] >= 0.24) return;
    const soft = compoundsFor(eraOf(career))[0];
    state.cars.slice(0, 10).forEach((car) => expect(car.compound).toBe(soft));
  });
});

/** Every rule an event implies, checked against the era's rules. */
const illegalEvents = (state) => {
  const rules = rulesOf(state.era, state.year);
  const wrong = [];
  const flag = (event, why) => wrong.push({ year: state.year, why, event });
  state.events.forEach((event) => {
    if (event.type === "vsc" && !rules.raceControl.vsc) flag(event, "VSC");
    if (event.type === "sc" && !rules.raceControl.safetyCar) flag(event, "SC");
    if (event.type === "pass" && event.drs && !rules.drs.enabled) flag(event, "DRS");
    if (event.type === "pass" && event.overtakeMode && !rules.energy.overtakeMode) flag(event, "overtake mode");
    if (event.type === "pit" && event.refuel !== undefined && !rules.refuelling) flag(event, "refuelling");
    // 2005 (no tyre changes): a punctured or damaged tyre could still be replaced (RF-SIM-09 repair stops).
    if (event.type === "pit" && rules.tyres.changesInRace === false && event.tyres !== false && !event.repair && state.weather.wetness.every((value) => value < 0.2)) flag(event, "tyre change");
    if (event.type === "penalty" && !rules.raceControl.penaltyTypes.includes(event.penalty)) flag(event, "penalty type");
    if (event.type === "restart" && event.procedure !== rules.raceControl.redFlag.restart && !(event.procedure === "standing" && !rules.raceControl.safetyCar)) flag(event, "restart");
    if (event.type === "grid-penalty" && !rules.unitPenalties) flag(event, "grid penalty");
    if (/fatal|death|killed/i.test(JSON.stringify(event))) flag(event, "RF-HIS-00");
  });
  state.cars.forEach((car) => {
    if (rules.energy.system === "none" && car.battery !== null) flag({ carId: car.id }, "battery");
    if (car.ersMode === "overtake" && !rules.energy.overtakeMode) flag({ carId: car.id }, "overtake mode");
    if (car.penalty === 30 && rules.tyres.mandatoryDryCompounds < 2) flag({ carId: car.id }, "two-compound rule");
  });
  return wrong;
};

const raceOf = (year, seed) => runToFinish(startRace(year, seed));

describe("criterio 7.2 · whole races produce only era-legal events", () => {
  it.each(SWEEP)("%i", (year) => {
    ["a", "b"].forEach((seed) => {
      const state = raceOf(year, `sweep-${year}-${seed}`);
      expect(state.finished).toBe(true);
      expect(illegalEvents(state)).toEqual([]);
    });
  });

  it("stays era-legal with race control turned up (red flags, investigations, penalties)", () => {
    const { offences, decisionLaps } = raceBalance.penalties;
    const saved = JSON.parse(JSON.stringify({ offences, decisionLaps, red: raceBalance.raceControl.redFlag }));
    offences.jumpStart.chancePerCar = 0.3;
    offences.collision.investigate = 1;
    offences.collision.guilty = 1;
    offences.pitSpeeding.chancePerStop = 0.2;
    offences.unsafeRelease.chancePerStop = 0.2;
    raceBalance.raceControl.redFlag.crashChance = 0.6;
    try {
      const seen = {};
      SWEEP.forEach((year) => {
        const state = raceOf(year, `hot-${year}`);
        expect(illegalEvents(state)).toEqual([]);
        state.events.forEach((event) => {
          if (event.type === "penalty") (seen[event.penalty] = seen[event.penalty] || new Set()).add(year);
          if (event.type === "red") seen.red = (seen.red || new Set()).add(year);
        });
        // Time penalties reach the classification.
        state.cars.filter((car) => car.status === "finished").forEach((car) => {
          const owed = car.penalties.filter((penalty) => penalty.atFlag).reduce((sum, penalty) => sum + (penalty.seconds || 0), 0);
          if (owed > 0) expect(car.penalty).toBeGreaterThanOrEqual(owed);
        });
      });
      expect(seen.red?.size).toBeGreaterThan(0);
      [...(seen.time5 || []), ...(seen.time10 || [])].forEach((year) => expect(year).toBeGreaterThanOrEqual(2014));
      [...(seen.driveThrough || [])].forEach((year) => expect(year).toBeGreaterThanOrEqual(1989));
      [...(seen.postRaceTime || [])].forEach((year) => expect(year).toBeLessThan(2014));
    } finally {
      Object.assign(offences.jumpStart, saved.offences.jumpStart);
      Object.assign(offences.collision, saved.offences.collision);
      Object.assign(offences.pitSpeeding, saved.offences.pitSpeeding);
      Object.assign(offences.unsafeRelease, saved.offences.unsafeRelease);
      Object.assign(raceBalance.raceControl.redFlag, saved.red);
    }
  });

  it("is deterministic with race control (RF-SIM-15)", () => {
    const one = raceOf(2015, "same-seed");
    const two = raceOf(2015, "same-seed");
    expect(JSON.stringify(one.events)).toBe(JSON.stringify(two.events));
  });

});

describe("SIM-7 errores-visibles · track limits only in their era (criterio 7.2, RF-SIM-10)", () => {
  it("has the key for every year: null before 2023, a ladder from 2023", () => {
    for (let year = 1950; year <= 2026; year += 1) {
      const regs = defaultRegulationsFor(year);
      expect(regs).toHaveProperty("trackLimits");
      expect({ year, on: regs.trackLimits !== null }).toEqual({ year, on: year >= 2023 });
    }
  });

  it("walks the 38 seasons: the procedure only from 2023, its penalties only types the era has, tactics by era", () => {
    seasonPackYears().forEach((year) => {
      const era = eraWithRegulations(year, packs[year].regulations);
      const rules = rulesFor(era);
      const procedure = rules.raceControl.trackLimits;
      expect({ year, on: Boolean(procedure) }).toEqual({ year, on: year >= 2023 });
      if (procedure) {
        procedure.race.penalties.forEach((step) => expect(rules.raceControl.penaltyTypes).toContain(step.type));
        expect(procedure.race.blackWhiteAt).toBeLessThan(procedure.race.penalties[0].at);
      }
      expect(commandsFor(era).tactics.battleAssist).toBe(rules.energy.modes.length > 0);
    });
  });
});
