/**
 * Formula 1 cars, era by era - from above for the track, from the side for the
 * team sheets.
 *
 * Each era is drawn from what defined its silhouette, not from any one car:
 *
 *   front     1950-57   front engine, long bonnet, driver sat far back
 *   cigar     1958-67   engine behind the driver, a slim tube on skinny tyres
 *   winged    1968-71   the first wings, rear ones on tall struts
 *   wedge     1972-77   wedge noses, full-width front wings, towering airboxes
 *   wing      1978-82   ground-effect "wing cars": sidepods the length of the car
 *   turbo     1983-88   flat bottoms, arrow-shaped sidepods, huge rear wings
 *   highnose  1989-97   the raised nose, front wing slung underneath
 *   grooved   1998-2008 narrower track, grooved tyres, winglets everywhere
 *   narrow    2009-13   wide front wing, tall narrow rear wing
 *   hybrid    2014-16   long finger noses on the turbo-hybrids
 *   wide      2017-21   wider cars and tyres, the halo from 2018
 *   ground    2022-     ground effect again: simple wings, big sidepods, halo
 *
 * Top-down shapes are in metres around the car's centre, nose towards +x, so
 * the race view can draw them at true scale; side shapes sit in a 120 x 34 box.
 */

import React from "react";

export const carEra = (year = 2024) =>
  year < 1958 ? "front"
    : year < 1968 ? "cigar"
      : year < 1972 ? "winged"
        : year < 1978 ? "wedge"
          : year < 1983 ? "wing"
            : year < 1989 ? "turbo"
              : year < 1998 ? "highnose"
                : year < 2009 ? "grooved"
                  : year < 2014 ? "narrow"
                    : year < 2017 ? "hybrid"
                      : year < 2022 ? "wide"
                        : "ground";

/** Lighten (amount > 0) or darken (amount < 0) a hex colour. */
export const shade = (hex = "#888888", amount = 0) => {
  const clean = String(hex).replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  const channels = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
  const mixed = channels.map((c) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)));
  return `#${mixed.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`;
};

