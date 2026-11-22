// Datos de pista de un circuito calibrado (docs/manager/SIM-FISICA.md §3.1 y §3.8, WP1; RF-3D-03, criterio 7.2).
//
// Uso: node racing_line.mjs <splineId> --spline <id>.json --widths <id>.widths.json [--pit <id>.pitlane.json]
//                           --out <id>.track.json [--preview <carpeta>]
//
// Entradas: la spline alineada (cada 2 m desde la meta en el sentido de carrera), las distancias a los bordes que
// mide `blender/extract_spline.py --widths` y la calle de boxes de `blender/extract_pitlane.py`. Parámetros en
// `assets.config.json` `trackData` (y `circuits[].review.track` por circuito): nada de números en el código.
//
// 1. Anchura. Por lado, distancia a las líneas pintadas (límites de pista) si cubren la vuelta y, si no, al borde
//    del asfalto. Se descartan las medidas fuera de [lowRatio, highRatio] x su mediana móvil (cruces, entradas
//    de boxes, líneas transversales de meta o parrilla) y las menores que minHalfM; el hueco se rellena con esa
//    mediana, con un tope de globalRatio x la mediana de la vuelta. Después, mínimo y media móviles en ±smoothM (bordes sin dientes).
// 2. Puntos del motor. Los mismos que lee engine/trackGeometry.js buildCircuitFromPath (cada 6 m, en dm, con su
//    suavizado, replicado en enginePoints), para que el índice i de wl/wr/line/kappa sea circuit.points[i]. La anchura se corrige por lo que
//    el suavizado mueve cada punto en lateral.
// 3. Trazada de curvatura mínima (engine/racingLineSolver.js, el mismo código que usa el motor en los circuitos
//    procedurales) dentro de [-wl + margen, wr - margen], margen = media anchura del coche + holgura.
// 4. Curvatura con signo de la trazada (círculo por las muestras a ±curvatureSpan).
// 5. Marcas del pit lane, en fracción de la longitud de la calle (como boxFrom/boxTo): entryLine (la calle cruza
//    la línea blanca al salir de la pista), limitFrom / limitTo (líneas del limitador: tramo paralelo a la
//    pista que contiene los garajes, con al menos minLeadM / minTrailM de margen) y exitBlend (vuelve a la pista).
//    El modelo no tiene las líneas del limitador pintadas: es geometría, a revisar (marksSource: "geometry").
// 6. Vistas de revisión (.cache/preview): <id>.track.png (vuelta entera), <id>.track-zoom.png (las cuatro
//    curvas más cerradas y los dos tramos más anchos) y <id>.track-pit.png (calle de boxes y marcas), sobre la vista cenital de la malla.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const engine = resolve(here, "../../overcut/frontend/src/modules/overcutManager/engine");
const { minCurvatureLine, lineCurvature, normalsOf } = await import(pathToFileURL(resolve(engine, "racingLineSolver.js")).href);

const CONFIG = JSON.parse(readFileSync(resolve(here, "assets.config.json"), "utf8"));

// ------------------------------------------------------------------ utilidades

