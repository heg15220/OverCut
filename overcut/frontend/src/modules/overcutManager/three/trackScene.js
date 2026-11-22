/**
 * A circuit in 3D, built from the same geometry the race runs on.
 *
 * The road is a ribbon thirteen metres wide over grass mown in stripes; white
 * lines mark its edges; every corner gets red-and-white kerbs on the apex and
 * the exit, and gravel (slow corners) or tarmac run-off (fast ones) beyond.
 * Barriers carry advertising boards; street circuits get concrete walls and
 * catch fencing right at the edge instead. Along the main straight: the pit
 * lane behind its wall, the garages in team colours, the grandstand opposite,
 * the start gantry with its five lights and the grid painted on the road.
 * Around it, the country: sand and palms in the Gulf, pine forest in the
 * Ardennes, apartment blocks and a harbour in Monaco (see biomes.js).
 *
 * World space: the circuit's x stays x, its y (screen down) becomes z, y is up.
 */

import * as THREE from "three";
import { merge, ribbon, wall } from "./geometry";
import { offsetSpan, poseAt } from "../engine/trackGeometry";
import { biomeFor } from "./biomes";
import { floodlights, groundMaterials, horizon, skyDome, skyline, vegetation, water } from "./scenery";

const STREET = new Set(["monaco", "marina_bay", "baku", "detroit", "dallas", "phoenix", "adelaide", "long_beach", "valencia", "jeddah", "vegas", "las_vegas", "pedralbes", "monsanto", "boavista", "pescara", "montjuic", "miami"]);

const HALF = 6.5;

const canvasTexture = (width, height, draw, repeat = null) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  if (repeat) texture.repeat.set(...repeat);
  return texture;
};

/** A deterministic pseudo-random sequence, so every visit to a circuit looks the same. */
const rng = (seed) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const noise = (g, w, h, base, spread, count, size = 2) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const random = rng(w * 13 + h);
  for (let i = 0; i < count; i += 1) {
    const shade = Math.floor((random() - 0.5) * spread);
    g.fillStyle = `rgba(${shade > 0 ? 255 : 0},${shade > 0 ? 255 : 0},${shade > 0 ? 255 : 0},${Math.abs(shade) / 255})`;
    g.fillRect(random() * w, random() * h, size, size);
  }
};

