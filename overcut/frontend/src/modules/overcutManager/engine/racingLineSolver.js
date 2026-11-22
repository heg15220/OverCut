/**
 * Minimum-curvature racing line solver (docs/manager/SIM-FISICA.md §3.1, WP1; RF-3D-03).
 *
 * Pure and import-free so the offline pipeline (tools/assets/racing_line.mjs, Node) and the engine
 * (engine/trackData.js, procedural circuits) run the very same code. Only + - * / and Math.sqrt
 * (exactly rounded in IEEE 754): the same line in every JS engine (RNF-05, SIM-FISICA §3.11).
 * Points are {x, y} in metres, a closed loop; offsets are metres, positive to the right of travel
 * (normal (-dy, dx) / |d|, the sense of three/racingLine.js).
 */

/** Unit normals to the + side (right of travel) by central differences: (-dy, dx) / |d|. */
export const normalsOf = (points) => {
  const n = points.length;
  const nx = new Float64Array(n);
  const ny = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const a = points[(i - 1 + n) % n];
    const b = points[(i + 1) % n];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.sqrt(dx * dx + dy * dy) || 1;
    nx[i] = -dy / l;
    ny[i] = dx / l;
  }
  return { nx, ny };
};

/** Cholesky of a symmetric positive definite band matrix (bandwidth 2); solves L L^T x = b, or null. */
const bandSolve = (d0, d1, d2, b) => {
  const m = b.length;
  const l0 = new Float64Array(m);
  const l1 = new Float64Array(m);
  const l2 = new Float64Array(m);
  for (let a = 0; a < m; a += 1) {
    // Row a: L[a][a-2] = l2[a], L[a][a-1] = l1[a], L[a][a] = l0[a].
    const s2 = a >= 2 ? d2[a] / l0[a - 2] : 0;
    const s1 = a >= 1 ? (d1[a] - (a >= 2 ? s2 * l1[a - 1] : 0)) / l0[a - 1] : 0;
    const diag = d0[a] - s1 * s1 - s2 * s2;
    if (!(diag > 0)) return null;
    l2[a] = s2;
    l1[a] = s1;
    l0[a] = Math.sqrt(diag);
  }
  const y = new Float64Array(m);
  for (let a = 0; a < m; a += 1) y[a] = (b[a] - (a >= 1 ? l1[a] * y[a - 1] : 0) - (a >= 2 ? l2[a] * y[a - 2] : 0)) / l0[a];
  const x = new Float64Array(m);
  for (let a = m - 1; a >= 0; a -= 1) x[a] = (y[a] - (a + 1 < m ? l1[a + 1] * x[a + 1] : 0) - (a + 2 < m ? l2[a + 2] * x[a + 2] : 0)) / l0[a];
  return x;
};

/**
 * Minimum-curvature racing line (SIM-FISICA §3.1): the lateral offsets n_i (+ = right) inside
 * lo_i <= n_i <= hi_i that minimise the bending of P_i = C_i + n_i N_i,
 *
 *   sum_j w_j |P_{j-1} - 2 P_j + P_{j+1}|^2,   w_j = (h / ds_j)^3,
 *
 * with ds_j the local spacing of the line and h the mean one. |second difference| ~ kappa ds^2, so this is
 * sum kappa^2 ds, the integral of squared curvature. With w = 1 a tight corner would look cheaper on the
 * inside, where the samples bunch up; the weights come from the previous solution (`options.reweight`
 * rounds, the first with w = 1).
 *
 * Each round is a convex QP with a cyclic band Hessian (bandwidth 2): solved exactly on the open chain
 * left when two consecutive samples are held, by a primal active-set method over banded Cholesky solves,
 * alternating the held pair between two opposite places on the lap until nothing moves.
 * `options.centre` (>= 0, tiny) pulls free stretches towards the centre so the problem stays strictly convex.
 */
