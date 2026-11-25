/**
 * SIM-7 of docs/manager/F1M24-GAMEPLAY.md (§2.8, §2.10, §3.3 ola 7): tactics, visible errors and visible damage.
 *
 *   tacticas          setTactics in both modes (RF-CMD-01): avoid kerbs, clean air, battle assist (only with
 *                     KERS/ERS, rules.js commandsFor); defence style and attack risk in the quick mode too.
 *   errores-visibles  `lon[i]` in the step snapshot (NORMAL / LOCKUP / SPIN), the trip through the run-off and
 *                     back, and track limits by era (RF-SIM-10): the lap deleted, the black-and-white flag, the
 *                     penalty ladder - only in the eras that have the procedure (era-defaults.json trackLimits).
 *                     Errors per race in the step mode within ±25 % of the quick mode (SRS 4.2).
 *   danos-visibles    `damage[i]` {frontWing, floor, puncture, lossSecPerLap} (RF-DEV-08), the engineer's radio
 *                     offering a new nose (RF-CMD-03), floor damage by era from f1db, debris that punctures.
 *
 * Every draw of SIM-7 is on its own stream (RNF-05, RF-SIM-15): same seed and orders, same race.
 */

import {
  activeDebris, applyContact, applyDebrisPuncture, classificationOf, commandsFor, debrisPass, judgeTrackLimits, lapBudget, runToFinish, setDefence, setOvertakeRisk,
  setTactics as quickSetTactics, stateRules, stepLap, tacticTime, trackLimitsChanceOf,
} from "../race";
import { damageOf, damageStateOf, floorDamageChancesOf } from "../incidents";
import { battleAssistModeOf } from "../energy";
import { rulesFor } from "../rules";
import { fromQuickRace, setTactics, snapshot, stepOnce } from "./index";
import { packContext, weekend } from "./simTestKit";
import simBalance from "../../data/balance/race-sim.json";
import physicsData from "../../data/balance/race-physics.json";
import eras from "../../data/balance/race-eras.json";
import { radioText, commentary } from "../../components/texts";

const TACTICS = simBalance.tactics;

// Seasons with their packs (real grids) for the eras before the track-limits procedure.
let context = null;
beforeAll(async () => {
  context = await packContext();
});
const RECOVERY = physicsData.mistake.recovery;

const errorsOf = (state) => state.events.filter((event) => event.type === "mistake" || event.type === "track-limits").length;
const fingerprint = (state) => JSON.stringify({ rows: classificationOf(state), events: state.events, radio: state.radio });

/** A stream that always says yes (and the lowest value of a range), to drive a branch in a unit test. */
const yes = { chance: () => true, range: (a) => a, int: (a) => a, next: () => 0, normal: () => 0 };

