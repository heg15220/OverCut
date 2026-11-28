/**
 * Kerbs of a calibrated circuit for the kerb rumble (kerbs-wind; RF-3D-03, RF-3D-04):
 * data/circuits/<splineId>/kerbs.json, generated from the GLB mesh by
 * tools/assets/blender/extract_kerbs.py (never edited by hand). Each kerb runs from `fromM`
 * to `toM` metres along the spline from the line, on the `left` or `right` of the direction
 * of travel, its inner edge `edgeM` from the spline. A circuit without the file (procedural
 * or not extracted) has no kerbs: the rumble stays silent, as before. AUD-C8 (F1M24-CHINA §2.7): the
 * pitch of the bumps (`stripeM`) is measured on the mesh too (v2), and the car's place across the
 * road is the engine's distance from the spline (racing line + lateral, §1.5), not its offset from
 * the racing line alone.
 */

import { lineAt } from "../../engine/trackData";
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
  // AUD-C8: the pitch of each kerb's bumps measured on the mesh (extract_kerbs.py v2), else the
  // circuit's measured median, else null (the reader falls back on audio.json ambience.kerb).
  const circuitStripe = Number.isFinite(data.stripeM) && data.stripeM > 0 ? data.stripeM : null;
  const zones = data.kerbs.map((kerb) => ({
    from: (kerb.fromM / data.lengthM) % 1,
    to: (kerb.toM / data.lengthM) % 1,
    side: kerb.side === "right" ? 1 : -1,
    edgeM: kerb.edgeM,
    stripeM: Number.isFinite(kerb.stripeM) && kerb.stripeM > 0 ? kerb.stripeM : circuitStripe,
  }));
  if (files === KERB_FILES) cache.set(id, zones);
  return zones;
};

/** The measured bump pitch of a circuit's kerbs (kerbs.json stripeM, status measured), or null. */
export const stripeOf = (circuit, files = KERB_FILES) => {
  const id = splineIdOf(circuit);
  const data = id ? files[id] : null;
  return data && data.stripeStatus === "measured" && Number.isFinite(data.stripeM) && data.stripeM > 0 ? data.stripeM : null;
};

/**
 * AUD-C8 (F1M24-CHINA §1.5 «Trazada y lateral»): a car's distance from the spline (metres, + =
 * right of travel), the frame kerbs.json `edgeM` is measured in. The engine owns it: the pose's
 * `axisOffset` (GS-07), else its `lineOffset` + `lateral`, else the racing line there read from
 * engine/trackData.js lineAt (the engine's own function) + `lateral`. Without a built circuit, the
 * bare `lateral` (as before, when it was taken for the distance from the spline). NaN without a lateral.
 */
export const axisOffsetOf = (pose, circuit = null) => {
  if (!pose) return NaN;
  if (Number.isFinite(pose.axisOffset)) return pose.axisOffset;
  const lat = pose.lateral;
  if (!Number.isFinite(lat)) return NaN;
  if (Number.isFinite(pose.lineOffset)) return pose.lineOffset + lat;
  if (circuit && Array.isArray(circuit.points) && circuit.points.length > 3 && circuit.dist && Number.isFinite(pose.progress)) {
    try {
      const { offset } = lineAt(circuit, pose.progress, lat);
      if (Number.isFinite(offset)) return offset + lat;
    } catch (error) {
      /* a circuit without track data: the bare lateral */
    }
  }
  return lat;
};

/**
 * The kerb a car is on, or null. `share` is its lap share (pose.progress), `offset` its distance
 * from the spline in metres (axisOffsetOf; + = right, as splines.json `line`). On a kerb when
 * inside a zone and within `reachM` of that side's edge or beyond it. Without an offset (the quick
 * mode) nobody is on a kerb.
 */
export const kerbAt = (zones, share, offset, reachM) => {
  if (!zones.length || !Number.isFinite(share) || !Number.isFinite(offset)) return null;
  const f = ((share % 1) + 1) % 1;
  return (
    zones.find((zone) => {
      const inside = zone.from <= zone.to ? f >= zone.from && f <= zone.to : f >= zone.from || f <= zone.to;
      return inside && zone.side * offset >= zone.edgeM - reachM;
    }) || null
  );
};

/** Is a car on a kerb? (kerbAt as a boolean) */
export const onKerb = (zones, share, offset, reachM) => Boolean(kerbAt(zones, share, offset, reachM));
