/**
 * SIM-5 neutralisations (docs/manager/F1M24-GAMEPLAY.md §2.11, §1.7 `snapshot.sc` / `snapshot.vsc`; RF-SIM-10,
 * RF-SIM-01, RF-SIM-15, RNF-05, RNF-07): the safety car on the ring with its phases, the VSC delta, the cleanup by
 * incident and the circuit's measured rate.
 *
 *   - nobody passes under the safety car but the lapped cars let through (FIA 2024 art. 55.8, 55.13);
 *   - the train is grouped (≤ 10 car lengths, art. 55.7/55.10) before IN_THIS_LAP;
 *   - the VSC: every car stays above the minimum time (art. 56.5) and the green comes 10-15 s after «VSC ENDING»
 *     anywhere on the lap (art. 56.7);
 *   - same seed, same output (RF-SIM-15).
 */

import balance from "../../data/balance/race-sim.json";
import circuitRates from "../../data/seasons/curated/circuit-sc-rates.json";
import { rulesFor } from "../rules";
import { fromQuickRace, runStepToFinish, snapshot, stepOnce, stepFor, toRaceState } from "./index";
import { SC_PHASES, circuitScFactor, cleanupOf, deployNeutralisation, neutralStream, pitClosedFor, quickLapsOf } from "./safetyCar";
import { classificationOf, createRace } from "../race";
import { entrantsFor } from "../career";
import { eraProfileFor } from "../../../overcutTrayectoria/engine/eras";
import { packContext, weekend } from "./simTestKit";
import { createStream } from "../../../overcutTrayectoria/engine/rng";

const stepRaceOf = (options) => {
  const w = weekend(options);
  return fromQuickRace(w.make(), { race: w.race });
};

/** Bring out a safety car (or the VSC) now, as race.js does for an accident. */
const deployNow = (state, virtual) => {
  const sim = state._sim;
  deployNeutralisation(state, { virtual, reason: "accident", share: 0.4, corner: 4, rules: sim.rules, lap: sim.leaderLap });
  state.events.push({ type: virtual ? "vsc" : "sc", lap: sim.leaderLap, forced: true });
};

/** Run until the neutralisation brought out at race time `at` ends; a log of what each step saw. */
const neutralised = (state, at, virtual) => {
  stepFor(state, at);
  deployNow(state, virtual);
  const sim = state._sim;
  const log = [];
  const from = state.events.length;
  for (let k = 0; k < 20000 && state.safetyCar && !state.finished; k += 1) {
    const before = Float64Array.from(sim.P);
    const inPitBefore = Uint8Array.from(sim.inPit);
    stepOnce(state);
    const shot = snapshot(state);
    log.push({ t: sim.clock, before, after: Float64Array.from(sim.P), inPitBefore, inPit: Uint8Array.from(sim.inPit), active: Uint8Array.from(sim.active), unlap: sim.neutral && !sim.neutral.virtual ? Uint8Array.from(sim.neutral.unlap) : null, sc: shot.sc, vsc: shot.vsc, pit: shot.map((car) => car.inPit) });
  }
  return { log, events: state.events.slice(from) };
};

