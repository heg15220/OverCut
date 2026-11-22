/**
 * The shape of a Formula 1 car in every regulation era.
 *
 * A car is described the way its technical regulations describe it - a survival
 * cell (the tub: nose, cockpit, fuel cell), the engine cover and airbox, the
 * sidepods with their radiators, the floor and diffuser, the front and rear
 * wings, the suspension, and the era's own furniture - and each era sets those
 * parts to the dimensions its rules allowed and the cars that defined it had:
 *
 *   front     1950-57  Maserati 250F, Mercedes W196: front engine, the driver
 *                      upright behind a long bonnet, wire wheels, side exhaust
 *   cigar     1958-67  Cooper T51, Lotus 25: rear engine, a slim monocoque,
 *                      the engine and stacks exposed, a roll hoop
 *   highwing  1968-69  Lotus 49B: the first wings, high on struts, nose fins
 *   wedge     1970-77  Lotus 72, McLaren M23, Ferrari 312T: wedge noses,
 *                      full-width front wings, side radiators, tall airboxes
 *                      until 1975
 *   wing      1978-82  Lotus 79, Williams FW07: venturi sidepods the length of
 *                      the car sealed by skirts, a narrow tub
 *   turbo     1983-88  McLaren MP4/4: the flat bottom (1983), cars 2150 mm
 *                      wide, coke-bottle sidepods, no airbox, big rear wings
 *   na        1989-97  Williams FW14B: atmospheric engines and the airbox back,
 *                      raised noses (from 1991), 2000 mm wide (1993), the
 *                      stepped floor (1995)
 *   grooved   1998-08  Ferrari F2004: 1800 mm wide, grooved tyres, high noses,
 *                      bargeboards, periscope exhausts, winglets (2005-08)
 *   narrow    2009-13  Red Bull RB6: 1800 mm low front wing, 750 mm tall rear
 *                      wing, double diffusers (2009-10), DRS (2011), stepped
 *                      noses (2012-13)
 *   hybrid    2014-16  Mercedes W05: finger noses (2014) then short ones, no
 *                      beam wing, a single exhaust under the wing
 *   wide      2017-21  Mercedes W11: 2000 mm wide again, wide tyres, swept
 *                      wings (2017-18), huge bargeboards, the halo (2018)
 *   ground    2022-25  Red Bull RB19: venturi floor, 18-inch wheels with
 *                      covers, wheel-wake deflectors, a front wing on the nose,
 *                      rounded rear wing and beam wing, downwash sidepods
 *   2026 on            smaller (3400 mm wheelbase, 1900 mm wide), narrower
 *                      tyres, active front and rear wings, no beam wing
 *
 * Space: x forward (nose +x), y up, z to the right, metres, the origin on the
 * ground midway between the axles.
 */

import * as THREE from "three";
import { box, fairing, loft, merge, plate, rod, smoothSections, tube, wingSpan } from "./geometry";

/** A cross-section of bodywork; see `loft`. */
const H = (x, w, yb, yt, more = {}) => ({ x, w, yb, yt, n: 2.6, ...more });

/** The regulation era a season belongs to. */
export const eraOf = (year) =>
  year < 1958 ? "front"
    : year < 1968 ? "cigar"
      : year < 1970 ? "highwing"
        : year < 1978 ? "wedge"
          : year < 1983 ? "wing"
            : year < 1989 ? "turbo"
              : year < 1998 ? "na"
                : year < 2009 ? "grooved"
                  : year < 2014 ? "narrow"
                    : year < 2017 ? "hybrid"
                      : year < 2022 ? "wide"
                        : "ground";

/**
 * The car of a season, as a plain description the builder assembles.
 *
 *   front, rear     axle positions; ft, rt the tracks (wheel centre to centre)
 *   tf, tr          tyres { r, w, rim, grooves }
 *   tub             the survival cell, nose to gearbox
 *   cover, airbox   engine cover and the intake above the driver's head
 *   pods, podZ      a sidepod's sections and where its centre sits
 *   cockpit, head   the opening and the driver's helmet
 *   fw, rw          front and rear wings (see the builders)
 *   flags           the era's furniture
 */
