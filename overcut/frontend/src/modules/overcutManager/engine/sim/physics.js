/**
 * Physical speed trace of a car over a lap (WP2 of docs/manager/SIM-FISICA.md, §3.2;
 * RF-SIM-01, RF-SIM-02; tunables in data/balance/race-physics.json, RNF-07).
 *
 * Quasi-static point mass on the circuit's racing line (the centre line when the spline
 * has no `line` yet):
 *
 *   load            Fz/m   = g + q·v²,                q = ½ρ·ClA / m
 *   corner limit    v²·κ   = μ(v)·(g + q·v²)  ->  v = sqrt(μ g / (κ − μ q)), capped at vTop
 *   traction        a_x    = min(P/(m v), μ_x·Fz/m·e) − ½ρ·CdA·v²/m − c_rr·g
 *   braking         a_brk  = min(μ_brk·Fz/m·e, brakeMax) + ½ρ·CdA·v²/m + c_rr·g
 *   friction ellipse e      = sqrt(1 − (v²κ / (μ(v)·Fz/m))²)
 *   top speed       P      = ½ρ·CdA·v³ + c_rr·m·g·v
 *
 * μ(v) is the grip per speed band (slow / medium / fast, `bands`), so a car can be good in
 * slow corners and poor in fast ones. With a realistic ClA the flat-out radius is
 * m / (μ·½ρ·ClA) ≈ 150-200 m (2005: well over 200 m), not the 46 m of the old envelope.
 *
 * Determinism (RF-SIM-15, RNF-05; SIM-FISICA §3.11): only + − × ÷ and Math.sqrt, which IEEE
 * rounds exactly, so the trace is the same bit for bit in every JS engine. No sin, cos,
 * atan2, exp or pow: curvature is the Menger curvature of three points.
 *
 * Pure and import-light: geometry in, typed arrays out. trackGeometry uses it for the
 * circuit's reference trace; the step simulation can build one trace per car with
 * `carFor` + `traceOf` at the start of a race (SIM-FISICA §3.12: ~5 ms for 22 cars).
 */

import data from "../../data/balance/race-physics.json";

const KMH = 3.6;

// ------------------------------------------------------------------ parameters

/** The era block a year falls in (eras are contiguous and cover every year). */
export const eraFor = (year = 2020, physics = data) => {
  const eras = physics.eras;
  const found = eras.find((era) => year >= era.from && year <= era.to);
  if (found) return found;
  return year < eras[0].from ? eras[0] : eras[eras.length - 1];
};

/**
 * Downforce level of a circuit (Monza low, Monaco maximum): one number, the factor on ClA; the
 * wing that gives it also changes drag, by `dragPerLevel` of the change (CdA factor).
 */
export const downforceFor = (layoutRef, physics = data) => {
  const table = physics.downforce;
  const level = (layoutRef && table.byLayoutRef[layoutRef]) ?? table.default;
  return { ClA: level, CdA: 1 + table.dragPerLevel * (level - 1) };
};

/**
 * The car a trace is run with. `year` picks the era (the era block describes the best car of
 * the year on a qualifying lap); `layoutRef` the downforce level; `stats` moves it from the
 * best car (each -1..1, see race-physics.json carStats): `power`, `drag`, `downforce`,
 * `grip`, `braking`; `fuelKg` replaces the era's qualifying fuel load.
 */
export const carFor = ({ year = 2020, layoutRef = null, stats = {}, fuelKg = null, physics = data } = {}) => {
  const era = eraFor(year, physics);
  const level = downforceFor(layoutRef, physics);
  const k = physics.carStats;
  const s = (key) => Math.max(-1, Math.min(1, stats[key] || 0));
  const mass = era.mass + (fuelKg === null ? era.fuelQualifyingKg : fuelKg);
  const grip = 1 + s("grip") * k.grip;
  return {
    year,
    mass,
    // kW in the data, W here.
    power: era.power * 1000 * (1 + s("power") * k.power),
    CdA: era.CdA * level.CdA * (1 - s("drag") * k.drag),
    ClA: era.ClA * level.ClA * (1 + s("downforce") * k.downforce),
    mu: { slow: era.mu.slow * grip, medium: era.mu.medium * grip, fast: era.mu.fast * grip },
    muBrake: era.muBrake * (1 + s("braking") * k.braking),
    muTraction: era.muTraction * grip,
    brakeMax: era.brakeMax * (1 + s("braking") * k.braking),
    crr: era.crr,
    rho: physics.constants.rho,
    g: physics.constants.g,
    slow: physics.bands.slowMaxKmh / KMH,
    fast: physics.bands.fastMinKmh / KMH,
  };
};

