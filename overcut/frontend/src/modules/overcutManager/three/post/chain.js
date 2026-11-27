/**
 * Post-processing chain of the live view (VIEW-05, VIEW-06, LOOK-C1; RF-3D-04, RNF-02, RNF-07):
 * RenderPass → motion blur (own car masked) → OutputPass (tone mapping and sRGB) → grade.
 *
 * Which passes run depends on the quality level (view-look.json quality.levels): none in `low`
 * (proposed amendment 10, F1M24-CHINA §4: blur and post off in low LOD or mobile). Built lazily from
 * three/examples so the module costs nothing until LOOK-C3 wires it into Race3D.js; nothing here is
 * used by the view yet.
 */

import LOOK from "../../data/balance/view-look.json";
import { GradeShader, applyGrade } from "./grade";
import { MotionBlurShader, applyBlur } from "./motionBlur";

/** Ordered pass ids for a quality level. `[]` means draw straight with renderer.render. */
export const postPlanFor = (quality = "medium") => {
  const level = LOOK.quality.levels[quality] || LOOK.quality.levels.medium;
  if (!level.post) return [];
  const plan = ["render"];
  if (level.motionBlur && level.blurTaps >= 2) plan.push("motionBlur");
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
export const createPostChain = async ({ renderer, scene, camera, quality = "medium" }) => {
  const plan = postPlanFor(quality);
  if (!plan.length) {
    return {
      plan,
      composer: null,
      render: () => renderer.render(scene, camera),
      setSize: () => {},
      update: () => {},
      dispose: () => {},
    };
  }
  const [{ EffectComposer }, { RenderPass }, { ShaderPass }, { OutputPass }] = await Promise.all([
    import("three/examples/jsm/postprocessing/EffectComposer.js"),
    import("three/examples/jsm/postprocessing/RenderPass.js"),
    import("three/examples/jsm/postprocessing/ShaderPass.js"),
    import("three/examples/jsm/postprocessing/OutputPass.js"),
  ]);
  const composer = new EffectComposer(renderer);
  const passes = {};
  plan.forEach((id) => {
    if (id === "render") passes.render = new RenderPass(scene, camera);
    if (id === "motionBlur") passes.motionBlur = new ShaderPass(MotionBlurShader);
    if (id === "output") passes.output = new OutputPass();
    if (id === "grade") passes.grade = new ShaderPass(GradeShader);
    composer.addPass(passes[id]);
  });
  return {
    plan,
    composer,
    passes,
    render: (dt) => composer.render(dt),
    setSize: (w, h) => composer.setSize(w, h),
    update: ({ grade, blur, maskTexture } = {}) => {
      if (grade && passes.grade) applyGrade(passes.grade.uniforms, grade);
      if (blur && passes.motionBlur) applyBlur(passes.motionBlur.uniforms, blur, maskTexture || null);
    },
    dispose: () => {
      Object.values(passes).forEach((pass) => pass.dispose?.());
      composer.dispose();
    },
  };
};
