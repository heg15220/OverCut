/**
 * WP6 "pit lane físico" (docs/manager/SIM-FISICA.md §3.8, §4.3, §4.4): RF-SIM-12, RF-SIM-10,
 * SRS §6.2 (pit-lane speed limit by era and circuit), SRS §4.2 (both modes pay the same),
 * RNF-05 (determinism), RNF-07 (tunables in data/balance/race-pit.json with a schema).
 *
 *   - the limit by era, date and circuit, from era-defaults and from the packs;
 *   - the loss on Monza, Bahrain, Hungaroring and Suzuka within 1 s of the real one (2025);
 *   - a step race: v = 0 for the whole stop, in the car's own box; nobody over vLimit in the
 *     limited zone except a car late on its limiter (and that one is investigated with cause);
 *     the time in the lane is the profile's, as the quick mode charges it;
 *   - speeding and unsafe release judged only in the eras that had them;
 *   - same seed, same race, byte for byte.
 */

import Ajv from "ajv";
import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { eraProfileFor } from "../../../overcutTrayectoria/engine/eras";
import { reference } from "../../data/reference";
import pitBalance from "../../data/balance/race-pit.json";
import pitSchema from "../../data/balance/race-pit.schema.json";
import { createCareer, createContext, currentRace, entrantsFor, runPractice, runQualifyingSession, seasonWorld } from "../career";
import { createRace, pitLaneLoss, runToFinish } from "../race";
import { pitLaneSpeedFor, rulesFor } from "../rules";
import { eraWithRegulations } from "../packs/packWorld";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import { circuitFor } from "../venue";
import { PHASE, PIT_LANE_BALANCE, laneGeometry, pitLaneFor, pitLossFor } from "./pitLane";
import { stopEraFor } from "./pitStop";
import { fromQuickRace, runStepToFinish, stepOnce, toRaceState } from "./index";

const FIELDED = [1976, 1988, 1998, 2005, 2008, 2012, 2016, 2024];
let context = null;
let packs = {};
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

/** A fielded weekend raced under `year`'s rules (stepEras.test.js startStep), quick mode. */
const quickRace = (year, seed) => {
  const base = FIELDED.reduce((best, candidate) => (Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best), FIELDED[0]);
  const world = seasonWorld(context, base, seed);
  const teamId = world.order.find((id) => !world.teams[id].partial);
  const career = createCareer(context, { year: base, teamId, seed, mode: "free" });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const race = currentRace(career);
  const entrants = entrantsFor(career);
  const grid = career.weekend.qualifying.order.filter((id) => entrants.some((entrant) => entrant.id === id));
  const era = packs[year] ? eraWithRegulations(year, packs[year].regulations) : eraProfileFor(year);
  return { race, state: createRace({ race, era, year, entrants, grid, seed }) };
};

const stepRace = (year, seed) => {
  const { race, state } = quickRace(year, seed);
  return fromQuickRace(state, { race });
};

/** Run a step race to the flag, watching every car in the lane at every step. */
const watch = (state) => {
  const sim = state._sim;
  const seen = { stops: 0, stoppedSteps: 0, movingInStop: 0, overLimit: [], wrongBox: 0, passes: [] };
  const open = {};
  while (!state.finished) {
    stepOnce(state);
    const cars = sim.lane.cars;
    for (let i = 0; i < sim.n; i += 1) {
      const inLane = sim.inPit[i] !== 0 && cars.prof[i];
      if (inLane && !open[i]) open[i] = { entered: cars.enteredAt[i], stopFor: cars.stopFor[i], stop: cars.prof[i].tStop >= 0, over: Boolean(cars.over[i]), id: state.cars[i].id };
      if (!inLane && open[i]) {
        const pass = open[i];
        pass.left = sim.clock;
        pass.stopFor = pass.stopFor0 ?? pass.stopFor;
        seen.passes.push(pass);
        open[i] = null;
        continue;
      }
      if (!inLane) continue;
      open[i].stopFor0 = cars.stopFor[i];
      const phase = cars.phase[i];
      if (phase === PHASE.STATIONARY || phase === PHASE.QUEUE) {
        seen.stoppedSteps += 1;
        if (cars.v[i] !== 0) seen.movingInStop += 1;
        if (Math.abs(cars.s[i] - cars.boxS[i]) > 1e-9) seen.wrongBox += 1;
      }
      const geo = sim.lane.geo;
      if (cars.s[i] >= geo.limitFromS && cars.s[i] <= geo.limitToS && cars.v[i] > sim.lane.vLimit + 1e-9) seen.overLimit.push({ id: state.cars[i].id, kmh: cars.v[i] * 3.6, late: Boolean(cars.over[i]) });
    }
  }
  seen.stops = seen.passes.filter((pass) => pass.stop).length;
  return seen;
};

