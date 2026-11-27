/**
 * The racing line: where on the road a car actually drives (RF-3D-03; SIM-FISICA §3.1, WP9).
 *
 * The line is the engine's (engine/trackData.js trackDataFor): on a calibrated circuit the
 * minimum-curvature line inside the measured asphalt of splines.json; on a sketch, the same
 * solver inside the procedural width. The view no longer draws its own out-in-out arcs with a
 * fixed half road: what the cars drive on screen is what the speed trace was computed on. The
 * view adds the offset to each car's position and turns the car by the line's own angle.
 *
 * CAM-C2 (F1M24-CHINA §1.5 «Trazada y lateral», GS-07 / VIEW-08 de la vista; RF-3D-03, criterio
 * 7.2): the engine owns this geometry. The samples, their angles and the clamp to the asphalt are
 * engine/trackData.js lineGeometryFor / lineAt - the very functions positionAt places the cars with
 * for the step race's lateral separation - so the view keeps no copy of its own: a car is drawn
 * exactly where the engine measured it (cierra CAM-3).
 */

import { lineAt, lineGeometryFor } from "../engine/trackData";

/** Lateral offset (metres, positive to the right of travel) for every centreline sample, its angle, and the road's half widths (the engine's, engine/trackData.js lineGeometryFor). */
export const racingLine = (circuit) => lineGeometryFor(circuit);

/**
 * Move a centreline pose onto the racing line. Poses in the pit lane, on the
 * grid, parked or in a garage are left where they are. `pose.lateral` (the step race's sideways
 * move, already in x/y) and the line stay on the asphalt as engine/trackData.js lineAt clamps them.
 */
export const onRacingLine = (circuit, pose) => {
  if (pose.inPit || pose.onGrid || pose.parked || pose.garage || pose.progress === undefined) return pose;
  const { offset, angle } = lineAt(circuit, pose.progress, pose.lateral ?? 0);
  return {
    ...pose,
    x: pose.x - Math.sin(pose.heading) * offset,
    y: pose.y + Math.cos(pose.heading) * offset,
    heading: pose.heading + angle,
    lineOffset: offset,
  };
};
