/**
 * HUD-6 of docs/manager/F1M24-GAMEPLAY.md (driver-panel-units, the °C part; §2.8, §1.5, §1.7 `tyreC[i]`;
 * RF-SIM-03, RF-CMD-01, RNF-05, RNF-07, RNF-09). Pure, no React: the tyre's temperature on the pit wall.
 *
 *   tyreCOf(car)                  the engine's {surface, carcass} in °C for one car, or null (SIM-6 sends it;
 *                                 nothing is converted from the old 0..1 heat - §1.5)
 *   mirrorTyreC(mirror, view)     folds a worker tick's `snapshot[i].tyreC` (or `view.tyreC[i]`) into the
 *                                 mirror's cars - view data only, the engine never reads it back (RNF-05)
 *   loadRaceTyres()               data/balance/race-tyres.json (SIM-6) when it exists, else null
 *   tyreWindowOf(tyres, opts)     the compound's operating window in °C, `{lo, hi, status}`, from
 *                                 race-tyres.json `windowC` (by era, supplier and compound when it has them)
 *   tyreTempVerdict(c, window)    cold / near the low edge / in the window / near the high edge / overheating
 *   createTempTrend(), pushTempSample(trend, t, value), tempTrendOf(trend, now)
 *                                 rising / falling / steady from the engine's own samples on the race clock
 *
 * Every threshold is in data/balance/hud.json driverPanel.tyreTemp (presentation; the window itself is the
 * engine's data, never the game's °C - §1.6). Without `tyreC` the panel keeps its meter on the engine's 0..1
 * window, as before; with `tyreC` but no window it shows °C and the trend, and no verdict in °C.
 */

import HUD from "../data/balance/hud.json";

export const TYRE_TEMP = HUD.driverPanel.tyreTemp;

const finite = (value) => typeof value === "number" && Number.isFinite(value);

/** One node's °C: a number, or the hottest of the four wheels when the engine sends one per wheel. */
const nodeC = (value) => {
  if (finite(value)) return value;
  if (Array.isArray(value)) {
    const wheels = value.filter(finite);
    return wheels.length ? Math.max(...wheels) : null;
  }
  if (value && typeof value === "object") return nodeC(Object.values(value));
  return null;
};

/** The engine's tyre temperature of a car (§1.7 `tyreC[i]`: {surface, carcass} in °C), or null. */
export const tyreCOf = (car) => {
  const raw = car && car.tyreC;
  if (!raw || typeof raw !== "object") return null;
  const surface = nodeC(raw.surface);
  if (surface === null) return null;
  const carcass = nodeC(raw.carcass);
  const window = raw.windowC || raw.window || null;
  return { surface, carcass, window };
};

/**
 * A worker tick's tyre temperatures into the mirror's cars: `view.snapshot[i].tyreC` (by id, else by index)
 * or `view.tyreC[i]`. Absent in the tick = the mirror is left as it is (§1.7: absent → no change).
 */
export const mirrorTyreC = (mirror, view) => {
  if (!mirror || !view || !Array.isArray(mirror.cars)) return mirror;
  const byId = new Map(mirror.cars.map((car) => [car.id, car]));
  const put = (entry, index, value) => {
    if (!value || typeof value !== "object") return;
    const car = (entry && entry.id !== undefined && byId.get(entry.id)) || mirror.cars[index];
    if (car) car.tyreC = value;
  };
  const shots = Array.isArray(view.snapshot) ? view.snapshot : null;
  if (shots) shots.forEach((entry, index) => entry && put(entry, index, entry.tyreC));
  if (Array.isArray(view.tyreC)) view.tyreC.forEach((value, index) => put(shots ? shots[index] : null, index, value));
  return mirror;
};

/**
 * data/balance/race-tyres.json, the SIM lane's file (SIM-6), if it is there; null until it is. The require
 * is resolved at run time (webpack builds a context of race-tyres*, empty while the file does not exist;
 * Jest throws and we catch), so this branch builds and tests before SIM-6 is merged.
 */
export const loadRaceTyres = () => {
  const ext = ".json";
  try {
    const loaded = require(`../data/balance/race-tyres${ext}`);
    return loaded && loaded.default ? loaded.default : loaded;
  } catch (error) {
    return null;
  }
};