describe("SIM-7 tacticas · setTactics, defence and risk in both modes (RF-CMD-01)", () => {
  it("commandsFor offers the battle assist only with KERS/ERS; kerbs, clean air, risk and defence always", () => {
    [1988, 2005, 2008, 2010].forEach((year) => expect(commandsFor(year).tactics).toEqual({ avoidKerbs: true, cleanAir: true, battleAssist: false }));
    [2009, 2012, 2014, 2024, 2026].forEach((year) => expect(commandsFor(year).tactics.battleAssist).toBe(true));
    expect(commandsFor(2024).overtakeRisk).toEqual(Object.keys(simBalance.risk.levels));
    expect(commandsFor(2024).defence).toEqual(Object.keys(simBalance.defence.styles));
  });

  it("every car starts with the data's defaults; setTactics changes only known boolean keys, era-checked", () => {
    const quick = weekend({ year: 2024, seed: "tac-a" }).make();
    const mine = quick.cars.find((car) => car.isUser);
    quick.cars.forEach((car) => expect(car.tactics).toEqual(TACTICS.defaults));
    quickSetTactics(quick, mine.id, { avoidKerbs: true, battleAssist: true, bogus: true, cleanAir: "yes" });
    expect(mine.tactics).toEqual({ ...TACTICS.defaults, avoidKerbs: true, battleAssist: true });
    expect(mine.tactics.bogus).toBeUndefined();

    const old = weekend({ year: 2008, seed: "tac-b" }).make();
    const car2008 = old.cars.find((car) => car.isUser);
    quickSetTactics(old, car2008.id, { battleAssist: true, cleanAir: true });
    expect(car2008.tactics).toEqual({ ...TACTICS.defaults, cleanAir: true });
  });

  it("defence style and attack risk are orders in the quick mode too", () => {
    const state = weekend({ year: 2024, seed: "tac-c" }).make();
    const mine = state.cars.find((car) => car.isUser);
    setDefence(state, mine.id, "block");
    setOvertakeRisk(state, mine.id, "high");
    setDefence(state, mine.id, "nonsense");
    expect(mine.defence).toBe("block");
    expect(mine.overtakeRisk).toBe("high");
  });

  it("avoiding the kerbs costs its share of the lap and cuts mistakes, track limits and kerb damage", () => {
    const state = weekend({ year: 2024, seed: "tac-d" }).make();
    const car = state.cars.find((entry) => entry.isUser);
    const base = state.race.baseLap;
    expect(tacticTime(car, base)).toBe(0);
    car.tactics = { ...car.tactics, avoidKerbs: true };
    expect(tacticTime(car, base)).toBeCloseTo(TACTICS.avoidKerbs.lapLossShare * base, 9);
    const rules = stateRules(state);
    const on = trackLimitsChanceOf({ rules, circuitId: "bahrain", avoidKerbs: true });
    const off = trackLimitsChanceOf({ rules, circuitId: "bahrain", avoidKerbs: false });
    expect(on / off).toBeCloseTo(TACTICS.avoidKerbs.trackLimitsFactor, 9);
    const kerbs = floorDamageChancesOf({ year: 2024, laps: 57, kerbFactor: TACTICS.avoidKerbs.floorDamageFactor });
    const plain = floorDamageChancesOf({ year: 2024, laps: 57 });
    expect(kerbs.perLap / plain.perLap).toBeCloseTo(TACTICS.avoidKerbs.floorDamageFactor, 9);
    // The planned lap carries the cost (both modes plan with lapBudget).
    const a = lapBudget(state, { ...car, tactics: { ...car.tactics, avoidKerbs: false }, tyreThermal: { ...car.tyreThermal } }, { lap: 1, wetness: 0 }).expected;
    const b = lapBudget(state, { ...car, tyreThermal: { ...car.tyreThermal } }, { lap: 1, wetness: 0 }).expected;
    expect(b - a).toBeCloseTo(TACTICS.avoidKerbs.lapLossShare * base, 6);
  });

  it("battle assist: deploy in a fight within withinSec, the chosen mode otherwise, overtake in 2026", () => {
    const cfg = TACTICS.battleAssist;
    const r24 = rulesFor(2024);
    const car = { ersMode: "balanced", battery: 60, gapAhead: cfg.withinSec / 2, gapBehind: null, tactics: { battleAssist: true } };
    expect(battleAssistModeOf(r24, car)).toBe("deploy");
    expect(battleAssistModeOf(r24, { ...car, gapAhead: cfg.withinSec * 3 })).toBe("balanced");
    expect(battleAssistModeOf(r24, { ...car, battery: cfg.minBatteryPct / 2 })).toBe("balanced");
    expect(battleAssistModeOf(r24, { ...car, tactics: { battleAssist: false } })).toBe("balanced");
    expect(battleAssistModeOf(r24, { ...car, gapAhead: null, gapBehind: cfg.withinSec / 2 })).toBe("deploy");
    expect(battleAssistModeOf(rulesFor(2026), car)).toBe("overtake");
    expect(battleAssistModeOf(rulesFor(2008), { ...car, ersMode: null, battery: null })).toBe(null);
  });

  it("clean air: the car never passes the car ahead in the quick mode", () => {
    const w = weekend({ year: 2024, seed: "tac-e" });
    const state = w.make();
    state.cars.forEach((car) => quickSetTactics(state, car.id, { cleanAir: true }));
    runToFinish(state);
    expect(state.events.filter((event) => event.type === "pass")).toHaveLength(0);
    const free = runToFinish(w.make());
    expect(free.events.filter((event) => event.type === "pass").length).toBeGreaterThan(0);
  });

  it("clean air in the step mode: no attack is opened within the target gap", () => {
    const w = weekend({ year: 2024, seed: "tac-f" });
    const state = fromQuickRace(w.make(), { race: w.race });
    const mine = state.cars.filter((car) => car.isUser).map((car) => car.id);
    mine.forEach((id) => setTactics(state, id, { cleanAir: true }));
    while (!state.finished) stepOnce(state);
    expect(state.events.filter((event) => event.type === "pass" && mine.includes(event.carId) && !event.switchback)).toHaveLength(0);
  });

  it("the same seed and the same tactics at the same race time give the same race (RF-SIM-15)", () => {
    const w = weekend({ year: 2024, seed: "tac-g" });
    const run = () => {
      const state = w.make();
      const mine = state.cars.find((car) => car.isUser);
      for (let lap = 0; lap < 10; lap += 1) stepLap(state);
      quickSetTactics(state, mine.id, { avoidKerbs: true, battleAssist: true });
      return fingerprint(runToFinish(state));
    };
    expect(run()).toBe(run());
  });
});

