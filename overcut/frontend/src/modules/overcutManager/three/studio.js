/**
 * Renderer and lighting shared by the showroom and the race.
 *
 * Paint only looks like paint when it has something to reflect, so every scene
 * gets an image-based environment (three's procedural room, pre-filtered once
 * per renderer) on top of its own sun and sky.
 */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gateRenderer } from "./assets/compileGate";
import LOOK from "../data/balance/view-look.json";

export { canRender3D } from "./support";

/**
 * Pixel ratio for a scene. The race draws the screen's own density (capped at
 * 2, RNF-02). A close-up of a single car (`supersample`) draws at least 1.5x
 * even on a 1x screen: with MSAA on top, thin parts (wing elements, wishbones,
 * logos) stop shimmering, and one car costs little.
 */
export const pixelRatioFor = ({ supersample = false } = {}, dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1) =>
  Math.min(2, supersample ? Math.max(1.5, dpr) : dpr);

/**
 * Base tone-mapping exposure per tone (view-look.json exposure: baseAces, baseNeutral; RNF-07). The
 * live auto exposure (three/post/exposure.js, LOOK-C1) multiplies this base once LOOK-C3 wires it.
 */
export const exposureFor = (tone = "aces") => (tone === "neutral" ? LOOK.exposure.baseNeutral : LOOK.exposure.baseAces);

/**
 * A renderer with the colour pipeline and tone mapping the materials are tuned for.
 *   tone   "aces" (race: sun and sky) or "neutral" (Khronos PBR Neutral: close-ups,
 *          keeps livery colours as painted instead of pushing reds to orange and
 *          clipping whites)
 */
export const createRenderer = (canvas, { shadows = true, alpha = false, tone = "aces", exposure, supersample = false } = {}) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatioFor({ supersample }));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = tone === "neutral" ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure ?? exposureFor(tone);
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Shaders link in the background instead of freezing the page on the first frame (RNF-02).
  return gateRenderer(renderer);
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

const studios = new WeakMap();

/** An emissive panel for the studio environment (values above 1 are HDR: they read as light sources). */
const panel = (scene, width, height, intensity, colour, position, lookAt) => {
  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(intensity), side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position);
  mesh.lookAt(...lookAt);
  scene.add(mesh);
  return mesh;
};

/**
 * The "pit wall at night" studio (DESIGN.md): a dark box with a few soft
 * panels. Paint and carbon only read as such when they reflect long, clean
 * highlights against black, which the bright procedural room cannot give: it
 * washes every livery out. One overhead softbox (the main reflection along the
 * body), two tall cool strips at the sides (the edge lines of sidepods and
 * wings), a long low strip behind (the horizon line on the flanks) and a faint
 * warm signal-yellow strip for the logo's gold.
 */
export const studioScene = () => {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 18, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color("#0a0e15"), side: THREE.BackSide }));
  room.position.y = 7;
  scene.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color("#05070a") }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.9;
  scene.add(floor);
  panel(scene, 12, 5, 5, "#ffffff", [0, 9, 0], [0, 0, 0]);
  panel(scene, 1.6, 10, 3.2, "#cfe0ff", [-12, 4, 3], [0, 3, 0]);
  panel(scene, 1.6, 10, 3.2, "#cfe0ff", [12, 4, -3], [0, 3, 0]);
  panel(scene, 26, 0.9, 2.2, "#ffffff", [0, 1.4, -15], [0, 1.4, 0]);
  panel(scene, 18, 0.5, 0.9, "#f2b705", [0, 0.6, 15], [0, 0.6, 0]);
  return scene;
};

/** The studio reflection environment for a renderer (showroom, podium), generated once. */
export const studioEnvironmentFor = (renderer) => {
  if (studios.has(renderer)) return studios.get(renderer);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = studioScene();
  const texture = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  disposeTree(scene);
  studios.set(renderer, texture);
  return texture;
};

/** Sharpest texture filtering the GPU offers, at most 8x (thin decals seen at a grazing angle). */
export const anisotropyFor = (renderer) => Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);

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
