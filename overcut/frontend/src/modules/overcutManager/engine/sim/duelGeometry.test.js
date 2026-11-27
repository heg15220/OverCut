/**
 * SIM-8 duelo-geometrico and trafico-sesion (docs/manager/F1M24-GAMEPLAY.md §2.7, §3.3; SIM-FISICA §3.5;
 * RF-SIM-07, RF-STF-02, RF-WKD-02, RF-SIM-01, RF-SIM-15, RNF-05, RNF-07):
 *
 *   - the fight per pair: held attempts counted per defender, the pair's cool-down, the rest after too many,
 *     the switchbacks a fight has left, the counts starting again with a new fight;
 *   - the claim: a third car only where three of the era's boxes fit across the asphalt, one incident roll per
 *     claim with its geometry (entryInside, exitOutside, squeeze of the car on the outside by the winner inside);
 *   - passes per lap still the quick mode's (SRS 4.2) and the net position changes against f1db
 *     (driver-attributes.json measured.passes);
 *   - the step simulator in session mode: no duels, no pit wall, the session's own line, deterministic.
 *
 * SIM-C2 (docs/manager/F1M24-CHINA.md §2.2 GS-04 / VIEW-09, §3.1; RF-SIM-07, RF-SIM-08, RF-SIM-15, SRS 4.2, RNF-05,
 * RNF-07, SRS §6): the pass with DRS on the straight (STRAIGHT_PASS: pullOut → alongside → ahead) on 8 races of
 * Shanghai 2024 - most DRS passes done before the braking zone's board, alongside for at least minAlongsideSec, the
 * lane change in 0.8–1.8 s, no pass told before the attacker is in front at its confirmedAt, the passes per lap within
 * ±10 % of the step mode without it; none in a year without DRS (1988); deterministic.
 */

import Ajv from "ajv";
import { runToFinish } from "../race";
import { entrantsFor, eraOf } from "../career";
import { createStepRace, fromQuickRace, runStepToFinish } from "./index";
import { SIM_MODE, advanceField, beginSessionLap, setOnTrack, setSessionYield, setStepMode, snapshot } from "./stepRace";
import { DUEL_GEOMETRY, SP, SP_NAMES, duelGeometrySetup, fightOf, heldAttempt, pairOpen, resetFight, straightPassOf, switchbackLeft } from "./duel";
import { LATERAL, fitsAbreast, lateralSpecFor } from "./lateral";
import { weekend } from "./simTestKit";
import { sumOf, watchPasses } from "./straightPassWatch";
import physics from "../../data/balance/race-physics.json";
import schema from "../packs/schema/race-physics.schema.json";
import simSchema from "../packs/schema/race-sim.schema.json";
import raceSim from "../../data/balance/race-sim.json";
import drivers from "../../data/balance/driver-attributes.json";

const G = DUEL_GEOMETRY;

describe("SIM-8 race-physics.json duel.geometry (RNF-07)", () => {
  it("validates against its schema, with a source for every block", () => {
    const ajv = new Ajv({ allErrors: true });
    const valid = ajv.validate(schema, physics);
    expect(ajv.errors).toBeNull();
    expect(valid).toBe(true);
    Object.keys(G.source).forEach((key) => expect(G[key]).toBeDefined());
    // The claim never takes more cars than the race's own cap.
    expect(G.claim.maxCars).toBeLessThanOrEqual(raceSim.duel.maxClaim);
  });
});

