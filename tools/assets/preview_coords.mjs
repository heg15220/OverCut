// Píxel de una vista previa (.cache/preview/<id>.png) -> coordenadas glTF (x, z) para review.startNear.
// Uso: node preview_coords.mjs <spline.json> <px> <py> [tamaño=1200]
import { readFileSync } from "node:fs";
const [file, px, py, size = 1200] = process.argv.slice(2);
const pts = JSON.parse(readFileSync(file, "utf8")).points.map(([x, , z]) => [x, -z]);
const xs = pts.map((p) => p[0]);
const ys = pts.map((p) => p[1]);
const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
const scale = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.1;
const bx = cx + ((Number(px) - size / 2) / size) * scale;
const by = cy - ((Number(py) - size / 2) / size) * scale;
console.log(JSON.stringify([Math.round(bx * 10) / 10, Math.round(-by * 10) / 10]));
