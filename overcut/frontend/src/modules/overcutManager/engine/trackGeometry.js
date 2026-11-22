/**
 * From a hand-drawn sketch to a circuit you can race on.
 *
 * A layout (see `layouts.js`) is a loop of corner points drawn freehand on a
 * 100 x 100 sheet, each with the radius of the corner in metres. That is how a
 * circuit is remembered rather than traced: the order of the corners, roughly
 * where they sit and how tight they are. This module turns it into geometry:
 *
 *   1. fillets   every corner point becomes a circular arc of its radius,
 *                joined by straights, so the line is smooth and corner speeds
 *                come from real radii.
 *   2. scale     the sketch is stretched until the lap is the circuit's real
 *                length, so everything after works in metres.
 *   3. a lap     a point-mass lap simulation: cornering speed from radius and
 *                the era's grip, then forward (traction) and backward (braking)
 *                passes. That gives the speed trace, the braking zones, where
 *                the full-throttle straights are, and - normalised - where a car
 *                is at any fraction of its lap time.
 *
 * Nothing here knows about races; it is pure geometry, deterministic, with no other
 * imports but the point-mass car (sim/physics.js), so a layout can also be checked from a script.
 */

import { carFor, splineGeometry, topSpeedOf, traceOf } from "./sim/physics";

const TAU = Math.PI * 2;

const parsePoints = (sketch) =>
  sketch
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [x, y, r] = chunk.split(/\s+/).map(Number);
      return { x, y, r: Number.isFinite(r) ? r : 60 };
    });

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const len = (v) => Math.hypot(v.x, v.y);
const norm = (v) => {
  const l = len(v) || 1;
  return { x: v.x / l, y: v.y / l };
};
const cross = (a, b) => a.x * b.y - a.y * b.x;
const dot = (a, b) => a.x * b.x + a.y * b.y;

/** Signed perimeter area: tells which way the loop runs. */
const signedArea = (points) => {
  let area = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    area += p.x * q.y - q.x * p.y;
  });
  return area / 2;
};

/**
 * Round every corner of a closed polygon. `unit` converts a radius in metres to
 * sketch units. Returns dense samples with, for each, the radius of curvature
 * (Infinity on a straight), the turn direction and which corner it belongs to.
 */
const filletLoop = (vertices, unit, step) => {
  const n = vertices.length;
  const corners = vertices.map((vertex, i) => {
    const prev = vertices[(i - 1 + n) % n];
    const next = vertices[(i + 1) % n];
    const inDir = norm(sub(vertex, prev));
    const outDir = norm(sub(next, vertex));
    const turn = Math.atan2(cross(inDir, outDir), dot(inDir, outDir));
    const half = Math.abs(turn) / 2;
    const wanted = vertex.r * unit;
    // How far back along each leg the arc starts: never more than 48% of a leg,
    // so two neighbouring corners always leave room for each other.
    const room = Math.min(len(sub(vertex, prev)), len(sub(next, vertex))) * 0.48;
    let tangent = Math.abs(turn) < 1e-4 ? 0 : wanted * Math.tan(half);
    if (tangent > room) tangent = room;
    const radius = Math.abs(turn) < 1e-4 ? Infinity : tangent / Math.tan(half);
    return { vertex, inDir, outDir, turn, tangent, radius, index: i };
  });

  const samples = [];
  const push = (x, y, radius, sign, corner) => samples.push({ x, y, radius, sign, corner });

  corners.forEach((corner, i) => {
    const nextCorner = corners[(i + 1) % n];
    // The arc of this corner.
    if (corner.radius !== Infinity) {
      const start = { x: corner.vertex.x - corner.inDir.x * corner.tangent, y: corner.vertex.y - corner.inDir.y * corner.tangent };
      const sign = Math.sign(corner.turn);
      // Centre sits on the inside of the turn, perpendicular to the way in.
      const normal = { x: -corner.inDir.y * sign, y: corner.inDir.x * sign };
      const centre = { x: start.x + normal.x * corner.radius, y: start.y + normal.y * corner.radius };
      const startAngle = Math.atan2(start.y - centre.y, start.x - centre.x);
      const arcLength = Math.abs(corner.turn) * corner.radius;
      const count = Math.max(2, Math.ceil(arcLength / step));
      for (let k = 0; k < count; k += 1) {
        const angle = startAngle + (corner.turn * k) / count;
        push(centre.x + Math.cos(angle) * corner.radius, centre.y + Math.sin(angle) * corner.radius, corner.radius, sign, i);
      }
    }
    // The straight to the next corner.
    const from = { x: corner.vertex.x + corner.outDir.x * corner.tangent, y: corner.vertex.y + corner.outDir.y * corner.tangent };
    const to = { x: nextCorner.vertex.x - nextCorner.inDir.x * nextCorner.tangent, y: nextCorner.vertex.y - nextCorner.inDir.y * nextCorner.tangent };
    const straight = len(sub(to, from));
    const count = Math.max(1, Math.ceil(straight / step));
    for (let k = 0; k < count; k += 1) {
      push(from.x + ((to.x - from.x) * k) / count, from.y + ((to.y - from.y) * k) / count, Infinity, 0, -1);
    }
  });
  return { samples, corners };
};

