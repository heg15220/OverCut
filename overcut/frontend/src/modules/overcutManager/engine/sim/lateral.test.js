/**
 * SIM-2 (no-solape, docs/manager/F1M24-GAMEPLAY.md §2.9 and §3.3; RF-SIM-07, RF-SIM-01, RF-3D-03,
 * RNF-05, RNF-07, SRS §6): mutual detection and no overlap in the step simulator.
 *
 *   - the car's box by era from the FIA technical regulations (race-physics.json lateral.eras);
 *   - the room across the road is the measured asphalt of splines.json, not a fixed half width;
 *   - 32 races of 2024 (this file) and 32 of 1988 (lateral1988.test.js), 64 in all: the boxes never
 *     overlap, side by side the flanks keep at least 0.3 m in 99 % of the steps, and nobody moves
 *     forward more than its own speed allows in a step (no jumps of P);
 *   - a car out of the pit lane rejoins on the lane's side (lane PIT_EXIT).
 */

import physicsData from "../../data/balance/race-physics.json";
import simData from "../../data/balance/race-sim.json";
import { trackDataFor } from "../trackData";
import { fromQuickRace, snapshot, stepFor } from "./index";
import { LANE_NAMES, LATERAL, lateralSpecFor } from "./lateral";
import { totalOf, watchRace } from "./lateralWatch";
import { weekend } from "./simTestKit";

const RACES = 32;

describe("SIM-2 data: the box of each era (RNF-07, SRS §6)", () => {
  it("covers every season from 1950 with contiguous eras and a source for each value", () => {
    const eras = LATERAL.eras;
    expect(eras[0].from).toBeLessThanOrEqual(1950);
    for (let k = 1; k < eras.length; k += 1) expect(eras[k].from).toBe(eras[k - 1].to + 1);
    expect(eras[eras.length - 1].to).toBeGreaterThanOrEqual(2026);
    eras.forEach((era) => {
      expect(era.source.carWidth.length).toBeGreaterThan(10);
      expect(era.source.carLength.length).toBeGreaterThan(10);
    });
    expect(LATERAL.clearanceMetres).toBeGreaterThanOrEqual(0.3);
  });

  it("uses the FIA overall width of the year: 215 cm to 1992, 200 cm 1993-97, 180 cm 1998-2016, 200 cm 2017-25, 190 cm from 2026", () => {
    expect(lateralSpecFor(1988).carWidth).toBe(2.15);
    expect(lateralSpecFor(1992).carWidth).toBe(2.15);
    expect(lateralSpecFor(1993).carWidth).toBe(2.0);
    expect(lateralSpecFor(1997).carWidth).toBe(2.0);
    expect(lateralSpecFor(1998).carWidth).toBe(1.8);
    expect(lateralSpecFor(2016).carWidth).toBe(1.8);
    expect(lateralSpecFor(2017).carWidth).toBe(2.0);
    expect(lateralSpecFor(2024).carWidth).toBe(2.0);
    expect(lateralSpecFor(2026).carWidth).toBe(1.9);
    expect(lateralSpecFor(2024).separation).toBeCloseTo(2.0 + LATERAL.clearanceMetres, 12);
  });

  it("has moved the lateral block out of race-sim.json (SIM-FISICA §3.10)", () => {
    expect(simData.lateral).toBeUndefined();
    expect(physicsData.lateral).toBe(LATERAL);
  });
});

describe("SIM-2 the room across the road is the measured asphalt (splines.json wl/wr)", () => {
  it("keeps the car's centre inside the edges less half the car and the edge clearance", () => {
    const { race, make } = weekend({ seed: "room" });
    const state = fromQuickRace(make(), { race });
    const G = state._sim.side;
    expect(G.source).toBe("mesh");
    const circuit = state._sim.lane.circuit;
    const td = trackDataFor(circuit);
    const edge = Math.max(G.spec.edge, td.marginM);
    let narrow = Infinity;
    let wide = 0;
    for (let k = 0; k < G.m; k += 1) {
      expect(G.lo[k]).toBeLessThanOrEqual(G.hi[k]);
      // Centre = line + lat, inside [-(wl - edge), wr - edge].
      expect(td.line[k] + G.hi[k]).toBeLessThanOrEqual(td.wr[k] - edge + 1e-9);
      expect(td.line[k] + G.lo[k]).toBeGreaterThanOrEqual(-(td.wl[k] - edge) - 1e-9);
      narrow = Math.min(narrow, G.hi[k] - G.lo[k]);
      wide = Math.max(wide, G.hi[k] - G.lo[k]);
    }
    // Not the old fixed ±5.5 m: the room changes along the lap.
    expect(wide - narrow).toBeGreaterThan(1);
  });

  it("names the pit states in the snapshot (F1M24-GAMEPLAY §1.7 lane[i])", () => {
    expect(LANE_NAMES).toEqual(expect.arrayContaining(["racing", "pit", "pit-exit"]));
    const { race, make } = weekend({ seed: "lanes" });
    const state = fromQuickRace(make(), { race });
    stepFor(state, 30);
    snapshot(state).forEach((car) => expect(LANE_NAMES).toContain(car.lane));
  });
});

describe("SIM-2 · 32 races of 2024: boxes never overlap, clearance side by side, no jumps", () => {
  let total;
  beforeAll(() => {
    const runs = Array.from({ length: RACES }, (_, k) => watchRace({ seed: `nos24-${k + 1}`, year: 2024, teamId: "ferrari" }));
    total = totalOf(runs);
    // eslint-disable-next-line no-console
    console.log(`SIM-2 2024: ${RACES} races, ${total.steps} steps; ${total.pairs} pair-steps side by side, ${((total.clear / total.pairs) * 100).toFixed(2)} % with ≥ 0.3 m; worst box ${total.worstBox.toFixed(3)} m; ${total.rejoins} rejoins`);
  }, 600000);

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
