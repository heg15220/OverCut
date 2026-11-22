/**
 * Loading processed GLB files (RF-3D-01, RNF-02, RNF-03, RNF-04).
 *
 *   - One GLTFLoader and one KTX2Loader per page: the Basis transcoder (JS +
 *     wasm) and its worker pool load once and transcode off the main thread.
 *   - Bytes come from `cacheStore.js`: Cache Storage keyed by the manifest hash
 *     (reopening a Grand Prix reads the files from disk; a new manifest drops
 *     the old cache) and a priority queue, lightest LOD first.
 *   - One parse per file per session; every car or circuit that needs it gets
 *     a clone (geometry and textures are shared, so 22 cars cost one model).
 *
 * Nothing here knows about races. A failed load rejects, and the caller keeps
 * the procedural model it was already showing (RF-3D-02).
 */

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { assetUrl } from "./manifest";
import { fetchCached, pruneOldCaches } from "./cacheStore";

export { fetchCached, pruneOldCaches };

let loader = null;
let ktx2 = null;

const workerCount = () => {
  const cores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
  return Math.max(1, Math.min(4, cores - 1));
};

/** The shared loader; KTX2 needs the renderer to know which GPU formats it can transcode to. */
export const gltfLoader = (renderer) => {
  if (!loader) {
    loader = new GLTFLoader();
    // Meshopt decodes on the main thread on purpose: three's bundled decoder builds its workers from
    // `fn.toString()` and refers to its functions by name, which the production minifier renames, so
    // `MeshoptDecoder.useWorkers` breaks every GLB in a CRA build ("workerProcess is not defined").
    // Decoding is fast (~10-40 ms per car); the expensive parts (KTX2 transcoding) are in workers.
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  if (renderer && !ktx2) {
    ktx2 = new KTX2Loader()
      .setTranscoderPath(`${process.env.PUBLIC_URL || ""}/manager-assets/basis/`)
      .setWorkerLimit(workerCount())
      .detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
    // Start the transcoder now, while the first file is still downloading.
    if (typeof ktx2.init === "function") ktx2.init().catch(() => {});
  }
  return loader;
};

const now = () => (typeof performance !== "undefined" ? performance.now() : 0);

/** Timing for the performance panel and the load tests (performance.measure "mn:glb-*"). */
const measure = (name, start) => {
  if (typeof performance === "undefined" || !performance.measure) return;
  try {
    performance.measure(name, { start, end: now() });
  } catch {
    // Old browsers: no timing, nothing else changes.
  }
};

const parsed = new Map();

/** Parsed glTF for a manifest path, once per session. */
export const loadGltf = (path, renderer) => {
  const url = assetUrl(path);
  if (!parsed.has(url)) {
    const start = now();
    const pending = fetchCached(url).then((buffer) => {
      measure(`mn:glb-fetch ${path}`, start);
      const parseStart = now();
      return gltfLoader(renderer)
        .parseAsync(buffer, "")
        .then((gltf) => {
          measure(`mn:glb-parse ${path}`, parseStart);
          return gltf;
        });
    });
    pending.catch(() => parsed.delete(url));
    parsed.set(url, pending);
  }
  return parsed.get(url);
};

/** Forget parsed files (tests, or after a manifest change in development). */
export const clearParsed = () => parsed.clear();
