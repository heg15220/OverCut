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
  heliGeometry, hfovOf, onboardFor, vfovOf, REF_ASPECT, angularShake, carBodyFrame, onboardWobble, roadRoughness,
} from "./cameras";
import { onRacingLine } from "./racingLine";
import { positionAt, trackDataFor } from "../engine/trackData";
import racePhysics from "../data/balance/race-physics.json";
import { zonePlanFor } from "./cameraZones";
import { carSpec } from "./carBody";
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
    // CAM-C1 (VIEW-12): the helicopter's height comes from its elevation and framing share.
    expect(frame("heli", focus, circuit, [], {}, 0.016).pos.y).toBeCloseTo(heliGeometry().height, 6);
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
    expect(shot.fov).toBeCloseTo(heliGeometry().vfov, 9);
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
    // CAM-C1 (VIEW-03): the high cockpit camera before the halo, not with it.
    expect(ids(1992)).not.toContain("cockpitHigh");
    expect(ids(2013)).toContain("cockpitHigh");
    expect(ids(2017)).toContain("cockpitHigh");
    expect(ids(2018)).not.toContain("cockpitHigh");
    expect(modeForYear("cockpitHigh", 2024)).toBe("chase");
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
    // Moved on 26/11/2026: just behind the helmet and above the airbox, looking down over the
    // nose (the broadcast T-cam); the old mount sat inside the GLB airbox and showed only its back.
    expect(tcam.pos.y).toBeCloseTo(0.7 + 0.52, 6);
    expect(along(tcam.pos)).toBeCloseTo(0.15 - 0.35, 6);
    expect(tcam.look.y).toBeLessThan(tcam.pos.y);
    // CAM-C1 (VIEW-03): tilted by its horizon share, with the 100° horizontal lens (~68° vertical at 16:9).
    expect(tcam.fov).toBeCloseTo(vfovOf(100, REF_ASPECT), 9);
    expect(Math.abs(tcam.fov - 68)).toBeLessThan(0.5);
    expect(tcam.near).toBe(0.05);
    // The others keep their look at 16:9: their horizontal lens is the old vertical one there.
    const rear = frame("tcamRear", focus, circuit, [], {}, 0.016);
    expect(rear.pos.y).toBeCloseTo(0.7 + 0.4, 6);
    expect(along(rear.look)).toBeCloseTo(-40, 6);
    expect(rear.fov).toBeCloseTo(64, 1);
    const visor = frame("visor", focus, circuit, [], {}, 0.016);
    expect(visor.pos.y).toBeCloseTo(0.72, 6);
    expect(visor.fov).toBeCloseTo(82, 1);
    const nose = frame("nose", focus, circuit, [], {}, 0.016);
    expect(along(nose.pos)).toBeCloseTo(1.95, 6);
    expect(Math.hypot(nose.pos.x - focus.x, nose.pos.z - focus.z)).toBeCloseTo(Math.hypot(1.95, 0.22), 6);
    expect(nose.fov).toBeCloseTo(74, 1);
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
        expect(anchorPose && cam.anchor === "trackEntry" ? sideOf(anchorPose, cam) : expected).toBe(expected);
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

// ---------------------------------------------------------------- CAM-C1 (F1M24-CHINA §2.3-§2.4, §3.1)

// The horizontal share of the frame a box of world points covers, seen through a shot on a canvas of `aspect`.
const widthShare = (shot, aspect, points) => {
  const cam = new THREE.PerspectiveCamera(shot.fov, aspect, 0.05, 5000);
  cam.position.copy(shot.pos);
  cam.lookAt(shot.look);
  cam.updateMatrixWorld();
  const xs = points.map((p) => p.clone().project(cam)).filter((p) => p.z < 1).map((p) => p.x);
  if (!xs.length) return 0;
  return Math.max(0, Math.min(1, Math.max(...xs)) - Math.max(-1, Math.min(...xs))) / 2;
};
// The eight corners of a box `length` × `width` × `height` on the ground at (x, z), along `heading`.
const boxAt = (x, z, heading, length, width, height, y = 0) => {
  const dir = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading));
  const side = new THREE.Vector3(-Math.sin(heading), 0, Math.cos(heading));
  const out = [];
  [-0.5, 0.5].forEach((a) => [-0.5, 0.5].forEach((b) => [0, 1].forEach((c) => {
    out.push(new THREE.Vector3(x, y + c * height, z).add(dir.clone().multiplyScalar(a * length)).add(side.clone().multiplyScalar(b * width)));
  })));
  return out;
};
const CAR_LENGTH = broadcastData.rigTemplate.carLengthM;
const median = (values) => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

