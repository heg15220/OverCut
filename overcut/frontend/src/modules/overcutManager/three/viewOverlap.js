/**
 * The view's safety pass against overlapping cars (F1M24-GAMEPLAY §2.9 no-overlap-view, CAM-3;
 * RF-SIM-07, RF-3D-04, RNF-07).
 *
 * The step race keeps the cars' boxes apart (engine/sim/lateral.js, SIM-2); the view draws them
 * between two engine steps and on the racing line, and must never show two silhouettes inside
 * one another. Every frame Race3D hands over the cars on the road with their position and
 * heading; for each pair closer than a car's diagonal the oriented boxes of the era (width and
 * length from race-physics.json lateral.eras - what the engine guarantees - or the model's spec
 * when the season has no era) are tested with separating axes. Boxes that sink into each other by
 * more than broadcast.json viewSafety.overlap.toleranceMetres are pulled apart along the axis of
 * least penetration: the car behind moves away from the car ahead - back when they are nose to
 * tail, sideways (up to lateral.clearanceMetres between the flanks) when they are side by side -
 * never by more than maxPushMetres in a frame, in `passes` rounds so a third car is not pushed
 * into. Nothing here is kept between frames and nothing goes back to the engine (RNF-05): the
 * pass only moves what is drawn.
 *
 * Every pair that needed a correction is counted (viewOverlapStats): the counter is there to see
 * engine bugs, not to hide them (viewOverlap2024/1988.test.js run the 64 races of SIM-2).
 */

import broadcast from "../data/balance/broadcast.json";
import { LATERAL, lateralSpecFor } from "../engine/sim/lateral";

const OVERLAP = broadcast.viewSafety.overlap;
export const QUICK_REPLAY = broadcast.viewSafety.quickReplay;

/** Width and length of the era's box (race-physics.json), the model's spec without an era, and the pass settings. */
export const boxSpecFor = (year, spec = null) => {
  const era = Number.isFinite(year) ? lateralSpecFor(year) : null;
  const width = era?.carWidth ?? (spec && Number.isFinite(spec.width) ? spec.width : null);
  const length = era?.carLength ?? (spec && Number.isFinite(spec.length) ? spec.length : null);
  return { width, length, clearance: LATERAL.clearanceMetres, tolerance: OVERLAP.toleranceMetres, maxPush: OVERLAP.maxPushMetres, passes: OVERLAP.passes };
};

/** Forward (cos, sin) and to the right of travel (-sin, cos), in the view's x/z plane. */
const axesOf = (heading) => {
  const c = Math.cos(heading);
  const s = Math.sin(heading);
  return [{ x: c, z: s }, { x: -s, z: c }];
};

/**
 * How far two oriented boxes sink into each other (separating axes): { depth, axis } - the
 * smallest overlap of their projections over the four axes (≤ 0 when they are apart) and that
 * axis. `a`/`b` are { x, z, heading }.
 */
export const boxPenetration = (a, b, width, length) => {
  const hl = length / 2;
  const hw = width / 2;
  const axA = axesOf(a.heading);
  const axB = axesOf(b.heading);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const radius = (axis, axes) => hl * Math.abs(axes[0].x * axis.x + axes[0].z * axis.z) + hw * Math.abs(axes[1].x * axis.x + axes[1].z * axis.z);
  let depth = Infinity;
  let best = axA[0];
  for (const axis of [axA[0], axA[1], axB[0], axB[1]]) {
    const overlap = radius(axis, axA) + radius(axis, axB) - Math.abs(dx * axis.x + dz * axis.z);
    if (overlap < depth) {
      depth = overlap;
      best = axis;
    }
  }
  return { depth, axis: best };
};

/**
 * One frame of the pass. `cars`: [{ id, x, z, heading, along? }] - the cars on the road only (not
 * in the pit lane, parked, in a garage or gone); `along`, metres along the lap, orders them.
 * Returns { fixes: Map(id → { dx, dz }), corrections, worst, after } - `corrections` the pairs that sank in, `worst` the deepest penetration before
 * the pass and `after` the deepest left after it (metres; negative when every pair is apart).
 */
