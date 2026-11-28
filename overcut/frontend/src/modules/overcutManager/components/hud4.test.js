/**
 * HUD-4 of docs/manager/F1M24-GAMEPLAY.md (replays and start-finish-scripts, the hooks;
 * start-lights-sound-and-timing and vuelta-enfriamiento, the view; status-strip-data; RF-SIM-10,
 * RF-SIM-11, RF-SIM-15, RF-WKD-03, RF-WKD-07, RF-3D-04, RNF-05, RNF-07):
 *   - hud.json, live-view.json and race-weather.json (display) validate against their schemas
 *   - the view's literals are gone (§3.3: INTRO_SECONDS, intro/0.8, 15*3600, *0.62+4, *0.55, *3)
 *   - the lights are the engine's: its PRE_START events at the procedure clock (SIM-3), one per
 *     second, lights out at the engine's seeded instant; without a PRE_START, lights out at once
 *   - the race is the same with the view's PRE_START or without it (RNF-05)
 *   - the quick replay shows the same seeded wait as the step engine for the same seed
 *   - the era's procedure: five reds since 1996, one red and the green before (SRS §6)
 *   - the conditions strip reads the engine and the season's data, "—" when there is nothing
 *   - live: the lights then the race clock, the local time from the circuit's start hour; at the flag
 *     the tower's chequered tags and your panels folded to their result
 */

import React from "react";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { act, fireEvent, render, screen } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import liveViewSchema from "../engine/packs/schema/live-view.schema.json";
import weatherSchema from "../engine/packs/schema/race-weather.schema.json";
import HUD from "../data/balance/hud.json";
import LIVE_VIEW from "../data/balance/live-view.json";
import WEATHER from "../data/balance/race-weather.json";
import RACE_SIM from "../data/balance/race-sim.json";
import { weekendRaceArgs } from "../engine/career";
import { createRace, rulesOf } from "../engine/race";
import { rulesFor } from "../engine/rules";
import { climateFor, depthOfWetness } from "../engine/weather";
import { weekend } from "../engine/sim/simTestKit";
import { createRaceSession } from "../engine/worker/raceSession";
import { applyTick, mirrorOf } from "../engine/worker/raceClient";
import { ManagerContext } from "./context";
import { StatusStrip } from "./Broadcast";
import { procedureLimit, replayTimelineOf, startProcedureOf, startStateAt, startTimelineOf } from "./startLights";
import { clockLabel, gripLevel, raceConditionsOf, raceStartOf, rubberLevel, sessionConditionsOf } from "./hudConditions";
import { tvShotOf } from "./tvDirector";
import LiveRace from "./LiveRace";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const source = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

describe("HUD-4 · data (RNF-07)", () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  it("hud.json, live-view.json and race-weather.json pass their schemas", () => {
    expect(ajv.validate(hudSchema, HUD)).toBe(true);
    expect(ajv.errors).toBeNull();
    expect(ajv.validate(liveViewSchema, LIVE_VIEW)).toBe(true);
    expect(ajv.errors).toBeNull();
    expect(ajv.validate(weatherSchema, WEATHER)).toBe(true);
    expect(ajv.errors).toBeNull();
  });

  it("the replay button is on and the start and finish blocks are there", () => {
    expect(HUD.banners.replay.enabled).toBe(true);
    expect(HUD.start.lightsOutBannerSec).toBeGreaterThan(0);
    expect(LIVE_VIEW.start.preStart).toBe(true);
    expect(LIVE_VIEW.pauseOn.list).toContain("replay");
  });

  it("the literals §3.3 lists are gone from the view", () => {
    const live = source("LiveRace.js");
    const broadcast = source("Broadcast.js");
    const session = source("SessionLive.js");
    expect(live).not.toMatch(/INTRO_SECONDS/);
    expect(live).not.toMatch(/\/\s*0\.8\)/);
    expect(live).not.toMatch(/15\s*\*\s*3600/);
    [live, session].forEach((text) => expect(text).not.toMatch(/\*\s*0\.62\s*\+\s*4/));
    expect(live).not.toMatch(/laps\s*\*\s*0\.55/);
    expect(broadcast).not.toMatch(/wetness\s*\*\s*3\)/);
    expect(session).not.toMatch(/\?\s*11\s*:\s*14\)\s*\*\s*3600/);
  });
});