/** Cumulative distance along a closed list of points. */
const accumulate = (points) => {
  const s = [0];
  for (let i = 1; i <= points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i % points.length];
    s.push(s[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return s;
};

/**
 * Car performance envelope by era (RF-SIM-01, WP2 of SIM-FISICA.md): the best car of the year
 * on a qualifying lap, from engine/sim/physics.js and data/balance/race-physics.json (RNF-07).
 * `vmax` is its top speed on an endless straight, `car` the full point-mass model. The old
 * envelope here had `aero` as a share of grip per v², so v² = g·grip·r / (1 − g·aero·r) blew up
 * at r ≥ 46 m (2017+) and every corner wider than that was flat out; the physical model has
 * downforce from ClA and a flat-out radius of m / (μ·½ρ·ClA), ≈ 150-250 m depending on the era.
 */
export const envelopeFor = (year = 2020, layoutRef = null) => {
  const car = carFor({ year, layoutRef });
  return { vmax: topSpeedOf(car), car };
};

/** The circuit reference of a sketched layout ("monza#0" -> "monza"), for its downforce level. */
const refOf = (layout) => layout.ref || String(layout.id || "").split("#")[0] || null;

/**
 * Speed trace around a lap: the point-mass simulation of physics.traceOf (corner limits, then
 * traction and braking passes inside the friction ellipse, twice round the loop so the start
 * of the lap inherits the exit of the last corner). `kappa` (1/m per sample) wins over the
 * radii when given: calibrated circuits pass the curvature of their racing line.
 */
const speedTrace = (sampleRadii, ds, env, kappa = null) => {
  const n = sampleRadii.length;
  const k = kappa && kappa.length === n ? kappa : Float64Array.from(sampleRadii, (radius) => (radius === Infinity ? 0 : 1 / Math.max(1, radius)));
  const trace = traceOf(env.car, k, Float64Array.from(ds));
  return Array.from(trace.v);
};

/**
 * Build a circuit from a layout. `layout` is `{ sketch, km, start, pitSide }`;
 * `year` picks the car the lap is simulated with.
 */
export const buildCircuit = (layout, year = 2020) => {
  const vertices = parsePoints(layout.sketch);
  // First pass in sketch units to measure the perimeter, then rescale to metres.
  const sketchPerimeter = vertices.reduce((sum, p, i) => sum + len(sub(vertices[(i + 1) % vertices.length], p)), 0);
  const metres = (layout.km || 4.5) * 1000;
  // The filleted lap is shorter than the polygon; iterate the scale twice to land on the real length.
  let scale = metres / sketchPerimeter;
  let built = null;
  const scaledBy = (factor) => vertices.map((p) => ({ x: p.x * factor, y: p.y * factor, r: p.r }));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    built = filletLoop(scaledBy(scale), 1, 6);
    const perimeter = accumulate(built.samples)[built.samples.length];
    scale *= metres / perimeter;
  }
  const { samples, corners } = built;
  const points = samples.map((sample) => ({ x: sample.x, y: sample.y }));
  const s = accumulate(points);
  const total = s[s.length - 1];
  const ds = points.map((_, i) => s[i + 1] - s[i]);

  // Rotate the start of the lap to the start line: `start` along the first leg.
  const env = envelopeFor(year, refOf(layout));
  const speed = speedTrace(samples.map((sample) => sample.radius), ds, env);
  const time = [0];
  for (let i = 0; i < points.length; i += 1) time.push(time[i] + ds[i] / Math.max(8, (speed[i] + speed[(i + 1) % points.length]) / 2));
  const lapTime = time[time.length - 1];

  // Direction of travel: clockwise or not, which side the inside of the loop is.
  const clockwise = signedArea(points) > 0;

  // Headings, smoothed lightly so sprites do not jitter on sample joints.
  const heading = points.map((p, i) => {
    const a = points[(i - 1 + points.length) % points.length];
    const b = points[(i + 1) % points.length];
    return Math.atan2(b.y - a.y, b.x - a.x);
  });

  // Bounding box for the map view.
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const box = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };

  // Start line: a share of the way along the first straight (the leg leaving vertex 0).
  const firstStraight = samples.findIndex((sample) => sample.corner === -1);
  let lastStraight = firstStraight;
  while (lastStraight + 1 < samples.length && samples[lastStraight + 1].corner === -1) lastStraight += 1;
  const lineAt = s[firstStraight] + (s[lastStraight] - s[firstStraight]) * (layout.start ?? 0.62);

  return finishCircuit({ layout, points, s, total, speed, time, lapTime, heading, samples, corners, clockwise, box, lineAt, env, year });
};

