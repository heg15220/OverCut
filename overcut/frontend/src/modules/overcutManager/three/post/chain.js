/**
 * Post-processing chain of the live view (VIEW-05, VIEW-06, LOOK-C1; RF-3D-04, RNF-02, RNF-07):
 * RenderPass → motion blur (own car masked) → OutputPass (tone mapping and sRGB) → grade.
 *
 * Which passes run depends on the quality level (view-look.json quality.levels): none in `low`
 * (proposed amendment 10, F1M24-CHINA §4: blur and post off in low LOD or mobile). Built lazily from
 * three/examples. LOOK-C3 wires it into Race3D.js; with auto exposure on, a meter pass between the
 * output and the grade copies the tone-mapped frame into a view-look.json exposure.meter.sizePx square
 * every meter.everyFrames frames and reads it back (`luminance()`), for three/post/exposure.js.
 */

import LOOK from "../../data/balance/view-look.json";
import { GradeShader, applyGrade } from "./grade";
import { MotionBlurShader, applyBlur } from "./motionBlur";
import { meanLuminanceOf } from "./exposure";
import { LensDropShader, applyLens } from "../rain/lens";

/** The quality level to draw at: the one asked for, else view-look.json quality (coarse pointer → coarsePointer). */
export const qualityFor = (asked, env = typeof window !== "undefined" ? window : null) => {
  if (asked && LOOK.quality.levels[asked]) return asked;
  const coarse = Boolean(env?.matchMedia?.("(pointer: coarse)")?.matches);
  return coarse ? LOOK.quality.coarsePointer : LOOK.quality.default;
};

/** Whether the meter pass runs at a level: auto exposure on and a grade pass after it (never the last pass). */
export const meterFor = (quality = "medium") => {
  const level = LOOK.quality.levels[quality] || LOOK.quality.levels.medium;
  return Boolean(level.post && level.autoExposure && level.grade);
};

/**
 * Ordered pass ids for a quality level. `[]` means draw straight with renderer.render. LOOK-C4 (VIEW-07):
 * `lens` adds the drops on the onboard lens (three/rain/lens.js) before the tone mapping; the pass stays
 * off while there is no drop on the lens.
 */
export const postPlanFor = (quality = "medium", { lens = false } = {}) => {
  const level = LOOK.quality.levels[quality] || LOOK.quality.levels.medium;
  if (!level.post) return [];
  const plan = ["render"];
  if (level.motionBlur && level.blurTaps >= 2) plan.push("motionBlur");
  if (lens) plan.push("lens");
  plan.push("output");
  if (level.grade) plan.push("grade");
  return plan;
};

/**
 * Draw the own car alone (camera layer `maskLayer`, view-look.json blur) in white into `target`:
 * the blur's mask. The caller puts the own car's meshes on that layer as well as layer 0.
 */
export const renderMask = (THREE, renderer, scene, camera, target, maskMaterial) => {
  const layers = camera.layers.mask;
  const background = scene.background;
  const override = scene.overrideMaterial;
  const fog = scene.fog;
  camera.layers.set(LOOK.blur.maskLayer);
  scene.background = null;
  scene.fog = null;
  scene.overrideMaterial = maskMaterial;
  renderer.setRenderTarget(target);
  renderer.setClearColor(new THREE.Color(0, 0, 0), 1);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  scene.overrideMaterial = override;
  scene.background = background;
  scene.fog = fog;
  camera.layers.mask = layers;
};

/**
 * The composer for a renderer, scene and camera at a quality level. Returns
 * `{plan, composer, render(), setSize(w, h), update({grade, blur, maskTexture}), dispose()}`;
 * with an empty plan `render()` is a plain renderer.render.
 */
export const createPostChain = async ({ renderer, scene, camera, quality = "medium", lens = false }) => {
  const plan = postPlanFor(quality, { lens });
  if (!plan.length) {
    return {
      plan,
      composer: null,
      render: () => renderer.render(scene, camera),
      setSize: () => {},
      update: () => {},
      luminance: () => null,
      dispose: () => {},
    };
  }
  const [{ EffectComposer }, { RenderPass }, { ShaderPass }, { OutputPass }, { Pass, FullScreenQuad }, { CopyShader }, THREE] = await Promise.all([
    import("three/examples/jsm/postprocessing/EffectComposer.js"),
    import("three/examples/jsm/postprocessing/RenderPass.js"),
    import("three/examples/jsm/postprocessing/ShaderPass.js"),
    import("three/examples/jsm/postprocessing/OutputPass.js"),
    import("three/examples/jsm/postprocessing/Pass.js"),
    import("three/examples/jsm/shaders/CopyShader.js"),
    import("three"),
  ]);
  const composer = new EffectComposer(renderer);
  const passes = {};
  const metered = meterFor(quality);
  const size = LOOK.exposure.meter.sizePx;
  const every = LOOK.exposure.meter.everyFrames;
  let meter = null;
  if (metered) {
    // The frame as the output pass left it (tone mapped, before the grade), copied into a tiny target.
    const target = new THREE.WebGLRenderTarget(size, size, { type: THREE.UnsignedByteType, depthBuffer: false });
    const copy = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms), vertexShader: CopyShader.vertexShader, fragmentShader: CopyShader.fragmentShader });
    const quad = new FullScreenQuad(copy);
    const pixels = new Uint8Array(size * size * 4);
    meter = new Pass();
    meter.needsSwap = false;
    meter.frame = 0;
    meter.value = null;
    meter.render = (r, writeBuffer, readBuffer) => {
      meter.frame += 1;
      if (meter.frame % every !== 0 && meter.value !== null) return;
      copy.uniforms.tDiffuse.value = readBuffer.texture;
      const previous = r.getRenderTarget();
      r.setRenderTarget(target);
      quad.render(r);
      r.readRenderTargetPixels(target, 0, 0, size, size, pixels);
      r.setRenderTarget(previous);
      meter.value = meanLuminanceOf(pixels);
    };
    meter.dispose = () => {
      target.dispose();
      copy.dispose();
      quad.dispose();
    };
  }
  plan.forEach((id) => {
    if (id === "render") passes.render = new RenderPass(scene, camera);
    if (id === "motionBlur") passes.motionBlur = new ShaderPass(MotionBlurShader);
    if (id === "lens") {
      passes.lens = new ShaderPass(LensDropShader);
      passes.lens.enabled = false;
    }
    if (id === "output") passes.output = new OutputPass();
    if (id === "grade") passes.grade = new ShaderPass(GradeShader);
    if (id === "grade" && meter) {
      passes.meter = meter;
      composer.addPass(meter);
    }
    composer.addPass(passes[id]);
  });
  return {
    plan,
    composer,
    passes,
    render: (dt) => composer.render(dt),
    /** Mean display luminance of the last metered frame (0..1), null before the first or without a meter. */
    luminance: () => (meter ? meter.value : null),
    setSize: (w, h) => composer.setSize(w, h),
    update: ({ grade, blur, maskTexture, lens: drops } = {}) => {
      // LOOK-C4: the drops of the onboard lens; with none the pass is skipped.
      if (drops && passes.lens) {
        applyLens(passes.lens.uniforms, drops.drops || [], { aspect: drops.aspect });
        passes.lens.enabled = passes.lens.uniforms.dropCount.value > 0;
      }
      if (grade && passes.grade) applyGrade(passes.grade.uniforms, grade);
      if (blur && passes.motionBlur) applyBlur(passes.motionBlur.uniforms, blur, maskTexture || null);
    },
    dispose: () => {
      Object.values(passes).forEach((pass) => pass.dispose?.());
      composer.dispose();
    },
  };
};
