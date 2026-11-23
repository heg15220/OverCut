/**
 * WP9 of docs/manager/SIM-FISICA.md (§3.1, §3.7, §3.8; RF-3D-03, RF-3D-04, RNF-09): the live view
 * draws what the step race says, read from the worker's snapshots - the engine's speed (not a
 * difference of positions), its sideways place on top of the engine's racing line, always on the
 * asphalt, and in the pit lane the phase and stage of the stop, with the car standing still in
 * its box.
 */

import { weekendRaceArgs } from "../engine/career";
import { weekend } from "../engine/sim/simTestKit";
import { circuitFor } from "../engine/venue";
import { createRaceSession } from "../engine/worker/raceSession";
import { applyTick, mirrorOf } from "../engine/worker/raceClient";
import { liveCarAt } from "./raceClock";
import { onRacingLine, racingLine } from "../three/racingLine";
import { trackDataFor } from "../engine/trackData";

describe("WP9 · the live view reads the step race (SIM-FISICA §3.7)", () => {
  const w = weekend({ seed: "view" });
  const args = weekendRaceArgs(w.career);
  const session = createRaceSession();
  const mirror = mirrorOf(session.handle({ type: "create", args }));
  const circuit = circuitFor(mirror.race, mirror.year);
  const lapRef = mirror.race.baseLap;
  const seen = { poses: 0, offRoad: 0, maxV: 0, stationary: 0, stationaryMoving: 0, stages: new Set(), phases: new Set() };
  const { wl, wr, marginM } = racingLine(circuit);
  const n = circuit.points.length;

  beforeAll(() => {
    // 45 minutes of race in 4 s steps: the first stops happen in it.
    for (let k = 0; k < 675; k += 1) {
      applyTick(mirror, session.handle({ type: "step", seconds: 4 }));
      const shot = mirror.snapshots[mirror.snapshots.length - 1];
      mirror.cars.forEach((car) => {
        if (car.status !== "running") return;
        const pose = liveCarAt(mirror, car, shot.clock, circuit, lapRef);
        if (pose.onGrid || pose.parked || pose.finished) return;
        seen.poses += 1;
        if (Number.isFinite(pose.v)) seen.maxV = Math.max(seen.maxV, pose.v);
        if (pose.inPit) {
          if (pose.pitPhase) seen.phases.add(pose.pitPhase);
          if (pose.pitStage) seen.stages.add(typeof pose.pitStage === "string" ? pose.pitStage : pose.pitStage.name || pose.pitStage.stage);
          if (pose.pitPhase === "STATIONARY") {
            seen.stationary += 1;
            if (pose.v !== 0) seen.stationaryMoving += 1;
          }
          return;
        }
        const drawn = onRacingLine(circuit, pose);
        const i = Math.floor((((pose.progress % 1) + 1) % 1) * n) % n;
        const total = (drawn.lineOffset ?? 0) + (pose.lateral ?? 0);
        // Within the half widths of the samples either side of the car, less its half width and clearance.
        const j = (i + 1) % n;
        const left = Math.max(wl[i], wl[j]) - marginM;
        const right = Math.max(wr[i], wr[j]) - marginM;
        if (total < -left - 1e-6 || total > right + 1e-6) seen.offRoad += 1;
      });
    }
  });

  it("the racing line drawn is the engine's (trackData), not a view-made one", () => {
    expect(Array.from(racingLine(circuit).offsets)).toEqual(Array.from(Float32Array.from(trackDataFor(circuit).line)));
  });

  it("every car drawn on track is on the asphalt: line plus the engine's lateral within the half widths", () => {
    expect(seen.poses).toBeGreaterThan(1000);
    expect(seen.offRoad).toBe(0);
  });

  it("speed comes from the engine, in a racing car's range", () => {
    expect(seen.maxV * 3.6).toBeGreaterThan(250);
    expect(seen.maxV * 3.6).toBeLessThan(380);
  });

  it("in the pit lane: the phases of the stop, its stages, and v = 0 while it stands in the box", () => {
    expect(seen.phases.has("LIMITER") || seen.phases.has("BOX_APPROACH")).toBe(true);
    expect(seen.stationary).toBeGreaterThan(0);
    expect(seen.stationaryMoving).toBe(0);
    expect(seen.stages.size).toBeGreaterThan(0);
  });
});