/**
 * Build a circuit from a calibrated spline (RF-3D-03) instead of a sketch: the
 * centre line of the real asphalt, already starting at the line and running in
 * the race direction (see tools/assets/align_spline.mjs).
 *
 * `path` is `{ id, km, points: [x0, y0, x1, y1, ...] in decimetres, names?, drs?, pit? }`.
 * Corners come from the curvature itself: wherever the radius, smoothed over
 * about 50 m, drops under 350 m a corner starts, and it lasts until the radius
 * opens past 490 m or the turn changes hand (the hysteresis keeps a long arc
 * near the threshold from flickering into many corners); its turn is the
 * curvature integrated along it. Then, to count corners the way official turn
 * numbers do: two apexes with an almost straight stretch between them are two
 * corners; a corner is numbered when it turns more than ~23 degrees or is a fast
 * sweeping kink (~15 degrees at 130-170 m); a slalom of small alternating pieces
 * is the spline weaving and carries no number; a corner turning more than ~206
 * degrees (a snail) carries two. Unnumbered corners still shape the speed trace.
 * Everything after that - speed trace, braking zones, DRS, sectors - is the
 * same code as a sketch's, so a race on a calibrated circuit is the same kind of race.
 *
 * `pit` (optional) is the real pit lane from the mesh (tools/assets/blender/extract_pitlane.py):
 * `{ points: [x0, y0, ...] in decimetres in the same plane, from the entry to the exit,
 * entryShare?, exitShare?, lineShare?, boxFrom?, boxTo? }` (box shares are fractions of the
 * pit lane's length). Without it, or if it does not cross the line, the pit lane is the
 * procedural one, as on a sketch.
 */
export const CORNER_RADIUS = 350;
const CORNER_EXIT_RADIUS = CORNER_RADIUS * 1.4;
/** An almost straight stretch (radius over this, m) between two apexes splits a corner in two... */
const CORNER_SPLIT_RADIUS = 250;
/** ...if each piece turns more than this (rad, ~34°). */
const SPLIT_PIECE_TURN = 0.6;
/** A calibrated corner gets a number if it turns more than this (rad, ~23°)... */
const NUMBERED_TURN = 0.4;
/** ...or if it is a fast sweeping kink: more than this (rad, ~15°) with a radius in this range (m). */
const KINK_TURN = 0.26;
const KINK_RADIUS = [130, 170];
/** Pieces of a slalom (alternating hands, < 30 m apart) turning less than this (rad) are the spline weaving. */
const SLALOM_MAX_TURN = 0.7;
/** A corner turning more than this (rad, ~206°) carries one number per this much turn (a snail). */
const DOUBLE_TURN = 3.6;

