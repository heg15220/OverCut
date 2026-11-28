/**
 * Dynamic weather and the wet track (RF-SIM-11, RF-SIM-03, RF-SIM-09, RF-WKD, RF-HQ-02; SRS 2.3
 * point 6), shared by the quick mode (race.js), the step simulation (engine/sim) and the playable
 * sessions. The Trayectoria modes keep their own overcutTrayectoria/engine/weather.js.
 *
 *   climate   seven states, sunny to heavy rain, as a Markov chain per circuit and race month
 *             (data/weather/climate.json, ERA5 hourly reanalysis at the circuit since 1976). The
 *             hourly matrix becomes a per-lap one; the chain runs from two hours before the start
 *             so the track arrives wet or drying.
 *   water     millimetres of water on the racing line, off it and per sector: rain fills it with
 *             Gallaway's I^0.59, run-off, evaporation (Tetens, by track temperature) and the cars
 *             on the line take it away (fitted to real drying times, OpenF1). The line dries first.
 *   grip      lap-time ratio over the dry race pace for slick, inter and wet against the water,
 *             with the crossovers measured in OpenF1 wet races and the inter's and wet's water
 *             capacity from Pirelli's litres per second: above it a tyre floats (aquaplaning).
 *             GS-13: the litres per second go by tyre generation (grip.evacuation.eras); the
 *             functions take an optional `year`, and without it use the calibration era (the
 *             OpenF1 2023-2025 races the water was fitted to). The timeline carries `year` and
 *             `capacity` for the engine lanes that wire it in.
 *   wetness   the 0..1 index the rest of the engine reads (pace class, DRS, mistakes, incidents,
 *             red flag), piecewise in the water with 0.24 and 0.62 at the two crossovers.
 *   forecast  Friday's rain chance and the live outlook, with an error that shrinks with the
 *             team's weather centre (hq forecastAccuracy).
 *   track     WX-C3 / GS-14: the track's excess over the air follows the real height of the sun
 *             (NOAA, engine/weather/solar.js) and the cloud of the state, fitted on OpenF1's dry
 *             races (temperature.sun), relaxing with the asphalt's time constant; under rain it
 *             goes to air + trackOverAirRain. The timeline carries it per lap (`track`, `trackEq`,
 *             `sunElevation`). Five rubber levels (rubber.levels) and the rubber a session starts
 *             with from the one before, kept within a day and partly lost overnight without
 *             reaching zero (sessions.json evolution.days).
 *
 * Every number is in data/balance/race-weather.json (RNF-07) with its source or NV. Determinism
 * (RF-SIM-15, RNF-05): only seeded streams (`seed::weather`, `seed::forecast`), no clock.
 */

import { clamp, createStream } from "../../../overcutTrayectoria/engine/rng";
import W from "../../data/balance/race-weather.json";
import SESSIONS from "../../data/balance/sessions.json";
import CLIMATE from "../../data/weather/climate.json";
import { SUN_SITES, clearSkyKw, siteOf, solarElevationDeg } from "./solar";

export const WEATHER_BALANCE = W;
export const STATES = W.states.list;
export const STATE_COUNT = STATES.length;
const RAIN_FROM = W.states.rainFrom;

// ------------------------------------------------------------------ grip

const G = W.grip;
const EV = G.evacuation;
/** Water (mm) a tyre clears at `kmh`: litres per second over speed × tread width (Pirelli). */
const capacityMm = (litres, kmh) => (litres / 1000 / ((kmh / 3.6) * G.tyreWidthM)) * 1000;
const yearOf = (year) => (Number.isFinite(year) ? year : EV.calibrationYear);

/**
 * GS-13 (RF-SIM-03, RF-SIM-11, SRS §6): the wet-weather tyres' water evacuation in force in
 * `year` (race-weather.json grip.evacuation.eras, Pirelli and FIA tyre generations). Before the
 * first era with a published figure the earliest row (NV) holds; after the last, the last.
 * Without a year: the calibration era (the OpenF1 races the water model was fitted to).
 */
export const evacuationFor = (year) => {
  const y = yearOf(year);
  const eras = EV.eras;
  return eras.find((era) => y >= era.from && y <= era.to) || (y < eras[0].from ? eras[0] : eras[eras.length - 1]);
};

const CAPACITY_CACHE = new Map();
/**
 * The water (mm) each wet-weather tyre clears in `year` and where slick and inter cross: the
 * inter rises linearly from its near-dry ratio to the inter/wet crossover at its capacity, so the
 * crossovers keep the measured lap ratios (1.11, 1.27) in every era and move in millimetres with
 * the tyre generation. The millimetres are the model's (the fit's scale, grip.evacuation.fit):
 * a year's capacity is the fit's × its litres over the calibration era's, so the calibration
 * era is exactly the fitted model. Pure and memoised by year.
 */