const median = (values) => {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const wrap = (i, n) => ((i % n) + n) % n;
const rollingMedian = (values, half) => values.map((_, i) => {
  const window = [];
  for (let k = -half; k <= half; k += 1) window.push(values[wrap(i + k, values.length)]);
  return median(window);
});
const rollingMin = (values, half) => values.map((_, i) => {
  let m = Infinity;
  for (let k = -half; k <= half; k += 1) m = Math.min(m, values[wrap(i + k, values.length)]);
  return m;
});
const rollingMean = (values, half) => values.map((_, i) => {
  let sum = 0;
  for (let k = -half; k <= half; k += 1) sum += values[wrap(i + k, values.length)];
  return sum / (2 * half + 1);
});
const quantile = (values, q) => {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  return v.length ? v[Math.min(v.length - 1, Math.floor(q * (v.length - 1)))] : NaN;
};
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const deepMerge = (a, b) => {
  if (!b) return a;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === "object" && !Array.isArray(v) ? deepMerge(a?.[k] || {}, v) : v;
  return out;
};

// ------------------------------------------------------------------ puntos del motor

/**
 * Los puntos que usa engine/trackGeometry.js buildCircuitFromPath para una spline calibrada: decímetros a
 * metros, sin el punto de cierre repetido y con tres pasadas binomiales [1, 2, 1] / 4. Se replica aquí (y no se
 * importa) para que el pipeline no dependa del resto del motor; engine/calibratedCircuit.test.js comprueba que
 * coinciden con circuit.points.
 */
export const enginePoints = (flat) => {
  let raw = [];
  for (let i = 0; i + 1 < flat.length; i += 2) raw.push({ x: flat[i] / 10, y: flat[i + 1] / 10 });
  if (raw.length > 2 && Math.hypot(raw[raw.length - 1].x - raw[0].x, raw[raw.length - 1].y - raw[0].y) < 0.5) raw.pop();
  for (let pass = 0; pass < 3; pass += 1) {
    const copy = raw.map((p) => ({ ...p }));
    const m = copy.length;
    raw = copy.map((p, i) => {
      const a = copy[(i - 1 + m) % m];
      const b = copy[(i + 1) % m];
      return { x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4 };
    });
  }
  return raw;
};

// ------------------------------------------------------------------ anchura

/** Un lado de la pista, cada 2 m: medidas limpias y rellenas (m) y la fracción aceptada. */
export const cleanSide = (raw, filter, stepM) => {
  const n = raw.length;
  const value = raw.map((v) => (v === null || v === undefined ? NaN : v));
  const half = Math.max(1, Math.round(filter.windowM / stepM));
  const base = value.map((v) => (Number.isFinite(v) && v >= filter.minHalfM ? v : NaN));
  const local = rollingMedian(base, half);
  const global = median(base);
  // Tope de toda la vuelta: escapatorias de asfalto largas pasan el filtro local (su mediana móvil también es
  // ancha), pero no el de la vuelta.
  const cap = Math.min(filter.maxHalfM || Infinity, (filter.globalRatio || Infinity) * global);
  const floor = (filter.globalLowRatio || 0) * global;
  let accepted = 0;
  const filled = value.map((v, i) => {
    // Un tramo largo mal medido (p. ej. una malla de marcas de goma tomada por asfalto) arrastra también la
    // mediana móvil: si esta se sale de [globalLowRatio, globalRatio] x la de la vuelta, manda la de la vuelta.
    const sane = (x) => Number.isFinite(x) && x >= floor && x <= cap;
    const ref = sane(local[i]) ? local[i] : global;
    const ok = sane(v) && v >= filter.minHalfM && v >= filter.lowRatio * ref && v <= filter.highRatio * ref;
    if (ok) accepted += 1;
    return Math.min(ok ? v : ref, cap);
  });
  // Mínimo y luego media en ±smoothM: sin dientes de sierra (la trazada pegada al borde los copiaría como
  // curvatura) y sin pasar del borde medido más que unos centímetros.
  const k = Math.max(1, Math.round(filter.smoothM / stepM));
  return { values: rollingMean(rollingMin(filled, k), k), share: accepted / n };
};

// ------------------------------------------------------------------ pit lane

/**
 * Donde la calle de boxes corre pegada a la pista sobre la misma malla (recta de meta de una sola cinta de
 * asfalto), el borde medido es el de la calle: la pista acaba en el muro, a media calle de distancia del eje de
 * la calle. Solo donde la calle va claramente aparte: su borde interior a más de lowRatio x la media anchura
 * típica de ese lado (y de minHalfM).
 */
export const capByPitLane = (pitlane, track, left, right, filter) => {
  if (!pitlane?.found || !pitlane.points?.length) return 0;
  const n = track.length;
  const { nx, ny } = normalsOf(track);
  // widthM de extract_pitlane es la cinta pavimentada entera (carril rápido + zona de trabajo): se usa la media
  // anchura del carril, que es lo que hay entre el eje de la calle y el muro.
  const laneHalf = Math.min((pitlane.widthM || 0) / 2, filter.pitLaneHalfM);
  const typical = { left: median(left), right: median(right) };
  let near = null;
  let capped = 0;
  for (const [x, , z] of pitlane.points) {
    let best = -1;
    let bestD = Infinity;
    const lo = near === null ? 0 : near - 40;
    const hi = near === null ? n - 1 : near + 40;
    for (let k = lo; k <= hi; k += 1) {
      const i = wrap(k, n);
      const d = (x - track[i].x) ** 2 + (z - track[i].y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    near = best;
    const o = (x - track[best].x) * nx[best] + (z - track[best].y) * ny[best];
    const inner = Math.abs(o) - laneHalf;
    const side = o >= 0 ? right : left;
    // Entrada y salida, donde la calle aún pisa la pista: no se estrecha por debajo de lo normal.
    if (inner < Math.max(filter.minHalfM, filter.lowRatio * (o >= 0 ? typical.right : typical.left))) continue;
    for (let d = -1; d <= 1; d += 1) {
      const i = wrap(best + d, n);
      if (side[i] > inner) { side[i] = inner; capped += 1; }
    }
  }
  return capped;
};

/** Marcas del pit lane en fracción de la calle (SIM-FISICA §3.8). */
export const pitMarks = (pit, track, wl, wr, rules) => {
  const lane = pit.points.map(([x, , z]) => ({ x, y: z }));
  const along = [0];
  for (let k = 1; k < lane.length; k += 1) along.push(along[k - 1] + Math.hypot(lane[k].x - lane[k - 1].x, lane[k].y - lane[k - 1].y));
  const total = along[along.length - 1];
  const { nx, ny } = normalsOf(track);
  const n = track.length;
  let near = null;
  const info = lane.map((p) => {
    let best = -1;
    let bestD = Infinity;
    const scan = (i) => {
      const d = (p.x - track[i].x) ** 2 + (p.y - track[i].y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    };
    if (near === null) for (let i = 0; i < n; i += 1) scan(i);
    else for (let k = -60; k <= 60; k += 1) scan(wrap(near + k, n));
    near = best;
    const o = (p.x - track[best].x) * nx[best] + (p.y - track[best].y) * ny[best];
    const w = o >= 0 ? wr[best] : wl[best];
    return { offset: Math.abs(o), outside: Math.abs(o) - w, index: best };
  });
  const share = (k) => round(along[k] / total, 4);
  const index = (s) => Math.max(0, Math.min(lane.length - 1, along.findIndex((a) => a >= s * total)));
  const firstOut = info.findIndex((p) => p.outside >= 0);
  let lastOut = -1;
  for (let k = info.length - 1; k >= 0; k -= 1) if (info[k].outside >= 0) { lastOut = k; break; }
  if (firstOut < 0 || lastOut <= firstOut) return null;
  const b0 = index(pit.box.fromShare);
  const b1 = index(pit.box.toShare);
  const boxOffset = median(info.slice(b0, b1 + 1).map((p) => p.offset));
  const parallel = (k) => Math.abs(info[k].offset - boxOffset) <= rules.parallelToleranceM;
  let p0 = b0;
  while (p0 - 1 > firstOut && parallel(p0 - 1)) p0 -= 1;
  let p1 = b1;
  while (p1 + 1 < lastOut && parallel(p1 + 1)) p1 += 1;
  const lead = index((along[b0] - rules.minLeadM) / total);
  const trail = index((along[b1] + rules.minTrailM) / total);
  const limitFrom = Math.max(firstOut + 1, Math.min(p0, lead));
  const limitTo = Math.min(lastOut - 1, Math.max(p1, trail));
  return {
    entryLine: share(firstOut), limitFrom: share(limitFrom), limitTo: share(limitTo), exitBlend: share(lastOut),
    boxFrom: pit.box.fromShare, boxTo: pit.box.toShare, lengthM: round(total, 1), boxOffsetM: round(boxOffset, 1),
    marksSource: "geometry", lane, along,
  };
};

// ------------------------------------------------------------------ PNG

const crcTable = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};
export const writePng = (path, img) => {
  const { w, h, px } = img;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (w * 3 + 1)] = 0;
    px.subarray(y * w * 3, (y + 1) * w * 3).forEach((v, i) => { raw[y * (w * 3 + 1) + 1 + i] = v; });
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
};
export const readPng = (path) => {
  const buf = readFileSync(path);
  let pos = 8;
  let w = 0;
  let h = 0;
  let type = 2;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const t = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (t === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      if (data[8] !== 8) throw new Error("PNG de 8 bits esperado");
      type = data[9];
    } else if (t === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : type === 0 ? 1 : 0;
  if (!bpp) throw new Error(`PNG de tipo ${type} no soportado`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const cur = Buffer.alloc(stride);
  const prev = Buffer.alloc(stride);
  const px = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y += 1) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i += 1) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
    for (let x = 0; x < w; x += 1) {
      for (let k = 0; k < 3; k += 1) px[(y * w + x) * 3 + k] = bpp === 1 ? cur[x] : cur[x * bpp + k];
    }
    cur.copy(prev);
  }
  return { w, h, px };
};

/** Imagen de `size` px que muestra la ventana [x0, x0+span] x [y0, y0+span] (Blender: x, -z) del fondo. */
const view = (bg, frame, x0, y0, span, size) => {
  const img = { w: size, h: size, px: new Uint8Array(size * size * 3) };
  const toBg = (x, y) => [((x - frame.cx) / frame.scale) * frame.size + frame.size / 2, frame.size / 2 - ((y - frame.cy) / frame.scale) * frame.size];
  const per = span / size;
  const step = Math.max(1, Math.round((per / frame.scale) * frame.size));
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const [bx, by] = toBg(x0 + (c + 0.5) * per, y0 + span - (r + 0.5) * per);
      let sum = [0, 0, 0];
      let count = 0;
      if (bg) {
        for (let dy = 0; dy < step; dy += 1) {
          for (let dx = 0; dx < step; dx += 1) {
            const X = Math.floor(bx - step / 2 + dx + 0.5);
            const Y = Math.floor(by - step / 2 + dy + 0.5);
            if (X < 0 || Y < 0 || X >= bg.w || Y >= bg.h) continue;
            const o = (Y * bg.w + X) * 3;
            sum = [sum[0] + bg.px[o], sum[1] + bg.px[o + 1], sum[2] + bg.px[o + 2]];
            count += 1;
          }
        }
      }
      const o = (r * size + c) * 3;
      // Fondo atenuado para que se lean los trazos.
      for (let k = 0; k < 3; k += 1) img.px[o + k] = count ? Math.round((sum[k] / count) * 0.55) : 20;
    }
  }
  img.toPx = (x, y) => [(x - x0) / per, (y0 + span - y) / per];
  return img;
};