export const buildCircuitFromPath = (path, year = 2020) => {
  const raw = [];
  for (let i = 0; i + 1 < path.points.length; i += 2) raw.push({ x: path.points[i] / 10, y: path.points[i + 1] / 10 });
  // A spline written as an explicitly closed loop repeats its first point at the end: drop it.
  if (raw.length > 2 && Math.hypot(raw[raw.length - 1].x - raw[0].x, raw[raw.length - 1].y - raw[0].y) < 0.5) raw.pop();
  // The extracted centre line carries a few decimetres of noise; at racing speed that reads as lateral
  // jerks. Three binomial passes ([1, 2, 1] / 4) take it out while closing even a hairpin by under a metre.
  for (let pass = 0; pass < 3; pass += 1) {
    const copy = raw.map((p) => ({ ...p }));
    const m = copy.length;
    for (let i = 0; i < m; i += 1) {
      const a = copy[(i - 1 + m) % m];
      const b = copy[(i + 1) % m];
      raw[i] = { x: (a.x + 2 * copy[i].x + b.x) / 4, y: (a.y + 2 * copy[i].y + b.y) / 4 };
    }
  }
  const n = raw.length;
  const s0 = accumulate(raw);
  // Curvature from the turn of the heading over two samples, smoothed.
  const heading = raw.map((_, i) => {
    const a = raw[(i - 1 + n) % n];
    const b = raw[(i + 1) % n];
    return Math.atan2(b.y - a.y, b.x - a.x);
  });
  const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const segment = (i) => s0[i + 1] - s0[i];
  const kappa = raw.map((_, i) => {
    const ds = segment(i) + segment((i - 1 + n) % n);
    return wrap(heading[(i + 1) % n] - heading[(i - 1 + n) % n]) / Math.max(1, ds);
  });
  const average = (values, half) => values.map((_, i) => {
    let sum = 0;
    for (let k = -half; k <= half; k += 1) sum += values[(i + k + n) % n];
    return sum / (2 * half + 1);
  });
  // Radius for the speed trace: curvature smoothed over ~40 m.
  const smooth = average(kappa, 3);
  // Corner detection: the heading over four samples (~24 m), its turn smoothed over ~50 m,
  // so the spline's lateral noise does not break an arc into pieces or make kinks out of nothing.
  const wide = raw.map((_, i) => {
    const a = raw[(i - 2 + n) % n];
    const b = raw[(i + 2) % n];
    return Math.atan2(b.y - a.y, b.x - a.x);
  });
  const wideKappa = raw.map((_, i) => wrap(wide[(i + 1) % n] - wide[(i - 1 + n) % n]) / Math.max(1, segment(i) + segment((i - 1 + n) % n)));
  const detect = average(wideKappa, 4);
  // ...and lightly smoothed (~30 m), to see two apexes inside one corner.
  const sharp = average(wideKappa, 2);
  const enters = (i) => Math.abs(detect[i]) > 1 / CORNER_RADIUS;
  const stays = (i, sign) => Math.sign(detect[i]) === sign && Math.abs(detect[i]) > 1 / CORNER_EXIT_RADIUS;
  // Group consecutive corner samples of the same sign; gaps of a sample or two are noise and belong to the corner.
  const id = new Array(n).fill(-1);
  const corners = [];
  let startAt = detect.findIndex((k) => Math.abs(k) <= 1 / CORNER_EXIT_RADIUS);
  if (startAt === -1) startAt = detect.findIndex((_, i) => !enters(i));
  if (startAt === -1) throw new Error("spline-without-straights");
  let current = null;
  const add = (i) => {
    current.turn += detect[i] * segment(i);
    current.minRadius = Math.min(current.minRadius, 1 / Math.max(1e-6, Math.abs(detect[i])));
    current.samples.push(i);
  };
  for (let k = 1; k <= n; k += 1) {
    const i = (startAt + k) % n;
    if (current && stays(i, current.sign)) add(i);
    else if (enters(i)) {
      current = { sign: Math.sign(detect[i]), turn: 0, minRadius: Infinity, samples: [] };
      corners.push(current);
      add(i);
    } else if (current) {
      const resumes = stays((i + 1) % n, current.sign) || stays((i + 2) % n, current.sign);
      if (resumes && k < n) add(i);
      else current = null;
    }
  }
  // Two apexes with an almost straight stretch between them (radius over CORNER_SPLIT_RADIUS) are
  // two corners, as long as each turns more than SPLIT_PIECE_TURN; smaller pieces stay with a neighbour.
  const split = [];
  corners.filter((corner) => Math.abs(corner.turn) > 0.08).forEach((corner) => {
    const a = corner.samples.map((i) => Math.abs(sharp[i]));
    const peaks = [];
    for (let k = 0; k < a.length; k += 1) {
      let top = a[k] > 1 / CORNER_RADIUS;
      for (let j = Math.max(0, k - 2); j <= Math.min(a.length - 1, k + 2) && top; j += 1) if (a[j] > a[k]) top = false;
      if (top && (!peaks.length || k - peaks[peaks.length - 1] > 2)) peaks.push(k);
    }
    const cuts = [];
    let last = peaks[0];
    for (let q = 1; q < peaks.length; q += 1) {
      let low = last;
      for (let k = last; k <= peaks[q]; k += 1) if (a[k] < a[low]) low = k;
      if (a[low] < 1 / CORNER_SPLIT_RADIUS) {
        cuts.push(low);
        last = peaks[q];
      } else if (a[peaks[q]] > a[last]) last = peaks[q];
    }
    const bounds = [0, ...cuts, a.length];
    const parts = [];
    for (let q = 0; q + 1 < bounds.length; q += 1) {
      const part = { sign: corner.sign, turn: 0, minRadius: Infinity, samples: corner.samples.slice(bounds[q], bounds[q + 1]) };
      part.samples.forEach((i, k) => {
        part.turn += detect[i] * segment(i);
        part.minRadius = Math.min(part.minRadius, 1 / Math.max(1e-6, a[bounds[q] + k]));
      });
      parts.push(part);
    }
    const good = parts.filter((part) => Math.abs(part.turn) > SPLIT_PIECE_TURN);
    if (good.length < 2) {
      split.push(corner);
      return;
    }
    // Small pieces join the previous good piece (or the next, before the first).
    const merged = [];
    let pending = [];
    parts.forEach((part) => {
      if (Math.abs(part.turn) > SPLIT_PIECE_TURN) {
        part.samples = pending.concat(part.samples);
        pending = [];
        merged.push(part);
      } else if (merged.length) merged[merged.length - 1].samples.push(...part.samples);
      else pending.push(...part.samples);
    });
    split.push(...merged);
  });
  // A slalom - three or more short pieces of alternating hand, none turning more than
  // SLALOM_MAX_TURN, less than 30 m apart - is the spline weaving, not a sequence of corners.
  const gapMetres = (a, b) => (((b.samples[0] - a.samples[a.samples.length - 1] + n) % n) * s0[n]) / n;
  for (let q = 0; q < split.length;) {
    let r = q;
    while (r + 1 < split.length && split[r + 1].sign !== split[r].sign && gapMetres(split[r], split[r + 1]) <= 30) r += 1;
    const run = split.slice(q, r + 1);
    if (run.length >= 3 && run.every((corner) => Math.abs(corner.turn) <= SLALOM_MAX_TURN)) run.forEach((corner) => { corner.weave = true; });
    q = r + 1;
  }
  // Numbered: turns more than NUMBERED_TURN, or a fast sweeping kink (more than KINK_TURN with a
  // radius of 130-170 m); tighter small pieces are the spline's jogs. A corner turning more than
  // DOUBLE_TURN (a snail such as Shanghai's 1-2) carries one number per DOUBLE_TURN of turn, split
  // into equal pieces of turn.
  const kept = [];
  split.forEach((corner) => {
    const turn = Math.abs(corner.turn);
    const numbered = !corner.weave && (turn > NUMBERED_TURN || (turn > KINK_TURN && corner.minRadius >= KINK_RADIUS[0] && corner.minRadius < KINK_RADIUS[1]));
    const count = numbered ? Math.max(1, Math.ceil(turn / DOUBLE_TURN - 1e-9)) : 1;
    if (count === 1) {
      kept.push({ ...corner, numbered });
      return;
    }
    const pieces = [];
    let acc = 0;
    corner.samples.forEach((i) => {
      const t = detect[i] * segment(i);
      const slot = Math.min(count - 1, Math.floor(Math.abs(acc) / (turn / count)));
      if (pieces.length - 1 < slot) pieces.push({ sign: corner.sign, turn: 0, minRadius: corner.minRadius, samples: [], numbered: true });
      const piece = pieces[pieces.length - 1];
      piece.samples.push(i);
      piece.turn += t;
      acc += t;
    });
    kept.push(...pieces);
  });
  kept.forEach((corner, k) => corner.samples.forEach((i) => { id[i] = k; }));
  const samples = raw.map((p, i) => ({
    x: p.x,
    y: p.y,
    radius: id[i] === -1 ? Infinity : 1 / Math.max(1e-6, Math.abs(smooth[i])),
    sign: id[i] === -1 ? 0 : kept[id[i]].sign,
    corner: id[i],
  }));
  const points = raw;
  const s = s0;
  const total = s[n];
  const ds = points.map((_, i) => s[i + 1] - s[i]);
  // The speed trace runs on the racing line when the spline has one (`line`, WP1), otherwise on
  // physics' stand-in line inside the track (SIM-FISICA §3.1-3.2); same samples as here.
  const env = envelopeFor(year, path.layoutRef);
  const line = splineGeometry({ points: path.points, line: path.line, layoutRef: path.layoutRef });
  const speed = speedTrace(samples.map((sample) => sample.radius), ds, env, line.kappa.length === n ? line.kappa : null);
  const time = [0];
  for (let i = 0; i < n; i += 1) time.push(time[i] + ds[i] / Math.max(8, (speed[i] + speed[(i + 1) % n]) / 2));
  const lapTime = time[time.length - 1];
  const clockwise = signedArea(points) > 0;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const box = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  const layout = { id: path.id, km: path.km, names: path.names || {}, drs: path.drs };
  const cornerTurns = kept.map((corner) => ({ turn: corner.turn, numbered: corner.numbered }));
  const built = finishCircuit({ layout, points, s, total, speed, time, lapTime, heading, samples, corners: cornerTurns, clockwise, box, lineAt: 0, env, year, realPit: path.pit });
  return { ...built, calibrated: true };
};

