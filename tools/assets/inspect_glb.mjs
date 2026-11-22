// Inspección rápida de GLB: lee solo el bloque JSON (sin decodificar buffers).
// Uso: node inspect_glb.mjs <fichero.glb> [--nodes]
// Muestra asset.extras (Sketchfab guarda ahí autor, licencia y fuente), nodos, mallas, materiales y el
// tamaño aproximado a partir de los accessors POSITION (min/max) y las transformaciones de los nodos.
import { readFileSync } from "node:fs";

export const readGlbJson = (path) => {
  const buffer = readFileSync(path);
  if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path}: no es GLB`);
  const length = buffer.readUInt32LE(12);
  return JSON.parse(buffer.subarray(20, 20 + length).toString("utf8"));
};

const multiply = (a, b) => {
  const out = new Array(16).fill(0);
  for (let r = 0; r < 4; r += 1) for (let c = 0; c < 4; c += 1) for (let k = 0; k < 4; k += 1) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
};
const compose = (node) => {
  if (node.matrix) return node.matrix;
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  return [
    (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
    2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1,
  ];
};
const apply = (m, [x, y, z]) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];

export const summarize = (json) => {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const visit = (index, parent) => {
    const node = json.nodes[index];
    const world = multiply(parent, compose(node));
    if (node.mesh !== undefined) {
      json.meshes[node.mesh].primitives.forEach((primitive) => {
        const accessor = json.accessors[primitive.attributes.POSITION];
        if (!accessor?.min) return;
        for (let corner = 0; corner < 8; corner += 1) {
          const p = [0, 1, 2].map((axis) => ((corner >> axis) & 1 ? accessor.max[axis] : accessor.min[axis]));
          const q = apply(world, p);
          q.forEach((v, axis) => {
            min[axis] = Math.min(min[axis], v);
            max[axis] = Math.max(max[axis], v);
          });
        }
      });
    }
    (node.children || []).forEach((child) => visit(child, world));
  };
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  (json.scenes?.[json.scene || 0]?.nodes || []).forEach((index) => visit(index, identity));
  return {
    extras: json.asset?.extras || null,
    generator: json.asset?.generator,
    nodes: json.nodes?.length || 0,
    meshes: json.meshes?.length || 0,
    materials: (json.materials || []).map((material) => material.name),
    images: json.images?.length || 0,
    extensions: json.extensionsUsed || [],
    size: max.map((v, axis) => Math.round((v - min[axis]) * 1000) / 1000),
    min: min.map((v) => Math.round(v * 1000) / 1000),
  };
};

if (process.argv[1]?.endsWith("inspect_glb.mjs")) {
  const [path, flag] = process.argv.slice(2);
  const json = readGlbJson(path);
  const summary = summarize(json);
  console.log(JSON.stringify(summary, null, 1));
  if (flag === "--nodes") json.nodes.forEach((node, index) => console.log(index, node.name, node.mesh !== undefined ? `mesh:${json.meshes[node.mesh].name}` : "", (node.children || []).length));
}