const dot = (img, x, y, r, rgb) => {
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      if (dx * dx + dy * dy > r * r + 0.5) continue;
      const X = Math.round(x + dx);
      const Y = Math.round(y + dy);
      if (X < 0 || Y < 0 || X >= img.w || Y >= img.h) continue;
      const o = (Y * img.w + X) * 3;
      img.px[o] = rgb[0];
      img.px[o + 1] = rgb[1];
      img.px[o + 2] = rgb[2];
    }
  }
};
const stroke = (img, pts, r, rgb, closed = false) => {
  const px = pts.map((p) => img.toPx(p[0], p[1]));
  const last = closed ? px.length : px.length - 1;
  for (let k = 0; k < last; k += 1) {
    const [x0, y0] = px[k];
    const [x1, y1] = px[(k + 1) % px.length];
    if (Math.max(x0, x1) < -50 || Math.min(x0, x1) > img.w + 50 || Math.max(y0, y1) < -50 || Math.min(y0, y1) > img.h + 50) continue;
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= steps; s += 1) dot(img, x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, r, rgb);
  }
};

const COLOURS = {
  edge: [255, 255, 255], centre: [80, 140, 255], line: [255, 40, 40], start: [255, 255, 255],
  pit: [0, 230, 230], entry: [0, 255, 0], limit: [255, 150, 0], box: [255, 230, 0], exit: [255, 0, 255],
};

