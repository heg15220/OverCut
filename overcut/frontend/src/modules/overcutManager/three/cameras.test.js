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
import zonesSchema from "../engine/packs/schema/camera-zones.schema.json";
import broadcastData from "../data/balance/broadcast.json";
import splineData from "../data/splines.json";
import zoneFiles from "../data/circuits/cameraZones";
import {
  CAMERA_LABELS, CAMERA_MODES, ONBOARDS, SIGHT_EVERY, buildCameraZones, buildPitRig, buildRig, buildZoneRig, critDampStep, fitRig, frame, frameWidth, framingFor,
  laneBoxOf, lanePoseAt, modeForYear, onboardsFor, pickVariant, pitShot, seedOf, shakeOffset, tvRival, zonesFor,
} from "./cameras";
import { cameraFor } from "../components/director/directorState";
import { buildHeightField } from "./assets/assetCircuit";
import { circuitFor } from "../engine/venue";
import { distanceAtTimeShare, poseAt } from "../engine/trackGeometry";

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

// ---------------------------------------------------------------- CAM-2 camera zones and TV lens

describe("camera zones (F1M24-GAMEPLAY §2.5 camera-zones, CAM-2; RF-3D-03, RF-3D-04, RNF-05, RNF-07)", () => {
  const bahrain = circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024);

  // buildRig as it was in code before CAM-2: the template must give exactly the same cameras.
  const legacyRig = (c) => {
    const len = c.length;
    const wrap = (v) => ((v % 1) + 1) % 1;
    const inSpan = (share, from, to) => {
      const s = wrap(share);
      const a = wrap(from);
      const b = wrap(to);
      return a <= b ? s >= a && s <= b : s >= a || s <= b;
    };
    const out = (share, side, distance, height) => {
      const pose = poseAt(c, wrap(share));
      return { x: pose.x - Math.sin(pose.heading) * side * distance, z: pose.y + Math.cos(pose.heading) * side * distance, y: height, at: wrap(share), side, dist: distance };
    };
    const cams = [];
    c.brakingZones.forEach((zone) => {
      const corner = c.corners.find((item) => item.number === zone.corner) || c.corners[0];
      cams.push({ type: "braking", ...out(zone.at + 25 / len, -(corner?.sign || 1), 22, 5), from: zone.at - Math.min(0.08, (zone.metres * 0.8) / len), to: zone.at + 10 / len, priority: 3, width: 26 });
    });
    c.corners.forEach((corner) => {
      const distance = corner.kind === "slow" ? 38 : corner.kind === "medium" ? 52 : 68;
      cams.push({ type: "corner", ...out(corner.apex, -(corner.sign || 1), distance, corner.kind === "slow" ? 9 : 7), from: corner.from - 30 / len, to: corner.to + 60 / len, priority: 2, width: 30 });
    });
    for (let share = 0; share < 1; share += 260 / len) {
      if (cams.some((cam) => inSpan(share, cam.from, cam.to))) continue;
      const side = Math.round(share * 97) % 2 ? 1 : -1;
      cams.push({ type: "straight", ...out(share + 60 / len, side, 30, 4), from: share - 140 / len, to: share + 130 / len, priority: 1, width: 40 });
    }
    cams.push({ type: "grandstand", ...out(0, c.clockwise ? -1 : 1, 46, 20), from: -110 / len, to: 60 / len, priority: 4, width: 46 });
    cams.push({ type: "cable", x: 0, y: 24, z: 0, from: -360 / len, to: -110 / len, priority: 5, width: 40 });
    return cams.map((cam, index) => ({ ...cam, id: `${cam.type}-${index}` }));
  };

  // One lap at 1x on the circuit's own speed trace, 60 frames a second: the camera cuts, counted
  // from the camera on air (state.tvCam), as the camera-change events of the view would.
  const filmLap = (c, rig, lap, seed, state = { seed }) => {
    const frames = Math.round(c.simulatedLap * 60);
    const shots = [];
    for (let i = 0; i <= frames; i += 1) {
      const d = distanceAtTimeShare(c, i / frames);
      const pose = poseAt(c, d);
      frame("tv", { x: pose.x, y: 0, z: pose.y, heading: pose.heading, speed: 60, share: lap + d, spec: {} }, c, rig, state, 1 / 60);
      const id = state.tvCam?.id;
      if (!shots.length || shots[shots.length - 1].id !== id) shots.push({ id, from: i / 60 });
    }
    return shots;
  };

  it("broadcast.json wires the old rig: buildRig gives the same cameras it had in code (RNF-07)", () => {
    [bahrain, circuit, circuitFor({ name: "Monaco Grand Prix", circuit: "monaco" }, 1990)].forEach((c) => {
      const now = buildRig(c);
      const old = legacyRig(c);
      expect(now.map((cam) => cam.id)).toEqual(old.map((cam) => cam.id));
      now.forEach((cam, i) => {
        ["x", "y", "z", "from", "to", "priority", "width"].forEach((key) => expect(cam[key]).toBeCloseTo(old[i][key], 9));
      });
    });
  });

  it("every camera-zones.json passes its schema, covers its lap without gaps or overlaps and matches the generator", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(zonesSchema);
    const types = new Set(broadcastData.rigTemplate.types.map((entry) => entry.type));
    const ids = Object.keys(zoneFiles);
    expect(ids.length).toBe(Object.keys(splineData.splines).length);
    ids.forEach((id) => {
      const file = zoneFiles[id];
      expect(validate(file)).toBe(true);
      expect(validate.errors).toBeNull();
      expect(file.splineId).toBe(id);
      const zones = file.zones;
      for (let i = 0; i < zones.length; i += 1) {
        const next = zones[(i + 1) % zones.length];
        const end = i === zones.length - 1 ? next.fromM + file.lengthM : next.fromM;
        expect(Math.abs(zones[i].toM - end)).toBeLessThan(0.11);
        expect(zones[i].toM).toBeGreaterThan(zones[i].fromM);
        zones[i].cams.forEach((cam) => expect(types.has(cam.type)).toBe(true));
      }
      // Hand edits aside, the file is what tools/assets/camera_zones.mjs makes of the circuit now.
      const spline = splineData.splines[id];
      const built = buildCameraZones(circuitFor({ circuit: spline.layoutRef }, Math.min(spline.validTo, 2026)));
      expect(file.edited ? zones : built.zones).toEqual(zones);
    });
    // The view films a calibrated circuit with its file; a procedural one with zones of its own.
    expect(zonesFor(bahrain).source).toBe("file");
    expect(zonesFor(circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 1990)).source).toBe("built");
  });

  it("films Bahrain at 1x with 18-24 shots a lap, cut by position (cameras.md §2)", () => {
    const rig = buildZoneRig(bahrain);
    expect(rig.every((cam) => cam.zone !== undefined && cam.id)).toBe(true);
    const zones = zonesFor(bahrain).zones;
    expect(zones.length).toBeGreaterThanOrEqual(18);
    expect(zones.length).toBeLessThanOrEqual(24);
    const state = { seed: 1234 };
    filmLap(bahrain, rig, 0, 1234, state);
    [1, 2, 3].forEach((lap) => {
      const shots = filmLap(bahrain, rig, lap, 1234, state);
      // A lap flown on from the last: the first entry is the shot still on air from the line.
      const cuts = shots.length - 1;
      expect(cuts).toBeGreaterThanOrEqual(18);
      expect(cuts).toBeLessThanOrEqual(24);
      // The shot lasts what the car takes to cross its zone: ~4 s on average, as the reference.
      expect(bahrain.simulatedLap / cuts).toBeGreaterThan(3);
      expect(bahrain.simulatedLap / cuts).toBeLessThan(6);
    });
  });

  it("draws each zone's camera with the race seed, never the one of the lap before (RNF-05)", () => {
    const rig = buildZoneRig(bahrain);
    const ids = (seed, lap) => filmLap(bahrain, rig, lap, seed).map((shot) => shot.id);
    // Same seed, same broadcast - also when the view joins the race at lap 30 with a fresh state.
    expect(ids(77, 30)).toEqual(ids(77, 30));
    expect(ids(78, 30)).not.toEqual(ids(77, 30));
    const zones = zonesFor(bahrain).zones;
    let alternatives = 0;
    zones.forEach((zone, zoneIndex) => {
      if (zone.cams.length < 2) return;
      alternatives += 1;
      const picks = Array.from({ length: 40 }, (_, lap) => pickVariant(zone.cams, { seed: 77, zoneIndex, lap }));
      for (let lap = 1; lap < picks.length; lap += 1) expect(picks[lap]).not.toBe(picks[lap - 1]);
      expect(new Set(picks).size).toBeGreaterThan(1);
    });
    expect(alternatives).toBeGreaterThan(10);
    // A camera of weight 0 is never drawn while another can be; a single camera is always on air.
    const cams = [{ type: "corner", weight: 0 }, { type: "highWide", weight: 1 }, { type: "passPan", weight: 1 }];
    for (let lap = 0; lap < 30; lap += 1) expect(pickVariant(cams, { seed: 5, zoneIndex: 2, lap })).not.toBe(0);
    expect(pickVariant([{ type: "corner" }], { seed: 5, zoneIndex: 2, lap: 9 })).toBe(0);
    // The director names the same camera the view puts on air.
    const share = 30 + zones[5].fromM / zonesFor(bahrain).lengthM + 0.001;
    const pose = poseAt(bahrain, share % 1);
    const shot = frame("tv", { x: pose.x, y: 0, z: pose.y, heading: pose.heading, speed: 60, share, spec: {} }, bahrain, rig, { seed: 77 }, 1 / 60);
    expect(cameraFor(rig, share, null, { seed: 77 }).id).toBe(shot.cameraId);
  });

  it("places the new camera types: tracking beside the car, the cable and the tracker never fitted to the mesh", () => {
    const rig = buildZoneRig(bahrain);
    const types = new Set(rig.map((cam) => cam.type));
    ["braking", "corner", "straight", "headOn", "passPan", "lateralTrack", "highWide", "grandstand", "cable"].forEach((type) => expect(types.has(type)).toBe(true));
    const tracker = rig.find((cam) => cam.type === "lateralTrack");
    const share = (tracker.from + tracker.to) / 2;
    const pose = poseAt(bahrain, share);
    const focus = { x: pose.x, y: 0, z: pose.y, heading: pose.heading, speed: 60, share, spec: {} };
    const shot = frame("tv", focus, bahrain, [tracker], {}, 1 / 60);
    const t = broadcastData.rigTemplate.types.find((entry) => entry.type === "lateralTrack");
    expect(shot.pos.y).toBeCloseTo(t.height, 6);
    expect(Math.hypot(shot.pos.x - focus.x, shot.pos.z - focus.z)).toBeCloseTo(Math.hypot(t.dist, t.lagM), 0);
    const fitted = fitRig(rig, bahrain, { topNear: () => 98, sight: () => false }, () => 100);
    expect(new Set(fitted.map((cam) => cam.type))).toEqual(new Set(["cable", "lateralTrack"]));
  });
});

