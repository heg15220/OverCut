/**
 * WP3 of docs/manager/SIM-FISICA.md (§3.0, §3.7; RF-SIM-01, SRS 4.2): the step race spends each
 * lap's budget along the physical trace by band (race-physics.json `budget`), so the speed the
 * view reads from the snapshot (`v`) is a real one - top speed on the straights within ±5 % of the
 * measured race top speed (SIM-FISICA §4.2) - while the lap still lasts its budget (the SRS 4.2
 * equivalence is equivalence.test.js).
 *
 * PT-2 of docs/manager/F1M24-GAMEPLAY.md (§2.3 curvas-lentas; RF-SIM-01, RF-SIM-02, RNF-07): a bench
 * by numbered corner against OpenF1 car_data - the 2024 pole laps at Monza, Bahrain and the
 * Hungaroring (engine/sim/__fixtures__/openf1-powertrain.json `sessions` and `corners`,
 * overcut/src/main/resources/scripts/powertrain_from_openf1.py --corners). Per corner: the slowest
 * speed within ±10 % of the real one and the gear there within one. The corners that fail today are
 * listed, with what was measured, in KNOWN_OFF below (the slow ones, as §2.3 says); PT-3 tunes
 * race-physics.json / race-powertrain.json and removes them from the list.
 */

import { SIM_BALANCE, airEffect, fromQuickRace, snapshot, stepOnce } from "./index";
import { dirtyAt, sensAt } from "./trackTables";
import physicsData from "../../data/balance/race-physics.json";
import { packContext, weekend } from "./simTestKit";
import { circuitFor } from "../venue";
import telemetry from "./__fixtures__/openf1-powertrain.json";

let context = null;
beforeAll(async () => {
  context = await packContext();
});

/** The fastest any running car goes on track (no SC, not in the pit lane) over `laps` racing laps after lap 2. */
const raceTop = (year, circuit, laps = 6) => {
  const w = weekend({ year, circuit, context, seed: "speeds" });
  const state = fromQuickRace(w.make(), { race: w.race });
  let top = 0;
  let min = Infinity;
  const until = state.race.baseLap * (laps + 2);
  while (state.clock < until && !state.finished) {
    stepOnce(state);
    if (state.clock < state.race.baseLap * 2 || state.safetyCar) continue;
    snapshot(state).forEach((car) => {
      if (car.status !== "running" || car.inPit) return;
      top = Math.max(top, car.v);
      min = Math.min(min, car.v);
    });
  }
  return { top: top * 3.6, min: min * 3.6, state };
};

describe("WP3 · the budget spent by band (SIM-FISICA §3.0)", () => {
  it("the band weights average 1 over the lap, so a lap lasts its budget", () => {
    const { state } = raceTop(2024, "bahrain", 0);
    const t = state._sim.tables;
    let sum = 0;
    for (let j = 0; j < t.M; j += 1) sum += sensAt(t, (j + 0.5) / t.M);
    expect(sum / t.M).toBeCloseTo(1, 9);
    // Corners weigh more than straights: the extra time goes where tyres and fuel cost it.
    const straight = t.sens.reduce((low, value) => Math.min(low, value), Infinity);
    expect(straight).toBeLessThan(0.7);
    expect(Math.max(...t.sens)).toBeGreaterThan(1.2);
  });

  it.each([
    // SIM-FISICA §4.2: motorsport-total.com (Monza 2012, Räikkönen 346.0), FIA (Bahrain 2024, Hülkenberg 332.2).
    [2012, "monza", 346.0],
    [2024, "bahrain", 332.2],
  ])("%i %s: race top speed within ±5 %% of the real %f km/h", (year, circuit, real) => {
    const { top } = raceTop(year, circuit);
    expect(Math.abs(top / real - 1)).toBeLessThanOrEqual(0.05);
  });
});

