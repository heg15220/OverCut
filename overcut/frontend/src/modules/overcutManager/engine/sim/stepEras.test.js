/**
 * The step simulation across eras (criterio 7.2 "ninguna regla fuera de su era") and its
 * race control (RF-SIM-10), as engine/rules.test.js does for the quick mode:
 *
 *   - a sweep of full step races, 1976-2026, scanned for illegal events and rules:
 *     DRS only 2011-2025 and only from the era's lap, the 2026 overtake mode only in
 *     2026, refuelling only 1994-2009, no tyre changes in 2005 (RF-SIM-04/12), the
 *     two-compound rule from 2007, batteries only with KERS/ERS (RF-SIM-05), SC from
 *     1993 and VSC from 2015, only the era's penalties and restart procedure;
 *   - race control played out on the track: local yellows (slower, no passing there),
 *     the red flag with the era's restart, drive-through / stop-go through the pit lane,
 *     the same investigations and penalties as the quick mode (race-control stream);
 *   - RF-SIM-15 / RNF-05: byte-identical with race control turned up.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { eraProfileFor } from "../../../overcutTrayectoria/engine/eras";
import { reference } from "../../data/reference";
import { createCareer, createContext, createWeekendRace, currentRace, entrantsFor, runPractice, runQualifyingSession, seasonWorld } from "../career";
import { classificationOf, createRace, pitLaneLoss, rulesOf, waveYellow } from "../race";
import { raceBalance } from "../rules";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import balance from "../../data/balance/race-sim.json";
import { fromQuickRace, runStepToFinish, stepFor, stepOnce, toRaceState } from "./index";

const SWEEP = [1976, 1988, 1993, 1994, 2005, 2008, 2009, 2010, 2012, 2014, 2015, 2021, 2024, 2026];
const FIELDED = [1976, 1988, 1998, 2005, 2008, 2012, 2016, 2024];

let context = null;
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  const packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

/** A step race of `year` (rules.test.js startRace: a fielded grid raced under `year`'s rules, pack where there is one). */
const startStep = (year, seed) => {
  const base = FIELDED.reduce((best, candidate) => (Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best), FIELDED[0]);
  const world = seasonWorld(context, base, seed);
  const teamId = world.order.find((id) => !world.teams[id].partial);
  const career = createCareer(context, { year: base, teamId, seed });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const race = currentRace(career);
  if (base === year) return fromQuickRace(createWeekendRace(career), { race });
  const entrants = entrantsFor(career);
  const grid = career.weekend.qualifying.order.filter((id) => entrants.some((entrant) => entrant.id === id));
  return fromQuickRace(createRace({ race, era: eraProfileFor(year), year, entrants, grid, seed }), { race });
};

