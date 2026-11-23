// Fija el sentido de giro y la línea de meta de una spline extraída (RF-3D-03).
//
// Uso: node align_spline.mjs <spline.raw.json> <salida.json> <layoutRef> <año>
//
// `extract_spline.py` saca el bucle del GP de la malla, pero no sabe en qué sentido se corre ni dónde está la
// meta. El boceto del circuito (`engine/layouts.js`, convertido en metros por `trackGeometry.buildCircuit`) sí
// lo sabe: su punto 0 es la línea de meta y su orden es el de la carrera. Se ajusta el boceto sobre la spline
// por Procrustes (giro + traslación, con o sin reflexión, ambos en metros) probando todas las
// correspondencias por longitud de arco en los dos sentidos, y la mejor dice el sentido y el punto de la
// spline que corresponde a la meta. El RMS del ajuste se guarda: el boceto es de memoria, así que unas
// decenas de metros son normales; más de ~150 m indicaría que el ciclo elegido no es el del GP.
import { readFileSync, writeFileSync } from "node:fs";
// El motor importa sin extensión y lee JSON como el bundler de CRA: engine_loader.mjs lo resuelve.
import "./engine_loader.mjs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const engine = resolve(here, "../../overcut/frontend/src/modules/overcutManager/engine");
const { layoutFor } = await import(pathToFileURL(resolve(engine, "layouts.js")).href);
const { buildCircuit } = await import(pathToFileURL(resolve(engine, "trackGeometry.js")).href);

const N = 360;

