/**
 * Kerbs of a calibrated circuit for the kerb rumble (kerbs-wind; RF-3D-03, RF-3D-04):
 * data/circuits/<splineId>/kerbs.json, generated from the GLB mesh by
 * tools/assets/blender/extract_kerbs.py (never edited by hand). Each kerb runs from `fromM`
 * to `toM` metres along the spline from the line, on the `left` or `right` of the direction
 * of travel, its inner edge `edgeM` from the spline. A circuit without the file (procedural
 * or not extracted) has no kerbs: the rumble stays silent, as before.
 */

import bahrain1 from "../../data/circuits/bahrain-1/kerbs.json";
import hungaroring3 from "../../data/circuits/hungaroring-3/kerbs.json";
import interlagos2 from "../../data/circuits/interlagos-2/kerbs.json";
import monaco6 from "../../data/circuits/monaco-6/kerbs.json";
import montreal6 from "../../data/circuits/montreal-6/kerbs.json";
import monza7 from "../../data/circuits/monza-7/kerbs.json";
import nurburgring4 from "../../data/circuits/nurburgring-4/kerbs.json";
import shanghai1 from "../../data/circuits/shanghai-1/kerbs.json";
import silverstone7 from "../../data/circuits/silverstone-7/kerbs.json";
import spaFrancorchamps4 from "../../data/circuits/spa-francorchamps-4/kerbs.json";
import suzuka2 from "../../data/circuits/suzuka-2/kerbs.json";

/** splineId → kerbs.json. */
export const KERB_FILES = Object.fromEntries(
  [bahrain1, hungaroring3, interlagos2, monaco6, montreal6, monza7, nurburgring4, shanghai1, silverstone7, spaFrancorchamps4, suzuka2].map((data) => [data.splineId, data]),
);

const splineIdOf = (circuit) => {
  if (!circuit) return null;
  if (circuit.splineId) return circuit.splineId;
  return typeof circuit.id === "string" && circuit.id.startsWith("spline:") ? circuit.id.slice(7) : null;
};

const cache = new Map();

/**
 * The kerbs of a circuit as lap shares: [{ from, to, side: +1 right / -1 left, edgeM }],
 * `to` < `from` for a kerb across the line. Empty without data.
 */
export const kerbZonesFor = (circuit, files = KERB_FILES) => {
  const id = splineIdOf(circuit);
  const data = id ? files[id] : null;
  if (!data || !(data.lengthM > 0)) return [];
  if (files === KERB_FILES && cache.has(id)) return cache.get(id);
  const zones = data.kerbs.map((kerb) => ({
    from: (kerb.fromM / data.lengthM) % 1,
    to: (kerb.toM / data.lengthM) % 1,
    side: kerb.side === "right" ? 1 : -1,
    edgeM: kerb.edgeM,
  }));
  if (files === KERB_FILES) cache.set(id, zones);
  return zones;
};

/**
 * Is a car on a kerb? `share` is its lap share (pose.progress), `lateral` its offset from the
 * spline in metres (+ = right, as splines.json `line` and the step race's pose.lateral). On a
 * kerb when inside a zone and within `reachM` of that side's edge or beyond it. Without a
 * lateral (the quick mode) nobody is on a kerb.
 */
export const onKerb = (zones, share, lateral, reachM) => {
  if (!zones.length || !Number.isFinite(share) || !Number.isFinite(lateral)) return false;
  const f = ((share % 1) + 1) % 1;
  return zones.some((zone) => {
    const inside = zone.from <= zone.to ? f >= zone.from && f <= zone.to : f >= zone.from || f <= zone.to;
    return inside && zone.side * lateral >= zone.edgeM - reachM;
  });
};
