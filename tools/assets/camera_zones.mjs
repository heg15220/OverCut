// Zonas de cámara de TV por circuito calibrado (docs/manager/F1M24-GAMEPLAY.md §2.5 camera-zones, CAM-2;
// RF-3D-03, RF-3D-04, RNF-07).
//
// Uso: node tools/assets/camera_zones.mjs [--only <splineId>] [--force] [--check]
//
// Para cada spline de overcut/frontend/src/modules/overcutManager/data/splines.json construye el circuito del
// motor (engine/venue.js circuitFor, en el último año de validez de la spline) y sus zonas con
// three/cameraZones.js buildCameraZones (parámetros en data/balance/broadcast.json zonesPolicy y rigTemplate:
// nada de números aquí). Escribe data/circuits/<splineId>/camera-zones.json y el índice
// data/circuits/cameraZones.js que lee la vista.
//
// Los ficheros se pueden editar a mano (mover límites, quitar o añadir cámaras de los tipos de rigTemplate);
// un fichero con "edited": true no se sobrescribe salvo con --force. Las posiciones finales no se guardan:
// las calcula la vista con rigTemplate (three/cameras.js buildZoneRig) y, en el circuito real, fitRig sobre la
// malla GLB, que solo existe en el navegador. --check no escribe: falla si algún fichero difiere de lo generado.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import "./engine_loader.mjs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const manager = resolve(here, "../../overcut/frontend/src/modules/overcutManager");
const load = (path) => import(pathToFileURL(resolve(manager, path)).href);
const { circuitFor } = await load("engine/venue.js");
const { buildCameraZones } = await load("three/cameraZones.js");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const force = args.includes("--force");
const check = args.includes("--check");

const splines = JSON.parse(readFileSync(join(manager, "data", "splines.json"), "utf8")).splines;
const outDir = join(manager, "data", "circuits");
const SCHEMA_NOTE = "Generado por tools/assets/camera_zones.mjs (CAM-2) desde la geometría del circuito; esquema engine/packs/schema/camera-zones.schema.json. Editable a mano: poner \"edited\": true para que el generador no lo sobrescriba.";

let differs = 0;
for (const [id, spline] of Object.entries(splines)) {
  if (only && id !== only) continue;
  const year = Math.min(spline.validTo, 2026);
  const circuit = circuitFor({ circuit: spline.layoutRef }, year);
  if (circuit.splineId !== id) {
    console.warn(`${id}: circuitFor(${spline.layoutRef}, ${year}) da ${circuit.splineId ?? "un trazado procedural"}; se salta`);
    continue;
  }
  const { lengthM, zones } = buildCameraZones(circuit);
  const file = join(outDir, id, "camera-zones.json");
  const body = { $comment: SCHEMA_NOTE, splineId: id, lengthM, year, source: "buildCameraZones (three/cameraZones.js) + broadcast.json zonesPolicy", zones };
  const text = `${JSON.stringify(body, null, 1)}\n`;
  const old = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (old && JSON.parse(old).edited && !force) {
    console.log(`${id}: editado a mano, se conserva (--force para regenerar)`);
    continue;
  }
  if (check) {
    if (old !== text) {
      differs += 1;
      console.error(`${id}: difiere de lo generado`);
    }
    continue;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  console.log(`${id}: ${zones.length} zonas, ${lengthM} m`);
}

if (!check) {
  const ids = existsSync(outDir) ? readdirSync(outDir, { withFileTypes: true }).filter((entry) => entry.isDirectory() && existsSync(join(outDir, entry.name, "camera-zones.json"))).map((entry) => entry.name).sort() : [];
  const name = (splineId) => `z_${splineId.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const index = [
    "// Generado por tools/assets/camera_zones.mjs: no editar a mano (editar los camera-zones.json).",
    ...ids.map((splineId) => `import ${name(splineId)} from "./${splineId}/camera-zones.json";`),
    "",
    "const zones = {",
    ...ids.map((splineId) => `  "${splineId}": ${name(splineId)},`),
    "};",
    "export default zones;",
    "",
  ].join("\n");
  writeFileSync(join(outDir, "cameraZones.js"), index);
}
if (differs) process.exit(1);
