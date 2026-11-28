/**
 * Test helper for SIM-C3 (docs/manager/F1M24-CHINA.md §2.2 GS-05 / VIEW-09, §3.3; RF-SIM-07, RF-SIM-09, RF-SIM-15, RNF-05):
 * the order watcher. A step race run step by step, as lateralWatch.js does for the boxes, looking at the race order:
 * every pair of cars still racing whose order on the road (the distance run, `sim.P`, the timing's own order) flips in
 * a step must have a cause in that step, from the state before or after it:
 *
 *   duel      the two are in a duel with each other (a pass, a switchback, a team order, a straight pass), or a
 *             pass / swap event between them is told in the step;
 *   pit       one of the two is in the pit lane, or leaves it this step;
 *   incident  one of the two pays an error or a contact (delay, spin, off the road, recovering), is squeezed on an
 *             exit, or an error, contact or retirement of one of them is told in the step;
 *   blue      one of the two pays a blue flag's lift (lapped traffic);
 *   start     the first lap (the grid and the first corner run on their own plan, incidents.js turn one);
 *   neutral   a safety car, a VSC or a red flag (the train forms, lapped cars go by, the grid behind the red flag).
 *
 * A flip with none of them is `none` - an order change with no cause, which GS-05 wants at 0. It also gives, per pair,
 * the leader's laps of its flips (the ping-pong: changes per pair in 10 laps, re-passes in 2 laps); a flip undone within
 * `holdSec` (two cars side by side swapping the lead along the road) is counted as `jitter`, not as two changes, as the
 * timing loops OpenF1's positions come from would not show it (repass_from_openf1.py). And, for VIEW-09, every pass
 * event's `confirmedAt`: is its attacker in front then (`confirmed`, `inverted`)?
 *
 * Read only: it never draws or writes the race state (RNF-05) - a watched race equals an unwatched one.
 */

import { fromQuickRace, stepOnce } from "./index";
import { ROLE } from "./duel";
import { weekend } from "./simTestKit";

export const CAUSES = ["duel", "pit", "incident", "blue", "start", "neutral", "none"];

const PAIR_EVENTS = new Set(["pass", "swap"]);
const CAR_EVENTS = new Set(["mistake", "contact", "dnf", "issue", "puncture", "penalty"]);

/** Is car `i` paying something that slows it this step (an error, a touch, a squeeze)? */
const hurt = (sim, i) =>
  sim.delay[i] > 0 || sim.spinLeft[i] > 0 || sim.incident[i] !== null || sim.offM[i] > 0 || sim.recoverUntil[i] > sim.clock || (sim.squeezeDelay && sim.squeezeDelay[i] > 0) || (sim.squeezeUntil && sim.squeezeUntil[i] > sim.clock);

/** The duel links of the step: `i·n + j` for every car `i` fighting `j` (its duel, its straight pass). */
const linksOf = (sim, out) => {
  out.clear();
  for (let i = 0; i < sim.n; i += 1) {
    const o = sim.duelOther[i];
    if (o >= 0 && sim.duelRole[i] !== ROLE.NONE) out.add(i * sim.n + o).add(o * sim.n + i);
    const s = sim.spOther ? sim.spOther[i] : -1;
    if (s >= 0) out.add(i * sim.n + s).add(s * sim.n + i);
  }
  return out;
};

/**
 * Watch one race: `{ seed, year, teamId, circuit, balance, state }` (a prepared `state` is watched as given).
 * Returns `{ state, seen, pairs, examples }`: `seen` the flips by cause, `pairs` a Map `"i:j"` (i < j) → the leader's
 * laps of its flips in order, and up to five examples of the flips with no cause.
 */