describe("HUD-4 · the lights are the engine's (start-lights-sound-and-timing, RF-SIM-10)", () => {
  const { career } = weekend({ seed: "hud4-lights" });
  const args = weekendRaceArgs(career);

  /** The step race behind the worker, as LiveRace creates it, stepped `steps` × `seconds`. */
  const run = (preStart, steps, seconds = 0.5) => {
    const session = createRaceSession();
    const created = session.handle({ type: "create", args: preStart ? { ...args, preStart } : args });
    const mirror = mirrorOf(created);
    for (let k = 0; k < steps; k += 1) applyTick(mirror, session.handle({ type: "step", seconds }));
    return { session, mirror };
  };

  it("the view's procedure clock shows the engine's lights one by one, then lights out at its instant", () => {
    const { mirror } = run({ formation: LIVE_VIEW.start.formation }, 40);
    const timeline = startTimelineOf(mirror.events);
    const procedure = startProcedureOf(rulesOf(mirror.era, mirror.year));
    expect(procedure.name).toBe("fiveRed");
    const lights = timeline.filter((entry) => entry.type === "light");
    expect(lights.map((entry) => entry.n)).toEqual([1, 2, 3, 4, 5]);
    lights.slice(1).forEach((entry, k) => expect(entry.t - lights[k].t).toBeCloseTo(RACE_SIM.start.procedures.fiveRed.lightIntervalSec, 6));
    const out = timeline.find((entry) => entry.type === "lightsOut").t;
    const hold = out - lights[4].t;
    expect(hold).toBeGreaterThanOrEqual(RACE_SIM.start.procedures.fiveRed.holdSec.min);
    expect(hold).toBeLessThanOrEqual(RACE_SIM.start.procedures.fiveRed.holdSec.max);
    expect(startStateAt(timeline, lights[0].t - 0.01, procedure)).toMatchObject({ phase: "grid", lights: 0, lamps: 5 });
    expect(startStateAt(timeline, lights[2].t + 0.01, procedure)).toMatchObject({ phase: "lights", lights: 3 });
    expect(startStateAt(timeline, out - 0.01, procedure)).toMatchObject({ phase: "lights", lights: 5 });
    expect(startStateAt(timeline, out, procedure)).toMatchObject({ phase: "out", lights: 0, outAt: out });
    // The view never runs the procedure past lights out, nor past where the engine is.
    expect(procedureLimit(timeline, out + 10)).toBe(out);
    expect(procedureLimit([], 5, 2)).toBe(2);
  });

  it("without a PRE_START the lights go out at once (as before)", () => {
    const { mirror } = run(null, 2);
    const timeline = startTimelineOf(mirror.events);
    expect(timeline).toEqual([{ type: "lightsOut", t: 0 }]);
    expect(startStateAt(timeline, 0, null).phase).toBe("out");
  });

  it("RNF-05: the same seed gives the same race with the view's PRE_START or without it", () => {
    const finish = (preStart) => {
      const session = createRaceSession();
      session.handle({ type: "create", args: preStart ? { ...args, preStart } : args });
      return session.handle({ type: "finish" }).state;
    };
    const plain = finish(null);
    const withStart = finish({ formation: LIVE_VIEW.start.formation });
    const result = (state) => state.cars.map((car) => [car.id, car.status, car.position, Math.round(car.time * 1000)]);
    expect(result(withStart)).toEqual(result(plain));
  });

  it("the quick replay shows the step engine's seeded wait for the same seed", () => {
    const { mirror } = run({ formation: "skip" }, 40);
    const engine = startTimelineOf(mirror.events);
    const quick = replayTimelineOf({ rules: rulesOf(mirror.era, mirror.year), seed: mirror.seed });
    const holdOf = (timeline) => timeline.find((entry) => entry.type === "lightsOut").t - timeline.filter((entry) => entry.type === "light").pop().t;
    expect(holdOf(quick)).toBeCloseTo(holdOf(engine), 2);
    expect(quick.filter((entry) => entry.type === "light")).toHaveLength(5);
  });

  it("SRS §6: one red and the green before 1996, five reds since; nothing without a procedure", () => {
    expect(startProcedureOf(rulesFor(1988))).toMatchObject({ name: "redGreen", spec: { lights: 1 } });
    expect(startProcedureOf(rulesFor(2005))).toMatchObject({ name: "fiveRed", spec: { lights: 5 } });
    expect(startProcedureOf({})).toBeNull();
    expect(replayTimelineOf({ rules: {} })).toEqual([{ type: "lightsOut", t: 0 }]);
    const old = replayTimelineOf({ rules: rulesFor(1988), seed: "x" });
    expect(old.filter((entry) => entry.type === "light")).toHaveLength(1);
  });

  it("the TV director gets the race clock, the seed and the start (CAM-4's hook)", () => {
    const shot = tvShotOf({ focusId: null, rows: [], tau: 12, seed: "s", start: { phase: "out", lights: 0, t: 9 } });
    expect(shot.subjectId).toBeNull();
  });
});

