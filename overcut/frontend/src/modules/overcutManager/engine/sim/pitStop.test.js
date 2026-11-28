/**
 * WP7 "parada por etapas" (docs/manager/SIM-FISICA.md §3.9, §4.5): RF-SIM-12, RF-STF-07,
 * RNF-05, RNF-07.
 *
 *   - the median stop of each era within 0.2 s of its real median (race-pit.json `target`),
 *     measured on full quick races with the engine's own fuel loads and crews, counting the
 *     stops the real one counts (`target.measure`: lane, with a double stack's wait; stationary, without);
 *   - an error (slow stop) in fewer than 5 % of stops;
 *   - stages in order with their roles; wheels, wing and fuel in parallel; fuel only in
 *     refuelling eras; a better crew stops faster (RF-STF-07);
 *   - the crew stream: same seed, same stop; a fixed number of draws whatever goes wrong.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { createStream } from "../../../overcutTrayectoria/engine/rng";
import { eraProfileFor } from "../../../overcutTrayectoria/engine/eras";
import { reference } from "../../data/reference";
import pitBalance from "../../data/balance/race-pit.json";
import { createCareer, createContext, currentRace, entrantsFor, runPractice, runQualifyingSession, seasonWorld } from "../career";
import { createRace, runToFinish } from "../race";
import { rulesFor } from "../rules";
import { eraWithRegulations } from "../packs/packWorld";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import { WHEELS, expectedStationary, planStop, stageAt, stageInfoAt, stopEraFor, stopEvents } from "./pitStop";

const FIELDED = [1976, 1988, 1998, 2005, 2008, 2012, 2016, 2024];
const SAMPLES = {
  "1982-1993": [1986, 1990, 1993],
  "1994-2009": [1998, 2004, 2008],
  "2010-2010": [2010],
  "2011-2012": [2011, 2012],
  "2013-2018": [2014, 2016, 2018],
  "2019-2026": [2019, 2022, 2024],
};
// Six weekends a year: with three, the error share (~60 errors in ~1200 stops) moved by its own noise
// across the 5 % line when the stop count changed (5.2 % on three seeds, 3.2 % on six; tolerance unchanged).
const SEEDS = ["stops-a", "stops-b", "stops-c", "stops-d", "stops-e", "stops-f"];

let context = null;
let packs = {};
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

const quickRace = (year, seed) => {
  const base = FIELDED.reduce((best, candidate) => (Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best), FIELDED[0]);
  const world = seasonWorld(context, base, seed);
  const teamId = world.order.find((id) => !world.teams[id].partial);
  const career = createCareer(context, { year: base, teamId, seed, mode: "free" });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const race = currentRace(career);
  const entrants = entrantsFor(career);
  const grid = career.weekend.qualifying.order.filter((id) => entrants.some((entrant) => entrant.id === id));
  const era = packs[year] ? eraWithRegulations(year, packs[year].regulations) : eraProfileFor(year);
  return createRace({ race, era, year, entrants, grid, seed });
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

describe("RF-SIM-12 · the stop against the real one, era by era", () => {
  const rows = [];
  let errors = 0;
  let total = 0;
  beforeAll(() => {
    Object.entries(SAMPLES).forEach(([era, years]) => {
      const stops = [];
      // What the real median counts (race-pit.json target.measure): the f1db-derived eras time every stop in the pit
      // lane, so a double-stacked car's wait for its team-mate is inside it (the event's stationary carries it); a
      // stationary-time target counts the car on its marks only. Until SIM-C4 every second car of a team stopping on
      // the same lap was flagged stacked, so this filter also dropped the ones that met an empty box.
      const { target } = stopEraFor(years[0]);
      const counted = (event) => event.type === "pit" && !event.penalty && (target.measure === "lane" || !event.stacked);
      years.forEach((year) =>
        SEEDS.forEach((seed) => {
          const state = runToFinish(quickRace(year, seed));
          state.events
            .filter(counted)
            .forEach((event) => {
              stops.push(event.stationary);
              total += 1;
              if (event.slow) errors += 1;
            });
        }),
      );
      rows.push({ era, years, n: stops.length, median: median(stops), target });
    });
    // eslint-disable-next-line no-console
    console.log(rows.map((r) => `${r.era}: ${r.n} stops, median ${r.median.toFixed(2)} s, real ${r.target.median} s (${r.target.ver})`).join("\n") + `\nerrors ${errors}/${total} = ${((100 * errors) / total).toFixed(2)} %`);
  });

  it("median within 0.2 s of the era's real median", () => {
    rows.forEach((row) => {
      expect(row.n).toBeGreaterThan(30);
      expect(Math.abs(row.median - row.target.median)).toBeLessThanOrEqual(0.2);
    });
  });

  it("errors in fewer than 5 % of stops", () => {
    expect(total).toBeGreaterThan(300);
    expect(errors / total).toBeLessThan(0.05);
    expect(errors).toBeGreaterThan(0);
  });
});

describe("RF-SIM-12 / RF-STF-07 · stages, roles and the crew", () => {
  const modern = rulesFor(2024);
  const refuel = rulesFor(2008);

  it("stages in order with their roles; wheels and wing in parallel; no fuel outside the refuelling eras", () => {
    const plan = planStop({ rules: modern, crew: 60, tyres: true, refuelLaps: 20, wing: "adjust", stream: createStream("stages") });
    const names = plan.stages.map((stage) => stage.stage);
    expect(names).toEqual(["marks", "jackUp", "wheels", "wing", "jackDown", "release"]);
    const at = Object.fromEntries(plan.stages.map((stage) => [stage.stage, stage]));
    expect(at.wheels.role).toBe("wheelGuns");
    expect(at.release.role).toBe("lollipop");
    expect(at.wing.start).toBe(at.wheels.start);
    expect(at.jackDown.start).toBeCloseTo(at.wheels.start + Math.max(at.wheels.duration, at.wing.duration), 10);
    expect(plan.stationary).toBeCloseTo(at.release.start + at.release.duration, 10);
  });

  it("refuelling runs alongside the wheels (1994-2009) and decides the stop", () => {
    const plan = planStop({ rules: refuel, crew: 60, tyres: true, refuelLaps: 20, stream: createStream("fuel") });
    const at = Object.fromEntries(plan.stages.map((stage) => [stage.stage, stage]));
    expect(at.refuel.role).toBe("refueller");
    expect(at.refuel.start).toBe(at.wheels.start);
    expect(at.refuel.duration).toBeGreaterThan(at.wheels.duration);
    const fuelOnly = planStop({ rules: refuel, crew: 60, tyres: false, refuelLaps: 20, stream: createStream("fuel") });
    expect(fuelOnly.stages.map((stage) => stage.stage)).toEqual(["marks", "refuel", "release"]);
    expect(expectedStationary({ rules: refuel, refuelLaps: 30 })).toBeGreaterThan(expectedStationary({ rules: refuel, refuelLaps: 10 }));
  });

  it("a better crew stops faster and errs less (RF-STF-07)", () => {
    const sample = (crew) => {
      const stream = createStream(`crew-${crew}`);
      const plans = Array.from({ length: 4000 }, () => planStop({ rules: modern, crew, stream }));
      return { median: median(plans.map((p) => p.stationary)), errors: plans.filter((p) => p.mistake).length };
    };
    const good = sample(95);
    const poor = sample(30);
    expect(good.median).toBeLessThan(poor.median);
    expect(good.errors).toBeLessThan(poor.errors);
    expect(expectedStationary({ rules: modern, crew: 95 })).toBeLessThan(expectedStationary({ rules: modern, crew: 30 }));
  });

  it("RNF-05: same seed, same stop; the same number of draws whatever goes wrong", () => {
    const a = planStop({ rules: refuel, crew: 50, refuelLaps: 15, stream: createStream("same") });
    const b = planStop({ rules: refuel, crew: 50, refuelLaps: 15, stream: createStream("same") });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const s1 = createStream("draws");
    const s2 = createStream("draws");
    planStop({ rules: modern, crew: 0, tyres: true, stream: s1 });
    planStop({ rules: modern, crew: 100, tyres: false, wing: "change", stream: s2 });
    expect(s1.next()).toBe(s2.next());
  });

  it("every era has its real median with a source note (RNF-07)", () => {
    pitBalance.pitStop.eras.forEach((era) => {
      expect(era.target.median).toBeGreaterThan(0);
      expect(["lane", "stationary"]).toContain(era.target.measure);
      expect(["V", "S", "NV"]).toContain(era.target.ver);
      expect(era.target.note.length).toBeGreaterThan(10);
    });
  });
});

/**
 * PIT-C2 (docs/manager/F1M24-CHINA.md §3.3, prerequisite of AUD-C7): RF-SIM-12, RF-3D-04, RF-SIM-15,
 * RNF-05. The pose's `pitStage {name, t}` (stageInfoAt) and the stop's one-shots (stopEvents) read
 * the plan's own drawn times; the per-wheel times change no draw (same stream, same stationary).
 */
