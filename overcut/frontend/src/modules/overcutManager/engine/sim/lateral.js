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
 * GS-07 / VIEW-08 (F1M24-CHINA §1.5, §3.3 SIM-C1; RF-3D-03, criterio 7.2): the boxes are also kept apart
 * where the cars are drawn - on the racing line (engine/trackData.js positionAt, the same placement as
 * the live view). Along the centreline two cars a box apart can be closer than a box on the line (the
 * inside of a tight corner, the line's own angle), so rule 1 also caps the advance at the last place
 * whose oriented box (separating axes, the era's width and length) is clear of the boxes ahead, rule 2
 * also pushes apart sideways a pair whose drawn boxes touch (side by side in a hairpin), and rule 3 also
 * undoes a sideways move that would sink two drawn boxes deeper into each other. Both frames
 * hold at once: the Frenet one the tests of SIM-2 measure and the drawn one the view shows (CAM-3).
 *
 * A car leaving the pit lane rejoins on the pit side of the road and stays there for
 * `pitExit.holdMetres` (PIT_EXIT); it waits at the end of the lane while that spot is taken
 * (`exitBlocked`). Deterministic (RF-SIM-15): no draws, fixed processing order, typed arrays
 * allocated once (RNF-01). Every number comes from race-physics.json `lateral` (RNF-07).
 */

import physicsData from "../../data/balance/race-physics.json";
import { lineAt, positionAt, trackDataFor } from "../trackData";

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
    // GS-07: the drawn frame - the circuit, the centreline reach beyond which two drawn boxes cannot
    // touch (their diagonal over the least stretch of an offset line), and each car's drawn pose,
    // remembered for the (P, lat) it was computed at.
    track,
    reach: drawnReachOf(track, td, lo, hi, spec),
    ...roughFrameOf(track, spec, lo, hi),
    memoP: new Float64Array(n).fill(NaN),
    memoLat: new Float64Array(n).fill(NaN),
    memoX: new Float64Array(n),
    memoY: new Float64Array(n),
    memoH: new Float64Array(n),
    near: [],
    nearBase: [],
  };
};

/**
 * GS-07: how far along the centreline (metres) two cars can be and still have their drawn boxes touch:
 * the box's diagonal over the least ratio, over the lap and the room across it, between the length of
 * an offset line (racing line plus a lateral the room allows) and the centreline's, plus a car's length
 * for the samples' spacing. A tight corner with the line on the inside has a ratio well below 1
 * (Bahrain T1: about 0.5).
 */
const drawnReachOf = (track, td, lo, hi, spec) => {
  const pts = track.points;
  const head = track.heading;
  const n = pts.length;
  const diag = Math.sqrt(spec.carLength * spec.carLength + spec.carWidth * spec.carWidth);
  if (!head || head.length < n || td.line.length !== n) return 2 * diag + spec.carLength;
  let least = Infinity;
  for (let k = 0; k < n; k += 1) {
    const j = (k + 1) % n;
    const cx = pts[j].x - pts[k].x;
    const cy = pts[j].y - pts[k].y;
    const ds = Math.sqrt(cx * cx + cy * cy);
    if (!(ds > 0)) continue;
    for (let e = 0; e < 3; e += 1) {
      const ok = td.line[k] + (e === 0 ? lo[k] : e === 1 ? 0 : hi[k]);
      const oj = td.line[j] + (e === 0 ? lo[j] : e === 1 ? 0 : hi[j]);
      const dx = cx - Math.sin(head[j]) * oj + Math.sin(head[k]) * ok;
      const dy = cy + Math.cos(head[j]) * oj - Math.cos(head[k]) * ok;
      const ratio = Math.sqrt(dx * dx + dy * dy) / ds;
      if (ratio < least) least = ratio;
    }
  }
  // A fold of the offset line (ratio ~0) would make every car a neighbour: the whole lap is the bound then.
  return least > 0 ? diag / least + spec.carLength : track.length;
};

/**
 * GS-07: a rough drawn frame for the prefilter - the racing line's exact point and the centreline's normal at
 * the shares k / n the engine's P runs on, interpolated linearly in between - and, per sample, how far the rough
 * place can be from positionAt's anywhere in that cell for a lateral the room allows (measured here, at a
 * quarter, half and three quarters of the cell and at both edges of the room and on the line, plus 10 cm for
 * what lies between). Two cars whose rough centres are further apart than the box's diagonal plus both
 * cells' error cannot touch; every other pair is tested on positionAt.
 */
