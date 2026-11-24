/**
 * Playable sessions (RF-WKD-01/02/03/05, RF-SIM-15, RNF-05): a car stays in its garage
 * until it is sent out, a run plan is driven and ends in the box, a lap can be aborted,
 * the knockout drops the slowest with the player's orders in play, every era's format
 * builds, and the same seed and orders replay the same session byte for byte.
 *
 * SES-1 of docs/manager/F1M24-GAMEPLAY.md (RF-WKD-01/02/03, RF-SIM-11, RF-STF-07, RNF-05, RNF-07):
 * the weekend's local clock (pack schedule from f1db, era template, the unplayed breaks between
 * knockout segments), the track evolution by era against f1db's Q1->Q3 improvement (±0.15 s),
 * the 2006-2007 fuel burn, and the garage work between runs.
 */

import Ajv from "ajv";
import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import balance from "../../data/balance/sessions.json";
import packWorldBalance from "../../data/balance/pack-world.json";
import schema from "../packs/schema/sessions.schema.json";
import { createCareer, createContext, currentRace, entrantsFor, eraOf, runPractice, sessionOptions } from "../career";
import { setupDistance } from "../setup";
import { hourlyConditions } from "../weather";
import { loadSeasonPack } from "../packs/seasonPacks";
import { rulesFor } from "../rules";
import {
  advanceTo, carStatus, command, createSession, nextSegment, rankOf, replaySession, runSegmentToEnd, runSessionToEnd, sessionFormat, sessionResult, stepOnce,
} from ".";
import { evolutionImprovement, evolutionOf, garageWorkOf, localClockOf, sessionConditions, sessionScheduleOf } from "./session";

