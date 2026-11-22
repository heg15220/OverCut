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
 * Levels of detail load by need (RNF-02, RNF-03): the race asks only for LOD2,
 * and a car asks for LOD1 / LOD0 the first time the camera comes within
 * `UPGRADE_MARGIN` of the distance where that level shows while in view of
 * that camera. A grid of 22 cars
 * no longer downloads 66 files up front; only the cars the cameras actually
 * get close to fetch their heavier levels. `THREE.LOD` then picks by distance.
 *
 * Close-ups (showroom, podium: `closeUp`) only ever show the car at a few
 * metres, so they skip LOD1 and load LOD2 (a body in a blink) and then the
 * best level there is: the manifest's `hero` (LOD0 geometry with textures up to
 * 2048 px, built only for the showroom) or LOD0 (`hero: false`, e.g. the podium,
 * three cars at 15 m). The race never loads `hero`.
 */

import * as THREE from "three";
import { carSpec } from "../carBody";
import { LOD_DISTANCES } from "./manifest";
import { loadGltf } from "./loader";
import { anisotropyFor } from "../studio";

/** A heavier level is requested a little before it is needed, so it is usually there when it shows. */
export const UPGRADE_MARGIN = 1.15;

const TEXTURE_SLOTS = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap", "clearcoatMap", "clearcoatNormalMap", "clearcoatRoughnessMap", "specularIntensityMap", "specularColorMap"];

/** Anisotropic filtering on every texture of a loaded model: decals and stripes stay sharp at a grazing angle. */
const sharpen = (root, anisotropy) => {
  if (anisotropy <= 1) return;
  root.traverse((node) => {
    if (!node.isMesh) return;
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => {
      TEXTURE_SLOTS.forEach((slot) => {
        const texture = material?.[slot];
        if (texture && texture.anisotropy < anisotropy) {
          texture.anisotropy = anisotropy;
          texture.needsUpdate = true;
        }
      });
    });
  });
};

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
export const levelFrom = (gltf, asset, renderer = null) => {
  const holder = new THREE.Group();
  sharpen(gltf.scene, anisotropyFor(renderer));
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
export const createAssetCar = ({ asset, placeholder, renderer, year, closeUp = false, hero = closeUp }) => {
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
  // How many levels have arrived: a close-up re-bakes its contact shadow when this changes.
  car.userData.loaded = 0;
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

  const load = ({ entry, distance }) => {
    loadGltf(entry.file, renderer)
      .then((gltf) => {
        const object = levelFrom(gltf, asset, renderer);
        levels.push(object);
        lod.addLevel(object, distance);
        car.userData.loaded += 1;
        swapIn();
      })
      .catch(() => {});
  };

  const lightest = asset.lods.length - 1;
  if (closeUp) {
    // LOD2 for a body in a blink, then the best level; both always in view whatever the distance.
    [
      { entry: asset.lods[lightest], distance: Infinity },
      { entry: (hero && asset.hero) || asset.lods[0], distance: 0 },
    ]
      .filter((step, index, list) => step.entry && (index === 0 || step.entry !== list[0].entry))
      .forEach(load);
    return car;
  }

  // Race: the lightest level now, the others when the camera first comes near enough.
  const distanceOf = (level) => LOD_DISTANCES[level] ?? level * 40;
  load({ entry: asset.lods[lightest], distance: distanceOf(lightest) });
  let next = lightest - 1; // the next level to ask for
  const world = new THREE.Vector3();
  const eye = new THREE.Vector3();
  const frustum = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();
  const sphere = new THREE.Sphere(world, 3.5);
  /** Is the car in the camera's view? (cameras without a projection, e.g. in tests, count as yes) */
  const inView = (camera) => {
    if (!camera.projectionMatrix) return true;
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);
    return frustum.intersectsSphere(sphere);
  };
  /** Ask for every level whose range the camera at `distance` metres is (nearly) in. */
  car.userData.upgradeFor = (distance) => {
    while (next >= 0 && distance < distanceOf(next + 1) * UPGRADE_MARGIN) {
      load({ entry: asset.lods[next], distance: distanceOf(next) });
      next -= 1;
    }
  };
  const update = lod.update.bind(lod);
  lod.update = (camera) => {
    if (next >= 0) {
      eye.setFromMatrixPosition(camera.matrixWorld);
      world.setFromMatrixPosition(lod.matrixWorld);
      const distance = eye.distanceTo(world) / (camera.zoom || 1);
      if (distance < distanceOf(next + 1) * UPGRADE_MARGIN && inView(camera)) car.userData.upgradeFor(distance);
    }
    update(camera);
  };
  return car;
};
