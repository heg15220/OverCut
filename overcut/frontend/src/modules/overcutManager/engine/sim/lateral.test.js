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
 *
 * SIM-C1 (F1M24-CHINA §3.3, GS-07 / GS-03; RF-3D-03, RF-SIM-06, criterio 7.2): the same races placed where the
 * live view draws them (engine/trackData.js positionAt) need no correction from the view's safety pass (closes
 * CAM-3), and outside a duel the follower keeps the era's time gap (race-sim.json traffic.minFollowSec).
 */

import physicsData from "../../data/balance/race-physics.json";
import simData from "../../data/balance/race-sim.json";
import { trackDataFor } from "../trackData";
import { fromQuickRace, snapshot, stepFor } from "./index";
import { LANE_NAMES, LATERAL, alongsideStep, bandEdgeCap, bandOfKmh, lateralSpecFor } from "./lateral";
import { ROLE } from "./duel";
import { sumOf, watchPasses } from "./straightPassWatch";
import { totalOf, watchRace } from "./lateralWatch";
import { weekend } from "./simTestKit";
import { minFollowSecOf } from "./stepRace";

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
  let follow;
  beforeAll(() => {
    const runs = Array.from({ length: RACES }, (_, k) => watchRace({ seed: `nos24-${k + 1}`, year: 2024, teamId: "ferrari" }));
    total = totalOf(runs);
    follow = runs.flatMap((run) => run.follow).sort((a, b) => a - b);
    // eslint-disable-next-line no-console
    console.log(`SIM-C1 2024: ${total.viewFrames} frames drawn on the line, ${total.viewCorrections} view corrections (first: ${total.viewExample ?? "none"}); side by side where drawn ${((total.drawnClear / total.drawnPairs) * 100).toFixed(2)} % with ≥ 0.3 m; follow gap at > 250 km/h: n ${follow.length}, p1 ${follow[Math.floor(follow.length * 0.01)]?.toFixed(3)} s, p5 ${follow[Math.floor(follow.length * 0.05)]?.toFixed(3)} s`);
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

  it("SIM-C1 GS-07: drawn on the racing line, the view's safety pass corrects nothing (CAM-3, criterio 7.2)", () => {
    expect(total.viewFrames).toBeGreaterThan(RACES * 1000);
    expect(total.viewCorrections).toBe(0);
  });

  it("SIM-C1 GS-03: outside a duel, the p5 of the follower's gap above 250 km/h is at least the era's minFollowSec", () => {
    const want = minFollowSecOf(simData.traffic, 2024);
    expect(want).toBeGreaterThan(0);
    expect(follow.length).toBeGreaterThan(10000);
    expect(follow[Math.floor(follow.length * 0.05)]).toBeGreaterThanOrEqual(want);
  });

  it("a car out of the pit lane rejoins on the lane's side as PIT_EXIT", () => {
    expect(total.rejoins).toBeGreaterThan(RACES);
    expect(total.rejoinsOnPitSide).toBe(total.rejoins);
    expect(total.rejoinsAsPitExit).toBe(total.rejoins);
  });
});

