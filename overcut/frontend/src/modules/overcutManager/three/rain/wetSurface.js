/**
 * Wet asphalt with a continuous wetness and a drier racing line (GS-10 modules, LOOK-C2; RF-SIM-11,
 * RF-3D-04, RNF-05, RNF-07). F1M24-CHINA §2.9: "primero se oscurece fuera de la trazada, al final la
 * línea; la trazada seca es una franja más clara de ~2 m que se ensancha con las vueltas".
 *
 * The view never computes water: it reads the engine's `snapshot.weather` (SIM-C1 contract, §1.5)
 *   { state, rainRate (mm/h), waterMm: { line, off, sectors[] } }
 * and turns it into material parameters. Two layers per point of the road:
 *   damp = 1 − exp(−h / saturationMm)        the surface darkens as soon as it is wet;
 *   film = min(1, h / filmFullMm)            a film fills the macrotexture: darker and glossier;
 *   albedo × (1 − darkenAtSaturation·damp − darkenFilm·film − puddleDarken·puddle)
 *   roughness = dry + (wet − dry)·(dampGloss·damp + (1 − dampGloss)·film), → puddleRoughness in a puddle.
 * Across the road the racing line (its lateral, pose.lineOffset of the engine) takes the line's water
 * and the rest the off-line water; the dry band is lineDryWidthM wide and widens to lineWidenToM as the
 * line dries ahead of the rest (1 − line/off), with a soft edge of featherM.
 *
 * `surfaceAt` is the CPU reference of the shader patch (`enableWetSurface`), same formula, so what is
 * tested is what is drawn. Values in data/balance/view-look.json wet. Not wired to Race3D.js until
 * LOOK-C4: trackScene.js exposes `setWater(snapshot.weather)` and `setRacingLine(lateralAt)`, and its old
 * `setWet(bool)` keeps working untouched until then.
 */

import LOOK from "../../data/balance/view-look.json";
import WEATHER from "../../data/balance/race-weather.json";
import { seedFor, valueNoise1 } from "./seeded";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a || 1e-9), 0, 1);
  return t * t * (3 - 2 * t);
};
const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

/** The racing line's half width on the engine side (race-weather.json offLine), for the agreement check. */
export const ENGINE_LINE = Object.freeze({ halfWidthM: WEATHER.offLine.lineHalfWidthM, fullAtM: WEATHER.offLine.fullAtM });

/** Damp share (0..1) of a water depth in model mm. */
export const dampOf = (h, cfg = LOOK.wet) => (h > 0 ? 1 - Math.exp(-h / cfg.saturationMm) : 0);

/** Film share (0..1) of a water depth in model mm. */
export const filmOf = (h, cfg = LOOK.wet) => (h > 0 ? clamp(h / cfg.filmFullMm, 0, 1) : 0);

/** Puddle share (0..1) of the off-line water: none below puddleFromMm, full at puddleFullMm. */
export const puddleOf = (h, cfg = LOOK.wet) => (h > cfg.puddleFromMm ? smoothstep(cfg.puddleFromMm, cfg.puddleFullMm, h) : 0);

/**
 * Material parameters for the engine's weather snapshot. Missing or dry → everything 0 (the dry look).
 * Per timing sector (cfg.sectors): the line water is the sector's; the off-line water is `offSectors[k]`
 * when the engine publishes it, else the lap's ratio off/line in that sector (SIM-C1 publishes one figure).
 */
export const wetLookFor = (weather, cfg = LOOK.wet) => {
  const n = cfg.sectors;
  const water = weather && weather.waterMm;
  const line = Math.max(0, finite(water && water.line));
  const off = Math.max(line, finite(water && water.off, line));
  const raw = water && Array.isArray(water.sectors) && water.sectors.length ? water.sectors : null;
  const lineBySector = [];
  const offBySector = [];
  for (let k = 0; k < n; k += 1) {
    const sector = raw ? Math.max(0, finite(raw[Math.min(k, raw.length - 1)], line)) : line;
    lineBySector.push(sector);
    const own = water && Array.isArray(water.offSectors) && water.offSectors.length ? finite(water.offSectors[Math.min(k, water.offSectors.length - 1)], NaN) : NaN;
    offBySector.push(Number.isFinite(own) ? Math.max(sector, own) : line > 0 ? Math.max(sector, (sector * off) / line) : Math.max(sector, off));
  }
  const dryShare = off > 0 ? clamp(1 - line / off, 0, 1) : 0;
  const innerHalf = cfg.lineDryWidthM / 2 + (cfg.lineWidenToM / 2 - cfg.lineDryWidthM / 2) * dryShare;
  return {
    wet: off > 0,
    lineMm: line,
    offMm: off,
    dampLine: lineBySector.map((h) => dampOf(h, cfg)),
    dampOff: offBySector.map((h) => dampOf(h, cfg)),
    filmLine: lineBySector.map((h) => filmOf(h, cfg)),
    filmOff: offBySector.map((h) => filmOf(h, cfg)),
    puddle: offBySector.map((h) => puddleOf(h, cfg)),
    innerHalf,
    outerHalf: innerHalf + cfg.featherM,
  };
};

