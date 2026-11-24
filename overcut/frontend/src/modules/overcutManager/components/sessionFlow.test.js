/**
 * WKD-1 (docs/manager/F1M24-GAMEPLAY.md §2.12.2, §3.3): the weekend's fixed loop gate -> session
 * -> results (RF-WKD-01, RF-WKD-02, RF-WKD-07), the skippable transition that respects
 * prefers-reduced-motion (RNF-09), one results table for every kind of session, its balance in
 * data/balance/weekend-ui.json with a schema (RNF-07), and "simulate up to the race" giving the
 * same grid as the sessions simulated one by one (RF-SIM-15 / RNF-05).
 */

import React from "react";
import Ajv from "ajv";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import balance from "../data/balance/weekend-ui.json";
import schema from "../engine/packs/schema/weekend-ui.schema.json";
import {
  closeSessionReview, commitPracticeSession, createCareer, createContext, createWeekendSession, entrantsFor, gateSessionOf, openWeekendSession, practiceTimesOf,
  runPractice, runQualifyingSession, sessionsBeforeRace, simulateGateSession, simulateToRace, startWeekend, weekendStepOf,
} from "../engine/career";
import { loadSeasonPack } from "../engine/packs/seasonPacks";
import { runSessionToEnd, sessionResult } from "../engine/sessionSim";
import Transition, { prefersReducedMotion, transitionTimings } from "./Transition";
import SessionGate, { clockText, gateChoices } from "./SessionGate";
import SessionResults, { sessionResultTable } from "./SessionResults";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const setMotion = (reduce) => {
  window.matchMedia = jest.fn((query) => ({ matches: reduce && query.includes("reduce"), media: query, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {} }));
};

let context = null;
beforeAll(async () => {
  const loaded = await Promise.all([2013, 2024].map((year) => loadSeasonPack(year)));
  context = createContext(fallbackBootstrap, reference, Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack])));
});

afterEach(() => {
  delete window.matchMedia;
  jest.useRealTimers();
});

describe("weekend-ui.json (RNF-07)", () => {
  it("matches its schema", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(balance)).toBe(true);
    expect(validate.errors).toBeNull();
  });
});

