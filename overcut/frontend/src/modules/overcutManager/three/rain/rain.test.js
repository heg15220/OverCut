/**
 * LOOK-C2 (F1M24-CHINA §3.3; GS-10 y VIEW-07 módulos; RF-SIM-11, RF-3D-04, RNF-02, RNF-05, RNF-07):
 *   - correspondencia motor → vista (GS-10): la vista solo lee snapshot.weather y snapshot.spray[i]; seco sin agua,
 *     más oscuro con más agua, la trazada nunca más mojada que fuera, franja seca que se ensancha al secarse;
 *   - contraste trazada/fuera ≥ 8 % con Δh ≥ 0,2 mm (parte unitaria de la aceptación de GS-10);
 *   - especular +10 % en mojado, contraste a 200 m −25 % con lluvia fuerte (VIEW-07);
 *   - spray 0 con 0 mm, monótono con el agua y la velocidad, nada en calidad baja; mismas partículas con la
 *     misma semilla (RNF-05); lo mismo para gotas de lente (solo onboards) y rayas;
 *   - ningún Math.random ni reloj de pared en three/rain (F1M24-CHINA §1.4 regla 7).
 */

import fs from "fs";
import path from "path";
import * as THREE from "three";
import Ajv from "ajv";
import LOOK from "../../data/balance/view-look.json";
import schema from "../../engine/packs/schema/view-look.schema.json";
import WEATHER from "../../data/balance/race-weather.json";
import { STATES, sprayLevelOf, weatherSnapshot, weatherTimeline } from "../../engine/weather";
import { fogDensityFor } from "../sky";
import {
  ENGINE_LINE,
  dampOf,
  enableWetSurface,
  fillRacingLine,
  filmOf,
  patchWetShader,
  puddleField,
  sectorBlend,
  specularPeakOf,
  surfaceAt,
  wetAttributes,
  wetLookFor,
  wetUniformValues,
} from "./wetSurface";
import { createSprayLayer, sprayBudget, sprayIntensityOf, sprayParticles, spraySeedOf, trailOf } from "./spray";
import { applyLens, lensActiveFor, lensDrops, lensOffsetAt, LensDropShader } from "./lens";
import { rainExtinctionOf, rainFogDensity, renderedContrastAt, streakCountFor, streakPositions } from "./fog";
import { rainViewFor, seedFor } from "./index";

/** The SIM-C1 shape of snapshot.weather (engine/sim/stepRace.js weatherOf) from engine/weather weatherSnapshot. */
const simWeatherOf = (timeline, lap) => {
  const w = weatherSnapshot({ weather: timeline }, lap);
  return { state: w.state, rainRate: w.rainMmPerHour, waterMm: { line: w.waterMm, off: w.offLineMm, sectors: w.sectorsMm } };
};
const weatherOfMm = (line, off = line, sectors = null) => ({ state: "light", rainRate: 1.5, waterMm: { line, off, sectors: sectors || [line, line, line] } });
const ON_LINE = () => ({ lat: 0, lineLat: 0, sector: 1, low: 0 });
const OFF_LINE = (look) => ({ lat: look.outerHalf + 0.5, lineLat: 0, sector: 1, low: 0 });
const STEPS = (from, to, step) => {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
};
const HEAVY = WEATHER.states.list.findIndex((s) => s.id === "heavy");

describe("view-look.json wet y rain (LOOK-C2)", () => {
  it("pasa el esquema con los bloques rellenos", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    expect(ajv.validate(schema, LOOK)).toBe(true);
    expect(ajv.errors).toBeNull();
  });

  it("la franja seca es la trazada del motor (race-weather.json offLine), una sola fuente", () => {
    expect(LOOK.wet.lineDryWidthM).toBe(2 * ENGINE_LINE.halfWidthM);
    expect(LOOK.wet.lineWidenToM).toBe(2 * ENGINE_LINE.fullAtM);
    expect(LOOK.wet.sectors).toBe(WEATHER.sectors.count);
  });

  it("los valores de seco son los que ya usaba trackScene.js setWet (current)", () => {
    expect(LOOK.wet.roughnessDry).toBe(0.82);
    expect(LOOK.wet.roughnessWet).toBe(0.18);
    expect(LOOK.wet.metalnessDry).toBe(0.05);
    expect(LOOK.wet.metalnessWet).toBe(0.35);
  });
});

