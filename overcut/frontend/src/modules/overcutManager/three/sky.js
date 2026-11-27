/**
 * Sky, sun and clouds of the live view (VIEW-06, LOOK-C1; RF-3D-04, RF-SIM-11, RNF-07, RNF-05).
 *
 *   sun       the real position of the sun at the circuit and the local hour of the session, with the
 *             NOAA Solar Calculator algorithm (Meeus, Astronomical Algorithms) and its refraction, as a
 *             direction in the scene (x east, y up, −z north, turned by the layout's north angle).
 *   clouds    the engine's seven weather states (race-weather.json states.list) → cloud fraction
 *             (WMO octa classes) → sun intensity (Meinel clear sky × Kasten–Czeplak cloud), shadow
 *             opacity and softness and more hemispheric light. Monotone in the cloud fraction.
 *   haze      FogExp2 density from the air's humidity (Koschmieder).
 *   dome      three's Preetham `Sky` with turbidity and Rayleigh moving with the clouds.
 *
 * Isolated module: Race3D.js does not use it until LOOK-C3. Pure functions of their inputs (no
 * clock, no Math.random): the view passes the race clock's hour, so a replay lights the same way.
 * Every tunable value is in data/balance/view-look.json (RNF-07); the astronomical constants of the
 * NOAA/Meeus series are physics, not balance, and stay here.
 */

import LOOK from "../data/balance/view-look.json";

export const VIEW_LOOK = LOOK;
const SKY = LOOK.sky;
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (v, m) => ((v % m) + m) % m;

// ------------------------------------------------------------------ time

