/**
 * Mutual detection and no overlap (RF-SIM-07, RF-SIM-01, RF-3D-03; SIM-2 / `no-solape` of
 * docs/manager/F1M24-GAMEPLAY.md §2.9, SIM-FISICA §3.1).
 *
 * Every car on the road is a box `carWidth × carLength` of its era (FIA technical regulations,
 * data/balance/race-physics.json `lateral.eras`) centred on its place: `P` along the circuit and
 * `lat` across it, measured from the racing line (+ to the right of travel, the sense of
 * engine/trackData.js `line`). Three rules keep the boxes apart without moving anybody by hand:
 *
 *   1. along   a car may only close to less than a car's length of a neighbour ahead if the two
 *              are already a car's width apart sideways (`gateBoxes`); otherwise it lifts to the
 *              speed that keeps it nose to tail. Nobody jumps forward (ΔP ≤ v·dt).
 *   2. across  each car heads for its target (racing line, attack, defence, yield, run wide, pit
 *              exit) with a limited lateral speed and acceleration (`maxRate`, `maxAccel`), inside
 *              the measured asphalt of splines.json (half widths less half the car and
 *              `edgeClearanceMetres`). Neighbours within a car's length keep
 *              `carWidth + clearanceMetres` between centres, pushed apart within the same speed
 *              limit and never swapping sides (`stepLateral`).
 *   3. never   if the asphalt or the speed limit leave no room, the pair keeps last step's places,
 *              which by rule 1 were a car's width apart: boxes never overlap.
 *
 * A car leaving the pit lane rejoins on the pit side of the road and stays there for
 * `pitExit.holdMetres` (PIT_EXIT); it waits at the end of the lane while that spot is taken
 * (`exitBlocked`). Deterministic (RF-SIM-15): no draws, fixed processing order, typed arrays
 * allocated once (RNF-01). Every number comes from race-physics.json `lateral` (RNF-07).
 */

import physicsData from "../../data/balance/race-physics.json";
import { trackDataFor } from "../trackData";

export const LATERAL = physicsData.lateral;

/** WP4 (SIM-FISICA §3.1): what each car is doing sideways, for the view (snapshot.lane). */
export const LANE = { RACING: 0, ATTACK_IN: 1, ATTACK_OUT: 2, DEFEND: 3, ALONGSIDE: 4, YIELD: 5, WIDE: 6, PIT: 7, PIT_EXIT: 8 };
export const LANE_NAMES = ["racing", "attack-inside", "attack-outside", "defend", "alongside", "yield", "wide", "pit", "pit-exit"];

const frac = (value) => value - Math.floor(value);

/** SRS §6: the era's car box (FIA technical regulations), the gap kept between centres and the edge margin. */
export const lateralSpecFor = (year, data = LATERAL) => {
  const eras = data.eras;
  let era = eras.find((entry) => year >= entry.from && year <= entry.to);
  if (!era) era = year < eras[0].from ? eras[0] : eras[eras.length - 1];
  return {
    year,
    carWidth: era.carWidth,
    carLength: era.carLength,
    clearance: data.clearanceMetres,
    separation: era.carWidth + data.clearanceMetres,
    edge: era.carWidth / 2 + data.edgeClearanceMetres,
  };
};

/**
 * The room across the road for the sim of `track` in `year`: per centreline sample, how far left
 * (`lo`, negative) and right (`hi`) of the racing line a car's centre may go, from the measured half
 * widths (trackData wl/wr, procedural default otherwise), and the per-car lateral state.
 */
