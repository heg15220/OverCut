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
 *
 * CAM-2 (F1M24-GAMEPLAY §2.5 camera-zones, tv-lens-behaviour): every figure of the rig
 * comes from data/balance/broadcast.json rigTemplate (RNF-07). `buildZoneRig` films the lap
 * by zones (three/cameraZones.js) with one to three alternative cameras each - long lens,
 * head-on, pass-and-pan, tracking, high and wide - drawn per lap with the race seed; the TV
 * lens keeps the car within its framing share and opens for two when a rival is close.
 */

import * as THREE from "three";
import { poseAt } from "../engine/trackGeometry";
import cameraData from "../data/balance/cameras.json";
import broadcast from "../data/balance/broadcast.json";
import raceSim from "../data/balance/race-sim.json";
import { rigType, zoneChoice, zonesFor } from "./cameraZones";

export { buildCameraZones, pickVariant, zoneChoice, zonesFor, zoneIndexAt } from "./cameraZones";
// CAM-3 (F1M24-GAMEPLAY §2.5 pit-sequence): the pit-lane cameras.
export { buildPitRig, laneBoxOf, lanePoseAt, pitShot } from "./pitCameras";

const TEMPLATE = broadcast.rigTemplate;
const FRAMING = broadcast.framing;
const ZONES = broadcast.zonesPolicy;
const DIRECTOR = broadcast.director;

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
 * Trackside cameras for a circuit, by priority (the rig OverCut had before CAM-2; every figure
 * from data/balance/broadcast.json rigTemplate, RNF-07). Each is { type, x, y, z, from, to,
 * priority, width } - `width` the metres of track it frames around the car.
 */
export const buildRig = (circuit) => {
  const L = circuit.length;
  const cams = [];
  const braking = rigType("braking");
  const cornerType = rigType("corner");
  const straight = rigType("straight");
  const grandstand = rigType("grandstand");
  const cable = rigType("cable");
  const base = (t) => ({ priority: t.priority, width: t.width });
  // Long lenses at the braking zones, looking back up the straight.
  circuit.brakingZones.forEach((zone) => {
    const corner = circuit.corners.find((item) => item.number === zone.corner) || circuit.corners[0];
    const outside = -(corner?.sign || 1);
    const p = outsidePoint(circuit, zone.at + braking.offsetM / L, outside, braking.dist, braking.height);
    cams.push({ type: "braking", ...p, from: zone.at - Math.min(braking.approach.maxShare, (zone.metres * braking.approach.ofStraight) / L), to: zone.at + braking.spanM.to / L, ...base(braking) });
  });
  // Scaffold towers on the outside of every corner.
  circuit.corners.forEach((corner) => {
    const outside = -(corner.sign || 1);
    const place = cornerType.byKind[corner.kind] || cornerType;
    const p = outsidePoint(circuit, corner.apex, outside, place.dist, place.height);
    cams.push({ type: "corner", ...p, from: corner.from + cornerType.spanM.from / L, to: corner.to + cornerType.spanM.to / L, ...base(cornerType) });
  });
  // Beside the long straights.
  for (let share = 0; share < 1; share += straight.everyM / L) {
    const covered = cams.some((cam) => inSpan(share, cam.from, cam.to));
    if (covered) continue;
    const side = Math.round(share * 97) % 2 ? 1 : -1;
    const p = outsidePoint(circuit, share + straight.offsetM / L, side, straight.dist, straight.height);
    cams.push({ type: "straight", ...p, from: share + straight.spanM.from / L, to: share + straight.spanM.to / L, ...base(straight) });
  }
  // The main straight: a high camera above the line and the cable camera.
  const line = outsidePoint(circuit, 0, circuit.clockwise ? -1 : 1, grandstand.dist, grandstand.height);
  cams.push({ type: "grandstand", ...line, from: grandstand.spanM.from / L, to: grandstand.spanM.to / L, ...base(grandstand) });
  cams.push({ type: "cable", x: 0, y: cable.height, z: 0, from: cable.spanM.from / L, to: cable.spanM.to / L, ...base(cable) });
  // A stable id per camera (the director and the camera bus name the camera on air by it).
  return cams.map((cam, index) => ({ ...cam, id: `${cam.type}-${index}` }));
};

