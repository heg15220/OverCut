/**
 * The engine's water as the live view reads it (LOOK-C4; GS-10, VIEW-07; RF-SIM-11, RF-3D-04, RNF-05,
 * RNF-07). F1M24-CHINA §1.5 «Spray»: the engine publishes `snapshot.weather {state, rainRate, waterMm:
 * {line, off, sectors[]}}` and `snapshot.spray[i]`; the race worker also sends `weatherNow` (engine/weather
 * weatherSnapshot: `{state, rainMmPerHour, waterMm, offLineMm, sectorsMm, spray}`). Both shapes come here
 * and leave as one: the snapshot's. Nothing is computed from the weather: the figures are copied.
 *
 * Contracts other lanes give later are read defensively (absent → the behaviour before LOOK-C4): with no
 * engine weather at all, the old `wet` flag of the live view (a boolean, or the wetness 0..1 it was made
 * from) stands for a wet track of rain.hookup.flagFallback (view-look.json), whose water depth is the
 * engine's own depthOfWetness of that wetness. The spray of a car is the engine's, in this order:
 * `pose.spray`, `car.spray`, the view's `spray` prop (by index or id), and else engine/weather
 * sprayLevelOf of the line's water (the very function the engine publishes it with); 0 in the pit lane.
 */

import LOOK from "../../data/balance/view-look.json";
import { depthOfWetness, sprayLevelOf } from "../../engine/weather";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const finite = (v) => Number.isFinite(v);
const nonNeg = (v, fallback = 0) => (finite(v) ? Math.max(0, v) : fallback);

/**
 * One weather shape from what the view was handed: a snapshot weather, a weatherNow, or a snapshot array
 * carrying `.weather`. Null when there is no water figure in it.
 */
export const weatherViewOf = (input) => {
  if (!input || typeof input !== "object") return null;
  const w = input.waterMm === undefined && input.weather && typeof input.weather === "object" ? input.weather : input;
  const water = w.waterMm;
  let line;
  let off;
  let sectors;
  let offSectors = null;
  if (water && typeof water === "object") {
    line = water.line;
    off = water.off;
    sectors = water.sectors;
    offSectors = Array.isArray(water.offSectors) ? water.offSectors.slice() : null;
  } else if (finite(water)) {
    line = water;
    off = w.offLineMm;
    sectors = w.sectorsMm;
  } else return null;
  const lineMm = nonNeg(line);
  const rainRate = finite(w.rainRate) ? w.rainRate : finite(w.rainMmPerHour) ? w.rainMmPerHour : 0;
  const view = {
    state: w.state ?? null,
    rainRate: Math.max(0, rainRate),
    waterMm: { line: lineMm, off: Math.max(lineMm, nonNeg(off, lineMm)), sectors: Array.isArray(sectors) ? sectors.map((h) => nonNeg(h)) : [] },
    spray: finite(w.spray) ? clamp(w.spray, 0, 1) : null,
    humidity: finite(w.humidity) ? w.humidity : null,
    source: "engine",
  };
  if (offSectors) view.waterMm.offSectors = offSectors.map((h) => nonNeg(h));
  return view;
};

/** Whether the old `wet` prop says wet: a boolean, or a wetness 0..1 above flagFallback.fromWetness. */
export const flagIsWet = (wet, cfg = LOOK.rain.hookup.flagFallback) => (typeof wet === "number" ? wet > cfg.fromWetness : Boolean(wet));

/**
 * The weather the view draws this frame: the engine's when it is there, else the flag's stand-in (see the
 * module note), else dry. Always the snapshot shape, with `source` "engine" | "flag" | "none".
 */
export const frameWeatherFor = ({ weather = null, wet = false, cfg = LOOK.rain.hookup.flagFallback } = {}) => {
  const view = weatherViewOf(weather);
  if (view) return view;
  if (!flagIsWet(wet, cfg)) return { state: null, rainRate: 0, waterMm: { line: 0, off: 0, sectors: [] }, spray: null, humidity: null, source: "none" };
  const line = depthOfWetness(cfg.wetness);
  return {
    state: null,
    rainRate: cfg.rainMmH,
    waterMm: { line, off: line * cfg.offOverLine, sectors: [] },
    spray: null,
    humidity: null,
    source: "flag",
  };
};

/** Whether rain is falling in a frame weather (streaks, rain fog, the wet light). */
export const isRaining = (frame) => Boolean(frame) && frame.rainRate > 0;

/** The racing line's water of a frame weather (the sector's, when `sector` and the engine give one). */
export const lineWaterOf = (frame, sector = null) => {
  if (!frame || !frame.waterMm) return 0;
  const sectors = frame.waterMm.sectors;
  if (sector !== null && Array.isArray(sectors) && finite(sectors[sector])) return sectors[sector];
  return nonNeg(frame.waterMm.line);
};

/**
 * The spray car `index` throws (0..1), as the engine publishes it: `pose.spray`, `car.spray`, the view's
 * `spray` (array by index or `{id: level}`), else engine/weather sprayLevelOf of the line's water; 0 in the
 * pit lane, stopped, gone or on a dry track.
 */
export const carSprayOf = ({ car = null, pose = null, index = -1, spray = null, frame = null, year } = {}) => {
  if (pose && (pose.inPit || pose.stopped || pose.gone || pose.garage || pose.parked)) return 0;
  const own = pose && finite(pose.spray) ? pose.spray : car && finite(car.spray) ? car.spray : null;
  if (own !== null) return clamp(own, 0, 1);
  if (Array.isArray(spray) && finite(spray[index])) return clamp(spray[index], 0, 1);
  if (spray && typeof spray === "object" && !Array.isArray(spray) && car && finite(spray[car.id])) return clamp(spray[car.id], 0, 1);
  const h = lineWaterOf(frame);
  return h > 0 ? sprayLevelOf(h, Number.isFinite(year) ? year : undefined) : 0;
};

/**
 * The spray reaching the lens of an onboard from the car ahead: its level × how close it is, none past
 * rain.hookup.lens.sprayReachM (0..1).
 */
export const sprayAheadOf = (level, gapMetres, cfg = LOOK.rain.hookup.lens) => {
  if (!(level > 0) || !finite(gapMetres) || gapMetres < 0 || gapMetres >= cfg.sprayReachM) return 0;
  return clamp(level, 0, 1) * (1 - gapMetres / cfg.sprayReachM);
};

/** The colour of the rain haze (the wet air of the place: day or floodlit night), view-look.json rain.hookup.haze. */
export const rainHazeOf = (night = false, cfg = LOOK.rain.hookup.haze) => (night ? cfg.night : cfg.day);