describe("SIM-7 errores-visibles · track limits only in their era (RF-SIM-10, criterio 7.2)", () => {
  it("the procedure exists from 2023 and nowhere before (era-defaults.json trackLimits)", () => {
    for (let year = 1950; year <= 2026; year += 1) {
      const procedure = rulesFor(year).raceControl.trackLimits;
      expect({ year, on: Boolean(procedure) }).toEqual({ year, on: year >= 2023 });
    }
    expect(rulesFor(2024).raceControl.trackLimits).toEqual({
      race: { deleteLap: true, blackWhiteAt: 3, penalties: [{ at: 4, type: "time5" }, { at: 5, type: "time10" }] },
      qualifying: { deleteLap: true },
    });
  });

  it("no track-limits event in 2012 or 1988; some in 2024, at the measured rate order of magnitude", () => {
    [2012, 1988].forEach((year) => {
      const state = runToFinish(weekend({ year, seed: `tl-${year}`, teamId: "mclaren", context }).make());
      expect(state.events.filter((event) => event.type === "track-limits" || event.type === "black-white")).toHaveLength(0);
    });
    const seeds = ["tl-a", "tl-b", "tl-c", "tl-d"];
    let offences = 0;
    let carLaps = 0;
    seeds.forEach((seed) => {
      const state = runToFinish(weekend({ year: 2024, seed }).make());
      offences += state.events.filter((event) => event.type === "track-limits").length;
      carLaps += state.cars.reduce((sum, car) => sum + car.history.filter((entry) => !entry.retired).length, 0);
    });
    const rate = offences / carLaps;
    // Bahrain 2024 measured 0.0158 a car-lap (race-eras.json trackLimits.circuits.bahrain); SC laps and modes move it.
    expect(rate).toBeGreaterThan(eras.trackLimits.circuits.bahrain * 0.5);
    expect(rate).toBeLessThan(eras.trackLimits.circuits.bahrain * 1.6);
  });

  it("the ladder: lap deleted, black-and-white at the third, 5 s at the fourth, 10 s at the fifth", () => {
    const state = weekend({ year: 2024, seed: "tl-ladder" }).make();
    stepLap(state);
    const car = state.cars.find((entry) => entry.isUser);
    for (let k = 0; k < 5; k += 1) judgeTrackLimits(state, car, 4);
    const kinds = state.events.filter((event) => event.carId === car.id && ["track-limits", "black-white", "penalty"].includes(event.type));
    expect(kinds.filter((event) => event.type === "track-limits").map((event) => event.strike)).toEqual([1, 2, 3, 4, 5]);
    expect(kinds.filter((event) => event.type === "track-limits").every((event) => event.deleted)).toBe(true);
    expect(kinds.filter((event) => event.type === "black-white")).toHaveLength(1);
    expect(kinds.filter((event) => event.type === "penalty").map((event) => [event.offence, event.penalty, event.seconds])).toEqual([["trackLimits", "time5", 5], ["trackLimits", "time10", 10]]);
    expect(state.radio.some((message) => message.kind === "track-limits" && message.carId === car.id)).toBe(true);
    expect(car.lapDeleted).toBe(true);
    // In 2012 nobody judges track limits.
    const old = weekend({ year: 2012, seed: "tl-ladder", teamId: "mclaren", context }).make();
    const car12 = old.cars[0];
    judgeTrackLimits(old, car12, 4);
    expect(old.events.filter((event) => event.type === "track-limits")).toHaveLength(0);
  });

  it("a deleted lap sets no best lap, in both modes", () => {
    const w = weekend({ year: 2024, seed: "tl-best" });
    // A deleted lap never moves the car's best lap at the moment it is written to the history.
    const watch = (state, advance) => {
      let deleted = 0;
      let moved = 0;
      while (!state.finished) {
        const before = state.cars.map((car) => [car.history.length, car.bestLap]);
        advance(state);
        state.cars.forEach((car, i) => {
          const fresh = car.history.slice(before[i][0]);
          if (fresh.some((entry) => entry.deleted)) {
            deleted += 1;
            if (car.bestLap !== before[i][1]) moved += 1;
          }
        });
      }
      return { deleted, moved };
    };
    const quick = watch(w.make(), stepLap);
    expect(quick.deleted).toBeGreaterThan(0);
    expect(quick.moved).toBe(0);
    const step = watch(fromQuickRace(w.make(), { race: w.race }), stepOnce);
    expect(step.deleted).toBeGreaterThan(0);
    expect(step.moved).toBe(0);
  });

  it("errors per race: the step mode within ±25 % of the quick mode (mistakes and track limits, SRS 4.2)", () => {
    const seeds = Array.from({ length: 6 }, (_, k) => `err${k + 1}`);
    let step = 0;
    let quick = 0;
    let limitsStep = 0;
    let limitsQuick = 0;
    seeds.forEach((seed) => {
      const w = weekend({ year: 2024, seed });
      const s = fromQuickRace(w.make(), { race: w.race });
      while (!s.finished) stepOnce(s);
      const q = runToFinish(w.make());
      step += errorsOf(s);
      quick += errorsOf(q);
      limitsStep += s.events.filter((event) => event.type === "track-limits").length;
      limitsQuick += q.events.filter((event) => event.type === "track-limits").length;
    });
    expect(quick).toBeGreaterThan(40);
    expect(limitsQuick).toBeGreaterThan(20);
    expect(step / quick).toBeGreaterThan(0.75);
    expect(step / quick).toBeLessThan(1.25);
    expect(limitsStep / limitsQuick).toBeGreaterThan(0.75);
    expect(limitsStep / limitsQuick).toBeLessThan(1.25);
  });
});

