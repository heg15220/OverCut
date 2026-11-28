/**
 * LOOK-C4 (F1M24-CHINA §3.3 ola 4; GS-10 y VIEW-07 enganchados; RF-SIM-11, RF-3D-03, RF-3D-04, RNF-02, RNF-05,
 * RNF-07):
 *   - la vista lee la instantánea de agua del motor (snapshot.weather o el weatherNow del worker) en una sola forma,
 *     y sin ella el antiguo booleano `wet` equivale a una pista mojada de view-look.json rain.hookup.flagFallback;
 *   - el spray de cada coche es el del motor (pose, coche, prop, o sprayLevelOf del agua de la trazada), 0 en boxes;
 *   - en un circuito GLB el asfalto se moja por una máscara de la pista con la trazada del motor: correspondencia
 *     motor → vista, contraste trazada/fuera ≥ 8 % con Δh ≥ 0,2 mm (parte unitaria de GS-10), seco sin agua;
 *   - las gotas de lente solo en onboards (el pase de post existe solo cuando se pide) y Race3D.js ya no usa
 *     setWet(bool) ni rayas sin semilla (F1M24-CHINA §1.4 regla 7).
 */

import fs from "fs";
import path from "path";
import * as THREE from "three";
import Ajv from "ajv";
import LOOK from "../../data/balance/view-look.json";
import schema from "../../engine/packs/schema/view-look.schema.json";
import { depthOfWetness, sprayLevelOf } from "../../engine/weather";
import { lineGeometryFor } from "../../engine/trackData";
import { circuitFor } from "../../engine/venue";
import { poseAt } from "../../engine/trackGeometry";
import { carSprayOf, flagIsWet, frameWeatherFor, isRaining, lineWaterOf, rainHazeOf, sprayAheadOf, weatherViewOf } from "./hookup";
import { enableWorldWet, maskAt, patchWorldWetShader, wettableMaterialsOf, worldMaskFor, worldSurfaceAt, worldWetValues } from "./worldWet";
import { wetLookFor } from "./wetSurface";
import { lensDrops } from "./lens";
import { postPlanFor } from "../post/chain";

const snapshotWeather = (line, off, rainRate = 0, sectors = null) => ({ state: rainRate > 0 ? "light" : "overcast", rainRate, waterMm: { line, off, sectors: sectors || [line, line, line] } });

describe("view-look.json rain.hookup (RNF-07)", () => {
  it("valida contra el esquema y cada bloque lleva su estado", () => {
    const ajv = new Ajv({ allErrors: true });
    const valid = ajv.validate(schema, LOOK);
    expect(ajv.errors || []).toEqual([]);
    expect(valid).toBe(true);
    const hook = LOOK.rain.hookup;
    ["flagFallback", "lens", "haze", "worldMask"].forEach((key) => expect(typeof hook[key].status).toBe("string"));
    // The flag's rain is the 'light' state's rain of race-weather.json (sourced); its threshold the live view's 0.2.
    expect(hook.flagFallback.fromWetness).toBe(0.2);
  });
});