/** Dibuja bordes, eje, trazada y calle en la vista. Coordenadas de Blender (x, -z). */
const drawTrack = (img, geo, scale) => {
  const r = Math.max(0, Math.round(scale));
  stroke(img, geo.left, r, COLOURS.edge, true);
  stroke(img, geo.right, r, COLOURS.edge, true);
  stroke(img, geo.centre, r, COLOURS.centre, true);
  stroke(img, geo.line, r + 1, COLOURS.line, true);
  const [s0, s1] = geo.startBar;
  stroke(img, [s0, s1], r + 1, COLOURS.start);
  if (geo.pit) {
    stroke(img, geo.pit.points, r + 1, COLOURS.pit);
    for (const [key, colour] of [["entryLine", COLOURS.entry], ["limitFrom", COLOURS.limit], ["boxFrom", COLOURS.box], ["boxTo", COLOURS.box], ["limitTo", COLOURS.limit], ["exitBlend", COLOURS.exit]]) {
      stroke(img, geo.pit.bars[key], r + 2, colour);
    }
  }
};

const mosaic = (tiles, cols) => {
  const size = tiles[0].w;
  const rows = Math.ceil(tiles.length / cols);
  const gap = 6;
  const img = { w: cols * size + (cols - 1) * gap, h: rows * size + (rows - 1) * gap };
  img.px = new Uint8Array(img.w * img.h * 3).fill(255);
  tiles.forEach((tile, t) => {
    const ox = (t % cols) * (size + gap);
    const oy = Math.floor(t / cols) * (size + gap);
    for (let y = 0; y < size; y += 1) img.px.set(tile.px.subarray(y * size * 3, (y + 1) * size * 3), ((oy + y) * img.w + ox) * 3);
  });
  return img;
};

