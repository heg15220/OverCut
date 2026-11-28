/**
 * LOOK-C3 (F1M24-CHINA §3.3; VIEW-06 en directo; RF-3D-04, RF-SIM-11, RNF-05, RNF-07):
 *   - lugar, fecha, salida y huso de cada GP desde data/circuits/sites.json (f1db) para todas las carreras
 *     de los packs de temporada;
 *   - sol en directo ±2° de la NOAA en Shanghái el 21/04/2024 (43° a las 15:00 y 23° a las 16:35, F1M24-CHINA
 *     §2.8), con la hora = salida local + reloj de carrera;
 *   - nublado frente a soleado: la luminancia de la imagen (iluminación → ACES → sRGB → grading, con la
 *     autoexposición asentada) se desvía ≥ 15 % y el p2 queda en 0,05–0,12 (aceptación de VIEW-06);
 *   - el norte de las splines calibradas sale del trazado real (sin norte, el default).
 */

import LOOK from "../data/balance/view-look.json";
import SITES from "../data/circuits/sites.json";
import { circuitIdFor, hourOf, lookAt, lookContextFor, lookIsStale, northDegFor, siteFor, hazeColourFor } from "./sky";
import { gradeColour, gradeFor } from "./post/grade";
import { createExposure, exposureMultiplier, sceneLuminanceFrom, stepExposure } from "./post/exposure";

const RAD = Math.PI / 180;

// three's ACESFilmicToneMapping (r170 tonemapping_pars_fragment) and the sRGB output encoding.
const acesToneMap = (rgb, exposure) => {
  let c = rgb.map((v) => (v * exposure) / 0.6);
  const inM = [[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]];
  const outM = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
  const mul = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
  c = mul(inM, c);
  c = c.map((v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081));
  c = mul(outM, c);
  return c.map((v) => Math.min(1, Math.max(0, v)));
};
const srgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const hexRgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
const luma = (rgb) => LOOK.grade.lumaWeights.reduce((sum, w, k) => sum + w * rgb[k], 0);

/**
 * A frame of the circuit under a look: Lambertian surfaces of several albedos (tarmac, grass, kerbs,
 * a white board, black tyres) lit by the sun (three: albedo/π × intensity × cos) and the sky light, a
 * share of each in the shadow of the cars; tone mapped, encoded and graded as the post chain does.
 */
const frameOf = (look, exposure) => {
  const sunRgb = hexRgb(look.light.sunColour).map((c) => c * look.light.sunIntensity);
  const skyRgb = hexRgb(look.light.hemiSkyColour).map((c) => c * look.light.hemiIntensity);
  const cosSun = Math.max(0, Math.sin(look.sun.elevationDeg * RAD));
  const surfaces = [
    { albedo: 0.09, share: 0.45 }, // tarmac
    { albedo: 0.2, share: 0.25 }, // grass
    { albedo: 0.6, share: 0.1 }, // kerbs and lines
    { albedo: 0.85, share: 0.05 }, // boards
    { albedo: 0.02, share: 0.15 }, // tyres, gaps, shade under the cars
  ];
  const pixels = [];
  surfaces.forEach(({ albedo, share }) => {
    const n = Math.round(share * 200);
    for (let i = 0; i < n; i += 1) {
      const shaded = i % 5 === 0; // one in five in a shadow
      const sunPart = shaded ? 1 - look.light.shadowOpacity : 1;
      const rgb = [0, 1, 2].map((k) => (albedo / Math.PI) * (sunRgb[k] * cosSun * sunPart + skyRgb[k]));
      const toned = acesToneMap(rgb, exposure).map(srgb);
      pixels.push(gradeColour(toned, gradeFor(look.cloud)));
    }
  });
  return pixels;
};

/** The frame after the auto exposure has settled on it (the view's loop: meter → step → draw). */
const settledFrame = (look) => {
  let state = createExposure();
  for (let i = 0; i < 400; i += 1) {
    const ungraded = frameOf(look, exposureMultiplier(state));
    const mean = ungraded.reduce((sum, rgb) => sum + luma(rgb), 0) / ungraded.length;
    state = stepExposure(state, sceneLuminanceFrom(mean, state), 0.1);
  }
  return frameOf(look, exposureMultiplier(state)).map(luma);
};

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
};