const FIT_INTER_MM = capacityMm(EV.fit.inter, EV.fit.atKmh);
const FIT_WET_MM = capacityMm(EV.fit.wet, EV.fit.atKmh);
export const capacityFor = (year) => {
  const y = yearOf(year);
  if (CAPACITY_CACHE.has(y)) return CAPACITY_CACHE.get(y);
  const era = evacuationFor(y);
  const cal = evacuationFor(EV.calibrationYear);
  const interMm = FIT_INTER_MM * (capacityMm(era.inter, era.atKmh) / capacityMm(cal.inter, cal.atKmh));
  const out = Object.freeze({
    year: y,
    interMm,
    wetMm: FIT_WET_MM * (capacityMm(era.wet, era.atKmh) / capacityMm(cal.wet, cal.atKmh)),
    slickInterMm: (interMm * (G.slickInterRatio - G.interDryRatio)) / (G.interWetRatio - G.interDryRatio),
    status: era.status,
  });
  CAPACITY_CACHE.set(y, out);
  return out;
};

const DEFAULT_CAPACITY = capacityFor(null);
/** The calibration era's capacities (no year given: what race.js and stepRace.js read today). */
export const INTER_CAPACITY_MM = DEFAULT_CAPACITY.interMm;
export const WET_CAPACITY_MM = DEFAULT_CAPACITY.wetMm;
/** Where slick and inter give the same lap (the inter rises linearly from its near-dry ratio to the wet crossover). */
export const SLICK_INTER_MM = DEFAULT_CAPACITY.slickInterMm;
const capOf = (year) => (year === undefined || year === null ? DEFAULT_CAPACITY : capacityFor(year));

const floating = (h, capacity) => (h > capacity ? G.aquaplane * (h / capacity - 1) ** G.aquaplaneExponent : 0);

/**
 * Lap time on `compound` with `h` mm of water, as a ratio over the dry race pace (fresh tyre, no
 * wear): 1 for a slick on a dry track, 1.11 where slick and inter cross, 1.27 where inter and wet
 * cross (race-weather.json grip, OpenF1). `year` (optional) picks the tyre generation's water
 * capacity (GS-13); without it, the calibration era.
 */
export const gripRatio = (compound, h, year) => {
  const water = Math.max(0, h);
  const cap = capOf(year);
  if (compound === "inter") return G.interDryRatio + ((G.interWetRatio - G.interDryRatio) * water) / cap.interMm + floating(water, cap.interMm);
  if (compound === "wet") return G.wetDryRatio + (G.wetSlopePerInterCap * water) / cap.interMm + floating(water, cap.wetMm);
  return Math.min(G.slickMax, 1 + (G.slickInterRatio - 1) * (water / cap.slickInterMm) ** G.slickExponent);
};

/** How far past its water capacity a tyre is (0 within it): the aquaplaning share mistakes read. */
export const aquaplaningOf = (compound, h, year) => {
  const cap = capOf(year);
  const capacity = compound === "inter" ? cap.interMm : compound === "wet" ? cap.wetMm : cap.slickInterMm;
  return Math.max(0, h / capacity - 1);
};

/** The quickest tyre for `h` mm of water in `year` (its crossovers): "wet", "inter" or null for slicks. */
export const tyreForDepth = (h, year) => {
  const cap = capOf(year);
  return h >= cap.interMm ? "wet" : h >= cap.slickInterMm ? "inter" : null;
};

/** Seconds on the wet-weather tyres of `age` laps on a near-dry track (they overheat) and their wear. */
export const wetTyreAgeTime = (compound, age, h) => {
  const hot = G.dryOverheat[compound];
  const wear = (G.ageWear[compound] ?? 0) * age;
  return h < G.dryBelowMm && hot ? hot.base + age * hot.perLap + wear : wear;
};

// ------------------------------------------------------------------ wetness index

const WX = W.wetness;
const KNOTS = [
  [0, 0],
  [SLICK_INTER_MM, WX.atSlickInter],
  [INTER_CAPACITY_MM, WX.atInterWet],
  [WET_CAPACITY_MM, 1],
];

/** The 0..1 index the engine reads, from millimetres of water. */
export const wetnessOfDepth = (h) => {
  if (!(h > 0)) return 0;
  for (let k = 1; k < KNOTS.length; k += 1) {
    const [x1, y1] = KNOTS[k];
    const [x0, y0] = KNOTS[k - 1];
    if (h <= x1) return y0 + ((y1 - y0) * (h - x0)) / (x1 - x0);
  }
  return 1;
};

/** Millimetres of water for a wetness index (inverse of wetnessOfDepth; 1 = the wet's capacity). */
export const depthOfWetness = (w) => {
  if (!(w > 0)) return 0;
  for (let k = 1; k < KNOTS.length; k += 1) {
    const [x1, y1] = KNOTS[k];
    const [x0, y0] = KNOTS[k - 1];
    if (w <= y1) return x0 + ((x1 - x0) * (w - y0)) / (y1 - y0);
  }
  return WET_CAPACITY_MM;
};

