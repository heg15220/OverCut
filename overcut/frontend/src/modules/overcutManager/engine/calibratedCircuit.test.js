/**
 * RF-3D-03: a circuit built from a calibrated spline (the centre line of the
 * real asphalt, from tools/assets) instead of a sketch, and how venue.js picks
 * it (splineFor / circuitFor). Synthetic paths only: the real splines.json is
 * filled by the asset pipeline and may still be empty.
 */

import { CORNER_RADIUS, buildCircuit, buildCircuitFromPath, pitPoseAt, poseAt } from "./trackGeometry";
import { layoutFor } from "./layouts";
import { circuitFor, circuitRefFor, namedLike, splineFor } from "./venue";
import calibrated from "../data/splines.json";
import { loadSeasonPack } from "./packs/seasonPacks";

/**
 * A closed path from pieces, sampled every ~6 m, in decimetres (rounded, as the
 * pipeline writes them). Starts at (0, 0) heading east; y grows "up" (left turns
 * are positive). `pieces`: { straight: metres } or { arc: radius, turn: radians }.
 */
const pathFrom = (pieces, { step = 6, startShift = 0 } = {}) => {
  const metres = [];
  let x = 0;
  let y = 0;
  let h = 0;
  pieces.forEach((piece) => {
    if (piece.straight) {
      const count = Math.round(piece.straight / step);
      const d = piece.straight / count;
      for (let k = 0; k < count; k += 1) {
        metres.push([x, y]);
        x += Math.cos(h) * d;
        y += Math.sin(h) * d;
      }
    } else {
      const r = piece.arc;
      const sign = Math.sign(piece.turn);
      const count = Math.max(2, Math.round((Math.abs(piece.turn) * r) / step));
      const cx = x - Math.sin(h) * r * sign;
      const cy = y + Math.cos(h) * r * sign;
      const a0 = Math.atan2(y - cy, x - cx);
      for (let k = 0; k < count; k += 1) {
        const a = a0 + (piece.turn * k) / count;
        metres.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      x = cx + Math.cos(a0 + piece.turn) * r;
      y = cy + Math.sin(a0 + piece.turn) * r;
      h += piece.turn;
    }
  });
  // The loop must close on itself (within a decimetre or so).
  expect(Math.hypot(x, y)).toBeLessThan(0.5);
  const shifted = metres.slice(startShift).concat(metres.slice(0, startShift));
  const points = [];
  shifted.forEach(([px, py]) => points.push(Math.round(px * 10), Math.round(py * 10)));
  return points;
};

/** The polyline's own closed length in metres. */
const ownLength = (points) => {
  let total = 0;
  const n = points.length / 2;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    total += Math.hypot(points[2 * j] - points[2 * i], points[2 * j + 1] - points[2 * i + 1]) / 10;
  }
  return total;
};

const HALF = Math.PI / 2;

// ~5.26 km: 2000 x 700 m with 80 m corners, start in the middle of the bottom straight (anticlockwise, all left).
const rectangle = () =>
  pathFrom([
    { straight: 920 }, { arc: 80, turn: HALF }, { straight: 540 }, { arc: 80, turn: HALF },
    { straight: 1840 }, { arc: 80, turn: HALF }, { straight: 540 }, { arc: 80, turn: HALF }, { straight: 920 },
  ]);

// ~5.27 km with a 15 m right-hand hairpin between three left-handers.
const withHairpin = () =>
  pathFrom([
    { straight: 1500 }, { arc: 150, turn: Math.PI }, { straight: 500 }, { arc: 15, turn: -Math.PI },
    { straight: 300 }, { arc: 100, turn: Math.PI }, { straight: 1300 }, { arc: 265, turn: Math.PI },
  ]);

