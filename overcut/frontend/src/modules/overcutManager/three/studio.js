/**
 * Renderer and lighting shared by the showroom and the race.
 *
 * Paint only looks like paint when it has something to reflect, so every scene
 * gets an image-based environment (three's procedural room, pre-filtered once
 * per renderer) on top of its own sun and sky.
 */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export { canRender3D } from "./support";

/** A renderer with the colour pipeline and tone mapping the materials are tuned for. */
export const createRenderer = (canvas, { shadows = true, alpha = false } = {}) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
};

const environments = new WeakMap();

/** The reflection environment for a renderer, generated once. */
export const environmentFor = (renderer) => {
  if (environments.has(renderer)) return environments.get(renderer);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  environments.set(renderer, texture);
  return texture;
};

/** Free every geometry, material and texture under an object. */
export const disposeTree = (root) => {
  root.traverse((node) => {
    if (node.geometry && !node.geometry.userData?.shared) node.geometry.dispose();
    const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    materials.forEach((material) => {
      if (material.userData?.shared) return;
      Object.values(material).forEach((value) => {
        if (value && value.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
};
