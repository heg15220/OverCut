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
import { SC_PHASES, WEAVE_BALANCE, circuitScFactor, cleanupOf, deployNeutralisation, neutralStream, pitClosedFor, quickLapsOf, wetReleaseOf, wetStartOf } from "./safetyCar";
import { STATES } from "../weather";
import { classificationOf, createRace, runToFinish } from "../race";
import { entrantsFor, weekendRaceArgs } from "../career";
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
      // SIM-8: the train is judged where it leaves TRAIN - at UNLAPPING when the era lets lapped cars by (art.
      // 55.13: they then pass the train and the SC, which comes in regardless), else at IN_THIS_LAP itself.
      const leaving = events.find((event) => event.type === "sc-phase" && (event.phase === "UNLAPPING" || event.phase === "IN_THIS_LAP"));
      expect(leaving.grouped).toBe(true);
      expect(leaving.forced).toBeFalsy();
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

// ------------------------------------------------------------------ SIM-C4 (F1M24-CHINA wave 4)

/**
 * SIM-C4 · GS-12 (F1M24-CHINA §2.9, §3.1; RF-SIM-10, RF-SIM-08, SRS §6.2, criterio 7.2; FIA 2024 arts. 49, 51, 52,
 * 30.5 o): with the water on the line at the start at or above the intermediate's capacity the race starts behind
 * the safety car (lap 1 under it), every car on rain tyres (the full wet where compulsory), and it goes green with a
 * standing start from 2017 when the track is fit for one; race control's messages come in order. Both modes.
 */