const roughFrameOf = (track, spec, lo, hi) => {
  const n = track.points.length;
  const roughX = new Float64Array(n);
  const roughY = new Float64Array(n);
  const roughNx = new Float64Array(n);
  const roughNy = new Float64Array(n);
  const roughErr = new Float64Array(n);
  for (let k = 0; k < n; k += 1) {
    const at = positionAt(track, k / n, 0);
    const h = at.heading - lineAt(track, k / n, 0).angle;
    roughNx[k] = -Math.sin(h);
    roughNy[k] = Math.cos(h);
    roughX[k] = at.x;
    roughY[k] = at.y;
  }
  const m = lo.length;
  for (let k = 0; k < n; k += 1) {
    const j = (k + 1) % n;
    const cell = Math.min(m - 1, Math.floor((k / n) * m));
    let worst = 0;
    for (let q = 1; q <= 3; q += 1) {
      const t = q / 4;
      for (let e = 0; e < 3; e += 1) {
        const lat = e === 0 ? lo[cell] : e === 1 ? 0 : hi[cell];
        const exact = positionAt(track, (k + t) / n, lat);
        const x = roughX[k] + (roughX[j] - roughX[k]) * t + (roughNx[k] + (roughNx[j] - roughNx[k]) * t) * lat;
        const y = roughY[k] + (roughY[j] - roughY[k]) * t + (roughNy[k] + (roughNy[j] - roughNy[k]) * t) * lat;
        const dx = x - exact.x;
        const dy = y - exact.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > worst) worst = d;
      }
    }
    roughErr[k] = worst + 0.1;
  }
  const diag = Math.sqrt(spec.carLength * spec.carLength + spec.carWidth * spec.carWidth);
  return { roughX, roughY, roughNx, roughNy, roughErr, roughDiag: diag };
};

/** GS-07: are cars at (Pa, la) and (Pb, lb) certainly too far apart for their drawn boxes to touch? */
const roughApart = (G, Pa, la, Pb, lb) => {
  const n = G.roughX.length;
  const fa = frac(Pa) * n;
  const fb = frac(Pb) * n;
  const ia = Math.floor(fa) % n;
  const ib = Math.floor(fb) % n;
  const ta = fa - Math.floor(fa);
  const tb = fb - Math.floor(fb);
  const ja = (ia + 1) % n;
  const jb = (ib + 1) % n;
  const ax = G.roughX[ia] + (G.roughX[ja] - G.roughX[ia]) * ta + (G.roughNx[ia] + (G.roughNx[ja] - G.roughNx[ia]) * ta) * la;
  const ay = G.roughY[ia] + (G.roughY[ja] - G.roughY[ia]) * ta + (G.roughNy[ia] + (G.roughNy[ja] - G.roughNy[ia]) * ta) * la;
  const bx = G.roughX[ib] + (G.roughX[jb] - G.roughX[ib]) * tb + (G.roughNx[ib] + (G.roughNx[jb] - G.roughNx[ib]) * tb) * lb;
  const by = G.roughY[ib] + (G.roughY[jb] - G.roughY[ib]) * tb + (G.roughNy[ib] + (G.roughNy[jb] - G.roughNy[ib]) * tb) * lb;
  const dx = bx - ax;
  const dy = by - ay;
  const far = G.roughDiag + G.roughErr[ia] + G.roughErr[ib];
  return dx * dx + dy * dy > far * far;
};

/** GS-07: car `k`'s drawn pose at its current (P, lat), memoised per car (positionAt is the view's placement). */
const drawnOf = (G, sim, k) => {
  if (G.memoP[k] !== sim.P[k] || G.memoLat[k] !== sim.lat[k]) {
    const pose = positionAt(G.track, sim.P[k], sim.lat[k]);
    G.memoP[k] = sim.P[k];
    G.memoLat[k] = sim.lat[k];
    G.memoX[k] = pose.x;
    G.memoY[k] = pose.y;
    G.memoH[k] = pose.heading;
  }
};

/**
 * GS-07: how far two oriented boxes `width x length` sink into each other (separating axes over their
 * four axes; <= 0 when apart) - the same test as the view's safety pass (three/viewOverlap.js).
 */
