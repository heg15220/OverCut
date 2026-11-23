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
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  cancelPit, commandsFor, delayStop, drsOpen, energyEra, requestPit, rulesOf, runToFinish, setErs, setMix, setMode, setTeamOrder, skipStop,
  stepLap, tyreLifeUsed,
} from "../engine/race";
import { DEFENCE_KEYS, RISK_KEYS } from "../engine/sim";
import { applyTick, createRaceClient, mirrorOf } from "../engine/worker/raceClient";
import { circuitFor } from "../engine/venue";
import { poseAt } from "../engine/trackGeometry";
import { useManager } from "./context";
import { Meter, Segmented, Tyre, readableOn } from "./atoms";
import { Dots, Feed, PlaybackBar, StatusStrip, TimingTower } from "./Broadcast";
import { IconFastForward, IconFlag } from "./icons";
import { IconLap, IconNextEvent } from "./icons";
import "./styles/weekend.css";
import { COMPOUND, DEFENCE, ERS, MIX, MODE, RISK, STATUS, commentary, duelEvent, lapTime, radioText, t } from "./texts";
import RaceStage, { MiniMap } from "./RaceStage";
import { canRender3D } from "../three/support";
import { useRaceAudio } from "../three/audio";
import SoundControl from "../three/audio/SoundControl";

import { battlesIn, carAt, computedUntil, eventTime, leaderLap, liveCarAt, liveSafetyCarWindows, liveYellowsAt, raceEndTime, safetyCarWindows, standingsAt } from "./raceClock";

// three.js is only fetched when a race is watched in 3D, so the rest of OverCut stays light.
const Race3D = React.lazy(() => import("../three/Race3D"));

/** RF-CMD-04: simulation speeds against real time; ×1 is a real lap. */
export const SPEEDS = [1, 2, 4, 8, 16];

/** Overhead camera widths, in metres of track across the screen. */
const ZOOMS = [70, 130, 280];

/** Seconds of the start-lights sequence before the race clock runs. */
const INTRO_SECONDS = 4.6;

/** Three-letter timing code from the surname ("Nelson Piquet Jr." is PIQ, not JR.). */
const code = (name = "") => {
  const parts = name.split(" ").filter((part) => part && !/^(jr|sr|ii|iii)\.?$/i.test(part));
  return (parts[parts.length - 1] || name).replace(/[^\p{L}]/gu, "").slice(0, 3).toUpperCase();
};

/** Camera names for the 3D broadcast. */
const CAMERA_NAME = {
  tv: () => "TV",
  chase: () => t("Persecución", "Chase"),
  drone: () => t("Dron", "Drone"),
  heli: () => "Helicam",
  tcam: () => "T-cam",
  visor: () => t("Visor", "Visor"),
  nose: () => t("Morro", "Nose"),
  tcamRear: () => t("T-cam trasera", "Rear T-cam"),
  follow: () => t("Cenital", "Overhead"),
};

/** The 3D cameras in the order the arrows step through them, as F1 Manager offers its views. */
const CAMERAS_3D = ["tv", "chase", "drone", "heli", "tcam", "visor", "nose", "tcamRear", "map"];

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

/** Seconds of the day as hh:mm:ss, for the broadcast clock. */
export const clockOf = (seconds) => {
  const whole = Math.floor(seconds);
  return [Math.floor(whole / 3600) % 24, Math.floor(whole / 60) % 60, whole % 60].map((v) => String(v).padStart(2, "0")).join(":");
};

const cycle = (list, value, step) => list[(list.indexOf(value) + step + list.length) % list.length];

const TOWER_MODES = ["interval", "gap", "tyres"];

/** RF-CMD-04 "saltar al siguiente evento": what the skip button stops at. */
/** Feed lines worth a second look: race control and retirements. */
const ALERTS = ["sc", "vsc", "sc-in", "red", "restart", "dnf", "contact", "penalty", "investigation", "rain"];