/** Every rule an event or a car implies, checked against the era's rules (rules.test.js illegalEvents, plus the step sim's duels). */
const illegalEvents = (state) => {
  const rules = rulesOf(state.era, state.year);
  const dry = state.weather.wetness.every((value) => value < 0.2);
  const wrong = [];
  const flag = (event, why) => wrong.push({ year: state.year, why, event });
  state.events.forEach((event) => {
    if (event.type === "vsc" && !rules.raceControl.vsc) flag(event, "VSC");
    if (event.type === "sc" && !rules.raceControl.safetyCar) flag(event, "SC");
    if (event.type === "pass" && event.drs && !rules.drs.enabled) flag(event, "DRS");
    if (event.type === "pass" && event.drs && event.lap < rules.drs.fromLap) flag(event, "DRS lap");
    if (event.type === "pass" && event.overtakeMode && !rules.energy.overtakeMode) flag(event, "overtake mode");
    if (event.type === "pit" && event.refuel !== undefined && !rules.refuelling) flag(event, "refuelling");
    if (event.type === "pit" && rules.refuelling && !(event.refuel > 0)) flag(event, "no fuel in a refuelling stop");
    // 2005 (no tyre changes): a punctured or damaged tyre could still be replaced (RF-SIM-09 repair stops).
    if (event.type === "pit" && rules.tyres.changesInRace === false && event.tyres !== false && !event.repair && dry) flag(event, "tyre change");
    if (event.type === "penalty" && !rules.raceControl.penaltyTypes.includes(event.penalty)) flag(event, "penalty type");
    if (event.type === "restart" && event.procedure !== rules.raceControl.redFlag.restart && !(event.procedure === "standing" && !rules.raceControl.safetyCar)) flag(event, "restart");
    if (event.type === "grid-penalty" && !rules.unitPenalties) flag(event, "grid penalty");
    if (/fatal|death|killed/i.test(JSON.stringify(event))) flag(event, "RF-HIS-00");
  });
  (state.duels || []).forEach((duel) => {
    if (duel.drs && !rules.drs.enabled) flag(duel, "DRS duel");
  });
  state.cars.forEach((car) => {
    if (rules.energy.system === "none" && car.battery !== null) flag({ carId: car.id }, "battery");
    if (car.ersMode === "overtake" && !rules.energy.overtakeMode) flag({ carId: car.id }, "overtake mode");
    if (car.penalty === raceBalance.strategy.twoCompoundPenalty && rules.tyres.mandatoryDryCompounds < 2) flag({ carId: car.id }, "two-compound rule");
    if (!rules.tyres.changesInRace && dry && new Set(car.compoundsUsed).size > 1) flag({ carId: car.id, used: car.compoundsUsed }, "2005 one set");
    // The two-compound rule (from 2007): a dry finisher used two dry compounds or paid for it.
    if (rules.tyres.mandatoryDryCompounds >= 2 && dry && car.status === "finished" && new Set(car.compoundsUsed).size < 2 && !(car.penalty >= raceBalance.strategy.twoCompoundPenalty)) {
      flag({ carId: car.id, used: car.compoundsUsed }, "two compounds");
    }
  });
  return wrong;
};

/** Race control turned up (as rules.test.js does for the quick mode). */
const hot = (fn) => {
  const { offences } = raceBalance.penalties;
  const saved = JSON.parse(JSON.stringify({ offences, red: raceBalance.raceControl.redFlag }));
  offences.jumpStart.chancePerCar = 0.3;
  offences.collision.investigate = 1;
  offences.collision.guilty = 1;
  offences.pitSpeeding.chancePerStop = 0.2;
  offences.unsafeRelease.chancePerStop = 0.2;
  raceBalance.raceControl.redFlag.crashChance = 0.6;
  try {
    return fn();
  } finally {
    Object.keys(saved.offences).forEach((key) => Object.assign(offences[key], saved.offences[key]));
    Object.assign(raceBalance.raceControl.redFlag, saved.red);
  }
};

describe("criterio 7.2 · whole step races produce only era-legal events (sweep)", () => {
  it.each(SWEEP)("%i", (year) => {
    ["a", "b"].forEach((seed) => {
      const state = runStepToFinish(startStep(year, `step-sweep-${year}-${seed}`));
      expect(state.finished).toBe(true);
      expect(classificationOf(state)).toHaveLength(state.cars.length);
      expect(illegalEvents(state)).toEqual([]);
    });
  });

  it("stays era-legal with race control turned up, and plays every part of it", () => {
    const seen = { red: new Set(), restart: {}, pitPenalty: 0, yellow: 0, investigation: 0, timeYears: [], postYears: [], owed: [], lanes: [] };
    hot(() =>
      SWEEP.forEach((year) => {
        const state = runStepToFinish(startStep(year, `step-hot-${year}`));
        expect(state.finished).toBe(true);
        expect(illegalEvents(state)).toEqual([]);
        state.events.forEach((event) => {
          if (event.type === "red") seen.red.add(year);
          if (event.type === "restart") seen.restart[year] = event.procedure;
          if (event.type === "yellow") seen.yellow += 1;
          if (event.type === "investigation") seen.investigation += 1;
          if (event.type === "penalty" && (event.penalty === "time5" || event.penalty === "time10")) seen.timeYears.push(year);
          if (event.type === "penalty" && event.penalty === "postRaceTime") seen.postYears.push(year);
        });
        // Drive-throughs and stop-gos are driven through the pit lane: a pit entry with the penalty on it.
        state.cars.forEach((car) =>
          car.history
            .filter((entry) => entry.pit && entry.pit.penalty)
            .forEach((entry) => {
              seen.pitPenalty += 1;
              seen.lanes.push({ penalty: entry.pit.penalty, longLap: entry.end - entry.start > state.race.baseLap * 0.9 });
            }),
        );
        // Penalties still owed at the flag reach the classification.
        state.cars.filter((car) => car.status === "finished").forEach((car) => {
          const owed = car.penalties.filter((penalty) => penalty.atFlag).reduce((sum, penalty) => sum + (penalty.seconds || 0), 0);
          seen.owed.push(owed === 0 || car.penalty >= owed);
        });
      }),
    );
    seen.timeYears.forEach((year) => expect(year).toBeGreaterThanOrEqual(2014));
    seen.postYears.forEach((year) => expect(year).toBeLessThan(2014));
    expect(seen.owed.every(Boolean)).toBe(true);
    seen.lanes.forEach((lane) => expect(lane).toEqual({ penalty: expect.stringMatching(/^(driveThrough|stopGo)$/), longLap: true }));
    expect(seen.red.size).toBeGreaterThan(0);
    expect(seen.pitPenalty).toBeGreaterThan(0);
    expect(seen.yellow).toBeGreaterThan(0);
    expect(seen.investigation).toBeGreaterThan(0);
  });

  it("is byte-identical with race control turned up (RF-SIM-15, RNF-05)", () => {
    const run = () => hot(() => JSON.stringify(toRaceState(runStepToFinish(startStep(2015, "step-hot-same")))));
    expect(run()).toBe(run());
  });
});