describe("TV lens (F1M24-GAMEPLAY §2.5 tv-lens-behaviour, CAM-2)", () => {
  const car = broadcastData.rigTemplate.carLengthM;

  it("keeps the car within its framing share of the frame, for every camera type", () => {
    broadcastData.rigTemplate.types.forEach((t) => {
      const { minShare, maxShare } = framingFor(t.type);
      const share = car / frameWidth(t);
      expect(share).toBeGreaterThanOrEqual(minShare - 1e-9);
      expect(share).toBeLessThanOrEqual(maxShare + 1e-9);
    });
    // The old rig's widths (26-46 m) are inside the default framing: its TV shots are unchanged.
    buildRig(circuit).forEach((cam) => expect(frameWidth(cam)).toBe(cam.width));
  });

  it("opens the frame for two when a rival is close, and aims between them", () => {
    const rig = buildRig(circuit);
    const at = coveredShare(rig);
    const focus = focusAt(at);
    const alone = frame("tv", focus, circuit, rig, {}, 0.016);
    const dir = { x: Math.cos(focus.heading), z: Math.sin(focus.heading) };
    const rival = { x: focus.x + dir.x * 25, z: focus.z + dir.z * 25 };
    const pair = frame("tv", { ...focus, rival }, circuit, rig, {}, 0.016);
    expect(pair.pair).toBe(true);
    expect(pair.fov).toBeGreaterThan(alone.fov);
    const along = (p) => (p.x - focus.x) * dir.x + (p.z - focus.z) * dir.z;
    expect(along(pair.look) - along(alone.look)).toBeCloseTo(12.5, 6);
    const beyond = broadcastData.framing.battle.maxGapM + 10;
    const apart = frame("tv", { ...focus, rival: { x: focus.x + dir.x * beyond, z: focus.z + dir.z * beyond } }, circuit, rig, {}, 0.016);
    expect(apart.pair).toBe(false);
    expect(apart.fov).toBeCloseTo(alone.fov, 9);
    expect(alone.critDamp).toBe(broadcastData.framing.byType.default.critDamp);
  });

  it("follows on a critically damped spring: no overshoot, stable at any step", () => {
    [0.004, 0.016, 0.1, 0.5].forEach((h) => {
      let s = { x: 0, v: 0 };
      let last = 0;
      for (let i = 0; i < 400; i += 1) {
        s = critDampStep(s.x, s.v, 10, 14, h);
        expect(s.x).toBeLessThanOrEqual(10 + 1e-9);
        expect(s.x).toBeGreaterThanOrEqual(last - 1e-9);
        last = s.x;
      }
      expect(s.x).toBeCloseTo(10, 3);
    });
  });

  it("frames the rival the focused car is racing: the SIM-4 battle state first, the gap otherwise", () => {
    const objects = new Map(["a", "b", "c"].map((id) => [id, { speed: 80, object: { position: { x: 0, z: 0 } }, id }]));
    const row = (id, metres, extra = {}) => ({ car: { id }, metres, pose: { progress: metres / 5000 }, ...extra });
    const gap = broadcastData.director.battleGapSec;
    const ordered = [row("a", 1000), row("b", 1000 - 80 * gap * 0.5), row("c", 1000 - 80 * gap * 3)];
    expect(tvRival(ordered, "b", objects).id).toBe("a");
    expect(tvRival(ordered, "c", objects)).toBeNull();
    expect(tvRival(ordered, "a", objects).id).toBe("b");
    const defending = [row("a", 1000), row("b", 990, { battle: "DEFENDING" }), row("c", 500)];
    expect(tvRival(defending, "b", objects).id).toBe("c");
    expect(tvRival([row("a", 1000), row("b", 990, { battle: "RUNNING" })], "b", objects)).toBeNull();
    expect(tvRival([row("a", 1000, { pose: { inPit: true } }), row("b", 990)], "b", objects)).toBeNull();
  });
});