/** Remuestrea un bucle cerrado [[x, y], ...] a n puntos equiespaciados por longitud de arco. */
export const resampleLoop = (pts, n = N) => {
  const s = [0];
  for (let i = 1; i <= pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i % pts.length];
    s.push(s[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = s[s.length - 1];
  const out = [];
  let j = 0;
  for (let k = 0; k < n; k += 1) {
    const target = (k / n) * total;
    while (s[j + 1] < target) j += 1;
    const t = (target - s[j]) / (s[j + 1] - s[j] || 1);
    const a = pts[j];
    const b = pts[(j + 1) % pts.length];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return { points: out, total };
};

const centre = (pts) => {
  const c = pts.reduce((acc, p) => [acc[0] + p[0] / pts.length, acc[1] + p[1] / pts.length], [0, 0]);
  return { c, pts: pts.map((p) => [p[0] - c[0], p[1] - c[1]]) };
};

/** Mejor giro (con reflexión opcional de A) que lleva A sobre B; devuelve el RMS. */
const procrustes = (A, B, reflect) => {
  let sxx = 0;
  let sxy = 0;
  let syx = 0;
  let syy = 0;
  let norm = 0;
  for (let i = 0; i < A.length; i += 1) {
    const ax = reflect ? -A[i][0] : A[i][0];
    const ay = A[i][1];
    sxx += ax * B[i][0];
    sxy += ax * B[i][1];
    syx += ay * B[i][0];
    syy += ay * B[i][1];
    norm += ax * ax + ay * ay + B[i][0] ** 2 + B[i][1] ** 2;
  }
  const angle = Math.atan2(sxy - syx, sxx + syy);
  const fit = (sxx + syy) * Math.cos(angle) + (sxy - syx) * Math.sin(angle);
  return { angle, rms: Math.sqrt(Math.max(0, norm - 2 * fit) / A.length) };
};

export const align = (splineXY, sketchXY) => {
  const B0 = centre(resampleLoop(splineXY).points).pts;
  const A = centre(resampleLoop(sketchXY).points).pts;
  let best = null;
  for (const direction of [1, -1]) {
    for (const reflect of [false, true]) {
      for (let k = 0; k < N; k += 1) {
        const B = A.map((_, i) => B0[(((k + direction * i) % N) + N) % N]);
        const { rms, angle } = procrustes(A, B, reflect);
        if (!best || rms < best.rms) best = { rms, angle, direction, reflect, k };
      }
    }
  }
  // El boceto colocado sobre la spline, para la vista de revisión.
  const cB = centre(resampleLoop(splineXY).points).c;
  const cos = Math.cos(best.angle);
  const sin = Math.sin(best.angle);
  best.fitted = A.map(([x, y]) => {
    const ax = best.reflect ? -x : x;
    return [cos * ax - sin * y + cB[0], sin * ax + cos * y + cB[1]];
  });
  return best;
};

/**
 * ¿Está reflejado el modelo? Ajusta la spline (vista cenital: x, -z de glTF) sobre el trazado real
 * georreferenciado (bacinger/f1-circuits, MIT; este, norte en metros) con y sin reflexión. Los modelos
 * extraídos de juegos con ejes de mano izquierda suelen venir reflejados.
 */
export const geoCheck = (xy, lonlat) => {
  const lat0 = lonlat.reduce((sum, p) => sum + p[1], 0) / lonlat.length;
  const lon0 = lonlat.reduce((sum, p) => sum + p[0], 0) / lonlat.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const geo = lonlat.map(([lon, lat]) => [(lon - lon0) * 111320 * k, (lat - lat0) * 110540]);
  const top = xy.map(([x, z]) => [x, -z]);
  const B0 = centre(resampleLoop(top).points).pts;
  const A = centre(resampleLoop(geo).points).pts;
  const best = { false: Infinity, true: Infinity };
  // Sentido de recorrido de la spline respecto al orden de puntos del trazado real (1 = el mismo).
  const order = { false: 1, true: 1 };
  for (const direction of [1, -1]) {
    for (const reflect of [false, true]) {
      for (let s = 0; s < N; s += 2) {
        const B = A.map((_, i) => B0[(((s + direction * i) % N) + N) % N]);
        const { rms } = procrustes(A, B, reflect);
        if (rms < best[reflect]) {
          best[reflect] = rms;
          order[reflect] = direction;
        }
      }
    }
  }
  const mirrored = best.true < 0.6 * best.false;
  return { rmsAsIs: Math.round(best.false), rmsMirrored: Math.round(best.true), mirrored, orderAsGeo: order[mirrored] === 1 };
};

/** ¿Se cruza la línea consigo misma en planta? (trazados en ocho como Suzuka). */
export const selfCrossing = (xy) => {
  const p = resampleLoop(xy, 360).points;
  const n = p.length;
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < n; i += 1) {
    const a = p[i];
    const b = p[(i + 1) % n];
    for (let j = i + 2; j < n; j += 1) {
      if ((j + 1) % n === i) continue;
      const c = p[j];
      const d = p[(j + 1) % n];
      if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return true;
    }
  }
  return false;
};

/** Signo del área en el plano (x, -z) de glTF visto desde arriba: < 0 es sentido horario. */
export const signedArea = (xy) => {
  let area = 0;
  xy.forEach(([x, z], i) => {
    const [x2, z2] = xy[(i + 1) % xy.length];
    area += x * -z2 - x2 * -z;
  });
  return area / 2;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  // Uso: node align_spline.mjs <raw.json> <salida.json> <layoutRef> <año> <CLOCKWISE|ANTI_CLOCKWISE>
  //   [--geo <f1-circuits.geojson> --geo-id <id>] [--start-shift <metros>] [--force-mirror true|false]
  //   [--direction-by geo|area]  (por defecto: area; geo si la spline se cruza en planta y hay trazado real)
  const argv = process.argv.slice(2);
  const [source, target, ref, yearText, direction] = argv;
  const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
  const raw = JSON.parse(readFileSync(source, "utf8"));
  const n = raw.points.length;
  // Reflejado: lo decide el trazado real si lo hay (o la revisión manual con --force-mirror).
  let geo = null;
  if (flag("--geo") && flag("--geo-id")) {
    const collection = JSON.parse(readFileSync(flag("--geo"), "utf8"));
    const feature = collection.features.find((f) => f.properties.id === flag("--geo-id"));
    if (feature) geo = { id: feature.properties.id, ...geoCheck(raw.points.map(([x, , z]) => [x, z]), feature.geometry.coordinates) };
  }
  const forced = flag("--force-mirror");
  const mirrored = forced !== null ? forced === "true" : Boolean(geo?.mirrored);
  if (mirrored) {
    raw.points = raw.points.map(([x, y, z]) => [-x, y, z]);
    if (raw.offsets) raw.offsets = raw.offsets.map((o) => (o === null ? null : -o));
  }
  const xy = raw.points.map(([x, , z]) => [x, z]);
  const layout = layoutFor(ref, Number(yearText));
  // Sentido: el de f1db. No depende de cómo esté girado el modelo, solo de que no esté reflejado.
  // En un trazado en ocho el área con signo no dice nada (los dos lóbulos giran al revés): manda el orden
  // del trazado real (bacinger/f1-circuits va en el sentido de la carrera), o --direction-by geo|area.
  const figureEight = selfCrossing(xy);
  const directionBy = flag("--direction-by") || (figureEight && geo ? "geo" : "area");
  if (directionBy === "geo" && !geo) throw new Error("--direction-by geo necesita --geo y --geo-id");
  const clockwise = signedArea(xy) < 0;
  const reverse = directionBy === "geo" ? !geo.orderAsGeo : direction ? (direction === "CLOCKWISE") !== clockwise : false;
  // Meta: mitad de la recta de boxes si la malla la delata; si no, la del boceto ajustado.
  let startIndex;
  let startSource;
  let sketchFit = null;
  if (layout) {
    const sketch = buildCircuit(layout, Number(yearText)).points.map((p) => [p.x, p.y]);
    sketchFit = align(xy, sketch);
  }
  const near = flag("--start-near");
  if (near) {
    // Revisión manual: la meta en el punto de la spline más cercano a (x, z) glTF.
    const [nx, nz] = near.split(",").map(Number);
    startIndex = xy.reduce((best, [x, z], i) => ((x - nx) ** 2 + (z - nz) ** 2 < (xy[best][0] - nx) ** 2 + (xy[best][1] - nz) ** 2 ? i : best), 0);
    startSource = "manual";
  } else if (raw.pitLane) {
    startIndex = raw.pitLane.mid;
    startSource = raw.pitLane.source;
  } else if (sketchFit) {
    startIndex = Math.round((sketchFit.k / N) * n) % n;
    startSource = "sketch";
  } else {
    startIndex = 0;
    startSource = "none";
  }
  const shift = Number(flag("--start-shift") || 0);
  let order = [...Array(n).keys()].map((i) => (startIndex + i) % n);
  if (reverse) order = [startIndex, ...[...Array(n - 1).keys()].map((i) => (startIndex - 1 - i + n) % n)];
  // Revisión manual: desplaza la meta tantos metros en el sentido de la carrera (paso de 2 m).
  const steps = Math.round(shift / (raw.stepM || 2));
  order = order.map((_, i) => order[(((i + steps) % n) + n) % n]);
  const pick = (list) => (list ? order.map((i) => list[i]) : list);
  const result = {
    ...raw,
    points: pick(raw.points),
    widths: pick(raw.widths),
    offsets: pick(raw.offsets),
    layoutRef: ref,
    direction: direction || null,
    directionBy,
    figureEight,
    mirroredFromSource: mirrored,
    geoCheck: geo,
    start: {
      source: shift ? `${startSource}+manual` : startSource,
      shiftM: shift,
      // pit-lane y pit-complex ponen la meta en la mitad de la recta de boxes: es aproximada (±150 m).
      confidence: shift || near || argv.includes("--start-reviewed") ? "reviewed" : startSource === "pit-lane" ? "medium" : startSource === "pit-complex" ? "low" : "very-low",
    },
    alignment: sketchFit
      ? {
          method: "Procrustes del boceto (layouts.js) sobre la spline; solo informativo salvo sin pista de boxes",
          rmsM: Math.round(sketchFit.rms * 10) / 10,
          reflected: sketchFit.reflect,
          sketchFitted: sketchFit.fitted.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]),
        }
      : null,
  };
  writeFileSync(target, `${JSON.stringify(result)}
`);
  console.log(`[align] ${ref}: ${mirrored ? "REFLEJADO, " : ""}geo ${geo ? `${geo.rmsAsIs}/${geo.rmsMirrored} m` : "-"}, ${reverse ? "invertida" : "sentido original"} (${direction || "?"}${directionBy === "geo" ? ", por el orden del trazado real" : ""}${figureEight ? ", en ocho" : ""}), meta por ${startSource}, boceto rms ${sketchFit ? Math.round(sketchFit.rms) : "-"} m`);
}
