/**
 * RF-STF-02 / RF-STF-03: the twelve driver attributes, derived from f1db for every pack, and
 * what they do in both race modes (RF-SIM-07, RF-SIM-09, RF-SIM-13, RF-CMD-01; SIM-FISICA WP4,
 * WP8). Balance in data/balance/driver-attributes.json (RNF-07, schema checked here).
 */

import Ajv from "ajv";
import schema from "../packs/schema/driver-attributes.schema.json";
import BALANCE from "../../data/balance/driver-attributes.json";
import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { createStream } from "../../../overcutTrayectoria/engine/rng";
import { reference } from "../../data/reference";
import { createCareer, createContext, createWeekendRace, runPractice, runQualifyingSession, weekendRaceArgs, MANAGER_VERSION } from "../career";
import { validateCareer } from "../save";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import { passChanceOf, rivalCalls, runToFinish } from "../race";
import { createStepRace, runStepToFinish, snapshot, stepFor } from "../sim";
import {
  SKILL_KEYS, aiDefenceStyleOf, contactFactorOf, coverChanceOf, cornerNoiseSigmaOf, ensureSkills, mistakeFactorOf, passSkillTerm, raceFormOf, skillsFromLegacy,
  startSkillTime, triggerFactorOf, volatilityFactorOf, wearSkillOf,
} from "./skills";

let packs = {};
let context = null;
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

const at = (value) => ({ skills: Object.fromEntries(SKILL_KEYS.map((key) => [key, value])) });
const withSkill = (key, value) => ({ skills: { ...at(60).skills, [key]: value } });

/** Pearson correlation. */
const corr = (xs, ys) => {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let k = 0; k < n; k += 1) {
    sxy += (xs[k] - mx) * (ys[k] - my);
    sxx += (xs[k] - mx) ** 2;
    syy += (ys[k] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
};

describe("RNF-07 · driver-attributes.json", () => {
  it("matches its schema", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(BALANCE) || validate.errors).toBe(true);
  });

  it("carries the real pass targets of f1db for every era and the form fitted to them", () => {
    const eras = BALANCE.derivation.passEras.map(([from, to]) => `${from}-${to}`);
    eras.forEach((era) => expect(BALANCE.measured.passes.some((row) => row.era === era && row.circuitType === "RACE")).toBe(true));
    seasonPackYears().forEach((year) => expect(BALANCE.effects.form.byEra.some((row) => year >= row.from && year <= row.to)).toBe(true));
  });
});

describe("RF-STF-03 · attributes derived from f1db in every pack", () => {
  it("every driver who started a race has the twelve, on the scale, with the method named", () => {
    Object.values(packs).forEach((pack) => {
      expect(pack.ratings.skillsMethod).toBe("v1-f1db-attributes");
      pack.ratings.drivers
        .filter((row) => row.starts > 0)
        .forEach((row) => {
          expect(Object.keys(row.skills).sort()).toEqual([...SKILL_KEYS].sort());
          SKILL_KEYS.forEach((key) => {
            expect(row.skills[key]).toBeGreaterThanOrEqual(BALANCE.derivation.scale.min);
            expect(row.skills[key]).toBeLessThanOrEqual(BALANCE.derivation.scale.max);
          });
        });
    });
  });

  it("follow the real results: team-mate pace, solo crashes, titles", () => {
    const pace = [];
    const gap = [];
    const control = [];
    const crashes = [];
    const commercial = [];
    const wins = [];
    Object.values(packs).forEach((pack) => {
      pack.ratings.drivers.forEach((row) => {
        if (!row.skills || row.starts < 10) return;
        if (row.medianGapToTeammatePct !== null) {
          pace.push((row.skills.cornering + row.skills.braking) / 2);
          gap.push(row.medianGapToTeammatePct);
        }
        const solo = pack.realResults.filter((r) => r.driverId === row.driverId && ["Accident", "Spun off", "Spin"].includes(r.retired)).length;
        control.push(row.skills.control);
        crashes.push(solo / row.starts);
        commercial.push(row.skills.commercialValue);
        wins.push(row.wins);
      });
    });
    // Quicker than the team-mate in qualifying = better cornering and braking.
    expect(corr(pace, gap)).toBeLessThan(-0.5);
    // More solo accidents = less control.
    expect(corr(control, crashes)).toBeLessThan(-0.3);
    // Winners are worth more.
    expect(corr(commercial, wins)).toBeGreaterThan(0.3);
  });

  it("the world's drivers carry them (pack) and a driver the pack does not know gets them from his profile", () => {
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "skills" });
    const alonso = career.world.drivers["fernando-alonso"];
    const row = packs[2012].ratings.drivers.find((entry) => entry.driverId === "fernando-alonso");
    expect(alonso.skills).toEqual(row.skills);
    Object.values(career.world.drivers).forEach((driver) => expect(Object.keys(driver.skills).sort()).toEqual([...SKILL_KEYS].sort()));
    // Legacy: the profile, not the level - a racer whose racecraft is above his own mean overtakes better.
    const legacy = skillsFromLegacy({ pace: 80, qualifying: 80, racecraft: 90, consistency: 70, wet: 80, technical: 80 }, { talent: 85, rating: 80 });
    expect(legacy.overtaking).toBeGreaterThan(60);
    expect(legacy.control).toBeLessThan(60);
    const flat = skillsFromLegacy({ pace: 90, qualifying: 90, racecraft: 90, consistency: 90, wet: 90, technical: 90 });
    expect(flat.overtaking).toBe(60);
  });
});