export const overlapPass = (cars, box) => {
  const fixes = new Map();
  let corrections = 0;
  let worst = -Infinity;
  let after = -Infinity;
  const { width, length, clearance, tolerance, maxPush } = box;
  const passes = Math.max(1, box.passes || 1);
  if (!(width > 0) || !(length > 0) || cars.length < 2) return { fixes, corrections, worst, after };
  const reach = Math.hypot(length, width);
  // Leader first: by the order on the road (`along`, metres) when the view gives it, else as handed over.
  const at = cars.map((car, index) => ({ id: car.id, x: car.x, z: car.z, heading: car.heading, along: Number.isFinite(car.along) ? car.along : -index, index }));
  at.sort((p, q) => q.along - p.along || p.index - q.index);
  const sunkInto = (me, k) => {
    for (let a = 0; a < k; a += 1) {
      const dx = me.x - at[a].x;
      const dz = me.z - at[a].z;
      if (dx * dx + dz * dz <= reach * reach && boxPenetration(at[a], me, width, length).depth > tolerance) return true;
    }
    return false;
  };
  // Front to back: a car only ever moves away from the cars ahead of it, which are already where
  // they will be drawn, so the pushes run back through a queue instead of to and fro.
  for (let k = 1; k < at.length; k += 1) {
    const me = at[k];
    for (let round = 0; round < passes; round += 1) {
      let moved = false;
      for (let a = 0; a < k; a += 1) {
        const ahead = at[a];
        const dx = me.x - ahead.x;
        const dz = me.z - ahead.z;
        if (dx * dx + dz * dz > reach * reach) continue;
        const { depth, axis } = boxPenetration(ahead, me, width, length);
        if (round === 0 && depth > worst) worst = depth;
        if (depth <= tolerance) continue;
        if (round === 0) corrections += 1;
        const [fwd, side] = axesOf(ahead.heading);
        const sideways = Math.abs(axis.x * side.x + axis.z * side.z) > Math.abs(axis.x * fwd.x + axis.z * fwd.z);
        const sign = dx * axis.x + dz * axis.z >= 0 ? 1 : -1;
        const push = Math.min(maxPush, depth + (sideways ? clearance : 0)) * sign;
        me.x += axis.x * push;
        me.z += axis.z * push;
        moved = true;
      }
      if (!moved) break;
    }
    // Squeezed between two cars ahead (a push off one is a push into the other): it drops back
    // along its own heading, from where it was, until it is clear of all of them.
    if (sunkInto(me, k)) {
      const [own] = axesOf(me.heading);
      const ox = cars[me.index].x;
      const oz = cars[me.index].z;
      const step = Math.max(0.05, tolerance);
      for (let back = step; back <= length + 1e-9; back += step) {
        me.x = ox - own.x * back;
        me.z = oz - own.z * back;
        if (!sunkInto(me, k)) break;
      }
    }
  }
  at.sort((p, q) => p.index - q.index);
  for (let i = 0; i < at.length; i += 1) {
    const { x, z } = cars[i];
    if (at[i].x !== x || at[i].z !== z) fixes.set(at[i].id, { dx: at[i].x - x, dz: at[i].z - z });
    for (let j = i + 1; j < at.length; j += 1) {
      const dx = at[j].x - at[i].x;
      const dz = at[j].z - at[i].z;
      if (dx * dx + dz * dz > reach * reach) continue;
      const { depth } = boxPenetration(at[i], at[j], width, length);
      if (depth > after) after = depth;
    }
  }
  return { fixes, corrections, worst, after };
};

const stats = { frames: 0, corrections: 0, worst: -Infinity };

/** Count one frame's corrections (development counter, F1M24-GAMEPLAY §2.9). */
export const countOverlap = (result) => {
  stats.frames += 1;
  stats.corrections += result.corrections;
  if (result.worst > stats.worst) stats.worst = result.worst;
  return stats;
};

/** The counter so far: frames checked, pairs corrected, the deepest penetration seen. */
export const viewOverlapStats = () => ({ ...stats });
export const resetViewOverlapStats = () => {
  stats.frames = 0;
  stats.corrections = 0;
  stats.worst = -Infinity;
};
