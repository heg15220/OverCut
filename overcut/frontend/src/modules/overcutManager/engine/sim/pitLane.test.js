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
import { createRace, pitLaneLoss, runToFinish, stepLap } from "../race";
import { pitLaneSpeedFor, rulesFor } from "../rules";
import { eraWithRegulations } from "../packs/packWorld";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import { circuitFor } from "../venue";
import bahrain2024 from "./__fixtures__/pit-bahrain-2024.json";
import raceErasBalance from "../../data/balance/race-eras.json";
import splinesData from "../../data/splines.json";
import { trackDataFor } from "../trackData";
import {
  PHASE,
  PIT_LANE_BALANCE,
  garageExitAt,
  garageExitProfile,
  laneGeometry,
  pitExitLateral,
  pitExitStep,
  pitLaneFor,
  pitLineOffence,
  pitLineOffenceInForce,
  pitLinesFor,
  pitLossFor,
  previewPit,
} from "./pitLane";
import { expectedStationary, stopEraFor } from "./pitStop";
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

/**
 * PIT-1 (docs/manager/F1M24-GAMEPLAY.md §1.7, §3.3: prevision-parada, part of salida-boxes-sesion):
 * RF-CMD-02, RF-SIM-12, RF-SIM-13, RF-WKD-02, RF-SIM-15 / RNF-05 (no draws), SRS §6.2 (limit by era).
 */