/** Relative luminance 0..1 of a hex colour. */
export const luminance = (hex = "#888888") => {
  const clean = String(hex).replace("#", "").padEnd(6, "0");
  const [r, g, b] = [0, 2, 4].map((i) => (parseInt(clean.slice(i, i + 2), 16) || 0) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The second colour a car's wings and pods take: darker, unless the car is already near black. */
export const trimOf = (color, color2) => color2 || (luminance(color) < 0.14 ? shade(color, 0.32) : shade(color, -0.45));

/** Mirror a half outline (y >= 0, nose to tail) into a closed polygon. */
const mirrored = (half) => {
  const top = half.map(([x, y]) => `${x},${-y}`);
  const bottom = [...half].reverse().map(([x, y]) => `${x},${y}`);
  return [...top, ...bottom].join(" ");
};

/**
 * Plan-view specs. wheels: [x, halfTrack, length, width] for front and rear;
 * body: half outline nose to tail; pods: sidepod half outline; fw/rw: wings as
 * [x, span, chord]; cockpit x; extras per era.
 */
const PLAN = {
  front: {
    front: [1.2, 0.62, 0.68, 0.19], rear: [-1.15, 0.6, 0.72, 0.22],
    body: [[2.05, 0], [2.02, 0.22], [1.7, 0.36], [0.4, 0.4], [-0.9, 0.4], [-1.6, 0.32], [-2.0, 0.12], [-2.05, 0]],
    cockpit: -0.45, grille: true, exhaust: true,
  },
  cigar: {
    front: [1.25, 0.6, 0.6, 0.2], rear: [-1.1, 0.6, 0.62, 0.27],
    body: [[2.0, 0], [1.95, 0.12], [1.3, 0.26], [0.2, 0.34], [-0.8, 0.33], [-1.5, 0.24], [-1.8, 0]],
    cockpit: 0.1, engine: [-1.55, -0.55, 0.22],
  },
  winged: {
    front: [1.3, 0.66, 0.64, 0.28], rear: [-1.1, 0.66, 0.68, 0.38],
    body: [[2.1, 0], [2.0, 0.14], [1.3, 0.3], [0.1, 0.38], [-0.8, 0.36], [-1.5, 0.26], [-1.8, 0]],
    cockpit: 0.05, engine: [-1.5, -0.5, 0.24], fw: [1.75, 0.95, 0.18], rw: [-1.25, 1.05, 0.34], struts: true,
  },
  wedge: {
    front: [1.4, 0.74, 0.6, 0.3], rear: [-1.15, 0.72, 0.7, 0.48],
    body: [[2.3, 0], [2.25, 0.1], [1.3, 0.22], [0.5, 0.36], [-0.6, 0.38], [-1.4, 0.3], [-1.75, 0]],
    pods: [[0.45, 0.38], [0.4, 0.66], [-0.55, 0.66], [-0.7, 0.38]],
    cockpit: 0.15, fw: [2.05, 1.55, 0.36], rw: [-1.95, 1.1, 0.42], airbox: [-0.25, 0.2],
  },
  wing: {
    front: [1.45, 0.74, 0.6, 0.3], rear: [-1.2, 0.72, 0.7, 0.5],
    body: [[2.3, 0], [2.2, 0.1], [1.4, 0.2], [0.9, 0.3], [-1.3, 0.32], [-1.7, 0]],
    pods: [[1.0, 0.3], [0.9, 0.74], [-1.15, 0.74], [-1.3, 0.32]],
    cockpit: 0.45, fw: [2.0, 1.2, 0.24], rw: [-2.0, 1.0, 0.4], skirts: true,
  },
  turbo: {
    front: [1.5, 0.76, 0.62, 0.32], rear: [-1.25, 0.72, 0.68, 0.48],
    body: [[2.4, 0], [2.3, 0.08], [1.4, 0.2], [0.8, 0.3], [-1.2, 0.3], [-1.7, 0]],
    pods: [[0.8, 0.3], [0.6, 0.72], [-0.3, 0.68], [-1.0, 0.36]],
    cockpit: 0.45, fw: [2.15, 1.55, 0.4], rw: [-2.05, 1.0, 0.5],
  },
  highnose: {
    front: [1.55, 0.74, 0.64, 0.32], rear: [-1.25, 0.7, 0.66, 0.45],
    body: [[2.45, 0], [2.35, 0.1], [1.4, 0.18], [0.8, 0.3], [-1.2, 0.28], [-1.75, 0]],
    pods: [[0.75, 0.3], [0.55, 0.64], [-0.4, 0.62], [-1.0, 0.32]],
    cockpit: 0.4, fw: [2.15, 1.45, 0.38], rw: [-2.05, 1.0, 0.48], raisedNose: true,
  },
  grooved: {
    front: [1.6, 0.66, 0.62, 0.3], rear: [-1.3, 0.64, 0.64, 0.4],
    body: [[2.5, 0], [2.4, 0.08], [1.5, 0.16], [0.8, 0.28], [-1.2, 0.26], [-1.8, 0]],
    pods: [[0.75, 0.28], [0.55, 0.6], [-0.4, 0.58], [-1.05, 0.3]],
    cockpit: 0.42, fw: [2.2, 1.4, 0.38], rw: [-2.1, 1.0, 0.42], raisedNose: true, bargeboards: true,
  },
  narrow: {
    front: [1.65, 0.7, 0.64, 0.3], rear: [-1.35, 0.66, 0.66, 0.4],
    body: [[2.6, 0], [2.5, 0.08], [1.5, 0.16], [0.8, 0.28], [-1.2, 0.26], [-1.85, 0]],
    pods: [[0.75, 0.28], [0.55, 0.58], [-0.4, 0.56], [-1.05, 0.3]],
    cockpit: 0.42, fw: [2.3, 1.85, 0.36], rw: [-2.1, 0.75, 0.44], raisedNose: true, bargeboards: true,
  },
  hybrid: {
    front: [1.75, 0.7, 0.64, 0.3], rear: [-1.4, 0.66, 0.66, 0.42],
    body: [[2.85, 0], [2.8, 0.05], [2.2, 0.07], [1.6, 0.16], [0.8, 0.28], [-1.25, 0.26], [-1.9, 0]],
    pods: [[0.75, 0.28], [0.55, 0.58], [-0.4, 0.56], [-1.05, 0.3]],
    cockpit: 0.45, fw: [2.45, 1.85, 0.36], rw: [-2.15, 0.75, 0.44], raisedNose: true, bargeboards: true,
  },
  wide: {
    front: [1.85, 0.8, 0.66, 0.36], rear: [-1.45, 0.76, 0.68, 0.47],
    body: [[2.85, 0], [2.78, 0.08], [1.7, 0.16], [0.9, 0.3], [-1.3, 0.28], [-2.0, 0]],
    pods: [[0.85, 0.3], [0.6, 0.66], [-0.45, 0.62], [-1.15, 0.32]],
    cockpit: 0.5, fw: [2.5, 1.95, 0.42], rw: [-2.3, 0.95, 0.46], raisedNose: true, bargeboards: true, haloFrom: 2018,
  },
  ground: {
    front: [1.85, 0.8, 0.72, 0.33], rear: [-1.5, 0.76, 0.72, 0.45],
    body: [[2.9, 0], [2.82, 0.1], [1.8, 0.16], [1.0, 0.3], [-1.3, 0.28], [-2.05, 0]],
    pods: [[0.95, 0.3], [0.75, 0.7], [-0.6, 0.62], [-1.25, 0.3]],
    cockpit: 0.5, fw: [2.55, 1.9, 0.5], rw: [-2.3, 0.95, 0.42], haloFrom: 2018, deflectors: true,
  },
};

const TYRE = "#121316";

/**
 * A car from above, nose to +x, in metres. Draw it inside a transformed <g>.
 * `compound` colours the tyre sidewall stripe; `ghost` greys a retired car.
 */
export const CarTop = React.memo(function CarTop({ year = 2024, color = "#f2b705", color2, helmet = "#f3f1e9", compound = null, ghost = false, highlight = false }) {
  const era = carEra(year);
  const spec = PLAN[era];
  const main = ghost ? "#5d6470" : color;
  const dark = ghost ? "#3c424c" : trimOf(color, color2);
  const light = ghost ? "#7d848f" : shade(color, 0.3);
  const stripe = { soft: "#e10600", medium: "#ffd400", hard: "#f3f1e9", inter: "#43b02a", wet: "#2f8fdd" }[compound];
  const wheel = ([x, track, length, width], key) => (
    <g key={key}>
      {[-1, 1].map((side) => (
        <g key={side}>
          <line x1={x} y1={side * 0.3} x2={x} y2={side * (track - width / 2)} stroke="#202227" strokeWidth={0.05} />
          <rect x={x - length / 2} y={side * track - width / 2} width={length} height={width} rx={width * 0.35} fill={TYRE} />
          {stripe && <rect x={x - length / 2 + 0.05} y={side * track + (side > 0 ? width / 2 - 0.05 : -width / 2)} width={length - 0.1} height={0.05} fill={stripe} opacity={0.9} />}
        </g>
      ))}
    </g>
  );
  const wing = ([x, span, chord], fill, key) => (
    <g key={key}>
      <rect x={x - chord / 2} y={-span / 2} width={chord} height={span} rx={0.04} fill={fill} />
      <rect x={x - chord / 2 - 0.02} y={-span / 2 - 0.02} width={chord + 0.04} height={0.06} fill="#15171b" />
      <rect x={x - chord / 2 - 0.02} y={span / 2 - 0.04} width={chord + 0.04} height={0.06} fill="#15171b" />
    </g>
  );
  const halo = spec.haloFrom && year >= spec.haloFrom;
  return (
    <g className={`mn-car mn-car--${era}${highlight ? " is-highlight" : ""}`}>
      <ellipse cx={0} cy={0} rx={2.3} ry={0.78} fill="rgba(0,0,0,0.22)" transform="translate(0.18 0.22)" />
      {wheel(spec.rear, "r")}
      {wheel(spec.front, "f")}
      {spec.pods && <polygon points={mirrored(spec.pods)} fill={dark} />}
      {spec.skirts && [-1, 1].map((side) => <line key={side} x1={0.9} y1={side * 0.76} x2={-1.15} y2={side * 0.76} stroke="#15171b" strokeWidth={0.06} />)}
      {spec.bargeboards && [-1, 1].map((side) => <line key={side} x1={1.05} y1={side * 0.32} x2={0.8} y2={side * 0.62} stroke="#15171b" strokeWidth={0.05} />)}
      {spec.deflectors && [-1, 1].map((side) => <rect key={side} x={1.15} y={side * 0.5 - 0.05} width={0.35} height={0.1} fill={dark} />)}
      <polygon points={mirrored(spec.body)} fill={main} stroke="rgba(0,0,0,0.45)" strokeWidth={0.04} />
      {/* Nose stripe in the second colour. */}
      <polygon points={mirrored(spec.body.filter(([x]) => x > spec.cockpit + 0.6).map(([x, y]) => [x, y * 0.38]))} fill={light} opacity={0.75} />
      {spec.raisedNose && <line x1={spec.body[0][0] - 0.1} y1={0} x2={spec.cockpit + 0.6} y2={0} stroke={dark} strokeWidth={0.06} opacity={0.6} />}
      {spec.grille && <ellipse cx={spec.body[0][0] - 0.02} cy={0} rx={0.05} ry={0.17} fill="#15171b" />}
      {spec.exhaust && <line x1={0.9} y1={0.44} x2={-1.7} y2={0.44} stroke="#8b8f96" strokeWidth={0.07} />}
      {spec.engine && <rect x={spec.engine[0]} y={-spec.engine[2]} width={spec.engine[1] - spec.engine[0]} height={spec.engine[2] * 2} fill="#7b8089" />}
      {spec.fw && wing(spec.fw, dark, "fw")}
      {spec.rw && wing(spec.rw, dark, "rw")}
      {spec.struts && <line x1={-1.25} y1={0} x2={-1.0} y2={0} stroke="#8b8f96" strokeWidth={0.08} />}
      {spec.airbox && <ellipse cx={spec.airbox[0]} cy={0} rx={0.42} ry={spec.airbox[1]} fill={dark} />}
      <ellipse cx={spec.cockpit} cy={0} rx={0.42} ry={0.2} fill="#0b0c0f" />
      <circle cx={spec.cockpit - 0.08} cy={0} r={0.13} fill={ghost ? "#8a9099" : helmet} />
      {halo && <path d={`M${spec.cockpit + 0.42},0 Q${spec.cockpit + 0.1},-0.3 ${spec.cockpit - 0.32},-0.22 M${spec.cockpit + 0.42},0 Q${spec.cockpit + 0.1},0.3 ${spec.cockpit - 0.32},0.22`} fill="none" stroke="#c9ccd2" strokeWidth={0.07} />}
      {highlight && <ellipse cx={0} cy={0} rx={2.9} ry={1.25} fill="none" stroke="#f2b705" strokeWidth={0.12} opacity={0.9} />}
    </g>
  );
});

/**
 * Side profiles in a 120 x 34 box, nose to the right, wheels at x 28 and 94.
 * Each is a body path plus era details.
 */
const SIDE = {
  front: { r: 8, body: "M8 22 C10 16, 22 14, 34 14 C38 8, 46 8, 48 14 L104 14 C112 14, 115 18, 115 22 L114 26 L10 27 Z", head: [42, 9], grille: true },
  cigar: { r: 7, body: "M10 22 C14 17, 30 16, 52 15 C56 10, 66 10, 68 15 L104 16 C112 17, 116 20, 116 23 L114 26 L12 26 Z", head: [60, 10], engine: true },
  winged: { r: 7.5, body: "M10 22 C14 17, 30 16, 52 15 C56 10, 66 10, 68 15 L106 17 L116 22 L114 26 L12 26 Z", head: [60, 10], engine: true, rw: "M12 4 L36 4 L36 7 L12 7 Z", struts: "M22 7 L26 20 M30 7 L32 20", fw: "M108 21 L118 19 L118 22 L108 23 Z" },
  wedge: { r: 7.5, body: "M10 22 L14 16 L48 14 C52 10, 60 10, 62 14 L112 21 L114 25 L12 26 Z", head: [56, 9], airbox: "M48 14 L50 2 L58 2 L60 14 Z", rw: "M2 8 L20 8 L20 12 L2 12 Z", fw: "M102 23 L118 22 L118 25 L102 25 Z" },
  wing: { r: 7.5, body: "M8 22 L12 15 L46 15 C50 10, 58 10, 60 15 L106 20 L114 23 L114 26 L10 26 Z", head: [54, 10], rw: "M2 9 L18 9 L18 13 L2 13 Z", fw: "M104 22 L116 22 L116 24 L104 24 Z", skirt: "M36 26 L84 26 L84 28 L36 28 Z" },
  turbo: { r: 7.5, body: "M8 22 L12 17 L44 16 C48 11, 56 11, 58 16 L108 21 L116 24 L114 26 L10 26 Z", head: [52, 11], rw: "M0 6 L18 6 L18 12 L0 12 Z", fw: "M102 23 L118 22 L118 25 L102 25 Z" },
  highnose: { r: 7.5, body: "M8 22 L12 16 L44 15 C48 10, 56 10, 58 15 L84 15 L112 17 L113 20 L84 21 L36 26 L10 26 Z", head: [52, 10], rw: "M2 5 L16 5 L16 12 L2 12 Z", fw: "M100 24 L118 24 L118 26 L100 26 Z", pylon: "M104 19 L106 24" },
  grooved: { r: 7, body: "M8 22 L12 15 L46 14 C50 9, 58 9, 60 14 L86 15 L114 17 L115 20 L86 21 L38 26 L10 26 Z", head: [54, 9], rw: "M2 5 L16 5 L16 12 L2 12 Z", fw: "M100 24 L118 24 L118 26 L100 26 Z", pylon: "M104 19 L106 24", fin: true },
  narrow: { r: 7, body: "M8 22 L12 15 L46 14 C50 9, 58 9, 60 14 L86 15 L114 17 L115 20 L86 21 L38 26 L10 26 Z", head: [54, 9], rw: "M4 2 L16 2 L16 12 L4 12 Z", fw: "M98 24 L119 24 L119 26 L98 26 Z", pylon: "M104 19 L106 24", fin: true },
  hybrid: { r: 7, body: "M8 22 L12 15 L46 14 C50 9, 58 9, 60 14 L86 16 L106 19 L119 22 L119 23 L106 22 L86 22 L38 26 L10 26 Z", head: [54, 9], rw: "M4 3 L16 3 L16 12 L4 12 Z", fw: "M98 24 L119 24 L119 26 L98 26 Z" },
  wide: { r: 7.5, body: "M6 22 L10 15 L46 14 C50 9, 58 9, 60 14 L86 16 L106 19 L119 22 L119 24 L86 23 L38 26 L8 26 Z", head: [54, 9], rw: "M0 6 L16 6 L16 12 L0 12 Z", fw: "M96 24 L119 23 L119 26 L96 26 Z", halo: true },
  ground: { r: 8, body: "M6 22 L10 15 L46 13 C50 8, 58 8, 60 13 L86 16 L108 20 L119 23 L119 26 L86 25 L38 27 L8 27 Z", head: [54, 8], rw: "M0 6 L16 6 L16 11 L0 11 Z", fw: "M96 24 L119 23 L119 27 L96 27 Z", halo: true, covers: true },
};

/** A car from the side, for team sheets and the factory. */
export const CarSide = ({ year = 2024, color = "#f2b705", color2, width = 120, title }) => {
  const era = carEra(year);
  const spec = SIDE[era];
  const dark = trimOf(color, color2);
  const halo = spec.halo && year >= 2018;
  return (
    <svg className={`mn-livery mn-livery--${era}`} viewBox="0 0 120 34" width={width} height={(width * 34) / 120} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : "true"}>
      <ellipse cx="60" cy="31.5" rx="56" ry="2" fill="rgba(0,0,0,0.25)" />
      {spec.struts && <path d={spec.struts} stroke="#8b8f96" strokeWidth="1.2" />}
      {spec.rw && <path d={spec.rw} fill={dark} />}
      {spec.airbox && <path d={spec.airbox} fill={dark} />}
      <path d={spec.body} fill={color} />
      {spec.skirt && <path d={spec.skirt} fill={dark} />}
      {spec.engine && <path d="M14 18 L34 17 L34 23 L14 23 Z" fill="#7b8089" />}
      {spec.fin && year >= 2008 && year <= 2010 && <path d="M18 13 L40 13 L40 15 L18 16 Z" fill={dark} />}
      <path d={spec.body} fill="none" stroke={dark} strokeWidth="0.6" opacity="0.6" />
      {spec.fw && <path d={spec.fw} fill={dark} />}
      {spec.pylon && <path d={spec.pylon} stroke={dark} strokeWidth="1.4" />}
      {spec.grille && <path d="M113 17 L115 17 L115 24 L113 24 Z" fill="#15171b" />}
      <circle cx={spec.head[0]} cy={spec.head[1]} r="3.4" fill="#f3f1e9" />
      <path d={`M${spec.head[0] - 1} ${spec.head[1] - 0.8} L${spec.head[0] + 3.2} ${spec.head[1] - 0.8} L${spec.head[0] + 3.2} ${spec.head[1] + 0.8} L${spec.head[0] - 1} ${spec.head[1] + 0.8} Z`} fill="#15171b" />
      {halo && <path d={`M${spec.head[0] - 6} ${spec.head[1] + 4} Q${spec.head[0] + 2} ${spec.head[1] - 6} ${spec.head[0] + 12} ${spec.head[1] + 4}`} fill="none" stroke="#c9ccd2" strokeWidth="1.3" />}
      {[28, 94].map((x) => (
        <g key={x}>
          <circle cx={x} cy={33 - spec.r} r={spec.r} fill="#0a0a0c" />
          <circle cx={x} cy={33 - spec.r} r={spec.r * (spec.covers ? 0.62 : 0.42)} fill={spec.covers ? "#2b2f37" : "#2b3a52"} />
        </g>
      ))}
    </svg>
  );
};
