/**
 * Scenery: everything around the circuit that tells you where in the world
 * you are, built from the venue's biome (see biomes.js).
 *
 *   groundMaterials   grass mown in stripes, dry grass, sand or tropical
 *                     green, with gravel the colour of the local earth
 *   vegetation        pines, broadleaves, palms, cypresses or scrub, in the
 *                     mix and density the place has, never on the track
 *   horizon           hills, wooded ridges, snow-capped mountains, dunes or a
 *                     volcano, far enough out to sit in the haze
 *   skyline           blocks of buildings round city circuits, lit at night
 *   water             sea or harbour along one side, a lake or river nearby
 *   sky               a gradient dome in the biome's colours
 *   floodlights       towers along the track for the night races
 */

import * as THREE from "three";
import { merge } from "./geometry";

const rng = (seed) => {
  let value = Math.abs(Math.round(seed)) % 2147483647 || 1;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const texture = (width, height, draw, repeat) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  if (repeat) map.repeat.set(repeat, repeat);
  return map;
};

const speckle = (g, w, h, base, alt, count, seed, size = 2) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const random = rng(seed);
  for (let i = 0; i < count; i += 1) {
    g.fillStyle = random() > 0.5 ? alt : `rgba(0,0,0,${0.05 + random() * 0.12})`;
    g.globalAlpha = 0.25 + random() * 0.5;
    g.fillRect(random() * w, random() * h, size, size);
  }
  g.globalAlpha = 1;
};

/** Ground and gravel for a biome. Sand gets wind ripples instead of mowing stripes. */
export const groundMaterials = (biome, size) => {
  const ground = texture(512, 512, (g, w, h) => {
    speckle(g, w, h, biome.ground, biome.groundAlt, 14000, 11, 2);
    if (biome.sand) {
      g.strokeStyle = "rgba(255,255,255,0.08)";
      for (let y = 0; y < h; y += 14) {
        g.beginPath();
        for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin((x + y) * 0.05) * 4);
        g.stroke();
      }
    } else {
      for (let i = 0; i < 8; i += 2) {
        g.fillStyle = "rgba(255,255,255,0.05)";
        g.fillRect((i * w) / 8, 0, w / 8, h);
      }
    }
  });
  ground.repeat.set(size / 40, size / 40);
  const gravel = texture(256, 256, (g, w, h) => speckle(g, w, h, biome.runoff, "#f2e8d0", 16000, 5, 2));
  return {
    ground: new THREE.MeshStandardMaterial({ map: ground, roughness: biome.sand ? 1 : 0.95 }),
    gravel: new THREE.MeshStandardMaterial({ map: gravel, roughness: 1 }),
  };
};

const TREE_GREENS = {
  pine: ["#24452a", "#2d5531", "#1f3d26"],
  broad: ["#3d6b2f", "#4b7a35", "#557f3a", "#35602c"],
  palm: ["#4e7a2e", "#5d8a35", "#46702a"],
  cypress: ["#253f25", "#2c4a2a"],
  shrub: ["#6c7a3e", "#7d8a48", "#5d6a36"],
};