describe("SIM-5 data: measured, sourced or pending (RNF-07)", () => {
  it("keeps the measured OpenF1 figures and the FIA's ten car lengths", () => {
    expect(balance.safetyCar.lapFactor).toBeCloseTo(balance.safetyCar.measured.scLapFactor.median, 2);
    expect(balance.safetyCar.virtualLapFactor).toBeCloseTo(balance.safetyCar.measured.vscLapFactor.median, 2);
    expect(balance.safetyCar.sc.trainMaxLengths).toBe(10);
    expect(balance.neutralisation.circuitRate.reference).toBe(circuitRates.scRateReference);
    expect(balance.neutralisation.cleanup.offTrackFactor).toBeLessThan(1);
    balance.safetyCar.sc.cars.forEach((car) => expect(["source", "pending"]).toContain(car.status));
  });

  it("gives the circuit factor from the pack's scRate, neutral without one", () => {
    expect(circuitScFactor({})).toBe(1);
    expect(circuitScFactor(null)).toBe(1);
    const { reference, min, max } = balance.neutralisation.circuitRate;
    expect(circuitScFactor({ scRate: reference })).toBeCloseTo(1, 9);
    expect(circuitScFactor({ scRate: 1 })).toBeLessThanOrEqual(max);
    expect(circuitScFactor({ scRate: 0 })).toBe(min);
    expect(circuitScFactor({ scRate: circuitRates.circuits.jeddah.scRate })).toBeGreaterThan(circuitScFactor({ scRate: circuitRates.circuits.monza.scRate }));
  });

  it("draws the cleanup on its own stream within the measured spread, the VSC's shorter", () => {
    const { base, offTrackFactor } = balance.neutralisation.cleanup;
    const a = createStream("x::neutral");
    const b = createStream("x::neutral");
    for (let k = 0; k < 200; k += 1) {
      const sc = cleanupOf(a, { virtual: false, severity: "impact" });
      expect(sc).toBe(cleanupOf(b, { virtual: false, severity: "impact" }));
      expect(sc).toBeGreaterThanOrEqual(base.p10 - 1e-9);
      expect(sc).toBeLessThanOrEqual(base.p90 + 1e-9);
      const vsc = cleanupOf(a, { virtual: true, severity: "impact" });
      cleanupOf(b, { virtual: true, severity: "impact" });
      expect(vsc).toBeLessThanOrEqual(base.p90 * offTrackFactor + 1e-9);
    }
  });

  it("turns the cleanup into whole laps for the quick mode, longer where the era unlaps", () => {
    const old = rulesFor(2011);
    const now = rulesFor(2024);
    expect(old.raceControl.sc.unlapping).toBe(false);
    expect(now.raceControl.sc.unlapping).toBe(true);
    const median = balance.neutralisation.cleanup.base.median;
    const laps2011 = quickLapsOf({ cleanupSec: median, virtual: false, rules: old, baseLap: 92 });
    const laps2024 = quickLapsOf({ cleanupSec: median, virtual: false, rules: now, baseLap: 92 });
    expect(laps2011).toBeGreaterThanOrEqual(balance.neutralisation.laps.minSc);
    expect(laps2024).toBeGreaterThanOrEqual(laps2011);
    expect(quickLapsOf({ cleanupSec: 111, virtual: true, rules: now, baseLap: 92 })).toBeGreaterThanOrEqual(balance.neutralisation.laps.minVsc);
  });

  it("closes the pit lane only in the eras that did, never to a punctured car", () => {
    const car = { puncture: false };
    const state2007 = { safetyCar: { virtual: false, deployedLap: 10 } };
    expect(pitClosedFor(state2007, car, rulesFor(2007), 10)).toBe(true);
    expect(pitClosedFor(state2007, car, rulesFor(2007), 11)).toBe(false);
    expect(pitClosedFor(state2007, { puncture: true }, rulesFor(2007), 10)).toBe(false);
    expect(pitClosedFor(state2007, car, rulesFor(2024), 10)).toBe(false);
    expect(pitClosedFor({ safetyCar: { virtual: true, deployedLap: 10 } }, car, rulesFor(2007), 10)).toBe(false);
  });
});

describe("SIM-5 the safety car on the ring (sc-fisico)", () => {
  const SEEDS = ["sc-a", "sc-b", "sc-c"];
  const runs = SEEDS.map((seed) => {
    const state = stepRaceOf({ seed, year: 2024 });
    const out = neutralised(state, 900, false);
    return { seed, state, ...out };
  });

  it("goes through its phases in order and ends with the green (sc-in)", () => {
    runs.forEach(({ log, events }) => {
      const phases = [];
      log.forEach((row) => {
        if (row.sc && phases[phases.length - 1] !== row.sc.phase) phases.push(row.sc.phase);
      });
      expect(phases[0]).toBe("DEPLOYED");
      const order = phases.map((phase) => SC_PHASES.indexOf(phase));
      for (let k = 1; k < order.length; k += 1) expect(order[k]).toBeGreaterThan(order[k - 1]);
      ["PICKUP", "TRAIN", "IN_THIS_LAP"].forEach((phase) => expect(phases).toContain(phase));
      expect(events.some((event) => event.type === "sc-in" && !event.virtual)).toBe(true);
      // The snapshot contract (§1.7): phase, s, v, lap, lightsOn; lights out from IN_THIS_LAP.
      log.forEach((row) => {
        if (!row.sc) return;
        expect(row.sc.s).toBeGreaterThanOrEqual(0);
        expect(row.sc.s).toBeLessThan(1);
        expect(row.sc.v).toBeGreaterThanOrEqual(0);
        expect(row.sc.lightsOn).toBe(SC_PHASES.indexOf(row.sc.phase) < SC_PHASES.indexOf("IN_THIS_LAP"));
      });
    });
  });

  it("has the train grouped within ten car lengths before IN_THIS_LAP (no timeout)", () => {
    runs.forEach(({ events }) => {
      const lightsOff = events.find((event) => event.type === "sc-phase" && event.phase === "IN_THIS_LAP");
      expect(lightsOff).toBeDefined();
      expect(lightsOff.grouped).toBe(true);
      expect(lightsOff.forced).toBeFalsy();
    });
  });

  it("lets nobody pass under the safety car but the lapped cars let through", () => {
    let pairs = 0;
    runs.forEach(({ log }) => {
      const recentPit = new Float64Array(log[0].after.length).fill(-Infinity);
      log.forEach((row) => {
        const n = row.after.length;
        for (let i = 0; i < n; i += 1) if (row.inPit[i] || row.inPitBefore[i]) recentPit[i] = row.t;
        if (!row.sc || row.sc.phase === "DEPLOYED" || row.sc.phase === "PICKUP") return;
        for (let i = 0; i < n; i += 1) {
          for (let j = i + 1; j < n; j += 1) {
            if (!row.active[i] || !row.active[j]) continue;
            if (row.t - recentPit[i] < 30 || row.t - recentPit[j] < 30) continue;
            if (row.unlap && (row.unlap[i] || row.unlap[j])) continue;
            const before = row.before[i] - row.before[j];
            const after = row.after[i] - row.after[j];
            pairs += 1;
            expect(Math.sign(before) === Math.sign(after) || before === 0).toBe(true);
          }
        }
      });
    });
    expect(pairs).toBeGreaterThan(1000);
  });

  it("lets the lapped cars through in the eras that unlap (UNLAPPING lists them), late in the race", () => {
    const late = ["sc-late-a", "sc-late-b"].map((seed) => neutralised(stepRaceOf({ seed, year: 2024 }), 3600, false));
    const unlapped = late.flatMap(({ events }) => events.filter((event) => event.type === "sc-phase" && event.phase === "UNLAPPING"));
    expect(unlapped.length).toBeGreaterThan(0);
    unlapped.forEach((event) => expect(event.carIds.length).toBeGreaterThan(0));
  });

  it("gives the same race for the same seed (RF-SIM-15)", () => {
    const again = stepRaceOf({ seed: SEEDS[0], year: 2024 });
    neutralised(again, 900, false);
    runStepToFinish(again);
    runStepToFinish(runs[0].state);
    const out = (state) => JSON.stringify({ rows: classificationOf(state), events: state.events, history: state.cars.map((car) => car.history) });
    expect(out(again)).toBe(out(runs[0].state));
    expect(toRaceState(again)._neutral).toBeUndefined();
  });
});

