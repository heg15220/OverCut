/**
 * A processed circuit GLB and its calibrated spline (RF-3D-01, RF-3D-03).
 *
 * The spline was extracted from this very mesh and the GLB was written in the
 * same glTF coordinates, so the model goes in at the origin with no transform:
 * the simulation's (x, y) is three.js (x, z), as everywhere in the view. The
 * full spline (every 2 m, with heights) gives the height of the road under a
 * car - the engine works in the plane, the view puts the car on the asphalt.
 */

import * as THREE from "three";
import { assetUrl } from "./manifest";
import { fetchCached, loadGltf } from "./loader";

/**
 * The spline's heights with the spikes taken out: where the pipeline's ray
 * from above met a gantry, a banner or a roof over the road instead of the
 * asphalt (Bahrain's main straight has 4.5 m bumps every 52 m), a car would
 * jump onto it (Monaco's tunnel roof is 17 samples long). Samples more than
 * 3 m from the running median of the 82 m around them are replaced by that
 * median; then a 30 m running median removes what is left of any short bump
 * and a 14 m running mean softens the joins. A median keeps a real climb as it
 * is, and the vertical curves of a circuit (radius above ~100 m) move by well
 * under the 3 m threshold.
 */
const runningMedian = (values, window) => {
  const n = values.length;
  const half = Math.floor(window / 2);
  const out = new Float64Array(n);
  const buffer = new Array(2 * half + 1);
  for (let i = 0; i < n; i += 1) {
    for (let k = -half; k <= half; k += 1) buffer[k + half] = values[(i + k + n) % n];
    buffer.sort((a, b) => a - b);
    out[i] = buffer[half];
  }
  return out;
};

export const roadHeights = (pts) => {
  const n = pts.length;
  const raw = pts.map((p) => p[1]);
  if (n < 41) return raw;
  const base = runningMedian(raw, 41);
  const clean = raw.map((h, i) => (Math.abs(h - base[i]) > 3 ? base[i] : h));
  const median = runningMedian(clean, 15);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    for (let k = -3; k <= 3; k += 1) sum += median[(i + k + n) % n];
    out[i] = sum / 7;
  }
  return out;
};

/** Height of the road at a distance share of the lap, from the spline's 2 m samples (spikes removed). */
export const heightSampler = (spline) => {
  const raw = spline?.points || [];
  const n = raw.length;
  if (!n) return () => 0;
  const heights = roadHeights(raw);
  const pts = raw.map((p, i) => [p[0], heights[i], p[2]]);
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

/** Resolves to { scene, heightAt, spline, asset }; rejects if either file is missing. */
export const loadCircuitAsset = async (asset, renderer) => {
  const [gltf, buffer] = await Promise.all([loadGltf(asset.file, renderer), fetchCached(assetUrl(asset.spline))]);
  const spline = JSON.parse(new TextDecoder().decode(buffer));
  const scene = gltf.scene.clone(true);
  scene.traverse((node) => {
    if (node.isMesh) node.receiveShadow = true;
  });
  scene.name = "asset-circuit";
  return { scene, heightAt: heightSampler(spline), spline, asset };
};

const EMPTY = -1e9;

/**
 * What stands on the ground, seen from above (RF-3D-04, RNF-02): a grid with the
 * highest surface of the circuit mesh in every cell, built once when the GLB
 * arrives. The cameras ask it how high the ground (or the grandstand, or the
 * trees) is under a camera, and whether anything stands between a camera and a
 * car - a few hundred array reads per question, never a raycast against the
 * 0.1-1.4 million triangles of a circuit.
 *
 * `points` (the spline's [x, y, z] samples) bound the grid: whatever lies more
 * than `margin` metres from the road is left out, and so is anything more than
 * `ceiling` metres above the highest road (a sky dome or a stray far object
 * would otherwise cover the whole map). The work yields to the browser every
 * `chunk` triangles so the race keeps running while it is built.
 */
export const buildHeightField = async (scene, points, { cell = 2, margin = 320, ceiling = 150, maxCells = 3.5e6, chunk = 120000, yieldTo = () => new Promise((resolve) => setTimeout(resolve, 0)) } = {}) => {
  if (!points?.length) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let roadTop = -Infinity;
  points.forEach(([x, y, z]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
    roadTop = Math.max(roadTop, y);
  });
  minX -= margin;
  minZ -= margin;
  maxX += margin;
  maxZ += margin;
  let size = cell;
  while (((maxX - minX) / size) * ((maxZ - minZ) / size) > maxCells) size *= 1.25;
  const nx = Math.ceil((maxX - minX) / size) + 1;
  const nz = Math.ceil((maxZ - minZ) / size) + 1;
  const top = new Float32Array(nx * nz).fill(EMPTY);
  const limit = roadTop + ceiling;
  const mark = (x, z, y) => {
    const i = Math.floor((x - minX) / size);
    const j = Math.floor((z - minZ) / size);
    if (i < 0 || j < 0 || i >= nx || j >= nz) return;
    const k = j * nx + i;
    if (y > top[k]) top[k] = y;
  };
  const edge = (x0, y0, z0, x1, y1, z1) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (size * 0.5)));
    for (let s = 0; s <= steps; s += 1) {
      const k = s / steps;
      mark(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, y0 + (y1 - y0) * k);
    }
  };

  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse((node) => {
    if (node.isMesh && node.geometry?.attributes?.position) meshes.push(node);
  });
  const v = new THREE.Vector3();
  let done = 0;
  for (const mesh of meshes) {
    const attr = mesh.geometry.attributes.position;
    const count = attr.count;
    const world = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      v.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld);
      world[i * 3] = v.x;
      world[i * 3 + 1] = v.y;
      world[i * 3 + 2] = v.z;
    }
    const index = mesh.geometry.index;
    const triangles = Math.floor(index ? index.count / 3 : count / 3);
    for (let t = 0; t < triangles; t += 1) {
      const a = (index ? index.getX(t * 3) : t * 3) * 3;
      const b = (index ? index.getX(t * 3 + 1) : t * 3 + 1) * 3;
      const c = (index ? index.getX(t * 3 + 2) : t * 3 + 2) * 3;
      const ax = world[a];
      const ay = world[a + 1];
      const az = world[a + 2];
      const bx = world[b];
      const by = world[b + 1];
      const bz = world[b + 2];
      const cx = world[c];
      const cy = world[c + 1];
      const cz = world[c + 2];
      done += 1;
      if (done % chunk === 0) await yieldTo();
      if (Math.min(ay, by, cy) > limit) continue;
      if (Math.max(ax, bx, cx) < minX || Math.min(ax, bx, cx) > maxX || Math.max(az, bz, cz) < minZ || Math.min(az, bz, cz) > maxZ) continue;
      // The edges (a wall seen from above is only its edges), then every cell whose centre the triangle covers.
      edge(ax, ay, az, bx, by, bz);
      edge(bx, by, bz, cx, cy, cz);
      edge(cx, cy, cz, ax, ay, az);
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - minX) / size));
      const i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx, cx) - minX) / size));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - minZ) / size));
      const j1 = Math.min(nz - 1, Math.floor((Math.max(az, bz, cz) - minZ) / size));
      if (i1 === i0 && j1 === j0) continue;
      const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(det) < 1e-9) continue;
      for (let j = j0; j <= j1; j += 1) {
        const pz = minZ + (j + 0.5) * size;
        for (let i = i0; i <= i1; i += 1) {
          const px = minX + (i + 0.5) * size;
          const w0 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / det;
          const w1 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / det;
          const w2 = 1 - w0 - w1;
          if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
          const y = w0 * ay + w1 * by + w2 * cy;
          const k = j * nx + i;
          if (y > top[k]) top[k] = y;
        }
      }
    }
  }
  return heightFieldFrom({ top, nx, nz, minX, minZ, size });
};

