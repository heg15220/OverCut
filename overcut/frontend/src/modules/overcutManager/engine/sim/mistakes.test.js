/**
 * WP8 of docs/manager/SIM-FISICA.md (§3.6; RF-SIM-09): a driver's error is rolled per lap as in
 * the quick mode (race.js rollMistake, so the rate and the time lost match it - SRS 4.2) and
 * placed at a corner, where its kind decides how the time goes (race-physics.json mistake):
 * a spin stops the car (v = 0) before it gets going again, running wide takes it to the outside
 * edge, and while it pays and recovers it attacks nobody.
 */

import { runToFinish } from "../race";
import { ROLE, fromQuickRace, snapshot, stepOnce } from "./index";
import { weekend } from "./simTestKit";
import physicsData from "../../data/balance/race-physics.json";
import { roomAt } from "./lateral";

// Twenty-four races: errors are rare (~4 a race), and the ratio of two Poisson counts of ~50 has a
// standard error (~20 %) close to the band (RF-SIM-11 moved the draws; 12 seeds: 76/62). With the
// driver attributes (RF-STF-02) the first twelve gave 54/39 (0.72) and seeds 13-36 91/105 (1.15):
// noise, not the model. 24 seeds: 102/84. The band is unchanged.
const SEEDS = Array.from({ length: 24 }, (_, k) => `mk${k + 1}`);

/** A step race watched step by step: what each car did while it paid an error. */
const watch = (seed) => {
  const w = weekend({ seed });
  const state = fromQuickRace(w.make(), { race: w.race });
  const seen = { spinStopped: 0, spins: new Set(), wideMax: 0, wides: new Set(), duelsWhileRecovering: 0 };
  const sim = state._sim;
  while (!state.finished) {
    const before = Array.from(sim.duelRole);
    const recovering = Array.from({ length: sim.n }, (_, i) => sim.incident[i] !== null || sim.recoverUntil[i] > sim.clock);
    stepOnce(state);
    snapshot(state).forEach((car, i) => {
      if (car.incident === "spin") {
        seen.spins.add(car.id);
        if (car.v === 0) seen.spinStopped += 1;
      }
      if (car.incident === "wide" || car.incident === "spin") {
        seen.wides.add(car.id);
        // SIM-2: the outside edge is the measured asphalt's (lateral.js roomAt), as a share of the room there.
        const room = sim.wideSign[i] ? Math.abs(roomAt(sim.side, sim.P[i], sim.wideSign[i])) : 0;
        if (room > 0.5) seen.wideMax = Math.max(seen.wideMax, Math.abs(car.lateral) / room);
      }
      // An attack opened by a car that was paying or recovering from an error.
      if (recovering[i] && before[i] === ROLE.NONE && (sim.duelRole[i] === ROLE.PASSING || sim.duelRole[i] === ROLE.LOST) && sim.duelOther[i] >= 0 && sim.duelRole[sim.duelOther[i]] !== ROLE.NONE) {
        const other = sim.duelOther[i];
        // Being passed (YIELDING/HELD) is allowed; starting the attack is not.
        if (sim.duelRole[other] === ROLE.YIELDING || sim.duelRole[other] === ROLE.HELD) seen.duelsWhileRecovering += 1;
      }
    });
  }
  return { state, seen, quick: runToFinish(w.make()) };
};

describe("WP8 · errors placed at a corner, by kind (SIM-FISICA §3.6)", () => {
  const runs = SEEDS.map(watch);
  const count = (key) => runs.reduce((sum, run) => sum + run[key].events.filter((event) => event.type === "mistake").length, 0);

  it("as many errors as the quick mode (same roll per lap)", () => {
    const step = count("state");
    const quick = count("quick");
    expect(quick).toBeGreaterThan(10);
    expect(step / quick).toBeGreaterThan(0.75);
    expect(step / quick).toBeLessThan(1.33);
  });

  it("a spin stops the car; running wide takes it to the outside edge", () => {
    const spins = runs.reduce((sum, run) => sum + run.seen.spins.size, 0);
    const stopped = runs.reduce((sum, run) => sum + run.seen.spinStopped, 0);
    const wideMax = Math.max(...runs.map((run) => run.seen.wideMax));
    expect(spins).toBeGreaterThan(0);
    expect(stopped).toBeGreaterThan(0);
    expect(wideMax).toBeGreaterThan(physicsData.mistake.edgeShare * 0.8);
  });

  it("nobody attacks while paying an error or recovering from it", () => {
    expect(runs.reduce((sum, run) => sum + run.seen.duelsWhileRecovering, 0)).toBe(0);
  });
});
