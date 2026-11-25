/**
 * The race, live from the pit wall.
 *
 * Two ways in. A live Sunday (`args`, career.weekendRaceArgs) is a step race
 * (engine/sim, RF-SIM-01) run in the race worker (SRS 4, engine/worker): every
 * animation frame the view asks the engine for `dt × speed` seconds of race
 * (RF-CMD-04: ×1, ×2, ×4, ×8, ×16) a little ahead of the pictures, and draws every car
 * between the per-step positions the worker sends back (raceClock.liveCarAt), so passes,
 * duels and the safety car happen on the road. A finished or quick-mode race (`state`)
 * is replayed from its lap history (raceClock.carAt), as before.
 *
 * On top sit the cameras (the whole map, the overhead camera locked to a driver, or a
 * TV director hunting for fights; RNF-09: the 2D map and the timing tower work without
 * 3D), a timing tower read at the line, and the pit wall: pace, fuel mixture, battery,
 * defence and overtaking risk for each car, the stop calls and team orders (RF-CMD-01/02,
 * the era's orders from rules.commandsFor), the engineer on the radio and the commentary.
 *
 * Playback (HUD-1 of F1M24-GAMEPLAY): one 1-16 scale and the starting speed from
 * data/balance/live-view.json; auto-speed (useAutoSpeed) drops it when your car pits, retires
 * or fights, under the safety car, the red flag and the chequered flag, and gives it back;
 * an open dialog pauses the clock. The view (map, TV, camera) is picked apart from the
 * camera; in the camera view the director never cuts, and the car arrows step through the
 * tower by position. None of it touches the engine (RNF-05).
 *
 * Tower and director (HUD-2): the tower's modes from data/balance/hud.json (interval,
 * leader, tyres, tyre %, last lap, sectors when the engine times them, stops), row tags for
 * incidents, out and in laps and the flag, and a header tinted by the flag with its words -
 * a yellow says its sector. The TV follows the car you pick in the tower or on the map
 * (components/director/directorState, CAM-1); "follow the action" is broadcast.json's.
 *
 * Banners, panel and stop (HUD-3): one event banner at a time over the picture (passes,
 * incidents, the fastest lap, DRS by the era's rule, laps to go; hudBanners.js), each of your
 * cars' panel in tabs with its units (status, tactics, telemetry, pit), the pit dialog
 * (PitDialog: engine/sim/pitLane.js previewPit) that holds the session while it is open, and
 * the pit widget (pitTimer.js) reading the engine's pit phase. All from hud.json.
 *
 * Start, finish, replays and conditions (HUD-4): a live race asks the engine for its PRE_START
 * (SIM-3, live-view.json start) and the lights are the engine's own - its grid, light and
 * lights-out events on the procedure clock, the wait drawn with the race's seed (startLights.js;
 * the quick replay shows the era's procedure with the same seeded wait). The HUD comes back
 * hud.json start.hudDelaySec after lights out. Each car's flag is its `finished` event (the tower's
 * chequered tag, your panel folded to its result), and the view hands the race back
 * live-view.json finish after the last car. Replays (CAM-3's replayBuffer and ReplayOverlay) are
 * queued by broadcast.json replay.triggers on TV and asked for from a banner; while one runs the race
 * clock stands still (pauseOn replay). The conditions strip reads the engine: local start time from
 * the pack or the circuit's climate, air, water in mm and rubber (hudConditions.js).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  cancelPit, commandsFor, delayStop, drsOpen, energyEra, mixEffect, requestPit, rulesOf, runToFinish, setErs, setMix, setMode, setTeamOrder, skipStop,
  stepLap, tyreLifeUsed,
} from "../engine/race";
import { DEFENCE_KEYS, RISK_KEYS } from "../engine/sim";
import { applyTick, createRaceClient, mirrorOf } from "../engine/worker/raceClient";
import { circuitFor } from "../engine/venue";
import { poseAt } from "../engine/trackGeometry";
import { useManager } from "./context";
import { Meter, Segmented, Tabs, Tyre, readableOn } from "./atoms";
import { Dots, EventBanner, Feed, PitTimer, PlaybackBar, SectorBars, SpeedCallout, StatusStrip, TimingTower } from "./Broadcast";
import { createBannerQueue, currentBanner, drsBanners, drsCalls, eventBanners, lapCallouts, offerBanners } from "./hudBanners";
import { createPitClock, stepPitClock } from "./pitTimer";
import PitDialog from "./PitDialog";
import RACE_ERAS from "../data/balance/race-eras.json";
import { tvShotOf } from "./tvDirector";
import { hasSectorTimes, incidentOf, lapSectorsOf, lastLapOf, raceInLap, raceOutLap, stopsOf, towerModeName, towerModesFor, yellowFlag } from "./tower";
import { HUD, LIVE_VIEW, cameraModeOf, cameraName, camerasOf, cycle, defaultCameraOf, defaultSpeedOf, defaultViewOf, engineChunk, raceTriggers, reasonText, speedsOf, stepCar, viewName, viewsOf } from "./playback";
import useAutoSpeed from "./useAutoSpeed";
import { IconFastForward, IconFlag } from "./icons";
import { IconLap, IconNextEvent } from "./icons";
import "./styles/weekend.css";
import { COMPOUND, DEFENCE, ERS, MIX, MODE, RISK, STATUS, commentary, duelEvent, lapTime, radioText, t } from "./texts";
import RaceStage, { MiniMap } from "./RaceStage";
import { canRender3D } from "../three/support";
import { useRaceAudio } from "../three/audio";
import SoundControl from "../three/audio/SoundControl";

import { battlesIn, carAt, computedUntil, eventTime, leaderLap, liveCarAt, liveSafetyCarWindows, liveYellowsAt, raceEndTime, safetyCarWindows, standingsAt } from "./raceClock";
import { lightsOutOf, procedureLimit, replayTimelineOf, startProcedureOf, startStateAt, startTimelineOf } from "./startLights";
import { clockLabel, raceConditionsOf, raceStartOf } from "./hudConditions";
import { REPLAY, createReplayBuffer, createReplayQueue, enqueueReplay, nextReplay, planReplay, replayFrameAt, replaySpan } from "./replay/replayBuffer";
import ReplayOverlay from "./replay/ReplayOverlay";

// three.js is only fetched when a race is watched in 3D, so the rest of OverCut stays light.
const Race3D = React.lazy(() => import("../three/Race3D"));

/** Overhead camera widths, in metres of track across the screen. */
const ZOOMS = [70, 130, 280];

/** HUD-4: the replay a banner asks for, by banner kind (ReplayOverlay labels them; the rest say "Replay"). */
const BANNER_REPLAY = { pass: "pass", mistake: "mistake", contact: "contact", investigation: "contact", penalty: "contact", fastest: "fastest" };

/** Three-letter timing code from the surname ("Nelson Piquet Jr." is PIQ, not JR.). */
const code = (name = "") => {
  const parts = name.split(" ").filter((part) => part && !/^(jr|sr|ii|iii)\.?$/i.test(part));
  return (parts[parts.length - 1] || name).replace(/[^\p{L}]/gu, "").slice(0, 3).toUpperCase();
};

/** Events the feed shows: everything at the front, everything about you, every race-control call. */
const worthTelling = (event, carsById, positions) => {
  if (["sc", "vsc", "sc-in", "rain", "drying", "flag", "lead", "yellow", "red", "restart"].includes(event.type)) return true;
  const car = carsById[event.carId];
  const other = carsById[event.otherId];
  if (car?.isUser || other?.isUser) return true;
  if (["dnf", "contact", "penalty", "investigation", "grid-penalty"].includes(event.type)) return true;
  if (event.type === "pass") return (positions[event.otherId] ?? 99) <= 8;
  if (event.type === "mistake") return event.kind === "spin" || (positions[event.carId] ?? 99) <= 5;
  return event.type === "fastest" && event.lap > 5;
};

const unwrap = (from, to) => {
  let target = to;
  while (target - from > Math.PI) target -= Math.PI * 2;
  while (target - from < -Math.PI) target += Math.PI * 2;
  return target;
};

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Seconds of the day as hh:mm:ss, for the broadcast clock (hudConditions.clockLabel). */
export const clockOf = clockLabel;

/** Feed lines worth a second look: race control and retirements. */
const ALERTS = ["sc", "vsc", "sc-in", "red", "restart", "dnf", "contact", "penalty", "investigation", "rain"];

/** RF-CMD-04 "saltar al siguiente evento": what the skip button stops at (live-view.json nextEvent.race). */
const NEXT_TYPES = LIVE_VIEW.nextEvent.race;

// ------------------------------------------------------------------ sources

/** The quick-mode orders by name (race.js setters), for a replayed quick race. */
const QUICK_COMMANDS = { setMode, setMix, setErs, requestPit, cancelPit, delayStop, skipStop, setTeamOrder };

/**
 * A quick-mode race (race.js), run lap by lap just ahead of the pictures and replayed
 * from its line crossings (raceClock.carAt).
 */
