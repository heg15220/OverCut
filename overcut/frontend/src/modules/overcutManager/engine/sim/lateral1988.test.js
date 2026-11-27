/**
 * SIM-2 (no-solape, F1M24-GAMEPLAY §2.9 and §3.3; RF-SIM-07, RF-SIM-01, SRS §6): the other half of
 * the 64-race check (lateral.test.js has 2024) - 32 races of 1988, with the era's 215 cm cars
 * (FIA technical regulations 1988, art. 3.1) on circuits without a mesh (procedural width).
 * SIM-C1 (F1M24-CHINA §3.3, GS-07; criterio 7.2): drawn on the racing line, no view correction (closes CAM-3).
 */

import { lateralSpecFor } from "./lateral";
import { totalOf, watchRace } from "./lateralWatch";

const RACES = 32;

describe("SIM-2 · 32 races of 1988: boxes never overlap, clearance side by side, no jumps", () => {
  let total;
  let runs;
  beforeAll(() => {
    runs = Array.from({ length: RACES }, (_, k) => watchRace({ seed: `nos88-${k + 1}`, year: 1988, teamId: "mclaren" }));
    total = totalOf(runs);
    // eslint-disable-next-line no-console
    console.log(`SIM-2 1988: ${RACES} races, ${total.steps} steps; ${total.pairs} pair-steps side by side, ${((total.clear / total.pairs) * 100).toFixed(2)} % with ≥ 0.3 m; worst box ${total.worstBox.toFixed(3)} m; ${total.rejoins} rejoins`);
  }, 600000);

  it("races with the era's car: 215 cm wide", () => {
    runs.forEach(({ state }) => expect(state._sim.side.spec.carWidth).toBe(lateralSpecFor(1988).carWidth));
    expect(lateralSpecFor(1988).carWidth).toBe(2.15);
  });

  it("SIM-C1 GS-07: drawn on the racing line, the view's safety pass corrects nothing (CAM-3)", () => {
    // eslint-disable-next-line no-console
    console.log(`SIM-C1 1988: ${total.viewFrames} frames, ${total.viewCorrections} view corrections (first: ${total.viewExample ?? "none"})`);
    expect(total.viewFrames).toBeGreaterThan(RACES * 1000);
    expect(total.viewCorrections).toBe(0);
  });

  it("distance between boxes ≥ 0 at every step", () => {
    expect(total.overlaps).toBe(0);
    expect(total.worstBox).toBeGreaterThanOrEqual(-1e-6);
  });

  it("side by side, at least 0.3 m between flanks in 99 % of the steps", () => {
    expect(total.pairs).toBeGreaterThan(1000);
    expect(total.clear / total.pairs).toBeGreaterThanOrEqual(0.99);
  });

  it("each step a car moves at most v·dt along the road, never backwards", () => {
    expect(total.advanced).toBeGreaterThan(100000);
    expect(total.example ?? "none").toBe("none");
    expect(total.overSpeed).toBe(0);
    expect(total.backwards).toBe(0);
  });

  it("a car out of the pit lane rejoins on the lane's side as PIT_EXIT", () => {
    expect(total.rejoins).toBeGreaterThan(RACES);
    expect(total.rejoinsOnPitSide).toBe(total.rejoins);
    expect(total.rejoinsAsPitExit).toBe(total.rejoins);
  });
});