/** The tyre for this much water (the crossovers): "wet", "inter" or null for slicks. */
export const tyreForWetness = (w) => (w >= WX.atInterWet ? "wet" : w >= WX.atSlickInter ? "inter" : null);

// ------------------------------------------------------------------ water

const WA = W.water;
const tetens = (c) => 0.6108 * Math.exp((17.27 * c) / (c + 237.3));
const TETENS_REF = tetens(WA.refTrackC);

/** Evaporation (mm/min) at this track temperature (Tetens saturation vapour pressure against the reference). */
export const evaporationAt = (trackC) => WA.evaporationMmPerMin * (tetens(trackC) / TETENS_REF);

const integrate = (h0, inflow, loss, k, minutes) => {
  const eq = (inflow - loss) / k;
  return clamp(eq + (h0 - eq) * Math.exp(-k * minutes), 0, WA.maxMm);
};

/**
 * One interval of `minutes` for one patch of track: `rain` real mm/h, `cars` running (0 off the
 * line), `sc` a safety car. dh/dt = inflow × rain^0.59 − evaporation − k h, solved exactly.
 */
export const waterStep = (h0, { rain, trackC, cars = 0, sc = false, minutes, line = true }) => {
  const inflow = rain > 0 ? WA.inflowPerMin * rain ** WA.inflowExponent : 0;
  const carShare = line ? (WA.carShare * cars * (sc ? WA.scFactor : 1)) / WA.refCars : 0;
  const k = WA.kPerMin * (WA.runoffShare + carShare);
  return integrate(h0, inflow, evaporationAt(trackC), k, minutes);
};

/** Sector, line and off-line water after `minutes` (`sector` is the multipliers of the shower). */
const advanceWater = (water, { rain, trackC, cars, sc, minutes, spread }) => {
  const sectors = water.sectors.map((h, k) => waterStep(h, { rain: rain * spread[k], trackC, cars, sc, minutes }));
  const offSectors = water.offSectors.map((h, k) => waterStep(h, { rain: rain * spread[k], trackC, minutes, line: false }));
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return { sectors, offSectors, line: mean(sectors), off: mean(offSectors) };
};

const dryWater = () => {
  const zeros = new Array(W.sectors.count).fill(0);
  return { sectors: zeros.slice(), offSectors: zeros.slice(), line: 0, off: 0 };
};

// ------------------------------------------------------------------ climate

const monthOf = (date) => (typeof date === "string" && date.length >= 7 ? Number(date.slice(5, 7)) : null);

/**
 * The climatology of this Grand Prix: its circuit (the pack's f1db id, or the calendar's circuit ref
 * through climate.json `aliases`) and month, the nearest month, or every circuit pooled.
 */
export const climateFor = (race = {}) => {
  const id = race.packCircuitId || race.circuitId || (race.circuit && (CLIMATE.aliases?.[race.circuit] || race.circuit)) || null;
  const circuit = (id && CLIMATE.circuits[id]) || null;
  const month = monthOf(race.date);
  if (circuit) {
    // Before a circuit's first night race its Grands Prix started in the afternoon ("<month>d").
    const year = typeof race.date === "string" ? Number(race.date.slice(0, 4)) : null;
    const day = CLIMATE.nightFrom?.[id] && year && year < CLIMATE.nightFrom[id] ? "d" : "";
    const keys = Object.keys(circuit).filter((key) => key.endsWith("d") === Boolean(day));
    const pool = keys.length ? keys : Object.keys(circuit);
    const gap = (key) => {
      const m = parseInt(key, 10);
      return month ? Math.min(Math.abs(m - month), 12 - Math.abs(m - month)) : m;
    };
    const pick = month && circuit[`${month}${day}`] ? `${month}${day}` : [...pool].sort((a, b) => gap(a) - gap(b))[0];
    return { ...circuit[pick], key: `${id}/${pick}` };
  }
  return { ...CLIMATE.global, key: "global" };
};

const draw = (weights, stream) => {
  let u = stream.next() * weights.reduce((sum, value) => sum + value, 0);
  for (let k = 0; k < weights.length; k += 1) {
    u -= weights[k];
    if (u <= 0) return k;
  }
  return weights.length - 1;
};

/** The chain over `minutes` from state `s` (first-order: P = I + (P_hour − I) × minutes / 60). */
const transition = (matrix, s, minutes, stream) => {
  const f = Math.min(1, minutes / 60);
  const row = matrix[s].map((p, j) => (j === s ? 1 + (p - 1) * f : p * f));
  return draw(row, stream);
};

/** Chance of rain at any time in the next `hours` from the start-hour distribution (dry states only, absorbed by rain). */
export const rainChanceOf = (climate, hours = 2) => {
  let v = climate.start.map((p, s) => (s < RAIN_FROM ? p : 0));
  for (let h = 0; h < Math.ceil(hours); h += 1) {
    const next = new Array(STATE_COUNT).fill(0);
    for (let i = 0; i < RAIN_FROM; i += 1) for (let j = 0; j < RAIN_FROM; j += 1) next[j] += v[i] * climate.matrix[i][j];
    v = next;
  }
  return clamp(1 - v.reduce((sum, value) => sum + value, 0), 0, 1);
};