describe("SIM-8 the fight per pair (SIM-FISICA §3.5 attempts[i][a])", () => {
  const n = 4;
  const fake = () => ({ _sim: { n, clock: 100, cooldownUntil: new Float64Array(n), balance: raceSim, ...duelGeometrySetup(n), switchTarget: new Int32Array(n).fill(-1), duelRole: new Uint8Array(n) }, race: { baseLap: 90 } });

  it("cools down the pair only, and rests the attacker after attemptsPerDefender.max held in a row", () => {
    const state = fake();
    const sim = state._sim;
    heldAttempt(state, 0, 1);
    expect(pairOpen(sim, 0, 1)).toBe(false);
    // Another car ahead may be tried at once; the global cool-down is not used for a held attempt.
    expect(pairOpen(sim, 0, 2)).toBe(true);
    expect(sim.cooldownUntil[0]).toBe(0);
    sim.clock += G.attemptsPerDefender.pairCooldownSec;
    expect(pairOpen(sim, 0, 1)).toBe(true);
    for (let k = 1; k < G.attemptsPerDefender.max; k += 1) {
      heldAttempt(state, 0, 1);
      sim.clock += G.attemptsPerDefender.pairCooldownSec;
    }
    // The max-th held attempt: a rest of restLaps base laps on that car.
    expect(pairOpen(sim, 0, 1)).toBe(false);
    sim.clock += G.attemptsPerDefender.restLaps * state.race.baseLap - G.attemptsPerDefender.pairCooldownSec - 1;
    expect(pairOpen(sim, 0, 1)).toBe(false);
    sim.clock += 1;
    expect(pairOpen(sim, 0, 1)).toBe(true);
    expect(sim.pairTries[0 * n + 1]).toBe(0);
  });

  it("gives a fight attemptsPerFight switchbacks, and a new fight its own", () => {
    const state = fake();
    const sim = state._sim;
    for (let k = 0; k < G.switchback.attemptsPerFight; k += 1) {
      expect(switchbackLeft(sim, 2, 3)).toBe(true);
      sim.pairSwitch[2 * n + 3] += 1;
    }
    expect(switchbackLeft(sim, 2, 3)).toBe(false);
    heldAttempt(state, 2, 3);
    resetFight(sim, 2);
    expect(switchbackLeft(sim, 2, 3)).toBe(true);
    expect(sim.pairTries[2 * n + 3]).toBe(0);
    // The pair's cool-down runs on through a new fight.
    expect(pairOpen(sim, 2, 3)).toBe(false);
  });

  it("reports the car's fight for the view, with no roll", () => {
    const state = fake();
    const sim = state._sim;
    expect(fightOf(sim, 0)).toBeNull();
    sim.switchTarget[0] = 1;
    expect(fightOf(sim, 0)).toBe("SWITCHBACK");
    sim.squeezeUntil[0] = sim.clock + 1;
    expect(fightOf(sim, 0)).toBe("SQUEEZED");
  });
});

describe("SIM-8 three cars abreast only where they fit (lateral.js fitsAbreast)", () => {
  it("needs (n−1)·(carWidth + clearanceMetres) between the edges' room", () => {
    const spec = lateralSpecFor(2024);
    const room = (width) => ({ spec, m: 1, lo: Float64Array.of(-width / 2), hi: Float64Array.of(width / 2) });
    expect(fitsAbreast(room(2 * spec.separation), 0.5, 3)).toBe(true);
    expect(fitsAbreast(room(2 * spec.separation - 0.01), 0.5, 3)).toBe(false);
    expect(fitsAbreast(room(spec.separation), 0.5, 2)).toBe(true);
  });
});

/** Pairs of classified cars in reverse order at the flag against the grid (scripts/measurePasses.js). */
const inversions = (state) => {
  const rows = state.cars.filter((car) => car.status === "finished" && car.grid);
  let count = 0;
  for (let a = 0; a < rows.length; a += 1) for (let b = a + 1; b < rows.length; b += 1) if ((rows[a].grid - rows[b].grid) * (rows[a].position - rows[b].position) < 0) count += 1;
  return { count, pairs: (rows.length * (rows.length - 1)) / 2 };
};

