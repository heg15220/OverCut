/**
 * Loading processed GLB files (RF-3D-01, RNF-03, RNF-04).
 *
 *   - GLTFLoader with the Meshopt decoder and KTX2 textures (the pipeline
 *     writes both); the Basis transcoder is served next to the assets.
 *   - Cache Storage keyed by the manifest hash: reopening a Grand Prix reads the
 *     files from disk, and a new manifest drops the old cache in one go.
 *   - One parse per file per session; every car or circuit that needs it gets
 *     a clone (geometry and textures are shared, so 22 cars cost one model).
 *
 * Nothing here knows about races. A failed load rejects, and the caller keeps
 * the procedural model it was already showing (RF-3D-02).
 */

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { assetUrl, manifestHash } from "./manifest";

const CACHE_PREFIX = "overcut-manager-assets-";

let loader = null;
let ktx2 = null;

/** The shared loader; KTX2 needs the renderer to know which GPU formats it can transcode to. */
export const gltfLoader = (renderer) => {
  if (!loader) {
    loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  if (renderer && !ktx2) {
    ktx2 = new KTX2Loader().setTranscoderPath(`${process.env.PUBLIC_URL || ""}/manager-assets/basis/`).detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
  }
  return loader;
};

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

/** The file's bytes: from Cache Storage when it has them, from the network otherwise (and then cached). */
export const fetchCached = async (url) => {
  let cache = null;
  try {
    cache = typeof caches !== "undefined" ? await caches.open(cacheName()) : null;
  } catch {
    cache = null;
  }
  const hit = cache ? await cache.match(url).catch(() => null) : null;
  if (hit) return hit.arrayBuffer();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`asset ${response.status}: ${url}`);
  if (cache) cache.put(url, response.clone()).catch(() => {});
  return response.arrayBuffer();
};

const parsed = new Map();

/** Parsed glTF for a manifest path, once per session. */
export const loadGltf = (path, renderer) => {
  const url = assetUrl(path);
  if (!parsed.has(url)) {
    const pending = fetchCached(url).then((buffer) => gltfLoader(renderer).parseAsync(buffer, ""));
    pending.catch(() => parsed.delete(url));
    parsed.set(url, pending);
  }
  return parsed.get(url);
};

/** Forget parsed files (tests, or after a manifest change in development). */
export const clearParsed = () => parsed.clear();