/** The circuit's chance (0..1) of rain during this Grand Prix (its month's ERA5 chain over the race's length): for the UI. */
export const raceRainChance = (race = {}) => rainChanceOf(climateFor(race), ((race.laps || 60) * (race.baseLap || G.fallbackBaseLap)) / 3600);

const spreadFor = (km, stream) => {
  const s = Math.min(W.sectors.spreadMax, W.sectors.spreadPerKm * (km || 5));
  const z = Array.from({ length: W.sectors.count }, () => stream.normal(0, 1));
  const mean = z.reduce((sum, value) => sum + value, 0) / z.length;
  return z.map((value) => Math.max(0, 1 + s * (value - mean)));
};

/** Track temperature: air plus the sun by the state's cloud, or the rain's offset; at night no sun. */
const trackTempOf = (air, state, night = false, temp = W.temperature) => {
  const s = STATES[state];
  const over = state >= RAIN_FROM || night ? temp.trackOverAirRain : temp.trackOverAirDry * s.sunShare;
  return clamp(air + over, temp.minC, temp.maxC);
};
const isNight = (climate) => climate.startHour >= W.temperature.nightFromHour || climate.startHour < W.temperature.dayFromHour;

// ------------------------------------------------------------------ the sun on the track (GS-14)

const SUN = W.temperature.sun;
const cloudOfState = (state) => SUN.cloudByState[STATES[state]?.id] ?? 1;

/**
 * WX-C3 / GS-14 (RF-SIM-11): the dry track's equilibrium excess over the air (°C) with the sun at
 * `elevationDeg` (true, degrees) under the cloud of weather state `state` (index; 0 sunny):
 * base + gain × Haurwitz clear sky × (1 − c × N^3.4), race-weather.json temperature.sun (OpenF1
 * 2023-2025). The sun below the horizon leaves `base` (the night's excess). Pure.
 */
export const sunExcessOf = (elevationDeg, state = 0) => SUN.base + SUN.gain * clearSkyKw(elevationDeg) * (1 - SUN.cloud.coefficient * cloudOfState(state) ** SUN.cloud.exponent);

/** The excess the track goes to in `state` (rain: trackOverAirRain) and its time constant. */
const excessTargetOf = (elevationDeg, state) => (state >= RAIN_FROM ? W.temperature.trackOverAirRain : sunExcessOf(elevationDeg, state));
const tauOf = (state) => (state >= RAIN_FROM ? W.temperature.relaxTauMin : SUN.tauMin);

/** First-order step of the excess over `minutes` towards `target` (the asphalt's inertia). Pure. */
export const relaxExcess = (excess, target, minutes, tauMin) => target + (excess - target) * Math.exp(-Math.max(0, minutes) / tauMin);

/**
 * Where and when the sun is for this Grand Prix: the climate key's site (sun-sites.json), the race
 * date and the start hour (climate.json, local with the offset it was computed with). null without
 * them (the pooled climate, a race without a date): the track then keeps the old sunShare excess.
 */
const sunClockOf = (race, climate) => {
  const site = siteOf(climate.key);
  const date = typeof race.date === "string" && race.date.length >= 10 ? race.date.slice(0, 10) : null;
  if (!site || !date || !Number.isFinite(climate.startHour)) return null;
  return { ...site, date, startHour: climate.startHour };
};
const elevationAt = (clock, minutesFromStart) =>
  solarElevationDeg({ lat: clock.lat, lon: clock.lon, date: clock.date, hour: clock.startHour + minutesFromStart / 60, utcOffsetH: clock.utcOffsetH });

/** The excess after `minutes` in one state from `t0` (minutes from the start), in steps of chain.stepMinutesMax. */
const runExcess = (excess, clock, state, t0, minutes) => {
  let e = excess;
  for (let t = 0; t < minutes; t += W.chain.stepMinutesMax) {
    const dt = Math.min(W.chain.stepMinutesMax, minutes - t);
    e = relaxExcess(e, excessTargetOf(elevationAt(clock, t0 + t + dt), state), dt, tauOf(state));
  }
  return e;
};
const clampTrack = (c) => clamp(c, W.temperature.minC, W.temperature.maxC);

// ------------------------------------------------------------------ the race

const lapMinutes = (baseLap, wetness) => (baseLap * (1 + W.chain.lapSlowdown * wetness)) / 60;

export const kindOf = (wetness) => {
  const k = W.kinds;
  if (!wetness.some((value) => value >= k.mixedFrom)) return "dry";
  const wetLaps = wetness.filter((value) => value >= k.wetFrom).length;
  return wetLaps >= wetness.length * k.wetShare ? "wet" : "mixed";
};

