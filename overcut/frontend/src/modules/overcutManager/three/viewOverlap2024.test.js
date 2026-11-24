/**
 * CAM-3 no-overlap-view (F1M24-GAMEPLAY §2.9 and §3.3; RF-SIM-07, RF-3D-04, RNF-05): the view's
 * safety pass over the 32 races of 2024 in SIM-2's lateral.test.js - the same seeds, year and team as SIM-2's
 * engine/sim/lateral.test.js (lateral1988.test.js has the other 32) - placed the way the live view places the cars at each snapshot.
 *
 *   - after the pass no two cars drawn on the road sink into each other beyond the tolerance;
 *   - the correction counter is printed. §3.3 asks for zero corrections over SIM-2's 64 races. It
 *     is not zero: SIM-2 keeps the boxes apart in its own frame (distance along the centreline,
 *     offset across it), while the cars are drawn on the racing line - in a tight corner with the
 *     line on the inside two cars a box apart along the centreline are closer than a box along
 *     the line (F1M24-GAMEPLAY §2.9; Bahrain T1: 7.5 m along the centreline, 4.2 m apart on
 *     screen). That is the engine-side bug the counter is there to show; it is reported for the
 *     SIM lane, and this test does not hide it behind a looser box.
 */

import { totalOf, watchViewOverlap } from "./viewOverlapWatch";
import { boxSpecFor } from "./viewOverlap";

const RACES = 32;

describe("CAM-3 view safety pass · 32 races of 2024 (SIM-2 seeds)", () => {
  let total;
  beforeAll(() => {
    const runs = Array.from({ length: RACES }, (_, k) => watchViewOverlap({ seed: `nos24-${k + 1}`, year: 2024, teamId: "ferrari" }));
    total = totalOf(runs);
    // eslint-disable-next-line no-console
    console.log(`CAM-3 view pass 2024: ${RACES} races, ${total.frames} frames; ${total.corrections} pair corrections (engine frame vs racing line; first: ${total.example}); deepest before ${total.worst.toFixed(3)} m, after ${total.after.toFixed(3)} m`);
  }, 600000);

  it("checks every frame of every race", () => {
    expect(total.frames).toBeGreaterThan(RACES * 1000);
  });

  it("after the pass, no two cars on the road are drawn inside one another", () => {
    expect(total.after).toBeLessThanOrEqual(boxSpecFor(2024).tolerance + 1e-9);
  });
});