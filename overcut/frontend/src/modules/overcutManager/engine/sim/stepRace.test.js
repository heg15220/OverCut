/**
 * The step race simulation (phase 3, SRS 4.2): RF-SIM-01 fixed steps on the circuit,
 * RF-SIM-06 dirty air and tow by era, RF-SIM-07 duels for corners, RF-SIM-08 DRS by era,
 * RF-SIM-15 / RNF-05 determinism, RF-CMD-01 orders, RNF-01 performance, and the state
 * shape the UI and the career read (raceClock, classificationOf, completeRace).
 */

import { classificationOf, createRace } from "../race";
import { completeRace, entrantsFor, eraOf } from "../career";
import { circuitFor } from "../venue";
import { rulesFor } from "../rules";
import { carAt, standingsAt } from "../../components/raceClock";
import balance from "../../data/balance/race-sim.json";
import {
  ROLE, airEffect, createStepRace, fromQuickRace, requestPit, runStepToFinish, setDefence, setMode, setOvertakeRisk, snapshot, stepFor, stepOnce, toRaceState,
} from "./index";
import { skipFormation, startOf } from "./stepRace";
import { pitLinesFor } from "./pitLane";
import { STAGES } from "./pitStop";
import { BATTLE_BALANCE, BATTLE_NAMES, confirmTimeOf } from "./duel";
import { waveYellow } from "../race";
import { weekend } from "./simTestKit";
import eraDefaults from "../../data/seasons/curated/era-defaults.json";

const stepRaceOf = (options) => {
  const w = weekend(options);
  return { ...w, state: fromQuickRace(w.make(), { race: w.race }) };
};

const KNOWN_EVENTS = new Set([
  "pass", "mistake", "issue", "lead", "pit", "dnf", "sc", "vsc", "sc-in", "rain", "drying", "fastest", "contact", "swap", "flag", "call",
  // RF-SIM-10 race control, shared with the quick mode.
  "yellow", "investigation", "no-action", "penalty", "penalty-served", "penalty-applied", "red", "restart", "grid-penalty",
  // SIM-3 (F1M24-GAMEPLAY §1.7): the lights going out and each car's flag.
  "lightsOut", "finished",
  // SIM-4 (F1M24-GAMEPLAY §1.7): the phases of every fight for a corner.
  "duel",
  // SIM-5 (F1M24-GAMEPLAY §2.11): the safety car's phases and the VSC ending.
  "sc-phase", "vsc-ending",
  // SIM-7 (F1M24-GAMEPLAY §2.10): track limits and their flag, damage and a puncture on debris.
  "track-limits", "black-white", "damage", "puncture",
  // SIM-C3 (PIT-C2 handover, F1M24-CHINA §3.3, prerequisite of AUD-C7): the limiter off and the end of the exit line.
  "pitExitLine",
  // SIM-C4 (F1M24-CHINA §1.5, GS-12): race control's messages (DRS, wet chain, wet start) and a penalty carried to the grid.
  "control", "penalty-carried",
]);

