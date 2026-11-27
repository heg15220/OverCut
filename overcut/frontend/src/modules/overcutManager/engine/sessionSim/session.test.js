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
 *
 * SES-2 (F1M24-GAMEPLAY §2.2 salida-boxes-sesion; RF-WKD-02, RF-SIM-12, RF-3D-04, RNF-07): the
 * garage exit on the physical lane against OpenF1's Bahrain 2024 practice range, the run phases of
 * the §1.7 contract, the queue at the pit-exit light, the in-lap that ends in the garage and
 * boxRequest.distanceM.
 *
 * SES-3 (F1M24-GAMEPLAY §1.5, §1.7 `yellow`, §2.12.1 flag-header-sectors; RF-SIM-10, RF-WKD-02, RNF-05,
 * RNF-07, RNF-09): the session waves local yellows from mistakes, at OpenF1 2023-2024's rate per session
 * and double share, with the sector from circuit.sectors, from a stream of their own (the laps do not
 * change), at their own instant, and the tower says it in words.
 *
 * SES-4 (F1M24-GAMEPLAY §2.10 amarilla-sector; RF-SIM-10, RF-WKD-02, RF-SIM-15, RNF-05, RNF-07, SRS §6): a
 * timed lap that reaches somebody else's waved yellow meets it there; the era's rule (sessions.json
 * yellow.laps, OpenF1 race_control 2023-2024 for the double-yellow deletions) lifts, deletes or abandons
 * the lap, the deleted times never classify, and the same seed gives the same session however it is sliced.
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
  RUN_PHASES, advanceTo, carStatus, command, createSession, nextSegment, rankOf, replaySession, runSegmentToEnd, runSessionToEnd, sessionFormat, sessionResult, stepOnce,
} from ".";
import { PIT_LANE_BALANCE, buildProfile, garageExitProfile, laneGeometry } from "../sim/pitLane";
import { evolutionImprovement, evolutionOf, garageWorkOf, localClockOf, sessionConditions, sessionScheduleOf, sessionYellows, yellowEraOf, yellowLapRuleOf } from "./session";
import { sectorOfShare, sessionYellowsAt, yellowFlag } from "../../components/tower";
import { SESSION_RADIO_KINDS, sessionRadioAt } from ".";
import { pushSessionRadio } from "./sessionRadio";
import { sessionEventText, sessionRadioText } from "../../components/sessionRadioTexts";

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

