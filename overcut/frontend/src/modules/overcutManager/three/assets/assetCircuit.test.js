/**
 * RF-3D-03: the road height under a car on a real circuit, from the calibrated
 * spline. Gantries and roofs the pipeline's ray met over the road (4.5 m bumps
 * on Bahrain's main straight) must not lift the cars; real climbs stay.
 */

import { heightSampler, roadHeights } from "./assetCircuit";

// A 2 km straight loop sampled every 2 m: a 40 m climb over the lap (up then down).
const loop = (bump = () => 0) => {
  const points = [];
  for (let i = 0; i < 1000; i += 1) {
    const share = i / 1000;
    const climb = 20 - 20 * Math.cos(share * Math.PI * 2);
    points.push([i * 2, climb + bump(i), 0]);
  }
  return { points };
};

describe("road heights from the spline", () => {
  it("leave a real climb alone", () => {
    const spline = loop();
    const clean = roadHeights(spline.points);
    spline.points.forEach((p, i) => expect(Math.abs(clean[i] - p[1])).toBeLessThan(0.05));
  });

  it("take out gantries and a tunnel roof over the road", () => {
    // 4.5 m gantries 8 m long every 52 m on the first 800 m, and a 34 m roof 50 m up further on.
    const bump = (i) => (i < 400 && i % 26 < 4 ? 4.5 : 0) + (i >= 500 && i < 517 ? 50 : 0);
    const spline = loop(bump);
    const truth = loop();
    const clean = roadHeights(spline.points);
    truth.points.forEach((p, i) => expect(Math.abs(clean[i] - p[1])).toBeLessThan(0.3));
    const heightAt = heightSampler(spline);
    // The loop closes with one long segment back to the start: 1998 m of samples and 1998 m back.
    expect(heightAt(0)).toBeCloseTo(truth.points[0][1], 0);
    expect(heightAt((2 * 508) / 3996)).toBeCloseTo(truth.points[508][1], 0);
  });
});