describe("pit-lane cameras (F1M24-GAMEPLAY §2.5 pit-sequence, CAM-3; RF-3D-04, RF-SIM-12, RNF-07)", () => {
  const bahrain = circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024);
  const PIT_RIG = broadcastData.pitRig;
  // Which side of the lane (or the track) a point lies on, in the sense of circuit.pit.side.
  const sideOf = (pose, p) => Math.sign(-(p.x - pose.x) * Math.sin(pose.heading) + (p.z - pose.y) * Math.cos(pose.heading));

  [["Bahrain 2024", bahrain], ["Monza 2005", circuit]].forEach(([name, c]) => {
    it(`${name}: every camera of broadcast.json pitRig on its side of the lane, the box ones on the car's box`, () => {
      const rig = buildPitRig(c);
      expect(rig.map((cam) => cam.id)).toEqual(PIT_RIG.cams.map((cam) => cam.id));
      const pitSide = c.pit.side || 1;
      rig.forEach((cam) => {
        if (cam.box) return;
        expect(Number.isFinite(cam.x) && Number.isFinite(cam.z)).toBe(true);
        const template = PIT_RIG.cams.find((entry) => entry.id === cam.id);
        if (template.dist === 0) return;
        // The anchor's pose, as buildPitRig takes it.
        const anchorPose = cam.anchor.startsWith("track")
          ? poseAt(c, (((cam.anchor === "trackEntry" ? c.pit.entry : c.pit.exit) + template.alongM / c.length) % 1 + 1) % 1)
          : null;
        const expected = cam.side === "garage" ? pitSide : -pitSide;
        if (anchorPose && cam.anchor === "trackEntry") expect(sideOf(anchorPose, cam)).toBe(expected);
      });
      const box = laneBoxOf(c);
      const focus = { x: box.x, y: 0, z: box.y, heading: box.heading };
      rig.forEach((cam) => {
        const shot = pitShot(cam.id, focus, c, rig, box, null);
        expect(shot).toMatchObject({ camType: "pit", cameraId: cam.id });
        expect([shot.pos.x, shot.pos.y, shot.pos.z, shot.look.x, shot.look.z].every(Number.isFinite)).toBe(true);
        expect(shot.fov).toBeGreaterThanOrEqual(PIT_RIG.fovDeg.min);
        expect(shot.fov).toBeLessThanOrEqual(PIT_RIG.fovDeg.max);
      });
      // The crew camera stands on the wall side of the car's box, looking at the box.
      const garage = PIT_RIG.cams.find((cam) => cam.id === "garage");
      const shot = pitShot("garage", { ...focus, x: focus.x + 30 }, c, rig, box, null);
      expect(Math.hypot(shot.pos.x - box.x, shot.pos.z - box.y)).toBeCloseTo(Math.hypot(garage.alongM, garage.dist), 6);
      expect(sideOf({ ...box }, { x: shot.pos.x, z: shot.pos.z })).toBe(-pitSide);
      expect(shot.look.x).toBeCloseTo(box.x, 9);
      expect(shot.look.z).toBeCloseTo(box.y, 9);
    });
  });

  it("lane poses run from the lane's entry to its exit by distance", () => {
    const start = lanePoseAt(bahrain, 0);
    const end = lanePoseAt(bahrain, 1e9);
    expect(start.x).toBeCloseTo(bahrain.pit.path[0].x, 6);
    expect(end.x).toBeCloseTo(bahrain.pit.path[bahrain.pit.path.length - 1].x, 0);
    const a = lanePoseAt(bahrain, 100);
    const b = lanePoseAt(bahrain, 110);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(10, 0);
  });

  it("no lane, no pit cameras; an unknown camera gives no shot", () => {
    expect(buildPitRig({ ...bahrain, pit: null })).toEqual([]);
    expect(pitShot("nope", { x: 0, y: 0, z: 0, heading: 0 }, bahrain, buildPitRig(bahrain))).toBeNull();
  });

  it("a replay angle locks the TV on one tower whatever the car does (state.lockCam)", () => {
    const rig = buildZoneRig(circuit);
    const lock = rig.find((cam) => !cam.moving && cam.type !== "cable");
    const state = { lockCam: lock };
    const far = focusAt(((lock.to + 0.3) % 1 + 1) % 1);
    const shot = frame("tv", far, circuit, rig, state, 0.016);
    expect(shot.cameraId).toBe(lock.id);
    expect(state.tvCam).toBe(lock);
  });
});