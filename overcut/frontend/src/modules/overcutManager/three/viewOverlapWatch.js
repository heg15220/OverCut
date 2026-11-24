/**
 * Test helper for CAM-3 no-overlap-view (F1M24-GAMEPLAY §2.9 and §3.3): the 64 races of SIM-2
 * (engine/sim/lateral.test.js, lateral1988.test.js - same seeds, same years, same teams) run step
 * by step, and at every step the cars on the road are placed the way the live view places them
 * at a snapshot (raceClock.liveCarAt: the centreline pose at the car's progress, offset by its
 * lateral; then three/racingLine.js onRacingLine) and passed through the view's safety pass
 * (three/viewOverlap.js) with the era's box. The pass's counter must stay at zero: a correction
 * would be an engine overlap the view had to hide.
 */

import { fromQuickRace, stepOnce } from "../engine/sim/index";
import { weekend } from "../engine/sim/simTestKit";
import { poseAt } from "../engine/trackGeometry";
import { offsetPose } from "../components/raceClock";
import { onRacingLine } from "./racingLine";
import { boxSpecFor, overlapPass } from "./viewOverlap";

const frac = (value) => value - Math.floor(value);

export const watchViewOverlap = ({ seed, year, teamId }) => {
  const w = weekend({ seed, year, teamId });
  const state = fromQuickRace(w.make(), { race: w.race });
  const sim = state._sim;
  const circuit = sim.lane.circuit;
  const box = boxSpecFor(year);
  const seen = { steps: 0, frames: 0, pairsChecked: 0, corrections: 0, worst: -Infinity, after: -Infinity, example: null };
  const cars = [];
  while (!state.finished) {
    stepOnce(state);
    seen.steps += 1;
    if (!sim.started) continue;
    cars.length = 0;
    for (let i = 0; i < sim.n; i += 1) {
      if (!sim.active[i] || sim.inPit[i] !== 0) continue;
      const progress = sim.P[i];
      const lat = sim.lat[i];
      const pose = onRacingLine(circuit, { ...offsetPose(poseAt(circuit, frac(progress)), lat), progress, lateral: lat });
      cars.push({ id: i, x: pose.x, z: pose.y, heading: pose.heading, along: frac(progress) * circuit.length });
    }
    const result = overlapPass(cars, box);
    seen.frames += 1;
    seen.pairsChecked += cars.length;
    seen.corrections += result.corrections;
    if (result.worst > seen.worst) seen.worst = result.worst;
    if (result.after > seen.after) seen.after = result.after;
    if (result.corrections && !seen.example) seen.example = `${seed} t=${sim.clock} cars ${[...result.fixes.keys()].join(",")} depth ${result.worst.toFixed(3)}`;
  }
  return { state, seen };
};

/** Sum of the counters of several watched races. */
export const totalOf = (runs) => {
  const out = { steps: 0, frames: 0, pairsChecked: 0, corrections: 0, worst: -Infinity, after: -Infinity, example: null };
  runs.forEach(({ seen }) => {
    out.steps += seen.steps;
    out.frames += seen.frames;
    out.pairsChecked += seen.pairsChecked;
    out.corrections += seen.corrections;
    out.worst = Math.max(out.worst, seen.worst);
    out.after = Math.max(out.after, seen.after);
    out.example = out.example ?? seen.example;
  });
  return out;
};
