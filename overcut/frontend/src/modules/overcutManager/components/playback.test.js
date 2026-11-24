/**
 * HUD-1 of docs/manager/F1M24-GAMEPLAY.md (speeds-unify, auto-velocidad, auto-speed-drop,
 * user-camera-lock; RF-CMD-04, RF-3D-04, RNF-05, RNF-07, RNF-09): one 1-16 scale for the race
 * and the sessions, auto-speed that drops when your car pits or leaves the garage and gives
 * the speed back, a pause while a dialog is open, the view apart from the camera and the car
 * arrows by position - all from data/balance/live-view.json and hud.json with their schemas.
 * RNF-05: the same seed and orders give the same race and the same session with auto-speed
 * and without it (only the view's clock changes, never the engine's steps).
 */

import React from "react";
import Ajv from "ajv";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import liveViewSchema from "../engine/packs/schema/live-view.schema.json";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import LIVE_VIEW from "../data/balance/live-view.json";
import HUD from "../data/balance/hud.json";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createCareer, createContext, runPractice, sessionOptions, weekendRaceArgs } from "../engine/career";
import { classificationOf } from "../engine/race";
import { weekend } from "../engine/sim/simTestKit";
import { advanceTo, carStatus, command, createSession, defaultCompound } from "../engine/sessionSim";
import { circuitFor } from "../engine/venue";
import { createRaceSession } from "../engine/worker/raceSession";
import { applyTick, mirrorOf } from "../engine/worker/raceClient";
import { liveCarAt } from "./raceClock";
import { PlaybackBar, SpeedCallout } from "./Broadcast";
import useAutoSpeed from "./useAutoSpeed";
import {
  cameraModeOf, camerasOf, chooseSpeed, createAutoSpeed, defaultSpeedOf, defaultViewOf, engineChunk, notify, raceTriggers, reasonText, runToNextSessionEvent,
  sessionTriggers, setAutoSpeedEnabled, speedsOf, stepCar, tickAutoSpeed,
} from "./playback";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

describe("HUD-1 · data (RNF-07)", () => {
  const ajv = new Ajv({ allErrors: true });
  it("live-view.json and hud.json pass their schemas", () => {
    const liveOk = ajv.validate(liveViewSchema, LIVE_VIEW);
    expect(ajv.errors).toBeNull();
    expect(liveOk).toBe(true);
    const hudOk = ajv.validate(hudSchema, HUD);
    expect(ajv.errors).toBeNull();
    expect(hudOk).toBe(true);
  });

  it("every trigger has a priority, every level speed is on the scale", () => {
    const { triggers } = LIVE_VIEW;
    const ids = [
      ...Object.values(triggers.raceEvents), ...Object.values(triggers.ownRaceEvents), ...Object.values(triggers.sessionEvents),
      ...Object.values(triggers.ownSessionEvents), ...Object.values(triggers.ownSessionPhases), triggers.ownPitEntry,
    ];
    ids.forEach((id) => expect(LIVE_VIEW.eventPriority.map).toHaveProperty(id));
    LIVE_VIEW.autoSpeed.levels.forEach((level) => expect(speedsOf()).toContain(level.speed));
    ids.forEach((id) => expect(reasonText(id)).not.toBe(""));
  });
});

describe("HUD-1 · speeds-unify (RF-CMD-04)", () => {
  it("one ×1…×16 scale for the race and every session, each starting on it", () => {
    expect(speedsOf()).toEqual([1, 2, 4, 8, 16]);
    ["race", "raceReplay", "practice", "qualifying", "shootout"].forEach((kind) => expect(speedsOf()).toContain(defaultSpeedOf(kind)));
    expect(defaultSpeedOf("sprint")).toBe(defaultSpeedOf("race"));
  });

  it("the engine is asked for the same chunks as before the move to JSON", () => {
    const old = (requested, tau, speed) => {
      const chunk = Math.max(0.5, speed * 0.25);
      if (requested - tau > chunk / 2) return 0;
      return Math.max(requested, tau) + chunk - requested;
    };
    [[0, 0, 1], [0, 0, 16], [3, 2.9, 4], [10, 9.95, 8], [2, 5, 2]].forEach(([requested, tau, speed]) => expect(engineChunk(requested, tau, speed)).toBeCloseTo(old(requested, tau, speed), 12));
  });
});