/** Share of the racing line's water at a lateral `lat` (m) with the line at `lineLat` (m). */
export const lineShareAt = (lat, lineLat, look) => 1 - smoothstep(look.innerHalf, look.outerHalf, Math.abs(lat - lineLat));

/** Blend of a per-sector array at a fractional sector coordinate (0 … n − 1), like the shader's weights. */
export const sectorBlend = (values, s) => {
  const n = values.length;
  const x = clamp(s, 0, n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  if (n === 1) return values[0];
  const t = x - i;
  return values[i] * (1 - t) + values[i + 1] * t;
};

/**
 * The surface at a point of the road: `{lat, lineLat, sector, low}` (low = puddle-prone share of that
 * point, from `puddleField`). Returns the albedo multiplier, roughness, metalness and the layers.
 */
export const surfaceAt = ({ lat = 0, lineLat = 0, sector = 0, low = 0 } = {}, look, cfg = LOOK.wet) => {
  if (!look || !look.wet) return { albedo: 1, roughness: cfg.roughnessDry, metalness: cfg.metalnessDry, damp: 0, film: 0, puddle: 0 };
  const share = lineShareAt(lat, lineLat, look);
  const damp = sectorBlend(look.dampOff, sector) + (sectorBlend(look.dampLine, sector) - sectorBlend(look.dampOff, sector)) * share;
  const film = sectorBlend(look.filmOff, sector) + (sectorBlend(look.filmLine, sector) - sectorBlend(look.filmOff, sector)) * share;
  const puddle = sectorBlend(look.puddle, sector) * clamp(low, 0, 1) * (1 - share);
  const gloss = cfg.dampGloss * damp + (1 - cfg.dampGloss) * film;
  let roughness = cfg.roughnessDry + (cfg.roughnessWet - cfg.roughnessDry) * gloss;
  roughness += (cfg.puddleRoughness - roughness) * puddle;
  return {
    albedo: Math.max(0, 1 - cfg.darkenAtSaturation * damp - cfg.darkenFilm * film - cfg.puddleDarken * puddle),
    roughness,
    metalness: cfg.metalnessDry + (cfg.metalnessWet - cfg.metalnessDry) * Math.max(film, puddle),
    damp,
    film,
    puddle,
  };
};

/**
 * Peak of the GGX specular lobe (n·h = 1) for a perceptual roughness (α = roughness², the convention of
 * three.js MeshStandardMaterial): D = 1 / (π α²). The VIEW-07 acceptance (specular +10 %) compares it.
 */
export const specularPeakOf = (roughness) => {
  const a = Math.max(0.0001, roughness * roughness);
  return 1 / (Math.PI * a * a);
};

/**
 * Puddle-prone share of each point of the lap for the two edges, `{left: Float32Array, right}` (0..1).
 * With an elevation profile (`circuit.elevation`, metres per point; none of the splines has one yet) the
 * low spots are the local depressions; without one, water runs off the crown to both edges and gathers in
 * seeded patches every puddleCellM (seedOf of the circuit, never an unseeded random). `puddleCover` is the share
 * of the edge that can hold a puddle.
 */
export const puddleField = (circuit, { seed = null, cfg = LOOK.wet } = {}) => {
  const n = circuit.points.length;
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  const dist = circuit.dist || null;
  const length = circuit.length || 1;
  const base = seed ?? seedFor("puddles", circuit.ref || circuit.id || "track");
  const elevation = Array.isArray(circuit.elevation) && circuit.elevation.length === n ? circuit.elevation : null;
  const patch = (s, side) => {
    const x = s / cfg.puddleCellM;
    const v = valueNoise1((base ^ (side * 0x9e3779b9)) >>> 0, x);
    return smoothstep(1 - cfg.puddleCover, 1 - cfg.puddleCover * 0.4, v);
  };
  const span = Math.max(1, Math.round(n / Math.max(1, length / (cfg.puddleCellM * 2))));
  for (let i = 0; i < n; i += 1) {
    const s = dist ? dist[i] : (i / n) * length;
    let low = 1;
    if (elevation) {
      let sum = 0;
      for (let k = -span; k <= span; k += 1) sum += elevation[(i + k + n) % n];
      const mean = sum / (2 * span + 1);
      low = smoothstep(0, 0.25, mean - elevation[i]);
    }
    left[i] = low * patch(s, 1);
    right[i] = low * patch(s, 2);
  }
  return { left, right };
};

/** Fractional timing sector (0 … n − 1) of a distance share, for the boundaries `circuit.sectors` (shares). */
export const sectorCoordOf = (share, sectors = [0, 1 / 3, 2 / 3]) => {
  const n = sectors.length;
  let k = n - 1;
  while (k > 0 && share < sectors[k]) k -= 1;
  return k;
};

/**
 * Per-vertex attributes for the asphalt ribbon built by geometry.js `ribbon(points, headings, −half, +half)`:
 * two vertices per point (left, right), plus the closing row when `closed`. aOcLat (m across), aOcLine (racing
 * line lateral, 0 until `setRacingLine`), aOcSector (timing sector), aOcLowL / aOcLowR (puddle share of the
 * edges). Returns plain Float32Arrays so the tests need no WebGL.
 */
export const wetAttributes = (circuit, { half, closed = true, seed = null, cfg = LOOK.wet } = {}) => {
  const n = circuit.points.length;
  const rows = closed ? n + 1 : n;
  const lat = new Float32Array(rows * 2);
  const line = new Float32Array(rows * 2);
  const sector = new Float32Array(rows * 2);
  const lowL = new Float32Array(rows * 2);
  const lowR = new Float32Array(rows * 2);
  const field = puddleField(circuit, { seed, cfg });
  const dist = circuit.dist || null;
  const length = circuit.length || 1;
  const sectors = Array.isArray(circuit.sectors) && circuit.sectors.length ? circuit.sectors.slice(0, cfg.sectors) : [0, 1 / 3, 2 / 3];
  for (let r = 0; r < rows; r += 1) {
    const i = r % n;
    const share = dist ? dist[i] / length : i / n;
    const k = sectorCoordOf(share, sectors);
    for (let side = 0; side < 2; side += 1) {
      const v = r * 2 + side;
      lat[v] = side === 0 ? -half : half;
      sector[v] = k;
      lowL[v] = field.left[i];
      lowR[v] = field.right[i];
    }
  }
  return { aOcLat: lat, aOcLine: line, aOcSector: sector, aOcLowL: lowL, aOcLowR: lowR };
};

/** Fill the racing line attribute from `lateralAt(i)` (m, + = right of travel, the engine's sign). */
export const fillRacingLine = (lineArray, n, lateralAt, closed = true) => {
  const rows = closed ? n + 1 : n;
  for (let r = 0; r < rows; r += 1) {
    const value = finite(lateralAt(r % n), 0);
    lineArray[r * 2] = value;
    lineArray[r * 2 + 1] = value;
  }
  return lineArray;
};

// ------------------------------------------------------------------ shader patch

/** Uniform values (plain numbers and arrays) for a look; `enableWetSurface` copies them into the shader. */
export const wetUniformValues = (look, cfg = LOOK.wet) => {
  const dry = !look || !look.wet;
  const zero = new Array(cfg.sectors).fill(0);
  return {
    ocDampLine: dry ? zero : look.dampLine,
    ocDampOff: dry ? zero : look.dampOff,
    ocFilmLine: dry ? zero : look.filmLine,
    ocFilmOff: dry ? zero : look.filmOff,
    ocPuddle: dry ? zero : look.puddle,
    ocInnerHalf: dry ? 1 : look.innerHalf,
    ocOuterHalf: dry ? 2 : look.outerHalf,
    ocWetOn: dry ? 0 : 1,
  };
};

const VERTEX_HEAD = /* glsl */ `
attribute float aOcLat;
attribute float aOcLine;
attribute float aOcSector;
attribute float aOcLowL;
attribute float aOcLowR;
varying float vOcLat;
varying float vOcLine;
varying float vOcSector;
varying float vOcLowL;
varying float vOcLowR;
`;

const VERTEX_BODY = /* glsl */ `
vOcLat = aOcLat;
vOcLine = aOcLine;
vOcSector = aOcSector;
vOcLowL = aOcLowL;
vOcLowR = aOcLowR;
`;

const fragmentHead = (n) => /* glsl */ `
#define OC_SECTORS ${n}
uniform float ocDampLine[OC_SECTORS];
uniform float ocDampOff[OC_SECTORS];
uniform float ocFilmLine[OC_SECTORS];
uniform float ocFilmOff[OC_SECTORS];
uniform float ocPuddle[OC_SECTORS];
uniform float ocInnerHalf;
uniform float ocOuterHalf;
uniform float ocWetOn;
uniform float ocDarkDamp;
uniform float ocDarkFilm;
uniform float ocDarkPuddle;
uniform float ocRoughDry;
uniform float ocRoughWet;
uniform float ocDampGloss;
uniform float ocPuddleRough;
uniform float ocMetalDry;
uniform float ocMetalWet;
varying float vOcLat;
varying float vOcLine;
varying float vOcSector;
varying float vOcLowL;
varying float vOcLowR;
float ocSector(float values[OC_SECTORS]) {
  float x = clamp(vOcSector, 0.0, float(OC_SECTORS - 1));
  float result = values[0];
  for (int k = 1; k < OC_SECTORS; k++) {
    result = mix(result, values[k], clamp(x - float(k - 1), 0.0, 1.0));
  }
  return result;
}
`;

// Computed once after the albedo map; used by the roughness and metalness chunks below.
const FRAGMENT_WET = /* glsl */ `
float ocShare = 1.0 - smoothstep(ocInnerHalf, ocOuterHalf, abs(vOcLat - vOcLine));
float ocDampO = ocSector(ocDampOff);
float ocFilmO = ocSector(ocFilmOff);
float ocDamp = ocWetOn * (ocDampO + (ocSector(ocDampLine) - ocDampO) * ocShare);
float ocFilm = ocWetOn * (ocFilmO + (ocSector(ocFilmLine) - ocFilmO) * ocShare);
float ocLow = vOcLat < 0.0 ? vOcLowL : vOcLowR;
float ocPud = ocWetOn * ocSector(ocPuddle) * clamp(ocLow, 0.0, 1.0) * (1.0 - ocShare);
diffuseColor.rgb *= max(0.0, 1.0 - ocDarkDamp * ocDamp - ocDarkFilm * ocFilm - ocDarkPuddle * ocPud);
`;

const FRAGMENT_ROUGHNESS = /* glsl */ `
if (ocWetOn > 0.5) {
  float ocGloss = ocDampGloss * ocDamp + (1.0 - ocDampGloss) * ocFilm;
  roughnessFactor = ocRoughDry + (ocRoughWet - ocRoughDry) * ocGloss;
  roughnessFactor = mix(roughnessFactor, ocPuddleRough, ocPud);
}
`;

const FRAGMENT_METALNESS = /* glsl */ `
if (ocWetOn > 0.5) metalnessFactor = ocMetalDry + (ocMetalWet - ocMetalDry) * max(ocFilm, ocPud);
`;

/** Inject the wet-surface chunks into a three.js shader (the `onBeforeCompile` argument). Exported for tests. */
export const patchWetShader = (shader, uniforms, cfg = LOOK.wet) => {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
    .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${fragmentHead(cfg.sectors)}`)
    .replace("#include <map_fragment>", `#include <map_fragment>\n${FRAGMENT_WET}`)
    .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${FRAGMENT_ROUGHNESS}`)
    .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\n${FRAGMENT_METALNESS}`);
  return shader;
};