export const drawnDepth = (ax, ay, ah, bx, by, bh, width, length) => {
  const hl = length / 2;
  const hw = width / 2;
  const ac = Math.cos(ah);
  const as = Math.sin(ah);
  const bc = Math.cos(bh);
  const bs = Math.sin(bh);
  const dx = bx - ax;
  const dy = by - ay;
  let depth = Infinity;
  for (let e = 0; e < 4; e += 1) {
    const ux = e === 0 ? ac : e === 1 ? -as : e === 2 ? bc : -bs;
    const uy = e === 0 ? as : e === 1 ? ac : e === 2 ? bs : bc;
    const ra = hl * Math.abs(ac * ux + as * uy) + hw * Math.abs(-as * ux + ac * uy);
    const rb = hl * Math.abs(bc * ux + bs * uy) + hw * Math.abs(-bs * ux + bc * uy);
    const overlap = ra + rb - Math.abs(dx * ux + dy * uy);
    if (overlap < depth) depth = overlap;
  }
  return depth;
};

/** A millimetre between two drawn boxes counts as a touch (the view's tolerance is broadcast.json's, larger). */
const TOUCH = -1e-3;

/** GS-07: how far the drawn boxes of cars `i` and `k` (at their current P and lat) sink into each other (<= 0 apart). */
const drawnPairDepth = (G, sim, i, k) => {
  if (roughApart(G, sim.P[i], sim.lat[i], sim.P[k], sim.lat[k])) return -1;
  drawnOf(G, sim, i);
  drawnOf(G, sim, k);
  return drawnDepth(G.memoX[i], G.memoY[i], G.memoH[i], G.memoX[k], G.memoY[k], G.memoH[k], G.spec.carWidth, G.spec.carLength);
};

/** GS-07: the same with car `i` at lateral `li` and car `k` at `lk` (their P as they are), without the memo. */
const drawnDepthAt = (G, sim, i, li, k, lk) => {
  const a = positionAt(G.track, sim.P[i], li);
  const b = positionAt(G.track, sim.P[k], lk);
  return drawnDepth(a.x, a.y, a.heading, b.x, b.y, b.heading, G.spec.carWidth, G.spec.carLength);
};

const cellOf = (G, d) => Math.min(G.m - 1, (frac(d) * G.m) | 0);

/** How far a car's centre may go to the right (`sign` > 0) or left of the line at distance share `d` (metres, signed). */
export const roomAt = (G, d, sign) => {
  const k = cellOf(G, d);
  return sign > 0 ? G.hi[k] : G.lo[k];
};

/**
 * SIM-8 (SIM-FISICA §3.5 claim): do `cars` boxes of the era fit side by side across the measured asphalt at
 * distance share `d` - their centres `carWidth + clearanceMetres` apart, inside the room of each edge?
 */
export const fitsAbreast = (G, d, cars) => {
  const k = cellOf(G, d);
  return G.hi[k] - G.lo[k] + 1e-9 >= (cars - 1) * G.spec.separation;
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
  if (!(limit > P0)) return P0;
  return gateDrawn(sim, i, P0, limit);
};

/**
 * GS-07, rule 1 where the cars are drawn: the furthest place in [P0, P1] at which car `i`'s drawn box (its
 * lateral of last step) does not sink into the drawn box of any car ahead of it within the drawn reach
 * (they have already moved this step). A pair that already touched at P0 may move on as long as the touch
 * gets no deeper. If P1 is clear it is P1; otherwise the clear end of a bisection from P0. The car behind
 * is the one that gives way: a car in front never waits for it (a tail turning into a car alongside in a
 * hairpin is opened sideways by the lateral step, rule 2).
 */
