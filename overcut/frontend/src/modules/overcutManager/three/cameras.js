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
  return { x: pose.x - Math.sin(pose.heading) * side * distance, z: pose.y + Math.cos(pose.heading) * side * distance, y: height };
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

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Where the camera goes this frame. `focus` is { x, z, heading, speed, share,
 * spec } for the car followed; `state` keeps what the camera needs between
 * frames (current tower, last cut). Returns { pos, look, fov, snap }.
 */
export const frame = (mode, focus, circuit, rig, state, dt) => {
  const dir = v3(Math.cos(focus.heading), 0, Math.sin(focus.heading));
  const side = v3(-Math.sin(focus.heading), 0, Math.cos(focus.heading));
  const car = v3(focus.x, 0, focus.z);
  const spec = focus.spec || {};
  const head = spec.head || [0.1, 0.72];

  if (mode === "tcam") {
    return { pos: car.clone().add(dir.clone().multiplyScalar(head[0] - 0.55)).setY(head[1] + 0.42), look: car.clone().add(dir.clone().multiplyScalar(40)).setY(0.4), fov: 68, snap: true };
  }
  if (mode === "tcamRear") {
    return { pos: car.clone().add(dir.clone().multiplyScalar(head[0] - 0.62)).setY(head[1] + 0.4), look: car.clone().add(dir.clone().multiplyScalar(-40)).setY(0.6), fov: 64, snap: true };
  }
  if (mode === "visor") {
    // The driver's eyes: low, inside the cockpit, the halo and the nose in view.
    return { pos: car.clone().add(dir.clone().multiplyScalar(head[0] + 0.08)).setY(head[1] + 0.02), look: car.clone().add(dir.clone().multiplyScalar(30)).setY(0.55), fov: 82, snap: true };
  }
  if (mode === "nose") {
    // Nose-side camera, 0.4 m above the ground beside the front wheels.
    return { pos: car.clone().add(dir.clone().multiplyScalar((spec.front || 1.6) + 0.35)).add(side.clone().multiplyScalar(0.22)).setY(0.42), look: car.clone().add(dir.clone().multiplyScalar(40)).setY(0.3), fov: 74, snap: true };
  }
  if (mode === "drone") {
    // A drone flying low behind and to one side, swinging round in the corners.
    state.droneSide = (state.droneSide ?? 1) * 0.995 + Math.sign(focus.turn || 0) * -0.005;
    const offset = side.clone().multiplyScalar(4.5 * state.droneSide);
    return { pos: car.clone().add(dir.clone().multiplyScalar(-11)).add(offset).setY(5.5), look: car.clone().add(dir.clone().multiplyScalar(2.5)).setY(0.2), fov: 50, lag: 3.5 };
  }
  if (mode === "heli") {
    // Helicam: high and wide, panning slowly over long stretches of track.
    const pos = car.clone().add(side.clone().multiplyScalar(70)).add(dir.clone().multiplyScalar(-55)).setY(130);
    return { pos, look: car.clone().add(dir.clone().multiplyScalar(25)), fov: 30, lag: 0.7 };
  }
  if (mode === "chase") {
    return { pos: car.clone().add(dir.clone().multiplyScalar(-8.5)).setY(2.5), look: car.clone().add(dir.clone().multiplyScalar(8)).setY(0.7), fov: 56, lag: 7 };
  }

  // TV: the director takes the camera covering this stretch, keeps it until the
  // car leaves it, and zooms to keep the car framed.
  const share = wrap(focus.share);
  let current = state.tvCam && inSpan(share, state.tvCam.from, state.tvCam.to) ? state.tvCam : null;
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
  let pos = v3(current.x, current.y, current.z);
  if (current.type === "cable") {
    // Runs above the main straight alongside the car.
    const along = poseAt(circuit, wrap(share - 18 / circuit.length));
    pos = v3(along.x, current.y, along.y);
  }
  const distance = pos.distanceTo(car.clone().setY(0.6));
  const fov = THREE.MathUtils.clamp((2 * Math.atan(current.width / 2 / Math.max(5, distance)) * 180) / Math.PI, 3.5, 60);
  const snap = state.cut;
  state.cut = false;
  return { pos, look: car.clone().add(dir.clone().multiplyScalar(Math.min(6, (focus.speed || 0) * 0.08))).setY(0.6), fov, snap, lookLag: 14 };
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
