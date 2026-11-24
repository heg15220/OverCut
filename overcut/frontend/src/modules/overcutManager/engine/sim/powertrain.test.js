/**
 * Power unit, gearbox and inertia (RF-SIM-01, RF-SIM-02, RF-DEV-01; docs/manager/SIM-FISICA.md §7,
 * data/balance/race-powertrain.json, RNF-07), against real telemetry where there is some: OpenF1
 * car_data of the 2024 pole laps at Monza (Norris) and Bahrain (Verstappen) and the two race starts
 * (engine/sim/__fixtures__/openf1-powertrain.json, overcut/src/main/resources/scripts/powertrain_from_openf1.py).
 *
 *   - the schema (RNF-07) and the era rules (SRS 6.2): 5-6 gears before 1998, 7 until 2013, 8 since
 *     2014 with ratios fixed for the season, 18 000 rpm in 2009-13 and 15 000 since 2014;
 *   - the gear logic on the real speed trace gives the real gear, the fitted ratios the real
 *     speed per rpm, and in a step race the real top gear, rpm at the speed trap and pedal shares;
 *   - the launch from the grid: 0-100 and 0-200 km/h against the real starts;
 *   - the lap time is the budget's (SRS 4.2): the launch and lift-and-coast give their time back;
 *   - determinism (RF-SIM-15, RNF-05) and the snapshot fields the view reads.
 */

import Ajv from "ajv";
import fs from "fs";
import path from "path";
import schema from "../packs/schema/race-powertrain.schema.json";
import data from "../../data/balance/race-powertrain.json";
import telemetry from "./__fixtures__/openf1-powertrain.json";
import {
  assignPowerUnits,
  coastDecel,
  createDrive,
  eraOf,
  gearShares,
  launchAccel,
  manufacturerKey,
  manufacturerOf,
  pitLimiterOf,
  powertrainFor,
  rpmOf,
  scShiftShareOf,
  shiftGear,
  updateDrive,
} from "./powertrain";
import { fromQuickRace, setMix, snapshot, stepOnce } from "./index";
import { packContext, weekend } from "./simTestKit";

const KMH = 3.6;

let context = null;
beforeAll(async () => {
  context = await packContext();
});

/** The real lap as samples with distance (integrated from speed) and lap share. */
const realLap = (session) => {
  const out = [];
  let d = 0;
  session.lap.samples.forEach((row, k, all) => {
    if (k) d += ((row[1] + all[k - 1][1]) / 2 / KMH) * (row[0] - all[k - 1][0]);
    out.push({ t: row[0], d, kmh: row[1], rpm: row[2], gear: row[3], throttle: row[4], brake: row[5] });
  });
  out.forEach((row) => {
    row.share = row.d / d;
  });
  return out;
};

/** Run the gear logic over a real speed trace (acceleration smoothed as the sim does). */
const gearsOnRealTrace = (pt, lap) => {
  let gear = lap[0].gear;
  let a = 0;
  return lap.slice(1).map((row, k) => {
    const dt = row.t - lap[k].t;
    a += ((row.kmh - lap[k].kmh) / KMH / dt - a) * (dt / (pt.accelSec + dt));
    gear = shiftGear(pt, gear, row.kmh / KMH, a);
    return { real: row.gear, sim: gear, rpm: rpmOf(pt, gear, row.kmh / KMH), realRpm: row.rpm };
  });
};

/** A step race of `year` at `circuit`, the snapshots of car `index` over `lap`. */
const lapTrace = (year, circuit, lap = 4, seed = "powertrain") => {
  const w = weekend({ year, circuit, context, seed });
  const state = fromQuickRace(w.make(), { race: w.race });
  const trace = [];
  while (!state.finished && state._sim.laps[0] <= lap) {
    stepOnce(state);
    if (state._sim.laps[0] === lap && !state.safetyCar) trace.push(snapshot(state)[0]);
  }
  return { state, trace };
};