/**
 * Re-express everything from the start line, and derive what races need:
 * numbered corners, braking zones, full-throttle straights, DRS zones, three
 * sectors split by time and a pit lane alongside the main straight.
 */
const finishCircuit = ({ layout, points, s, total, speed, time, lapTime, heading, samples, corners, clockwise, box, lineAt, year, realPit }) => {
  const n = points.length;
  // Index of the sample nearest the line; rotate arrays so index 0 is the line.
  let lineIndex = 0;
  for (let i = 0; i < n; i += 1) if (s[i] <= lineAt) lineIndex = i;
  const rot = (array) => array.slice(lineIndex, n).concat(array.slice(0, lineIndex));
  const P = rot(points);
  const V = rot(speed);
  const H = rot(heading);
  const SM = rot(samples);
  const dist = accumulate(P);
  const T = [0];
  for (let i = 0; i < n; i += 1) T.push(T[i] + (dist[i + 1] - dist[i]) / Math.max(8, (V[i] + V[(i + 1) % n]) / 2));

  // Corners, numbered from the line, keeping only the ones that slow a car down
  // or change its direction meaningfully.
  const cornerList = [];
  let current = null;
  SM.forEach((sample, i) => {
    if (sample.corner !== -1) {
      if (!current || current.id !== sample.corner) {
        current = { id: sample.corner, from: i, to: i, minSpeed: V[i], sign: sample.sign, radius: sample.radius };
        cornerList.push(current);
      }
      current.to = i;
      if (V[i] < current.minSpeed) {
        current.minSpeed = V[i];
        current.apex = i;
      }
    } else current = null;
  });
  // A corner that runs across the line shows up at both ends of the lap: it is one corner.
  // It keeps its place by its apex (the last corner if the apex is before the line, the
  // first if after) and its span runs past 1 (or below 0) so that from < apex < to still holds.
  if (cornerList.length > 1) {
    const first = cornerList[0];
    const last = cornerList[cornerList.length - 1];
    if (first.id === last.id && first.from === 0 && last.to === n - 1) {
      // Each piece's slowest sample is its `apex` (or its first sample when that is the slowest).
      const apexAtEnd = last.minSpeed <= first.minSpeed;
      const merged = { ...last, minSpeed: Math.min(first.minSpeed, last.minSpeed) };
      if (apexAtEnd) {
        merged.to = first.to + n;
        merged.apex = last.apex ?? last.from;
        cornerList.splice(0, 1);
        cornerList[cornerList.length - 1] = merged;
      } else {
        merged.from = last.from - n;
        merged.to = first.to;
        merged.apex = first.apex ?? first.from;
        cornerList.pop();
        cornerList[0] = merged;
      }
    }
  }
  // Distance share of a sample index that may run past either end of the lap.
  const shareOf = (index) => {
    const lap = Math.floor(index / n);
    return dist[index - lap * n] / dist[n] + lap;
  };
  const numbered = cornerList
    .filter((corner) => {
      const known = corners[corner.id];
      // Calibrated circuits say which corners carry a number; sketches keep the old rule.
      if (known && known.numbered !== undefined) return known.numbered;
      const turn = Math.abs(known?.turn ?? 0);
      return turn > 0.35 || corner.minSpeed < 0.8 * envelopeFor(year, refOf(layout)).vmax;
    })
    .map((corner, index) => {
      const apex = corner.apex ?? Math.round((corner.from + corner.to) / 2);
      const kmh = corner.minSpeed * 3.6;
      return {
        number: index + 1,
        from: shareOf(corner.from),
        to: shareOf(corner.to),
        apex: shareOf(apex),
        apexIndex: ((apex % n) + n) % n,
        sign: corner.sign,
        kmh: Math.round(kmh),
        kind: kmh < 110 ? "slow" : kmh < 190 ? "medium" : "fast",
        name: (layout.names || {})[index + 1] || null,
      };
    });

  // Full-throttle stretches: where the car is at or near its top speed or still accelerating.
  const straights = [];
  let run = null;
  for (let i = 0; i < n; i += 1) {
    const accelerating = V[(i + 1) % n] >= V[i] - 0.05 && SM[i].corner === -1;
    if (accelerating) {
      if (!run) run = { from: i, to: i };
      run.to = i;
    } else if (run) {
      straights.push(run);
      run = null;
    }
  }
  if (run) {
    // Join a straight that runs across the line.
    if (straights.length && straights[0].from === 0) straights[0] = { from: run.from - n, to: straights[0].to };
    else straights.push(run);
  }
  const length = dist[n];
  const measured = straights
    .map((run2) => ({ from: run2.from, to: run2.to, metres: (run2.to - run2.from) * (length / n) }))
    .sort((a, b) => b.metres - a.metres);

  // Braking zones at the end of the longest straights: where overtakes happen.
  const brakingZones = measured.slice(0, 4).map((run2) => {
    const end = ((run2.to % n) + n) % n;
    const corner = numbered.find((c) => c.from * length >= dist[end] - 40) || numbered[0];
    return { at: dist[end] / length, metres: Math.round(run2.metres), corner: corner?.number ?? 1 };
  });

  // DRS from 2011: the two longest straights, detection a little before.
  const drsZones = year >= 2011
    ? measured.slice(0, layout.drs ?? 2).filter((run2) => run2.metres > 450).map((run2) => {
      const from = ((run2.from % n) + n) % n;
      const to = ((run2.to % n) + n) % n;
      return { from: dist[from] / length + 0.01, to: dist[to] / length };
    })
    : [];

  // Three sectors of roughly equal time.
  const lap = T[n];
  const sectorAt = (share) => {
    const target = lap * share;
    let i = 0;
    while (i < n && T[i] < target) i += 1;
    return dist[i] / length;
  };
  const sectors = [0, sectorAt(1 / 3), sectorAt(2 / 3)];

  // Pit lane: the real one from the mesh when there is one that crosses the line; otherwise
  // offset to the inside of the loop along the last and first straights.
  const inside = clockwise ? 1 : -1;
  const pit = (realPit && meshPitLane(realPit, { P, H, dist, length, n })) || buildPitLane({ P, H, dist, length, n, inside });

  // Normalised time -> distance table so a car can be placed by lap fraction.
  const timeShare = T.map((t) => t / lap);
  const distShare = dist.map((d) => d / length);

  return {
    id: layout.id,
    km: layout.km,
    length,
    points: P,
    heading: H,
    speed: V,
    dist,
    timeShare,
    distShare,
    corners: numbered,
    straights: measured.slice(0, 6).map((run2) => ({ metres: Math.round(run2.metres) })),
    brakingZones,
    drsZones,
    sectors,
    pit,
    clockwise,
    box,
    fullThrottle: measured.reduce((sum, run2) => sum + run2.metres, 0) / length,
    simulatedLap: lapTime,
  };
};