describe("WP5 · dirty air by speed band, DRS at the end of its zone (SIM-FISICA §3.4)", () => {
  it.each([0.3, 0.6, 0.9])("at %f s behind, the lap loses the quick mode's dirty air (±10 %%)", (gap) => {
    const { state } = raceTop(2024, "bahrain", 0);
    const sim = state._sim;
    const t = sim.tables;
    const budget = state.race.baseLap;
    // Time lost over one lap at a fixed gap: the speed share lost in each corner bin times the time spent there.
    let lost = 0;
    for (let j = 0; j < t.M; j += 1) {
      const tau = (j + 0.5) / t.M;
      const d = t.dOfTau[j];
      const bin = Math.min(t.M - 1, Math.floor(d * t.M));
      if (!t.corner[bin]) continue;
      lost += -airEffect(sim, budget, gap, true, 0) * dirtyAt(t, tau) * (budget / t.M);
    }
    const quick = sim.dirtyLoss * (1 - gap / SIM_BALANCE.dirtyAir.windowSec);
    expect(Math.abs(lost / quick - 1)).toBeLessThanOrEqual(0.1);
  });

  it("fast corners lose more than slow ones", () => {
    const { state } = raceTop(2024, "bahrain", 0);
    const t = state._sim.tables;
    const kmhAt = (j) => t.vRef[j] * 3.6;
    let fast = 0;
    let slow = Infinity;
    for (let j = 0; j < t.M; j += 1) {
      if (t.dirtyW[j] === 0) continue;
      if (kmhAt(j) > physicsData.bands.fastMinKmh) fast = Math.max(fast, t.dirtyW[j]);
      if (kmhAt(j) < physicsData.bands.slowMaxKmh) slow = Math.min(slow, t.dirtyW[j]);
    }
    expect(fast).toBeGreaterThan(2 * slow);
  });

  it.each([[2012, "monza"], [2024, "bahrain"]])("%i %s: DRS is worth 8-14 km/h at the end of the zone (FIA estimate 10-12)", (year, circuit) => {
    const { state } = raceTop(year, circuit, 0);
    const t = state._sim.tables;
    const top = Math.max(...t.vRef) * 3.6;
    const gain = top * SIM_BALANCE.drs.speedGain;
    expect(gain).toBeGreaterThanOrEqual(8);
    expect(gain).toBeLessThanOrEqual(14);
  });
});

// ------------------------------------------------------------------ F1M24-GAMEPLAY §2.3 curvas-lentas (PT-2)

const KMH = 3.6;
/** Bench set-up (test parameters, not balance): the race lap measured, the tolerances of F1M24-GAMEPLAY §3.3. */
const BENCH = { lap: 4, seed: "powertrain", year: 2024, minTolerance: 0.1, gearTolerance: 1, prominenceMetres: 200, prominenceKmh: 8, matchShare: 0.015, offsetRange: 0.08, offsetStep: 0.002 };
const realSessions = [...telemetry.sessions, ...((telemetry.corners && telemetry.corners.sessions) || [])];

/**
 * Corners outside the tolerance today: "circuit:number" -> [sim km/h, real km/h, sim gear, real gear].
 *
 * Measured 24/11/2026 on feature/overcut-manager after wave 1 (race lap 4 of car 0, seed "powertrain",
 * against the pole lap; lap offsets -0.046 Monza, -0.038 Bahrain, RMS 29 / 25 km/h). 33 of 40 corners
 * are out, almost all on the slow side: the step race takes slow and medium corners 15-45 % under the
 * real minimum and one or two gears lower (Bahrain T1 48 against 71 km/h in 1st against 3rd), which is
 * what F1M24-GAMEPLAY §2.3 and SIM-FISICA §7 say (race-physics.json `budget` loads the slow band). Part
 * of the gap is the comparison itself - race fuel against a qualifying lap - but not 30 %. The few
 * where the sim is faster (Bahrain T2, T9; Hungaroring T7) are short links after a slow corner whose
 * real minimum comes later. Monza's calibrated layout counts 12 corners against the official 11
 * (Parabolica is split in two), so its T8-T12 are one number off the official ones; Bahrain and the
 * Hungaroring match the official count (calibratedCircuit.test.js). PT-3 (race-physics.json `mu.slow`,
 * `budget.slow`, race-powertrain.json `shift.downRpm`) removes entries as it brings them in.
 */
const KNOWN_OFF = {
  "monza:1": [72, 83, 1, 2],
  "monza:4": [91, 113, 2, 3],
  "monza:5": [98, 127, 2, 3],
  "monza:6": [153, 207, 5, 5],
  "monza:7": [124, 190, 3, 5],
  "monza:8": [131, 215, 4, 8],
  "monza:9": [174, 194, 4, 5],
  "monza:10": [200, 251, 5, 6],
  "monza:11": [115, 251, 3, 6],
  "monza:12": [172, 215, 4, 5],
  "bahrain:1": [48, 71, 1, 3],
  "bahrain:2": [111, 165, 3, 3],
  "bahrain:4": [85, 120, 2, 4],
  "bahrain:6": [146, 218, 4, 6],
  "bahrain:7": [190, 239, 5, 6],
  "bahrain:8": [58, 79, 1, 3],
  "bahrain:9": [150, 171, 4, 4],
  "bahrain:10": [58, 76, 1, 3],
  "bahrain:11": [105, 161, 3, 4],
  "bahrain:13": [103, 140, 3, 4],
  "bahrain:14": [81, 133, 2, 4],
  "hungaroring:1": [67, 95, 1, 3],
  "hungaroring:2": [110, 128, 3, 4],
  "hungaroring:3": [177, 245, 5, 6],
  "hungaroring:4": [167, 247, 5, 6],
  "hungaroring:5": [143, 162, 4, 4],
  "hungaroring:7": [166, 135, 4, 3],
  "hungaroring:8": [110, 181, 3, 4],
  "hungaroring:9": [156, 195, 3, 4],
  "hungaroring:11": [176, 238, 5, 6],
  "hungaroring:12": [93, 120, 2, 3],
  "hungaroring:13": [80, 103, 2, 3],
  "hungaroring:14": [91, 147, 2, 4],
};

