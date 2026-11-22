/**
 * Formula 1 cars in 3D, built from the rules of their era.
 *
 * Every car is generated from a specification: wheelbase and tracks from the
 * real cars that defined each era (Maserati 250F, Lotus 25, Lotus 49, Lotus 72,
 * Lotus 79, McLaren MP4/4, Williams FW14B and on), and the shapes the technical
 * regulations allowed or forced:
 *
 *   1950-57  front-engined, wire wheels, driver sat high behind a long bonnet
 *   1958-67  rear-engined "cigars": slim tub, exposed engine, roll hoop
 *   1968-69  the first wings, high on struts above the rear wheels
 *   1970-77  wedge noses, full-width front wings, airboxes (tall ones banned
 *            from 1976), radiators moved into sidepods
 *   1978-82  ground-effect wing cars: sidepods the length of the car, skirts
 *   1983-88  flat bottoms (1983), turbo cars with no airbox, 2150 mm wide,
 *            1500 mm front wings, big three-element rear wings
 *   1989-97  atmospheric engines and the airbox back; raised noses (1991);
 *            2000 mm wide and narrower rear tyres (1993); front wing 1400 mm
 *   1998-08  1800 mm narrow track, grooved tyres, bargeboards, winglets
 *            (2005-08), shark fins (2008)
 *   2009-13  1800 mm front wing low, 750 mm tall rear wing, stepped noses
 *            (2012-13)
 *   2014-16  low "finger" noses, long hybrid cars
 *   2017-21  2000 mm wide again, wide tyres, swept wings; the halo from 2018
 *   2022-    ground effect, 18-inch wheels with covers, wheel-wake deflectors,
 *            a four-element front wing on the nose, rounded rear wing
 *
 * Space: x forward (nose +x), y up, z to the right, metres, the car's centre
 * between the axles at the origin. Parts are merged per material so a car is
 * a few draw calls; the wheels stay separate so they can turn and steer.
 */

import * as THREE from "three";
import { merge, rod, tyre } from "./geometry";
import { bodyGeometry, carSpec, eraOf, markings } from "./carBody";

export { carSpec, eraOf };

// ---------------------------------------------------------------- livery

const shadeHex = (hex, amount) => {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amount)));
  return `#${c.getHexString()}`;
};

const luminance = (hex) => {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};

/**
 * The paint as a texture laid along the car: the base colour, a darker belly,
 * a second-colour flash down the flanks and a spine on top, the team name on
 * the engine cover and, in the eras that carried them, a white number roundel.
 */
