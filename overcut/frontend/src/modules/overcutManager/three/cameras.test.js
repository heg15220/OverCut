/**
 * RF-3D-04 (TV, chase, onboard and helicopter cameras) on real GLB circuits
 * (RF-3D-03), within the RNF-02 budget: the height field built once from the
 * mesh, the rig fitted to it, and every camera mode in absolute heights. A
 * procedural circuit (no world) is framed exactly as before.
 */

import * as THREE from "three";
import { CAMERA_MODES, SIGHT_EVERY, buildRig, fitRig, frame } from "./cameras";
import { buildHeightField } from "./assets/assetCircuit";
import { circuitFor } from "../engine/venue";
import { poseAt } from "../engine/trackGeometry";

const circuit = circuitFor({ name: "Italian Grand Prix", circuit: "monza" }, 2005);
const now = () => Promise.resolve();

const focusAt = (share, y = 0) => {
  const pose = poseAt(circuit, share);
  return { x: pose.x, y, z: pose.y, heading: pose.heading, speed: 60, share, spec: {} };
};

describe("height field from the circuit mesh", () => {
  const scene = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 4, 4).rotateX(-Math.PI / 2));
  ground.position.y = 10;
  // A wall 8 m tall and 40 m long, 20 m to the east of the road.
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 40));
  wall.position.set(20, 14, 0);
  scene.add(ground, wall);
  const points = [[-50, 10, -50], [50, 10, -50], [50, 10, 50], [-50, 10, 50]];

  it("knows the ground, the wall and what lies between them", async () => {
    const field = await buildHeightField(scene, points, { yieldTo: now });
    expect(field.topNear(0, 0)).toBeCloseTo(10, 3);
    expect(field.topNear(20, 0)).toBeCloseTo(18, 3);
    expect(field.topNear(20, 10)).toBeCloseTo(18, 3);
    // A low camera behind the wall does not see the road; a tall one does.
    expect(field.sight({ x: 40, y: 13, z: 0 }, { x: 0, y: 10.8, z: 0 })).toBe(false);
    expect(field.sight({ x: 40, y: 40, z: 0 }, { x: 0, y: 10.8, z: 0 })).toBe(true);
    // The pit lane road: the floor beside the wall, not its top; nothing far from the reference.
    expect(field.floorNear(0, 0, 10)).toBeCloseTo(10, 3);
    expect(field.floorNear(0, 0, 40)).toBeNull();
    expect(field.topNear(5000, 5000)).toBeNull();
  });
});

describe("cameras on a procedural circuit (no world)", () => {
  it("keep the flat-plane heights they always had", () => {
    const focus = focusAt(0.3);
    expect(frame("chase", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(2.5, 6);
    expect(frame("heli", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(130, 6);
    expect(frame("nose", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(0.42, 6);
    const rig = buildRig(circuit);
    const shot = frame("tv", focus, circuit, rig, {}, 0.016);
    const cam = rig.filter((item) => item.from <= 0.3 && item.to >= 0.3).sort((a, b) => b.priority - a.priority)[0];
    expect(shot.abs).toBeFalsy();
    expect(shot.pos.y).toBe(cam.y);
  });
});

describe("cameras on a real circuit (RF-3D-03, RF-3D-04)", () => {
  // A road that climbs 40 m over the lap and a flat field 2 m below it.
  const heightAt = (share) => 100 + 40 * (((share % 1) + 1) % 1);
  const field = { topNear: () => 98, sight: () => true, floorNear: () => null };

  it("ride the road profile and come back in absolute heights", () => {
    const share = 0.5;
    const focus = focusAt(share, heightAt(share));
    const world = { heightAt, field };
    CAMERA_MODES.filter((mode) => mode !== "tv").forEach((mode) => {
      const shot = frame(mode, focus, circuit, [], {}, 0.016, world);
      expect(shot.abs).toBe(true);
      expect(shot.pos.y).toBeGreaterThan(focus.y - 0.1);
    });
    const chase = frame("chase", focus, circuit, [], {}, 0.016, world);
    expect(chase.pos.y).toBeCloseTo(heightAt(share - 8.5 / circuit.length) + 2.5, 4);
    expect(chase.look.y).toBeCloseTo(heightAt(share + 8 / circuit.length) + 0.7, 4);
    // A 120 m tower under the helicopter (not over the car).
    const tower = (x, z) => (Math.hypot(x - focus.x, z - focus.z) > 20 ? focus.y + 120 : 98);
    const heli = frame("heli", focus, circuit, [], {}, 0.016, { heightAt, field: { ...field, topNear: tower } });
    expect(heli.pos.y).toBeCloseTo(focus.y + 160, 4);
  });

  it("follow a car under a roof from below it", () => {
    const share = 0.5;
    const focus = focusAt(share, heightAt(share));
    const roof = { topNear: () => focus.y + 4.5, sight: () => false, floorNear: () => null };
    const world = { heightAt, field: roof };
    const heli = frame("heli", focus, circuit, [], {}, 0.016, world);
    expect(heli.fov).toBe(56);
    expect(heli.pos.y).toBeLessThan(focus.y + 4.5);
    const drone = frame("drone", focus, circuit, [], {}, 0.016, world);
    expect(drone.pos.y).toBeLessThan(focus.y + 4.5);
    const tv = frame("tv", focus, circuit, fitRig(buildRig(circuit), circuit, { topNear: () => 98, sight: () => true }, heightAt), {}, 0.016, world);
    expect(tv.fov).toBe(56);
  });

  it("fit the rig above the ground and drop the cameras that see nothing", () => {
    const rig = buildRig(circuit);
    const tall = fitRig(rig, circuit, { topNear: () => 98, sight: (a) => a.y > 125 }, heightAt);
    expect(tall.length).toBeGreaterThan(0);
    tall.filter((cam) => cam.type !== "cable").forEach((cam) => {
      expect(cam.abs).toBe(true);
      expect(cam.y).toBeGreaterThan(125);
    });
    const blind = fitRig(rig, circuit, { topNear: () => 98, sight: () => false }, heightAt);
    expect(blind.map((cam) => cam.type)).toEqual(["cable"]);
  });

  it("cut away from a tower that loses the car, to the helicopter if none sees it", () => {
    let open = true;
    const live = { topNear: () => 98, floorNear: () => null, sight: () => open };
    const rig = fitRig(buildRig(circuit), circuit, live, heightAt);
    const share = 0.3;
    const focus = focusAt(share, heightAt(share));
    const state = {};
    const first = frame("tv", focus, circuit, rig, state, 0.016, { heightAt, field: live });
    expect(first.abs).toBe(true);
    expect(first.snap).toBe(true);
    const tower = state.tvCam;
    expect(first.pos.y).toBeCloseTo(tower.y, 6);
    open = false;
    let shot = null;
    for (let i = 0; i < SIGHT_EVERY * 3; i += 1) shot = frame("tv", focus, circuit, rig, state, 0.016, { heightAt, field: live });
    expect(state.fallback).toBe(true);
    expect(shot.fov).toBe(30);
    open = true;
    for (let i = 0; i < SIGHT_EVERY; i += 1) shot = frame("tv", focus, circuit, rig, state, 0.016, { heightAt, field: live });
    expect(state.fallback).toBe(false);
    expect(state.tvCam).not.toBe(tower);
  });
});
