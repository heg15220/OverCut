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
 *
 * PT-C1 of docs/manager/F1M24-CHINA.md (§2.1 GS-02; RF-SIM-01, RF-SIM-02, RNF-07): the same bench at
 * Shanghai, 2024 against OpenF1 (fixture `china`: Verstappen's pole lap, session 9664, and his clean race
 * laps, 9673) and 2013 against those laps scaled by the f1db lap ratio (no public telemetry for 2013:
 * ±12 %, NV); the pole of the physical trace; and race-physics.json `budget.radiusExponent`, the share of
 * the band's budget by corner radius, fitted on the OpenF1 race laps of every bench circuit.
 */

import { SIM_BALANCE, airEffect, fromQuickRace, snapshot, stepOnce } from "./index";
import { dirtyAt, sensAt } from "./trackTables";
import physicsData from "../../data/balance/race-physics.json";
import { packContext, weekend } from "./simTestKit";
import { circuitFor } from "../venue";
import { budgetBandOf, budgetWeights, carFor, quarterPower, radiusAt, radiusExponentOf, splineLap } from "./physics";
import splineData from "../../data/splines.json";
import pack2013 from "../../data/seasons/2013.json";
import pack2024 from "../../data/seasons/2024.json";
import telemetry from "./__fixtures__/openf1-powertrain.json";

let context = null;
beforeAll(async () => {
  context = await packContext();
});

