/**
 * Test helper for SIM-2 (no-solape, docs/manager/F1M24-GAMEPLAY.md §2.9 and §3.3): a step race
 * watched step by step for what the boxes of the cars do (RF-SIM-07, RF-SIM-01, RNF-05).
 *
 *   boxes      for every pair of cars on the road, the distance between their boxes of the era
 *              (Frenet frame: along the road, less a car's length; across it, less a car's width);
 *              the larger of the two must never be negative (no overlap).
 *   clearance  for pairs side by side (less than a car's length apart along the road), the gap
 *              between their flanks; the share of those pair-steps with at least `minClear` metres.
 *   advance    for every car on the road at both ends of a step, the metres it moved against the
 *              speed it reports (ΔP ≤ v·dt + ε) and never backwards. Steps that start or end with a
 *              red flag are left out (the grid behind it is formed by placing the late cars in their
 *              slots, WP11).
 *   pit exit   every car back on the road from the lane rejoins on the lane's side, as PIT_EXIT.
 *   drawn      GS-07 (F1M24-CHINA §3.3 SIM-C1, cierra CAM-3; criterio 7.2 enmienda 12): the same cars placed where
 *              the live view draws them (engine/trackData.js positionAt = raceClock liveCarAt + racingLine
 *              onRacingLine) and passed through the view's safety pass (three/viewOverlap.js overlapPass) with
 *              the era's box: `viewCorrections` must be 0. `drawnClear`/`drawnPairs`: the pairs side by side
 *              above, their flanks where drawn (across the heading of the car behind) at least `minClear` apart.
 *   follow     GS-03: for each car outside a duel and without the DRS open, on the lap of the car ahead and above `followKmh`, once it has
 *              followed that car for `settleSec` (race-sim.json traffic.minFollowSec.settleSec: no pass between them), the time gap to it - centreline metres
 *              over its speed, the rule's own frame - for the p5 against minFollowSec.
 */

import { fromQuickRace, snapshot, stepOnce } from "./index";
import simData from "../../data/balance/race-sim.json";
import { roomAt } from "./lateral";
import { positionAt } from "../trackData";
import { boxSpecFor, overlapPass } from "../../three/viewOverlap";
import { weekend } from "./simTestKit";

const frac = (value) => value - Math.floor(value);