export const minCurvatureLine = (points, lo, hi, options = {}) => {
  const n = points.length;
  const { nx, ny } = normalsOf(points);
  const eps = options.centre ?? 1e-6;
  const passes = options.passes ?? 6;
  const tol = options.tolerance ?? 1e-4;
  const rounds = Math.max(1, options.reweight ?? 4);
  // Second differences of the centreline.
  const ax = new Float64Array(n);
  const ay = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const p = points[(i - 1 + n) % n];
    const q = points[i];
    const r = points[(i + 1) % n];
    ax[i] = p.x - 2 * q.x + r.x;
    ay[i] = p.y - 2 * q.y + r.y;
  }
  const dotN = (i, k) => nx[i] * nx[k] + ny[i] * ny[k];
  const w = new Float64Array(n).fill(1);
  // Hessian (cyclic): H_ii = w_i-1 + 4 w_i + w_i+1, H_i,i+1 = -2 (w_i + w_i+1) N_i.N_i+1,
  // H_i,i+2 = w_i+1 N_i.N_i+2; gradient g_i = N_i.(w_i-1 A_i-1 - 2 w_i A_i + w_i+1 A_i+1).
  const h0 = new Float64Array(n);
  const h1 = new Float64Array(n);
  const h2 = new Float64Array(n);
  const g = new Float64Array(n);
  const assemble = () => {
    for (let i = 0; i < n; i += 1) {
      const i1 = (i + 1) % n;
      const i2 = (i + 2) % n;
      const a0 = (i - 1 + n) % n;
      h0[i] = w[a0] + 4 * w[i] + w[i1] + eps;
      h1[i] = -2 * (w[i] + w[i1]) * dotN(i, i1);
      h2[i] = w[i1] * dotN(i, i2);
      g[i] = nx[i] * (w[a0] * ax[a0] - 2 * w[i] * ax[i] + w[i1] * ax[i1]) + ny[i] * (w[a0] * ay[a0] - 2 * w[i] * ay[i] + w[i1] * ay[i1]);
    }
  };
  const H = (i, k) => {
    const d = (k - i + n) % n;
    if (d === 0) return h0[i];
    if (d === 1) return h1[i];
    if (d === n - 1) return h1[k];
    if (d === 2) return h2[i];
    if (d === n - 2) return h2[k];
    return 0;
  };
  const clamp = (v, i) => (v < lo[i] ? lo[i] : v > hi[i] ? hi[i] : v);
  const x = new Float64Array(n);
  for (let i = 0; i < n; i += 1) x[i] = clamp(0, i);
  // (H x + g)_i
  const residual = (i) => {
    let r = g[i] + h0[i] * x[i];
    for (let d = 1; d <= 2; d += 1) r += H(i, (i + d) % n) * x[(i + d) % n] + H(i, (i - d + n) % n) * x[(i - d + n) % n];
    return r;
  };
  // Work arrays for the chain solves (one allocation per call).
  const order = new Int32Array(n);
  const state = new Int8Array(n); // per chain slot: 0 free, -1 at lo, +1 at hi
  const slot = new Int32Array(n);
  const free = new Int32Array(n);
  const d0 = new Float64Array(n);
  const d1 = new Float64Array(n);
  const d2 = new Float64Array(n);
  const rhs = new Float64Array(n);
  const maxIterations = options.maxIterations ?? 4 * n;
  /**
   * Primal active-set method on the open chain left by holding samples `cut` and `cut + 1`: from a
   * feasible point, step towards the minimiser of the free samples; the first bound met joins the held
   * set; at the minimiser, the held sample whose multiplier has the wrong sign (most of all) is freed.
   * One change per step, so it cannot cycle.
   */
  const solveChain = (cut) => {
    const m = n - 2;
    for (let a = 0; a < m; a += 1) {
      const i = (cut + 2 + a) % n;
      order[a] = i;
      state[a] = lo[i] >= hi[i] || x[i] <= lo[i] ? -1 : x[i] >= hi[i] ? 1 : 0;
      if (state[a]) x[i] = state[a] < 0 ? lo[i] : hi[i];
    }
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      let f = 0;
      for (let a = 0; a < m; a += 1) {
        if (state[a] === 0) { slot[a] = f; free[f] = a; f += 1; } else slot[a] = -1;
      }
      if (f) {
        for (let c = 0; c < f; c += 1) {
          const a = free[c];
          const i = order[a];
          d0[c] = h0[i];
          d1[c] = c >= 1 && a - free[c - 1] <= 2 ? H(order[free[c - 1]], i) : 0;
          d2[c] = c >= 2 && a - free[c - 2] <= 2 ? H(order[free[c - 2]], i) : 0;
          // -g minus the couplings to everything held (bounds and the cut pair).
          let r = -g[i];
          for (let d = -2; d <= 2; d += 1) {
            if (!d) continue;
            const ak = a + d;
            if (ak < 0 || ak >= m || slot[ak] === -1) r -= H(i, (i + d + n) % n) * x[(i + d + n) % n];
          }
          rhs[c] = r;
        }
        const y = bandSolve(d0.subarray(0, f), d1.subarray(0, f), d2.subarray(0, f), rhs.subarray(0, f));
        if (!y) return;
        // Longest feasible step towards y.
        let alpha = 1;
        let block = -1;
        let side = 0;
        for (let c = 0; c < f; c += 1) {
          const i = order[free[c]];
          const step = y[c] - x[i];
          if (step < 0 && y[c] < lo[i]) {
            const t = (lo[i] - x[i]) / step;
            if (t < alpha) { alpha = t; block = free[c]; side = -1; }
          } else if (step > 0 && y[c] > hi[i]) {
            const t = (hi[i] - x[i]) / step;
            if (t < alpha) { alpha = t; block = free[c]; side = 1; }
          }
        }
        for (let c = 0; c < f; c += 1) {
          const i = order[free[c]];
          x[i] += alpha * (y[c] - x[i]);
          if (x[i] < lo[i]) x[i] = lo[i];
          if (x[i] > hi[i]) x[i] = hi[i];
        }
        if (block >= 0) {
          state[block] = side;
          x[order[block]] = side < 0 ? lo[order[block]] : hi[order[block]];
          continue;
        }
      }
      // At the minimiser of the free samples: free the held one that most wants to move inside.
      let worst = -1;
      let worstValue = 1e-9;
      for (let a = 0; a < m; a += 1) {
        const i = order[a];
        if (state[a] === 0 || lo[i] >= hi[i]) continue;
        const r = residual(i);
        const want = state[a] < 0 ? -r : r;
        if (want > worstValue) { worstValue = want; worst = a; }
      }
      if (worst < 0) return;
      state[worst] = 0;
    }
  };
  for (let round = 0; round < rounds; round += 1) {
    if (round) {
      // Weights from the spacing of the current line.
      const px = new Float64Array(n);
      const py = new Float64Array(n);
      for (let i = 0; i < n; i += 1) {
        px[i] = points[i].x + x[i] * nx[i];
        py[i] = points[i].y + x[i] * ny[i];
      }
      const seg = new Float64Array(n);
      let total = 0;
      for (let i = 0; i < n; i += 1) {
        const k = (i + 1) % n;
        seg[i] = Math.sqrt((px[k] - px[i]) * (px[k] - px[i]) + (py[k] - py[i]) * (py[k] - py[i]));
        total += seg[i];
      }
      const h = total / n;
      for (let j = 0; j < n; j += 1) {
        const ds = Math.max(h * 0.2, (seg[(j - 1 + n) % n] + seg[j]) / 2);
        const q = h / ds;
        w[j] = q * q * q;
      }
    }
    assemble();
    for (let pass = 0; pass < passes; pass += 1) {
      const before = Float64Array.from(x);
      solveChain(0);
      solveChain(Math.floor(n / 2));
      let moved = 0;
      for (let i = 0; i < n; i += 1) moved = Math.max(moved, Math.abs(x[i] - before[i]));
      if (moved < tol) break;
    }
  }
  return x;
};

/**
 * Signed curvature (1/m) of the offset line P_i = C_i + n_i N_i, from the circle through the samples
 * `span` either side (Menger curvature). Positive: turning towards the + side (right of travel).
 */
export const lineCurvature = (points, offsets, span = 2) => {
  const n = points.length;
  const { nx, ny } = normalsOf(points);
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    px[i] = points[i].x + offsets[i] * nx[i];
    py[i] = points[i].y + offsets[i] * ny[i];
  }
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const a = (i - span + n) % n;
    const c = (i + span) % n;
    const ux = px[i] - px[a];
    const uy = py[i] - py[a];
    const vx = px[c] - px[i];
    const vy = py[c] - py[i];
    const wx = px[c] - px[a];
    const wy = py[c] - py[a];
    const den = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy) * (wx * wx + wy * wy));
    out[i] = den > 0 ? (2 * (ux * vy - uy * vx)) / den : 0;
  }
  return out;
};
