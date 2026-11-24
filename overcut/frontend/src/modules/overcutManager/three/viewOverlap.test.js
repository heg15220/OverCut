/**
 * CAM-3 no-overlap-view (F1M24-GAMEPLAY §2.9; RF-SIM-07, RF-3D-04, RNF-07): the view's safety
 * pass with oriented boxes of the era. The 64 races of SIM-2 run in viewOverlap2024.test.js and
 * viewOverlap1988.test.js.
 */

import broadcast from "../data/balance/broadcast.json";
import { LATERAL, lateralSpecFor } from "../engine/sim/lateral";
import { QUICK_REPLAY, boxPenetration, boxSpecFor, countOverlap, overlapPass, resetViewOverlapStats, viewOverlapStats } from "./viewOverlap";

const box = boxSpecFor(2024);

describe("the box of the era (race-physics.json lateral.eras) and the pass settings (broadcast.json)", () => {
  it("uses what the engine guarantees: the era's width and length and the lateral clearance", () => {
    expect(box.width).toBe(lateralSpecFor(2024).carWidth);
    expect(box.length).toBe(lateralSpecFor(2024).carLength);
    expect(boxSpecFor(1988).width).toBe(2.15);
    expect(box.clearance).toBe(LATERAL.clearanceMetres);
    expect(box.tolerance).toBe(broadcast.viewSafety.overlap.toleranceMetres);
    // The quick replay's wake and pull-out are data now (the 9 m and 2.3 m Race3D had in code).
    expect(QUICK_REPLAY).toMatchObject({ wakeMetres: 9, pullOutMetres: 2.3 });
  });
});

describe("oriented boxes", () => {
  it("measures how far two boxes sink into each other, along the axis of least penetration", () => {
    const a = { x: 0, z: 0, heading: 0 };
    expect(boxPenetration(a, { x: box.length - 0.4, z: 0, heading: 0 }, box.width, box.length).depth).toBeCloseTo(0.4, 9);
    expect(boxPenetration(a, { x: 0, z: box.width + 0.3, heading: 0 }, box.width, box.length).depth).toBeCloseTo(-0.3, 9);
    // Turned 90°: its length now runs across.
    const turned = boxPenetration(a, { x: 0, z: box.width / 2 + box.length / 2 - 0.2, heading: Math.PI / 2 }, box.width, box.length);
    expect(turned.depth).toBeCloseTo(0.2, 9);
    expect(Math.abs(turned.axis.z)).toBeCloseTo(1, 9);
  });
});

describe("the pass", () => {
  it("leaves apart cars alone and counts nothing", () => {
    const cars = [{ id: "a", x: 0, z: 0, heading: 0, along: 100 }, { id: "b", x: -8, z: 0, heading: 0, along: 92 }, { id: "c", x: -8, z: 2.4, heading: 0, along: 92 }];
    const result = overlapPass(cars, box);
    expect(result.corrections).toBe(0);
    expect(result.fixes.size).toBe(0);
  });

  it("moves the car behind back when nose to tail, sideways to the clearance when alongside; never the car ahead", () => {
    const inLine = overlapPass([{ id: "a", x: 0, z: 0, heading: 0, along: 100 }, { id: "b", x: -(box.length - 0.5), z: 0, heading: 0, along: 94.9 }], box);
    expect(inLine.corrections).toBe(1);
    expect(inLine.fixes.has("a")).toBe(false);
    expect(inLine.fixes.get("b").dx).toBeCloseTo(-0.5, 9);
    expect(inLine.after).toBeLessThanOrEqual(box.tolerance);
    const alongside = overlapPass([{ id: "a", x: 0, z: 0, heading: 0, along: 100 }, { id: "b", x: -1, z: box.width - 0.4, heading: 0, along: 99 }], box);
    expect(alongside.fixes.get("b").dz).toBeCloseTo(0.4 + box.clearance, 9);
    expect(alongside.after).toBeLessThanOrEqual(-box.clearance + 1e-9);
  });

  it("clears a car squeezed between two cars ahead, and three abreast", () => {
    const cars = [
      { id: "l", x: 0, z: -1.6, heading: 0, along: 100 },
      { id: "r", x: 0, z: 1.6, heading: 0, along: 100 },
      { id: "m", x: -2, z: 0, heading: 0, along: 98 },
    ];
    const result = overlapPass(cars, box);
    expect(result.worst).toBeGreaterThan(box.tolerance);
    expect(result.after).toBeLessThanOrEqual(box.tolerance + 1e-9);
    expect(result.fixes.has("l")).toBe(false);
    expect(result.fixes.has("r")).toBe(false);
  });

  it("keeps a development counter of every correction", () => {
    resetViewOverlapStats();
    countOverlap(overlapPass([{ id: "a", x: 0, z: 0, heading: 0, along: 10 }, { id: "b", x: -1, z: 0, heading: 0, along: 9 }], box));
    countOverlap(overlapPass([{ id: "a", x: 0, z: 0, heading: 0, along: 10 }], box));
    expect(viewOverlapStats()).toMatchObject({ frames: 2, corrections: 1 });
    resetViewOverlapStats();
    expect(viewOverlapStats().corrections).toBe(0);
  });

  it("is pure: the same cars give the same fixes and the input is not touched", () => {
    const cars = [{ id: "a", x: 0, z: 0, heading: 0.3, along: 10 }, { id: "b", x: -2, z: 0.5, heading: 0.1, along: 8 }];
    const before = JSON.stringify(cars);
    const a = overlapPass(cars, box);
    const b = overlapPass(cars, box);
    expect([...a.fixes]).toEqual([...b.fixes]);
    expect(JSON.stringify(cars)).toBe(before);
  });
});