export const carSpec = (year = 2024) => {
  const era = eraOf(year);
  switch (era) {
    case "front":
      return {
        era, year, front: 1.14, rear: -1.14, ft: 1.3, rt: 1.25,
        tf: { r: 0.355, w: 0.15, rim: 0.24 }, tr: { r: 0.37, w: 0.18, rim: 0.24 }, wheel: "wire",
        tub: [
          H(2.06, 0.16, 0.3, 0.55, { n: 2.2 }), H(1.96, 0.22, 0.26, 0.62, { n: 2.3 }), H(1.6, 0.3, 0.22, 0.7, { tw: 0.85 }), H(1.0, 0.34, 0.19, 0.72, { tw: 0.82 }),
          H(0.4, 0.37, 0.17, 0.74, { tw: 0.78 }), H(-0.2, 0.38, 0.16, 0.7, { tw: 0.82 }), H(-0.8, 0.36, 0.17, 0.68, { tw: 0.84 }), H(-1.4, 0.32, 0.2, 0.66, { tw: 0.8 }),
          H(-1.85, 0.22, 0.25, 0.58, { n: 2.2 }), H(-2.06, 0.07, 0.34, 0.47, { n: 2 }),
        ],
        headrest: [H(-1.62, 0.03, 0.62, 0.66, { n: 2 }), H(-1.35, 0.1, 0.62, 0.8, { n: 2.2 }), H(-1.0, 0.12, 0.62, 0.84, { n: 2.2 }), H(-0.94, 0.1, 0.62, 0.8, { n: 2.2 })],
        cockpit: { x0: -0.96, x1: -0.2, w: 0.25, y: 0.67 }, head: [-0.7, 0.94],
        screen: { x: -0.2, w: 0.26, h: 0.16, y: 0.7 }, grille: { x: 2.07, y: 0.43, w: 0.14, h: 0.11 }, exhaust: "side", louvres: { x0: 0.6, x1: 1.5, y: 0.55, z: 0.31 },
        numberSide: true, suspension: "metal", tcam: false,
      };
    case "cigar":
      return {
        era, year, front: 1.12, rear: -1.17, ft: 1.33, rt: 1.35,
        tf: { r: 0.3, w: 0.17, rim: 0.19 }, tr: { r: 0.315, w: year >= 1965 ? 0.27 : 0.23, rim: 0.19 }, wheel: "cast", spokes: 6,
        tub: [
          H(2.0, 0.08, 0.23, 0.34, { n: 2 }), H(1.86, 0.14, 0.19, 0.39, { n: 2.2 }), H(1.4, 0.21, 0.14, 0.42, { tw: 0.85 }), H(0.8, 0.27, 0.12, 0.46, { tw: 0.8 }),
          H(0.2, 0.3, 0.12, 0.52, { tw: 0.78 }), H(-0.3, 0.3, 0.12, 0.55, { tw: 0.8 }), H(-0.55, 0.27, 0.13, 0.49, { tw: 0.82 }), H(-0.82, 0.21, 0.14, 0.38, { n: 2.3 }),
        ],
        cockpit: { x0: -0.42, x1: 0.46, w: 0.21, y: 0.55 }, head: [-0.22, 0.76],
        screen: { x: 0.47, w: 0.23, h: 0.13, y: 0.55 }, grille: { x: 2.01, y: 0.285, w: 0.07, h: 0.05 },
        engine: { x0: -0.8, x1: -1.45, y: 0.4 }, exhaust: "stacks", rollbar: true, numberSide: true, suspension: "metal", tcam: false,
      };
    case "highwing":
      return {
        era, year, front: 1.2, rear: -1.21, ft: 1.52, rt: 1.55,
        tf: { r: 0.3, w: 0.25, rim: 0.2 }, tr: { r: 0.33, w: 0.38, rim: 0.2 }, wheel: "cast", spokes: 6,
        tub: [
          H(2.12, 0.07, 0.17, 0.23, { n: 2 }), H(2.0, 0.12, 0.15, 0.27, { n: 2.2 }), H(1.6, 0.2, 0.12, 0.37, { tw: 0.85 }), H(1.1, 0.26, 0.12, 0.42, { tw: 0.8 }),
          H(0.5, 0.31, 0.12, 0.5, { tw: 0.78 }), H(-0.1, 0.33, 0.12, 0.55, { tw: 0.8 }), H(-0.45, 0.31, 0.12, 0.52, { tw: 0.82 }), H(-0.8, 0.23, 0.13, 0.4, { n: 2.3 }),
        ],
        cockpit: { x0: -0.36, x1: 0.5, w: 0.22, y: 0.55 }, head: [-0.2, 0.76],
        screen: { x: 0.5, w: 0.24, h: 0.12, y: 0.54 },
        engine: { x0: -0.78, x1: -1.5, y: 0.4 }, exhaust: "stacks", rollbar: true, numberSide: true, suspension: "metal", tcam: false,
        fins: { x: 1.8, y: 0.24, span: 0.95, chord: 0.24 },
        highWing: { x: -1.25, y: 1.45, span: 1.06, chord: 0.42 },
      };
    case "wedge": {
      const tall = year <= 1975;
      return {
        era, year, front: 1.27, rear: -1.29, ft: 1.52, rt: 1.6,
        tf: { r: 0.29, w: 0.28, rim: 0.2 }, tr: { r: 0.335, w: 0.47, rim: 0.2 }, wheel: "cast", spokes: 8,
        tub: [
          H(2.3, 0.2, 0.1, 0.15, { n: 4 }), H(2.0, 0.27, 0.1, 0.24, { n: 4, tw: 0.9 }), H(1.4, 0.3, 0.1, 0.36, { n: 3.5, tw: 0.8 }), H(0.7, 0.3, 0.1, 0.5, { n: 3.2, tw: 0.75 }),
          H(0.1, 0.32, 0.1, 0.57, { n: 3, tw: 0.75 }), H(-0.35, 0.31, 0.1, 0.56, { n: 3, tw: 0.78 }), H(-0.75, 0.27, 0.12, 0.5, { n: 2.8 }), H(-1.15, 0.2, 0.2, 0.45, { n: 2.6 }),
          H(-1.6, 0.12, 0.24, 0.38, { n: 2.4 }),
        ],
        pods: [H(0.58, 0.15, 0.12, 0.38, { n: 4 }), H(0.4, 0.2, 0.11, 0.42, { n: 4 }), H(-0.3, 0.21, 0.11, 0.42, { n: 4 }), H(-0.65, 0.17, 0.12, 0.36, { n: 3.6 }), H(-0.8, 0.08, 0.14, 0.3, { n: 3 })], podZ: 0.5,
        cockpit: { x0: -0.2, x1: 0.58, w: 0.22, y: 0.58 }, head: [-0.04, 0.79],
        airbox: tall
          ? [H(-1.0, 0.07, 0.5, 0.6, { n: 2.2 }), H(-0.62, 0.15, 0.5, 1.02, { n: 2.8 }), H(-0.32, 0.17, 0.5, 1.1, { n: 2.8 }), H(-0.22, 0.16, 0.5, 1.08, { n: 2.6 })]
          : [H(-1.0, 0.06, 0.5, 0.58, { n: 2.2 }), H(-0.6, 0.13, 0.5, 0.74, { n: 2.6 }), H(-0.3, 0.14, 0.5, 0.8, { n: 2.6 }), H(-0.22, 0.13, 0.5, 0.78, { n: 2.4 })],
        screen: { x: 0.58, w: 0.25, h: 0.12, y: 0.57 },
        fw: { x: 2.3, y: 0.13, span: 1.5, chord: 0.36, elements: 1, plate: [0.34, 0.16], under: true },
        rw: { x: -1.95, y: 0.95, span: 1.06, chord: 0.5, elements: 1, plate: [0.52, 0.34], pillar: "central" },
        oilCooler: true, numberSide: true, mirrors: "stalk", suspension: "rod", tcam: false,
      };
    }
    case "wing":
      return {
        era, year, front: 1.37, rear: -1.37, ft: 1.73, rt: 1.63,
        tf: { r: 0.29, w: 0.28, rim: 0.2 }, tr: { r: 0.335, w: 0.5, rim: 0.2 }, wheel: "cast", spokes: 10,
        tub: [
          H(2.38, 0.05, 0.14, 0.19, { n: 2 }), H(2.3, 0.08, 0.12, 0.22, { n: 2.2 }), H(1.7, 0.15, 0.1, 0.34, { tw: 0.85 }), H(0.9, 0.22, 0.08, 0.5, { tw: 0.72 }),
          H(0.15, 0.25, 0.08, 0.58, { tw: 0.7 }), H(-0.5, 0.26, 0.08, 0.6, { tw: 0.72 }), H(-1.1, 0.2, 0.18, 0.52, { tw: 0.8 }), H(-1.7, 0.12, 0.24, 0.4, { n: 2.4 }),
        ],
        pods: [H(0.98, 0.18, 0.07, 0.3, { n: 4, tw: 0.95 }), H(0.85, 0.25, 0.06, 0.38, { n: 4.5, tw: 0.95 }), H(0.2, 0.26, 0.06, 0.42, { n: 4.5, tw: 0.95 }), H(-0.7, 0.25, 0.06, 0.38, { n: 4.5 }), H(-1.25, 0.2, 0.06, 0.3, { n: 4 }), H(-1.35, 0.1, 0.08, 0.24, { n: 3 })], podZ: 0.52,
        skirts: { x0: -1.3, x1: 0.97, z: 0.77, h: 0.3 },
        cockpit: { x0: 0.04, x1: 0.84, w: 0.21, y: 0.58 }, head: [0.24, 0.76],
        airbox: [H(-0.66, 0.06, 0.52, 0.6, { n: 2.2 }), H(-0.3, 0.11, 0.52, 0.76, { n: 2.6 }), H(-0.16, 0.1, 0.52, 0.74, { n: 2.4 })],
        screen: { x: 0.84, w: 0.23, h: 0.1, y: 0.57 },
        fw: { x: 2.2, y: 0.16, span: 1.25, chord: 0.26, elements: 1, plate: [0.26, 0.14], sides: true },
        rw: { x: -2.02, y: 0.92, span: 1.0, chord: 0.46, elements: 2, plate: [0.5, 0.36], pillar: "central" },
        floor: "venturi", numberSide: true, mirrors: "stalk", suspension: "rod", tcam: false,
      };
    case "turbo":
      return {
        era, year, front: 1.43, rear: -1.44, ft: 1.8, rt: 1.67,
        tf: { r: 0.3, w: 0.3, rim: 0.2 }, tr: { r: 0.335, w: 0.46, rim: 0.2 }, wheel: "cast", spokes: 10,
        tub: [
          H(2.44, 0.04, 0.12, 0.17, { n: 2 }), H(2.36, 0.07, 0.11, 0.2, { n: 2.2 }), H(1.7, 0.16, 0.09, 0.32, { tw: 0.85 }), H(0.85, 0.25, 0.07, 0.46, { tw: 0.7 }),
          H(0.05, 0.29, 0.07, 0.53, { tw: 0.66 }), H(-0.6, 0.28, 0.07, 0.5, { tw: 0.68 }), H(-1.25, 0.22, 0.1, 0.45, { tw: 0.75 }), H(-1.8, 0.12, 0.18, 0.4, { n: 2.4 }),
          H(-2.05, 0.06, 0.24, 0.36, { n: 2.2 }),
        ],
        pods: [H(0.78, 0.13, 0.08, 0.32, { n: 3.6 }), H(0.65, 0.2, 0.07, 0.38, { n: 3.8, tw: 0.92 }), H(0.1, 0.24, 0.07, 0.4, { n: 3.8, tw: 0.9 }), H(-0.6, 0.2, 0.07, 0.34, { n: 3.4 }), H(-1.1, 0.1, 0.08, 0.28, { n: 3 }), H(-1.25, 0.04, 0.1, 0.24, { n: 2.6 })], podZ: 0.5,
        cockpit: { x0: -0.02, x1: 0.78, w: 0.21, y: 0.53 }, head: [0.16, 0.66],
        screen: { x: 0.8, w: 0.22, h: 0.08, y: 0.52 },
        fw: { x: 2.3, y: 0.1, span: 1.5, chord: 0.4, elements: 2, plate: [0.32, 0.19], sides: true },
        rw: { x: -2.08, y: 0.95, span: 1.0, chord: 0.52, elements: 3, plate: [0.62, 0.52], pillar: "endplate", beam: { x: -1.92, y: 0.46, span: 0.72, chord: 0.22 } },
        floor: "flat", diffuser: { length: 0.55, angle: 0.24 }, turboPipes: true, numberSide: true, mirrors: "pod", suspension: "fair", tcam: false, light: year >= 1985,
      };
    case "na": {
      const raised = year >= 1991;
      const narrow = year >= 1993;
      return {
        era, year, front: 1.45, rear: -1.45, ft: 1.8, rt: narrow ? 1.6 : 1.68,
        tf: { r: 0.32, w: 0.3, rim: 0.2 }, tr: { r: 0.335, w: narrow ? 0.38 : 0.45, rim: 0.2 }, wheel: "cast", spokes: 10,
        tub: raised
          ? [
            H(2.46, 0.04, 0.36, 0.43, { n: 2 }), H(2.32, 0.07, 0.33, 0.45, { n: 2.2 }), H(1.6, 0.14, 0.29, 0.5, { tw: 0.8, bw: 0.7 }), H(0.9, 0.23, 0.16, 0.53, { tw: 0.7, bw: 0.75 }),
            H(0.05, 0.29, 0.07, 0.56, { tw: 0.66 }), H(-0.6, 0.27, 0.07, 0.54, { tw: 0.68 }), H(-1.2, 0.2, 0.12, 0.48, { tw: 0.75 }), H(-1.75, 0.11, 0.2, 0.42, { n: 2.4 }), H(-2.0, 0.06, 0.25, 0.38, { n: 2.2 }),
          ]
          : [
            H(2.44, 0.04, 0.12, 0.17, { n: 2 }), H(2.36, 0.07, 0.11, 0.2, { n: 2.2 }), H(1.7, 0.16, 0.09, 0.32, { tw: 0.85 }), H(0.85, 0.25, 0.07, 0.47, { tw: 0.7 }),
            H(0.05, 0.29, 0.07, 0.55, { tw: 0.66 }), H(-0.6, 0.27, 0.07, 0.53, { tw: 0.68 }), H(-1.2, 0.2, 0.12, 0.47, { tw: 0.75 }), H(-1.75, 0.11, 0.2, 0.41, { n: 2.4 }), H(-2.0, 0.06, 0.25, 0.37, { n: 2.2 }),
          ],
        pods: [H(0.64, 0.12, 0.1, 0.38, { n: 3.4 }), H(0.52, 0.19, 0.08, 0.44, { n: 3.6, tw: 0.9, bw: 0.8, wy: 0.55 }), H(0.0, 0.23, 0.08, 0.45, { n: 3.6, tw: 0.88, bw: 0.78, wy: 0.55 }), H(-0.55, 0.19, 0.08, 0.38, { n: 3.2, bw: 0.8 }), H(-1.0, 0.09, 0.1, 0.3, { n: 2.8 }), H(-1.15, 0.035, 0.12, 0.26, { n: 2.4 })], podZ: 0.47,
        cockpit: { x0: -0.04, x1: 0.8, w: 0.21, y: 0.56 }, head: [0.14, 0.67],
        airbox: [H(-0.7, 0.07, 0.48, 0.56, { n: 2.2 }), H(-0.34, 0.13, 0.48, 0.84, { n: 2.6, tw: 0.8 }), H(-0.15, 0.13, 0.48, 0.88, { n: 2.6, tw: 0.8 }), H(-0.07, 0.12, 0.5, 0.86, { n: 2.4 })],
        fw: { x: 2.36, y: raised ? 0.1 : 0.11, span: raised ? 1.4 : 1.5, chord: 0.38, elements: 2, plate: [0.34, 0.21], pylons: raised, sides: !raised },
        rw: { x: -2.05, y: year >= 1994 ? 0.84 : 0.92, span: 1.0, chord: 0.48, elements: year >= 1994 ? 2 : 3, plate: [0.62, 0.5], pillar: "endplate", beam: { x: -1.92, y: 0.44, span: 0.7, chord: 0.2 } },
        floor: year >= 1995 ? "stepped" : "flat", diffuser: { length: 0.6, angle: 0.22 }, tray: year >= 1995, exhaust: "diffuser",
        numberSide: year < 1995, mirrors: "pod", suspension: "fair", tcam: year >= 1993, light: true,
      };
    }
    case "grooved":
      return {
        era, year, front: 1.5, rear: -1.55, ft: 1.46, rt: 1.42,
        tf: { r: 0.33, w: 0.27, rim: 0.2, grooves: year >= 1999 ? 4 : 3 }, tr: { r: 0.33, w: 0.35, rim: 0.2, grooves: 4 }, wheel: "machined",
        tub: [
          H(2.5, 0.035, 0.36, 0.44, { n: 2 }), H(2.36, 0.06, 0.33, 0.46, { n: 2.2 }), H(1.65, 0.13, 0.29, 0.52, { tw: 0.75, bw: 0.65 }), H(0.95, 0.21, 0.17, 0.55, { tw: 0.68, bw: 0.7 }),
          H(0.1, 0.28, 0.07, 0.58, { tw: 0.65 }), H(-0.55, 0.27, 0.07, 0.56, { tw: 0.66 }), H(-1.2, 0.19, 0.12, 0.5, { tw: 0.72 }), H(-1.8, 0.1, 0.2, 0.42, { n: 2.4 }), H(-2.1, 0.06, 0.25, 0.38, { n: 2.2 }),
        ],
        pods: [H(0.62, 0.11, 0.16, 0.44, { n: 3.2 }), H(0.5, 0.19, 0.12, 0.49, { n: 3.4, tw: 0.9, bw: 0.55, wy: 0.62 }), H(0.0, 0.22, 0.1, 0.5, { n: 3.4, tw: 0.86, bw: 0.55, wy: 0.62 }), H(-0.55, 0.17, 0.1, 0.42, { n: 3, bw: 0.6, wy: 0.6 }), H(-1.0, 0.08, 0.12, 0.32, { n: 2.6 }), H(-1.15, 0.03, 0.14, 0.27, { n: 2.4 })], podZ: 0.44,
        cockpit: { x0: -0.02, x1: 0.82, w: 0.21, y: 0.58 }, head: [0.15, 0.68],
        airbox: [H(-0.75, 0.07, 0.5, 0.58, { n: 2.2 }), H(-0.35, 0.13, 0.5, 0.88, { n: 2.6, tw: 0.75 }), H(-0.15, 0.13, 0.5, 0.92, { n: 2.6, tw: 0.75 }), H(-0.07, 0.12, 0.52, 0.89, { n: 2.4 })],
        fw: { x: 2.5, y: year >= 2001 ? 0.14 : 0.1, span: 1.4, chord: 0.42, elements: 3, plate: [0.36, 0.25], pylons: true, spoon: year >= 2001 ? 0.07 : 0 },
        rw: { x: -2.12, y: 0.92, span: 1.0, chord: 0.46, elements: year >= 2005 ? 2 : 3, plate: [0.64, 0.52], pillar: "endplate", beam: { x: -1.96, y: 0.42, span: 0.7, chord: 0.2 } },
        floor: "stepped", diffuser: { length: 0.62, angle: 0.22 }, tray: true, exhaust: "periscope", bargeboards: 0.45, winglets: year >= 2005, sharkFin: year === 2008, chimneys: year >= 2004,
        mirrors: "pod", suspension: "fair", tcam: true, light: true, numberNose: year >= 2008,
      };
    case "narrow": {
      const stepped = year >= 2012;
      return {
        era, year, front: 1.62, rear: -1.58, ft: 1.47, rt: 1.41,
        tf: { r: 0.33, w: 0.245, rim: 0.2 }, tr: { r: 0.33, w: 0.325, rim: 0.2 }, wheel: "machined",
        tub: stepped
          ? [
            H(2.62, 0.035, 0.29, 0.36, { n: 2 }), H(2.45, 0.07, 0.27, 0.4, { n: 2.2 }), H(1.62, 0.14, 0.26, 0.5, { tw: 0.78, bw: 0.7 }), H(1.3, 0.16, 0.26, 0.52, { tw: 0.7 }),
            H(1.2, 0.2, 0.2, 0.63, { tw: 0.6, bw: 0.75 }), H(0.9, 0.23, 0.16, 0.63, { tw: 0.62 }), H(0.1, 0.28, 0.07, 0.6, { tw: 0.64 }), H(-0.55, 0.27, 0.07, 0.58, { tw: 0.66 }),
            H(-1.2, 0.18, 0.12, 0.5, { tw: 0.72 }), H(-1.8, 0.1, 0.2, 0.42, { n: 2.4 }), H(-2.1, 0.06, 0.25, 0.38, { n: 2.2 }),
          ]
          : [
            H(2.62, 0.035, 0.37, 0.45, { n: 2 }), H(2.45, 0.07, 0.34, 0.48, { n: 2.2 }), H(1.7, 0.13, 0.3, 0.56, { tw: 0.75, bw: 0.65 }), H(0.95, 0.22, 0.18, 0.6, { tw: 0.64, bw: 0.7 }),
            H(0.1, 0.28, 0.07, 0.6, { tw: 0.64 }), H(-0.55, 0.27, 0.07, 0.58, { tw: 0.66 }), H(-1.2, 0.18, 0.12, 0.5, { tw: 0.72 }), H(-1.8, 0.1, 0.2, 0.42, { n: 2.4 }), H(-2.1, 0.06, 0.25, 0.38, { n: 2.2 }),
          ],
        pods: [H(0.66, 0.1, 0.18, 0.46, { n: 3 }), H(0.55, 0.18, 0.13, 0.5, { n: 3.4, tw: 0.9, bw: 0.5, wy: 0.65 }), H(0.05, 0.21, 0.1, 0.5, { n: 3.4, tw: 0.85, bw: 0.5, wy: 0.65 }), H(-0.55, 0.16, 0.1, 0.4, { n: 3, bw: 0.55, wy: 0.6 }), H(-1.0, 0.07, 0.12, 0.3, { n: 2.6 }), H(-1.15, 0.03, 0.14, 0.26, { n: 2.4 })], podZ: 0.43,
        cockpit: { x0: -0.02, x1: 0.84, w: 0.21, y: 0.6 }, head: [0.15, 0.7],
        airbox: [H(-0.8, 0.07, 0.52, 0.6, { n: 2.2 }), H(-0.36, 0.13, 0.52, 0.92, { n: 2.6, tw: 0.75 }), H(-0.15, 0.13, 0.52, 0.95, { n: 2.6, tw: 0.75 }), H(-0.07, 0.12, 0.54, 0.92, { n: 2.4 })],
        fw: { x: 2.66, y: 0.075, span: 1.8, chord: 0.5, elements: 3, plate: [0.38, 0.28], pylons: true, neutral: 0.25, cascade: true },
        rw: { x: -2.15, y: 0.95, span: 0.75, chord: 0.46, elements: 2, plate: [0.74, 0.52], pillar: "central", beam: { x: -1.98, y: 0.42, span: 0.6, chord: 0.2 }, louvres: true, drs: year >= 2011 },
        floor: "stepped", diffuser: { length: 0.66, angle: 0.24, double: year <= 2010 }, tray: true, exhaust: year >= 2012 ? "coanda" : "periscope", bargeboards: 0.35, sharkFin: year <= 2010,
        mirrors: "pod", suspension: "fair", tcam: true, light: true, numberNose: true,
      };
    }
    case "hybrid": {
      const finger = year === 2014;
      return {
        era, year, front: 1.75, rear: -1.65, ft: 1.47, rt: 1.41,
        tf: { r: 0.33, w: 0.245, rim: 0.2 }, tr: { r: 0.33, w: 0.325, rim: 0.2 }, wheel: "machined",
        tub: finger
          ? [
            H(2.98, 0.03, 0.12, 0.18, { n: 2 }), H(2.72, 0.04, 0.12, 0.2, { n: 2.2 }), H(2.5, 0.09, 0.2, 0.38, { n: 2.4 }), H(1.9, 0.15, 0.27, 0.52, { tw: 0.75, bw: 0.6 }),
            H(1.0, 0.22, 0.16, 0.6, { tw: 0.62, bw: 0.72 }), H(0.15, 0.28, 0.07, 0.6, { tw: 0.64 }), H(-0.6, 0.27, 0.07, 0.58, { tw: 0.66 }), H(-1.25, 0.18, 0.12, 0.5, { tw: 0.72 }),
            H(-1.85, 0.1, 0.2, 0.42, { n: 2.4 }), H(-2.2, 0.06, 0.25, 0.37, { n: 2.2 }),
          ]
          : [
            H(2.82, 0.05, 0.14, 0.22, { n: 2.2 }), H(2.6, 0.08, 0.15, 0.3, { n: 2.3 }), H(2.0, 0.14, 0.2, 0.46, { tw: 0.75, bw: 0.65 }), H(1.4, 0.18, 0.2, 0.56, { tw: 0.66, bw: 0.7 }),
            H(0.9, 0.23, 0.15, 0.6, { tw: 0.62, bw: 0.72 }), H(0.15, 0.28, 0.07, 0.6, { tw: 0.64 }), H(-0.6, 0.27, 0.07, 0.58, { tw: 0.66 }), H(-1.25, 0.18, 0.12, 0.5, { tw: 0.72 }),
            H(-1.85, 0.1, 0.2, 0.42, { n: 2.4 }), H(-2.2, 0.06, 0.25, 0.37, { n: 2.2 }),
          ],
        pods: [H(0.7, 0.09, 0.2, 0.46, { n: 3 }), H(0.6, 0.17, 0.14, 0.5, { n: 3.4, tw: 0.88, bw: 0.45, wy: 0.68 }), H(0.05, 0.2, 0.1, 0.48, { n: 3.4, tw: 0.84, bw: 0.45, wy: 0.66 }), H(-0.6, 0.14, 0.1, 0.38, { n: 3, bw: 0.5, wy: 0.6 }), H(-1.05, 0.06, 0.12, 0.29, { n: 2.6 }), H(-1.2, 0.025, 0.14, 0.25, { n: 2.4 })], podZ: 0.42,
        cockpit: { x0: -0.02, x1: 0.86, w: 0.21, y: 0.6 }, head: [0.15, 0.7],
        airbox: [H(-0.85, 0.07, 0.52, 0.6, { n: 2.2 }), H(-0.38, 0.13, 0.52, 0.93, { n: 2.6, tw: 0.72 }), H(-0.16, 0.13, 0.52, 0.96, { n: 2.6, tw: 0.72 }), H(-0.07, 0.12, 0.54, 0.93, { n: 2.4 })],
        fw: { x: 2.88, y: 0.075, span: 1.65, chord: 0.52, elements: 4, plate: [0.4, 0.28], pylons: true, neutral: 0.25, cascade: true },
        rw: { x: -2.22, y: 0.95, span: 0.75, chord: 0.46, elements: 2, plate: [0.74, 0.55], pillar: "central", louvres: true, drs: true },
        floor: "stepped", diffuser: { length: 0.7, angle: 0.26 }, tray: true, exhaust: "centre", bargeboards: 0.4, monkey: year >= 2015,
        mirrors: "pod", suspension: "fair", tcam: true, light: true, numberNose: true,
      };
    }
    case "wide":
      return {
        era, year, front: 1.85, rear: -1.78, ft: 1.6, rt: 1.55,
        tf: { r: 0.335, w: 0.305, rim: 0.2 }, tr: { r: 0.335, w: 0.405, rim: 0.2 }, wheel: "machined",
        tub: [
          H(3.0, 0.06, 0.15, 0.22, { n: 2.2 }), H(2.75, 0.09, 0.16, 0.3, { n: 2.3 }), H(2.1, 0.14, 0.21, 0.47, { tw: 0.75, bw: 0.65 }), H(1.45, 0.18, 0.21, 0.58, { tw: 0.66, bw: 0.7 }),
          H(0.95, 0.22, 0.15, 0.62, { tw: 0.6, bw: 0.72 }), H(0.15, 0.28, 0.07, 0.62, { tw: 0.62 }), H(-0.6, 0.27, 0.07, 0.6, { tw: 0.64 }), H(-1.3, 0.17, 0.12, 0.5, { tw: 0.72 }),
          H(-1.9, 0.1, 0.2, 0.42, { n: 2.4 }), H(-2.3, 0.06, 0.25, 0.37, { n: 2.2 }),
        ],
        pods: [H(0.74, 0.08, 0.26, 0.5, { n: 3 }), H(0.64, 0.2, 0.18, 0.55, { n: 3.4, tw: 0.9, bw: 0.32, wy: 0.72 }), H(0.1, 0.24, 0.12, 0.52, { n: 3.4, tw: 0.86, bw: 0.35, wy: 0.7 }), H(-0.6, 0.16, 0.1, 0.4, { n: 3, bw: 0.4, wy: 0.62 }), H(-1.1, 0.06, 0.12, 0.29, { n: 2.6 }), H(-1.28, 0.025, 0.14, 0.25, { n: 2.4 })], podZ: 0.45,
        cockpit: { x0: -0.02, x1: 0.9, w: 0.21, y: 0.62 }, head: [0.17, 0.71],
        airbox: [H(-0.9, 0.07, 0.52, 0.6, { n: 2.2 }), H(-0.4, 0.14, 0.52, 0.95, { n: 2.6, tw: 0.7 }), H(-0.16, 0.14, 0.52, 0.98, { n: 2.6, tw: 0.7 }), H(-0.07, 0.13, 0.54, 0.95, { n: 2.4 })],
        fw: year >= 2019
          ? { x: 2.98, y: 0.075, span: 2.0, chord: 0.52, elements: 5, plate: [0.42, 0.3], pylons: true, neutral: 0.25 }
          : { x: 2.98, y: 0.075, span: 1.8, chord: 0.52, elements: 5, plate: [0.42, 0.3], pylons: true, neutral: 0.25, sweep: 0.28, cascade: true },
        rw: { x: -2.3, y: 0.82, span: 0.95, chord: 0.48, elements: 2, plate: [0.68, 0.56], pillar: "twin", swept: true, louvres: year <= 2018, drs: true },
        floor: "stepped", diffuser: { length: 0.8, angle: 0.3 }, tray: true, exhaust: "centre", wastegates: true, bargeboards: 0.75, bigBargeboards: true,
        halo: year >= 2018, tWing: year === 2017, sharkFin: year <= 2018, monkey: year <= 2018, floorSlots: true,
        mirrors: year >= 2019 ? "halo" : "pod", suspension: "fair", tcam: true, light: true, numberNose: true,
      };
    default: {
      const next = year >= 2026;
      const k = next ? 0.95 : 1;
      return {
        era: "ground", year, next, front: next ? 1.7 : 1.82, rear: next ? -1.7 : -1.78, ft: next ? 1.55 : 1.63, rt: next ? 1.5 : 1.57,
        tf: { r: 0.36, w: next ? 0.28 : 0.305, rim: 0.23 }, tr: { r: 0.36, w: next ? 0.375 : 0.405, rim: 0.23 }, wheel: "cover",
        tub: [
          H(2.78 * k, 0.05, 0.12, 0.21, { n: 2.2 }), H(2.55 * k, 0.085, 0.12, 0.27, { n: 2.3 }), H(2.1 * k, 0.13, 0.13, 0.38, { tw: 0.78, bw: 0.8 }), H(1.6 * k, 0.18, 0.12, 0.52, { tw: 0.68, bw: 0.75 }),
          H(1.0, 0.24, 0.09, 0.62, { tw: 0.6, bw: 0.75, wy: 0.42 }), H(0.15, 0.29, 0.07, 0.64, { tw: 0.62, wy: 0.42 }), H(-0.55, 0.27, 0.07, 0.6, { tw: 0.64 }), H(-1.25, 0.18, 0.11, 0.52, { tw: 0.7 }),
          H(-1.85, 0.1, 0.2, 0.44, { n: 2.4 }), H(-2.32 * k, 0.06, 0.26, 0.38, { n: 2.2 }),
        ],
        pods: [
          H(0.66, 0.07, 0.3, 0.52, { n: 3 }), H(0.56, 0.2, 0.22, 0.6, { n: 3.6, tw: 0.92, bw: 0.3, wy: 0.75 }), H(0.15, 0.27, 0.16, 0.6, { n: 3.6, tw: 0.9, bw: 0.32, wy: 0.72 }),
          H(-0.45, 0.25, 0.12, 0.48, { n: 3.2, tw: 0.92, bw: 0.4, wy: 0.66 }), H(-0.95, 0.15, 0.12, 0.33, { n: 2.8, bw: 0.55 }), H(-1.3, 0.05, 0.13, 0.25, { n: 2.4 }),
        ], podZ: 0.43,
        cockpit: { x0: 0.0, x1: 0.92, w: 0.21, y: 0.64 }, head: [0.18, 0.72],
        airbox: [H(-0.95, 0.07, 0.54, 0.62, { n: 2.2 }), H(-0.42, 0.15, 0.54, 0.96, { n: 2.6, tw: 0.66 }), H(-0.16, 0.15, 0.54, 0.99, { n: 2.6, tw: 0.66 }), H(-0.06, 0.14, 0.56, 0.96, { n: 2.4 })],
        fw: next
          ? { x: 2.6, y: 0.1, span: 1.8, chord: 0.46, elements: 3, plate: [0.3, 0.26], onNose: true, curl: 0.12 }
          : { x: 2.74, y: 0.08, span: 2.0, chord: 0.5, elements: 4, plate: [0.28, 0.24], onNose: true, curl: 0.2 },
        rw: next
          ? { x: -2.25, y: 0.86, span: 0.95, chord: 0.46, elements: 3, plate: [0.5, 0.5], pillar: "swan", rounded: true, drs: true }
          : { x: -2.3, y: 0.88, span: 0.95, chord: 0.46, elements: 2, plate: [0.5, 0.5], pillar: "swan", rounded: true, drs: true, beam: { x: -2.08, y: 0.42, span: 0.62, chord: 0.22, elements: 2 } },
        floor: "venturi22", diffuser: { length: 0.95, angle: 0.33 }, exhaust: "centre", wastegates: true, deflectors: !next, halo: true, floorEdge: true,
        mirrors: "sidepod", suspension: next ? "fair" : "fair", pullrodFront: !next && year >= 2022, tcam: true, light: true, numberNose: true,
      };
    }
  }
};