describe("asfalto mojado continuo (GS-10)", () => {
  it("sin snapshot.weather, o con 0 mm, el asfalto es el seco", () => {
    [null, undefined, {}, { waterMm: null }, weatherOfMm(0, 0)].forEach((weather) => {
      const look = wetLookFor(weather);
      expect(look.wet).toBe(false);
      const s = surfaceAt(ON_LINE(look), look);
      expect(s).toMatchObject({ albedo: 1, roughness: LOOK.wet.roughnessDry, metalness: LOOK.wet.metalnessDry });
      expect(wetUniformValues(look).ocWetOn).toBe(0);
    });
  });

  it("correspondencia con el motor: cada vuelta de una carrera con lluvia fuerte sigue al agua de engine/weather", () => {
    const timeline = weatherTimeline({ race: { ref: "shanghai", date: "2024-04-21", laps: 56, baseLap: 98, lengthKm: 5.451 }, laps: 56, seed: "look-c2", startState: HEAVY });
    let wetLaps = 0;
    for (let lap = 0; lap <= 56; lap += 1) {
      const weather = simWeatherOf(timeline, lap);
      const look = wetLookFor(weather);
      expect(look.lineMm).toBeCloseTo(weather.waterMm.line, 6);
      expect(look.offMm).toBeGreaterThanOrEqual(look.lineMm);
      expect(look.wet).toBe(weather.waterMm.off > 0);
      const line = surfaceAt(ON_LINE(look), look);
      const off = surfaceAt(OFF_LINE(look), look);
      // The line is never wetter than the rest: lighter (or equal) and at least as rough.
      expect(line.albedo).toBeGreaterThanOrEqual(off.albedo - 1e-12);
      expect(line.roughness).toBeGreaterThanOrEqual(off.roughness - 1e-12);
      if (look.wet) wetLaps += 1;
    }
    expect(wetLaps).toBeGreaterThan(0);
  });

  it("monótono: más agua, más oscuro, más liso y más metálico", () => {
    let previous = null;
    STEPS(0, 3, 0.05).forEach((h) => {
      const look = wetLookFor(weatherOfMm(h));
      const s = surfaceAt(ON_LINE(look), look);
      if (previous) {
        expect(s.albedo).toBeLessThanOrEqual(previous.albedo + 1e-12);
        expect(s.roughness).toBeLessThanOrEqual(previous.roughness + 1e-12);
        expect(s.metalness).toBeGreaterThanOrEqual(previous.metalness - 1e-12);
      }
      previous = s;
    });
    expect(dampOf(0)).toBe(0);
    expect(filmOf(0)).toBe(0);
  });

  it("contraste trazada/fuera ≥ 8 % con Δh ≥ 0,2 mm mientras la lámina no llena la textura", () => {
    STEPS(0, LOOK.wet.filmFullMm - 0.2, 0.05).forEach((line) => {
      [0.2, 0.3, 0.5].forEach((dh) => {
        const look = wetLookFor(weatherOfMm(line, line + dh));
        const a = surfaceAt(ON_LINE(look), look).albedo;
        const b = surfaceAt(OFF_LINE(look), look).albedo;
        expect((a - b) / a).toBeGreaterThanOrEqual(0.08);
      });
    });
  });

  it("la franja seca mide lineDryWidthM recién mojada y se ensancha hasta lineWidenToM al secarse la línea", () => {
    const fresh = wetLookFor(weatherOfMm(0.5, 0.5));
    expect(fresh.innerHalf).toBeCloseTo(LOOK.wet.lineDryWidthM / 2, 9);
    const widths = [0.5, 0.4, 0.25, 0.1, 0].map((line) => wetLookFor(weatherOfMm(line, 0.5)).innerHalf);
    widths.slice(1).forEach((w, k) => expect(w).toBeGreaterThanOrEqual(widths[k]));
    expect(widths[widths.length - 1]).toBeCloseTo(LOOK.wet.lineWidenToM / 2, 9);
  });

  it("por sector: más agua en un sector, más oscuro ese sector", () => {
    const look = wetLookFor(weatherOfMm(0.3, 0.45, [0.1, 0.3, 0.6]));
    const at = (sector) => surfaceAt({ lat: 0, lineLat: 0, sector, low: 0 }, look).albedo;
    expect(at(0)).toBeGreaterThan(at(1));
    expect(at(1)).toBeGreaterThan(at(2));
    expect(sectorBlend([1, 2, 3], 1.5)).toBeCloseTo(2.5, 12);
    expect(wetLookFor({ waterMm: { line: 0.2, off: 0.5, sectors: [0.2, 0.2, 0.2], offSectors: [0.3, 0.5, 0.9] } }).dampOff[2]).toBeCloseTo(dampOf(0.9), 12);
  });

  it("charcos solo fuera de la trazada, desde puddleFromMm, en manchas sembradas en los bordes", () => {
    const below = wetLookFor(weatherOfMm(0.2, LOOK.wet.puddleFromMm));
    expect(below.puddle.every((p) => p === 0)).toBe(true);
    const flooded = wetLookFor(weatherOfMm(0.4, 2));
    const inPuddle = surfaceAt({ lat: 6, lineLat: 0, sector: 0, low: 1 }, flooded);
    const notPuddle = surfaceAt({ lat: 6, lineLat: 0, sector: 0, low: 0 }, flooded);
    expect(inPuddle.roughness).toBeLessThan(notPuddle.roughness);
    expect(inPuddle.albedo).toBeLessThan(notPuddle.albedo);
    expect(surfaceAt({ lat: 0, lineLat: 0, sector: 0, low: 1 }, flooded).puddle).toBe(0);

    const circuit = { ref: "shanghai", points: Array.from({ length: 900 }, (_, i) => ({ x: i * 6, y: 0 })), length: 5400 };
    const a = puddleField(circuit);
    const b = puddleField(circuit);
    expect(Array.from(a.left)).toEqual(Array.from(b.left));
    const share = Array.from(a.left).filter((v) => v > 0).length / a.left.length;
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.6);
    const other = puddleField({ ...circuit, ref: "interlagos" });
    expect(Array.from(other.left)).not.toEqual(Array.from(a.left));
  });

  it("los atributos del asfalto siguen las filas del ribbon y la trazada se rellena desde el motor", () => {
    const n = 120;
    const circuit = { ref: "x", points: Array.from({ length: n }, (_, i) => ({ x: i, y: 0 })), length: 1200, dist: Array.from({ length: n }, (_, i) => i * 10), sectors: [0, 0.3, 0.7] };
    const attrs = wetAttributes(circuit, { half: 6.5, closed: true });
    expect(attrs.aOcLat.length).toBe((n + 1) * 2);
    expect(attrs.aOcLat[0]).toBe(-6.5);
    expect(attrs.aOcLat[1]).toBe(6.5);
    expect(attrs.aOcSector[0]).toBe(0);
    expect(attrs.aOcSector[2 * 50]).toBe(1);
    expect(attrs.aOcSector[2 * 100]).toBe(2);
    fillRacingLine(attrs.aOcLine, n, (i) => (i < 60 ? 2.5 : -1.5), true);
    expect(attrs.aOcLine[10 * 2]).toBe(2.5);
    expect(attrs.aOcLine[10 * 2 + 1]).toBe(2.5);
    expect(attrs.aOcLine[n * 2]).toBe(2.5);
    expect(attrs.aOcLine[80 * 2]).toBe(-1.5);
  });

  it("el parche del shader encuentra sus puntos de inserción en MeshStandardMaterial de three", () => {
    const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader };
    const values = wetUniformValues(wetLookFor(weatherOfMm(0.3, 0.6)));
    const uniforms = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { value: v }]));
    patchWetShader(shader, uniforms);
    ["attribute float aOcLat", "vOcLat = aOcLat"].forEach((code) => expect(shader.vertexShader).toContain(code));
    ["uniform float ocDampLine[OC_SECTORS]", "float ocShare", "roughnessFactor = ocRoughDry", "metalnessFactor = ocMetalDry"].forEach((code) =>
      expect(shader.fragmentShader).toContain(code)
    );
    // Order: the wet layers are computed before the roughness and metalness chunks use them.
    const f = shader.fragmentShader;
    expect(f.indexOf("float ocShare")).toBeLessThan(f.indexOf("roughnessFactor = ocRoughDry"));
    expect(f.indexOf("roughnessFactor = ocRoughDry")).toBeLessThan(f.indexOf("metalnessFactor = ocMetalDry"));
    expect(shader.uniforms.ocWetOn.value).toBe(1);
  });

  it("enableWetSurface es perezoso e idempotente y actualiza los uniformes", () => {
    const material = new THREE.MeshStandardMaterial();
    const handle = enableWetSurface(material);
    expect(enableWetSurface(material)).toBe(handle);
    expect(handle.uniforms.ocWetOn.value).toBe(0);
    handle.update(wetLookFor(weatherOfMm(0.4, 0.8)));
    expect(handle.uniforms.ocWetOn.value).toBe(1);
    expect(handle.uniforms.ocDampOff.value[1]).toBeCloseTo(dampOf(0.8), 9);
    handle.update(wetLookFor(null));
    expect(handle.uniforms.ocWetOn.value).toBe(0);
    expect(material.customProgramCacheKey()).toContain("ocWet");
  });
});

