/**
 * Shader compilation off the main thread (RNF-02).
 *
 * three.js compiles a material's program the first time it draws it, and the
 * first use waits for the GPU driver to link it. On Windows (ANGLE over D3D11)
 * that wait is 50-300 ms per program: a showroom or a race froze the page for
 * 1-2 s when it opened, and again when a GLB arrived with new materials.
 *
 * `gateRenderer` wraps `renderer.render` so that a frame which would meet a
 * material without a program first compiles the scene in the background (with
 * KHR_parallel_shader_compile the driver links in the background) and skips
 * drawing until every program is ready; the canvas keeps its previous frame
 * meanwhile. Frames with nothing new draw as before. Renders into a target
 * (shadow bakes, contact shadows) are never skipped: a one-off pass must happen
 * when its caller asks for it.
 *
 * Without the extension (old drivers, tests) the renderer is left untouched.
 */

import { WebGLRenderTarget } from "three";

const GATED = Symbol("overcutCompileGate");
const GIVE_UP_MS = 6000;

const hasMissingProgram = (renderer, scene) => {
  const { properties } = renderer;
  let missing = false;
  const check = (material) => {
    if (!missing && material && !properties.get(material).currentProgram) missing = true;
  };
  scene.traverseVisible((object) => {
    if (missing || !(object.isMesh || object.isPoints || object.isLine || object.isSprite)) return;
    if (Array.isArray(object.material)) object.material.forEach(check);
    else check(object.material);
  });
  return missing;
};

const materialsOf = (object) => (Array.isArray(object.material) ? object.material : object.material ? [object.material] : []);
const isDrawable = (object) => object.isMesh || object.isPoints || object.isLine || object.isSprite;

/**
 * One object per material still without a program. Clones share materials (22
 * cars, one model), and `renderer.compile` works out a program's parameters
 * once per object, not per material: deduplicating first turns a 1 s compile of
 * the race grid into a few milliseconds.
 */
const pendingObjects = (renderer, scene) => {
  const seen = new Set();
  const list = [];
  let transmissive = false;
  scene.traverse((object) => {
    if (!isDrawable(object)) return;
    if (!transmissive && materialsOf(object).some((material) => material.transmission > 0)) transmissive = true;
    const fresh = materialsOf(object).filter((material) => !seen.has(material) && !renderer.properties.get(material).currentProgram);
    if (!fresh.length) return;
    fresh.forEach((material) => seen.add(material));
    list.push(object);
  });
  return { list, transmissive };
};

/** A stand-in for a scene that holds only `objects` (renderer.compile only calls these two). */
const subset = (objects) => ({ traverse: (fn) => objects.forEach(fn), traverseVisible: (fn) => objects.forEach(fn) });

// Shared by every renderer (each one allocates its own GPU side on first use); 1x1, never drawn into.
let target = null;

const SLICE_MS = 10;
const nextSlice = (fn) => (typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame(() => fn()) : setTimeout(fn, 0));

/**
 * renderer.compileAsync, but in slices of ~10 ms (a grid of cars no longer
 * blocks for a second working out parameters), deduplicated by material, also
 * for the render-target variant when the scene has transmissive materials (the
 * transmission pass draws the opaque objects into a target, and those programs
 * otherwise link on the first frame), and safe when a material is disposed or
 * the renderer goes while a program links (three's own version then throws
 * inside a timer and never resolves).
 */
export const compileInBackground = (renderer, scene, camera) =>
  new Promise((resolve) => {
    const programs = new Set();
    let objects;
    let transmissive;
    try {
      ({ list: objects, transmissive } = pendingObjects(renderer, scene));
    } catch {
      resolve();
      return;
    }
    if (transmissive && !target) target = new WebGLRenderTarget(1, 1);
    const variantTarget = transmissive ? target : null;
    let index = 0;
    const compileSome = () => {
      const started = performance.now();
      try {
        while (index < objects.length && performance.now() - started < SLICE_MS) {
          const batch = [objects[index]];
          index += 1;
          const materials = materialsOf(batch[0]);
          if (variantTarget && !materials.some((material) => material.transparent || material.transmission > 0)) {
            const previous = renderer.getRenderTarget();
            renderer.setRenderTarget(variantTarget);
            renderer.compile(subset(batch), camera, scene);
            renderer.setRenderTarget(previous);
            materials.forEach((material) => programs.add(renderer.properties.get(material)?.currentProgram));
          }
          renderer.compile(subset(batch), camera, scene);
          materials.forEach((material) => programs.add(renderer.properties.get(material)?.currentProgram));
        }
      } catch {
        index = objects.length;
      }
      if (index < objects.length) nextSlice(compileSome);
      else waitReady();
    };
    const waitReady = () => {
      try {
        programs.forEach((program) => {
          // A program released meanwhile (material disposed, view closed) has no GL object left to ask.
          if (!program || typeof program.isReady !== "function" || program.program === undefined || program.isReady()) programs.delete(program);
        });
      } catch {
        programs.clear();
      }
      if (programs.size === 0) resolve();
      else setTimeout(waitReady, 10);
    };
    compileSome();
  });

export const gateRenderer = (renderer) => {
  if (!renderer || renderer[GATED] || typeof renderer.compile !== "function") return renderer;
  let parallel = false;
  try {
    parallel = Boolean(renderer.extensions?.has?.("KHR_parallel_shader_compile"));
  } catch {
    parallel = false;
  }
  if (!parallel) return renderer;
  const render = renderer.render.bind(renderer);
  let compiling = null;
  renderer.render = (scene, camera) => {
    if (renderer.getRenderTarget() !== null || !scene || !camera) return render(scene, camera);
    if (compiling) return undefined;
    if (hasMissingProgram(renderer, scene)) {
      const started = typeof performance !== "undefined" ? performance.now() : 0;
      // A driver that never reports completion must not leave the view blank: after a few seconds the
      // next frame draws (and compiles what is left the old, blocking way).
      compiling = Promise.race([compileInBackground(renderer, scene, camera), new Promise((resolve) => setTimeout(resolve, GIVE_UP_MS))])
        .catch(() => null)
        .then(() => {
          compiling = null;
          if (typeof performance !== "undefined" && performance.measure) {
            try {
              performance.measure("mn:shaders", { start: started, end: performance.now() });
            } catch {
              // Old browsers without the options form of measure.
            }
          }
        });
      return undefined;
    }
    return render(scene, camera);
  };
  renderer[GATED] = true;
  return renderer;
};

export default gateRenderer;