describe("SES-2: the physical garage - out of the box, down the lane, back into the garage (F1M24-GAMEPLAY §2.2)", () => {
  const bahrain2024 = (kind = "practice") => {
    const career = createCareer(contextOf(), { year: 2024, teamId: "ferrari", seed: "ses2" });
    career.round = packs[2024].calendar.findIndex((event) => event.circuitId === "bahrain");
    runPractice(career, {});
    const options = { ...sessionOptions(career, kind), wetness: 0 };
    const user = options.entrants.filter((entry) => entry.isUser).map((entry) => entry.id);
    return { career, options, user };
  };
  const statusUntil = (state, id, test, limit = 20000) => {
    for (let guard = 0; guard < limit; guard += 1) {
      const status = carStatus(state, id);
      if (test(status)) return status;
      stepOnce(state);
    }
    return null;
  };

  it("sessions.json has no fixed pit-lane seconds any more; the garage exit is measured in OpenF1 (RNF-07)", () => {
    expect(balance.laps.pitLaneSec).toBeUndefined();
    expect(balance.laps.boxStopSec).toBeUndefined();
    expect(balance.garage.exit).toMatchObject({ status: "measured", measured: { circuitId: "bahrain", year: 2024 } });
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate({ ...balance, laps: { ...balance.laps, pitLaneSec: 14 } })).toBe(false);
  });

  it("garage -> track in Bahrain 2024 is inside the range OpenF1 measured in practice, from every team's box (RF-WKD-02, RF-SIM-12)", () => {
    const { options } = bahrain2024();
    const state = createSession(options);
    const { measured, rollOutSec } = balance.garage.exit;
    expect(state.lane.kmh).toBe(80);
    const times = state.cars.map((car) => rollOutSec + car.lane.toLimitEnd);
    expect(times.filter((seconds) => seconds < measured.p10 || seconds > measured.p90)).toEqual([]);
    // The middle box is the measured median (rollOutSec is what the lane leaves of it).
    const middle = rollOutSec + garageExitProfile(state.circuit, state.era, 0.5, { kmh: 80, baseLap: state.baseLap }).toLimitEnd;
    expect(Math.abs(middle - measured.median)).toBeLessThanOrEqual(1);
    // A box nearer the exit is out sooner.
    const sorted = state.cars.slice().sort((a, b) => a.box - b.box);
    expect(sorted[0].lane.exitSec).toBeGreaterThan(sorted[sorted.length - 1].lane.exitSec);
  });

  it("a run goes GARAGE -> GARAGE_EXIT -> OUT_LAP -> PUSH_PREP -> PUSH -> IN_LAP -> GARAGE, within the limit in the lane", () => {
    const { options, user } = bahrain2024();
    const state = createSession(options);
    const id = user[0];
    const car = state.cars.find((entry) => entry.id === id);
    expect(carStatus(state, id).runPhase).toBe("GARAGE");
    run(state, 30);
    command(state, "sendOut", id, { programme: "setup", laps: 1, fuel: 5, compound: "hard" });
    const geo = laneGeometry(state.circuit);
    const seen = ["GARAGE"];
    let fastest = 0;
    let exitRoad = 0;
    for (let guard = 0; guard < 4000 && !(seen.length > 1 && seen[seen.length - 1] === "GARAGE"); guard += 1) {
      stepOnce(state);
      const status = carStatus(state, id);
      if (seen[seen.length - 1] !== status.runPhase) seen.push(status.runPhase);
      if (status.garageExit && !status.garageExit.rolling) {
        if (status.garageExit.s <= geo.limitToS) fastest = Math.max(fastest, status.garageExit.v);
        else exitRoad = Math.max(exitRoad, status.garageExit.v);
      }
    }
    expect(seen).toEqual(["GARAGE", "GARAGE_EXIT", "OUT_LAP", "PUSH_PREP", "PUSH", "IN_LAP", "GARAGE"]);
    expect(seen.filter((phase) => !RUN_PHASES.includes(phase))).toEqual([]);
    // Never above the limit in the limited zone (80 km/h, era-defaults.json); free on the exit road after it.
    expect(fastest).toBeGreaterThan(0);
    expect(fastest).toBeLessThanOrEqual(state.lane.vLimit + 1e-9);
    expect(exitRoad).toBeGreaterThan(state.lane.vLimit);
    const [out, , inLap] = car.history;
    expect(out.garageExit.trackAt - out.start).toBeCloseTo(balance.garage.exit.rollOutSec + car.lane.exitSec + out.garageExit.queueSec, 9);
    // The in-lap ends in the garage, on the lane's own profile from pit entry down to the box.
    const toBox = buildProfile(state.circuit, { vLimit: state.lane.vLimit, baseLap: state.baseLap, stopAt: geo.slotFrom + (geo.slotTo - geo.slotFrom) * car.box }).tStop;
    expect(inLap.in).toBe(true);
    expect(toBox).toBeGreaterThan(0);
    expect(inLap.end - inLap.pit.entryAt).toBeCloseTo(toBox, 9);
    expect(car.returnedAt).toBe(inLap.end);
  });

  it("cars released together queue at the light and join the track one behind the other (cola en el semáforo)", () => {
    const { options, user } = bahrain2024("qualifying");
    const state = createSession(options);
    // Both cars of the team share a box: out at the same instant.
    user.forEach((id) => command(state, "sendOut", id, { push: 1, compound: "soft" }));
    run(state, 1);
    const [a, b] = user.map((id) => state.cars.find((car) => car.id === id).history[0].garageExit);
    const gap = Math.sqrt((2 * PIT_LANE_BALANCE.queueOffsetMetres) / PIT_LANE_BALANCE.accel.max);
    expect(a.queueSec).toBe(0);
    expect(b.queueSec).toBeCloseTo(gap, 9);
    expect(b.trackAt - a.trackAt).toBeGreaterThanOrEqual(gap - 1e-9);
    const waiting = statusUntil(state, user[1], (status) => Boolean(status.garageExit?.queued));
    expect(waiting).toMatchObject({ runPhase: "GARAGE_EXIT", garageExit: { v: 0, queued: true } });
    expect(waiting.garageExit.toTrack).toBeGreaterThan(0);
  });

  it("boxRequest.distanceM: the metres to pit entry once the car is called in, falling as it drives there", () => {
    const { options, user } = bahrain2024();
    const state = createSession(options);
    const id = user[0];
    command(state, "sendOut", id, { programme: "setup", laps: 3, compound: "hard" });
    statusUntil(state, id, (status) => status.runPhase === "OUT_LAP");
    run(state, 10);
    expect(carStatus(state, id).boxRequest).toBeNull();
    expect(command(state, "boxNow", id)).toBe(true);
    const first = carStatus(state, id);
    expect(first.runPhase).toBe("IN_LAP");
    expect(first.boxRequest.distanceM).toBeGreaterThan(0);
    expect(first.boxRequest.distanceM).toBeLessThan(state.circuit.length);
    expect(first.car.boxRequest.distanceM).toBe(first.boxRequest.distanceM);
    run(state, 20);
    expect(carStatus(state, id).boxRequest.distanceM).toBeLessThan(first.boxRequest.distanceM);
    // On a timed lap the call is for the end of it: round to the line and on to the next entry.
    statusUntil(state, id, (status) => status.runPhase === "GARAGE");
    command(state, "sendOut", id, { programme: "setup", laps: 3, compound: "hard" });
    expect(statusUntil(state, id, (status) => status.runPhase === "PUSH")).not.toBeNull();
    run(state, 5);
    command(state, "boxNow", id);
    const deferred = carStatus(state, id);
    expect(deferred.runPhase).toBe("PUSH");
    expect(deferred.boxRequest.distanceM).toBeGreaterThan(state.circuit.length * (1 - deferred.elapsed / deferred.record.flying));
  });

  it("era by era: no pit-lane limit before 1994, so the lane is driven at the geometry's speed (SRS §6)", () => {
    const old = createSession(setUp({ year: 1990 }).options);
    expect(old.lane.kmh).toBeNull();
    expect(old.cars.filter((car) => !(car.lane.exitSec > 0 && car.lane.inSec > 0))).toEqual([]);
    const modern = createSession(bahrain2024().options);
    const free = garageExitProfile(modern.circuit, 1990, 0.5, { kmh: null, baseLap: modern.baseLap });
    const limited = garageExitProfile(modern.circuit, 2024, 0.5, { kmh: 80, baseLap: modern.baseLap });
    expect(free.T).toBeLessThan(limited.T);
  });

  it("the lane draws nothing: the garage exit is the same for every seed, the session stays deterministic (RF-SIM-15, RNF-05)", () => {
    const { options } = bahrain2024("qualifying");
    const a = createSession(options);
    const b = createSession({ ...options, seed: "another" });
    expect(a.cars.map((car) => car.lane)).toEqual(b.cars.map((car) => car.lane));
    const once = JSON.stringify(sessionResult(runSessionToEnd(createSession(options))));
    expect(JSON.stringify(sessionResult(runSessionToEnd(createSession(options))))).toBe(once);
  });
});