describe("SIM-8 the claim and the passes per lap (RF-SIM-07, SRS 4.2, f1db)", () => {
  const SEEDS = Array.from({ length: 16 }, (_, k) => `geo${k + 1}`);
  const runs = SEEDS.map((seed) => {
    const w = weekend({ seed });
    return { quick: runToFinish(w.make()), step: runStepToFinish(fromQuickRace(w.make(), { race: w.race })) };
  });
  const steps = runs.map((run) => run.step);
  const duels = steps.flatMap((state) => state.duels);

  it("keeps the quick mode's passes per lap (switchbacks apart), and the net changes near f1db's", () => {
    const passes = (state) => state.events.filter((event) => event.type === "pass" && !event.switchback).length;
    const laps = (state) => state.cars.reduce((sum, car) => sum + car.history.filter((entry) => !entry.retired).length, 0);
    const per = (key) => runs.reduce((sum, run) => sum + passes(run[key]), 0) / runs.reduce((sum, run) => sum + laps(run[key]), 0);
    const ratio = per("step") / per("quick");
    const share = (key) => {
      const all = runs.map((run) => inversions(run[key]));
      return all.reduce((sum, row) => sum + row.count, 0) / all.reduce((sum, row) => sum + row.pairs, 0);
    };
    const real = drivers.measured.passes.find((row) => row.era === "2022-2026" && row.circuitType === "RACE");
    // eslint-disable-next-line no-console
    console.log(`SIM-8 passes per car-lap quick ${per("quick").toFixed(4)} / step ${per("step").toFixed(4)} (ratio ${ratio.toFixed(3)}); inverted share quick ${share("quick").toFixed(3)} / step ${share("step").toFixed(3)} / f1db ${real.inversionShare}`);
    // The range of equivalence.test.js (passes per race, 64 races), here per lap run.
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
    expect(share("step") / real.inversionShare).toBeGreaterThan(0.5);
    expect(share("step") / real.inversionShare).toBeLessThan(1.6);
  });

  it("still claims corners three abreast on a circuit wide enough (the fit itself is tested above)", () => {
    const three = duels.filter((duel) => duel.claim === 3);
    expect(three.length).toBeGreaterThan(0);
    // A claim of three is two pairs fighting: the third car's attempt is logged with claim 3 as well.
    three.forEach((duel) => expect(duel.corner).not.toBeNull());
  });

  it("rolls one incident per claim with the corner's geometry, and a squeeze is never a touch", () => {
    const touches = duels.filter((duel) => duel.outcome === "incident");
    touches.forEach((duel) => expect(["entryInside", "exitOutside"]).toContain(duel.kind));
    // A touch on the outside is paid at the exit of the corner it was claimed at, after the claim.
    duels.forEach((duel, k) => {
      if (duel.outcome !== "incident" || duel.kind !== "exitOutside") return;
      const claim = duels.slice(0, k).reverse().find((row) => row.outcome === "claim-contact" && row.attacker === duel.attacker && row.defender === duel.defender);
      expect(claim).toBeDefined();
      expect(claim.line).toBe("outside");
      expect(claim.corner).toBe(duel.corner);
      expect(duel.t).toBeGreaterThanOrEqual(claim.t);
    });
    const squeezes = duels.filter((duel) => duel.outcome === "squeeze");
    expect(squeezes.length).toBeGreaterThan(0);
    squeezes.forEach((duel) => {
      expect(["back-out", "push-wide"]).toContain(duel.kind);
      const claimed = duels.find((row) => row.squeeze && row.attacker === duel.attacker && row.defender === duel.defender && row.corner === duel.corner && row.t <= duel.t);
      expect(claimed).toBeDefined();
      // The winner of the corner is on the inside; the one squeezed is the loser, on the outside.
      const passed = claimed.outcome === "pass";
      expect(claimed.line).toBe(passed ? "inside" : "outside");
      expect(duel.victim).toBe(passed ? duel.defender : duel.attacker);
    });
    // No contact event comes from a squeeze: every touch is an "incident" of the log.
    const crashes = steps.reduce((sum, state) => sum + state.events.filter((event) => event.type === "contact" && !event.turnOne).length, 0);
    expect(crashes).toBeLessThanOrEqual(touches.length);
  });

  it("never lets a pair try again within its cool-down, and gives each fight at most its switchbacks", () => {
    steps.forEach((state) => {
      const last = new Map();
      state.duels.forEach((duel) => {
        if (duel.outcome !== "defended" && duel.outcome !== "pass") return;
        const key = `${duel.attacker}>${duel.defender}`;
        const before = last.get(key);
        const gap = before && before.outcome === "defended" ? duel.t - before.t : Infinity;
        expect(gap).toBeGreaterThanOrEqual(G.attemptsPerDefender.pairCooldownSec - 0.26);
        last.set(key, duel);
      });
    });
    const tries = duels.filter((duel) => duel.outcome === "switchback" || duel.outcome === "switchback-failed");
    expect(tries.length).toBeGreaterThan(0);
    // Round trips (F1M24-GAMEPLAY §2.7, NOR–LEC): a pass answered by a switchback at the next exit.
    expect(duels.some((duel) => duel.outcome === "switchback")).toBe(true);
  });

  it("is deterministic (RF-SIM-15)", () => {
    const w = weekend({ seed: "geo1" });
    const again = runStepToFinish(fromQuickRace(w.make(), { race: w.race }));
    expect(JSON.stringify(again.duels)).toBe(JSON.stringify(runs[0].step.duels));
  });
});

