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
import { weekend } from "./simTestKit";

const stepRaceOf = (options) => {
  const w = weekend(options);
  return { ...w, state: fromQuickRace(w.make(), { race: w.race }) };
};

const KNOWN_EVENTS = new Set([
  "pass", "mistake", "issue", "lead", "pit", "dnf", "sc", "vsc", "sc-in", "rain", "drying", "fastest", "contact", "swap", "flag", "call",
  // RF-SIM-10 race control, shared with the quick mode.
  "yellow", "investigation", "no-action", "penalty", "penalty-served", "penalty-applied", "red", "restart", "grid-penalty",
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