describe("RNF-07 · race-pit.json", () => {
  it("matches its schema", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(pitSchema);
    expect(validate(pitBalance) || validate.errors).toBe(true);
  });
});

describe("SRS 6.2 · pit-lane speed limit by era, date and circuit", () => {
  it("reads era-defaults: none before Monaco 1994, 80, 100 from 2004, 80 from Hungary 2013, 60 at the narrow lanes", () => {
    expect(pitLaneSpeedFor(1990, { circuitId: "monza" })).toBeNull();
    expect(pitLaneSpeedFor(1994, { circuitId: "imola", date: "1994-05-01" })).toBeNull();
    expect(pitLaneSpeedFor(1994, { circuitId: "monaco", date: "1994-05-15" })).toBe(80);
    expect(pitLaneSpeedFor(2000, { circuitId: "monza" })).toBe(80);
    expect(pitLaneSpeedFor(2005, { circuitId: "monaco" })).toBe(100);
    expect(pitLaneSpeedFor(2012, { circuitId: "monaco" })).toBe(60);
    expect(pitLaneSpeedFor(2012, { circuitId: "monza" })).toBe(100);
    expect(pitLaneSpeedFor(2013, { circuitId: "bahrain", date: "2013-04-21" })).toBe(100);
    expect(pitLaneSpeedFor(2013, { circuitId: "hungaroring", date: "2013-07-28" })).toBe(80);
    expect(pitLaneSpeedFor(2013, { circuitId: "monza", date: "2013-09-08" })).toBe(80);
    expect(pitLaneSpeedFor(2018, { circuitId: "marina-bay" })).toBe(60);
    expect(pitLaneSpeedFor(2024, { circuitId: "melbourne" })).toBe(80);
    expect(pitLaneSpeedFor(2025, { circuitId: "marina-bay" })).toBe(80);
    expect(pitLaneSpeedFor(2025, { circuitId: "monaco" })).toBe(60);
  });

  it("every season pack carries it (regulations.pitLaneSpeed, with provenance) and the rules read it from the pack", () => {
    Object.values(packs).forEach((pack) => {
      expect(Array.isArray(pack.regulations.pitLaneSpeed)).toBe(true);
      expect(pack.regulationsProvenance.pitLaneSpeed).toBeTruthy();
      const rules = rulesFor(eraWithRegulations(pack.year, pack.regulations));
      expect(rules.pitLaneSpeed).toEqual(pack.regulations.pitLaneSpeed);
      pack.calendar.forEach((event) => {
        const kmh = pitLaneSpeedFor(rules, { circuitId: event.circuitId, date: event.date });
        expect(kmh).toBe(pitLaneSpeedFor(pack.year, { circuitId: event.circuitId, date: event.date }));
        const allowed = pack.year < 1994 ? [null] : pack.year === 1994 ? [null, 80] : [60, 80, 100];
        expect(allowed).toContain(kmh);
      });
    });
  });

  it("a slower limit costs more, and no limit costs least", () => {
    const circuit = circuitFor({ layoutId: "monza-7" }, 2024);
    const loss = (kmh) => pitLossFor(circuit, { kmh, baseLap: 84 });
    expect(loss(60)).toBeGreaterThan(loss(80));
    expect(loss(80)).toBeGreaterThan(loss(100));
    expect(loss(100)).toBeGreaterThan(loss(null));
  });
});

describe("RF-SIM-12 · the loss against the real one (SIM-FISICA §4.3)", () => {
  it("Monza, Bahrain, Hungaroring and Suzuka within 1 s of the 2025 loss (lane + median stop)", () => {
    const rows = pitBalance.pitLane.calibration.map((cal) => {
      const circuit = circuitFor({ layoutId: cal.layoutId }, cal.year);
      const kmh = pitLaneSpeedFor(cal.year, { circuitId: cal.circuit });
      // The engine's race pace: the winner's average lap × 0.985, as packWorld builds baseLap.
      const lane = pitLaneFor(circuit, { kmh, baseLap: cal.winnerAvgLap * 0.985, circuitId: cal.circuit });
      const sim = lane.stop + stopEraFor(cal.year).target.median;
      return { circuit: cal.circuit, kmh, lane: lane.lane, track: lane.track, sim, real: cal.realLoss, marks: laneGeometry(circuit).marks };
    });
    // eslint-disable-next-line no-console
    console.log(rows.map((r) => `${r.circuit} ${r.kmh} km/h (${r.marks}): lane ${r.lane.toFixed(2)} s, track ${r.track.toFixed(2)} s, loss sim ${r.sim.toFixed(2)} / real ${r.real}`).join("\n"));
    expect(rows).toHaveLength(4);
    rows.forEach((row) => expect(Math.abs(row.sim - row.real)).toBeLessThanOrEqual(1));
  });

  it("the quick mode charges the lane's loss (state.pitLane), less under SC and VSC, and a drive-through less than a stop", () => {
    const { state } = quickRace(2024, "lane-quick");
    const lane = state.pitLane;
    expect(lane.kmh).toBe(80);
    expect(pitLaneLoss(state)).toBe(lane.stop);
    expect(pitLaneLoss(state, { virtual: false })).toBeLessThan(lane.stop);
    expect(pitLaneLoss(state, { virtual: true })).toBeLessThan(lane.stop);
    expect(pitLaneLoss(state, { virtual: true })).toBeGreaterThan(pitLaneLoss(state, { virtual: false }));
    expect(pitLaneLoss(state, null, { through: true })).toBeLessThan(lane.stop);
    const done = runToFinish(state);
    const stops = done.cars.flatMap((car) => car.history.filter((entry) => entry.pit && !entry.pit.penalty));
    expect(stops.length).toBeGreaterThan(5);
    stops.forEach((entry) => expect([lane.stop, lane.sc, lane.vsc]).toContain(entry.pit.lane));
  });
});