/** Width of the tub at x, from its sections. */
const tubHalf = (spec, x) => {
  const sections = spec.tub;
  for (let i = 0; i < sections.length - 1; i += 1) {
    const a = sections[i];
    const b = sections[i + 1];
    if ((x <= a.x && x >= b.x) || (x >= a.x && x <= b.x)) {
      const t = (x - a.x) / (b.x - a.x || 1);
      return { w: a.w + (b.w - a.w) * t, yb: a.yb + (b.yb - a.yb) * t, yt: a.yt + (b.yt - a.yt) * t };
    }
  }
  const end = x > sections[0].x ? sections[0] : sections[sections.length - 1];
  return { w: end.w, yb: end.yb, yt: end.yt };
};

const both = (fn) => {
  fn(1);
  fn(-1);
};

// ------------------------------------------------------------------ wings

/**
 * Front wing. Elements stack up and back from the mainplane; from 2009 the
 * centre 500 mm is a neutral section and the flaps live outboard of it; the
 * 2017-18 wings sweep back at the tips; the 2022 elements run into the nose and
 * curl up into the endplates; the 2001-08 wings dip in a spoon at the centre.
 */
const frontWing = (spec, p) => {
  const fw = spec.fw;
  const half = fw.span / 2;
  const n = fw.elements;
  const shape = (u) => {
    const sweep = fw.sweep ? Math.max(0, u - 0.35) * fw.sweep * half : 0;
    const curl = fw.curl ? Math.max(0, u - 0.62) ** 2 * (fw.curl / 0.144) : 0;
    const spoon = fw.spoon ? -fw.spoon * Math.max(0, 1 - u / 0.4) : 0;
    return { sweep, rise: curl + spoon };
  };
  let lead = fw.x;
  for (let i = 0; i < n; i += 1) {
    const share = i === 0 ? (n === 1 ? 1 : 0.42) : 0.58 / (n - 1);
    const chord = fw.chord * share;
    const y0 = fw.y + i * (0.028 + chord * 0.18);
    const angle = 0.06 + i * (n > 3 ? 0.17 : 0.24);
    const inner = i > 0 && fw.neutral ? fw.neutral : i > 0 && fw.sides ? 0.12 : 0;
    const start = lead;
    const at = (z) => {
      const u = Math.abs(z) / half;
      const { sweep, rise } = shape(u);
      // Flaps lift towards the tips as the elements wrap round the front tyres.
      const tipLift = i > 0 ? Math.max(0, u - 0.55) * 0.05 * i : 0;
      return { x: start - sweep, y: y0 + rise + tipLift, chord: chord * (fw.onNose && u < 0.12 ? 1.1 : 1), angle: angle + (fw.onNose ? Math.max(0, u - 0.6) * 0.3 : 0) };
    };
    const target = i === 0 ? p.trim : p.carbon;
    if (inner > 0) {
      both((side) => target.push(wingSpan({ z0: side * inner, z1: side * (half - 0.01), steps: 14, at })));
    } else if (fw.sides && i === 0) {
      // Wings either side of a narrow nose, not passing under it.
      both((side) => target.push(wingSpan({ z0: side * 0.1, z1: side * (half - 0.01), steps: 10, at })));
    } else {
      target.push(wingSpan({ z0: -half + 0.01, z1: half - 0.01, steps: 24, at }));
    }
    lead -= chord * 0.78;
  }
  // Endplates: low and long early on, tall and shaped later; 2022 ones are small and rounded.
  const [len, height] = fw.plate;
  const tip = shape(1);
  both((side) => {
    const x1 = fw.x - tip.sweep + 0.04;
    const x0 = x1 - len;
    const yb = fw.y - 0.035 + tip.rise * 0.5;
    const outline = fw.curl
      ? [[x1, yb + 0.02], [x1 - 0.06, yb], [x0, yb], [x0 - 0.02, yb + height * 0.8], [x0 + 0.08, yb + height], [x1 - 0.12, yb + height * 0.6]]
      : [[x1, yb], [x0, yb], [x0, yb + height * 0.82], [x0 + 0.06, yb + height], [x1 - len * 0.35, yb + height], [x1, yb + height * 0.45]];
    p.carbon.push(plate(outline, 0.012, side * half, fw.sweep ? side * 0.1 : 0));
    // A footplate turning out under the endplate, and (2009-18) cascade winglets inboard of it.
    p.carbon.push(box([len * 0.8, 0.008, 0.06], [x0 + len * 0.45, yb + 0.004, side * (half + 0.03)]));
    if (fw.cascade) {
      const cascade = wingSpan({ z0: side * (half - 0.25), z1: side * (half - 0.05), steps: 4, thickness: 0.1, camber: 0.08, at: () => ({ x: x0 + len * 0.7, y: yb + height * 0.75, chord: 0.12, angle: 0.35 }) });
      p.carbon.push(cascade);
      p.carbon.push(plate([[x0 + len * 0.75, yb + height * 0.4], [x0 + len * 0.45, yb + height * 0.4], [x0 + len * 0.45, yb + height * 0.82], [x0 + len * 0.75, yb + height * 0.7]], 0.008, side * (half - 0.25)));
    }
  });
  // Pylons to a raised nose.
  if (fw.pylons) {
    const nose = tubHalf(spec, fw.x - 0.25);
    both((side) => p.carbon.push(plate([[fw.x - 0.08, fw.y + 0.02], [fw.x - 0.42, fw.y + 0.02], [fw.x - 0.36, nose.yb + 0.03], [fw.x - 0.16, nose.yb + 0.03]], 0.012, side * 0.075)));
  }
};

