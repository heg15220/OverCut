/**
 * HUD-6 of docs/manager/F1M24-GAMEPLAY.md (driver-panel-units in °C; §2.8, §1.5, §1.6, §1.7 `tyreC[i]`;
 * RF-SIM-03, RF-CMD-01, RNF-05, RNF-07, RNF-09):
 *   - hud.json (driverPanel.tyreTemp) validates against its schema
 *   - the panel shows °C only when the engine sends tyreC (SIM-6 always does); without it, the 0..1 meter (§1.5)
 *   - the window comes from race-tyres.json windowC (SIM-6) or the engine's own, in the shapes a data
 *     file may use (era spans, supplier, compound); never from the game's °C (§1.6)
 *   - the verdict against the window (cold, edges, in window, overheating) and the trend on the race
 *     clock (step race: by seconds; quick race: lap against lap), always in words (RNF-09)
 *   - a worker tick's snapshot[i].tyreC reaches the mirror by car id; without it the mirror is untouched
 */

import React from "react";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { act, render, screen, within } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import HUD from "../data/balance/hud.json";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, runPractice, runQualifyingSession, weekendRaceArgs } from "../engine/career";
import { createRace, stepLap } from "../engine/race";
import { ManagerContext } from "./context";
import { TyreTemp } from "./Broadcast";
import LiveRace from "./LiveRace";
import { TYRE_TEMP, createTempTrend, loadRaceTyres, mirrorTyreC, pushTempSample, tempTrendOf, tyreCOf, tyreTempVerdict, tyreWindowOf } from "./tyreTempHud";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const source = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

describe("HUD-6 · data (RNF-07)", () => {
  it("hud.json with driverPanel.tyreTemp passes the schema", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    expect(ajv.validate(hudSchema, HUD)).toBe(true);
    expect(ajv.errors).toBeNull();
    expect(TYRE_TEMP.source).toMatch(/race-tyres\.json windowC/);
  });

  it("LiveRace.js converts no 0..1 heat into °C and holds no window in °C of its own (§1.5, §1.6)", () => {
    const code = source("LiveRace.js");
    expect(code).not.toMatch(/tyreTemp[^\n]*\*\s*\d{2,3}\s*\+/);
    expect(code).not.toMatch(/1[12]\d\s*°C/);
    expect(code).toMatch(/tyreWindowOf\(/);
  });

  it("race-tyres.json is read when SIM-6 adds it and is simply absent before (no throw)", () => {
    const tyres = loadRaceTyres();
    const exists = fs.existsSync(path.join(__dirname, "../data/balance/race-tyres.json"));
    expect(tyres === null).toBe(!exists);
  });
});

describe("HUD-6 · the engine's tyreC (§1.7)", () => {
  it("is null without tyreC or without a surface °C; the hottest wheel when sent per wheel", () => {
    expect(tyreCOf({})).toBeNull();
    expect(tyreCOf({ tyreC: { carcass: 90 } })).toBeNull();
    expect(tyreCOf({ tyreC: { surface: 98.4, carcass: 91 } })).toMatchObject({ surface: 98.4, carcass: 91 });
    expect(tyreCOf({ tyreC: { surface: [95, 101, 97, 99], carcass: { fl: 88, fr: 92, rl: 90, rr: 89 } } })).toMatchObject({ surface: 101, carcass: 92 });
  });

  it("a tick's snapshot[i].tyreC reaches the mirror by car id; a tick without it leaves the mirror alone", () => {
    const mirror = { cars: [{ id: "a" }, { id: "b" }] };
    mirrorTyreC(mirror, { snapshot: [{ id: "b", tyreC: { surface: 100, carcass: 95 } }, { id: "a", tyreC: { surface: 80, carcass: 75 } }] });
    expect(mirror.cars[0].tyreC.surface).toBe(80);
    expect(mirror.cars[1].tyreC.surface).toBe(100);
    const before = JSON.stringify(mirror);
    mirrorTyreC(mirror, { snapshot: [{ id: "a" }, { id: "b" }] });
    mirrorTyreC(mirror, {});
    expect(JSON.stringify(mirror)).toBe(before);
    mirrorTyreC(mirror, { tyreC: [{ surface: 60, carcass: 58 }, null] });
    expect(mirror.cars[0].tyreC.surface).toBe(60);
    expect(mirror.cars[1].tyreC.surface).toBe(100);
  });
});

