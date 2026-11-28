/**
 * Wet asphalt on a real circuit (LOOK-C4; GS-10; RF-SIM-11, RF-3D-03, RF-3D-04, RNF-05, RNF-07).
 *
 * The GLB of a calibrated circuit has no per-vertex lateral, racing line or sector like the procedural
 * road (wetSurface.js wetAttributes): its meshes are merged and its materials carry no names a road could
 * be told by (shanghai-1: "Merged_materials_N"). So the road is told by where it is: a top-down mask of
 * the circuit, rasterised once from the spline and the engine's racing line (engine/trackData.js
 * lineGeometryFor: the same offsets and measured half widths the cars are placed with) into a texture
 * over the circuit's box. Each texel on the asphalt holds
 *   R  the distance to the racing line (0 … maxLineDistM),
 *   G  the timing sector (0 … sectors − 1, as wetSurface sectorCoordOf),
 *   B  the puddle-prone share of that edge (wetSurface puddleField),
 *   A  255 on the asphalt, 0 elsewhere.
 * The shader patch reads it at the fragment's world position and draws the same two layers (damp, film)
 * and the drier line as wetSurface.js, with the engine's water (`snapshot.weather.waterMm`). Off the
 * asphalt the ground darkens less and does not turn glossy (offRoadDamp, offRoadFilm); only surfaces that
 * face the sky get wet (upFrom → upFull on the world normal's y). `worldSurfaceAt` is the CPU reference of
 * the shader, so what is tested is what is drawn. Values in view-look.json wet and rain.hookup.worldMask.
 */