/**
 * The afternoon, decided before the start on its own stream (`seed::weather`): per lap 0..laps
 * the state, the rain (mm/h), the water on the line, off it and per sector, the wetness index and
 * the air temperature; the Friday forecast and the live outlook (`seed::forecast`, error by
 * `accuracy`). Laps 1.. are provisional: beginLapWorld recomputes each one from the previous with
 * the cars really running (`updateLapWater`). `startState` forces the state at the start (tests,
 * scenarios).
 */
export const weatherTimeline = ({ race = {}, laps, cars = 20, seed = "weather", accuracy = W.forecast.defaultAccuracy, startState = null }) => {
  // Keyed on the date too: one seed reused across seasons (tests, tools) does not replay one afternoon.
  const stream = createStream(`${seed}::weather::${race.date || ""}`);
  const climate = climateFor(race);
  const baseLap = race.baseLap || G.fallbackBaseLap;
  const km = race.lengthKm || 5;
  const temp = W.temperature;
  const airBase = (climate.airC?.dry ?? temp.fallbackAirC) + stream.normal(0, climate.airC?.drySd ?? temp.airSdDefault);
  // Rain cools the air by the climatology's own dry-wet difference at the start hour.
  const rainCooling = Math.max(0, (climate.airC?.dry ?? 0) - (climate.airC?.wet ?? climate.airC?.dry ?? 0));
  const airOf = (state) => (state >= RAIN_FROM ? airBase - rainCooling : airBase);
  const night = isNight(climate);

  // Two hours before the start: the chain and the water run, with support races, reconnaissance and
  // formation laps keeping a line (chain.preCarsShare of the field).
  let state = startState ?? draw(climate.start, stream);
  let spread = spreadFor(km, stream);
  let water = dryWater();
  const pre = W.chain.preMinutes;
  // GS-14: the track's excess, warmed up at equilibrium SUN.warmupMin before the pre-run under the
  // first state (no stream: the same draws as before), then relaxed with every state the chain takes.
  // The water's evaporation keeps reading the old track temperature (trackTempOf) until the SIM lane
  // moves race.js onto `track`, so the water and every race stay byte-identical (RNF-05, golden).
  const clock = sunClockOf(race, climate);
  let excess = null;
  if (clock) {
    const from = -pre - SUN.warmupMin;
    excess = runExcess(excessTargetOf(elevationAt(clock, from), state), clock, state, from, SUN.warmupMin);
  }
  const trackNow = (st) => (clock ? clampTrack(airOf(st) + excess) : trackTempOf(airOf(st), st, night));
  for (let t = 0; t < pre; t += W.chain.stepMinutesMax) {
    const minutes = Math.min(W.chain.stepMinutesMax, pre - t);
    const before = state;
    state = startState ?? transition(climate.matrix, state, minutes, stream);
    if (state >= RAIN_FROM && before < RAIN_FROM) spread = spreadFor(km, stream);
    if (clock) excess = runExcess(excess, clock, state, -pre + t, minutes);
    water = advanceWater(water, { rain: STATES[state].rainMmPerHour, trackC: trackTempOf(airOf(state), state, night), cars: cars * W.chain.preCarsShare, minutes, spread });
  }
  let elapsed = 0;
  const round1 = (value) => Math.round(value * 10) / 10;
  const eqNow = (st) => (clock ? clampTrack(airOf(st) + excessTargetOf(elevationAt(clock, elapsed), st)) : trackTempOf(airOf(st), st, night));
  const sunNow = () => (clock ? Math.round(elevationAt(clock, elapsed) * 100) / 100 : null);

  // GS-13: the season's tyre generation, for the engine lanes that read the capacity by year.
  const year = Number.isFinite(race.year) ? race.year : typeof race.date === "string" && race.date.length >= 4 ? Number(race.date.slice(0, 4)) : null;
  const capacity = capacityFor(year);
  const out = {
    climate: climate.key,
    year,
    capacity: { interMm: capacity.interMm, wetMm: capacity.wetMm, slickInterMm: capacity.slickInterMm },
    states: [state],
    rain: [STATES[state].rainMmPerHour],
    water: [water.line],
    offLine: [water.off],
    sectors: [water.sectors],
    offSectors: [water.offSectors],
    spreads: [spread],
    wetness: [wetnessOfDepth(water.line)],
    air: [airOf(state)],
    night,
    // GS-14: the track per lap (relaxed), the equilibrium it heads for and the sun's true elevation.
    track: [round1(trackNow(state))],
    trackEq: [round1(eqNow(state))],
    sunElevation: [sunNow()],
  };
  for (let lap = 1; lap <= laps; lap += 1) {
    const minutes = lapMinutes(baseLap, out.wetness[lap - 1]);
    const before = state;
    state = transition(climate.matrix, state, minutes, stream);
    if (state >= RAIN_FROM && before < RAIN_FROM) spread = spreadFor(km, stream);
    if (clock) excess = runExcess(excess, clock, state, elapsed, minutes);
    elapsed += minutes;
    water = advanceWater(water, { rain: STATES[state].rainMmPerHour, trackC: trackTempOf(airOf(state), state, night), cars, minutes, spread });
    out.track.push(round1(trackNow(state)));
    out.trackEq.push(round1(eqNow(state)));
    out.sunElevation.push(sunNow());
    out.states.push(state);
    out.rain.push(STATES[state].rainMmPerHour);
    out.water.push(water.line);
    out.offLine.push(water.off);
    out.sectors.push(water.sectors);
    out.offSectors.push(water.offSectors);
    out.spreads.push(spread);
    out.wetness.push(wetnessOfDepth(water.line));
    out.air.push(airOf(state));
  }
  out.kind = kindOf(out.wetness);
  out.rainChance = Math.round(rainChanceOf(climate, (laps * baseLap) / 3600) * 100);
  Object.assign(out, forecastOf({ timeline: out, climateChance: out.rainChance / 100, accuracy, baseLap, seed }));
  return out;
};