/** The pit lane: a parallel road on the inside of the main straight. */
const buildPitLane = ({ P, H, dist, length, n, inside }) => {
  const offset = 22;
  const entryShare = 1 - Math.min(0.09, 520 / length);
  const exitShare = Math.min(0.07, 420 / length);
  const shift = (i, amount) => {
    const h = H[i];
    return { x: P[i].x + -Math.sin(h) * amount * inside, y: P[i].y + Math.cos(h) * amount * inside };
  };
  const indexAt = (share) => {
    const target = share * length;
    let i = 0;
    while (i < n - 1 && dist[i + 1] < target) i += 1;
    return i;
  };
  const entry = indexAt(entryShare);
  const exit = indexAt(exitShare);
  const path = [];
  const blend = (k, count) => (count <= 0 ? 1 : Math.min(1, k / count));
  const before = n - entry;
  for (let k = 0; k < before; k += 1) path.push(shift(entry + k, offset * blend(k, 8)));
  for (let k = 0; k <= exit; k += 1) path.push(shift(k, offset * blend(exit - k, 8)));
  // Shares of the pit path: where it passes the line, and where the boxes are -
  // just before the line, so a stop lap ends as the car leaves its box.
  const lineAt = before / Math.max(1, path.length - 1);
  return { entry: entryShare, exit: exitShare, path, lineAt, boxAt: lineAt * 0.8, side: inside, source: "procedural" };
};

