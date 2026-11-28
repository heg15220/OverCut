/**
 * The sun over the track, for the engine (WX-C3 / GS-14, F1M24-CHINA §2.10; RF-SIM-11, RNF-07).
 *
 *   elevation  NOAA Solar Calculator (NOAA Global Monitoring Laboratory, gml.noaa.gov/grad/solcalc;
 *              Meeus, Astronomical Algorithms, 1991): the true elevation of the sun at a circuit's
 *              latitude and longitude for a local clock hour and its civil UTC offset. The same
 *              series as three/sky.js (the view's sun), written again here because the engine never
 *              imports from three/ (SRS §4: the motor does not know three.js); no refraction: the
 *              heating of the asphalt follows the true sun.
 *   clear sky  Haurwitz (1945) global horizontal irradiance, 1.098 sin(e) exp(-0.057 / sin e) kW/m².
 *   sites      data/weather/sun-sites.json: latitude, longitude (f1db) and the civil UTC offset by race
 *              month of every circuit of climate.json (track_temp_from_openf1.py, Open-Meteo zones).
 *
 * The astronomical constants are physics, not balance; what the engine fits on them (the track's
 * excess over the air) is in race-weather.json temperature.sun. Pure functions: no clock, no stream.
 */

import SITES from "../../data/weather/sun-sites.json";

export const SUN_SITES = SITES;
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const mod = (v, m) => ((v % m) + m) % m;

/** "YYYY-MM-DD" → [year, month, day], or null. */
const ymdOf = (date) => {
  const match = /^(-?\d{1,4})-(\d{1,2})-(\d{1,2})/.exec(String(date || ""));
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
};

/** Julian Day at 0h UT of a Gregorian date (Meeus ch. 7). */
export const julianDay = (y0, m0, d) => {
  let y = y0;
  let m = m0;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
};

/**
 * True solar elevation (degrees) at `lat`/`lon` (east positive) on `date` ("YYYY-MM-DD", local)
 * at the local clock `hour` (decimal; may run past 24 or below 0) with the civil `utcOffsetH`.
 * null without a valid date or coordinates.
 */
export const solarElevationDeg = ({ lat, lon, date, hour, utcOffsetH = 0 }) => {
  const ymd = ymdOf(date);
  if (!ymd || ![lat, lon, hour].every(Number.isFinite)) return null;
  const utcHours = hour - (Number.isFinite(utcOffsetH) ? utcOffsetH : 0);
  const jd = julianDay(...ymd) + utcHours / 24;
  const T = (jd - 2451545) / 36525;
  const L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Mr = M * RAD;
  const C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mr) * 0.000289;
  const omega = (125.04 - 1934.136 * T) * RAD;
  const appLong = (L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) * RAD;
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = (eps0 + 0.00256 * Math.cos(omega)) * RAD;
  const decl = Math.asin(Math.sin(eps) * Math.sin(appLong));
  const y = Math.tan(eps / 2) ** 2;
  const L0r = L0 * RAD;
  const eqTime = 4 * DEG * (y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r) - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
  // Minutes of true solar time from the UTC instant (the day's Julian Day already carries the date).
  const trueSolar = mod(mod(utcHours, 24) * 60 + eqTime + 4 * lon, 1440);
  const hourAngle = trueSolar / 4 < 0 ? trueSolar / 4 + 180 : trueSolar / 4 - 180;
  const latR = lat * RAD;
  const cosZen = Math.min(1, Math.max(-1, Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(hourAngle * RAD)));
  return 90 - Math.acos(cosZen) * DEG;
};

/** Haurwitz (1945) clear-sky global horizontal irradiance (kW/m²) at a true elevation; 0 below the horizon. */
export const clearSkyKw = (elevationDeg) => {
  if (!(elevationDeg > 0)) return 0;
  const s = Math.sin(elevationDeg * RAD);
  return 1.098 * s * Math.exp(-0.057 / s);
};

/**
 * The site of a climate key ("<circuit>/<month>[d]", engine/weather climateFor): coordinates and the
 * civil offset of that month. null for the pooled climate or a circuit without a site.
 */
export const siteOf = (climateKey) => {
  if (typeof climateKey !== "string" || !climateKey.includes("/")) return null;
  const [id, month] = climateKey.split("/");
  const site = SITES.sites[id];
  if (!site) return null;
  const offsets = site.utcOffsetH || {};
  const utcOffsetH = offsets[month] ?? offsets[String(parseInt(month, 10))] ?? Object.values(offsets)[0] ?? site.lon / 15;
  return { id, lat: site.lat, lon: site.lon, utcOffsetH };
};