/** The fastest any running car goes on track (no SC, not in the pit lane) over `laps` racing laps after lap 2. */
const raceTop = (year, circuit, laps = 6, seed = "speeds") => {
  const w = weekend({ year, circuit, context, seed });
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
    // Corners weigh more than straights: the extra time goes where tyres and fuel cost it, by the
    // weights measured on OpenF1 race laps (PT-3 below: straights 0.72-0.81 of the lap's average).
    const straight = t.sens.reduce((low, value) => Math.min(low, value), Infinity);
    expect(straight).toBeLessThan(0.9);
    expect(straight).toBeGreaterThan(0.6);
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
 *
 * 26/11/2026: 2a and 4 applied. venue.js builds each circuit with its physics era's car (eraFor) and
 * race-physics.json budget.sensitivity holds the weights measured here. Eight corners came inside the
 * tolerance (Monza T4-T6, Bahrain T8 and T10, Hungaroring T1, T12 and T13) and most of the rest got
 * closer (Bahrain T1 49 -> 57 of 63, T14 80 -> 95 of 117). Three went out the other way: Monza's
 * first chicane (T1/T2, 84/79 against 68) and Hungaroring T2 (121 against 109) are now too fast,
 * with the 2022-2025 block's mu.slow 1.9 on a minimum-curvature line that straightens the chicane
 * (2b, the line, is still open). Race top speeds stay inside their ±5 %.
 */
const KNOWN_OFF = {
  "monza:1": [84, 68, 2, 2],
  "monza:2": [79, 68, 2, 2],
  "monza:7": [138, 164, 4, 4],
  "monza:8": [144, 179, 4, 4],
  "monza:10": [205, 240, 5, 6],
  "monza:11": [130, 198, 4, 5],
  "bahrain:1": [57, 63, 1, 3],
  "bahrain:2": [123, 166, 3, 4],
  "bahrain:4": [100, 117, 3, 4],
  "bahrain:6": [151, 176, 4, 5],
  "bahrain:11": [119, 149, 3, 4],
  "bahrain:13": [117, 131, 4, 4],
  "bahrain:14": [95, 117, 3, 4],
  "hungaroring:2": [121, 109, 4, 3],
  "hungaroring:3": [179, 228, 5, 5],
  "hungaroring:4": [171, 210, 5, 5],
  "hungaroring:6": [127, 102, 3, 3],
  "hungaroring:7": [158, 121, 3, 3],
  "hungaroring:8": [121, 150, 3, 4],
  "hungaroring:10": [240, 211, 6, 5],
  "hungaroring:11": [176, 206, 6, 6],
  "hungaroring:14": [106, 130, 3, 4],
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
/** The real laps a circuit's bench reads: the 2024 pole lap and the pole sitter's race laps (realLapOf rows). */
const defaultSource = (circuit) => ({
  pole: realLapOf(realSessions.find((session) => session.circuit === circuit && session.year === BENCH.year)),
  raceLaps: raceLapsOf(circuit),
});

/**
 * Per numbered corner of `circuit`: the sim's slowest point in the corner and the real slowest there.
 * PT-C1: `year` is the season the step race runs (2013 for China), `source` the real laps (China 2024
 * comes from the fixture's `china` key; the 2013 bench reads the 2024 laps scaled by the f1db lap ratio, NV).
 */
const benchOf = (circuit, { year = BENCH.year, source = null } = {}) => {
  const key = `${circuit}@${year}`;
  if (benchCache[key]) return benchCache[key];
  const given = source || defaultSource(circuit);
  const w = weekend({ year, circuit, context, seed: BENCH.seed });
  const state = fromQuickRace(w.make(), { race: w.race });
  const track = circuitFor(w.race, year);
  const trace = [];
  while (!state.finished && state._sim.laps[0] <= BENCH.lap) {
    stepOnce(state);
    if (state._sim.laps[0] === BENCH.lap && !state.safetyCar) trace.push(snapshot(state)[0]);
  }
  const sim = trace.filter((car) => car.status === "running" && !car.inPit).sort((x, y) => x.share - y.share);
  const matched = matchCorners(sim, track, given.pole, given.raceLaps);
  const top = sim.reduce((most, car) => (car.v > most ? car.v : most), 0) * KMH;
  benchCache[key] = { ...matched, samples: sim.length, tables: state._sim.tables, budget: state._sim.budget[0], track, top };
  return benchCache[key];
};

/**
 * The bench's corner matching (PT-2/PT-3), shared by the step race and, for PT-C1, the physical trace:
 * `sim` rows `{share, v (m/s), gear}` sorted by share, the circuit, the real pole lap and race laps
 * (realLapOf rows). Returns the lap offset, its rms and one row per numbered corner.
 */
const matchCorners = (sim, track, real, raceLaps) => {
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
  return { offset: best.off, rms: Math.sqrt(best.err / real.length), corners };
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
// ------------------------------------------------------------------ F1M24-CHINA §2.1 GS-02 (PT-C1)

const china = telemetry.china;
const chinaEvent = (pack) => pack.calendar.find((event) => event.layoutId === "shanghai-1");
/**
 * Bench set-up for Shanghai (test parameters, not balance). `nvTolerance`: F1M24-CHINA §2.1, 2013 has no
 * public telemetry, so the 2013 bench reads the 2024 laps scaled by the f1db lap ratio within ±12 % (NV).
 * `poleTolerance`: §3.1 GS-02, the best car's physical lap against the real pole.
 */
const CHINA_BENCH = { circuit: "shanghai", spline: "shanghai-1", nvYear: 2013, nvTolerance: 0.12, poleTolerance: 0.015, topTolerance: 0.05, hairpinShare: 0.9 };
const chinaSource = () => ({ pole: realLapOf({ lap: china.pole }), raceLaps: china.race.laps.map((lap) => realLapOf({ lap })) });
/** 2024 -> 2013 speed scale (NV): the f1db lap ratio, pole for the pole lap and fastest race lap for the race laps. */
const nvScale = (key) => chinaEvent(pack2024).refLaps[key] / chinaEvent(pack2013).refLaps[key];
const scaleRows = (rows, scale) => rows.map((row) => ({ ...row, kmh: row.kmh * scale }));
const chinaBench = (year = BENCH.year) => {
  if (year === BENCH.year) return benchOf(CHINA_BENCH.circuit, { source: chinaSource() });
  const source = chinaSource();
  return benchOf(CHINA_BENCH.circuit, {
    year,
    source: { pole: scaleRows(source.pole, nvScale("pole")), raceLaps: source.raceLaps.map((rows) => scaleRows(rows, nvScale("fastestRaceLap"))) },
  });
};

/**
 * Per numbered corner, the physical trace the race runs (circuitFor: the best car of the year on a
 * qualifying lap) against the real pole lap, aligned the way the bench aligns the step race.
 */
const traceBenchCache = {};
const traceBenchOf = (year) => {
  if (traceBenchCache[year]) return traceBenchCache[year];
  const poleRows = scaleRows(chinaSource().pole, year === BENCH.year ? 1 : nvScale("pole"));
  const track = circuitFor({ circuit: CHINA_BENCH.circuit }, year);
  const sim = Array.from({ length: track.speed.length }, (_, i) => ({ share: track.distShare[i], v: track.speed[i], gear: null }));
  // Against the pole lap only (no race laps): `pole` is the real minimum, as the bench finds it.
  const matched = matchCorners(sim, track, poleRows, []);
  traceBenchCache[year] = {
    offset: matched.offset,
    corners: matched.corners.map((row) => ({ number: row.number, kind: row.kind, matched: row.matched, sim: row.sim.kmh, real: row.pole.kmh })),
    lapTime: track.simulatedLap,
  };
  return traceBenchCache[year];
};

/**
 * Corners outside the tolerance at Shanghai, measured 27/11/2026 on wp/PT-C1 (feature/overcut-manager at
 * the start of F1M24-CHINA wave 1): "bench:year:number" -> [sim km/h, real km/h] (race rows add the sim and
 * real gear). The calibrated layout counts 14 corners against the official 16 (calibratedCircuit.test.js),
 * so its T13 is the official T14 hairpin and its T14 the official T15-T16. What is off and why:
 *
 *  - The last corner (layout T14, official T15-T16): splines.json shanghai-1 gives it a 54 m radius on its
 *    racing line, where Verstappen's pole lap keeps 178 km/h (about 75 m with the 2024 car, physics.radiusAt).
 *    T11-T12 (official T12-T13, the long right-hander) are 10-20 % slow on the trace for the same reason.
 *    That is the line in splines.json (assets pipeline, outside PT's files, F1M24-CHINA §3.2), not the
 *    era's car: the same car makes the pole within 0.1 % (test above) and the slow corners within ±10 %.
 *  - 2013 T9 on the trace: the scaled 2024 pole lap (NV) has no minimum there; the race lap does (136).
 *  - 2024 race T1-T2 (official T1-T2, the snail): speeds within ±10 %, but the car stays in 7th / 5th where
 *    Verstappen is in 3rd. The trace trails the brakes into the snail under race-powertrain.json
 *    shift.brakingG (1.5 g, fitted on the 2024 pole laps), so the gearbox only drops a gear when the rpm
 *    falls under floorRpm. Lowering brakingG to 0.5 g gives 3rd there but puts the hairpins in 1st-2nd
 *    (real 3rd) and moves Bahrain T8/T10 and Hungaroring T1 out of the PT-2 bench (tried 27/11).
 *  - 2024 race T4 and 2013 T12: one OpenF1 race lap with telemetry (lap 46, OpenF1 shut its historical
 *    API to accounts during a live session on 27/11) at 3.7 Hz; T4 is 78 on that lap against 99 on the
 *    pole lap. Re-run powertrain_from_openf1.py --china without --raw for laps 3-8 and re-check.
 */
const CHINA_KNOWN_OFF = {
  "trace:2024:11": [99, 111],
  "trace:2024:12": [179, 224],
  "trace:2024:14": [131, 178],
  "trace:2013:9": [152, 187],
  "trace:2013:11": [95, 110],
  "trace:2013:12": [174, 222],
  "trace:2013:14": [125, 176],
  "race:2024:1": [131, 137, 7, 3],
  "race:2024:2": [87, 85, 5, 3],
  "race:2024:4": [89, 78, 4, 3],
  "race:2024:14": [122, 156, 3, 4],
  "race:2013:12": [167, 201],
  "race:2013:14": [120, 158],
};

const offOf = (rows, tolerance) => rows.filter((row) => Math.abs(row.sim / row.real - 1) > tolerance);

describe("PT-C1 · Shanghai corners against OpenF1 2024 (F1M24-CHINA §2.1 GS-02; RF-SIM-01, RF-SIM-02)", () => {
  it("the fixture holds Verstappen's 2024 pole lap (OpenF1 9664, 1:33.660, f1db pole) and clean race laps (9673)", () => {
    expect(china.circuit).toBe(CHINA_BENCH.circuit);
    expect(china.pole.sessionKey).toBe(9664);
    expect(china.pole.lapTime).toBeCloseTo(chinaEvent(pack2024).refLaps.pole, 3);
    expect(china.pole.samples.length).toBeGreaterThan(300);
    expect(china.race.sessionKey).toBe(9673);
    expect(china.race.laps.length).toBeGreaterThanOrEqual(1);
    china.race.laps.forEach((lap) => {
      expect(lap.samples.length).toBeGreaterThan(300);
      expect(lap.lapTime / china.pole.lapTime).toBeGreaterThan(1.02);
      expect(lap.lapTime / china.pole.lapTime).toBeLessThan(1.15);
    });
    // The first stint (laps 2-12, before the stop on lap 13): the race pace the step race is held to.
    expect(china.race.cleanLapTimes.length).toBeGreaterThanOrEqual(8);
  });

  it("the best car's physical lap on the calibrated spline is the 2024 pole within ±1.5 % (and 2013 inside the ±3 % gate)", () => {
    const spline = splineData.splines[CHINA_BENCH.spline];
    const lap2024 = splineLap(spline, carFor({ year: 2024, layoutRef: spline.layoutRef })).lapTime;
    expect(Math.abs(lap2024 / china.pole.lapTime - 1)).toBeLessThanOrEqual(CHINA_BENCH.poleTolerance);
    // 2013 (Hamilton 1:34.484): the 2009-2013 block is one car for five seasons (physics.test.js gate ±3 %).
    const lap2013 = splineLap(spline, carFor({ year: 2013, layoutRef: spline.layoutRef })).lapTime;
    expect(Math.abs(lap2013 / chinaEvent(pack2013).refLaps.pole - 1)).toBeLessThanOrEqual(0.03);
  });

  it.each([2024, CHINA_BENCH.nvYear])("%i: the trace's slowest point per corner against the pole lap (2024 ±10 %%, 2013 ±12 %% NV)", (year) => {
    const bench = traceBenchOf(year);
    const tolerance = year === BENCH.year ? BENCH.minTolerance : CHINA_BENCH.nvTolerance;
    expect(Math.abs(bench.offset)).toBeLessThan(BENCH.offsetRange);
    if (process.env.PTC1_PRINT) console.log(year, "trace", bench.offset, JSON.stringify(bench.corners.map((r) => [r.number, Math.round(r.sim), Math.round(r.real)]))); // eslint-disable-line no-console
    const off = Object.fromEntries(offOf(bench.corners, tolerance).map((row) => [`trace:${year}:${row.number}`, [Math.round(row.sim), Math.round(row.real)]]));
    expect(Object.keys(off).filter((key) => !CHINA_KNOWN_OFF[key])).toEqual([]);
    Object.keys(CHINA_KNOWN_OFF).filter((key) => key.startsWith(`trace:${year}:`)).forEach((key) => expect([key, off[key] !== undefined]).toEqual([key, true]));
  });

  it.each([2024, CHINA_BENCH.nvYear])("%i: the step race's lap per corner against the race lap (2024 ±10 %% and gear ±1, 2013 ±12 %% NV)", (year) => {
    const bench = chinaBench(year);
    expect(bench.samples).toBeGreaterThan(100);
    expect(Math.abs(bench.offset)).toBeLessThan(BENCH.offsetRange);
    const tolerance = year === BENCH.year ? BENCH.minTolerance : CHINA_BENCH.nvTolerance;
    if (process.env.PTC1_PRINT) console.log(year, "race", bench.offset, JSON.stringify(bench.corners.map((r) => [r.number, Math.round(r.sim.kmh), r.sim.gear, Math.round(r.real.kmh), r.real.gear]))); // eslint-disable-line no-console
    const off = {};
    bench.corners.forEach((row) => {
      const speed = Math.abs(row.sim.kmh / row.real.kmh - 1) > tolerance;
      // Gears only against the same car: 2013 ran a 7-speed V8 at 18 000 rpm, 2024 an 8-speed V6 hybrid.
      const gear = year === BENCH.year && Math.abs(row.sim.gear - row.real.gear) > BENCH.gearTolerance;
      if (speed || gear) off[`race:${year}:${row.number}`] = [Math.round(row.sim.kmh), Math.round(row.real.kmh)];
    });
    expect(Object.keys(off).filter((key) => !CHINA_KNOWN_OFF[key])).toEqual([]);
    Object.keys(CHINA_KNOWN_OFF).filter((key) => key.startsWith(`race:${year}:`)).forEach((key) => expect([key, off[key] !== undefined]).toEqual([key, true]));
  });

  it.each([2024, CHINA_BENCH.nvYear])("%i: the back-straight hairpin (official T14) is no slow outlier: at least 90 %% of OpenF1", (year) => {
    // F1M24-CHINA §2.1 measured OverCut's 2013 view at ~55 km/h there. The spec's "T14 ≥ 65 km/h" came
    // from memory (real 70-80 km/h, "verificar en OpenF1"); OpenF1 gives 64 km/h on the 2024 pole lap and
    // 59 on the race lap, so the gate is the bench's own: no more than 10 % under the real minimum. The
    // hairpin is the real lap's slowest point.
    const bench = chinaBench(year);
    const slowest = bench.corners.reduce((a, b) => (!a || b.real.kmh < a.real.kmh ? b : a), null);
    expect(slowest.real.kmh).toBeLessThan(70);
    expect(slowest.sim.kmh / slowest.real.kmh).toBeGreaterThanOrEqual(CHINA_BENCH.hairpinShare);
    const hairpin = traceBenchOf(year).corners.reduce((a, b) => (!a || b.real < a.real ? b : a), null);
    expect(hairpin.sim / hairpin.real).toBeGreaterThanOrEqual(CHINA_BENCH.hairpinShare);
  });

  it("2024: top speed of the bench lap within ±5 % of the real race lap's (OpenF1 9673), the field's under the DRS-and-tow ceiling", () => {
    // Like for like: one car's racing lap against Verstappen's lap 46 (310 km/h, alone, no DRS). The field's
    // top over six laps (raceTop, DRS and tow included; the bench seed, as the default one brings a safety
    // car out on lap 1 at Shanghai) stays under that plus the DRS gain of SIM-FISICA §3.4 and 5 %.
    const real = Math.max(...china.race.laps.flatMap((lap) => lap.samples.map((row) => row[1])));
    expect(Math.abs(chinaBench().top / real - 1)).toBeLessThanOrEqual(CHINA_BENCH.topTolerance);
    const { top } = raceTop(2024, CHINA_BENCH.circuit, 6, BENCH.seed);
    expect(top).toBeGreaterThan(chinaBench().top);
    expect(top / (real * (1 + SIM_BALANCE.drs.speedGain)) - 1).toBeLessThanOrEqual(CHINA_BENCH.topTolerance);
  });

  it("2024: the step race's lap budget is the real first-stint race pace (±3 % of the median clean lap)", () => {
    const times = china.race.cleanLapTimes.map((lap) => lap.lapTime).sort((x, y) => x - y);
    expect(Math.abs(chinaBench().budget / times[times.length >> 1] - 1)).toBeLessThanOrEqual(BENCH.paceTolerance);
  });
});

// ------------------------------------------------------------------ budget.radiusExponent (PT-C1)

/** The race-physics.json car a circuit's trace runs (era of `year`, the circuit's downforce level). */
const benchCarOf = (circuit, year = BENCH.year) => carFor({ year, layoutRef: circuit });
const RADIUS_FIT = { minGroup: 2, steps: [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1] };
const cornerFlagsOf = (t) => {
  const corner = new Uint8Array(t.M);
  for (let j = 0; j < t.M; j += 1) corner[j] = t.corner[Math.min(t.M - 1, Math.floor(((t.dOfTau[j] + t.dOfTau[j + 1]) / 2) * t.M))];
  return corner;
};
const withExponent = (value) => ({ ...physicsData, budget: { ...physicsData.budget, radiusExponent: { value, status: "pending", source: "test" } } });

/**
 * The radius exponent the OpenF1 race laps give (every bench circuit, China included): per matched corner,
 * the time the race lap loses against the pole lap there (pole min / race min − 1); inside each circuit and
 * band, that loss over its group mean against r^e over its group mean (r from the pole minimum, radiusAt);
 * the quarter step with the least squared residual.
 */
const radiusFit = () => {
  const groups = {};
  const benches = [...benchCircuits.map((circuit) => [circuit, benchOf(circuit)]), [CHINA_BENCH.circuit, chinaBench()]];
  benches.forEach(([circuit, bench]) => {
    const car = benchCarOf(circuit);
    bench.corners.forEach((row) => {
      if (!row.matched || !row.pole || !row.real) return;
      const key = `${circuit}:${budgetBandOf(row.pole.kmh, true)}`;
      (groups[key] = groups[key] || []).push({ loss: row.pole.kmh / row.real.kmh - 1, r: radiusAt(car, row.pole.kmh / KMH) });
    });
  });
  const used = Object.values(groups).filter((group) => group.length >= RADIUS_FIT.minGroup);
  const residual = (e) =>
    used.reduce((sum, group) => {
      const lossMean = group.reduce((acc, c) => acc + c.loss, 0) / group.length;
      const f = group.map((c) => quarterPower(c.r, e));
      const fMean = f.reduce((acc, x) => acc + x, 0) / f.length;
      return sum + group.reduce((acc, c, k) => acc + (c.loss / lossMean - f[k] / fMean) ** 2, 0);
    }, 0);
  const scores = RADIUS_FIT.steps.map((e) => ({ e, residual: residual(e) }));
  const best = scores.reduce((a, b) => (b.residual < a.residual - 1e-12 ? b : a));
  return { best, scores, groups: used.length, corners: used.reduce((sum, group) => sum + group.length, 0) };
};

describe("PT-C1 · budget.radiusExponent (F1M24-CHINA §2.1 GS-02; RF-SIM-01, RNF-07, RNF-05)", () => {
  it("budgetWeights with the band weights alone is trackTables' `sens`, bit for bit (Shanghai and Bahrain)", () => {
    [CHINA_BENCH.circuit, "bahrain"].forEach((circuit) => {
      const t = (circuit === CHINA_BENCH.circuit ? chinaBench() : benchOf(circuit)).tables;
      expect(Array.from(budgetWeights(t.vRef, cornerFlagsOf(t), benchCarOf(circuit), withExponent(0)))).toEqual(Array.from(t.sens));
    });
  });

  it("with an exponent the weights keep their mean of 1 and each band's own weight, and are deterministic", () => {
    const t = chinaBench().tables;
    const corner = cornerFlagsOf(t);
    const car = benchCarOf(CHINA_BENCH.circuit);
    const base = budgetWeights(t.vRef, corner, car, withExponent(0));
    [-0.5, 0.5].forEach((value) => {
      const w = budgetWeights(t.vRef, corner, car, withExponent(value));
      expect(w.reduce((sum, x) => sum + x, 0) / t.M).toBeCloseTo(1, 9);
      ["slow", "medium", "fast", "straight"].forEach((band) => {
        const idx = [];
        for (let j = 0; j < t.M; j += 1) if (budgetBandOf(t.vRef[j] * KMH, corner[j]) === band) idx.push(j);
        if (!idx.length) return;
        expect(idx.reduce((sum, j) => sum + w[j], 0) / idx.length).toBeCloseTo(idx.reduce((sum, j) => sum + base[j], 0) / idx.length, 9);
      });
      expect(Array.from(budgetWeights(t.vRef, corner, car, withExponent(value)))).toEqual(Array.from(w));
    });
    // quarterPower is x^e by square roots only.
    expect(quarterPower(16, 0.5)).toBe(4);
    expect(quarterPower(16, -0.25)).toBe(0.5);
    expect(quarterPower(81, 0.75)).toBeCloseTo(27, 12);
  });

  it("race-physics.json budget.radiusExponent is the quarter step the OpenF1 race laps give", () => {
    const fit = radiusFit();
    if (process.env.PTC1_PRINT) console.log("radius fit", JSON.stringify(fit)); // eslint-disable-line no-console
    const entry = physicsData.budget.radiusExponent;
    expect(fit.corners).toBeGreaterThanOrEqual(20);
    expect(radiusExponentOf()).toBe(fit.best.e);
    expect(entry.status).toBe("measured");
    expect(entry.fit.corners).toBe(fit.corners);
    expect(entry.fit.groups).toBe(fit.groups);
  });
});