describe("SIM-7 errores-visibles · lon[i] and the trip through the run-off (F1M24-GAMEPLAY §1.7)", () => {
  it("NORMAL by default, LOCKUP and SPIN while paying those errors, off the road and back for wide and spin", () => {
    const seen = { LOCKUP: 0, SPIN: 0, offMax: 0, offSpin: 0, rejoined: 0, normalOutside: true, lockupOnLockup: true };
    ["lon1", "lon2", "lon3", "lon4"].forEach((seed) => {
      const w = weekend({ year: 2024, seed });
      const state = fromQuickRace(w.make(), { race: w.race });
      const wasOff = new Map();
      while (!state.finished) {
        stepOnce(state);
        snapshot(state).forEach((car) => {
          expect(["NORMAL", "LOCKUP", "SPIN"]).toContain(car.lon);
          if (!car.incident && car.lon !== "NORMAL") seen.normalOutside = false;
          if (car.incident === "lockup" && car.lon !== "LOCKUP") seen.lockupOnLockup = false;
          if (car.lon === "LOCKUP") seen.LOCKUP += 1;
          if (car.lon === "SPIN") seen.SPIN += 1;
          if (car.offTrack) {
            seen.offMax = Math.max(seen.offMax, car.offTrack.metres);
            if (car.incident === "spin") seen.offSpin += 1;
            wasOff.set(car.id, true);
          } else if (wasOff.get(car.id)) {
            seen.rejoined += 1;
            wasOff.delete(car.id);
          }
        });
      }
    });
    expect(seen.normalOutside).toBe(true);
    expect(seen.lockupOnLockup).toBe(true);
    expect(seen.LOCKUP).toBeGreaterThan(0);
    expect(seen.SPIN + seen.offSpin).toBeGreaterThan(0);
    expect(seen.offMax).toBeGreaterThan(0);
    expect(seen.offMax).toBeLessThanOrEqual(RECOVERY.runoffMetres + 1e-9);
    expect(seen.rejoined).toBeGreaterThan(0);
  });
});