describe("RF-3D-03 · buildCircuitFromPath (calibrated spline)", () => {
  it("keeps the length of the spline itself (within 1%) and starts at its first point", () => {
    [rectangle(), withHairpin()].forEach((points, index) => {
      const own = ownLength(points);
      const circuit = buildCircuitFromPath({ id: `synthetic-${index}`, km: own / 1000, points }, 2012);
      expect(Math.abs(circuit.length - own) / own).toBeLessThan(0.01);
      expect(circuit.length).toBeGreaterThan(5000);
      expect(circuit.dist[0]).toBe(0);
      // The engine smooths the spline's decimetre noise: the line stays within a metre of its first point.
      expect(Math.hypot(circuit.points[0].x - points[0] / 10, circuit.points[0].y - points[1] / 10)).toBeLessThan(1);
      expect(circuit.calibrated).toBe(true);
      expect(circuit.points).toHaveLength(points.length / 2);
    });
  });

  it("finds the four corners of a rounded rectangle, all turning the same way", () => {
    const circuit = buildCircuitFromPath({ id: "rect", km: 5.26, points: rectangle() }, 2012);
    expect(circuit.corners).toHaveLength(4);
    expect(new Set(circuit.corners.map((corner) => corner.sign))).toEqual(new Set([1]));
    circuit.corners.forEach((corner, index) => {
      expect(corner.number).toBe(index + 1);
      if (index) expect(corner.from).toBeGreaterThan(circuit.corners[index - 1].to);
    });
    // Four identical corners, taken at the same speed.
    const speeds = circuit.corners.map((corner) => corner.kmh);
    expect(Math.max(...speeds) - Math.min(...speeds)).toBeLessThanOrEqual(2);
  });

  it("finds the hairpin: right-handed among left-handers, and the slowest corner of the lap", () => {
    const circuit = buildCircuitFromPath({ id: "hairpin", km: 5.27, points: withHairpin() }, 2012);
    expect(circuit.corners.map((corner) => corner.sign)).toEqual([1, -1, 1, 1]);
    const slowest = circuit.corners.reduce((a, b) => (b.kmh < a.kmh ? b : a));
    expect(slowest.number).toBe(2);
    expect(slowest.kind).toBe("slow");
    // A 2012 car is flat through both big sweeps; a 1960 car (no downforce) takes the 265 m one faster than the 150 m one.
    const old = buildCircuitFromPath({ id: "hairpin", km: 5.27, points: withHairpin() }, 1960);
    expect(old.corners.map((corner) => corner.sign)).toEqual([1, -1, 1, 1]);
    expect(old.corners[3].kmh).toBeGreaterThan(old.corners[0].kmh);
    expect(old.corners[0].kmh).toBeGreaterThan(old.corners[1].kmh);
  });

  it("does not split a corner in two when the decimetre rounding makes curvature flicker at the threshold", () => {
    // Arcs barely tighter than CORNER_RADIUS: the smoothed curvature hovers around 1/CORNER_RADIUS.
    const r = CORNER_RADIUS - 8;
    const points = pathFrom([{ straight: 1200 }, { arc: r, turn: Math.PI }, { straight: 1200 }, { arc: r, turn: Math.PI }]);
    const circuit = buildCircuitFromPath({ id: "flicker", km: ownLength(points) / 1000, points }, 2012);
    // However the flicker falls, no two numbered corners may be the same group of samples.
    const spans = circuit.corners.map((corner) => [corner.from, corner.to]);
    spans.forEach((span, index) => {
      if (index) expect(span[0]).toBeGreaterThan(spans[index - 1][1]);
    });
    expect(circuit.corners.length).toBeLessThanOrEqual(2);
  });

  it("drops a closing point that repeats the first one", () => {
    const points = rectangle();
    const closed = buildCircuitFromPath({ id: "closed", km: 5.26, points: points.concat(points.slice(0, 2)) }, 2012);
    const open = buildCircuitFromPath({ id: "closed", km: 5.26, points }, 2012);
    expect(closed.points).toHaveLength(open.points.length);
    expect(closed.length).toBeCloseTo(open.length, 6);
  });

  it("has no DRS before 2011 and DRS on the long straights from 2011 (SRS 6.2)", () => {
    const points = withHairpin();
    [2005, 2008, 2010].forEach((year) => {
      expect(buildCircuitFromPath({ id: "h", km: 5.27, points }, year).drsZones).toEqual([]);
    });
    const modern = buildCircuitFromPath({ id: "h", km: 5.27, points }, 2012);
    expect(modern.drsZones.length).toBeGreaterThanOrEqual(1);
    expect(modern.drsZones.length).toBeLessThanOrEqual(2);
    modern.drsZones.forEach((zone) => {
      expect(zone.from).toBeGreaterThanOrEqual(0);
      expect(zone.to).toBeLessThanOrEqual(1);
    });
    // `drs` from the sketch limits the number of zones.
    expect(buildCircuitFromPath({ id: "h", km: 5.27, points, drs: 1 }, 2012).drsZones).toHaveLength(1);
  });

  it("splits the lap into three increasing sectors and stays deterministic", () => {
    const points = withHairpin();
    const a = buildCircuitFromPath({ id: "h", km: 5.27, points }, 2012);
    const b = buildCircuitFromPath({ id: "h", km: 5.27, points: points.slice() }, 2012);
    expect(a.sectors).toHaveLength(3);
    expect(a.sectors[0]).toBe(0);
    expect(a.sectors[1]).toBeGreaterThan(a.sectors[0]);
    expect(a.sectors[2]).toBeGreaterThan(a.sectors[1]);
    expect(a.sectors[2]).toBeLessThan(1);
    expect(JSON.parse(JSON.stringify(b))).toEqual(JSON.parse(JSON.stringify(a)));
    // A lap that makes sense: average speed of an F1 car.
    const kmh = (a.length / a.simulatedLap) * 3.6;
    expect(kmh).toBeGreaterThan(150);
    expect(kmh).toBeLessThan(300);
  });

  it("rejects a spline that is all corner", () => {
    const points = pathFrom([{ arc: 100, turn: Math.PI }, { arc: 100, turn: Math.PI }]);
    expect(() => buildCircuitFromPath({ id: "circle", km: 0.63, points }, 2012)).toThrow("spline-without-straights");
  });
});