describe("race-powertrain.json (RNF-07, SRS 6.2)", () => {
  it("passes its JSON schema", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    expect(validate(data) || validate.errors).toBe(true);
  });

  it("covers every year from 1950 with contiguous era blocks, each with a source", () => {
    data.eras.forEach((era, k) => {
      expect(era.to).toBeGreaterThanOrEqual(era.from);
      expect(era.from).toBe(k ? data.eras[k - 1].to + 1 : 1950);
      expect(Object.keys(era.source).length).toBeGreaterThan(0);
      expect(era.engine.shiftRpm).toBeLessThanOrEqual(era.engine.limitRpm);
      expect(era.engine.downRpm).toBeLessThan(era.engine.shiftRpm);
    });
    expect(data.eras[0].from).toBe(1950);
  });

  it.each([
    // FIA / formula1.com: 8 ratios fixed for the season since 2014; 7 gears until 2013 (Autosport).
    [1976, 5, "perCircuit"],
    [1988, 6, "perCircuit"],
    [2005, 7, "perCircuit"],
    [2012, 7, "perCircuit"],
    [2014, 8, "perSeason"],
    [2024, 8, "perSeason"],
    [2026, 8, "perSeason"],
  ])("%i: %i gears, ratios %s", (year, gears, ratios) => {
    expect(eraOf(year).gearbox.gears).toBe(gears);
    expect(eraOf(year).gearbox.ratios).toBe(ratios);
  });

  it.each([
    // Wikipedia "Formula One engines": 19 000 rpm 2007-08, 18 000 from 2009, 15 000 2014-21.
    [2007, 19000],
    [2009, 18000],
    [2013, 18000],
    [2014, 15000],
  ])("%i: rev limit %i rpm", (year, rpm) => {
    expect(eraOf(year).engine.limitRpm).toBe(rpm);
  });

  it("no energy recovery where the era has none (KERS 2009 and 2011-13, MGU-K since 2014)", () => {
    expect(eraOf(2005).engine.harvestKw).toBe(0);
    expect(eraOf(2010).engine.harvestKw).toBe(0);
    expect(eraOf(2012).engine.harvestKw).toBe(60);
    expect(eraOf(2024).engine.harvestKw).toBe(120);
    expect(eraOf(2026).engine.harvestKw).toBe(350);
  });

  it("uses no clock and no unseeded randomness (RF-SIM-15, RNF-05)", () => {
    const source = fs.readFileSync(path.join(__dirname, "powertrain.js"), "utf8");
    expect(source).not.toMatch(/Math\.random|Date\.now|new Date|Math\.(pow|exp|sin|cos|atan)/);
  });
});

