/**
 * rnf07-race (SIM-1 of docs/manager/F1M24-GAMEPLAY.md; RNF-07, RF-SIM-03, RF-SIM-07, RF-SIM-09):
 * the balance numbers the quick mode's lap terms used to carry in code - the pass chance, the
 * tyre's heat window, the start, the driver's mistakes and scatter, the fuel behind the safety car -
 * and the step simulator's crew factor on the release are read from data/balance with a JSON schema.
 *
 * A pure refactor: the golden races (raceGolden.test.js, quickRace.golden.json) stay byte-identical
 * and the SRS 4.2 equivalence (equivalence.test.js) keeps its tolerances. Here: both files pass their
 * schema, and each term moves when (and only when) its JSON value moves, so the code really reads it.
 */

import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { createStream } from "../../../overcutTrayectoria/engine/rng";
import simSchema from "../packs/schema/race-sim.schema.json";
import erasSchema from "../packs/schema/race-eras.schema.json";
import simData from "../../data/balance/race-sim.json";
import erasData from "../../data/balance/race-eras.json";
import { endLapWear, mistakeChanceOf, passChanceOf, rollMistake, startTerm } from "../race";
import { rulesFor } from "../rules";

/** Run `fn` with `block[key]` set to `value`, then put it back (the JSON modules are shared). */
const withValue = (block, key, value, fn) => {
  const saved = block[key];
  block[key] = value;
  try {
    return fn();
  } finally {
    block[key] = saved;
  }
};

describe("RNF-07 balance files of the race engine", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });

  test("race-sim.json passes its schema", () => {
    const validate = ajv.compile(simSchema);
    expect(validate(simData) ? [] : validate.errors).toEqual([]);
  });

  test("race-eras.json passes its schema", () => {
    const validate = ajv.compile(erasSchema);
    expect(validate(erasData) ? [] : validate.errors).toEqual([]);
  });

  test("the schemas are closed on the blocks this package moved", () => {
    const validateSim = ajv.compile(simSchema);
    expect(validateSim({ ...simData, pitRelease: { ...simData.pitRelease, extra: 1 } })).toBe(false);
    expect(validateSim({ ...simData, duel: { ...simData.duel, max: 1.5 } })).toBe(false);
    const validateEras = ajv.compile(erasSchema);
    expect(validateEras({ ...erasData, mistake: { ...erasData.mistake, chancePerLap: -0.1 } })).toBe(false);
    const { thermal, ...tyresWithout } = erasData.tyres;
    expect(thermal).toBeDefined();
    expect(validateEras({ ...erasData, tyres: tyresWithout })).toBe(false);
  });
});