describe("RF-SIM-04 / RF-SIM-05 / RF-SIM-08 · era coherence in the step sim", () => {
  it("2005: fuel-only stops on one set of tyres; 2008: refuelling with tyre changes; 2012: no refuelling, two compounds", () => {
    const s2005 = runStepToFinish(startStep(2005, "step-2005"));
    const pits05 = s2005.events.filter((event) => event.type === "pit");
    expect(pits05.length).toBeGreaterThan(0);
    pits05.forEach((event) => expect(event.refuel).toBeGreaterThan(0));
    const dry05 = s2005.weather.wetness.every((value) => value < 0.2);
    // A repair stop may change a damaged car's tyres (race.js pitStopTime: 2005 allowed it for damage).
    expect(pits05.filter((event) => dry05 && event.tyres !== false && !event.repair)).toEqual([]);

    const s2008 = runStepToFinish(startStep(2008, "step-2008"));
    const pits08 = s2008.events.filter((event) => event.type === "pit");
    expect(pits08.length).toBeGreaterThan(0);
    pits08.forEach((event) => {
      expect(event.refuel).toBeGreaterThan(0);
      expect(event.tyres).toBeUndefined();
    });

    const s2012 = runStepToFinish(startStep(2012, "step-2012"));
    s2012.events.filter((event) => event.type === "pit").forEach((event) => expect(event.refuel).toBeUndefined());
    expect(s2012.duels.some((duel) => duel.drs)).toBe(true);
    expect(s2008.duels.some((duel) => duel.drs)).toBe(false);
  });

  it("2026: the overtake mode works within the era's gap of the car ahead and replaces DRS", () => {
    const passes = [];
    ["ot1", "ot2"].forEach((seed) => {
      const state = runStepToFinish(startStep(2026, `step-2026-${seed}`));
      expect(state.duels.some((duel) => duel.drs)).toBe(false);
      passes.push(...state.events.filter((event) => event.type === "pass"));
    });
    expect(passes.some((event) => event.overtakeMode)).toBe(true);
    // And never before 2026.
    const s2024 = runStepToFinish(startStep(2024, "step-2024-ot"));
    expect(s2024.events.some((event) => event.overtakeMode)).toBe(false);
  });

  it("KERS budget comes back every lap; no battery before 2009", () => {
    const s2012 = startStep(2012, "step-kers");
    stepFor(s2012, s2012.race.baseLap * 6);
    const kers = s2012.cars.filter((car) => car.battery !== null);
    expect(kers.length).toBeGreaterThan(0);
    const s1994 = startStep(1994, "step-1994");
    stepFor(s1994, 300);
    s1994.cars.forEach((car) => expect(car.battery).toBeNull());
  });
});