import * as THREE from "three";
import LOOK from "../../data/balance/view-look.json";
import { lineGeometryFor } from "../../engine/trackData";
import { puddleField, sectorBlend, sectorCoordOf } from "./wetSurface";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a || 1e-9), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * The circuit's wet mask: `{data (RGBA Uint8Array), size, minX, minZ, span, metresPerTexel, maxLineDistM,
 * sectors}`. World x = circuit point x, world z = circuit point y (as Race3D.js places the cars); a point
 * `lat` metres to the right of travel at heading h is (x − sin h·lat, y + cos h·lat).
 */
export const worldMaskFor = (circuit, { cfg = LOOK.wet, mask = LOOK.rain.hookup.worldMask, line = null } = {}) => {
  const P = circuit.points;
  const n = P.length;
  const geo = line || lineGeometryFor(circuit);
  const half = (arr, i) => (arr && Number.isFinite(arr[i]) ? arr[i] : mask.defaultHalfM);
  let maxHalf = mask.defaultHalfM;
  for (let i = 0; i < n; i += 1) maxHalf = Math.max(maxHalf, half(geo.wl, i), half(geo.wr, i));
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  P.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.y);
    maxZ = Math.max(maxZ, p.y);
  });
  const pad = maxHalf + mask.edgeM;
  minX -= pad;
  minZ -= pad;
  const span = Math.max(maxX + pad - minX, maxZ + pad - minZ);
  const size = Math.max(2, Math.min(mask.maxSize, Math.ceil(span / mask.metresPerTexel)));
  const mpt = span / size;
  const data = new Uint8Array(size * size * 4);
  const sectorsN = cfg.sectors;
  const bounds = Array.isArray(circuit.sectors) && circuit.sectors.length ? circuit.sectors.slice(0, sectorsN) : [0, 1 / 3, 2 / 3];
  const field = puddleField(circuit, { cfg });
  const dist = circuit.dist || null;
  const length = circuit.length || 1;
  const step = mpt / 2;
  const offsets = geo.offsets || new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const p = P[i];
    const q = P[j];
    const segment = Math.hypot(q.x - p.x, q.y - p.y);
    const heading = Math.atan2(q.y - p.y, q.x - p.x);
    const s = Math.sin(heading);
    const c = Math.cos(heading);
    const sub = Math.max(1, Math.ceil(segment / step));
    const share = dist ? dist[i] / length : i / n;
    const sectorByte = sectorsN > 1 ? Math.round((sectorCoordOf(share, bounds) / (sectorsN - 1)) * 255) : 0;
    for (let k = 0; k < sub; k += 1) {
      const t = k / sub;
      const x = p.x + (q.x - p.x) * t;
      const y = p.y + (q.y - p.y) * t;
      const lineLat = offsets[i] + (offsets[j] - offsets[i]) * t;
      const left = half(geo.wl, i) + (half(geo.wl, j) - half(geo.wl, i)) * t;
      const right = half(geo.wr, i) + (half(geo.wr, j) - half(geo.wr, i)) * t;
      const lowL = field.left[i] + (field.left[j] - field.left[i]) * t;
      const lowR = field.right[i] + (field.right[j] - field.right[i]) * t;
      for (let lat = -left; lat <= right + 1e-9; lat += step) {
        const u = Math.floor((x - s * lat - minX) / mpt);
        const v = Math.floor((y + c * lat - minZ) / mpt);
        if (u < 0 || v < 0 || u >= size || v >= size) continue;
        const o = (v * size + u) * 4;
        const d = Math.round((clamp(Math.abs(lat - lineLat), 0, mask.maxLineDistM) / mask.maxLineDistM) * 255);
        // Where two stretches of road overlap in plan (a crossover, a hairpin's edges) the nearer line wins.
        if (data[o + 3] !== 0 && d >= data[o]) continue;
        data[o] = d;
        data[o + 1] = sectorByte;
        data[o + 2] = Math.round(clamp(lat < 0 ? lowL : lowR, 0, 1) * 255);
        data[o + 3] = 255;
      }
    }
  }
  return { data, size, minX, minZ, span, metresPerTexel: mpt, maxLineDistM: mask.maxLineDistM, sectors: sectorsN };
};

/** The mask's texel at world (x, z), nearest: `{road, lineDist, sector, low}` (off the box or the road: road false). */
export const maskAt = (mask, x, z) => {
  const u = Math.floor((x - mask.minX) / mask.metresPerTexel);
  const v = Math.floor((z - mask.minZ) / mask.metresPerTexel);
  if (u < 0 || v < 0 || u >= mask.size || v >= mask.size) return { road: false, lineDist: mask.maxLineDistM, sector: 0, low: 0 };
  const o = (v * mask.size + u) * 4;
  const road = mask.data[o + 3] >= 128;
  return {
    road,
    lineDist: road ? (mask.data[o] / 255) * mask.maxLineDistM : mask.maxLineDistM,
    sector: road ? (mask.data[o + 1] / 255) * Math.max(0, mask.sectors - 1) : 0,
    low: road ? mask.data[o + 2] / 255 : 0,
  };
};

/**
 * The wet surface at world (x, z) with a world normal whose y is `up`, for a look of wetSurface wetLookFor:
 * the albedo multiplier, roughness, metalness and the layers - the shader's formula on the CPU. Dry look or
 * a surface facing away from the sky: the dry values.
 */
export const worldSurfaceAt = (mask, { x = 0, z = 0, up = 1 } = {}, look, { cfg = LOOK.wet, hook = LOOK.rain.hookup.worldMask } = {}) => {
  const dry = { albedo: 1, roughness: null, metalness: null, damp: 0, film: 0, puddle: 0, road: false };
  if (!look || !look.wet) return dry;
  const m = maskAt(mask, x, z);
  const upW = smoothstep(hook.upFrom, hook.upFull, up);
  const share = m.road ? 1 - smoothstep(look.innerHalf, look.outerHalf, m.lineDist) : 0;
  const offFactorDamp = m.road ? 1 : hook.offRoadDamp;
  const offFactorFilm = m.road ? 1 : hook.offRoadFilm;
  const dO = sectorBlend(look.dampOff, m.sector);
  const fO = sectorBlend(look.filmOff, m.sector);
  const damp = upW * offFactorDamp * (dO + (sectorBlend(look.dampLine, m.sector) - dO) * share);
  const film = upW * offFactorFilm * (fO + (sectorBlend(look.filmLine, m.sector) - fO) * share);
  const puddle = m.road ? upW * sectorBlend(look.puddle, m.sector) * clamp(m.low, 0, 1) * (1 - share) : 0;
  const gloss = cfg.dampGloss * damp + (1 - cfg.dampGloss) * film;
  let roughness = cfg.roughnessDry + (cfg.roughnessWet - cfg.roughnessDry) * gloss;
  roughness += (cfg.puddleRoughness - roughness) * puddle;
  return {
    albedo: Math.max(0, 1 - cfg.darkenAtSaturation * damp - cfg.darkenFilm * film - cfg.puddleDarken * puddle),
    // On a GLB the material's own roughness is the dry one: the shader scales it by roughness / roughnessDry.
    roughness,
    metalness: cfg.metalnessDry + (cfg.metalnessWet - cfg.metalnessDry) * Math.max(film, puddle),
    damp,
    film,
    puddle,
    road: m.road,
    share,
  };
};

// ------------------------------------------------------------------ shader patch

const VERTEX_HEAD = /* glsl */ `
varying vec3 vOcWorld;
varying float vOcUp;
`;

const VERTEX_BODY = /* glsl */ `
vec4 ocWp = vec4(transformed, 1.0);
vec3 ocN = objectNormal;
#ifdef USE_INSTANCING
ocWp = instanceMatrix * ocWp;
ocN = mat3(instanceMatrix) * ocN;
#endif
vOcWorld = (modelMatrix * ocWp).xyz;
ocN = mat3(modelMatrix) * ocN;
vOcUp = dot(ocN, ocN) > 0.0 ? normalize(ocN).y : 1.0;
`;

const fragmentHead = (n) => /* glsl */ `
#define OCW_SECTORS ${n}
uniform sampler2D ocwMask;
uniform vec2 ocwMin;
uniform float ocwSpan;
uniform float ocwMaxD;
uniform float ocwDampLine[OCW_SECTORS];
uniform float ocwDampOff[OCW_SECTORS];
uniform float ocwFilmLine[OCW_SECTORS];
uniform float ocwFilmOff[OCW_SECTORS];
uniform float ocwPuddle[OCW_SECTORS];
uniform float ocwInnerHalf;
uniform float ocwOuterHalf;
uniform float ocwWetOn;
uniform float ocwDarkDamp;
uniform float ocwDarkFilm;
uniform float ocwDarkPuddle;
uniform float ocwRoughDry;
uniform float ocwRoughWet;
uniform float ocwDampGloss;
uniform float ocwPuddleRough;
uniform float ocwMetalDry;
uniform float ocwMetalWet;
uniform float ocwOffRoadDamp;
uniform float ocwOffRoadFilm;
uniform float ocwUpFrom;
uniform float ocwUpFull;
varying vec3 vOcWorld;
varying float vOcUp;
float ocwSector(float values[OCW_SECTORS], float x) {
  float result = values[0];
  for (int k = 1; k < OCW_SECTORS; k++) {
    result = mix(result, values[k], clamp(x - float(k - 1), 0.0, 1.0));
  }
  return result;
}
`;

const FRAGMENT_WET = /* glsl */ `
float ocwDamp = 0.0;
float ocwFilm = 0.0;
float ocwPud = 0.0;
if (ocwWetOn > 0.5) {
  vec2 ocwUv = (vOcWorld.xz - ocwMin) / ocwSpan;
  bool ocwIn = ocwUv.x >= 0.0 && ocwUv.x <= 1.0 && ocwUv.y >= 0.0 && ocwUv.y <= 1.0;
  vec4 ocwM = ocwIn ? texture2D(ocwMask, ocwUv) : vec4(1.0, 0.0, 0.0, 0.0);
  float ocwRoad = step(0.5, ocwM.a);
  float ocwSec = ocwM.g * float(OCW_SECTORS - 1);
  float ocwShare = ocwRoad * (1.0 - smoothstep(ocwInnerHalf, ocwOuterHalf, ocwM.r * ocwMaxD));
  float ocwUpW = smoothstep(ocwUpFrom, ocwUpFull, vOcUp);
  float ocwDO = ocwSector(ocwDampOff, ocwSec);
  float ocwFO = ocwSector(ocwFilmOff, ocwSec);
  ocwDamp = ocwUpW * mix(ocwOffRoadDamp, 1.0, ocwRoad) * (ocwDO + (ocwSector(ocwDampLine, ocwSec) - ocwDO) * ocwShare);
  ocwFilm = ocwUpW * mix(ocwOffRoadFilm, 1.0, ocwRoad) * (ocwFO + (ocwSector(ocwFilmLine, ocwSec) - ocwFO) * ocwShare);
  ocwPud = ocwUpW * ocwRoad * ocwSector(ocwPuddle, ocwSec) * clamp(ocwM.b, 0.0, 1.0) * (1.0 - ocwShare);
  diffuseColor.rgb *= max(0.0, 1.0 - ocwDarkDamp * ocwDamp - ocwDarkFilm * ocwFilm - ocwDarkPuddle * ocwPud);
}
`;

// The GLB's own roughness is its dry value: it is scaled as the procedural road's roughnessDry → wet.
const FRAGMENT_ROUGHNESS = /* glsl */ `
if (ocwWetOn > 0.5) {
  float ocwGloss = ocwDampGloss * ocwDamp + (1.0 - ocwDampGloss) * ocwFilm;
  float ocwScale = (ocwRoughDry + (ocwRoughWet - ocwRoughDry) * ocwGloss) / max(1e-4, ocwRoughDry);
  roughnessFactor = mix(roughnessFactor * ocwScale, ocwPuddleRough, ocwPud);
}
`;

const FRAGMENT_METALNESS = /* glsl */ `
if (ocwWetOn > 0.5) metalnessFactor = max(metalnessFactor, ocwMetalDry + (ocwMetalWet - ocwMetalDry) * max(ocwFilm, ocwPud));
`;

/** Inject the world-wet chunks into a three.js shader (`onBeforeCompile`'s argument). Exported for tests. */
export const patchWorldWetShader = (shader, uniforms, cfg = LOOK.wet) => {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
    .replace("#include <project_vertex>", `#include <project_vertex>\n${VERTEX_BODY}`);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${fragmentHead(cfg.sectors)}`)
    .replace("#include <map_fragment>", `#include <map_fragment>\n${FRAGMENT_WET}`)
    .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${FRAGMENT_ROUGHNESS}`)
    .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\n${FRAGMENT_METALNESS}`);
  return shader;
};