describe("RF-3D-03 · venue picks the calibrated spline", () => {
  const spline = (extra) => ({ km: 5.27, direction: "ANTICLOCKWISE", stepM: 6, points: withHairpin(), ...extra });

  it("matches by the pack's layout id first", () => {
    const splines = { "albert-park-1996": spline({ circuitRef: "melbourne", layoutRef: "albert_park", layoutId: "melbourne-1", validFrom: 1996, validTo: 2020 }) };
    const found = splineFor({ name: "Australian Grand Prix", layoutId: "melbourne-1" }, 2012, splines);
    expect(found.id).toBe("albert-park-1996");
    expect(found.layoutId).toBe("melbourne-1");
  });

  it("does not fall back to the sketch reference when the race has an unknown layout id", () => {
    const splines = { a: spline({ layoutRef: "albert_park", layoutId: "melbourne-1", validFrom: 1996, validTo: 2020 }) };
    expect(splineFor({ name: "Australian Grand Prix", layoutId: "melbourne-2" }, 2012, splines)).toBeNull();
  });

  it("without a layout id, matches by sketch reference and the years the layout was used", () => {
    const splines = { a: spline({ layoutRef: "albert_park", layoutId: "melbourne-1", validFrom: 1996, validTo: 2020 }) };
    expect(circuitRefFor({ name: "Australian Grand Prix" }, 2010)).toBe("albert_park");
    expect(splineFor({ name: "Australian Grand Prix" }, 2010, splines).id).toBe("a");
    expect(splineFor({ name: "Australian Grand Prix" }, 2021, splines)).toBeNull();
    // 1990 was Adelaide.
    expect(splineFor({ name: "Australian Grand Prix" }, 1990, splines)).toBeNull();
    expect(splineFor({ name: "Italian Grand Prix" }, 2010, splines)).toBeNull();
  });

  it("builds the race on the calibrated circuit when there is one", () => {
    const splines = { "test-calibrated": spline({ layoutRef: "albert_park", layoutId: "test-layout-1", validFrom: 1996, validTo: 2020 }) };
    const circuit = circuitFor({ name: "Australian Grand Prix", layoutId: "test-layout-1" }, 2012, splines);
    expect(circuit.calibrated).toBe(true);
    expect(circuit.splineId).toBe("test-calibrated");
    expect(circuit.ref).toBe("albert_park");
    expect(circuit.corners.length).toBe(4);
  });

  it("keeps the sketch circuit while splines.json has nothing for the race (RF-3D-02)", () => {
    const empty = Object.keys(calibrated.splines || {}).length === 0;
    const circuit = circuitFor({ name: "Australian Grand Prix", layoutId: "melbourne-1" }, 2012);
    if (empty) {
      expect(circuit.calibrated).toBeUndefined();
      expect(circuit.splineId).toBeUndefined();
    }
    expect(circuit.ref).toBe("albert_park");
    expect(circuitFor({ name: "Australian Grand Prix" }, 2012, {}).calibrated).toBeUndefined();
  });

  it("gives every 2012 pack round (with its layout id) a circuit to race on", async () => {
    const { pack } = await loadSeasonPack(2012);
    expect(pack.calendar.length).toBeGreaterThan(0);
    pack.calendar.forEach((event) => {
      expect(event.layoutId).toBeTruthy();
      const circuit = circuitFor({ name: `${event.name} Grand Prix`, layoutId: event.layoutId }, 2012);
      expect(circuit.length).toBeGreaterThan(3000);
      expect(circuit.corners.length).toBeGreaterThanOrEqual(3);
      expect(circuit.sectors).toHaveLength(3);
      // A calibrated spline, when present, must be the one of this very layout.
      if (circuit.splineId) expect(calibrated.splines[circuit.splineId].layoutId).toBe(event.layoutId);
    });
  });
});

