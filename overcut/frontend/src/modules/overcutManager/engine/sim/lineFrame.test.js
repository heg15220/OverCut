/**
 * SIM-C1 (F1M24-CHINA §1.5, §3.3 ola 1; GS-07, VIEW-08 motor, GS-03; RF-3D-03, RF-SIM-01, RF-SIM-06,
 * RF-SIM-11, RF-SIM-15, RNF-05, RNF-07, criterio 7.2): one racing line for engine and view, and the
 * contracts wave 1 fixes for the other lanes.
 *
 *   - engine/trackData.js positionAt(P, lat) places a car exactly where the live view draws it
 *     (components/raceClock.js offsetPose + three/racingLine.js onRacingLine), calibrated and sketch;
 *   - the snapshot publishes `lineOffset` and `axisOffset` in every phase on the road (start, safety car)
 *     and null in the pit lane; `snapshot.weather {state, rainRate, waterMm {line, off, sectors}}` and
 *     `snapshot.spray[i]` (0..1) read from engine/weather, 0 in the dry, deterministic by seed;
 *   - the race-control kinds of §1.5 are declared;
 *   - VIEW-08 (engine): at Shanghai the line is ≥ 3 m to the outside 50 m before T14's turn-in;
 *   - GS-07: away from a duel, a car's mean lateral off the line at the apices is ≤ 1.5 m;
 *   - GS-03 data: race-sim.json traffic.minFollowSec covers every season with a source and a status.
 *
 * The 64 races of SIM-2 with the view's safety pass (0 corrections) and the GS-03 percentile run in
 * lateral.test.js and lateral1988.test.js (they share the watched races).
 */

import Ajv from "ajv";
import simData from "../../data/balance/race-sim.json";
import schema from "../packs/schema/race-sim.schema.json";
import { createRace } from "../race";
import { weekendRaceArgs } from "../career";
import { lineAt, positionAt, trackDataFor } from "../trackData";
import { poseAt } from "../trackGeometry";
import { offsetPose } from "../../components/raceClock";
import { onRacingLine } from "../../three/racingLine";
import { fromQuickRace, requestPit, snapshot, stepFor, stepOnce } from "./index";
import { deployNeutralisation } from "./safetyCar";
import { CONTROL_KINDS, minFollowSecOf } from "./stepRace";
import { ROLE } from "./duel";
import { LANE } from "./lateral";
import { weekend } from "./simTestKit";

const stepRaceOf = (options) => {
  const w = weekend(options);
  return fromQuickRace(w.make(), { race: w.race });
};

describe("SIM-C1 GS-07 · positionAt is where the view draws the car (RF-3D-03)", () => {
  it.each([
    [2024, "ferrari", null],
    [1988, "mclaren", null],
    [2024, "ferrari", "shanghai"],
  ])("%i %s %s: same x, y and heading as raceClock + racingLine to 1e-9 m", (year, teamId, circuit) => {
    const state = stepRaceOf({ seed: "line", year, teamId, circuit });
    const track = state._sim.side.track;
    let worst = 0;
    for (let t = 0; t < 1500; t += 1) {
      const P = 3 + t / 1500 + 0.000137;
      const lat = ((t % 9) - 4) * 1.3;
      const a = positionAt(track, P, lat);
      const b = onRacingLine(track, { ...offsetPose(poseAt(track, P - Math.floor(P)), lat), progress: P, lateral: lat });
      worst = Math.max(worst, Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.heading - b.heading));
      expect(a.axisOffset).toBeCloseTo(a.lineOffset + lat, 12);
      expect(a.lineOffset).toBeCloseTo(b.lineOffset, 9);
    }
    expect(worst).toBeLessThan(1e-9);
  });

  it("the line's offset sits inside the measured asphalt", () => {
    const state = stepRaceOf({ seed: "line", year: 2024, circuit: "shanghai" });
    const track = state._sim.side.track;
    const td = trackDataFor(track);
    const n = track.points.length;
    for (let k = 0; k < n; k += 1) {
      const { offset } = lineAt(track, k / n, 0);
      expect(offset).toBeLessThanOrEqual(td.wr[k] - td.marginM + 1e-6);
      expect(offset).toBeGreaterThanOrEqual(-(td.wl[k] - td.marginM) - 1e-6);
    }
  });
});

