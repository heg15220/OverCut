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
import { createRace, pitLaneLoss, requestPit, runToFinish, stepLap } from "../race";
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
  timingLinesFor,
  boxQueue,
  scTrainSpacingSec,
  pitExitLineEvents,
  DOUBLE_STACK_WAIT,
} from "./pitLane";
import { expectedStationary, stopEraFor } from "./pitStop";
import { fromQuickRace, runStepToFinish, snapshot, stepOnce, toRaceState } from "./index";
import { deployNeutralisation, trainGrouped } from "./safetyCar";
import { weekend } from "./simTestKit";
import { createPitClock, stepPitClock } from "../../components/pitTimer";

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

  it("double stack: the team-mate ahead stopping on the same lap makes this car wait while the box is busy (PIT-C2)", () => {
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
    // PIT-C2: the box is busy for the mate's stop; this car gets there `gap` seconds later.
    const mateStop = expectedStationary({ rules: rulesFor(state.era), crew: mate.crew, errors: false });
    expect(stacked.queueSec).toBeCloseTo(boxQueue({ freeAt: mateStop, arrival: car.time - mate.time }), 12);
    expect(stacked.queueGreen).toBe(stacked.queueSec);
    expect(stacked.lossGreen).toBeCloseTo(alone.lossGreen + stacked.queueGreen, 12);
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

/**
 * PIT-C1 (docs/manager/F1M24-CHINA.md §2.2 GS-15, §3.1, §1.5): previewPit and the stopwatch share one
 * definition - the same two timing lines (timingLinesFor), the same lane profile, the car's own box -
 * so the estimate is what the clock reads (RF-SIM-12, RF-CMD-02, RF-SIM-13; F1M24-CHINA §1.6: the
 * game's menu said 25.6 s for a 30.9 s lane). Acceptance: |previewPit − measured| ≤ 0.5 s under green
 * and ≤ 1.5 s under the safety car, on 8 circuits.
 */
describe("PIT-C1 · GS-15 the estimate is the stopwatch (RF-SIM-12, RF-CMD-02, RF-SIM-13)", () => {
  const CIRCUITS = ["bahrain", "suzuka", "shanghai", "monaco", "hungaroring", "silverstone", "monza", "marina_bay"];
  const GREEN_TOL = 0.5;
  const SC_TOL = 1.5;

  /** Time a car crosses lap time share `x` inside this step (tau0 → tau, wrapping at the line), or null. */
  const crossing = (sim, i, x) => {
    const t0 = sim.tau0[i];
    let t1 = sim.tau[i];
    if (t1 < t0) t1 += 1;
    for (const target of [x, x + 1]) {
      if (target > t0 && target <= t1) return sim.clock - sim.dt + (sim.dt * (target - t0)) / Math.max(1e-12, t1 - t0);
    }
    return null;
  };

  /**
   * Step the race until every car in `asked` ({ [index]: preview }) has been through the lane.
   * Per stop: the engine's exact line-to-line (entered → out of the lane), the HUD stopwatch's
   * (pitTimer.js on the poses), the stationary time the crew really drew; and for every car the
   * times it crossed the two lines on the track, to measure the stretch they span.
   */
  /** One step of the race, writing down when each car on the track crossed the two timing lines. */
  const recorder = (state) => {
    const sim = state._sim;
    const { pitEntryTau, pitExitTau } = sim.tables;
    const entries = state.cars.map(() => []);
    const exits = state.cars.map(() => []);
    // The safety car's own passes between the two lines (distance shares on the ring).
    const sc = { entries: [], exits: [] };
    const pit = sim.lane.circuit.pit;
    const scCross = (P0, P1, share) => {
      const k = Math.floor(P1 - share);
      const at = k + share;
      return at > P0 && at <= P1 ? sim.clock - sim.dt + (sim.dt * (at - P0)) / Math.max(1e-12, P1 - P0) : null;
    };
    const step = () => {
      const wasIn = Uint8Array.from(sim.inPit);
      const N0 = sim.neutral && !sim.neutral.virtual && !sim.neutral.inLane && !sim.neutral.gone ? sim.neutral.P : null;
      stepOnce(state);
      const N = sim.neutral;
      if (N0 !== null && N && !N.virtual && !N.inLane && !N.gone && N.P > N0) {
        const tIn = scCross(N0, N.P, pit.entry - Math.floor(pit.entry));
        // Only its passes at its own pace (TRAIN), not the slower PICKUP.
        if (tIn !== null && state.safetyCar && state.safetyCar.phase === "TRAIN") sc.entries.push(tIn);
        const tOut = scCross(N0, N.P, pit.exit - Math.floor(pit.exit));
        if (tOut !== null) sc.exits.push(tOut);
      }
      for (let i = 0; i < sim.n; i += 1) {
        if (wasIn[i] !== 0 || sim.inPit[i] !== 0 || !sim.active[i]) continue;
        const tIn = crossing(sim, i, pitEntryTau);
        if (tIn !== null) entries[i].push(tIn);
        const tOut = crossing(sim, i, pitExitTau);
        if (tOut !== null) exits[i].push(tOut);
      }
      return wasIn;
    };
    const runFor = (seconds) => {
      const until = sim.clock + seconds;
      while (!state.finished && sim.clock < until) step();
    };
    return { entries, exits, sc, step, runFor };
  };

  const runStops = (state, asked, rec, { maxSeconds = 600 } = {}) => {
    const sim = state._sim;
    const { entries, exits } = rec;
    const clocks = {};
    const out = {};
    const until = sim.clock + maxSeconds;
    const keys = Object.keys(asked).map(Number);
    keys.forEach((i) => {
      clocks[i] = createPitClock();
    });
    while (!state.finished && sim.clock < until && Object.keys(out).length < keys.length) {
      const lane = sim.lane.cars;
      const before = {};
      keys.forEach((i) => {
        if (sim.inPit[i] !== 0 && lane.prof[i]) {
          const tStop = lane.prof[i].tStop;
          before[i] = { end: lane.enteredAt[i] + lane.prof[i].T + (tStop >= 0 ? lane.stopFor[i] : 0) + sim.side.exitWait[i], stopFor: lane.stopFor[i], entered: lane.enteredAt[i] };
        }
      });
      const wasIn = rec.step();
      const shot = snapshot(state);
      keys.forEach((i) => {
        const pose = shot[i] ? { inPit: shot[i].inPit, pitPhase: shot[i].pit ? shot[i].pit.phase : null } : null;
        const read = stepPitClock(clocks[i], pose, sim.clock, sim.clock, { pitTimer: { holdRealSec: 1e9 } });
        if (wasIn[i] !== 0 && sim.inPit[i] === 0 && !out[i] && before[i]) {
          out[i] = { entered: before[i].entered, left: before[i].end, stationary: before[i].stopFor, hud: read ? read.totalSec : null };
        }
      });
    }
    return { out, entries, exits };
  };

  /** The stretch entry line → exit line on the track: the first exit crossing after an entry crossing at `from`. */
  const stretchFrom = (exits, from) => {
    const next = exits.find((t) => t > from);
    return Number.isFinite(next) ? next - from : null;
  };

  const raceAt = (circuit, seed) => {
    const w = weekend({ year: 2024, circuit, context, seed });
    return fromQuickRace(w.make(), { race: w.race });
  };

  /** Three running cars of three teams in mid-field, none due to stop in the next laps. */
  const pickCars = (state, skip = new Set()) => {
    const sim = state._sim;
    const teams = new Set();
    const order = state.cars
      .map((car, i) => ({ car, i }))
      .filter(({ car, i }) => car.status === "running" && sim.inPit[i] === 0 && sim.active[i] && !skip.has(car.teamId))
      .sort((a, b) => a.car.position - b.car.position);
    const picked = [];
    for (const row of order.slice(2)) {
      if (teams.has(row.car.teamId)) continue;
      const lapNow = sim.laps[row.i] + 1;
      if ((row.car.plan?.stops || []).some((stop) => stop >= lapNow - 1 && stop <= lapNow + 2)) continue;
      teams.add(row.car.teamId);
      picked.push(row);
      if (picked.length === 3) break;
    }
    return picked;
  };

  const rows = [];
  beforeAll(() => {
    CIRCUITS.forEach((circuit) => {
      const state = raceAt(circuit, `gs15-${circuit}`);
      const sim = state._sim;
      const lapSec = state.race.baseLap;
      const rec = recorder(state);
      rec.runFor(lapSec * 3.4);
      // Green: ask, preview, and time the stop.
      const green = pickCars(state);
      const asked = {};
      green.forEach(({ car, i }) => {
        requestPit(state, car.id, null);
        asked[i] = previewPit(state, car.id);
      });
      const g = runStops(state, asked, rec);
      Object.entries(g.out).forEach(([key, stop]) => {
        const i = Number(key);
        // The same car's previous pass between the two lines, on the track.
        const previous = g.entries[i].filter((t) => t < stop.entered - lapSec * 0.5);
        const from = previous[previous.length - 1];
        const stretch = Number.isFinite(from) ? stretchFrom(g.exits[i], from) : null;
        rows.push({ circuit, kind: "green", preview: asked[i], ...stop, stretch });
      });
      // Safety car: bring it out, let the field settle for half a lap, then ask three other teams.
      deployNeutralisation(state, { virtual: false, reason: "accident", share: 0.4, corner: 4, rules: sim.rules, lap: sim.leaderLap });
      state.events.push({ type: "sc", lap: sim.leaderLap, forced: true });
      rec.step();
      // A long cleanup (the marshals' draw is on its own stream): the train stays out long enough to
      // time stops in it, rather than the restart that a short one would bring as it groups.
      if (sim.neutral && !sim.neutral.virtual) sim.neutral.cleanupUntil = sim.clock + lapSec * 4;
      rec.runFor(lapSec * 0.5);
      if (!state.safetyCar) return;
      const sc = pickCars(state, new Set(green.map(({ car }) => car.teamId)));
      const askedSc = {};
      sc.forEach(({ car, i }) => {
        requestPit(state, car.id, null);
        askedSc[i] = previewPit(state, car.id);
      });
      const timeScStops = (batch, phase) => {
        const s = runStops(state, batch, rec);
        Object.entries(s.out).forEach(([key, stop]) => {
          const i = Number(key);
          const spells = state.safetyCarSpells || [];
          const underSc = spells.some((spell) => !spell.virtual && spell.from <= stop.entered && (spell.to ?? Infinity) >= stop.left);
          if (!underSc) return;
          // The cars that stayed out just ahead of and just behind this one on the road: the
          // last to cross the entry line before it and the first after it; their mean stretch.
          let before = null;
          let after = null;
          s.entries.forEach((times, j) => {
            if (batch[j] || j === i) return;
            times.forEach((t) => {
              const stretch = stretchFrom(s.exits[j], t);
              if (stretch === null) return;
              if (t <= stop.entered && (!before || t > before.t)) before = { t, stretch };
              if (t > stop.entered && (!after || t < after.t)) after = { t, stretch };
            });
          });
          const around = [before, after].filter(Boolean);
          let stretch = around.length ? around.reduce((sum, row) => sum + row.stretch, 0) / around.length : null;
          if (phase === "train") {
            // In the grouped train the field goes round at the safety car's pace: the stretch is
            // the SC's own pass between the lines nearest in time. (Inside the train the step
            // simulator's followers concertina - quicker than the SC on the straights, slower
            // elsewhere - which moves no car relative to the train as a whole.)
            const near = rec.sc.entries.reduce((best, t) => (best === null || Math.abs(t - stop.entered) < Math.abs(best - stop.entered) ? t : best), null);
            stretch = near === null ? null : stretchFrom(rec.sc.exits, near);
          }
          rows.push({ circuit, kind: "sc", phase, preview: batch[i], ...stop, stretch, around: around.map((row) => row.stretch) });
        });
      };
      // Asked while the field still closes up on the safety car.
      timeScStops(askedSc, "pickup");
      // And once the field is in line behind it (safetyCar.js trainGrouped), if it is still out. The
      // moments in between - a car joining the tail of the train inside the stretch - are the one
      // case the estimate reads from the gaps of the moment (pitLane.js scPaceOf), not asserted here.
      const used = new Set([...green, ...sc].map(({ car }) => car.teamId));
      const grouped = () => Boolean(state.safetyCar && sim.neutral && !sim.neutral.virtual && sim.neutral.ref === state.safetyCar && trainGrouped(state));
      for (let k = 0; k < 24 && state.safetyCar && !grouped(); k += 1) rec.runFor(lapSec * 0.125);
      if (!grouped()) return;
      const askedTrain = {};
      pickCars(state, used).forEach(({ car, i }) => {
        requestPit(state, car.id, null);
        askedTrain[i] = previewPit(state, car.id);
      });
      timeScStops(askedTrain, "train");
    });
    const fmt = (x) => (Number.isFinite(x) ? x.toFixed(2) : "-");
    // eslint-disable-next-line no-console
    console.log(rows.map((r) => `${r.circuit} ${r.kind}${r.phase ? `/${r.phase}` : ""}: preview ${fmt(r.kind === "sc" ? r.preview.lineToLineSc : r.preview.lineToLine)} (loss ${fmt(r.kind === "sc" ? r.preview.lossSc : r.preview.lossGreen)}) | engine ${fmt(r.left - r.entered)} hud ${fmt(r.hud)} stop ${fmt(r.stationary)}/${fmt(r.preview.stopMedian)} | stretch ${fmt(r.stretch)}${r.around ? ` [${r.around.map(fmt).join(" ")}]` : ""} track ${fmt(r.kind === "sc" ? r.preview.trackSc : r.preview.trackGreen)} | miss ${r.stretch === null ? "-" : fmt((r.kind === "sc" ? r.preview.lossSc : r.preview.lossGreen) - (r.left - r.entered - r.stationary + r.preview.stopMedian - r.stretch))}`).join("\n"));
  }, 300000);

  it("times stops on all 8 circuits, under green and under the safety car", () => {
    CIRCUITS.forEach((circuit) => {
      expect([circuit, rows.filter((r) => r.circuit === circuit && r.kind === "green").length >= 2]).toEqual([circuit, true]);
      expect([circuit, rows.filter((r) => r.circuit === circuit && r.kind === "sc").length >= 1]).toEqual([circuit, true]);
    });
    rows.forEach((r) => expect(r.preview.clock).toBe("step"));
  });

  it("line to line: the estimate is the engine's stopwatch (≤ 0.5 s green, ≤ 1.5 s SC; the crew's own draw aside)", () => {
    rows.forEach((r) => {
      const measured = r.left - r.entered;
      // The estimate cannot know the crew's draw: compare with the stop it expects in its place.
      const like = measured - r.stationary + r.preview.stopMedian;
      const predicted = r.kind === "sc" ? r.preview.lineToLineSc : r.preview.lineToLine;
      expect([r.circuit, r.kind, Math.abs(predicted - like) <= (r.kind === "sc" ? SC_TOL : GREEN_TOL)]).toEqual([r.circuit, r.kind, true]);
    });
    // And raw, the stop's draw included, the median miss stays inside the green tolerance.
    const misses = rows.map((r) => Math.abs((r.kind === "sc" ? r.preview.lineToLineSc : r.preview.lineToLine) - (r.left - r.entered))).sort((a, b) => a - b);
    expect(misses[Math.floor(misses.length / 2)]).toBeLessThanOrEqual(GREEN_TOL);
  });

  it("the HUD stopwatch (pitTimer.js on the poses) reads the same lines: within one step of the engine's", () => {
    rows.forEach((r) => {
      expect(r.hud).not.toBeNull();
      expect(Math.abs(r.hud - (r.left - r.entered))).toBeLessThanOrEqual(0.25 + 1e-9);
    });
  });

  it("net loss: the stopwatch less the same stretch driven on the track (≤ 0.5 s green, ≤ 1.5 s SC)", () => {
    const measuredRows = rows.filter((r) => r.stretch !== null);
    expect(measuredRows.length).toBeGreaterThanOrEqual(rows.length * 0.75);
    measuredRows.forEach((r) => {
      const measured = r.left - r.entered - r.stationary + r.preview.stopMedian - r.stretch;
      const predicted = r.kind === "sc" ? r.preview.lossSc : r.preview.lossGreen;
      expect([r.circuit, r.kind, Math.abs(predicted - measured) <= (r.kind === "sc" ? SC_TOL : GREEN_TOL)]).toEqual([r.circuit, r.kind, true]);
    });
  });

  it("one definition: loss = line to line − the track stretch, in both modes; the lines are the lane's ends", () => {
    rows.forEach((r) => {
      expect(r.preview.lossGreen).toBeCloseTo(r.preview.lineToLine - r.preview.trackGreen, 9);
      expect(r.preview.lossSc).toBeCloseTo(r.preview.lineToLineSc - r.preview.trackSc, 9);
      expect(r.preview.extraLoss).toBe(0);
      expect(r.preview.lines.definition).toBe("laneEnds");
    });
    const { race, state } = quickRace(2024, "gs15-quick");
    const circuit = circuitFor(race, 2024);
    const lines = timingLinesFor(circuit);
    expect(lines.entryShare).toBeCloseTo(circuit.pit.entry - Math.floor(circuit.pit.entry), 12);
    expect(lines.exitShare).toBeCloseTo(circuit.pit.exit - Math.floor(circuit.pit.exit), 12);
    expect(lines.laneMetres).toBeCloseTo(laneGeometry(circuit).total, 9);
    const preview = previewPit(state, state.cars[0].id, { circuit });
    const lane = pitLaneFor(circuit, { kmh: state.pitLane.kmh, baseLap: state.race.baseLap, circuitId: state.pitLane.circuitId });
    expect(preview.clock).toBe("quick");
    // The quick mode still charges state.pitLane (SRS 4.2); its stopwatch is that charge + the stretch.
    expect(preview.lossGreen).toBeCloseTo(state.pitLane.stop + preview.stopMedian, 12);
    expect(preview.lineToLine).toBeCloseTo(preview.lossGreen + lane.track, 9);
    expect(preview.lineToLine).toBeCloseTo(lane.lane + preview.extraLoss + preview.stopMedian, 2);
    expect(preview.lineToLineSc).toBeCloseTo(preview.lineToLine, 2);
    expect(preview.laneDrive).toBe(lane.lane);
    // Line to line is the loss plus the stretch, as in the real numbers (OpenF1 lane duration > net loss).
    expect(preview.lineToLine).toBeGreaterThan(preview.lossGreen);
    expect(bahrain2024.openf1.laneDurationMedian).toBeGreaterThan(bahrain2024.openf1.lossMedian);
    // eslint-disable-next-line no-console
    console.log(`Bahrain 2024 quick: lineToLine ${preview.lineToLine.toFixed(2)} s (real lane duration ${bahrain2024.openf1.laneDurationMedian}, f1db ${bahrain2024.f1db.pitLaneMedian}), lossGreen ${preview.lossGreen.toFixed(2)} s (real ${bahrain2024.openf1.lossMedian}); lane ${lines.laneMetres.toFixed(0)} m between the timing lines`);
    // Without a circuit the quick mode cannot time a lane: no invented line-to-line.
    expect(previewPit(state, state.cars[0].id).lineToLine).toBeNull();
    expect(timingLinesFor({ pit: null })).toBeNull();
  });

  it("asking in a step race draws nothing and writes nothing (RF-SIM-15, RNF-05)", () => {
    const a = raceAt("suzuka", "gs15-pure");
    const b = raceAt("suzuka", "gs15-pure");
    for (let k = 0; k < 900; k += 1) {
      if (k % 30 === 0) a.cars.forEach((car) => previewPit(a, car.id));
      stepOnce(a);
      stepOnce(b);
    }
    expect(JSON.stringify(toRaceState(a))).toBe(JSON.stringify(toRaceState(b)));
    expect(Array.from(a._sim.tau)).toEqual(Array.from(b._sim.tau));
  });
});

/**
 * PIT-C2 (docs/manager/F1M24-CHINA.md §3.3; GS-09 the queue, prerequisite of AUD-C7): RF-SIM-12,
 * RF-SIM-10, RF-SIM-15, RNF-05, RNF-07.
 *
 *   - a queue only with the box occupied: 0 with the team-mate gone (boxQueue, previewPit), in
 *     both conditions, and in step races with a forced SC (every team called in at once);
 *   - the loss behind a SC: the train closes the gap between team-mates, so the queue can only grow;
 *   - the `pitExitLine` events: one limiter cut per pass, at the end of the limited zone.
 */
describe("PIT-C2 · the queue only with the box occupied, and the exit line (GS-09, RF-SIM-12)", () => {
  it("boxQueue: the wait while the box is busy plus the crew's reset; 0 with the box free (single source of the wait)", () => {
    expect(DOUBLE_STACK_WAIT).toBe(raceErasBalance.pit.doubleStackWait);
    expect(pitBalance.pitLane.queue.waitFrom).toBe("race-eras.json pit.doubleStackWait");
    expect(boxQueue({ freeAt: 10, arrival: 7.5 })).toBeCloseTo(2.5 + DOUBLE_STACK_WAIT, 12);
    expect(boxQueue({ freeAt: 10, arrival: 7.5, wait: 0 })).toBeCloseTo(2.5, 12);
    // The team-mate already gone: no queue, however short the miss.
    expect(boxQueue({ freeAt: 10, arrival: 10 })).toBe(0);
    expect(boxQueue({ freeAt: 10, arrival: 20.5 })).toBe(0);
    // Defensive: no box time, no queue (no invented wait).
    expect(boxQueue({ freeAt: -Infinity, arrival: 3 })).toBe(0);
    expect(boxQueue({ freeAt: NaN, arrival: 3 })).toBe(0);
    expect(boxQueue()).toBe(0);
  });

  it("previewPit: queue 0 with the team-mate out of the box; behind a SC the gap closes to the train's spacing (lossSc)", () => {
    const { race, state } = quickRace(2024, "pitc2-preview");
    const circuit = circuitFor(race, 2024);
    stepLap(state);
    const rules = rulesFor(state.era);
    const order = [...state.cars].filter((car) => car.status === "running").sort((a, b) => a.time - b.time);
    const car = order.find((entry) => order.some((other) => other.teamId === entry.teamId && other.time < entry.time));
    const mate = order.find((other) => other.teamId === car.teamId && other.id !== car.id);
    let lap = state.lap + 5;
    while (mate.plan.stops.includes(lap) || car.plan.stops.includes(lap)) lap += 1;
    mate.plan = { ...mate.plan, stops: [...mate.plan.stops, lap].sort((a, b) => a - b) };
    const mateStop = expectedStationary({ rules, crew: mate.crew, errors: false });
    const alone = { ...previewPit({ ...state, cars: state.cars.filter((other) => other !== mate) }, car.id, { lap, circuit }) };

    // 1. The team-mate well up the road (10.5 s, the McLaren case of China 2024): green queue 0.
    const saved = car.time;
    car.time = mate.time + 10.5;
    const gone = previewPit(state, car.id, { lap, circuit });
    expect(gone.teamMateSameLap).toBe(true);
    expect(10.5).toBeGreaterThan(mateStop + DOUBLE_STACK_WAIT);
    expect(gone.queueGreen).toBe(0);
    expect(gone.queueSec).toBe(0);
    expect(gone.lossGreen).toBeCloseTo(alone.lossGreen, 9);
    // A VSC keeps the time gap: still no queue.
    expect(gone.lossVsc).toBeCloseTo(alone.lossVsc, 9);
    // Behind a SC the train closes 10.5 s to its spacing: the box is busy again, the queue is the rest.
    const between = state.cars.filter((other) => other !== car && other !== mate && other.status === "running" && other.time > mate.time && other.time < car.time).length;
    const spacing = scTrainSpacingSec(circuit.length > 0 ? circuit.length : circuit.km * 1000, state.race.baseLap, between + 1);
    expect(spacing).toBeGreaterThan(0);
    expect(gone.queueSc).toBeCloseTo(boxQueue({ freeAt: mateStop, arrival: Math.min(10.5, spacing) }), 12);
    expect(gone.lossSc).toBeCloseTo(alone.lossSc + gone.queueSc, 9);

    // 2. Right behind (0.4 s): busy box in every condition, never a longer wait behind the SC than its spacing allows.
    car.time = mate.time + 0.4;
    const close = previewPit(state, car.id, { lap, circuit });
    expect(close.queueGreen).toBeCloseTo(mateStop - 0.4 + DOUBLE_STACK_WAIT, 12);
    expect(close.queueSc).toBeGreaterThanOrEqual(close.queueGreen - 1e-12);
    expect(close.queueSc).toBeLessThanOrEqual(mateStop + DOUBLE_STACK_WAIT + 1e-12);
    // The car ahead never queues behind the one behind it.
    expect(previewPit(state, mate.id, { lap, circuit }).queueSec).toBe(0);
    car.time = saved;
    // Without a lap length or pace the SC gap is the green one (no invented spacing).
    expect(scTrainSpacingSec(0, 90)).toBeNull();
    expect(scTrainSpacingSec(5000, 0)).toBeNull();
  });

  /**
   * GS-09 acceptance (the queue part, F1M24-CHINA §3.1): 32 seeds, a SC forced after three laps and
   * every running car called in at once (both cars of every team), so the field produces both cases
   * - the team-mate still in the box, and already gone. At the step each car reaches its box, a queue
   * means the mate is still in the box; with the mate out of the box, the queue is 0.
   */
  it("32 step races with a forced SC: queue 0 with the team-mate out, a queue only with the box busy", () => {
    const SEEDS = Array.from({ length: 32 }, (_, k) => `pitc2-sc-${k}`);
    const tally = { stops: 0, queued: 0, mateOut: 0, queuedWithMateOut: 0, busyWithoutQueue: 0 };
    SEEDS.forEach((seed) => {
      const w = weekend({ year: 2024, circuit: "shanghai", context, seed });
      const state = fromQuickRace(w.make(), { race: w.race });
      const sim = state._sim;
      const lapSec = state.race.baseLap;
      const until = (seconds) => {
        const end = sim.clock + seconds;
        while (!state.finished && sim.clock < end) stepOnce(state);
      };
      until(lapSec * 3);
      deployNeutralisation(state, { virtual: false, reason: "accident", share: 0.4, corner: 4, rules: sim.rules, lap: sim.leaderLap });
      stepOnce(state);
      if (sim.neutral && !sim.neutral.virtual) sim.neutral.cleanupUntil = sim.clock + lapSec * 4;
      until(lapSec * 0.5);
      state.cars.forEach((car, i) => {
        if (car.status === "running" && sim.inPit[i] === 0) requestPit(state, car.id, null);
      });
      const lane = sim.lane.cars;
      const stoppedAt = (j) => sim.inPit[j] !== 0 && Boolean(lane.prof[j]) && (lane.phase[j] === PHASE.STATIONARY || lane.phase[j] === PHASE.QUEUE);
      const seen = new Set();
      const end = sim.clock + lapSec * 2.5;
      while (!state.finished && sim.clock < end) {
        const before = state.cars.map((_, j) => stoppedAt(j));
        stepOnce(state);
        for (let i = 0; i < sim.n; i += 1) {
          if (!stoppedAt(i) || before[i]) continue;
          const key = `${i}@${lane.enteredAt[i]}`;
          if (seen.has(key)) continue;
          seen.add(key);
          if (lane.prof[i].tStop < 0) continue;
          const car = state.cars[i];
          const j = state.cars.findIndex((other, k) => k !== i && other.teamId === car.teamId);
          // The mate in its box at the step this car got to it (before or after the step: it may leave within it).
          const mateIn = j >= 0 && (before[j] || stoppedAt(j));
          const queued = lane.queue[i] > 0;
          tally.stops += 1;
          if (queued) tally.queued += 1;
          if (!mateIn) tally.mateOut += 1;
          if (queued && !mateIn) tally.queuedWithMateOut += 1;
          // The other direction (a busy box without a queue) is logged, not asserted: it comes from
          // stepRace.js (SIM lane) not carrying the release holds (unsafeRelease.holdSeconds) into
          // sim.boxFree - a 0.1-0.5 s overlap - and is handed to SIM (PIT-C2 pending).
          if (!queued && mateIn) tally.busyWithoutQueue += 1;
        }
      }
    });
    // eslint-disable-next-line no-console
    console.log(`PIT-C2 queue, 32 seeds Shanghai 2024 with a forced SC: ${JSON.stringify(tally)}`);
    // Both cases happen, so the test can see the difference.
    expect(tally.queued).toBeGreaterThan(0);
    expect(tally.mateOut).toBeGreaterThan(tally.queued);
    // The acceptance: queue 0 with the team-mate out of the box.
    expect(tally.queuedWithMateOut).toBe(0);
  });

  it("pitExitLine: one limiter cut per pass at the end of the limited zone, one end-of-line on the track; pure", () => {
    const w = weekend({ year: 2024, circuit: "shanghai", context, seed: "pitc2-exit" });
    const state = fromQuickRace(w.make(), { race: w.race });
    const sim = state._sim;
    const circuit = sim.lane.circuit;
    const geo = laneGeometry(circuit);
    const lines = pitLinesFor(circuit);
    const lane = sim.lane.cars;
    const events = [];
    const passes = [];
    const onTrackAfter = {};
    const until = sim.clock + state.race.baseLap * 30;
    while (!state.finished && sim.clock < until && passes.length < 6) {
      const s0 = state.cars.map((_, i) => (sim.inPit[i] !== 0 && lane.prof[i] ? lane.s[i] : null));
      const P0 = Float64Array.from(sim.P);
      const t0 = sim.clock;
      stepOnce(state);
      for (let i = 0; i < sim.n; i += 1) {
        const id = state.cars[i].id;
        if (s0[i] !== null) {
          const inLane = sim.inPit[i] !== 0 && lane.prof[i];
          const s1 = inLane ? lane.s[i] : geo.total;
          events.push(...pitExitLineEvents(circuit, { carId: id, t0, t1: sim.clock, s0: s0[i], s1 }));
          if (!inLane) {
            passes.push({ id, left: sim.clock });
            onTrackAfter[id] = sim.clock;
          }
        } else if (onTrackAfter[id] !== undefined && sim.inPit[i] === 0) {
          events.push(...pitExitLineEvents(circuit, { carId: id, t0, t1: sim.clock, share0: P0[i] - Math.floor(P0[i]), share1: sim.P[i] - Math.floor(sim.P[i]) }));
          if (sim.clock - onTrackAfter[id] > 30) delete onTrackAfter[id];
        }
      }
    }
    expect(passes.length).toBeGreaterThan(0);
    passes.forEach((pass) => {
      const mine = events.filter((event) => event.carId === pass.id && event.t <= pass.left + 1e-9);
      const limits = mine.filter((event) => event.line === "limit");
      expect(limits.length).toBeGreaterThanOrEqual(1);
      limits.forEach((event) => expect(event.type).toBe("pitExitLine"));
    });
    // Each pass has exactly one cut, before it leaves the lane, and an end-of-line after it.
    const byCar = {};
    events.forEach((event) => {
      (byCar[event.carId] = byCar[event.carId] || []).push(event);
    });
    Object.entries(byCar).forEach(([id, list]) => {
      const mine = passes.filter((pass) => pass.id === id);
      const lastLeft = mine.length ? Math.max(...mine.map((pass) => pass.left)) : -Infinity;
      const cuts = list.filter((event) => event.line === "limit" && event.t <= lastLeft + 1e-9).length;
      expect(cuts).toBe(mine.length);
      list.filter((event) => event.line === "white").forEach((white) => {
        expect(list.some((cut) => cut.line === "limit" && cut.t < white.t)).toBe(true);
      });
    });
    expect(events.some((event) => event.line === "white")).toBe(lines.exit.pastLaneEnd > 0);
    // Pure and defensive.
    const a = pitExitLineEvents(circuit, { carId: "x", t0: 1, t1: 1.25, s0: geo.limitToS - 2, s1: geo.limitToS + 2 });
    expect(a).toEqual(pitExitLineEvents(circuit, { carId: "x", t0: 1, t1: 1.25, s0: geo.limitToS - 2, s1: geo.limitToS + 2 }));
    expect(a).toHaveLength(1);
    expect(a[0].t).toBeCloseTo(1.125, 9);
    expect(pitExitLineEvents(circuit, { t0: 1, t1: 2, s0: 0, s1: 1 })).toEqual([]);
    expect(pitExitLineEvents({ pit: null }, { t0: 1, t1: 2, s0: 0, s1: 1e6 })).toEqual([]);
    expect(pitExitLineEvents(circuit, { s0: 0, s1: 1e6 })).toEqual([]);
  });

  it("race-pit.json: the queue and event blocks validate and name their sources (RNF-07)", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    expect(ajv.validate(pitSchema, pitBalance)).toBe(true);
    expect(pitBalance.pitLane.queue.scSpacingFrom).toBe("race-sim.json safetyCar.trainGapMetres");
    expect(pitBalance.pitStop.events.wheelOrder).toEqual(["fl", "fr", "rl", "rr"]);
  });
});
