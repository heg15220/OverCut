/**
 * LOOK-C1 (F1M24-CHINA §3.3; VIEW-05 y VIEW-06 módulos; RF-3D-04, RNF-02, RNF-05, RNF-07):
 *   - grading con negros levantados (p2 de luminancia en 0,05–0,12, aceptación de VIEW-06) y saturación < 1;
 *   - autoexposición asimétrica que nunca compensa del todo y que conserva el valor en un corte;
 *   - desenfoque con máscara: laplaciano lateral −30 % o más, centro < 10 %, coche propio intacto (aceptación de
 *     VIEW-05 sobre la referencia de CPU del shader) y pase determinista;
 *   - post apagado en calidad baja (enmienda propuesta 10, F1M24-CHINA §4).
 */

import LOOK from "../../data/balance/view-look.json";
import { gradeColour, gradeFor, GradeShader, applyGrade } from "./grade";
import { createExposure, stepExposure, cutExposure, evOf, targetEvFor, exposureMultiplier, meanLuminanceOf, sceneLuminanceFrom } from "./exposure";
import { blurParams, blurImage, blurTapsFor, flowAt, MotionBlurShader, applyBlur } from "./motionBlur";
import { postPlanFor, createPostChain, meterFor, qualityFor } from "./chain";
import { exposureFor } from "../studio";

const luma = (rgb) => LOOK.grade.lumaWeights.reduce((sum, w, k) => sum + w * rgb[k], 0);
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
};

describe("grading (VIEW-06)", () => {
  it("levanta los negros: el p2 de una imagen con negros puros cae en 0,05–0,12", () => {
    // A frame whose darkest 5 % is pure black and the rest a ramp (tyres, shadows under the cars).
    const values = [];
    for (let i = 0; i < 1000; i += 1) values.push(i < 50 ? 0 : (i - 50) / 950);
    const graded = values.map((v) => luma(gradeColour([v, v, v], gradeFor(0))));
    const p2 = percentile(graded, 0.02);
    expect(p2).toBeGreaterThanOrEqual(0.05);
    expect(p2).toBeLessThanOrEqual(0.12);
  });

  it("baja la saturación y algo más con nubes, sin tocar el gris", () => {
    const red = [0.8, 0.2, 0.2];
    const chroma = (rgb) => Math.max(...rgb) - Math.min(...rgb);
    const sunny = gradeColour(red, gradeFor(0));
    const overcast = gradeColour(red, gradeFor(1));
    expect(chroma(sunny)).toBeLessThan(chroma(red));
    expect(chroma(overcast)).toBeLessThan(chroma(sunny));
    const grey = gradeColour([0.5, 0.5, 0.5], gradeFor(0));
    expect(chroma(grey)).toBeLessThan(1e-12);
  });

  it("los uniformes del shader salen del JSON y se actualizan", () => {
    expect(GradeShader.uniforms.lift.value).toBe(LOOK.grade.lift);
    expect(GradeShader.fragmentShader).toContain("pow(clamp(texel.rgb");
    const uniforms = JSON.parse(JSON.stringify({ lift: {}, gamma: {}, gain: {}, saturation: {}, lumaWeights: {} }));
    applyGrade(uniforms, gradeFor(1));
    expect(uniforms.saturation.value).toBeCloseTo(LOOK.grade.saturation + LOOK.grade.cloudSaturation, 12);
  });
});