describe("Shanghai's broadcast (CAM-C1 VIEW-02; RF-3D-04, RNF-05, RNF-07)", () => {
  const china = circuitFor({ name: "Chinese Grand Prix", circuit: "shanghai" }, 2013);
  const zones = zonesFor(china);
  const byCorner = (n) => zones.zones.filter((zone) => zone.corners?.length === 1 && zone.corners[0] === n);
  const indexOf = (zone) => zones.zones.indexOf(zone);

  // One lap at 1x on the circuit's own speed trace, 60 frames a second: every shot with its start (s).
  const filmLap = (c, rig, lap, state, onFrame = null) => {
    const frames = Math.round(c.simulatedLap * 60);
    const shots = [];
    for (let i = 0; i <= frames; i += 1) {
      const d = distanceAtTimeShare(c, i / frames);
      const pose = poseAt(c, d);
      const focus = { x: pose.x, y: 0, z: pose.y, heading: pose.heading, speed: 60, share: lap + d, spec: {} };
      const shot = frame("tv", focus, c, rig, state, 1 / 60);
      if (onFrame) onFrame(shot, focus, i);
      const id = state.tvCam?.id;
      if (!shots.length || shots[shots.length - 1].id !== id) shots.push({ id, from: i / 60, type: state.tvCam?.type });
    }
    return shots;
  };

  it("has its own plan: ~30 zones, T1-T4 in five, T6 on the long lens, five in a chain on the back straight, T14 in three", () => {
    expect(zonePlanFor(china)).not.toBeNull();
    expect(zonePlanFor(circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024))).toBeNull();
    expect(zones.source).toBe("file");
    expect(zones.zones.length).toBeGreaterThanOrEqual(26);
    expect(zones.zones.length).toBeLessThanOrEqual(32);
    // T1-T4 (engine corners 1-4): the braking zone and one zone per corner.
    const snail = [1, 2, 3, 4].map((n) => byCorner(n));
    snail.forEach((list) => expect(list).toHaveLength(1));
    const first = indexOf(snail[0][0]);
    expect(zones.zones[(first - 1 + zones.zones.length) % zones.zones.length].kind).toBe("braking");
    snail.forEach((list, k) => expect(indexOf(list[0])).toBe(first + k));
    // T6 (engine corner 5): the long lens first, on a zone of 300-500 m.
    const t6 = byCorner(5);
    expect(t6).toHaveLength(1);
    expect(t6[0].cams[0].type).toBe("longLens");
    expect(t6[0].toM - t6[0].fromM).toBeGreaterThanOrEqual(300);
    expect(t6[0].toM - t6[0].fromM).toBeLessThanOrEqual(500);
    // The back straight, from T13 (engine 12) to T14 (engine 13): a chain of five, the braking zone last.
    const t13 = byCorner(12);
    const t14 = byCorner(13);
    const chain = zones.zones.slice(indexOf(t13[t13.length - 1]) + 1, indexOf(t14[0]));
    expect(chain).toHaveLength(5);
    expect(chain.slice(0, 4).every((zone) => zone.kind === "straight")).toBe(true);
    expect(chain[4].kind).toBe("braking");
    expect(new Set(chain.flatMap((zone) => zone.cams.map((cam) => cam.type)))).toEqual(new Set(["headOn", "straight", "lateralTrack", "passPan", "braking"]));
    // T14: braking (the end of the chain), apex and exit.
    expect(t14).toHaveLength(2);
    expect(indexOf(t14[1])).toBe(indexOf(t14[0]) + 1);
  });

  it("films a lap at 1x in 22-32 shots with a median of 2-4 s, cut by position", () => {
    const rig = buildZoneRig(china);
    expect(rig.some((cam) => cam.type === "longLens")).toBe(true);
    const state = { seed: 2013 };
    filmLap(china, rig, 0, state);
    [1, 2, 3].forEach((lap) => {
      const shots = filmLap(china, rig, lap, state);
      const cuts = shots.length - 1;
      expect(cuts).toBeGreaterThanOrEqual(22);
      expect(cuts).toBeLessThanOrEqual(32);
      // Whole shots only (the first is still on air from the line, the last runs into the next lap).
      const lengths = shots.slice(1, -1).map((shot, k) => shots[k + 2].from - shot.from);
      expect(median(lengths)).toBeGreaterThanOrEqual(2);
      expect(median(lengths)).toBeLessThanOrEqual(4);
    });
  });

  it("keeps the car at 10 % of the frame's width or more (median of the lap), at 16:9 and at 21:9", () => {
    const rig = buildZoneRig(china);
    [16 / 9, 21 / 9].forEach((aspect) => {
      const shares = [];
      const state = { seed: 2013, aspect };
      filmLap(china, rig, 4, state, (shot, focus, i) => {
        if (i % 6) return;
        shares.push(widthShare(shot, aspect, boxAt(focus.x, focus.z, focus.heading, CAR_LENGTH, 2, 1)));
      });
      expect(median(shares)).toBeGreaterThanOrEqual(0.1);
    });
    // The wide shot and the long lens frame the car at 10 % of the width or more.
    ["highWide", "longLens"].forEach((type) => expect(framingFor(type).minShare).toBeGreaterThanOrEqual(0.1));
    expect(broadcastData.framing.shareOf).toBe("width");
  });
});

