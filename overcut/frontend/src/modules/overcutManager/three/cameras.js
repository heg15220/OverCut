/**
 * The cameras: how a Grand Prix is filmed, and how the game films it.
 *
 * A real broadcast rigs each circuit with two dozen or more trackside cameras
 * - long lenses at the end of the straights looking back at the cars as they
 * brake, scaffold towers on the outside of corners, cameras beside the long
 * straights, a high camera above the start line and a cable camera running
 * along the main straight - plus a helicopter, and up to nine cameras on every
 * car: the T-camera on the airbox facing forward and backward, cameras at the
 * sides of the nose 325-525 mm above the floor, one at the base of the halo,
 * one in the driver's helmet. The director cuts between them to follow the
 * car on screen.
 *
 * `buildRig` places the trackside cameras for a circuit, each covering a stretch
 * of the lap; `frame` says, for the camera mode chosen, where the camera sits,
 * what it looks at and how long its lens is.
 */

import * as THREE from "three";
import { poseAt } from "../engine/trackGeometry";
import cameraData from "../data/balance/cameras.json";

/**
 * The cameras that ride with the car (F1M24-GAMEPLAY §2.5 onboard-mounts, CAM-1): mounts,
 * lenses, vibration and the years each exists, from data/balance/cameras.json (RNF-07, SRS
 * 6.2). `replayOnly` ones (the close-up) are never offered live.
 */
export const ONBOARDS = cameraData.onboard;
const ONBOARD_BY_ID = new Map(ONBOARDS.map((entry) => [entry.id, entry]));
const FOLLOW = cameraData.follow;
export const onboardFor = (id) => ONBOARD_BY_ID.get(id) || null;
export const isOnboard = (mode) => ONBOARD_BY_ID.has(mode);
const inEras = (entry, year) => entry.eras.some((era) => year >= era.from && year <= era.to);
/** Onboards the cars of `year` carry (nothing before the first onboard cameras); `{ replay: true }` adds the replay-only ones. */
export const onboardsFor = (year, { replay = false } = {}) => ONBOARDS.filter((entry) => (replay || !entry.replayOnly) && (!Number.isFinite(year) || inEras(entry, year)));
/** The mode actually filmed: an onboard the season does not have becomes the chase camera (SRS 6.2). */
export const modeForYear = (mode, year) => {
  const entry = ONBOARD_BY_ID.get(mode);
  if (!entry || !Number.isFinite(year)) return mode;
  return inEras(entry, year) && !entry.replayOnly ? mode : "chase";
};

export const CAMERA_MODES = ["tv", "chase", "drone", "heli", ...ONBOARDS.filter((entry) => !entry.replayOnly).map((entry) => entry.id)];

/** FNV-1a: a 32-bit seed from a text (car id, camera). */
export const seedOf = (text) => {
  let h = 0x811c9dc5;
  const str = String(text);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};