describe("RF-SIM-12 · the step race drives the lane", () => {
  let seen;
  let state;
  beforeAll(() => {
    state = stepRace(2024, "lane-step");
    seen = watch(state);
  });

  it("stops for real: v = 0 for the whole stop, at its own box", () => {
    expect(seen.stops).toBeGreaterThan(5);
    expect(seen.stoppedSteps).toBeGreaterThan(seen.stops * 4);
    expect(seen.movingInStop).toBe(0);
    expect(seen.wrongBox).toBe(0);
  });

  it("nobody over vLimit in the limited zone, unless late on the limiter", () => {
    seen.overLimit.forEach((over) => expect(over.late).toBe(true));
  });

  it("the time in the lane is the profile's: drive time + the stop (SRS 4.2: what the quick mode charges)", () => {
    const sim = state._sim;
    const lane = sim.lane;
    seen.passes.filter((pass) => pass.stop).forEach((pass) => {
      const inLane = pass.left - pass.entered - pass.stopFor;
      // The middle box of pitLaneFor against this team's box, within a step either way.
      expect(Math.abs(inLane - pitLaneFor(lane.circuit, { kmh: lane.kmh, baseLap: lane.baseLap }).lane)).toBeLessThan(1.0);
    });
  });

  it("is byte-identical with the same seed (RNF-05)", () => {
    const again = stepRace(2024, "lane-step");
    runStepToFinish(again);
    expect(JSON.stringify(toRaceState(again))).toBe(JSON.stringify(toRaceState(state)));
  });
});

describe("RF-SIM-10 · pit-lane offences with their cause, only in their eras", () => {
  const withBalance = (patch, fn) => {
    const saved = JSON.parse(JSON.stringify({ speeding: PIT_LANE_BALANCE.speeding, unsafeRelease: PIT_LANE_BALANCE.unsafeRelease }));
    patch(PIT_LANE_BALANCE);
    try {
      return fn();
    } finally {
      Object.assign(PIT_LANE_BALANCE.speeding, saved.speeding);
      Object.assign(PIT_LANE_BALANCE.unsafeRelease, saved.unsafeRelease);
    }
  };

  it("speeding: a car late on its limiter is over the limit and investigated (from 1994); never before there was a limit", () => {
    withBalance((b) => (b.speeding.chancePerPass = 1), () => {
      const modern = stepRace(2024, "speeding");
      const seen = watch(modern);
      const cases = modern.events.filter((event) => event.type === "investigation" && event.offence === "pitSpeeding");
      expect(cases.length).toBeGreaterThan(0);
      cases.forEach((item) => {
        expect(item.cause.limit).toBe(80);
        expect(item.cause.kmh).toBeGreaterThan(80);
      });
      expect(seen.overLimit.length).toBeGreaterThan(0);
      const old = stepRace(1988, "speeding");
      runStepToFinish(old);
      expect(old.events.filter((event) => event.type === "investigation" && event.offence === "pitSpeeding")).toHaveLength(0);
    });
  });

  it("unsafe release: released into a car in the fast lane is investigated (from 2011); not before", () => {
    withBalance((b) => {
      b.unsafeRelease.crewMissChance = 1;
      b.unsafeRelease.gapMetres = 400;
    }, () => {
      const modern = stepRace(2024, "release");
      runStepToFinish(modern);
      const cases = modern.events.filter((event) => event.type === "investigation" && event.offence === "unsafeRelease");
      expect(cases.length).toBeGreaterThan(0);
      cases.forEach((event) => expect(event.cause.metres).toBe(400));
      const old = stepRace(2008, "release");
      runStepToFinish(old);
      expect(old.events.filter((event) => event.type === "investigation" && event.offence === "unsafeRelease")).toHaveLength(0);
    });
  });
});