/**
 * Patch a MeshStandardMaterial once so it draws the wet surface; returns `{uniforms, update(look)}`.
 * The material's own roughness, metalness and colour stay for the dry look (ocWetOn = 0). Lazy: a track
 * that never gets water keeps its original shader (nothing changes in the dry live view).
 */
export const enableWetSurface = (material, cfg = LOOK.wet) => {
  if (material.userData.ocWet) return material.userData.ocWet;
  const values = wetUniformValues(null, cfg);
  const uniforms = {};
  Object.entries(values).forEach(([key, value]) => {
    uniforms[key] = { value: Array.isArray(value) ? value.slice() : value };
  });
  Object.assign(uniforms, {
    ocDarkDamp: { value: cfg.darkenAtSaturation },
    ocDarkFilm: { value: cfg.darkenFilm },
    ocDarkPuddle: { value: cfg.puddleDarken },
    ocRoughDry: { value: cfg.roughnessDry },
    ocRoughWet: { value: cfg.roughnessWet },
    ocDampGloss: { value: cfg.dampGloss },
    ocPuddleRough: { value: cfg.puddleRoughness },
    ocMetalDry: { value: cfg.metalnessDry },
    ocMetalWet: { value: cfg.metalnessWet },
  });
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (typeof previous === "function") previous(shader, renderer);
    patchWetShader(shader, uniforms, cfg);
  };
  const previousKey = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `${previousKey ? previousKey() : ""}|ocWet${cfg.sectors}`;
  material.needsUpdate = true;
  const handle = {
    uniforms,
    update: (look) => {
      const next = wetUniformValues(look, cfg);
      Object.entries(next).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((v, k) => (uniforms[key].value[k] = v));
        else uniforms[key].value = value;
      });
      return handle;
    },
  };
  material.userData.ocWet = handle;
  return handle;
};