describe("the helicopter (CAM-C1 VIEW-12; RF-3D-04, RNF-05)", () => {
  it("derives its height from the elevation and the framing share, within heightM", () => {
    const heli = cameraData.follow.heli;
    const geo = heliGeometry();
    expect(geo.height).toBeGreaterThanOrEqual(heli.heightM.min);
    expect(geo.height).toBeLessThanOrEqual(heli.heightM.max);
    expect((Math.atan2(geo.height, geo.ground) * 180) / Math.PI).toBeCloseTo(heli.elevationDeg, 9);
    expect(CAR_LENGTH / (2 * geo.distance * Math.tan((geo.hfov * Math.PI) / 360))).toBeCloseTo(heli.shareTarget, 9);
    expect(hfovOf(heliGeometry(21 / 9).vfov, 21 / 9)).toBeCloseTo(geo.hfov, 9);
  });

  it("at 300 km/h holds 35-50° of elevation and the car at 2-5 % of the width for 20 s without a cut", () => {
    const v = 300 / 3.6;
    const radius = 800;
    const state = { simDt: 1 / 60 };
    let x = 0;
    let z = 0;
    let heading = 0.4;
    for (let i = 0; i <= 20 * 60; i += 1) {
      // Ten seconds of straight, then ten on a fast curve of 800 m (0.9 g at 300 km/h).
      if (i > 0) {
        if (i > 600) heading += v / radius / 60;
        x += Math.cos(heading) * (v / 60);
        z += Math.sin(heading) * (v / 60);
      }
      const focus = { x, y: 0, z, heading, speed: v, share: 0.5, spec: {} };
      const shot = frame("heli", focus, circuit, [], state, 1 / 60);
      expect(i > 0 && shot.snap).toBe(false);
      expect(shot.held).toBe(true);
      const elevation = (Math.atan2(shot.pos.y, Math.hypot(shot.pos.x - x, shot.pos.z - z)) * 180) / Math.PI;
      expect(elevation).toBeGreaterThanOrEqual(35);
      expect(elevation).toBeLessThanOrEqual(50);
      const share = widthShare(shot, REF_ASPECT, boxAt(x, z, heading, CAR_LENGTH, 2, 1));
      expect(share).toBeGreaterThanOrEqual(0.02);
      expect(share).toBeLessThanOrEqual(0.05);
    }
  });

  it("swings round on a critically damped bearing, the same for the same race times (RNF-05)", () => {
    const still = (heading) => ({ x: 0, y: 0, z: 0, heading, speed: 0, share: 0.5, spec: {} });
    const run = () => {
      const state = { simDt: 1 / 30 };
      return Array.from({ length: 90 }, (_, i) => frame("heli", still(i < 30 ? 0 : Math.PI / 2), circuit, [], state, 1 / 30).pos);
    };
    const a = run();
    expect(run()).toEqual(a);
    // After the turn the bearing moves steadily to its new place, without overshoot.
    const target = Math.PI / 2 + Math.PI - (cameraData.follow.heli.azimuthDeg * Math.PI) / 180;
    const off = (p) => {
      const b = Math.atan2(p.z, p.x);
      return Math.abs(target - (b + 2 * Math.PI * Math.round((target - b) / (2 * Math.PI))));
    };
    for (let i = 31; i < a.length; i += 1) expect(off(a[i])).toBeLessThanOrEqual(off(a[i - 1]) + 1e-9);
    expect(off(a[a.length - 1])).toBeLessThan(off(a[30]));
    // A new shot (another mode in between) starts in place, with a cut.
    const state = { simDt: 1 / 30 };
    frame("heli", still(0), circuit, [], state, 1 / 30);
    frame("chase", still(0), circuit, [], state, 1 / 30);
    expect(frame("heli", still(1), circuit, [], state, 1 / 30).snap).toBe(true);
  });
});

