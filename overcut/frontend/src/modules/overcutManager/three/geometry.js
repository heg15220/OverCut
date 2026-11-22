/**
 * Geometry primitives for the procedural cars and circuits.
 *
 *   loft      a body skinned through superellipse cross-sections along the
 *             car's length - how a monocoque, a nose or a sidepod is shaped.
 *   airfoil   a cambered wing section extruded across a span, for wing
 *             elements, flaps and bargeboards.
 *   tyre      a tyre turned on a lathe from its cross-section: tread, shoulders
 *             and sidewalls, the way a real one is moulded.
 *   rod       a round bar between two points: wishbones, struts, pushrods.
 *   ribbon    a flat strip following a path at an offset: asphalt, lines,
 *             kerbs, run-off, walls.
 *
 * Car space: x forward (nose +x), y up, z to the car's right; metres.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const sign = (value) => (value < 0 ? -1 : 1);

/**
 * Skin a surface through cross-sections. Each section is
 * { x, w (half width), yb (bottom), yt (top), n (squareness: 2 = ellipse,
 * higher = boxier), z (centre offset, default 0) } and optionally
 * { nb (squareness of the lower half), wy (height of the widest point, 0 at
 * the bottom to 1 at the top, default 0.5), tw / bw (width at the top / the
 * bottom as a share of the widest: a tub's tumblehome, a sidepod's undercut) }.
 * Ends are capped unless `caps` says otherwise.
 */
