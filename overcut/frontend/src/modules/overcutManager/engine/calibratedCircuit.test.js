/**
 * RF-3D-03: a circuit built from a calibrated spline (the centre line of the
 * real asphalt, from tools/assets) instead of a sketch, and how venue.js picks
 * it (splineFor / circuitFor). Synthetic paths only: the real splines.json is
 * filled by the asset pipeline and may still be empty.
 */

import { CORNER_RADIUS, buildCircuitFromPath } from "./trackGeometry";
import { circuitFor, circuitRefFor, splineFor } from "./venue";
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