export const watchOrder = ({ seed, year = 2024, teamId = "ferrari", circuit = null, balance, state: given, holdSec = 2 } = {}) => {
  let state = given;
  if (!state) {
    const w = weekend({ seed, year, teamId, circuit });
    state = fromQuickRace(w.make(), balance ? { race: w.race, balance } : { race: w.race });
  }
  const sim = state._sim;
  const n = sim.n;
  const P0 = new Float64Array(n);
  const run0 = new Uint8Array(n);
  const pit0 = new Uint8Array(n);
  const hurt0 = new Uint8Array(n);
  const blue0 = new Uint8Array(n);
  const links0 = new Set();
  const links1 = new Set();
  const id = new Map(state.cars.map((car, i) => [car.id, i]));
  const seen = { ...Object.fromEntries(CAUSES.map((cause) => [cause, 0])), jitter: 0, confirmed: 0, inverted: 0 };
  const held = new Map();
  const commit = (key, flip) => {
    if (!pairs.has(key)) pairs.set(key, []);
    pairs.get(key).push(flip);
  };
  const confirm = [];
  const invertedExamples = [];
  const pairs = new Map();
  const examples = [];
  const carHit = new Uint8Array(n);
  const pairHit = new Set();
  let read = state.events.length;
  while (!state.finished) {
    P0.set(sim.P);
    pit0.set(sim.inPit);
    for (let i = 0; i < n; i += 1) {
      run0[i] = sim.active[i] && state.cars[i].status === "running" && !sim.cool[i] ? 1 : 0;
      hurt0[i] = hurt(sim, i) ? 1 : 0;
      blue0[i] = sim.blueDelay[i] > 0 ? 1 : 0;
    }
    linksOf(sim, links0);
    const neutral0 = Boolean(state.safetyCar) || Boolean(sim.red);
    const started0 = sim.started;
    stepOnce(state);
    linksOf(sim, links1);
    carHit.fill(0);
    pairHit.clear();
    for (; read < state.events.length; read += 1) {
      const event = state.events[read];
      const a = id.get(event.carId);
      if (a === undefined) continue;
      if (CAR_EVENTS.has(event.type)) carHit[a] = 1;
      const b = id.get(event.otherId);
      if (b !== undefined && PAIR_EVENTS.has(event.type)) pairHit.add(a * n + b).add(b * n + a);
      // A touch hurts the car it was with as well.
      if (b !== undefined && event.type === "contact") carHit[b] = 1;
      // VIEW-09: a pass told with its confirmation time, to check then; a switchback answers the pass it undoes.
      if (event.type === "pass" && b !== undefined) {
        if (event.switchback) {
          for (let k = confirm.length - 1; k >= 0; k -= 1) if (confirm[k].a === b && confirm[k].b === a) confirm.splice(k, 1);
        }
        if (!event.switchback && Number.isFinite(event.confirmedAt)) confirm.push({ a, b, at: event.confirmedAt });
      }
    }
    // VIEW-09: at its confirmedAt the attacker is in front of the car it passed (unless one of the two is gone).
    for (let k = confirm.length - 1; k >= 0; k -= 1) {
      const c = confirm[k];
      if (sim.clock < c.at) continue;
      confirm.splice(k, 1);
      if (!sim.active[c.a] || !sim.active[c.b] || sim.inPit[c.a] !== 0 || sim.inPit[c.b] !== 0 || state.safetyCar || sim.red) continue;
      seen.confirmed += 1;
      if (sim.P[c.a] <= sim.P[c.b]) {
        seen.inverted += 1;
        if (invertedExamples.length < 5) invertedExamples.push(`${seed ?? ""} t=${sim.clock.toFixed(2)} ${state.cars[c.a].id} on ${state.cars[c.b].id}: ${((sim.P[c.a] - sim.P[c.b]) * sim.tables.length).toFixed(1)} m`);
      }
    }
    const neutral = neutral0 || Boolean(state.safetyCar) || Boolean(sim.red);
    const start = !started0 || sim.leaderLap <= 1;
    for (let i = 0; i < n; i += 1) {
      if (!run0[i] || !sim.active[i] || state.cars[i].status !== "running" || sim.cool[i]) continue;
      for (let j = i + 1; j < n; j += 1) {
        if (!run0[j] || !sim.active[j] || state.cars[j].status !== "running" || sim.cool[j]) continue;
        const before = P0[i] - P0[j];
        const after = sim.P[i] - sim.P[j];
        if (before === 0 || after === 0 || before > 0 === after > 0) continue;
        const k = i * n + j;
        let cause = "none";
        if (links0.has(k) || links1.has(k) || pairHit.has(k)) cause = "duel";
        else if (pit0[i] || pit0[j] || sim.inPit[i] || sim.inPit[j]) cause = "pit";
        else if (hurt0[i] || hurt0[j] || hurt(sim, i) || hurt(sim, j) || carHit[i] || carHit[j]) cause = "incident";
        else if (blue0[i] || blue0[j] || sim.blueDelay[i] > 0 || sim.blueDelay[j] > 0) cause = "blue";
        else if (start) cause = "start";
        else if (neutral) cause = "neutral";
        seen[cause] += 1;
        const key = `${i}:${j}`;
        // A flip undone within holdSec (side by side, the order swapping back and forth) is not a change of place,
        // as the timing - which reads the order at its loops - would not show one: both are dropped.
        const open = held.get(key);
        if (open && sim.clock - open.t < holdSec) {
          held.delete(key);
          seen.jitter += 1;
        } else {
          if (open) commit(key, open);
          held.set(key, { lap: sim.leaderLap, cause, t: sim.clock });
        }
        if (cause === "none" && examples.length < 5) {
          examples.push(`${seed ?? ""} t=${sim.clock.toFixed(2)} lap ${sim.leaderLap}: ${state.cars[i].id} / ${state.cars[j].id} (gap ${((after) * sim.tables.length).toFixed(2)} m, roles ${sim.duelRole[i]}/${sim.duelRole[j]}, others ${sim.duelOther[i]}/${sim.duelOther[j]}, lapDiff ${sim.lapDiff[i]}/${sim.lapDiff[j]})`);
        }
      }
    }
    held.forEach((flip, key) => {
      if (sim.clock - flip.t >= holdSec) {
        commit(key, flip);
        held.delete(key);
      }
    });
  }
  held.forEach((flip, key) => commit(key, flip));
  return { state, seen, pairs, examples, invertedExamples };
};