describe("SIM-C1 VIEW-08 (engine) · Shanghai T14 on the racing line", () => {
  it("50 m before the turn-in the line is at least 3 m to the outside of the hairpin", () => {
    const state = stepRaceOf({ seed: "line", year: 2024, circuit: "shanghai" });
    const track = state._sim.side.track;
    const td = trackDataFor(track);
    const t14 = track.corners.find((corner) => corner.number === 14);
    expect(t14).toBeTruthy();
    const n = track.points.length;
    const apex = Math.floor((((t14.apex ?? (t14.from + t14.to) / 2) % 1) * n)) % n;
    // The hairpin turns towards the sign of the line's curvature (trackData kappa): the outside is the other side.
    const outside = -Math.sign(td.kappa[apex]);
    expect(outside).not.toBe(0);
    const before = t14.from - 50 / track.length;
    expect(outside * lineAt(track, before, 0).offset).toBeGreaterThanOrEqual(3);
  });
});

describe("SIM-C1 snapshot contracts (F1M24-CHINA §1.5, §3.2)", () => {
  it("lineOffset and axisOffset for every car on the road: on the grid at lights out, racing, behind the safety car; null in the pit lane", () => {
    const state = stepRaceOf({ seed: "contract", year: 2024 });
    const sim = state._sim;
    // Every car checked is counted as good or bad: in the pit lane both fields null; on the road finite and equal
    // (to the millimetre of the snapshot's rounding) to positionAt's.
    const seen = { pit: 0, road: 0, bad: [] };
    const check = () => {
      snapshot(state).forEach((car, i) => {
        if (car.inPit) {
          seen.pit += 1;
          if (car.lineOffset !== null || car.axisOffset !== null) seen.bad.push(`pit ${i}`);
        } else if (sim.active[i]) {
          seen.road += 1;
          const pose = positionAt(sim.side.track, car.progress, car.lateral);
          const ok = Number.isFinite(car.lineOffset) && Math.abs(car.lineOffset - pose.lineOffset) < 2e-3 && Math.abs(car.axisOffset - (car.lineOffset + car.lateral)) < 2e-3;
          if (!ok) seen.bad.push(`road ${i} t=${sim.clock}`);
        }
      });
    };
    while (!sim.started) stepOnce(state);
    check();
    stepFor(state, 600);
    check();
    deployNeutralisation(state, { virtual: false, reason: "accident", share: 0.4, corner: 4, rules: sim.rules, lap: sim.leaderLap });
    requestPit(state, state.cars[0].id, "hard");
    let sc = 0;
    let pits = 0;
    for (let k = 0; k < 2400 && (sc < 200 || pits === 0); k += 1) {
      stepOnce(state);
      check();
      if (state.safetyCar) sc += 1;
      if (sim.inPit[0] !== 0) pits += 1;
    }
    expect(sc).toBeGreaterThan(0);
    expect(pits).toBeGreaterThan(0);
    expect(seen.pit).toBeGreaterThan(0);
    expect(seen.road).toBeGreaterThan(1000);
    expect(seen.bad).toEqual([]);
  });

  it("weather and spray in the dry: the water as engine/weather has it, no spray", () => {
    const state = stepRaceOf({ seed: "dry", year: 2024 });
    stepFor(state, 300);
    const shot = snapshot(state);
    expect(shot.weather).toEqual(
      expect.objectContaining({ state: expect.any(String), rainRate: expect.any(Number), waterMm: expect.objectContaining({ line: expect.any(Number), off: expect.any(Number), sectors: expect.any(Array) }) }),
    );
    expect(shot.weather.waterMm.sectors).toHaveLength(3);
    expect(shot.spray).toHaveLength(state.cars.length);
    const dry = shot.weather.waterMm.line === 0 && shot.weather.waterMm.sectors.every((h) => h === 0);
    expect(dry ? shot.spray.filter((value) => value !== 0) : []).toEqual([]);
  });

  it("weather and spray in the rain: spray in 0..1, thrown by the cars running on the wet line, none in the pit lane, the same with the same seed (RNF-05)", () => {
    const run = () => {
      const w = weekend({ seed: "rain", year: 2024, circuit: "silverstone" });
      const args = { ...weekendRaceArgs(w.career), weatherStart: 4 };
      const state = fromQuickRace(createRace(args), { race: w.race });
      const shots = [];
      for (let k = 0; k < 40; k += 1) {
        stepFor(state, 30);
        const shot = snapshot(state);
        shots.push({ spray: shot.spray.slice(), weather: shot.weather, pit: shot.map((car) => car.inPit) });
      }
      return shots;
    };
    const a = run();
    expect(run()).toEqual(a);
    let wet = 0;
    a.forEach((shot) => {
      expect(shot.spray.filter((value) => !(value >= 0 && value <= 1))).toEqual([]);
      expect(shot.spray.filter((value, i) => shot.pit[i] && value !== 0)).toEqual([]);
      if (shot.weather.waterMm.line > 0) wet += shot.spray.filter((value) => value > 0).length;
    });
    expect(wet).toBeGreaterThan(0);
  });

  it("declares the race-control kinds of §1.5 (emitted by the packages that own them)", () => {
    expect(CONTROL_KINDS).toEqual(expect.arrayContaining(["drsEnabled", "drsDisabled", "climaticChange", "wetTrack", "slippery", "lowGrip"]));
  });
});