describe("hookup: la instantánea de agua del motor en una sola forma (GS-10)", () => {
  it("snapshot.weather y weatherNow dan lo mismo; sin cifra de agua, nulo", () => {
    const snap = { state: "light", rainRate: 1.5, waterMm: { line: 0.31, off: 0.52, sectors: [0.3, 0.32, 0.31] } };
    const now = { state: "light", rainMmPerHour: 1.5, waterMm: 0.31, offLineMm: 0.52, sectorsMm: [0.3, 0.32, 0.31], spray: 0.4 };
    const a = weatherViewOf(snap);
    const b = weatherViewOf(now);
    expect(a.waterMm).toEqual(b.waterMm);
    expect(a.rainRate).toBe(b.rainRate);
    expect(b.spray).toBe(0.4);
    // A snapshot array carrying .weather (engine/sim snapshot).
    const cars = [{}, {}];
    cars.weather = snap;
    expect(weatherViewOf(cars).waterMm).toEqual(a.waterMm);
    expect(weatherViewOf(null)).toBeNull();
    expect(weatherViewOf({ state: "sunny" })).toBeNull();
    // Off the line is never drier than the line.
    expect(weatherViewOf({ waterMm: { line: 0.4, off: 0.1 } }).waterMm.off).toBe(0.4);
  });

  it("el motor manda; sin él el antiguo `wet` es la pista mojada de flagFallback; si no, seco", () => {
    const engine = frameWeatherFor({ weather: snapshotWeather(0.2, 0.3, 0), wet: true });
    expect(engine.source).toBe("engine");
    expect(isRaining(engine)).toBe(false);
    const flag = frameWeatherFor({ weather: null, wet: true });
    const cfg = LOOK.rain.hookup.flagFallback;
    expect(flag.source).toBe("flag");
    expect(flag.waterMm.line).toBeCloseTo(depthOfWetness(cfg.wetness), 9);
    expect(flag.waterMm.off).toBeCloseTo(flag.waterMm.line * cfg.offOverLine, 9);
    expect(flag.rainRate).toBe(cfg.rainMmH);
    expect(wetLookFor(flag).wet).toBe(true);
    const dry = frameWeatherFor({ weather: null, wet: false });
    expect(dry.source).toBe("none");
    expect(wetLookFor(dry).wet).toBe(false);
    expect(isRaining(dry)).toBe(false);
    // A wetness 0..1 instead of the boolean, with the live view's old threshold.
    expect(flagIsWet(0.1)).toBe(false);
    expect(flagIsWet(0.3)).toBe(true);
    expect(lineWaterOf(engine, 1)).toBe(0.2);
  });

  it("el spray de cada coche es el del motor, 0 en boxes, y si no, sprayLevelOf del agua de la trazada", () => {
    const frame = frameWeatherFor({ weather: snapshotWeather(0.5, 0.8, 2) });
    const car = { id: "c1", spray: 0.2 };
    expect(carSprayOf({ car, pose: { spray: 0.7 }, frame })).toBe(0.7);
    expect(carSprayOf({ car, pose: {}, frame })).toBe(0.2);
    expect(carSprayOf({ car: { id: "c1" }, pose: {}, index: 1, spray: [0, 0.35], frame })).toBe(0.35);
    expect(carSprayOf({ car: { id: "c1" }, pose: {}, spray: { c1: 0.45 }, frame })).toBe(0.45);
    expect(carSprayOf({ car: { id: "c1" }, pose: {}, frame, year: 2024 })).toBeCloseTo(sprayLevelOf(0.5, 2024), 9);
    expect(carSprayOf({ car, pose: { inPit: true, spray: 0.9 }, frame })).toBe(0);
    expect(carSprayOf({ car: { id: "x" }, pose: {}, frame: frameWeatherFor({}) })).toBe(0);
  });

  it("el spray que llega a la lente baja con la distancia y es 0 más allá del alcance", () => {
    const reach = LOOK.rain.hookup.lens.sprayReachM;
    const at = [0, 10, 30, reach - 1, reach, reach + 10].map((d) => sprayAheadOf(0.8, d));
    at.slice(1).forEach((v, i) => expect(v).toBeLessThanOrEqual(at[i]));
    expect(at[0]).toBeCloseTo(0.8, 9);
    expect(at[4]).toBe(0);
    expect(sprayAheadOf(0, 5)).toBe(0);
    expect(rainHazeOf(false)).toBe(LOOK.rain.hookup.haze.day);
    expect(rainHazeOf(true)).toBe(LOOK.rain.hookup.haze.night);
  });
});