describe("RF-SIM-01 a race in fixed steps on the circuit", () => {
  const { career, race, state } = stepRaceOf({ seed: "shape" });
  runStepToFinish(state);

  it("runs to the flag and classifies every car the way the quick mode does", () => {
    expect(state.finished).toBe(true);
    const rows = classificationOf(state);
    expect(rows).toHaveLength(state.cars.length);
    expect(rows[0]).toMatchObject({ position: 1, status: "finished", gap: 0 });
    rows.forEach((row, index) => expect(row.position).toBe(index + 1));
    // Finishers are in order of elapsed time over the full distance.
    const finishers = rows.filter((row) => row.status === "finished");
    for (let k = 1; k < finishers.length; k += 1) expect(finishers[k].gap).toBeGreaterThanOrEqual(finishers[k - 1].gap);
    expect(state.fastestLap).toMatchObject({ carId: expect.any(String), time: expect.any(Number) });
    expect(state.events[state.events.length - 1].type).toBe("flag");
    state.events.forEach((event) => expect(KNOWN_EVENTS.has(event.type)).toBe(true));
  });

  it("leaves the line crossings raceClock replays: one entry per lap, back to back", () => {
    state.cars
      .filter((car) => car.status === "finished")
      .forEach((car) => expect(car.history).toHaveLength(state.laps));
    state.cars.forEach((car) => {
      car.history.forEach((entry, index) => {
        expect(entry.lap).toBe(index + 1);
        expect(entry.end).toBeGreaterThan(entry.start);
        expect(Math.abs(entry.start - (index > 0 ? car.history[index - 1].end : 0))).toBeLessThan(1e-9);
      });
    });
    const circuit = circuitFor(race, state.year);
    const rows = standingsAt(state.cars, 1800, circuit, state.race.baseLap);
    expect(rows).toHaveLength(state.cars.length);
    rows.forEach((row) => {
      expect(Number.isFinite(row.pose.x)).toBe(true);
      expect(Number.isFinite(row.pose.y)).toBe(true);
    });
    const pitted = state.cars.find((car) => car.history.some((entry) => entry.pit));
    const pitLap = pitted.history.find((entry) => entry.pit);
    expect(carAt(pitted, pitLap.end - 0.5, circuit, state.race.baseLap).inPit).toBe(true);
  });

  it("is read by career.completeRace unchanged (via toRaceState)", () => {
    const summary = completeRace(career, toRaceState(state));
    expect(summary.rows).toHaveLength(state.cars.length);
    expect(summary.rows[0].position).toBe(1);
    expect(Object.values(summary.teamPoints).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it("advances each car by the speed trace: slow through corners, fast on straights", () => {
    const fresh = stepRaceOf({ seed: "trace" }).state;
    stepFor(fresh, 200);
    const sim = fresh._sim;
    const before = Float64Array.from(sim.P);
    stepOnce(fresh);
    const metres = Array.from(sim.P, (p, i) => (p - before[i]) * sim.tables.length);
    const moving = metres.filter((m) => m > 0);
    // 0.25 s at 60-340 km/h.
    moving.forEach((m) => {
      expect(m).toBeGreaterThan(2);
      expect(m).toBeLessThan(26);
    });
    expect(Math.max(...moving) / Math.min(...moving)).toBeGreaterThan(1.3);
  });
});

describe("RF-SIM-15 / RNF-05 determinism", () => {
  const run = (seed, chunk) => {
    const { state } = stepRaceOf({ seed });
    const mine = state.cars.find((car) => car.isUser);
    stepFor(state, 600);
    setMode(state, mine.id, "push");
    setDefence(state, mine.id, "block");
    setOvertakeRisk(state, mine.id, "high");
    for (let t = 0; t < 900; t += chunk) stepFor(state, chunk);
    requestPit(state, mine.id, "hard");
    runStepToFinish(state);
    return JSON.stringify({ rows: classificationOf(state), events: state.events, duels: state.duels, radio: state.radio, fastest: state.fastestLap });
  };

  it("gives byte-identical output for the same seed and the same orders at the same race time", () => {
    const first = run("det", 0.25);
    expect(run("det", 0.25)).toBe(first);
    // How the clock is fed (frame by frame or in big jumps) does not change the race.
    expect(run("det", 37.5)).toBe(first);
    expect(run("det-other", 0.25)).not.toBe(first);
  });
});

describe("RF-SIM-07 duels for a corner", () => {
  const races = ["d1", "d2", "d3"].map((seed) => {
    const { state } = stepRaceOf({ seed });
    return runStepToFinish(state);
  });
  const duels = races.flatMap((state) => state.duels);

  it("opens duels before real braking zones and resolves them as passes, defences and switchbacks", () => {
    const outcomes = new Set(duels.map((duel) => duel.outcome));
    expect(outcomes.has("pass")).toBe(true);
    expect(outcomes.has("defended")).toBe(true);
    expect(outcomes.has("switchback") || outcomes.has("switchback-failed")).toBe(true);
    const corners = new Set(races[0]._sim.tables.attacks.map((zone) => zone.corner));
    duels.forEach((duel) => {
      expect(corners.has(duel.corner)).toBe(true);
      expect(duel.chance ?? 0).toBeLessThanOrEqual(balance.duel.max);
    });
    // Three cars can claim the same corner (SRS 2.3 CornerClaim).
    expect(duels.some((duel) => duel.claim === 3)).toBe(true);
    // Every pass on the timing feed happened at a real corner.
    races.forEach((state) => state.events.filter((event) => event.type === "pass").forEach((event) => expect(corners.has(event.corner)).toBe(true)));
  });

  it("passes as often as the quick mode, within reason", () => {
    const passes = races.map((state) => state.events.filter((event) => event.type === "pass").length);
    passes.forEach((count) => {
      expect(count).toBeGreaterThan(5);
      expect(count).toBeLessThan(150);
    });
  });

  it("RF-SIM-08: DRS only where the era has it (2024 yes, 2008 no)", () => {
    expect(duels.some((duel) => duel.drs)).toBe(true);
    const { state } = stepRaceOf({ year: 2008, teamId: "ferrari", seed: "d2008" });
    runStepToFinish(state);
    expect(state.finished).toBe(true);
    expect(state._sim.tables.drsZones).toHaveLength(0);
    expect(state.duels.some((duel) => duel.drs)).toBe(false);
    // Refuelling era: stops refuel and the race still classifies everyone.
    expect(classificationOf(state)).toHaveLength(state.cars.length);
  });

  it("keeps side-by-side cars from overlapping (lateral offset; SIM-2: the era's box, race-physics.json lateral)", () => {
    const { state } = stepRaceOf({ seed: "lateral" });
    const sim = state._sim;
    const { carLength, carWidth } = sim.side.spec;
    let sideBySide = 0;
    let offLine = 0;
    let overlaps = 0;
    for (let k = 0; k < 2400; k += 1) {
      stepOnce(state);
      if (snapshot(state).some((car) => car.duel !== ROLE.NONE && car.lateral !== 0)) offLine += 1;
      for (let i = 0; i < sim.n; i += 1) {
        const j = sim.ahead[i];
        if (j < 0 || !sim.active[i] || !sim.active[j] || sim.inPit[i] || sim.inPit[j]) continue;
        const gap = ((sim.P[j] - sim.P[i]) % 1 + 1) % 1 * sim.tables.length;
        if (gap >= carLength) continue;
        sideBySide += 1;
        if (Math.abs(sim.lat[i] - sim.lat[j]) < carWidth - 1e-9) overlaps += 1;
      }
    }
    expect(sideBySide).toBeGreaterThan(0);
    expect(offLine).toBeGreaterThan(0);
    expect(overlaps).toBe(0);
  });
});

describe("RF-SIM-06 dirty air and the tow by distance and era", () => {
  it("reads the era's values from data: the quick mode's dirty air (rules.js), the step tow (race-sim.json)", () => {
    const tow = (year) => balance.slipstream.byEra.find((entry) => year >= entry.from && year <= entry.to).gainPerLap;
    const { state } = stepRaceOf({ seed: "air" });
    expect(state._sim.dirtyLoss).toBe(rulesFor(state.era).dirtyAir);
    expect(state._sim.slipGain).toBe(tow(2024));
    expect(rulesFor(2019).dirtyAir).toBeGreaterThan(rulesFor(2024).dirtyAir);
  });

  it("costs a following car time in corners and gives it time on straights, more the closer it is", () => {
    const { state } = stepRaceOf({ seed: "air2" });
    const sim = state._sim;
    const budget = state.race.baseLap;
    expect(airEffect(sim, budget, 0.3, true)).toBeLessThan(0);
    expect(airEffect(sim, budget, 0.3, false)).toBeGreaterThan(0);
    expect(airEffect(sim, budget, 0.2, true)).toBeLessThan(airEffect(sim, budget, 0.8, true));
    expect(airEffect(sim, budget, 0.2, false)).toBeGreaterThan(airEffect(sim, budget, 0.8, false));
    expect(airEffect(sim, budget, 1.5, true)).toBe(0);
    expect(airEffect(sim, budget, 1.5, false)).toBe(0);
    // Spent over a whole lap at 0 s, the loss is the era's figure in seconds.
    const lapLoss = -airEffect(sim, budget, 0, true) * budget * sim.tables.cornerTime;
    expect(lapLoss).toBeCloseTo(sim.dirtyLoss, 9);
  });
});

describe("RF-CMD-01 / RF-CMD-02 orders during the race", () => {
  it("feels a pace order at once, obeys a pit call at the next pit entry and validates styles", () => {
    const { state } = stepRaceOf({ seed: "orders" });
    stepFor(state, 300);
    const mine = state.cars.find((car) => car.isUser && car.status === "running");
    const i = state.cars.indexOf(mine);
    const budget = state._sim.budget[i];
    setMode(state, mine.id, mine.mode === "push" ? "save" : "push");
    expect(state._sim.budget[i]).not.toBe(budget);
    setDefence(state, mine.id, "nonsense");
    expect(mine.defence).toBe(balance.defence.default);
    setDefence(state, mine.id, "holdRacingLine");
    expect(mine.defence).toBe("holdRacingLine");
    const stops = mine.stops;
    requestPit(state, mine.id, "medium");
    stepFor(state, state.race.baseLap * 1.6);
    expect(mine.stops).toBe(stops + 1);
    expect(mine.compound).toBe("medium");
    expect(mine.pitRequest).toBe(null);
  });
});

describe("RNF-01 performance", () => {
  it("runs 22 cars for 70 laps headless well inside the budget", () => {
    const { career, race } = weekend({ seed: "perf" });
    const base = entrantsFor(career);
    const extra = base.slice(-2).map((entrant, k) => ({ ...entrant, id: `${entrant.id}-x${k}`, driverId: `${entrant.driverId}-x${k}` }));
    const entrants = [...base, ...extra];
    const args = { race: { ...race, laps: 70 }, era: eraOf(career), year: career.year, entrants, seed: "perf" };
    // Warm the circuit and the JIT the way a second race in a session would be.
    runStepToFinish(createStepRace({ ...args, race: { ...race, laps: 5 } }));
    const started = Date.now();
    const state = runStepToFinish(createStepRace(args));
    const ms = Date.now() - started;
    // eslint-disable-next-line no-console
    console.log(`RNF-01: 22 cars x 70 laps in ${ms} ms (${state._sim.steps} steps)`);
    expect(state.cars).toHaveLength(22);
    expect(state.finished).toBe(true);
    // SRS: 2 s on an average laptop in a Web Worker; generous margin for CI machines.
    expect(ms).toBeLessThan(4000);
  });

  it("accepts the quick mode's arguments unchanged (createRace ⇄ createStepRace)", () => {
    const { career, race } = weekend({ seed: "args" });
    const args = { race, era: eraOf(career), year: career.year, entrants: entrantsFor(career), seed: "args" };
    const quick = createRace(args);
    const step = createStepRace(args);
    expect(step.cars.map((car) => car.id)).toEqual(quick.cars.map((car) => car.id));
    expect(step.weather).toEqual(quick.weather);
  });
});

/**
 * SIM-3 (F1M24-GAMEPLAY §2.13 salida-carrera y vuelta-enfriamiento; RF-SIM-10, RF-SIM-15, RF-WKD-07, RNF-05,
 * RNF-07): the PRE_START phase (formation lap, grid, the era's lights, the seeded wait), the `finished`
 * event and the cooldown lap.
 */
describe("SIM-3 the start and the finish", () => {
  const PRE_EVENTS = new Set(["formation", "grid", "light", "lightsOut"]);
  const fiveRed = balance.start.procedures.fiveRed;

  /** A step race of `seed` (2024 unless `year`) with the PRE_START `preStart` (null = none). */
  const raceOf = (seed, preStart, year) => {
    const w = weekend({ seed, ...(year ? { year } : {}) });
    return fromQuickRace(w.make(), { race: w.race, preStart });
  };
  /** Run the PRE_START up to (not into) lights out, recording the start snapshot after every step. */
  const runPre = (state) => {
    const seen = [];
    while (state._sim.pre.k < state._sim.pre.kOut) {
      stepOnce(state);
      seen.push({ ...snapshot(state).start, P: Array.from(state._sim.P) });
    }
    return seen;
  };
  /** Everything the race produced but the PRE_START's own events. */
  const raceOutput = (state) =>
    JSON.stringify({
      rows: classificationOf(state),
      history: state.cars.map((car) => car.history),
      events: state.events.filter((event) => !PRE_EVENTS.has(event.type)),
      duels: state.duels,
      radio: state.radio,
      fastest: state.fastestLap,
    });

  it("lights one a second, then a seeded wait: the same seed gives the same lights, another seed another wait", () => {
    const lightsOf = (seed) => {
      const state = raceOf(seed, { formation: "skip" });
      runPre(state);
      stepOnce(state);
      return state.events.filter((event) => event.type === "light" || event.type === "lightsOut");
    };
    const first = lightsOf("lights-a");
    expect(lightsOf("lights-a")).toEqual(first);
    const lit = first.filter((event) => event.type === "light");
    expect(lit.map((event) => event.n)).toEqual([1, 2, 3, 4, 5]);
    for (let k = 1; k < lit.length; k += 1) expect(lit[k].t - lit[k - 1].t).toBeCloseTo(fiveRed.lightIntervalSec, 3);
    const out = first.find((event) => event.type === "lightsOut");
    const hold = out.t - lit[4].t;
    expect(hold).toBeGreaterThanOrEqual(fiveRed.holdSec.min - 1e-3);
    expect(hold).toBeLessThanOrEqual(fiveRed.holdSec.max + 1e-3);
    const holds = ["lights-b", "lights-c", "lights-d"].map((seed) => {
      const events = lightsOf(seed);
      return events.find((event) => event.type === "lightsOut").t - events.filter((event) => event.type === "light")[4].t;
    });
    expect(new Set([hold, ...holds].map((h) => h.toFixed(3))).size).toBeGreaterThan(1);
  });

  it("drives the formation lap without overtaking, stops on the grid, then lights and out (snapshot.start)", () => {
    const state = raceOf("formation", { formation: "drive" });
    expect(startOf(state)).toMatchObject({ phase: "formation", lights: 0, procedure: "fiveRed", formation: true });
    const seen = runPre(state);
    const phases = seen.map((s) => s.phase).filter((phase, k, all) => k === 0 || all[k - 1] !== phase);
    expect(phases).toEqual(["formation", "grid", "lights"]);
    const lights = seen.filter((s) => s.phase === "lights").map((s) => s.lights);
    expect(Math.max(...lights)).toBe(5);
    for (let k = 1; k < lights.length; k += 1) expect(lights[k]).toBeGreaterThanOrEqual(lights[k - 1]);
    // The pole car comes round in formation.lapFactor base laps; the field keeps its order on the road.
    const gridAt = seen.find((s) => s.phase === "grid").t;
    const running = state.cars.map((car, i) => i).filter((i) => state.cars[i].status === "running");
    expect(gridAt).toBeGreaterThan(state.race.baseLap * balance.start.formation.lapFactor);
    seen.forEach((s) => {
      for (let k = 1; k < running.length; k += 1) expect(s.P[running[k]]).toBeLessThan(s.P[running[k - 1]]);
    });
    // On the grid nobody moves.
    const grid = seen.filter((s) => s.phase !== "formation");
    grid.forEach((s) => expect(s.P).toEqual(grid[0].P));
    expect(snapshot(state).start.phase).toBe("lights");
    stepOnce(state);
    expect(snapshot(state).start).toMatchObject({ phase: "out", lights: 0 });
    const out = state.events.find((event) => event.type === "lightsOut");
    expect(out.t).toBeCloseTo(seen[seen.length - 1].t, 2);
    expect(state.clock).toBeCloseTo(state._sim.dt, 9);
  });

  it("changes nothing in the race: none, skipped or driven formation lap give the same race (RNF-05)", () => {
    const none = raceOf("same-race", null);
    runStepToFinish(none);
    const skipped = raceOf("same-race", { formation: "skip" });
    runStepToFinish(skipped);
    const driven = raceOf("same-race", { formation: "drive" });
    stepFor(driven, 30);
    skipFormation(driven); // skipped half way: still the same race
    runStepToFinish(driven);
    const reference = raceOutput(none);
    expect(raceOutput(skipped)).toBe(reference);
    expect(raceOutput(driven)).toBe(reference);
    expect(none.events.find((event) => event.type === "lightsOut")).toMatchObject({ lap: 1, t: 0 });
  });

  it("ninguna regla fuera de su era: every year has its procedure, red-green before 1996, five reds after", () => {
    for (let year = 1950; year <= 2026; year += 1) {
      const procedure = rulesFor(year).regulations.startProcedure;
      expect(balance.start.procedures[procedure.lights]).toBeDefined();
      expect(procedure.lights).toBe(year < 1996 ? "redGreen" : "fiveRed");
    }
    eraDefaults.fields.startProcedure.forEach((entry) => {
      expect(["source", "pending"]).toContain(entry.status);
    });
    const old = raceOf("lights-1988", { formation: "skip" }, 1988);
    expect(startOf(old).procedure).toBe("redGreen");
    const seen = runPre(old);
    expect(Math.max(...seen.map((s) => s.lights))).toBe(1);
    expect(old.events.filter((event) => event.type === "light")).toHaveLength(1);
  });

  it("flags every finisher once with its place on the road, then drives a cooldown lap that moves no result", () => {
    const state = raceOf("finish", null);
    runStepToFinish(state);
    const sim = state._sim;
    const flags = state.events.filter((event) => event.type === "finished");
    const finishers = state.cars.filter((car) => car.status === "finished");
    expect(flags).toHaveLength(finishers.length);
    expect(flags.map((event) => event.pos)).toEqual(finishers.map((car, k) => k + 1));
    for (let k = 1; k < flags.length; k += 1) expect(flags[k].t).toBeGreaterThanOrEqual(flags[k - 1].t);
    flags.forEach((event) => {
      const car = state.cars.find((entry) => entry.id === event.carId);
      expect(event.t).toBeCloseTo(car.history[car.history.length - 1].end, 2);
      expect(event.lap).toBe(state.laps);
    });
    expect(state.events[state.events.length - 1].type).toBe("flag");
    // The last finishers are still on their cooldown lap at the flag; the view may keep watching them.
    const before = raceOutput(state);
    const P = Array.from(sim.P);
    const cooling = state.cars.map((car, i) => i).filter((i) => snapshot(state)[i].cooldown);
    expect(cooling.length).toBeGreaterThan(0);
    const from = cooling.map((i) => snapshot(state)[i].progress);
    stepFor(state, 20);
    cooling.forEach((i, k) => expect(snapshot(state)[i].progress).toBeGreaterThan(from[k]));
    stepFor(state, state.race.baseLap * balance.cooldown.lapFactor * 2);
    expect(sim.cooling).toBe(0);
    state.cars.forEach((car, i) => {
      const shot = snapshot(state)[i];
      expect(shot.cooldown).toBe(false);
      expect(car.status === "finished" ? shot.progress : state.laps + 1).toBeCloseTo(state.laps + 1, 9);
    });
    // Nothing the race or the career reads moved: positions at the line, classification, events.
    expect(Array.from(sim.P)).toEqual(P);
    expect(raceOutput(state)).toBe(before);
  });
});

describe("RF-SIM-01 across eras (no SC before 1993, refuelling, VSC from 2015)", () => {
  it.each([1955, 1976, 2016])("runs a %i race to the flag with sane laps", (year) => {
    const { state } = stepRaceOf({ year, seed: `era-${year}` });
    runStepToFinish(state);
    expect(state.finished).toBe(true);
    expect(classificationOf(state).filter((row) => row.status === "finished").length).toBeGreaterThan(0);
    const neutralised = state.events.filter((event) => (year < 1993 && event.type === "sc") || (year < 2015 && event.type === "vsc"));
    expect(neutralised).toHaveLength(0);
    const racing = state.cars.flatMap((car) => car.history.filter((entry) => !entry.retired && !entry.pit && entry.lap > 1));
    expect(Math.max(...racing.map((entry) => entry.end - entry.start))).toBeLessThan(state.race.baseLap * 1.8);
  });
});

describe("SIM-4 battles, duel events and sector yellows (F1M24-GAMEPLAY §1.7; RF-SIM-07, RF-SIM-10, RF-CMD-03)", () => {
  /** The output a race leaves behind but what SIM-4 tells about it (duel events, battle radio). */
  const raceOnly = (state) =>
    JSON.stringify({
      rows: classificationOf(state),
      history: state.cars.map((car) => car.history),
      duels: state.duels,
      events: state.events.filter((event) => event.type !== "duel"),
      radio: state.radio.filter((message) => !String(message.kind).startsWith("battle-")),
      fastest: state.fastestLap,
    });

  it("reads its gaps from race-physics.json duel: the attack gap is the duel's trigger", () => {
    expect(BATTLE_BALANCE.attackGapSec).toBe(balance.duel.triggerSec);
    expect(BATTLE_BALANCE.followGapSec).toBeGreaterThan(BATTLE_BALANCE.attackGapSec);
    expect(BATTLE_BALANCE.followGapSec).toBe(balance.traffic.followWindowSec);
  });

  it("gives every car a battle state: attackers have a defender, nobody fights behind the safety car", () => {
    const { state } = stepRaceOf({ seed: "battle" });
    const sim = state._sim;
    const seen = new Set();
    const problems = [];
    let checked = 0;
    const attackMax = BATTLE_BALANCE.attackGapSec + BATTLE_BALANCE.hysteresisSec + 1e-9;
    const followMax = BATTLE_BALANCE.followGapSec + BATTLE_BALANCE.hysteresisSec + 1e-9;
    for (let k = 0; k < 4000 && !state.finished; k += 1) {
      stepOnce(state);
      const shot = snapshot(state);
      shot.forEach((car, i) => {
        const bad = (why) => problems.push(`${k}:${i}:${car.battle}:${why}`);
        if (!BATTLE_NAMES.includes(car.battle)) bad("unknown state");
        seen.add(car.battle);
        if ((!sim.active[i] || car.inPit) && car.battle !== "RUNNING") bad("inactive or in pit");
        if (state.safetyCar && car.battle !== "RUNNING") bad("behind the safety car");
        if (car.battle === "ATTACKING") {
          const target = sim.duelOther[i] >= 0 ? sim.duelOther[i] : sim.ahead[i];
          if (!(target >= 0)) bad("no target");
          if (sim.duelOther[i] < 0 && !(sim.gapS[i] <= attackMax)) bad("attack gap");
          if (target >= 0 && shot[target].battle !== "ATTACKING" && sim.active[target] && !shot[target].inPit && shot[target].battle !== "DEFENDING") bad("target not defending");
          checked += 1;
        }
        if ((car.battle === "FOLLOWING" || car.battle === "TRAIN") && !(sim.gapS[i] <= followMax)) bad("follow gap");
      });
    }
    expect(problems).toEqual([]);
    expect(checked).toBeGreaterThan(0);
    ["RUNNING", "FOLLOWING", "ATTACKING", "DEFENDING"].forEach((name) => expect(seen.has(name)).toBe(true));
  });

  describe("over whole races", () => {
    const races = ["e1", "e2", "e3"].map((seed) => runStepToFinish(stepRaceOf({ seed }).state));

    it("tells each attempt start → (alongside) → resolved, with its side, corner and attempt number", () => {
      let started = 0;
      let resolved = 0;
      let alongside = 0;
      races.forEach((state) => {
        const open = new Map();
        const corners = new Set(state._sim.tables.attacks.map((zone) => zone.corner));
        const problems = [];
        state.events.filter((event) => event.type === "duel").forEach((event) => {
          const key = `${event.carId}>${event.otherId}`;
          const bad = (why) => problems.push(`${key}@${event.t}:${event.phase}:${why}`);
          expect(["inside", "outside"]).toContain(event.side);
          expect(event.attempt).toBeGreaterThanOrEqual(1);
          expect(Number.isFinite(event.t)).toBe(true);
          expect(event.corner === null || corners.has(event.corner)).toBe(true);
          expect(["start", "alongside", "resolved"]).toContain(event.phase);
          if (event.phase === "start") {
            started += 1;
            open.set(key, event);
          } else if (event.phase === "alongside") {
            alongside += 1;
            if (!open.has(key)) bad("alongside without start");
          } else {
            if (!["passed", "defended", "contact"].includes(event.result)) bad(`result ${event.result}`);
            const start = open.get(key);
            if (!start) bad("resolved without start");
            else if (event.attempt !== start.attempt || !(event.t >= start.t)) bad("attempt or time mismatch");
            open.delete(key);
            resolved += 1;
          }
        });
        expect(problems).toEqual([]);
        // Only a fight still on at the flag may be left open.
        expect(open.size).toBeLessThanOrEqual(3);
      });
      expect(started).toBeGreaterThan(20);
      expect(resolved).toBeGreaterThan(started - 10);
      expect(alongside).toBeGreaterThan(0);
      const results = new Set(races.flatMap((state) => state.events.filter((event) => event.type === "duel" && event.phase === "resolved").map((event) => event.result)));
      expect(results.has("passed")).toBe(true);
      expect(results.has("defended")).toBe(true);
      // A second try on the same car counts up.
      expect(races.some((state) => state.events.some((event) => event.type === "duel" && event.attempt >= 2))).toBe(true);
    });

    it("confirms every pass at the next timing line after its corner (pass.confirmedAt)", () => {
      races.forEach((state) => {
        const budget = state.race.baseLap * 1.6;
        state.events.forEach((event, k) => {
          if (event.type !== "pass") return;
          // SIM-C2 (F1M24-CHINA §2.2 GS-04): a pass made on a DRS straight is told when it is made, after the cars have
          // moved on the straight: its start is the pair's last one before it, not the event just before.
          // SIM-C3 (VIEW-09): every pass fought for is told once it is made on the road (duel.js passTellStep), so its
          // start is likewise the pair's last one before it.
          const start = state.events.slice(0, k).reverse().find((row) => row.type === "duel" && row.phase === "start" && row.carId === event.carId && row.otherId === event.otherId);
          expect(start).toMatchObject({ type: "duel", phase: "start", carId: event.carId, otherId: event.otherId });
          expect(event.confirmedAt).toBeGreaterThanOrEqual(start.t);
          expect(event.confirmedAt - start.t).toBeLessThan(budget);
        });
      });
    });

    it("radios the player's drivers only, never the same thing twice inside its quiet time", () => {
      const battle = races.flatMap((state) => state.radio.filter((message) => String(message.kind).startsWith("battle-")).map((message) => ({ ...message, user: state.cars.find((car) => car.id === message.carId).isUser })));
      expect(battle.length).toBeGreaterThan(0);
      battle.forEach((message) => {
        expect(message.user).toBe(true);
        expect(["battle-gaining", "battle-closing", "battle-attack-failed", "battle-passed", "battle-defended", "battle-lost"]).toContain(message.kind);
      });
      races.forEach((state) => {
        const last = new Map();
        state.radio.filter((message) => String(message.kind).startsWith("battle-")).forEach((message) => {
          const key = `${message.kind}:${message.carId}`;
          const quiet = balance.radio.quietSec[message.kind.replace("battle-", "")];
          expect(last.has(key) ? message.t - last.get(key) : Infinity).toBeGreaterThanOrEqual(quiet);
          last.set(key, message.t);
          const gaining = message.kind === "battle-gaining";
          expect(gaining ? message.gap : -Infinity).toBeLessThanOrEqual(balance.radio.gaining.withinSec);
          expect(gaining ? message.gain : Infinity).toBeGreaterThanOrEqual(balance.radio.gaining.minGainSecPerLap);
        });
      });
    });
  });

  it("only tells: with the telling off the race is the same (RNF-05)", () => {
    const told = runStepToFinish(stepRaceOf({ seed: "tell" }).state);
    const { state } = stepRaceOf({ seed: "tell" });
    state._sim.duelLive = null;
    runStepToFinish(state);
    expect(state.events.some((event) => event.type === "duel")).toBe(false);
    expect(raceOnly(state)).toBe(raceOnly(told));
  });

  it("times the confirmation at the first timing line ahead (sector lines, then the line)", () => {
    const sim = { timingTau: [0.3, 0.7], tau: [0.25], budget: [100], clock: 10 };
    expect(confirmTimeOf(sim, 0, 0.28)).toBeCloseTo(15, 9);
    expect(confirmTimeOf(sim, 0, 0.35)).toBeCloseTo(55, 9);
    expect(confirmTimeOf(sim, 0, 0.8)).toBeCloseTo(85, 9);
    // The corner's exit past the line: the first sector line of the next lap.
    expect(confirmTimeOf({ ...sim, tau: [0.9] }, 0, 0.02)).toBeCloseTo(50, 9);
  });

  describe("amarilla-sector", () => {
    const yellowRace = () => {
      const { state } = stepRaceOf({ seed: "sector-yellow" });
      stepFor(state, 300);
      return state;
    };
    const sectorOf = (track, s) => (s >= track.sectors[2] ? 3 : s >= track.sectors[1] ? 2 : 1);

    it("waves {sector, marshalPost, double, s, until}: single for a car still going, its time from the measured spread", () => {
      const state = yellowRace();
      const sim = state._sim;
      const corner = sim.tables.attacks[0].corner;
      const running = state.cars.findIndex((car, i) => car.status === "running" && sim.incident[i] === null);
      waveYellow(state, corner, state.cars[running].id, sim.laps[running] + 1);
      sim.raceControl();
      const event = state.events.filter((item) => item.type === "yellow" && item.corner === corner).pop();
      const range = sim.cornerRange.get(corner);
      expect(event).toMatchObject({ marshalPost: corner, double: false, sector: expect.any(Number) });
      const track = circuitFor(state.race, state.year);
      expect(event.sector).toBe(sectorOf({ sectors: track.sectors || [0, 1 / 3, 2 / 3] }, range.apex));
      expect(event.s).toBeCloseTo(range.apex, 3);
      const held = event.until - event.t;
      const spread = balance.raceControl.yellow.holdSec.single;
      expect(held).toBeGreaterThanOrEqual(spread.p10 - 1e-6);
      expect(held).toBeLessThanOrEqual(spread.p90 + 1e-6);
      expect(state.yellowZones.find((zone) => zone.corner === corner)).toMatchObject({ sector: event.sector, double: false, marshalPost: corner });
    });

    it("double for a car stopped on the track, if the era has double yellows (era-defaults yellowFlags)", () => {
      const state = yellowRace();
      const sim = state._sim;
      const [first, second] = sim.tables.attacks.map((zone) => zone.corner).filter((corner, k, all) => all.indexOf(corner) === k);
      const stopped = state.cars.findIndex((car) => car.status === "running");
      state.cars[stopped].status = "retired";
      waveYellow(state, first, state.cars[stopped].id, state.lap + 1);
      sim.raceControl();
      const event = state.events.filter((item) => item.type === "yellow" && item.corner === first).pop();
      expect(event.double).toBe(true);
      const spread = balance.raceControl.yellow.holdSec.double;
      expect(event.until - event.t).toBeGreaterThanOrEqual(spread.p10 - 1e-6);
      expect(event.until - event.t).toBeLessThanOrEqual(spread.p90 + 1e-6);
      // An era without the double yellow: single, whatever the car.
      const regs = sim.rules.regulations;
      const saved = regs.yellowFlags;
      regs.yellowFlags = { double: false };
      try {
        waveYellow(state, second, state.cars[stopped].id, state.lap + 1);
        sim.raceControl();
        expect(state.events.filter((item) => item.type === "yellow" && item.corner === second).pop().double).toBe(false);
      } finally {
        regs.yellowFlags = saved;
      }
    });

    it("ninguna regla fuera de su era: every year has its yellow flags and its lap-deletion rule (pending)", () => {
      for (let year = 1950; year <= 2026; year += 1) {
        const regs = rulesFor(year).regulations;
        expect(typeof regs.yellowFlags.double).toBe("boolean");
        expect(["none", "double", "any"]).toContain(regs.yellowLapDeleted);
      }
      ["yellowFlags", "yellowLapDeleted"].forEach((field) => {
        const rows = eraDefaults.fields[field];
        expect(rows[0].from).toBe(1950);
        expect(rows[rows.length - 1].to).toBe(2026);
        rows.forEach((row, k) => {
          expect(row.from).toBe(k > 0 ? rows[k - 1].to + 1 : 1950);
          expect(row.status === "pending" ? typeof row.note : "source").toBe(row.status === "pending" ? "string" : "source");
        });
      });
    });
  });
});

describe("SIM-C3 the stop's stage in the pose and the pit-exit line (PIT-C2 handover, F1M24-CHINA §3.3; RF-SIM-12, RF-3D-04, RNF-05)", () => {
  const { state } = stepRaceOf({ seed: "pitc3" });
  const sim = state._sim;
  const lines = pitLinesFor(sim.lane.circuit);
  const stages = [];
  const standing = [];
  while (!state.finished) {
    stepOnce(state);
    snapshot(state).forEach((car, i) => {
      if (car.pitStage) stages.push({ i, t: sim.clock, ...car.pitStage, phase: car.pit && car.pit.phase });
      if (car.pit && car.pit.phase === "STATIONARY") standing.push({ i, stage: car.pit.stage, pose: car.pitStage });
    });
  }
  const exits = state.events.filter((event) => event.type === "pitExitLine");
  const stops = state.events.filter((event) => event.type === "pit");

  it("puts pitStage {name, t} in the pose while the car stands in its box, the same stage as pit.stage", () => {
    expect(stages.length).toBeGreaterThan(50);
    stages.forEach((row) => {
      expect(STAGES).toContain(row.name);
      expect(row.t).toBeGreaterThanOrEqual(0);
      expect(row.phase).toBe("STATIONARY");
    });
    standing.forEach((row) => expect(row.pose ? row.pose.name : null).toBe(row.stage));
    // Within a stage of one stop, its clock runs with the race clock (one step of dt between rows).
    for (let k = 1; k < stages.length; k += 1) {
      const a = stages[k - 1];
      const b = stages[k];
      const sameStage = a.i === b.i && a.name === b.name && Math.abs(b.t - a.t - sim.dt) < 1e-6;
      expect(!sameStage || b.t > a.t).toBe(true);
    }
    expect(snapshot(state).every((car) => car.pitStage === null)).toBe(true);
  });

  it("emits pitExitLine for every way out of the lane: the limiter off, then the end of the painted line, in order", () => {
    expect(lines).not.toBeNull();
    expect(stops.length).toBeGreaterThan(5);
    const byCar = new Map();
    exits.forEach((event) => {
      expect(["limit", "white"]).toContain(event.line);
      expect(Number.isFinite(event.t)).toBe(true);
      expect(event.t).toBeLessThanOrEqual(state.clock + 1e-9);
      if (!byCar.has(event.carId)) byCar.set(event.carId, []);
      byCar.get(event.carId).push(event);
    });
    const limits = exits.filter((event) => event.line === "limit").length;
    const whites = exits.filter((event) => event.line === "white").length;
    // One limiter-off per pass through the lane (stops, drive-throughs); the painted line when the circuit has one ahead.
    expect(limits).toBeGreaterThanOrEqual(stops.length);
    expect(lines.exit.pastLaneEnd > 0 ? whites : limits).toBe(limits);
    byCar.forEach((events) => {
      for (let k = 1; k < events.length; k += 1) {
        expect(events[k].t).toBeGreaterThanOrEqual(events[k - 1].t);
        expect(events[k].line !== "white" || events[k - 1].line === "limit").toBe(true);
      }
    });
  });

  it("is deterministic and draws nothing (RF-SIM-15): the same race, the same events", () => {
    const again = stepRaceOf({ seed: "pitc3" }).state;
    runStepToFinish(again);
    expect(JSON.stringify(again.events)).toBe(JSON.stringify(state.events));
  });
});