export const loft = (sections, segments = 28, { planar = [0.05, 1.05], caps = [true, true] } = {}) => {
  const positions = [];
  const uvs = [];
  const indices = [];
  const xs = sections.map((section) => section.x);
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  sections.forEach((section) => {
    const a = Math.max(0.001, section.w);
    const waist = section.yb + (section.yt - section.yb) * (section.wy ?? 0.5);
    const n = section.n ?? 2.4;
    const nb = section.nb ?? n;
    const tw = section.tw ?? 1;
    const bw = section.bw ?? 1;
    const zc = section.z ?? 0;
    for (let k = 0; k <= segments; k += 1) {
      const t = (k / segments) * Math.PI * 2;
      const c = Math.cos(t);
      const s = Math.sin(t);
      const upper = s >= 0;
      const e = upper ? n : nb;
      const lift = Math.abs(s) ** (2 / e);
      const half = upper ? section.yt - waist : waist - section.yb;
      const narrow = 1 + ((upper ? tw : bw) - 1) * lift;
      const z = zc + a * narrow * sign(c) * Math.abs(c) ** (2 / e);
      const y = waist + Math.max(0.0005, half) * sign(s) * lift;
      positions.push(section.x, y, z);
      // Paint is projected from the side, like a livery drawn on a side view:
      // u along the car (mirrored on the left flank so lettering reads the same
      // way on both), v by height.
      const along = (section.x - xmin) / (xmax - xmin || 1);
      uvs.push(c >= 0 ? along : 1 - along, (y - planar[0]) / (planar[1] - planar[0]));
    }
  });
  const ring = segments + 1;
  for (let i = 0; i < sections.length - 1; i += 1) {
    for (let k = 0; k < segments; k += 1) {
      const a = i * ring + k;
      const b = (i + 1) * ring + k;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // Caps: a fan to the centre of the first and last section.
  [0, sections.length - 1].forEach((index, end) => {
    if (!caps[end]) return;
    const section = sections[index];
    const centre = positions.length / 3;
    positions.push(section.x, (section.yt + section.yb) / 2, section.z ?? 0);
    uvs.push(0.5, 0.5);
    for (let k = 0; k < segments; k += 1) {
      const a = index * ring + k;
      if (end === 0) indices.push(centre, a + 1, a);
      else indices.push(centre, a, a + 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/** Smoothly interpolate extra sections between the given ones (Catmull-Rom on every field). */
export const smoothSections = (sections, steps = 3) => {
  if (sections.length < 3) return sections;
  const keys = ["x", "w", "yb", "yt", "n", "z", "nb", "wy", "tw", "bw"];
  const fallback = { n: 2.4, wy: 0.5, tw: 1, bw: 1 };
  const out = [];
  for (let i = 0; i < sections.length - 1; i += 1) {
    const p0 = sections[Math.max(0, i - 1)];
    const p1 = sections[i];
    const p2 = sections[i + 1];
    const p3 = sections[Math.min(sections.length - 1, i + 2)];
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const point = {};
      keys.forEach((key) => {
        const def = (p) => p[key] ?? (key === "nb" ? p.n ?? 2.4 : fallback[key] ?? 0);
        const v0 = def(p0);
        const v1 = def(p1);
        const v2 = def(p2);
        const v3 = def(p3);
        point[key] = 0.5 * (2 * v1 + (-v0 + v2) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t * t + (-v0 + 3 * v1 - 3 * v2 + v3) * t * t * t);
      });
      point.w = Math.max(0.002, point.w);
      if (point.yt < point.yb + 0.004) point.yt = point.yb + 0.004;
      out.push(point);
    }
  }
  out.push(sections[sections.length - 1]);
  return out;
};

/**
 * A wing element: a cambered section of chord `c` and thickness ratio `t`,
 * pitched by `angle` (radians, nose up positive is more downforce here, so the
 * profile is inverted), extruded along z across `span`, centred.
 */
export const airfoil = ({ chord = 0.3, thickness = 0.1, camber = 0.06, angle = 0.12, span = 1, twistTips = 0 }) => {
  const points = [];
  const count = 14;
  // Upper and lower surfaces of an inverted (downforce) NACA-like section, leading edge at +x.
  const surface = (sideSign) => {
    for (let i = 0; i <= count; i += 1) {
      const xr = sideSign > 0 ? i / count : 1 - i / count;
      const yt = 5 * thickness * (0.2969 * Math.sqrt(xr) - 0.126 * xr - 0.3516 * xr * xr + 0.2843 * xr ** 3 - 0.1036 * xr ** 4);
      const yc = -camber * 4 * xr * (1 - xr);
      points.push(new THREE.Vector2(-xr * chord, (yc + sideSign * yt) * chord));
    }
  };
  surface(1);
  surface(-1);
  const shape = new THREE.Shape(points);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: span, bevelEnabled: false, steps: 1, curveSegments: 4 });
  geometry.translate(chord / 2, 0, -span / 2);
  geometry.rotateZ(angle);
  if (twistTips) geometry.translate(0, 0, 0);
  return geometry;
};

/**
 * A tyre on its rim: radius `r`, width `w`, rim radius `rim`. Turned about the
 * axle (z axis), centred at the origin.
 */
export const tyre = ({ r = 0.33, w = 0.3, rim = 0.2, segments = 36 }) => {
  const half = w / 2;
  const shoulder = Math.min(0.045, w * 0.18);
  const profile = [
    new THREE.Vector2(rim, -half * 0.92),
    new THREE.Vector2(rim + (r - rim) * 0.4, -half),
    new THREE.Vector2(r - shoulder, -half),
    new THREE.Vector2(r - shoulder * 0.25, -half + shoulder * 0.45),
    new THREE.Vector2(r, -half + shoulder),
    new THREE.Vector2(r, half - shoulder),
    new THREE.Vector2(r - shoulder * 0.25, half - shoulder * 0.45),
    new THREE.Vector2(r - shoulder, half),
    new THREE.Vector2(rim + (r - rim) * 0.4, half),
    new THREE.Vector2(rim, half * 0.92),
  ];
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.rotateX(Math.PI / 2);
  return geometry;
};

/**
 * A wing element built across its span: at every spanwise station `at(z)`
 * gives { x (leading edge), y, chord, angle } so an element can sweep back,
 * curl up into an endplate, dip in the middle or narrow at the tips. The
 * section is an inverted cambered aerofoil. Spans from z0 to z1.
 */
export const wingSpan = ({ z0, z1, steps = 16, thickness = 0.1, camber = 0.07, at }) => {
  const profile = [];
  const count = 10;
  // Around the section: upper surface from the trailing edge to the nose, then the lower back.
  for (let i = count; i >= 0; i -= 1) profile.push([i / count, 1]);
  for (let i = 1; i <= count; i += 1) profile.push([i / count, -1]);
  const ring = profile.length;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let j = 0; j <= steps; j += 1) {
    const z = z0 + ((z1 - z0) * j) / steps;
    const { x, y, chord, angle } = at(z);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    profile.forEach(([xr0, side]) => {
      const xr = xr0 * xr0 * (3 - 2 * xr0) * 0.5 + xr0 * 0.5;
      const half = 5 * thickness * (0.2969 * Math.sqrt(xr) - 0.126 * xr - 0.3516 * xr * xr + 0.2843 * xr ** 3 - 0.1036 * xr ** 4);
      const mean = -camber * 4 * xr * (1 - xr);
      const px = -xr * chord;
      const py = (mean + side * half) * chord;
      // Pitched about the leading edge: positive angle raises the trailing edge (more downforce).
      positions.push(x + px * ca - py * sa, y - px * sa + py * ca, z);
      uvs.push(xr, j / steps);
    });
  }
  for (let j = 0; j < steps; j += 1) {
    for (let k = 0; k < ring - 1; k += 1) {
      const a = j * ring + k;
      const b = (j + 1) * ring + k;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // Close the tips.
  [0, steps].forEach((j, end) => {
    for (let k = 1; k < ring - 1; k += 1) {
      const a = j * ring;
      if (end === 0) indices.push(a, a + k + 1, a + k);
      else indices.push(a, a + k, a + k + 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * A flat panel cut to an outline in the car's side view (x, y pairs), `thick`
 * through, standing at `z`: endplates, bargeboards, fins, fences. The edges
 * are rounded a touch, as moulded carbon is.
 */
export const plate = (outline, thick = 0.012, z = 0, yaw = 0) => {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.25, bevelSize: Math.min(0.006, thick * 0.4), bevelSegments: 1, curveSegments: 6 });
  geometry.translate(0, 0, -thick / 2);
  if (yaw) {
    const cx = outline.reduce((sum, [x]) => sum + x, 0) / outline.length;
    geometry.translate(-cx, 0, 0);
    geometry.rotateY(yaw);
    geometry.translate(cx, 0, 0);
  }
  geometry.translate(0, 0, z);
  return geometry;
};

/**
 * A faired bar from a to b: an elliptical section `chord` long in the
 * direction of the airflow (the car's x) and `thick` across - the shape of a
 * modern carbon wishbone, a wing pillar or a halo leg.
 */
export const fairing = (a, b, chord = 0.05, thick = 0.016, radial = 10) => {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const length = start.distanceTo(end);
  const geometry = new THREE.CylinderGeometry(1, 1, length, radial, 1);
  geometry.scale(chord / 2, 1, thick / 2);
  const axis = end.clone().sub(start).normalize();
  // The chord lies along the flow, as far as the bar's direction allows.
  let flow = new THREE.Vector3(1, 0, 0).sub(axis.clone().multiplyScalar(axis.x));
  if (flow.lengthSq() < 1e-6) flow = new THREE.Vector3(0, 0, 1).sub(axis.clone().multiplyScalar(axis.z));
  flow.normalize();
  const across = new THREE.Vector3().crossVectors(flow, axis).normalize();
  geometry.applyMatrix4(new THREE.Matrix4().makeBasis(flow, axis, across));
  geometry.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
  return geometry;
};

/** A round bar from a to b. */
export const rod = (a, b, radius = 0.012, radial = 6) => {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const length = start.distanceTo(end);
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radial, 1);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  geometry.applyQuaternion(quaternion);
  geometry.translate(mid.x, mid.y, mid.z);
  return geometry;
};

/** A box placed at a centre, optional rotation [rx, ry, rz]. */
export const box = (size, centre, rotation = [0, 0, 0]) => {
  const geometry = new THREE.BoxGeometry(...size);
  geometry.rotateX(rotation[0]);
  geometry.rotateY(rotation[1]);
  geometry.rotateZ(rotation[2]);
  geometry.translate(...centre);
  return geometry;
};

/** A tube through a list of points. */
export const tube = (points, radius = 0.02, segments = 24) => {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, segments, radius, 8, false);
};

/**
 * Merge geometries for one material into one, so a car is a handful of draw
 * calls rather than hundreds.
 */
export const merge = (geometries) => {
  const list = geometries.filter(Boolean).map((geometry) => {
    const plain = geometry.index ? geometry.toNonIndexed() : geometry;
    if (!plain.getAttribute("uv")) {
      plain.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((plain.getAttribute("position").count) * 2), 2));
    }
    if (!plain.getAttribute("normal")) plain.computeVertexNormals();
    ["color", "uv1", "uv2"].forEach((name) => plain.deleteAttribute(name));
    return plain;
  });
  if (!list.length) return null;
  return mergeGeometries(list, false);
};

/**
 * A strip following a closed or open list of 2D points (x, y on the ground
 * maps to world x, z), from offset `from` to `to` metres across (positive to
 * the right of travel), at height `y`. `uScale` sets texture repeats per metre.
 */
export const ribbon = (points, headings, from, to, y = 0, uScale = 0.1, closed = true) => {
  const positions = [];
  const uvs = [];
  const indices = [];
  let along = 0;
  const count = points.length;
  const total = closed ? count + 1 : count;
  for (let i = 0; i < total; i += 1) {
    const p = points[i % count];
    const h = headings[i % count];
    if (i > 0) {
      const q = points[(i - 1) % count];
      along += Math.hypot(p.x - q.x, p.y - q.y);
    }
    const nx = -Math.sin(h);
    const ny = Math.cos(h);
    positions.push(p.x + nx * from, y, p.y + ny * from, p.x + nx * to, y, p.y + ny * to);
    uvs.push(along * uScale, 0, along * uScale, 1);
    if (i > 0) {
      const a = (i - 1) * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Strips built clockwise in the x-z plane face down; make sure they face up.
  const normal = geometry.getAttribute("normal");
  if (normal.count && normal.getY(0) < 0) {
    for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
  }
  return geometry;
};

/** A vertical wall following a path at an offset: barriers, pit wall, fences. */
export const wall = (points, headings, offset, height, base = 0, closed = false, uScale = 0.25) => {
  const positions = [];
  const uvs = [];
  const indices = [];
  const count = points.length;
  const total = closed ? count + 1 : count;
  let along = 0;
  for (let i = 0; i < total; i += 1) {
    const p = points[i % count];
    const h = headings[i % count];
    if (i > 0) {
      const q = points[(i - 1) % count];
      along += Math.hypot(p.x - q.x, p.y - q.y);
    }
    const x = p.x - Math.sin(h) * offset;
    const z = p.y + Math.cos(h) * offset;
    positions.push(x, base, z, x, base + height, z);
    uvs.push(along * uScale, 0, along * uScale, 1);
    if (i > 0) {
      const a = (i - 1) * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};