describe("SIM-C1 GS-07 · away from a duel the car is on the line at the apex", () => {
  it("mean |lateral| at the apices, racing and not in a duel, ≤ 1.5 m (2024, 4 races)", () => {
    let sum = 0;
    let count = 0;
    ["apex-1", "apex-2", "apex-3", "apex-4"].forEach((seed) => {
      const state = stepRaceOf({ seed, year: 2024 });
      const sim = state._sim;
      const apices = [...sim.cornerRange.values()].map((range) => range.apex);
      const half = 3 / sim.tables.length;
      while (!state.finished) {
        stepOnce(state);
        if (!sim.started || state.safetyCar) continue;
        for (let i = 0; i < sim.n; i += 1) {
          if (!sim.active[i] || sim.inPit[i] !== 0 || sim.duelRole[i] !== ROLE.NONE || sim.latState[i] !== LANE.RACING) continue;
          const d = sim.P[i] - Math.floor(sim.P[i]);
          if (apices.some((apex) => Math.abs(d - apex) < half)) {
            sum += Math.abs(sim.lat[i]);
            count += 1;
          }
        }
      }
    });
    expect(count).toBeGreaterThan(1000);
    expect(sum / count).toBeLessThanOrEqual(1.5);
  }, 300000);
});

describe("SIM-C1 GS-03 data · race-sim.json traffic.minFollowSec (RNF-07, SRS §6)", () => {
  it("passes the schema", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(simData) || validate.errors).toBe(true);
  });

  it("covers 1950-2026 with contiguous eras, each with a source and a status (pending until OpenF1 is measured)", () => {
    const eras = simData.traffic.minFollowSec.eras;
    expect(eras[0].from).toBeLessThanOrEqual(1950);
    for (let k = 1; k < eras.length; k += 1) expect(eras[k].from).toBe(eras[k - 1].to + 1);
    expect(eras[eras.length - 1].to).toBeGreaterThanOrEqual(2026);
    eras.forEach((era) => {
      expect(era.source.length).toBeGreaterThan(10);
      expect(["source", "measured", "pending"]).toContain(era.status);
      expect(era.value).toBeGreaterThan(0);
    });
  });

  it("reads the era's value, and 0 without the key (the behaviour before)", () => {
    expect(minFollowSecOf(simData.traffic, 2013)).toBe(simData.traffic.minFollowSec.eras.find((era) => era.from <= 2013 && era.to >= 2013).value);
    expect(minFollowSecOf({ minGapMetres: 7.5 }, 2013)).toBe(0);
    expect(minFollowSecOf(simData.traffic, NaN)).toBe(0);
  });
});
