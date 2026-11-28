/**
 * LOOK-C3 (F1M24-CHINA §3.3; VIEW-10 «sin malla flotante»; RF-3D-04): test de mallas visibles sin dueño y
 * de mallas pequeñas flotando sobre la pista dentro del modelo del circuito (el objeto rojo de la salida de
 * Shanghái, §2.5).
 *   - auditScene encuentra lo que cuelga de la escena sin `userData.owner` y lo pequeño que flota;
 *   - lo grande (cubiertas, puentes) y lo que dibuja el código con dueño no se toca;
 *   - todo lo que Race3D.js cuelga de la escena lleva dueño (lectura del fuente).
 */

import * as THREE from "three";
import fs from "fs";
import path from "path";
import LOOK from "../../data/balance/view-look.json";
import { auditScene, hideStrays, own, roadTopOf, topLevelOf } from "./strays";

const box = (w, h, d, y = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial());
  mesh.position.y = y + h / 2;
  return mesh;
};

describe("mallas sin dueño y flotantes (VIEW-10)", () => {
  it("encuentra una malla visible sin dueño y respeta las que lo tienen", () => {
    const scene = new THREE.Scene();
    const car = own(new THREE.Group(), "car");
    car.add(box(5, 1, 2));
    scene.add(car);
    const stray = box(4, 1, 1, 0);
    stray.name = "stray";
    scene.add(stray);
    const { ownerless, floating } = auditScene(scene);
    expect(ownerless.map((m) => m.name)).toEqual(["stray"]);
    expect(floating).toEqual([]);
    expect(topLevelOf(car.children[0], scene)).toBe(car);
  });

  it("dentro del circuito oculta lo pequeño que flota y deja lo grande y lo apoyado", () => {
    const scene = new THREE.Scene();
    const circuit = own(new THREE.Group(), "circuit");
    const balloon = box(8, 4, 3, 200);
    balloon.name = "balloon";
    const roof = box(300, 10, 120, 30); // a grandstand roof over the straight: big
    const board = box(10, 2, 0.3, 0); // a board on the ground
    circuit.add(balloon, roof, board);
    scene.add(circuit);
    // An owned car drawn high (a jump of the code) is not this rule's business.
    const car = own(new THREE.Group(), "car");
    car.add(box(5, 1, 2, 300));
    scene.add(car);
    const result = hideStrays(scene, { roadTopY: 2 });
    expect(result).toMatchObject({ ownerless: 0, floating: 1, names: ["balloon"] });
    expect(balloon.visible).toBe(false);
    expect(roof.visible).toBe(true);
    expect(board.visible).toBe(true);
    // Hidden, it is not counted again.
    expect(hideStrays(scene, { roadTopY: 2 }).floating).toBe(0);
  });

  it("la altura de referencia es lo más alto de la carretera", () => {
    expect(roadTopOf((s) => 10 * Math.sin(2 * Math.PI * s))).toBeCloseTo(10, 1);
    expect(roadTopOf(null)).toBe(0);
    const scene = new THREE.Scene();
    const circuit = own(new THREE.Group(), "circuit");
    circuit.add(box(5, 2, 5, 40));
    scene.add(circuit);
    // 40 m up is floating over a flat track, not over a road that climbs to 30 m.
    expect(auditScene(scene, { roadTopY: 0 }).floating).toHaveLength(1);
    expect(auditScene(scene, { roadTopY: 30 }).floating).toHaveLength(0);
    expect(LOOK.fx.strays.minAboveM).toBeGreaterThan(0);
  });

  it("todo lo que Race3D.js cuelga de la escena lleva dueño", () => {
    const source = fs.readFileSync(path.join(__dirname, "../Race3D.js"), "utf8");
    const added = [...source.matchAll(/scene\.add\(([^;]*)\);/g)].flatMap((m) => m[1].split(",").map((part) => part.trim()));
    expect(added.length).toBeGreaterThan(5);
    // Each argument is owned where it is made: own(x, "...") / own(new ..., "...") or a builder that owns it.
    const ownedBuilders = { "sparks.object": /group\.userData\.owner = "fx"/, crew: /own\(new THREE\.Group\(\), "crew"\)/, "state.safetyCar": /own\(group, "safetyCar"\)/ };
    const sparksSource = fs.readFileSync(path.join(__dirname, "sparks.js"), "utf8");
    const ownedOf = (name) => {
      if (ownedBuilders[name]) return ownedBuilders[name].test(`${source}\n${sparksSource}`);
      const base = name.replace(/^state\./, "");
      const ownCall = new RegExp(`own\\(${base.replace(/\./g, "\\.")}, "[a-zA-Z]+"\\)`);
      const assignedOwned = new RegExp(`(?:const|let)\\s+${base}\\s*=\\s*own\\(`);
      return ownCall.test(source) || assignedOwned.test(source);
    };
    expect(added.filter((name) => !ownedOf(name))).toEqual([]);
  });
});