describe("the gearbox against OpenF1 2024 (RF-SIM-02)", () => {
  it("gear shares resample the measured eight-speed shape", () => {
    expect(Array.from(gearShares(8))).toEqual(data.gearShape.shares);
    const five = gearShares(5);
    expect(five[0]).toBeCloseTo(data.gearShape.shares[0], 9);
    expect(five[4]).toBe(1);
    for (let g = 1; g < 5; g += 1) expect(five[g]).toBeGreaterThan(five[g - 1]);
  });

  it.each(telemetry.sessions.map((session) => [session.circuit, session]))("%s: the fitted ratios give the real speed per rpm in every gear used (±4 %%)", (circuit, session) => {
    const pt = powertrainFor({ year: session.year, layoutRef: circuit });
    const byGear = {};
    realLap(session).forEach((row) => {
      if (row.rpm > 6000 && row.gear > 0) (byGear[row.gear] = byGear[row.gear] || []).push(row.kmh / row.rpm);
    });
    Object.keys(byGear).forEach((gear) => {
      const sorted = byGear[gear].sort((x, y) => x - y);
      if (sorted.length < 5) return;
      const real = sorted[sorted.length >> 1] / KMH;
      expect(Math.abs(pt.speedPerRpm[gear - 1] / real - 1)).toBeLessThanOrEqual(0.04);
    });
  });

  it.each(telemetry.sessions.map((session) => [session.circuit, session]))("%s: on the real speed trace the shift logic picks the real gear in ≥ 70 %% of samples and within one in ≥ 90 %%", (circuit, session) => {
    const pt = powertrainFor({ year: session.year, layoutRef: circuit });
    const rows = gearsOnRealTrace(pt, realLap(session));
    const exact = rows.filter((row) => row.sim === row.real).length / rows.length;
    const near = rows.filter((row) => Math.abs(row.sim - row.real) <= 1).length / rows.length;
    // Measured 23/11: Monza 0.75 / 0.93, Bahrain 0.73 / 0.99.
    expect(exact).toBeGreaterThanOrEqual(0.7);
    expect(near).toBeGreaterThanOrEqual(0.9);
  });

  it("2014+: one set of ratios for the season - Bahrain's top gear at its real top speed is at the real rpm (±3 %)", () => {
    const bahrain = telemetry.sessions.find((session) => session.circuit === "bahrain");
    const lap = realLap(bahrain);
    const top = lap.reduce((best, row) => (row.kmh > best.kmh ? row : best));
    const pt = powertrainFor({ year: 2024, layoutRef: "bahrain" });
    expect(Array.from(pt.speedPerRpm)).toEqual(Array.from(powertrainFor({ year: 2024, layoutRef: "monaco", circuitTop: 80 }).speedPerRpm));
    expect(top.gear).toBe(8);
    expect(Math.abs(rpmOf(pt, 8, top.kmh / KMH) / top.rpm - 1)).toBeLessThanOrEqual(0.03);
  });

  it("until 2013 the ratios follow the circuit's own top speed", () => {
    const fast = powertrainFor({ year: 2012, layoutRef: "monza", circuitTop: 95 });
    const slow = powertrainFor({ year: 2012, layoutRef: "monaco", circuitTop: 80 });
    expect(slow.speedPerRpm[6]).toBeLessThan(fast.speedPerRpm[6]);
    expect(rpmOf(slow, 7, 80 * 1.02)).toBeCloseTo(eraOf(2012).gearbox.topGearRpm, 0);
  });
});