// ------------------------------------------------------------------ main

const options = (argv) => {
  const out = { id: argv[0] };
  for (let i = 1; i < argv.length; i += 2) out[argv[i].replace(/^--/, "")] = argv[i + 1];
  return out;
};

export const buildTrackData = (id, spline, widths, pitlane) => {
  const item = CONFIG.circuits.find((c) => c.splineId === id) || {};
  const rules = deepMerge(CONFIG.trackData, item.review?.track);
  const step = spline.stepM || 2;
  const stride = Math.max(1, Math.round(rules.engineStepM / step));
  const n2 = spline.points.length;
  if (widths.count !== n2) throw new Error(`${id}: la anchura (${widths.count} puntos) no es de esta spline (${n2})`);
  const filter = rules.widthFilter;
  // Las líneas pintadas mandan sobre el asfalto: hay mallas de asfalto troceadas en franjas (Baréin) cuyo
  // «borde» queda dentro de la pista. `asphaltLeft/Right` solo se guardan para revisar.
  const left = cleanSide(widths.left, filter, step);
  const right = cleanSide(widths.right, filter, step);
  const track2 = spline.points.map(([x, , z]) => ({ x, y: z }));
  const pitCapped = capByPitLane(pitlane, track2, left.values, right.values, filter);
  // Puntos del motor (los de splines.json, en dm) y su circuito.
  const compact = [];
  for (let i = 0; i < n2; i += stride) compact.push(Math.round(spline.points[i][0] * 10), Math.round(spline.points[i][2] * 10));
  const P = enginePoints(compact);
  const circuit = { points: P };
  const n = P.length;
  if (n * 2 !== compact.length) throw new Error(`${id}: el motor no conserva los puntos (${n} de ${compact.length / 2})`);
  const { nx, ny } = normalsOf(P);
  const margin = rules.carHalfWidthM + rules.clearanceM;
  const wl = new Float64Array(n);
  const wr = new Float64Array(n);
  const lo = new Float64Array(n);
  const hi = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const k = i * stride;
    const [rx, , rz] = spline.points[k];
    // Lo que el suavizado del motor movió el punto hacia el lado + (derecha).
    const delta = (P[i].x - rx) * nx[i] + (P[i].y - rz) * ny[i];
    wl[i] = Math.max(0, left.values[k] + delta);
    wr[i] = Math.max(0, right.values[k] - delta);
    lo[i] = -(wl[i] - margin);
    hi[i] = wr[i] - margin;
    if (lo[i] > hi[i]) lo[i] = hi[i] = (lo[i] + hi[i]) / 2;
  }
  const line = minCurvatureLine(P, lo, hi, rules.solver);
  const kappa = lineCurvature(P, line, rules.curvatureSpan);
  const centreKappa = lineCurvature(P, new Float64Array(n), rules.curvatureSpan);
  // Marcas del pit lane sobre la spline de 2 m y su anchura.
  let pit = null;
  if (pitlane?.found && pitlane.points?.length > 4 && pitlane.box) {
    pit = pitMarks(pitlane, track2, left.values, right.values, rules.pitMarks);
  }
  const sumSq = (a) => a.reduce((s, v) => s + v * v, 0);
  const radius = (a) => 1 / Math.max(...a.map(Math.abs));
  let inside = Infinity;
  for (let i = 0; i < n; i += 1) inside = Math.min(inside, wr[i] - line[i], wl[i] + line[i]);
  // Lo que minimiza el solver: suma de |P[i-1] - 2 P[i] + P[i+1]|^2 (curvatura^2 x paso^4).
  const bending = (off) => {
    let sum = 0;
    const at = (i) => [P[wrap(i, n)].x + off[wrap(i, n)] * nx[wrap(i, n)], P[wrap(i, n)].y + off[wrap(i, n)] * ny[wrap(i, n)]];
    for (let i = 0; i < n; i += 1) {
      const [a, b, c] = [at(i - 1), at(i), at(i + 1)];
      sum += (a[0] - 2 * b[0] + c[0]) ** 2 + (a[1] - 2 * b[1] + c[1]) ** 2;
    }
    return sum;
  };
  const stats = {
    bendingReduction: round(1 - bending(line) / bending(new Float64Array(n)), 3),
    edgeReference: widths.edgeReference,
    pitCappedM: pitCapped * step,
    measuredShare: { left: round(left.share, 3), right: round(right.share, 3) },
    widthM: { p05: round(quantile([...wl].map((v, i) => v + wr[i]), 0.05), 1), median: round(median([...wl].map((v, i) => v + wr[i])), 1), p95: round(quantile([...wl].map((v, i) => v + wr[i]), 0.95), 1) },
    lineM: { min: round(Math.min(...line), 2), max: round(Math.max(...line), 2), meanAbs: round(line.reduce((s, v) => s + Math.abs(v), 0) / n, 2) },
    minEdgeClearanceM: round(inside, 2),
    curvatureReduction: round(1 - sumSq(kappa) / sumSq(centreKappa), 3),
    minRadiusM: { centre: round(radius(centreKappa), 1), line: round(radius(kappa), 1) },
  };
  return { item, rules, circuit, compact, stride, wl, wr, line, kappa, margin, pit, stats, left, right };
};