describe("onboard lenses (CAM-C1 VIEW-03; RF-3D-04, RF-3D-05, SRS 6.2)", () => {
  const mono = (year, aspect, id = "tcam") => {
    const spec = carSpec(year);
    const focus = { ...focusAt(0.3), spec };
    const shot = frame(id, focus, circuit, [], { aspect, year }, 0.016);
    const cam = new THREE.PerspectiveCamera(shot.fov, aspect, 0.05, 5000);
    cam.position.copy(shot.pos);
    cam.lookAt(shot.look);
    cam.updateMatrixWorld();
    const dir = new THREE.Vector3(Math.cos(focus.heading), 0, Math.sin(focus.heading));
    const far = shot.pos.clone().add(dir.clone().multiplyScalar(1e5)).project(cam);
    return { spec, focus, shot, horizon: (1 - far.y) / 2 };
  };

  it("are horizontal: the same width at 16:9 and 21:9, the vertical lens made for the canvas", () => {
    const at169 = onboardFor("tcam", { year: 2013, aspect: 16 / 9 });
    const at219 = onboardFor("tcam", { year: 2013, aspect: 21 / 9 });
    expect(at169.hfov).toBe(100);
    expect(at219.hfov).toBe(100);
    expect(hfovOf(at169.vfovDeg, 16 / 9)).toBeCloseTo(100, 9);
    expect(hfovOf(at219.vfovDeg, 21 / 9)).toBeCloseTo(100, 9);
    expect(at219.vfovDeg).toBeLessThan(at169.vfovDeg);
    expect(vfovOf(hfovOf(50, 1.5), 1.5)).toBeCloseTo(50, 9);
    expect(mono(2013, 21 / 9).shot.fov).toBeCloseTo(at219.vfovDeg, 9);
    // By era: wider in the years of the wide tyres; the bare entry without a lens request.
    expect(onboardFor("tcam", { year: 1995 }).hfov).toBe(105);
    expect(onboardFor("tcam")).toBe(ONBOARDS.find((entry) => entry.id === "tcam"));
    ONBOARDS.forEach((entry) => {
      expect(entry.hfovDeg).toBeDefined();
      expect(entry.fovDeg).toBeUndefined();
    });
  });

  it("frames the T-cam with the horizon at 30-40 % from the top and the front wheels in ≤ 30 % of the width", () => {
    [2005, 2013, 2024].forEach((year) => {
      [16 / 9, 21 / 9].forEach((aspect) => {
        const { spec, focus, shot, horizon } = mono(year, aspect);
        expect(horizon).toBeGreaterThanOrEqual(0.3);
        expect(horizon).toBeLessThanOrEqual(0.4);
        const dir = new THREE.Vector3(Math.cos(focus.heading), 0, Math.sin(focus.heading));
        const side = new THREE.Vector3(-Math.sin(focus.heading), 0, Math.cos(focus.heading));
        const wheels = [-1, 1].reduce((sum, s) => {
          const hub = new THREE.Vector3(focus.x, 0, focus.z).add(dir.clone().multiplyScalar(spec.front)).add(side.clone().multiplyScalar((s * spec.ft) / 2));
          return sum + widthShare(shot, aspect, boxAt(hub.x, hub.z, focus.heading, 2 * spec.tf.r, spec.tf.w, 2 * spec.tf.r));
        }, 0);
        expect(wheels).toBeLessThanOrEqual(0.3);
      });
    });
  });

  it("puts the high cockpit camera's horizon a third of the way down, at any aspect", () => {
    [16 / 9, 21 / 9, 4 / 3].forEach((aspect) => expect(mono(2013, aspect, "cockpitHigh").horizon).toBeCloseTo(0.33, 3));
  });
});