describe("PIT-1 · previewPit: what a stop costs now (RF-CMD-02, RF-SIM-12)", () => {
  it("Bahrain 2024: the net loss within 1 s of the real one, and below f1db's line-to-line lane time (what that column measures)", () => {
    const { race, state } = quickRace(2024, "preview-bahrain");
    expect(race.packCircuitId).toBe(bahrain2024.race.circuit);
    // The race pace is f1db's: the winner's average lap × 0.985 (packWorld baseLap).
    expect(Math.abs(race.baseLap - bahrain2024.f1db.winnerAvgLap * 0.985)).toBeLessThan(0.1);
    const rules = rulesFor(eraWithRegulations(2024, packs[2024].regulations));
    state.cars.forEach((car) => {
      const preview = previewPit(state, car.id, { circuit: circuitFor(race, 2024) });
      expect(preview.measures).toBe("net");
      expect(preview.laneGreen).toBe(state.pitLane.stop);
      expect(preview.stopMedian).toBeCloseTo(expectedStationary({ rules, crew: car.crew, errors: false }), 12);
      expect(preview.stopMedian).toBeLessThan(expectedStationary({ rules, crew: car.crew }));
      expect(preview.queueSec).toBe(0);
      expect(preview.lossGreen).toBeCloseTo(state.pitLane.stop + preview.stopMedian, 12);
      expect(Math.abs(preview.lossGreen - bahrain2024.openf1.lossMedian)).toBeLessThanOrEqual(bahrain2024.toleranceSec);
      expect(preview.lossGreen).toBeLessThan(bahrain2024.f1db.pitLaneMedian);
      // Under SC and VSC the track stretch is slower, so the stop costs less (derived, §2.11).
      expect(preview.lossSc).toBeLessThan(preview.lossVsc);
      expect(preview.lossVsc).toBeLessThan(preview.lossGreen);
      expect(preview.scAllowed && preview.vscAllowed).toBe(true);
      expect(preview.refuelLaps).toBe(0);
    });
  });

  it("asks without drawing or writing (RF-SIM-15): the state is untouched and the race ends byte for byte the same", () => {
    const seed = "preview-pure";
    const { race, state: asked } = quickRace(2024, seed);
    const plain = quickRace(2024, seed).state;
    const circuit = circuitFor(race, 2024);
    for (let lap = 0; lap < 20 && !asked.finished; lap += 1) {
      const before = JSON.stringify(asked);
      asked.cars.forEach((car) => previewPit(asked, car.id, { circuit }));
      expect(JSON.stringify(asked)).toBe(before);
      // Not even the crew's stream is created by asking (race.js crewStream is lazy).
      expect("_crew" in asked).toBe("_crew" in plain);
      stepLap(asked);
      stepLap(plain);
    }
    runToFinish(asked);
    runToFinish(plain);
    expect(JSON.stringify(asked)).toBe(JSON.stringify(plain));
  });

  it("exitPos: rivals still ahead after the loss, a rival stopping the same lap pays its own; never above the current place", () => {
    const { state } = quickRace(2024, "preview-exit");
    for (let k = 0; k < 10; k += 1) stepLap(state);
    const order = [...state.cars].filter((car) => car.status === "running").sort((a, b) => a.time - b.time);
    const lap = state.lap + 1;
    const stopping = (car) => car.plan.stops.includes(lap);
    order.forEach((car, place) => {
      const preview = previewPit(state, car.id);
      const after = car.time + preview.lossGreen;
      const ahead = order.filter((other) => other.id !== car.id && other.time + (stopping(other) ? previewPit(state, other.id).lossGreen - previewPit(state, other.id).queueSec : 0) < after).length;
      expect(preview.exitPos).toBe(1 + ahead);
      expect(preview.exitPos).toBeGreaterThanOrEqual(place + 1 - order.slice(0, place).filter(stopping).length);
    });
  });

  it("double stack: the team-mate ahead stopping on the same lap makes this car wait for its stop", () => {
    const { state } = quickRace(2024, "preview-stack");
    stepLap(state);
    const order = [...state.cars].sort((a, b) => a.time - b.time);
    const car = order.find((entry) => order.some((other) => other.teamId === entry.teamId && other.time < entry.time));
    const mate = order.find((other) => other.teamId === car.teamId && other.id !== car.id);
    let lap = state.lap + 5;
    while (mate.plan.stops.includes(lap) || car.plan.stops.includes(lap)) lap += 1;
    const alone = previewPit(state, car.id, { lap });
    mate.plan = { ...mate.plan, stops: [...mate.plan.stops, lap].sort((a, b) => a - b) };
    const stacked = previewPit(state, car.id, { lap });
    expect(alone.teamMateSameLap).toBe(false);
    expect(stacked.teamMateSameLap).toBe(true);
    expect(stacked.queueSec).toBeCloseTo(expectedStationary({ rules: rulesFor(state.era), crew: mate.crew, errors: false }), 12);
    expect(stacked.lossGreen).toBeCloseTo(alone.lossGreen + stacked.queueSec, 12);
    // The team-mate itself does not queue behind a car that is behind it.
    const front = previewPit(state, mate.id, { lap });
    expect(front.queueSec).toBe(0);
  });

  it("refuelling era (2008): the fuel load sits in the stop; none in 2024 (SRS §6.2)", () => {
    const { state } = quickRace(2008, "preview-fuel");
    const car = state.cars[0];
    const preview = previewPit(state, car.id);
    expect(preview.refuelLaps).toBeGreaterThan(0);
    const dry = expectedStationary({ rules: rulesFor(state.era), crew: car.crew, errors: false });
    expect(preview.stopMedian).toBeGreaterThanOrEqual(dry);
    expect(preview.vscAllowed).toBe(false);
  });

  it("distance to the lane's entry: from the line in the quick mode, from the car in the step mode; null without a circuit", () => {
    const { race, state } = quickRace(2024, "preview-distance");
    const circuit = circuitFor(race, 2024);
    const geo = laneGeometry(circuit);
    const atLine = previewPit(state, state.cars[0].id, { circuit });
    expect(atLine.distanceToPitEntry).toBeCloseTo(geo.entry * circuit.km * 1000, 6);
    expect(previewPit(state, state.cars[0].id).distanceToPitEntry).toBeNull();
    const step = stepRace(2024, "preview-distance");
    for (let k = 0; k < 400; k += 1) stepOnce(step);
    const sim = step._sim;
    const tau = Float64Array.from(sim.tau);
    step.cars.forEach((car) => {
      const preview = previewPit(step, car.id);
      expect(preview.distanceToPitEntry).toBeGreaterThanOrEqual(0);
      expect(preview.distanceToPitEntry).toBeLessThan(circuit.km * 1000);
    });
    expect(Array.from(sim.tau)).toEqual(Array.from(tau));
  });

  it("is defensive: an unknown car is null; a state without its lane loss gives null losses (no invented numbers)", () => {
    const { state } = quickRace(2024, "preview-defensive");
    expect(previewPit(state, "nobody")).toBeNull();
    const bare = { ...state, pitLane: null };
    const preview = previewPit(bare, state.cars[0].id);
    expect(preview.lossGreen).toBeNull();
    expect(preview.exitPos).toBeNull();
    expect(preview.stopMedian).toBeGreaterThan(0);
  });
});