/**
 * The track temperature target for lap `lap` as race.js reads it today (air + trackOverAirDry ×
 * sunShare, or the rain's offset). GS-14 leaves it as it was on purpose: race.js (carril SIM) still
 * starts from it and adds its own afternoon drift; moving it moves every race and the quick mode's
 * golden. The sun's model is in the timeline (`track`, `trackEq`) and `trackAt` for the SIM lane to
 * wire in (F1M24-CHINA SIM-C4 writes race.js).
 */
export const trackTargetOf = (weather, lap) => {
  const k = Math.min(Math.max(0, lap), weather.states.length - 1);
  return trackTempOf(weather.air[k], weather.states[k], Boolean(weather.night));
};

/**
 * GS-14: the track temperature the weather model gives on lap `lap` (the timeline's `track`: the
 * sun's excess relaxed with the asphalt's time constant, rain towards air + trackOverAirRain), for
 * the engine lanes to follow lap by lap instead of race.js's fixed drift (contract, not yet read by
 * race.js); null without the series. `trackEq[lap]` is the equilibrium it heads for.
 */
export const trackAt = (weather, lap) => {
  if (!weather || !Array.isArray(weather.track) || !weather.track.length) return null;
  const k = Math.min(Math.max(0, Math.round(lap)), weather.track.length - 1);
  return Number.isFinite(weather.track[k]) ? weather.track[k] : null;
};

/**
 * GS-13: the track temperature after `minutes` relaxing towards `targetC` (the rain's air +
 * trackOverAirRain, or the sun's) with the measured time constant (race-weather.json
 * temperature.relaxTauMin, OpenF1 9668: the Chinese sprint qualifying 2024 cooled under rain).
 * The per-lap step the race applies is 1 − exp(−lap minutes / τ). Pure.
 */
export const relaxTrackTemp = (trackC, targetC, minutes) => targetC + (trackC - targetC) * Math.exp(-Math.max(0, minutes) / W.temperature.relaxTauMin);

/** The rain's target for the track: the air plus trackOverAirRain (OpenF1). */
export const rainTrackTargetOf = (airC) => clamp(airC + W.temperature.trackOverAirRain, W.temperature.minC, W.temperature.maxC);

/**
 * Lap `lap` for real (beginLapWorld, both modes): the water after the previous lap with the cars
 * running now, the safety car and the track temperature, replacing the provisional value.
 */
export const updateLapWater = (weather, lap, { cars, sc = false, trackC, baseLap }) => {
  if (!weather.sectors || lap < 1 || lap >= weather.water.length) return;
  const minutes = lapMinutes(baseLap || G.fallbackBaseLap, weather.wetness[lap - 1]);
  const water = advanceWater(
    { sectors: weather.sectors[lap - 1], offSectors: weather.offSectors[lap - 1] },
    { rain: weather.rain[lap], trackC, cars, sc, minutes, spread: weather.spreads[lap] },
  );
  weather.water[lap] = water.line;
  weather.offLine[lap] = water.off;
  weather.sectors[lap] = water.sectors;
  weather.offSectors[lap] = water.offSectors;
  weather.wetness[lap] = wetnessOfDepth(water.line);
};

// ------------------------------------------------------------------ forecast (RF-HQ-02)

/**
 * Friday's rain chance (%) and the live outlook: the truth (rain in the race or not) weighed by
 * the weather centre's accuracy against the circuit's climate, with noise; the outlook is the
 * race's own wetness shifted by one timing error for the whole race.
 */
export const forecastOf = ({ timeline, climateChance, accuracy = W.forecast.defaultAccuracy, baseLap = G.fallbackBaseLap, seed = "weather" }) => {
  const f = W.forecast;
  const stream = createStream(`${seed}::forecast`);
  const acc = clamp(accuracy, 0, 1);
  const truth = timeline.states.some((state) => state >= RAIN_FROM) || timeline.wetness[0] >= W.kinds.mixedFrom ? 100 : 0;
  const forecast = Math.round(clamp(truth * acc + climateChance * 100 * (1 - acc) + stream.normal(0, f.noise * (1 - acc)), 0, f.max));
  const shift = Math.round((stream.normal(0, f.timingSdMin * (1 - acc)) * 60) / baseLap);
  const last = timeline.wetness.length - 1;
  const outlook = timeline.wetness.map((_, lap) => timeline.wetness[clamp(lap + shift, 0, last)]);
  return { forecast, outlook, forecastShiftLaps: shift, forecastAccuracy: acc };
};

