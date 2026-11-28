/**
 * HUD-C2 of docs/manager/F1M24-CHINA.md (wave 2): tower, selector, pit and sessions (VIEW-16, VIEW-14, VIEW-17, GS-15
 * the menu, AUD-C3 the hook in sessions; RF-WKD-07, RF-SIM-08, RF-3D-04, RF-CMD-04, RF-CMD-02, RF-SIM-12, RF-CMD-03,
 * RNF-05, RNF-07, RNF-08, RNF-09, SRS §6):
 *   - hud.json and live-view.json pass their schemas with the keys HUD-C2 fills
 *   - VIEW-16 acceptance: the countdown in N-15, N-10, N-3 and N; no DRS on the minimap in 2010 (nor 2026); the
 *     minimap ≤ 6 % of the canvas; the sectors timed on the engine's trace, the same at any frame rate; the pit
 *     widget's steps by the engine's phase
 *   - VIEW-14 acceptance: no halo in 2013; a closed ring; the mirror back within one frame; the camera kept on a new focus
 *   - VIEW-17 acceptance: with the option and ×8, the map; back at ×1, the camera before
 *   - GS-15 (the menu): the dialog's line-to-line estimate (previewPit) rides with the stop to the widget
 *   - AUD-C3: the radio reaches the sound with its car and the side of its card, in the race and in sessions
 */

import React from "react";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { act, fireEvent, render, screen } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import liveViewSchema from "../engine/packs/schema/live-view.schema.json";
import HUD from "../data/balance/hud.json";
import LIVE_VIEW from "../data/balance/live-view.json";
import CAMERAS from "../data/balance/cameras.json";
import BROADCAST from "../data/balance/broadcast.json";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, runPractice, runQualifyingSession, weekendRaceArgs } from "../engine/career";
import { createRace } from "../engine/race";
import { rulesFor } from "../engine/rules";
import { ManagerContext } from "./context";
import LiveRace from "./LiveRace";
import { HudMiniMap, TimingTower, miniMapDrsOf, miniMapShareOf } from "./Broadcast";
import { pitEstimateOf } from "./PitDialog";
import { createPitClock, pitStepsOf, setPitEstimate, stepPitClock } from "./pitTimer";
import { cameraOnFocus, cameraRingOf, cameraSegmentOf, createFastForward, cycle, fastForwardStep, isMirrorKey, mirrorCameraOf, pickViewDuringFastForward, radioForAudio } from "./playback";
import { countdownReplacesBanners, createSectorClock, lapCountdownOf, sectorClockBest, sectorClockSectors, stepSectorClock } from "./tower";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

// The 3D view is a stub here (jsdom has no WebGL): it only says which camera mode it was asked to film.
jest.mock("../three/support", () => ({ canRender3D: () => true }));
jest.mock("../three/Race3D", () => {
  const Stub = ({ mode }) => <div data-testid="race3d" data-mode={mode} />;
  return { __esModule: true, default: Stub };
});

const source = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

describe("HUD-C2 · data (RNF-07)", () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  it("hud.json and live-view.json pass their schemas", () => {
    expect(ajv.validate(hudSchema, HUD)).toBe(true);
    expect(ajv.errors).toBeNull();
    expect(ajv.validate(liveViewSchema, LIVE_VIEW)).toBe(true);
    expect(ajv.errors).toBeNull();
  });

  it("the keys HUD-C2 fills are on and say where they come from", () => {
    expect(HUD.lapCountdown).toMatchObject({ status: "behaviour", enabled: true, laps: [15, 10, 3, "last"] });
    expect(HUD.miniMap.maxCanvasShare).toBeLessThanOrEqual(0.06);
    expect(HUD.tower.liveSectors.enabled).toBe(true);
    expect(LIVE_VIEW.views.ring.order).toBe("broadcast.json cycleOrder.cameras");
    expect(LIVE_VIEW.views.mirror.camera).toBe("tcamRear");
    // The 3D at ×8 is ours: the switch to the map stays an option, off at the start (§1.5 «Avance rápido»).
    expect(LIVE_VIEW.fastForward.enabled).toBe(false);
  });
});