describe("lugares y horas de los GP (sites.json, f1db)", () => {
  it("tiene lugar y huso para cada circuito y fecha para cada GP de los packs", () => {
    // eslint-disable-next-line global-require
    const fs = require("fs");
    // eslint-disable-next-line global-require
    const path = require("path");
    const dir = path.join(__dirname, "../data/seasons");
    const years = fs.readdirSync(dir).filter((name) => /^\d{4}\.json$/.test(name));
    expect(years.length).toBeGreaterThanOrEqual(38);
    years.forEach((file) => {
      const pack = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      pack.calendar.forEach((race) => {
        const site = siteFor({ circuitId: race.circuitId, year: pack.year, date: race.date });
        expect(site).not.toBeNull();
        expect(site.date).toBe(race.date);
        expect(Number.isFinite(site.lat) && Number.isFinite(site.lon)).toBe(true);
        expect(site.tz).toEqual(expect.any(String));
      });
    });
    Object.values(SITES.circuits).forEach((place) => {
      expect(Math.abs(place.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(place.lon)).toBeLessThanOrEqual(180);
    });
  });

  it("la salida de 2024 es la oficial de f1db y el huso el del día (horario de verano incluido)", () => {
    const china = siteFor({ ref: "shanghai", year: 2024 });
    expect(china).toMatchObject({ circuitId: "shanghai", date: "2024-04-21", startLocal: "15:00", startSource: "f1db", tzHours: 8 });
    const silverstone = siteFor({ ref: "silverstone", year: 2024 });
    expect(silverstone.tzHours).toBe(1);
    const montreal = siteFor({ ref: "villeneuve", year: 2024 });
    expect(montreal.circuitId).toBe("montreal");
    expect(montreal.tzHours).toBe(-4);
  });

  it("traduce las referencias del motor a los ids de f1db", () => {
    expect(circuitIdFor("albert_park")).toBe("melbourne");
    expect(circuitIdFor("spa")).toBe("spa-francorchamps");
    expect(circuitIdFor("magny_cours")).toBe("magny-cours");
    expect(circuitIdFor("sochi")).toBe("sirius");
    expect(hourOf("15:30")).toBe(15.5);
    expect(hourOf("x")).toBeNull();
  });
});

describe("sol en directo (VIEW-06)", () => {
  const circuit = { ref: "shanghai", splineId: "shanghai-1" };

  it("la hora es la salida local más el reloj de carrera y el sol queda a ±2° de la NOAA", () => {
    const start = lookContextFor({ circuit, year: 2024, tau: 0 });
    expect(start).toMatchObject({ date: "2024-04-21", hour: 15, tzHours: 8, layoutId: "shanghai-1", state: LOOK.sky.session.dryState });
    expect(lookAt(start).sun.elevationDeg).toBeGreaterThan(43 - 2);
    expect(lookAt(start).sun.elevationDeg).toBeLessThan(43 + 2);
    const late = lookContextFor({ circuit, year: 2024, tau: 95 * 60 });
    expect(late.hour).toBeCloseTo(16 + 35 / 60, 6);
    expect(lookAt(late).sun.elevationDeg).toBeGreaterThan(23 - 2);
    expect(lookAt(late).sun.elevationDeg).toBeLessThan(23 + 2);
  });

  it("la sesión que pasa la vista manda sobre la carrera de sites.json", () => {
    const quali = lookContextFor({ circuit, year: 2024, tau: 600, session: { date: "2024-04-20", startLocal: "15:00" } });
    expect(quali.date).toBe("2024-04-20");
    expect(quali.hour).toBeCloseTo(15 + 600 / 3600, 6);
  });

  it("sin lugar o sin GP ese año devuelve null (la vista conserva su luz fija)", () => {
    expect(lookContextFor({ circuit: { ref: "pescara" }, year: 1957, tau: 0 })).toBeNull();
    expect(lookContextFor({ circuit: { ref: "shanghai" }, year: 1990, tau: 0 })).toBeNull();
    expect(lookContextFor({ circuit: null, year: 2024 })).toBeNull();
  });

  it("las nubes salen de la instantánea del motor y, sin ella, del mojado", () => {
    expect(lookContextFor({ circuit, year: 2024, weather: { state: 2 } }).state).toBe(2);
    expect(lookContextFor({ circuit, year: 2024, wet: true }).state).toBe(LOOK.sky.session.wetState);
    expect(lookAt(lookContextFor({ circuit, year: 2024, weather: { state: 2 } })).cloud).toBe(1);
  });

  it("se recalcula cada updateSec de reloj de carrera o al cambiar el cielo", () => {
    const a = lookContextFor({ circuit, year: 2024, tau: 0 });
    expect(lookIsStale(null, a)).toBe(true);
    expect(lookIsStale(a, lookContextFor({ circuit, year: 2024, tau: LOOK.sky.session.updateSec / 2 }))).toBe(false);
    expect(lookIsStale(a, lookContextFor({ circuit, year: 2024, tau: LOOK.sky.session.updateSec }))).toBe(true);
    expect(lookIsStale(a, lookContextFor({ circuit, year: 2024, tau: 0, weather: { state: 1 } }))).toBe(true);
  });

  it("es determinista: el mismo reloj da la misma luz", () => {
    const ctx = lookContextFor({ circuit, year: 2013, tau: 1234.5, weather: { state: 1 } });
    expect(lookAt(ctx)).toEqual(lookAt({ ...ctx }));
  });

  it("nublado frente a soleado: luminancia ≥ 15 % distinta y negros en p2 0,05–0,12", () => {
    const base = lookContextFor({ circuit, year: 2024, tau: 0 });
    const sunny = settledFrame(lookAt({ ...base, state: "sunny" }));
    const overcast = settledFrame(lookAt({ ...base, state: "overcast" }));
    const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
    const deviation = Math.abs(mean(sunny) - mean(overcast)) / mean(sunny);
    expect(deviation).toBeGreaterThanOrEqual(0.15);
    [sunny, overcast].forEach((frame) => {
      const p2 = percentile(frame, 0.02);
      expect(p2).toBeGreaterThanOrEqual(0.05);
      expect(p2).toBeLessThanOrEqual(0.12);
    });
  });

  it("la calima se va al gris cubierto con las nubes", () => {
    expect(hazeColourFor("#cdd9e2", 0)).toBe("#cdd9e2");
    expect(hazeColourFor("#cdd9e2", 1)).not.toBe("#cdd9e2");
  });

  it("el norte de las splines calibradas viene del trazado real; sin él, el default", () => {
    expect(northDegFor("bahrain-1")).toBeCloseTo(-179.8, 1);
    expect(northDegFor("silverstone-7")).toBe(LOOK.sky.northDegByLayout.default);
    expect(northDegFor(null)).toBe(LOOK.sky.northDegByLayout.default);
  });
});