describe("SIM-8 trafico-sesion: the step simulator in session mode (RF-WKD-02, RF-SIM-01, RF-SIM-06)", () => {
  /** A field on track in session mode: every car out at its own spot, `laps` flying laps each at `budgetOf(i)`. */
  const session = (seed, { budgetOf, steps = 2400, yieldCar = -1 } = {}) => {
    const { career, race } = weekend({ seed });
    const era = eraOf(career);
    const entrants = entrantsFor(career).slice(0, 8);
    const state = createStepRace({ race, era, year: career.year, entrants, grid: entrants.map((e) => e.id), seed: `${seed}::session` });
    const lines = [];
    setStepMode(state, SIM_MODE.SESSION, {
      onLine: (s, i, lap, t) => {
        lines.push({ i, lap, t: Math.round(t * 1000) / 1000, time: Math.round((t - s._sim.lapStart[i]) * 1000) / 1000 });
        beginSessionLap(s, i, lap + 1, t, budgetOf(i));
        return true;
      },
    });
    state.cars.forEach((car, i) => {
      // Spread round the lap, as cars leave the garage at different times.
      setOnTrack(state, i, { at: 0.02 + i * 0.11 });
      beginSessionLap(state, i, 1, 0, budgetOf(i) * (1 - (0.02 + i * 0.11)));
    });
    if (yieldCar >= 0) setSessionYield(state, yieldCar, true);
    for (let k = 0; k < steps; k += 1) advanceField(state);
    return { state, lines };
  };

  it("runs the cars on the trace with no duel, no pit wall and the session's own line", () => {
    const base = 92;
    const { state, lines } = session("ses1", { budgetOf: (i) => base + i * 0.2 });
    expect(state.duels).toHaveLength(0);
    expect(state.events.filter((event) => event.type === "pass" || event.type === "duel" || event.type === "pit")).toHaveLength(0);
    state._sim.inPit.forEach((v) => expect(v).toBe(0));
    // Full laps timed at the line: each car's budget, within the traffic it met (dirty air, tow).
    const full = lines.filter((line) => line.lap >= 2);
    expect(full.length).toBeGreaterThan(8);
    full.forEach((line) => {
      const budget = base + line.i * 0.2;
      expect(Math.abs(line.time / budget - 1)).toBeLessThan(0.03);
    });
    // The snapshot reads as a race's.
    const snap = snapshot(state);
    expect(snap).toHaveLength(state.cars.length);
    snap.forEach((car) => expect(car.fight).toBeNull());
  });

  it("lets a car by one giving way, and is deterministic by seed (RNF-05)", () => {
    const a = session("ses2", { budgetOf: (i) => (i === 1 ? 110 : 92), yieldCar: 1 });
    const b = session("ses2", { budgetOf: (i) => (i === 1 ? 110 : 92), yieldCar: 1 });
    expect(JSON.stringify(a.lines)).toBe(JSON.stringify(b.lines));
    expect(Array.from(a.state._sim.P)).toEqual(Array.from(b.state._sim.P));
    // The car on its slow lap never holds up the one behind for good: nobody else loses more than 4 % on two
    // laps running (one lap stuck while it is let by is a session's traffic), and everyone laps near its budget.
    const others = {};
    a.lines.filter((line) => line.lap >= 2 && line.i !== 1).forEach((line) => (others[line.i] = others[line.i] || []).push(line));
    Object.values(others).forEach((laps) => {
      laps.sort((x, y) => x.lap - y.lap);
      laps.slice(1).forEach((line, k) => expect(Math.min(line.time, laps[k].time)).toBeLessThan(92 * 1.04));
      expect(laps.reduce((sum, line) => sum + line.time, 0) / laps.length).toBeLessThan(92 * 1.02);
    });
  });

  it("puts the race back with the race mode", () => {
    const w = weekend({ seed: "ses3" });
    const state = fromQuickRace(w.make(), { race: w.race });
    setStepMode(state, SIM_MODE.SESSION);
    setStepMode(state, SIM_MODE.RACE);
    runStepToFinish(state);
    const plain = runStepToFinish(fromQuickRace(w.make(), { race: w.race }));
    expect(JSON.stringify(state.events)).toBe(JSON.stringify(plain.events));
  });
});