/** A range in any of the plain shapes a data file may use: [lo, hi], {lo, hi}, {min, max}, {low, high}, {from, to}. */
const rangeOf = (node) => {
  if (Array.isArray(node) && node.length === 2 && finite(node[0]) && finite(node[1])) return { lo: Math.min(node[0], node[1]), hi: Math.max(node[0], node[1]) };
  if (!node || typeof node !== "object" || Array.isArray(node)) return null;
  const pairs = [["lo", "hi"], ["min", "max"], ["low", "high"], ["minC", "maxC"]];
  for (const [a, b] of pairs) if (finite(node[a]) && finite(node[b])) return { lo: Math.min(node[a], node[b]), hi: Math.max(node[a], node[b]) };
  // {from, to} is a range only when both look like °C, not years (year spans hold the range under `value`).
  if (finite(node.from) && finite(node.to) && node.to < 1000) return { lo: Math.min(node.from, node.to), hi: Math.max(node.from, node.to) };
  return null;
};

const yearIn = (entry, year) => {
  if (!finite(year)) return true;
  const from = finite(entry.from) ? entry.from : -Infinity;
  const to = finite(entry.to) ? entry.to : Infinity;
  return year >= from && year <= to;
};

const lower = (value) => (typeof value === "string" ? value.toLowerCase() : value);

/**
 * Walks a `windowC` node down to one range: era spans ({from, to, value|windowC}), then the supplier, then
 * the compound, then a default (`default`, `all`, `any`, `dry`). Keeps the first `status` it meets.
 */
const resolveWindow = (node, keys, year, status = null, depth = 0) => {
  if (node === null || node === undefined || depth > 8) return null;
  const range = rangeOf(node);
  if (range) return { ...range, status: (node && node.status) || status };
  if (Array.isArray(node)) {
    // Era spans hold the range under `value`, `windowC` or (race-tyres.json `windows`, SIM-6) `compounds`.
    const inner = (entry) => (entry.value !== undefined ? entry.value : entry.windowC !== undefined ? entry.windowC : entry.compounds);
    const span = node.find((entry) => entry && typeof entry === "object" && yearIn(entry, year) && inner(entry) !== undefined);
    return span ? resolveWindow(inner(span), keys, year, span.status || status, depth + 1) : null;
  }
  if (typeof node !== "object") return null;
  const own = node.status || status;
  if (node.windowC !== undefined) return resolveWindow(node.windowC, keys, year, own, depth + 1);
  if (node.value !== undefined && rangeOf(node.value)) return resolveWindow(node.value, keys, year, own, depth + 1);
  if (Array.isArray(node.eras) || Array.isArray(node.byEra)) {
    const found = resolveWindow(node.eras || node.byEra, keys, year, own, depth + 1);
    if (found) return found;
  }
  const entries = Object.keys(node).reduce((map, key) => map.set(lower(key), node[key]), new Map());
  for (const key of keys) {
    if (key === null || key === undefined) continue;
    if (entries.has(lower(key))) {
      const found = resolveWindow(entries.get(lower(key)), keys, year, own, depth + 1);
      if (found) return found;
    }
  }
  for (const key of ["default", "all", "any", "dry"]) {
    if (entries.has(key)) {
      const found = resolveWindow(entries.get(key), keys, year, own, depth + 1);
      if (found) return found;
    }
  }
  return null;
};

/** Where race-tyres.json may keep the window: at its root, per era, per supplier, per compound. */
const windowRoots = (tyres, keys) => {
  const roots = [];
  if (tyres.windowC !== undefined) roots.push(tyres.windowC);
  ["compounds", "suppliers", "bySupplier", "byCompound"].forEach((field) => {
    const group = tyres[field];
    if (!group || typeof group !== "object") return;
    keys.forEach((key) => {
      const hit = Object.keys(group).find((name) => lower(name) === lower(key));
      if (hit) roots.push(group[hit]);
    });
  });
  ["windows", "eras", "byEra"].forEach((field) => {
    if (Array.isArray(tyres[field])) roots.push(tyres[field]);
  });
  return roots;
};

