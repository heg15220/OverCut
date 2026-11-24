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
 *
 * PT-3 (same §2.3; RF-SIM-01, RF-SIM-02): the sim lap is a race lap, so the bench now compares it with
 * the real race laps - the pole sitter's clean first-stint laps of the same GP (fixture `raceLaps`,
 * powertrain_from_openf1.py --racelaps) - at the corner found on the pole lap; same ±10 % and ±1 gear.
 * It also checks the race pace of the step race against those laps and measures, by the sim's own
 * bands, where the real race lap loses its time against the pole lap (the numbers race-physics.json
 * `budget.sensitivity` stands for). What it found is in the KNOWN_OFF note: the gap is in the trace
 * the race runs, not in the budget or the gearbox, and the trace is outside PT's files.
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
const BENCH = { lap: 4, seed: "powertrain", year: 2024, minTolerance: 0.1, gearTolerance: 1, prominenceMetres: 200, prominenceKmh: 8, matchShare: 0.015, offsetRange: 0.08, offsetStep: 0.002, minRaceLaps: 4, paceTolerance: 0.03, raceShare: 0.006 };
const realSessions = [...telemetry.sessions, ...((telemetry.corners && telemetry.corners.sessions) || [])];

/**
 * Corners outside the tolerance today: "circuit:number" -> [sim km/h, real race km/h, sim gear, real race gear].
 *
 * Measured 24/11/2026 on wp/PT-3 (feature/overcut-manager after wave 2; race lap 4 of car 0, seed
 * "powertrain", against the median of the pole sitter's clean race laps 3-8; lap offsets -0.046 Monza,
 * -0.038 Bahrain, -0.030 Hungaroring). 27 of 40 corners are out (33 against the pole lap, PT-2), almost
 * all on the slow side: slow and medium corners 10-40 % under the real race minimum and one or two gears
 * lower; the gear follows the speed (at the real speed the shift logic gives the real gear on the real
 * trace, powertrain.test.js), so no race-powertrain.json change helps. PT-3 measured where the gap comes
 * from (probe runs on 24/11; points 1 and 4 are the tests below, PT2_PRINT=1 / PT3_PRINT=1 print them):
 *
 *  1. The budget is right: the step race's lap 4 lasts the real first-stint race lap within 2 % (test
 *     below), so the corners are not slow because the lap is.
 *  2. The trace the race runs is the slow part. Its corner minima (circuit.speed, the best car's
 *     qualifying lap) are already 15-30 % under the real pole minima (Bahrain T1 55 against 71, T6 164
 *     against 218), while its lap is the pole's: too slow in the corners, too fast elsewhere.
 *     Two causes outside PT's files (F1M24-GAMEPLAY §3.2):
 *     a. engine/venue.js caches circuits by era bucket (BUCKETS ends at 2017, so every year from 2017 is
 *        built as 2020 and 2009-2016 as 2016): a 2024 race runs the 2017-2021 car of race-physics.json
 *        (μ 1.44, ClA 7.4), not the 2022-2025 one the physics test calibrates (μ 1.9, ClA 4.6). With the
 *        2022-2025 car the bench passes 11 of 40 against the pole lap instead of 7.
 *     b. The racing line's curvature: venue.js does not pass splines.json `kappa` (the pipeline's
 *        curvature that physics.test.js calibrates the poles on), so the race takes the Menger curvature
 *        of the line, tighter in the medium corners; even with the right car and `kappa`, Bahrain T6/T7,
 *        the Hungaroring T3/T4/T8/T11/T14 and Monza's Lesmos stay 20-30 % slow, which is the line in
 *        splines.json (PIT lane) or its extraction. Monza's calibrated layout also counts 12 corners
 *        against the official 11 (Parabolica split), so its T8-T12 are one number off.
 *  3. race-physics.json mu.slow is not the lever: with the 2017-2021 car the trace is the one PT could
 *     change, but that block is the 2017-2021 cars' own calibration (SRS §6: a 2024 number does not go
 *     into another era), and the 2022-2025 block is not what the race reads (2a).
 *  4. budget.sensitivity, measured here for the first time (OpenF1 race laps against the pole lap, test
 *     below): straights lose 0.72-0.81 of the lap's average, slow corners 1.12-1.28, medium 1.34-1.40
 *     (Monza 2.7), fast 0.62-1.12; the json has 0.42-0.49 / 1.63-2.10 / 1.47-1.89 / 1.25-1.61 after
 *     normalisation. Applying the measured weights on today's trace loses two corners, drops Bahrain's
 *     race top speed to the edge of its ±5 % and brings a safety car into Monza's lap 4: the old weights
 *     partly make up for the trace. Left as they are, the measurement written in race-physics.json
 *     `budget.$comment` as pending until 2a and 2b are fixed (then re-run this bench).
 */