describe("SIM-C4 GS-12 the wet start behind the safety car", () => {
  const HEAVY = STATES.length - 1;
  const WET = balance.raceControl.wet;
  let context = null;
  beforeAll(async () => {
    context = await packContext();
  });

  const wetArgs = (year, seed, state = HEAVY) => ({ ...weekendRaceArgs(weekend({ year, seed, context }).career), weatherStart: state });
  const quick = (year, seed, state) => runToFinish(createRace(wetArgs(year, seed, state)));
  const kinds = (events) => events.filter((event) => event.type === "control").map((event) => event.kind);

  /** The wet-start checks every era with the procedure must pass. */
  const checkWetStart = (race, { standingFrom }) => {
    const cap = race.weather.capacity.interMm;
    expect(race.weather.water[0]).toBeGreaterThanOrEqual(WET.startBehindSc.interCapacityShare * cap);
    // SC on lap 1: told on the grid, and the first laps raced behind it.
    expect(race.events.find((event) => event.type === "control" && event.kind === "startBehindSc")).toMatchObject({ lap: 0 });
    expect(race.events.find((event) => event.type === "sc")).toMatchObject({ lap: 0, wetStart: true });
    expect(race.wetStart.laps).toBeGreaterThanOrEqual(Math.min(WET.startBehindSc.minLaps, race.laps - 1));
    expect(race.wetStart.laps).toBeLessThanOrEqual(WET.startBehindSc.maxLaps);
    // Every car leaves the grid on rain tyres (the full wet where the era makes it compulsory).
    race.cars.forEach((car) => expect(["wet", "inter"]).toContain(car.compoundsUsed[0]));
    if (race.wetStart.mandatory) race.cars.forEach((car) => expect(car.compoundsUsed[0]).toBe("wet"));
    // No first-corner scrum nor jump start behind the safety car.
    expect(race.events.filter((event) => event.turnOne || event.offence === "jumpStart")).toEqual([]);
    if (!race.wetStart.release) return; // a red flag came first
    const releaseLap = race.wetStart.greenLap - 1;
    // Nobody stops before the safety car is in (rain tyres compulsory behind it, art. 30.5 o).
    if (race.wetStart.mandatory) expect(race.events.filter((event) => event.type === "pit" && event.lap <= releaseLap)).toEqual([]);
    const kind = race.wetStart.release === "standing" ? "standingStart" : "rollingStart";
    const told = race.events.findIndex((event) => event.type === "control" && event.kind === kind);
    expect(told).toBeGreaterThan(-1);
    expect(race.events[told].lap).toBe(releaseLap);
    // Told before the safety car comes in.
    expect(told).toBeLessThan(race.events.findIndex((event) => event.type === "sc-in"));
    const fit = race.weather.water[Math.min(releaseLap, race.weather.water.length - 1)] < WET.startBehindSc.rollingAboveShare * cap;
    expect(race.wetStart.release).toBe(race.year >= standingFrom && fit ? "standing" : "rolling");
  };

  it("2024: SC on lap 1, all on full wets, standing start when the track is fit for it, rolling when it is not", () => {
    const releases = new Set();
    let wetStarts = 0;
    for (let k = 0; k < 24 && !releases.has("standing"); k += 1) {
      [HEAVY, HEAVY - 1].forEach((state) => {
        const race = quick(2024, `gs12-${k}`, state);
        if (!race.wetStart) {
          expect(race.weather.water[0]).toBeLessThan(WET.startBehindSc.interCapacityShare * race.weather.capacity.interMm);
          expect(kinds(race.events)).not.toContain("startBehindSc");
          return;
        }
        wetStarts += 1;
        checkWetStart(race, { standingFrom: 2017 });
        if (race.wetStart.release) releases.add(race.wetStart.release);
      });
    }
    expect(wetStarts).toBeGreaterThan(0);
    expect(releases.has("standing")).toBe(true);
  });

  it("2008: behind the SC on full wets, and a rolling start when it comes in (no standing start before 2017)", () => {
    const race = quick(2008, "gs12-2008", HEAVY);
    expect(race.wetStart).toBeTruthy();
    checkWetStart(race, { standingFrom: 2017 });
    expect(race.wetStart.release === null || race.wetStart.release === "rolling").toBe(true);
  });

  it("1990: no safety car yet (1993) - no start behind it, whatever the water", () => {
    const race = quick(1990, "gs12-1990", HEAVY);
    expect(rulesFor(1990).raceControl.wetStart).toBeNull();
    expect(race.wetStart).toBeUndefined();
    expect(kinds(race.events)).not.toContain("startBehindSc");
    expect(race.events.some((event) => event.wetStart)).toBe(false);
  });

  it("tells race control's wet messages in order on the grid: climatic change, wet track, slippery, low grip, then the SC", () => {
    const race = quick(2024, "gs12-0", HEAVY);
    const grid = race.events.filter((event) => event.type === "control" && event.lap === 0).map((event) => event.kind);
    const rank = { climaticChange: 0, wetTrack: 1, slippery: 2, lowGrip: 3, startBehindSc: 4 };
    expect(grid.filter((kind) => rank[kind] === undefined)).toEqual([]);
    for (let k = 1; k < grid.length; k += 1) expect(rank[grid[k]]).toBeGreaterThanOrEqual(rank[grid[k - 1]]);
    ["climaticChange", "wetTrack", "slippery", "lowGrip", "startBehindSc"].forEach((kind) => expect(grid).toContain(kind));
    // One "slippery" per timing sector, each told once.
    const sectors = race.events.filter((event) => event.kind === "slippery" && event.lap === 0).map((event) => event.sector);
    expect(new Set(sectors).size).toBe(sectors.length);
  });

  it("closes DRS with a WET TRACK declared: DRS enabled only once the water fell below its threshold", () => {
    ["gs12-0", "gs12-1", "gs12-2"].forEach((seed) => {
      const race = quick(2024, seed, HEAVY - 2);
      expect(race.events.find((event) => event.kind === "wetTrack")).toBeDefined();
      race.events.filter((event) => event.kind === "drsEnabled").forEach((event) => {
        expect(race.weather.water[event.lap]).toBeLessThan(WET.wetTrackMm);
      });
    });
  });

  it("plays the same wet start in the step mode: SC from the grid (START_BEHIND_SC), the release, then the green", () => {
    const args = wetArgs(2024, "gs12-0", HEAVY);
    const q = runToFinish(createRace(args));
    const s = fromQuickRace(createRace(args), { race: args.race });
    runStepToFinish(s);
    expect(s.wetStart).toBeTruthy();
    expect(s.events.find((event) => event.type === "sc")).toMatchObject({ lap: 0, wetStart: true });
    // The grid's messages are the same in both modes (decided before the start, no draw).
    const gridOf = (race) => race.events.filter((event) => event.type === "control" && event.lap === 0).map((event) => `${event.kind}:${event.sector ?? ""}`);
    expect(gridOf(s)).toEqual(gridOf(q));
    // The release is told before the green, as in the quick mode, and every car left the grid on wets.
    const release = s.events.findIndex((event) => event.kind === "standingStart" || event.kind === "rollingStart");
    expect(release).toBeGreaterThan(-1);
    expect(release).toBeLessThan(s.events.findIndex((event) => event.type === "sc-in"));
    s.cars.forEach((car) => expect(car.compoundsUsed[0]).toBe("wet"));
    expect(s.events.filter((event) => event.turnOne)).toEqual([]);
    expect(s.finished).toBe(true);
  });

  it("standing start in the step mode: the field lines up on its grid slots and is launched from rest", () => {
    let args = null;
    for (let k = 0; k < 24 && !args; k += 1) {
      [HEAVY, HEAVY - 1].forEach((state) => {
        if (args) return;
        const candidate = wetArgs(2024, `gs12-${k}`, state);
        const race = runToFinish(createRace(candidate));
        if (race.wetStart && race.wetStart.release === "standing") args = candidate;
      });
    }
    expect(args).not.toBeNull();
    const s = fromQuickRace(createRace(args), { race: args.race });
    let grid = false;
    let launched = false;
    for (let k = 0; k < 400000 && !s.finished && !launched; k += 1) {
      stepOnce(s);
      if (s.safetyCar && s.safetyCar.wetGrid) grid = true;
      if (grid && !s.safetyCar) {
        launched = true;
        const sim = s._sim;
        for (let i = 0; i < sim.n; i += 1) if (sim.active[i] && s.cars[i].status === "running" && sim.inPit[i] === 0) expect(sim.drive.launching[i]).toBe(1);
      }
    }
    if (s.wetStart.release === "standing") {
      expect(grid).toBe(true);
      expect(launched).toBe(true);
      expect(s.events.some((event) => event.kind === "standingStart")).toBe(true);
      expect(s.events.some((event) => event.type === "red")).toBe(false);
    } else {
      // The step mode's water (its own laps) can leave the track still unfit: then a rolling start (art. 52).
      expect(s.wetStart.release).toBe("rolling");
    }
  });

  it("is pure and decided from the forecast water (no draw): wetStartOf / wetReleaseOf", () => {
    const rules = rulesFor(2024);
    const cap = 1;
    const weather = { water: [3, 3, 1.1, 0.9, 0.5, 0.4] };
    const a = wetStartOf({ rules, weather, laps: 50, capacityMm: cap });
    expect(a).toEqual(wetStartOf({ rules, weather, laps: 50, capacityMm: cap }));
    expect(a).toMatchObject({ laps: Math.max(WET.startBehindSc.minLaps, 3), tyre: "wet", mandatory: true, standingAfter: true });
    expect(wetStartOf({ rules, weather: { water: [0.5] }, laps: 50, capacityMm: cap })).toBeNull();
    expect(wetStartOf({ rules: rulesFor(1990), weather, laps: 50, capacityMm: cap })).toBeNull();
    const state = { wetStart: { standingAfter: true, capacityMm: cap }, weather };
    expect(wetReleaseOf(state, 4)).toBe("standing");
    expect(wetReleaseOf(state, 0)).toBe("rolling");
    expect(wetReleaseOf({ ...state, wetStart: { standingAfter: false, capacityMm: cap } }, 4)).toBe("rolling");
  });
});