// ------------------------------------------------------------------ car model

/** Grip at speed v (m/s): slow below the slow band, fast above the fast one, linear through medium. */
export const muAt = (car, v) => {
  if (v <= car.slow) return car.mu.slow;
  if (v >= car.fast) return car.mu.fast;
  const mid = (car.slow + car.fast) / 2;
  if (v <= mid) return car.mu.slow + ((car.mu.medium - car.mu.slow) * (v - car.slow)) / (mid - car.slow);
  return car.mu.medium + ((car.mu.fast - car.mu.medium) * (v - mid)) / (car.fast - mid);
};

/** Top speed on an endless straight: P = ½ρ·CdA·v³ + c_rr·m·g·v, by Newton's method. */
export const topSpeedOf = (car) => {
  const a = 0.5 * car.rho * car.CdA;
  const b = car.crr * car.mass * car.g;
  let v = 90;
  for (let k = 0; k < 30; k += 1) {
    const f = a * v * v * v + b * v - car.power;
    const d = 3 * a * v * v + b;
    v -= f / d;
  }
  return v;
};

/**
 * Fastest a corner of curvature |κ| (1/m) can be taken. The band grip depends on the speed it
 * gives, so a few fixed-point steps settle μ; past the flat-out radius (κ ≤ μ·q) the corner is
 * taken at `vTop`.
 */
export const cornerLimit = (car, kappa, vTop) => {
  const k = kappa < 0 ? -kappa : kappa;
  if (k < 1e-7) return vTop;
  const q = (0.5 * car.rho * car.ClA) / car.mass;
  let mu = car.mu.medium;
  let v = vTop;
  for (let it = 0; it < 8; it += 1) {
    const denom = k - mu * q;
    if (denom <= 0) return vTop;
    v = Math.sqrt((mu * car.g) / denom);
    if (v >= vTop) return vTop;
    mu = muAt(car, v);
  }
  return v < vTop ? v : vTop;
};

/** Share of the tyre's grip left for accelerating or braking while turning at v on κ. */
const ellipse = (car, v, kappa, load) => {
  const k = kappa < 0 ? -kappa : kappa;
  const used = (v * v * k) / (muAt(car, v) * load);
  return used >= 1 ? 0 : Math.sqrt(1 - used * used);
};

// ------------------------------------------------------------------ geometry

/**
 * Menger curvature (signed, 1/m, + to the left) of a closed loop of points, from the points
 * `span` samples either side, then averaged over ±`half` samples. Only arithmetic and sqrt.
 */
export const curvatureOf = (xs, ys, { span = 2, half = 3 } = {}) => {
  const n = xs.length;
  const raw = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const a = (i - span + n) % n;
    const c = (i + span) % n;
    const abx = xs[i] - xs[a];
    const aby = ys[i] - ys[a];
    const bcx = xs[c] - xs[i];
    const bcy = ys[c] - ys[i];
    const acx = xs[c] - xs[a];
    const acy = ys[c] - ys[a];
    const cross = abx * bcy - aby * bcx;
    const lengths = Math.sqrt((abx * abx + aby * aby) * (bcx * bcx + bcy * bcy) * (acx * acx + acy * acy));
    raw[i] = lengths > 0 ? (2 * cross) / lengths : 0;
  }
  return smoothed(raw, half);
};

/** Moving average over ±`half` samples of a closed loop. */
const smoothed = (values, half) => {
  if (half <= 0) return values;
  const n = values.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    for (let k = -half; k <= half; k += 1) sum += values[(i + k + n) % n];
    out[i] = sum / (2 * half + 1);
  }
  return out;
};

/**
 * The racing line of a closed centre line: each point moved along its normal by `offsets`
 * (metres, + to the right of the direction of travel, SIM-FISICA §3.1). Without offsets the
 * centre line itself.
 */
export const racingLineOf = (xs, ys, offsets = null) => {
  const n = xs.length;
  if (!offsets || offsets.length !== n) return { xs, ys, onLine: false };
  const lx = new Float64Array(n);
  const ly = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const a = (i - 1 + n) % n;
    const b = (i + 1) % n;
    const tx = xs[b] - xs[a];
    const ty = ys[b] - ys[a];
    const l = Math.sqrt(tx * tx + ty * ty) || 1;
    // "Right" as splines.json and three/racingLine.js mean it: the normal (-ty, tx) of the
    // spline plane (glTF x, z seen from above, so z runs the other way from a y-up sheet).
    lx[i] = xs[i] - (ty / l) * offsets[i];
    ly[i] = ys[i] + (tx / l) * offsets[i];
  }
  return { xs: lx, ys: ly, onLine: true };
};

