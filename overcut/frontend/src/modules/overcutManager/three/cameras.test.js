/**
 * RF-3D-04 (TV, chase, onboard and helicopter cameras) on real GLB circuits
 * (RF-3D-03), within the RNF-02 budget: the height field built once from the
 * mesh, the rig fitted to it, and every camera mode in absolute heights. A
 * procedural circuit (no world) is framed exactly as before.
 */

import * as THREE from "three";
import Ajv from "ajv";
import cameraSchema from "../engine/packs/schema/cameras.schema.json";
import cameraData from "../data/balance/cameras.json";
import { CAMERA_LABELS, CAMERA_MODES, ONBOARDS, SIGHT_EVERY, buildRig, fitRig, frame, modeForYear, onboardsFor, seedOf, shakeOffset } from "./cameras";
import { buildHeightField } from "./assets/assetCircuit";
import { circuitFor } from "../engine/venue";
import { poseAt } from "../engine/trackGeometry";

const circuit = circuitFor({ name: "Italian Grand Prix", circuit: "monza" }, 2005);
const now = () => Promise.resolve();
// A share of the lap seen by at least `count` cameras of the rig that do not wrap past the
// line, so the tests do not depend on where the physical speed trace puts each braking zone.
const coveredShare = (rig, count = 1) => {
  const spans = rig.filter((cam) => cam.type !== "cable" && cam.from >= 0 && cam.to <= 1 && cam.from < cam.to);
  for (let share = 0.05; share < 0.95; share += 0.0025) {
    if (spans.filter((cam) => cam.from <= share && cam.to >= share).length >= count) return share;
  }
  throw new Error(`no share seen by ${count} cameras`);
};

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
    const rig = buildRig(circuit);
    const at = coveredShare(rig);
    const focus = focusAt(at);
    expect(frame("chase", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(2.5, 6);
    expect(frame("heli", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(130, 6);
    expect(frame("nose", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(0.42, 6);
    const shot = frame("tv", focus, circuit, rig, {}, 0.016);
    const cam = rig.filter((item) => item.from <= at && item.to >= at).sort((a, b) => b.priority - a.priority)[0];
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
    const share = coveredShare(rig, 2);
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

// ---------------------------------------------------------------- CAM-1 onboard mounts

describe("cameras.json (RNF-07, F1M24-GAMEPLAY §2.5 onboard-mounts)", () => {
  it("passes its JSON schema; ids are unique and every figure says where it comes from", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(cameraSchema);
    const ok = validate(cameraData);
    expect(validate.errors).toBeNull();
    expect(ok).toBe(true);
    const ids = cameraData.onboard.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    cameraData.onboard.filter((entry) => entry.status === "pending").forEach((entry) => expect(entry.source).toMatch(/pending/));
    cameraData.onboard.forEach((entry) => expect(CAMERA_LABELS[entry.id]).toEqual(entry.label));
  });

  it("films each season only with the onboards it had (SRS 6.2)", () => {
    const ids = (year) => onboardsFor(year).map((entry) => entry.id);
    // Before the first onboard cameras, only trackside ones.
    expect(ids(1976)).toEqual([]);
    expect(modeForYear("tcam", 1976)).toBe("chase");
    expect(modeForYear("tv", 1976)).toBe("tv");
    expect(modeForYear("heli", 1976)).toBe("heli");
    // The T-cam with the pod the car model draws; the halo camera only with the halo (2018).
    expect(ids(1990)).not.toContain("tcam");
    expect(ids(2005)).toContain("tcam");
    expect(ids(2017)).not.toContain("halo");
    expect(ids(2018)).toContain("halo");
    expect(modeForYear("halo", 2012)).toBe("chase");
    expect(modeForYear("halo", 2024)).toBe("halo");
    // The close-up is for replays only.
    expect(ids(2024)).not.toContain("closeUp");
    expect(onboardsFor(2024, { replay: true }).map((entry) => entry.id)).toContain("closeUp");
    expect(modeForYear("closeUp", 2024)).toBe("chase");
    expect(CAMERA_MODES).not.toContain("closeUp");
  });

  it("keeps the mounts OverCut had before CAM-1 (status current)", () => {
    const focus = { ...focusAt(0.3), spec: { head: [0.15, 0.7], front: 1.6 } };
    const dir = new THREE.Vector3(Math.cos(focus.heading), 0, Math.sin(focus.heading));
    const along = (p) => (p.x - focus.x) * dir.x + (p.z - focus.z) * dir.z;
    const tcam = frame("tcam", focus, circuit, [], {}, 0.016);
    expect(tcam.pos.y).toBeCloseTo(0.7 + 0.42, 6);
    expect(along(tcam.pos)).toBeCloseTo(0.15 - 0.55, 6);
    expect(tcam.fov).toBe(68);
    expect(tcam.near).toBe(0.05);
    const rear = frame("tcamRear", focus, circuit, [], {}, 0.016);
    expect(rear.pos.y).toBeCloseTo(0.7 + 0.4, 6);
    expect(along(rear.look)).toBeCloseTo(-40, 6);
    expect(rear.fov).toBe(64);
    const visor = frame("visor", focus, circuit, [], {}, 0.016);
    expect(visor.pos.y).toBeCloseTo(0.72, 6);
    expect(visor.fov).toBe(82);
    const nose = frame("nose", focus, circuit, [], {}, 0.016);
    expect(along(nose.pos)).toBeCloseTo(1.95, 6);
    expect(Math.hypot(nose.pos.x - focus.x, nose.pos.z - focus.z)).toBeCloseTo(Math.hypot(1.95, 0.22), 6);
    expect(nose.fov).toBe(74);
    // The new ones sit where their data says: the sidepod camera ~0.6 m up.
    expect(frame("sidepod", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(0.6, 6);
    expect(frame("halo", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(0.7 + 0.3, 6);
    // The cockpit-side camera looks back at the driver, not down the road.
    const side = frame("cockpitSide", focus, circuit, [], {}, 0.016);
    expect(along(side.look) - along(side.pos)).toBeLessThan(0);
  });

  it("vibrates with seeded noise: the same at the same race time, bounded, still when slow (RNF-05)", () => {
    const { shake } = ONBOARDS.find((entry) => entry.id === "tcam");
    const seed = seedOf("ham|tcam");
    expect(seedOf("ham|tcam")).toBe(seed);
    expect(seedOf("ver|tcam")).not.toBe(seed);
    const a = Array.from({ length: 400 }, (_, i) => shakeOffset(shake, 80, i * 0.0137, seed));
    const b = Array.from({ length: 400 }, (_, i) => shakeOffset(shake, 80, i * 0.0137, seed));
    expect(a).toEqual(b);
    const amp = Math.min(shake.max, 80 * shake.perSpeed);
    expect(Math.max(...a.map(Math.abs))).toBeLessThanOrEqual(amp / 2 + 1e-12);
    expect(new Set(a.map((value) => value.toFixed(6))).size).toBeGreaterThan(50);
    expect(shakeOffset(shake, 3, 1.5, seed)).toBe(0);
    expect(shakeOffset(undefined, 80, 1.5, seed)).toBe(0);
    // Continuous in time: no jump bigger than the amplitude between two frames at 60 fps.
    const steps = Array.from({ length: 199 }, (_, i) => Math.abs(shakeOffset(shake, 80, (i + 1) / 60, seed) - shakeOffset(shake, 80, i / 60, seed)));
    expect(Math.max(...steps)).toBeLessThan(amp);
  });

  it("names every trackside camera, so the director and the camera bus can say which is on air", () => {
    const rig = buildRig(circuit);
    const ids = rig.map((cam) => cam.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    const fitted = fitRig(rig, circuit, { topNear: () => 98, sight: () => true }, (share) => 100 + share);
    expect(fitted.map((cam) => cam.id)).toEqual(ids.filter((id) => fitted.some((cam) => cam.id === id)));
  });
});

describe("the gear on the steering wheel (F1M24-GAMEPLAY §2.5)", () => {
  it("reads the power unit's gear, only on cars of the years with a wheel display", () => {
    const drawn = [];
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
      new Proxy({}, { get: (target, key) => (key in target ? target[key] : key === "fillText" ? (text) => drawn.push(text) : () => ({ addColorStop: () => {} })), set: (target, key, value) => { target[key] = value; return true; } }),
    );
    try {
      // eslint-disable-next-line global-require
      const { buildCar, gearText, hasWheelDisplay } = require("./carModel");
      expect(gearText(0)).toBe("N");
      expect(gearText(-1)).toBe("R");
      expect(gearText(7)).toBe("7");
      expect(gearText(undefined)).toBe("");
      expect(hasWheelDisplay(cameraData.wheelDisplay.from - 1)).toBe(false);
      expect(buildCar({ year: 1976, color: "#c8102e" }).userData.setGear).toBeUndefined();
      const car = buildCar({ year: 2024, color: "#c8102e" });
      expect(car.getObjectByName("wheel-display")).toBeUndefined();
      drawn.length = 0;
      car.userData.setGear(5);
      car.userData.setGear(5);
      car.userData.setGear(6);
      expect(drawn).toEqual(["5", "6"]);
      expect(car.getObjectByName("wheel-display")).toBeInstanceOf(THREE.Mesh);
    } finally {
      getContext.mockRestore();
    }
  });
});