const quickSource = (state) => {
  const circuit = circuitFor(state.race, state.year);
  const lapRef = state.race.baseLap;
  const times = new Map();
  const ensure = (tau) => {
    if (state.lap === 0) stepLap(state);
    let guard = 0;
    while (!state.finished && tau >= computedUntil(state) && guard < 60) {
      stepLap(state);
      guard += 1;
    }
  };
  ensure(0);
  const leaderOf = (tau) => standingsAt(state.cars, tau, circuit, lapRef).find((row) => !row.out);
  const timeOf = (event, leaderId) => {
    if (!times.has(event)) times.set(event, eventTime(event, Object.fromEntries(state.cars.map((car) => [car.id, car])), circuit, leaderId));
    return times.get(event);
  };
  // HUD-4: the quick mode has no PRE_START; the view shows the era's procedure with the race's seeded wait.
  const startTimeline = replayTimelineOf({ rules: rulesOf(state.era, state.year), seed: state.seed ?? `${state.year}` });
  const source = {
    kind: "quick",
    current: state,
    circuit,
    lapRef,
    steps: false,
    limit: (tau) => tau,
    advance: (tau) => ensure(tau),
    timeline: () => startTimeline,
    procedureLimit: (wanted) => procedureLimit(startTimeline, wanted),
    advancePre: () => {},
    raceBegins: () => {},
    liveStart: () => null,
    rows: (tau) => standingsAt(state.cars, tau, circuit, lapRef),
    sample: (car, tau) => carAt(car, tau, circuit, lapRef),
    eventTime: (event, leaderId) => timeOf(event, leaderId),
    radioTime: (message) => state.cars.find((car) => car.id === message.carId)?.history?.[message.lap - 1]?.end ?? Infinity,
    scWindows: (leaderId) => safetyCarWindows(state.events, Object.fromEntries(state.cars.map((car) => [car.id, car])), circuit, leaderId),
    duels: () => [],
    yellows: () => [],
    command: (name, ...args) => QUICK_COMMANDS[name]?.(state, ...args),
    next: (tau) => {
      for (let guard = 0; guard < 80; guard += 1) {
        ensure(tau);
        const leader = leaderOf(tau)?.car.id;
        const ahead = state.events.filter((event) => NEXT_TYPES.includes(event.type)).map((event) => timeOf(event, leader)).filter((time) => time > tau + 0.05);
        if (ahead.length) {
          source.jump(Math.min(...ahead));
          return;
        }
        if (state.finished) break;
        stepLap(state);
      }
      source.jump(raceEndTime(state) + 0.01);
    },
    oneLap: (tau) => {
      ensure(tau);
      const lead = leaderOf(tau);
      const entry = lead?.car.history?.[lead.completed];
      source.jump(entry ? entry.end + 0.01 : raceEndTime(state));
      ensure(entry ? entry.end + 0.01 : raceEndTime(state));
    },
    toFlag: () => {
      runToFinish(state);
      source.jump(raceEndTime(state) + 0.01);
    },
    finalState: () => state,
    jump: () => {},
  };
  return source;
};

/**
 * A step race behind the race worker: the view's mirror of it (raceClient), a clock
 * that never runs ahead of the engine, and requests sized so the engine stays a little
 * ahead of the pictures at every speed.
 */
const stepSource = (client, mirror) => {
  const circuit = circuitFor(mirror.race, mirror.year);
  const lapRef = mirror.race.baseLap;
  const pose = (car, tau) => liveCarAt(mirror, car, tau, circuit, lapRef);
  const jumps = new Map();
  // Register the skip before sending: the in-thread engine replies synchronously.
  const awaitJump = (kind, send) => {
    jumps.set(client.upcomingId, kind);
    send();
  };
  // HUD-4: the engine's PRE_START events (SIM-3), read again only when new events arrive.
  let timelineAt = -1;
  let timeline = [];
  const startTimeline = () => {
    if (timelineAt !== mirror.events.length) {
      timelineAt = mirror.events.length;
      timeline = startTimelineOf(mirror.events);
    }
    return timeline;
  };
  const source = {
    kind: client.kind,
    current: mirror,
    circuit,
    lapRef,
    steps: true,
    requested: 0,
    final: null,
    // The pictures wait for the engine (never draw a race that is not computed yet).
    limit: (tau) => (mirror.finished ? tau : Math.min(tau, mirror.clock)),
    advance: (tau, speed) => {
      if (mirror.finished || client.busy || jumps.size) return;
      // Ask for a chunk of race once less than half a chunk is left ahead of the clock (live-view.json engineLead).
      const ask = engineChunk(source.requested, tau, speed);
      if (ask <= 0) return;
      client.step(ask);
      source.requested += ask;
    },
    timeline: startTimeline,
    // The procedure clock never runs ahead of the engine's PRE_START (one step of slack: its clock
    // starts up to a step before 0 so that lights out falls on a step boundary, SIM-3).
    procedureLimit: (wanted) => procedureLimit(startTimeline(), wanted, source.requested - mirror.dt),
    advancePre: (clock, speed) => {
      if (mirror.finished || client.busy || jumps.size || startTimeline().some((entry) => entry.type === "lightsOut")) return;
      const ask = engineChunk(source.requested, clock, speed);
      if (ask <= 0) return;
      client.step(ask);
      source.requested += ask;
    },
    // Lights out: from now on the requests are counted on the race clock.
    raceBegins: () => {
      source.requested = mirror.clock;
    },
    // §1.7 snapshot.start, if the worker ever sends it (absent today: the events say the same).
    liveStart: () => mirror.start || null,
    rows: (tau) => standingsAt(mirror.cars, tau, circuit, lapRef, pose),
    sample: pose,
    eventTime: (event) => event.at ?? 0,
    radioTime: (message) => message.at ?? 0,
    scWindows: () => liveSafetyCarWindows(mirror),
    yellows: (tau) => liveYellowsAt(mirror, tau),
    duels: () => mirror.duels,
    command: (name, ...args) => client.command(name, ...args),
    next: () => awaitJump("next", () => client.next(NEXT_TYPES)),
    oneLap: () => awaitJump("lap", () => client.lap()),
    toFlag: () => awaitJump("finish", () => client.finish()),
    finalState: () => source.final,
    jump: () => {},
    /** A reply arrived (already folded into the mirror). */
    replied: (reply) => {
      if (reply.final) source.final = reply.final.state;
      if (reply.type === "finished") source.final = reply.state;
      const kind = jumps.get(reply.id);
      if (!kind) return;
      jumps.delete(reply.id);
      source.requested = mirror.clock;
      source.jump(kind === "finish" ? Math.max(raceEndTime(mirror), mirror.clock) + 0.01 : mirror.clock);
    },
  };
  return source;
};

// ------------------------------------------------------------------ the view

export default function LiveRace({ state, args, onFinished, title }) {
  return args ? <LiveStepRace args={args} onFinished={onFinished} title={title} /> : <LiveQuickRace state={state} onFinished={onFinished} title={title} />;
}

function LiveQuickRace({ state, onFinished, title }) {
  const source = useMemo(() => quickSource(state), [state]);
  return <RaceView source={source} onFinished={onFinished} title={title} />;
}

/** RF-WKD-02 live: the step race built and run in the race worker from the career's arguments. */
function LiveStepRace({ args, onFinished, title }) {
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mirror = null;
    let current = null;
    const client = createRaceClient({
      listener: (reply) => {
        if (reply.type === "created") {
          mirror = mirrorOf(reply);
          current = stepSource(client, mirror);
          setSource(current);
          return;
        }
        if (reply.type === "error") {
          setError(reply.message);
          return;
        }
        if (!mirror) return;
        const view = reply.type === "tick" ? reply : reply.view;
        if (view) {
          applyTick(mirror, view);
          // HUD-4 status-strip-data: the weather as the engine has it now (weatherNow: water, rubber, track).
          if (view.weather) mirror.weatherNow = view.weather;
          if (view.start) mirror.start = view.start;
        }
        current.replied(reply);
      },
    });
    // HUD-4: the engine's own start procedure (SIM-3 PRE_START); the race is the same with it or without (RNF-05).
    const start = LIVE_VIEW.start;
    client.create(start.preStart ? { ...args, preStart: { formation: start.formation } } : args);
    return () => client.dispose();
  }, [args]);
  if (error) return <div className="lv-loading">{t(`Error del motor de carrera: ${error}`, `Race engine error: ${error}`)}</div>;
  if (!source) return <div className="lv-loading">{t("Preparando la carrera…", "Preparing the race…")}</div>;
  return <RaceView source={source} onFinished={onFinished} title={title} />;
}