describe("autoexposición asimétrica (VIEW-06)", () => {
  const timeTo = (from, to, share) => {
    let state = createExposure(from);
    const start = evOf(state);
    const goal = targetEvFor(to);
    let t = 0;
    const dt = 1 / 60;
    while (Math.abs(evOf(state) - start) < share * Math.abs(goal - start) && t < 30) {
      state = stepExposure(state, to, dt);
      t += dt;
    }
    return t;
  };

  it("cierra antes al aclararse la escena que abre al oscurecerse", () => {
    expect(timeTo(0.15, 0.7, 0.5)).toBeLessThan(timeTo(0.7, 0.15, 0.5));
    expect(timeTo(0.15, 0.7, 0.9)).toBeLessThan(timeTo(0.7, 0.15, 0.9));
  });

  it("tiene parte rápida y cola lenta: más de la mitad en el primer medio segundo, el resto tarda más de un segundo", () => {
    let state = createExposure(0.2);
    const goal = targetEvFor(0.7);
    const start = evOf(state);
    for (let i = 0; i < 30; i += 1) state = stepExposure(state, 0.7, 1 / 60);
    const half = (evOf(state) - start) / (goal - start);
    expect(half).toBeGreaterThan(0.5);
    expect(half).toBeLessThan(0.95);
  });

  it("nunca compensa del todo: un contraluz sigue más claro que la clave", () => {
    let state = createExposure(0.2);
    for (let i = 0; i < 600; i += 1) state = stepExposure(state, 0.7, 1 / 60);
    expect(0.7 * 2 ** evOf(state)).toBeGreaterThan(LOOK.exposure.key);
    expect(evOf(state)).toBeCloseTo(targetEvFor(0.7), 2);
  });

  it("un corte conserva la exposición del plano anterior y dt = 0 no la mueve", () => {
    const state = stepExposure(createExposure(0.3), 0.8, 0.2);
    expect(evOf(cutExposure(state))).toBe(evOf(state));
    expect(stepExposure(state, 0.05, 0)).toEqual(state);
  });

  it("la exposición base es la de antes de LOOK-C1 (studio.js) y el medidor lee la luminancia", () => {
    expect(exposureFor("aces")).toBe(1.05);
    expect(exposureFor("neutral")).toBe(1);
    expect(exposureMultiplier(createExposure(LOOK.exposure.key))).toBeCloseTo(1.05, 12);
    const grey = new Uint8Array([128, 128, 128, 255, 128, 128, 128, 255]);
    expect(meanLuminanceOf(grey)).toBeCloseTo(128 / 255, 6);
    expect(sceneLuminanceFrom(0.5, { fast: 1, slow: 0 })).toBeCloseTo(0.25, 12);
  });
});