const KNOWN_OFF = {
  "monza:4": [91, 104, 2, 3],
  "monza:5": [98, 116, 2, 3],
  "monza:6": [153, 174, 5, 4],
  "monza:7": [124, 164, 3, 4],
  "monza:8": [131, 179, 4, 4],
  "monza:10": [200, 240, 5, 6],
  "monza:11": [115, 206, 3, 5],
  "bahrain:1": [49, 63, 1, 3],
  "bahrain:2": [112, 155, 3, 4],
  "bahrain:4": [86, 117, 2, 4],
  "bahrain:6": [148, 176, 4, 5],
  "bahrain:8": [60, 74, 1, 3],
  "bahrain:10": [59, 70, 1, 3],
  "bahrain:11": [109, 149, 3, 4],
  "bahrain:13": [102, 131, 3, 4],
  "bahrain:14": [80, 117, 2, 4],
  "hungaroring:1": [67, 85, 1, 3],
  "hungaroring:3": [177, 228, 5, 5],
  "hungaroring:4": [167, 210, 5, 5],
  "hungaroring:6": [117, 102, 3, 3],
  "hungaroring:7": [166, 121, 4, 3],
  "hungaroring:8": [110, 150, 3, 4],
  "hungaroring:10": [247, 218, 6, 5],
  "hungaroring:11": [176, 206, 5, 6],
  "hungaroring:12": [93, 108, 2, 3],
  "hungaroring:13": [80, 94, 2, 3],
  "hungaroring:14": [91, 130, 2, 4],
};

/** The real lap as samples with distance share (distance integrated from speed). */
const realLapOf = (session) => {
  const out = [];
  let d = 0;
  session.lap.samples.forEach((row, k, all) => {
    if (k) d += ((row[1] + all[k - 1][1]) / 2 / KMH) * (row[0] - all[k - 1][0]);
    out.push({ t: row[0], d, kmh: row[1], gear: row[3] });
  });
  out.forEach((row) => {
    row.share = row.d / d;
  });
  return out;
};