/** The questions a height grid answers (see buildHeightField). */
export const heightFieldFrom = ({ top, nx, nz, minX, minZ, size }) => {
  const at = (i, j) => (i < 0 || j < 0 || i >= nx || j >= nz ? EMPTY : top[j * nx + i]);
  const cellOf = (x, z) => [Math.floor((x - minX) / size), Math.floor((z - minZ) / size)];
  /** Highest surface within `radius` cells of (x, z), or null where the mesh has nothing. */
  const topNear = (x, z, radius = 0) => {
    const [i, j] = cellOf(x, z);
    let best = EMPTY;
    for (let dj = -radius; dj <= radius; dj += 1) for (let di = -radius; di <= radius; di += 1) best = Math.max(best, at(i + di, j + dj));
    return best > EMPTY / 2 ? best : null;
  };
  /**
   * The road under a car off the racing line (the pit lane): the lowest of the
   * highest surfaces in the 3x3 cells around (x, z), so a pit wall or a kerb in
   * the next cell does not lift it; null when that is more than `tolerance`
   * metres from `reference` (a roof, a bridge) or there is no mesh.
   */
  const floorNear = (x, z, reference, tolerance = 2.5) => {
    const [i, j] = cellOf(x, z);
    let best = Infinity;
    for (let dj = -1; dj <= 1; dj += 1)
      for (let di = -1; di <= 1; di += 1) {
        const y = at(i + di, j + dj);
        if (y > EMPTY / 2) best = Math.min(best, y);
      }
    if (!Number.isFinite(best)) return null;
    return reference === undefined || reference === null || Math.abs(best - reference) <= tolerance ? best : null;
  };
  /**
   * Is the straight line from a to b ({x, y, z}) clear of the mesh? The first
   * `skipStart` and the last `skipEnd` metres are not checked: the camera's own
   * mount, and the kerb and barrier right beside the car.
   */
  const sight = (a, b, { skipStart = 2, skipEnd = 4, slack = 0.3 } = {}) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dy, dz);
    const steps = Math.ceil(Math.hypot(dx, dz) / (size * 0.5));
    for (let s = 1; s < steps; s += 1) {
      const k = s / steps;
      const travelled = k * length;
      if (travelled < skipStart || length - travelled < skipEnd) continue;
      const [i, j] = cellOf(a.x + dx * k, a.z + dz * k);
      if (at(i, j) > a.y + dy * k + slack) return false;
    }
    return true;
  };
  return { topNear, floorNear, sight, size };
};