/**
 * The real pit lane, from the circuit's mesh (`path.pit`, see buildCircuitFromPath). Same shape
 * as the procedural one - `{ entry, exit, path, lineAt, boxAt }`, path shares 0 = entry and
 * 1 = exit - plus `boxFrom` / `boxTo` (where the garages are, as shares of the path), `side`
 * (+1 or -1: the lateral direction, in the sense `x - sin(h) * m, y + cos(h) * m`, that goes
 * from the track to the pit lane) and `source: "mesh"`.
 *
 * Entry and exit are re-measured on this circuit (the nearest point of the lap to each end of
 * the lane), and the lane's ends are moved onto the line so a car leaves and rejoins without a
 * jump. Returns null (and the caller falls back to the procedural lane) when the data cannot
 * honour the contract the race clock relies on: entry before the line, exit after it, and the
 * line crossed on the way.
 */
const meshPitLane = (pit, { P, H, dist, length, n }) => {
  const raw = pit.points || [];
  const lane = [];
  for (let i = 0; i + 1 < raw.length; i += 2) lane.push({ x: raw[i] / 10, y: raw[i + 1] / 10 });
  if (lane.length < 4) return null;
  // Nearest point of the lap: index, the projection onto the segment after it, and its share.
  const project = (p, near = null, window = 0) => {
    let best = null;
    const test = (i) => {
      const a = P[i];
      const b = P[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      const x = a.x + dx * t;
      const y = a.y + dy * t;
      const d = Math.hypot(p.x - x, p.y - y);
      if (!best || d < best.d) best = { i, t, x, y, d };
    };
    if (near === null) for (let i = 0; i < n; i += 1) test(i);
    else for (let k = -window; k <= window; k += 1) test((((near + k) % n) + n) % n);
    const share = (dist[best.i] + (dist[best.i + 1] - dist[best.i]) * best.t) / length;
    return { ...best, share: share % 1 };
  };
  const first = project(lane[0]);
  const last = project(lane[lane.length - 1]);
  // The ends of the lane must be on the track (the extractor puts them there).
  if (first.d > 12 || last.d > 12) return null;
  const entry = first.share;
  const exit = last.share;
  // Entry late in the lap, exit early in the next: the lane crosses the line.
  if (!(entry > 0.5 && exit < 0.5)) return null;
  const path = lane.map((p) => ({ ...p }));
  path[0] = { x: first.x, y: first.y };
  path[path.length - 1] = { x: last.x, y: last.y };
  const along = [0];
  for (let k = 1; k < path.length; k += 1) along.push(along[k - 1] + Math.hypot(path[k].x - path[k - 1].x, path[k].y - path[k - 1].y));
  const total = along[along.length - 1];
  // Where the lane passes the line: the share of the nearest lap point wraps from ~1 to ~0.
  let lineAt = null;
  let prev = first;
  for (let k = 1; k < path.length && lineAt === null; k += 1) {
    const here = project(path[k], prev.i, 40);
    if (here.share - prev.share < -0.5) {
      const before = 1 - prev.share;
      const span = before + here.share || 1;
      lineAt = (along[k - 1] + (along[k] - along[k - 1]) * (before / span)) / total;
    }
    prev = here;
  }
  if (lineAt === null || lineAt <= 0.02 || lineAt >= 0.98) return null;
  // Garages: from the data, or the middle of the part before the line. The race clock stops
  // cars before the line (boxAt < lineAt), so the box it uses is kept inside that part.
  const boxFrom = Number.isFinite(pit.boxFrom) ? pit.boxFrom : lineAt * 0.25;
  const boxTo = Number.isFinite(pit.boxTo) ? pit.boxTo : lineAt * 0.85;
  const boxAt = Math.max(lineAt * 0.1, Math.min(lineAt * 0.9, (boxFrom + Math.min(boxTo, lineAt)) / 2));
  // Which side of the track the lane runs on, where it passes the line.
  const middle = path[Math.round(lineAt * (path.length - 1))];
  const at = project(middle);
  const h = H[at.i];
  const side = (middle.x - at.x) * -Math.sin(h) + (middle.y - at.y) * Math.cos(h) >= 0 ? 1 : -1;
  return { entry, exit, path, lineAt, boxAt, boxFrom, boxTo, side, source: "mesh" };
};

/**
 * Monotone cubic tangents (Fritsch-Carlson) of distance against time: speed
 * then changes smoothly from one sample to the next instead of in steps, so a
 * car on screen brakes and accelerates rather than lurching.
 */
const tangentCache = new WeakMap();
const distanceTangents = (circuit) => {
  if (tangentCache.has(circuit)) return tangentCache.get(circuit);
  const t = circuit.timeShare;
  const d = circuit.distShare;
  const n = t.length;
  const slope = new Float64Array(n - 1);
  for (let i = 0; i < n - 1; i += 1) slope[i] = (d[i + 1] - d[i]) / (t[i + 1] - t[i] || 1e-9);
  const m = new Float64Array(n);
  // The lap is a loop: the speed leaving the line is the speed arriving at it.
  m[0] = m[n - 1] = (slope[0] + slope[n - 2]) / 2;
  for (let i = 1; i < n - 1; i += 1) m[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      m[i] = k * a * slope[i];
      m[i + 1] = k * b * slope[i];
    }
  }
  tangentCache.set(circuit, m);
  return m;
};