describe("RF-SIM-10 · race control on the track", () => {
  it("a local yellow slows the cars through that corner and stops duels for it, then clears", () => {
    const state = startStep(2024, "step-yellow");
    stepFor(state, 600);
    const sim = state._sim;
    const corner = sim.tables.attacks[0].corner;
    waveYellow(state, corner, state.cars[0].id, state.lap + 1);
    const duelsBefore = state.duels.length;
    // race.js marked the corner; the sim turns it into a timed local zone (at once after an incident, or on the next step).
    sim.raceControl();
    expect(state.events.some((event) => event.type === "yellow" && event.corner === corner)).toBe(true);
    expect(sim.yellows.map((zone) => zone.corner)).toContain(corner);
    expect(state.yellow).toBeNull();
    // Cars inside the zone lift.
    const zone = sim.yellows.find((item) => item.corner === corner);
    let slowed = 0;
    for (let k = 0; k < 400 && !slowed; k += 1) {
      stepOnce(state);
      for (let i = 0; i < sim.n; i += 1) if (sim.lapFlags[i] & 32) slowed += 1;
    }
    expect(slowed).toBeGreaterThan(0);
    expect(zone.until).toBeGreaterThan(0);
    stepFor(state, balance.raceControl.yellow.durationSec - 2);
    const during = state.duels.slice(duelsBefore).filter((duel) => duel.corner === corner && sim.yellows.some((zone) => zone.corner === corner));
    expect(during).toHaveLength(0);
    stepFor(state, balance.raceControl.yellow.durationSec + 5);
    expect(sim.yellows.some((zone) => zone.corner === corner)).toBe(false);
  });

  it("serves a drive-through physically in the pit lane", () => {
    const state = startStep(2012, "step-dt");
    stepFor(state, 900);
    // A penalty is never served behind the safety car (race.js duePitPenalty): give it with the track green.
    for (let k = 0; k < 3600 && state.safetyCar && !state.finished; k += 1) stepFor(state, 1);
    const car = state.cars.find((entry) => entry.status === "running" && entry.position > 3);
    car.penalties.push({ type: "driveThrough", offence: "collision", lap: state.lap, kind: "pit", seconds: 0, served: false });
    const laps = car.history.length;
    stepFor(state, state.race.baseLap * 2.5);
    const served = state.events.find((event) => event.type === "penalty-served" && event.carId === car.id);
    expect(served).toBeTruthy();
    const entry = car.history.slice(laps).find((item) => item.pit && item.pit.penalty === "driveThrough");
    expect(entry).toBeTruthy();
    expect(entry.pit.lane).toBeCloseTo(pitLaneLoss(state, null, { through: true }), 6);
    expect(car.penalties[car.penalties.length - 1].served).toBe(true);
  });

  it.each([
    [1976, "standing", true],
    [2010, "rolling", false],
    [2024, "standing", false],
  ])("a red flag in %i restarts %s (aggregate %s) by the era's procedure", (year, procedure, aggregate) => {
    const state = startStep(year, `step-red-${year}`);
    stepFor(state, state.race.baseLap * 8);
    state.pendingRed = "crash";
    stepOnce(state);
    expect(state.events.some((event) => event.type === "red")).toBe(true);
    let guard = 0;
    while (!state.events.some((event) => event.type === "restart") && guard < 4000) {
      stepOnce(state);
      guard += 1;
    }
    const restart = state.events.find((event) => event.type === "restart");
    expect(restart).toMatchObject({ procedure, aggregate });
    // A rolling restart is behind the safety car; a standing one restarts the DRS count.
    expect(procedure === "rolling" ? Boolean(state.safetyCar && !state.safetyCar.virtual) : state.restartLap > 0).toBe(true);
    // Lined up (not in aggregate eras): the first cars on the leader's lap a grid slot or so apart.
    const sim = state._sim;
    const lead = state.cars.map((car, i) => i).filter((i) => sim.active[i] && !sim.inPit[i] && sim.laps[i] >= state.lap - 1).sort((x, y) => sim.P[y] - sim.P[x]);
    const gaps = lead.slice(1, 6).map((i, k) => (sim.P[lead[k]] - sim.P[i]) * sim.tables.length);
    expect(aggregate || gaps.every((gap) => gap < 60)).toBe(true);
    runStepToFinish(state);
    expect(state.finished).toBe(true);
    expect(illegalEvents(state)).toEqual([]);
  });
});
