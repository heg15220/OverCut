/**
 * LOOK-C1 (F1M24-CHINA §3.3, VIEW-06 módulos; RF-3D-04, RF-SIM-11, RNF-05, RNF-07):
 *   - view-look.json pasa su esquema completo (contrato de la ola 1, §3.2);
 *   - el sol queda a ±2° del NOAA (Shanghái 21/04/2024: 43° a las 15:00 y 23° a las 16:35, F1M24-CHINA §2.8) y de una
 *     segunda referencia independiente (USNO, «Approximate Solar Coordinates») en circuitos de los dos hemisferios;
 *   - la sombra es monótona con la nubosidad (opacidad, dureza, sol y luz del cielo);
 *   - todo es determinista (sin Math.random ni reloj).
 */

import Ajv from "ajv";
import LOOK from "../data/balance/view-look.json";
import schema from "../engine/packs/schema/view-look.schema.json";
import WEATHER from "../data/balance/race-weather.json";
import {
  solarPosition,
  sunDirection,
  julianDay,
  cloudCoverOf,
  lightingFor,
  clearSkyDirectOf,
  airMassOf,
  fogDensityFor,
  domeParamsFor,
  lookAt,
  northDegFor,
  tzHoursFor,
  sunColourOf,
  createSkyDome,
  applySkyDome,
} from "./sky";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const mod = (v, m) => ((v % m) + m) % m;
const angleDiff = (a, b) => Math.abs(mod(a - b + 180, 360) - 180);

/** USNO approximate solar coordinates (aa.usno.navy.mil/faq/sun_approx), independent of sky.js. */
const usno = ({ lat, lon, date, hour, tzHours }) => {
  const [y, m, d] = date.split("-").map(Number);
  const jd = Date.UTC(y, m - 1, d) / 86400000 + 2440587.5 + (hour - tzHours) / 24;
  const D = jd - 2451545;
  const g = (357.529 + 0.98560028 * D) * RAD;
  const q = 280.459 + 0.98564736 * D;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * D) * RAD;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = mod(18.697374558 + 24.06570982441908 * D, 24);
  const ha = (gmst + lon / 15) * 15 * RAD - ra;
  const latR = lat * RAD;
  const el = Math.asin(Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(latR) - Math.sin(latR) * Math.cos(ha));
  return { elevationDeg: el * DEG, azimuthDeg: mod(az * DEG, 360) };
};

// Coordinates from f1db (circuit.latitude/longitude), civil zone of the race day.
const SITES = {
  shanghai: { lat: 31.3389, lon: 121.2197, tzHours: 8, date: "2024-04-21" },
  silverstone: { lat: 52.0786, lon: -1.0169, tzHours: 1, date: "2024-07-07" },
  interlagos: { lat: -23.7036, lon: -46.6997, tzHours: -3, date: "2024-11-03" },
  monaco: { lat: 43.7347, lon: 7.4206, tzHours: 2, date: "2024-05-26" },
  suzuka: { lat: 34.8431, lon: 136.5407, tzHours: 9, date: "2024-04-07" },
  albert_park: { lat: -37.8497, lon: 144.968, tzHours: 11, date: "2024-03-24" },
  nurburgring1976: { lat: 50.3356, lon: 6.9475, tzHours: 1, date: "1976-08-01" },
};

describe("view-look.json (contrato de la ola 1)", () => {
  it("pasa su esquema completo con todos los bloques", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const ok = ajv.validate(schema, LOOK);
    expect(ajv.errors).toBeNull();
    expect(ok).toBe(true);
    ["sky", "grade", "exposure", "fog", "wet", "rain", "fx", "blur", "quality"].forEach((block) => expect(LOOK[block]).toBeDefined());
  });

  it("tiene una nubosidad para cada estado del motor (race-weather.json states.list)", () => {
    WEATHER.states.list.forEach((state) => expect(LOOK.sky.cloudByState.values[state.id]).toBeDefined());
    expect(Object.keys(LOOK.sky.cloudByState.values)).toEqual(WEATHER.states.list.map((s) => s.id));
  });

  it("marca pending lo que no tiene fuente y no pinta chispas en 2013", () => {
    ["wet", "rain", "fx", "fog"].forEach((block) => expect(LOOK[block].status).toBe("pending"));
    const sparks2013 = LOOK.fx.sparks.eras.find((e) => e.from <= 2013 && e.to >= 2013);
    expect(sparks2013.value).toBe(false);
    const sparks2016 = LOOK.fx.sparks.eras.find((e) => e.from <= 2016 && e.to >= 2016);
    expect(sparks2016.value).toBe(true);
  });
});

