/**
 * Idle-time prefetch of the GLB files the next screens will ask for (RNF-03,
 * RNF-04): the player's car (every LOD), the next Grand Prix's circuit and its
 * spline, and the lightest LOD of the rest of the grid. Files only go into
 * Cache Storage; nothing is parsed, so the main thread pays nothing, and every
 * prefetch queues behind what a screen is loading (cacheStore.js).
 *
 * Skipped when the browser asks to save data, on slow connections, and where
 * no 3D view will be drawn.
 */

import { assetUrl, carAssetFor, circuitAssetFor } from "./manifest";
import { prefetchUrl } from "./cacheStore";

const worthIt = () => {
  if (typeof navigator === "undefined" || typeof caches === "undefined") return false;
  const connection = navigator.connection;
  if (connection?.saveData) return false;
  if (["slow-2g", "2g", "3g"].includes(connection?.effectiveType)) return false;
  return true;
};

/** The URLs to prefetch for a career, in order. Exported for tests. */
export const prefetchPlan = ({ year, teamRef = null, gridTeamRefs = [], splineId = null } = {}) => {
  const urls = [];
  const add = (path) => {
    if (path) urls.push(assetUrl(path));
  };
  const own = teamRef ? carAssetFor(year, teamRef) : null;
  // Your car: the lightest level (shown at once) and LOD0 (camera follows you, showroom cards); LOD1 and the hero load on demand.
  if (own?.lods?.length) [own.lods[own.lods.length - 1], own.lods[0]].forEach((lod) => add(lod.file));
  const circuit = splineId ? circuitAssetFor({ splineId }) : null;
  if (circuit) {
    add(circuit.spline);
    add(circuit.file);
  }
  gridTeamRefs
    .filter((ref) => ref && ref !== teamRef)
    .forEach((ref) => {
      const car = carAssetFor(year, ref);
      if (car?.lods?.length) add(car.lods[car.lods.length - 1].file);
    });
  return [...new Set(urls)];
};

const done = new Set();

/** Prefetch one after the other (never more than one prefetch on the wire). Resolves when finished. */
export const prefetchForCareer = async (plan) => {
  if (!worthIt()) return 0;
  let count = 0;
  for (const url of prefetchPlan(plan)) {
    if (done.has(url)) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await prefetchUrl(url)) {
      done.add(url);
      count += 1;
    }
  }
  return count;
};