/** Cameras that move with the car (the cable and the tracking camera): placed every frame, never fitted to the mesh. */
const isMoving = (cam) => cam.type === "cable" || Boolean(cam.moving);

/**
 * The rig by zones (F1M24-GAMEPLAY §2.5 camera-zones, CAM-2): the cameras of every zone of
 * `zones` (three/cameraZones.js zonesFor: the circuit's camera-zones.json or the built ones),
 * placed with the rigTemplate. Each covers exactly its zone and carries `zone` (its index) and
 * `weight`; `frame` then picks one per zone and lap with the race seed. A file made on a spline
 * of another length is scaled to this circuit.
 */
export const buildZoneRig = (circuit, zones = zonesFor(circuit)) => {
  const L = circuit.length;
  const k = L / (zones.lengthM || L);
  const rig = [];
  zones.zones.forEach((zone, zi) => {
    zone.cams.forEach((cam, ci) => {
      const t = rigType(cam.type);
      if (!t) return;
      const common = {
        type: cam.type,
        id: `${cam.type}-z${zi}-${ci}`,
        from: (zone.fromM * k) / L,
        to: (zone.toM * k) / L,
        priority: t.priority,
        width: t.width,
        weight: cam.weight ?? t.weight,
        zone: zi,
        zoneKind: zone.kind ?? null,
        variant: ci,
      };
      if (cam.type === "cable" || cam.type === "lateralTrack") {
        rig.push({ ...common, x: 0, y: t.height, z: 0, side: cam.side, dist: t.dist, lagM: t.lagM ?? 0, moving: true });
        return;
      }
      const place = cam.type === "corner" && t.byKind && cam.cornerKind ? t.byKind[cam.cornerKind] : t;
      rig.push({ ...common, ...outsidePoint(circuit, (cam.atM * k + (t.offsetM || 0)) / L, cam.side, place.dist, place.height) });
    });
  });
  return rig;
};

/**
 * One step of a critically damped spring towards `target` (exact, stable for any step):
 * the TV lens follows its car without overshoot (framing.byType critDamp, CAM-2).
 */
export const critDampStep = (x, v, target, omega, h) => {
  const d = x - target;
  const e = Math.exp(-omega * h);
  const j = v + omega * d;
  return { x: target + (d + j * h) * e, v: (v - omega * j * h) * e };
};

/** The framing of a camera type (broadcast.json framing.byType, 'default' when it has none). */
export const framingFor = (type) => FRAMING.byType[type] || FRAMING.byType.default;

/**
 * The metres of track a TV camera frames: its rig width kept between the car filling maxShare
 * and minShare of the frame; with a rival close enough, wide enough for both (framing.battle).
 */