const preview = (id, data, spline, widths, dir) => {
  const bgFile = widths.background ? join(dirname(argsSpline), widths.background.file) : null;
  const bg = bgFile && existsSync(bgFile) ? readPng(bgFile) : null;
  const frame = widths.background || { cx: 0, cy: 0, scale: 1, size: 1 };
  const { circuit, wl, wr, line, pit } = data;
  const P = circuit.points;
  const { nx, ny } = normalsOf(P);
  // Motor (x, z_gltf) -> Blender (x, -z).
  const b = (x, y) => [x, -y];
  const geo = {
    centre: P.map((p) => b(p.x, p.y)),
    left: P.map((p, i) => b(p.x - nx[i] * wl[i], p.y - ny[i] * wl[i])),
    right: P.map((p, i) => b(p.x + nx[i] * wr[i], p.y + ny[i] * wr[i])),
    line: P.map((p, i) => b(p.x + nx[i] * line[i], p.y + ny[i] * line[i])),
    startBar: [b(P[0].x - nx[0] * wl[0], P[0].y - ny[0] * wl[0]), b(P[0].x + nx[0] * wr[0], P[0].y + ny[0] * wr[0])],
  };
  if (pit) {
    const lane = pit.lane;
    const at = (s) => {
      const target = s * pit.along[pit.along.length - 1];
      const k = Math.max(1, Math.min(lane.length - 1, pit.along.findIndex((a) => a >= target)));
      const dx = lane[k].x - lane[k - 1].x;
      const dy = lane[k].y - lane[k - 1].y;
      const l = Math.hypot(dx, dy) || 1;
      const half = 6;
      return [b(lane[k].x - (dy / l) * half, lane[k].y + (dx / l) * half), b(lane[k].x + (dy / l) * half, lane[k].y - (dx / l) * half)];
    };
    geo.pit = { points: lane.map((p) => b(p.x, p.y)), bars: Object.fromEntries(["entryLine", "limitFrom", "boxFrom", "boxTo", "limitTo", "exitBlend"].map((k) => [k, at(pit[k])])) };
  }
  const cfg = data.rules.preview;
  const xs = geo.centre.map((p) => p[0]);
  const ys = geo.centre.map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.05;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const overview = view(bg, frame, cx - span / 2, cy - span / 2, span, cfg.overviewPx);
  drawTrack(overview, geo, 0);
  writePng(join(dir, `${id}.track.png`), overview);
  // Las curvas más cerradas de la trazada, separadas al menos una ventana.
  const order = [...data.kappa.keys()].sort((a, c) => Math.abs(data.kappa[c]) - Math.abs(data.kappa[a]));
  const picked = [];
  for (const i of order) {
    if (picked.length >= 4) break;
    if (picked.every((j) => Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) > cfg.zoomM)) picked.push(i);
  }
  // Y los dos tramos más anchos (escapatorias de asfalto, cruces, calle de boxes fundida con la pista).
  const wide = [...wl.keys()].sort((a, c) => wl[c] + wr[c] - (wl[a] + wr[a]));
  const corners = picked.length;
  for (const i of wide) {
    if (picked.length >= corners + 2) break;
    if (picked.every((j) => Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) > cfg.zoomM)) picked.push(i);
  }
  const tiles = picked.map((i) => {
    const [x, y] = b(P[i].x, P[i].y);
    const tile = view(bg, frame, x - cfg.zoomM / 2, y - cfg.zoomM / 2, cfg.zoomM, cfg.zoomPx);
    drawTrack(tile, geo, 1);
    return tile;
  });
  if (tiles.length) writePng(join(dir, `${id}.track-zoom.png`), mosaic(tiles, 3));
  if (geo.pit) {
    const px = geo.pit.points.map((p) => p[0]);
    const py = geo.pit.points.map((p) => p[1]);
    const s = Math.max(Math.max(...px) - Math.min(...px), Math.max(...py) - Math.min(...py)) + 120;
    const tile = view(bg, frame, (Math.max(...px) + Math.min(...px)) / 2 - s / 2, (Math.max(...py) + Math.min(...py)) / 2 - s / 2, s, cfg.pitPx);
    drawTrack(tile, geo, 1);
    writePng(join(dir, `${id}.track-pit.png`), tile);
  }
};