describe("VIEW-16 · the lap countdown (hud.json lapCountdown)", () => {
  const laps = 56;
  it("shows in N-15, N-10, N-3 and N, and on no other lap", () => {
    const shown = [];
    for (let completed = 0; completed <= laps; completed += 1) {
      const countdown = lapCountdownOf({ laps, completed });
      if (countdown) shown.push([completed, countdown.last ? "last" : countdown.left]);
    }
    expect(shown).toEqual([
      [laps - 15, 15],
      [laps - 10, 10],
      [laps - 3, 3],
      [laps - 1, "last"],
    ]);
  });

  it("always in words, never after the leader's flag, and in place of the laps-to-go banners", () => {
    expect(lapCountdownOf({ laps, completed: laps - 10 }).label).toMatch(/10/);
    expect(lapCountdownOf({ laps, completed: laps - 1 }).label).toMatch(/lap|vuelta/i);
    expect(lapCountdownOf({ laps, completed: laps - 1, finished: true })).toBeNull();
    expect(lapCountdownOf({ laps, completed: laps - 10 }, { lapCountdown: { ...HUD.lapCountdown, enabled: false } })).toBeNull();
    // A sprint of 12 laps has no "15 to go".
    expect(lapCountdownOf({ laps: 12, completed: -3 })).toBeNull();
    expect(countdownReplacesBanners()).toBe(true);
    expect(source("LiveRace.js")).toMatch(/countdownReplacesBanners\(\) \? \[\] : lapCallouts/);
  });

  it("the tower header carries it with its words", () => {
    render(<TimingTower title="Race" label="Tower" rows={[]} countdown={lapCountdownOf({ laps, completed: laps - 3 })} />);
    expect(screen.getByTestId("lap-countdown")).toHaveTextContent(/3/);
    expect(screen.getByTestId("lap-countdown").dataset.left).toBe("3");
  });
});

describe("VIEW-16 · the minimap: DRS only in its era, ≤ 6 % of the canvas", () => {
  const circuit = {
    box: { minX: 0, minY: 0, maxX: 100, maxY: 60 },
    points: Array.from({ length: 40 }, (_, i) => ({ x: 50 + 40 * Math.cos((i / 40) * 2 * Math.PI), y: 30 + 25 * Math.sin((i / 40) * 2 * Math.PI) })),
    heading: Array.from({ length: 40 }, (_, i) => (i / 40) * 2 * Math.PI + Math.PI / 2),
    drsZones: [
      { from: 0.05, to: 0.2 },
      { from: 0.55, to: 0.7 },
    ],
  };

  it("no DRS zones in 2010 nor in 2026 (active aero), the circuit's in 2011-2025", () => {
    expect(miniMapDrsOf(circuit, rulesFor(2010))).toEqual([]);
    expect(miniMapDrsOf(circuit, rulesFor(2008))).toEqual([]);
    expect(miniMapDrsOf(circuit, rulesFor(2026))).toEqual([]);
    expect(miniMapDrsOf(circuit, rulesFor(2011))).toHaveLength(2);
    expect(miniMapDrsOf(circuit, rulesFor(2024))).toHaveLength(2);
    expect(miniMapDrsOf(circuit, null)).toEqual([]);
  });

  it("draws them with the word, and none without the era's DRS", () => {
    const cars = [{ car: { id: "a", color: "#c00", isUser: true }, pose: { x: 10, y: 10 } }];
    const view = render(<HudMiniMap circuit={circuit} cars={cars} focusId="a" label="Mini map" rules={rulesFor(2012)} />);
    expect(screen.getByTestId("hud-minimap").dataset.drs).toBe("2");
    expect(screen.getAllByText("DRS")).toHaveLength(2);
    view.unmount();
    render(<HudMiniMap circuit={circuit} cars={cars} focusId="a" label="Mini map" rules={rulesFor(2010)} />);
    expect(screen.getByTestId("hud-minimap").dataset.drs).toBe("0");
    expect(screen.queryByText("DRS")).toBeNull();
  });

  it("takes at most 6 % of the canvas, in zones and in the stacked layout", () => {
    HUD.layout.target.viewports.forEach(([w, h]) => {
      expect(miniMapShareOf({ w, h }, { zoned: true })).toBeLessThanOrEqual(HUD.miniMap.maxCanvasShare);
    });
    [
      [1024, 768],
      [800, 600],
      [390, 844],
    ].forEach(([w, h]) => expect(miniMapShareOf({ w, h }, { zoned: false, aspect: 1 })).toBeLessThanOrEqual(HUD.miniMap.maxCanvasShare));
  });
});

