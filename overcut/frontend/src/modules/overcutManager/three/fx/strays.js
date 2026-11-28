/**
 * Floating and ownerless meshes of the live view (VIEW-10 «sin malla flotante», LOOK-C3; RF-3D-04, RNF-07).
 *
 * The start of the Shanghai capture showed a red object hanging in the sky (F1M24-CHINA §2.5). Two rules
 * keep anything like it off the air:
 *   1. Ownership: everything Race3D.js hangs on the scene carries `userData.owner` (track, circuit, car,
 *      crew, safetyCar, sky, rain, fx). A visible mesh whose top-level ancestor under the scene has no
 *      owner was added by code that forgot it (or by a library behind the view's back): it is a bug.
 *   2. Floating: inside the circuit model (owner "circuit"), a small mesh (largest side < maxSizeM) whose
 *      base stands more than minAboveM above the highest point of the road is not standing on anything.
 * `auditScene` lists both; `hideStrays` hides them and counts them. Values in view-look.json fx.strays.
 */

import * as THREE from "three";
import LOOK from "../../data/balance/view-look.json";

const STRAYS = LOOK.fx.strays;

/** The child of `scene` that holds `node` (the node itself when it hangs straight from the scene). */
export const topLevelOf = (node, scene) => {
  let current = node;
  while (current.parent && current.parent !== scene) current = current.parent;
  return current.parent === scene ? current : null;
};

const visibleInScene = (node) => {
  for (let current = node; current; current = current.parent) if (!current.visible) return false;
  return true;
};

/**
 * Audit a scene: `{ownerless: Mesh[], floating: Mesh[]}`. `roadTopY` is the height of the road's
 * highest point (metres; Race3D's heightAt over the lap, 0 on a flat circuit); `floatingOwners` the
 * owners whose meshes are checked for floating (the circuit model by default: the code's own objects
 * stand where the engine puts them).
 */
export const auditScene = (scene, { roadTopY = 0, floatingOwners = ["circuit"], cfg = STRAYS } = {}) => {
  const ownerless = [];
  const floating = [];
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  scene.updateMatrixWorld(true);
  scene.traverse((node) => {
    if (!node.isMesh && !node.isLine && !node.isPoints) return;
    if (!visibleInScene(node)) return;
    const top = topLevelOf(node, scene);
    const owner = top?.userData?.owner;
    if (!owner) {
      ownerless.push(node);
      return;
    }
    if (!floatingOwners.includes(owner) || !node.geometry) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    if (!node.geometry.boundingBox) return;
    box.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);
    if (box.isEmpty()) return;
    box.getSize(size);
    if (Math.max(size.x, size.y, size.z) < cfg.maxSizeM && box.min.y > roadTopY + cfg.minAboveM) floating.push(node);
  });
  return { ownerless, floating };
};

/** Hide what `auditScene` finds; returns `{ownerless, floating, names}` counts for the view's stats. */
export const hideStrays = (scene, opts) => {
  const { ownerless, floating } = auditScene(scene, opts);
  [...ownerless, ...floating].forEach((node) => {
    node.visible = false;
  });
  return { ownerless: ownerless.length, floating: floating.length, names: [...ownerless, ...floating].map((node) => node.name || node.type) };
};

/** Highest point of the road from a lap height profile (`heightAt(share)`), sampled `n` times; 0 without one. */
export const roadTopOf = (heightAt, n = 256) => {
  if (typeof heightAt !== "function") return 0;
  let top = -Infinity;
  for (let i = 0; i < n; i += 1) {
    const h = heightAt(i / n);
    if (Number.isFinite(h) && h > top) top = h;
  }
  return Number.isFinite(top) ? top : 0;
};

/** Tag an object as owned by the view (rule 1). Returns it. */
export const own = (object, owner) => {
  object.userData.owner = owner;
  return object;
};