export const lateralSetup = (track, year, n, data = LATERAL) => {
  const spec = lateralSpecFor(year, data);
  const td = trackDataFor(track);
  const m = td.line.length;
  const lo = new Float64Array(m);
  const hi = new Float64Array(m);
  // Never closer to the edge than the view's own clamp (three/racingLine.js marginM).
  const edge = Math.max(spec.edge, td.marginM ?? 0);
  for (let k = 0; k < m; k += 1) {
    let a = -(td.wl[k] - edge) - td.line[k];
    let b = td.wr[k] - edge - td.line[k];
    if (a > b) {
      const mid = (a + b) / 2;
      a = mid;
      b = mid;
    }
    lo[k] = a;
    hi[k] = b;
  }
  return {
    spec,
    data,
    lo,
    hi,
    m,
    source: td.source,
    // Same sense as the lateral offset (components/raceClock.js garages, engine/trackGeometry.js).
    pitSide: track.pit && (track.pit.side === 1 || track.pit.side === -1) ? track.pit.side : track.clockwise === false ? -1 : 1,
    nV: new Float64Array(n),
    prev: new Float64Array(n),
    target: new Float64Array(n),
    exitAt: new Float64Array(n).fill(-1),
    exitWait: new Float64Array(n),
    shift: new Float64Array(n),
    order: new Int32Array(n),
  };
};

const cellOf = (G, d) => Math.min(G.m - 1, (frac(d) * G.m) | 0);

/** How far a car's centre may go to the right (`sign` > 0) or left of the line at distance share `d` (metres, signed). */
export const roomAt = (G, d, sign) => {
  const k = cellOf(G, d);
  return sign > 0 ? G.hi[k] : G.lo[k];
};

const clampAt = (G, d, value) => {
  const k = cellOf(G, d);
  return value < G.lo[k] ? G.lo[k] : value > G.hi[k] ? G.hi[k] : value;
};

/**
 * Rule 1: the furthest `P1` car `i` may reach this step without its box running into one ahead
 * that is not a car's width away sideways. Cars ahead are read where they already are (they move
 * first, front to back); their lateral is last step's, the same the lateral step starts from.
 */
export const gateBoxes = (sim, i, P1) => {
  const G = sim.side;
  const len = sim.tables.length;
  // A millimetre more than the box, so that rounding never leaves two noses a hair inside each other.
  const L = (G.spec.carLength + 1e-3) / len;
  const W = G.spec.carWidth;
  const P0 = sim.P0[i];
  const reach = P1 - P0 + L;
  let limit = P1;
  let k = sim.ahead[i];
  for (let guard = 0; k >= 0 && k !== i && guard < sim.ringSize; guard += 1) {
    // Start-of-step order is sorted, so the walk stops at the first car out of reach.
    if (frac(sim.P0[k] - P0) > reach) break;
    if (sim.active[k] && sim.inPit[k] === 0) {
      const dl = sim.lat[i] - sim.lat[k];
      if (dl < W && dl > -W) {
        const cap = P0 + frac(sim.P[k] - P0) - L;
        if (cap < limit) limit = cap;
      }
    }
    k = sim.ahead[k];
  }
  return limit > P0 ? limit : P0;
};

/** Where on the road the pit exit puts a car: the edge on the lane's side. */
const exitLatAt = (G, d) => roomAt(G, d, G.pitSide);

/** Is the spot where car `i` would rejoin at `P` taken by a car on the road (a box within the gap kept)? */
export const exitBlocked = (sim, i, P) => {
  const G = sim.side;
  const len = sim.tables.length;
  const lat = exitLatAt(G, P);
  const L = G.spec.carLength;
  // Every car on the road, also one that came out of the lane earlier in this same step.
  for (let j = 0; j < sim.n; j += 1) {
    if (j === i || !sim.active[j] || sim.inPit[j] !== 0) continue;
    const ahead = frac(sim.P[j] - P) * len;
    if (ahead >= L && ahead <= len - L) continue;
    if (Math.abs(sim.lat[j] - lat) < G.spec.separation) return true;
  }
  return false;
};

/** Car `i` is back on the road from the pit lane at `P`: on the pit side, PIT_EXIT until `pitExit.holdMetres` further on. */
export const rejoin = (sim, i) => {
  const G = sim.side;
  const lat = exitLatAt(G, sim.P[i]);
  sim.lat[i] = lat;
  G.prev[i] = lat;
  G.nV[i] = 0;
  G.exitAt[i] = sim.P[i];
  G.exitWait[i] = 0;
  sim.latState[i] = LANE.PIT_EXIT;
};