describe("HUD-4 · conditions from the engine (status-strip-data, RF-SIM-11)", () => {
  it("the local start: the pack's race session, else the circuit's ERA5 start hour, else sessions.json", () => {
    expect(raceStartOf({ sessions: [{ kind: "race", startLocal: "18:00" }] })).toEqual({ startSec: 18 * 3600, source: "pack" });
    const climate = climateFor({ packCircuitId: "bahrain", date: "2024-03-02" });
    expect(raceStartOf({ packCircuitId: "bahrain", date: "2024-03-02" })).toEqual({ startSec: Math.round(climate.startHour * 3600), source: "climate" });
    expect(raceStartOf({}).source).toBe("fallback");
    expect(clockLabel(18 * 3600 + 65.4)).toBe("18:01:05");
  });

  it("air, track, water and rubber come from the race state; nothing invented when absent", () => {
    const state = { weather: { wetness: [0, 0.4], water: [0, 0.31], air: [27.2, 25.1] }, trackTemps: [33, 31], evolution: 0.5 };
    expect(raceConditionsOf(state, 1)).toEqual({ airC: 25.1, trackC: 31, waterMm: 0.31, wetness: 0.4, rubber: 0.5 });
    expect(raceConditionsOf(state, 1, { waterMm: 0.2, rubber: 0.7, trackTemp: 30 })).toMatchObject({ waterMm: 0.2, rubber: 0.7, trackC: 30 });
    const bare = raceConditionsOf({ weather: { wetness: [0.3] } }, 0);
    expect(bare.airC).toBeNull();
    expect(bare.rubber).toBeNull();
    expect(bare.waterMm).toBeCloseTo(depthOfWetness(0.3), 6);
    expect(rubberLevel(null).label).toBe("—");
  });

  it("the words come from race-weather.json (rubber.levels since HUD-C3, grip by display)", () => {
    expect(rubberLevel(0.1).id).toBe("veryLow");
    expect(rubberLevel(0.7).id).toBe("high");
    expect(rubberLevel(0.9).id).toBe("veryHigh");
    expect(gripLevel(0.6, 0.9).id).toBe("veryLow");
    expect(gripLevel(0, 0.9).id).toBe("high");
    expect(gripLevel(0, null).id).toBe(WEATHER.display.gripBands.dryDefault);
  });

  it("a session's rubber is the share of its era's evolution the field has laid down", () => {
    const evolution = { perFieldLap: -0.005, max: -1.4 };
    expect(sessionConditionsOf({ evolution, carry: 0, fieldLaps: 0, wetness: 0 }).rubber).toBe(0);
    expect(sessionConditionsOf({ evolution, carry: 0, fieldLaps: 140, wetness: 0 }).rubber).toBeCloseTo(0.5, 6);
    expect(sessionConditionsOf({ evolution, carry: -0.4, fieldLaps: 1000, wetness: 0 }).rubber).toBe(1);
    expect(sessionConditionsOf({ wetness: 0 }).clock).toBeNull();
  });

  it("the strip shows the water in mm from the engine and '—' for a missing temperature", () => {
    render(<StatusStrip flag={{ kind: "green", label: "Green flag" }} clock="18:00:00" airTemp={null} rainChance={0} change="" trackTemp={30} wetness={0.4} waterMm={0.62} rubber={0.5} />);
    const strip = screen.getByRole("status", { name: /track status/i });
    expect(strip).toHaveTextContent("0.6 mm");
    expect(strip).toHaveTextContent("—");
    expect(strip).toHaveTextContent("30 °C");
  });
});

describe("HUD-4 · live: lights, clock and the flag", () => {
  afterEach(() => jest.useRealTimers());

  it("the lights come on from the engine, then the race clock runs from the circuit's start hour", () => {
    jest.useFakeTimers();
    const { career } = weekend({ seed: "hud4-live" });
    const args = weekendRaceArgs(career);
    render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace args={args} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    const root = () => screen.getByTestId("live-race");
    const clock = () => screen.getByTestId("status-clock").textContent;
    expect(root().getAttribute("data-start")).not.toBe("out");
    const start = raceStartOf(args.race);
    expect(clock().slice(0, 5)).toBe(clockLabel(start.startSec).slice(0, 5));
    let lit = 0;
    for (let k = 0; k < 40 && root().getAttribute("data-start") !== "out"; k += 1) {
      act(() => {
        jest.advanceTimersByTime(500);
      });
      const lights = screen.queryByRole("img", { name: /start lights/i });
      const on = lights ? Number((/(\d+) of \d+ lit/.exec(lights.getAttribute("aria-label")) || [0, 0])[1]) : 0;
      lit = Math.max(lit, on);
    }
    expect(lit).toBe(5);
    expect(root().getAttribute("data-start")).toBe("out");
    expect(screen.getByText(/lights out/i)).toBeInTheDocument();
  });

  it("at the flag the tower tags every finisher and your panels fold to their result", () => {
    jest.useFakeTimers();
    const { career } = weekend({ seed: "hud4-flag" });
    const state = createRace(weekendRaceArgs(career));
    render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace state={state} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /to the flag/i }));
    act(() => {
      jest.advanceTimersByTime(200);
    });
    const running = state.cars.filter((car) => car.isUser && car.status === "finished");
    expect(screen.getAllByText(/chequered flag · P\d+/i)).toHaveLength(running.length);
    expect(screen.getAllByTitle(/^finished$/i).length).toBeGreaterThan(0);
  });
});