describe("HUD-1 · auto-velocidad and auto-speed-drop", () => {
  const ramp = LIVE_VIEW.autoSpeed.rampRealSec;
  const restore = LIVE_VIEW.autoSpeed.restoreAfter.simSec;

  it("your car into the pit lane brings ×16 down notch by notch to ×1, then gives ×16 back", () => {
    const machine = createAutoSpeed({ speed: 16 });
    expect(notify(machine, ["ownPitEntry"], 100, 0)).toBe(true);
    expect(machine.speed).toBe(8);
    expect(machine.callout).toMatchObject({ speed: 8, reason: "ownPitEntry" });
    let real = 0;
    const seen = [machine.speed];
    while (machine.speed > 1 && real < 10) {
      real += ramp / 2;
      tickAutoSpeed(machine, 101, real);
      if (seen[seen.length - 1] !== machine.speed) seen.push(machine.speed);
    }
    expect(seen).toEqual([8, 4, 2, 1]);
    // Still slow while the stop lasts, the player's speed once it is over.
    tickAutoSpeed(machine, 100 + restore - 1, real + 1);
    expect(machine.speed).toBe(1);
    tickAutoSpeed(machine, 100 + restore, real + 2);
    expect(machine.speed).toBe(16);
    expect(machine.callout.reason).toBe("restore");
  });

  it("never speeds up what the player slowed, and lower priorities only cap higher speeds", () => {
    const machine = createAutoSpeed({ speed: 2 });
    expect(notify(machine, ["ownPass"], 10, 0)).toBe(false);
    expect(machine.speed).toBe(2);
    const fast = createAutoSpeed({ speed: 16 });
    notify(fast, ["ownPass"], 10, 0);
    for (let k = 1; k < 20; k += 1) tickAutoSpeed(fast, 10, k);
    expect(fast.speed).toBe(4);
    // A higher priority on top takes it lower; the restore waits for the last trigger.
    notify(fast, ["safetyCar", "ownPass"], 15, 30);
    for (let k = 31; k < 50; k += 1) tickAutoSpeed(fast, 16, k);
    expect(fast.speed).toBe(2);
    tickAutoSpeed(fast, 15 + restore, 60);
    expect(fast.speed).toBe(16);
  });

  it("a speed the player picks during a drop is theirs: nothing is given back over it", () => {
    const machine = createAutoSpeed({ speed: 16 });
    notify(machine, ["chequered"], 0, 0);
    chooseSpeed(machine, 4, 1);
    tickAutoSpeed(machine, 1000, 100);
    expect(machine.speed).toBe(4);
  });

  it("turned off, nothing changes the speed", () => {
    const machine = createAutoSpeed({ speed: 16 });
    setAutoSpeedEnabled(machine, false);
    expect(notify(machine, ["ownPitEntry", "redFlag"], 0, 0)).toBe(false);
    expect(machine.speed).toBe(16);
  });

  it("race triggers: race control for everyone, the rest only for your cars", () => {
    const isUser = (id) => id === "me";
    expect(raceTriggers({ events: [{ type: "sc" }, { type: "pass", carId: "x", otherId: "y" }], isUser })).toEqual(["safetyCar"]);
    expect(raceTriggers({ events: [{ type: "pass", carId: "x", otherId: "me" }, { type: "dnf", carId: "me" }], isUser })).toEqual(["ownPass", "ownRetirement"]);
    expect(raceTriggers({ events: [], pitEntries: ["me"], isUser })).toEqual(["ownPitEntry"]);
  });

  it("session triggers: leaving the garage, a flying lap, coming in, the flag", () => {
    const isUser = (id) => id === "me";
    expect(sessionTriggers({ events: [{ type: "flag" }, { type: "eliminated", carId: "x" }], phases: ["queued", "out", "flying", "pitlane"], isUser })).toEqual([
      "chequered", "ownGarageExit", "ownFlyingLap", "ownPitEntry",
    ]);
    expect(sessionTriggers({ events: [{ type: "eliminated", carId: "me" }], isUser })).toEqual(["ownKnockedOut"]);
  });
});

