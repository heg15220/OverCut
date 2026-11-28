// VIEW-06 (F1M24-CHINA §2.8, LOOK-C3; RF-3D-04, RF-3D-03): dónde cae el norte geográfico en la escena de
// cada spline calibrada, para que el sol de three/sky.js entre por el lado real del circuito.
//
// Uso: node tools/assets/north_from_geo.mjs [--geo <f1-circuits.geojson>] [--write]
//
// Ajusta por Procrustes (giro + traslación, sin reflexión: las splines ya salen sin reflejar de
// align_spline.mjs) la vista cenital de la spline (x, −z de glTF, en metros) sobre el trazado real
// georreferenciado de bacinger/f1-circuits (MIT; este y norte en metros por proyección equirrectangular local),
// probando todas las correspondencias por longitud de arco en los dos sentidos. Con el giro θ que lleva el
// trazado real sobre la spline, el norte (0, 1) cae en la escena en (x, z) = (−sin θ, −cos θ); en la convención
// de sky.js (norte = (sin n, −cos n)) eso es n = −θ. El geoId de cada circuito sale de tools/assets/assets.config.json;
// si es null se prueba el id del mismo país y se acepta solo con un RMS bajo (maxRmsM).
// Con --write rellena data/balance/view-look.json sky.northDegByLayout.layouts (deg, source con el geoId y el RMS, status).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resampleLoop } from "./align_spline.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const manager = resolve(repo, "overcut/frontend/src/modules/overcutManager");
const argv = process.argv.slice(2);
const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const geoPath = flag("--geo") || resolve(process.env.OVERCUT_ROOT || repo, "tools/assets/.cache/geo/f1-circuits.geojson");
const N = 360;
// Por encima de este RMS el trazado real no es el de la spline (otro layout): no se escribe.
const maxRmsM = 40;

const centre = (pts) => {
  const c = pts.reduce((acc, p) => [acc[0] + p[0] / pts.length, acc[1] + p[1] / pts.length], [0, 0]);
  return pts.map((p) => [p[0] - c[0], p[1] - c[1]]);
};

/** Giro θ (radianes, antihorario) que lleva A sobre B, y el RMS del ajuste. */
const rotationFit = (A, B) => {
  let sxx = 0;
  let sxy = 0;
  let syx = 0;
  let syy = 0;
  let norm = 0;
  for (let i = 0; i < A.length; i += 1) {
    sxx += A[i][0] * B[i][0];
    sxy += A[i][0] * B[i][1];
    syx += A[i][1] * B[i][0];
    syy += A[i][1] * B[i][1];
    norm += A[i][0] ** 2 + A[i][1] ** 2 + B[i][0] ** 2 + B[i][1] ** 2;
  }
  const angle = Math.atan2(sxy - syx, sxx + syy);
  const fit = (sxx + syy) * Math.cos(angle) + (sxy - syx) * Math.sin(angle);
  return { angle, rms: Math.sqrt(Math.max(0, norm - 2 * fit) / A.length) };
};

export const northFit = (sceneXZ, lonlat) => {
  const lat0 = lonlat.reduce((sum, p) => sum + p[1], 0) / lonlat.length;
  const lon0 = lonlat.reduce((sum, p) => sum + p[0], 0) / lonlat.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const geo = lonlat.map(([lon, lat]) => [(lon - lon0) * 111320 * k, (lat - lat0) * 110540]);
  const A = centre(resampleLoop(geo, N).points);
  const B0 = centre(resampleLoop(sceneXZ.map(([x, z]) => [x, -z]), N).points);
  let best = null;
  for (const direction of [1, -1]) {
    for (let s = 0; s < N; s += 1) {
      const B = A.map((_, i) => B0[(((s + direction * i) % N) + N) % N]);
      const fit = rotationFit(A, B);
      if (!best || fit.rms < best.rms) best = fit;
    }
  }
  const deg = (-best.angle * 180) / Math.PI;
  return { deg: Math.round((((deg + 540) % 360) - 180) * 10) / 10, rmsM: Math.round(best.rms * 10) / 10 };
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (!existsSync(geoPath)) throw new Error(`falta ${geoPath}`);
  const geo = JSON.parse(readFileSync(geoPath, "utf8"));
  const config = JSON.parse(readFileSync(resolve(here, "assets.config.json"), "utf8"));
  const splines = JSON.parse(readFileSync(resolve(manager, "data/splines.json"), "utf8")).splines;
  const out = {};
  for (const item of config.circuits || []) {
    const id = item.splineId || item.id;
    const spline = splines[id];
    if (!spline) continue;
    const xz = [];
    for (let i = 0; i < spline.points.length; i += 2) xz.push([spline.points[i] / 10, spline.points[i + 1] / 10]);
    const country = id.split("-")[0];
    const candidates = item.geoId ? [item.geoId] : geo.features.map((f) => f.properties.id).filter((gid) => {
      const feature = geo.features.find((f) => f.properties.id === gid);
      return feature && (feature.properties.Name || "").toLowerCase().includes(country.slice(0, 5));
    });
    let best = null;
    for (const gid of candidates) {
      const feature = geo.features.find((f) => f.properties.id === gid);
      if (!feature) continue;
      const fit = { geoId: gid, ...northFit(xz, feature.geometry.coordinates) };
      if (!best || fit.rmsM < best.rmsM) best = fit;
    }
    console.log(`[north] ${id}: ${best ? `${best.deg}° (rms ${best.rmsM} m, ${best.geoId})` : "sin trazado real"}`);
    if (best && best.rmsM <= maxRmsM) out[id] = { deg: best.deg, source: `bacinger/f1-circuits ${best.geoId}, Procrustes rms ${best.rmsM} m`, status: "sourced" };
  }
  if (argv.includes("--write")) {
    const file = resolve(manager, "data/balance/view-look.json");
    const look = JSON.parse(readFileSync(file, "utf8"));
    look.sky.northDegByLayout.layouts = out;
    writeFileSync(file, `${JSON.stringify(look, null, 2)}\n`);
    console.log(`[north] ${Object.keys(out).length} trazados escritos en view-look.json`);
  }
}
