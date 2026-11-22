/**
 * RF-3D-06 showroom: the turntable frames the car by its own size for any box
 * shape, so the side view is never clipped (the old camera sat at a fixed 7.4 m
 * for any aspect above 1.4 and cut the car's ends in boxes narrower than ~2.2:1).
 */

import { fitsView, frameTurntable } from "./showroomFraming";

// A normalised modern car (SRS 4.3 / ADR-001: ~5.6 m long, 2 m wide, ~1 m tall).
const CAR = { radius: Math.hypot(5.6, 2.0) / 2, minY: 0, maxY: 0.95 };
const VIEW = { fov: 24, elevation: Math.asin(2.6 / Math.hypot(6.8, 2.6, 6.8)) };

describe("showroom framing", () => {
  it.each([0.6, 1, 1.4, 1.6, 1.8, 2, 2.2, 2.8, 3.5])("keeps the whole turning car in view at aspect %s", (aspect) => {
    const { distance, targetY } = frameTurntable({ ...CAR, ...VIEW, aspect, margin: 0.06 });
    expect(fitsView({ ...CAR, ...VIEW, aspect, distance, targetY, margin: 0.06 })).toBe(true);
    // ...and is tight: a little closer and it no longer fits.
    expect(fitsView({ ...CAR, ...VIEW, aspect, distance: distance * 0.97, targetY, margin: 0.06 })).toBe(false);
  });

  it("the old fixed 7.4 m camera clipped the car in a 1.8:1 box", () => {
    expect(fitsView({ ...CAR, ...VIEW, aspect: 1.8, distance: 7.4, targetY: 0.35 })).toBe(false);
  });

  it("backs off for a narrower box and a bigger car", () => {
    const wide = frameTurntable({ ...CAR, ...VIEW, aspect: 2.6 });
    const narrow = frameTurntable({ ...CAR, ...VIEW, aspect: 1.2 });
    const big = frameTurntable({ ...CAR, radius: CAR.radius * 1.3, ...VIEW, aspect: 2.6 });
    expect(narrow.distance).toBeGreaterThan(wide.distance);
    expect(big.distance).toBeGreaterThan(wide.distance);
  });

  it("aims at the car's middle height", () => {
    const { targetY } = frameTurntable({ ...CAR, ...VIEW, aspect: 2 });
    expect(targetY).toBeGreaterThan(CAR.minY);
    expect(targetY).toBeLessThan(CAR.maxY);
  });
});