describe("Transition (session-options-transition, RNF-09)", () => {
  it("prefers-reduced-motion: no animation, hands over at once", () => {
    setMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    const onDone = jest.fn();
    render(<Transition label="Qualifying" onDone={onDone} />);
    expect(screen.queryByTestId("session-transition")).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("no matchMedia counts as reduced motion", () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it("with motion: in, hold, out on the balance timings, then done once", () => {
    setMotion(false);
    jest.useFakeTimers();
    const onDone = jest.fn();
    render(<Transition label="Qualifying" onDone={onDone} />);
    const timing = transitionTimings();
    expect(screen.getByTestId("session-transition")).toHaveClass("wk-transition", "is-in");
    act(() => jest.advanceTimersByTime(timing.in));
    expect(screen.getByTestId("session-transition")).toHaveClass("is-hold");
    act(() => jest.advanceTimersByTime(timing.hold));
    expect(screen.getByTestId("session-transition")).toHaveClass("is-out");
    expect(onDone).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(timing.out + 10));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("is skippable with the button or a key, and only ends once", () => {
    setMotion(false);
    jest.useFakeTimers();
    const onDone = jest.fn();
    render(<Transition label="Results" onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.keyDown(window, { key: "Escape" });
    act(() => jest.runAllTimers());
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("SessionGate", () => {
  it("offers manage and simulate, and up to the race only when it skips more", () => {
    expect(gateChoices({ toRace: false })).toEqual(["manage", "simulate"]);
    expect(gateChoices({ toRace: true })).toEqual(["manage", "simulate", "toRace"]);
    expect(clockText(15 * 3600 + 30 * 60)).toBe("15:30");
    expect(clockText(null)).toBeNull();
  });

  it("asks for confirmation before acting", () => {
    const onChoose = jest.fn();
    render(<SessionGate title="Practice" details={[["Local time", "14:30"]]} toRace onChoose={onChoose} />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    fireEvent.click(screen.getByRole("radio", { name: /simulate up to the race/i }));
    expect(onChoose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onChoose).toHaveBeenCalledWith("toRace");
  });
});

describe("the weekend loop in the career (RF-WKD-01/02)", () => {
  it("gate -> live -> results -> next gate, with the session under review", () => {
    const career = createCareer(context, { year: 2013, teamId: "ferrari", seed: "loop" });
    startWeekend(career);
    expect(weekendStepOf(career)).toBe("gate");
    expect(gateSessionOf(career)).toBe("practice");
    expect(sessionsBeforeRace(career)).toBe(2);
    openWeekendSession(career);
    expect(weekendStepOf(career)).toBe("live");
    runPractice(career, {});
    expect(weekendStepOf(career)).toBe("results");
    expect(career.weekend.review).toBe("practice");
    closeSessionReview(career);
    expect(weekendStepOf(career)).toBe("gate");
    expect(gateSessionOf(career)).toBe("qualifying");
    expect(sessionsBeforeRace(career)).toBe(1);
    simulateGateSession(career);
    expect(career.weekend.review).toBe("qualifying");
    expect(career.weekend.stage).toBe("strategy");
    expect(gateSessionOf(career)).toBeNull();
  });

  it("simulate up to the race gives the grid of the sessions simulated one by one (RF-SIM-15)", () => {
    const a = createCareer(context, { year: 2013, teamId: "ferrari", seed: "to-race" });
    const b = createCareer(context, { year: 2013, teamId: "ferrari", seed: "to-race" });
    startWeekend(a);
    simulateToRace(a);
    runPractice(b, {});
    runQualifyingSession(b, {});
    expect(a.weekend.stage).toBe("strategy");
    expect(weekendStepOf(a)).toBe("gate");
    expect(a.weekend.qualifying.order).toEqual(b.weekend.qualifying.order);
    expect(a.weekend.qualifying.times).toEqual(b.weekend.qualifying.times);
  });

  it("a sprint weekend (2024): up to the race runs shootout and sprint too", () => {
    const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "sprint-gate" });
    career.round = career.world.races.findIndex((race) => race.sprint);
    startWeekend(career);
    expect(sessionsBeforeRace(career)).toBe(4);
    simulateToRace(career);
    expect(career.weekend.shootout?.order?.length).toBeGreaterThan(0);
    expect(career.weekend.sprint?.rows?.length).toBeGreaterThan(0);
    expect(career.weekend.stage).toBe("strategy");
    expect(sessionsBeforeRace(career)).toBe(0);
  });
});

describe("unified results (session-results-unified, RF-WKD-07)", () => {
  it("practice: best lap and its compound from the runs; a simulated practice has no timing", () => {
    const times = practiceTimesOf({
      a: [{ laps: 3, best: 91.2, compound: "medium" }, { laps: 4, best: 90.5, compound: "soft" }],
      b: [{ laps: 5, best: 90.9, compound: "hard" }],
      c: [{ laps: 1, best: null, compound: "soft" }],
    });
    expect(times.order).toEqual(["a", "b", "c"]);
    expect(times.best.a).toEqual({ time: 90.5, compound: "soft", laps: 7 });
    expect(times.best.c.time).toBeNull();
    expect(sessionResultTable({ kind: "practice", weekend: { practiceTimes: null } }).rows).toHaveLength(0);
  });

  it("qualifying knockout: three segments, the segment each car dropped out in, the best per segment", () => {
    const weekend = {
      qualifying: {
        order: ["a", "b", "c", "d"],
        times: { a: 80, b: 80.2, c: 81, d: 82 },
        sessions: [
          [{ id: "a", time: 81 }, { id: "b", time: 81.1 }, { id: "c", time: 81.5 }, { id: "d", time: 82 }],
          [{ id: "b", time: 80.4 }, { id: "a", time: 80.5 }, { id: "c", time: 81 }],
          [{ id: "a", time: 80 }, { id: "b", time: 80.2 }],
        ],
        teams: { a: "ferrari", b: "mclaren", c: "ferrari", d: "williams" },
      },
    };
    const table = sessionResultTable({ kind: "qualifying", weekend, entrants: [], teamId: "ferrari", segmentNames: ["Q1", "Q2", "Q3"] });
    expect(table.segments).toEqual(["Q1", "Q2", "Q3"]);
    expect(table.rows.map((row) => row.out)).toEqual([null, null, 1, 0]);
    expect(table.segmentBest).toEqual([81, 80.4, 80]);
    expect(table.rows.filter((row) => row.own).map((row) => row.id)).toEqual(["a", "c"]);
    expect(table.leader.id).toBe("a");
  });

  it("a played practice in a real weekend: ten rows a page, own rows highlighted, best lap in purple", () => {
    const career = createCareer(context, { year: 2013, teamId: "ferrari", seed: "results" });
    const practice = createWeekendSession(career, "practice");
    runSessionToEnd(practice);
    commitPracticeSession(career, sessionResult(practice), {});
    expect(career.weekend.review).toBe("practice");
    const table = sessionResultTable({ kind: "practice", weekend: career.weekend, entrants: entrantsFor(career), teamId: career.teamId });
    expect(table.rows.length).toBe(entrantsFor(career).length);
    const onContinue = jest.fn();
    const { container } = render(<SessionResults table={table} teams={career.world.teams} onContinue={onContinue} />);
    const bodyRows = () => within(within(screen.getByRole("table")).getAllByRole("rowgroup")[1]).getAllByRole("row").length;
    expect(bodyRows()).toBe(Math.min(balance.results.pageSize, table.rows.length));
    // El mejor tiempo solo se marca con clase (morado), sin rol accesible propio.
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelectorAll(".wk-res__best").length).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(bodyRows()).toBe(Math.min(balance.results.pageSize, table.rows.length - balance.results.pageSize));
    const ownCount = table.rows.filter((row) => row.own).length;
    expect(ownCount).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(onContinue).toHaveBeenCalled();
  });
});
