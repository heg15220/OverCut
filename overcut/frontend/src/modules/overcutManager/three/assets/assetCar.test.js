/**
 * RF-3D-01, RF-3D-05: a processed car GLB wrapped in the procedural car's
 * contract (userData.wheels, spec) so Race3D and Showroom move both the same
 * way, with its levels of detail (RNF-02). The loader is mocked: no WebGL, no fetch.
 */

import * as THREE from "three";
import { createAssetCar, levelFrom } from "./assetCar";
import { loadGltf } from "./loader";

jest.mock("./loader", () => ({ loadGltf: jest.fn() }));

const WHEELS = ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"];

/** A GLB as the pipeline writes it: nose to -Z, origin on the rear axle, four named hubs. */
const fakeGltf = (wheelbase = 3.4) => {
  const scene = new THREE.Group();
  WHEELS.forEach((name) => {
    const hub = new THREE.Object3D();
    hub.name = name;
    hub.position.set(name.endsWith("l") ? -0.8 : 0.8, 0.33, name.startsWith("wheel_f") ? -wheelbase : 0);
    scene.add(hub);
  });
  return { scene };
};

const placeholder = () => {
  const car = new THREE.Group();
  const wheels = WHEELS.map((name) => {
    const pivot = new THREE.Object3D();
    const spin = new THREE.Object3D();
    pivot.add(spin);
    car.add(pivot);
    return { pivot, spin, steer: name.startsWith("wheel_f"), radius: 0.33 };
  });
  car.userData = { wheels, spec: { era: "v8", front: 1.6, rear: -1.6 }, setCompound: jest.fn() };
  return car;
};

const asset = {
  season: 2012,
  teamRef: "red-bull",
  lods: [{ file: "lod0.glb" }, { file: "lod1.glb" }, { file: "lod2.glb" }],
  metrics: { wheelbaseM: 3.4, wheelRadiusM: { wheel_fl: 0.33, wheel_fr: 0.33, wheel_rl: 0.34, wheel_rr: 0.34 } },
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => loadGltf.mockReset());