/** Geometry for each kind of tree: trunk and crown merged, crown coloured per instance. */
const treeGeometry = (kind) => {
  const parts = [];
  if (kind === "pine") {
    const trunk = new THREE.CylinderGeometry(0.25, 0.4, 3, 6);
    trunk.translate(0, 1.5, 0);
    [[3.3, 5, 5.5], [2.6, 4.4, 8.4], [1.8, 3.6, 11]].forEach(([r, hgt, y]) => {
      const tier = new THREE.ConeGeometry(r, hgt, 9);
      tier.translate(0, y, 0);
      parts.push(tier);
    });
    return { trunk, crown: merge(parts) };
  }
  if (kind === "cypress") {
    const trunk = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
    trunk.translate(0, 1, 0);
    const crown = new THREE.SphereGeometry(1, 10, 10);
    crown.scale(1.3, 6.5, 1.3);
    crown.translate(0, 7.5, 0);
    return { trunk, crown };
  }
  if (kind === "palm") {
    // A slightly leaning trunk and a crown of drooping fronds.
    const trunk = new THREE.CylinderGeometry(0.22, 0.32, 9, 7);
    trunk.translate(0, 4.5, 0);
    trunk.rotateZ(0.08);
    for (let i = 0; i < 9; i += 1) {
      const frond = new THREE.ConeGeometry(0.55, 4.2, 4);
      frond.rotateX(Math.PI / 2);
      frond.translate(0, 0, 2.1);
      frond.rotateX(0.55);
      frond.rotateY((i / 9) * Math.PI * 2);
      frond.translate(0.7, 9.1, 0);
      parts.push(frond);
    }
    return { trunk, crown: merge(parts) };
  }
  if (kind === "shrub") {
    const trunk = new THREE.CylinderGeometry(0.05, 0.08, 0.4, 4);
    trunk.translate(0, 0.2, 0);
    const crown = new THREE.IcosahedronGeometry(1.2, 0);
    crown.scale(1.3, 0.75, 1.1);
    crown.translate(0, 0.9, 0);
    return { trunk, crown };
  }
  const trunk = new THREE.CylinderGeometry(0.3, 0.5, 4, 6);
  trunk.translate(0, 2, 0);
  [[0, 7, 0, 3.4], [1.6, 6.2, 0.8, 2.4], [-1.4, 6.4, -0.6, 2.5]].forEach(([x, y, z, r]) => {
    const blob = new THREE.IcosahedronGeometry(r, 1);
    blob.translate(x, y, z);
    parts.push(blob);
  });
  return { trunk, crown: merge(parts) };
};

/** Trees and scrub around the circuit, in the biome's mix. */
export const vegetation = (circuit, biome, { street = false } = {}) => {
  const group = new THREE.Group();
  const { box } = circuit;
  const P = circuit.points;
  const random = rng(Math.round(circuit.length) + 3);
  const tooClose = (x, z, gap) => {
    for (let i = 0; i < P.length; i += 5) {
      const dx = P[i].x - x;
      const dz = P[i].y - z;
      if (dx * dx + dz * dz < gap * gap) return true;
    }
    return false;
  };
  const count = Math.round((street ? 90 : 520) * biome.density);
  const kinds = Object.entries(biome.trees);
  const pick = () => {
    let roll = random() * kinds.reduce((sum, [, w]) => sum + w, 0);
    for (const [kind, weight] of kinds) {
      roll -= weight;
      if (roll <= 0) return kind;
    }
    return kinds[0][0];
  };
  const spots = {};
  for (let attempt = 0; attempt < count * 4 && Object.values(spots).reduce((s, list) => s + list.length, 0) < count; attempt += 1) {
    const kind = pick();
    const x = box.minX - 320 + random() * (box.maxX - box.minX + 640);
    const z = box.minY - 320 + random() * (box.maxY - box.minY + 640);
    if (tooClose(x, z, kind === "shrub" ? 36 : 52)) continue;
    (spots[kind] = spots[kind] || []).push([x, z, 0.75 + random() * 0.7, random() * Math.PI * 2]);
  }
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#5a4632", roughness: 1 });
  Object.entries(spots).forEach(([kind, list]) => {
    const { trunk, crown } = treeGeometry(kind);
    const trunks = new THREE.InstancedMesh(trunk, kind === "palm" ? new THREE.MeshStandardMaterial({ color: "#8a7356", roughness: 1 }) : trunkMaterial, list.length);
    const crowns = new THREE.InstancedMesh(crown, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), list.length);
    const matrix = new THREE.Matrix4();
    const colour = new THREE.Color();
    const greens = TREE_GREENS[kind] || TREE_GREENS.broad;
    list.forEach(([x, z, s, turn], i) => {
      matrix.makeRotationY(turn);
      matrix.scale(new THREE.Vector3(s, s * (0.9 + (i % 5) * 0.05), s));
      matrix.setPosition(x, 0, z);
      trunks.setMatrixAt(i, matrix);
      crowns.setMatrixAt(i, matrix);
      crowns.setColorAt(i, colour.set(greens[i % greens.length]));
    });
    crowns.castShadow = true;
    group.add(trunks, crowns);
  });
  return group;
};

