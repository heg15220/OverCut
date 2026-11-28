/**
 * SIM-C3 (docs/manager/F1M24-CHINA.md §2.2 GS-05 / VIEW-09 / AUD-C11 motor, §3.1, §3.3; RF-SIM-07, RF-SIM-09,
 * RF-SIM-15, SRS 4.2, RNF-05, RNF-07): hysteresis and contacts, closing SIM-8 of F1M24-GAMEPLAY.
 *
 *   - race-sim.json duel.rePass and race-reliability.json contact.crowd / confirmMetres validate against their schemas;
 *     the pure pieces (passedBy, rePassHeld, crowdFactor) do what they say;
 *   - on 32 races of Bahrain 2024 watched by the order watcher (orderWatch.js): no order change without a cause
 *     (duel, pit lane, incident, blue flag, start, neutralisation); at most 3 changes per pair in 10 laps (p95, OpenF1
 *     2023-2024: 3); at most one re-pass in 2 laps; 0 passes inverted at their confirmedAt; the share of passes undone
 *     within a lap near OpenF1's; the collision retirements within ±25 % of f1db 2022-2026; the passes per lap in the
 *     quick mode's range and the net position changes near f1db's; every duel touch tells whether it was seen
 *     (`confirmed`, AUD-C11); deterministic, and watching changes nothing.
 */

import Ajv from "ajv";
import { runToFinish } from "../race";
import { crowdFactor, measuredFor, RELIABILITY } from "../incidents";
import { fromQuickRace, runStepToFinish } from "./index";
import { contactConfirmed, duelGeometrySetup, passedBy, rePassHeld } from "./duel";
import { pairWindowCounts, quantileOf, rePassShareOf, watchOrder } from "./orderWatch";
import { weekend } from "./simTestKit";
import raceSim from "../../data/balance/race-sim.json";
import simSchema from "../packs/schema/race-sim.schema.json";
import relSchema from "../packs/schema/race-reliability.schema.json";
import drivers from "../../data/balance/driver-attributes.json";

const RE = raceSim.duel.rePass;

describe("SIM-C3 the data (RNF-07)", () => {
  it("validates race-sim.json and race-reliability.json against their schemas, with a source for each new value", () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(simSchema, raceSim)).toBe(true);
    expect(ajv.validate(relSchema, RELIABILITY)).toBe(true);
    ["rePassLaps", "rePassPaceSec"].forEach((key) => expect(RE.source[key]).toEqual(expect.any(String)));
    expect(RE.measured.rePassedWithin1LapShare).toBeGreaterThan(0);
    const crowd = RELIABILITY.contact.crowd;
    ["windowMetres", "byCars"].forEach((key) => expect(crowd.source[key]).toEqual(expect.any(String)));
    // One source for the three-wide touch: race-sim.json no longer has it.
    expect(raceSim.duel.incident.threeWide).toBeUndefined();
    expect(raceSim.duel.straightPass.chanceScale).toBeUndefined();
  });

  it("raises the touch with the crowd in the braking zone, never below the pair's", () => {
    expect(crowdFactor(2)).toBe(RELIABILITY.contact.crowd.byCars[0].factor);
    expect(crowdFactor(3)).toBeGreaterThan(crowdFactor(2));
    expect(crowdFactor(6)).toBe(crowdFactor(3));
  });
});

describe("SIM-C3 the cost of a pass (duel.rePass)", () => {
  const n = 3;
  const fake = (expected = [90, 90, 90]) => ({
    _sim: { n, clock: 100, balance: raceSim, ...duelGeometrySetup(n) },
    race: { baseLap: 90 },
    cars: expected.map((value) => ({ expected: value })),
  });

  it("holds the passed car off the one that passed it for rePassLaps base laps, unless it is faster by rePassPaceSec", () => {
    const state = fake();
    const sim = state._sim;
    passedBy(state, 1, 0);
    expect(rePassHeld(state, 1, 0)).toBe(true);
    expect(rePassHeld(state, 0, 1)).toBe(false);
    expect(rePassHeld(state, 1, 2)).toBe(false);
    sim.clock += RE.rePassLaps * 90 - 0.01;
    expect(rePassHeld(state, 1, 0)).toBe(true);
    sim.clock += 0.02;
    expect(rePassHeld(state, 1, 0)).toBe(false);
    // Faster by the margin: free to try again at once.
    const quick = fake([90, 90 - RE.rePassPaceSec, 90]);
    passedBy(quick, 1, 0);
    expect(rePassHeld(quick, 1, 0)).toBe(false);
  });

  it("lets the pass back undo the other car's hold", () => {
    const state = fake();
    passedBy(state, 1, 0);
    passedBy(state, 0, 1);
    expect(rePassHeld(state, 1, 0)).toBe(false);
    expect(rePassHeld(state, 0, 1)).toBe(true);
  });
});

