/**
 * WP3 of docs/manager/SIM-FISICA.md (§3.0, §3.7; RF-SIM-01, SRS 4.2): the step race spends each
 * lap's budget along the physical trace by band (race-physics.json `budget`), so the speed the
 * view reads from the snapshot (`v`) is a real one - top speed on the straights within ±5 % of the
 * measured race top speed (SIM-FISICA §4.2) - while the lap still lasts its budget (the SRS 4.2
 * equivalence is equivalence.test.js).
 */

import { SIM_BALANCE, airEffect, fromQuickRace, snapshot, stepOnce } from "./index";
import { dirtyAt, sensAt } from "./trackTables";
import physicsData from "../../data/balance/race-physics.json";
import { packContext, weekend } from "./simTestKit";

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