/** The direction of the next braking zone's corner after time share `tau` (+1 right-hander, -1 left). */
const nextTurnSign = (sim, tau) => {
  const t = tau - Math.floor(tau);
  let best = null;
  for (let z = 0; z < sim.tables.attacks.length; z += 1) {
    const attack = sim.tables.attacks[z];
    const ahead = attack.tau >= t ? attack.tau - t : attack.tau + 1 - t;
    if (best === null || ahead < best.ahead) best = { ahead, sign: attack.sign || 1 };
  }
  return best ? best.sign : 1;
};

/** Each car's target across the road and its lateral state (`roles` are duel.js ROLE.NONE). */
const targets = (sim, roleNone, mistake, yieldShare) => {
  const G = sim.side;
  const len = sim.tables.length;
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[k];
    if (!sim.active[i] || sim.inPit[i] !== 0) continue;
    const d = sim.P[i];
    let target;
    if (G.exitAt[i] >= 0 && (sim.P[i] - G.exitAt[i]) * len > G.data.pitExit.holdMetres) G.exitAt[i] = -1;
    if (sim.incident[i] && sim.wideSign[i]) {
      // WP8: a car running wide heads for the outside edge until it has paid its error.
      target = roomAt(G, d, sim.wideSign[i]) * mistake.edgeShare;
      sim.latState[i] = LANE.WIDE;
    } else if (sim.blueDelay[i] > 0) {
      // WP4 (SIM-FISICA §3.1): a car being lapped moves over to the outside of the next corner.
      target = roomAt(G, d, -nextTurnSign(sim, sim.tau[i])) * yieldShare;
      sim.latState[i] = LANE.YIELD;
    } else if (sim.unlapSide && sim.unlapSide[i] !== 0) {
      // SIM-5 (FIA art. 55.13): a lapped car let through behind the safety car goes by off the line; the cars on the
      // lead lap stay on it (safetyCar.js, race-sim.json safetyCar.sc.unlapLateralShare).
      target = roomAt(G, d, sim.unlapSide[i]) * sim.unlapShare;
      sim.latState[i] = LANE.ATTACK_OUT;
    } else if (sim.duelRole[i] !== roleNone) {
      target = sim.latTarget[i];
    } else if (G.exitAt[i] >= 0) {
      // SIM-FISICA §3.1 lane PIT_EXIT: on the pit side until the exit is behind.
      target = exitLatAt(G, d);
      sim.latState[i] = LANE.PIT_EXIT;
    } else {
      target = 0;
      sim.latState[i] = LANE.RACING;
    }
    G.target[i] = clampAt(G, d, target);
  }
};

/** Rate- and acceleration-limited move toward the target (SIM-FISICA §3.1 `nV`). */
const steer = (sim, i, dt) => {
  const G = sim.side;
  const { maxRate, maxAccel } = G.data;
  const diff = G.target[i] - sim.lat[i];
  const dist = Math.abs(diff);
  const want = dist < 1e-9 ? 0 : Math.sign(diff) * Math.min(maxRate, Math.sqrt(2 * maxAccel * dist));
  const dv = want - G.nV[i];
  const step = maxAccel * dt;
  let v = G.nV[i] + (dv > step ? step : dv < -step ? -step : dv);
  let move = v * dt;
  if ((diff >= 0 && move > diff) || (diff <= 0 && move < diff)) {
    move = diff;
    v = 0;
  }
  G.nV[i] = v;
  return sim.lat[i] + move;
};

/** Neighbours in road order (insertion sort on the distance share, nearly sorted already). */
const roadOrder = (sim) => {
  const order = sim.side.order;
  const P = sim.P;
  let size = 0;
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[k];
    if (sim.active[i] && sim.inPit[i] === 0) order[size++] = i;
  }
  for (let a = 1; a < size; a += 1) {
    const value = order[a];
    const key = frac(P[value]);
    let b = a - 1;
    while (b >= 0 && frac(P[order[b]]) > key) {
      order[b + 1] = order[b];
      b -= 1;
    }
    order[b + 1] = value;
  }
  return size;
};

/** Visit every pair of cars whose boxes overlap along the road (within a car's length), as (behind, ahead). */
const forOverlapping = (sim, size, visit) => {
  const order = sim.side.order;
  const len = sim.tables.length;
  const L = sim.side.spec.carLength;
  for (let a = 0; a < size; a += 1) {
    const i = order[a];
    for (let s = 1; s < size; s += 1) {
      const j = order[(a + s) % size];
      if (frac(sim.P[j] - sim.P[i]) * len >= L) break;
      if (visit(i, j) === false) return false;
    }
  }
  return true;
};