/** Pairs of classified cars in reverse order at the flag against the grid (as duelGeometry.test.js). */
const inversions = (state) => {
  const rows = state.cars.filter((car) => car.status === "finished" && car.grid);
  let count = 0;
  for (let a = 0; a < rows.length; a += 1) for (let b = a + 1; b < rows.length; b += 1) if ((rows[a].grid - rows[b].grid) * (rows[a].position - rows[b].position) < 0) count += 1;
  return { count, pairs: (rows.length * (rows.length - 1)) / 2 };
};

describe("SIM-C3 GS-05 / VIEW-09: 32 races of Bahrain 2024 watched for the order", () => {
  const SEEDS = Array.from({ length: 32 }, (_, k) => `gs5-${k + 1}`);
  let runs;
  let quick;
  const ev = (states, test) => states.reduce((sum, state) => sum + state.events.filter(test).length, 0);
  beforeAll(() => {
    runs = SEEDS.map((seed) => watchOrder({ seed }));
    quick = SEEDS.map((seed) => runToFinish(weekend({ seed }).make()));
    const seen = runs.reduce((acc, run) => {
      Object.entries(run.seen).forEach(([key, value]) => (acc[key] = (acc[key] || 0) + value));
      return acc;
    }, {});
    // eslint-disable-next-line no-console
    console.log(`SIM-C3 order changes by cause ${JSON.stringify(seen)}`);
  }, 1800000);

  it("changes the order only by a duel, the pit lane or an incident (0 changes without a cause)", () => {
    const examples = runs.flatMap((run) => run.examples);
    expect(examples).toEqual([]);
    runs.forEach((run) => expect(run.seen.none).toBe(0));
    expect(runs.reduce((sum, run) => sum + run.seen.duel, 0)).toBeGreaterThan(500);
  });

  it("makes at most 3 changes per pair in 10 laps (p95, OpenF1 2023-2024: 3) and at most one re-pass in 2 laps", () => {
    const ten = runs.flatMap((run) => pairWindowCounts(run.pairs, 10));
    const two = runs.flatMap((run) => pairWindowCounts(run.pairs, 2, { causes: ["duel", "none"] }));
    // eslint-disable-next-line no-console
    console.log(`SIM-C3 pairs ${ten.length}: p95 per 10 laps ${quantileOf(ten, 0.95)} (max ${Math.max(...ten)}); in 2 laps over 2 changes ${two.filter((x) => x > 2).length}`);
    expect(quantileOf(ten, 0.95)).toBeLessThanOrEqual(RE.measured.p95PerPair10Laps);
    expect(Math.max(...ten)).toBeLessThanOrEqual(RE.measured.maxPerPair10Laps);
    // VIEW-09 «≤ 1 repase en 2 vueltas», read per pair as GS-05 reads its own (p99 here, stricter than its p95): the
    // rare third change comes from a car with real pace (duel.rePass.rePassPaceSec), which is allowed to go again.
    expect(quantileOf(two, 0.99)).toBeLessThanOrEqual(2);
    expect(two.filter((x) => x > 2).length / two.length).toBeLessThan(0.005);
  });

  it("undoes fewer passes within a lap than OpenF1 2023-2024 shows (no ping-pong, but switchbacks stay)", () => {
    const totals = runs.reduce((acc, run) => {
      const x = rePassShareOf(run.pairs, 1);
      return { flips: acc.flips + x.flips, undone: acc.undone + x.undone };
    }, { flips: 0, undone: 0 });
    const share = totals.undone / totals.flips;
    // eslint-disable-next-line no-console
    console.log(`SIM-C3 passes undone within a lap ${share.toFixed(3)} (OpenF1 ${RE.measured.rePassedWithin1LapShare})`);
    // No more ping-pong than the real races (whose share also holds timing-loop flicker and DRS pass-and-back on
    // the next straight), and the answer at the exit is still there (switchbacks).
    expect(share).toBeLessThan(RE.measured.rePassedWithin1LapShare);
    expect(totals.undone).toBeGreaterThan(0);
  });

  it("never tells a pass whose attacker is not in front at its confirmedAt (VIEW-09)", () => {
    const confirmed = runs.reduce((sum, run) => sum + run.seen.confirmed, 0);
    expect(confirmed).toBeGreaterThan(300);
    expect(runs.flatMap((run) => run.invertedExamples)).toEqual([]);
  });

  it("keeps the collision retirements within ±25 % of f1db 2022-2026, and tells whether each touch was seen (AUD-C11)", () => {
    const steps = runs.map((run) => run.state);
    const starts = steps.reduce((sum, state) => sum + state.cars.length, 0);
    const retirements = ev(steps, (event) => event.type === "dnf" && event.reason === "collision");
    const real = measuredFor(2024).incidentsPerCarRace.collision;
    const ratio = retirements / starts / (real.opening + real.later);
    const crashes = (event) => event.type === "contact" || (event.type === "dnf" && event.reason === "collision");
    const duelTouches = steps.flatMap((state) => state.events.filter((event) => crashes(event) && !event.turnOne && event.confirmed !== undefined));
    // eslint-disable-next-line no-console
    console.log(`SIM-C3 collision retirements ${retirements} in ${starts} starts (${ratio.toFixed(2)} of f1db); touches step ${ev(steps, crashes)} / quick ${ev(quick, crashes)}; duel touches seen ${duelTouches.filter((event) => event.confirmed).length}/${duelTouches.length}`);
    expect(ratio).toBeGreaterThan(0.75);
    expect(ratio).toBeLessThan(1.25);
    expect(duelTouches.length).toBeGreaterThan(0);
    duelTouches.forEach((event) => expect(typeof event.confirmed).toBe("boolean"));
  });

  it("keeps the passes per lap in the quick mode's range, and the net changes near f1db's", () => {
    const steps = runs.map((run) => run.state);
    const laps = (states) => states.reduce((sum, state) => sum + state.cars.reduce((s, car) => s + car.history.filter((entry) => !entry.retired).length, 0), 0);
    const per = (states, test) => ev(states, test) / laps(states);
    const ratio = per(steps, (event) => event.type === "pass" && !event.switchback) / per(quick, (event) => event.type === "pass");
    const share = (states) => {
      const all = states.map(inversions);
      return all.reduce((sum, row) => sum + row.count, 0) / all.reduce((sum, row) => sum + row.pairs, 0);
    };
    const real = drivers.measured.passes.find((row) => row.era === "2022-2026" && row.circuitType === "RACE");
    // eslint-disable-next-line no-console
    console.log(`SIM-C3 passes per car-lap step/quick ${ratio.toFixed(3)}; inverted share step ${share(steps).toFixed(3)} / quick ${share(quick).toFixed(3)} / f1db ${real.inversionShare}`);
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
    expect(share(steps) / real.inversionShare).toBeGreaterThan(0.5);
    expect(share(steps) / real.inversionShare).toBeLessThan(1.6);
  });

  it("is deterministic, and watching changes nothing (RF-SIM-15, RNF-05)", () => {
    const w = weekend({ seed: SEEDS[0] });
    const plain = runStepToFinish(fromQuickRace(w.make(), { race: w.race }));
    expect(JSON.stringify(plain.events)).toBe(JSON.stringify(runs[0].state.events));
    expect(JSON.stringify(plain.duels)).toBe(JSON.stringify(runs[0].state.duels));
  });

  it("marks a touch seen only with the two boxes together (contactConfirmed)", () => {
    const sim = runs[0].state._sim;
    const fakeSim = { tables: sim.tables, side: sim.side, P: Float64Array.of(0.5, 0.5), lat: Float64Array.of(0, sim.side.spec.carWidth) };
    expect(contactConfirmed(fakeSim, 0, 1)).toBe(true);
    fakeSim.P[1] = 0.5 + (sim.side.spec.carLength + 10) / sim.tables.length;
    expect(contactConfirmed(fakeSim, 0, 1)).toBe(false);
  });
});