/** The far distance: hills, ridges, mountains with snow, dunes or a volcano. */
export const horizon = (circuit, biome) => {
  const group = new THREE.Group();
  const { box } = circuit;
  const cx = (box.minX + box.maxX) / 2;
  const cz = (box.minY + box.maxY) / 2;
  const random = rng(Math.round(circuit.length) + 7);
  const kind = biome.horizon;
  if (kind === "none") return group;
  const rock = [];
  const snow = [];
  const count = kind === "mountains" ? 30 : 46;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + random() * 0.1;
    const radius = 1900 + random() * 600;
    const x = cx + Math.cos(angle) * radius;
    const z = cz + Math.sin(angle) * radius;
    if (kind === "mountains") {
      const height = 280 + random() * 420;
      const base = 300 + random() * 260;
      const peak = new THREE.ConeGeometry(base, height, 7);
      peak.translate(x, height / 2 - 10, z);
      rock.push(peak);
      if (biome.snow) {
        const cap = new THREE.ConeGeometry(base * 0.3, height * 0.3, 7);
        cap.translate(x, height * 0.85 - 10, z);
        snow.push(cap);
      }
    } else {
      const hill = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const tall = kind === "dunes" ? 25 + random() * 45 : kind === "woods" ? 80 + random() * 110 : 50 + random() * 120;
      hill.scale(260 + random() * 340, tall, 220 + random() * 300);
      hill.translate(x, -5, z);
      rock.push(hill);
    }
  }
  if (kind === "volcano") {
    // Fuji: one great cone behind the circuit, white at the top.
    const angle = random() * Math.PI * 2;
    const x = cx + Math.cos(angle) * 2600;
    const z = cz + Math.sin(angle) * 2600;
    const cone = new THREE.CylinderGeometry(120, 1300, 900, 24, 1, true);
    cone.translate(x, 440, z);
    rock.push(cone);
    const cap = new THREE.CylinderGeometry(118, 420, 300, 24, 1, true);
    cap.translate(x, 740, z);
    snow.push(cap);
  }
  if (rock.length) group.add(new THREE.Mesh(merge(rock), new THREE.MeshStandardMaterial({ color: biome.hillColor, roughness: 1, flatShading: true })));
  if (snow.length) group.add(new THREE.Mesh(merge(snow), new THREE.MeshStandardMaterial({ color: "#f4f6f8", roughness: 0.8, flatShading: true })));
  return group;
};

/** Blocks of buildings around a city circuit; their windows glow at night. */
export const skyline = (circuit, biome) => {
  const group = new THREE.Group();
  const { box } = circuit;
  const P = circuit.points;
  const random = rng(Math.round(circuit.length) + 19);
  const windows = texture(64, 128, (g, w, h) => {
    g.fillStyle = biome.night ? "#1a2030" : "#9aa4b0";
    g.fillRect(0, 0, w, h);
    for (let y = 4; y < h; y += 10) {
      for (let x = 4; x < w; x += 10) {
        g.fillStyle = biome.night ? (random() > 0.45 ? "#ffd98a" : "#2a3142") : random() > 0.5 ? "#5d7d9a" : "#7d93aa";
        g.fillRect(x, y, 6, 6);
      }
    }
  });
  const material = new THREE.MeshStandardMaterial({ map: windows, roughness: 0.6, emissive: biome.night ? "#ffffff" : "#000000", emissiveMap: biome.night ? windows : null, emissiveIntensity: biome.night ? 0.9 : 0 });
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);
  const blocks = [];
  const tooClose = (x, z) => {
    for (let i = 0; i < P.length; i += 5) {
      const dx = P[i].x - x;
      const dz = P[i].y - z;
      if (dx * dx + dz * dz < 70 * 70) return true;
    }
    return false;
  };
  for (let attempt = 0; attempt < 900 && blocks.length < 260; attempt += 1) {
    const x = box.minX - 500 + random() * (box.maxX - box.minX + 1000);
    const z = box.minY - 500 + random() * (box.maxY - box.minY + 1000);
    if (tooClose(x, z)) continue;
    blocks.push([x, z, 18 + random() * 30, 18 + random() * 30, 12 + random() * (random() > 0.9 ? 160 : 55)]);
  }
  const mesh = new THREE.InstancedMesh(geometry, material, blocks.length);
  const matrix = new THREE.Matrix4();
  blocks.forEach(([x, z, w, d, h], i) => {
    matrix.makeScale(w, h, d);
    matrix.setPosition(x, 0, z);
    mesh.setMatrixAt(i, matrix);
  });
  mesh.castShadow = true;
  group.add(mesh);
  return group;
};