function RaceView({ source, onFinished, title = t("Carrera", "Race") }) {
  const { career } = useManager();
  const current = source.current;
  const { circuit, lapRef } = source;
  const userCars = current.cars.filter((car) => car.isUser);

  const [, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const sessionKind = source.steps ? "race" : "raceReplay";
  // RF-CMD-04 / HUD-1: the 1-16 scale, the starting speed and auto-speed (live-view.json).
  const auto = useAutoSpeed({ initial: defaultSpeedOf(sessionKind) });
  const speed = auto.speed;
  const has3D = useMemo(() => canRender3D(), []);
  // user-camera-lock: the view (map, TV, camera) apart from the camera of the camera view.
  const cameraList = useMemo(() => camerasOf({ has3D, year: current.year }), [has3D, current.year]);
  const [view, setView] = useState(() => defaultViewOf(sessionKind, has3D));
  const [cameraPick, setCameraPick] = useState(() => defaultCameraOf(cameraList, has3D));
  const cameraMode = cameraModeOf(view, cameraPick);
  const in3D = has3D && cameraMode !== "map";
  const in3DRef = useRef(in3D);
  in3DRef.current = in3D;
  const zoom = 1;
  const [focusId, setFocusId] = useState(userCars[0]?.id ?? current.cars[0]?.id);
  // tower-modes (HUD-2): hud.json's order for the year; sectors only when the engine times them.
  const sectorTimes = hasSectorTimes(current.cars);
  const towerModes = towerModesFor({ session: "race", year: current.year, available: HUD.tower.modes.filter((mode) => mode !== "sectors" || sectorTimes) });
  const [towerModePick, setTowerMode] = useState(towerModes[0]);
  const towerMode = towerModes.includes(towerModePick) ? towerModePick : towerModes[0];
  // RF-3D-04 sound: engines per car and era, spatial mix per camera, ambience (three/audio).
  const audio = useRaceAudio({ seed: current.seed ?? `${current.year}`, year: current.year });

  const tau = useRef(0);
  // HUD-4: the start procedure's clock (seconds since it began: the formation lap, the grid, the lights);
  // the race clock `tau` starts at lights out.
  const procedureClock = useRef(0);
  const introDone = useRef(false);
  const procedure = useMemo(() => startProcedureOf(rulesOf(current.era, current.year)), [current.era, current.year]);
  // HUD-4 replays (CAM-3's buffer, filled by Race3D from the race clock; one replay at a time).
  const replayBuffer = useMemo(() => createReplayBuffer(), [source]);
  const replayQueue = useRef(createReplayQueue());
  const replayClock = useRef(0);
  const [replay, setReplay] = useState(null);
  const replayRef = useRef(null);
  replayRef.current = replay;
  const camera = useRef(null);
  // The director's last shot (directorState keeps its camera and its follow-the-action hold).
  const director = useRef(null);
  const finishedRef = useRef(false);
  // HUD-3: the pit dialog of one of your cars; while it is open the session is held (pauseOn).
  const [pitDialogId, setPitDialogId] = useState(null);
  const { hold, release } = auto;
  useEffect(() => {
    if (!pitDialogId || !HUD.pitDialog.pauseOnOpen) return undefined;
    hold("pitDialog");
    return () => release("pitDialog");
  }, [pitDialogId, hold, release]);
  // HUD-4: a replay on air holds the race clock (live-view.json pauseOn replay, broadcast.json replay.pauseSim).
  useEffect(() => {
    if (!replay || !REPLAY.pauseSim || !LIVE_VIEW.pauseOn.list.includes("replay")) return undefined;
    hold("replay");
    return () => release("replay");
  }, [replay, hold, release]);
  const startReplay = (plan) => {
    if (!plan) return;
    replayClock.current = 0;
    setReplay({ plan, key: `${plan.trigger}:${plan.at}` });
  };
  const endReplay = () => setReplay(null);
  // The loop reads the auto-speed machine itself (a drop lands on the very next frame).
  const playRef = useRef({ playing, auto, playingRaw: playing });
  playRef.current = { playing: playing && !auto.held, auto, playingRaw: playing };
  const repaint = () => setFrame((value) => (value + 1) % 1e9);

  // Skips (next event, one lap, to the flag) land here, whenever the engine answers.
  source.jump = (time) => {
    // A skip during the start procedure goes past lights out (the local clock with it).
    const out = lightsOutOf(source.timeline());
    if (out !== null) procedureClock.current = Math.max(procedureClock.current, out);
    introDone.current = true;
    tau.current = Math.max(tau.current, time);
    repaint();
  };

  // The clock: real time times the playback speed, after the start procedure; the engine
  // is asked for what the clock is about to need (RF-CMD-04).
  useEffect(() => {
    let last = now();
    let handle = null;
    let lastPaint = 0;
    const raf = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : (fn) => setTimeout(() => fn(now()), 50);
    const cancel = typeof cancelAnimationFrame !== "undefined" ? cancelAnimationFrame : clearTimeout;
    const tick = () => {
      const time = now();
      const dt = Math.min(0.1, (time - last) / 1000);
      last = time;
      const { playing: isPlaying, auto: playback, playingRaw } = playRef.current;
      // HUD-4: a replay runs on its own clock, in real time, while the race clock is held.
      if (replayRef.current && playingRaw) replayClock.current += dt;
      if (isPlaying && !finishedRef.current) playback.tick(tau.current);
      const rate = playback.machine.speed;
      if (isPlaying && !finishedRef.current) {
        if (!introDone.current) {
          // HUD-4 (§1.5): the procedure clock runs only as far as the engine has run its PRE_START; the
          // lights at live-view.json start.lightsSpeed, a driven formation lap at the playback speed.
          const before = startStateAt(source.timeline(), procedureClock.current, procedure);
          const lightsSpeed = LIVE_VIEW.start.lightsSpeed;
          const preRate = before.phase === "formation" || lightsSpeed === null ? rate : lightsSpeed;
          procedureClock.current = source.procedureLimit(procedureClock.current + dt * preRate);
          source.advancePre(procedureClock.current, preRate);
          if (startStateAt(source.timeline(), procedureClock.current, procedure).phase === "out") {
            introDone.current = true;
            source.raceBegins();
          }
        } else {
          tau.current = source.limit(tau.current + dt * rate);
        }
      }
      // Paused (or held by an open dialog, HUD-3 PitDialog): the engine is asked for nothing.
      if (isPlaying && introDone.current && !finishedRef.current) source.advance(tau.current, rate);
      // The 3D view samples the clock itself every frame; the data around it
      // only needs repainting a dozen times a second.
      if (!in3DRef.current || time - lastPaint >= 90) {
        lastPaint = time;
        repaint();
      }
      handle = raf(tick);
    };
    handle = raf(tick);
    return () => cancel(handle);
  }, [source, procedure]);

  const raceEnd = raceEndTime(current);
  // HUD-4: the view stays on after the last car's flag (live-view.json finish), then hands the race back.
  const done = tau.current >= raceEnd + LIVE_VIEW.finish.afterLastSec;

  // Hand the race back once everyone is home. Keyed on `done` alone: the view
  // re-renders every frame, and a timer cleared on each render would never fire.
  const finish = useRef(onFinished);
  finish.current = onFinished;
  useEffect(() => {
    if (!done) return undefined;
    finishedRef.current = true;
    const id = setTimeout(() => finish.current(source.finalState()), LIVE_VIEW.finish.handBackRealMs);
    return () => clearTimeout(id);
  }, [done, source]);

  const rows = source.rows(tau.current);
  const byId = Object.fromEntries(current.cars.map((car) => [car.id, car]));
  const rowOf = Object.fromEntries(rows.map((row) => [row.car.id, row]));
  const positions = Object.fromEntries(rows.map((row) => [row.car.id, row.position]));
  const names = Object.fromEntries(current.cars.map((car) => [car.id, car.name]));
  const leader = rows.find((row) => !row.out);
  const displayLap = leaderLap(rows, current.laps);
  const wetness = current.weather.wetness[Math.min(displayLap, current.laps)] ?? 0;
  const leaderFinished = Boolean(leader?.pose.finished);
  // HUD-4 (§1.7 `finished` {carId, t, pos}, SIM-3): each car's flag at its own race time; the quick
  // replay has no such event and its line crossings say it (pose.finished).
  const flagOf = {};
  current.events.forEach((event) => {
    if (event.type === "finished" && Number.isFinite(event.t) && event.t <= tau.current && !flagOf[event.carId]) flagOf[event.carId] = { t: event.t, pos: event.pos };
  });
  const flagged = (car) => Boolean(flagOf[car.id] || rowOf[car.id]?.pose.finished);
  const winnerFlagAt = Object.values(flagOf).find((entry) => entry.pos === 1)?.t ?? (leaderFinished ? leader.car.history?.[leader.car.history.length - 1]?.end ?? tau.current : null);
  // The HUD comes back hudDelaySec after lights out (hud.json start; null = at once, as before).
  const hudLive = introDone.current && tau.current >= (HUD.start.hudDelaySec ?? 0);
  // §1.7 snapshot.start as the view has it now: from the engine's events at the view's procedure clock
  // (the engine runs a little ahead of the pictures); the worker's own snapshot only if it sends no events.
  const startTimeline = source.timeline();
  const startFromEvents = startTimeline.length || !source.liveStart() ? startStateAt(startTimeline, procedureClock.current, procedure) : { ...source.liveStart(), lamps: procedure ? procedure.spec.lights : 0 };
  const startNow = introDone.current ? { ...startFromEvents, phase: "out", lights: 0 } : startFromEvents;

  const visibleEvents = current.events.filter((event) => source.eventTime(event, leader?.car.id) <= tau.current);
  // Duels the defender won (step race): a line in the commentary when the player's car
  // is in it, once per pair and lap (a fight is retried at every corner).
  const told = new Set();
  const held = source
    .duels()
    .filter((duel) => (duel.t ?? duel.at ?? 0) <= tau.current && (byId[duel.attacker]?.isUser || byId[duel.defender]?.isUser))
    .map((duel) => {
      const event = duelEvent(duel);
      const key = event && `${event.carId}:${event.otherId}:${event.lap}`;
      if (!event || told.has(key)) return null;
      told.add(key);
      return { ...event, at: duel.t ?? duel.at ?? 0 };
    })
    .filter(Boolean);
  const feed = [...visibleEvents, ...held].filter((event) => worthTelling(event, byId, positions));
  // A step race: in race-time order (events and duels come from two logs).
  if (source.steps) feed.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const recent = feed.slice(-16).reverse();
  const scWindow = source.scWindows(leader?.car.id).find((w) => tau.current >= w.from && tau.current < w.to);
  const fastest = visibleEvents.filter((event) => event.type === "fastest").pop();
  // RF-SIM-10: a red-flag neutralisation is a spell with `red` (step race) or a red flag
  // not yet restarted (quick mode); local yellows by corner (step race).
  const flags = visibleEvents.filter((event) => event.type === "red" || event.type === "restart");
  const redFlag = Boolean(scWindow?.red) || (flags.length > 0 && flags[flags.length - 1].type === "red");
  const yellows = source.yellows(tau.current);

  // ---- the camera
  const battles = battlesIn(rows);
  const focusRow = rowOf[focusId] && !rowOf[focusId].pose.gone ? rowOf[focusId] : leader;
  let target = focusRow?.pose;
  let directorLabel = "";
  // director-follow-focus (HUD-2 on CAM-1's directorState): the TV films the car picked in
  // the tower or on the map, framing its rival when they race; it never swaps the subject
  // unless broadcast.json followAction is on. SIM-4's battle state when the engine sends it.
  let tvSubjectId = focusId;
  if (cameraMode === "tv") {
    // HUD-4 (start-finish-scripts, the hook): the race clock, the seed and the start for CAM-4's sequences.
    const tv = tvShotOf({ focusId, rows, events: visibleEvents, battle: current.battle, cars: current.cars, prev: director.current, now: now() / 1000, tau: tau.current, seed: current.seed, start: startNow });
    director.current = tv.shot;
    if (tv.subjectId !== null) {
      tvSubjectId = tv.subjectId;
      target = tv.target;
      directorLabel = tv.label;
    }
  }
  if (target) {
    // Locked to the car's position at any playback speed; only the turn of the
    // camera is eased, so it swings through a corner instead of snapping.
    const cam = camera.current;
    if (!cam) camera.current = { x: target.x, y: target.y, heading: target.heading };
    else {
      cam.x = target.x;
      cam.y = target.y;
      const wanted = unwrap(cam.heading, target.heading);
      cam.heading += (wanted - cam.heading) * (Math.abs(wanted - cam.heading) > 1.2 ? 1 : 0.18);
    }
  }
  const cam = camera.current || { x: 0, y: 0, heading: 0 };
  const viewWidth = cameraMode === "tv" ? ZOOMS[2] : ZOOMS[zoom];

  // ---- auto-speed (HUD-1): what has just happened, read from the engine's events and your
  // cars' poses once per commit; the drop lands on the next frame of the clock.
  const seenEvents = useRef(null);
  const pitBefore = useRef(null);
  useEffect(() => {
    if (!seenEvents.current) seenEvents.current = new WeakSet();
    const fresh = visibleEvents.filter((event) => !seenEvents.current.has(event));
    fresh.forEach((event) => seenEvents.current.add(event));
    const inPit = Object.fromEntries(userCars.map((car) => [car.id, Boolean(rowOf[car.id] && !rowOf[car.id].out && rowOf[car.id].pose.inPit)]));
    const pitEntries = pitBefore.current ? userCars.filter((car) => inPit[car.id] && pitBefore.current[car.id] === false).map((car) => car.id) : [];
    pitBefore.current = inPit;
    const triggers = raceTriggers({ events: fresh, pitEntries, isUser: (id) => Boolean(byId[id]?.isUser) });
    if (triggers.length) auto.notify(triggers, tau.current);
    // HUD-4 replays: broadcast.json replay.triggers queue themselves on TV (live-view.json replay), one at a time.
    if (!in3D) return;
    const users = userCars.map((car) => car.id);
    if (LIVE_VIEW.replay.auto && LIVE_VIEW.replay.autoViews.includes(cameraMode)) {
      fresh.forEach((event) => {
        const at = event.type === "finished" && Number.isFinite(event.t) ? event.t : source.eventTime(event, leader?.car.id);
        replayQueue.current = enqueueReplay(replayQueue.current, { ...event, at }, { userIds: users, leaderId: leader?.car.id ?? null });
      });
    }
    if (replayRef.current) {
      if (replayFrameAt(replayRef.current.plan, replayClock.current).phase === "done") endReplay();
      return;
    }
    const pitOnAir = Boolean(director.current?.sequence?.active);
    const next = nextReplay(replayQueue.current, { tau: tau.current, buffer: replayBuffer, blocked: pitOnAir });
    replayQueue.current = next.queue;
    if (next.item) startReplay(planReplay(next.item, replayBuffer, { year: current.year, seed: current.seed ?? 0 }));
  });

  // The safety car runs a little ahead of the leader on the road.
  let safetyCar = null;
  if (scWindow && !scWindow.virtual && !scWindow.red && leader && !leader.pose.inPit) {
    const share = ((leader.pose.progress % 1) + 1) % 1;
    safetyCar = poseAt(circuit, share + 90 / circuit.length);
  }

  const stageCars = rows.map((row) => ({ car: row.car, code: code(row.car.name), pose: row.pose, row: row.out ? null : row }));

  // One audio frame per repaint (a no-op until the viewer turns the sound on).
  const audioFrame = {
    tau: tau.current,
    playing: playing && !done,
    mode: cameraMode,
    focusId: tvSubjectId,
    cars: rows.map((row) => ({ id: row.car.id, teamId: row.car.teamId, pose: row.pose })),
    wetness,
    events: visibleEvents,
    started: introDone.current,
    // AUD-3 reads the engine's start (§1.7) for the lights and the revs on the grid.
    start: startNow,
  };
  useEffect(() => {
    if (audio.enabled) audio.frame(audioFrame);
  });

  // ---- player calls: through the engine (the worker for a step race), RF-CMD-01/02
  const command = (name, ...callArgs) => {
    source.command(name, ...callArgs);
    repaint();
  };
  const skip = (fn) => () => {
    introDone.current = true;
    fn(tau.current);
    repaint();
  };

  // RF-CMD-01/02: only the orders the era has (engine/rules.js).
  const commands = commandsFor(rulesOf(current.era, current.year));
  const refuel = commands.pit.fuel;
  const energy = energyEra(rulesOf(current.era, current.year));
  const userTeam = userCars[0]?.teamId;
  // HUD-4: the lights lit now, from the engine's start (startLights.js), not a timer of the view.
  const lightsOn = startNow.phase === "out" ? 0 : startNow.lights;
  const lamps = startNow.lamps || 0;
  const teams = useMemo(() => {
    const seen = new Map();
    current.cars.forEach((car) => {
      if (!seen.has(car.teamId)) seen.set(car.teamId, { id: car.teamId, color: car.color, slot: car.boxSlot });
    });
    return [...seen.values()].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  }, [current.cars]);
  const focusName = focusRow?.car.name || "";

  // ---- the conditions panel
  const weatherClassOf = (w) => (w >= 0.55 ? 2 : w >= 0.2 ? 1 : 0);
  let change = t("Condiciones estables", "Settled conditions");
  // RF-HQ-02: the pit wall sees the forecast outlook (its timing error shrinks with the weather centre), not the future.
  const outlook = current.weather.outlook || current.weather.wetness;
  for (let lap = displayLap + 1; lap <= current.laps; lap += 1) {
    if (weatherClassOf(outlook[lap] ?? 0) !== weatherClassOf(wetness)) {
      const minutes = Math.max(1, Math.round(((lap - displayLap) * lapRef) / 60));
      change = (outlook[lap] ?? 0) > wetness ? t(`Lluvia en ${minutes} min`, `Rain in ${minutes} min`) : t(`Seca en ${minutes} min`, `Drying in ${minutes} min`);
      break;
    }
  }
  // HUD-4 status-strip-data: the local time (the official start time is the formation lap's, so the clock
  // runs through the procedure), and air, track, water and rubber as the engine has them (hudConditions.js).
  const raceStart = useMemo(() => raceStartOf(current.race), [current.race]);
  const clock = clockLabel(raceStart.startSec + procedureClock.current + Math.max(0, tau.current));
  const conditions = raceConditionsOf(current, Math.min(displayLap, current.laps), source.steps ? current.weatherNow : null);
  const trackTemp = conditions.trackC;

  // user-camera-lock: the camera arrows pick the camera view first, then step through its cameras.
  const onCamera = (step) => {
    if (view !== "camera") setView("camera");
    else setCameraPick((value) => cycle(cameraList, value, step));
  };
  const cameraLabel = view === "tv" ? `TV · ${directorLabel}` : cameraName(cameraPick);
  const towerOrder = rows.map((row) => ({ id: row.car.id, out: Boolean(row.out || row.pose.gone) }));

  // tower-modes (HUD-2): what each mode shows, read from the lap history up to the clock.
  const towerRules = rulesOf(current.era, current.year);
  const timedEvents = visibleEvents.map((event) => ({ type: event.type, carId: event.carId, otherId: event.otherId, at: event.at ?? source.eventTime(event, leader?.car.id) }));
  const ownBestSectors = (car) => {
    const best = [Infinity, Infinity, Infinity];
    (car.history || []).forEach((entry) => {
      if (entry.end > tau.current || !Array.isArray(entry.sectors)) return;
      entry.sectors.forEach((value, index) => {
        if (value < best[index]) best[index] = value;
      });
    });
    return best;
  };
  const raceBestSectors = towerMode === "sectors" ? current.cars.map(ownBestSectors).reduce((best, own) => best.map((value, index) => Math.min(value, own[index])), [Infinity, Infinity, Infinity]) : null;
  const towerRows = rows.map((row, index) => {
    const { car, pose } = row;
    const out = row.out;
    let value;
    if (out) value = STATUS[car.retireReason] ? STATUS[car.retireReason]() : t("Ab", "Out");
    else if (pose.inPit) value = t("En boxes", "In pit");
    else if (towerMode === "tyres") value = <Tyre compound={car.compound} age={car.tyreAge} size={18} />;
    else if (towerMode === "tyresPct") {
      const life = Math.round(Math.max(0, 1 - tyreLifeUsed(car, towerRules)) * 100);
      value = (
        <span className="lv-row__tyre">
          <Tyre compound={car.compound} size={16} /> {life}%
        </span>
      );
    } else if (towerMode === "lastLap") {
      const last = lastLapOf(car, tau.current);
      value = last !== null ? lapTime(last) : "—";
    } else if (towerMode === "sectors") {
      const sectors = lapSectorsOf(car, tau.current);
      value = sectors ? <SectorBars sectors={sectors} best={raceBestSectors} own={ownBestSectors(car)} /> : "—";
    } else if (towerMode === "stops") {
      const stops = stopsOf(car, tau.current);
      value = stops === 1 ? t("1 parada", "1 stop") : t(`${stops} paradas`, `${stops} stops`);
    } else if (index === 0) value = pose.finished ? t("Meta", "Finish") : towerMode === "gap" ? t("Líder", "Leader") : row.completed > 0 ? `${t("V", "L")}${row.completed + 1}` : t("Líder", "Leader");
    else if (row.lapsDown > 0) value = `+${row.lapsDown} ${t("V", "L")}`;
    else {
      const gap = towerMode === "gap" ? row.gap : row.interval;
      value = gap !== undefined ? `+${Math.max(0, gap).toFixed(3)}` : "";
    }
    return {
      id: car.id,
      position: index + 1,
      code: code(car.name),
      color: car.color,
      value,
      flags: {
        user: car.isUser,
        out,
        pit: pose.inPit && !out,
        focus: car.id === focusId,
        battle: (pose.duel ?? 0) > 0 || battles.some((entry) => entry.attacker === row || entry.defender === row),
        fastest: fastest?.carId === car.id,
        incident: !out && incidentOf(car.id, timedEvents, tau.current, pose),
        outLap: !out && raceOutLap(car, tau.current, pose),
        inLap: !out && raceInLap(car, pose),
        finished: HUD.tower.flags.finished && flagged(car),
      },
    };
  });

  const over = current.finished && tau.current >= raceEnd;

  // ---- the feed: radio and commentary, newest first (RF-CMD-03)
  const leaderId = leader?.car.id;
  const feedEntries = [
    ...current.radio
      .filter((message) => source.radioTime(message) <= tau.current)
      .slice(-8)
      .map((message, index) => ({ key: `r-${message.lap}-${message.kind}-${index}`, at: source.radioTime(message), lap: message.lap, kind: "radio", alert: false, text: radioText(career, message, names) })),
    ...recent.map((event, index) => ({
      key: `e-${event.lap}-${event.type}-${event.carId}-${index}`,
      at: event.at ?? source.eventTime(event, leaderId),
      lap: event.lap,
      kind: "race",
      alert: ALERTS.includes(event.type) || Boolean(byId[event.carId]?.isUser),
      text: commentary(event, names, current.track),
    })),
  ]
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
    .slice(0, 24);

  // ---- HUD-3 event banners: one at a time, at the race time the engine gives (hudBanners.js)
  const bannerQueue = useRef(null);
  if (!bannerQueue.current) bannerQueue.current = createBannerQueue();
  const leaderEnds = (leader?.car.history || []).filter((entry) => !entry.retired).map((entry) => entry.end);
  const drsPlan = useMemo(
    () => drsCalls(rulesOf(current.era, current.year), { laps: current.laps, wetness: current.weather.wetness, zones: current.track?.drs ?? 0, restartLap: current.restartLap || 0 }),
    [current.era, current.year, current.laps, current.weather.wetness, current.track, current.restartLap],
  );
  let banner = null;
  if (hudLive) {
    offerBanners(
      bannerQueue.current,
      [
        ...eventBanners({ events: visibleEvents, timeOf: (event) => event.at ?? source.eventTime(event, leaderId), positions, isUser: (id) => Boolean(byId[id]?.isUser) }),
        ...lapCallouts({ laps: current.laps, ends: leaderEnds }),
        ...drsBanners(drsPlan, { ends: leaderEnds }),
      ],
      tau.current,
    );
    banner = leaderFinished ? null : currentBanner(bannerQueue.current, now() / 1000, tau.current);
  }

  // ---- HUD-3 pit widget: your cars' stops from the engine's pit phase (pitTimer.js)
  const pitClocks = useRef(new Map());
  const pitEntries = userCars
    .map((car) => {
      const row = rowOf[car.id];
      if (!pitClocks.current.has(car.id)) pitClocks.current.set(car.id, createPitClock());
      const clockState = row && !row.out ? stepPitClock(pitClocks.current.get(car.id), row.pose, tau.current, now() / 1000) : null;
      return clockState ? { id: car.id, code: code(car.name), position: row.position, clock: clockState } : null;
    })
    .filter(Boolean);
  const pitCar = pitDialogId ? byId[pitDialogId] : null;
  const pitRow = pitCar ? rowOf[pitCar.id] : null;
  const closePitDialog = () => setPitDialogId(null);
  // A car that retires or finishes takes its dialog (and the hold) with it.
  const pitGone = Boolean(pitDialogId && (!pitCar || pitCar.status !== "running"));
  useEffect(() => {
    if (pitGone) setPitDialogId(null);
  }, [pitGone]);

  // ---- the flag state over the picture (RF-SIM-10): colour and words, never colour alone
  const flag = redFlag
    ? { kind: "red", label: t("Bandera roja", "Red flag") }
    : scWindow
      ? scWindow.virtual
        ? { kind: "vsc", label: t("Coche de seguridad virtual", "Virtual safety car") }
        : { kind: "sc", label: t("Coche de seguridad", "Safety car") }
      : leaderFinished
        ? { kind: "chequered", label: t("Bandera a cuadros", "Chequered flag") }
        : yellows.length > 0
          ? yellowFlag(circuit, yellows)
          : !introDone.current
            ? { kind: "session", label: startNow.phase === "formation" ? t("Vuelta de formación", "Formation lap") : t("Salida", "Start") }
            : { kind: "green", label: t("Bandera verde", "Green flag") };

  // HUD-4 replays: "watch replay" on a banner whose moment the buffer still holds (3D only: Race3D records it).
  const span = in3D ? replaySpan(replayBuffer) : null;
  const canReplay = (item) => Boolean(HUD.banners.replay.enabled && span && !replay && Number.isFinite(item?.at) && item.at >= span.from && item.at <= span.to);
  const onBannerReplay = banner && canReplay(banner)
    ? (shown) => startReplay(planReplay({ trigger: BANNER_REPLAY[shown.kind] || shown.kind, event: { type: shown.kind, carId: shown.carId, otherId: shown.otherId }, at: shown.at }, replayBuffer, { year: current.year, seed: current.seed ?? 0 }))
    : null;
  const chequeredUp = leaderFinished && winnerFlagAt !== null && tau.current < winnerFlagAt + HUD.finish.chequeredBannerSec;

  const eraNotes = [commands.drs && "DRS", commands.activeAero && t("Aero activa", "Active aero"), energy === "kers" ? "KERS" : energy ? "ERS" : null, refuel && t("Repostaje", "Refuelling")].filter(Boolean);
  const orderOptions = commands.teamOrders;
  const ORDER_LABEL = { free: t("Libres", "Race"), hold: t("Mantener", "Hold"), swap: t("Intercambiar", "Swap") };

  return (
    <div className={`lv lv--race${in3D ? " is-3d" : ""}${replay ? " is-replay" : ""}`} data-engine={source.kind} data-start={startNow.phase} data-testid="live-race">
      <StatusStrip flag={flag} clock={clock} airTemp={conditions.airC} rainChance={current.weather.forecast ?? 0} change={change} trackTemp={trackTemp} wetness={wetness} waterMm={conditions.waterMm} rubber={conditions.rubber} notes={[current.year, ...eraNotes].join(" · ")} />

      <div className="lv-stage">
        {in3D ? (
          <React.Suspense fallback={<div className="lv-loading">{t("Cargando el circuito en 3D…", "Loading the circuit in 3D…")}</div>}>
            <Race3D
              circuit={circuit}
              year={current.year}
              cars={stageCars}
              focusId={tvSubjectId}
              mode={cameraMode}
              wet={wetness > 0.2}
              lights={lightsOn}
              safetyCarOn={Boolean(scWindow && !scWindow.virtual && !scWindow.red)}
              clock={tau}
              sample={source.sample}
              teams={teams}
              onPick={setFocusId}
              labels={{ near: t("Retransmisión en 3D", "3D broadcast") }}
              seed={current.seed}
              replayBuffer={replayBuffer}
              replay={replay ? { plan: replay.plan, clock: replayClock } : null}
            />
          </React.Suspense>
        ) : (
          <RaceStage
            circuit={circuit}
            year={current.year}
            cars={stageCars}
            camera={{ mode: cameraMode === "map" ? "map" : cameraMode === "tv" ? "tv" : "follow", x: cam.x, y: cam.y, heading: cam.heading, rotate: cameraMode !== "tv", view: viewWidth }}
            wet={wetness > 0.2}
            teams={teams}
            safetyCar={safetyCar}
            focusId={tvSubjectId}
            onPick={setFocusId}
            labels={{ map: t("Mapa del circuito", "Circuit map"), near: t("Cámara cenital", "Overhead camera"), box: "Box", sc: t("Coche de seguridad", "Safety car") }}
          />
        )}
        {wetness > 0.2 && !in3D && <div className="lv-rain" style={{ opacity: Math.min(0.85, wetness + 0.15) }} aria-hidden="true" />}
        {!introDone.current && !in3D && lamps > 0 && (
          <div className="lv-lights" role="img" aria-label={t(`Semáforo de salida: ${lightsOn} de ${lamps} luces`, `Start lights: ${lightsOn} of ${lamps} lit`)} data-procedure={startNow.procedure || undefined}>
            {Array.from({ length: lamps }, (_, index) => (
              <span key={index} className={index < lightsOn ? "is-on" : ""} />
            ))}
          </div>
        )}
        <div className="lv-overlay">
          {!replay && introDone.current && tau.current < HUD.start.lightsOutBannerSec && (
            <div className="lv-banner is-go">{startNow.procedure === "redGreen" ? t("Luz verde", "Green light") : t("Se apagan los semáforos", "Lights out")}</div>
          )}
          {!replay && chequeredUp && (
            <div className="lv-banner">
              <IconFlag size={16} />
              {t("Bandera a cuadros", "Chequered flag")} · {leader?.car.name}
            </div>
          )}
          {!replay && <EventBanner banner={banner} names={names} onReplay={onBannerReplay} />}
        </div>
        {hudLive && !replay && <PitTimer entries={pitEntries} />}
        <SpeedCallout callout={auto.callout} reasonText={reasonText} />
        {replay && <ReplayOverlay plan={replay.plan} elapsed={replayClock.current} names={names} onSkip={endReplay} />}
        {hudLive && !replay && !leaderFinished && battles[0] && cameraMode !== "tv" && (
          <div className="lv-chip">
            <i aria-hidden="true" />
            {t(`Lucha por P${battles[0].position}`, `Battle for P${battles[0].position}`)} · <b>{code(battles[0].attacker.car.name)}</b> → <b>{code(battles[0].defender.car.name)}</b> · {battles[0].gap.toFixed(1)} s
          </div>
        )}
      </div>

      <TimingTower
        label={t("Torre de tiempos", "Timing tower")}
        title={title}
        subtitle={
          <>
            {t("Vuelta", "Lap")} <b>{displayLap}</b>/{current.laps}
          </>
        }
        modes={{ value: towerMode, onChange: setTowerMode, options: towerModes.map((value) => ({ value, label: towerModeName(value) })) }}
        rows={towerRows}
        onPick={setFocusId}
        flag={flag}
      />

      <section className="lv-cards" aria-label={t("Órdenes", "Orders")}>
        {userCars.map((car, index) => (
          <React.Fragment key={car.id}>
            {index === 1 && (
              <div className="lv-cards__mid">
                {!current.finished && !commands.teamOrdersBanned && (
                  <div className="lv-orders__team">
                    <span>{t("Órdenes de equipo", "Team orders")}</span>
                    <Segmented label={t("Órdenes de equipo", "Team orders")} value={current.teamOrders[userTeam] || "free"} onChange={(value) => command("setTeamOrder", userTeam, value)} options={orderOptions.map((value) => ({ value, label: ORDER_LABEL[value] }))} />
                  </div>
                )}
              </div>
            )}
            <DriverCard
              car={car}
              row={rowOf[car.id]}
              state={current}
              commands={commands}
              energy={energy}
              command={command}
              steps={source.steps}
              pitThisLap={(((rowOf[car.id]?.pose?.progress ?? 0) % 1) + 1) % 1 < circuit.pit.entry}
              focused={focusId === car.id}
              onFocus={() => setFocusId(car.id)}
              onPitDialog={() => setPitDialogId(car.id)}
              flag={HUD.finish.foldPanel && flagged(car) ? { pos: flagOf[car.id]?.pos ?? rowOf[car.id]?.position ?? car.position } : null}
            />
          </React.Fragment>
        ))}
      </section>

      {pitCar && (
        <PitDialog
          open={Boolean(pitCar && pitCar.status === "running")}
          onClose={closePitDialog}
          car={pitCar}
          state={current}
          rules={towerRules}
          commands={commands}
          circuit={circuit}
          share={pitRow ? (((pitRow.pose.progress ?? 0) % 1) + 1) % 1 : null}
          position={pitRow && !pitRow.out ? pitRow.position : null}
          tyreLife={Math.max(0, 1 - tyreLifeUsed(pitCar, towerRules))}
          pitThisLap={(((pitRow?.pose?.progress ?? 0) % 1) + 1) % 1 < circuit.pit.entry}
          defaultFuel={pitFuelDefault(current, pitCar)}
          maxFuel={Math.max(1, current.laps - current.lap + 1)}
          onConfirm={(compound, options) => {
            command("requestPit", pitCar.id, compound, options);
            closePitDialog();
          }}
          onCancelCall={() => {
            command("cancelPit", pitCar.id);
            closePitDialog();
          }}
        />
      )}

      <aside className="lv-side" aria-label={t("Pista", "Track")}>
        {cameraMode !== "map" && <MiniMap circuit={circuit} cars={stageCars} focusId={tvSubjectId} label={t("Minimapa", "Mini map")} />}
        <Feed entries={feedEntries} />
      </aside>

      <PlaybackBar
        playing={playing}
        onPlay={() => setPlaying((value) => !value)}
        disabled={done}
        speeds={speedsOf()}
        speed={speed}
        onSpeed={auto.choose}
        autoSpeed={{ enabled: auto.enabled, onToggle: auto.setEnabled }}
        held={auto.held}
        views={{ value: view, onChange: setView, options: viewsOf().map((value) => ({ value, label: viewName(value) })) }}
        car={{ label: code(focusName), onStep: (step) => setFocusId((id) => stepCar(towerOrder, id, step)) }}
        cameraLabel={cameraLabel}
        onCamera={onCamera}
      >
        <button type="button" className="mn-btn mn-btn--sm" onClick={skip(source.next)} aria-label={t("Siguiente evento", "Next event")} title={t("Saltar al siguiente evento", "Skip to the next event")} disabled={over}>
          <IconNextEvent size={16} />
          <span className="wk-hide-md">{t("Siguiente evento", "Next event")}</span>
        </button>
        <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={skip(source.oneLap)} aria-label={t("Una vuelta", "One lap")} title={t("Una vuelta", "One lap")} disabled={over}>
          <IconLap size={16} />
          <span className="wk-hide-md">{t("Una vuelta", "One lap")}</span>
        </button>
        <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={skip(source.toFlag)} disabled={over}>
          <IconFastForward size={16} />
          {t("Al final", "To the flag")}
        </button>
        <SoundControl audio={audio} />
      </PlaybackBar>
    </div>
  );
}

/** The tyre's heat against the engine's own window (race-eras.json tyres.thermal, 0..1 scale; RNF-07). */
const THERMAL = RACE_ERAS.tyres.thermal;
const TEMP_LABEL = (temp) => (temp < THERMAL.coldBelow ? { label: t("Fríos", "Cold"), tone: "info" } : temp > THERMAL.overheatAbove ? { label: t("Sobrecalentados", "Overheating"), tone: "neg" } : { label: t("En ventana", "In window"), tone: "pos" });

/** RF-CMD-02: the next planned stop of a car (one already made is not "next"). */
const nextStopOf = (state, car) => car.plan.stops.find((lap) => lap >= state.lap && !(car.lastPitLap >= lap));

/** A stop called now replaces the next planned one: fuel (laps) to the stop after it, or to the flag. */
const pitFuelDefault = (state, car) => {
  const remaining = Math.max(0, state.laps - state.lap);
  const after = car.plan.stops.find((lap) => lap > (nextStopOf(state, car) ?? state.lap));
  return Math.max(1, Math.min(remaining + 1, (after ?? state.laps) - state.lap));
};

/** The panel's tab names (HUD-3 driver-panel-units, hud.json driverPanel.tabs). */
const PANEL_TAB = {
  status: () => t("Estado", "Status"),
  tactics: () => t("Tácticas", "Tactics"),
  telemetry: () => t("Telemetría", "Telemetry"),
  pit: () => t("Boxes", "Pit"),
};

/**
 * One of the player's cars on the pit wall: position and name, then the panel in tabs
 * (HUD-3 driver-panel-units, hud.json driverPanel.tabs):
 *   status     tyre life in % and its heat against the engine's window (°C only when the
 *              engine gives car.tyreC, SIM-6), fuel margin in laps and kg (no margin in a
 *              refuelling era), the battery in % (only when the era has KERS or ERS)
 *   tactics    every order the era allows (RF-CMD-01, commandsFor): pace, mixture, energy
 *              mode, and defence and overtaking risk in a step race
 *   telemetry  speed, gear, rpm, throttle and brake from the step engine's pose (RF-SIM-01/02)
 *   pit        the plan (delay or drop the next stop), the stop window when the strategist
 *              publishes one (RF-SIM-13), the two-compound rule's count
 * Under the tabs the stop call is always there (RF-CMD-02: compounds, or fuel only when tyres
 * may not be changed) and "Pit options" opens the pit dialog (PitDialog, which pauses the
 * session). Every order goes through `command` (the race worker for a step race).
 */
function DriverCard({ car, row, state, commands, energy, command, steps, pitThisLap, focused, onFocus, onPitDialog, flag = null }) {
  const PANEL = HUD.driverPanel;
  const tabs = PANEL.tabs.filter((tab) => tab !== "telemetry" || steps);
  const [tabPick, setTab] = useState(PANEL.defaultTab);
  const tab = tabs.includes(tabPick) ? tabPick : tabs[0];
  const [fuelLoad, setFuelLoad] = useState(null);
  // HUD-4: past its own chequered flag (on the view's clock, not the engine's) the panel folds to the result.
  const running = car.status === "running" && !flag;
  const rules = rulesOf(state.era, state.year);
  const refuel = commands.pit.fuel;
  const life = Math.max(0, 1 - tyreLifeUsed(car, rules));
  const temp = TEMP_LABEL(car.tyreTemp ?? 0.5);
  const tyreC = car.tyreC && Number.isFinite(car.tyreC.surface) ? car.tyreC : null;
  const remaining = Math.max(0, state.laps - state.lap);
  const burn = mixEffect(car.fuelMode).burn;
  const fuelMargin = refuel ? null : car.fuel / burn - remaining;
  // RF-SIM-04: kg on board - live from the step sim, or the ledger (laps of fuel x kg a lap).
  const kgPerLap = state.fuelSpec?.kgPerLap ?? null;
  const fuelKg = car.fuelLive ? car.fuelLive.kg : kgPerLap ? car.fuel * kgPerLap : null;
  const marginKg = fuelMargin !== null && kgPerLap ? fuelMargin * burn * kgPerLap : null;
  // RF-SIM-05: the store in MJ and whether the deployment is clipping now (step race only).
  const store = car.energyLive;
  const position = row && !row.out ? row.position : car.position;
  const pose = row?.pose || {};
  const drs = running && drsOpen(rules, { lap: state.lap, wetness: state.weather.wetness[Math.min(state.lap, state.laps)] ?? 0, zones: state.track?.drs ?? 0, restartLap: state.restartLap || 0, gapAhead: car.gapAhead });
  const paceKeys = commands.pace.filter((key) => MODE[key]);
  const mixKeys = commands.fuelMix.filter((key) => MIX[key]);
  const energyModes = commands.energy.filter((key) => ERS[key]);
  const hasBattery = car.battery !== null && car.battery !== undefined && energyModes.length > 0;
  const nextStop = nextStopOf(state, car);
  const nextCompound = car.plan.compounds[Math.min(car.plan.compounds.length - 1, (car.stint ?? 0) + 1)];
  const defaultFuel = pitFuelDefault(state, car);
  const stopWindow = car.plan.window && Number.isFinite(car.plan.window.open) ? car.plan.window : null;
  const mandatory = rules.tyres?.mandatoryDryCompounds ?? 0;
  const dryUsed = new Set((car.compoundsUsed || []).concat(car.compound ? [car.compound] : []).filter((value) => value && value !== "inter" && value !== "wet")).size;
  const lifeClass = life < PANEL.tyreLife.badBelow ? "is-bad" : life < PANEL.tyreLife.warnBelow ? "is-warn" : "";
  const percent = (value) => (Number.isFinite(value) ? `${Math.round(value * 100)}%` : "—");
  return (
    <section className={`lv-card${running ? "" : " is-out"}${flag ? " is-folded" : ""}${focused ? " is-focus" : ""}`} aria-label={car.name}>
      <button type="button" className="lv-card__head" onClick={onFocus}>
        <span className="lv-card__pos">{position}</span>
        <i className="lv-card__stripe" style={{ "--stripe": readableOn(car.color) }} aria-hidden="true" />
        <span className="lv-card__name">{car.name}</span>
        {commands.drs ? <span className={`lv-flagword${drs ? " is-on" : ""}`}>DRS</span> : commands.activeAero ? <span className="lv-flagword">{t("Aero", "Aero")}</span> : <span />}
        <span className="lv-card__lap">{car.lastLap ? lapTime(car.lastLap) : ""}</span>
      </button>
      {running ? (
        <>
          <div className="lv-card__tabs">
            <Tabs label={t(`Panel de ${car.name}`, `${car.name} panel`)} value={tab} onChange={setTab} options={tabs.map((value) => ({ value, label: PANEL_TAB[value]() }))} />
          </div>
          {tab === "status" && (
            <>
              <div className="lv-ctl">
                <span>{t("Neumático", "Tyre")}</span>
                <div className="lv-ctl__value" title={temp.label}>
                  <Tyre compound={car.compound} age={car.tyreAge} size={20} />
                  <b className={lifeClass}>{Math.round(life * 100)}%</b>
                  {tyreC ? (
                    <small>
                      {Math.round(tyreC.surface)} °C{Number.isFinite(tyreC.carcass) ? ` · ${t("carcasa", "carcass")} ${Math.round(tyreC.carcass)} °C` : ""}
                    </small>
                  ) : (
                    <Meter value={Math.round((car.tyreTemp ?? 0.5) * 100)} tone={temp.tone} label={t("Temperatura", "Temperature")} />
                  )}
                  <small>{temp.label}</small>
                </div>
              </div>
              <div className="lv-ctl">
                <span>{t("Combustible", "Fuel")}</span>
                <div className="lv-ctl__value">
                  {fuelMargin !== null ? (
                    <b className={fuelMargin < 0 ? "is-bad" : fuelMargin < PANEL.fuel.warnLaps ? "is-warn" : "is-good"}>
                      {fuelMargin >= 0 ? "+" : ""}
                      {fuelMargin.toFixed(2)} {t("v", "laps")}
                      {marginKg !== null ? ` · ${marginKg >= 0 ? "+" : ""}${marginKg.toFixed(1)} kg` : ""}
                    </b>
                  ) : (
                    <b>
                      {Math.max(0, Math.round(car.fuel))} {t("v", "laps")}
                    </b>
                  )}
                  <Meter value={Math.round(Math.min(1, car.fuel / Math.max(1, refuel ? 30 : state.fuelStart)) * 100)} tone="accent" label={t("Combustible", "Fuel")} />
                  {fuelKg !== null && <small>{fuelKg.toFixed(1)} kg</small>}
                  {refuel && <small>{t("Repostaje en cada parada", "Refuel at every stop")}</small>}
                </div>
              </div>
              {hasBattery ? (
                <div className="lv-ctl">
                  <span>{energy === "kers" ? "KERS" : "ERS"}</span>
                  <div className="lv-ctl__value">
                    <b>{Math.round(store ? store.share * 100 : car.battery)}%</b>
                    <small>
                      {ERS[car.ersMode] ? ERS[car.ersMode]() : ""}
                      {store ? ` · ${store.soc.toFixed(2)} MJ${store.clipping ? ` · ${t("recorte", "clipping")}` : store.harvestKw > 0 ? ` · ${t("recarga", "harvest")}` : store.deployKw > 0 ? ` · ${t("despliegue", "deploy")}` : ""}` : ""}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="lv-ctl">
                  <span>{t("Plan", "Plan")}</span>
                  <div className="lv-ctl__value">
                    <b>
                      {car.stops} {t("paradas", "stops")}
                    </b>
                    <small>{car.plan.stops.filter((lap) => lap > state.lap).map((lap) => `${t("V", "L")}${lap}`).join(" · ") || "—"}</small>
                  </div>
                </div>
              )}
            </>
          )}
          {tab === "tactics" && (
            <>
              <div className="lv-ctl">
                <span>{t("Ritmo", "Pace")}</span>
                <Dots label={t("Ritmo", "Pace")} value={car.mode} onChange={(mode) => command("setMode", car.id, mode)} options={paceKeys.map((mode) => ({ value: mode, label: MODE[mode]() }))} />
              </div>
              {mixKeys.length > 0 && (
                <div className="lv-ctl">
                  <span>{t("Mezcla", "Fuel mix")}</span>
                  <Dots label={t("Mezcla", "Fuel mix")} value={car.fuelMode} onChange={(mix) => command("setMix", car.id, mix)} options={mixKeys.map((mix) => ({ value: mix, label: MIX[mix]() }))} />
                </div>
              )}
              {hasBattery && (
                <div className="lv-ctl">
                  <span>{energy === "kers" ? "KERS" : "ERS"}</span>
                  <Dots label={energy === "kers" ? "KERS" : "ERS"} value={car.ersMode} onChange={(mode) => command("setErs", car.id, mode)} options={energyModes.map((mode) => ({ value: mode, label: ERS[mode]() }))} />
                </div>
              )}
              {steps && (
                <>
                  <div className="lv-ctl">
                    <span>{t("Defensa", "Defence")}</span>
                    <Dots label={t("Defensa", "Defence")} value={car.defence} onChange={(style) => command("setDefence", car.id, style)} options={DEFENCE_KEYS.map((style) => ({ value: style, label: DEFENCE[style]() }))} />
                  </div>
                  <div className="lv-ctl">
                    <span>{t("Ataque", "Attack")}</span>
                    <Dots label={t("Riesgo al adelantar", "Overtaking risk")} value={car.overtakeRisk} onChange={(level) => command("setOvertakeRisk", car.id, level)} options={RISK_KEYS.map((level) => ({ value: level, label: RISK[level]() }))} />
                  </div>
                </>
              )}
            </>
          )}
          {tab === "telemetry" && (
            <dl className="lv-tele" aria-label={t("Telemetría", "Telemetry")}>
              <div>
                <dt>{t("Velocidad", "Speed")}</dt>
                <dd>{Number.isFinite(pose.v) ? `${Math.round(pose.v * 3.6)} km/h` : "—"}</dd>
              </div>
              <div>
                <dt>{t("Marcha", "Gear")}</dt>
                <dd>{Number.isFinite(pose.gear) && pose.gear > 0 ? pose.gear : "—"}</dd>
              </div>
              <div>
                <dt>rpm</dt>
                <dd>{Number.isFinite(pose.rpm) && pose.rpm > 0 ? pose.rpm.toLocaleString() : "—"}</dd>
              </div>
              <div>
                <dt>{t("Acelerador", "Throttle")}</dt>
                <dd>{percent(pose.throttle)}</dd>
              </div>
              <div>
                <dt>{t("Freno", "Brake")}</dt>
                <dd>{percent(pose.brake)}</dd>
              </div>
              {commands.drs && (
                <div>
                  <dt>DRS</dt>
                  <dd>{drs ? t("En rango", "In range") : t("No", "No")}</dd>
                </div>
              )}
            </dl>
          )}
          {tab === "pit" && (
            <>
              {nextStop !== undefined && !car.pitRequest ? (
                <div className="lv-box lv-box--plan">
                  <span>{t("Plan", "Plan")}</span>
                  <small>
                    {t(`Parada prevista V${nextStop}`, `Planned stop L${nextStop}`)}
                    {nextCompound && commands.pit.tyres ? ` · ${COMPOUND[nextCompound]()}` : ""}
                  </small>
                  <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => command("delayStop", car.id)} disabled={nextStop + 1 >= state.laps}>
                    {t("Retrasar 1 v", "Delay 1 lap")}
                  </button>
                  <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => command("skipStop", car.id)}>
                    {t("Quitar", "Drop")}
                  </button>
                </div>
              ) : (
                <div className="lv-box lv-box--plan">
                  <span>{t("Plan", "Plan")}</span>
                  <small>{car.pitRequest ? t("Parada pedida", "Stop called") : t("Sin más paradas previstas", "No more planned stops")}</small>
                </div>
              )}
              {stopWindow && (
                <div className="lv-ctl">
                  <span>{t("Ventana", "Window")}</span>
                  <div className="lv-ctl__value">
                    <b>
                      {t("V", "L")}
                      {stopWindow.open}–{stopWindow.close}
                    </b>
                    {Number.isFinite(stopWindow.optimal) && <small>{t(`óptima V${stopWindow.optimal}`, `optimal L${stopWindow.optimal}`)}</small>}
                  </div>
                </div>
              )}
              {mandatory >= 2 && commands.pit.tyres && (
                <div className="lv-ctl">
                  <span>{t("Compuestos", "Compounds")}</span>
                  <div className="lv-ctl__value">
                    <b className={dryUsed < mandatory ? "is-warn" : "is-good"}>
                      {Math.min(dryUsed, mandatory)}/{mandatory}
                    </b>
                    <small>{t("en seco", "in the dry")}</small>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="lv-box">
            {car.pitRequest ? (
              <button type="button" className="mn-btn mn-btn--sm lv-box__called" onClick={() => command("cancelPit", car.id)}>
                {`${pitThisLap ? t("Box esta vuelta", "Box this lap") : t("Box la próxima vuelta", "Box next lap")} · ${commands.pit.tyres ? COMPOUND[car.pitRequest.compound || car.compound]() : t("combustible", "fuel")}${Number.isFinite(car.pitRequest.fuel) ? ` · ${car.pitRequest.fuel} v` : ""} · ${t("cancelar", "cancel")}`}
              </button>
            ) : HUD.pitDialog.quickCall && commands.pit.tyres ? (
              <>
                <span>{pitThisLap ? t("Box esta vuelta", "Box this lap") : t("Box la próxima", "Box next lap")}</span>
                {commands.pit.compounds.map((compound) => (
                  <button type="button" key={compound} className="lv-box__tyre" onClick={() => command("requestPit", car.id, compound, refuel ? { fuel: fuelLoad ?? defaultFuel, replace: true } : { replace: true })} aria-label={t(`Parar y montar ${COMPOUND[compound]().toLowerCase()}`, `Box for ${COMPOUND[compound]()}`)} title={t(`Box: ${COMPOUND[compound]()}`, `Box: ${COMPOUND[compound]()}`)}>
                    <Tyre compound={compound} size={22} />
                  </button>
                ))}
              </>
            ) : HUD.pitDialog.quickCall ? (
              <>
                <span>{t("Parada", "Pit stop")}</span>
                <button type="button" className="mn-btn mn-btn--sm" onClick={() => command("requestPit", car.id, car.compound, refuel ? { fuel: fuelLoad ?? defaultFuel, replace: true } : { replace: true })}>
                  {pitThisLap ? t("Box esta vuelta: combustible", "Box this lap: fuel") : t("Box la próxima: combustible", "Box next lap: fuel")}
                </button>
              </>
            ) : null}
            {refuel && !car.pitRequest && HUD.pitDialog.quickCall && (
              <div className="lv-step" role="group" aria-label={t("Combustible a cargar", "Fuel to load")}>
                <button type="button" className="mn-icon-btn" onClick={() => setFuelLoad(Math.max(1, (fuelLoad ?? defaultFuel) - 1))} aria-label={t("Menos combustible", "Less fuel")}>
                  −
                </button>
                <b>
                  {fuelLoad ?? defaultFuel}
                  <small> v</small>
                </b>
                <button type="button" className="mn-icon-btn" onClick={() => setFuelLoad(Math.min(remaining + 1, (fuelLoad ?? defaultFuel) + 1))} aria-label={t("Más combustible", "More fuel")}>
                  +
                </button>
              </div>
            )}
            {onPitDialog && (
              <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={onPitDialog}>
                {t("Opciones de parada", "Pit options")}
              </button>
            )}
            {car.issue ? <em className="lv-box__issue">{t("Problema", "Issue")} +{car.issue.toFixed(1)} s</em> : null}
          </div>
        </>
      ) : (
        <p className="lv-card__status" data-folded={flag ? "" : undefined}>
          {flag ? (
            <>
              <IconFlag size={14} /> {t(`Bandera a cuadros · P${flag.pos}`, `Chequered flag · P${flag.pos}`)}
            </>
          ) : car.status === "finished" ? (
            t("Terminado", "Finished")
          ) : STATUS[car.retireReason] ? (
            STATUS[car.retireReason]()
          ) : (
            ""
          )}
        </p>
      )}
    </section>
  );
}