describe("SES-3: local yellows in the session (F1M24-GAMEPLAY §1.5, §1.7 yellow, §2.12.1 flag-header-sectors)", () => {
  const Y = balance.yellow;
  const optionsFor = (year, kind, round, seed) => {
    const career = createCareer(contextOf(), { year, teamId: "ferrari", seed });
    career.round = round % packs[year].calendar.length;
    runPractice(career, {});
    return { ...sessionOptions(career, kind), wetness: 0 };
  };
  const yellowsOf = (state) => state.events.filter((event) => event.type === "yellow");
  // `seenYellows` is SES-4's bookkeeping of the yellows a lap has met (no time of its own).
  const lapsOf = (state) => JSON.stringify(state.cars.map((car) => car.history.map(({ yellow, seenYellows, ...lap }) => lap)));
  /** Every segment to the end, keeping each segment's laps (startSegment clears the history). */
  const playAll = (options) => {
    const state = createSession(options);
    const segments = [];
    for (let guard = 0; guard < 10; guard += 1) {
      runSegmentToEnd(state);
      segments.push({ laps: lapsOf(state), records: state.cars.map((car) => ({ id: car.id, history: car.history.slice() })) });
      if (state.done) break;
      nextSegment(state);
    }
    return { state, segments };
  };

  it("sessions.json yellow matches its schema, is measured in OpenF1 and dates every year 1976-2026 (RNF-07, SRS §6)", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(balance)).toBe(true);
    expect(Y.measured.source).toMatch(/OpenF1 race_control/);
    expect(Y.measured.years).toEqual([2023, 2024]);
    for (let year = 1976; year <= 2026; year += 1) expect(yellowEraOf(year)).not.toBeNull();
    expect(yellowEraOf(2024).status).toBe("measured");
    expect(yellowEraOf(1990).status).toBe("pending");
    // The duration spread is the measured one of its type.
    expect(Y.durationSec.single).toMatchObject({ p10: Y.measured.single.p10, median: Y.measured.single.median, p90: Y.measured.single.p90 });
    expect(Y.durationSec.double).toMatchObject({ p10: Y.measured.double.p10, median: Y.measured.double.median, p90: Y.measured.double.p90 });
    expect(validate({ ...balance, yellow: { ...Y, chance: { ...Y.chance, practice: 2 } } })).toBe(false);
  });

  it("yellows per session and the double share in 2024 dry sessions are near OpenF1 2023-2024 (RF-SIM-10)", () => {
    ["practice", "qualifying"].forEach((kind) => {
      let count = 0;
      let doubles = 0;
      const runs = 16;
      for (let index = 0; index < runs; index += 1) {
        const yellows = yellowsOf(playAll(optionsFor(2024, kind, index, `ses3-${index}`)).state);
        count += yellows.length;
        doubles += yellows.filter((event) => event.double).length;
      }
      const perSession = count / runs;
      expect(Math.abs(perSession - Y.measured[kind].perSession)).toBeLessThanOrEqual(Y.measured[kind].perSession * 0.35);
      expect(Math.abs(doubles / count - Y.measured[kind].doubleShare)).toBeLessThanOrEqual(0.2);
    });
  });

  it("the event: §1.7 shape, the sector from circuit.sectors, on the lap with the mistake, inside the measured durations (every era)", () => {
    [[2024, "qualifying"], [2012, "practice"], [1990, "qualifying"]].forEach(([year, kind]) => {
      let seen = 0;
      for (let index = 0; index < 4; index += 1) {
        const { state, segments } = playAll(optionsFor(year, kind, index, `ses3-shape-${index}`));
        const circuit = state.circuit;
        const numbers = new Set((circuit.corners || []).map((corner) => corner.number));
        yellowsOf(state).forEach((event) => {
          seen += 1;
          expect(Object.keys(event).sort()).toEqual(["carId", "corner", "double", "marshalPost", "s", "sector", "segment", "t", "type", "until"]);
          expect(event.sector).toBeGreaterThanOrEqual(1);
          expect(event.sector).toBeLessThanOrEqual(circuit.sectors.length);
          // circuit.sectors' own sector of the place (what the view's sectorOfShare reads too).
          expect(event.sector).toBe(sectorOfShare(circuit, event.s));
          expect(event.corner === null || numbers.has(event.corner)).toBe(true);
          expect(event.marshalPost).toBe(event.corner);
          const spread = event.double ? Y.durationSec.double : Y.durationSec.single;
          expect(event.until - event.t).toBeGreaterThanOrEqual(spread.p10 - 0.002);
          expect(event.until - event.t).toBeLessThanOrEqual(spread.p90 + 0.002);
          const lap = segments[event.segment].records
            .find((row) => row.id === event.carId)
            .history.find((record) => record.yellow && Math.abs(record.yellow.at - event.t) < 0.001);
          expect(lap).toBeDefined();
          expect(lap.mistake).toBe(true);
          expect(event.t).toBeGreaterThanOrEqual(lap.start);
          expect(event.t).toBeLessThanOrEqual(lap.end);
        });
      }
      expect(seen).toBeGreaterThan(0);
    });
  });

  // SES-4 changes on purpose what a yellow does to the others' laps; with its effects neutralised (every
  // era "lift", no loss, nobody gives up) the SES-3 guarantee stands as it was: the yellows' draws never
  // touch the laps' streams.
  const withoutLapEffects = (fn) => {
    const L = Y.laps;
    const saved = JSON.stringify({ eras: L.eras, lossSec: L.lossSec, abandonShare: L.abandonShare });
    try {
      L.eras.forEach((row) => Object.assign(row, { single: "lift", double: "lift" }));
      ["single", "double"].forEach((flag) => {
        L.lossSec[flag] = { p25: 0, p75: 0 };
        L.abandonShare[flag] = 0;
      });
      return fn();
    } finally {
      Object.assign(L, JSON.parse(saved));
    }
  };

  it("the yellows draw from their own stream: every lap is the same without them, and the same seed gives the same yellows (RF-SIM-15, RNF-05)", () => {
    const options = optionsFor(2024, "qualifying", 0, "ses3-det");
    const a = playAll(options);
    const b = playAll(options);
    expect(JSON.stringify(yellowsOf(b.state))).toBe(JSON.stringify(yellowsOf(a.state)));
    expect(yellowsOf(a.state).length).toBeGreaterThan(0);
    withoutLapEffects(() => {
      const plain = playAll(options);
      expect(yellowsOf(plain.state).length).toBeGreaterThan(0);
      const saved = { ...Y.chance };
      try {
        Object.keys(Y.chance).forEach((key) => {
          Y.chance[key] = 0;
        });
        const calm = playAll(options);
        expect(yellowsOf(calm.state)).toEqual([]);
        expect(calm.segments.map((segment) => segment.laps)).toEqual(plain.segments.map((segment) => segment.laps));
        expect(JSON.stringify(sessionResult(calm.state))).toBe(JSON.stringify(sessionResult(plain.state)));
      } finally {
        Object.assign(Y.chance, saved);
      }
    });
  });

  /** A 2024 practice whose first segment has a yellow (the first of rounds 0-9 that does), engineers driving every car. */
  const practiceWithYellow = () => {
    for (let index = 0; index < 10; index += 1) {
      const options = optionsFor(2024, "practice", index, `ses3-time-${index}`);
      const first = yellowsOf(playAll(options).state)[0];
      if (first) return { options, first };
    }
    return { options: null, first: null };
  };
  const engineersDrive = (state) => {
    state.cars.filter((car) => car.isUser).forEach((car) => command(state, "autopilot", car.id));
    return state;
  };

  it("a yellow is pushed at its own instant, however the view slices time, and is waved until `until`", () => {
    const { options, first } = practiceWithYellow();
    expect(first).not.toBeNull();
    const state = engineersDrive(createSession(options));
    let before = null;
    for (let guard = 0; guard < 20000 && !yellowsOf(state).length; guard += 1) {
      before = state.clock;
      stepOnce(state);
    }
    const event = yellowsOf(state)[0];
    expect(event).toEqual(first);
    expect(event.t).toBeGreaterThan(before - 1e-6);
    expect(event.t).toBeLessThanOrEqual(state.clock + 1e-6);
    expect(sessionYellows(state, event.t)).toContainEqual(event);
    expect(sessionYellows(state, event.until)).not.toContainEqual(event);
    // Coarse slices of the view's clock give the same event.
    const coarse = engineersDrive(createSession(options));
    for (let tau = 0; !yellowsOf(coarse).length && tau < 4000; tau += 37) advanceTo(coarse, tau);
    expect(yellowsOf(coarse)[0]).toEqual(first);
  });

  it("the view paints it with words: the tower header says yellow and its sector (RNF-09)", () => {
    const state = engineersDrive(createSession(practiceWithYellow().options));
    for (let guard = 0; guard < 20000 && !yellowsOf(state).length; guard += 1) stepOnce(state);
    const event = yellowsOf(state)[0];
    const flag = yellowFlag(state.circuit, sessionYellowsAt(state, event.t));
    expect(flag.kind).toBe("yellow");
    expect(flag.sectors).toEqual([event.sector]);
    expect(flag.label).toMatch(new RegExp(`(sector|sectores) ${event.sector}`));
    expect(flag.double).toBe(event.double);
  });

  it("a lap aborted before the place of the mistake brings no yellow", () => {
    const state = createSession(optionsFor(2024, "qualifying", 2, "ses3-abort"));
    let target = null;
    for (let guard = 0; guard < 40000 && !target && !state.done; guard += 1) {
      if (state.over) nextSegment(state);
      stepOnce(state);
      target = state.cars.find((car) => car.record?.yellow && !car.record.yellow.waved && car.record.yellow.at > state.clock + 1) || null;
    }
    expect(target).not.toBeNull();
    const at = target.record.yellow.at;
    expect(command(state, "abortLap", target.id)).toBe(true);
    advanceTo(state, at + 60);
    expect(yellowsOf(state).filter((event) => event.carId === target.id && Math.abs(event.t - at) < 0.001)).toEqual([]);
  });
});