/** Materials shared by every circuit, created once. */
let shared = null;
const materials = () => {
  if (shared) return shared;
  const asphalt = canvasTexture(256, 256, (g, w, h) => noise(g, w, h, "#3d4047", 70, 9000, 1.5));
  const grass = canvasTexture(512, 512, (g, w, h) => {
    noise(g, w, h, "#3f6b35", 40, 12000, 2);
    // Mowing stripes.
    for (let i = 0; i < 8; i += 2) {
      g.fillStyle = "rgba(255,255,255,0.05)";
      g.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  const gravel = canvasTexture(256, 256, (g, w, h) => noise(g, w, h, "#b8a07a", 90, 14000, 2));
  const runoff = canvasTexture(256, 256, (g, w, h) => {
    noise(g, w, h, "#4a5562", 40, 6000, 1.5);
  });
  const kerb = canvasTexture(64, 16, (g) => {
    g.fillStyle = "#d8261f";
    g.fillRect(0, 0, 32, 16);
    g.fillStyle = "#f4f1ea";
    g.fillRect(32, 0, 32, 16);
  });
  const checker = canvasTexture(64, 64, (g) => {
    for (let x = 0; x < 8; x += 1) {
      for (let y = 0; y < 8; y += 1) {
        g.fillStyle = (x + y) % 2 ? "#111" : "#f4f1ea";
        g.fillRect(x * 8, y * 8, 8, 8);
      }
    }
  });
  const boards = canvasTexture(1024, 64, (g, w, h) => {
    const brands = [["#c8102e", "OVERCUT"], ["#10294f", "F1 HUB"], ["#f2b705", "PIT WALL"], ["#0b6b3a", "TRAYECTORIA"], ["#111318", "GRAND PRIX"], ["#2f8fdd", "RACING"]];
    brands.forEach(([colour, text], index) => {
      const x = (index * w) / brands.length;
      g.fillStyle = colour;
      g.fillRect(x, 0, w / brands.length, h);
      g.fillStyle = colour === "#f2b705" ? "#111318" : "#f4f1ea";
      g.font = "900 34px Arial, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, x + w / brands.length / 2, h / 2 + 2);
    });
  });
  const crowd = canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = "#2a2f38";
    g.fillRect(0, 0, w, h);
    const random = rng(77);
    const colours = ["#c8102e", "#f2b705", "#f4f1ea", "#10294f", "#ff8000", "#2f8fdd", "#3fbf7f", "#e0e0e0"];
    for (let i = 0; i < 2600; i += 1) {
      g.fillStyle = colours[Math.floor(random() * colours.length)];
      g.fillRect(random() * w, random() * h, 3, 4);
    }
    for (let row = 0; row < 8; row += 1) {
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(0, (row * h) / 8, w, 2);
    }
  });
  const fence = canvasTexture(64, 64, (g) => {
    g.strokeStyle = "rgba(200,205,212,0.7)";
    g.lineWidth = 1;
    for (let i = -64; i < 128; i += 8) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + 64, 64);
      g.moveTo(i + 64, 0);
      g.lineTo(i, 64);
      g.stroke();
    }
  });
  shared = {
    grass: new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95 }),
    asphalt: new THREE.MeshStandardMaterial({ map: asphalt, color: "#ffffff", roughness: 0.82, metalness: 0.05 }),
    line: new THREE.MeshStandardMaterial({ color: "#f2f0e8", roughness: 0.7 }),
    kerb: new THREE.MeshStandardMaterial({ map: kerb, roughness: 0.6 }),
    gravel: new THREE.MeshStandardMaterial({ map: gravel, roughness: 1 }),
    runoff: new THREE.MeshStandardMaterial({ map: runoff, roughness: 0.85 }),
    checker: new THREE.MeshStandardMaterial({ map: checker, roughness: 0.7 }),
    barrier: new THREE.MeshStandardMaterial({ map: boards, roughness: 0.6, side: THREE.FrontSide }),
    barrierBack: new THREE.MeshStandardMaterial({ color: "#8d9096", roughness: 0.9, side: THREE.BackSide }),
    concrete: new THREE.MeshStandardMaterial({ color: "#c9c6bd", roughness: 0.9, side: THREE.DoubleSide }),
    fence: new THREE.MeshStandardMaterial({ map: fence, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    tyres: new THREE.MeshStandardMaterial({ color: "#1b1c1f", roughness: 0.95 }),
    building: new THREE.MeshStandardMaterial({ color: "#e9e7e1", roughness: 0.6, metalness: 0.1 }),
    glass: new THREE.MeshStandardMaterial({ color: "#5d7d9a", roughness: 0.1, metalness: 0.6 }),
    crowd: new THREE.MeshStandardMaterial({ map: crowd, roughness: 1 }),
    steel: new THREE.MeshStandardMaterial({ color: "#3a3f47", roughness: 0.5, metalness: 0.7 }),
    pitLane: new THREE.MeshStandardMaterial({ map: asphalt, color: "#c9ccd2", roughness: 0.8 }),
    trunk: new THREE.MeshStandardMaterial({ color: "#5a4632", roughness: 1 }),
    leaves: new THREE.MeshStandardMaterial({ color: "#2f5a2a", roughness: 1 }),
    lightOff: new THREE.MeshStandardMaterial({ color: "#2a1012", roughness: 0.4, emissive: "#000000" }),
    lightOn: new THREE.MeshBasicMaterial({ color: "#ff1408", toneMapped: false }),
  };
  Object.values(shared).forEach((material) => {
    material.userData.shared = true;
  });
  return shared;
};

const meshOf = (geometry, material, { shadow = false } = {}) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = shadow;
  return mesh;
};

/** Points of a span of the circuit, with their headings, for ribbons along part of the lap. */
const spanPoints = (circuit, from, to) => {
  const n = circuit.points.length;
  const start = Math.floor(from * n);
  const end = Math.ceil((to < from ? to + 1 : to) * n);
  const points = [];
  const headings = [];
  for (let k = start; k <= end; k += 1) {
    const i = ((k % n) + n) % n;
    points.push(circuit.points[i]);
    headings.push(circuit.heading[i]);
  }
  return { points, headings };
};