const BISECT = 30;
const gateDrawn = (sim, i, P0, P1) => {
  const G = sim.side;
  const len = sim.tables.length;
  const reach = P1 - P0 + G.reach / len;
  const near = G.near;
  const base = G.nearBase;
  near.length = 0;
  let k = sim.ahead[i];
  for (let guard = 0; k >= 0 && k !== i && guard < sim.ringSize; guard += 1) {
    if (frac(sim.P0[k] - P0) > reach) break;
    if (sim.active[k] && sim.inPit[k] === 0 && !roughApart(G, P1, sim.lat[i], sim.P[k], sim.lat[k])) near.push(k);
    k = sim.ahead[k];
  }
  if (!near.length) return P1;
  const saved = sim.P[i];
  sim.P[i] = P0;
  base.length = 0;
  for (let q = 0; q < near.length; q += 1) base.push(Math.max(TOUCH, drawnPairDepth(G, sim, i, near[q]) + 1e-9));
  const clearAt = (P) => {
    sim.P[i] = P;
    for (let q = 0; q < near.length; q += 1) if (drawnPairDepth(G, sim, i, near[q]) > base[q]) return false;
    return true;
  };
  let result = P1;
  if (!clearAt(P1)) {
    let lo = P0;
    let hi = P1;
    for (let step = 0; step < BISECT; step += 1) {
      const mid = (lo + hi) / 2;
      if (clearAt(mid)) lo = mid;
      else hi = mid;
    }
    result = lo;
  }
  sim.P[i] = saved;
  return result;
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
    } else if (sim.squeezeUntil && sim.squeezeUntil[i] > sim.clock) {
      // SIM-8: squeezed on the exit (duel.js) - pushed out towards the outside edge (WIDE), or backing out:
      // it holds its line on the outside and lifts until it is behind (YIELD).
      if (sim.squeezeWide[i]) {
        target = roomAt(G, d, sim.squeezeSide[i]) * sim.squeezeShare;
        sim.latState[i] = LANE.WIDE;
      } else {
        target = sim.lat[i];
        sim.latState[i] = LANE.YIELD;
      }
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

/** GS-07: visit every pair of cars on the road within `reachM` metres along the centreline, as (behind, ahead). */
const forNear = (sim, size, reachM, visit) => {
  const order = sim.side.order;
  const len = sim.tables.length;
  for (let a = 0; a < size; a += 1) {
    const i = order[a];
    for (let s = 1; s < size; s += 1) {
      const j = order[(a + s) % size];
      if (frac(sim.P[j] - sim.P[i]) * len >= reachM) break;
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
  // `need` (GS-07): how much further apart the pair must go where drawn; by default the Frenet gap's deficit.
  const push = (i, j, need) => {
    const before = prev[j] - prev[i];
    const sign = before > 0 ? 1 : before < 0 ? -1 : G.target[j] - G.target[i] >= 0 ? 1 : -1;
    const deficit = need === undefined ? S - sign * (lat[j] - lat[i]) : need;
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
  // GS-07: two boxes the Frenet gap keeps apart can still touch where they are drawn (side by side in a hairpin
  // each is turned by its own place on the line): such a pair is pushed apart by the depth and the clearance, in
  // the same passes, within the same lateral speed and asphalt, before the Frenet gap is put right again.
  const drawnPush = (i, j) => {
    const depth = drawnPairDepth(G, sim, i, j);
    if (depth > TOUCH) push(i, j, depth + G.spec.clearance);
    return true;
  };
  for (let pass = 0; pass < G.data.solverPasses; pass += 1) {
    forNear(sim, size, G.reach, drawnPush);
    forOverlapping(sim, size, push);
  }
  // Rule 3: a pair still closer than a car's width keeps last step's places - in the Frenet frame
  // (within a car's length along the centreline) and, GS-07, where the two are drawn.
  const revert = (i, j) => {
    if (lat[i] === prev[i] && lat[j] === prev[j]) return false;
    lat[i] = prev[i];
    lat[j] = prev[j];
    G.nV[i] = 0;
    G.nV[j] = 0;
    return true;
  };
  for (let guard = 0; guard <= 2 * size; guard += 1) {
    let reverted = false;
    forOverlapping(sim, size, (i, j) => {
      if (Math.abs(lat[j] - lat[i]) >= W - 1e-9) return true;
      if (revert(i, j)) reverted = true;
      return true;
    });
    forNear(sim, size, G.reach, (i, j) => {
      if (lat[i] === prev[i] && lat[j] === prev[j]) return true;
      // A move that leaves the pair touching where drawn is kept only if the touch got shallower.
      const depth = drawnPairDepth(G, sim, i, j);
      if (depth > TOUCH && depth > drawnDepthAt(G, sim, i, prev[i], j, prev[j]) + 1e-9 && revert(i, j)) reverted = true;
      return true;
    });
    if (!reverted) break;
  }
  for (let k = 0; k < size; k += 1) {
    const i = G.order[k];
    G.nV[i] = (lat[i] - prev[i]) / dt;
  }
};