describe("SES-4: the lap under a yellow - lifted, abandoned or deleted by era (F1M24-GAMEPLAY §2.10 amarilla-sector)", () => {
  const L = balance.yellow.laps;
  const optionsFor = (year, kind, round, seed) => {
    const career = createCareer(contextOf(), { year, teamId: "ferrari", seed });
    career.round = round % packs[year].calendar.length;
    runPractice(career, {});
    return { ...sessionOptions(career, kind), wetness: 0 };
  };
  /** Every segment to the end, with each segment's records and best lap. */
  const playAll = (options) => {
    const state = createSession(options);
    const segments = [];
    for (let guard = 0; guard < 10; guard += 1) {
      runSegmentToEnd(state);
      segments.push(state.cars.map((car) => ({ id: car.id, history: car.history.slice(), best: car.best })));
      if (state.done) break;
      nextSegment(state);
    }
    return { state, segments };
  };
  const ofType = (state, type) => state.events.filter((event) => event.type === type);
  const sessionsOf = (year, rounds, tag) => Array.from({ length: rounds }, (_, index) => playAll(optionsFor(year, "qualifying", index, `${tag}-${index}`)));
  /** Every meeting with the lap that met it (the timed lap of that car under way at the instant). */
  const meetings = (played) =>
    played.flatMap(({ state, segments }) =>
      ofType(state, "yellowLap").map((event) => ({
        event,
        state,
        lap: segments[event.segment]
          .find((row) => row.id === event.carId)
          .history.find((record) => record.start <= event.t + 0.001 && record.end >= event.t - 0.001 && (record.kind === "push" || record.kind === "timed")),
        yellow: state.events.find((other) => other.type === "yellow" && other.segment === event.segment && Math.abs(other.t - event.yellowAt) < 0.001),
      })),
    );
  const RULES = ["lift", "delete", "abandon"];

  it("sessions.json yellow.laps matches its schema, dates every year 1976-2026 and copies OpenF1's measure (RNF-07, SRS §6)", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(balance)).toBe(true);
    for (let year = 1976; year <= 2026; year += 1) {
      const rule = yellowLapRuleOf(year);
      expect(rule).not.toBeNull();
      expect(RULES).toContain(rule.single);
      expect(RULES).toContain(rule.double);
    }
    // Measured where OpenF1's race_control deletes the double-yellow times; pending (and never "delete") before.
    expect(yellowLapRuleOf(2024)).toMatchObject({ status: "measured", single: "lift", double: "delete" });
    expect(yellowLapRuleOf(2023).status).toBe("measured");
    expect(L.measured.deletedTimes.doubleYellow).toBeGreaterThan(0);
    expect(L.measured.deletedTimes.yellow).toBe(0);
    for (let year = 1976; year <= 2022; year += 1) {
      expect(yellowLapRuleOf(year)).toMatchObject({ status: "pending", single: "lift" });
      expect(yellowLapRuleOf(year).double).not.toBe("delete");
    }
    expect(L.abandonShare.single).toBe(L.measured.single.abandonShare);
    expect(L.abandonShare.double).toBe(L.measured.double.abandonShare);
    // The loss is a working value (OpenF1 cannot resolve it): pending, never above the measured p75.
    expect(L.lossSec.status).toBe("pending");
    expect(L.lossSec.single.p75).toBeLessThanOrEqual(L.measured.single.lossSec.p75);
    expect(L.lossSec.double.p75).toBeLessThanOrEqual(L.measured.double.lossSec.p75);
    expect(validate({ ...balance, yellow: { ...balance.yellow, laps: { ...L, eras: [{ ...L.eras[0], double: "ignore" }] } } })).toBe(false);
  });

  it("a car meets a yellow where it is waved, on its own timed lap, while it is out (RF-SIM-10, RF-WKD-02)", () => {
    const met = meetings(sessionsOf(2024, 8, "ses4-meet"));
    expect(met.length).toBeGreaterThan(3);
    met.forEach(({ event, lap, yellow }) => {
      expect(Object.keys(event).sort()).toEqual(["carId", "double", "lossSec", "outcome", "segment", "t", "type", "yellowAt"]);
      expect(yellow).toBeDefined();
      expect(event.double).toBe(yellow.double);
      expect(event.t).toBeGreaterThanOrEqual(yellow.t - 0.001);
      expect(event.t).toBeLessThan(yellow.until + 0.001);
      expect(lap).toBeDefined();
      // Never the lap whose mistake waved that very yellow.
      expect(Boolean(lap.yellow?.waved && Math.abs(lap.yellow.at - event.yellowAt) < 0.001)).toBe(false);
    });
  });

  it("2024: a single yellow lifts or abandons; a double abandons or has the time deleted, and a deleted time never classifies", () => {
    const played = sessionsOf(2024, 8, "ses4-2024");
    const met = meetings(played).map(({ event }) => event);
    met.filter((event) => !event.double).forEach((event) => expect(["lift", "abandon"]).toContain(event.outcome));
    met.filter((event) => event.double).forEach((event) => expect(["delete", "abandon"]).toContain(event.outcome));
    expect(met.filter((event) => event.double).length).toBeGreaterThan(0);
    const deletions = played.flatMap(({ state, segments }) =>
      ofType(state, "lapDeleted").map((event) => {
        const row = segments[event.segment].find((entry) => entry.id === event.carId);
        const timed = row.history.filter((record) => Number.isFinite(record.flying)).map((record) => record.flying);
        return { event, row, timed, lap: row.history.find((record) => record.deleted && Math.abs(record.end - event.t) < 0.001) };
      }),
    );
    played.forEach(({ state }) => {
      // Every deletion follows a meeting that said "delete".
      expect(ofType(state, "lapDeleted").length).toBeLessThanOrEqual(ofType(state, "yellowLap").filter((event) => event.outcome === "delete").length);
    });
    deletions.forEach(({ event, row, timed, lap }) => {
      expect(event.reason).toBe("doubleYellow");
      expect(lap).toBeDefined();
      expect(lap.deleted.time).toBeCloseTo(event.time, 2);
      expect(lap.flying).toBeUndefined();
      expect(lap.sectors).toBeUndefined();
      // The segment's best is another lap (or none), never the deleted time.
      expect(row.best).toBe(timed.length ? Math.min(...timed) : null);
    });
    expect(deletions.length + met.filter((event) => event.outcome === "abandon").length).toBeGreaterThan(0);
  });

  it("before 2023 nothing is deleted: 2019 doubles must be abandoned, 2012 and 1990 lift or give up (SRS §6, pending rows)", () => {
    [[2019, ["abandon"]], [2012, ["lift", "abandon"]], [1990, ["lift", "abandon"]]].forEach(([year, allowed]) => {
      const played = sessionsOf(year, 6, `ses4-era-${year}`);
      played.forEach(({ state }) => expect(ofType(state, "lapDeleted")).toEqual([]));
      const met = meetings(played).map(({ event }) => event);
      met.filter((event) => event.double).forEach((event) => expect(allowed).toContain(event.outcome));
      met.filter((event) => !event.double).forEach((event) => expect(["lift", "abandon"]).toContain(event.outcome));
    });
  });

  it("a lift adds its loss to the lap, its end and the sector it is in; an abandon leaves no time", () => {
    const met = meetings(sessionsOf(2024, 8, "ses4-loss"));
    const abandoned = met.filter(({ event }) => event.outcome === "abandon");
    const lifted = met.filter(({ event, lap }) => event.outcome === "lift" && !lap.aborted && Number.isFinite(lap.flying));
    expect(abandoned.length + lifted.length).toBeGreaterThan(0);
    abandoned.forEach(({ event, lap }) => {
      expect(lap.aborted).toBe(true);
      expect(lap.flying).toBeUndefined();
      expect(event.lossSec).toBeNull();
    });
    met
      .filter(({ event }) => event.outcome !== "abandon")
      .forEach(({ event }) => {
        const spread = L.lossSec[event.double ? "double" : "single"];
        expect(event.lossSec).toBeGreaterThanOrEqual(spread.p25 - 0.001);
        expect(event.lossSec).toBeLessThanOrEqual(spread.p75 + 0.001);
      });
    lifted.forEach(({ lap }) => {
      // The lap stays whole: its time is its duration and the sum of its sectors.
      expect(lap.end - lap.start).toBeCloseTo(lap.flying, 6);
      expect(lap.sectors.reduce((sum, time) => sum + time, 0)).toBeCloseTo(lap.flying, 6);
    });
  });

  it("the same seed gives the same meetings and laps, however the view slices time (RF-SIM-15, RNF-05)", () => {
    const options = optionsFor(2024, "qualifying", 3, "ses4-det");
    const a = playAll(options);
    const b = playAll(options);
    expect(ofType(a.state, "yellowLap").length).toBeGreaterThan(0);
    expect(JSON.stringify(b.state.events)).toBe(JSON.stringify(a.state.events));
    expect(JSON.stringify(sessionResult(b.state))).toBe(JSON.stringify(sessionResult(a.state)));
    // Fine and coarse slices of the first segment's clock.
    const fine = createSession(options);
    const coarse = createSession(options);
    for (let guard = 0; guard < 200000 && !fine.over; guard += 1) stepOnce(fine);
    for (let tau = 0; !coarse.over && tau < 20000; tau += 41) advanceTo(coarse, tau);
    expect(JSON.stringify(coarse.events)).toBe(JSON.stringify(fine.events));
    expect(JSON.stringify(coarse.cars.map((car) => car.history))).toBe(JSON.stringify(fine.cars.map((car) => car.history)));
  });

  it("the player's abort still works on a lap that has lifted: the car goes on from where it is", () => {
    const state = createSession(optionsFor(2024, "qualifying", 3, "ses4-det"));
    let target = null;
    for (let guard = 0; guard < 60000 && !target && !state.done; guard += 1) {
      if (state.over) nextSegment(state);
      stepOnce(state);
      target = state.cars.find((car) => car.record?.warp && Number.isFinite(car.record.flying) && !car.record.aborted && car.record.end > state.clock + 5) || null;
    }
    expect(target).not.toBeNull();
    const record = target.record;
    const lifted = { ...record.warp };
    expect(command(state, "abortLap", target.id)).toBe(true);
    expect(record.aborted).toBe(true);
    expect(record.flying).toBeUndefined();
    expect(record.yellowHit).toBeUndefined();
    // The abort's warp starts where the car is, after the lift's.
    expect(record.warp.at).toBeGreaterThanOrEqual(lifted.at);
    expect(record.warp.share).toBeGreaterThanOrEqual(lifted.share - 1e-9);
  });
});