/** A lane in metres, as [[x, y], ...] every ~6 m, to decimetres. */
const decimetres = (pts) => pts.flatMap(([x, y]) => [Math.round(x * 10), Math.round(y * 10)]);
const smoothstep = (t) => t * t * (3 - 2 * t);
/** A pit lane beside the rectangle's bottom straight: leaves at x0, runs `offset` m to the side, rejoins at x1. */
const laneBeside = (x0, x1, offset = -15, ramp = 100) => {
  const pts = [];
  for (let x = x0; x <= x1 + 1e-6; x += 6) {
    const t = Math.min(1, (x - x0) / ramp, (x1 - x) / ramp);
    pts.push([x, offset * smoothstep(Math.max(0, t))]);
  }
  return pts;
};

describe("RF-3D-03 · real pit lane on a calibrated circuit (extract_pitlane.py)", () => {
  const points = rectangle();
  const km = ownLength(points) / 1000;
  const build = (pit) => buildCircuitFromPath({ id: "rect-pit", km, points, pit }, 2012);

  it("uses the lane from the mesh: entry before the line, exit after, the line crossed on the way", () => {
    const circuit = build({ points: decimetres(laneBeside(-400, 520)) });
    const { pit, length } = circuit;
    expect(pit.source).toBe("mesh");
    expect(pit.entry).toBeCloseTo((length - 400) / length, 2);
    expect(pit.exit).toBeCloseTo(520 / length, 2);
    // 400 m of lane before the line out of ~920 (plus the ramps' extra length).
    expect(pit.lineAt).toBeGreaterThan(0.4);
    expect(pit.lineAt).toBeLessThan(0.47);
    expect(pit.boxAt).toBeGreaterThan(0);
    expect(pit.boxAt).toBeLessThan(pit.lineAt);
    // To the right of the race direction: the outside of this anticlockwise loop, where the
    // procedural lane (inside) would never be.
    expect(pit.side).toBe(-1);
    expect(build(undefined).pit.side).toBe(1);
    // Where it passes the line it runs 15 m to the right, parallel to the straight.
    const atLine = pitPoseAt(circuit, pit.lineAt);
    expect(atLine.y).toBeCloseTo(-15, 0);
    expect(Math.abs(atLine.x)).toBeLessThan(3);
    expect(Math.abs(atLine.heading)).toBeLessThan(0.05);
  });

  it("leaves and rejoins the track without a jump", () => {
    const circuit = build({ points: decimetres(laneBeside(-400, 520)) });
    const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    expect(near(pitPoseAt(circuit, 0), poseAt(circuit, circuit.pit.entry))).toBeLessThan(0.5);
    expect(near(pitPoseAt(circuit, 1), poseAt(circuit, circuit.pit.exit))).toBeLessThan(0.5);
    const path = circuit.pit.path;
    for (let k = 1; k < path.length; k += 1) expect(near(path[k], path[k - 1])).toBeLessThan(8);
  });

  it("keeps where the garages are, and stops the cars at a box before the line", () => {
    const { pit } = build({ points: decimetres(laneBeside(-400, 520)), boxFrom: 0.2, boxTo: 0.8 });
    expect(pit.boxFrom).toBe(0.2);
    expect(pit.boxTo).toBe(0.8);
    expect(pit.boxAt).toBeGreaterThanOrEqual(0.2);
    expect(pit.boxAt).toBeLessThan(pit.lineAt);
  });

  it("reaches the race through venue.circuitFor when splines.json carries the lane", () => {
    const splines = {
      "pit-test": {
        km, direction: "ANTICLOCKWISE", stepM: 6, points, layoutRef: "albert_park", layoutId: "pit-layout-1", validFrom: 1996, validTo: 2020,
        pit: { points: decimetres(laneBeside(-400, 520)), boxFrom: 0.2, boxTo: 0.8, side: "right" },
      },
    };
    const circuit = circuitFor({ name: "Australian Grand Prix", layoutId: "pit-layout-1" }, 2012, splines);
    expect(circuit.splineId).toBe("pit-test");
    expect(circuit.pit.source).toBe("mesh");
    expect(circuit.pit.boxFrom).toBe(0.2);
  });

  it("falls back to the procedural lane when the data cannot be raced on", () => {
    // Entirely after the line: the race clock needs the stop lap to end in the lane.
    expect(build({ points: decimetres(laneBeside(100, 700)) }).pit.source).toBe("procedural");
    // Its ends are not on the track (60 m away all along).
    expect(build({ points: decimetres(laneBeside(-400, 520).map(([x]) => [x, -60])) }).pit.source).toBe("procedural");
    // Too short to be a lane.
    expect(build({ points: decimetres([[-10, 0], [0, -10]]) }).pit.source).toBe("procedural");
    // No pit data at all, and every sketch: the procedural lane, unchanged.
    expect(build(undefined).pit.source).toBe("procedural");
    const sketch = buildCircuit(layoutFor("monza", 2012), 2012);
    expect(sketch.pit.source).toBe("procedural");
    expect(sketch.pit.lineAt).toBeGreaterThan(sketch.pit.boxAt);
  });
});

