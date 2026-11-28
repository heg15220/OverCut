/**
 * LOOK-C3 (F1M24-CHINA §3.3; VIEW-18; RF-3D-04, SRS §6, RNF-05, RNF-07): chispas del suelo por era y humo
 * de bloqueo.
 *   - aceptación de VIEW-18: sparksEnabled(2013) = false y sparksEnabled(2016) = true; las eras cubren
 *     1976–2026 sin huecos ni solapes;
 *   - disparo solo frenando fuerte a alta velocidad o sobre un bache;
 *   - deterministas (F1M24-CHINA §1.4 regla 7): misma semilla, coche y reloj de carrera → mismas ráfagas y
 *     mismas partículas; otra semilla, otras;
 *   - nada en calidad baja ni en una era sin patines; humo solo con el bloqueo del motor.
 */

import LOOK from "../../data/balance/view-look.json";
import { burstParticles, burstTicks, createSparkSystem, lockupOf, sparkTrigger, sparksEnabled } from "./sparks";

const KMH = 3.6;
const braking = { speedMps: 300 / KMH, brake: 1, lonG: -4.5, rough: 0 };

const drive = (system, year, { seed = 7, from = 100, seconds = 3, step = 1 / 60, car = braking } = {}) => {
  const frames = [];
  for (let t = from; t <= from + seconds; t += step) {
    system.update({ year, tau: t, seed, cars: [{ key: "c1", x: 10, y: 0, z: 20, heading: 0.3, ...car }] });
    const attr = system.object.children[0].geometry;
    frames.push(Array.from(attr.attributes.position.array.slice(0, attr.drawRange.count * 3)));
  }
  return frames;
};

describe("chispas por era (VIEW-18)", () => {
  it("nunca en 2013, sí en 2016", () => {
    expect(sparksEnabled(2013)).toBe(false);
    expect(sparksEnabled(2016)).toBe(true);
    expect(sparksEnabled(undefined)).toBe(false);
  });

  it("las eras cubren 1976–2026 sin huecos ni solapes, y las no leídas en la FIA van pending", () => {
    const eras = [...LOOK.fx.sparks.eras].sort((a, b) => a.from - b.from);
    expect(eras[0].from).toBe(1976);
    expect(eras[eras.length - 1].to).toBe(2026);
    eras.slice(1).forEach((era, k) => expect(era.from).toBe(eras[k].to + 1));
    eras.filter((era) => /Memoria/.test(era.source)).forEach((era) => expect(era.status).toBe("pending"));
  });

  it("solo saltan frenando fuerte a alta velocidad o sobre un bache", () => {
    expect(sparkTrigger(braking)).toBe(true);
    expect(sparkTrigger({ ...braking, speedMps: 150 / KMH })).toBe(false);
    expect(sparkTrigger({ ...braking, brake: 0, lonG: 0 })).toBe(false);
    expect(sparkTrigger({ ...braking, lonG: -1 })).toBe(false);
    expect(sparkTrigger({ ...braking, brake: 1, lonG: undefined })).toBe(true);
    expect(sparkTrigger({ speedMps: 300 / KMH, brake: 0, rough: LOOK.fx.sparks.bumpCurvature * 2 })).toBe(true);
  });

  it("las ráfagas dependen solo de la semilla y del reloj de carrera", () => {
    const a = burstTicks({ seed: 11, fromTau: 0, toTau: 60, limit: 10000 });
    const b = burstTicks({ seed: 11, fromTau: 0, toTau: 60, limit: 10000 });
    const c = burstTicks({ seed: 12, fromTau: 0, toTau: 60, limit: 10000 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    // About burstsPerSec per second while the trigger holds.
    const expected = LOOK.fx.sparks.burstsPerSec * 60;
    expect(a.length).toBeGreaterThan(expected * 0.6);
    expect(a.length).toBeLessThan(expected * 1.4);
    // Split in two calls, the same ticks: frame rate does not change the sparks.
    const halves = [...burstTicks({ seed: 11, fromTau: 0, toTau: 30, limit: 10000 }), ...burstTicks({ seed: 11, fromTau: 30, toTau: 60, limit: 10000 })];
    expect(halves).toEqual(a);
    expect(burstTicks({ seed: 11, fromTau: 60, toTau: 30 })).toEqual([]);
    expect(burstParticles(11, a[0], 80)).toEqual(burstParticles(11, a[0], 80));
    expect(burstParticles(11, a[0], 80)).toHaveLength(LOOK.fx.sparks.particlesPerBurst);
  });

  it("el sistema dibuja lo mismo con la misma semilla y reloj, y nada en 2013 ni en calidad baja", () => {
    const one = drive(createSparkSystem({ quality: "medium" }), 2016);
    const two = drive(createSparkSystem({ quality: "medium" }), 2016);
    expect(one).toEqual(two);
    expect(one.some((frame) => frame.length > 0)).toBe(true);
    // Flashes: a burst lasts flashFrames drawn frames.
    const lit = one.filter((frame) => frame.length > 0).length;
    expect(lit).toBeLessThan(one.length);
    expect(drive(createSparkSystem({ quality: "medium" }), 2013).every((frame) => frame.length === 0)).toBe(true);
    expect(drive(createSparkSystem({ quality: "low" }), 2016).every((frame) => frame.length === 0)).toBe(true);
    const otherSeed = drive(createSparkSystem({ quality: "medium" }), 2016, { seed: 8 });
    expect(otherSeed).not.toEqual(one);
  });

  it("las chispas salen por debajo del coche y no atraviesan el suelo", () => {
    const frames = drive(createSparkSystem({ quality: "high" }), 2018);
    const heights = frames.flat().filter((value, k) => k % 3 === 1);
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(0.02 - 1e-9);
  });

  it("humo solo con el bloqueo que paga el motor", () => {
    expect(lockupOf({ incident: "lockup" })).toBe(true);
    expect(lockupOf({ lon: "LOCKUP" })).toBe(true);
    expect(lockupOf({ incident: "wide" })).toBe(false);
    expect(lockupOf(null)).toBe(false);
    const system = createSparkSystem({ quality: "medium" });
    const cruising = { speedMps: 50, brake: 0, lonG: 0, rough: 0 };
    for (let t = 0; t < 1; t += 1 / 30) system.update({ year: 2013, tau: t, seed: 3, cars: [{ key: "c", x: 0, y: 0, z: 0, heading: 0, ...cruising, lockup: false }] });
    expect(system.active.puffs).toBe(0);
    for (let t = 1; t < 1.5; t += 1 / 30) system.update({ year: 2013, tau: t, seed: 3, cars: [{ key: "c", x: 0, y: 0, z: 0, heading: 0, ...cruising, lockup: true }] });
    expect(system.active.puffs).toBeGreaterThan(0);
    // A seek back starts afresh.
    system.update({ year: 2013, tau: 0.2, seed: 3, cars: [] });
    expect(system.active.puffs).toBe(0);
  });
});