describe("posición del sol (NOAA)", () => {
  it("Julian Day de referencia (Meeus: 2000-01-01 = 2451544,5)", () => {
    expect(julianDay("2000-01-01")).toBe(2451544.5);
    expect(julianDay("1987-04-10")).toBe(2446895.5);
  });

  it("Shanghái 21/04/2024: 43° a las 15:00 y 23° a las 16:35 (±2°, F1M24-CHINA §2.8)", () => {
    const s = SITES.shanghai;
    expect(Math.abs(solarPosition({ ...s, hour: 15 }).elevationDeg - 43)).toBeLessThanOrEqual(2);
    expect(Math.abs(solarPosition({ ...s, hour: 16 + 35 / 60 }).elevationDeg - 23)).toBeLessThanOrEqual(2);
  });

  it("coincide con la referencia USNO a ±2° en altura y azimut en los dos hemisferios", () => {
    Object.values(SITES).forEach((site) => {
      [9, 12, 13.5, 15, 16.5, 18].forEach((hour) => {
        const ours = solarPosition({ ...site, hour });
        const ref = usno({ ...site, hour });
        expect(Math.abs(ours.trueElevationDeg - ref.elevationDeg)).toBeLessThanOrEqual(2);
        const azimuthChecked = ref.elevationDeg > 2 && ref.elevationDeg < 85;
        expect(azimuthChecked ? angleDiff(ours.azimuthDeg, ref.azimuthDeg) : 0).toBeLessThanOrEqual(2);
      });
    });
  });

  it("al mediodía solar la altura es 90 − |lat − declinación|", () => {
    const s = SITES.silverstone;
    const probe = solarPosition({ ...s, hour: 12 });
    const noon = 12 - probe.eqTimeMin / 60 - s.lon / 15 + s.tzHours;
    const p = solarPosition({ ...s, hour: noon });
    expect(Math.abs(p.trueElevationDeg - (90 - Math.abs(s.lat - p.declinationDeg)))).toBeLessThan(0.05);
    expect(angleDiff(p.azimuthDeg, 180)).toBeLessThan(0.5);
  });

  it("la refracción solo levanta el sol, y mucho más cerca del horizonte", () => {
    const s = SITES.shanghai;
    const high = solarPosition({ ...s, hour: 12 });
    const low = solarPosition({ ...s, hour: 18.3 });
    expect(high.elevationDeg - high.trueElevationDeg).toBeGreaterThanOrEqual(0);
    expect(low.elevationDeg - low.trueElevationDeg).toBeGreaterThan(high.elevationDeg - high.trueElevationDeg);
  });

  it("sin huso en el pack usa la hora solar media lon/15", () => {
    expect(tzHoursFor(121.2197)).toBeCloseTo(8.081, 3);
    expect(tzHoursFor(121.2197, 8)).toBe(8);
    const a = solarPosition({ lat: 31.3389, lon: 121.2197, date: "2024-04-21", hour: 15 });
    const b = solarPosition({ lat: 31.3389, lon: 121.2197, date: "2024-04-21", hour: 15, tzHours: 8 });
    expect(Math.abs(a.elevationDeg - b.elevationDeg)).toBeLessThan(1.5);
  });

  it("es determinista: mismas entradas, misma salida, sin Math.random", () => {
    const spy = jest.spyOn(Math, "random");
    const a = lookAt({ ...SITES.monaco, hour: 15, state: 2, humidity: 60 });
    const b = lookAt({ ...SITES.monaco, hour: 15, state: 2, humidity: 60 });
    expect(a).toEqual(b);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("dirección del sol en la escena", () => {
  it("es unitaria y, con el norte a −z, al mediodía del hemisferio norte apunta al sur (+z)", () => {
    const d = sunDirection(SITES.silverstone.lat, SITES.silverstone.lon, SITES.silverstone.date, 13.1, { tzHours: 1 });
    expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 9);
    expect(d.z).toBeGreaterThan(0.3);
    expect(Math.abs(d.x)).toBeLessThan(0.1);
    expect(d.aboveHorizon).toBe(true);
  });

  it("en el hemisferio sur al mediodía apunta al norte (−z)", () => {
    const d = sunDirection(SITES.interlagos.lat, SITES.interlagos.lon, "2024-06-21", 12.1, { tzHours: -3 });
    expect(d.z).toBeLessThan(-0.3);
  });

  it("gira con el norte del trazado sin cambiar la altura", () => {
    const s = SITES.shanghai;
    const a = sunDirection(s.lat, s.lon, s.date, 15, { tzHours: 8, northDeg: 0 });
    const b = sunDirection(s.lat, s.lon, s.date, 15, { tzHours: 8, northDeg: 90 });
    expect(b.y).toBeCloseTo(a.y, 12);
    // Turning the scene's north 90° clockwise maps (x, z) to (−z, x).
    expect(b.x).toBeCloseTo(-a.z, 9);
    expect(b.z).toBeCloseTo(a.x, 9);
  });

  it("de noche queda bajo el horizonte y la luz del sol se apaga", () => {
    const d = sunDirection(SITES.shanghai.lat, SITES.shanghai.lon, SITES.shanghai.date, 22, { tzHours: 8 });
    expect(d.aboveHorizon).toBe(false);
    const light = lightingFor({ elevationDeg: d.elevationDeg, cloud: 0 });
    expect(light.sunIntensity).toBe(0);
    expect(light.castShadow).toBe(false);
  });

  it("los trazados sin orientación medida usan el norte por defecto (pending)", () => {
    expect(northDegFor("silverstone-7")).toBe(LOOK.sky.northDegByLayout.default);
    expect(northDegFor(undefined)).toBe(LOOK.sky.northDegByLayout.default);
  });
});

describe("nubes, luz y sombra", () => {
  it("la nubosidad crece con el estado del motor, también entre dos estados", () => {
    let last = -1;
    for (let s = 0; s <= 6; s += 0.25) {
      const c = cloudCoverOf(s);
      expect(c).toBeGreaterThanOrEqual(last);
      last = c;
    }
    expect(cloudCoverOf("sunny")).toBeLessThan(cloudCoverOf("cloudy"));
    expect(cloudCoverOf("heavy")).toBe(1);
    expect(cloudCoverOf(undefined)).toBe(cloudCoverOf("sunny"));
  });

  it("sombra monótona con la nubosidad a cualquier altura del sol", () => {
    [5, 15, 23, 43, 70].forEach((elevationDeg) => {
      let prev = null;
      for (let cloud = 0; cloud <= 1.0001; cloud += 0.05) {
        const l = lightingFor({ elevationDeg, cloud });
        const p = prev || l;
        expect(l.shadowOpacity).toBeLessThanOrEqual(p.shadowOpacity + 1e-12);
        expect(l.shadowRadius).toBeGreaterThanOrEqual(p.shadowRadius - 1e-12);
        expect(l.sunIntensity).toBeLessThanOrEqual(p.sunIntensity + 1e-12);
        expect(l.hemiIntensity).toBeGreaterThanOrEqual(p.hemiIntensity - 1e-12);
        prev = l;
      }
    });
    expect(lightingFor({ elevationDeg: 43, cloud: 0 }).shadowOpacity).toBe(1);
    expect(lightingFor({ elevationDeg: 43, cloud: 1 }).shadowOpacity).toBe(LOOK.sky.shadow.minOpacity);
  });

  it("con cielo despejado el sol es el de Race3D a gran altura y baja hacia el horizonte (Meinel)", () => {
    expect(airMassOf(90)).toBeCloseTo(1, 3);
    expect(airMassOf(0)).toBeGreaterThan(30);
    expect(clearSkyDirectOf(90)).toBeCloseTo(1, 9);
    let last = 0;
    [1, 5, 10, 23, 43, 60, 90].forEach((e) => {
      const v = clearSkyDirectOf(e);
      expect(v).toBeGreaterThan(last);
      last = v;
    });
    expect(lightingFor({ elevationDeg: 90, cloud: 0 }).sunIntensity).toBeCloseTo(LOOK.sky.sun.intensityMax, 9);
  });

  it("nublado frente a soleado: la luminancia entre luz y sombra se separa ≥ 15 % (proxy Lambert de VIEW-06)", () => {
    // Ground lit by the sun at 43° and the same ground in shadow; the image's deviation is the spread between them.
    const spread = (state) => {
      const l = lightingFor({ elevationDeg: 43, cloud: cloudCoverOf(state) });
      const direct = l.sunIntensity * Math.sin(43 * RAD);
      const lit = direct + l.hemiIntensity;
      const shade = direct * (1 - l.shadowOpacity) + l.hemiIntensity;
      const mean = (lit + shade) / 2;
      return Math.abs(lit - shade) / 2 / mean;
    };
    const sunny = spread("sunny");
    const overcast = spread("overcast");
    expect((sunny - overcast) / sunny).toBeGreaterThanOrEqual(0.15);
  });

  it("el sol se calienta cerca del horizonte", () => {
    const warmth = (hex) => parseInt(hex.slice(1, 3), 16) - parseInt(hex.slice(5, 7), 16);
    expect(warmth(sunColourOf(2))).toBeGreaterThan(warmth(sunColourOf(45)));
  });

  it("la calima sube con la humedad y el cielo se vuelve lechoso con las nubes", () => {
    let last = 0;
    [10, 30, 50, 64, 80, 95, 100].forEach((h) => {
      const d = fogDensityFor(h);
      expect(d).toBeGreaterThanOrEqual(last);
      last = d;
    });
    expect(domeParamsFor(1).turbidity).toBeGreaterThan(domeParamsFor(0).turbidity);
    expect(domeParamsFor(1).rayleigh).toBeLessThan(domeParamsFor(0).rayleigh);
  });

  it("el domo Sky de three acepta el sol y las nubes", async () => {
    const dome = await createSkyDome();
    const sun = sunDirection(SITES.shanghai.lat, SITES.shanghai.lon, SITES.shanghai.date, 15, { tzHours: 8 });
    applySkyDome(dome, sun, 0.69);
    expect(dome.material.uniforms.sunPosition.value.y).toBeCloseTo(sun.y, 9);
    expect(dome.material.uniforms.turbidity.value).toBeCloseTo(domeParamsFor(0.69).turbidity, 9);
    dome.geometry.dispose();
    dome.material.dispose();
  });
});