describe("in a step race (RF-SIM-01, SRS 4.2)", () => {
  it.each([
    ["monza", 12259],
    ["bahrain", 11999],
  ])("2024 %s: top gear at the top speed, max rpm within ±6 %% of the real %i, pedal shares near the real ones", (circuit, realMax) => {
    const { trace } = lapTrace(2024, circuit);
    const running = trace.filter((car) => car.status === "running" && !car.inPit);
    const top = running.reduce((best, car) => (car.v > best.v ? car : best));
    expect(top.gear).toBe(8);
    const maxRpm = Math.max(...running.map((car) => car.rpm));
    expect(Math.abs(maxRpm / realMax - 1)).toBeLessThanOrEqual(0.06);
    const session = telemetry.sessions.find((s) => s.circuit === circuit);
    const real = realLap(session);
    const realFull = real.filter((row) => row.throttle >= 99).length / real.length;
    const simFull = running.filter((car) => car.throttle >= 0.99).length / running.length;
    const realBrake = real.filter((row) => row.brake > 0).length / real.length;
    const simBrake = running.filter((car) => car.brake > 0).length / running.length;
    // Measured 23/11 (race lap 4 against the pole lap): Monza 0.76 / 0.76 full throttle, 0.15 / 0.11 braking;
    // Bahrain 0.71 / 0.63, 0.18 / 0.17.
    expect(Math.abs(simFull - realFull)).toBeLessThanOrEqual(0.12);
    expect(Math.abs(simBrake - realBrake)).toBeLessThanOrEqual(0.08);
  });

  it("gear by distance against the real pole lap at Monza 2024 (aligned by the best speed match)", () => {
    const { trace } = lapTrace(2024, "monza");
    const sim = trace.slice().sort((x, y) => x.share - y.share);
    const real = realLap(telemetry.sessions.find((s) => s.circuit === "monza"));
    const at = (share) => {
      let lo = 0;
      while (lo < sim.length - 1 && sim[lo + 1].share < share) lo += 1;
      return sim[lo];
    };
    // The spline's start line and the timing line differ by a few per cent of the lap (SIM-FISICA §7).
    let best = { off: 0, err: Infinity };
    for (let off = -0.08; off <= 0.08; off += 0.002) {
      const err = real.reduce((sum, row) => sum + (at((row.share + off + 1) % 1).v * KMH - row.kmh) ** 2, 0);
      if (err < best.err) best = { off, err };
    }
    const rows = real.map((row) => ({ row, car: at((row.share + best.off + 1) % 1) }));
    const exact = rows.filter(({ row, car }) => car.gear === row.gear).length / rows.length;
    const near = rows.filter(({ row, car }) => Math.abs(car.gear - row.gear) <= 1).length / rows.length;
    const rpmError = rows.reduce((sum, { row, car }) => sum + Math.abs(car.rpm - row.rpm), 0) / rows.length;
    // Measured 23/11: offset −0.046, exact 0.67, within one 0.95, rpm MAE 682.
    expect(exact).toBeGreaterThanOrEqual(0.55);
    expect(near).toBeGreaterThanOrEqual(0.88);
    expect(rpmError).toBeLessThanOrEqual(900);
  });

  it("the launch is traction-limited: 0-100 and 0-200 km/h within ±20 % of the real starts (OpenF1 2024)", () => {
    const real = (session, kmh) => {
      const rows = session.start.samples;
      const k = rows.findIndex((row) => row[1] >= kmh);
      const [t0, v0] = rows[k - 1];
      const [t1, v1] = rows[k];
      return t0 + ((kmh - v0) * (t1 - t0)) / (v1 - v0);
    };
    const bahrain = telemetry.sessions.find((s) => s.circuit === "bahrain");
    const w = weekend({ year: 2024, circuit: "bahrain", context, seed: "launch" });
    const state = fromQuickRace(w.make(), { race: w.race });
    const marks = {};
    const earlyGears = new Set();
    while (state.clock < 12) {
      stepOnce(state);
      const pole = snapshot(state)[0];
      [100, 200].forEach((kmh) => {
        if (marks[kmh] === undefined && pole.v * KMH >= kmh) marks[kmh] = state.clock;
      });
      if (state.clock < 1.5) earlyGears.add(pole.gear);
    }
    expect([...earlyGears]).toEqual([1]);
    // Measured 23/11: sim 3.0 / 5.25 s (0.25 s steps), real 2.84 / 5.25 s.
    expect(Math.abs(marks[100] / real(bahrain, 100) - 1)).toBeLessThanOrEqual(0.2);
    expect(Math.abs(marks[200] / real(bahrain, 200) - 1)).toBeLessThanOrEqual(0.2);
    // Before this block the step race jumped to the trace's speed on the first step.
    expect(launchAccel(powertrainFor({ year: 2024 }), 0)).toBeLessThan(1.3 * 9.81);
  });

  it("lift and coast on the lean mix: off the throttle before the braking zones, the lap still the budget's", () => {
    const w = weekend({ year: 2024, circuit: "bahrain", context, seed: "coast" });
    const state = fromQuickRace(w.make(), { race: w.race });
    const sim = state._sim;
    expect(sim.coast.loss).toBeCloseTo(0.24, 2);
    const i = state.cars.findIndex((car) => car.isUser);
    const id = state.cars[i].id;
    const residual = [];
    let lap = 0;
    let lifted = 0;
    const pedals = new Set();
    while (!state.finished && sim.laps[i] < 12) {
      if (sim.laps[i] === 4 && state.cars[i].fuelMode !== "lean") setMix(state, id, "lean");
      stepOnce(state);
      if (sim.drive.lifted[i]) {
        lifted += 1;
        const car = snapshot(state)[i];
        pedals.add(car.throttle + car.brake);
      }
      if (sim.laps[i] !== lap) {
        lap = sim.laps[i];
        if (lap > 6 && !state.safetyCar) residual.push(Math.abs(sim.drive.debt[i]));
      }
    }
    expect(lifted).toBeGreaterThan(0);
    expect([...pedals]).toEqual([0]);
    // The time the coasting costs is the budget's own: what is left over at each line is a few hundredths.
    residual.forEach((owed) => expect(owed).toBeLessThan(0.08));
  });

  it("coasting decelerates on drag, engine braking and the MGU-K", () => {
    const pt = powertrainFor({ year: 2024 });
    const noHarvest = { ...pt, harvestW: 0 };
    expect(coastDecel(pt, 80)).toBeGreaterThan(coastDecel(noHarvest, 80));
    expect(coastDecel(pt, 80) / 9.81).toBeGreaterThan(0.5);
    expect(coastDecel(pt, 80) / 9.81).toBeLessThan(2);
  });

  it("the snapshot carries gear, rpm, pedals, g and body motion, the same for the same seed (RF-SIM-15)", () => {
    const run = () => {
      const w = weekend({ year: 2012, circuit: "monza", context, seed: "same" });
      const state = fromQuickRace(w.make(), { race: w.race });
      for (let k = 0; k < 900; k += 1) stepOnce(state);
      return snapshot(state);
    };
    const a = run();
    const b = run();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    a.filter((car) => car.status === "running").forEach((car) => {
      ["gear", "rpm", "throttle", "brake", "lonG", "latG", "pitch", "roll", "frontLoad"].forEach((key) => expect(Number.isFinite(car[key])).toBe(true));
      expect(car.gear).toBeGreaterThanOrEqual(0);
      expect(car.gear).toBeLessThanOrEqual(7);
      expect(car.rpm).toBeLessThanOrEqual(eraOf(2012).engine.limitRpm);
      expect(Math.abs(car.latG)).toBeLessThan(7);
    });
  });
});