/** Sea or harbour along one side of the circuit, or a lake / river close by. */
export const water = (circuit, biome) => {
  const group = new THREE.Group();
  if (!biome.water) return group;
  const { box } = circuit;
  const material = new THREE.MeshStandardMaterial({ color: biome.night ? "#0c1a2c" : "#2f6f9a", roughness: 0.12, metalness: 0.35 });
  if (biome.water === "sea" || biome.water === "harbour") {
    // The side of the box nearest the circuit's first corner faces the sea.
    const width = box.maxX - box.minX + 3000;
    const sea = new THREE.PlaneGeometry(width, 2600);
    sea.rotateX(-Math.PI / 2);
    sea.translate((box.minX + box.maxX) / 2, 0.05, box.minY - 110 - 1300);
    group.add(new THREE.Mesh(sea, material));
    if (biome.water === "harbour") {
      // Yachts at their moorings.
      const random = rng(Math.round(circuit.length) + 41);
      const hull = new THREE.BoxGeometry(14, 2.2, 4);
      hull.translate(0, 1.1, 0);
      const boats = new THREE.InstancedMesh(hull, new THREE.MeshStandardMaterial({ color: "#f2f2ee", roughness: 0.4 }), 40);
      const matrix = new THREE.Matrix4();
      for (let i = 0; i < 40; i += 1) {
        matrix.makeRotationY(Math.PI / 2 + (random() - 0.5) * 0.2);
        matrix.setPosition(box.minX + (i % 20) * 26 + random() * 6, 0.1, box.minY - 140 - Math.floor(i / 20) * 24);
        boats.setMatrixAt(i, matrix);
      }
      group.add(boats);
    }
  } else {
    const lake = new THREE.CircleGeometry(1, 40);
    lake.rotateX(-Math.PI / 2);
    lake.scale(biome.water === "river" ? 900 : 260, 1, biome.water === "river" ? 60 : 160);
    lake.translate((box.minX + box.maxX) / 2, 0.03, box.maxY + 260);
    group.add(new THREE.Mesh(lake, material));
  }
  return group;
};

/** The sky dome. */
export const skyDome = (circuit, biome) => {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const g = canvas.getContext("2d");
  const gradient = g.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, biome.sky[0]);
  gradient.addColorStop(0.42, biome.sky[1]);
  gradient.addColorStop(0.5, biome.sky[2]);
  gradient.addColorStop(1, biome.sky[2]);
  g.fillStyle = gradient;
  g.fillRect(0, 0, 4, 256);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const { box } = circuit;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3400, 32, 16), new THREE.MeshBasicMaterial({ map, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.position.set((box.minX + box.maxX) / 2, 0, (box.minY + box.maxY) / 2);
  dome.renderOrder = -1;
  return dome;
};

/** Floodlight towers along the track for night races. */
export const floodlights = (circuit) => {
  const group = new THREE.Group();
  const P = circuit.points;
  const H = circuit.heading;
  const poles = [];
  const heads = [];
  const step = Math.max(8, Math.round(140 / (circuit.length / P.length)));
  for (let i = 0; i < P.length; i += step) {
    // Not along the main straight, where the pits and grandstand stand.
    const share = i / P.length;
    if (share < 0.07 || share > 0.93) continue;
    const side = (i / step) % 2 ? 1 : -1;
    const d = 32;
    const x = P[i].x - Math.sin(H[i]) * side * d;
    const z = P[i].y + Math.cos(H[i]) * side * d;
    const pole = new THREE.CylinderGeometry(0.25, 0.35, 26, 6);
    pole.translate(x, 13, z);
    poles.push(pole);
    const head = new THREE.BoxGeometry(3, 1.4, 3);
    head.translate(x, 26.5, z);
    heads.push(head);
  }
  if (poles.length) {
    group.add(new THREE.Mesh(merge(poles), new THREE.MeshStandardMaterial({ color: "#5b6270", roughness: 0.6, metalness: 0.6 })));
    group.add(new THREE.Mesh(merge(heads), new THREE.MeshBasicMaterial({ color: "#fff6dc", toneMapped: false })));
  }
  return group;
};