/** "YYYY-MM-DD" (or a Date-free {y, m, d}) → [year, month, day]. */
const ymdOf = (date) => {
  if (date && typeof date === "object" && Number.isFinite(date.y)) return [date.y, date.m, date.d];
  const match = /^(-?\d{1,4})-(\d{1,2})-(\d{1,2})/.exec(String(date));
  if (!match) throw new Error(`sky: date "${date}" is not YYYY-MM-DD`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

/** Julian Day at 0h UT of a Gregorian date (Meeus ch. 7). */
export const julianDay = (date) => {
  let [y, m] = ymdOf(date);
  const d = ymdOf(date)[2];
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
};

/**
 * Hours from UTC at the circuit. The pack's own offset when given; otherwise the fallback of
 * view-look.json sky.timezone (`solarMean` = lon/15, minutes off the civil zone and an hour off in
 * summer time: pending until the pack carries the zone).
 */
export const tzHoursFor = (lon, tzHours) => {
  if (Number.isFinite(tzHours)) return tzHours;
  return SKY.timezone.fallback === "solarMean" && Number.isFinite(lon) ? lon / 15 : 0;
};

// ------------------------------------------------------------------ sun

/** NOAA's atmospheric refraction correction, degrees, for a true elevation in degrees. */
export const refractionDeg = (elevationDeg) => {
  const e = elevationDeg;
  if (e > 85) return 0;
  const t = Math.tan(e * RAD);
  let arcsec;
  if (e > 5) arcsec = 58.1 / t - 0.07 / t ** 3 + 0.000086 / t ** 5;
  else if (e > -0.575) arcsec = 1735 + e * (-518.2 + e * (103.4 + e * (-12.79 + e * 0.711)));
  else arcsec = -20.774 / t;
  return arcsec / 3600;
};

/**
 * Position of the sun (NOAA Solar Calculator; Meeus). `hour` is the local clock hour (decimal) of
 * `date` ("YYYY-MM-DD") at `lat`/`lon` (degrees, east positive), `tzHours` the zone (see tzHoursFor).
 * Returns elevation (apparent, with refraction when view-look.json sky.refraction) and azimuth
 * (degrees clockwise from north), declination and the equation of time in minutes.
 */
export const solarPosition = ({ lat, lon, date, hour, tzHours } = {}) => {
  if (![lat, lon, hour].every(Number.isFinite)) throw new Error("sky: solarPosition needs lat, lon and hour");
  const tz = tzHoursFor(lon, tzHours);
  const jd = julianDay(date) + (hour - tz) / 24;
  const T = (jd - 2451545) / 36525;
  const L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Mr = M * RAD;
  const C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mr) * 0.000289;
  const trueLong = L0 + C;
  const omega = (125.04 - 1934.136 * T) * RAD;
  const appLong = (trueLong - 0.00569 - 0.00478 * Math.sin(omega)) * RAD;
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = (eps0 + 0.00256 * Math.cos(omega)) * RAD;
  const decl = Math.asin(Math.sin(eps) * Math.sin(appLong));
  const y = Math.tan(eps / 2) ** 2;
  const L0r = L0 * RAD;
  const eqTime =
    4 *
    DEG *
    (y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r) - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
  const trueSolarMin = mod(hour * 60 + eqTime + 4 * lon - 60 * tz, 1440);
  const hourAngle = trueSolarMin / 4 < 0 ? trueSolarMin / 4 + 180 : trueSolarMin / 4 - 180;
  const latR = lat * RAD;
  const cosZen = clamp(Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(hourAngle * RAD), -1, 1);
  const zenith = Math.acos(cosZen);
  const trueElevation = 90 - zenith * DEG;
  const denom = Math.cos(latR) * Math.sin(zenith);
  let azimuth;
  if (Math.abs(denom) < 1e-9) azimuth = lat > 0 ? 180 : 0;
  else {
    const a = Math.acos(clamp((Math.sin(latR) * Math.cos(zenith) - Math.sin(decl)) / denom, -1, 1)) * DEG;
    azimuth = hourAngle > 0 ? mod(a + 180, 360) : mod(540 - a, 360);
  }
  const elevation = SKY.refraction ? trueElevation + refractionDeg(trueElevation) : trueElevation;
  return { elevationDeg: elevation, trueElevationDeg: trueElevation, azimuthDeg: azimuth, declinationDeg: decl * DEG, eqTimeMin: eqTime, tzHours: tz };
};

/** North angle of a layout in the scene's xz plane (view-look.json sky.northDegByLayout; pending → default). */
export const northDegFor = (layoutId) => {
  const table = SKY.northDegByLayout;
  const entry = layoutId ? table.layouts[layoutId] : null;
  return entry && Number.isFinite(entry.deg) ? entry.deg : table.default;
};

/**
 * Unit vector from the scene towards the sun. Scene axes: y up; with north angle 0, north is −z and
 * east +x; `northDeg` turns north clockwise seen from above. Also returns the angles.
 */
export const sunDirection = (lat, lon, date, hour, { tzHours, northDeg, layoutId } = {}) => {
  const p = solarPosition({ lat, lon, date, hour, tzHours });
  const n = (Number.isFinite(northDeg) ? northDeg : northDegFor(layoutId)) * RAD;
  const north = [Math.sin(n), 0, -Math.cos(n)];
  const east = [Math.cos(n), 0, Math.sin(n)];
  const el = p.elevationDeg * RAD;
  const az = p.azimuthDeg * RAD;
  const h = Math.cos(el);
  const x = h * (Math.sin(az) * east[0] + Math.cos(az) * north[0]);
  const z = h * (Math.sin(az) * east[2] + Math.cos(az) * north[2]);
  return { x, y: Math.sin(el), z, elevationDeg: p.elevationDeg, azimuthDeg: p.azimuthDeg, aboveHorizon: p.elevationDeg > SKY.sun.minElevationDeg };
};

// ------------------------------------------------------------------ clouds and light

const STATE_IDS = Object.keys(SKY.cloudByState.values);

/**
 * Cloud fraction 0..1 of a weather state: its id ("sunny"…"heavy"), its index 0..6 in
 * race-weather.json states.list, or a fractional index (a blend between two states, as the
 * engine's chain moves). Unknown → clear.
 */
export const cloudCoverOf = (state) => {
  const values = SKY.cloudByState.values;
  if (typeof state === "string") return values[state] ?? values.sunny;
  if (!Number.isFinite(state)) return values.sunny;
  const s = clamp(state, 0, STATE_IDS.length - 1);
  const i = Math.floor(s);
  const j = Math.min(STATE_IDS.length - 1, i + 1);
  return lerp(values[STATE_IDS[i]], values[STATE_IDS[j]], s - i);
};

/** Relative optical air mass (Kasten and Young 1989) at an apparent elevation in degrees. */
export const airMassOf = (elevationDeg) => {
  const e = Math.max(elevationDeg, -0.5);
  const z = 90 - e;
  return 1 / (Math.cos(z * RAD) + 0.50572 * (96.07995 - z) ** -1.6364);
};

/** Clear-sky direct irradiance relative to the sun at the zenith (Meinel and Meinel 1976). */
export const clearSkyDirectOf = (elevationDeg) => {
  if (elevationDeg <= SKY.sun.minElevationDeg) return 0;
  const { base, exponent } = SKY.sun.meinel;
  const at = (am) => base ** (am ** exponent);
  return at(airMassOf(elevationDeg)) / at(airMassOf(90));
};

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (rgb) => `#${rgb.map((c) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, "0")).join("")}`;
const mixHex = (a, b, t) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((c, k) => lerp(c, cb[k], clamp(t, 0, 1))));
};

/** Sun colour by elevation (view-look.json sky.sun.lowSun.stops). */
export const sunColourOf = (elevationDeg) => {
  const stops = SKY.sun.lowSun.stops;
  if (elevationDeg <= stops[0].elevationDeg) return stops[0].colour;
  for (let k = 1; k < stops.length; k += 1) {
    if (elevationDeg <= stops[k].elevationDeg) {
      const a = stops[k - 1];
      const b = stops[k];
      return mixHex(a.colour, b.colour, (elevationDeg - a.elevationDeg) / (b.elevationDeg - a.elevationDeg));
    }
  }
  return stops[stops.length - 1].colour;
};

