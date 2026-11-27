/**
 * Daytime broadcast grade (VIEW-06, LOOK-C1; RF-3D-04, RNF-07): lifted blacks, a touch of gamma and
 * a saturation below 1, applied after tone mapping. The same formula runs on the CPU (tests, the
 * exposure meter) and in the shader of the ShaderPass, so what is tested is what is drawn.
 *
 *   out = gain · (lift + (1 − lift) · in^gamma), then saturation around the Rec. 709 luma.
 *
 * Values in data/balance/view-look.json grade. Not wired to Race3D.js until LOOK-C3.
 */

import LOOK from "../../data/balance/view-look.json";

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Grade parameters for a cloud fraction (saturation drops a little under cover). */
export const gradeFor = (cloud = 0, grade = LOOK.grade) => ({
  lift: grade.lift,
  gamma: grade.gamma,
  gain: grade.gain,
  saturation: Math.max(0, grade.saturation + grade.cloudSaturation * clamp01(cloud)),
  lumaWeights: grade.lumaWeights,
});

/** Grade one display-referred colour [r, g, b] in 0..1. */
export const gradeColour = (rgb, params = gradeFor(0)) => {
  const { lift, gamma, gain, saturation, lumaWeights: w } = params;
  const toned = rgb.map((c) => gain * (lift + (1 - lift) * clamp01(c) ** gamma));
  const luma = w[0] * toned[0] + w[1] * toned[1] + w[2] * toned[2];
  return toned.map((c) => clamp01(luma + (c - luma) * saturation));
};

/** ShaderPass definition with the same formula as gradeColour. */
export const GradeShader = {
  name: "OverCutGradeShader",
  uniforms: {
    tDiffuse: { value: null },
    lift: { value: LOOK.grade.lift },
    gamma: { value: LOOK.grade.gamma },
    gain: { value: LOOK.grade.gain },
    saturation: { value: LOOK.grade.saturation },
    lumaWeights: { value: LOOK.grade.lumaWeights.slice() },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float lift;
    uniform float gamma;
    uniform float gain;
    uniform float saturation;
    uniform vec3 lumaWeights;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 toned = gain * (lift + (1.0 - lift) * pow(clamp(texel.rgb, 0.0, 1.0), vec3(gamma)));
      float luma = dot(toned, lumaWeights);
      gl_FragColor = vec4(clamp(vec3(luma) + (toned - vec3(luma)) * saturation, 0.0, 1.0), texel.a);
    }`,
};

/** Copy grade parameters into a pass's uniforms (a ShaderPass made from GradeShader). */
export const applyGrade = (uniforms, params) => {
  uniforms.lift.value = params.lift;
  uniforms.gamma.value = params.gamma;
  uniforms.gain.value = params.gain;
  uniforms.saturation.value = params.saturation;
  uniforms.lumaWeights.value = params.lumaWeights.slice();
  return uniforms;
};
