/**
 * A processed circuit GLB and its calibrated spline (RF-3D-01, RF-3D-03).
 *
 * The spline was extracted from this very mesh and the GLB was written in the
 * same glTF coordinates, so the model goes in at the origin with no transform:
 * the simulation's (x, y) is three.js (x, z), as everywhere in the view. The
 * full spline (every 2 m, with heights) gives the height of the road under a
 * car - the engine works in the plane, the view puts the car on the asphalt.
 */

import { assetUrl } from "./manifest";
import { fetchCached, loadGltf } from "./loader";

/** Height of the road at a distance share of the lap, from the spline's 2 m samples. */
export const heightSampler = (spline) => {
  const pts = spline?.points || [];
  const n = pts.length;
  if (!n) return () => 0;
  const s = new Float64Array(n + 1);
  for (let i = 1; i <= n; i += 1) {
    const a = pts[i - 1];
    const b = pts[i % n];
    s[i] = s[i - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]);
  }
  const total = s[n];
  return (share) => {
    const target = ((((share % 1) + 1) % 1) * total);
    let lo = 0;
    let hi = n;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (s[mid] <= target) lo = mid;
      else hi = mid;
    }
    const k = (target - s[lo]) / (s[lo + 1] - s[lo] || 1);
    return pts[lo][1] + (pts[(lo + 1) % n][1] - pts[lo][1]) * k;
  };
};

/** Resolves to { scene, heightAt, asset }; rejects if either file is missing. */
export const loadCircuitAsset = async (asset, renderer) => {
  const [gltf, buffer] = await Promise.all([loadGltf(asset.file, renderer), fetchCached(assetUrl(asset.spline))]);
  const spline = JSON.parse(new TextDecoder().decode(buffer));
  const scene = gltf.scene.clone(true);
  scene.traverse((node) => {
    if (node.isMesh) node.receiveShadow = true;
  });
  scene.name = "asset-circuit";
  return { scene, heightAt: heightSampler(spline), asset };
};