describe("HUD-6 · the window from race-tyres.json windowC", () => {
  it("reads a root range in the plain shapes", () => {
    expect(tyreWindowOf({ windowC: [110, 90] })).toMatchObject({ lo: 90, hi: 110 });
    expect(tyreWindowOf({ windowC: { min: 85, max: 105 } })).toMatchObject({ lo: 85, hi: 105 });
    expect(tyreWindowOf({ windowC: { lo: 80, hi: 100, status: "pending" } })).toMatchObject({ lo: 80, hi: 100, status: "pending" });
  });

  it("by compound, by supplier and by era span", () => {
    const tyres = {
      windowC: {
        soft: { lo: 90, hi: 110 },
        medium: { lo: 95, hi: 115 },
        default: { lo: 85, hi: 105 },
      },
    };
    expect(tyreWindowOf(tyres, { compound: "medium" })).toMatchObject({ lo: 95, hi: 115 });
    expect(tyreWindowOf(tyres, { compound: "hard" })).toMatchObject({ lo: 85, hi: 105 });
    const eras = {
      eras: [
        { from: 2001, to: 2006, windowC: { michelin: [80, 100], bridgestone: [85, 105] } },
        { from: 2011, to: 2026, status: "pending", windowC: { pirelli: { soft: [90, 110], hard: [105, 125] } } },
      ],
    };
    expect(tyreWindowOf(eras, { year: 2005, supplier: "michelin" })).toMatchObject({ lo: 80, hi: 100 });
    expect(tyreWindowOf(eras, { year: 2005, supplier: "bridgestone" })).toMatchObject({ lo: 85, hi: 105 });
    expect(tyreWindowOf(eras, { year: 2024, supplier: "pirelli", compound: "hard" })).toMatchObject({ lo: 105, hi: 125, status: "pending" });
    // Nothing outside its era: no window for 2008 in this file.
    expect(tyreWindowOf(eras, { year: 2008, supplier: "bridgestone" })).toBeNull();
    const spans = { windowC: [{ from: 1976, to: 2009, value: [80, 100] }, { from: 2010, to: 2026, value: { lo: 90, hi: 110 } }] };
    expect(tyreWindowOf(spans, { year: 1988 })).toMatchObject({ lo: 80, hi: 100 });
    expect(tyreWindowOf(spans, { year: 2020 })).toMatchObject({ lo: 90, hi: 110 });
  });

  it("the engine's own window wins; no data means no window (no guess)", () => {
    expect(tyreWindowOf({ windowC: [80, 100] }, { engine: { lo: 95, hi: 115 } })).toMatchObject({ lo: 95, hi: 115, source: "engine" });
    expect(tyreWindowOf(null, {})).toBeNull();
    expect(tyreWindowOf({}, { compound: "soft" })).toBeNull();
  });
});

describe("HUD-6 · verdict and trend", () => {
  const window = { lo: 90, hi: 110 };
  it("cold, near each edge, in window, overheating (hud.json nearEdgeC)", () => {
    const near = TYRE_TEMP.nearEdgeC;
    expect(tyreTempVerdict({ surface: 70 }, window).state).toBe("cold");
    expect(tyreTempVerdict({ surface: 90 + near / 2 }, window).state).toBe("lowEdge");
    expect(tyreTempVerdict({ surface: 100 }, window)).toMatchObject({ state: "window", tone: "pos" });
    expect(tyreTempVerdict({ surface: 110 - near / 2 }, window)).toMatchObject({ state: "highEdge", tone: "warn" });
    expect(tyreTempVerdict({ surface: 121 }, window)).toMatchObject({ state: "overheating", tone: "neg" });
    expect(tyreTempVerdict({ surface: 100 }, null)).toBeNull();
    expect(tyreTempVerdict({ surface: 100, carcass: 80 }, window, { ...TYRE_TEMP, judgeNode: "carcass" }).state).toBe("cold");
  });

  it("step race: rising out of the pits, steady once warm, falling under a slow lap", () => {
    const trend = createTempTrend();
    const span = TYRE_TEMP.trend.spanSec;
    for (let t = 0; t <= span * 2; t += 0.5) pushTempSample(trend, t, 70 + t * 1.5);
    expect(tempTrendOf(trend, span * 2).dir).toBe("rising");
    for (let t = span * 2; t <= span * 6; t += 0.5) pushTempSample(trend, t, 70 + span * 3);
    expect(tempTrendOf(trend, span * 6).dir).toBe("steady");
    for (let t = span * 6; t <= span * 8; t += 0.5) pushTempSample(trend, t, 70 + span * 3 - (t - span * 6));
    expect(tempTrendOf(trend, span * 8).dir).toBe("falling");
  });

  it("quick race: one value a lap compares lap with lap; nothing with one sample, stale or after a jump back", () => {
    const trend = createTempTrend();
    pushTempSample(trend, 0, 85);
    expect(tempTrendOf(trend, 10)).toBeNull();
    pushTempSample(trend, 92, 96);
    expect(tempTrendOf(trend, 100).dir).toBe("rising");
    expect(tempTrendOf(trend, 92 + TYRE_TEMP.trend.staleSec + 1)).toBeNull();
    pushTempSample(trend, 50, 96);
    expect(trend.samples).toHaveLength(1);
    expect(tempTrendOf(trend, 50)).toBeNull();
  });
});

