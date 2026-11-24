/**
 * The pit-lane cameras (F1M24-GAMEPLAY §2.5 pit-sequence, CAM-3; RF-3D-04, RF-SIM-12, RNF-07).
 *
 * Placed on the pit lane the step race drives (engine/sim/pitLane.js laneGeometry: the mesh's
 * lane from tools/assets/blender/extract_pitlane.py or the procedural one), from
 * data/balance/broadcast.json pitRig: each camera hangs on an anchor of the lane (its entry, the
 * limit lines, where it passes the line, its end), on the track (where the lane leaves it, the
 * end of the white exit line, pitLinesFor) or on the box of the car on air, so the same rig fits
 * every circuit with a lane. `pitShot` frames the car (or its box: the crew waiting) from one of
 * them; the sequence that picks which is components/director/pitSequence.js.
 *
 * Sides: the lane's `circuit.pit.side` points from the track to the lane, so 'garage' is further
 * that way (the team's garage beyond the lane), 'wall' back towards the track (the pit wall) and
 * 'outside' the far side of the track. Heights are above the floor under the camera on a real
 * circuit (the height field's floorNear), above the flat plane on a procedural one.
 */

import * as THREE from "three";
import broadcast from "../data/balance/broadcast.json";
import { laneGeometry, pitLinesFor } from "../engine/sim/pitLane";
import { pitPoseAt, poseAt } from "../engine/trackGeometry";

const RIG = broadcast.pitRig;
const FRAMING = broadcast.framing;
const frac = (value) => value - Math.floor(value);

const alongCache = new WeakMap();
/** Cumulative metres along the lane's path points (pitPoseAt takes a share of the points, not of the distance). */
const pathAlong = (circuit) => {
  const known = alongCache.get(circuit);
  if (known) return known;
  const path = circuit.pit.path;
  const along = [0];
  for (let k = 1; k < path.length; k += 1) along.push(along[k - 1] + Math.hypot(path[k].x - path[k - 1].x, path[k].y - path[k - 1].y));
  alongCache.set(circuit, along);
  return along;
};

/** The lane's pose `metres` along it from its entry (clamped to the lane). */
export const lanePoseAt = (circuit, metres) => {
  const along = pathAlong(circuit);
  const total = along[along.length - 1] || 1;
  const m = Math.max(0, Math.min(total, metres));
  let k = 1;
  while (k < along.length - 1 && along[k] < m) k += 1;
  const span = along[k] - along[k - 1] || 1;
  const index = k - 1 + (m - along[k - 1]) / span;
  return pitPoseAt(circuit, index / Math.max(1, along.length - 1));
};

const sideSign = (circuit, side) => (side === "garage" ? 1 : -1) * (circuit.pit.side || 1);
const offset = (pose, sign, metres) => ({ x: pose.x - Math.sin(pose.heading) * sign * metres, y: pose.y + Math.cos(pose.heading) * sign * metres });

/** Metres along the lane of an anchor (null for the track anchors and the box). */
const laneAnchor = (geo, anchor) => ({ entry: 0, limitFrom: geo.limitFromS, line: geo.lineS, limitTo: geo.limitToS, exit: geo.total }[anchor] ?? null);

/**
 * The fixed pit cameras of a circuit (every anchor but the box): [{ id, x, z, y, height, aim,
 * width, at }] in the sim plane (`z` = the plane's y), `at` what it hangs on. The box cameras
 * come back as templates (`box: true`, no position) - `pitShot` places them on the car's box.
 * Empty for a circuit without a lane.
 */
export const buildPitRig = (circuit, rig = RIG) => {
  if (!circuit?.pit?.path || circuit.pit.path.length < 2) return [];
  const geo = laneGeometry(circuit);
  const lines = pitLinesFor(circuit);
  const L = circuit.length;
  return rig.cams.map((cam) => {
    const common = { id: cam.id, height: cam.height, aim: cam.aim, width: cam.width, anchor: cam.anchor, side: cam.side, dist: cam.dist, alongM: cam.alongM };
    if (cam.anchor === "box") return { ...common, box: true };
    let base;
    let sign;
    if (cam.anchor === "trackEntry" || cam.anchor === "trackExit") {
      const from = cam.anchor === "trackEntry" ? frac(circuit.pit.entry) : frac(lines?.exit?.toShare ?? circuit.pit.exit);
      base = poseAt(circuit, frac(from + cam.alongM / L));
      sign = cam.side === "outside" ? -(circuit.pit.side || 1) : sideSign(circuit, cam.side);
    } else {
      base = lanePoseAt(circuit, laneAnchor(geo, cam.anchor) + cam.alongM);
      sign = sideSign(circuit, cam.side);
    }
    const p = offset(base, sign, cam.dist);
    return { ...common, x: p.x, z: p.y, y: cam.height };
  });
};

/** A box camera placed on `box` ({ x, y, heading } in the sim plane). */
const onBox = (circuit, cam, box) => {
  const ahead = { x: box.x + Math.cos(box.heading) * cam.alongM, y: box.y + Math.sin(box.heading) * cam.alongM, heading: box.heading };
  const p = offset(ahead, sideSign(circuit, cam.side), cam.dist);
  return { ...cam, x: p.x, z: p.y, y: cam.height };
};

/** The middle of the lane's garages: the box camera's place when the car's own box is not known yet. */
export const laneBoxOf = (circuit) => {
  const geo = laneGeometry(circuit);
  const pose = lanePoseAt(circuit, (geo.slotFrom + geo.slotTo) / 2);
  return { x: pose.x, y: pose.y, heading: pose.heading };
};

/**
 * The shot from pit camera `id`: { pos, look, fov, critDamp, cameraId, camType: "pit", abs }.
 * `focus` is Race3D's { x, y, z, heading } of the car on air; `box` its box ({ x, y, heading }
 * from pitSequence.boxPointOf) or null (the middle of the garages); `world` { field } on a real
 * circuit. null when the circuit has no such camera.
 */
export const pitShot = (id, focus, circuit, pitRig, box = null, world = null) => {
  const template = pitRig.find((cam) => cam.id === id);
  if (!template) return null;
  const at = box || (template.box || template.aim === "box" ? laneBoxOf(circuit) : null);
  const cam = template.box ? onBox(circuit, template, at) : template;
  const real = Boolean(world?.field);
  const base = real ? focus.y || 0 : 0;
  const floor = real ? world.field.floorNear(cam.x, cam.z, base) ?? base : 0;
  const pos = new THREE.Vector3(cam.x, floor + cam.height, cam.z);
  const aimAt = cam.aim === "box" && at ? new THREE.Vector3(at.x, base + FRAMING.aimUpM, at.y) : new THREE.Vector3(focus.x, base + FRAMING.aimUpM, focus.z);
  const distance = pos.distanceTo(aimAt);
  const fov = THREE.MathUtils.clamp((2 * Math.atan(cam.width / 2 / Math.max(2, distance)) * 180) / Math.PI, RIG.fovDeg.min, RIG.fovDeg.max);
  return { pos, look: aimAt, fov, critDamp: RIG.critDamp, lookLag: RIG.critDamp, cameraId: id, camType: "pit", abs: real };
};
