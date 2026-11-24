/**
 * WKD-2 practice-goals-summary (docs/manager/F1M24-GAMEPLAY.md §2.12.2, §3.3; RF-WKD-03,
 * RF-WKD-07): the "what the session left" panel of the practice results - confidence in six
 * levels with its delta against no practice and its effect on Sunday's control, and the setup's
 * change since the first run - read from the weekend the engine wrote (RNF-05: it never writes),
 * its cut-offs in data/balance/weekend-ui.json with a schema (RNF-07).
 */

import React from "react";
import Ajv from "ajv";
import { render, screen, within } from "@testing-library/react";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import balance from "../data/balance/weekend-ui.json";
import driverBalance from "../data/balance/driver-attributes.json";
import schema from "../engine/packs/schema/weekend-ui.schema.json";
import { createCareer, createContext, runPractice, runSetupLap, startWeekend } from "../engine/career";
import { loadSeasonPack } from "../engine/packs/seasonPacks";
import { driversOf } from "../engine/world";
import SessionResults, { confidenceLevelOf, practiceSummaryOf } from "./SessionResults";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

let context = null;
beforeAll(async () => {
  const { pack } = await loadSeasonPack(2013);
  context = createContext(fallbackBootstrap, reference, { [pack.year]: pack });
});

const settings = balance.practiceSummary;
const perShare = driverBalance.effects.confidence.controlPerShare;

describe("weekend-ui.json practiceSummary (RNF-07, RF-WKD-03)", () => {
  it("matches the schema, with six levels from 0 upwards", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(balance)).toBe(true);
    const froms = settings.confidence.levels.map((level) => level.from);
    expect(froms).toHaveLength(6);
    expect(froms[0]).toBe(0);
    froms.slice(1).forEach((from, index) => expect(from).toBeGreaterThan(froms[index]));
    expect(new Set(settings.confidence.levels.map((level) => level.id)).size).toBe(6);
  });

  it("a level per confidence, the lower cut included", () => {
    const { levels, neutral } = settings.confidence;
    expect(confidenceLevelOf(0)).toMatchObject({ index: 0, count: 6 });
    expect(confidenceLevelOf(1).index).toBe(5);
    levels.forEach((level, index) => {
      expect(confidenceLevelOf(level.from).index).toBe(index);
    });
    levels.slice(1).forEach((level, index) => {
      expect(confidenceLevelOf(level.from - 1e-6).index).toBe(index);
    });
    expect(confidenceLevelOf(neutral).id).toBe("settled");
    expect(confidenceLevelOf(NaN)).toBeNull();
    expect(confidenceLevelOf(0.5, [])).toBeNull();
  });
});

describe("practiceSummaryOf", () => {
  const weekend = {
    practice: { a: { program: "setup", confidence: 0.74, setup: -0.084 }, b: { program: "longrun", confidence: 0.5, setup: 0.084 }, rival: { confidence: 0.6, setup: 0 } },
    feedback: { a: { program: "setup", score: 74, balance: "good" }, b: { program: "longrun", score: 50, balance: "oversteer" } },
    runs: { a: { count: 3, knowledge: 0.48, history: [61, 68, 74] } },
  };

  it("deltas against no practice and since the first run; only the drivers asked for", () => {
    const rows = practiceSummaryOf({ weekend, drivers: [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "ghost", name: "G" }] });
    expect(rows.map((row) => row.id)).toEqual(["a", "b"]);
    const [a, b] = rows;
    expect(a.confidenceDelta).toBeCloseTo(0.74 - settings.confidence.neutral, 10);
    expect(a.controlDelta).toBeCloseTo((0.74 - settings.confidence.neutral) * perShare, 10);
    expect(a.level.id).toBe("high");
    expect(a).toMatchObject({ satisfaction: 74, satisfactionDelta: 13, runs: 3, knowledge: 48, lapSec: -0.084, program: "setup" });
    expect(b).toMatchObject({ satisfaction: 50, satisfactionDelta: null, runs: 0, knowledge: null });
    expect(b.controlDelta).toBeLessThan(0);
  });

  it("nothing to show without practice (older saves, a weekend not yet run)", () => {
    expect(practiceSummaryOf({ weekend: null, drivers: [{ id: "a" }] })).toEqual([]);
    expect(practiceSummaryOf({ weekend: { practice: null }, drivers: [{ id: "a" }] })).toEqual([]);
    expect(practiceSummaryOf({ weekend, drivers: [{ id: "a" }], settings: {} })).toEqual([]);
  });

  it("in a real weekend: reads what the engine left, writes nothing, same seed same summary (RNF-05)", () => {
    const build = () => {
      const career = createCareer(context, { year: 2013, teamId: "ferrari", seed: "wkd-2" });
      startWeekend(career);
      const drivers = driversOf(career.world, career.teamId);
      runSetupLap(career, drivers[0].id);
      runSetupLap(career, drivers[0].id);
      runPractice(career, { [drivers[0].id]: "setup", [drivers[1].id]: "longrun" });
      return { career, drivers };
    };
    const { career, drivers } = build();
    const before = JSON.stringify(career.weekend);
    const rows = practiceSummaryOf({ weekend: career.weekend, drivers });
    expect(JSON.stringify(career.weekend)).toBe(before);
    expect(rows).toHaveLength(2);
    const [first, second] = rows;
    const practice = career.weekend.practice[first.id];
    expect(first.confidence).toBe(practice.confidence);
    expect(first.controlDelta).toBeCloseTo((practice.confidence - settings.confidence.neutral) * perShare, 10);
    expect(first.lapSec).toBe(practice.setup);
    expect(first.runs).toBe(2);
    expect(first.satisfactionDelta).toBe(career.weekend.feedback[first.id].score - career.weekend.runs[first.id].history[0]);
    expect(second.satisfactionDelta).toBeNull();
    expect(second.program).toBe("longrun");
    const again = build();
    expect(practiceSummaryOf({ weekend: again.career.weekend, drivers: again.drivers })).toEqual(rows);
  });
});

describe("the panel in the practice results (RF-WKD-07)", () => {
  const summary = practiceSummaryOf({
    weekend: { practice: { a: { program: "setup", confidence: 0.74, setup: -0.084 } }, feedback: { a: { score: 74 } }, runs: { a: { count: 3, knowledge: 0.48, history: [61, 68, 74] } } },
    drivers: [{ id: "a", name: "Driver A" }],
  });
  const table = (kind) => ({ kind, rows: [], segments: [], best: null, segmentBest: [], leader: null, timed: false });

  it("shows the level in words and numbers, never by colour alone (RNF-09)", () => {
    render(<SessionResults table={table("practice")} summary={summary} />);
    const panel = screen.getByRole("region", { name: "Driver A" });
    expect(screen.getByText(/what the session left/i)).toBeInTheDocument();
    expect(within(panel).getByText("High")).toBeInTheDocument();
    expect(within(panel).getByText(/level 5 of 6/i)).toBeInTheDocument();
    expect(within(panel).getByText(/\+13 pts since the first run/i)).toBeInTheDocument();
    expect(within(panel).getByText(/−0\.08 s a lap/i)).toBeInTheDocument();
    expect(within(panel).getByText(/known after 3 runs/i)).toBeInTheDocument();
  });

  it("only after practice, and nothing when there is no summary", () => {
    const { unmount } = render(<SessionResults table={table("qualifying")} summary={summary} />);
    expect(screen.queryByText(/what the session left/i)).toBeNull();
    unmount();
    render(<SessionResults table={table("practice")} />);
    expect(screen.queryByText(/what the session left/i)).toBeNull();
  });
});