describe("PIT-1 · garageExitProfile: from the box out of the lane (RF-WKD-02, RF-SIM-12, SRS §6.2)", () => {
  const circuit = () => circuitFor({ layoutId: "bahrain-1", packCircuitId: "bahrain" }, 2024);

  // PIT-2 changed the end on purpose: with the white exit line known (pitLinesFor) the drive goes on
  // along the track's pit-side edge to exitLineTo, as this function's contract always said.
  it("starts at rest at the team's box, keeps to the limit in the zone, ends at the end of the white exit line", () => {
    const c = circuit();
    const geo = laneGeometry(c);
    const lines = pitLinesFor(c);
    const exit = garageExitProfile(c, 2024, { slot: 3, slots: 10 }, { circuitId: "bahrain" });
    expect(exit.kmh).toBe(80);
    expect(exit.marks).toBe("exitLine");
    expect(exit.v[0]).toBe(0);
    expect(exit.laneEndS).toBeCloseTo(geo.total, 0);
    expect(Math.abs(exit.toS - (geo.total + lines.exit.pastLaneEnd))).toBeLessThanOrEqual(exit.step);
    expect(exit.toLaneEnd).toBeLessThan(exit.T);
    const overLimit = [];
    const notIncreasing = [];
    for (let k = 0; k <= exit.N; k += 1) {
      const s = exit.s0 + k * exit.step;
      if (s >= geo.limitFromS && s <= geo.limitToS && exit.v[k] > exit.vLimit + 1e-9) overLimit.push(k);
      if (k > 0 && !(exit.t[k] > exit.t[k - 1])) notIncreasing.push(k);
    }
    expect(overLimit).toEqual([]);
    expect(notIncreasing).toEqual([]);
    expect(exit.toLimitEnd).toBeGreaterThan(0);
    expect(exit.toLimitEnd).toBeLessThan(exit.T);
    // Sampling it walks the lane from the box to the end.
    expect(garageExitAt(exit, 0).s).toBeCloseTo(exit.s0, 9);
    const end = garageExitAt(exit, exit.T + 1);
    expect(end.s).toBeCloseTo(exit.toS, 9);
    expect(end.v).toBe(exit.v[exit.N]);
    expect(end.done).toBe(true);
    // Past the lane's end it is on the track, on lane PIT_EXIT, and ends at exitLineTo.
    expect(end.onTrack).toBe(true);
    expect(end.lane).toBe("PIT_EXIT");
    expect(Math.abs(end.share - lines.exit.toShare) * lines.lapMetres).toBeLessThanOrEqual(exit.step);
    expect(garageExitAt(exit, exit.toLaneEnd / 2).onTrack).toBe(false);
  });

  it("a garage nearer the exit is out sooner; no limit before 1994 is faster than 80 km/h", () => {
    const c = circuit();
    const early = garageExitProfile(c, 2024, 0, { circuitId: "bahrain" });
    const late = garageExitProfile(c, 2024, 1, { circuitId: "bahrain" });
    expect(late.fromS).toBeGreaterThan(early.fromS);
    expect(late.T).toBeLessThan(early.T);
    const old = garageExitProfile(c, 1990, 0, { circuitId: "bahrain" });
    expect(old.kmh).toBeNull();
    expect(old.T).toBeLessThan(early.T);
  });

  it("is pure and the same every time (RNF-05)", () => {
    const a = garageExitProfile(circuit(), 2024, 0.5, { circuitId: "bahrain" });
    const b = garageExitProfile(circuit(), 2024, 0.5, { circuitId: "bahrain" });
    expect(Array.from(a.v)).toEqual(Array.from(b.v));
    expect(a.T).toBe(b.T);
    expect(garageExitProfile({ pit: null }, 2024)).toBeNull();
  });
});