describe("contracts of wave 1 (CAM-C1, F1M24-CHINA §3.2)", () => {
  it("cameras.json: angular shake per camera and the wheel display by era, nothing of energy before 2009 (SRS §6)", () => {
    ["tcam", "cockpitHigh", "halo", "visor"].forEach((id) => {
      const { shake } = ONBOARDS.find((entry) => entry.id === id);
      ["hf", "bob"].forEach((key) => {
        expect(shake[key]).toHaveProperty("deg");
        expect(shake[key]).toHaveProperty("hz");
      });
      expect(shake.status).toBe("pending");
    });
    expect(ONBOARDS.find((entry) => entry.id === "visor").shake.head).toHaveProperty("driftDeg");
    const eras = cameraData.wheelDisplay.byEra;
    expect(eras[0].from).toBe(cameraData.wheelDisplay.from);
    for (let i = 1; i < eras.length; i += 1) expect(eras[i].from).toBe(eras[i - 1].to + 1);
    expect(eras[eras.length - 1].to).toBe(cameraData.wheelDisplay.to);
    const energy = (era) => era.fields.some((field) => field === "kers" || field === "ers");
    eras.forEach((era) => {
      expect(era.status).toBe("pending");
      expect(era.to < 2009 && energy(era)).toBe(false);
      expect(era.from <= 2010 && era.to >= 2010 && energy(era)).toBe(false);
      expect(era.to <= 2013 && era.fields.includes("ers")).toBe(false);
    });
  });

  it("broadcast.json: director priorities, the safety-car restart, the train and the low start-lights shot", () => {
    expect(broadcastData.directorPriorities.order).toEqual(["finish", "ownIncident", "userLock", "pitSeq", "zones"]);
    expect(broadcastData.directorPriorities.override.userLock).toBe(false);
    expect(broadcastData.directorPriorities.status).toBe("pending");
    expect(broadcastData.sequences.scRestart.shots.every((shot) => shot.requires === "safetyCar")).toBe(true);
    expect(broadcastData.framing.train.phases).toEqual(["TRAIN"]);
    expect(broadcastData.scriptRig.cams.some((cam) => cam.id === "startLightsLow")).toBe(true);
    expect(broadcastData.sequences.start.holdShotSec).toBeGreaterThan(0);
    expect(broadcastData.scriptRig.cams.some((cam) => cam.id === "startHigh")).toBe(true);
  });
});

// ------------------------------------------------------------------------------------------------
// CAM-C2 (F1M24-CHINA §3.3 ola 2): VIEW-04 vibración y pose, VIEW-08 / GS-07 trazada en la vista.