describe("RF-3D-05 · asset car", () => {
  it("turns the GLB to face +X with the origin mid-wheelbase", () => {
    const level = levelFrom(fakeGltf(3.4), asset);
    level.updateMatrixWorld(true);
    const front = level.userData.wheelNodes.wheel_fl.getWorldPosition(new THREE.Vector3());
    const rear = level.userData.wheelNodes.wheel_rl.getWorldPosition(new THREE.Vector3());
    expect(front.x).toBeCloseTo(1.7, 6);
    expect(rear.x).toBeCloseTo(-1.7, 6);
    expect(Object.keys(level.userData.wheelNodes).sort()).toEqual([...WHEELS].sort());
  });

  it("shows the procedural car until a level arrives, then the GLB; the race asks only for the lightest level (RNF-03)", async () => {
    loadGltf.mockImplementation(() => Promise.resolve(fakeGltf()));
    const proc = placeholder();
    const car = createAssetCar({ asset, placeholder: proc, renderer: null, year: 2012 });
    expect(proc.visible).toBe(true);
    expect(car.userData.wheels).toBe(proc.userData.wheels);
    expect(loadGltf.mock.calls.map(([file]) => file)).toEqual(["lod2.glb"]);
    car.userData.upgradeFor(5);
    expect(loadGltf.mock.calls.map(([file]) => file)).toEqual(["lod2.glb", "lod1.glb", "lod0.glb"]);
    await flush();
    expect(proc.visible).toBe(false);
    expect(car.userData.wheels).toHaveLength(4);
    expect(car.userData.wheels).not.toBe(proc.userData.wheels);
    expect(car.userData.wheels.map((wheel) => wheel.radius)).toEqual([0.33, 0.33, 0.34, 0.34]);
    const lod = car.children.find((child) => child.isLOD);
    expect(lod.levels.map((level) => level.distance)).toEqual([0, 28, 80]);
    expect(car.userData.spec).toMatchObject({ front: 1.7, rear: -1.7 });
  });

  it("the race fetches LOD1 and LOD0 only when the camera comes near (RNF-02, RNF-03)", async () => {
    loadGltf.mockImplementation(() => Promise.resolve(fakeGltf()));
    const car = createAssetCar({ asset, placeholder: placeholder(), renderer: null, year: 2012 });
    await flush();
    const lod = car.children.find((child) => child.isLOD);
    const camera = new THREE.PerspectiveCamera();
    const at = (x) => {
      camera.position.set(x, 0, 0);
      camera.updateMatrixWorld(true);
      car.updateMatrixWorld(true);
      lod.update(camera);
      return loadGltf.mock.calls.map(([file]) => file);
    };
    camera.lookAt(-1000, 0, 0); // facing the car from +X
    expect(at(300)).toEqual(["lod2.glb"]);
    expect(at(90)).toEqual(["lod2.glb", "lod1.glb"]);
    expect(at(40)).toEqual(["lod2.glb", "lod1.glb"]);
    expect(at(30)).toEqual(["lod2.glb", "lod1.glb", "lod0.glb"]);
    expect(at(5)).toHaveLength(3);
    await flush();
    expect(lod.levels.map((level) => level.distance)).toEqual([0, 28, 80]);
  });

  it("a car behind the camera does not upgrade, however close", async () => {
    loadGltf.mockImplementation(() => Promise.resolve(fakeGltf()));
    const car = createAssetCar({ asset, placeholder: placeholder(), renderer: null, year: 2012 });
    await flush();
    const lod = car.children.find((child) => child.isLOD);
    const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.3, 4000);
    camera.position.set(10, 0, 0);
    camera.lookAt(1000, 0, 0); // looking away
    camera.updateMatrixWorld(true);
    car.updateMatrixWorld(true);
    lod.update(camera);
    expect(loadGltf.mock.calls.map(([file]) => file)).toEqual(["lod2.glb"]);
  });

  it("close-ups (RF-3D-06) load LOD2 then the hero level, and keep the best one in view whatever the distance", async () => {
    loadGltf.mockImplementation(() => Promise.resolve(fakeGltf()));
    const car = createAssetCar({ asset: { ...asset, hero: { file: "hero.glb" } }, placeholder: placeholder(), renderer: null, year: 2012, closeUp: true });
    expect(loadGltf.mock.calls.map(([file]) => file)).toEqual(["lod2.glb", "hero.glb"]);
    await flush();
    const lod = car.children.find((child) => child.isLOD);
    expect(lod.levels.map((level) => level.distance)).toEqual([0, Infinity]);
    expect(car.userData.loaded).toBe(2);
  });

  it("close-ups without a hero level fall back to LOD0, and the race never asks for the hero", () => {
    loadGltf.mockImplementation(() => Promise.resolve(fakeGltf()));
    createAssetCar({ asset, placeholder: placeholder(), renderer: null, year: 2012, closeUp: true });
    expect(loadGltf.mock.calls.map(([file]) => file)).toEqual(["lod2.glb", "lod0.glb"]);
    loadGltf.mockClear();
    const race = createAssetCar({ asset: { ...asset, hero: { file: "hero.glb" } }, placeholder: placeholder(), renderer: null, year: 2012 });
    race.userData.upgradeFor(0);
    expect(loadGltf.mock.calls.map(([file]) => file)).toEqual(["lod2.glb", "lod1.glb", "lod0.glb"]);
  });

  it("copies spin and steer onto the wheel nodes of every level", async () => {
    loadGltf.mockImplementation(() => Promise.resolve(fakeGltf()));
    const car = createAssetCar({ asset, placeholder: placeholder(), renderer: null, year: 2012 });
    car.userData.upgradeFor(0);
    await flush();
    car.userData.wheels.forEach((wheel) => {
      wheel.spin.rotation.z = -2.5;
      if (wheel.steer) wheel.pivot.rotation.y = 0.2;
    });
    car.userData.sync();
    const lod = car.children.find((child) => child.isLOD);
    lod.levels.forEach(({ object }) => {
      const nodes = object.userData.wheelNodes;
      WHEELS.forEach((name) => expect(nodes[name].rotation.x).toBeCloseTo(-2.5, 9));
      expect(nodes.wheel_fl.rotation.y).toBeCloseTo(0.2, 9);
      expect(nodes.wheel_fr.rotation.y).toBeCloseTo(0.2, 9);
      expect(nodes.wheel_rl.rotation.y).toBe(0);
    });
  });

  it("keeps the procedural car if every level fails to load (RF-3D-02)", async () => {
    loadGltf.mockImplementation(() => Promise.reject(new Error("404")));
    const proc = placeholder();
    const car = createAssetCar({ asset, placeholder: proc, renderer: null, year: 2012 });
    await flush();
    expect(proc.visible).toBe(true);
    expect(car.userData.wheels).toBe(proc.userData.wheels);
    expect(() => car.userData.sync()).not.toThrow();
  });
});