describe("VIEW-16 · sectors timed on the engine's trace (hud.json tower.liveSectors)", () => {
  const circuit = { sectors: [0, 0.3, 0.65] };
  // A car whose lap takes 90 s with a slower middle: share = piecewise in time.
  const lapSec = 90;
  const marks = [0, 27, 60, 90];
  const shares = [0, 0.3, 0.65, 1];
  const progressAt = (t) => {
    const lap = Math.floor(t / lapSec);
    const r = t - lap * lapSec;
    let k = 0;
    while (k < 2 && r >= marks[k + 1]) k += 1;
    return lap + shares[k] + ((r - marks[k]) / (marks[k + 1] - marks[k])) * (shares[k + 1] - shares[k]);
  };
  const sample = (car, t) => ({ progress: progressAt(t), inPit: car.pitFrom !== undefined && t >= car.pitFrom && t < car.pitTo });
  const run = (dt, until, car = {}) => {
    const memo = createSectorClock();
    for (let t = 0.5; t <= until; t += dt) stepSectorClock(memo, sample, car, t, circuit);
    return memo;
  };

  it("gives the real sector times once a full lap is timed", () => {
    const memo = run(0.1, 2 * lapSec + 5);
    expect(sectorClockSectors(memo)).toEqual([27, 33, 30]);
    expect(sectorClockBest(memo)).toEqual([27, 33, 30]);
  });

  it("the same at 60 fps and at a 1.6 s frame (×16): it does not depend on the frame rate", () => {
    const fine = sectorClockSectors(run(1 / 60, 3 * lapSec + 5));
    const coarse = sectorClockSectors(run(1.6, 3 * lapSec + 5));
    fine.forEach((value, index) => expect(Math.abs(value - coarse[index])).toBeLessThanOrEqual(0.001));
  });

  it("times nothing across a skip or a stop", () => {
    const memo = createSectorClock();
    // The first lap from the start is not timed whole (no line behind it); the second lap's first sector is.
    for (let t = 0.5; t <= 130; t += 0.5) stepSectorClock(memo, sample, {}, t, circuit);
    expect(sectorClockSectors(memo)).toEqual([27, null, null]);
    stepSectorClock(memo, sample, {}, 140, circuit, { seek: true });
    expect(memo.current).toEqual([null, null, null]);
    expect(sectorClockSectors(memo)).toBeNull();
    const pitted = run(0.5, 2 * lapSec + 5, { pitFrom: 100, pitTo: 120 });
    // The second lap was broken by the stop: only the third lap's done sectors are shown, no full lap yet.
    expect(pitted.last).toBeNull();
  });

  it("the race offers the sectors mode in a step race from this timing", () => {
    const text = source("LiveRace.js");
    expect(text).toMatch(/liveSectors = !sectorTimes && Boolean\(source\.steps/);
    expect(text).toMatch(/stepSectorClock\(sectorClocks\.current\.get\(car\.id\), source\.sample/);
  });
});

describe("VIEW-16 · the pit widget by the engine's phase (hud.json pitTimer.steps)", () => {
  it("the steps in order, the queue only when the car waited", () => {
    expect(pitStepsOf("LIMITER", ["LIMITER"]).map((step) => [step.id, step.state])).toEqual([
      ["entry", "now"],
      ["stationary", "next"],
      ["release", "next"],
      ["exit", "next"],
    ]);
    expect(pitStepsOf("QUEUE", ["LIMITER", "BOX_APPROACH", "QUEUE"]).map((step) => step.id)).toContain("queue");
    expect(pitStepsOf("STATIONARY", ["LIMITER", "STATIONARY"]).map((step) => step.state)).toEqual(["done", "now", "next", "next"]);
    expect(pitStepsOf(null, ["LIMITER", "STATIONARY", "RELEASE", "EXIT_ROAD"], true).every((step) => step.state === "done")).toBe(true);
    // The quick-mode replay has no phases: no steps, the time only.
    expect(pitStepsOf(null, [], true)).toEqual([]);
  });

  it("the widget carries the steps, PIT-C2's {name, t} stage and the dialog's estimate with the difference", () => {
    const memo = createPitClock();
    setPitEstimate(memo, pitEstimateOf({ lineToLine: 21.4, lineToLineSc: 21.6, scAllowed: true }, null));
    expect(stepPitClock(memo, { inPit: true, pitPhase: "LIMITER" }, 100, 0)).toMatchObject({ estimate: { sec: 21.4, kind: "green" } });
    const standing = stepPitClock(memo, { inPit: true, pitPhase: "STATIONARY", pitStage: { name: "wheels", t: 0.8 } }, 108, 1);
    expect(standing.stage).toBe("wheels");
    expect(standing.steps.find((step) => step.state === "now").id).toBe("stationary");
    stepPitClock(memo, { inPit: true, pitPhase: "EXIT_ROAD" }, 118, 2);
    const done = stepPitClock(memo, { inPit: false }, 122, 3);
    expect(done).toMatchObject({ state: "done", totalSec: 22, deltaSec: 0.6 });
    // The next stop starts without an estimate unless the dialog gives another.
    stepPitClock(memo, { inPit: false }, 200, 100);
    expect(stepPitClock(memo, { inPit: true, pitPhase: "LIMITER" }, 3000, 200).estimate).toBeNull();
  });
});

describe("GS-15 · the dialog's estimate is previewPit's line to line", () => {
  it("green, or under the SC / VSC out now when the era has them", () => {
    const preview = { lineToLine: 22.1, lineToLineSc: 22.3, lineToLineVsc: 22.2, scAllowed: true, vscAllowed: false };
    expect(pitEstimateOf(preview)).toEqual({ sec: 22.1, kind: "green" });
    expect(pitEstimateOf(preview, "sc")).toEqual({ sec: 22.3, kind: "sc" });
    // No VSC in the era: the green line to line.
    expect(pitEstimateOf(preview, "vsc")).toEqual({ sec: 22.1, kind: "green" });
    expect(pitEstimateOf(null)).toBeNull();
    expect(source("PitDialog.js")).toMatch(/data-testid="pit-lineToLine"/);
  });
});

describe("VIEW-14 · the camera ring by era, the mirror and the focus", () => {
  it("no halo in 2013 (cockpitHigh instead), the halo from 2018; no onboard before the catalogue's years", () => {
    const ring2013 = cameraRingOf({ has3D: true, year: 2013 });
    expect(ring2013).not.toContain("halo");
    expect(ring2013).toContain("cockpitHigh");
    const ring2018 = cameraRingOf({ has3D: true, year: 2018 });
    expect(ring2018).toContain("halo");
    expect(ring2018).not.toContain("cockpitHigh");
    const ring1976 = cameraRingOf({ has3D: true, year: 1976 });
    expect(ring1976).toEqual(LIVE_VIEW.views.ring.segments.exterior);
    expect(cameraRingOf({ has3D: true, year: 1990 })).not.toContain("tcam");
    // Never a replay-only camera, never the TV (a view).
    CAMERAS.onboard.filter((camera) => camera.replayOnly).forEach((camera) => expect(ring2018).not.toContain(camera.id));
    expect(ring2018).not.toContain("tv");
    expect(cameraRingOf({ has3D: false, year: 2018 })).toEqual(LIVE_VIEW.views.cameras.without3D);
  });

  it("in broadcast.json's order, and a closed ring that visits each camera once", () => {
    const ring = cameraRingOf({ has3D: true, year: 2013 });
    const order = BROADCAST.cycleOrder.cameras.filter((id) => ring.includes(id));
    expect(ring.slice(0, order.length)).toEqual(order);
    let camera = ring[0];
    const seen = [];
    for (let k = 0; k < ring.length; k += 1) {
      seen.push(camera);
      camera = cycle(ring, camera, 1);
    }
    expect(camera).toBe(ring[0]);
    expect(new Set(seen).size).toBe(ring.length);
    expect(cycle(ring, ring[0], -1)).toBe(ring[ring.length - 1]);
    expect(cameraSegmentOf("chase")).toBe("exterior");
    expect(cameraSegmentOf("tcam")).toBe("onboard");
  });

  it("the mirror only in the eras with a rear T-cam, by its key and never while typing", () => {
    expect(mirrorCameraOf({ has3D: true, year: 2013 })).toBe("tcamRear");
    expect(mirrorCameraOf({ has3D: true, year: 1986 })).toBeNull();
    expect(mirrorCameraOf({ has3D: false, year: 2013 })).toBeNull();
    expect(isMirrorKey({ key: "R", target: { tagName: "DIV" } })).toBe(true);
    expect(isMirrorKey({ key: "r", target: { tagName: "INPUT" } })).toBe(false);
    expect(isMirrorKey({ key: "r", ctrlKey: true, target: null })).toBe(false);
  });

  it("a new focus keeps the camera's type", () => {
    const ring = cameraRingOf({ has3D: true, year: 2013 });
    expect(cameraOnFocus("tcam", ring, true)).toBe("tcam");
    expect(cameraOnFocus("halo", ring, true)).toBe(LIVE_VIEW.views.defaultCamera.with3D);
  });
});

describe("VIEW-17 · fast forward to the map, the camera given back", () => {
  it("with the option and ×8, the map; back at ×1, the view and camera before", () => {
    const memo = createFastForward();
    const before = { view: "camera", camera: "tcam" };
    expect(fastForwardStep(memo, { ...before, speed: 4, enabled: true })).toMatchObject(before);
    expect(fastForwardStep(memo, { ...before, speed: 8, enabled: true })).toMatchObject({ view: "map" });
    expect(fastForwardStep(memo, { ...before, speed: 16, enabled: true })).toMatchObject({ view: "map" });
    expect(fastForwardStep(memo, { ...before, speed: 1, enabled: true })).toEqual({ ...before, settle: null });
    // Without the option, or without 3D, nothing changes.
    expect(fastForwardStep(createFastForward(), { ...before, speed: 8, enabled: false })).toMatchObject(before);
    expect(fastForwardStep(createFastForward(), { ...before, speed: 8, enabled: true, has3D: false })).toMatchObject(before);
  });

  it("a view the player picks while it is fast wins", () => {
    const memo = createFastForward();
    fastForwardStep(memo, { view: "tv", camera: "chase", speed: 8, enabled: true });
    pickViewDuringFastForward(memo);
    expect(fastForwardStep(memo, { view: "camera", camera: "chase", speed: 8, enabled: true })).toMatchObject({ view: "camera" });
  });
});

describe("VIEW-14 / VIEW-17 · in the race view (3D stubbed)", () => {
  const context = createContext(fallbackBootstrap, reference);
  const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "hudc2" });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const args = weekendRaceArgs(career);

  afterEach(() => jest.useRealTimers());

  it("the mirror shows while the key is held and is gone on release; the map at ×8 and the camera back at ×1", async () => {
    jest.useFakeTimers();
    const state = createRace({ ...args, seed: `${args.seed}-c2` });
    const view = render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace state={state} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    // Into the camera view, then one step along the ring.
    fireEvent.click(screen.getByRole("button", { name: /next camera/i }));
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    const ring = cameraRingOf({ has3D: true, year: state.year });
    const picked = ring[0] === LIVE_VIEW.views.defaultCamera.with3D ? ring[0] : LIVE_VIEW.views.defaultCamera.with3D;
    expect(screen.getByTestId("race3d").dataset.mode).toBe(picked);
    fireEvent.click(screen.getByRole("button", { name: /next camera/i }));
    const chosen = cycle(ring, picked, 1);
    expect(screen.getByTestId("race3d").dataset.mode).toBe(chosen);
    // Held: the rear T-cam; released: back in the same render (≤ 1 frame).
    fireEvent.keyDown(window, { key: LIVE_VIEW.views.mirror.key });
    expect(screen.getByTestId("race3d").dataset.mode).toBe("tcamRear");
    fireEvent.keyUp(window, { key: LIVE_VIEW.views.mirror.key });
    expect(screen.getByTestId("race3d").dataset.mode).toBe(chosen);
    // Fast forward: with the option on and ×8, the map (no 3D stage); back at ×1, the same camera.
    fireEvent.click(screen.getByTestId("ff-map"));
    fireEvent.click(screen.getByRole("radio", { name: "×8" }));
    expect(screen.queryByTestId("race3d")).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "×1" }));
    expect(screen.getByTestId("race3d").dataset.mode).toBe(chosen);
    view.unmount();
  });
});