/** The real lap as samples with distance share (distance integrated from speed). */
const realLapOf = (session) => {
  const out = [];
  let d = 0;
  session.lap.samples.forEach((row, k, all) => {
    if (k) d += ((row[1] + all[k - 1][1]) / 2 / KMH) * (row[0] - all[k - 1][0]);
    out.push({ d, kmh: row[1], gear: row[3] });
  });
  out.forEach((row) => {
    row.share = row.d / d;
  });
  return out;
};

const inSpan = (share, from, to) => {
  const f = ((from % 1) + 1) % 1;
  const t = ((to % 1) + 1) % 1;
  return f <= t ? share >= f && share <= t : share >= f || share <= t;
};

const benchCache = {};
/** Per numbered corner of `circuit`: the sim's slowest point in the corner and the real slowest there. */
const benchOf = (circuit) => {
  if (benchCache[circuit]) return benchCache[circuit];
  const w = weekend({ year: BENCH.year, circuit, context, seed: BENCH.seed });
  const state = fromQuickRace(w.make(), { race: w.race });
  const track = circuitFor(w.race, BENCH.year);
  const trace = [];
  while (!state.finished && state._sim.laps[0] <= BENCH.lap) {
    stepOnce(state);
    if (state._sim.laps[0] === BENCH.lap && !state.safetyCar) trace.push(snapshot(state)[0]);
  }
  const sim = trace.filter((car) => car.status === "running" && !car.inPit).sort((x, y) => x.share - y.share);
  const real = realLapOf(realSessions.find((session) => session.circuit === circuit && session.year === BENCH.year));
  const at = (share) => {
    let lo = 0;
    while (lo < sim.length - 1 && sim[lo + 1].share < share) lo += 1;
    return sim[lo];
  };
  // The spline's start and the timing line differ by a few per cent of the lap (SIM-FISICA §7): the
  // offset with the best speed match over the whole lap, as in powertrain.test.js.
  let best = { off: 0, err: Infinity };
  for (let off = -BENCH.offsetRange; off <= BENCH.offsetRange + 1e-9; off += BENCH.offsetStep) {
    const err = real.reduce((sum, row) => sum + (at((row.share + off + 1) % 1).v * KMH - row.kmh) ** 2, 0);
    if (err < best.err) best = { off, err };
  }
  // The real corners: local speed minima that the car brakes or lifts for (prominence on both sides).
  const prominent = real.filter((row, k) => {
    if (k === 0 || k === real.length - 1 || row.kmh > real[k - 1].kmh || row.kmh >= real[k + 1].kmh) return false;
    const near = (side) => real.filter((other) => Math.sign(other.d - row.d) === side && Math.abs(other.d - row.d) <= BENCH.prominenceMetres);
    return [-1, 1].every((side) => near(side).some((other) => other.kmh >= row.kmh + BENCH.prominenceKmh));
  });
  const circular = (a, b) => {
    const gap = Math.abs(a - b) % 1;
    return Math.min(gap, 1 - gap);
  };
  // Each sim corner (its slowest point) against a real minimum within matchShare of it on the aligned
  // lap, one to one, the closest pairs first; a corner the real car takes without slowing (no minimum
  // left near it) is compared with the real speed at that point.
  const rows = track.corners.map((corner) => {
    const simMin = sim.filter((car) => inSpan(car.share, corner.from, corner.to)).reduce((low, car) => (!low || car.v < low.v ? car : low), null);
    const realShare = simMin ? (simMin.share - best.off + 1) % 1 : null;
    return { corner, simMin, realShare };
  });
  const pairs = [];
  rows.forEach((row, index) => {
    if (row.realShare === null) return;
    prominent.forEach((minimum) => {
      const gap = circular(minimum.share, row.realShare);
      if (gap <= BENCH.matchShare) pairs.push({ index, minimum, gap });
    });
  });
  pairs.sort((x, y) => x.gap - y.gap || x.index - y.index);
  const matched = new Map();
  const taken = new Set();
  pairs.forEach(({ index, minimum, gap }) => {
    if (matched.has(index) || taken.has(minimum)) return;
    matched.set(index, { minimum, gap });
    taken.add(minimum);
  });
  const corners = rows.map(({ corner, simMin, realShare }, index) => {
    let realMin = matched.get(index)?.minimum || null;
    if (!realMin && realShare !== null) realMin = real.reduce((near, row) => (!near || circular(row.share, realShare) < circular(near.share, realShare) ? row : near), null);
    return {
      number: corner.number,
      kind: corner.kind,
      matched: matched.has(index),
      sim: simMin && { kmh: simMin.v * KMH, gear: simMin.gear },
      real: realMin && { kmh: realMin.kmh, gear: realMin.gear, metres: Math.round(realMin.d) },
    };
  });
  benchCache[circuit] = { offset: best.off, rms: Math.sqrt(best.err / real.length), samples: sim.length, corners };
  return benchCache[circuit];
};