describe("rnf07-race: the quick mode's terms read the JSON", () => {
  const duel = simData.duel;

  test("passChanceOf: base, slopes, wet and cold-tyre terms and the clamp come from race-sim.json duel", () => {
    const args = { overtaking: 0.5, delta: 0.6 };
    const now = passChanceOf(args);
    expect(now).toBeCloseTo(duel.base + 0.5 * duel.overtaking + (0.6 - duel.paceThreshold) * duel.pace, 12);
    expect(withValue(duel, "base", duel.base + 0.05, () => passChanceOf(args))).toBeCloseTo(now + 0.05, 12);
    expect(withValue(duel, "pace", duel.pace * 2, () => passChanceOf(args))).toBeCloseTo(now + (0.6 - duel.paceThreshold) * duel.pace, 12);
    expect(passChanceOf({ ...args, aheadColdTyre: true }) - now).toBeCloseTo(duel.coldTyre, 12);
    expect(passChanceOf({ ...args, wetness: duel.wetFrom + 0.01 }) - now).toBeCloseTo(duel.wet, 12);
    expect(withValue(duel, "max", 0.2, () => passChanceOf(args))).toBe(0.2);
    expect(passChanceOf({ overtaking: 0, delta: -5 })).toBe(duel.min);
  });

  test("mistakeChanceOf scales with race-eras.json mistake.chancePerLap and is clamped by its min/max", () => {
    const m = erasData.mistake;
    const args = { driver: 1, mode: "normal", compound: "medium", wetness: 0 };
    expect(mistakeChanceOf(args)).toBeCloseTo(m.chancePerLap, 12);
    expect(withValue(m, "chancePerLap", m.chancePerLap * 2, () => mistakeChanceOf(args))).toBeCloseTo(m.chancePerLap * 2, 12);
    expect(mistakeChanceOf({ ...args, cold: 0.1 })).toBeCloseTo(m.chancePerLap * (1 + 0.1 * m.coldGain), 12);
    expect(withValue(m, "max", 0.004, () => mistakeChanceOf(args))).toBe(0.004);
  });

  test("rollMistake: cost range, kind thresholds and the lock-up's wear from race-eras.json mistake", () => {
    const m = erasData.mistake;
    const roll = (cost) =>
      withValue(m, "max", 1, () =>
        withValue(m, "min", 1, () =>
          withValue(m, "costSec", [cost, cost], () => {
            const car = { mode: "normal", compound: "medium", tyreWear: 0 };
            const kind = rollMistake(car, { wetness: 0, wing: 0, cold: 0 }, createStream("sim1-mistake"));
            return { kind, car };
          }),
        ),
      );
    expect(roll(m.spinAboveSec + 0.1).kind).toBe("spin");
    expect(roll(m.wideAboveSec + 0.1).kind).toBe("wide");
    const lock = roll(m.wideAboveSec - 0.1);
    expect(lock.kind).toBe("lockup");
    expect(lock.car.pendingMistake).toBeCloseTo(m.wideAboveSec - 0.1, 12);
    expect(lock.car.tyreWear).toBe(m.lockupWearLaps);
  });

  test("startTerm: the scrum per grid slot comes from race-eras.json start (same seed, same launch draw)", () => {
    const s = erasData.start;
    const car = { attributes: {} };
    const base = startTerm(car, 10, createStream("sim1-start"));
    const wider = withValue(s, "scrumPerSlotSec", s.scrumPerSlotSec + 0.1, () => startTerm(car, 10, createStream("sim1-start")));
    expect(wider - base).toBeCloseTo(10 * 0.1, 9);
    const later = withValue(s, "scrumSec", s.scrumSec + 1, () => startTerm(car, 10, createStream("sim1-start")));
    expect(later - base).toBeCloseTo(1, 9);
  });

  test("endLapWear: fuel behind the safety car and the heat drift come from race-eras.json", () => {
    const rules = rulesFor(2024);
    expect(rules.refuelling).toBe(false);
    const lapOf = (sc, mode = "normal") => {
      const state = { trackTemp: erasData.tyres.thermal.trackRefC, safetyCar: sc };
      const car = { tyreAge: 0, fuel: 50, mode, tyreTemp: 0.5 };
      endLapWear(state, car, { mix: { burn: 1 }, dirty: 0 }, { wetness: 0, sc, rules });
      return car;
    };
    expect((50 - lapOf(true).fuel) / (50 - lapOf(false).fuel)).toBeCloseTo(erasData.fuel.scBurn, 12);
    expect(50 - lapOf(false, "push").fuel).toBeCloseTo(erasData.fuel.modeBurn.push, 12);
    expect(50 - lapOf(false, "save").fuel).toBeCloseTo(erasData.fuel.modeBurn.save, 12);
    const t = erasData.tyres.thermal;
    expect(lapOf(true).tyreTemp).toBeCloseTo(0.5 + (t.scTarget - 0.5) * t.driftRelax, 12);
    expect(lapOf(false).tyreTemp).toBeCloseTo(0.5 + (erasData.tyres.tempTarget.normal - 0.5) * t.driftRelax, 12);
  });

  test("the step simulator's release reads race-sim.json pitRelease, not a literal", () => {
    const source = fs.readFileSync(path.join(__dirname, "stepRace.js"), "utf8");
    expect(source).toMatch(/pitRelease\.crewCeiling/);
    expect(source).not.toMatch(/1\.4 - car\.crew/);
    const race = fs.readFileSync(path.join(__dirname, "..", "race.js"), "utf8");
    // The literals rnf07-race listed (F1M24-GAMEPLAY §3.1, gap-sim) are gone from race.js.
    ["0.006 *", "stream.range(1.2, 5)", "car.tyreWear += 0.8", "car.tyreTemp - 0.72", "baseLap * 0.0036", "(sc ? 0.62 : 1)", "/ 220", "stream.normal(0, 0.55)"].forEach((literal) =>
      expect(race.includes(literal)).toBe(false),
    );
  });
});