// ------------------------------------------------------------------ sessions

/**
 * The mean wetness index of a practice or qualifying session (RF-WKD-02): the circuit's chain
 * and water over the session with `sessions.cars` on track, two hours of weather before it.
 */
export const sessionWetness = ({ race = {}, kind = "qualifying", stream }) => {
  const s = W.sessions[kind] || W.sessions.qualifying;
  const climate = climateFor(race);
  const air = (climate.airC?.dry ?? W.temperature.fallbackAirC) + stream.normal(0, climate.airC?.drySd ?? W.temperature.airSdDefault);
  let state = draw(climate.start, stream);
  let water = dryWater();
  const spread = new Array(W.sectors.count).fill(1);
  const step = W.chain.stepMinutesMax;
  let sum = 0;
  let n = 0;
  for (let t = 0; t < W.chain.preMinutes + s.minutes; t += step) {
    state = transition(climate.matrix, state, step, stream);
    const onTrack = t >= W.chain.preMinutes;
    water = advanceWater(water, { rain: STATES[state].rainMmPerHour, trackC: trackTempOf(air, state, isNight(climate)), cars: onTrack ? W.sessions.cars : 0, minutes: step, spread });
    if (onTrack) {
      sum += wetnessOfDepth(water.line);
      n += 1;
    }
  }
  return Math.round((sum / Math.max(1, n)) * 1000) / 1000;
};

/**
 * reloj-sesion (F1M24-GAMEPLAY §2.12.3; RF-SIM-11, RF-WKD-01): the conditions at a local hour of
 * the weekend, for the playable sessions' clock. The circuit's climatology (climate.json, ERA5)
 * holds the air at the race's start hour; `diurnal` ({peakHour, halfRangeC}, sessions.json
 * clock.diurnal) moves it along a 24-hour cosine to `hour` (absent or without a start hour: the
 * start-hour air). Night from race-weather.json temperature.nightFromHour to dayFromHour; the
 * track over the air as in the race (trackTempOf) for `state` (0 = sunny). Pure: no stream.
 */
export const hourlyConditions = ({ race = {}, hour, state = 0, diurnal = null, utcOffsetH = null }) => {
  const climate = climateFor(race);
  const startHour = Number.isFinite(climate.startHour) ? climate.startHour : null;
  const h = ((hour % 24) + 24) % 24;
  const night = h >= W.temperature.nightFromHour || h < W.temperature.dayFromHour;
  const base = climate.airC?.dry ?? W.temperature.fallbackAirC;
  const wave = (at) => Math.cos((2 * Math.PI * (at - diurnal.peakHour)) / 24);
  const airC = diurnal && startHour !== null && Number.isFinite(diurnal.halfRangeC) ? base + diurnal.halfRangeC * (wave(h) - wave(startHour)) : base;
  const round1 = (value) => Math.round(value * 10) / 10;
  // GS-14: with the circuit's site and a date, the track's excess under the real sun at that hour,
  // relaxed through the SUN.warmupMin before it in the same state (the afternoon track cools later
  // than the sun drops). The session clock is civil time (the pack's startLocal): the circuit's
  // civil offset when sun-sites.json has its zone, else the climate's (or `utcOffsetH` if given).
  const clock = sunClockOf(race, climate);
  if (clock) {
    const civil = civilOffsetOf(climate.key);
    const offset = Number.isFinite(utcOffsetH) ? utcOffsetH : Number.isFinite(civil) ? civil : clock.utcOffsetH;
    const at = { ...clock, startHour: h, utcOffsetH: offset };
    const from = -SUN.warmupMin;
    const excess = runExcess(excessTargetOf(elevationAt(at, from), state), at, state, from, SUN.warmupMin);
    const sunElevationDeg = Math.round(elevationAt(at, 0) * 100) / 100;
    return { hour: Math.round(h * 1000) / 1000, startHour, night, airC: round1(airC), trackC: round1(clampTrack(airC + excess)), sunElevationDeg };
  }
  return { hour: Math.round(h * 1000) / 1000, startHour, night, airC: round1(airC), trackC: round1(trackTempOf(airC, state, night)), sunElevationDeg: null };
};

/** The civil UTC offset (summer time included) of a climate key's month, or null (sun-sites.json civilOffsetH). */
const civilOffsetOf = (climateKey) => {
  const site = siteOf(climateKey);
  const civil = site ? SUN_SITES.sites[site.id].civilOffsetH : null;
  if (!civil) return null;
  const month = climateKey.split("/")[1];
  return civil[month] ?? civil[String(parseInt(month, 10))] ?? null;
};

// ------------------------------------------------------------------ rubber (GS-14)