/**
 * The operating window in °C for a car's compound, or null. `opts`: { compound, supplier, year, engine }
 * (`engine` = a window the engine sent with `tyreC`, preferred when it is a range).
 */
export const tyreWindowOf = (tyres, { compound = null, supplier = null, year = null, engine = null } = {}) => {
  const keys = [supplier, compound];
  const fromEngine = engine ? resolveWindow(engine, keys, year) : null;
  if (fromEngine) return { ...fromEngine, source: "engine" };
  if (!tyres || typeof tyres !== "object") return null;
  for (const root of windowRoots(tyres, keys)) {
    const found = resolveWindow(root, keys, year, tyres.status || null);
    // SIM-6 measures the window on the grip temperature (model.gripCarcassShare of the carcass, RF-SIM-03).
    const share = tyres.model && finite(tyres.model.gripCarcassShare) ? tyres.model.gripCarcassShare : null;
    if (found) return { ...found, gripCarcassShare: share, source: "race-tyres.json" };
  }
  return null;
};

/** The tone and word of a temperature against its window (hud.json tyreTemp.nearEdgeC, judgeNode). */
export const tyreTempVerdict = (tyreC, window, config = TYRE_TEMP) => {
  if (!tyreC || !window) return null;
  const share = finite(window.gripCarcassShare) ? window.gripCarcassShare : null;
  const grip = share !== null && finite(tyreC.carcass) ? tyreC.surface * (1 - share) + tyreC.carcass * share : null;
  const value = config.judgeNode === "carcass" && finite(tyreC.carcass) ? tyreC.carcass
    : config.judgeNode === "grip" && grip !== null ? grip
    : tyreC.surface;
  if (!finite(value)) return null;
  const near = config.nearEdgeC;
  if (value < window.lo) return { state: "cold", tone: "info", value };
  if (value > window.hi) return { state: "overheating", tone: "neg", value };
  if (value < window.lo + near) return { state: "lowEdge", tone: "warn", value };
  if (value > window.hi - near) return { state: "highEdge", tone: "warn", value };
  return { state: "window", tone: "pos", value };
};

// ------------------------------------------------------------------ trend

/** A car's temperature samples on the race clock (only when the value changes). */
export const createTempTrend = () => ({ samples: [] });

/**
 * One sample. A clock that goes back (a jump, a new race) starts the series again. A value within minStepC of
 * the last one is stored only once `refreshSec` have gone by, so the quick mode (one value a lap) shows the
 * change of the last lap for a while and then "steady", and a flat step race reads "steady", not stale.
 */
export const pushTempSample = (trend, t, value, config = TYRE_TEMP.trend) => {
  if (!trend || !finite(t) || !finite(value)) return trend;
  const { samples } = trend;
  const last = samples[samples.length - 1];
  if (last && t < last.t) samples.length = 0;
  const tail = samples[samples.length - 1];
  if (tail && Math.abs(tail.value - value) < config.minStepC && t - tail.t < config.refreshSec) return trend;
  if (tail && tail.t === t) tail.value = value;
  else samples.push({ t, value });
  const keepFrom = t - config.keepSec;
  while (samples.length > 2 && samples[1].t < keepFrom) samples.shift();
  return trend;
};

/**
 * "rising" | "falling" | "steady", or null with too little history or a stale one: the newest sample against
 * the newest one at least `spanSec` older than it; inside ± deadbandC it is steady.
 */
export const tempTrendOf = (trend, now, config = TYRE_TEMP.trend) => {
  if (!trend || !trend.samples.length) return null;
  const { samples } = trend;
  const head = samples[samples.length - 1];
  if (finite(now) && now - head.t > config.staleSec) return null;
  let ref = null;
  for (let i = samples.length - 2; i >= 0; i -= 1) {
    if (head.t - samples[i].t >= config.spanSec) {
      ref = samples[i];
      break;
    }
  }
  if (!ref) return null;
  const delta = head.value - ref.value;
  if (delta > config.deadbandC) return { dir: "rising", delta };
  if (delta < -config.deadbandC) return { dir: "falling", delta };
  return { dir: "steady", delta };
};