describe("SIM-C2 GS-06 side by side by corner band (race-physics.json lateral.alongsideByBand)", () => {
  const cfg = LATERAL.alongsideByBand;
  /** A race of Shanghai 2024 before the start, cars 0 (behind) and 1 (ahead) placed side by side at distance `d`. */
  const pair = (d, { latBehind = -1.2, latAhead = 1.2, gapM = 2 } = {}) => {
    const w = weekend({ seed: "band", circuit: "shanghai" });
    const state = fromQuickRace(w.make(), { race: w.race });
    const sim = state._sim;
    sim.ahead.fill(-1);
    sim.P[1] = d;
    sim.P[0] = d - gapM / sim.tables.length;
    sim.P0.set(sim.P);
    sim.lat[1] = latAhead;
    sim.lat[0] = latBehind;
    sim.ahead[0] = 1;
    sim.active[0] = 1;
    sim.active[1] = 1;
    sim.inPit[0] = 0;
    sim.inPit[1] = 0;
    return sim;
  };
  const firstBin = (sim, code) => sim.bandBin.findIndex((band) => band === code);

  it("has a band rule with a status and a source for each band, and the bands of race-physics.json", () => {
    expect(cfg.status).toBe("pending");
    ["slow", "medium", "fast"].forEach((band) => expect(cfg.source[band]).toEqual(expect.any(String)));
    expect(cfg.slow.yield).toBe(true);
    expect(cfg.fast.minAlongsideSec).toBeGreaterThanOrEqual(1.5);
    expect(bandOfKmh(physicsData.bands.slowMaxKmh - 1)).toBe("slow");
    expect(bandOfKmh(physicsData.bands.slowMaxKmh)).toBe("medium");
    expect(bandOfKmh(physicsData.bands.fastMinKmh + 1)).toBe("fast");
  });

  it("puts a pair in file at a slow corner's turn-in: the car behind lifts out of a duel, the one passed in a duel", () => {
    const probe = pair(0);
    const slow = firstBin(probe, 1);
    expect(slow).toBeGreaterThan(0);
    const d = (slow - 2) / probe.tables.M;
    const sim = pair(d);
    alongsideStep(sim, ROLE);
    expect(sim.bandYield[0]).toBe(1);
    expect(sim.bandYield[1]).toBe(-1);
    // In a duel the duel decides: the car ahead being passed is the one that lifts.
    const duel = pair(d);
    duel.duelRole[0] = ROLE.PASSING;
    duel.duelOther[0] = 1;
    duel.duelRole[1] = ROLE.YIELDING;
    alongsideStep(duel, ROLE);
    expect(duel.bandYield[1]).toBe(0);
    expect(duel.bandYield[0]).toBe(-1);
    // Not alongside (a car's width across not taken): nothing.
    const file = pair(d, { latBehind: 0, latAhead: 0 });
    alongsideStep(file, ROLE);
    expect(Array.from(file.bandYield).every((v) => v === -1)).toBe(true);
  });

  it("keeps a pair alongside in a fast corner, a pass there taking at least fast.minAlongsideSec", () => {
    const probe = pair(0);
    const fast = firstBin(probe, 3);
    expect(fast).toBeGreaterThan(0);
    const d = (fast + 1) / probe.tables.M;
    const sim = pair(d);
    alongsideStep(sim, ROLE);
    expect(Array.from(sim.bandYield).every((v) => v === -1)).toBe(true);
    sim.duelOther[0] = 1;
    sim.v[0] = 70;
    const L = sim.side.spec.carLength;
    const cap = bandEdgeCap(sim, 0, sim.P[0], 0.2);
    // Two car lengths of overlap crossed at the capped edge take minAlongsideSec.
    expect((2 * L) / (cap * 70)).toBeCloseTo(cfg.fast.minAlongsideSec, 6);
    expect(bandEdgeCap(sim, 0, sim.P[0], cap / 2)).toBe(cap / 2);
    // Out of a fast corner the edge is untouched.
    expect(bandEdgeCap(sim, 0, (firstBin(probe, 1) + 1) / probe.tables.M, 0.2)).toBe(0.2);
  });

  it("on 4 races of Shanghai 2024: slow corners in file at the apex, fast ones alongside with ≥ 0.3 m (RNF-05)", () => {
    const total = sumOf(Array.from({ length: 4 }, (_, k) => watchPasses({ seed: `band${k + 1}`, circuit: "shanghai" })));
    // eslint-disable-next-line no-console
    console.log(`SIM-C2 GS-06 Shanghai 2024: ${total.slowTurnInPairs} pairs side by side at a slow turn-in, ${total.slowApexPairs} still at the apex; ${total.fastPairs} pair-steps alongside in fast corners, ${total.fastClear} with ≥ 0.3 m`);
    expect(total.slowTurnInPairs).toBeGreaterThan(10);
    expect(total.slowApexPairs / total.slowTurnInPairs).toBeLessThanOrEqual(0.1);
    expect(total.fastPairs).toBeGreaterThan(10);
    expect(total.fastClear).toBe(total.fastPairs);
  }, 600000);
});
