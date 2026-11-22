/**
 * A processed car GLB as the race view wants a car (RF-3D-01, RF-3D-05).
 *
 * The pipeline delivers every car the same way: metres, Y up, nose to -Z,
 * origin on the rear axle at ground level, and four wheel nodes (wheel_fl,
 * wheel_fr, wheel_rl, wheel_rr) whose origin is the hub. The procedural cars
 * the view already draws face +X with the origin mid-wheelbase, and expose
 * `userData.wheels` as { pivot, spin, steer, radius } (spin about z, steer
 * about y). This wraps a GLB in that same contract, so `Race3D` moves a real
 * car and a procedural one with the same code.
 *
 * Levels of detail load lightest first: the car appears with LOD2 and sharpens
 * as LOD1 and LOD0 arrive; `THREE.LOD` then picks by distance (RNF-02).
 */

import * as THREE from "three";
import { carSpec } from "../carBody";
import { LOD_DISTANCES } from "./manifest";
import { loadGltf } from "./loader";

const WHEEL_NODES = ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"];

/** Wheel proxies with the procedural car's interface; `sync` copies them onto every LOD level. */
const wheelProxies = (asset) =>
  WHEEL_NODES.map((name) => {
    const pivot = new THREE.Object3D();
    const spin = new THREE.Object3D();
    pivot.add(spin);
    return { name, pivot, spin, steer: name.startsWith("wheel_f"), radius: asset.metrics?.wheelRadiusM?.[name] || 0.33 };
  });

/** One LOD level: the GLB scene turned to face +X and centred on the middle of the wheelbase. */
export const levelFrom = (gltf, asset) => {
  const holder = new THREE.Group();
  const scene = gltf.scene.clone(true);
  scene.rotation.y = -Math.PI / 2; // -Z forward -> +X forward
  scene.position.x = -(asset.metrics?.wheelbaseM || 3.2) / 2;
  scene.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = false;
    }
  });
  holder.add(scene);
  const wheels = {};
  WHEEL_NODES.forEach((name) => {
    const node = scene.getObjectByName(name);
    if (node) {
      node.rotation.order = "YXZ";
      wheels[name] = node;
    }
  });
  holder.userData.wheelNodes = wheels;
  return holder;
};

/**
 * A car object that shows `placeholder` (the procedural car) until the GLB
 * arrives. Resolves nothing and never throws: if loading fails the
 * placeholder simply stays.
 */
export const createAssetCar = ({ asset, placeholder, renderer, year }) => {
  const car = new THREE.Group();
  car.name = "asset-car";
  car.add(placeholder);
  const lod = new THREE.LOD();
  lod.visible = false;
  car.add(lod);
  const proxies = wheelProxies(asset);
  const spec = carSpec(year);
  const half = (asset.metrics?.wheelbaseM || 3.2) / 2;
  car.userData.spec = { ...placeholder.userData.spec, era: spec.era, front: half, rear: -half };
  car.userData.wheels = placeholder.userData.wheels;
  car.userData.setCompound = placeholder.userData.setCompound;
  car.userData.asset = asset;
  const levels = [];

  /** Copy the proxy wheel angles onto the GLB wheel nodes of every loaded level. */
  car.userData.sync = () => {
    if (!levels.length) return;
    levels.forEach((level) => {
      proxies.forEach((proxy) => {
        const node = level.userData.wheelNodes[proxy.name];
        if (!node) return;
        // Proxy spin is about +Z of the +X-forward frame = +X of the GLB frame.
        node.rotation.x = proxy.spin.rotation.z;
        node.rotation.y = proxy.steer ? proxy.pivot.rotation.y : 0;
      });
    });
  };

  const swapIn = () => {
    if (lod.visible) return;
    lod.visible = true;
    placeholder.visible = false;
    car.userData.wheels = proxies;
    car.userData.setCompound = () => {};
  };

  // Lightest first, so every car has a body quickly.
  [...asset.lods].reverse().forEach((entry, reversedIndex) => {
    const level = asset.lods.length - 1 - reversedIndex;
    loadGltf(entry.file, renderer)
      .then((gltf) => {
        const object = levelFrom(gltf, asset);
        levels.push(object);
        lod.addLevel(object, LOD_DISTANCES[level] ?? level * 40);
        swapIn();
      })
      .catch(() => {});
  });
  return car;
};
