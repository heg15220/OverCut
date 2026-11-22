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

export const CAMERA_MODES = ["tv", "chase", "drone", "heli", "tcam", "visor", "nose", "tcamRear"];

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
  return cams;
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
  const pos = car.clone().add(side.clone().multiplyScalar(70)).add(dir.clone().multiplyScalar(-55)).setY(y0 + 130);
  const below = field ? field.topNear(pos.x, pos.z, 2) : null;
  if (below !== null && below + 40 > pos.y) pos.y = below + 40;
  return { pos, look: car.clone().add(dir.clone().multiplyScalar(25)).setY(y0), fov: 30, lag: 0.7, abs };
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
  const chaseShot = () => ({ pos: car.clone().add(dir.clone().multiplyScalar(-8.5)).setY(road(-8.5) + 2.5), look: car.clone().add(dir.clone().multiplyScalar(8)).setY(road(8) + 0.7), fov: 56, lag: 7, abs });

  if (mode === "tcam") {
    return { pos: car.clone().add(dir.clone().multiplyScalar(head[0] - 0.55)).setY(road(head[0] - 0.55) + head[1] + 0.42), look: car.clone().add(dir.clone().multiplyScalar(40)).setY(road(40) + 0.4), fov: 68, snap: true, abs };
  }
  if (mode === "tcamRear") {
    return { pos: car.clone().add(dir.clone().multiplyScalar(head[0] - 0.62)).setY(road(head[0] - 0.62) + head[1] + 0.4), look: car.clone().add(dir.clone().multiplyScalar(-40)).setY(road(-40) + 0.6), fov: 64, snap: true, abs };
  }
  if (mode === "visor") {
    // The driver's eyes: low, inside the cockpit, the halo and the nose in view.
    return { pos: car.clone().add(dir.clone().multiplyScalar(head[0] + 0.08)).setY(road(head[0] + 0.08) + head[1] + 0.02), look: car.clone().add(dir.clone().multiplyScalar(30)).setY(road(30) + 0.55), fov: 82, snap: true, abs };
  }
  if (mode === "nose") {
    // Nose-side camera, 0.4 m above the ground beside the front wheels.
    const ahead = (spec.front || 1.6) + 0.35;
    return { pos: car.clone().add(dir.clone().multiplyScalar(ahead)).add(side.clone().multiplyScalar(0.22)).setY(road(ahead) + 0.42), look: car.clone().add(dir.clone().multiplyScalar(40)).setY(road(40) + 0.3), fov: 74, snap: true, abs };
  }
  if (mode === "drone") {
    // A drone flying low behind and to one side, swinging round in the corners.
    state.droneSide = (state.droneSide ?? 1) * 0.995 + Math.sign(focus.turn || 0) * -0.005;
    const offset = side.clone().multiplyScalar(4.5 * state.droneSide);
    const pos = car.clone().add(dir.clone().multiplyScalar(-11)).add(offset).setY(road(-11) + 5.5);
    if (covered) {
      // Under cover it flies below the roof.
      pos.y = Math.max(y0 + 1.5, Math.min(pos.y, overhead - 1));
    } else if (field) {
      // Over a barrier or a fence beside the road it flies a little higher (not onto a bridge or a roof).
      const below = field.topNear(pos.x, pos.z, 1);
      if (below !== null && below > pos.y - 1.5 && below < road(-11) + 8) pos.y = below + 1.5;
    }
    return { pos, look: car.clone().add(dir.clone().multiplyScalar(2.5)).setY(road(2.5) + 0.2), fov: 50, lag: 3.5, abs };
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
  tcam: ["T-cam", "T-cam"],
  visor: ["Visor", "Visor"],
  nose: ["Morro", "Nose"],
  tcamRear: ["T-cam trasera", "Rear T-cam"],
  map: ["Mapa", "Map"],
};