describe("HUD-1 · user-camera-lock (RF-3D-04, RNF-09)", () => {
  it("views apart from cameras; practice opens on the map", () => {
    expect(defaultViewOf("practice", true)).toBe("map");
    expect(defaultViewOf("race", true)).toBe("tv");
    expect(defaultViewOf("race", false)).toBe("camera");
    expect(cameraModeOf("map", "chase")).toBe("map");
    expect(cameraModeOf("tv", "chase")).toBe("tv");
    expect(cameraModeOf("camera", "tcam")).toBe("tcam");
  });

  it("cameras: the era's catalogue when there is one, today's list when not", () => {
    expect(camerasOf({ has3D: true, year: 1976 })).toEqual(LIVE_VIEW.views.cameras.with3D);
    expect(camerasOf({ has3D: false })).toEqual(["follow"]);
    const catalogue = [{ id: "chase" }, { id: "tcam", eras: [{ from: 1990, to: 2026 }] }, { id: "visor", eras: [{ from: 2018 }] }];
    expect(camerasOf({ has3D: true, year: 1976, catalogue })).toEqual(["chase"]);
    expect(camerasOf({ has3D: true, year: 2024, catalogue })).toEqual(["chase", "tcam", "visor"]);
  });

  it("the car arrows step through the tower by position, past retired cars, wrapping", () => {
    const rows = [{ id: "a" }, { id: "b", out: true }, { id: "c" }];
    expect(stepCar(rows, "a", 1)).toBe("c");
    expect(stepCar(rows, "c", 1)).toBe("a");
    expect(stepCar(rows, "a", -1)).toBe("c");
    expect(stepCar(rows, "b", 1)).toBe("a");
  });

  it("the playback bar: view selector, car arrows, auto-speed toggle (and the five speeds)", () => {
    const onView = jest.fn();
    const onStep = jest.fn();
    const onToggle = jest.fn();
    const onCamera = jest.fn();
    render(
      <PlaybackBar
        playing
        onPlay={() => {}}
        speeds={speedsOf()}
        speed={4}
        onSpeed={() => {}}
        views={{ value: "tv", onChange: onView, options: [{ value: "map", label: "Mapa" }, { value: "tv", label: "TV" }, { value: "camera", label: "Cámara" }] }}
        car={{ label: "LEC", onStep }}
        autoSpeed={{ enabled: true, onToggle }}
        cameraLabel="TV"
        onCamera={onCamera}
      />,
    );
    expect(within(screen.getByRole("radiogroup", { name: /Velocidad|Speed/ })).getAllByRole("radio")).toHaveLength(5);
    fireEvent.click(screen.getByRole("radio", { name: "Mapa" }));
    expect(onView).toHaveBeenCalledWith("map");
    fireEvent.click(screen.getByRole("button", { name: /Coche siguiente|Next car/ }));
    expect(onStep).toHaveBeenCalledWith(1);
    const toggle = screen.getByRole("button", { name: "Auto" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("the callout says the new speed and why, in words", () => {
    render(<SpeedCallout callout={{ key: 1, speed: 1, reason: "ownPitEntry" }} reasonText={reasonText} />);
    expect(screen.getByRole("status")).toHaveTextContent("×1");
    expect(screen.getByRole("status").textContent.length).toBeGreaterThan(3);
  });
});

describe("HUD-1 · useAutoSpeed: pause while a dialog is open (pauseOn)", () => {
  const Probe = ({ grab }) => {
    const auto = useAutoSpeed({ initial: 8 });
    grab(auto);
    return <span data-testid="state">{`${auto.speed}:${auto.held ? "held" : "free"}`}</span>;
  };

  it("hold and release by reason; reasons outside pauseOn are ignored; the callout follows a change", () => {
    jest.useFakeTimers();
    let auto = null;
    render(<Probe grab={(value) => { auto = value; }} />);
    expect(screen.getByTestId("state")).toHaveTextContent("8:free");
    act(() => auto.hold("pitDialog"));
    expect(screen.getByTestId("state")).toHaveTextContent("8:held");
    act(() => auto.hold("somethingElse"));
    act(() => auto.release("pitDialog"));
    expect(screen.getByTestId("state")).toHaveTextContent("8:free");
    act(() => {
      auto.choose(2);
    });
    expect(screen.getByTestId("state")).toHaveTextContent("2:free");
    expect(auto.callout).toMatchObject({ speed: 2, reason: "manual" });
    act(() => {
      jest.advanceTimersByTime(HUD.speedCallout.showMs + 10);
    });
    expect(auto.callout).toBeNull();
    jest.useRealTimers();
  });
});

/** What a finished race says, compared byte for byte (as raceWorker.test.js). */
const fingerprint = (state) => JSON.stringify({ rows: classificationOf(state), events: state.events, duels: state.duels, radio: state.radio, history: state.cars.map((car) => car.history) });

describe("HUD-1 · RNF-05: the same seed with and without auto-speed gives the same race", () => {
  const { career } = weekend({ seed: "hud1" });
  const args = weekendRaceArgs(career);
  const userIds = args.entrants.filter((entrant) => entrant.isUser).map((entrant) => entrant.id);
  const FPS = 30;

  /** The live view's loop, headless: clock × speed, the worker asked in chunks, triggers from what is visible. */
  const watch = (withAuto) => {
    const session = createRaceSession();
    const mirror = mirrorOf(session.handle({ type: "create", args }));
    const circuit = circuitFor(mirror.race, mirror.year);
    const lapRef = mirror.race.baseLap;
    const machine = createAutoSpeed({ speed: 16, enabled: withAuto });
    const seen = new WeakSet();
    const speeds = new Set();
    let tau = 0;
    let requested = 0;
    let real = 0;
    let pitBefore = null;
    let pitAt = null;
    while (!mirror.finished && tau < 5400 && !(pitAt !== null && tau > pitAt + 60)) {
      real += 1 / FPS;
      tickAutoSpeed(machine, tau, real);
      tau = Math.min(tau + machine.speed / FPS, mirror.clock);
      const ask = engineChunk(requested, tau, machine.speed);
      if (ask > 0) {
        applyTick(mirror, session.handle({ type: "step", seconds: ask }));
        requested += ask;
      }
      const fresh = mirror.events.filter((event) => (event.at ?? 0) <= tau && !seen.has(event));
      fresh.forEach((event) => seen.add(event));
      const mine = mirror.cars.filter((car) => userIds.includes(car.id));
      const inPit = Object.fromEntries(mine.map((car) => [car.id, Boolean(liveCarAt(mirror, car, tau, circuit, lapRef).inPit)]));
      const pitEntries = pitBefore ? mine.filter((car) => inPit[car.id] && pitBefore[car.id] === false).map((car) => car.id) : [];
      if (pitEntries.length && pitAt === null) pitAt = tau;
      pitBefore = inPit;
      notify(machine, raceTriggers({ events: fresh, pitEntries, isUser: (id) => userIds.includes(id) }), tau, real);
      speeds.add(machine.speed);
    }
    const done = session.handle({ type: "finish" });
    return { print: fingerprint(done.state), speeds, changes: machine.changes, pitAt };
  };

  it("auto-speed drops to ×1 at your stop, and the finished race is identical byte for byte", () => {
    const plain = watch(false);
    const auto = watch(true);
    expect(plain.changes).toBe(0);
    expect(auto.pitAt).not.toBeNull();
    expect(auto.changes).toBeGreaterThan(0);
    expect(auto.speeds.has(1)).toBe(true);
    expect(auto.print).toBe(plain.print);
  });
});

describe("HUD-1 · RNF-05: a session is the same at any speed, with auto-speed and 'next event'", () => {
  const context = createContext(fallbackBootstrap, reference);
  const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "hud1-session" });
  runPractice(career, {});
  const options = sessionOptions(career, "qualifying");
  const userIds = options.entrants.filter((entry) => entry.isUser).map((entry) => entry.id);
  const SEND_AT = 120;

  const segmentPrint = (engine) => JSON.stringify({ events: engine.events, cars: engine.cars.map((car) => ({ id: car.id, best: car.best, laps: car.laps, history: car.history })) });

  const play = ({ withAuto, skips }) => {
    const engine = createSession(options);
    const machine = createAutoSpeed({ speed: 8, enabled: withAuto });
    const phases = {};
    let tau = 0;
    let real = 0;
    let seen = 0;
    let sent = false;
    let jumps = 0;
    const plan = { push: 1, fuel: null, compound: defaultCompound(engine), set: "new", style: "normal" };
    while (!engine.over && tau < 7200) {
      real += 1 / 30;
      tickAutoSpeed(machine, tau, real);
      tau += machine.speed / 30;
      if (!sent && tau >= SEND_AT) {
        // The player's call lands at the same session time in both runs.
        advanceTo(engine, SEND_AT);
        userIds.forEach((id) => command(engine, "sendOut", id, plan));
        sent = true;
      }
      if (skips && sent && jumps < 3 && tau > SEND_AT + 200 * (jumps + 1)) {
        tau = Math.max(tau, runToNextSessionEvent(engine, { userIds, from: tau }));
        jumps += 1;
      }
      advanceTo(engine, tau);
      const fresh = engine.events.slice(seen);
      seen = engine.events.length;
      const entered = [];
      userIds.forEach((id) => {
        const phase = carStatus(engine, id, engine.clock)?.phase;
        if (phases[id] !== undefined && phases[id] !== phase) entered.push(phase);
        phases[id] = phase;
      });
      notify(machine, sessionTriggers({ events: fresh, phases: entered, isUser: (id) => userIds.includes(id) }), engine.clock, real);
    }
    const userLaps = engine.cars.filter((car) => userIds.includes(car.id)).reduce((sum, car) => sum + car.history.length, 0);
    return { print: segmentPrint(engine), changes: machine.changes, jumps, over: engine.over, clock: engine.clock, userLaps };
  };

  it("Q1 with auto-speed and three skips is Q1 at a steady ×8", () => {
    const steady = play({ withAuto: false, skips: false });
    const auto = play({ withAuto: true, skips: true });
    expect(steady.over).toBe(true);
    expect(steady.clock).toBeGreaterThan(600);
    expect(steady.userLaps).toBeGreaterThan(0);
    expect(auto.changes).toBeGreaterThan(0);
    expect(auto.jumps).toBe(3);
    expect(auto.print).toBe(steady.print);
  });
});
