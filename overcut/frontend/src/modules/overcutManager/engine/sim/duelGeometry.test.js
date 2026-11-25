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
 */

import Ajv from "ajv";
import { runToFinish } from "../race";
import { entrantsFor, eraOf } from "../career";
import { createStepRace, fromQuickRace, runStepToFinish } from "./index";
import { SIM_MODE, advanceField, beginSessionLap, setOnTrack, setSessionYield, setStepMode, snapshot } from "./stepRace";
import { DUEL_GEOMETRY, duelGeometrySetup, fightOf, heldAttempt, pairOpen, resetFight, switchbackLeft } from "./duel";
import { fitsAbreast, lateralSpecFor } from "./lateral";
import { weekend } from "./simTestKit";
import physics from "../../data/balance/race-physics.json";
import schema from "../packs/schema/race-physics.schema.json";
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
      if (claimed.outcome === "pass") {
        expect(claimed.line).toBe("inside");
        expect(duel.victim).toBe(duel.defender);
      } else {
        expect(claimed.line).toBe("outside");
        expect(duel.victim).toBe(duel.attacker);
      }
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
        if (before && before.outcome === "defended") expect(duel.t - before.t).toBeGreaterThanOrEqual(G.attemptsPerDefender.pairCooldownSec - 0.26);
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
    // The car on its slow lap never holds up the one behind for good: everyone else still laps near its budget.
    a.lines.filter((line) => line.lap >= 2 && line.i !== 1).forEach((line) => expect(line.time).toBeLessThan(92 * 1.04));
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