/** PT-3: the pole sitter's clean first-stint race laps of the same GP (fixture `raceLaps`), as realLapOf rows. */
const raceSessionOf = (circuit) => ((telemetry.raceLaps && telemetry.raceLaps.sessions) || []).find((session) => session.circuit === circuit && session.year === BENCH.year) || null;
const raceLapsOf = (circuit) => {
  const session = raceSessionOf(circuit);
  return session ? session.laps.map((lap) => realLapOf({ lap })) : [];
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
  // PT-3: the sim runs a race lap, so the reference is the real race lap (like for like): at the point
  // found on the pole lap, each clean first-stint race lap's slowest sample within matchShare, the
  // median over the laps (raceLapsOf). The pole's own minimum stays in `pole` for the record.
  const raceLaps = raceLapsOf(circuit);
  const corners = rows.map(({ corner, simMin, realShare }, index) => {
    let realMin = matched.get(index)?.minimum || null;
    if (!realMin && realShare !== null) realMin = real.reduce((near, row) => (!near || circular(row.share, realShare) < circular(near.share, realShare) ? row : near), null);
    // A matched corner: each race lap's slowest sample within raceShare of the pole's minimum; a corner
    // the pole car takes without slowing: each race lap's sample nearest that point.
    const pick = (lap) =>
      matched.has(index)
        ? lap.filter((row) => circular(row.share, realMin.share) <= BENCH.raceShare).reduce((low, row) => (!low || row.kmh < low.kmh ? row : low), null)
        : lap.reduce((near, row) => (!near || circular(row.share, realMin.share) < circular(near.share, realMin.share) ? row : near), null);
    const raceMins = realMin ? raceLaps.map(pick).filter(Boolean).sort((x, y) => x.kmh - y.kmh || x.gear - y.gear) : [];
    const race = raceMins.length ? raceMins[raceMins.length >> 1] : null;
    return {
      number: corner.number,
      kind: corner.kind,
      matched: matched.has(index),
      sim: simMin && { kmh: simMin.v * KMH, gear: simMin.gear },
      pole: realMin && { kmh: realMin.kmh, gear: realMin.gear, metres: Math.round(realMin.d) },
      real: race && { kmh: race.kmh, gear: race.gear, laps: raceMins.length },
    };
  });
  benchCache[circuit] = { offset: best.off, rms: Math.sqrt(best.err / real.length), samples: sim.length, corners, tables: state._sim.tables, budget: state._sim.budget[0] };
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

  it.each(benchCircuits)("%s: the step race lap and the real laps line up (offset inside the range, every corner seen)", (circuit) => {
    const bench = benchOf(circuit);
    expect(bench.samples).toBeGreaterThan(100);
    expect(Math.abs(bench.offset)).toBeLessThan(BENCH.offsetRange);
    expect(bench.corners).toHaveLength(benchCases.filter(([c]) => c === circuit).length);
    bench.corners.forEach((row) => {
      expect(row.sim).not.toBeNull();
      expect(row.pole).not.toBeNull();
      expect(row.real).not.toBeNull();
      expect(row.real.laps).toBeGreaterThanOrEqual(BENCH.minRaceLaps);
    });
  });

  it.each(benchCases.filter(([circuit, number]) => !KNOWN_OFF[`${circuit}:${number}`]))(
    "%s T%i (%s): slowest speed within ±10 %% of the real race lap's, gear within one",
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

  it("KNOWN_OFF holds no corner that is already inside the tolerance (a fixed corner leaves the list)", () => {
    const fixed = Object.keys(KNOWN_OFF).filter((key) => {
      const [circuit, number] = key.split(":");
      const row = benchOf(circuit).corners.find((corner) => corner.number === Number(number));
      return row && withinTolerance(row);
    });
    expect(fixed).toEqual([]);
  });
});

// ------------------------------------------------------------------ F1M24-GAMEPLAY §2.3 curvas-lentas (PT-3)

/** Time (s) the lap `rows` (realLapOf) spends between distance shares a and b (b < a wraps the line). */
const spanTime = (rows, lapTime, a, b) => {
  const timeAt = (s) => {
    if (s <= rows[0].share) return 0;
    for (let k = 1; k < rows.length; k += 1) {
      if (rows[k].share >= s) return rows[k - 1].t + ((rows[k].t - rows[k - 1].t) * (s - rows[k - 1].share)) / Math.max(1e-12, rows[k].share - rows[k - 1].share);
    }
    return rows[rows.length - 1].t;
  };
  // The samples stop a fraction of a second short of the line: scale to the timed lap.
  const scale = lapTime / timeAt(1);
  return (b >= a ? timeAt(b) - timeAt(a) : timeAt(1) - timeAt(a) + timeAt(b)) * scale;
};

const BANDS = ["slow", "medium", "fast", "straight"];

/**
 * Where the real race lap loses its time against the pole lap, in the step race's own bands
 * (race-physics.json `budget`: corner by the trace's speed band, straight off the corners), on the
 * lap aligned by the bench. Per band the share of extra time per second of pole time, over the
 * lap's: the number `budget.sensitivity` stands for after normalisation (sens in trackTables).
 */
