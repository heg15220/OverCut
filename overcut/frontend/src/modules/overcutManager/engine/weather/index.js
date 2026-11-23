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
 *   wetness   the 0..1 index the rest of the engine reads (pace class, DRS, mistakes, incidents,
 *             red flag), piecewise in the water with 0.24 and 0.62 at the two crossovers.
 *   forecast  Friday's rain chance and the live outlook, with an error that shrinks with the
 *             team's weather centre (hq forecastAccuracy).
 *
 * Every number is in data/balance/race-weather.json (RNF-07) with its source or NV. Determinism
 * (RF-SIM-15, RNF-05): only seeded streams (`seed::weather`, `seed::forecast`), no clock.
 */

import { clamp, createStream } from "../../../overcutTrayectoria/engine/rng";
import W from "../../data/balance/race-weather.json";
import CLIMATE from "../../data/weather/climate.json";

export const WEATHER_BALANCE = W;
export const STATES = W.states.list;
export const STATE_COUNT = STATES.length;
const RAIN_FROM = W.states.rainFrom;

// ------------------------------------------------------------------ grip

const G = W.grip;
/** Water (mm) a tyre clears at top speed: litres per second over speed × tread width (Pirelli). */
const capacityOf = (litres) => (litres / 1000 / ((G.topSpeedKmh / 3.6) * G.tyreWidthM)) * 1000;
export const INTER_CAPACITY_MM = capacityOf(G.evacuationLitresPerSec.inter);
export const WET_CAPACITY_MM = capacityOf(G.evacuationLitresPerSec.wet);
/** Where slick and inter give the same lap (the inter rises linearly from its near-dry ratio to the wet crossover). */
export const SLICK_INTER_MM = (INTER_CAPACITY_MM * (G.slickInterRatio - G.interDryRatio)) / (G.interWetRatio - G.interDryRatio);

const floating = (h, capacity) => (h > capacity ? G.aquaplane * (h / capacity - 1) ** G.aquaplaneExponent : 0);

/**
 * Lap time on `compound` with `h` mm of water, as a ratio over the dry race pace (fresh tyre, no
 * wear): 1 for a slick on a dry track, 1.11 where slick and inter cross, 1.27 where inter and wet
 * cross (race-weather.json grip, OpenF1).
 */
export const gripRatio = (compound, h) => {
  const water = Math.max(0, h);
  if (compound === "inter") return G.interDryRatio + ((G.interWetRatio - G.interDryRatio) * water) / INTER_CAPACITY_MM + floating(water, INTER_CAPACITY_MM);
  if (compound === "wet") return G.wetDryRatio + (G.wetSlopePerInterCap * water) / INTER_CAPACITY_MM + floating(water, WET_CAPACITY_MM);
  return Math.min(G.slickMax, 1 + (G.slickInterRatio - 1) * (water / SLICK_INTER_MM) ** G.slickExponent);
};

/** How far past its water capacity a tyre is (0 within it): the aquaplaning share mistakes read. */
export const aquaplaningOf = (compound, h) => {
  const capacity = compound === "inter" ? INTER_CAPACITY_MM : compound === "wet" ? WET_CAPACITY_MM : SLICK_INTER_MM;
  return Math.max(0, h / capacity - 1);
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
  for (let t = 0; t < pre; t += W.chain.stepMinutesMax) {
    const minutes = Math.min(W.chain.stepMinutesMax, pre - t);
    const before = state;
    state = startState ?? transition(climate.matrix, state, minutes, stream);
    if (state >= RAIN_FROM && before < RAIN_FROM) spread = spreadFor(km, stream);
    water = advanceWater(water, { rain: STATES[state].rainMmPerHour, trackC: trackTempOf(airOf(state), state, night), cars: cars * W.chain.preCarsShare, minutes, spread });
  }

  const out = {
    climate: climate.key,
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
  };
  for (let lap = 1; lap <= laps; lap += 1) {
    const minutes = lapMinutes(baseLap, out.wetness[lap - 1]);
    const before = state;
    state = transition(climate.matrix, state, minutes, stream);
    if (state >= RAIN_FROM && before < RAIN_FROM) spread = spreadFor(km, stream);
    water = advanceWater(water, { rain: STATES[state].rainMmPerHour, trackC: trackTempOf(airOf(state), state, night), cars, minutes, spread });
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

/** The track temperature target for lap `lap` (air + sun or rain, race-weather.json temperature). */
export const trackTargetOf = (weather, lap) => {
  const k = Math.min(Math.max(0, lap), weather.states.length - 1);
  return trackTempOf(weather.air[k], weather.states[k], Boolean(weather.night));
};

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

// ------------------------------------------------------------------ the view and the sound

/** The spray a follower meets (0..1) with this much water on the line. */
export const sprayLevelOf = (h) => clamp(h / INTER_CAPACITY_MM, 0, 1);

/** Seconds a follower `gapSec` behind loses in the spray over a lap (race-weather.json spray). */
export const sprayLossOf = (h, gapSec) => {
  const s = W.spray;
  if (!(h > 0) || gapSec === null || gapSec === undefined || gapSec >= s.windowSec) return 0;
  return s.lossSec * sprayLevelOf(h) * (1 - Math.max(0, gapSec) / s.windowSec);
};

/** The follower's accident factor in the spray (≥ 1). */
export const sprayRiskOf = (h, gapSec) => {
  const s = W.spray;
  if (!(h > 0) || gapSec === null || gapSec === undefined || gapSec >= s.windowSec) return 1;
  return 1 + s.incident * sprayLevelOf(h) * (1 - Math.max(0, gapSec) / s.windowSec);
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
    spray: round(sprayLevelOf(weather.water[k])),
    trackTemp: state.trackTemp ?? null,
    rubber: round(state.evolution || 0),
  };
};
