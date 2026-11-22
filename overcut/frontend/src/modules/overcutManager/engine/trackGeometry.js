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
 * Nothing here knows about races; it is pure geometry, deterministic, with no
 * imports, so a layout can also be checked from a script.
 */

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
 * Car performance envelope by era, in SI units: top speed, lateral grip (g),
 * how much of that grip is downforce (it grows with speed), traction and
 * braking. Only the shape of the lap matters downstream - lap times are scaled
 * to the real ones - but the shape changes a lot: a 1955 car is slow through
 * fast corners, a 2020 car barely lifts.
 */
export const envelopeFor = (year = 2020) => {
  if (year < 1961) return { vmax: 78, grip: 1.05, aero: 0, accel: 5.2, brake: 8.5 };
  if (year < 1968) return { vmax: 80, grip: 1.25, aero: 0, accel: 5.8, brake: 9.5 };
  if (year < 1977) return { vmax: 84, grip: 1.45, aero: 0.0006, accel: 6.4, brake: 11 };
  if (year < 1983) return { vmax: 85, grip: 1.75, aero: 0.0012, accel: 6.6, brake: 13 };
  if (year < 1989) return { vmax: 90, grip: 1.7, aero: 0.0011, accel: 8.2, brake: 14 };
  if (year < 2009) return { vmax: 91, grip: 1.85, aero: 0.0016, accel: 8.4, brake: 18 };
  if (year < 2017) return { vmax: 92, grip: 1.9, aero: 0.0017, accel: 8.6, brake: 19 };
  return { vmax: 95, grip: 2.05, aero: 0.0021, accel: 9.2, brake: 21 };
};

const G = 9.81;

/** Fastest a corner of radius r can be taken: grip plus speed-dependent downforce. */
const cornerSpeed = (radius, env) => {
  if (radius === Infinity) return env.vmax;
  // v^2 / r = g * (grip + aero * v^2)  =>  v^2 = g*grip*r / (1 - g*aero*r)
  const denom = 1 - G * env.aero * radius;
  if (denom <= 0.05) return env.vmax;
  return Math.min(env.vmax, Math.sqrt((G * env.grip * radius) / denom));
};

/**
 * Speed trace around a lap: a closed-loop point-mass simulation run twice so
 * the start of the lap inherits the exit of the last corner.
 */
const speedTrace = (sampleRadii, ds, env) => {
  const n = sampleRadii.length;
  const limit = sampleRadii.map((radius) => cornerSpeed(radius, env));
  const v = limit.slice();
  for (let pass = 0; pass < 2; pass += 1) {
    for (let k = 1; k <= n; k += 1) {
      const i = k % n;
      const prev = (k - 1) % n;
      // Traction fades with speed: drag eats into what the engine can give.
      const accel = env.accel * Math.max(0.15, 1 - (v[prev] / env.vmax) ** 2);
      v[i] = Math.min(v[i], Math.sqrt(v[prev] ** 2 + 2 * accel * ds[prev]));
    }
  }
  for (let pass = 0; pass < 2; pass += 1) {
    for (let k = n - 1; k >= -1; k -= 1) {
      const i = ((k % n) + n) % n;
      const next = (i + 1) % n;
      const brake = env.brake + G * env.aero * v[next] ** 2 * 0.8;
      v[i] = Math.min(v[i], Math.sqrt(v[next] ** 2 + 2 * brake * ds[i]));
    }
  }
  return v;
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
  const env = envelopeFor(year);
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
 * Re-express everything from the start line, and derive what races need:
 * numbered corners, braking zones, full-throttle straights, DRS zones, three
 * sectors split by time and a pit lane alongside the main straight.
 */
const finishCircuit = ({ layout, points, s, total, speed, time, lapTime, heading, samples, corners, clockwise, box, lineAt, year }) => {
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
  const numbered = cornerList
    .filter((corner) => {
      const turn = Math.abs(corners[corner.id]?.turn ?? 0);
      return turn > 0.35 || corner.minSpeed < 0.8 * envelopeFor(year).vmax;
    })
    .map((corner, index) => {
      const apex = corner.apex ?? Math.round((corner.from + corner.to) / 2);
      const kmh = corner.minSpeed * 3.6;
      return {
        number: index + 1,
        from: dist[corner.from] / dist[n],
        to: dist[corner.to] / dist[n],
        apex: dist[apex] / dist[n],
        apexIndex: apex,
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

  // Pit lane: offset to the inside of the loop along the last and first straights.
  const inside = clockwise ? 1 : -1;
  const pit = buildPitLane({ P, H, dist, length, n, inside });

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
  return { entry: entryShare, exit: exitShare, path, lineAt, boxAt: lineAt * 0.8 };
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