/**
 * Stand-in racing line while a spline has no `line` (SIM-FISICA §3.1, WP1): an elastic band
 * pulled tight inside a corridor of ±`maxShiftM` around the centre line. Each iteration moves
 * every point a share `relax` towards the middle of its neighbours and clamps it back inside
 * the corridor, which straightens the jogs of the mesh centre on straights and opens the
 * corners the way a car uses the width. Arithmetic and sqrt only (RNF-05).
 */
export const elasticLine = (cx, cy, { maxShiftM = 5, relax = 0.5, iterations = 200 } = {}) => {
  const n = cx.length;
  let xs = Float64Array.from(cx);
  let ys = Float64Array.from(cy);
  let nx = new Float64Array(n);
  let ny = new Float64Array(n);
  const limit = maxShiftM * maxShiftM;
  for (let it = 0; it < iterations; it += 1) {
    for (let i = 0; i < n; i += 1) {
      const a = (i - 1 + n) % n;
      const b = (i + 1) % n;
      // Fourth difference: the discrete curvature's own gradient, so the band relaxes towards the
      // line of least curvature (out-in-out) rather than the shortest one.
      const a2 = (i - 2 + n) % n;
      const b2 = (i + 2) % n;
      let x = xs[i] - relax * (xs[a2] - 4 * xs[a] + 6 * xs[i] - 4 * xs[b] + xs[b2]) / 16;
      let y = ys[i] - relax * (ys[a2] - 4 * ys[a] + 6 * ys[i] - 4 * ys[b] + ys[b2]) / 16;
      const dx = x - cx[i];
      const dy = y - cy[i];
      const d2 = dx * dx + dy * dy;
      if (d2 > limit) {
        const k = maxShiftM / Math.sqrt(d2);
        x = cx[i] + dx * k;
        y = cy[i] + dy * k;
      }
      nx[i] = x;
      ny[i] = y;
    }
    const tx = xs;
    const ty = ys;
    xs = nx;
    ys = ny;
    nx = tx;
    ny = ty;
  }
  return { xs, ys };
};

/** Segment lengths of a closed loop (ds[i] from point i to i+1). */
export const segmentsOf = (xs, ys) => {
  const n = xs.length;
  const ds = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const dx = xs[j] - xs[i];
    const dy = ys[j] - ys[i];
    ds[i] = Math.sqrt(dx * dx + dy * dy);
  }
  return ds;
};

// ------------------------------------------------------------------ the trace

/**
 * Speed (m/s) at every sample of a closed lap for `car`: corner limits, then a forward pass
 * (power, traction inside the friction ellipse, drag, rolling resistance) and a backward pass
 * (braking inside the ellipse, helped by drag), each twice round the loop so the line inherits
 * the exit of the last corner. Returns the trace, the lap time, top and minimum speeds and
 * the longitudinal state per sample (1 accelerating, 0 at the limit, -1 braking).
 */
export const traceOf = (car, kappa, ds, { minSpeed = data.trace.minSpeed } = {}) => {
  const n = kappa.length;
  const vTop = topSpeedOf(car);
  const q = (0.5 * car.rho * car.ClA) / car.mass;
  const drag = (0.5 * car.rho * car.CdA) / car.mass;
  const roll = car.crr * car.g;
  const limit = new Float64Array(n);
  for (let i = 0; i < n; i += 1) limit[i] = cornerLimit(car, kappa[i], vTop);
  const v = Float64Array.from(limit);
  for (let pass = 0; pass < 2; pass += 1) {
    for (let k = 1; k <= n; k += 1) {
      const i = k % n;
      const p = k - 1;
      const u = v[p] > minSpeed ? v[p] : minSpeed;
      const load = car.g + q * u * u;
      const grip = car.muTraction * load * ellipse(car, u, kappa[p], load);
      const power = car.power / (car.mass * u);
      const a = (power < grip ? power : grip) - drag * u * u - roll;
      const reach = u * u + 2 * a * ds[p];
      const next = reach > 0 ? Math.sqrt(reach) : 0;
      if (next < v[i]) v[i] = next;
    }
  }
  for (let pass = 0; pass < 2; pass += 1) {
    for (let k = n - 1; k >= -1; k -= 1) {
      const i = ((k % n) + n) % n;
      const j = (i + 1) % n;
      const u = v[j];
      const load = car.g + q * u * u;
      const tyre = car.muBrake * load * ellipse(car, u, kappa[j], load);
      const b = (tyre < car.brakeMax ? tyre : car.brakeMax) + drag * u * u + roll;
      const reach = Math.sqrt(u * u + 2 * b * ds[i]);
      if (reach < v[i]) v[i] = reach;
    }
  }
  let lapTime = 0;
  let top = 0;
  let low = Infinity;
  const state = new Int8Array(n);
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const mean = (v[i] + v[j]) / 2;
    lapTime += ds[i] / (mean > minSpeed ? mean : minSpeed);
    if (v[i] > top) top = v[i];
    if (v[i] < low) low = v[i];
    state[i] = v[j] > v[i] + 1e-6 ? 1 : v[j] < v[i] - 1e-6 ? -1 : 0;
  }
  return { v, lapTime, top, min: low, vTop, state };
};