/**
 * Rules 2 and 3: one lateral step for the cars on the road. `roleNone` is duel.js ROLE.NONE;
 * the duel targets (sim.latTarget) and states are duel.js's.
 */
export const stepLateral = (sim, roleNone, mistake, yieldShare) => {
  const G = sim.side;
  const { dt } = sim;
  const W = G.spec.carWidth;
  const S = G.spec.separation;
  const budget = G.data.maxRate * dt;
  const lat = sim.lat;
  const prev = G.prev;
  targets(sim, roleNone, mistake, yieldShare);
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[k];
    if (!sim.active[i] || sim.inPit[i] !== 0) continue;
    prev[i] = lat[i];
    const free = steer(sim, i, dt);
    lat[i] = clampAt(G, sim.P[i], free);
    // How far the edge of the road moved this car (the line running close to the edge).
    G.shift[i] = Math.abs(lat[i] - free);
  }
  const size = roadOrder(sim);
  if (size < 2) return;
  // Push overlapping neighbours apart to the gap kept, each within its lateral speed and the asphalt.
  // Where the edge squeezes the pair, the other car may also move as far as the edge moved its
  // neighbour: the two keep their places relative to each other, the road narrows under them.
  let extra = 0;
  const room = (i, delta) => {
    const k = cellOf(G, sim.P[i]);
    const most = prev[i] + (delta > 0 ? budget + extra : -budget - extra);
    const bound = delta > 0 ? Math.min(G.hi[k], most) : Math.max(G.lo[k], most);
    return delta > 0 ? Math.max(0, bound - lat[i]) : Math.min(0, bound - lat[i]);
  };
  const push = (i, j) => {
    const before = prev[j] - prev[i];
    const sign = before > 0 ? 1 : before < 0 ? -1 : G.target[j] - G.target[i] >= 0 ? 1 : -1;
    const deficit = S - sign * (lat[j] - lat[i]);
    if (deficit <= 1e-9) return true;
    // A car let alongside at a car's width (rule 1) may open the clearance at once; a squeeze from the
    // edge passes on to the neighbour (and on through a group three wide).
    extra = Math.max(G.shift[i], G.shift[j]) + G.spec.clearance;
    G.shift[i] = extra;
    G.shift[j] = extra;
    // Half each way, the rest to whoever still has room.
    let mj = room(j, sign);
    let mi = room(i, -sign);
    const half = deficit / 2;
    let dj = sign > 0 ? Math.min(mj, half) : Math.max(mj, -half);
    let di = sign > 0 ? Math.max(mi, -half) : Math.min(mi, half);
    let left = deficit - Math.abs(dj) - Math.abs(di);
    if (left > 1e-9) {
      mj -= dj;
      mi -= di;
      const more = sign > 0 ? Math.min(mj, left) : Math.max(mj, -left);
      dj += more;
      left -= Math.abs(more);
      di += sign > 0 ? Math.max(mi, -left) : Math.min(mi, left);
    }
    lat[j] += dj;
    lat[i] += di;
    return true;
  };
  for (let pass = 0; pass < G.data.solverPasses; pass += 1) forOverlapping(sim, size, push);
  // Rule 3: a pair still closer than a car's width keeps last step's places.
  for (let guard = 0; guard <= size; guard += 1) {
    let reverted = false;
    forOverlapping(sim, size, (i, j) => {
      if (Math.abs(lat[j] - lat[i]) >= W - 1e-9) return true;
      if (lat[i] !== prev[i] || lat[j] !== prev[j]) {
        lat[i] = prev[i];
        lat[j] = prev[j];
        G.nV[i] = 0;
        G.nV[j] = 0;
        reverted = true;
      }
      return true;
    });
    if (!reverted) break;
  }
  for (let k = 0; k < size; k += 1) {
    const i = G.order[k];
    G.nV[i] = (lat[i] - prev[i]) / dt;
  }
};
