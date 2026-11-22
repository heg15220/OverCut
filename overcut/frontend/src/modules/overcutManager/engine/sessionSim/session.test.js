/**
 * Playable sessions (RF-WKD-01/02/03/05, RF-SIM-15, RNF-05): a car stays in its garage
 * until it is sent out, a run plan is driven and ends in the box, a lap can be aborted,
 * the knockout drops the slowest with the player's orders in play, every era's format
 * builds, and the same seed and orders replay the same session byte for byte.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import { createCareer, createContext, currentRace, entrantsFor, eraOf, runPractice } from "../career";
import { loadSeasonPack } from "../packs/seasonPacks";
import { rulesFor } from "../rules";
import {
  advanceTo, carStatus, command, createSession, nextSegment, rankOf, replaySession, runSegmentToEnd, runSessionToEnd, sessionFormat, sessionResult, stepOnce,
} from ".";

let context = null;
const YEARS = [1990, 1998, 2004, 2005, 2008, 2013, 2024];
beforeAll(async () => {
  const loaded = await Promise.all(YEARS.map((year) => loadSeasonPack(year)));
  context = createContext(fallbackBootstrap, reference, Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack])));
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