describe("CAM-C2 · VIEW-04: onboards ride the chassis and shake by angle (RF-3D-04, RNF-05, RNF-07)", () => {
  const RATE = 120;
  const SECONDS = 20;
  const series = (id, axis, opts = {}) => {
    const { shake } = ONBOARDS.find((entry) => entry.id === id);
    const seed = seedOf(`ham|${id}`);
    return Array.from({ length: RATE * SECONDS }, (_, i) => onboardWobble(shake, { speed: 80, tSec: 100 + i / RATE, seed, ...opts })[axis]);
  };
  // One-sided amplitude spectrum: |X_k| · 2 / N at f_k = k / SECONDS.
  const spectrum = (values) => {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const out = [];
    for (let k = 1; k < n / 2; k += 1) {
      let re = 0;
      let im = 0;
      for (let t = 0; t < n; t += 1) {
        const a = (2 * Math.PI * k * t) / n;
        re += (values[t] - mean) * Math.cos(a);
        im -= (values[t] - mean) * Math.sin(a);
      }
      out.push({ hz: k / SECONDS, amp: (2 * Math.hypot(re, im)) / n });
    }
    return out;
  };
  const rmsAbove = (spec, hz) => Math.sqrt(spec.filter((bin) => bin.hz > hz).reduce((sum, bin) => sum + (bin.amp * bin.amp) / 2, 0));

  it("cameras.json passes its schema with shakeModel and the angular shake; null angles keep the old jitter", () => {
    const ajv = new Ajv({ allErrors: true });
    const ok = ajv.validate(cameraSchema, cameraData);
    if (!ok) throw new Error(ajv.errorsText());
    ["tcam", "cockpitHigh", "halo", "visor"].forEach((id) => expect(angularShake(ONBOARDS.find((entry) => entry.id === id).shake)).toBe(true));
    ["cockpitSide", "sidepod", "nose"].forEach((id) => expect(angularShake(ONBOARDS.find((entry) => entry.id === id).shake)).toBe(false));
    expect(angularShake({ hf: { deg: null, hz: null } })).toBe(false);
    expect(cameraData.shakeModel.status).toBe("pending");
  });

  it("CP (high cockpit, halo, T-cam): 0.03-0.08° rms above 3 Hz", () => {
    ["cockpitHigh", "halo", "tcam"].forEach((id) => {
      const rms = rmsAbove(spectrum(series(id, "pitch")), 3);
      expect(rms).toBeGreaterThanOrEqual(0.03);
      expect(rms).toBeLessThanOrEqual(0.08);
    });
  });

  it("HP (the driver's eyes): the head's peak in 2.5-3.5 Hz", () => {
    ["pitch", "yaw"].forEach((axis) => {
      const bins = spectrum(series("visor", axis)).filter((bin) => bin.hz >= 0.8 && bin.hz <= 15);
      const peak = bins.reduce((best, bin) => (bin.amp > best.amp ? bin : best), bins[0]);
      expect(peak.hz).toBeGreaterThanOrEqual(2.5);
      expect(peak.hz).toBeLessThanOrEqual(3.5);
    });
  });

  it("is deterministic by seed and race clock, still when slow, bigger on a kerb and on a rough road", () => {
    const { shake } = ONBOARDS.find((entry) => entry.id === "tcam");
    const seed = seedOf("ham|tcam");
    const at = (opts) => onboardWobble(shake, { speed: 80, tSec: 12.345, seed, ...opts });
    expect(at({})).toEqual(at({}));
    expect(at({ seed: seedOf("ver|tcam") })).not.toEqual(at({}));
    expect(onboardWobble(shake, { speed: shake.minSpeed, tSec: 3, seed })).toEqual({ pitch: 0, yaw: 0, roll: 0 });
    const bobRms = (opts) => rmsAbove(spectrum(series("tcam", "pitch", opts)), 0.5);
    const plain = bobRms({});
    expect(bobRms({ kerb: true })).toBeGreaterThan(plain * 1.5);
    expect(bobRms({ rough: cameraData.shakeModel.roughRefPerM })).toBeGreaterThan(plain * 1.2);
    // A slower car shakes less (up to fullSpeedMs).
    const slow = rmsAbove(spectrum(Array.from({ length: RATE * SECONDS }, (_, i) => onboardWobble(shake, { speed: 30, tSec: 100 + i / RATE, seed }).pitch)), 0.5);
    expect(slow).toBeLessThan(plain);
    // The road's vertical curvature: flat is 0, a dip is not.
    expect(roadRoughness(() => 3, 0.5, 5000)).toBe(0);
    expect(roadRoughness((s) => 400 * (s - 0.5) * (s - 0.5), 0.5, 5000)).toBeGreaterThan(0);
    expect(roadRoughness(null, 0.5, 5000)).toBe(0);
  });

  it("a child of the car: with the body pitched and rolled, the car holds still in its camera's frame (< 0.2 px at 1080p)", () => {
    const spec = carSpec(2013);
    const share = 0.31;
    const pose = poseAt(circuit, share);
    const focus = { x: pose.x, y: 0, z: pose.y, heading: pose.heading, speed: 70, share, spec };
    const nose = new THREE.Vector3(spec.front + 0.6, 0.35, 0.2);
    const pixelOf = (pitch, roll, id) => {
      const car = new THREE.Object3D();
      car.position.set(focus.x, 0, focus.z);
      car.rotation.order = "YXZ";
      car.rotation.y = -focus.heading;
      car.rotation.x = roll;
      car.rotation.z = pitch;
      car.updateMatrixWorld(true);
      const shot = frame(id, focus, circuit, [], { year: 2013, aspect: 16 / 9 }, 0.016);
      const placed = carBodyFrame(shot.pos, shot.look, car.position, { yaw: focus.heading, pitch, roll });
      const camera = new THREE.PerspectiveCamera(shot.fov, 16 / 9, 0.05, 5000);
      camera.position.copy(placed.pos);
      camera.up.copy(placed.up);
      camera.lookAt(placed.look);
      camera.updateMatrixWorld(true);
      const p = car.localToWorld(nose.clone()).project(camera);
      return { x: ((p.x + 1) / 2) * 1920, y: ((1 - p.y) / 2) * 1080 };
    };
    ["tcam", "cockpitHigh", "visor"].forEach((id) => {
      const rest = pixelOf(0, 0, id);
      [[-0.05, 0], [0.03, 0.06], [0, -0.08], [-0.04, 0.09]].forEach(([pitch, roll]) => {
        const moved = pixelOf(pitch, roll, id);
        expect(Math.hypot(moved.x - rest.x, moved.y - rest.y)).toBeLessThan(0.2);
      });
    });
    // The body motion does turn the world: a point far ahead moves in the frame.
    const placed = carBodyFrame(new THREE.Vector3(0, 1, 0), new THREE.Vector3(10, 1, 0), new THREE.Vector3(0, 0, 0), { yaw: 0, pitch: 0.05, roll: 0 });
    expect(placed.look.y).toBeGreaterThan(1.4);
    // The wobble turns the lens about the camera (nose up = looking higher), not the camera's place.
    const shaken = carBodyFrame(new THREE.Vector3(0, 1, 0), new THREE.Vector3(10, 1, 0), new THREE.Vector3(0, 0, 0), { yaw: 0 }, { pitch: 1, yaw: 0, roll: 0 });
    expect(shaken.pos.toArray()).toEqual([0, 1, 0]);
    expect(shaken.look.y).toBeGreaterThan(1.15);
  });
});