// ------------------------------------------------------------------ splines

/**
 * Geometry of a calibrated spline (data/splines.json, decimetres, closing point optional),
 * smoothed the way trackGeometry smooths it (three [1, 2, 1]/4 passes), on its racing line
 * when the spline has one (`line`, dm per point, + right; SIM-FISICA §3.1, WP1).
 */
export const splineGeometry = (spline, { physics = data } = {}) => {
  const pts = spline.points;
  let m = pts.length >> 1;
  const closes = m > 2 && Math.abs(pts[2 * m - 2] - pts[0]) < 5 && Math.abs(pts[2 * m - 1] - pts[1]) < 5;
  if (closes) m -= 1;
  let xs = new Float64Array(m);
  let ys = new Float64Array(m);
  for (let i = 0; i < m; i += 1) {
    xs[i] = pts[2 * i] / 10;
    ys[i] = pts[2 * i + 1] / 10;
  }
  for (let pass = 0; pass < 3; pass += 1) {
    const cx = Float64Array.from(xs);
    const cy = Float64Array.from(ys);
    for (let i = 0; i < m; i += 1) {
      const a = (i - 1 + m) % m;
      const b = (i + 1) % m;
      xs[i] = (cx[a] + 2 * cx[i] + cx[b]) / 4;
      ys[i] = (cy[a] + 2 * cy[i] + cy[b]) / 4;
    }
  }
  const offsets = lineOffsets(spline, m);
  const line = racingLineOf(xs, ys, offsets);
  const centreline = physics.trace.centreline;
  const corridor = (centreline.corridorByLayoutRef || {})[spline.layoutRef] ?? centreline.corridorM;
  const band = line.onLine ? null : elasticLine(xs, ys, { maxShiftM: corridor, relax: centreline.relax, iterations: centreline.iterations });
  xs = band ? band.xs : line.xs;
  ys = band ? band.ys : line.ys;
  // The pipeline's own curvature of the racing line (`kappa`, 1e-4/m) when it is there: computed
  // offline once, so the same numbers in every JS engine (SIM-FISICA §3.11); else Menger's.
  const given = line.onLine && Array.isArray(spline.kappa) && spline.kappa.length >= m ? smoothed(Float64Array.from(spline.kappa.slice(0, m), (k) => k / 1e4), physics.trace.lineCurvature.half) : null;
  const kappa = given || curvatureOf(xs, ys, line.onLine ? physics.trace.lineCurvature : physics.trace.curvature);
  return { xs, ys, kappa, ds: segmentsOf(xs, ys), onLine: line.onLine };
};

/** The spline's racing-line offsets in metres, one per (unclosed) point, or null. */
export const lineOffsets = (spline, count) => {
  const line = spline && spline.line;
  if (!Array.isArray(line) || line.length < count) return null;
  const out = new Float64Array(count);
  for (let i = 0; i < count; i += 1) out[i] = line[i] / 10;
  return out;
};

/** The physical lap of `car` on a calibrated spline: trace plus where its slowest point is. */
export const splineLap = (spline, car) => {
  const geometry = splineGeometry(spline);
  const trace = traceOf(car, geometry.kappa, geometry.ds);
  let at = 0;
  for (let i = 1; i < trace.v.length; i += 1) if (trace.v[i] < trace.v[at]) at = i;
  return { ...trace, minAt: at, onLine: geometry.onLine, geometry };
};

export const toKmh = (v) => v * KMH;

export const physicsData = data;