let context = null;
let packs = null;
const YEARS = [1990, 1998, 2004, 2005, 2006, 2008, 2012, 2013, 2014, 2019, 2024];
beforeAll(async () => {
  const loaded = await Promise.all(YEARS.map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});
const contextOf = () => context;

const setUp = ({ year = 2013, teamId = "ferrari", kind = "qualifying", seed = "sess" } = {}) => {
  const career = createCareer(contextOf(), { year, teamId, seed });
  runPractice(career, {});
  const entrants = entrantsFor(career);
  const options = { kind, entrants, race: currentRace(career), era: eraOf(career), seed: `${seed}::wk`, practice: career.weekend.practice };
  const user = entrants.filter((entry) => entry.isUser).map((entry) => entry.id);
  return { career, entrants, options, user, make: () => createSession(options) };
};

const run = (state, seconds) => advanceTo(state, state.clock + seconds);

describe("playable sessions (engine/sessionSim)", () => {
  it("a player's car stays in its garage until it is sent out (RF-WKD-03)", () => {
    const { make, user } = setUp({ kind: "practice" });
    const state = make();
    run(state, 900);
    user.forEach((id) => {
      expect(carStatus(state, id).phase).toBe("garage");
      expect(state.cars.find((car) => car.id === id).history).toHaveLength(0);
    });
    // Rivals do their own runs meanwhile.
    expect(state.cars.filter((car) => !car.isUser).some((car) => car.history.length > 0)).toBe(true);
  });

  it("a run plan: out-lap, the timed laps, in-lap, back in the garage with the run reported", () => {
    const { make, user } = setUp({ kind: "practice" });
    const state = make();
    run(state, 60);
    expect(command(state, "sendOut", user[0], { programme: "longrun", laps: 5, fuel: 9, compound: "medium" })).toBe(true);
    run(state, 1);
    expect(carStatus(state, user[0]).phase).toBe("out");
    run(state, 1200);
    const car = state.cars.find((entry) => entry.id === user[0]);
    expect(car.history.map((entry) => entry.kind)).toEqual(["out", "timed", "timed", "timed", "timed", "timed", "in"]);
    expect(carStatus(state, user[0]).phase).toBe("garage");
    const report = state.events.find((event) => event.type === "run" && event.carId === user[0]);
    expect(report).toMatchObject({ programme: "longrun", laps: 5, compound: "medium", fuel: 9 });
    expect(car.tyres.find((set) => set.compound === "medium" && set.laps === 7)).toBeTruthy();
  });

  it("aborting a push lap leaves no time and continues the run at cool-down pace", () => {
    const { make, user } = setUp();
    const state = make();
    command(state, "sendOut", user[0], { push: 2, compound: "soft" });
    // Into the first push lap.
    for (let guard = 0; guard < 2000 && carStatus(state, user[0]).phase !== "flying"; guard += 1) stepOnce(state);
    run(state, 20);
    const record = carStatus(state, user[0]).record;
    expect(record.flying).toBeGreaterThan(0);
    expect(command(state, "abortLap", user[0])).toBe(true);
    expect(record.flying).toBeUndefined();
    expect(record.warp.share).toBeGreaterThan(0);
    run(state, 400);
    const car = state.cars.find((entry) => entry.id === user[0]);
    const kinds = car.history.map((entry) => `${entry.kind}${entry.aborted ? "!" : ""}`);
    expect(kinds).toEqual(["out", "push!", "cool", "push", "in"]);
    expect(car.best).toBe(car.history[3].flying);
  });

  it("box now turns an out-lap into the in-lap before pit entry", () => {
    const { make, user } = setUp();
    const state = make();
    command(state, "sendOut", user[0], { push: 1 });
    run(state, 20);
    expect(command(state, "boxNow", user[0])).toBe(true);
    run(state, 400);
    const car = state.cars.find((entry) => entry.id === user[0]);
    expect(car.history.map((entry) => entry.kind)).toEqual(["in"]);
    expect(car.best).toBeNull();
  });

  it("knockout qualifying with the player's orders: Q1 drops the slowest, Q2 runs without them (RF-WKD-01)", () => {
    const { make, user, entrants } = setUp();
    const state = make();
    expect(state.segments.map((segment) => segment.name)).toEqual(["Q1", "Q2", "Q3"]);
    // Only one of the player's cars goes out in Q1.
    command(state, "sendOut", user[0], { push: 1, compound: "soft" });
    runSegmentToEnd(state, { autopilot: false });
    expect(state.over).toBe(true);
    const ranked = rankOf(state);
    const drop = state.segments[0].drop;
    const out = ranked.slice(ranked.length - drop).map((car) => car.id);
    expect(out).toContain(user[1]); // never set a time
    nextSegment(state);
    expect(state.segment).toBe(1);
    expect(state.cars.filter((car) => !car.eliminated)).toHaveLength(entrants.length - drop);
    out.forEach((id) => expect(command(state, "sendOut", id, {})).toBe(false));
    runSessionToEnd(state);
    const result = sessionResult(state);
    expect(result.format).toBe("knockout");
    expect(result.order).toHaveLength(entrants.length);
    expect(result.sessions).toHaveLength(3);
    expect(result.order.slice(-drop).sort()).toEqual([...out].sort());
    expect(Number.isNaN(result.times[user[1]])).toBe(true);
  });

  it("determinism: the same seed and the same orders give the same session, however time is sliced (RF-SIM-15, RNF-05)", () => {
    const { options, user } = setUp();
    const play = (slice) => {
      const state = createSession(options);
      const orders = [
        [30, "sendOut", user[0], { push: 2, compound: "soft", style: "push" }],
        [95, "sendOut", user[1], { push: 1, compound: "medium" }],
        [260, "abortLap", user[0]],
        [700, "boxNow", user[1]],
      ];
      orders.forEach(([at, name, ...args]) => {
        while (state.clock + state.dt <= at) advanceTo(state, Math.min(at, state.clock + slice));
        command(state, name, ...args);
      });
      runSessionToEnd(state);
      return { state, json: JSON.stringify(sessionResult(state)) };
    };
    const a = play(0.5);
    const b = play(37.25);
    expect(b.json).toBe(a.json);
    // The log replays it.
    const replay = replaySession(options, a.state.log);
    runSessionToEnd(replay);
    expect(JSON.stringify(sessionResult(replay))).toBe(a.json);
  });

  it("every era's format builds and runs to a full grid (RF-WKD-01, SRS 6.2)", () => {
    const expectations = {
      1990: ["TWO_SESSION", ["Q1", "Q2"]],
      1998: ["ONE_SESSION", ["Q"]],
      2004: ["ONE_LAP", ["Q"]],
      2008: ["KNOCKOUT", ["Q1", "Q2", "Q3"]],
      2024: ["KNOCKOUT", ["Q1", "Q2", "Q3"]],
    };
    Object.entries(expectations).forEach(([year, [format, names]]) => {
      const { make, entrants } = setUp({ year: Number(year), teamId: "ferrari" });
      const state = make();
      expect(state.format).toBe(format);
      expect(state.segments.map((segment) => segment.name)).toEqual(names);
      runSessionToEnd(state);
      const result = sessionResult(state);
      expect(result.order).toHaveLength(entrants.length);
      expect(result.order.filter((id) => Number.isFinite(result.times[id])).length).toBeGreaterThan(entrants.length - 3);
    });
  });

  it("single-lap qualifying (2004): one car at a time in run order, one push lap each, race fuel declared", () => {
    const { make, user } = setUp({ year: 2004, teamId: "ferrari" });
    const state = make();
    expect(state.segments[0].singleLap).toBe(true);
    expect(rulesFor(state.era).qualifying.raceFuel).toBe(true);
    command(state, "setPlan", user[0], { fuel: 18, compound: "soft" });
    runSessionToEnd(state);
    const car = state.cars.find((entry) => entry.id === user[0]);
    expect(car.history.map((entry) => entry.kind)).toEqual(["out", "push", "in"]);
    expect(sessionResult(state).fuel[user[0]]).toBe(18);
    // Departures are spaced by the slot.
    const starts = state.cars.map((entry) => entry.history[0].start).sort((a, b) => a - b);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(state.segments[0].spacing - 1e-9);
  });

  it("the sprint shootout mandates new tyres by segment (2023-)", () => {
    const format = sessionFormat({ kind: "shootout", era: 2023, field: 20 });
    expect(format.segments.map((segment) => [segment.name, segment.tyre])).toEqual([["SQ1", "medium"], ["SQ2", "medium"], ["SQ3", "soft"]]);
  });
});

describe("SES-1: local clock, track evolution and garage work (F1M24-GAMEPLAY §2.12.3)", () => {
  /** The pack round of `year` at `circuitId`, with the career pointed at it and the race carrying the pack's schedule. */
  const weekendAt = (year, circuitId, kind = "qualifying") => {
    const career = createCareer(contextOf(), { year, teamId: "ferrari", seed: `ses1-${year}` });
    const index = packs[year].calendar.findIndex((event) => event.circuitId === circuitId);
    career.round = index;
    runPractice(career, {});
    // engine/packs/packWorld.js does not carry calendar[].sessions yet (WKD lane): the test hands them over.
    const race = { ...currentRace(career), sessions: packs[year].calendar[index].sessions };
    const options = { ...sessionOptions(career, kind), race, wetness: 0 };
    return { career, race, options, event: packs[year].calendar[index] };
  };

  it("sessions.json matches its schema (RNF-07); every era row with status source quotes the FIA", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(balance) || validate.errors).toBe(true);
    // The verified 2024 rows (FIA 2024 Sporting Regulations, art. 38.2 and 39.2-39.3).
    const ko = balance.durations.knockout.find((row) => row.from === 2024);
    expect(ko).toMatchObject({ minutes: [18, 15, 12], breakMinutes: [7, 8], status: "source" });
    expect(balance.durations.sprintShootout.find((row) => row.from === 2024)).toMatchObject({ minutes: [12, 10, 8], breakMinutes: [7, 7], status: "source" });
  });

  it("the 2024 pack carries f1db's session times in local time (Bahrain: 14:30, 18:00, 15:30, 19:00; race 18:00 on Saturday)", () => {
    const bahrain = packs[2024].calendar.find((event) => event.circuitId === "bahrain");
    expect(bahrain.sessions.map((entry) => [entry.name, entry.date, entry.startLocal])).toEqual([
      ["FP1", "2024-02-29", "14:30"],
      ["FP2", "2024-02-29", "18:00"],
      ["FP3", "2024-03-01", "15:30"],
      ["Q", "2024-03-01", "19:00"],
      ["R", "2024-03-02", "18:00"],
    ]);
    // Older packs have no times in f1db and no sessions key (their bytes did not move).
    expect(packs[2013].calendar.every((event) => event.sessions === undefined)).toBe(true);
  });

  it("reloj-sesion: Q1 starts at 19:00, Q2 at 19:25 and Q3 at 19:48 local - the breaks are counted, not played (RF-WKD-01)", () => {
    const { options } = weekendAt(2024, "bahrain");
    const state = createSession(options);
    expect(state.schedule).toMatchObject({ source: "pack", day: -1, startSec: 19 * 3600 });
    expect(localClockOf(state, 0).label).toBe("19:00:00");
    expect(state.localClock.label).toBe("19:00:00");
    runSegmentToEnd(state);
    nextSegment(state);
    expect(localClockOf(state, 0).label).toBe("19:25:00");
    run(state, 90);
    expect(state.localClock.label).toBe("19:26:30");
    runSegmentToEnd(state);
    nextSegment(state);
    expect(localClockOf(state, 0).label).toBe("19:48:00");
    // A practice session picks its own slot by name; without a name, the first of the kind.
    expect(sessionScheduleOf({ kind: "practice", race: options.race, era: options.era, sessionName: "FP3" })).toMatchObject({ name: "FP3", day: -1, startSec: 15.5 * 3600 });
    expect(sessionScheduleOf({ kind: "practice", race: options.race, era: options.era })).toMatchObject({ name: "FP1", day: -2 });
  });

  it("without f1db times the era's template places the session around the circuit's race hour (ERA5 startHour)", () => {
    const { options } = weekendAt(2013, "bahrain");
    const state = createSession({ ...options, race: { ...options.race, sessions: undefined } });
    expect(state.schedule.source).toBe("template");
    expect(state.schedule.day).toBe(-1);
    // Two-session qualifying (1990) runs its second session the next day at the same hour.
    const old = createSession(setUp({ year: 1990 }).options);
    expect(old.segments[1].nextDay).toBe(true);
    const first = localClockOf(old, 0, 0);
    const second = localClockOf(old, 0, 1);
    expect(second.day - first.day).toBe(1);
    expect(second.seconds).toBe(first.seconds);
  });

  it("the clock and the conditions only read: the same seed gives the same session with or without a schedule (RNF-05)", () => {
    const { options } = weekendAt(2024, "bahrain");
    const a = runSessionToEnd(createSession(options));
    const b = runSessionToEnd(createSession({ ...options, race: { ...options.race, sessions: undefined } }));
    expect(JSON.stringify(sessionResult(b))).toBe(JSON.stringify(sessionResult(a)));
    const conditions = sessionConditions(createSession(options), 0);
    expect(conditions.localClock.label).toBe("19:00:00");
    expect(conditions.night).toBe(true);
    expect(conditions.trackC).toBeGreaterThan(conditions.airC);
    // By the hour: the air at the race's own start hour is the climate's; the afternoon is warmer than the evening.
    const { race } = options;
    const start = hourlyConditions({ race, hour: 18, diurnal: balance.clock.diurnal });
    expect(start.startHour).toBe(18);
    expect(hourlyConditions({ race, hour: 14.5, diurnal: balance.clock.diurnal }).airC).toBeGreaterThan(start.airC);
    expect(hourlyConditions({ race, hour: 14.5, diurnal: null }).airC).toBe(start.airC);
  });

  it("evolucion-q: the simulated Q1->Q3 improvement of the top ten is within ±0.15 s of f1db, era by era (RF-WKD-02)", () => {
    const median = (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    const dry = (refLaps) => refLaps?.pole && refLaps?.fastestRaceLap && refLaps.pole <= refLaps.fastestRaceLap * packWorldBalance.refLaps.wetPoleRatio;
    balance.evolution.byEra.forEach((row) => {
      const era = `${row.from}-${row.to}`;
      const measured = balance.evolution.measured[era];
      expect(measured).toBeDefined();
      const career = createCareer(contextOf(), { year: row.simYear, teamId: "ferrari", seed: `evo-${row.simYear}` });
      // The same rounds and seeds as scripts/measureEvolution.js --sim.
      const rounds = packs[row.simYear].calendar.map((event, index) => ({ event, index })).filter(({ event }) => dry(event.refLaps)).slice(0, 6);
      const improvements = rounds.map(({ event, index }) => {
        career.round = index;
        runPractice(career, {});
        return evolutionImprovement({ ...sessionOptions(career, "qualifying"), wetness: 0, seed: `evo-${row.simYear}-${event.round}` }).q1ToQ3;
      });
      const simulated = median(improvements);
      expect({ era, ok: Math.abs(simulated - measured.q1ToQ3) <= 0.15, simulated, measured: measured.q1ToQ3 }).toEqual({ era, ok: true, simulated, measured: measured.q1ToQ3 });
    });
    // Before the knockout (no f1db segments) the default row applies.
    expect(evolutionOf(1998)).toBe(balance.evolution.default);
  });

  it("2006-2007: Q3 starts on race fuel and burns laps before the attempt; the view sees them as cool-down laps", () => {
    const { options } = setUp({ year: 2006 });
    const state = createSession(options);
    expect(state.segments[2].fuelBurn).toBe(true);
    expect(state.segments[1].fuelBurn).toBe(false);
    runSegmentToEnd(state);
    nextSegment(state);
    runSegmentToEnd(state);
    nextSegment(state);
    let burning = null;
    for (let guard = 0; guard < 4000 && !burning; guard += 1) {
      stepOnce(state);
      burning = state.cars.find((car) => car.record?.kind === "burn") || null;
    }
    expect(burning).toBeTruthy();
    expect(carStatus(state, burning.id).phase).toBe("cool");
    runSegmentToEnd(state);
    const burnt = state.cars.filter((car) => car.out === undefined && car.history.some((entry) => entry.kind === "burn"));
    expect(burnt.length).toBeGreaterThan(0);
    burnt.forEach((car) => {
      const kinds = car.history.map((entry) => entry.kind);
      expect(kinds.indexOf("burn")).toBeLessThan(kinds.lastIndexOf("push"));
    });
  });

  it("trabajo-garaje: a car leaves again only after the work its plan asks for, item by item, scaled by the crew (RF-WKD-03, RF-STF-07)", () => {
    const { options, user } = setUp({ kind: "practice" });
    const w = balance.garage.work;
    const id = user[0];
    const state = createSession({ ...options, setups: { [id]: { frontWing: 50, rearWing: 50, antiRoll: 50, camber: 50, toe: 50 } } });
    // First run of the segment: nothing to do.
    expect(garageWorkOf(state, id, { programme: "setup", laps: 2, compound: "hard" }).total).toBe(0);
    command(state, "sendOut", id, { programme: "setup", laps: 2, fuel: 10, compound: "hard" });
    const car = state.cars.find((entry) => entry.id === id);
    // Up to the step it is back in the garage.
    for (let guard = 0; guard < 4000 && car.returnedAt === null; guard += 1) stepOnce(state);
    expect(carStatus(state, id).phase).toBe("garage");
    const back = car.returnedAt;
    expect(back).toBeGreaterThan(0);
    // Same set, no fuel added, same setup: the base turnaround only.
    const same = garageWorkOf(state, id, { programme: "setup", laps: 1, fuel: car.fuel, compound: "hard", set: "used" });
    expect(same.items.map((item) => item.kind)).toEqual(["base"]);
    expect(same.total).toBeCloseTo(w.baseSec, 6);
    // A new set, five laps of fuel and 20 points of wing: every item adds up.
    const plan = { programme: "setup", laps: 3, fuel: car.fuel + 5, compound: "hard", set: "new", setup: { frontWing: 60, rearWing: 60 } };
    const busy = garageWorkOf(state, id, plan);
    expect(busy.items.map((item) => item.kind)).toEqual(["base", "tyres", "fuel", "setup"]);
    expect(busy.total).toBeCloseTo(w.baseSec + w.tyreSec + 5 * w.fuelPerLapSec + w.setup.baseSec + 20 * w.setup.perPoint, 6);
    expect(busy.readyAt).toBeCloseTo(back + busy.total, 3);
    // Sent out at once, it leaves when the work is done.
    command(state, "sendOut", id, plan);
    run(state, busy.total + 2);
    const out = car.history.filter((entry) => entry.kind === "out")[1];
    expect(out.start).toBeGreaterThanOrEqual(back + busy.total - 1e-9);
    expect(out.start).toBeLessThan(back + busy.total + state.dt + 1e-9);
    expect(car.setup).toMatchObject({ frontWing: 60, rearWing: 60 });
    // A better crew works faster, within the bounds.
    const { teamId } = car;
    const quick = createSession({ ...options, crews: { [teamId]: 90 } });
    const slow = createSession({ ...options, crews: { [teamId]: 30 } });
    [quick, slow].forEach((session) => {
      command(session, "sendOut", id, { programme: "setup", laps: 1, fuel: 4, compound: "hard" });
      advanceTo(session, 600);
    });
    const next = { programme: "setup", laps: 1, fuel: 10, compound: "hard", set: "new" };
    expect(garageWorkOf(quick, id, next).crewFactor).toBeCloseTo(Math.max(w.crewMin, 1 - w.crewPerPoint * (90 - w.crewRef)), 3);
    expect(garageWorkOf(quick, id, next).total).toBeLessThan(garageWorkOf(slow, id, next).total);
  });

  it("setupDistance counts the slider points a change moves (engine/setup.js)", () => {
    const from = { frontWing: 50, rearWing: 40, antiRoll: 50, camber: 50, toe: 50 };
    expect(setupDistance(from, { ...from, frontWing: 55, toe: 45 })).toBe(10);
    expect(setupDistance(from, from)).toBe(0);
    expect(setupDistance(null, from)).toBe(0);
  });
});