export const frameWidth = (cam, pairGapM = null) => {
  const fr = framingFor(cam.type);
  const car = TEMPLATE.carLengthM;
  let width = Math.min(Math.max(cam.width, car / fr.maxShare), car / fr.minShare);
  if (Number.isFinite(pairGapM) && pairGapM <= FRAMING.battle.maxGapM) width = Math.max(width, (pairGapM + car) / FRAMING.battle.pairShare);
  return width;
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
    if (isMoving(cam)) {
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
 *
 * TV extras (CAM-2): `state.seed` the race seed for the zone draw, `focus.lap` (else the whole
 * part of `focus.share`), `focus.rival` { x, z } to frame a pair. `state.lockCam` (CAM-3, a
 * replay angle) holds that rig camera whatever the car does. The TV shot also returns
 * `cameraId`, `camType`, `critDamp` (the look's spring, 1/s) and `pair`.
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
  // On a zone rig (buildZoneRig) the camera of each zone is drawn per lap with the race seed
  // (state.seed, set by Race3D; RNF-05); on the priority rig the highest priority covers it.
  const share = wrap(focus.share);
  const lap = Number.isFinite(focus.lap) ? focus.lap : Math.max(0, Math.floor(focus.share || 0));
  const choose = (covering) => {
    const zoned = zoneChoice(covering, share, lap, state.seed ?? 0);
    return zoned || covering.slice().sort((a, b) => b.priority - a.priority);
  };
  const target = v3(focus.x, y0 + 0.8, focus.z);
  const camPos = (cam) => {
    if (cam.type === "cable") {
      // Runs above the main straight alongside the car.
      const lag = rigType("cable").lagM;
      const along = poseAt(circuit, wrap(share - lag / L));
      return v3(along.x, real ? road(-lag) + cam.y : cam.y, along.y);
    }
    if (cam.moving) {
      // The tracking camera runs beside the road, a little behind the car.
      const along = poseAt(circuit, wrap(share - cam.lagM / L));
      return v3(along.x - Math.sin(along.heading) * cam.side * cam.dist, real ? road(-cam.lagM) + cam.y : cam.y, along.y + Math.cos(along.heading) * cam.side * cam.dist);
    }
    return v3(cam.x, cam.abs || !real ? cam.y : cam.y + y0, cam.z);
  };
  // No tower sees a car under a roof; otherwise one ray march over the height grid.
  const clear = (cam) => !field || (!covered && (isMoving(cam) || field.sight(camPos(cam), target)));
  let current = null;
  if (state.lockCam) {
    // A replay angle (CAM-3): this tower and no other, wherever the car goes.
    current = state.lockCam;
    state.fallback = false;
    state.cut = state.tvCam !== current;
    state.tvCam = current;
  } else if (real) {
    state.tick = (state.tick || 0) + 1;
    state.skip = state.skip || new Set();
    state.skip.forEach((cam) => {
      if (!inSpan(share, cam.from, cam.to)) state.skip.delete(cam);
    });
    const kept = state.tvCam;
    if (kept && !state.skip.has(kept) && (inSpan(share, kept.from, kept.to) || (state.tvLoose && Math.hypot(kept.x - focus.x, kept.z - focus.z) < ZONES.looseRadiusM))) current = kept;
    // The occlusion check - one ray march over the height grid - a few frames apart.
    if (current && field && (!isMoving(current) || covered) && state.tick % SIGHT_EVERY === 0) {
      state.hidden = clear(current) ? 0 : (state.hidden || 0) + 1;
      if (state.hidden >= 2) {
        state.skip.add(current);
        state.hidden = 0;
        current = null;
      }
    }
    if (!current && (!state.fallback || state.tick % SIGHT_EVERY === 0)) {
      const covering = choose(rig.filter((cam) => inSpan(share, cam.from, cam.to))).filter((cam) => !state.skip.has(cam));
      current = covering.find(clear) || null;
      state.tvLoose = false;
      if (!current) {
        const near = rig
          .filter((cam) => !isMoving(cam) && !state.skip.has(cam))
          .map((cam) => ({ cam, d: Math.hypot(cam.x - focus.x, cam.z - focus.z) }))
          .filter((item) => item.d < ZONES.nearRadiusM)
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
      current = choose(rig.filter((cam) => inSpan(share, cam.from, cam.to)))[0];
      if (!current) {
        let best = null;
        rig.forEach((cam) => {
          if (isMoving(cam)) return;
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
  // tv-lens-behaviour (CAM-2): the car kept between minShare and maxShare of the frame; with a
  // rival close by (focus.rival, from Race3D) the frame opens for both and aims between them.
  const aimY = y0 + FRAMING.aimUpM;
  let subject = car.clone();
  let pairGap = null;
  if (focus.rival && Number.isFinite(focus.rival.x) && Number.isFinite(focus.rival.z)) {
    const gap = Math.hypot(focus.rival.x - focus.x, focus.rival.z - focus.z);
    if (gap <= FRAMING.battle.maxGapM) {
      pairGap = gap;
      subject = v3((focus.x + focus.rival.x) / 2, 0, (focus.z + focus.rival.z) / 2);
    }
  }
  const distance = pos.distanceTo(subject.clone().setY(aimY));
  const width = frameWidth(current, pairGap);
  const fov = THREE.MathUtils.clamp((2 * Math.atan(width / 2 / Math.max(5, distance)) * 180) / Math.PI, FRAMING.fovDeg.min, FRAMING.fovDeg.max);
  const snap = state.cut;
  state.cut = false;
  const { critDamp } = framingFor(current.type);
  const lead = Math.min(FRAMING.lookAhead.maxM, (focus.speed || 0) * FRAMING.lookAhead.perSpeed);
  return { pos, look: subject.add(dir.clone().multiplyScalar(lead)).setY(aimY), fov, snap, lookLag: critDamp, critDamp, cameraId: current.id ?? null, camType: current.type, pair: pairGap !== null, abs };
};

/**
 * The rival the focused car is racing, for the TV frame for two (CAM-2 tv-lens-behaviour): the
 * SIM-4 battle state when the cars carry it (F1M24-GAMEPLAY §1.7: ATTACKING frames the car ahead,
 * DEFENDING the one behind), else the nearer of the two neighbours on the road within
 * broadcast.json director.battleGapSec at the chaser's speed. `ordered`: leader first, with metres.
 */
export const tvRival = (ordered, focusId, objects) => {
  const index = ordered.findIndex((item) => item.car.id === focusId);
  if (index < 0) return null;
  const me = ordered[index];
  const usable = (item) => item && !item.pose.inPit && !item.pose.gone && !item.pose.finished && objects.get(item.car.id);
  if (!usable(me)) return null;
  const ahead = ordered[index - 1];
  const behind = ordered[index + 1];
  const { battleGapSec, battleStates } = DIRECTOR;
  const state = me.battle ?? me.pose.battle;
  if (state !== undefined) {
    if (!battleStates.includes(state)) return null;
    const other = state === "ATTACKING" ? ahead : state === "DEFENDING" ? behind : null;
    return usable(other) ? objects.get(other.car.id) : null;
  }
  const gapSec = (front, back) => (front.metres - back.metres) / Math.max(1, objects.get(back.car.id)?.speed || 0);
  const options = [];
  if (usable(ahead)) options.push({ item: ahead, gap: gapSec(ahead, me) });
  if (usable(behind)) options.push({ item: behind, gap: gapSec(me, behind) });
  const best = options.filter((option) => option.gap >= 0 && option.gap < battleGapSec).sort((a, b) => a.gap - b.gap)[0];
  return best ? objects.get(best.item.car.id) : null;
};

// ------------------------------------------------------------- CAM-4 start and finish scripts

const SCRIPT_RIG = broadcast.scriptRig;
const GRID = raceSim.grid;

/**
 * Metres along the lap from the line (negative: behind it) of a scriptRig anchor (F1M24-GAMEPLAY
 * §2.5 start-finish-scripts, CAM-4): the grid slots of the step race (race-sim.json grid:
 * poleBackMetres + k·gapMetres behind the line), the safety car scParkedBackM behind the last
 * slot, the line itself. null for `subject` (the car on air).
 */
export const scriptAnchorM = (anchor, gridCount = 20) => {
  const last = Math.max(0, (gridCount || 1) - 1);
  switch (anchor) {
    case "pole":
      return -GRID.poleBackMetres;
    case "gridMid":
      return -(GRID.poleBackMetres + (GRID.gapMetres * last) / 2);
    case "gridBack":
      return -(GRID.poleBackMetres + GRID.gapMetres * last);
    case "scParked":
      return -(GRID.poleBackMetres + GRID.gapMetres * last + SCRIPT_RIG.scParkedBackM);
    case "line":
      return 0;
    default:
      return null;
  }
};

/** Where the safety car waits behind the grid before the start ({ x, y, heading, progress } in the sim plane). */
export const scParkedPose = (circuit, gridCount = 20) => {
  const progress = wrap(scriptAnchorM("scParked", gridCount) / circuit.length);
  return { ...poseAt(circuit, progress), progress };
};

/**
 * The shot from a scriptRig camera: { pos, look, fov, critDamp, cameraId, camType: "script", abs }.
 * `focus` is Race3D's { x, y, z, heading } of the car on air; `opts` { gridCount (cars on the grid),
 * world ({ field } on a real circuit) }. Positive sideM is towards the pit lane (circuit.pit.side).
 * null for an id scriptRig does not have.
 */
export const scriptShot = (id, focus, circuit, { gridCount = 20, world = null } = {}) => {
  const cam = SCRIPT_RIG.cams.find((entry) => entry.id === id);
  if (!cam || !circuit?.length) return null;
  const L = circuit.length;
  const sign = circuit.pit?.side || 1;
  const at = (anchor, alongM = 0) => {
    if (anchor === "subject") {
      const x = focus.x + Math.cos(focus.heading) * alongM;
      const y = focus.z + Math.sin(focus.heading) * alongM;
      return { x, y, heading: focus.heading };
    }
    return poseAt(circuit, wrap((scriptAnchorM(anchor, gridCount) + alongM) / L));
  };
  const base = at(cam.anchor, cam.alongM);
  const px = base.x - Math.sin(base.heading) * sign * cam.sideM;
  const pz = base.y + Math.cos(base.heading) * sign * cam.sideM;
  const real = Boolean(world?.field);
  const level = real ? focus.y || 0 : 0;
  const floor = real ? world.field.floorNear(px, pz, level) ?? level : 0;
  const pos = new THREE.Vector3(px, floor + cam.height, pz);
  const aimAt = cam.aim === "subject" ? { x: focus.x, y: focus.z } : at(cam.aim === "gridMid" ? "gridMid" : cam.anchor);
  const look = new THREE.Vector3(aimAt.x, level + FRAMING.aimUpM, aimAt.y);
  const distance = pos.distanceTo(look);
  const fov = THREE.MathUtils.clamp((2 * Math.atan(cam.width / 2 / Math.max(2, distance)) * 180) / Math.PI, SCRIPT_RIG.fovDeg.min, SCRIPT_RIG.fovDeg.max);
  return { pos, look, fov, critDamp: SCRIPT_RIG.critDamp, lookLag: SCRIPT_RIG.critDamp, cameraId: id, camType: "script", abs: real };
};

/** A script's `rig:<type>` shot: the fixed trackside camera of that type nearest the car (null if the rig has none). */
export const rigCamOfType = (rig, type, focus) => {
  let best = null;
  (rig || []).forEach((cam) => {
    if (cam.type !== type || cam.moving || !Number.isFinite(cam.x)) return;
    const d = Math.hypot(cam.x - focus.x, cam.z - focus.z);
    if (!best || d < best.d) best = { cam, d };
  });
  return best ? best.cam : null;
};

export const CAMERA_LABELS = {
  tv: ["TV", "TV"],
  chase: ["Persecución", "Chase"],
  drone: ["Dron", "Drone"],
  heli: ["Helicam", "Helicam"],
  ...Object.fromEntries(ONBOARDS.map((entry) => [entry.id, entry.label])),
  ...Object.fromEntries(SCRIPT_RIG.cams.map((entry) => [entry.id, entry.label])),
  map: ["Mapa", "Map"],
};