const RUBBER_BANDS = W.rubber.levels.bands;
const DAYS = SESSIONS.evolution.days;

/**
 * GS-14 (RNF-08, RNF-09): the rubber's band among five (race-weather.json rubber.levels) for the
 * engine's rubber 0..1 (washed below 0 → the first): { id, es, en }. null for no number.
 */
export const rubberLevelOf = (rubber) => {
  if (!Number.isFinite(rubber)) return null;
  const band = RUBBER_BANDS.find((row) => row.below === null || rubber < row.below) || RUBBER_BANDS[RUBBER_BANDS.length - 1];
  return { id: band.id, es: band.es, en: band.en };
};

/**
 * GS-14 (RF-SIM-11, RF-WKD-03): the rubber (share 0..1 of what the era lays down at most) a
 * session starts with after one that left `rubber`: × sameDay on the same day; × nextDay
 * overnight, but never below the supportFloor the next morning's support races lay down. A
 * washed track (below 0: a wet session, race-weather.json rubber) stays as it is: the water, not
 * the night, decided it. sessions.json evolution.days (pending). Pure.
 */
export const rubberAtSessionStart = ({ rubber = 0, sameDay = true, days = DAYS } = {}) => {
  const r = Number.isFinite(rubber) ? rubber : 0;
  if (sameDay || r < 0) return sameDay ? r * days.sameDay : r;
  return Math.max(r * days.nextDay, days.supportFloor);
};

// ------------------------------------------------------------------ the view and the sound

/** The spray a follower meets (0..1) with this much water on the line. */
export const sprayLevelOf = (h, year) => clamp(h / capOf(year).interMm, 0, 1);

/**
 * WX-C2 / GS-11 (F1M24-CHINA §1.5 «Spray»; RF-SIM-11, RNF-05): the spray car throws, 0..1, with
 * `h` mm of water under it, at `kmh` (optional) in `year` (optional, the tyre generation's
 * capacity). The water a tyre throws is the water it clears: h × speed × tread width
 * (grip.evacuation), so the spray is that flux over the inter's capacity at the speed the fit was
 * made at (grip.evacuation.fit.atKmh), at most 1. Without a speed, the water level alone
 * (sprayLevelOf, what the engine read before). Pure: same inputs, same output; no stream, no
 * clock. The step sim publishes it as `snapshot.spray[i]`; the view and the sound only read it.
 */
export const sprayAt = (h, { kmh, year } = {}) => {
  if (!(h > 0)) return 0;
  const level = sprayLevelOf(h, year);
  if (!Number.isFinite(kmh)) return level;
  return clamp((level * Math.max(0, kmh)) / EV.fit.atKmh, 0, 1);
};

/** Seconds a follower `gapSec` behind loses in the spray over a lap (race-weather.json spray). */
export const sprayLossOf = (h, gapSec, year) => {
  const s = W.spray;
  if (!(h > 0) || gapSec === null || gapSec === undefined || gapSec >= s.windowSec) return 0;
  return s.lossSec * sprayLevelOf(h, year) * (1 - Math.max(0, gapSec) / s.windowSec);
};

/** The follower's accident factor in the spray (≥ 1). */
export const sprayRiskOf = (h, gapSec, year) => {
  const s = W.spray;
  if (!(h > 0) || gapSec === null || gapSec === undefined || gapSec >= s.windowSec) return 1;
  return 1 + s.incident * sprayLevelOf(h, year) * (1 - Math.max(0, gapSec) / s.windowSec);
};

/**
 * What the view (rain visuals) and the sound agent (rain ambience) read for lap `lap`: the state,
 * the rain, the water on the line and off it per sector, the spray, the track temperature and the
 * rubber. Plain data (postMessage-safe).
 */
export const weatherSnapshot = (state, lap = state.lap) => {
  const weather = state.weather;
  if (!weather || !weather.states) return null;
  const k = clamp(Math.round(lap), 0, weather.states.length - 1);
  const s = STATES[weather.states[k]];
  const round = (value) => Math.round(value * 1000) / 1000;
  return {
    state: s.id,
    stateIndex: weather.states[k],
    rainMmPerHour: weather.rain[k],
    rainIntensity: round(clamp(weather.rain[k] / STATES[STATE_COUNT - 1].rainMmPerHour, 0, 1)),
    waterMm: round(weather.water[k]),
    offLineMm: round(weather.offLine[k]),
    sectorsMm: weather.sectors[k].map(round),
    wetness: round(weather.wetness[k]),
    spray: round(sprayAt(weather.water[k])),
    trackTemp: state.trackTemp ?? null,
    rubber: round(state.evolution || 0),
    // GS-14: the rubber's band among five and the sun's true elevation on this lap (null without the model).
    rubberLevel: rubberLevelOf(state.evolution || 0).id,
    sunElevationDeg: Array.isArray(weather.sunElevation) ? weather.sunElevation[Math.min(k, weather.sunElevation.length - 1)] ?? null : null,
  };
};