const hash01 = (seed, n) => {
  let h = (seed ^ Math.imul(n | 0, 0x27d4eb2d)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/**
 * Vibration of an onboard camera, in metres (RF-SIM-15/RNF-05: the view's randomness is
 * seeded too, so a replayed race films the same). Smooth value noise over cells of
 * `shake.perMs` of race time, amplitude growing with speed up to `shake.max`; the same
 * range as the Math.random() it replaces. Zero for a camera without shake, or slow.
 */
export const shakeOffset = (shake, speed, tSec, seed) => {
  if (!shake || !(speed > shake.minSpeed) || !Number.isFinite(tSec)) return 0;
  const amp = Math.min(shake.max, speed * shake.perSpeed);
  const cell = (tSec * 1000) / shake.perMs;
  const i = Math.floor(cell);
  const f = cell - i;
  const k = f * f * (3 - 2 * f);
  const value = hash01(seed, i) * (1 - k) + hash01(seed, i + 1) * k;
  return (value - 0.5) * amp;
};

const wrap = (value) => ((value % 1) + 1) % 1;
const inSpan = (share, from, to) => {
  const s = wrap(share);
  const a = wrap(from);
  const b = wrap(to);
  return a <= b ? s >= a && s <= b : s >= a || s <= b;
};

const outsidePoint = (circuit, share, side, distance, height) => {
  const pose = poseAt(circuit, wrap(share));
  // `at`, `side` and `dist` let fitRig move the camera on a real circuit.
  return { x: pose.x - Math.sin(pose.heading) * side * distance, z: pose.y + Math.cos(pose.heading) * side * distance, y: height, at: wrap(share), side, dist: distance };
};

/**
 * Trackside cameras for a circuit. Each is { type, x, y, z, from, to, priority,
 * width } - `width` the metres of track it frames around the car.
 */
export const buildRig = (circuit) => {
  const L = circuit.length;
  const cams = [];
  // Long lenses at the braking zones, looking back up the straight.
  circuit.brakingZones.forEach((zone) => {
    const corner = circuit.corners.find((item) => item.number === zone.corner) || circuit.corners[0];
    const outside = -(corner?.sign || 1);
    const p = outsidePoint(circuit, zone.at + 25 / L, outside, 22, 5);
    cams.push({ type: "braking", ...p, from: zone.at - Math.min(0.08, (zone.metres * 0.8) / L), to: zone.at + 10 / L, priority: 3, width: 26 });
  });
  // Scaffold towers on the outside of every corner.
  circuit.corners.forEach((corner) => {
    const outside = -(corner.sign || 1);
    const distance = corner.kind === "slow" ? 38 : corner.kind === "medium" ? 52 : 68;
    const p = outsidePoint(circuit, corner.apex, outside, distance, corner.kind === "slow" ? 9 : 7);
    cams.push({ type: "corner", ...p, from: corner.from - 30 / L, to: corner.to + 60 / L, priority: 2, width: 30 });
  });
  // Beside the long straights.
  for (let share = 0; share < 1; share += 260 / L) {
    const covered = cams.some((cam) => inSpan(share, cam.from, cam.to));
    if (covered) continue;
    const side = Math.round(share * 97) % 2 ? 1 : -1;
    const p = outsidePoint(circuit, share + 60 / L, side, 30, 4);
    cams.push({ type: "straight", ...p, from: share - 140 / L, to: share + 130 / L, priority: 1, width: 40 });
  }
  // The main straight: a high camera above the line and the cable camera.
  const line = outsidePoint(circuit, 0, circuit.clockwise ? -1 : 1, 46, 20);
  cams.push({ type: "grandstand", ...line, from: -110 / L, to: 60 / L, priority: 4, width: 46 });
  cams.push({ type: "cable", x: 0, y: 24, z: 0, from: -360 / L, to: -110 / L, priority: 5, width: 40 });
  // A stable id per camera (the director and the camera bus name the camera on air by it).
  return cams.map((cam, index) => ({ ...cam, id: `${cam.type}-${index}` }));
};

/**
 * The rig fitted to a real circuit (RF-3D-03, RF-3D-04). `buildRig` places the
 * cameras on the flat sim plane; on a GLB circuit the ground climbs and falls
 * and grandstands, walls and trees stand around the road. For each camera,
 * once when the circuit loads: the camera goes `y` metres above whatever stands
 * under it (the ground, or a roof), and must see the road it covers - a car's
 * height above five points of its stretch. If it does not, it is tried closer
 * to the track and on a taller tower, in that order; a camera that still sees
 * less than 40 % of its stretch is dropped. `field` is a height field (see
 * assets/assetCircuit.js); `heightAt(share)` the road height along the lap.
 * Returns the cameras with absolute positions (`abs: true`).
 */
export const FIT_TRIES = [[1, 0], [0.7, 0], [1, 8], [0.7, 8], [0.45, 0], [1, 18], [0.7, 18], [0.45, 8], [1, 32], [0.7, 32], [0.45, 18]];
export const fitRig = (rig, circuit, field, heightAt) => {
  const fitted = [];
  rig.forEach((cam) => {
    if (cam.type === "cable") {
      fitted.push({ ...cam, abs: true });
      return;
    }
    const span = wrap(cam.to - cam.from);
    const shares = [0, 0.25, 0.5, 0.75, 1].map((k) => wrap(cam.from + span * k));
    const targets = shares.map((s) => {
      const p = poseAt(circuit, s);
      return { x: p.x, y: heightAt(s) + 0.8, z: p.y };
    });
    const road = heightAt(cam.at ?? shares[2]);
    let best = null;
    for (const [far, rise] of FIT_TRIES) {
      const p = cam.at === undefined ? cam : outsidePoint(circuit, cam.at, cam.side, cam.dist * far, cam.y);
      const ground = Math.max(field.topNear(p.x, p.z, 1) ?? road, road);
      const pos = { x: p.x, y: ground + cam.y + rise, z: p.z };
      const seen = targets.filter((t) => field.sight(pos, t)).length / targets.length;
      if (!best || seen > best.seen + 1e-9) best = { pos, seen };
      if (seen >= 0.8) break;
    }
    if (best.seen < 0.4) return;
    fitted.push({ ...cam, x: best.pos.x, y: best.pos.y, z: best.pos.z, abs: true, seen: best.seen });
  });
  return fitted;
};

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** Frames between two line-of-sight checks of the TV camera on a real circuit (RNF-02). */
export const SIGHT_EVERY = 6;

/** Helicam: high and wide, panning slowly over long stretches of track; at least 40 m above what is under it. */
const heliShot = (car, dir, side, y0, field, abs) => {
  const heli = FOLLOW.heli;
  const pos = car.clone().add(side.clone().multiplyScalar(heli.offset.side)).add(dir.clone().multiplyScalar(-heli.offset.back)).setY(y0 + heli.heightM);
  const below = field ? field.topNear(pos.x, pos.z, 2) : null;
  if (below !== null && below + heli.clearanceM > pos.y) pos.y = below + heli.clearanceM;
  return { pos, look: car.clone().add(dir.clone().multiplyScalar(heli.lookAhead)).setY(y0), fov: heli.fovDeg, lag: heli.lag, abs };
};

/** The garage shot: a fixed camera in front of the car in its box. */
export const garageShot = (focus) => {
  const g = FOLLOW.garage;
  const dir = v3(Math.cos(focus.heading), 0, Math.sin(focus.heading));
  const car = v3(focus.x, 0, focus.z);
  return { pos: car.clone().add(dir.clone().multiplyScalar(g.ahead)).setY(g.up), look: car.clone().setY(g.lookUp), fov: g.fovDeg, snap: true };
};

/**
 * Where the camera goes this frame. `focus` is { x, y, z, heading, speed,
 * share, spec } for the car followed; `state` keeps what the camera needs
 * between frames (current tower, last cut). Returns { pos, look, fov, snap }.
 *
 * `world` is { heightAt, field } on a real GLB circuit (null on a procedural
 * one, which stays flat and is framed exactly as it always was). With it every
 * shot comes back in absolute heights (`abs: true`): onboard, chase and drone
 * cameras ride the road profile along the lap around the car, the helicopter
 * stays above the tallest thing under it, and the TV director checks every
 * SIGHT_EVERY frames that the tower still sees the car - after two failed
 * checks it cuts to another tower that does, or to the helicopter.
 */
export const frame = (mode, focus, circuit, rig, state, dt, world = null) => {
  const dir = v3(Math.cos(focus.heading), 0, Math.sin(focus.heading));
  const side = v3(-Math.sin(focus.heading), 0, Math.cos(focus.heading));
  const car = v3(focus.x, 0, focus.z);
  const spec = focus.spec || {};
  const head = spec.head || [0.1, 0.72];
  const real = Boolean(world?.heightAt);
  const y0 = real ? focus.y || 0 : 0;
  const L = circuit.length;
  // Height of the road `m` metres ahead of (behind, if negative) the car, relative to the car itself.
  const road = real ? (m) => y0 + world.heightAt(wrap(focus.share + m / L)) - world.heightAt(wrap(focus.share)) : () => 0;
  const field = real ? world.field : null;
  const abs = real;
  // Under a roof, a canopy or a bridge (something over the car itself, more than 2.5 m up)?
  const overhead = field ? field.topNear(focus.x, focus.z, 0) : null;
  const covered = overhead !== null && overhead > y0 + 2.5;
  const chase = FOLLOW.chase;
  const chaseShot = () => ({ pos: car.clone().add(dir.clone().multiplyScalar(-chase.back)).setY(road(-chase.back) + chase.up), look: car.clone().add(dir.clone().multiplyScalar(chase.lookAhead)).setY(road(chase.lookAhead) + chase.lookUp), fov: chase.fovDeg, lag: chase.lag, abs });

  // Onboards: a mount and an aim point in car axes (cameras.json), on the road profile.
  const onboard = ONBOARD_BY_ID.get(mode);
  if (onboard) {
    const point = (p) => {
      const ahead = p.anchor === "head" ? head[0] + p.ahead : p.anchor === "front" ? (spec.front || 1.6) + p.ahead : p.ahead;
      const up = p.anchor === "head" ? head[1] + p.up : p.up;
      const at = car.clone().add(dir.clone().multiplyScalar(ahead));
      if (p.side) at.add(side.clone().multiplyScalar(p.side));
      return at.setY(road(ahead) + up);
    };
    const pos = point(onboard.mount);
    const look = point(onboard.aim);
    if (onboard.mount.pitchDeg) look.y -= Math.tan((onboard.mount.pitchDeg * Math.PI) / 180) * pos.distanceTo(look);
    return { pos, look, fov: onboard.fovDeg, near: onboard.near, snap: true, abs };
  }
  if (mode === "drone") {
    // A drone flying low behind and to one side, swinging round in the corners.
    const d = FOLLOW.drone;
    state.droneSide = (state.droneSide ?? 1) * (1 - d.swing) + Math.sign(focus.turn || 0) * -d.swing;
    const offset = side.clone().multiplyScalar(d.side * state.droneSide);
    const pos = car.clone().add(dir.clone().multiplyScalar(-d.back)).add(offset).setY(road(-d.back) + d.up);
    if (covered) {
      // Under cover it flies below the roof.
      pos.y = Math.max(y0 + d.minAboveCar, Math.min(pos.y, overhead - d.underRoofClearance));
    } else if (field) {
      // Over a barrier or a fence beside the road it flies a little higher (not onto a bridge or a roof).
      const below = field.topNear(pos.x, pos.z, 1);
      if (below !== null && below > pos.y - d.fenceClearance && below < road(-d.back) + d.fenceMaxAbove) pos.y = below + d.fenceClearance;
    }
    return { pos, look: car.clone().add(dir.clone().multiplyScalar(d.lookAhead)).setY(road(d.lookAhead) + d.lookUp), fov: d.fovDeg, lag: d.lag, abs };
  }
  // The helicopter cannot see a car under cover: the chase camera follows it in.
  if (mode === "heli") {
    const shot = covered ? chaseShot() : heliShot(car, dir, side, y0, field, abs);
    if (state.heliCovered !== undefined && state.heliCovered !== covered) shot.snap = true;
    state.heliCovered = covered;
    return shot;
  }
  if (mode === "chase") return chaseShot();

  // TV: the director takes the camera covering this stretch, keeps it until the
  // car leaves it, and zooms to keep the car framed.
  const share = wrap(focus.share);
  const target = v3(focus.x, y0 + 0.8, focus.z);
  const camPos = (cam) => {
    if (cam.type === "cable") {
      // Runs above the main straight alongside the car.
      const along = poseAt(circuit, wrap(share - 18 / L));
      return v3(along.x, real ? road(-18) + cam.y : cam.y, along.y);
    }
    return v3(cam.x, cam.abs || !real ? cam.y : cam.y + y0, cam.z);
  };
  // No tower sees a car under a roof; otherwise one ray march over the height grid.
  const clear = (cam) => !field || (!covered && (cam.type === "cable" || field.sight(camPos(cam), target)));
  let current = null;
  if (real) {
    state.tick = (state.tick || 0) + 1;
    state.skip = state.skip || new Set();
    state.skip.forEach((cam) => {
      if (!inSpan(share, cam.from, cam.to)) state.skip.delete(cam);
    });
    const kept = state.tvCam;
    if (kept && !state.skip.has(kept) && (inSpan(share, kept.from, kept.to) || (state.tvLoose && Math.hypot(kept.x - focus.x, kept.z - focus.z) < 260))) current = kept;
    // The occlusion check - one ray march over the height grid - a few frames apart.
    if (current && field && (current.type !== "cable" || covered) && state.tick % SIGHT_EVERY === 0) {
      state.hidden = clear(current) ? 0 : (state.hidden || 0) + 1;
      if (state.hidden >= 2) {
        state.skip.add(current);
        state.hidden = 0;
        current = null;
      }
    }
    if (!current && (!state.fallback || state.tick % SIGHT_EVERY === 0)) {
      const covering = rig.filter((cam) => inSpan(share, cam.from, cam.to) && !state.skip.has(cam)).sort((a, b) => b.priority - a.priority);
      current = covering.find(clear) || null;
      state.tvLoose = false;
      if (!current) {
        const near = rig
          .filter((cam) => cam.type !== "cable" && !state.skip.has(cam))
          .map((cam) => ({ cam, d: Math.hypot(cam.x - focus.x, cam.z - focus.z) }))
          .filter((item) => item.d < 400)
          .sort((a, b) => a.d - b.d);
        current = near.find((item) => clear(item.cam))?.cam || null;
        state.tvLoose = Boolean(current);
      }
      state.cut = current !== state.tvCam || Boolean(state.fallback);
      state.tvCam = current;
      state.hidden = 0;
    }
    if (!current) {
      // No tower sees the car: the helicopter takes the shot until one does (the chase camera under cover).
      const shot = covered ? chaseShot() : heliShot(car, dir, side, y0, field, abs);
      shot.snap = !state.fallback || state.fallbackCovered !== covered;
      state.fallbackCovered = covered;
      state.fallback = true;
      return shot;
    }
    state.fallback = false;
  } else {
    current = state.tvCam && inSpan(share, state.tvCam.from, state.tvCam.to) ? state.tvCam : null;
    if (!current) {
      const covering = rig.filter((cam) => inSpan(share, cam.from, cam.to));
      current = covering.sort((a, b) => b.priority - a.priority)[0];
      if (!current) {
        let best = null;
        rig.forEach((cam) => {
          if (cam.type === "cable") return;
          const d = Math.hypot(cam.x - focus.x, cam.z - focus.z);
          if (!best || d < best.d) best = { cam, d };
        });
        current = best?.cam;
      }
      state.tvCam = current;
      state.cut = true;
    }
    if (!current) return { pos: car.clone().add(v3(0, 40, 40)), look: car, fov: 50 };
  }
  const pos = camPos(current);
  const distance = pos.distanceTo(car.clone().setY(y0 + 0.6));
  const fov = THREE.MathUtils.clamp((2 * Math.atan(current.width / 2 / Math.max(5, distance)) * 180) / Math.PI, 3.5, 60);
  const snap = state.cut;
  state.cut = false;
  return { pos, look: car.clone().add(dir.clone().multiplyScalar(Math.min(6, (focus.speed || 0) * 0.08))).setY(y0 + 0.6), fov, snap, lookLag: 14, abs };
};

export const CAMERA_LABELS = {
  tv: ["TV", "TV"],
  chase: ["Persecución", "Chase"],
  drone: ["Dron", "Drone"],
  heli: ["Helicam", "Helicam"],
  ...Object.fromEntries(ONBOARDS.map((entry) => [entry.id, entry.label])),
  map: ["Mapa", "Map"],
};