describe("RF-3D-03 · corner numbering on a calibrated circuit", () => {
  it("numbers a corner that runs across the line once, keeping from < apex < to", () => {
    // The rectangle with its line moved 10 samples into the first 80 m corner.
    const points = pathFrom([
      { straight: 920 }, { arc: 80, turn: HALF }, { straight: 540 }, { arc: 80, turn: HALF },
      { straight: 1840 }, { arc: 80, turn: HALF }, { straight: 540 }, { arc: 80, turn: HALF }, { straight: 920 },
    ], { startShift: Math.round(920 / 6) + 10 });
    const circuit = buildCircuitFromPath({ id: "across", km: ownLength(points) / 1000, points }, 2012);
    expect(circuit.corners.map((corner) => corner.number)).toEqual([1, 2, 3, 4]);
    circuit.corners.forEach((corner, index) => {
      expect(corner.from).toBeLessThan(corner.apex + 1e-9);
      expect(corner.apex).toBeLessThan(corner.to + 1e-9);
      if (index) expect(corner.from).toBeGreaterThan(circuit.corners[index - 1].to);
    });
    const across = circuit.corners.filter((corner) => corner.from < 0 || corner.to > 1);
    expect(across).toHaveLength(1);
  });

  it("does not number kinks, but numbers each half of a chicane", () => {
    const kink = [{ arc: 300, turn: 0.15 }, { arc: 300, turn: -0.15 }];
    const chicane = [{ arc: 35, turn: 0.9 }, { arc: 35, turn: -0.9 }];
    const lap = (extra) => pathFrom([
      { straight: 300 }, ...extra, { straight: 300 }, { arc: 80, turn: HALF }, { straight: 540 }, { arc: 80, turn: HALF },
      { straight: 600 }, ...extra, { straight: 920 }, { arc: 80, turn: HALF }, { straight: 540 }, { arc: 80, turn: HALF }, { straight: 920 },
    ]);
    const kinks = lap(kink);
    expect(buildCircuitFromPath({ id: "kinks", km: ownLength(kinks) / 1000, points: kinks }, 2012).corners).toHaveLength(4);
    const chicanes = lap(chicane);
    const withChicanes = buildCircuitFromPath({ id: "chicanes", km: ownLength(chicanes) / 1000, points: chicanes }, 2012);
    expect(withChicanes.corners).toHaveLength(8);
  });

  it("counts about as many corners as the official turn numbers on the real calibrated splines", () => {
    // Official turn counts of each layout, from f1db (circuit_layout.turns).
    const official = {
      "monza-7": 11, "spa-francorchamps-4": 19, "silverstone-7": 17, "shanghai-1": 16,
      "hungaroring-3": 14, "interlagos-2": 15, "montreal-6": 14, "bahrain-1": 15,
      "monaco-6": 19, "suzuka-2": 18, "nurburgring-4": 15,
    };
    // With the regenerated splines (2026-11-22, second extraction): monza 12, spa 19, silverstone 17,
    // shanghai 14, hungaroring 14, interlagos 13, montreal 12, bahrain 14, monaco 19, suzuka 18,
    // nurburgring 15. Official numbers also count some flat kinks (Montreal) and tightening arcs
    // (Shanghai 1-2) that curvature alone cannot always tell apart.
    const splines = calibrated.splines || {};
    Object.entries(official).forEach(([id, turns]) => {
      const spline = splines[id];
      if (!spline) return;
      [1990, 2012].forEach((year) => {
        const circuit = buildCircuitFromPath({ id, km: spline.km, points: spline.points }, year);
        expect(Math.abs(circuit.corners.length - turns)).toBeLessThanOrEqual(2);
        // Numbered once each, in order, none twice across the line.
        const numbers = circuit.corners.map((corner) => corner.number);
        expect(numbers).toEqual(numbers.map((_, index) => index + 1));
        circuit.corners.forEach((corner, index) => {
          if (index) expect(corner.from).toBeGreaterThan(circuit.corners[index - 1].to);
        });
        expect(circuit.corners[circuit.corners.length - 1].to - 1).toBeLessThan(circuit.corners[0].from + 1e-9);
      });
    });
  });

  it("takes corner names from the sketch only when both count the same corners", () => {
    const sketch = layoutFor("monza", 2012);
    const count = buildCircuit(sketch, 2012).corners.length;
    const corners = (k) => Array.from({ length: k }, (_, index) => ({ number: index + 1, name: null }));
    const named = namedLike(corners(count), sketch, 2012);
    Object.entries(sketch.names).forEach(([number, name]) => {
      if (Number(number) <= count) expect(named[Number(number) - 1].name).toBe(name);
    });
    expect(namedLike(corners(count + 1), sketch, 2012).every((corner) => corner.name === null)).toBe(true);
  });
});