/**
 * Distance share along the lap reached at a given share of the lap's time,
 * using the circuit's own speed trace. Lets a car slow for corners on screen.
 */
export const distanceAtTimeShare = (circuit, share) => {
  const f = ((share % 1) + 1) % 1;
  const t = circuit.timeShare;
  const d = circuit.distShare;
  let lo = 0;
  let hi = t.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid] <= f) lo = mid;
    else hi = mid;
  }
  const h = t[lo + 1] - t[lo] || 1e-9;
  const k = (f - t[lo]) / h;
  const m = distanceTangents(circuit);
  const k2 = k * k;
  const k3 = k2 * k;
  return (2 * k3 - 3 * k2 + 1) * d[lo] + (k3 - 2 * k2 + k) * h * m[lo] + (-2 * k3 + 3 * k2) * d[lo + 1] + (k3 - k2) * h * m[lo + 1];
};

/** Catmull-Rom: a curve through p1 and p2 that keeps its direction at both. */
const catmull = (p0, p1, p2, p3, k) => {
  const k2 = k * k;
  const k3 = k2 * k;
  return 0.5 * (2 * p1 + (p2 - p0) * k + (2 * p0 - 5 * p1 + 4 * p2 - p3) * k2 + (3 * p1 - p0 - 3 * p2 + p3) * k3);
};

/** The inverse: share of the lap's time spent reaching a distance share. */
export const timeShareAtDistance = (circuit, share) => {
  const f = Math.max(0, Math.min(1, share));
  const d = circuit.distShare;
  let lo = 0;
  let hi = d.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (d[mid] <= f) lo = mid;
    else hi = mid;
  }
  const span = d[lo + 1] - d[lo] || 1;
  const k = (f - d[lo]) / span;
  return circuit.timeShare[lo] + (circuit.timeShare[lo + 1] - circuit.timeShare[lo]) * k;
};

/** Position and heading at a distance share of the lap. */
export const poseAt = (circuit, share) => {
  const f = ((share % 1) + 1) % 1;
  const target = f * circuit.length;
  const d = circuit.dist;
  let lo = 0;
  let hi = d.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (d[mid] <= target) lo = mid;
    else hi = mid;
  }
  const n = circuit.points.length;
  const P = circuit.points;
  const z = P[(lo - 1 + n) % n];
  const a = P[lo % n];
  const b = P[(lo + 1) % n];
  const c = P[(lo + 2) % n];
  const k = (target - d[lo]) / (d[lo + 1] - d[lo] || 1);
  const h0 = circuit.heading[lo % n];
  let h1 = circuit.heading[(lo + 1) % n];
  while (h1 - h0 > Math.PI) h1 -= TAU;
  while (h1 - h0 < -Math.PI) h1 += TAU;
  const speed = circuit.speed[lo % n] + (circuit.speed[(lo + 1) % n] - circuit.speed[lo % n]) * k;
  return { x: catmull(z.x, a.x, b.x, c.x, k), y: catmull(z.y, a.y, b.y, c.y, k), heading: h0 + (h1 - h0) * k, speed };
};

/** Pose along the pit lane path, 0 = entry, 1 = exit. */
export const pitPoseAt = (circuit, share) => {
  const path = circuit.pit.path;
  const last = path.length - 1;
  const f = Math.max(0, Math.min(0.9999, share)) * last;
  const i = Math.floor(f);
  const z = path[Math.max(0, i - 1)];
  const a = path[i];
  const b = path[Math.min(last, i + 1)];
  const c = path[Math.min(last, i + 2)];
  const k = f - i;
  // Heading from the curve's own direction, blended across the joint.
  const dx = catmull(z.x, a.x, b.x, c.x, Math.min(1, k + 0.02)) - catmull(z.x, a.x, b.x, c.x, Math.max(0, k - 0.02));
  const dy = catmull(z.y, a.y, b.y, c.y, Math.min(1, k + 0.02)) - catmull(z.y, a.y, b.y, c.y, Math.max(0, k - 0.02));
  return { x: catmull(z.x, a.x, b.x, c.x, k), y: catmull(z.y, a.y, b.y, c.y, k), heading: Math.atan2(dy, dx) || Math.atan2(b.y - a.y, b.x - a.x) };
};

/** SVG path data for a closed polyline. */
export const pathOf = (points, closed = true) =>
  `M${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}${closed ? "Z" : ""}`;

/** A ribbon offset to one side of the line between two distance shares (kerbs, run-off). */
export const offsetSpan = (circuit, from, to, amount) => {
  const n = circuit.points.length;
  const start = Math.floor(from * n);
  const end = Math.ceil((to < from ? to + 1 : to) * n);
  const out = [];
  for (let k = start; k <= end; k += 1) {
    const i = ((k % n) + n) % n;
    const h = circuit.heading[i];
    out.push({ x: circuit.points[i].x - Math.sin(h) * amount, y: circuit.points[i].y + Math.cos(h) * amount });
  }
  return out;
};