describe("SIM-C2 race-sim.json duel.straightPass (F1M24-CHINA §1.5, RNF-07)", () => {
  it("validates against its schema with a source for every value, and confirms a pass inside the traffic gap of every era", () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(simSchema, raceSim)).toBe(true);
    const sp = raceSim.duel.straightPass;
    Object.keys(sp).filter((key) => !["$comment", "enabled", "status", "source"].includes(key)).forEach((key) => expect(sp.source[key]).toEqual(expect.any(String)));
    expect(sp.status).toBe("pending");
    expect(sp.minAlongsideSec).toBeLessThanOrEqual(sp.alongsideTargetSec);
    expect(sp.alongsideTargetSec).toBeLessThanOrEqual(sp.maxAlongsideSec);
    // Ahead by confirmLengths before settleDuels would call the pass made (traffic.minGapMetres), in every era's box.
    LATERAL.eras.forEach((era) => expect(sp.confirmLengths * era.carLength).toBeLessThan(raceSim.traffic.minGapMetres));
  });

  it("names the phases for the snapshot and the fight (no roll)", () => {
    expect(SP_NAMES[SP.PULL_OUT]).toBe("pullOut");
    expect(SP_NAMES[SP.ALONGSIDE]).toBe("alongside");
    expect(SP_NAMES[SP.AHEAD]).toBe("ahead");
    const sim = { spPhase: Uint8Array.of(SP.NONE, SP.PULL_OUT, SP.ALONGSIDE, SP.AHEAD), switchTarget: Int32Array.of(-1, -1, -1, -1), duelRole: new Uint8Array(4), clock: 0 };
    expect([0, 1, 2, 3].map((i) => straightPassOf(sim, i))).toEqual([null, "pullOut", "alongside", "ahead"]);
    expect([0, 1, 2, 3].map((i) => fightOf(sim, i))).toEqual([null, "STRAIGHT_PASS", "STRAIGHT_PASS", null]);
  });
});