// ------------------------------------------------------------------ F1M24-GAMEPLAY §2.4 tren-por-pu (PT-1)

const shiftSessions = telemetry.shifts.sessions;
const median = (values) => {
  const sorted = values.slice().sort((x, y) => x - y);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** The rpm each upshift 3rd..7th happens at, flat out on a speed ramp (the gearbox's own logic). */
const upshiftRpms = (pt, up) => {
  const out = {};
  let gear = 3;
  for (let v = 10; v < 100; v += 0.01) {
    const next = shiftGear(pt, gear, v, 5, up);
    if (next > gear && gear >= 3 && gear <= 7) out[gear] = rpmOf(pt, gear, v);
    gear = next;
  }
  return out;
};

/** Car 0 through `speeds` (m/s per step of `dt`) with updateDrive and `opts`: its gear after each step. */
const gearsOver = (pt, speeds, opts = {}, dt = 0.25, start = 1) => {
  const drive = createDrive(1);
  drive.gear[0] = start;
  drive.vPrev[0] = speeds[0];
  return speeds.map((v) => {
    updateDrive(pt, drive, 0, v, 0, dt, opts);
    return drive.gear[0];
  });
};

describe("per power unit, the pit limiter and the safety car (F1M24-GAMEPLAY §2.4 tren-por-pu; RF-SIM-01, RF-DEV-05, RNF-07)", () => {
  it("manufacturer overrides only where OpenF1 measured them (SRS 6: nothing outside its era), on the pack's engine ids", () => {
    const outside = data.eras.filter((era) => era.to < 2022 || era.from > 2025);
    outside.forEach((era) => expect(era.manufacturers).toBeUndefined());
    const entries = data.eras
      .filter((era) => !outside.includes(era))
      .flatMap((era) =>
        Object.keys(era.manufacturers)
          .filter((key) => key !== "$comment")
          .map((key) => ({ era, table: era.manufacturers, entry: era.manufacturers[key] })),
      );
    entries
      .filter(({ entry }) => entry.sameAs)
      .forEach(({ table, entry }) => expect(table[entry.sameAs].shiftRpm).toBeGreaterThan(0));
    entries
      .filter(({ entry }) => !entry.sameAs)
      .forEach(({ era, entry }) => {
        expect(entry.gearShares).toHaveLength(era.gearbox.gears);
        expect(entry.shiftRpm).toBeLessThanOrEqual(era.engine.limitRpm);
      });
    // The 2022-2025 packs' engine manufacturers all resolve (2022 names Red Bull's unit "rbpt").
    ["ferrari", "mercedes", "renault", "honda-rbpt", "rbpt", "Honda RBPT"].forEach((name) => expect(manufacturerOf(eraOf(2024), name)).not.toBeNull());
    expect(manufacturerOf(eraOf(2024), "rbpt")).toBe(eraOf(2024).manufacturers["honda-rbpt"]);
    expect(manufacturerOf(eraOf(2012), "ferrari")).toBeNull();
    expect(manufacturerOf(eraOf(2026), "audi")).toBeNull();
    expect(manufacturerKey("Honda RBPT")).toBe("honda-rbpt");
    expect(manufacturerKey(null)).toBeNull();
  });

  it("the balance file holds what the script measured (fixture shifts.pooled)", () => {
    const table = eraOf(2024).manufacturers;
    Object.entries(telemetry.shifts.pooled).forEach(([name, pooled]) => {
      expect(table[name].shiftRpm).toBe(pooled.shiftRpm);
      expect(table[name].gearShares).toEqual(pooled.gearShares);
    });
  });

  it("shift rpm per team within ±3 % of OpenF1 car_data 2024 (every team, Bahrain, Jeddah and Lusail)", () => {
    const rows = shiftSessions.filter((session) => session.year === 2024).flatMap((session) => session.teams);
    expect(rows.length).toBeGreaterThanOrEqual(30);
    const worst = rows.reduce((max, team) => {
      const pt = powertrainFor({ year: 2024, layoutRef: "bahrain", manufacturer: team.manufacturer });
      expect(pt.manufacturer).toBe(team.manufacturer);
      Object.values(upshiftRpms(pt)).forEach((rpm) => {
        // The ramp's step overshoots the shift point by a few rpm at most.
        expect(Math.abs(rpm - pt.shiftRpm)).toBeLessThan(40);
        expect(Math.abs(rpm / team.shiftRpm - 1)).toBeLessThanOrEqual(0.03);
      });
      return Math.max(max, Math.abs(pt.shiftRpm / team.shiftRpm - 1));
    }, 0);
    // Measured 24/11: the real spread between teams is about ±1.5 %.
    expect(worst).toBeLessThanOrEqual(0.03);
    // 2023 and 2025 (same era block) stay within the same band.
    shiftSessions
      .filter((session) => session.year !== 2024)
      .flatMap((session) => session.teams.map((team) => ({ team, year: session.year })))
      .forEach(({ team, year }) => {
        const pt = powertrainFor({ year, manufacturer: team.manufacturer });
        expect(Math.abs(pt.shiftRpm / team.shiftRpm - 1)).toBeLessThanOrEqual(0.03);
      });
  });

  it("each power unit's gearbox gives its teams' real speed per rpm in 3rd to 8th (±4 %, OpenF1 2024)", () => {
    shiftSessions
      .filter((session) => session.year === 2024)
      .forEach((session) =>
        session.teams.forEach((team) => {
          const pt = powertrainFor({ year: 2024, manufacturer: team.manufacturer });
          for (let g = 3; g <= 8; g += 1) {
            const real = team.kmhPerKrpm[g - 1];
            if (real === null) continue;
            expect(Math.abs((pt.speedPerRpm[g - 1] * KMH * 1000) / real - 1)).toBeLessThanOrEqual(0.04);
          }
        })
      );
    // Gears 1-2 (rarely flat out in a race) keep the measured field shape; the top gear the era's fit.
    const field = powertrainFor({ year: 2024 });
    const ferrari = powertrainFor({ year: 2024, manufacturer: "ferrari" });
    expect(ferrari.speedPerRpm[0]).toBe(field.speedPerRpm[0]);
    expect(ferrari.speedPerRpm[7]).toBe(field.speedPerRpm[7]);
    for (let g = 1; g < 8; g += 1) expect(ferrari.speedPerRpm[g]).toBeGreaterThan(ferrari.speedPerRpm[g - 1]);
  });

  it("no manufacturer (or one the era does not list) is the era's car, unchanged", () => {
    const field = powertrainFor({ year: 2024, layoutRef: "bahrain" });
    expect(powertrainFor({ year: 2024, layoutRef: "bahrain", manufacturer: "audi" }).shiftRpm).toBe(field.shiftRpm);
    expect(field.shiftRpm).toBe(eraOf(2024).engine.shiftRpm);
    expect(Array.from(powertrainFor({ year: 2012, manufacturer: "ferrari" }).speedPerRpm)).toEqual(Array.from(powertrainFor({ year: 2012 }).speedPerRpm));
  });

  it("assignPowerUnits gives each car its unit, shared per manufacturer; the others keep the field's", () => {
    const pt = powertrainFor({ year: 2024, layoutRef: "monza" });
    const drive = createDrive(4);
    const pts = assignPowerUnits(pt, drive, ["Ferrari", "ferrari", null, "audi"]);
    expect(pts[0]).toBe(pts[1]);
    expect(pts[0].shiftRpm).toBe(eraOf(2024).manufacturers.ferrari.shiftRpm);
    expect(pts[0].args).toEqual(pt.args);
    expect(pts[2]).toBe(pt);
    expect(pts[3]).toBe(pt);
    // updateDrive reads drive.pts: at 11 920 rpm in 5th the Ferrari (shift 11 950) holds, the field's car (11 900) upshifts.
    [0, 2].forEach((i) => {
      const v = 11920 * pts[i].speedPerRpm[4];
      drive.gear[i] = 5;
      drive.vPrev[i] = v - 0.5;
      drive.lonA[i] = 2;
      updateDrive(pt, drive, i, v, 0, 0.25);
    });
    expect(drive.gear[0]).toBe(5);
    expect(drive.gear[2]).toBe(6);
    // 2012: no manufacturer measured, every car is the field's.
    const old = powertrainFor({ year: 2012 });
    expect(assignPowerUnits(old, createDrive(2), ["ferrari", "renault"]).every((entry) => entry === old)).toBe(true);
  });

  it("the pit limiter: 2nd gear at the limiter as in OpenF1 2024, rpm within ±5 % of the real", () => {
    const limiter = pitLimiterOf(eraOf(2024));
    expect(limiter).toEqual({ gear: 2, rpm: 6920 });
    shiftSessions
      .filter((session) => session.pitLimiter.gear !== null)
      .forEach((session) => {
        expect(session.pitLimiter.gear).toBe(limiter.gear);
        expect(Math.abs(session.pitLimiter.rpm / limiter.rpm - 1)).toBeLessThan(0.01);
      });
    const pt = powertrainFor({ year: 2024, layoutRef: "bahrain" });
    const limit = 80 / KMH;
    // Away from the box: 0 -> 80 km/h at ~3 m/s², then held; never above the limiter's gear.
    const away = [];
    for (let v = 0.6; v < limit; v += 0.75) away.push(v);
    for (let k = 0; k < 40; k += 1) away.push(limit);
    const gears = gearsOver(pt, away, { pitLane: true });
    expect(Math.max(...gears)).toBe(2);
    expect(gears[gears.length - 1]).toBe(2);
    expect(Math.abs(rpmOf(pt, 2, limit) / limiter.rpm - 1)).toBeLessThanOrEqual(0.05);
    // Coming in from the track (8th, braking to the limit): down to the limiter's gear and held there.
    const entry = [];
    for (let v = 60; v > limit; v -= 2.5) entry.push(v);
    for (let k = 0; k < 40; k += 1) entry.push(limit);
    const lane = gearsOver(pt, entry, { pitLane: true }, 0.25, 8);
    expect(lane.slice(-30).every((gear) => gear === 2)).toBe(true);
    // Without the option (as before this package) the box keeps the track's rules: a higher gear.
    const track = gearsOver(pt, entry, {}, 0.25, 8);
    expect(track[track.length - 1]).toBeGreaterThan(2);
  });

  it("pit limiter pending (eras before 2022, 2026) or not in the lane: the car shifts as before", () => {
    [1990, 2005, 2012, 2018, 2026].forEach((year) => expect(pitLimiterOf(eraOf(year))).toBeNull());
    const pt = powertrainFor({ year: 2012, layoutRef: "monza", circuitTop: 95 });
    const ramp = [];
    for (let v = 0.6; v < 40; v += 0.75) ramp.push(v);
    expect(gearsOver(pt, ramp, { pitLane: true })).toEqual(gearsOver(pt, ramp));
    const now = powertrainFor({ year: 2024 });
    expect(gearsOver(now, ramp, { pitLane: false, underSc: false })).toEqual(gearsOver(now, ramp));
  });

  it("under the safety car the upshift comes at the measured share of the shift rpm (OpenF1 2024-25), not before 2022", () => {
    const shares = shiftSessions.map((session) => session.underSc.share).filter((share) => share !== null);
    expect(shares.length).toBeGreaterThanOrEqual(3);
    expect(Math.abs(scShiftShareOf(2024) - median(shares))).toBeLessThanOrEqual(0.01);
    [1995, 2012, 2020, 2026].forEach((year) => expect(scShiftShareOf(year)).toBe(1));
    const pt = powertrainFor({ year: 2024 });
    const under = upshiftRpms(pt, pt.shiftRpm * pt.scShiftShare);
    Object.values(under).forEach((rpm) => expect(Math.abs(rpm / (pt.shiftRpm * 0.96) - 1)).toBeLessThan(0.005));
    // Through updateDrive: a car at 0.98 of the shift rpm, accelerating, upshifts only under the SC.
    const v = pt.shiftRpm * 0.98 * pt.speedPerRpm[3];
    const step = (opts) => {
      const drive = createDrive(1);
      drive.gear[0] = 4;
      drive.vPrev[0] = v - 0.5;
      drive.lonA[0] = 2;
      updateDrive(pt, drive, 0, v, 0, 0.25, opts);
      return drive.gear[0];
    };
    expect(step({})).toBe(4);
    expect(step({ underSc: true })).toBe(5);
  });

  it("all of it without randomness: the same inputs give the same gears (RF-SIM-15, RNF-05)", () => {
    const pt = powertrainFor({ year: 2024, layoutRef: "bahrain" });
    const speeds = [];
    for (let v = 0.6; v < 85; v += 0.9) speeds.push(v);
    const run = () => {
      const drive = createDrive(3);
      assignPowerUnits(pt, drive, ["mercedes", "ferrari", "renault"]);
      const out = [];
      speeds.forEach((v, k) => {
        for (let i = 0; i < 3; i += 1) updateDrive(pt, drive, i, v, 0, 0.25, { underSc: k % 2 === 0, pitLane: i === 2 });
        out.push(Array.from(drive.gear).join(","), Array.from(drive.rpm).join(","));
      });
      return out.join("|");
    };
    expect(run()).toBe(run());
  });
});