describe("worldWet: el asfalto mojado de un circuito GLB (GS-10)", () => {
  const circuit = circuitFor({ name: "Chinese Grand Prix", circuit: "shanghai" }, 2024);
  const mask = worldMaskFor(circuit);
  const line = lineGeometryFor(circuit);
  const pointAt = (i, lat) => {
    const p = circuit.points[i];
    const q = circuit.points[(i + 1) % circuit.points.length];
    const h = Math.atan2(q.y - p.y, q.x - p.x);
    return { x: p.x - Math.sin(h) * lat, z: p.y + Math.cos(h) * lat };
  };

  it("la máscara cubre la pista con la trazada del motor y nada fuera", () => {
    expect(mask.size).toBeLessThanOrEqual(LOOK.rain.hookup.worldMask.maxSize);
    const n = circuit.points.length;
    const misses = [];
    for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 200))) {
      const onLine = maskAt(mask, ...Object.values(pointAt(i, line.offsets[i])));
      if (!onLine.road || onLine.lineDist > 1.5 * mask.metresPerTexel) misses.push(i);
    }
    expect(misses.length).toBeLessThanOrEqual(2);
    // Far from any road: no asphalt.
    expect(maskAt(mask, mask.minX + 1, mask.minZ + 1).road).toBe(false);
    expect(maskAt(mask, mask.minX - 100, mask.minZ).road).toBe(false);
    // Deterministic: the same circuit gives the same mask byte for byte.
    expect(Buffer.from(worldMaskFor(circuit).data).equals(Buffer.from(mask.data))).toBe(true);
  });

  it("seco sin agua; más oscuro con más agua; trazada nunca más mojada que fuera; contraste ≥ 8 % con Δh ≥ 0,2 mm", () => {
    const i = Math.floor(circuit.points.length * 0.37);
    const onLine = pointAt(i, line.offsets[i]);
    const wl = line.wl ? line.wl[i] : 6;
    const wr = line.wr ? line.wr[i] : 6;
    const offLat = line.offsets[i] > 0 ? -wl + 1.5 : wr - 1.5;
    const offLine = pointAt(i, offLat);
    expect(maskAt(mask, offLine.x, offLine.z).road).toBe(true);
    const dry = wetLookFor(snapshotWeather(0, 0));
    expect(worldSurfaceAt(mask, onLine, dry).albedo).toBe(1);
    let last = 1;
    [0.05, 0.2, 0.5, 1, 2].forEach((h) => {
      const look = wetLookFor(snapshotWeather(h, h));
      const a = worldSurfaceAt(mask, onLine, look).albedo;
      expect(a).toBeLessThan(last);
      last = a;
    });
    const look = wetLookFor(snapshotWeather(0.1, 0.3));
    const line1 = worldSurfaceAt(mask, onLine, look);
    const off1 = worldSurfaceAt(mask, offLine, look);
    expect(line1.albedo).toBeGreaterThan(off1.albedo);
    expect((line1.albedo - off1.albedo) / line1.albedo).toBeGreaterThanOrEqual(0.08);
    expect(off1.roughness).toBeLessThan(line1.roughness);
    // Only what faces the sky gets wet; off the asphalt the ground darkens less and does not turn glossy.
    expect(worldSurfaceAt(mask, { ...offLine, up: 0 }, look).albedo).toBe(1);
    const grass = worldSurfaceAt(mask, { x: mask.minX + 1, z: mask.minZ + 1 }, look);
    expect(grass.road).toBe(false);
    expect(grass.albedo).toBeGreaterThan(off1.albedo);
    expect(grass.albedo).toBeLessThan(1);
  });

  it("el parche del shader encuentra todos sus puntos de inserción y comparte un juego de uniforms", () => {
    const lib = THREE.ShaderLib.physical;
    const shader = { uniforms: {}, vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader };
    const values = worldWetValues(null);
    patchWorldWetShader(shader, { ocwWetOn: { value: values.ocwWetOn } });
    ["vOcWorld = ", "ocwMask", "ocwScale", "metalnessFactor = max(metalnessFactor"].forEach((needle) => expect(`${shader.vertexShader}\n${shader.fragmentShader}`).toContain(needle));
    const scene = new THREE.Group();
    const a = new THREE.MeshStandardMaterial();
    const b = new THREE.MeshPhysicalMaterial();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), a), new THREE.Mesh(new THREE.BoxGeometry(), [b, a]), new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
    const materials = wettableMaterialsOf(scene);
    expect(materials).toHaveLength(2);
    const handle = enableWorldWet(materials, mask);
    const again = enableWorldWet(materials, mask);
    expect(again.uniforms).toBe(handle.uniforms);
    handle.update(wetLookFor(snapshotWeather(0.3, 0.5)));
    expect(handle.uniforms.ocwWetOn.value).toBe(1);
    handle.update(wetLookFor(snapshotWeather(0, 0)));
    expect(handle.uniforms.ocwWetOn.value).toBe(0);
    again.dispose();
    handle.dispose();
  });
});

describe("enganche en Race3D.js y el post (VIEW-07)", () => {
  const source = fs.readFileSync(path.join(__dirname, "../Race3D.js"), "utf8");

  it("setWet(bool) sustituido por la instantánea de agua; sin rayas sin semilla", () => {
    expect(source).not.toMatch(/setWet\(/);
    expect(source).not.toMatch(/Math\.random\(/);
    expect(source).toMatch(/frameWeatherFor\(/);
    expect(source).toMatch(/setWater\(frameWeather\)/);
    expect(source).toMatch(/streakPositions\(/);
    expect(source).toMatch(/sprayLayer\.update\(/);
    expect(source).toMatch(/lensDrops\(/);
    expect(source).toMatch(/setRainFog\(/);
    const track = fs.readFileSync(path.join(__dirname, "../trackScene.js"), "utf8");
    expect(track).not.toMatch(/setWet:/);
  });

  it("el pase de lente solo se pide expresamente y va antes del tone mapping; nada en calidad baja", () => {
    expect(postPlanFor("medium")).not.toContain("lens");
    const plan = postPlanFor("medium", { lens: true });
    expect(plan.indexOf("lens")).toBeGreaterThan(plan.indexOf("render"));
    expect(plan.indexOf("lens")).toBeLessThan(plan.indexOf("output"));
    expect(postPlanFor("low", { lens: true })).toEqual([]);
  });

  it("las gotas de lente solo en onboards y las mismas con la misma semilla y reloj (RNF-05)", () => {
    const args = { seed: 42, t: 812.5, rainRate: 5, sprayAhead: 0.6, speedMps: 60 };
    expect(lensDrops({ ...args, cameraKind: "tv" })).toEqual([]);
    const a = lensDrops({ ...args, cameraKind: "onboard" });
    expect(a.length).toBeGreaterThan(0);
    expect(lensDrops({ ...args, cameraKind: "onboard" })).toEqual(a);
    expect(lensDrops({ ...args, rainRate: 0, sprayAhead: 0, cameraKind: "onboard" })).toEqual([]);
  });

  it("la estela del spray sigue la pista: el punto de atrás está sobre la trazada a esa distancia", () => {
    const circuit = circuitFor({ name: "Chinese Grand Prix", circuit: "shanghai" }, 2024);
    const share = 0.25;
    const back = 80;
    const p = poseAt(circuit, share - back / circuit.length);
    const q = poseAt(circuit, share);
    expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeLessThanOrEqual(back + 1);
    expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(back * 0.5);
  });
});