describe("RNF-06 · save migration v4 -> v5", () => {
  it("gives every driver of an old save the twelve without moving his rating", () => {
    const career = createCareer(context, { year: 2008, teamId: "williams", seed: "v4" });
    const saved = JSON.parse(JSON.stringify(career));
    saved.v = 4;
    Object.values(saved.world.drivers).forEach((driver) => delete driver.skills);
    const ratings = Object.fromEntries(Object.values(saved.world.drivers).map((driver) => [driver.id, driver.rating]));
    const loaded = validateCareer(saved);
    expect(MANAGER_VERSION).toBe(5);
    expect(loaded.v).toBe(5);
    Object.values(loaded.world.drivers).forEach((driver) => {
      expect(Object.keys(driver.skills).sort()).toEqual([...SKILL_KEYS].sort());
      expect(driver.rating).toBe(ratings[driver.id]);
    });
    // Idempotent: a driver who has them keeps them.
    const one = { ...Object.values(loaded.world.drivers)[0] };
    const before = { ...one.skills };
    expect(ensureSkills(one).skills).toEqual(before);
  });
});

describe("RF-STF-02 · what each attribute does", () => {
  it("overtaking, defending, braking and aggression move the pass chance (both modes)", () => {
    const chance = (attacker, defender) => passChanceOf({ delta: 0.4, skill: passSkillTerm(attacker, defender) });
    expect(chance(withSkill("overtaking", 75), at(60))).toBeGreaterThan(chance(at(60), at(60)));
    expect(chance(at(60), withSkill("defending", 75))).toBeLessThan(chance(at(60), at(60)));
    expect(chance(withSkill("aggression", 75), at(60))).toBeGreaterThan(chance(at(60), at(60)));
    expect(passSkillTerm(at(60), at(60))).toBe(0);
    // The squeeze: an aggressive attacker touches more.
    expect(contactFactorOf(withSkill("aggression", 80), at(60))).toBeGreaterThan(contactFactorOf(at(60), at(60)));
  });

  it("control, adaptability, accuracy, smoothness and starts shape mistakes, scatter, wear and the launch", () => {
    expect(mistakeFactorOf(withSkill("control", 75))).toBeLessThan(mistakeFactorOf(withSkill("control", 45)));
    // At the mean driver the old field-mean factor (consistency 69.4): rates calibrated against f1db do not move.
    expect(mistakeFactorOf(at(60))).toBeCloseTo(BALANCE.effects.mistake.base, 6);
    expect(mistakeFactorOf(withSkill("adaptability", 75), 0.6)).toBeLessThan(mistakeFactorOf(withSkill("adaptability", 45), 0.6));
    expect(mistakeFactorOf(withSkill("adaptability", 75), 0)).toBe(mistakeFactorOf(withSkill("adaptability", 45), 0));
    expect(volatilityFactorOf(withSkill("accuracy", 75))).toBeLessThan(volatilityFactorOf(withSkill("accuracy", 45)));
    expect(cornerNoiseSigmaOf(withSkill("accuracy", 75))).toBeLessThan(cornerNoiseSigmaOf(withSkill("accuracy", 45)));
    expect(wearSkillOf(withSkill("smoothness", 75))).toBeLessThan(1);
    expect(wearSkillOf(withSkill("smoothness", 45))).toBeGreaterThan(1);
    expect(startSkillTime(withSkill("starts", 75))).toBeGreaterThan(startSkillTime(withSkill("starts", 45)));
    // Race-day form: zero mean, narrower for an adaptable driver.
    const draws = (car) => {
      const stream = createStream("form-test");
      return Array.from({ length: 4000 }, () => raceFormOf(car, 1988, stream));
    };
    const sd = (values) => Math.sqrt(values.reduce((s, v) => s + v * v, 0) / values.length);
    const mean = draws(at(60)).reduce((s, v) => s + v, 0) / 4000;
    expect(Math.abs(mean)).toBeLessThan(0.0005);
    expect(sd(draws(withSkill("adaptability", 80)))).toBeLessThan(sd(draws(withSkill("adaptability", 40))));
  });

  it("aggression widens the attack gap; the defence style follows defending and aggression", () => {
    expect(triggerFactorOf(withSkill("aggression", 80))).toBeGreaterThan(1);
    expect(triggerFactorOf(withSkill("aggression", 40))).toBeLessThan(1);
    expect(aiDefenceStyleOf({ skills: { ...at(60).skills, defending: 78, aggression: 78 } })).toBe("block");
    expect(aiDefenceStyleOf(withSkill("aggression", 45))).toBe("holdRacingLine");
    expect(aiDefenceStyleOf(at(60))).toBe("holdCarBehind");
    expect(coverChanceOf(at(60), "block")).toBeGreaterThan(coverChanceOf(at(60), "holdCarBehind"));
    expect(coverChanceOf(at(60), "holdRacingLine")).toBeLessThan(coverChanceOf(at(60), "holdCarBehind"));
  });
});

