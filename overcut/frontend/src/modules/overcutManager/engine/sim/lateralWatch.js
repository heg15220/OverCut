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
 */

import { fromQuickRace, snapshot, stepOnce } from "./index";
import { roomAt } from "./lateral";
import { weekend } from "./simTestKit";

const frac = (value) => value - Math.floor(value);

export const watchRace = ({ seed, year, teamId, minClear = 0.3 }) => {
  const w = weekend({ seed, year, teamId });
  const state = fromQuickRace(w.make(), { race: w.race });
  const sim = state._sim;
  const { carLength: L, carWidth: W } = sim.side.spec;
  const len = sim.tables.length;
  const seen = { steps: 0, pairs: 0, clear: 0, worstBox: Infinity, overlaps: 0, advanced: 0, overSpeed: 0, worstOver: 0, backwards: 0, rejoins: 0, rejoinsOnPitSide: 0, rejoinsAsPitExit: 0 };
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
      }
    }
  }
  return { state, seen };
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