describe("especular en mojado (VIEW-07)", () => {
  it("el pico especular sube ≥ 10 % con la pista mojada y es monótono con el agua", () => {
    const dry = specularPeakOf(surfaceAt(ON_LINE(wetLookFor(null)), wetLookFor(null)).roughness);
    const wetLook = wetLookFor(weatherOfMm(0.25));
    expect(specularPeakOf(surfaceAt(ON_LINE(wetLook), wetLook).roughness)).toBeGreaterThanOrEqual(1.1 * dry);
    let previous = dry;
    STEPS(0.05, 2, 0.05).forEach((h) => {
      const look = wetLookFor(weatherOfMm(h));
      const peak = specularPeakOf(surfaceAt(ON_LINE(look), look).roughness);
      expect(peak).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = peak;
    });
  });
});

describe("spray instanciado (GS-10 / VIEW-07)", () => {
  const seed = spraySeedOf("china-2013", "vettel");

  it("spray 0 con 0 mm: el nivel del motor es 0 y no hay partículas", () => {
    expect(sprayLevelOf(0)).toBe(0);
    expect(sprayIntensityOf(sprayLevelOf(0), 80)).toBe(0);
    expect(sprayBudget([0, 0, 0])).toEqual([0, 0, 0]);
    expect(sprayParticles({ seed, t: 12.3, intensity: 0, speedMps: 80, count: 50 })).toEqual([]);
  });

  it("monótono con el agua (sprayLevelOf del motor) y con la velocidad", () => {
    let previous = { count: 0, alpha: 0, trail: 0 };
    STEPS(0, 1.2, 0.05).forEach((h) => {
      const intensity = sprayIntensityOf(sprayLevelOf(h), 75);
      const [count] = sprayBudget([intensity, 0.5]);
      const particles = sprayParticles({ seed, t: 40, intensity, speedMps: 75, count });
      const alpha = particles.reduce((sum, p) => sum + p.alpha, 0);
      const { trailM } = trailOf(intensity);
      expect(count).toBeGreaterThanOrEqual(previous.count);
      expect(trailM).toBeGreaterThanOrEqual(previous.trail);
      if (count === previous.count) expect(alpha).toBeGreaterThanOrEqual(previous.alpha - 1e-9);
      previous = { count, alpha, trail: trailM };
    });
    const speeds = [0, 5, 10, 30, 60, 90].map((v) => sprayIntensityOf(0.8, v));
    expect(speeds[0]).toBe(0);
    speeds.slice(1).forEach((v, k) => expect(v).toBeGreaterThanOrEqual(speeds[k]));
  });

  it("estela de 50–150 m a velocidad de carrera según el nivel", () => {
    const back = (intensity) => {
      const { lifeSec } = trailOf(intensity);
      return lifeSec * LOOK.rain.spray.speedFullMps * (1 - LOOK.rain.spray.carry);
    };
    expect(back(0.01)).toBeGreaterThan(40);
    expect(back(0.01)).toBeLessThan(60);
    expect(back(1)).toBeGreaterThan(130);
    expect(back(1)).toBeLessThan(160);
  });

  it("mismas partículas con la misma semilla y el mismo reloj; otras con otra semilla", () => {
    const args = { t: 1234.5, intensity: 0.7, speedMps: 70, count: 60 };
    expect(sprayParticles({ seed, ...args })).toEqual(sprayParticles({ seed, ...args }));
    expect(sprayParticles({ seed: spraySeedOf("china-2013", "webber"), ...args })).not.toEqual(sprayParticles({ seed, ...args }));
  });

  it("nada en calidad baja y el presupuesto de la calidad nunca se pasa", () => {
    expect(sprayBudget([1, 1, 1], "low")).toEqual([0, 0, 0]);
    const counts = sprayBudget(new Array(22).fill(1), "medium");
    expect(counts.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(LOOK.rain.spray.maxParticles.medium);
    counts.forEach((c) => expect(c).toBeLessThanOrEqual(LOOK.rain.spray.perCarMax.medium));
  });

  it("la capa three.js escribe las mismas matrices con la misma semilla, y nada sin agua", () => {
    const camera = new THREE.PerspectiveCamera();
    const cars = (spray) => [
      { seed, x: 100, z: 50, heading: 0.3, speedMps: 70, spray },
      { seed: spraySeedOf("china-2013", "webber"), x: 60, z: 40, heading: 0.3, speedMps: 68, spray },
    ];
    const a = createSprayLayer({ quality: "medium" });
    const b = createSprayLayer({ quality: "medium" });
    expect(a.update(cars(0), { t: 50, camera })).toBe(0);
    const n = a.update(cars(0.8), { t: 50, camera });
    expect(n).toBeGreaterThan(0);
    expect(b.update(cars(0.8), { t: 50, camera })).toBe(n);
    expect(Array.from(a.mesh.instanceMatrix.array.slice(0, n * 16))).toEqual(Array.from(b.mesh.instanceMatrix.array.slice(0, n * 16)));
    // Behind the car: every puff is on the far side of the car's heading.
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    a.mesh.getMatrixAt(0, m);
    p.setFromMatrixPosition(m);
    expect((p.x - 100) * Math.cos(0.3) + (p.z - 50) * Math.sin(0.3)).toBeLessThan(0.01);
    const low = createSprayLayer({ quality: "low" });
    expect(low.update(cars(1), { t: 50, camera })).toBe(0);
    [a, b, low].forEach((layer) => layer.dispose());
  });
});

describe("gotas en la lente (VIEW-07)", () => {
  const seed = seedFor("lens", "china-2013", "vettel");

  it("solo en las onboards", () => {
    expect(lensActiveFor("onboard")).toBe(true);
    ["tv", "heli", "chase", "pit"].forEach((kind) => {
      expect(lensActiveFor(kind)).toBe(false);
      expect(lensDrops({ seed, t: 10, rainRate: 12, cameraKind: kind })).toEqual([]);
    });
  });

  it("sin lluvia ni spray no hay gotas; con más lluvia nunca menos; mismas gotas con la misma semilla", () => {
    expect(lensDrops({ seed, t: 10, rainRate: 0, sprayAhead: 0 })).toEqual([]);
    let previous = -1;
    [0.15, 1.5, 5, 12].forEach((rainRate) => {
      const drops = lensDrops({ seed, t: 333.3, rainRate, speedMps: 50 });
      expect(drops.length).toBeGreaterThanOrEqual(previous);
      previous = drops.length;
    });
    expect(previous).toBeGreaterThan(0);
    expect(lensDrops({ seed, t: 33, rainRate: 0, sprayAhead: 1 }).length).toBeGreaterThan(0);
    expect(lensDrops({ seed, t: 77.7, rainRate: 5 })).toEqual(lensDrops({ seed, t: 77.7, rainRate: 5 }));
  });

  it("la referencia de CPU y el pase: refracción solo dentro de una gota", () => {
    const drops = [{ u: 0.5, v: 0.5, r: 0.02, alpha: 1 }];
    expect(lensOffsetAt(0.1, 0.1, drops)).toEqual([0, 0]);
    const [du, dv] = lensOffsetAt(0.505, 0.505, drops);
    expect(Math.hypot(du, dv)).toBeGreaterThan(0);
    const uniforms = THREE.UniformsUtils.clone(LensDropShader.uniforms);
    applyLens(uniforms, drops);
    expect(uniforms.dropCount.value).toBe(1);
    expect(uniforms.drops.value[0].toArray()).toEqual([0.5, 0.5, 0.02, 1]);
  });
});

describe("niebla y rayas de lluvia (VIEW-07)", () => {
  it("sin lluvia la niebla es la de la calima de sky.js; con lluvia, monótona", () => {
    expect(rainExtinctionOf(0)).toBe(0);
    expect(rainFogDensity({ humidity: 64, rainMmH: 0 })).toBe(fogDensityFor(64));
    let previous = 0;
    STATES.forEach((state) => {
      const density = rainFogDensity({ humidity: 64, rainMmH: state.rainMmPerHour });
      expect(density).toBeGreaterThanOrEqual(previous);
      previous = density;
    });
  });

  it("contraste a 200 m −25 % o más con lluvia fuerte (humedad 64 %, final de la SQ de China 2024, OpenF1 9668)", () => {
    const dry = renderedContrastAt(rainFogDensity({ humidity: 64, rainMmH: 0 }), 200);
    const heavy = renderedContrastAt(rainFogDensity({ humidity: 64, rainMmH: STATES[HEAVY].rainMmPerHour }), 200);
    expect(heavy / dry).toBeLessThanOrEqual(0.75);
  });

  it("rayas: ninguna en seco, más con más lluvia, deterministas y dentro de la caja", () => {
    expect(streakCountFor(0)).toBe(0);
    const counts = [0.15, 1.5, 5, 12].map((r) => streakCountFor(r, "medium"));
    counts.slice(1).forEach((c, k) => expect(c).toBeGreaterThanOrEqual(counts[k]));
    expect(counts[counts.length - 1]).toBe(LOOK.rain.streaks.count.medium);
    const seed = seedFor("streaks", "china-2013");
    const centre = { x: 10, y: 5, z: -3 };
    const a = streakPositions({ seed, t: 61.25, count: 200, centre });
    expect(Array.from(a)).toEqual(Array.from(streakPositions({ seed, t: 61.25, count: 200, centre })));
    for (let k = 0; k < 200; k += 1) {
      expect(Math.abs(a[k * 6] - centre.x)).toBeLessThanOrEqual(LOOK.rain.streaks.boxM / 2);
      expect(a[k * 6 + 1] - centre.y).toBeLessThanOrEqual(LOOK.rain.streaks.boxM / 2);
    }
    // They fall at fallMps between two instants a step apart (no wrap in between for most of them).
    const b = streakPositions({ seed, t: 61.35, count: 200, centre });
    const falls = [];
    for (let k = 0; k < 200; k += 1) falls.push(a[k * 6 + 1] - b[k * 6 + 1]);
    falls.sort((x, y) => x - y);
    expect(falls[100]).toBeCloseTo(LOOK.rain.streaks.fallMps * 0.1, 3);
  });
});

describe("contrato de la instantánea (F1M24-CHINA §1.5)", () => {
  it("rainViewFor lee snapshot.weather y es seco sin él (partidas viejas, modo rápido)", () => {
    const cars = [{}, {}];
    expect(rainViewFor(cars).wet.wet).toBe(false);
    expect(rainViewFor(cars).streaks).toBe(0);
    cars.weather = weatherOfMm(0.4, 0.7);
    cars.weather.rainRate = 5;
    const view = rainViewFor(cars, { quality: "high", cameraKind: "onboard" });
    expect(view.wet.wet).toBe(true);
    expect(view.streaks).toBeGreaterThan(0);
    expect(view.lens).toBe(true);
    expect(rainViewFor(cars.weather).wet.wet).toBe(true);
  });
});

describe("determinismo (F1M24-CHINA §1.4 regla 7)", () => {
  it("ningún módulo de three/rain usa Math.random ni el reloj de pared", () => {
    const dir = __dirname;
    fs.readdirSync(dir)
      .filter((file) => file.endsWith(".js") && !file.endsWith(".test.js"))
      .forEach((file) => {
        const source = fs.readFileSync(path.join(dir, file), "utf8");
        expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now|new Date\(/);
      });
  });
});