/**
 * Build the scene graph of a circuit. Returns { group, gantryLights, bounds }.
 * `teams` colour the garages; `seed` keeps trees in the same places.
 */
export const buildTrack = (circuit, { teams = [], street = null, year = 2020 } = {}) => {
  const m = materials();
  const biome = biomeFor(circuit.ref, year);
  const group = new THREE.Group();
  const isStreet = street ?? STREET.has(circuit.ref);
  const { box } = circuit;
  const P = circuit.points;
  const H = circuit.heading;

  // Ground.
  const size = Math.max(box.maxX - box.minX, box.maxY - box.minY) + 1600;
  const ground = new THREE.PlaneGeometry(size, size);
  ground.rotateX(-Math.PI / 2);
  ground.translate((box.minX + box.maxX) / 2, -0.02, (box.minY + box.maxY) / 2);
  const land = groundMaterials(biome, size);
  group.add(meshOf(ground, land.ground));

  // Run-off and gravel beyond the corners.
  const runoff = [];
  const gravel = [];
  circuit.corners.forEach((corner) => {
    const inside = corner.sign || 1;
    const width = isStreet ? 3 : corner.kind === "fast" ? 26 : corner.kind === "medium" ? 20 : 16;
    const { points, headings } = spanPoints(circuit, corner.from - 0.004, corner.to + 0.01);
    const geometry = ribbon(points, headings, -inside * HALF, -inside * (HALF + width), 0.004, 0.05, false);
    (corner.kind === "slow" && !isStreet ? gravel : runoff).push(geometry);
  });
  if (runoff.length) group.add(meshOf(merge(runoff), m.runoff));
  if (gravel.length) group.add(meshOf(merge(gravel), land.gravel));

  // The road, its lines and the kerbs.
  m.asphalt.map.repeat.set(1, 1);
  group.add(meshOf(ribbon(P, H, -HALF, HALF, 0.012, 0.08), m.asphalt));
  group.add(meshOf(merge([ribbon(P, H, -HALF + 0.15, -HALF + 0.45, 0.016, 0.1), ribbon(P, H, HALF - 0.45, HALF - 0.15, 0.016, 0.1)]), m.line));
  const kerbs = [];
  circuit.corners.forEach((corner) => {
    const inside = corner.sign || 1;
    const apexFrom = corner.apex - (corner.apex - corner.from) * 0.65;
    const apexTo = corner.apex + (corner.to - corner.apex) * 0.65;
    const a = spanPoints(circuit, apexFrom, apexTo);
    kerbs.push(ribbon(a.points, a.headings, inside * (HALF - 0.3), inside * (HALF + 1.2), 0.02, 0.3, false));
    const b = spanPoints(circuit, corner.to - (corner.to - corner.apex) * 0.35, corner.to + 0.006);
    kerbs.push(ribbon(b.points, b.headings, -inside * (HALF - 0.3), -inside * (HALF + 1.2), 0.02, 0.3, false));
  });
  if (kerbs.length) group.add(meshOf(merge(kerbs), m.kerb));

  // Start line, grid boxes.
  // The line itself: 1.2 m of chequers across the road.
  const startPose = poseAt(circuit, 0);
  const startLine = new THREE.PlaneGeometry(1.2, HALF * 2);
  startLine.rotateX(-Math.PI / 2);
  startLine.rotateY(-startPose.heading);
  startLine.translate(startPose.x, 0.022, startPose.y);
  m.checker.map.repeat.set(1, 11);
  group.add(meshOf(startLine, m.checker));
  const grid = [];
  for (let slot = 0; slot < 26; slot += 1) {
    const pose = poseAt(circuit, 1 - (6 + slot * 8) / circuit.length);
    const side = slot % 2 ? -1 : 1;
    const centre = new THREE.Vector3(pose.x - Math.sin(pose.heading) * side * 2.6, 0.02, pose.y + Math.cos(pose.heading) * side * 2.6);
    const bar = new THREE.BoxGeometry(0.3, 0.01, 2.4);
    bar.rotateY(-pose.heading);
    bar.translate(centre.x + Math.cos(pose.heading) * 2.4, centre.y, centre.z + Math.sin(pose.heading) * 2.4);
    grid.push(bar);
  }
  group.add(meshOf(merge(grid), m.line));

  // Barriers: advertising boards on circuits, concrete and fence in the streets.
  const reach = (side) => {
    // Distance from the centreline to the barrier at each point: further out where there is run-off.
    const distances = new Array(P.length).fill(isStreet ? HALF + 1.6 : HALF + 12);
    circuit.corners.forEach((corner) => {
      const outside = -(corner.sign || 1);
      if (outside !== side) return;
      const width = isStreet ? 3 : corner.kind === "fast" ? 26 : corner.kind === "medium" ? 20 : 16;
      const n = P.length;
      const from = Math.floor((corner.from - 0.01) * n);
      const to = Math.ceil((corner.to + 0.02) * n);
      for (let k = from; k <= to; k += 1) {
        const i = ((k % n) + n) % n;
        distances[i] = Math.max(distances[i], HALF + width + 4);
      }
    });
    // Smooth so the barrier flows rather than steps.
    const smooth = distances.slice();
    for (let pass = 0; pass < 6; pass += 1) {
      for (let i = 0; i < smooth.length; i += 1) smooth[i] = (smooth[(i - 1 + smooth.length) % smooth.length] + smooth[i] * 2 + smooth[(i + 1) % smooth.length]) / 4;
    }
    return smooth;
  };
  [1, -1].forEach((side) => {
    const distances = reach(side);
    const points = P.map((p, i) => ({ x: p.x - Math.sin(H[i]) * distances[i] * side, y: p.y + Math.cos(H[i]) * distances[i] * side }));
    const geometry = wall(points, H, 0, isStreet ? 1.2 : 1.0, 0, true, isStreet ? 0.25 : 1 / 42);
    // The printed face looks at the track; behind it, plain grey.
    const normals = geometry.getAttribute("normal");
    const toTrack = { x: P[0].x - points[0].x, z: P[0].y - points[0].y };
    if (normals.getX(0) * toTrack.x + normals.getZ(0) * toTrack.z < 0) {
      const index = geometry.getIndex().array.slice();
      for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
      geometry.setIndex(Array.from(index));
      geometry.computeVertexNormals();
    }
    // Boards are read from the track: the barrier on the other side runs the texture backwards.
    if (side > 0) {
      const uv = geometry.getAttribute("uv");
      for (let i = 0; i < uv.count; i += 1) uv.setX(i, -uv.getX(i));
    }
    group.add(meshOf(geometry, isStreet ? m.concrete : m.barrier));
    if (!isStreet) group.add(meshOf(geometry, m.barrierBack));
    if (isStreet) {
      const fenceGeometry = wall(points, H, 0, 3.2, 1.2, true);
      group.add(meshOf(fenceGeometry, m.fence));
    }
  });

  // Tyre walls on the outside of the slow corners.
  if (!isStreet) {
    const stacks = [];
    circuit.corners.filter((corner) => corner.kind !== "fast").forEach((corner) => {
      const outside = -(corner.sign || 1);
      const width = corner.kind === "medium" ? 20 : 16;
      const { points, headings } = spanPoints(circuit, corner.apex, corner.to + 0.012);
      stacks.push(wall(points.map((p, i) => ({ x: p.x - Math.sin(headings[i]) * (HALF + width + 3) * outside, y: p.y + Math.cos(headings[i]) * (HALF + width + 3) * outside })), headings, 0, 0.8, 0, false));
    });
    if (stacks.length) group.add(meshOf(merge(stacks), m.tyres));
  }

  // Pit lane, its wall, the garages and the paddock building.
  const pitPath = circuit.pit.path;
  if (pitPath.length > 3) {
    const pitHeadings = pitPath.map((p, i) => {
      const a = pitPath[Math.max(0, i - 1)];
      const b = pitPath[Math.min(pitPath.length - 1, i + 1)];
      return Math.atan2(b.y - a.y, b.x - a.x);
    });
    const inside = circuit.clockwise ? 1 : -1;
    group.add(meshOf(ribbon(pitPath, pitHeadings, -5, 5, 0.008, 0.08, false), m.pitLane));
    const lineIndex = Math.round(circuit.pit.lineAt * (pitPath.length - 1));
    const first = Math.max(2, Math.round(lineIndex * 0.15));
    const straight = pitPath.slice(first, lineIndex);
    const straightHeadings = pitHeadings.slice(first, lineIndex);
    if (straight.length > 2) {
      group.add(meshOf(wall(straight, straightHeadings, -inside * 7, 1.1, 0, false), m.concrete));
      group.add(meshOf(wall(straight, straightHeadings, -inside * 7, 2.5, 1.1, false), m.fence));
      // The garage block: one long building, a door per team in its colours.
      const garages = [];
      const doors = [];
      const count = Math.max(1, teams.length);
      teams.forEach((team, index) => {
        // The same place the race clock stops that team's cars.
        const slot = team.slot ?? index / Math.max(1, count - 1);
        const pathIndex = Math.round(lineIndex * (0.22 + 0.7 * slot));
        const i = Math.max(0, Math.min(straight.length - 1, pathIndex - first));
        const p = straight[i];
        const h = straightHeadings[i];
        const x = p.x - Math.sin(h) * inside * 9.1;
        const z = p.y + Math.cos(h) * inside * 9.1;
        // An open garage: the team's colours on the header above the door.
        const door = new THREE.BoxGeometry(Math.min(14, (circuit.pit.lineAt * circuit.length * 0.6) / count), 0.9, 0.3);
        door.rotateY(-h);
        door.translate(x, 4.6, z);
        const doorMesh = meshOf(door, new THREE.MeshStandardMaterial({ color: team.color, roughness: 0.5, metalness: 0.2 }));
        doors.push(doorMesh);
      });
      straight.forEach((p, i) => {
        if (i % 3) return;
        const h = straightHeadings[i];
        // The pit building: its open front on the pit lane, garages inside.
        const block = new THREE.BoxGeometry(19, 8, 14);
        block.rotateY(-h);
        block.translate(p.x - Math.sin(h) * inside * 23, 4, p.y + Math.cos(h) * inside * 23);
        garages.push(block);
      });
      if (garages.length) group.add(meshOf(merge(garages), m.building, { shadow: true }));
      doors.forEach((door) => group.add(door));
      // A glass band along the top floor.
      const glassBand = [];
      const garageFloors = [];
      straight.forEach((p, i) => {
        if (i % 3) return;
        const h = straightHeadings[i];
        const pane = new THREE.BoxGeometry(19.2, 2, 14.2);
        pane.rotateY(-h);
        pane.translate(p.x - Math.sin(h) * inside * 23, 6.4, p.y + Math.cos(h) * inside * 23);
        // Garage floor and roof between the lane and the building.
        const roof = new THREE.BoxGeometry(19, 0.4, 7);
        roof.rotateY(-h);
        roof.translate(p.x - Math.sin(h) * inside * 12.5, 5.2, p.y + Math.cos(h) * inside * 12.5);
        glassBand.push(roof);
        const floor = new THREE.BoxGeometry(19, 0.04, 11);
        floor.rotateY(-h);
        floor.translate(p.x - Math.sin(h) * inside * 10.5, 0.01, p.y + Math.cos(h) * inside * 10.5);
        garageFloors.push(floor);
        glassBand.push(pane);
      });
      if (glassBand.length) group.add(meshOf(merge(glassBand), m.glass));
      if (garageFloors.length) group.add(meshOf(merge(garageFloors), m.pitLane));
    }
  }

  // Main grandstand opposite the pits, along the straight before the line.
  const stands = [];
  const roofs = [];
  const outside = circuit.clockwise ? -1 : 1;
  for (let share = 0.93; share < 0.995; share += 0.006) {
    const pose = poseAt(circuit, share);
    const base = HALF + 14;
    for (let tier = 0; tier < 6; tier += 1) {
      const step = new THREE.BoxGeometry(14, 1.2, 2.2);
      step.rotateY(-pose.heading);
      const d = base + tier * 2.1;
      step.translate(pose.x - Math.sin(pose.heading) * outside * d, 0.6 + tier * 1.2, pose.y + Math.cos(pose.heading) * outside * d);
      stands.push(step);
    }
    const roof = new THREE.BoxGeometry(14, 0.3, 14);
    roof.rotateY(-pose.heading);
    const d = base + 6;
    roof.translate(pose.x - Math.sin(pose.heading) * outside * d, 9.5, pose.y + Math.cos(pose.heading) * outside * d);
    roofs.push(roof);
  }
  if (stands.length) {
    m.crowd.map.repeat.set(1, 1);
    group.add(meshOf(merge(stands), m.crowd, { shadow: true }));
    group.add(meshOf(merge(roofs), m.steel, { shadow: true }));
  }

  // Start gantry with its five lights.
  const line = poseAt(circuit, 0.0005);
  const gantry = new THREE.Group();
  const span = HALF * 2 + 4;
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 0.5), m.steel);
    post.position.set(0, 3.75, side * (span / 2));
    gantry.add(post);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, span), m.steel);
  beam.position.set(0, 7, 0);
  gantry.add(beam);
  const lights = [];
  for (let i = 0; i < 5; i += 1) {
    [-1, 1].forEach((face) => {
      const light = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), m.lightOff);
      light.position.set(face * 0.41, 7, (i - 2) * 0.8);
      light.rotation.y = face * Math.PI / 2;
      gantry.add(light);
      lights.push({ mesh: light, index: i });
    });
  }
  gantry.position.set(line.x, 0, line.y);
  gantry.rotation.y = -line.heading;
  group.add(gantry);

  // The country around it.
  group.add(vegetation(circuit, biome, { street: isStreet }));
  group.add(horizon(circuit, biome));
  if (biome.skyline || isStreet) group.add(skyline(circuit, biome));
  group.add(water(circuit, biome));
  group.add(skyDome(circuit, biome));
  if (biome.night) group.add(floodlights(circuit));

  /** Light and air for the place, the time of day and the weather. */
  const applyWeather = (state, wet) => {
    const haze = new THREE.Color(wet ? (biome.night ? "#10141e" : "#8e98a3") : biome.haze);
    state.scene.background = haze;
    state.scene.fog = new THREE.Fog(haze, wet ? 160 : 320, wet ? 900 : biome.night ? 1500 : 2200);
    if (biome.night) {
      // Floodlit: bright, cool and from above, the sky black beyond.
      state.sun.color.set("#e8eeff");
      state.sun.intensity = wet ? 1.5 : 2;
      state.hemi.color.set("#a9b8e8");
      state.hemi.groundColor.set("#1d2230");
      state.hemi.intensity = 1.05;
      state.scene.environmentIntensity = 0.4;
    } else {
      state.sun.color.set(wet ? "#dfe5ee" : biome.warm);
      state.sun.intensity = wet ? biome.sun * 0.45 : biome.sun;
      state.hemi.color.set(wet ? "#b6c0cc" : "#cfe4ff");
      state.hemi.groundColor.set(biome.sand ? "#8a7550" : "#4b5a3a");
      state.hemi.intensity = wet ? 1.3 : 1.1;
      state.scene.environmentIntensity = 0.55;
    }
  };

  return {
    group,
    lights,
    biome,
    applyWeather,
    setLights: (count) => {
      lights.forEach((light) => {
        light.mesh.material = light.index < count ? m.lightOn : m.lightOff;
      });
    },
    setWet: (wet) => {
      m.asphalt.roughness = wet ? 0.18 : 0.82;
      m.asphalt.color.set(wet ? "#7d8796" : "#ffffff");
      m.asphalt.metalness = wet ? 0.35 : 0.05;
    },
  };
};

/** Trackside TV camera positions: outside the road every so often, a little above it. */
export const tvCameras = (circuit) => {
  const cameras = [];
  const count = Math.max(10, Math.round(circuit.length / 220));
  for (let i = 0; i < count; i += 1) {
    const share = i / count;
    const pose = poseAt(circuit, share);
    const corner = circuit.corners.find((item) => Math.abs(item.apex - share) < 0.03);
    const outside = corner ? -(corner.sign || 1) : i % 2 ? 1 : -1;
    const distance = 34 + (i % 3) * 8;
    cameras.push({ share, x: pose.x - Math.sin(pose.heading) * outside * distance, z: pose.y + Math.cos(pose.heading) * outside * distance, y: 6 + (i % 4) * 2.5 });
  }
  return cameras;
};

export { offsetSpan };