const NEXT_TYPES = ["pass", "pit", "dnf", "sc", "vsc", "sc-in", "rain", "lead", "contact", "mistake", "flag", "yellow", "red", "restart", "penalty", "swap"];

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
  const source = {
    kind: "quick",
    current: state,
    circuit,
    lapRef,
    steps: false,
    limit: (tau) => tau,
    advance: (tau) => ensure(tau),
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
      // Ask for a chunk of race once less than half a chunk is left ahead of the clock.
      const chunk = Math.max(0.5, speed * 0.25);
      if (source.requested - tau > chunk / 2) return;
      const target = Math.max(source.requested, tau) + chunk;
      client.step(target - source.requested);
      source.requested = target;
    },
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
        if (view) applyTick(mirror, view);
        current.replied(reply);
      },
    });
    client.create(args);
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
  const [speed, setSpeed] = useState(source.steps ? 4 : 8);
  const has3D = useMemo(() => canRender3D(), []);
  const [cameraMode, setCameraMode] = useState(() => (canRender3D() ? "tv" : "follow"));
  const in3D = has3D && cameraMode !== "map";
  const in3DRef = useRef(in3D);
  in3DRef.current = in3D;
  const zoom = 1;
  const [focusId, setFocusId] = useState(userCars[0]?.id ?? current.cars[0]?.id);
  const [towerMode, setTowerMode] = useState("interval");
  // RF-3D-04 sound: engines per car and era, spatial mix per camera, ambience (three/audio).
  const audio = useRaceAudio({ seed: current.seed ?? `${current.year}`, year: current.year });

  const tau = useRef(0);
  const intro = useRef(0);
  const introDone = useRef(false);
  const camera = useRef(null);
  const director = useRef({ id: null, until: 0 });
  const finishedRef = useRef(false);
  const playRef = useRef({ playing, speed });
  playRef.current = { playing, speed };
  const repaint = () => setFrame((value) => (value + 1) % 1e9);

  // Skips (next event, one lap, to the flag) land here, whenever the engine answers.
  source.jump = (time) => {
    introDone.current = true;
    tau.current = Math.max(tau.current, time);
    repaint();
  };

  // The clock: real time times the playback speed, after the start lights; the engine
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
      const { playing: isPlaying, speed: rate } = playRef.current;
      if (isPlaying && !finishedRef.current) {
        if (!introDone.current) {
          intro.current += dt;
          if (intro.current >= INTRO_SECONDS) introDone.current = true;
        } else {
          tau.current = source.limit(tau.current + dt * rate);
        }
      }
      if (introDone.current && !finishedRef.current) source.advance(tau.current, rate);
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
  }, [source]);

  const raceEnd = raceEndTime(current);
  const done = tau.current >= raceEnd + 2;

  // Hand the race back once everyone is home. Keyed on `done` alone: the view
  // re-renders every frame, and a timer cleared on each render would never fire.
  const finish = useRef(onFinished);
  finish.current = onFinished;
  useEffect(() => {
    if (!done) return undefined;
    finishedRef.current = true;
    const id = setTimeout(() => finish.current(source.finalState()), 1800);
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
  if (cameraMode === "tv") {
    const realNow = now() / 1000;
    if (realNow > director.current.until || !battles.some((battle) => battle.attacker.car.id === director.current.id)) {
      const pick = battles.find((battle) => battle.attacker.car.isUser || battle.defender.car.isUser) || battles[0];
      director.current = { id: pick?.attacker.car.id || leader?.car.id, until: realNow + 7 };
    }
    const battle = battles.find((entry) => entry.attacker.car.id === director.current.id);
    const subject = rowOf[director.current.id] || leader;
    if (battle) {
      target = { x: (battle.attacker.pose.x + battle.defender.pose.x) / 2, y: (battle.attacker.pose.y + battle.defender.pose.y) / 2, heading: battle.defender.pose.heading };
      directorLabel = t(`Lucha por P${battle.position}`, `Battle for P${battle.position}`);
    } else if (subject) {
      target = subject.pose;
      directorLabel = subject.car.name;
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
  const view = cameraMode === "tv" ? ZOOMS[2] : ZOOMS[zoom];

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
    focusId: cameraMode === "tv" ? director.current.id || focusId : focusId,
    cars: rows.map((row) => ({ id: row.car.id, teamId: row.car.teamId, pose: row.pose })),
    wetness,
    events: visibleEvents,
    started: introDone.current,
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
  const lightsOn = introDone.current ? 0 : Math.min(5, Math.floor(intro.current / 0.8) + 1);
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
  for (let lap = displayLap + 1; lap <= current.laps; lap += 1) {
    if (weatherClassOf(current.weather.wetness[lap] ?? 0) !== weatherClassOf(wetness)) {
      const minutes = Math.max(1, Math.round(((lap - displayLap) * lapRef) / 60));
      change = (current.weather.wetness[lap] ?? 0) > wetness ? t(`Lluvia en ${minutes} min`, `Rain in ${minutes} min`) : t(`Seca en ${minutes} min`, `Drying in ${minutes} min`);
      break;
    }
  }
  const clock = clockOf(15 * 3600 + Math.max(0, tau.current));
  const trackTemp = current.trackTemps ? current.trackTemps[Math.min(displayLap, current.trackTemps.length - 1)] ?? 30 : (current.trackTemp ?? 30) - wetness * 8;
  const rubber = wetness > 0.3 ? 0.1 : Math.min(1, displayLap / Math.max(10, current.laps * 0.55));

  const cameraList = has3D ? CAMERAS_3D : ["follow", "tv", "map"];
  const cameraLabel = cameraMode === "map" ? t("Mapa", "Map") : cameraMode === "tv" ? "TV" : CAMERA_NAME[cameraMode]?.() ?? "";

  const towerRows = rows.map((row, index) => {
    const { car, pose } = row;
    const out = row.out;
    let value;
    if (out) value = STATUS[car.retireReason] ? STATUS[car.retireReason]() : t("Ab", "Out");
    else if (pose.inPit) value = t("En boxes", "In pit");
    else if (towerMode === "tyres") value = <Tyre compound={car.compound} age={car.tyreAge} size={18} />;
    else if (index === 0) value = pose.finished ? t("Meta", "Finish") : towerMode === "gap" ? t("Líder", "Leader") : row.completed > 0 ? `${t("V", "L")}${row.completed + 1}` : t("Líder", "Leader");
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
          ? { kind: "yellow", label: `${t("Amarilla", "Yellow")} · ${yellows.map((zone) => `${t("C", "T")}${zone.corner}`).join(" ")}` }
          : !introDone.current
            ? { kind: "session", label: t("Salida", "Start") }
            : { kind: "green", label: t("Bandera verde", "Green flag") };

  const eraNotes = [commands.drs && "DRS", commands.activeAero && t("Aero activa", "Active aero"), energy === "kers" ? "KERS" : energy ? "ERS" : null, refuel && t("Repostaje", "Refuelling")].filter(Boolean);
  const orderOptions = commands.teamOrders;
  const ORDER_LABEL = { free: t("Libres", "Race"), hold: t("Mantener", "Hold"), swap: t("Intercambiar", "Swap") };

  return (
    <div className={`lv lv--race${in3D ? " is-3d" : ""}`} data-engine={source.kind}>
      <StatusStrip flag={flag} clock={clock} airTemp={trackTemp * 0.62 + 4} rainChance={current.weather.forecast ?? 0} change={change} trackTemp={trackTemp} wetness={wetness} rubber={rubber} />

      <div className="lv-stage">
        {in3D ? (
          <React.Suspense fallback={<div className="lv-loading">{t("Cargando el circuito en 3D…", "Loading the circuit in 3D…")}</div>}>
            <Race3D
              circuit={circuit}
              year={current.year}
              cars={stageCars}
              focusId={cameraMode === "tv" ? director.current.id : focusId}
              mode={cameraMode}
              wet={wetness > 0.2}
              lights={lightsOn}
              safetyCarOn={Boolean(scWindow && !scWindow.virtual && !scWindow.red)}
              clock={tau}
              sample={source.sample}
              teams={teams}
              onPick={setFocusId}
              labels={{ near: t("Retransmisión en 3D", "3D broadcast") }}
            />
          </React.Suspense>
        ) : (
          <RaceStage
            circuit={circuit}
            year={current.year}
            cars={stageCars}
            camera={{ mode: cameraMode === "map" ? "map" : cameraMode === "tv" ? "tv" : "follow", x: cam.x, y: cam.y, heading: cam.heading, rotate: cameraMode !== "tv", view }}
            wet={wetness > 0.2}
            teams={teams}
            safetyCar={safetyCar}
            focusId={cameraMode === "tv" ? director.current.id : focusId}
            onPick={setFocusId}
            labels={{ map: t("Mapa del circuito", "Circuit map"), near: t("Cámara cenital", "Overhead camera"), box: "Box", sc: t("Coche de seguridad", "Safety car") }}
          />
        )}
        {wetness > 0.2 && !in3D && <div className="lv-rain" style={{ opacity: Math.min(0.85, wetness + 0.15) }} aria-hidden="true" />}
        {!introDone.current && !in3D && (
          <div className="lv-lights" aria-label={t("Semáforo de salida", "Start lights")}>
            {[0, 1, 2, 3, 4].map((index) => (
              <span key={index} className={index < lightsOn ? "is-on" : ""} />
            ))}
          </div>
        )}
        <div className="lv-overlay">
          {introDone.current && tau.current < 3 && <div className="lv-banner is-go">{t("Se apagan los semáforos", "Lights out")}</div>}
          {leaderFinished && (
            <div className="lv-banner">
              <IconFlag size={16} />
              {t("Bandera a cuadros", "Chequered flag")} · {leader?.car.name}
            </div>
          )}
        </div>
        {!leaderFinished && battles[0] && cameraMode !== "tv" && (
          <div className="lv-chip">
            <i aria-hidden="true" />
            {t(`Lucha por P${battles[0].position}`, `Battle for P${battles[0].position}`)} · <b>{code(battles[0].attacker.car.name)}</b> → <b>{code(battles[0].defender.car.name)}</b> · {battles[0].gap.toFixed(1)} s
          </div>
        )}
        {cameraMode !== "map" && <MiniMap circuit={circuit} cars={stageCars} focusId={cameraMode === "tv" ? director.current.id : focusId} label={t("Minimapa", "Mini map")} />}
      </div>

      <TimingTower
        label={t("Torre de tiempos", "Timing tower")}
        title={title}
        subtitle={
          <>
            {t("Vuelta", "Lap")} <b>{displayLap}</b>/{current.laps}
          </>
        }
        modes={{ value: towerMode, onChange: setTowerMode, options: TOWER_MODES.map((value) => ({ value, label: { interval: t("Intervalo", "Interval"), gap: t("Líder", "Leader"), tyres: t("Neumáticos", "Tyres") }[value] })) }}
        rows={towerRows}
        onPick={setFocusId}
      />

      <aside className="lv-orders" aria-label={t("Órdenes", "Orders")}>
        <header className="lv-orders__head">
          <strong>{t("Órdenes", "Orders")}</strong>
          <small>
            {current.year}
            {eraNotes.length ? ` · ${eraNotes.join(" · ")}` : ""}
          </small>
        </header>
        {userCars.length === 2 && !current.finished && !commands.teamOrdersBanned && (
          <div className="lv-orders__team">
            <span>{t("Órdenes de equipo", "Team orders")}</span>
            <Segmented label={t("Órdenes de equipo", "Team orders")} value={current.teamOrders[userTeam] || "free"} onChange={(value) => command("setTeamOrder", userTeam, value)} options={orderOptions.map((value) => ({ value, label: ORDER_LABEL[value] }))} />
          </div>
        )}
        <div className="lv-orders__cards">
          {userCars.map((car) => (
            <DriverCard
              key={car.id}
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
            />
          ))}
        </div>
        <Feed entries={feedEntries} />
      </aside>

      <PlaybackBar
        playing={playing}
        onPlay={() => setPlaying((value) => !value)}
        disabled={done}
        speeds={SPEEDS}
        speed={speed}
        onSpeed={setSpeed}
        cameraLabel={cameraMode === "tv" ? `TV · ${directorLabel}` : `${cameraLabel}${cameraMode !== "map" ? ` · ${code(focusName)}` : ""}`}
        onCamera={(step) => setCameraMode((value) => cycle(cameraList, value, step))}
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

const TEMP_LABEL = (temp) => (temp < 0.4 ? { label: t("Fríos", "Cold"), tone: "info" } : temp > 0.72 ? { label: t("Sobrecalentados", "Overheating"), tone: "neg" } : { label: t("En ventana", "In window"), tone: "pos" });

/**
 * One of the player's cars on the pit wall: position and name, then one row per order
 * the era allows (RF-CMD-01, commandsFor): tyres and pace, fuel and its mixture when
 * there is no refuelling, the battery when the era has KERS or ERS, defence and
 * overtaking risk in a step race, and the stop call underneath (RF-CMD-02: compounds,
 * or fuel only when tyres may not be changed). Every order goes through `command`
 * (the race worker for a step race).
 */
function DriverCard({ car, row, state, commands, energy, command, steps, pitThisLap, focused, onFocus }) {
  const [fuelLoad, setFuelLoad] = useState(null);
  const running = car.status === "running";
  const rules = rulesOf(state.era, state.year);
  const refuel = commands.pit.fuel;
  const life = Math.max(0, 1 - tyreLifeUsed(car, rules));
  const temp = TEMP_LABEL(car.tyreTemp ?? 0.5);
  const remaining = Math.max(0, state.laps - state.lap);
  const burn = { lean: 0.93, standard: 1, rich: 1.07 }[car.fuelMode] ?? 1;
  const fuelMargin = refuel ? null : car.fuel / burn - remaining;
  const position = row && !row.out ? row.position : car.position;
  const drs = running && drsOpen(rules, { lap: state.lap, wetness: state.weather.wetness[Math.min(state.lap, state.laps)] ?? 0, zones: state.track?.drs ?? 0, restartLap: state.restartLap || 0, gapAhead: car.gapAhead });
  const paceKeys = commands.pace.filter((key) => MODE[key]);
  const mixKeys = commands.fuelMix.filter((key) => MIX[key]);
  const energyModes = commands.energy.filter((key) => ERS[key]);
  const hasBattery = car.battery !== null && car.battery !== undefined && energyModes.length > 0;
  // RF-CMD-02: the next stop of the plan (delay it a lap or drop it) and, with refuelling, the load.
  // A stop the car has already made (car.lastPitLap) is not "next", even before the leader's lap moves on.
  const nextStop = car.plan.stops.find((lap) => lap >= state.lap && !(car.lastPitLap >= lap));
  const nextCompound = car.plan.compounds[Math.min(car.plan.compounds.length - 1, (car.stint ?? 0) + 1)];
  // A stop called now replaces the next planned one: fuel to the stop after it, or to the flag.
  const after = car.plan.stops.find((lap) => lap > (nextStop ?? state.lap));
  const defaultFuel = Math.max(1, Math.min(remaining + 1, (after ?? state.laps) - state.lap));
  return (
    <section className={`lv-card${running ? "" : " is-out"}${focused ? " is-focus" : ""}`} aria-label={car.name}>
      <button type="button" className="lv-card__head" onClick={onFocus}>
        <span className="lv-card__pos">{position}</span>
        <i className="lv-card__stripe" style={{ "--stripe": readableOn(car.color) }} aria-hidden="true" />
        <span className="lv-card__name">{car.name}</span>
        {commands.drs ? <span className={`lv-flagword${drs ? " is-on" : ""}`}>DRS</span> : commands.activeAero ? <span className="lv-flagword">{t("Aero", "Aero")}</span> : <span />}
        <span className="lv-card__lap">{car.lastLap ? lapTime(car.lastLap) : ""}</span>
      </button>
      {running ? (
        <>
          <div className="lv-ctl">
            <span>{t("Neumático", "Tyre")}</span>
            <div className="lv-ctl__value" title={temp.label}>
              <Tyre compound={car.compound} age={car.tyreAge} size={20} />
              <b className={life < 0.2 ? "is-bad" : life < 0.4 ? "is-warn" : ""}>{Math.round(life * 100)}%</b>
              <Meter value={Math.round((car.tyreTemp ?? 0.5) * 100)} tone={temp.tone} label={t("Temperatura", "Temperature")} />
              <small>{temp.label}</small>
            </div>
          </div>
          <div className="lv-ctl">
            <span>{t("Ritmo", "Pace")}</span>
            <Dots label={t("Ritmo", "Pace")} value={car.mode} onChange={(mode) => command("setMode", car.id, mode)} options={paceKeys.map((mode) => ({ value: mode, label: MODE[mode]() }))} />
          </div>
          <div className="lv-ctl">
            <span>{t("Combustible", "Fuel")}</span>
            <div className="lv-ctl__value">
              {fuelMargin !== null ? (
                <b className={fuelMargin < 0 ? "is-bad" : fuelMargin < 0.6 ? "is-warn" : "is-good"}>
                  {fuelMargin >= 0 ? "+" : ""}
                  {fuelMargin.toFixed(2)} {t("v", "laps")}
                </b>
              ) : (
                <b>
                  {Math.max(0, Math.round(car.fuel))} {t("v", "laps")}
                </b>
              )}
              <Meter value={Math.round(Math.min(1, car.fuel / Math.max(1, refuel ? 30 : state.fuelStart)) * 100)} tone="accent" label={t("Combustible", "Fuel")} />
              {refuel && <small>{t("Repostaje en cada parada", "Refuel at every stop")}</small>}
            </div>
          </div>
          {mixKeys.length > 0 && (
            <div className="lv-ctl">
              <span>{t("Mezcla", "Fuel mix")}</span>
              <Dots label={t("Mezcla", "Fuel mix")} value={car.fuelMode} onChange={(mix) => command("setMix", car.id, mix)} options={mixKeys.map((mix) => ({ value: mix, label: MIX[mix]() }))} />
            </div>
          )}
          {hasBattery ? (
            <div className="lv-ctl">
              <span>{energy === "kers" ? "KERS" : "ERS"}</span>
              <div className="lv-ctl__value">
                <b>{Math.round(car.battery)}%</b>
                <Dots label={energy === "kers" ? "KERS" : "ERS"} value={car.ersMode} onChange={(mode) => command("setErs", car.id, mode)} options={energyModes.map((mode) => ({ value: mode, label: ERS[mode]() }))} />
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
          <div className="lv-box">
            {car.pitRequest ? (
              <button type="button" className="mn-btn mn-btn--sm lv-box__called" onClick={() => command("cancelPit", car.id)}>
                {`${pitThisLap ? t("Box esta vuelta", "Box this lap") : t("Box la próxima vuelta", "Box next lap")} · ${commands.pit.tyres ? COMPOUND[car.pitRequest.compound || car.compound]() : t("combustible", "fuel")}${Number.isFinite(car.pitRequest.fuel) ? ` · ${car.pitRequest.fuel} v` : ""} · ${t("cancelar", "cancel")}`}
              </button>
            ) : commands.pit.tyres ? (
              <>
                <span>{pitThisLap ? t("Box esta vuelta", "Box this lap") : t("Box la próxima", "Box next lap")}</span>
                {commands.pit.compounds.map((compound) => (
                  <button type="button" key={compound} className="lv-box__tyre" onClick={() => command("requestPit", car.id, compound, refuel ? { fuel: fuelLoad ?? defaultFuel, replace: true } : { replace: true })} aria-label={t(`Parar y montar ${COMPOUND[compound]().toLowerCase()}`, `Box for ${COMPOUND[compound]()}`)} title={t(`Box: ${COMPOUND[compound]()}`, `Box: ${COMPOUND[compound]()}`)}>
                    <Tyre compound={compound} size={22} />
                  </button>
                ))}
              </>
            ) : (
              <>
                <span>{t("Parada", "Pit stop")}</span>
                <button type="button" className="mn-btn mn-btn--sm" onClick={() => command("requestPit", car.id, car.compound, refuel ? { fuel: fuelLoad ?? defaultFuel, replace: true } : { replace: true })}>
                  {pitThisLap ? t("Box esta vuelta: combustible", "Box this lap: fuel") : t("Box la próxima: combustible", "Box next lap: fuel")}
                </button>
              </>
            )}
            {refuel && !car.pitRequest && (
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
            {car.issue ? <em className="lv-box__issue">{t("Problema", "Issue")} +{car.issue.toFixed(1)} s</em> : null}
          </div>
          {nextStop !== undefined && !car.pitRequest && (
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
          )}
        </>
      ) : (
        <p className="lv-card__status">{car.status === "finished" ? t("Terminado", "Finished") : STATUS[car.retireReason] ? STATUS[car.retireReason]() : ""}</p>
      )}
    </section>
  );
}