const withinTolerance = (row) =>
  Math.abs(row.sim.kmh / row.real.kmh - 1) <= BENCH.minTolerance && Math.abs(row.sim.gear - row.real.gear) <= BENCH.gearTolerance;

const benchCircuits = realSessions.filter((session) => session.year === BENCH.year).map((session) => session.circuit);
const benchCases = benchCircuits.flatMap((circuit) =>
  circuitFor({ circuit }, BENCH.year).corners.map((corner) => [circuit, corner.number, corner.kind]),
);

describe("PT-2 · corner bench against OpenF1 2024 (F1M24-GAMEPLAY §2.3 curvas-lentas; RF-SIM-01, RF-SIM-02)", () => {
  it("the fixture has a slow circuit beside Monza and Bahrain (Hungaroring 2024 pole lap, Norris 1:15.227)", () => {
    const hungaroring = realSessions.find((session) => session.circuit === "hungaroring");
    expect(hungaroring.year).toBe(2024);
    expect(hungaroring.lap.lapTime).toBeCloseTo(75.227, 3);
    expect(hungaroring.lap.samples.length).toBeGreaterThan(250);
    // The calibrated layout numbers the official 14 corners (f1db circuit_layout.turns), so its T-numbers are the real ones.
    expect(circuitFor({ circuit: "hungaroring" }, 2024).corners).toHaveLength(14);
    expect(benchCases.length).toBeGreaterThanOrEqual(35);
  });

  it.each(benchCircuits)("%s: the step race lap and the real lap line up (offset inside the range, every corner seen)", (circuit) => {
    const bench = benchOf(circuit);
    expect(bench.samples).toBeGreaterThan(100);
    expect(Math.abs(bench.offset)).toBeLessThan(BENCH.offsetRange);
    expect(bench.corners).toHaveLength(benchCases.filter(([c]) => c === circuit).length);
    bench.corners.forEach((row) => {
      expect(row.sim).not.toBeNull();
      expect(row.real).not.toBeNull();
    });
  });

  it.each(benchCases.filter(([circuit, number]) => !KNOWN_OFF[`${circuit}:${number}`]))(
    "%s T%i (%s): slowest speed within ±10 %% of the real one, gear within one",
    (circuit, number) => {
      const row = benchOf(circuit).corners.find((corner) => corner.number === number);
      expect(Math.abs(row.sim.kmh / row.real.kmh - 1)).toBeLessThanOrEqual(BENCH.minTolerance);
      expect(Math.abs(row.sim.gear - row.real.gear)).toBeLessThanOrEqual(BENCH.gearTolerance);
    },
  );

  it("the corners outside the tolerance today are the documented ones and no other (PT-3 empties KNOWN_OFF)", () => {
    const off = {};
    benchCircuits.forEach((circuit) =>
      benchOf(circuit).corners.forEach((row) => {
        if (!withinTolerance(row)) off[`${circuit}:${row.number}`] = [Math.round(row.sim.kmh), row.real.kmh, row.sim.gear, row.real.gear];
      }),
    );
    if (process.env.PT2_PRINT) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(off), benchCircuits.map((c) => `${c} ${benchOf(c).offset.toFixed(3)} ${benchOf(c).rms.toFixed(1)}`), JSON.stringify(benchCircuits.map((c) => benchOf(c).corners)));
    }
    Object.keys(off).forEach((key) => expect([key, KNOWN_OFF[key] !== undefined]).toEqual([key, true]));
  });
});