describe("AUD-C3 · the radio to the sound, race and sessions", () => {
  it("each message with its car and the side of its card; stable keys as the log grows", () => {
    const users = [{ id: "a" }, { id: "b" }];
    const log = [
      { lap: 3, carId: "a", kind: "pace" },
      { lap: 4, carId: "b", kind: "gap", alert: true },
      { lap: 4, carId: "x", kind: "gap" },
    ];
    const first = radioForAudio(log.slice(0, 2), null, users);
    const all = radioForAudio(log, null, users);
    expect(all.map((message) => [message.carId, message.panel, message.pan])).toEqual([
      ["a", "left", -1],
      ["b", "right", 1],
      ["x", null, 0],
    ]);
    expect(all[1].alert).toBe(true);
    expect(all.slice(0, 2).map((message) => message.key)).toEqual(first.map((message) => message.key));
    // Sessions: timed messages keyed by what they are, so a new segment's first message is new.
    const session = radioForAudio([{ t: 12.5, segment: 1, carId: "a", kind: "session-garage-exit" }], null, users);
    expect(session[0].key).not.toBe(radioForAudio([{ t: 30, segment: 2, carId: "a", kind: "session-garage-exit" }], null, users)[0].key);
    expect(radioForAudio(log, (message) => message.lap <= 3, users)).toHaveLength(1);
  });

  it("LiveRace and SessionLive hand the radio (and the session its log) to every audio frame", () => {
    const race = source("LiveRace.js");
    expect(race.slice(race.indexOf("audio.frame({"), race.indexOf("audio.frame({") + 1400)).toMatch(/radio: replayLive \? undefined : ctx\.radio/);
    const session = source("SessionLive.js");
    const frame = session.slice(session.indexOf("audio.frame({"), session.indexOf("audio.frame({") + 900);
    expect(frame).toMatch(/events: engine\.events/);
    expect(frame).toMatch(/radio: radioForAudio\(sessionRadioAt\(engine, tau\.current\), null, users\)/);
    expect(session).toMatch(/sessionRadioText\(message, names\)/);
  });
});