describe("SIM-5 the VSC delta (vsc-delta)", () => {
  const state = stepRaceOf({ seed: "vsc-a", year: 2024 });
  const { log, events } = neutralised(state, 700, true);

  it("keeps every car above the minimum time and publishes snapshot.vsc", () => {
    expect(log.length).toBeGreaterThan(0);
    const settled = log.filter((row) => row.vsc && row.t - log[0].t > 2);
    expect(settled.length).toBeGreaterThan(10);
    settled.forEach((row) => {
      expect(row.vsc.deltaSec).toHaveLength(state.cars.length);
      const racing = row.vsc.deltaSec.filter((delta, i) => row.active[i] && !row.pit[i]);
      expect(racing.filter((delta) => delta < -0.05)).toEqual([]);
      expect(row.sc).toBeNull();
    });
  });

  it("goes green 10-15 s after «VSC ENDING», wherever the leader is", () => {
    const ending = events.find((event) => event.type === "vsc-ending");
    const green = events.find((event) => event.type === "sc-in" && event.virtual);
    expect(ending).toBeDefined();
    expect(green).toBeDefined();
    const warn = rulesFor(2024).raceControl.vscEndingWarn;
    const waitSec = green.t - ending.t;
    expect(waitSec).toBeGreaterThanOrEqual(warn.minSec - state._sim.dt);
    expect(waitSec).toBeLessThanOrEqual(warn.maxSec + state._sim.dt);
  });

  it("draws the warning on the neutral stream only (the same seed gives the same wait)", () => {
    const again = stepRaceOf({ seed: "vsc-a", year: 2024 });
    const second = neutralised(again, 700, true);
    expect(JSON.stringify(second.events)).toBe(JSON.stringify(events));
    expect(typeof neutralStream(again).next).toBe("function");
  });
});

describe("SIM-5 the era's procedure (reglas-sc-era)", () => {
  let context = null;
  beforeAll(async () => {
    context = await packContext();
  });

  it("lets no lapped car through in 2011 (scUnlapping false) and still groups the train", () => {
    expect(rulesFor(2011).raceControl.sc.unlapping).toBe(false);
    // A 2012 weekend raced under 2011's rules (as rules.test.js and the golden do).
    const w = weekend({ seed: "sc-2011", year: 2012, context });
    const entrants = entrantsFor(w.career);
    const grid = w.career.weekend.qualifying.order.filter((id) => entrants.some((entrant) => entrant.id === id));
    const state = fromQuickRace(createRace({ race: w.race, era: eraProfileFor(2011), year: 2011, entrants, grid, seed: "sc-2011" }), { race: w.race });
    expect(state._sim.rules.year).toBe(2011);
    const { events } = neutralised(state, 2400, false);
    expect(events.some((event) => event.type === "sc-phase" && event.phase === "UNLAPPING")).toBe(false);
    const off = events.find((event) => event.type === "sc-phase" && event.phase === "IN_THIS_LAP");
    expect(off).toBeDefined();
    expect(off.grouped).toBe(true);
    expect(state.safetyCar).toBeNull();
  });
});