describe("SIM-7 danos-visibles · damage[i], radio, floor by era, debris (RF-DEV-08, RF-CMD-03)", () => {
  it("damageOf: RF-DEV-08 states from the seconds a lap, null on an undamaged car", () => {
    expect(damageOf({ damage: 0, floorDamage: 0, puncture: false })).toBeNull();
    expect(damageOf({ damage: 0.6, floorDamage: 0, puncture: false })).toEqual({ frontWing: "light", floor: "perfect", puncture: false, lossSecPerLap: 0.6 });
    expect(damageOf({ damage: 1.2, floorDamage: 0.5, puncture: true })).toEqual({ frontWing: "heavy", floor: "heavy", puncture: true, lossSecPerLap: 1.7 });
    expect(damageStateOf("wing", 5)).toBe("destroyed");
  });

  it("floor damage follows f1db by era: none before 1989 or in 1994-2013, most with ground effect (2022-26)", () => {
    [1976, 1988, 1998, 2005, 2012].forEach((year) => expect(floorDamageChancesOf({ year, laps: 60 })).toEqual({ perLap: 0, offTrack: 0 }));
    const modern = floorDamageChancesOf({ year: 2024, laps: 60 });
    const hybrid = floorDamageChancesOf({ year: 2018, laps: 60 });
    expect(modern.perLap).toBeGreaterThan(hybrid.perLap);
    expect(hybrid.perLap).toBeGreaterThan(0);
    // No floor damage at all in a 2008 race.
    const state = runToFinish(weekend({ year: 2008, seed: "floor-08" }).make());
    expect(state.events.filter((event) => event.type === "damage" && event.part === "floor")).toHaveLength(0);
  });

  it("a broken front wing: the engineer offers a new nose, the step snapshot shows it", () => {
    const w = weekend({ year: 2024, seed: "wing" });
    const state = fromQuickRace(w.make(), { race: w.race });
    for (let k = 0; k < 400; k += 1) stepOnce(state);
    const mine = state.cars.find((car) => car.isUser && car.status === "running");
    applyContact(state, mine, { kind: "wing", loss: 1, wing: 1.2 }, { stream: { ...yes, chance: () => false }, lap: state.lap });
    const radio = state.radio.find((message) => message.kind === "wing-damage" && message.carId === mine.id);
    expect(radio).toMatchObject({ change: true, loss: Math.round(mine.damage * 10) / 10 });
    expect(radioText(null, radio, { [mine.id]: "X" })).toMatch(/X/);
    const view = snapshot(state).find((car) => car.id === mine.id);
    expect(view.damage).toMatchObject({ frontWing: damageStateOf("wing", mine.damage), puncture: Boolean(mine.puncture) });
    expect(view.damage.frontWing).not.toBe("perfect");
  });

  it("debris stays at its corner, punctures a car that passes, and is cleared after the safety car", () => {
    const state = weekend({ year: 2024, seed: "debris" }).make();
    stepLap(state);
    const [victim, other] = state.cars.filter((car) => car.status === "running");
    state.debris = [{ corner: 4, carId: other.id, lap: state.lap, until: state.lap + 2 }];
    expect(activeDebris(state, state.lap)).toHaveLength(1);
    const hit = debrisPass(state, victim, { raceLap: state.lap, stream: yes });
    expect(hit).toEqual({ corner: 4, limp: expect.any(Number) });
    const lost = applyDebrisPuncture(state, victim, hit, state.lap);
    expect(lost).toBeGreaterThan(0);
    expect(victim.puncture).toBe(true);
    expect(state.events.some((event) => event.type === "puncture" && event.debris && event.carId === victim.id)).toBe(true);
    expect(commentary(state.events[state.events.length - 1], { [victim.id]: "Y" }, null)).toMatch(/Y/);
    // Already punctured: no second roll. After the restart that follows a neutralisation the debris is gone.
    expect(debrisPass(state, victim, { raceLap: state.lap, stream: yes })).toBeNull();
    state.restartLap = state.lap + 1;
    expect(activeDebris(state, state.lap + 1)).toHaveLength(0);
    expect(activeDebris({ debris: state.debris }, state.lap + 3)).toHaveLength(0);
  });

  it("radio and commentary texts exist in ES and EN for every new kind", () => {
    const names = { a: "A" };
    ["wing-damage", "floor-damage", "puncture", "track-limits"].forEach((kind) => expect(radioText(null, { kind, carId: "a", loss: 0.5, change: false }, names)).not.toBe(""));
    [
      { type: "track-limits", carId: "a", corner: 4, strike: 2, deleted: true },
      { type: "black-white", carId: "a" },
      { type: "damage", carId: "a", part: "floor", loss: 0.3 },
      { type: "puncture", carId: "a", corner: 4, debris: true },
    ].forEach((event) => expect(commentary(event, names, null)).toMatch(/A/));
  });
});