describe("CAM-C2 · GS-07 / VIEW-08: the view draws the engine's racing line (RF-3D-03, criterio 7.2)", () => {
  const china = circuitFor({ name: "Chinese Grand Prix", circuit: "shanghai" }, 2013);
  const circuits = [china, circuit, circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024)];
  const carWidth2013 = racePhysics.lateral.eras.find((era) => 2013 >= era.from && 2013 <= era.to).carWidth;

  it("onRacingLine is engine/trackData.js positionAt: one geometry for engine, cameras and view", () => {
    circuits.forEach((c) => {
      [0.013, 0.2471, 0.5, 0.7719, 0.9993, 3.25].forEach((P) => {
        [-2.5, 0, 1.1, 40].forEach((lat) => {
          const base = poseAt(c, P - Math.floor(P));
          const raw = { x: base.x - Math.sin(base.heading) * lat, y: base.y + Math.cos(base.heading) * lat, heading: base.heading, progress: P, lateral: lat };
          const drawn = onRacingLine(c, raw);
          const engine = positionAt(c, P, lat);
          expect(drawn.x).toBeCloseTo(engine.x, 9);
          expect(drawn.y).toBeCloseTo(engine.y, 9);
          expect(drawn.heading).toBeCloseTo(engine.heading, 12);
          expect(drawn.lineOffset).toBeCloseTo(engine.lineOffset, 12);
        });
      });
    });
  });

  it("GS-07: with no duel, the line drawn at every apex is within 1.5 m of the solver's", () => {
    circuits.forEach((c) => {
      const { line } = trackDataFor(c);
      const n = c.points.length;
      c.corners.forEach((corner) => {
        const i = Math.round(corner.apex * n) % n;
        const drawn = positionAt(c, i / n, 0);
        expect(Math.abs(drawn.axisOffset - line[i])).toBeLessThanOrEqual(1.5);
      });
    });
  });

  it("VIEW-08 at Shanghai's T14 (the hairpin after the back straight): ≥ 3 m to the outside 50 m before it, apex ≤ 1.5 m from the inside edge", () => {
    const L = china.length;
    const brake = china.brakingZones.slice().sort((a, b) => b.metres - a.metres)[0];
    const t14 = china.corners.find((corner) => corner.number === brake.corner);
    const outside = -t14.sign;
    expect(outside * positionAt(china, t14.from - 50 / L, 0).axisOffset).toBeGreaterThanOrEqual(3);
    // The apex: the closest the car's inner side comes to the edge of the measured asphalt in the corner.
    const { wl, wr } = trackDataFor(china);
    const n = china.points.length;
    let closest = Infinity;
    for (let m = t14.from * L; m <= t14.to * L; m += 1) {
      const P = m / L;
      const i = Math.floor(P * n) % n;
      const edge = t14.sign > 0 ? wr[i] : wl[i];
      const inner = t14.sign * positionAt(china, P, 0).axisOffset + carWidth2013 / 2;
      closest = Math.min(closest, edge - inner);
    }
    expect(closest).toBeLessThanOrEqual(1.5);
    expect(closest).toBeGreaterThanOrEqual(0);
  });

  it("fitRig checks each camera's sight of the racing line, where the cars are drawn", () => {
    const rig = buildZoneRig(china).filter((cam) => !cam.moving && cam.type !== "cable").slice(0, 8);
    const seen = [];
    const field = {
      topNear: () => null,
      sight: (pos, target) => {
        seen.push(target);
        return true;
      },
    };
    fitRig(rig, china, field, () => 0);
    const line = Array.from({ length: 4000 }, (_, k) => positionAt(china, k / 4000, 0));
    const fromLine = (t) => Math.min(...line.map((p) => Math.hypot(p.x - t.x, p.y - t.z)));
    expect(seen.length).toBeGreaterThan(0);
    seen.forEach((t) => expect(fromLine(t)).toBeLessThan(1.5));
  });

  it("GS-07: the TV keeps the car drawn on the racing line inside its frame in ≥ 98 % of frames over two laps", () => {
    const rig = buildZoneRig(china);
    const state = { seed: 7, aspect: 16 / 9 };
    const frames = Math.round(china.simulatedLap * 60);
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.3, 20000);
    let inside = 0;
    let total = 0;
    for (let lap = 0; lap < 2; lap += 1) {
      for (let i = 0; i < frames; i += 1) {
        const d = distanceAtTimeShare(china, i / frames);
        const p = positionAt(china, d, 0);
        const focus = { x: p.x, y: 0, z: p.y, heading: p.heading, speed: 60, share: lap + d, lap, spec: {} };
        const shot = frame("tv", focus, china, rig, state, 1 / 60);
        camera.fov = shot.fov;
        camera.updateProjectionMatrix();
        camera.position.copy(shot.pos);
        camera.lookAt(shot.look);
        camera.updateMatrixWorld(true);
        const ndc = new THREE.Vector3(focus.x, 0.6, focus.z).project(camera);
        total += 1;
        if (ndc.z < 1 && Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1) inside += 1;
      }
    }
    expect(inside / total).toBeGreaterThanOrEqual(0.98);
  });
});