/**
 * GS-05: the most flips a pair makes in any `window` laps of the leader, for every pair that flipped at least once
 * outside the first lap and the neutralisations (the start and the safety car reorder by their own rules).
 */
export const pairWindowCounts = (pairs, window, { causes = ["duel", "pit", "incident", "blue", "none"] } = {}) => {
  const out = [];
  pairs.forEach((flips) => {
    const laps = flips.filter((flip) => causes.includes(flip.cause)).map((flip) => flip.lap);
    if (!laps.length) return;
    let best = 0;
    for (let a = 0, b = 0; b < laps.length; b += 1) {
      while (laps[b] - laps[a] >= window) a += 1;
      best = Math.max(best, b - a + 1);
    }
    out.push(best);
  });
  return out;
};

/**
 * GS-05 / VIEW-09 (repass_from_openf1.py `rePassedWithin1LapShare`): of the flips of the pairs (the causes given), the
 * share the same pair undoes within `laps` laps of the leader - `{ flips, undone, share }`.
 */
export const rePassShareOf = (pairs, laps = 1, { causes = ["duel", "incident", "none"] } = {}) => {
  let flips = 0;
  let undone = 0;
  pairs.forEach((all) => {
    const kept = all.filter((flip) => causes.includes(flip.cause));
    for (let k = 0; k < kept.length; k += 1) {
      flips += 1;
      if (k + 1 < kept.length && kept[k + 1].lap - kept[k].lap <= laps) undone += 1;
    }
  });
  return { flips, undone, share: flips ? undone / flips : 0 };
};

/** The `q` quantile (0..1) of a list of numbers (nearest rank). */
export const quantileOf = (values, q) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
};