export const watchRace = ({ seed, year, teamId, minClear = 0.3, followKmh = 250, settleSec = simData.traffic.minFollowSec?.settleSec ?? 10, drawn = true }) => {
  const w = weekend({ seed, year, teamId });
  const state = fromQuickRace(w.make(), { race: w.race });
  const sim = state._sim;
  const { carLength: L, carWidth: W } = sim.side.spec;
  const len = sim.tables.length;
  const seen = { steps: 0, pairs: 0, clear: 0, worstBox: Infinity, overlaps: 0, advanced: 0, overSpeed: 0, worstOver: 0, backwards: 0, rejoins: 0, rejoinsOnPitSide: 0, rejoinsAsPitExit: 0, viewFrames: 0, viewCorrections: 0, drawnPairs: 0, drawnClear: 0 };
  const follow = [];
  const followOf = new Int32Array(sim.n).fill(-1);
  const followSince = new Float64Array(sim.n);
  const box = boxSpecFor(year);
  const circuit = sim.side.track;
  const drawnCars = [];
  const poseOf = [];
  const P0 = new Float64Array(sim.n);
  const pit0 = new Uint8Array(sim.n);
  const order = [];
  while (!state.finished) {
    P0.set(sim.P);
    pit0.set(sim.inPit);
    const started = sim.started;
    const red0 = Boolean(sim.red);
    stepOnce(state);
    seen.steps += 1;
    const lanes = snapshot(state);
    order.length = 0;
    for (let i = 0; i < sim.n; i += 1) {
      if (!sim.active[i] || sim.inPit[i] !== 0) continue;
      order.push(i);
      if (pit0[i] !== 0) {
        seen.rejoins += 1;
        const edge = roomAt(sim.side, sim.P[i], sim.side.pitSide);
        if (Math.abs(sim.lat[i] - edge) < 1e-9 || Math.sign(sim.lat[i]) === sim.side.pitSide) seen.rejoinsOnPitSide += 1;
        if (lanes[i].lane === "pit-exit") seen.rejoinsAsPitExit += 1;
        continue;
      }
      if (!started || red0 || sim.red) continue;
      const moved = (sim.P[i] - P0[i]) * len;
      seen.advanced += 1;
      if (moved < -1e-9) seen.backwards += 1;
      const over = moved - sim.v[i] * sim.dt;
      if ((over > 1e-6 || moved < -1e-9) && !seen.example) seen.example = `${seed} t=${sim.clock} car ${i} moved ${moved} v·dt ${sim.v[i] * sim.dt} sc ${Boolean(state.safetyCar)} lap ${sim.laps[i]} tau ${sim.tau[i]} delay ${sim.delay[i]}`;
      if (over > 1e-6) {
        seen.overSpeed += 1;
        if (over > seen.worstOver) seen.worstOver = over;
      }
    }
    order.sort((a, b) => frac(sim.P[a]) - frac(sim.P[b]));
    const size = order.length;
    if (drawn && started) {
      drawnCars.length = 0;
      for (let q = 0; q < size; q += 1) {
        const i = order[q];
        const pose = positionAt(circuit, sim.P[i], sim.lat[i]);
        drawnCars.push({ id: i, x: pose.x, z: pose.y, heading: pose.heading, along: frac(sim.P[i]) * len });
        poseOf[i] = drawnCars[q];
      }
      const result = overlapPass(drawnCars, box);
      seen.viewFrames += 1;
      seen.viewCorrections += result.corrections;
      if (result.corrections && !seen.viewExample) seen.viewExample = `${seed} t=${sim.clock} cars ${[...result.fixes.keys()].join(",")} depth ${result.worst.toFixed(3)}`;
      for (let q = 0; q < size; q += 1) {
        const a = drawnCars[q];
        const b = drawnCars[(q + 1) % size];
        if (size < 2) break;
        // GS-03: the follower's time gap (centreline metres over its speed, the rule's own frame) once it has
        // followed the same car outside a duel between them for `settleSec` (rows without a pass).
        const i = a.id;
        const k = b.id;
        const pair = !state.safetyCar && !sim.red && sim.drsOpen[i] === 0 && sim.ahead[i] === k && sim.lapDiff[i] === 0 && sim.duelOther[i] !== k && sim.duelOther[k] !== i;
        if (!pair) followOf[i] = -1;
        else if (followOf[i] !== k) {
          followOf[i] = k;
          followSince[i] = sim.clock;
        } else if (sim.clock - followSince[i] >= settleSec && sim.v[i] * 3.6 > followKmh) {
          follow.push((frac(sim.P[k] - sim.P[i]) * len) / sim.v[i]);
        }
      }
    }
    for (let a = 0; a < size; a += 1) {
      const i = order[a];
      for (let s = 1; s < size; s += 1) {
        const j = order[(a + s) % size];
        const along = frac(sim.P[j] - sim.P[i]) * len;
        if (along >= L) break;
        const across = Math.abs(sim.lat[j] - sim.lat[i]) - W;
        const box = Math.max(along - L, across);
        if (box < seen.worstBox) seen.worstBox = box;
        if (box < -1e-6) seen.overlaps += 1;
        seen.pairs += 1;
        if (across >= minClear - 1e-9) seen.clear += 1;
        if (drawn && started && poseOf[i] && poseOf[j]) {
          // The same pair where drawn: the gap between the flanks across the heading of the car behind.
          const pi = poseOf[i];
          const pj = poseOf[j];
          const flank = Math.abs(-(pj.x - pi.x) * Math.sin(pi.heading) + (pj.z - pi.z) * Math.cos(pi.heading)) - W;
          seen.drawnPairs += 1;
          if (flank >= minClear - 1e-9) seen.drawnClear += 1;
        }
      }
    }
  }
  follow.sort((a, b) => a - b);
  seen.follow = follow.length;
  return { state, seen, follow };
};

/** Sum of the counters of several watched races. */
export const totalOf = (runs) => {
  const out = {};
  runs.forEach(({ seen }) => {
    Object.entries(seen).forEach(([key, value]) => {
      if (typeof value === "string") out[key] = out[key] ?? value;
      else if (key === "worstBox") out[key] = Math.min(out[key] ?? Infinity, value);
      else if (key === "worstOver") out[key] = Math.max(out[key] ?? 0, value);
      else out[key] = (out[key] ?? 0) + value;
    });
  });
  return out;
};