const bandLossOf = (circuit) => {
  const bench = benchOf(circuit);
  const t = bench.tables;
  const session = realSessions.find((s) => s.circuit === circuit && s.year === BENCH.year);
  const pole = realLapOf(session);
  const laps = raceSessionOf(circuit).laps.map((lap) => ({ rows: realLapOf({ lap }), lapTime: lap.lapTime }));
  const { slowMaxKmh, fastMinKmh } = physicsData.bands;
  const acc = Object.fromEntries(BANDS.map((band) => [band, { pole: 0, race: 0, sens: 0, share: 0 }]));
  for (let j = 0; j < t.M; j += 1) {
    const bin = Math.min(t.M - 1, Math.floor(((t.dOfTau[j] + t.dOfTau[j + 1]) / 2) * t.M));
    const kmh = t.vRef[j] * KMH;
    const band = !t.corner[bin] ? "straight" : kmh < slowMaxKmh ? "slow" : kmh > fastMinKmh ? "fast" : "medium";
    const a = (((t.dOfTau[j] - bench.offset) % 1) + 1) % 1;
    const b = (((t.dOfTau[j + 1] - bench.offset) % 1) + 1) % 1;
    acc[band].pole += spanTime(pole, session.lap.lapTime, a, b);
    acc[band].race += laps.reduce((sum, lap) => sum + spanTime(lap.rows, lap.lapTime, a, b), 0) / laps.length;
    acc[band].sens += t.sens[j] / t.M;
    acc[band].share += 1 / t.M;
  }
  const pole2 = BANDS.reduce((sum, band) => sum + acc[band].pole, 0);
  const race2 = BANDS.reduce((sum, band) => sum + acc[band].race, 0);
  const lapLoss = (race2 - pole2) / pole2;
  const real = {};
  const sim = {};
  BANDS.forEach((band) => {
    real[band] = (acc[band].race - acc[band].pole) / acc[band].pole / lapLoss;
    sim[band] = acc[band].share > 0 ? acc[band].sens / acc[band].share : 0;
  });
  return { real, sim, pole: pole2, race: race2, poleTime: acc, lapLoss };
};

describe("PT-3 · race laps against the pole lap (F1M24-GAMEPLAY §2.3 curvas-lentas; RF-SIM-01, RF-SIM-02)", () => {
  it.each(benchCircuits)("%s: the fixture has clean first-stint race laps of the pole sitter (OpenF1, no stop, no SC/VSC)", (circuit) => {
    const session = raceSessionOf(circuit);
    const pole = realSessions.find((s) => s.circuit === circuit && s.year === BENCH.year);
    expect(session).not.toBeNull();
    expect(session.driver).toBe(pole.lap.driver);
    expect(session.laps.length).toBeGreaterThanOrEqual(BENCH.minRaceLaps);
    session.laps.forEach((lap) => {
      expect(lap.samples.length).toBeGreaterThan(250);
      // A race lap is slower than the pole lap, by fuel and tyres, not by an incident.
      expect(lap.lapTime / pole.lap.lapTime).toBeGreaterThan(1.02);
      expect(lap.lapTime / pole.lap.lapTime).toBeLessThan(1.15);
    });
  });

  it.each(benchCircuits)("%s: the step race's lap budget is the real race pace (±3 %% of the median clean lap)", (circuit) => {
    const times = raceSessionOf(circuit).laps.map((lap) => lap.lapTime).sort((x, y) => x - y);
    const median = times[times.length >> 1];
    expect(Math.abs(benchOf(circuit).budget / median - 1)).toBeLessThanOrEqual(BENCH.paceTolerance);
  });

  it("the real race lap loses its time mostly in the corners and least on the straights (OpenF1, every circuit)", () => {
    const rows = benchCircuits.map((circuit) => [circuit, bandLossOf(circuit)]);
    if (process.env.PT3_PRINT) {
      // eslint-disable-next-line no-console
      console.log(rows.map(([circuit, r]) => `${circuit} +${(r.lapLoss * 100).toFixed(1)} % real ${BANDS.map((b) => `${b} ${r.real[b].toFixed(2)}`).join(" ")} | sim ${BANDS.map((b) => `${b} ${r.sim[b].toFixed(2)}`).join(" ")}`).join("\n"));
    }
    rows.forEach(([, r]) => {
      expect(r.lapLoss).toBeGreaterThan(0.02);
      // Straights lose less than the lap on average, in the data and in the sim's weights.
      expect(r.real.straight).toBeLessThan(1);
      expect(r.sim.straight).toBeLessThan(1);
      // The slow and medium corners lose more than the lap on average, in the data and in the sim.
      expect(r.real.slow).toBeGreaterThan(1);
      expect(r.real.medium).toBeGreaterThan(1);
      expect(r.sim.slow).toBeGreaterThan(1);
      expect(r.sim.medium).toBeGreaterThan(1);
    });
  });
});