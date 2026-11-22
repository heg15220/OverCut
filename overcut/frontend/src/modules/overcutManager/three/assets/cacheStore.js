/**
 * Asset bytes: Cache Storage keyed by the manifest hash, and a download queue
 * (RF-3D-01, RNF-03, RNF-04). No three.js here, so screens can prefetch files
 * without loading the 3D engine.
 *
 *   - A file is read from Cache Storage when it is there; otherwise it is
 *     downloaded once (concurrent callers share the download) and cached.
 *     A new manifest hash opens a new cache and the old ones are deleted.
 *   - Downloads go through a small priority queue: the lightest LOD of every car
 *     first, then circuits and splines, then the heavier levels; prefetches wait
 *     behind everything a screen is asking for. A grid of 22 cars asks for 66
 *     files at once; this way every car shows its LOD2 before any LOD0 competes
 *     for the connection.
 */

import { manifestHash } from "./manifest";

const CACHE_PREFIX = "overcut-manager-assets-";

const cacheName = () => `${CACHE_PREFIX}${manifestHash()}`;

/** Drop caches written for an older manifest (RNF-04). */
export const pruneOldCaches = async () => {
  if (typeof caches === "undefined") return;
  try {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== cacheName()).map((name) => caches.delete(name)));
  } catch {
    // A private window or blocked storage: no cache, the network still works.
  }
};

let cachePromise = null;
const openCache = () => {
  if (typeof caches === "undefined") return Promise.resolve(null);
  if (!cachePromise) {
    cachePromise = caches.open(cacheName()).catch(() => null);
    // The first time a page opens the current cache, the old manifests' caches go.
    pruneOldCaches();
  }
  return cachePromise;
};

/** Lower runs first: LOD2, then everything that is not a car LOD (circuits, splines), then LOD1 and LOD0. */
export const priorityOf = (url) => {
  const match = /\.lod(\d)\.glb/.exec(url);
  if (!match) return 1;
  const level = Number(match[1]);
  return level >= 2 ? 0 : 3 - level;
};

/** Prefetches always queue behind what a screen needs now. */
export const PREFETCH = 10;

const MAX_DOWNLOADS = 4;
const queue = [];
let active = 0;
let order = 0;

const pump = () => {
  while (active < MAX_DOWNLOADS && queue.length) {
    queue.sort((a, b) => a.priority - b.priority || a.order - b.order);
    const job = queue.shift();
    active += 1;
    job
      .run()
      .then(job.resolve, job.reject)
      .finally(() => {
        active -= 1;
        pump();
      });
  }
};

const download = async (url, cache) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`asset ${response.status}: ${url}`);
  if (cache) cache.put(url, response.clone()).catch(() => {});
  return response.arrayBuffer();
};

const inflight = new Map();

/**
 * The file's bytes: from Cache Storage when it has them, from the network
 * otherwise (and then cached). A screen's request raises a queued prefetch of
 * the same file to the screen's priority.
 */
export const fetchCached = async (url, { prefetch = false } = {}) => {
  const priority = priorityOf(url) + (prefetch ? PREFETCH : 0);
  const cache = await openCache();
  const hit = cache ? await cache.match(url).catch(() => null) : null;
  if (hit) return hit.arrayBuffer();
  const current = inflight.get(url);
  if (current) {
    const waiting = queue.find((job) => job.url === url);
    if (waiting && waiting.priority > priority) waiting.priority = priority;
    return current;
  }
  let job = null;
  const pending = new Promise((resolve, reject) => {
    order += 1;
    job = { url, priority, order, run: () => download(url, cache), resolve, reject };
    queue.push(job);
    pump();
  });
  inflight.set(url, pending);
  pending.then(
    () => inflight.delete(url),
    () => inflight.delete(url),
  );
  return pending;
};

/** Is this URL already in Cache Storage? */
export const isCached = async (url) => {
  const cache = await openCache();
  return Boolean(cache && (await cache.match(url).catch(() => null)));
};

/**
 * Put a file in Cache Storage without parsing it (idle-time prefetch of the
 * next car or circuit). Resolves to true when the file is cached; never rejects.
 */
export const prefetchUrl = async (url) => {
  try {
    const cache = await openCache();
    if (!cache) return false;
    if (await cache.match(url).catch(() => null)) return true;
    await fetchCached(url, { prefetch: true });
    return true;
  } catch {
    return false;
  }
};