describe("desenfoque con máscara (VIEW-05)", () => {
  const W = 128;
  const H = 72;
  const checker = () => {
    const img = new Float32Array(W * H);
    for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) img[y * W + x] = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? 0.9 : 0.1;
    return img;
  };
  const carMask = () => {
    // The own car's bodywork in the bottom-centre third of the frame (a cockpit camera).
    const mask = new Float32Array(W * H);
    for (let y = Math.floor(H * 0.72); y < H; y += 1) for (let x = Math.floor(W * 0.3); x < Math.floor(W * 0.7); x += 1) mask[y * W + x] = 1;
    return mask;
  };
  const laplacian = (img, region) => {
    let sum = 0;
    for (let y = 1; y < H - 1; y += 1) {
      for (let x = 1; x < W - 1; x += 1) {
        if (!region(x, y)) continue;
        const i = y * W + x;
        const l = 4 * img[i] - img[i - 1] - img[i + 1] - img[i - W] - img[i + W];
        sum += l * l;
      }
    }
    return sum;
  };
  const lateral = (x) => x < W * 0.15 || x >= W * 0.85;
  const centre = (x, y) => Math.hypot((x / W - 0.5) * (W / H), y / H - 0.5) / Math.hypot((0.5 * W) / H, 0.5) < LOOK.blur.centreRadius;
  const params = (extra = {}) => blurParams({ speedMps: 80, yawRate: 0.5, aspect: W / H, quality: "medium", ...extra });

  it("baja el laplaciano lateral ≥ 30 % y cambia el centro < 10 %", () => {
    const img = checker();
    const out = blurImage(img, W, H, null, params());
    const lateralDrop = 1 - laplacian(out, (x) => lateral(x)) / laplacian(img, (x) => lateral(x));
    const centreChange = Math.abs(1 - laplacian(out, centre) / laplacian(img, centre));
    expect(lateralDrop).toBeGreaterThanOrEqual(0.3);
    expect(centreChange).toBeLessThan(0.1);
  });

  it("no toca el coche propio (máscara de la capa del coche)", () => {
    const img = checker();
    const mask = carMask();
    const out = blurImage(img, W, H, mask, params());
    const touched = [];
    for (let i = 0; i < img.length; i += 1) if (mask[i] >= 1 && out[i] !== img[i]) touched.push(i);
    expect(touched).toEqual([]);
  });

  it("es determinista: mismas entradas, mismos bytes, sin Math.random", () => {
    const spy = jest.spyOn(Math, "random");
    const a = blurImage(checker(), W, H, carMask(), params());
    const b = blurImage(checker(), W, H, carMask(), params());
    expect(Array.from(new Uint8Array(a.buffer))).toEqual(Array.from(new Uint8Array(b.buffer)));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("más velocidad, más desenfoque; parado o en calidad baja, nada", () => {
    expect(Math.hypot(...flowAt(0.95, 0.5, params({ speedMps: 90 })))).toBeGreaterThan(Math.hypot(...flowAt(0.95, 0.5, params({ speedMps: 40 }))));
    expect(params({ speedMps: 2 }).enabled).toBe(false);
    expect(params({ quality: "low" }).enabled).toBe(false);
    expect(blurTapsFor("low")).toBe(0);
    const img = checker();
    expect(Array.from(blurImage(img, W, H, null, params({ quality: "low" })))).toEqual(Array.from(img));
  });

  it("el desplazamiento nunca pasa de maxOffset", () => {
    const p = params({ speedMps: 400, yawRate: 5 });
    [0, 0.25, 0.5, 0.75, 1].forEach((u) => [0, 0.5, 1].forEach((v) => expect(Math.hypot(...flowAt(u, v, p))).toBeLessThanOrEqual(LOOK.blur.maxOffset + 1e-12)));
  });

  it("los uniformes del shader reciben los mismos parámetros que la referencia de CPU", () => {
    const uniforms = Object.fromEntries(Object.keys(MotionBlurShader.uniforms).map((k) => [k, { value: null }]));
    const p = params();
    applyBlur(uniforms, p, { isTexture: true });
    expect(uniforms.taps.value).toBe(p.taps);
    expect(uniforms.radial.value).toBe(p.radial);
    expect(uniforms.useMask.value).toBe(1);
    expect(MotionBlurShader.defines.MAX_TAPS).toBeGreaterThanOrEqual(Math.max(...Object.values(LOOK.quality.levels).map((l) => l.blurTaps)));
  });
});

describe("cadena de post por calidad", () => {
  it("apaga el post en baja y pone el desenfoque en media y alta", () => {
    expect(postPlanFor("low")).toEqual([]);
    expect(postPlanFor("medium")).toEqual(["render", "motionBlur", "output", "grade"]);
    expect(postPlanFor("high")).toContain("motionBlur");
  });

  it("sin post, render() dibuja directo con el renderer", async () => {
    const calls = [];
    const renderer = { render: (scene, camera) => calls.push([scene, camera]) };
    const chain = await createPostChain({ renderer, scene: "s", camera: "c", quality: "low" });
    chain.render();
    expect(chain.composer).toBeNull();
    expect(calls).toEqual([["s", "c"]]);
    expect(chain.luminance()).toBeNull();
  });

  it("LOOK-C3: calidad pedida, por defecto o baja con puntero grueso; medidor solo con autoexposición y grading", () => {
    expect(qualityFor("high")).toBe("high");
    expect(qualityFor(undefined, null)).toBe(LOOK.quality.default);
    expect(qualityFor("nope", { matchMedia: () => ({ matches: true }) })).toBe(LOOK.quality.coarsePointer);
    expect(qualityFor(undefined, { matchMedia: () => ({ matches: false }) })).toBe(LOOK.quality.default);
    expect(meterFor("low")).toBe(false);
    expect(meterFor("medium")).toBe(true);
  });
});