/**
 * SIM-C4 · AUD-C9 (F1M24-CHINA §1.6 «tono del motor congelado 30 s detrás del SC», §2.6; RF-SIM-10, RF-3D-04, RNF-07):
 * 30 s behind the safety car a car's engine tone (f0 ∝ rpm) moves by ≥ 2 % and it changes gear or blips the throttle
 * at least once; the weave (race-sim.json safetyCar.weave, OpenF1 9480/9655) swings it sideways by about its measured
 * amplitude, and the same seed gives the same weave.
 */
describe("SIM-C4 AUD-C9 nothing frozen behind the safety car", () => {
  const sample = (seed) => {
    const state = stepRaceOf({ seed, year: 2024 });
    for (let k = 0; k < 40000 && (state._sim.clock < 400 || state.safetyCar); k += 1) stepOnce(state);
    deployNow(state, false);
    // A long cleanup, so the train runs well over 30 s whatever the seed's incident.
    state.safetyCar.cleanupSec = Math.max(state.safetyCar.cleanupSec || 0, 6 * state.race.baseLap);
    const sim = state._sim;
    stepOnce(state);
    // Wait for the train, then 30 s of it.
    for (let k = 0; k < 40000 && state.safetyCar && (!sim.neutral || SC_PHASES[sim.neutral.phase] !== "TRAIN"); k += 1) stepOnce(state);
    const inTrain = Boolean(sim.neutral) && SC_PHASES[sim.neutral.phase] === "TRAIN";
    stepFor(state, WEAVE_BALANCE.periodSec);
    const shots = [];
    const t0 = sim.clock;
    while (sim.clock - t0 < 30 && state.safetyCar && sim.neutral && SC_PHASES[sim.neutral.phase] === "TRAIN") {
      stepOnce(state);
      shots.push(snapshot(state));
    }
    return { state, shots, inTrain };
  };

  const { state, shots, inTrain } = sample("weave-a");

  it("30 s behind the SC: f0 moves ≥ 2 % and at least one gear change or throttle blip per car", () => {
    expect(inTrain).toBe(true);
    expect(shots.length * state._sim.dt).toBeGreaterThanOrEqual(25);
    const n = state.cars.length;
    let cars = 0;
    for (let i = 0; i < n; i += 1) {
      const rows = shots.map((shot) => shot[i]).filter((car) => car && !car.inPit && car.status === "running");
      if (rows.length < shots.length * 0.9) continue;
      cars += 1;
      const rpm = rows.map((row) => row.rpm);
      const mean = rpm.reduce((sum, v) => sum + v, 0) / rpm.length;
      expect((Math.max(...rpm) - Math.min(...rpm)) / mean).toBeGreaterThanOrEqual(0.02);
      let changes = 0;
      for (let k = 1; k < rows.length; k += 1) {
        if (rows[k].gear !== rows[k - 1].gear) changes += 1;
        if (rows[k].throttle - rows[k - 1].throttle > 0.2) changes += 1;
      }
      expect(changes).toBeGreaterThanOrEqual(1);
    }
    expect(cars).toBeGreaterThanOrEqual(10);
  });

  it("weaves every car in the train by about the measured amplitude", () => {
    const n = state.cars.length;
    let weaving = 0;
    for (let i = 0; i < n; i += 1) {
      const lat = shots.map((shot) => shot[i] && shot[i].lateral).filter((v) => Number.isFinite(v));
      if (lat.length < shots.length * 0.9) continue;
      const swing = Math.max(...lat) - Math.min(...lat);
      if (swing >= WEAVE_BALANCE.amplitudeM) weaving += 1;
    }
    expect(weaving).toBeGreaterThanOrEqual(10);
  });

  it("weaves on its own seed::weave stream: the same seed, the same weave", () => {
    const again = sample("weave-a");
    expect(again.shots.length).toBe(shots.length);
    const pick = (list) => list.map((shot) => shot.map((car) => [car.lateral, car.rpm, car.gear]));
    expect(JSON.stringify(pick(again.shots))).toBe(JSON.stringify(pick(shots)));
  });
});