describe("PIT-2 · the white lines and the merge out of the pit lane (RF-SIM-12, RF-SIM-10, RF-SIM-07, RF-3D-04)", () => {
  const KMH = 1 / 3.6;
  const DT = 0.25;
  const frac = (x) => x - Math.floor(x);
  const bahrain = () => circuitFor({ layoutId: "bahrain-1", packCircuitId: "bahrain" }, 2024);
  const indexAt = (c, share) => {
    const shares = c.distShare;
    let lo = 0;
    let hi = shares.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (shares[mid] <= share) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  /** The track's own speed at `share` (the trace), m/s. */
  const trackV = (c, share) => {
    const i = indexAt(c, frac(share));
    const n = c.speed.length;
    const span = c.distShare[i + 1] - c.distShare[i] || 1;
    const k = Math.min(1, Math.max(0, (frac(share) - c.distShare[i]) / span));
    return c.speed[i % n] + (c.speed[(i + 1) % n] - c.speed[i % n]) * k;
  };
  const accel = (v) => {
    const r = v / (PIT_LANE_BALANCE.accel.topKmh * KMH);
    return Math.max(0.5, PIT_LANE_BALANCE.accel.max * (1 - r * r));
  };
  const GAP = PIT_LANE_BALANCE.exitLine.mergeGapMetres;

  /**
   * A car leaves the lane where it meets the track and drives out at the traction limit (never
   * above the track's speed, nor above a yield cap). `rival(me, along)` may put a car on the track
   * (once) when the exiting car reaches `along` metres of the line. Every step is recorded.
   */
  const driveOut = (c, { rivalAt = null, rivalBehindMetres = 0 } = {}) => {
    const lines = pitLinesFor(c);
    const lap = lines.lapMetres;
    const data = trackDataFor(c);
    const me = { id: "out", share: lines.exit.fromShare, v: 80 * KMH, merged: false };
    let rival = null;
    const log = [];
    for (let step = 0; step < 600 && !me.merged; step += 1) {
      const along = frac(me.share - lines.exit.fromShare) * lap;
      if (rivalAt !== null && !rival && along >= rivalAt) {
        const share = frac(me.share - rivalBehindMetres / lap);
        rival = { id: "rival", share, v: trackV(c, share) };
      }
      const traffic = rival ? [rival] : [];
      const r = pitExitStep(c, me, traffic);
      const i = indexAt(c, frac(me.share)) % c.points.length;
      log.push({ ...r, share: me.share, along, line: data.line[i], rivalAhead: rival ? frac(rival.share - me.share) * lap : null });
      if (r.merged) {
        me.merged = true;
        break;
      }
      const cap = r.vCap === null ? Infinity : r.vCap;
      me.v = Math.min(trackV(c, me.share), me.v + accel(me.v) * DT, cap);
      me.share = frac(me.share + (me.v * DT) / lap);
      if (rival) {
        rival.v = trackV(c, rival.share);
        rival.share = frac(rival.share + (rival.v * DT) / lap);
      }
    }
    return { lines, log, me, lap };
  };

  it("marks exitLineTo past the lane's end and the entry line, from splines.json or the geometry (data, not code)", () => {
    const c = bahrain();
    const lines = pitLinesFor(c);
    expect(lines.source).toBe("derived");
    expect(lines.side === 1 || lines.side === -1).toBe(true);
    expect(lines.side).toBe(c.pit.side < 0 ? -1 : 1);
    // fromShare (lane meets the edge) → laneEndShare (the lane's last point) → toShare (exitLineTo).
    const lap = lines.lapMetres;
    expect(frac(lines.exit.laneEndShare - lines.exit.fromShare) * lap).toBeLessThan(lap / 2);
    expect(lines.exit.pastLaneEnd).toBeGreaterThanOrEqual(PIT_LANE_BALANCE.exitLine.minMetres);
    expect(lines.exit.pastLaneEnd).toBeLessThanOrEqual(PIT_LANE_BALANCE.exitLine.maxMetres);
    expect(lines.exit.metres).toBeGreaterThan(lines.exit.pastLaneEnd);
    expect(lines.entry.fromShare).toBeCloseTo(c.pit.entry, 9);
    expect(lines.entry.toLaneS).toBeGreaterThan(0);
    expect(lines.entry.toLaneS).toBeLessThan(laneGeometry(c).limitFromS + 1e-9);
    expect(pitLinesFor({ pit: null })).toBeNull();

    // A reviewed exitLineTo in data/splines.json wins over the geometry.
    const pit = splinesData.splines["bahrain-1"].pit;
    const copy = { ...c };
    pit.exitLineTo = frac(lines.exit.laneEndShare + 300 / lap);
    try {
      const reviewed = pitLinesFor(copy);
      expect(reviewed.source).toBe("spline");
      expect(reviewed.exit.pastLaneEnd).toBeCloseTo(300, 6);
    } finally {
      delete pit.exitLineTo;
    }
  });

  it("no car leaving the lane takes the racing line before exitLineTo: lane PIT_EXIT on the pit-side edge", () => {
    const c = bahrain();
    const { lines, log } = driveOut(c);
    const onLine = log.filter((r) => r.onLine);
    expect(onLine.length).toBeGreaterThan(2);
    const wrong = onLine.filter((r) => r.lane !== "PIT_EXIT" || r.merged || r.lateral !== pitExitLateral(c, r.share) || r.lateral * lines.side < r.line * lines.side - 1e-9);
    expect(wrong).toEqual([]);
    // Pinned to the measured pit-side edge, on the lane's side of the centreline.
    expect(onLine.every((r) => Math.sign(r.lateral) === lines.side)).toBe(true);
    // Nobody about: it takes the line the step it reaches exitLineTo, not before.
    const merge = log[log.length - 1];
    expect(merge.merged).toBe(true);
    expect(merge.lane).toBe("RACING");
    expect(merge.along).toBeGreaterThanOrEqual(lines.exit.metres);
    const lastOnLine = onLine[onLine.length - 1];
    expect(merge.along - lastOnLine.along).toBeLessThan(90 * DT + 1e-9);
  });

  it("yields when the car behind is closer than mergeGapMetres: lifts, lets it by, and slots in behind", () => {
    const c = bahrain();
    const { lines, log } = driveOut(c, { rivalAt: pitLinesFor(c).exit.metres, rivalBehindMetres: GAP / 2 });
    const afterLine = log.filter((r) => !r.onLine);
    const yielding = afterLine.filter((r) => !r.merged);
    expect(yielding.length).toBeGreaterThan(0);
    // While waiting: still PIT_EXIT on the edge, a speed cap, the car it yields to, the gap too small.
    const badYield = yielding.filter((r) => r.lane !== "PIT_EXIT" || r.yieldTo !== "rival" || !(r.vCap >= 0) || !(r.gapBehind < GAP) || r.lateral * lines.side <= 0);
    expect(badYield).toEqual([]);
    const merge = log[log.length - 1];
    expect(merge.merged).toBe(true);
    // It merges behind the car it let by, never in front of a car inside the gap.
    expect(merge.rivalAhead).toBeGreaterThan(0);
    expect(merge.rivalAhead).toBeLessThan(lines.lapMetres / 2);
    expect(merge.gapBehind === null || merge.gapBehind >= GAP).toBe(true);
  });

  it("merges at once, ahead, when the car behind is mergeGapMetres or more away", () => {
    const c = bahrain();
    const { lines, log } = driveOut(c, { rivalAt: pitLinesFor(c).exit.metres, rivalBehindMetres: GAP * 2.5 });
    const firstOff = log.find((r) => !r.onLine);
    expect(firstOff.merged).toBe(true);
    expect(firstOff.gapBehind).toBeGreaterThanOrEqual(GAP);
    expect(firstOff.rivalAhead).toBeGreaterThan(lines.lapMetres / 2); // the rival is behind
  });

  it("is pure (RNF-05): same inputs, same answer; a car already merged or a circuit without a lane is RACING", () => {
    const c = bahrain();
    const lines = pitLinesFor(c);
    const me = { id: "a", share: frac(lines.exit.toShare + 1 / lines.lapMetres), v: 50, merged: false };
    const traffic = [{ id: "b", share: frac(me.share - 10 / lines.lapMetres), v: 70 }];
    const a = pitExitStep(c, me, traffic);
    const b = pitExitStep(c, me, traffic);
    expect(a).toEqual(b);
    expect(a.yieldTo).toBe("b");
    expect(me).toEqual({ id: "a", share: me.share, v: 50, merged: false });
    expect(pitExitStep(c, { ...me, merged: true }, traffic).lane).toBe("RACING");
    expect(pitExitStep({ pit: null }, me, traffic).merged).toBe(true);
  });

  it("the line offences are in race-eras.json with their FIA article and years pending: nobody is judged, no number is drawn", () => {
    const { pitExitLine, pitEntryLine } = raceErasBalance.penalties.offences;
    [pitExitLine, pitEntryLine].forEach((spec) => {
      expect(spec.from).toBeNull();
      expect(spec.fromStatus).toBe("pending");
      expect(spec.penalties.length).toBeGreaterThan(0);
      expect(spec.$comment).toMatch(/Anexo L/);
    });
    let draws = 0;
    const stream = { next: () => { draws += 1; return 0; } };
    [1976, 1994, 2012, 2024, 2026].forEach((year) => {
      expect(pitLineOffenceInForce("pitExitLine", year)).toBe(false);
      expect(pitLineOffence(stream, {}, year, "pitExitLine")).toBe(false);
      expect(pitLineOffence(stream, {}, year, "pitEntryLine")).toBe(false);
    });
    expect(draws).toBe(0);
  });

  it("once a year is set, one draw per pass, likelier for an aggressive driver", () => {
    const spec = raceErasBalance.penalties.offences.pitExitLine;
    const saved = spec.from;
    spec.from = 2000;
    try {
      let draws = 0;
      const at = (value) => ({ next: () => { draws += 1; return value; } });
      expect(pitLineOffenceInForce("pitExitLine", 1999)).toBe(false);
      expect(pitLineOffence(at(0), {}, 1999)).toBe(false);
      expect(draws).toBe(0);
      const just = spec.chancePerExit * 1.01;
      expect(pitLineOffence(at(just), {}, 2024)).toBe(false);
      expect(draws).toBe(1);
      expect(pitLineOffence(at(just), { skills: { aggression: 95 } }, 2024)).toBe(true);
      expect(pitLineOffence(at(just * 0.5), { skills: { aggression: 5 } }, 2024)).toBe(false);
      expect(draws).toBe(3);
    } finally {
      spec.from = saved;
    }
  });
});