/**
 * Rear wing: mainplane and flaps with the endplates, held by a central pillar
 * (1970s, 2009-16), from the endplates and gearbox (1980s-2000s), by twin
 * pillars round the exhaust (2017-21) or a swan neck from above (2022-). Below
 * it, in the years that allowed one, the beam wing.
 */
const rearWing = (spec, p) => {
  const rw = spec.rw;
  const half = rw.span / 2;
  const n = rw.elements;
  const top = rw.y;
  let lead = rw.x + rw.chord * 0.5;
  for (let i = 0; i < n; i += 1) {
    const share = i === 0 ? (n === 1 ? 1 : 0.6) : 0.4 / (n - 1);
    const chord = rw.chord * share;
    const y = top - 0.12 + i * 0.07 - (n === 1 ? 0.04 : 0);
    const angle = 0.12 + i * 0.36;
    const start = lead;
    const at = (z) => {
      const u = Math.abs(z) / half;
      // Rounded tips (2022) roll the elements down into the endplate.
      const roll = rw.rounded ? -(Math.max(0, u - 0.75) ** 2) * 1.2 : 0;
      // The 2017-21 spoon: a lower centre for less drag.
      const spoon = rw.swept ? -0.02 * Math.max(0, 1 - u / 0.6) : 0;
      return { x: start, y: y + roll + spoon, chord, angle };
    };
    (i === 0 ? p.trim : p.carbon).push(wingSpan({ z0: -half + 0.01, z1: half - 0.01, steps: 20, at }));
    lead -= chord * 0.72;
  }
  // Gurney on the trailing edge of the top flap.
  p.black.push(box([0.01, 0.018, rw.span - 0.04], [lead + rw.chord * 0.08, top - 0.04 + (n - 1) * 0.07 + 0.08, 0]));
  // DRS actuator pod on the mainplane.
  if (rw.drs) p.carbon.push(box([0.12, 0.08, 0.05], [rw.x + 0.02, top - 0.1, 0]));
  // Endplates.
  const [len, height] = rw.plate;
  const x1 = rw.x + rw.chord * 0.55;
  const x0 = x1 - len;
  const yb = top - height;
  both((side) => {
    const outline = rw.rounded
      ? [[x1, yb + height * 0.55], [x1 - 0.05, yb + 0.02], [x0 + 0.12, yb], [x0, yb + height * 0.4], [x0 + 0.02, yb + height * 0.75]]
      : rw.swept
        ? [[x1, yb + height * 0.15], [x1 - 0.08, yb], [x0 - 0.06, yb], [x0, yb + height], [x1 - len * 0.12, yb + height], [x1 + 0.04, yb + height * 0.6]]
        : [[x1, yb], [x0, yb], [x0, yb + height], [x1, yb + height]];
    p.carbon.push(plate(outline, 0.014, side * half));
    if (rw.rounded) {
      // The 2022 tip: the endplate rolls over into the mainplane.
      const tip = new THREE.TorusGeometry(0.11, 0.008, 6, 14, Math.PI / 2);
      tip.rotateY(Math.PI / 2);
      tip.translate(rw.x - 0.02, top - 0.14, side * (half - 0.1));
      p.carbon.push(tip);
    }
    if (rw.louvres) {
      for (let k = 0; k < 5; k += 1) p.black.push(box([0.11, 0.006, 0.016], [x0 + 0.12, yb + 0.12 + k * 0.045, side * half], [0, 0, 0.35]));
    }
  });
  // Mounting.
  const gearbox = tubHalf(spec, spec.rear - 0.4);
  if (rw.pillar === "central") p.carbon.push(plate([[rw.x + 0.18, gearbox.yt - 0.02], [rw.x - 0.08, gearbox.yt - 0.08], [rw.x - 0.04, top - 0.1], [rw.x + 0.16, top - 0.12]], 0.02, 0));
  else if (rw.pillar === "twin") both((side) => p.carbon.push(plate([[rw.x + 0.2, gearbox.yt - 0.05], [rw.x - 0.05, gearbox.yt - 0.1], [rw.x - 0.02, top - 0.12], [rw.x + 0.18, top - 0.12]], 0.012, side * 0.07)));
  else if (rw.pillar === "swan") {
    // Over the top of the mainplane and down to the gearbox.
    p.carbon.push(tube([[rw.x - 0.02, gearbox.yt - 0.05, 0], [rw.x + 0.14, top - 0.2, 0], [rw.x + 0.08, top - 0.02, 0], [rw.x - 0.06, top - 0.08, 0]], 0.014, 16));
  } else if (rw.pillar === "endplate") {
    // Endplates run down to the diffuser and a short pillar picks up the gearbox.
    both((side) => p.carbon.push(plate([[x1, yb], [x0 + 0.1, yb], [x0 + 0.2, 0.26], [x1, 0.26]], 0.012, side * half)));
    p.carbon.push(plate([[rw.x + 0.16, gearbox.yt - 0.03], [rw.x - 0.06, gearbox.yt - 0.06], [rw.x - 0.04, yb + 0.05], [rw.x + 0.14, yb + 0.05]], 0.016, 0));
  }
  if (rw.beam) {
    const beam = rw.beam;
    const count = beam.elements || 1;
    for (let i = 0; i < count; i += 1) {
      const chord = beam.chord / count;
      p.carbon.push(wingSpan({ z0: -beam.span / 2, z1: beam.span / 2, steps: 10, at: () => ({ x: beam.x - i * chord * 0.75, y: beam.y + i * 0.03, chord, angle: 0.15 + i * 0.3 }) }));
    }
  }
};