/** Uniform values for a look (plain numbers and arrays), as wetSurface wetUniformValues. */
export const worldWetValues = (look, cfg = LOOK.wet) => {
  const dry = !look || !look.wet;
  const zero = new Array(cfg.sectors).fill(0);
  return {
    ocwDampLine: dry ? zero : look.dampLine,
    ocwDampOff: dry ? zero : look.dampOff,
    ocwFilmLine: dry ? zero : look.filmLine,
    ocwFilmOff: dry ? zero : look.filmOff,
    ocwPuddle: dry ? zero : look.puddle,
    ocwInnerHalf: dry ? 1 : look.innerHalf,
    ocwOuterHalf: dry ? 2 : look.outerHalf,
    ocwWetOn: dry ? 0 : 1,
  };
};

/** The materials of a GLB scene the wet patch applies to: every standard (PBR) material once. */
export const wettableMaterialsOf = (root) => {
  const found = new Set();
  root.traverse((node) => {
    if (!node.isMesh) return;
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => {
      if (material && material.isMeshStandardMaterial) found.add(material);
    });
  });
  return [...found];
};

/**
 * The uniforms every patched material shares, made once: each compiled program keeps the objects it was
 * built with, so a new mask or look is written into them in place (the GLB cache shares materials between
 * loads, and a material is patched only once).
 */