describe("PIT-C2 · stages for the pose and the sound, deterministic (RF-SIM-12, RNF-05)", () => {
  const modern = rulesFor(2024);
  const refuel = rulesFor(2008);
  const ERAS = [rulesFor(1976), rulesFor(1990), refuel, rulesFor(2010), rulesFor(2012), rulesFor(2016), modern];

  it("each wheel keeps its time: the slowest is the wheels stage, and the draw budget is unchanged", () => {
    ERAS.forEach((rules) => {
      for (let k = 0; k < 200; k += 1) {
        const stream = createStream(`wheels-${rules.year}-${k}`);
        const plan = planStop({ rules, crew: 20 + (k % 80), tyres: true, refuelLaps: rules.refuelling ? 12 : 0, stream });
        const wheels = plan.stages.find((stage) => stage.stage === "wheels");
        expect(wheels.wheels.map((c) => c.wheel)).toEqual(WHEELS);
        wheels.wheels.forEach((c) => expect(c.start).toBe(wheels.start));
        expect(Math.max(...wheels.wheels.map((c) => c.duration))).toBeCloseTo(wheels.duration, 12);
      }
    });
    const s1 = createStream("budget");
    const s2 = createStream("budget");
    planStop({ rules: modern, crew: 10, tyres: true, stream: s1 });
    planStop({ rules: modern, crew: 99, tyres: false, wing: "change", stream: s2 });
    expect(s1.next()).toBe(s2.next());
  });

  it("stageInfoAt: the pose's pitStage {name, t} agrees with stageAt and counts from the stage's start", () => {
    const plan = planStop({ rules: refuel, crew: 60, tyres: true, refuelLaps: 15, wing: "adjust", stream: createStream("info") });
    for (let t = 0; t < plan.stationary; t += 0.01) {
      const info = stageInfoAt(plan, t);
      expect(info.name).toBe(stageAt(plan, t));
      expect(info.t).toBeGreaterThanOrEqual(0);
      expect(info.t).toBeLessThanOrEqual(info.duration + 1e-9);
      expect(info.start + info.t).toBeCloseTo(t, 9);
      expect(typeof info.role).toBe("string");
    }
    expect(stageInfoAt(plan, -0.1)).toBeNull();
    expect(stageInfoAt(plan, plan.stationary + 0.01)).toBeNull();
    expect(stageInfoAt(null, 1)).toBeNull();
  });

  it("stopEvents: jacks, two gun events per wheel, release at the end; in time order; fuel only has no guns", () => {
    ERAS.forEach((rules) => {
      const plan = planStop({ rules, crew: 60, tyres: true, refuelLaps: rules.refuelling ? 15 : 0, stream: createStream(`events-${rules.year}`) });
      const events = stopEvents(plan);
      for (let k = 1; k < events.length; k += 1) expect(events[k].t).toBeGreaterThanOrEqual(events[k - 1].t);
      const kinds = events.map((e) => e.kind);
      expect(kinds.filter((kind) => kind === "jackUp")).toHaveLength(1);
      expect(kinds.filter((kind) => kind === "jackDown")).toHaveLength(1);
      expect(kinds[kinds.length - 1]).toBe("release");
      expect(events[events.length - 1].t).toBe(plan.stationary);
      WHEELS.forEach((wheel) => {
        const mine = events.filter((e) => e.wheel === wheel);
        expect(mine.map((e) => e.kind)).toEqual(["gunOff", "gunOn"]);
        expect(mine[1].t).toBeGreaterThan(mine[0].t);
      });
      const jackUp = events.find((e) => e.kind === "jackUp");
      const jackDown = events.find((e) => e.kind === "jackDown");
      events.filter((e) => e.wheel).forEach((e) => {
        expect(e.t).toBeGreaterThanOrEqual(jackUp.t);
        expect(e.t).toBeLessThanOrEqual(jackDown.t + 1e-9);
      });
    });
    const fuelOnly = planStop({ rules: refuel, crew: 60, tyres: false, refuelLaps: 20, stream: createStream("fuel-only") });
    expect(stopEvents(fuelOnly).map((e) => e.kind)).toEqual(["release"]);
    expect(stopEvents(null)).toEqual([]);
  });

  it("RNF-05: same seed, same stages, same events, byte for byte", () => {
    const make = () => planStop({ rules: modern, crew: 47, tyres: true, wing: "change", stream: createStream("pitc2-same") });
    const a = make();
    const b = make();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(stopEvents(a))).toBe(JSON.stringify(stopEvents(b)));
    const sample = (plan) => Array.from({ length: 50 }, (_, k) => stageInfoAt(plan, (k * plan.stationary) / 50));
    expect(JSON.stringify(sample(a))).toBe(JSON.stringify(sample(b)));
  });
});