const raceOf = (year, teamId, seed) => {
  const career = createCareer(context, { year, teamId, seed });
  runPractice(career, {});
  runQualifyingSession(career, {});
  return career;
};

describe("RF-SIM-13 · the rival pit wall uses them", () => {
  it("every car races with its driver's skills, AI defence styles and a race-day form, the same for both modes", () => {
    const career = raceOf(2012, "williams", "ai-1");
    const quick = createWeekendRace(career);
    const step = createStepRace(weekendRaceArgs(career));
    quick.cars.forEach((car, k) => {
      expect(car.skills.overtaking).toBeDefined();
      expect(Number.isFinite(car.form)).toBe(true);
      expect(step.cars[k].form).toBe(car.form);
      expect(step.cars[k].defence).toBe(car.defence);
    });
    quick.cars.filter((car) => car.isUser).forEach((car) => expect(car.defence).toBe("holdCarBehind"));
  });

  it("an AI driver stuck behind a car it cannot pass drops back into clean air", () => {
    const career = raceOf(2012, "williams", "ai-2");
    const state = createWeekendRace(career);
    const [ahead, car] = state.cars.filter((entry) => !entry.isUser).slice(4, 6);
    ahead.position = 5;
    car.position = 6;
    car.gapAhead = 0.5;
    car.gapBehind = 3;
    car.expected = 90;
    ahead.expected = 90;
    car.skills = { ...car.skills, aggression: 60 };
    for (let lap = 10; lap < 10 + BALANCE.effects.ai.stuckLaps + 1; lap += 1) rivalCalls(state, car, lap);
    expect(car.mode).toBe(BALANCE.effects.ai.cleanAirMode);
    // With the pace to pass it keeps attacking.
    ahead.expected = 90 + BALANCE.effects.ai.paceEdge + 0.3;
    rivalCalls(state, car, 20);
    expect(car.mode).not.toBe(BALANCE.effects.ai.cleanAirMode);
  });

  it("team orders only where the rules allow them (banned 2003-2010)", () => {
    const orders = (year, teamId) => {
      let swaps = 0;
      let calls = 0;
      for (let s = 0; s < 6; s += 1) {
        const state = createWeekendRace(raceOf(year, teamId, `orders-${year}-${s}`));
        runToFinish(state);
        swaps += state.events.filter((event) => event.type === "swap").length;
        calls += Object.keys(state.aiOrders || {}).length;
      }
      return { swaps, calls };
    };
    const banned = orders(2005, "minardi");
    expect(banned.swaps).toBe(0);
    expect(banned.calls).toBe(0);
    const legal = orders(2012, "hrt");
    expect(legal.calls).toBeGreaterThan(0);
  });
});

describe("WP4 / WP8 · the step mode's duel and the driver's lap", () => {
  const career = () => raceOf(2012, "williams", "duel");

  it("duels cover the inside or not, go round the outside, and the view sees the lateral state", () => {
    const state = createStepRace(weekendRaceArgs(career()));
    const lanes = new Set();
    for (let t = 0; t < 2400; t += 4) {
      stepFor(state, 4);
      snapshot(state).forEach((car) => lanes.add(car.lane));
      if (state.finished) break;
    }
    runStepToFinish(state);
    const duels = state.duels.filter((duel) => duel.line);
    expect(duels.some((duel) => duel.covered && duel.line === "outside")).toBe(true);
    expect(duels.some((duel) => !duel.covered && duel.line === "inside")).toBe(true);
    expect(duels.every((duel) => (duel.covered ? duel.line === "outside" : duel.line === "inside"))).toBe(true);
    ["racing", "defend"].forEach((lane) => expect(lanes.has(lane)).toBe(true));
    expect(lanes.has("attack-inside") || lanes.has("attack-outside")).toBe(true);
  });

  it("is deterministic with the drivers in it (RF-SIM-15, RNF-05)", () => {
    const run = () => {
      const state = createStepRace(weekendRaceArgs(career()));
      runStepToFinish(state);
      return JSON.stringify(state.cars.map((car) => [car.id, car.time, car.history.length])) + JSON.stringify(state.duels.length);
    };
    expect(run()).toBe(run());
  });
});