describe("SIM-C2 GS-04 / VIEW-09: the pass with DRS on the straight, 8 races of Shanghai 2024", () => {
  const SP_SEEDS = Array.from({ length: 8 }, (_, k) => `spc${k + 1}`);
  let runs;
  let total;
  let drsPasses;
  let quickPer;
  let stepPer;
  let offPer;
  const cfg = raceSim.duel.straightPass;
  beforeAll(() => {
    runs = SP_SEEDS.map((seed) => watchPasses({ seed, circuit: "shanghai" }));
    total = sumOf(runs);
    drsPasses = runs.flatMap((run) => run.state.duels.filter((duel) => duel.outcome === "pass" && duel.drs));
    const passes = (state) => state.events.filter((event) => event.type === "pass" && !event.switchback).length;
    const laps = (state) => state.cars.reduce((sum, car) => sum + car.history.filter((entry) => !entry.retired).length, 0);
    const quick = SP_SEEDS.map((seed) => runToFinish(weekend({ seed, circuit: "shanghai" }).make()));
    quickPer = quick.reduce((sum, state) => sum + passes(state), 0) / quick.reduce((sum, state) => sum + laps(state), 0);
    stepPer = runs.reduce((sum, run) => sum + passes(run.state), 0) / runs.reduce((sum, run) => sum + laps(run.state), 0);
    // The same races with the attempt left at the attack point (straightPass.enabled false): only where the pass happens changes.
    const offBalance = { ...raceSim, duel: { ...raceSim.duel, straightPass: { ...raceSim.duel.straightPass, enabled: false } } };
    const off = SP_SEEDS.map((seed) => {
      const w = weekend({ seed, circuit: "shanghai" });
      return runStepToFinish(fromQuickRace(w.make(), { race: w.race, balance: offBalance }));
    });
    offPer = off.reduce((sum, state) => sum + passes(state), 0) / off.reduce((sum, state) => sum + laps(state), 0);
    const made = drsPasses.filter((duel) => duel.sp && duel.sp.completed);
    // eslint-disable-next-line no-console
    console.log(`SIM-C2 Shanghai 2024: ${drsPasses.length} DRS passes, ${made.length} made on the straight; passes per car-lap quick ${quickPer.toFixed(4)} / step ${stepPer.toFixed(4)} / step without STRAIGHT_PASS ${offPer.toFixed(4)}; confirmed ${total.confirmed} (inverted ${total.inverted}), straight ${total.straightConfirmed} (inverted ${total.straightInverted})`);
  }, 600000);

  it("makes most DRS passes on the straight, ahead before the braking zone's board (≥ 50 %)", () => {
    expect(drsPasses.length).toBeGreaterThan(40);
    const early = drsPasses.filter((duel) => duel.sp && duel.sp.completed && duel.sp.aheadBeforeBrakeM >= cfg.completeBeforeBrakeM);
    expect(early.length / drsPasses.length).toBeGreaterThanOrEqual(0.5);
  });

  it("keeps the two alongside for at least minAlongsideSec in ≥ 80 % of the DRS passes", () => {
    const along = drsPasses.filter((duel) => duel.sp && duel.sp.alongsideSec >= cfg.minAlongsideSec);
    expect(along.length / drsPasses.length).toBeGreaterThanOrEqual(0.8);
  });

  it("changes lane (a car's width across) in 0.8–1.8 s", () => {
    const lane = drsPasses.filter((duel) => duel.sp && duel.sp.laneSec > raceSim.step.dt).map((duel) => duel.sp.laneSec);
    expect(lane.length).toBeGreaterThan(20);
    expect(lane.filter((sec) => sec >= 0.8 && sec <= 1.8).length / lane.length).toBeGreaterThanOrEqual(0.8);
  });

  it("never tells a pass before the attacker is in front: 0 inverted at confirmedAt, and in front all through `ahead`", () => {
    expect(total.straightConfirmed).toBeGreaterThan(40);
    expect(total.example ?? "none").toBe("none");
    expect(total.straightInverted).toBe(0);
    expect(total.aheadSteps).toBeGreaterThan(1000);
    expect(total.aheadWrong).toBe(0);
  });

  it("only moves where the pass happens: the passes per lap within ±10 % of the step mode without it (SRS 4.2)", () => {
    // Against the quick mode the range is equivalence.test.js's (Bahrain, 128 races); Shanghai's own step/quick
    // ratio is above it with or without STRAIGHT_PASS on these 8 seeds, so the check here is against the step mode.
    expect(stepPer / offPer).toBeGreaterThan(0.9);
    expect(stepPer / offPer).toBeLessThan(1.1);
  });

  it("is deterministic, and watching does not change the race (RF-SIM-15, RNF-05)", () => {
    const w = weekend({ seed: SP_SEEDS[0], circuit: "shanghai" });
    const plain = runStepToFinish(fromQuickRace(w.make(), { race: w.race }));
    expect(JSON.stringify(plain.duels)).toBe(JSON.stringify(runs[0].state.duels));
    expect(JSON.stringify(plain.events)).toBe(JSON.stringify(runs[0].state.events));
  });

  it("drives none in a year without DRS (1988, SRS §6)", () => {
    const { state } = watchPasses({ seed: "spc1988", year: 1988, teamId: "mclaren", circuit: null });
    expect(state.duels.filter((duel) => duel.sp || duel.straight)).toHaveLength(0);
    expect(state.events.filter((event) => event.straight)).toHaveLength(0);
  });
});