const liveryTexture = ({ color, color2, name, number, era }) => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const g = canvas.getContext("2d");
  const second = color2 && color2.toLowerCase() !== color.toLowerCase() ? color2 : shadeHex(color, luminance(color) > 0.5 ? -0.35 : 0.25);
  // Rows map to height above the ground (v = (y - 0.05) / 1.0, row 0 at the top):
  // a 1 m car, so row = 512 * (1 - (y - 0.05)).
  const row = (y) => 512 * (1 - (y - 0.05));
  g.fillStyle = color;
  g.fillRect(0, 0, 1024, 512);
  // Belly: below the floor line, darker, the carbon showing through.
  const belly = g.createLinearGradient(0, row(0.2), 0, 512);
  belly.addColorStop(0, "rgba(0,0,0,0)");
  belly.addColorStop(1, "rgba(0,0,0,0.6)");
  g.fillStyle = belly;
  g.fillRect(0, row(0.2), 1024, 512 - row(0.2));
  // Flank flash: a swept band low on the sides, from the nose back along the sidepods.
  g.fillStyle = second;
  g.beginPath();
  g.moveTo(1024, row(0.3));
  g.lineTo(640, row(0.31));
  g.lineTo(360, row(0.24));
  g.lineTo(60, row(0.24));
  g.lineTo(60, row(0.19));
  g.lineTo(380, row(0.19));
  g.lineTo(660, row(0.26));
  g.lineTo(1024, row(0.25));
  g.closePath();
  g.fill();
  // Spine: the very top of the airbox and engine cover.
  g.fillRect(0, 0, 1024, row(0.9));
  // Team name on the sidepod flank, a smaller mark on the nose.
  const ink = luminance(color) > 0.55 ? "#111318" : "#f6f4ee";
  g.fillStyle = ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "900 46px Archivo, 'Arial Black', Arial, sans-serif";
  g.fillText((name || "").toUpperCase().slice(0, 14), era === "front" ? 300 : 420, row(0.36));
  g.font = "700 22px Arial, sans-serif";
  g.globalAlpha = 0.85;
  g.fillText("OVERCUT", 820, row(0.24));
  g.globalAlpha = 1;
  if (number) {
    const x = era === "front" ? 760 : 850;
    g.fillStyle = "#f6f4ee";
    g.beginPath();
    g.arc(x, row(era === "front" ? 0.5 : 0.36), 38, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#111318";
    g.font = "900 46px Arial, sans-serif";
    g.fillText(String(number), x, row(era === "front" ? 0.5 : 0.36) + 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

/** Carbon fibre: a 2x2 twill of dark tows, shared by every car. */
let weave = null;
const carbonWeave = () => {
  if (weave || typeof document === "undefined") return weave;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  for (let i = 0; i < 8; i += 1) {
    for (let j = 0; j < 8; j += 1) {
      const over = (i + j) % 4 < 2;
      const grad = over ? g.createLinearGradient(i * 8, 0, i * 8 + 8, 0) : g.createLinearGradient(0, j * 8, 0, j * 8 + 8);
      grad.addColorStop(0, "#15171b");
      grad.addColorStop(0.5, over ? "#2c3038" : "#262a31");
      grad.addColorStop(1, "#15171b");
      g.fillStyle = grad;
      g.fillRect(i * 8, j * 8, 8, 8);
    }
  }
  weave = new THREE.CanvasTexture(canvas);
  weave.colorSpace = THREE.SRGBColorSpace;
  weave.wrapS = THREE.RepeatWrapping;
  weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(24, 24);
  weave.anisotropy = 4;
  return weave;
};

const materialCache = new Map();

/** The materials of one team's car. Cached: twenty cars share eleven liveries. */
export const liveryMaterials = ({ color = "#c8102e", color2, name = "", number = null, year = 2024 }) => {
  const era = eraOf(year);
  const key = `${color}|${color2}|${name}|${number}|${era}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const map = liveryTexture({ color, color2, name, number, era });
  const second = color2 && color2.toLowerCase() !== color.toLowerCase() ? color2 : shadeHex(color, luminance(color) > 0.5 ? -0.35 : 0.25);
  const modern = year >= 1983;
  const materials = {
    paint: new THREE.MeshPhysicalMaterial({ color: map ? "#ffffff" : color, map, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide }),
    trim: new THREE.MeshPhysicalMaterial({ color: second, roughness: 0.38, metalness: 0.1, clearcoat: 0.6, side: THREE.DoubleSide }),
    carbon: new THREE.MeshPhysicalMaterial({ color: modern ? "#ffffff" : "#2a2c30", map: modern ? carbonWeave() : null, roughness: 0.42, metalness: 0.2, clearcoat: modern ? 0.7 : 0, clearcoatRoughness: 0.2, side: THREE.DoubleSide }),
    tyre: new THREE.MeshStandardMaterial({ color: "#141416", roughness: 0.92, metalness: 0 }),
    rim: new THREE.MeshStandardMaterial({ color: year < 1970 ? "#c9ccd1" : year < 2009 ? "#9aa0a8" : "#2b2f36", roughness: 0.3, metalness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ color: "#a8adb5", roughness: 0.28, metalness: 0.95 }),
    black: new THREE.MeshStandardMaterial({ color: "#07080a", roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide }),
    helmet: new THREE.MeshPhysicalMaterial({ color: "#f3f1e9", roughness: 0.25, clearcoat: 1 }),
    visor: new THREE.MeshPhysicalMaterial({ color: "#101418", roughness: 0.05, metalness: 0.6, clearcoat: 1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#d8e6ef", roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    halo: new THREE.MeshStandardMaterial({ color: "#7d838c", roughness: 0.35, metalness: 0.85 }),
    light: new THREE.MeshStandardMaterial({ color: "#ff2a1a", emissive: "#ff1a0a", emissiveIntensity: 1.6 }),
    suit: new THREE.MeshStandardMaterial({ color: era === "front" || era === "cigar" ? "#c9c4b4" : color, roughness: 0.85 }),
  };
  materialCache.set(key, materials);
  return materials;
};

/** Compound colours, for the sidewall band. */
export const COMPOUND_COLORS = { soft: "#e10600", medium: "#ffd400", hard: "#f3f1e9", inter: "#43b02a", wet: "#2f8fdd", dry: "#e8e4d8" };

/** Who made the tyres, by season - the name moulded on the sidewall. */
export const tyreSupplier = (year) =>
  year < 1959 ? "PIRELLI" : year < 1967 ? "DUNLOP" : year < 1975 ? "FIRESTONE" : year < 1998 ? "GOODYEAR" : year < 2011 ? "BRIDGESTONE" : "PIRELLI";

const bandMaterials = new Map();

/**
 * The sidewall: the supplier's name round the tyre twice, in the compound's
 * colour in the Pirelli years (as the real ones are marked), white before, with
 * a coloured stripe from 2007 when compounds became visible to the public.
 */
const bandMaterial = (compound, year = 2024) => {
  const color = COMPOUND_COLORS[compound] || "#e8e4d8";
  const supplier = tyreSupplier(year);
  const coloured = year >= 2007;
  const key = `${supplier}|${coloured ? color : "plain"}`;
  if (bandMaterials.has(key)) return bandMaterials.get(key);
  let material;
  if (typeof document === "undefined") material = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  else {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const g = canvas.getContext("2d");
    g.translate(256, 256);
    // Ring geometry maps planar uvs over its outer square: radius 256 is the tyre's outer edge.
    if (coloured) {
      g.strokeStyle = color;
      g.lineWidth = 9;
      g.beginPath();
      g.arc(0, 0, 228, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = coloured && supplier === "PIRELLI" ? color : "#f1f1ee";
    g.font = "900 34px Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const label = supplier === "PIRELLI" && year >= 2011 ? "P ZERO · PIRELLI" : supplier;
    [0, Math.PI].forEach((offset) => {
      const letters = label.split("");
      const spread = Math.min(Math.PI * 0.85, letters.length * 0.105);
      letters.forEach((letter, index) => {
        const angle = offset - spread / 2 + (spread * (index + 0.5)) / letters.length - Math.PI / 2;
        g.save();
        g.rotate(angle + Math.PI / 2);
        g.fillText(letter, 0, -196);
        g.restore();
      });
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.7, depthWrite: false });
  }
  material.userData.shared = true;
  bandMaterials.set(key, material);
  return material;
};

/** A flat decal: text on a transparent canvas, cached by content. */
const decalMaterials = new Map();
const decalMaterial = (text, { fg = "#ffffff", bg = null, width = 512, height = 96, font = "900 64px Arial, sans-serif" } = {}) => {
  const key = `${text}|${fg}|${bg}|${width}|${height}`;
  if (decalMaterials.has(key)) return decalMaterials.get(key);
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, width, height);
  }
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let size = parseInt(font.match(/(\d+)px/)?.[1] || "64", 10);
  while (g.measureText(text).width > width * 0.92 && size > 12) {
    size -= 4;
    g.font = font.replace(/\d+px/, `${size}px`);
  }
  g.fillText(text, width / 2, height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.FrontSide });
  material.userData.shared = true;
  decalMaterials.set(key, material);
  return material;
};

/** A plane laid out by its basis: `right` is where the text runs, `up` the text's up, `normal` where it faces. */
const decalPlane = (width, height, right, up, normal, position) => {
  const geometry = new THREE.PlaneGeometry(width, height);
  const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(...right), new THREE.Vector3(...up), new THREE.Vector3(...normal));
  geometry.applyMatrix4(basis);
  geometry.translate(...position);
  return geometry;
};

// ------------------------------------------------------------- the build

/** Geometry is cached per era and season: every car of a year shares it. */
const geometryCache = new Map();

/** A wheel: tyre, rim and (by era) wire spokes, cast spokes or a flat cover. Axle along z. */
const wheelGeometry = (t, spec) => {
  const parts = { tyre: [], rim: [], carbon: [], dark: [] };
  parts.tyre.push(tyre({ r: t.r, w: t.w, rim: t.rim, segments: 48 }));
  // Grooves of the 1998-2008 tyres.
  if (t.grooves) {
    for (let i = 0; i < t.grooves; i += 1) {
      const z = -t.w / 2 + (t.w * (i + 1)) / (t.grooves + 1);
      const ring = new THREE.TorusGeometry(t.r - 0.002, 0.005, 4, 48);
      ring.translate(0, 0, z);
      parts.dark.push(ring);
    }
  }
  // Rim barrel and the lip at the outer face.
  const barrel = new THREE.CylinderGeometry(t.rim, t.rim, t.w * 0.9, 32, 1, true);
  barrel.rotateX(Math.PI / 2);
  parts.rim.push(barrel);
  [-1, 1].forEach((side) => {
    const lip = new THREE.TorusGeometry(t.rim, 0.008, 6, 40);
    lip.translate(0, 0, side * t.w * 0.45);
    parts.rim.push(lip);
  });
  const face = t.w * 0.4;
  const nut = (z) => {
    const hub = new THREE.CylinderGeometry(0.035, 0.045, 0.06, 6);
    hub.rotateX(Math.PI / 2);
    hub.translate(0, 0, z);
    return hub;
  };
  if (spec.wheel === "cover") {
    // 2022-: 18-inch rims under a slightly dished carbon cover, the nut showing.
    [-1, 1].forEach((side) => {
      // A shallow dish: flush with the rim lip at the edge, sunk 25 mm at the hub.
      const dish = new THREE.LatheGeometry([new THREE.Vector2(0.05, -0.025), new THREE.Vector2(t.rim * 0.6, -0.012), new THREE.Vector2(t.rim * 0.99, 0)], 40);
      dish.rotateX(side > 0 ? Math.PI / 2 : -Math.PI / 2);
      dish.translate(0, 0, side * t.w * 0.45);
      parts.carbon.push(dish);
      parts.rim.push(nut(side * (t.w * 0.44 + 0.01)));
    });
  } else if (spec.wheel === "wire") {
    // 1950s: laced wire wheels with a knock-off spinner.
    for (let i = 0; i < 32; i += 1) {
      const a = (i / 32) * Math.PI * 2;
      const z = (i % 2 ? 1 : -1) * t.w * 0.22;
      parts.rim.push(rod([0, 0, z * 1.5], [Math.cos(a) * t.rim, Math.sin(a) * t.rim, z * 0.5], 0.003, 3));
    }
    const hub = new THREE.CylinderGeometry(0.05, 0.06, t.w * 0.8, 10);
    hub.rotateX(Math.PI / 2);
    parts.rim.push(hub);
    [-1, 1].forEach((side) => {
      [0, Math.PI / 2].forEach((turn) => parts.rim.push(new THREE.BoxGeometry(0.16, 0.022, 0.02).rotateZ(Math.PI / 4 + turn).translate(0, 0, side * t.w * 0.42)));
    });
  } else {
    // Cast magnesium (1960s-90s, few wide spokes) or machined (1998-2021, ten thin ones), behind them the brake disc.
    const count = spec.wheel === "machined" ? 10 : spec.spokes || 6;
    const width = spec.wheel === "machined" ? 0.022 : (Math.PI * t.rim) / count * 0.55;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2;
        const spoke = new THREE.BoxGeometry(t.rim * 0.9, width, 0.018);
        spoke.translate(t.rim * 0.5, 0, 0);
        spoke.rotateZ(a);
        spoke.translate(0, 0, side * face);
        parts.rim.push(spoke);
      }
      parts.rim.push(nut(side * (face + 0.02)));
      const disc = new THREE.CylinderGeometry(t.rim * 0.82, t.rim * 0.82, 0.03, 32);
      disc.rotateX(Math.PI / 2);
      disc.translate(0, 0, side * face * 0.4);
      parts.dark.push(disc);
    });
  }
  // A compound-coloured band on the sidewall, both faces.
  const bands = [-1, 1].map((side) => {
    const ring = new THREE.RingGeometry(t.rim * 1.05, t.r * 0.985, 64);
    if (side < 0) ring.rotateY(Math.PI);
    ring.translate(0, 0, side * (t.w / 2 + 0.001));
    return ring;
  });
  return { tyre: merge(parts.tyre), rim: merge(parts.rim), carbon: merge(parts.carbon), dark: merge(parts.dark), band: merge(bands) };
};

/** The driver's helmet: shell, visor (open face with goggles before 1970) and a stripe. */
const helmetGeometry = (spec) => {
  const [hx, hy] = spec.head;
  const shell = new THREE.SphereGeometry(0.135, 28, 20);
  shell.scale(1.1, 1, 0.95);
  shell.translate(hx, hy, 0);
  const open = spec.year < 1970;
  const visor = open ? new THREE.TorusGeometry(0.1, 0.022, 6, 20, Math.PI) : new THREE.SphereGeometry(0.138, 24, 8, -0.95, 1.9, 1.2, 0.45);
  if (open) {
    visor.rotateZ(Math.PI / 2);
    visor.rotateY(Math.PI / 2);
    visor.scale(1, 0.4, 1.2);
    visor.translate(hx + 0.07, hy - 0.01, 0);
  } else {
    visor.rotateY(Math.PI / 2);
    visor.translate(hx, hy, 0);
  }
  const stripe = new THREE.TorusGeometry(0.128, 0.02, 8, 32);
  stripe.rotateX(Math.PI / 2);
  stripe.scale(1.08, 1, 0.96);
  stripe.translate(hx - 0.01, hy + 0.045, 0);
  return { shell, visor, stripe };
};

const geometryFor = (year) => {
  const spec = carSpec(year);
  const key = `${spec.era}|${year}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, {
      spec,
      body: bodyGeometry(spec),
      helmet: helmetGeometry(spec),
      front: wheelGeometry(spec.tf, spec),
      rear: wheelGeometry(spec.tr, spec),
    });
  }
  return geometryCache.get(key);
};

/**
 * A complete car for a season and a livery. Returns a THREE.Group with
 * `userData.wheels` (four pivots that spin about z; the front two also steer
 * about y) and `userData.setCompound(compound)`.
 */
export const buildCar = ({ year = 2024, color = "#c8102e", color2, name = "", number = null, compound = null, shadows = true, tcam = "#111318" }) => {
  const { spec, body, helmet, front, rear } = geometryFor(year);
  const m = liveryMaterials({ color, color2, name, number, year });
  const car = new THREE.Group();
  car.name = "car";
  const add = (geometry, material) => {
    if (!geometry) return null;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = false;
    car.add(mesh);
    return mesh;
  };
  add(body.paint, m.paint);
  add(body.trim, m.trim);
  add(body.carbon, m.carbon);
  add(body.black, m.black);
  add(body.metal, m.metal);
  add(body.glass, m.glass);
  add(body.halo, spec.year >= 2019 ? m.carbon : m.halo);
  add(body.light, m.light);
  add(body.belt, m.suit);
  add(helmet.shell, m.helmet);
  add(helmet.visor, m.visor);
  add(helmet.stripe, m.trim);

  // Decals: the team's name on the rear wing (where the cameras behind see it)
  // and on the endplates, the number on the nose, the T-camera on the airbox.
  const second = color2 && color2.toLowerCase() !== color.toLowerCase() ? color2 : null;
  const ink = (hex) => (new THREE.Color(hex).getHSL({}).l > 0.6 ? "#111318" : "#ffffff");
  const label = (name || "").toUpperCase().slice(0, 16);
  const decal = (geometry, material) => {
    if (!geometry || !material) return;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 2;
    car.add(mesh);
  };
  if (label && spec.rw) {
    const rw = spec.rw;
    const panel = second || color;
    decal(decalPlane(rw.span * 0.86, 0.11, [0, 0, 1], [0, 1, 0], [-1, 0, 0], [rw.x - rw.chord * 0.62, rw.y - 0.075, 0]), decalMaterial(label, { fg: ink(panel), bg: panel }));
    if (rw.plate) {
      [-1, 1].forEach((side) => {
        decal(
          decalPlane(rw.plate[0] * 0.8, rw.plate[1] * 0.32, side > 0 ? [1, 0, 0] : [-1, 0, 0], [0, 1, 0], [0, 0, side], [rw.x + rw.chord * 0.55 - rw.plate[0] * 0.5, rw.y - rw.plate[1] * 0.5, side * (rw.span / 2 + 0.012)]),
          decalMaterial(label, { fg: "#ffffff" }),
        );
      });
    }
  }
  if (label && spec.highWing) {
    const hw = spec.highWing;
    decal(decalPlane(hw.span * 0.85, 0.14, [0, 0, 1], [0, 1, 0], [-1, 0, 0], [hw.x - hw.chord * 0.4, hw.y + 0.02, 0]), decalMaterial(label, { fg: ink(second || color), bg: second || color }));
  }
  const marks = markings(spec);
  if (number !== null && number !== undefined) {
    if (spec.numberNose || spec.numberSide) {
      decal(decalPlane(0.2, 0.2, [0, 0, 1], [1, 0, 0], [0, 1, 0], [marks.number[0], marks.number[1], 0]), decalMaterial(String(number), { fg: "#111318", bg: spec.numberSide ? "#f6f4ee" : null, width: 128, height: 128, font: "900 96px Arial, sans-serif" }));
    }
  }
  if (spec.tcam && marks.tcam) {
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.12), new THREE.MeshStandardMaterial({ color: tcam, roughness: 0.4 }));
    cam.position.set(marks.tcam[0], marks.tcam[1] + 0.06, 0);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.02), m.carbon);
    post.position.set(marks.tcam[0], marks.tcam[1] + 0.025, 0);
    car.add(cam, post);
  }

  const wheels = [];
  const bands = [];
  [
    [spec.front, spec.ft, spec.tf, front, true],
    [spec.rear, spec.rt, spec.tr, rear, false],
  ].forEach(([x, track, t, geometry, steer]) => {
    [-1, 1].forEach((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, t.r, side * (track / 2));
      const spin = new THREE.Group();
      pivot.add(spin);
      const tyreMesh = new THREE.Mesh(geometry.tyre, m.tyre);
      tyreMesh.castShadow = shadows;
      spin.add(tyreMesh);
      if (geometry.rim) spin.add(new THREE.Mesh(geometry.rim, m.rim));
      if (geometry.carbon) spin.add(new THREE.Mesh(geometry.carbon, m.carbon));
      if (geometry.dark) spin.add(new THREE.Mesh(geometry.dark, m.black));
      const band = new THREE.Mesh(geometry.band, bandMaterial(compound, year));
      spin.add(band);
      bands.push(band);
      car.add(pivot);
      wheels.push({ pivot, spin, steer, radius: t.r });
    });
  });
  car.userData.wheels = wheels;
  car.userData.spec = spec;
  car.userData.setCompound = (next) => {
    bands.forEach((band) => {
      band.material = bandMaterial(next, year);
    });
  };
  return car;
};