/**
 * Lights for a sun elevation and a cloud fraction:
 *   sunIntensity    DirectionalLight intensity: intensityMax × Meinel clear sky × (1 − a·N^b)
 *   shadowOpacity   1 − N·opacityPerCloud (hard shadows in the sun, none under full cover)
 *   shadowRadius    PCF softness, radiusMin → radiusMax with the cover
 *   hemiIntensity   hemispheric (sky) light, more with clouds (the light comes from the whole dome)
 * All monotone in `cloud` (sky.test.js).
 */
export const lightingFor = ({ elevationDeg = 45, cloud = 0 } = {}) => {
  const N = clamp(cloud, 0, 1);
  const { intensityMax, cloudGlobal } = SKY.sun;
  const direct = clearSkyDirectOf(elevationDeg);
  const cloudFactor = 1 - cloudGlobal.a * N ** cloudGlobal.b;
  const sh = SKY.shadow;
  const up = direct > 0;
  return {
    sunIntensity: intensityMax * direct * cloudFactor,
    sunColour: sunColourOf(elevationDeg),
    castShadow: up,
    shadowOpacity: up ? clamp(1 - N * sh.opacityPerCloud, sh.minOpacity, 1) : 0,
    shadowRadius: lerp(sh.radiusMin, sh.radiusMax, N),
    hemiIntensity: SKY.hemi.intensity * (1 + SKY.hemi.cloudGain.value * N),
    hemiSkyColour: mixHex(SKY.hemi.sky, SKY.hemi.overcastSky.value, N),
    hemiGroundColour: SKY.hemi.ground,
  };
};

// ------------------------------------------------------------------ haze

/** Visibility in km for a relative humidity (view-look.json fog.visibilityKmByHumidity, pending). */
export const visibilityKmFor = (humidity) => {
  const table = LOOK.fog.visibilityKmByHumidity;
  if (!Number.isFinite(humidity) || humidity <= table[0].humidity) return table[0].km;
  for (let k = 1; k < table.length; k += 1) {
    if (humidity <= table[k].humidity) {
      const a = table[k - 1];
      const b = table[k];
      return lerp(a.km, b.km, (humidity - a.humidity) / (b.humidity - a.humidity));
    }
  }
  return table[table.length - 1].km;
};

/** FogExp2 density (1/m) for a humidity: Koschmieder 3.912 / visibility, clamped. */
export const fogDensityFor = (humidity) => {
  const { koschmieder, minDensity, maxDensity } = LOOK.fog;
  return clamp(koschmieder / (visibilityKmFor(humidity) * 1000), minDensity, maxDensity);
};

// ------------------------------------------------------------------ dome

/** Preetham parameters of the sky dome for a cloud fraction. */
export const domeParamsFor = (cloud) => {
  const { clear, overcast } = SKY.dome;
  const t = clamp(cloud, 0, 1);
  const out = {};
  Object.keys(clear).forEach((key) => {
    out[key] = lerp(clear[key], overcast[key], t);
  });
  return out;
};

/**
 * Everything the view needs for a moment of a session, in one pure call:
 * `{lat, lon, date, hour, tzHours?, northDeg?, layoutId?, state, humidity?}` →
 * `{sun, light, fogDensity, dome, cloud}`.
 */
export const lookAt = ({ lat, lon, date, hour, tzHours, northDeg, layoutId, state = 0, humidity } = {}) => {
  const sun = sunDirection(lat, lon, date, hour, { tzHours, northDeg, layoutId });
  const cloud = cloudCoverOf(state);
  return {
    sun,
    cloud,
    light: lightingFor({ elevationDeg: sun.elevationDeg, cloud }),
    fogDensity: fogDensityFor(humidity),
    dome: domeParamsFor(cloud),
  };
};

/**
 * A three `Sky` dome (Preetham) sized from view-look.json. `THREE`-free callers can skip it; the
 * module loads three/examples lazily so the pure functions above stay usable in the engine's tests.
 */
export const createSkyDome = async () => {
  const { Sky } = await import("three/examples/jsm/objects/Sky.js");
  const dome = new Sky();
  dome.scale.setScalar(SKY.dome.scale);
  return dome;
};

/** Point a dome at the sun and set its haze for a cloud fraction. */
export const applySkyDome = (dome, sun, cloud) => {
  const u = dome.material.uniforms;
  const p = domeParamsFor(cloud);
  u.turbidity.value = p.turbidity;
  u.rayleigh.value = p.rayleigh;
  u.mieCoefficient.value = p.mieCoefficient;
  u.mieDirectionalG.value = p.mieDirectionalG;
  u.sunPosition.value.set(sun.x, sun.y, sun.z);
  return dome;
};