let SHARED = null;
const sharedUniforms = (cfg, hook) => {
  if (SHARED) return SHARED;
  SHARED = {};
  Object.entries(worldWetValues(null, cfg)).forEach(([key, value]) => {
    SHARED[key] = { value: Array.isArray(value) ? value.slice() : value };
  });
  Object.assign(SHARED, {
    ocwMask: { value: null },
    ocwMin: { value: new THREE.Vector2() },
    ocwSpan: { value: 1 },
    ocwMaxD: { value: 1 },
    ocwDarkDamp: { value: cfg.darkenAtSaturation },
    ocwDarkFilm: { value: cfg.darkenFilm },
    ocwDarkPuddle: { value: cfg.puddleDarken },
    ocwRoughDry: { value: cfg.roughnessDry },
    ocwRoughWet: { value: cfg.roughnessWet },
    ocwDampGloss: { value: cfg.dampGloss },
    ocwPuddleRough: { value: cfg.puddleRoughness },
    ocwMetalDry: { value: cfg.metalnessDry },
    ocwMetalWet: { value: cfg.metalnessWet },
    ocwOffRoadDamp: { value: hook.offRoadDamp },
    ocwOffRoadFilm: { value: hook.offRoadFilm },
    ocwUpFrom: { value: hook.upFrom },
    ocwUpFull: { value: hook.upFull },
  });
  return SHARED;
};

/**
 * Patch the materials of a GLB circuit so they draw the engine's water through `mask` (worldMaskFor).
 * Returns `{uniforms, texture, update(look), dispose()}`; dispose turns the water off and frees the mask.
 */
export const enableWorldWet = (materials, mask, { cfg = LOOK.wet, hook = LOOK.rain.hookup.worldMask } = {}) => {
  const texture = new THREE.DataTexture(mask.data, mask.size, mask.size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const uniforms = sharedUniforms(cfg, hook);
  uniforms.ocwMask.value = texture;
  uniforms.ocwMin.value.set(mask.minX, mask.minZ);
  uniforms.ocwSpan.value = mask.span;
  uniforms.ocwMaxD.value = mask.maxLineDistM;
  uniforms.ocwWetOn.value = 0;
  materials.forEach((material) => {
    if (material.userData.ocWorldWet) return;
    material.userData.ocWorldWet = true;
    const previous = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      if (typeof previous === "function") previous(shader, renderer);
      patchWorldWetShader(shader, uniforms, cfg);
    };
    const previousKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => `${previousKey ? previousKey() : ""}|ocWorldWet${cfg.sectors}`;
    material.needsUpdate = true;
  });
  return {
    uniforms,
    texture,
    update: (look) => {
      Object.entries(worldWetValues(look, cfg)).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((v, k) => (uniforms[key].value[k] = v));
        else uniforms[key].value = value;
      });
    },
    dispose: () => {
      uniforms.ocwWetOn.value = 0;
      if (uniforms.ocwMask.value === texture) uniforms.ocwMask.value = null;
      texture.dispose();
    },
  };
};