let argsSpline = null;
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = options(process.argv.slice(2));
  argsSpline = args.spline;
  const spline = JSON.parse(readFileSync(args.spline, "utf8"));
  const widths = JSON.parse(readFileSync(args.widths, "utf8"));
  const pitlane = args.pit && existsSync(args.pit) ? JSON.parse(readFileSync(args.pit, "utf8")) : null;
  const data = buildTrackData(args.id, spline, widths, pitlane);
  const dm = (a) => Array.from(a, (v) => Math.round(v * 10));
  const pit = data.pit && (({ lane, along, ...rest }) => rest)(data.pit);
  const out = {
    generator: "racing_line.mjs v1",
    splineId: args.id,
    count: data.circuit.points.length,
    stepM: data.rules.engineStepM,
    units: { wl: "dm", wr: "dm", line: "dm (+ = derecha del sentido de carrera)", kappa: "1e-4 / m (+ = hacia la derecha)" },
    trackMarginM: round(data.margin, 2),
    wl: dm(data.wl),
    wr: dm(data.wr),
    line: dm(data.line),
    kappa: Array.from(data.kappa, (v) => Math.round(v * 1e4)),
    pit,
    stats: data.stats,
  };
  writeFileSync(args.out, `${JSON.stringify(out)}\n`);
  if (args.preview) {
    mkdirSync(args.preview, { recursive: true });
    preview(args.id, data, spline, widths, args.preview);
  }
  console.log(`[trazada] ${args.id}: ${JSON.stringify(data.stats)}${pit ? ` pit ${JSON.stringify(pit)}` : ""}`);
}