// ------------------------------------------------------------------ the rest

/** Everything but the wheels, grouped by material. */
export const bodyGeometry = (spec) => {
  const p = { paint: [], trim: [], carbon: [], black: [], metal: [], glass: [], halo: [], light: [], belt: [] };
  const { cockpit, head, year } = spec;
  const gearbox = tubHalf(spec, spec.rear);

  // The survival cell: nose, cockpit, fuel cell, up to the gearbox.
  p.paint.push(loft(smoothSections(spec.tub, 5), 40));
  if (spec.headrest) p.paint.push(loft(smoothSections(spec.headrest, 3), 20));

  // Engine cover and airbox: the spine running back from above the driver's head.
  if (spec.airbox) {
    const front = spec.airbox[spec.airbox.length - 1];
    const spine = [H(spec.rear - 0.25, 0.05, gearbox.yt - 0.06, gearbox.yt + 0.02, { n: 2.2 }), H(spec.rear + 0.4, 0.1, gearbox.yt - 0.1, gearbox.yt + 0.1, { n: 2.4, tw: 0.7 }), ...spec.airbox.slice(1)];
    if (spec.era === "wedge" || spec.era === "wing") p.paint.push(loft(smoothSections(spec.airbox, 3), 24));
    else p.paint.push(loft(smoothSections(spine, 4), 28));
    // The intake mouth above the driver's head, and the roll hoop it is built round.
    p.black.push(loft([H(front.x - 0.012, front.w * 0.72, front.yt - 0.2, front.yt - 0.035, { n: 2.2 }), H(front.x + 0.004, front.w * 0.72, front.yt - 0.2, front.yt - 0.035, { n: 2.2 })], 20));
    if (year >= 2014) {
      // Side "ears": the inlets for the coolers either side of the hoop.
      both((side) => p.black.push(loft([H(front.x - 0.02, 0.035, front.yt - 0.3, front.yt - 0.22, { n: 2.2, z: side * front.w * 0.9 }), H(front.x + 0.004, 0.035, front.yt - 0.3, front.yt - 0.22, { n: 2.2, z: side * front.w * 0.9 })], 12)));
    }
  }

  // Sidepods: radiators either side, an inlet in front and the coke-bottle taper behind.
  if (spec.pods) {
    both((side) => {
      p.paint.push(loft(smoothSections(spec.pods.map((s) => ({ ...s, z: side * spec.podZ })), 4), 28, { caps: [true, false] }));
      const mouth = spec.pods[1] || spec.pods[0];
      const lip = spec.pods[0];
      // The inlet: a dark recess just inside the lip.
      p.black.push(loft([
        H(lip.x + 0.002, mouth.w * 0.82, mouth.yb + (mouth.yt - mouth.yb) * 0.22, mouth.yt - 0.03, { n: 3.2, z: side * (spec.podZ + 0.01) }),
        H(lip.x - 0.05, mouth.w * 0.7, mouth.yb + (mouth.yt - mouth.yb) * 0.3, mouth.yt - 0.05, { n: 3.2, z: side * (spec.podZ + 0.01) }),
      ], 22));
      // Cooling outlets low at the back of the pod.
      const back = spec.pods[spec.pods.length - 2];
      if (year >= 1983) p.black.push(box([0.2, 0.06, 0.02], [back.x + 0.08, back.yt - 0.05, side * (spec.podZ + back.w * 0.6)], [0, side * 0.2, 0]));
    });
  }

  // Cockpit: the opening, its padded rim, the steering wheel, the screen.
  p.black.push(loft([H(cockpit.x0, 0.05, cockpit.y - 0.05, cockpit.y + 0.01, { n: 2 }), H(cockpit.x0 + 0.12, cockpit.w, cockpit.y - 0.05, cockpit.y + 0.012, { n: 2.6 }), H(cockpit.x1 - 0.14, cockpit.w * 0.95, cockpit.y - 0.05, cockpit.y + 0.012, { n: 2.6 }), H(cockpit.x1, 0.06, cockpit.y - 0.05, cockpit.y + 0.008, { n: 2 })], 20));
  if (year >= 1996 && spec.era !== "front") {
    // Head protection: padded sides (1996) wrapping the helmet.
    both((side) => p.black.push(loft(smoothSections([H(head[0] - 0.24, 0.03, cockpit.y - 0.02, cockpit.y + 0.06, { n: 2, z: side * 0.2 }), H(head[0] - 0.05, 0.05, cockpit.y - 0.03, cockpit.y + 0.13, { n: 2.6, z: side * 0.19 }), H(head[0] + 0.25, 0.045, cockpit.y - 0.03, cockpit.y + 0.1, { n: 2.6, z: side * 0.19 }), H(head[0] + 0.42, 0.02, cockpit.y - 0.02, cockpit.y + 0.04, { n: 2, z: side * 0.2 })], 2), 12)));
  }
  // Shoulders and the steering wheel.
  p.belt.push(loft([H(head[0] - 0.12, 0.17, head[1] - 0.32, head[1] - 0.12, { n: 2.4 }), H(head[0] + 0.08, 0.18, head[1] - 0.32, head[1] - 0.14, { n: 2.4 }), H(head[0] + 0.18, 0.12, head[1] - 0.3, head[1] - 0.18, { n: 2.2 })], 16));
  const wheelX = head[0] + 0.32;
  const steering = spec.era === "front" || spec.era === "cigar" || spec.era === "highwing" ? new THREE.TorusGeometry(0.17, 0.012, 6, 24) : new THREE.TorusGeometry(0.12, 0.016, 6, 18);
  steering.scale(1, spec.year >= 1990 ? 0.7 : 1, 1);
  steering.rotateY(Math.PI / 2);
  steering.rotateZ(-0.35);
  steering.translate(wheelX, head[1] - 0.17, 0);
  p.black.push(steering);
  if (spec.screen) {
    const screen = new THREE.CylinderGeometry(spec.screen.w, spec.screen.w, spec.screen.h, 20, 1, true, -Math.PI / 2.2, Math.PI / 1.1);
    screen.rotateZ(-0.38);
    screen.translate(spec.screen.x - 0.05, spec.screen.y + spec.screen.h / 2, 0);
    p.glass.push(screen);
  }

  // The 1950s: radiator grille, bonnet louvres, side exhaust, filler cap.
  if (spec.grille) {
    const grille = new THREE.CircleGeometry(1, 28);
    grille.scale(spec.grille.h, spec.grille.w, 1);
    grille.rotateY(Math.PI / 2);
    grille.rotateX(Math.PI / 2);
    grille.translate(spec.grille.x, spec.grille.y, 0);
    p.black.push(grille);
    for (let k = -3; k <= 3; k += 1) p.metal.push(box([0.006, spec.grille.h * 1.6, 0.006], [spec.grille.x + 0.004, spec.grille.y, k * spec.grille.w * 0.26]));
  }
  if (spec.louvres) {
    const { x0, x1, y, z } = spec.louvres;
    both((side) => {
      for (let x = x0; x <= x1; x += 0.08) p.black.push(box([0.035, 0.11, 0.006], [x, y - 0.06, side * z], [0, 0, 0.3]));
    });
    p.metal.push(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16).translate(-1.6, 0.66, 0));
  }
  if (spec.exhaust === "side") {
    p.metal.push(tube([[0.95, 0.38, 0.36], [0.6, 0.33, 0.43], [-0.4, 0.31, 0.45], [-1.6, 0.3, 0.44], [-2.08, 0.3, 0.42]], 0.042, 24));
    p.black.push(new THREE.CircleGeometry(0.036, 12).rotateY(-Math.PI / 2).translate(-2.09, 0.3, 0.42));
  }

  // The 1960s: the engine exposed behind the driver, gearbox, exhaust stacks, roll hoop.
  if (spec.engine) {
    const { x0, x1, y } = spec.engine;
    const len = x0 - x1;
    p.metal.push(box([len * 0.75, 0.2, 0.34], [(x0 + x1) / 2 + 0.05, y, 0]));
    both((side) => {
      p.metal.push(box([len * 0.65, 0.07, 0.09], [(x0 + x1) / 2 + 0.05, y + 0.14, side * 0.11]));
      // Ram pipes on top of the cam covers.
      for (let k = 0; k < 4; k += 1) p.metal.push(new THREE.CylinderGeometry(0.022, 0.026, 0.1, 10).translate(x0 - 0.1 - k * len * 0.17, y + 0.22, side * 0.06));
    });
    p.black.push(box([0.35, 0.18, 0.26], [x1 + 0.1, y - 0.02, 0]));
    // A tubular subframe carrying the rear suspension.
    both((side) => p.metal.push(rod([x0, y - 0.15, side * 0.2], [x1, y - 0.1, side * 0.2], 0.012)));
  }
  if (spec.exhaust === "stacks") {
    both((side) => p.metal.push(tube([[spec.engine.x0 - 0.1, 0.36, side * 0.2], [spec.engine.x0 - 0.4, 0.42, side * 0.27], [spec.rear - 0.15, 0.48, side * 0.24], [spec.rear - 0.7, 0.5, side * 0.22]], 0.03, 16)));
  }
  if (spec.rollbar) {
    p.metal.push(tube([[head[0] - 0.2, 0.52, -0.17], [head[0] - 0.22, 0.9, -0.1], [head[0] - 0.22, 0.95, 0], [head[0] - 0.22, 0.9, 0.1], [head[0] - 0.2, 0.52, 0.17]], 0.018, 16));
    p.metal.push(rod([head[0] - 0.22, 0.94, 0], [head[0] - 0.55, 0.5, 0], 0.012));
  }
  if (spec.oilCooler) p.metal.push(box([0.12, 0.14, 0.42], [spec.rear - 0.3, 0.45, 0]));

  // Wings of 1968-69: high on struts, fins on the nose.
  if (spec.highWing) {
    const hw = spec.highWing;
    p.trim.push(wingSpan({ z0: -hw.span / 2, z1: hw.span / 2, steps: 8, at: () => ({ x: hw.x + hw.chord / 2, y: hw.y, chord: hw.chord, angle: 0.14 }) }));
    both((side) => {
      p.carbon.push(plate([[hw.x + hw.chord / 2, hw.y - 0.07], [hw.x - hw.chord / 2, hw.y - 0.07], [hw.x - hw.chord / 2, hw.y + 0.07], [hw.x + hw.chord / 2, hw.y + 0.03]], 0.008, side * hw.span / 2));
      p.metal.push(rod([spec.rear + 0.02, 0.38, side * (spec.rt / 2 - 0.3)], [hw.x + 0.02, hw.y - 0.02, side * 0.36], 0.016));
      p.metal.push(rod([spec.rear + 0.25, 0.38, side * (spec.rt / 2 - 0.32)], [hw.x + 0.1, hw.y - 0.02, side * 0.36], 0.012));
    });
  }
  if (spec.fins) {
    const f = spec.fins;
    both((side) => p.trim.push(wingSpan({ z0: side * 0.12, z1: side * (f.span / 2), steps: 4, at: () => ({ x: f.x + f.chord / 2, y: f.y, chord: f.chord, angle: 0.15 }) })));
  }

  if (spec.fw) frontWing(spec, p);
  if (spec.rw) rearWing(spec, p);

  // Under the car: skirts of the wing cars, flat and stepped floors, the 2022 venturi floor.
  const halfFloor = spec.rt / 2 - spec.tr.w / 2 - 0.03;
  if (spec.skirts) both((side) => p.black.push(box([spec.skirts.x1 - spec.skirts.x0, spec.skirts.h, 0.014], [(spec.skirts.x0 + spec.skirts.x1) / 2, 0.03 + spec.skirts.h / 2, side * spec.skirts.z])));
  if (spec.floor) {
    const front = spec.floor === "venturi22" ? spec.front - 0.55 : spec.front - 0.3;
    const outline = [
      [front, -0.2], [front - 0.25, -halfFloor * 0.92], [spec.rear + 0.35, -halfFloor], [spec.rear - 0.02, -0.4], [spec.rear - 0.02, 0.4], [spec.rear + 0.35, halfFloor], [front - 0.25, halfFloor * 0.92], [front, 0.2],
    ];
    const floor = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
    const sheet = new THREE.ExtrudeGeometry(floor, { depth: 0.025, bevelEnabled: false });
    sheet.rotateX(Math.PI / 2);
    sheet.translate(0, spec.floor === "venturi22" ? 0.085 : 0.07, 0);
    p.carbon.push(sheet);
    if (spec.floor === "stepped") {
      // The 1995 step: the reference plane 50 mm below the step plane, and the plank.
      both((side) => p.carbon.push(box([spec.front - spec.rear - 1.0, 0.05, 0.012], [(spec.front + spec.rear) / 2 - 0.2, 0.065, side * 0.25])));
      p.metal.push(box([spec.front - spec.rear - 0.8, 0.01, 0.3], [(spec.front + spec.rear) / 2, 0.035, 0]));
    }
    if (spec.floorEdge) {
      // Venturi floor: fences at the tunnel inlets, an edge wing along each side, a scroll at the rear.
      [0.16, 0.27, 0.38, 0.5].forEach((z, k) => both((side) => p.carbon.push(plate([[front + 0.1, 0.06], [front - 0.5 + k * 0.05, 0.05], [front - 0.55 + k * 0.05, 0.2 - k * 0.02], [front + 0.05, 0.16]], 0.008, side * z, side * (0.06 + k * 0.03)))));
      both((side) => {
        p.carbon.push(box([1.5, 0.01, 0.09], [spec.rear + 1.25, 0.13, side * (halfFloor + 0.05)], [side * 0.3, 0, 0]));
        p.carbon.push(box([1.2, 0.04, 0.012], [spec.rear + 1.0, 0.11, side * (halfFloor - 0.02)]));
      });
    }
    if (spec.floorSlots) both((side) => {
      for (let k = 0; k < 6; k += 1) p.black.push(box([0.12, 0.006, 0.02], [spec.rear + 0.5 + k * 0.17, 0.087, side * (halfFloor - 0.08)], [0, side * 0.5, 0]));
    });
    if (spec.tray) {
      // The splitter ("T-tray") under the nose of the 1995-2021 cars.
      p.carbon.push(box([0.55, 0.015, 0.42], [spec.front - 0.55, 0.06, 0]));
      p.metal.push(box([0.5, 0.01, 0.04], [spec.front - 0.55, 0.048, 0]));
    }
  }
  if (spec.diffuser) {
    const { length, angle, double } = spec.diffuser;
    const width = spec.rt - spec.tr.w - 0.12;
    const x = spec.rear + 0.1;
    // The ramp rises from the floor towards the back of the car.
    p.carbon.push(box([length, 0.012, width], [x - length / 2 * Math.cos(angle), 0.09 + (length / 2) * Math.sin(angle), 0], [0, 0, -angle]));
    // Fences and side walls splitting the expansion into channels.
    const fences = width > 1 ? [-0.48, -0.25, 0, 0.25, 0.48] : [-0.45, -0.15, 0.15, 0.45];
    const exit = 0.09 + length * Math.sin(angle);
    fences.forEach((f) => p.carbon.push(plate([[x, 0.07], [x - length, 0.07], [x - length, exit + 0.01], [x, 0.1]], 0.008, f * width)));
    both((side) => p.carbon.push(plate([[x + 0.1, 0.06], [x - length, 0.06], [x - length, exit + 0.03], [x - length * 0.4, exit * 0.8], [x + 0.1, 0.12]], 0.012, side * width / 2)));
    if (double) p.carbon.push(box([length * 0.7, 0.012, width * 0.55], [x - length * 0.6, 0.2 + length * Math.sin(angle) * 0.9, 0], [0, 0, -angle * 1.3]));
  }

  // Bodywork of the aero decades.
  if (spec.bargeboards) {
    const len = spec.bargeboards;
    both((side) => {
      const x1 = spec.front - 0.55;
      const x0 = x1 - len;
      p.carbon.push(plate(spec.bigBargeboards
        ? [[x1, 0.1], [x0, 0.08], [x0 + 0.05, 0.32], [x0 + len * 0.45, 0.4], [x1 - 0.05, 0.3], [x1, 0.18]]
        : [[x1, 0.1], [x0, 0.1], [x0 + 0.06, 0.3], [x1 - 0.06, 0.3]], 0.008, side * (spec.podZ + 0.03), side * 0.12));
      if (spec.bigBargeboards) {
        for (let k = 0; k < 3; k += 1) p.carbon.push(plate([[x1 - k * 0.15, 0.08], [x1 - 0.12 - k * 0.15, 0.08], [x1 - 0.12 - k * 0.15, 0.24], [x1 - k * 0.15, 0.2]], 0.006, side * (0.28 + k * 0.05), side * 0.2));
      }
    });
  }
  if (spec.winglets) {
    both((side) => {
      p.carbon.push(wingSpan({ z0: side * 0.3, z1: side * 0.44, steps: 3, at: () => ({ x: -0.15, y: 0.62, chord: 0.16, angle: 0.1 }) }));
      p.carbon.push(wingSpan({ z0: side * 0.22, z1: side * 0.34, steps: 3, at: () => ({ x: 0.6, y: 0.68, chord: 0.14, angle: 0.15 }) }));
    });
  }
  if (spec.chimneys) both((side) => p.carbon.push(loft([H(-0.4, 0.04, 0.4, 0.55, { n: 2.6, z: side * 0.42 }), H(-0.62, 0.04, 0.4, 0.6, { n: 2.6, z: side * 0.42 })], 12)));
  if (spec.sharkFin) {
    const rwTop = spec.rw.y - 0.05;
    p.trim.push(plate([[-0.25, 0.9], [spec.rw.x + 0.2, rwTop - 0.05], [spec.rw.x + 0.1, 0.5], [-0.3, 0.6]], 0.01, 0));
  }
  if (spec.tWing) p.carbon.push(wingSpan({ z0: -0.25, z1: 0.25, steps: 4, at: () => ({ x: spec.rear - 0.1, y: 0.78, chord: 0.1, angle: 0.2 }) }));
  if (spec.monkey) p.carbon.push(wingSpan({ z0: -0.12, z1: 0.12, steps: 3, at: () => ({ x: spec.rear - 0.45, y: 0.5, chord: 0.16, angle: 0.25 }) }));
  if (spec.deflectors) {
    // Wheel-wake deflectors over the front tyres (2022-25).
    both((side) => p.carbon.push(wingSpan({ z0: side * (spec.ft / 2 - spec.tf.w * 0.45), z1: side * (spec.ft / 2 + spec.tf.w * 0.45), steps: 3, thickness: 0.08, camber: 0.04, at: () => ({ x: spec.front + 0.18, y: spec.tf.r * 2 + 0.04, chord: 0.36, angle: -0.15 }) })));
  }

  // Exhausts.
  if (spec.turboPipes || spec.exhaust === "diffuser") both((side) => p.metal.push(tube([[spec.rear + 0.3, 0.22, side * 0.2], [spec.rear - 0.1, 0.24, side * 0.22], [spec.rear - 0.35, 0.25, side * 0.22]], 0.035, 10)));
  if (spec.exhaust === "periscope") both((side) => p.metal.push(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 12).rotateZ(-0.7).translate(-0.85, 0.42, side * 0.36)));
  if (spec.exhaust === "coanda") both((side) => p.metal.push(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12).rotateZ(Math.PI / 2 - 0.3).translate(-0.9, 0.3, side * 0.45)));
  if (spec.exhaust === "centre") {
    const tail = new THREE.CylinderGeometry(0.045, 0.05, 0.25, 16);
    tail.rotateZ(Math.PI / 2 - 0.08);
    tail.translate(spec.rear - 0.48, gearbox.yt + 0.04, 0);
    p.metal.push(tail);
    if (spec.wastegates) both((side) => p.metal.push(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 10).rotateZ(Math.PI / 2 - 0.08).translate(spec.rear - 0.45, gearbox.yt - 0.04, side * 0.06)));
  }

  // The halo: two rear legs on the chassis behind the shoulders, a hoop round
  // the helmet and a centre pillar ahead of the driver.
  if (spec.halo) {
    const top = head[1] + 0.13;
    const front = cockpit.x1 - 0.08;
    const legs = head[0] - 0.24;
    const hoop = [[legs, cockpit.y + 0.02, -0.25], [legs + 0.04, top - 0.03, -0.24], [head[0] + 0.18, top + 0.01, -0.2], [front - 0.12, top - 0.015, -0.08], [front - 0.08, top - 0.02, 0], [front - 0.12, top - 0.015, 0.08], [head[0] + 0.18, top + 0.01, 0.2], [legs + 0.04, top - 0.03, 0.24], [legs, cockpit.y + 0.02, 0.25]];
    const curve = new THREE.CatmullRomCurve3(hoop.map((q) => new THREE.Vector3(...q)));
    const halo = new THREE.TubeGeometry(curve, 48, 0.026, 10, false);
    halo.scale(1, 0.8, 1);
    halo.translate(0, (top - 0.03) * 0.2, 0);
    p.halo.push(halo);
    p.halo.push(fairing([front + 0.04, cockpit.y + 0.01, 0], [front - 0.08, top - 0.02, 0], 0.07, 0.03));
  }

  // Mirrors: on stalks, on the sidepods, or hung off the halo.
  if (spec.mirrors) {
    both((side) => {
      const x = spec.mirrors === "sidepod" ? cockpit.x1 - 0.05 : cockpit.x1 - 0.12;
      const z = spec.mirrors === "sidepod" ? 0.48 : spec.mirrors === "halo" ? 0.42 : cockpit.w + 0.15;
      const y = spec.mirrors === "sidepod" ? 0.68 : cockpit.y + 0.13;
      const housing = new THREE.SphereGeometry(1, 16, 10);
      housing.scale(0.06, 0.035, 0.07);
      housing.translate(x, y, side * z);
      p.trim.push(housing);
      p.glass.push(new THREE.CircleGeometry(1, 16).scale(0.036, 0.075, 1).rotateY(-Math.PI / 2).rotateX(Math.PI / 2).rotateY(Math.PI / 2).translate(x - 0.06, y, side * z));
      if (spec.mirrors === "halo") p.carbon.push(fairing([x, y, side * (z - 0.05)], [head[0] + 0.15, head[1] + 0.1, side * 0.2], 0.05, 0.012));
      else if (spec.mirrors === "sidepod") p.carbon.push(fairing([x, y - 0.03, side * z], [x + 0.02, 0.56, side * (z - 0.02)], 0.06, 0.012));
      else p.carbon.push(rod([x, cockpit.y, side * (z - 0.1)], [x, y - 0.02, side * (z - 0.02)], 0.01));
    });
  }

  // Cameras and sensors of the modern car: nose cameras, the pitot, antennae.
  if (year >= 1998) {
    const nose = spec.tub[1];
    both((side) => p.carbon.push(box([0.11, 0.035, 0.03], [nose.x - 0.35, nose.yt - 0.02, side * (nose.w + 0.035)])));
    p.metal.push(rod([nose.x - 0.05, nose.yt, 0], [nose.x + 0.15, nose.yt + 0.03, 0], 0.004));
    p.black.push(rod([cockpit.x1 + 0.05, cockpit.y + 0.02, 0.08], [cockpit.x1 + 0.03, cockpit.y + 0.14, 0.08], 0.003));
  }

  // Suspension: double wishbones, a push or pull rod and a steering arm to each wheel.
  [
    [spec.front, spec.ft, spec.tf, true],
    [spec.rear, spec.rt, spec.tr, false],
  ].forEach(([x, track, t, isFront]) => {
    const hubZ = track / 2 - t.w * 0.38;
    const body = tubHalf(spec, x);
    both((side) => {
      const inner = Math.max(0.12, isFront ? body.w * 0.85 : 0.16);
      const yTop = isFront ? Math.max(t.r + 0.1, body.yt - 0.06) : t.r + 0.12;
      const yLow = isFront ? Math.max(0.12, body.yb + 0.04) : 0.14;
      const arm = (a, b) => {
        if (spec.suspension === "fair") p.carbon.push(fairing(a, b, 0.05, 0.014));
        else (spec.suspension === "metal" ? p.metal : p.carbon).push(rod(a, b, 0.012));
      };
      arm([x + 0.22, yTop, side * inner], [x, t.r + 0.1, side * hubZ]);
      arm([x - 0.22, yTop - 0.02, side * inner], [x, t.r + 0.1, side * hubZ]);
      arm([x + 0.26, yLow, side * inner], [x, t.r - 0.1, side * hubZ]);
      arm([x - 0.24, yLow, side * inner], [x, t.r - 0.1, side * hubZ]);
      // Pushrod from the bottom of the upright up to the chassis, or (2022 fronts, 2009- rears) a pullrod down to it.
      const pull = isFront ? spec.pullrodFront : year >= 2009;
      arm(pull ? [x - 0.04, t.r + 0.1, side * hubZ * 0.92] : [x - 0.04, t.r - 0.08, side * hubZ * 0.92], pull ? [x - 0.12, yLow + 0.02, side * inner * 0.9] : [x - 0.12, yTop + 0.02, side * inner * 0.85]);
      if (isFront) arm([x + 0.1, (yTop + yLow) / 2, side * inner], [x + 0.08, t.r, side * hubZ]);
      // Upright and brake duct inside the wheel.
      p.carbon.push(box([0.07, t.r * 0.9, 0.05], [x, t.r, side * (hubZ - 0.03)]));
      if (year >= 1990) {
        const drum = new THREE.CylinderGeometry(t.rim * 0.82, t.rim * 0.86, 0.08, 18);
        drum.rotateX(Math.PI / 2);
        drum.translate(x, t.r, side * (track / 2 - t.w / 2 + 0.035));
        p.carbon.push(drum);
        // Duct scoop facing forward.
        p.black.push(box([0.02, 0.07, 0.06], [x + t.rim * 0.8, t.r - 0.03, side * (track / 2 - t.w / 2 + 0.03)]));
      }
      if (!isFront && year >= 2009 && year <= 2021) {
        // Rear brake-duct winglets.
        const z = side * (track / 2 - t.w / 2 - 0.06);
        p.carbon.push(plate([[x + 0.2, t.r * 0.5], [x - 0.18, t.r * 0.5], [x - 0.18, t.r * 1.85], [x + 0.12, t.r * 1.75]], 0.01, z));
        for (let k = 0; k < 3; k += 1) p.carbon.push(wingSpan({ z0: z, z1: z - side * 0.1, steps: 2, at: () => ({ x: x + 0.12 - k * 0.04, y: t.r * (1.3 + k * 0.17), chord: 0.24, angle: 0.15 }) }));
      }
    });
  });

  // 2014's finger nose: a thin tip run out ahead of the tub.
  if (year === 2014) {
    const tip = spec.tub[0];
    p.paint.push(loft([H(tip.x - 0.1, 0.03, tip.yb + 0.01, tip.yt - 0.01, { n: 2.2 }), H(tip.x + 0.1, 0.02, 0.12, 0.16, { n: 2 })], 12));
  }

  // Rain light on the crash structure.
  if (spec.light) p.light.push(box([0.03, 0.06, 0.14], [spec.rear - (spec.era === "ground" ? 0.62 : 0.55), 0.3, 0]));

  const out = {};
  Object.entries(p).forEach(([key, list]) => {
    out[key] = merge(list);
  });
  return out;
};

/** Where the decals go: the nose number, the T-camera, the team name on the wing. */
export const markings = (spec) => {
  const nose = spec.tub[2];
  return {
    number: [nose.x - 0.1, nose.yt + 0.012],
    tcam: spec.airbox ? [spec.airbox[spec.airbox.length - 1].x - 0.08, spec.airbox[spec.airbox.length - 1].yt] : null,
  };
};