describe("HUD-6 · the panel (TyreTemp, LiveRace)", () => {
  it("TyreTemp says the °C, the trend, the window and the verdict in words (RNF-09)", () => {
    render(<TyreTemp tyreC={{ surface: 118.4, carcass: 104.2 }} window={{ lo: 90, hi: 110 }} verdict={{ state: "overheating", tone: "neg" }} trend={{ dir: "rising" }} />);
    const readout = screen.getByTestId("tyre-temp");
    expect(readout).toHaveTextContent("118 °C");
    expect(readout).toHaveTextContent(/carcass 104 °C/);
    expect(readout).toHaveTextContent(/Overheating/);
    expect(readout.getAttribute("aria-label")).toMatch(/rising/);
    expect(readout.getAttribute("aria-label")).toMatch(/window 90–110 °C/);
    expect(readout).toHaveAttribute("data-state", "overheating");
  });

  it("TyreTemp without a window shows °C and no verdict", () => {
    render(<TyreTemp tyreC={{ surface: 96 }} />);
    const readout = screen.getByTestId("tyre-temp");
    expect(readout).toHaveAttribute("data-state", "unjudged");
    expect(readout).not.toHaveTextContent(/window|overheating|cold/i);
  });

  describe("in a real race", () => {
    const context = createContext(fallbackBootstrap, reference);
    const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "hud6" });
    runPractice(career, {});
    runQualifyingSession(career, {});
    const args = weekendRaceArgs(career);

    const mount = (state) => {
      jest.useFakeTimers();
      const view = render(
        <ManagerContext.Provider value={{ career }}>
          <LiveRace state={state} onFinished={() => {}} title="Race" />
        </ManagerContext.Provider>,
      );
      act(() => {
        jest.advanceTimersByTime(120);
      });
      return view;
    };

    afterEach(() => {
      jest.useRealTimers();
    });

    // SIM-6 publishes tyreC on every car from the grid (race.js gridSet), so a real race always has it; the
    // fallback without tyreC (§1.5) is covered by tyreCOf above.
    it("the engine publishes tyreC on every car from the grid (SIM-6, §1.7)", () => {
      const state = createRace({ ...args, seed: `${args.seed}-plain` });
      state.cars.forEach((car) => expect(tyreCOf(car)).toMatchObject({ surface: expect.any(Number), carcass: expect.any(Number) }));
    });

    it("the panel shows the engine's °C and judges it against race-tyres.json; the race is unchanged (RNF-05)", () => {
      const { windowFor } = require("../engine/tyres/thermal");
      const state = createRace({ ...args, seed: `${args.seed}-hot` });
      const twin = createRace({ ...args, seed: `${args.seed}-hot` });
      const me = state.cars.find((car) => car.isUser);
      mount(state);
      const card = screen.getByRole("region", { name: me.name });
      const readout = within(card).getByTestId("tyre-temp");
      expect(readout).toHaveTextContent(`${Math.round(me.tyreC.surface)} °C`);
      const [lo, hi] = windowFor(me.compound, state.year);
      expect(readout.getAttribute("aria-label")).toContain(`window ${Math.round(lo)}–${Math.round(hi)} °C`);
      const window = tyreWindowOf(loadRaceTyres(), { compound: me.compound, year: state.year });
      expect(readout).toHaveAttribute("data-state", tyreTempVerdict(tyreCOf(me), window).state);
      // The view only read tyreC: the race itself is the twin's.
      while (twin.lap < state.lap && !twin.finished) stepLap(twin);
      const strip = (s) => s.cars.map((car) => [car.id, car.position, car.totalTime, car.lap, car.compound]);
      expect(strip(state)).toEqual(strip(twin));
    });
  });
});

describe("HUD-6 + SIM-6 · the real race-tyres.json (RF-SIM-03, RNF-07)", () => {
  it("resolves the engine's window for 2024 (Pirelli) per compound, the same one thermal.windowFor gives", () => {
    const { windowFor } = require("../engine/tyres/thermal");
    const tyres = loadRaceTyres();
    ["soft", "medium", "hard", "inter", "wet"].forEach((compound) => {
      const [lo, hi] = windowFor(compound, 2024);
      expect(tyreWindowOf(tyres, { compound, supplier: "pirelli", year: 2024 })).toMatchObject({ lo, hi, source: "race-tyres.json" });
    });
  });

  it("judges the grip temperature the engine uses (model.gripCarcassShare), not the surface alone", () => {
    const { gripC } = require("../engine/tyres/thermal");
    const tyres = loadRaceTyres();
    const window = tyreWindowOf(tyres, { compound: "soft", year: 2024 });
    const tyreC = { surface: window.hi + 4, carcass: window.lo - 2 };
    const verdict = tyreTempVerdict(tyreC, window, { ...TYRE_TEMP, judgeNode: "grip" });
    expect(verdict.value).toBeCloseTo(gripC(tyreC), 6);
    expect(TYRE_TEMP.judgeNode).toBe("grip");
  });
});