/**
 * SES-C1 (docs/manager/F1M24-CHINA.md §1.5 «Radio en sesiones», §3.3 ola 1; AUD-C3 engine part; RF-CMD-03, RF-WKD-02,
 * RF-SIM-15, RNF-05, RNF-07, RNF-08): the session emits radio[] and events[] with the race's shape - the flying lap
 * finished (lapComplete), the garage exit (garageExit) and the flag - and the same seed gives the same ones.
 */
describe("SES-C1: radio and events with the race's shape", () => {
  const R = balance.radio;
  const optionsFor = (year, kind, round, seed) => {
    const career = createCareer(contextOf(), { year, teamId: "ferrari", seed });
    career.round = round % packs[year].calendar.length;
    runPractice(career, {});
    return { ...sessionOptions(career, kind), wetness: 0 };
  };
  /** Every segment to the end with the engineers driving the player's cars; each segment's histories kept. */
  const playAll = (options) => {
    const state = createSession(options);
    const segments = [];
    for (let guard = 0; guard < 10; guard += 1) {
      runSegmentToEnd(state);
      segments.push(state.cars.map((car) => ({ id: car.id, isUser: car.isUser, history: car.history.slice() })));
      if (state.done) break;
      nextSegment(state);
    }
    return { state, segments };
  };
  const ofType = (state, type) => state.events.filter((event) => event.type === type);
  // `seenYellows` holds event indices (SES-4 bookkeeping): new events shift them, the laps do not change.
  const lapsOf = (segments) => JSON.stringify(segments.map((cars) => cars.map((car) => car.history.map(({ seenYellows, ...lap }) => lap))));

  let quali = null;
  let practice = null;
  beforeAll(() => {
    quali = playAll(optionsFor(2024, "qualifying", 3, "sesc1-q"));
    practice = playAll(optionsFor(2013, "practice", 2, "sesc1-p"));
  });

  it("sessions.json radio matches its schema, closes the kinds and is pending design (RNF-07)", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(balance)).toBe(true);
    expect(R.status).toBe("pending");
    expect(R.note.length).toBeGreaterThan(20);
    expect([...SESSION_RADIO_KINDS].sort()).toEqual(Object.keys(R.kinds).sort());
    expect(SESSION_RADIO_KINDS.every((kind) => kind.startsWith("session-"))).toBe(true);
    const broken = { ...balance, radio: { ...R, kinds: { ...R.kinds, "session-garage-exit": { quietSec: 0, alert: false, volume: 1 } } } };
    expect(validate(broken)).toBe(false);
  });

  it("the radio has the race's shape, goes to the player's drivers only and only in known kinds", () => {
    [quali, practice].forEach(({ state }) => {
      expect(state.radio.length).toBeGreaterThan(0);
      const users = new Set(state.cars.filter((car) => car.isUser).map((car) => car.id));
      state.radio.forEach((message) => {
        expect(users.has(message.carId)).toBe(true);
        expect(SESSION_RADIO_KINDS).toContain(message.kind);
        expect(Number.isFinite(message.t)).toBe(true);
        expect(Number.isInteger(message.segment)).toBe(true);
        expect(message.lap === null || Number.isInteger(message.lap)).toBe(true);
        expect(message.alert).toBe(R.kinds[message.kind].alert);
      });
      // In time order within each segment, like the race's.
      state.radio.forEach((message, index) => {
        const previous = state.radio[index - 1];
        if (previous && previous.segment === message.segment) expect(message.t).toBeGreaterThanOrEqual(previous.t - 1e-9);
      });
    });
  });

  it("garageExit: once per run, when the car crosses the end of the exit line (GARAGE_EXIT -> OUT_LAP)", () => {
    const { state, segments } = quali;
    const exits = ofType(state, "garageExit");
    const outs = ofType(state, "out");
    expect(exits.length).toBe(outs.length);
    expect(exits.length).toBeGreaterThan(0);
    exits.forEach((event) => {
      expect(event).toEqual(expect.objectContaining({ lap: expect.any(Number), carId: expect.any(String), segment: expect.any(Number), queueSec: expect.any(Number), laneSec: expect.any(Number) }));
      const record = segments[event.segment].find((car) => car.id === event.carId).history.find((lap) => lap.garageExit && Math.abs(lap.garageExit.trackAt - event.t) < 0.001);
      expect(record).toBeTruthy();
      expect(record.lap).toBe(event.lap);
      const out = outs.find((other) => other.carId === event.carId && Math.abs(other.trackAt - event.t) < 0.001);
      expect(out).toBeTruthy();
      expect(event.t).toBeGreaterThanOrEqual(out.t);
    });
    // The phase flips at the event, in a segment replayed to that instant.
    const fresh = createSession(optionsFor(2024, "qualifying", 3, "sesc1-q"));
    // The same orders as runSegmentToEnd gave: the engineers drive the player's cars from the start.
    fresh.cars.filter((car) => car.isUser).forEach((car) => command(fresh, "autopilot", car.id));
    const first = exits.find((event) => event.segment === 0);
    advanceTo(fresh, first.t + 2);
    expect(carStatus(fresh, first.carId, first.t - 0.05).runPhase).toBe("GARAGE_EXIT");
    expect(carStatus(fresh, first.carId, first.t + 0.05).runPhase).not.toBe("GARAGE_EXIT");
  });

  it("lapComplete: one per timed lap finished (kept or deleted), never for an aborted one, with the order after it", () => {
    [quali, practice].forEach(({ state, segments }) => {
      const done = ofType(state, "lapComplete");
      expect(done.length).toBeGreaterThan(0);
      let expected = 0;
      segments.forEach((cars, segment) =>
        cars.forEach((car) =>
          car.history.forEach((lap) => {
            if ((lap.kind !== "push" && lap.kind !== "timed") || lap.aborted) return;
            expected += 1;
            const event = done.find((entry) => entry.segment === segment && entry.carId === car.id && entry.lap === lap.lap);
            expect(event).toBeTruthy();
            expect(event.t).toBeCloseTo(lap.end, 3);
            expect(event.kind).toBe(lap.kind);
            expect(event.time).toBeCloseTo(lap.deleted ? lap.deleted.time : lap.flying, 3);
            expect(event.deleted).toBe(lap.deleted ? lap.deleted.reason : null);
          }),
        ),
      );
      expect(done.length).toBe(expected);
      // An improvement is the session's own pb/best at the same instant.
      done.forEach((event) => {
        const improved = state.events.some((other) => (other.type === "pb" || other.type === "best") && other.carId === event.carId && other.segment === event.segment && Math.abs(other.t - event.t) < 0.001);
        expect(event.improved).toBe(improved);
        if (event.position !== null) expect(event.gapSec).toBeGreaterThanOrEqual(0);
        if (event.position === 1) expect(event.gapSec).toBe(0);
      });
    });
    // Knockout segments say where the cut is.
    const knockout = ofType(quali.state, "lapComplete").filter((event) => quali.state.segments[event.segment].drop);
    expect(knockout.length).toBeGreaterThan(0);
    knockout.forEach((event) => {
      expect(event.cutoff).toBeGreaterThan(0);
      expect(event.dropZone).toBe(event.position === null || event.position > event.cutoff);
    });
  });

  it("the engineer's calls line up with the events: a lap call per own lap, the flag, through or out at each knockout", () => {
    const { state } = quali;
    const users = state.cars.filter((car) => car.isUser).map((car) => car.id);
    const ownLaps = ofType(state, "lapComplete").filter((event) => users.includes(event.carId));
    const lapCalls = state.radio.filter((message) => message.kind === "session-lap" || message.kind === "session-lap-deleted");
    expect(lapCalls.length).toBe(ownLaps.length);
    lapCalls.forEach((message) => {
      const event = ownLaps.find((other) => other.carId === message.carId && other.segment === message.segment && Math.abs(other.t - message.t) < 0.001);
      expect(event).toBeTruthy();
      expect(message.lap).toBe(event.lap);
      expect(message.position).toBe(event.position);
    });
    ofType(state, "garageExit")
      .filter((event) => users.includes(event.carId))
      .forEach((event) => expect(state.radio.some((message) => message.kind === "session-garage-exit" && message.carId === event.carId && Math.abs(message.t - event.t) < 0.001)).toBe(true));
    // The flag call at the flag's own instant.
    ofType(state, "flag").forEach((flag) => state.radio.filter((message) => message.kind === "session-flag" && message.segment === flag.segment).forEach((message) => expect(message.t).toBeCloseTo(flag.t, 3)));
    state.segments.forEach((segment, index) => {
      const ends = state.radio.filter((message) => message.segment === index && ["session-through", "session-knocked-out", "session-result"].includes(message.kind));
      const alive = users.filter((id) => {
        const car = state.cars.find((entry) => entry.id === id);
        return car.out === undefined || car.out >= index;
      });
      expect(ends.map((message) => message.carId).sort()).toEqual(alive.sort());
      ends.forEach((message) => {
        if (segment.drop) expect(["session-through", "session-knocked-out"]).toContain(message.kind);
        else expect(message.kind).toBe("session-result");
        const car = state.cars.find((entry) => entry.id === message.carId);
        expect(message.kind === "session-knocked-out").toBe(car.out === index);
      });
    });
    // Practice: a push call never (no attempts), a result at the end.
    expect(practice.state.radio.some((message) => message.kind === "session-push")).toBe(false);
    expect(practice.state.radio.filter((message) => message.kind === "session-result")).toHaveLength(practice.state.cars.filter((car) => car.isUser).length);
  });

  it("the same seed gives the same events and radio, however the view slices time (RF-SIM-15, RNF-05)", () => {
    const options = optionsFor(2024, "qualifying", 3, "sesc1-q");
    const again = playAll(options);
    expect(JSON.stringify(again.state.events)).toBe(JSON.stringify(quali.state.events));
    expect(JSON.stringify(again.state.radio)).toBe(JSON.stringify(quali.state.radio));
    const fine = createSession(options);
    const coarse = createSession(options);
    for (let guard = 0; guard < 200000 && !fine.over; guard += 1) stepOnce(fine);
    for (let tau = 0; !coarse.over && tau < 20000; tau += 37) advanceTo(coarse, tau);
    expect(ofType(fine, "garageExit").length).toBeGreaterThan(0);
    expect(JSON.stringify(coarse.events)).toBe(JSON.stringify(fine.events));
    expect(JSON.stringify(coarse.radio)).toBe(JSON.stringify(fine.radio));
    // Another seed is another session.
    const other = playAll(optionsFor(2024, "qualifying", 3, "sesc1-other"));
    expect(JSON.stringify(other.state.events)).not.toBe(JSON.stringify(quali.state.events));
  });

  it("the radio never changes a lap or another event: off, the session is the same (RNF-05)", () => {
    const options = optionsFor(2024, "qualifying", 3, "sesc1-q");
    const was = R.enabled;
    R.enabled = false;
    let off;
    try {
      off = playAll(options);
    } finally {
      R.enabled = was;
    }
    expect(off.state.radio).toEqual([]);
    expect(lapsOf(off.segments)).toBe(lapsOf(quali.segments));
    expect(JSON.stringify(off.state.events)).toBe(JSON.stringify(quali.state.events));
  });

  it("quietSec holds a repeated kind to the same driver within the segment; rivals never get one", () => {
    const state = { segment: 0, radio: [] };
    const mine = { id: "a", isUser: true };
    const cfg = { enabled: true, kinds: { "session-yellow": { quietSec: 10, alert: true } } };
    expect(pushSessionRadio(state, mine, "session-yellow", 100, 3, {}, cfg)).toEqual({ lap: 3, carId: "a", kind: "session-yellow", t: 100, segment: 0, alert: true });
    expect(pushSessionRadio(state, mine, "session-yellow", 105, 3, {}, cfg)).toBeNull();
    expect(pushSessionRadio(state, mine, "session-yellow", 110, 4, {}, cfg)).not.toBeNull();
    state.segment = 1;
    expect(pushSessionRadio(state, mine, "session-yellow", 1, 1, {}, cfg)).not.toBeNull();
    expect(pushSessionRadio(state, { id: "b", isUser: false }, "session-yellow", 500, 1, {}, cfg)).toBeNull();
    expect(pushSessionRadio(state, mine, "session-unknown", 500, 1, {}, cfg)).toBeNull();
    // A session saved before SES-C1 has no radio list: it is made on first use.
    const old = { segment: 0 };
    pushSessionRadio(old, mine, "session-yellow", 0, 1, {}, cfg);
    expect(old.radio).toHaveLength(1);
    expect(sessionRadioAt(quali.state, Infinity, 0).every((message) => message.segment === 0)).toBe(true);
  });

  it("every kind and both new events have words in ES and EN; unknown ones none (RNF-08)", () => {
    const names = { a: "Alonso", b: "Massa" };
    const samples = {
      "session-garage-exit": { queueSec: 1.5, compound: "soft" },
      "session-push": { attempt: 1, of: 2 },
      "session-lap": { time: 92.345, improved: true, position: 3, gapSec: 0.215, dropZone: true },
      "session-lap-deleted": { time: 92.345, reason: "doubleYellow" },
      "session-yellow": { outcome: "delete", double: true, sector: 2 },
      "session-impeded": { otherId: "b", outcome: "lift", lossSec: 0.4 },
      "session-flag": { counts: true },
      "session-through": { position: 8 },
      "session-knocked-out": { position: 16 },
      "session-result": { position: 4 },
    };
    SESSION_RADIO_KINDS.forEach((kind) => {
      const text = sessionRadioText({ carId: "a", kind, ...samples[kind] }, names);
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain("Alonso");
      expect(text).not.toMatch(/undefined|NaN/);
    });
    expect(sessionRadioText({ carId: "a", kind: "battle-passed" }, names)).toBe("");
    expect(sessionEventText({ type: "garageExit", carId: "a" }, names)).toContain("Alonso");
    expect(sessionEventText({ type: "lapComplete", carId: "a", time: 92.1, position: 1, gapSec: 0 }, names)).toMatch(/P1/);
    expect(sessionEventText({ type: "flag" }, names)).toBe("");
    // Every real message of a played session reads.
    quali.state.radio.forEach((message) => expect(sessionRadioText(message, names)).not.toMatch(/undefined|NaN/));
  });
});
