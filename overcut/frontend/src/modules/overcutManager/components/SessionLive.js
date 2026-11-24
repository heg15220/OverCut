/**
 * Practice, qualifying and the sprint shootout, played from the pit wall (DESIGN.md §6.5;
 * RF-WKD-02/03/05, RF-CMD-04): the same wall as the race - timing tower left, the circuit
 * in 3D or the 2D map in the centre, your drivers right, playback underneath - over the
 * session clock of an interactive session (engine/sessionSim).
 *
 * Nothing leaves the garage on its own. Each of your cars gets a run plan - programme,
 * laps, fuel and tyre set in practice; tyre set, push laps, style and, where the era
 * qualified on race fuel, the fuel in qualifying - and goes out when you press "Salir a
 * pista". On track: the lap clock and the sectors against the session's and the driver's
 * best, "Abortar vuelta" on a flying lap and "Volver a boxes". Rivals do their own runs.
 * At the flag the cars finish the lap they are on; the knockout drops the slowest and the
 * next segment starts. Single-lap qualifying sends each car out at its slot in run order:
 * you set the fuel and tyre for it. The session runs in-thread (it is a few lap decisions
 * a minute); the same seed and orders replay it (RF-SIM-15).
 *
 * Playback (HUD-1 of F1M24-GAMEPLAY): the same 1-16 scale as the race (RF-CMD-04, before
 * 1-60), the starting speed per session from data/balance/live-view.json, auto-speed when
 * your car leaves the garage, starts a flying lap or comes in and at the flag, "next event",
 * and the view (practice opens on the map) apart from the camera. The engine runs in fixed
 * steps whatever the speed, so none of it changes the session (RNF-05).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SESSION_BALANCE, advanceTo, carStatus, command, createSession, defaultCompound, nextSegment, runSegmentToEnd, sessionBestSectors, sessionResult } from "../engine/sessionSim";
import { Segmented, Tyre, readableOn } from "./atoms";
import { Feed, PlaybackBar, SpeedCallout, StatusStrip, TimingTower } from "./Broadcast";
import { cameraModeOf, cameraName, camerasOf, cycle, defaultCameraOf, defaultSpeedOf, defaultViewOf, reasonText, runToNextSessionEvent, sessionTriggers, speedsOf, stepCar, viewName, viewsOf } from "./playback";
import useAutoSpeed from "./useAutoSpeed";
import { IconExit, IconFlag, IconLock, IconNextEvent, IconPlay } from "./icons";
import { carAt } from "./raceClock";
import RaceStage, { MiniMap } from "./RaceStage";
import { COMPOUND, PROGRAM, QUALI_STYLE, lapTime, t } from "./texts";
import { canRender3D } from "../three/support";
import { useRaceAudio } from "../three/audio";
import SoundControl from "../three/audio/SoundControl";
import "./styles/weekend.css";

const Race3D = React.lazy(() => import("../three/Race3D"));

const LIMITS = SESSION_BALANCE.limits;
const PROGRAMMES = Object.keys(SESSION_BALANCE.programmes).filter((key) => !key.startsWith("$"));

const code = (name = "") => {
  const parts = name.split(" ").filter((part) => part && !/^(jr|sr|ii|iii)\.?$/i.test(part));
  return (parts[parts.length - 1] || name).replace(/[^\p{L}]/gu, "").slice(0, 3).toUpperCase();
};

const mmss = (seconds) => {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const clockOf = (seconds) => {
  const whole = Math.floor(seconds);
  return [Math.floor(whole / 3600) % 24, Math.floor(whole / 60) % 60, whole % 60].map((v) => String(v).padStart(2, "0")).join(":");
};

const signed = (value) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;

const PHASE = {
  garage: () => t("En boxes", "In garage"),
  queued: () => t("Saliendo", "Leaving"),
  out: () => t("Vuelta de salida", "Out lap"),
  flying: () => t("Vuelta lanzada", "Flying lap"),
  cool: () => t("Enfriando", "Cool-down"),
  in: () => t("Vuelta de entrada", "In lap"),
  pitlane: () => t("Entrando al box", "Pit lane"),
};

const SHORT_PHASE = {
  garage: () => t("Box", "Box"),
  queued: () => t("Sale", "Out"),
  out: () => t("Salida", "Out"),
  flying: () => t("Lanzada", "Flying"),
  cool: () => t("Enfría", "Cool"),
  in: () => t("Entra", "In"),
  pitlane: () => t("Box", "Box"),
};

/** The plan a driver's card starts with, before the player touches it. */
const startPlan = (engine, kind) => {
  const compound = defaultCompound(engine);
  return kind === "practice" ? { programme: "setup", laps: SESSION_BALANCE.programmes.setup.laps, fuel: null, compound, set: "new" } : { push: 1, fuel: null, compound, set: "new", style: "normal" };
};

/** A − n + stepper for laps and fuel. */
const Stepper = ({ label, value, min, max, onChange, unit, disabled }) => (
  <div className="lv-step" role="group" aria-label={label}>
    <button type="button" className="mn-icon-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label={t(`Menos ${label.toLowerCase()}`, `Less ${label.toLowerCase()}`)}>
      −
    </button>
    <b>
      {value}
      {unit ? <small> {unit}</small> : null}
    </b>
    <button type="button" className="mn-icon-btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label={t(`Más ${label.toLowerCase()}`, `More ${label.toLowerCase()}`)}>
      +
    </button>
  </div>
);

/** The sets left of each compound: pick one, new or used (RF-WKD-05). */
const TyrePicker = ({ sets, compound, set, onChange, locked, wet }) => {
  // Rain tyres only when there is water about (or when one is already chosen).
  const compounds = [...new Set(sets.map((entry) => entry.compound))].filter((value) => wet || compound === value || (value !== "inter" && value !== "wet"));
  const of = (value) => sets.filter((entry) => entry.compound === value);
  const fresh = of(compound).filter((entry) => entry.laps === 0).length;
  const used = of(compound).filter((entry) => entry.laps > 0).sort((a, b) => a.laps - b.laps)[0];
  return (
    <div className="lv-tyres">
      <div className="lv-tyres__row" role="radiogroup" aria-label={t("Neumático", "Tyre")}>
        {compounds.map((value) => {
          const left = of(value).filter((entry) => entry.laps === 0).length;
          return (
            <button
              type="button"
              role="radio"
              key={value}
              aria-checked={value === compound}
              className={`lv-tyres__pick${value === compound ? " is-active" : ""}`}
              onClick={() => onChange({ compound: value, set: left ? "new" : "used" })}
              disabled={locked && value !== compound}
              title={`${COMPOUND[value]()} · ${t(`${left} nuevos`, `${left} new`)}`}
              aria-label={`${COMPOUND[value]()} · ${t(`${left} nuevos`, `${left} new`)}`}
            >
              <Tyre compound={value} size={20} />
              <small>{left}</small>
            </button>
          );
        })}
      </div>
      {!locked && (
        <Segmented
          label={t("Juego", "Set")}
          value={set === "used" && used ? "used" : "new"}
          onChange={(value) => onChange({ compound, set: value })}
          options={[
            { value: "new", label: fresh ? t(`Nuevo (${fresh})`, `New (${fresh})`) : t("Sin nuevos", "None new") },
            ...(used ? [{ value: "used", label: t(`Usado ${used.laps} v`, `Used ${used.laps} L`) }] : []),
          ]}
        />
      )}
    </div>
  );
};

/** Sector chips of the lap under way: purple session best, green personal best, yellow slower. */
const Sectors = ({ status, car, best }) => {
  const own = car.bestSectors || [];
  const chips = [0, 1, 2].map((index) => {
    const value = status.sectors[index];
    if (value === undefined) return { index, tone: "", text: `S${index + 1}` };
    const tone = value <= best[index] + 1e-9 ? "is-best" : own[index] === undefined || value < own[index] ? "is-pb" : "is-slow";
    return { index, tone, text: value.toFixed(3) };
  });
  return (
    <div className="lv-sectors" aria-label={t("Sectores", "Sectors")}>
      {chips.map((chip) => (
        <span key={chip.index} className={`lv-sectors__chip ${chip.tone}`}>
          {chip.text}
        </span>
      ))}
    </div>
  );
};

export default function SessionLive({ kind, options, entrants, circuit, year, baseLap, trackTemp = 32, rainChance = 0, onRun, onPhase, onDone, doneLabel, compact = false }) {
  const has3D = useMemo(() => canRender3D(), []);
  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = createSession(options);
  const engine = engineRef.current;
  const [playing, setPlaying] = useState(true);
  // RF-CMD-04 / HUD-1: the 1-16 scale, the starting speed of this session and auto-speed.
  const auto = useAutoSpeed({ initial: defaultSpeedOf(kind) });
  const speed = auto.speed;
  // user-camera-lock: the view apart from the camera (practice opens on the map).
  const cameraList = useMemo(() => camerasOf({ has3D, year }), [has3D, year]);
  const [view, setView] = useState(() => defaultViewOf(kind, has3D));
  const [cameraPick, setCameraPick] = useState(() => defaultCameraOf(cameraList, has3D));
  const cameraMode = cameraModeOf(view, cameraPick);
  const in3DRef = useRef(false);
  const users = entrants.filter((entry) => entry.isUser);
  const [focusId, setFocusId] = useState(users[0]?.id ?? entrants[0]?.id);
  const [plans, setPlans] = useState(() => Object.fromEntries(users.map((user) => [user.id, startPlan(engine, kind)])));
  const [, setFrame] = useState(0);
  const tau = useRef(0);
  const seen = useRef(0);
  const phases = useRef({});
  const feedRef = useRef([]);
  const playRef = useRef({ playing, auto });
  playRef.current = { playing: playing && !auto.held, auto };
  const callbacks = useRef({ onRun, onPhase });
  callbacks.current = { onRun, onPhase };
  const repaint = () => setFrame((value) => (value + 1) % 1e9);
  const byId = useMemo(() => Object.fromEntries(entrants.map((entry) => [entry.id, entry])), [entrants]);
  const teamOrder = useMemo(() => [...new Set(entrants.map((entry) => entry.teamId))], [entrants]);
  const teams = useMemo(() => teamOrder.map((teamId, index) => ({ id: teamId, color: entrants.find((entry) => entry.teamId === teamId)?.color, slot: index / Math.max(1, teamOrder.length - 1) })), [teamOrder, entrants]);
  const segment = engine.segments[engine.segment];
  const segmentName = segment.name;

  // The view's copy of each car: the engine's lap records, drawn from the garage.
  const viewCars = useMemo(
    () =>
      engine.cars.map((car) => ({
        ...byId[car.id],
        id: car.id,
        history: car.history,
        garage: true,
        status: "session",
        compound: "soft",
        boxSlot: teamOrder.indexOf(byId[car.id]?.teamId) / Math.max(1, teamOrder.length - 1),
        garageBay: entrants.filter((entry) => entry.teamId === byId[car.id]?.teamId).findIndex((entry) => entry.id === car.id),
      })),
    // A new segment gives every car a new history array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, byId, teamOrder, engine.segment],
  );

  // Engine events since the last frame: runs back in the garage (setup feedback), the
  // feed, and your cars' phases (setup changes only in the garage).
  const digest = useCallback(() => {
    const events = engine.events;
    // HUD-1 auto-speed: the new events and the phases your cars have just entered.
    const fresh = events.slice(seen.current);
    const entered = [];
    for (; seen.current < events.length; seen.current += 1) {
      const event = events[seen.current];
      const entry = byId[event.carId];
      const mine = entry?.isUser;
      const name = entry?.name || "";
      const push = (text, extra = {}) => feedRef.current.unshift({ key: `${seen.current}`, at: event.t, kind: mine ? "radio" : "race", alert: Boolean(mine), text, ...extra });
      if (event.type === "best") push(t(`Vuelta más rápida: ${name} ${lapTime(event.time)}`, `Fastest lap: ${name} ${lapTime(event.time)}`));
      else if (event.type === "pb" && mine) push(t(`${name} mejora: ${lapTime(event.time)}`, `${name} improves: ${lapTime(event.time)}`));
      else if (event.type === "abort" && mine) push(t(`${name} aborta la vuelta`, `${name} aborts the lap`));
      else if (event.type === "out" && mine) push(t(`${name} sale a pista con ${COMPOUND[event.compound]().toLowerCase()} y ${event.fuel} v de combustible`, `${name} goes out on ${COMPOUND[event.compound]().toLowerCase()} with ${event.fuel} laps of fuel`));
      else if (event.type === "run" && mine) {
        push(
          event.laps
            ? t(`${name} vuelve al box: ${event.laps} v cronometradas, mejor ${lapTime(event.best)}, media ${lapTime(event.average)}`, `${name} is back: ${event.laps} timed laps, best ${lapTime(event.best)}, average ${lapTime(event.average)}`)
            : t(`${name} vuelve al box sin tiempo`, `${name} is back without a time`),
        );
        callbacks.current.onRun?.(event);
      } else if (event.type === "eliminated") push(t(`${name} queda eliminado`, `${name} is knocked out`), { kind: mine ? "radio" : "race" });
      else if (event.type === "flag") push(t("Bandera a cuadros", "Chequered flag"), { kind: "race", alert: true });
    }
    if (feedRef.current.length > 40) feedRef.current.length = 40;
    users.forEach((user) => {
      const phase = carStatus(engine, user.id, engine.clock)?.phase;
      if (phases.current[user.id] !== phase) {
        if (phases.current[user.id] !== undefined) entered.push(phase);
        phases.current[user.id] = phase;
        callbacks.current.onPhase?.(user.id, phase);
      }
    });
    const triggers = sessionTriggers({ events: fresh, phases: entered, isUser: (id) => Boolean(byId[id]?.isUser) });
    if (triggers.length) playRef.current.auto.notify(triggers, engine.clock);
  }, [engine, byId, users]);

  // The session clock: real time times the speed; the engine is run up to it every frame.
  useEffect(() => {
    let last = performance.now();
    let lastPaint = 0;
    let handle = 0;
    const raf = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : (fn) => setTimeout(() => fn(performance.now()), 50);
    const cancel = typeof cancelAnimationFrame !== "undefined" ? cancelAnimationFrame : clearTimeout;
    const tick = () => {
      const time = performance.now();
      const dt = Math.min(0.1, (time - last) / 1000);
      last = time;
      if (playRef.current.playing && !engine.over) {
        playRef.current.auto.tick(tau.current);
        tau.current += dt * playRef.current.auto.machine.speed;
        advanceTo(engine, tau.current);
        if (engine.over) tau.current = engine.clock;
        digest();
      }
      if (!in3DRef.current || time - lastPaint >= 90) {
        lastPaint = time;
        repaint();
      }
      handle = raf(tick);
    };
    handle = raf(tick);
    return () => cancel(handle);
  }, [engine, digest]);

  const now = tau.current;
  const flag = engine.flag || now >= segment.duration;
  const over = engine.over;
  const alive = engine.cars.filter((car) => !car.eliminated);
  const statuses = Object.fromEntries(engine.cars.map((car) => [car.id, carStatus(engine, car.id, now)]));
  const ordered = [...alive].sort((a, b) => {
    const ba = statuses[a.id].best;
    const bb = statuses[b.id].best;
    if (ba !== null && bb !== null) return ba - bb || a.index - b.index;
    if (ba !== null) return -1;
    if (bb !== null) return 1;
    return a.index - b.index;
  });
  const out = engine.cars.filter((car) => car.eliminated);
  const pole = statuses[ordered[0]?.id]?.best ?? null;
  const cut = segment.drop ? ordered.length - segment.drop : Infinity;
  const bestSectors = sessionBestSectors(engine, now);
  const positionOf = Object.fromEntries(ordered.map((car, index) => [car.id, index + 1]));

  const rows = [
    ...ordered.map((car, index) => {
      const st = statuses[car.id];
      const value = st.best === null ? SHORT_PHASE[st.phase]() : index === 0 ? lapTime(st.best) : `+${(st.best - pole).toFixed(3)}`;
      return {
        id: car.id,
        position: index + 1,
        code: code(byId[car.id]?.name),
        color: byId[car.id]?.color,
        value,
        flags: { user: byId[car.id]?.isUser, pit: st.phase === "garage" && st.best !== null, danger: index >= cut && !over, eliminated: index >= cut && over, focus: car.id === focusId },
      };
    }),
    ...out.map((car, index) => ({
      id: car.id,
      position: ordered.length + index + 1,
      code: code(byId[car.id]?.name),
      color: byId[car.id]?.color,
      value: t(`Fuera ${engine.segments[car.out]?.name ?? ""}`, `Out ${engine.segments[car.out]?.name ?? ""}`),
      flags: { user: byId[car.id]?.isUser, eliminated: true, focus: car.id === focusId },
    })),
  ];

  const stageCars = viewCars
    .filter((car) => !engine.cars.find((entry) => entry.id === car.id)?.eliminated)
    .map((car) => {
      const st = statuses[car.id];
      const compound = st.record?.compound || car.compound;
      return {
        car: { ...car, compound },
        code: code(car.name),
        pose: carAt(car, now, circuit, baseLap),
        row: { position: positionOf[car.id] },
        tag: st.phase === "flying" ? lapTime(st.elapsed) : st.best !== null ? lapTime(st.best) : PHASE[st.phase](),
      };
    });

  const sample = useCallback((car, at) => carAt(car, at, circuit, baseLap), [circuit, baseLap]);

  // RF-3D-04: the same engines and ambience as the race, one frame per repaint.
  const audio = useRaceAudio({ seed: `${options?.seed ?? year}::${kind}`, year });
  useEffect(() => {
    if (!audio.enabled) return;
    audio.frame({
      tau: tau.current,
      playing: playing && !engine.over,
      mode: cameraMode,
      focusId,
      cars: stageCars.map((item) => ({ id: item.car.id, teamId: item.car.teamId, pose: item.pose })),
      wetness: engine.wetness || 0,
      events: [],
      started: false,
    });
  });

  const lastSegment = engine.segment >= engine.segments.length - 1;
  const advance = () => {
    if (!lastSegment) {
      nextSegment(engine);
      tau.current = 0;
      seen.current = engine.events.length;
      setPlans(Object.fromEntries(users.map((user) => [user.id, startPlan(engine, kind)])));
      setPlaying(true);
      repaint();
    } else onDone(sessionResult(engine), engine);
  };
  const skip = () => {
    runSegmentToEnd(engine, { autopilot: true });
    tau.current = engine.clock;
    digest();
    repaint();
  };
  // RF-CMD-04 "saltar al siguiente evento": the engine's own fixed steps up to the next event
  // of live-view.json nextEvent (or a phase change of your cars), never past the segment.
  const nextEvent = () => {
    runToNextSessionEvent(engine, { userIds: users.map((user) => user.id), from: tau.current });
    tau.current = Math.max(tau.current, engine.clock);
    digest();
    repaint();
  };

  const in3D = has3D && cameraMode !== "map";
  in3DRef.current = in3D;
  // The car arrows step through the tower by position; cars knocked out earlier are off the track.
  const towerOrder = rows.map((row) => ({ id: row.id, out: Boolean(engine.cars.find((car) => car.id === row.id)?.eliminated) }));
  const focusPose = stageCars.find((item) => item.car.id === focusId)?.pose || stageCars[0]?.pose || { x: 0, y: 0, heading: 0 };
  const sessionTitle = kind === "practice" ? t("Libres", "Practice") : segmentName === "Q" ? t("Clasificación", "Qualifying") : segmentName;
  const remaining = segment.singleLap ? t(`${alive.filter((car) => car.history.length === 0).length} por salir`, `${alive.filter((car) => car.history.length === 0).length} to go`) : flag ? t("Bandera", "Flag") : mmss(segment.duration - now);
  const flagState = flag ? { kind: "chequered", label: t(`${sessionTitle} · bandera a cuadros`, `${sessionTitle} · chequered flag`) } : { kind: "green", label: t(`${sessionTitle} · pista abierta`, `${sessionTitle} · track open`) };
  const dropped = over && segment.drop ? ordered.slice(cut).map((car) => byId[car.id]?.name) : [];
  const nextName = engine.segments[engine.segment + 1]?.name;
  const formatNote = segment.singleLap
    ? t("Vuelta única: cada coche sale en su turno", "Single lap: each car goes out in its slot")
    : segment.lapLimit
      ? t(`Máximo ${segment.lapLimit} vueltas por piloto`, `${segment.lapLimit} laps per driver at most`)
      : segment.tyre
        ? t(`Neumático obligatorio: ${COMPOUND[segment.tyre]().toLowerCase()} nuevo`, `Mandatory tyre: new ${COMPOUND[segment.tyre]().toLowerCase()}`)
        : segment.raceFuel
          ? t("Con el combustible de la salida (parque cerrado)", "On race fuel (parc fermé)")
          : kind === "practice"
            ? t("Elige el plan y saca a tus pilotos", "Pick a plan and send your drivers out")
            : t("Elige neumático y vueltas, y a pista", "Pick tyres and laps, then go");

  const order = (name, carId, ...args) => {
    command(engine, name, carId, ...args);
    digest();
    repaint();
  };
  const setPlan = (carId, patch) => {
    setPlans((current) => {
      const next = { ...current, [carId]: { ...current[carId], ...patch } };
      if (segment.singleLap) command(engine, "setPlan", carId, next[carId]);
      return next;
    });
  };

  return (
    <div className={`lv lv--session${compact ? " is-compact" : ""}${in3D ? " is-3d" : ""}`} data-session={kind}>
      <StatusStrip
        flag={flagState}
        clock={clockOf((kind === "practice" ? 11 : 14) * 3600 + now + engine.segment * 1200)}
        airTemp={trackTemp * 0.62 + 4}
        rainChance={rainChance}
        change={formatNote}
        trackTemp={trackTemp}
        wetness={engine.wetness}
        rubber={Math.min(1, 0.2 + engine.fieldLaps / 240 + engine.segment * 0.15)}
      />

      <div className="lv-stage">
        {in3D ? (
          <React.Suspense fallback={<div className="lv-loading">{t("Cargando el circuito en 3D…", "Loading the circuit in 3D…")}</div>}>
            <Race3D circuit={circuit} year={year} cars={stageCars} focusId={focusId} mode={cameraMode} wet={engine.wetness > 0.2} lights={0} safetyCar={null} teams={teams} onPick={setFocusId} labels={{ near: sessionTitle }} clock={tau} sample={sample} />
          </React.Suspense>
        ) : (
          <RaceStage
            circuit={circuit}
            year={year}
            cars={stageCars}
            camera={{ mode: cameraMode === "map" ? "map" : cameraMode === "tv" ? "tv" : "follow", x: focusPose.x, y: focusPose.y, heading: focusPose.heading, rotate: cameraMode !== "tv", view: 130 }}
            wet={engine.wetness > 0.2}
            teams={teams}
            safetyCar={null}
            focusId={focusId}
            onPick={setFocusId}
            labels={{ map: t("Mapa del circuito", "Circuit map"), near: sessionTitle, box: "Box" }}
          />
        )}
        <SpeedCallout callout={auto.callout} reasonText={reasonText} />
        <div className="lv-overlay">
          {over && (
            <div className="lv-endcard" role="status">
              <strong>
                <IconFlag size={16} />
                {t(`Fin de ${sessionTitle}`, `End of ${sessionTitle}`)}
              </strong>
              {pole !== null && (
                <span>
                  {t("Mejor tiempo", "Fastest")} · {byId[ordered[0].id]?.name} {lapTime(pole)}
                </span>
              )}
              {dropped.length > 0 && (
                <span>
                  {t("Eliminados", "Knocked out")}: {dropped.join(", ")}
                </span>
              )}
              {users.map((user) => (
                <span key={user.id} className="lv-endcard__own">
                  {user.name}: {positionOf[user.id] ? `P${positionOf[user.id]}` : t("fuera", "out")} {statuses[user.id].best !== null ? `· ${lapTime(statuses[user.id].best)}` : ""}
                </span>
              ))}
              <button type="button" className="mn-btn mn-btn--primary" onClick={advance}>
                {!lastSegment ? t(`Ir a ${nextName}`, `On to ${nextName}`) : doneLabel || (kind === "practice" ? t("Cerrar libres", "Close practice") : t("Ver la parrilla", "See the grid"))}
              </button>
            </div>
          )}
        </div>
      </div>

      <TimingTower label={t("Torre de tiempos", "Timing tower")} title={sessionTitle} subtitle={<b>{remaining}</b>} modes={null} rows={rows} onPick={setFocusId} />

      <section className="lv-cards" aria-label={t("Tus pilotos", "Your drivers")}>
          {users.map((user) => (
            <RunCard
              key={user.id}
              kind={kind}
              engine={engine}
              user={user}
              status={statuses[user.id]}
              position={positionOf[user.id]}
              danger={positionOf[user.id] > cut}
              flag={flag}
              over={over}
              plan={plans[user.id]}
              onPlan={(patch) => setPlan(user.id, patch)}
              order={order}
              bestSectors={bestSectors}
              pole={pole}
              focused={focusId === user.id}
              onFocus={() => setFocusId(user.id)}
              slotAt={segment.singleLap ? segment.slots?.[user.id] : null}
              now={now}
            />
          ))}
      </section>

      <aside className="lv-side" aria-label={t("Pista", "Track")}>
        {cameraMode !== "map" && <MiniMap circuit={circuit} cars={stageCars} focusId={focusId} label={t("Minimapa", "Mini map")} />}
        <Feed entries={feedRef.current.slice(0, 24).map((entry) => ({ ...entry, lap: null }))} title={t("Radio y pista", "Radio and track")} />
      </aside>

      <PlaybackBar
        playing={playing}
        onPlay={() => setPlaying((value) => !value)}
        speeds={speedsOf()}
        speed={speed}
        onSpeed={auto.choose}
        autoSpeed={{ enabled: auto.enabled, onToggle: auto.setEnabled }}
        held={auto.held}
        disabled={over}
        views={{ value: view, onChange: setView, options: viewsOf().map((value) => ({ value, label: viewName(value) })) }}
        car={{ label: code(byId[focusId]?.name || ""), onStep: (step) => setFocusId((id) => stepCar(towerOrder, id, step)) }}
        cameraLabel={view === "tv" ? "TV" : cameraName(cameraPick)}
        onCamera={(step) => (view !== "camera" ? setView("camera") : setCameraPick((value) => cycle(cameraList, value, step)))}
      >
        {!over && (
          <button type="button" className="mn-btn mn-btn--sm" onClick={nextEvent} aria-label={t("Siguiente evento", "Next event")} title={t("Saltar al siguiente evento", "Skip to the next event")}>
            <IconNextEvent size={16} />
            <span className="wk-hide-md">{t("Siguiente evento", "Next event")}</span>
          </button>
        )}
        {!over && (
          <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={skip} title={t("Los ingenieros llevan a tus pilotos hasta el final", "The engineers run your drivers to the end")}>
            <IconNextEvent size={16} />
            {kind === "practice" ? t("Simular el resto", "Simulate the rest") : t(`Simular el resto de ${sessionTitle}`, `Simulate the rest of ${sessionTitle}`)}
          </button>
        )}
        <SoundControl audio={audio} />
      </PlaybackBar>
    </div>
  );
}

/**
 * One of your drivers: in the garage, the run plan and "Salir a pista"; on track, the lap
 * clock, the sectors and the calls; at the end, where they finished.
 */
function RunCard({ kind, engine, user, status, position, danger, flag, over, plan, onPlan, order, bestSectors, pole, focused, onFocus, slotAt, now }) {
  const car = status.car;
  const segment = engine.segments[engine.segment];
  const phase = status.phase;
  const onTrack = phase !== "garage" && phase !== "queued";
  const qualifying = kind !== "practice";
  const raceFuelLocked = segment.raceFuel && car.declaredFuel !== null;
  const lapsLeft = segment.lapLimit ? Math.max(0, segment.lapLimit - car.laps) : null;
  const neededFuel = qualifying ? 2 + (plan.push || 1) * 2 : (plan.laps || 1) + 2;
  const fuel = raceFuelLocked ? car.declaredFuel : plan.fuel ?? (segment.raceFuel ? car.raceFuel ?? Math.max(neededFuel, 12) : neededFuel + (SESSION_BALANCE.programmes[plan.programme || "quali"]?.fuelExtra ?? 0));
  const canLeave = !car.eliminated && !flag && !segment.singleLap && (lapsLeft === null || lapsLeft >= 3);
  const lastRun = car.runs[car.runs.length - 1];
  const delta = status.record?.sectors && status.sectors.length && car.bestSectors
    ? status.sectors.reduce((sum, value, index) => sum + value - car.bestSectors[index], 0)
    : null;
  const send = () => order("sendOut", car.id, { ...plan, fuel });
  const stateWord = car.eliminated
    ? t(`Eliminado en ${engine.segments[car.out]?.name ?? ""}`, `Out in ${engine.segments[car.out]?.name ?? ""}`)
    : danger && qualifying && !over
      ? t("Zona de corte", "Drop zone")
      : PHASE[phase]();
  return (
    <section className={`lv-card${focused ? " is-focus" : ""}${car.eliminated ? " is-out" : ""}`} aria-label={user.name} data-phase={phase}>
      <button type="button" className="lv-card__head" onClick={onFocus}>
        <span className="lv-card__pos">{position ?? "—"}</span>
        <i className="lv-card__stripe" style={{ "--stripe": readableOn(user.color) }} aria-hidden="true" />
        <span className="lv-card__name">{user.name}</span>
        <span className={`lv-flagword${danger && qualifying && !car.eliminated ? " is-danger" : onTrack ? " is-on" : ""}`}>{stateWord}</span>
        <span className="lv-card__lap">{status.best !== null ? lapTime(status.best) : ""}</span>
      </button>

      {onTrack && (
        <>
          <div className="lv-ctl">
            <span>{t("Vuelta", "Lap")}</span>
            <div className="lv-ctl__value">
              <b className={phase === "flying" ? "is-warn" : "is-text"}>{status.elapsed !== null ? lapTime(status.elapsed) : PHASE[phase]()}</b>
              {delta !== null && <small className={delta <= 0 ? "is-good" : "is-bad"}>{signed(delta)}</small>}
              <small>
                <Tyre compound={status.record?.compound || plan.compound} age={car.run?.set?.laps} size={18} />
              </small>
            </div>
          </div>
          {phase === "flying" && <Sectors status={status} car={car} best={bestSectors} />}
          <div className="lv-ctl">
            <span>{qualifying ? t("Intentos", "Attempts") : t("Vueltas", "Laps")}</span>
            <div className="lv-ctl__value">
              <b>
                {qualifying ? `${car.run?.pushes ?? 0}/${car.run?.plan.push ?? 0}` : `${car.run?.timed ?? 0}/${car.run?.plan.laps ?? 0}`}
              </b>
              <small>
                {t("Combustible", "Fuel")} {Math.max(0, Math.round(car.fuel ?? 0))} v{lapsLeft !== null ? ` · ${t(`quedan ${lapsLeft} v`, `${lapsLeft} laps left`)}` : ""}
              </small>
            </div>
          </div>
          {qualifying && (
            <div className="lv-ctl">
              <span>{t("Estilo", "Style")}</span>
              <Segmented label={t("Estilo", "Style")} value={car.run?.plan.style || "normal"} onChange={(value) => order("setStyle", car.id, value)} options={Object.keys(SESSION_BALANCE.pace.styles).map((value) => ({ value, label: QUALI_STYLE[value]() }))} />
            </div>
          )}
          <div className="lv-box">
            {phase === "flying" && (
              <button type="button" className="mn-btn mn-btn--sm mn-btn--danger" onClick={() => order("abortLap", car.id)}>
                {t("Abortar vuelta", "Abort lap")}
              </button>
            )}
            {phase !== "in" && phase !== "pitlane" && (
              <button type="button" className={`mn-btn mn-btn--sm${car.boxRequest ? " lv-box__called" : ""}`} onClick={() => order("boxNow", car.id)} disabled={car.boxRequest}>
                <IconExit size={16} />
                {car.boxRequest ? t("Entra al acabar la vuelta", "Boxing at the end of the lap") : phase === "flying" ? t("Volver a boxes tras la vuelta", "Box after this lap") : t("Volver a boxes", "Box now")}
              </button>
            )}
          </div>
        </>
      )}

      {phase === "queued" && (
        <div className="lv-box">
          <span>{t("Saliendo del garaje", "Leaving the garage")}</span>
          <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => order("hold", car.id)}>
            {t("Esperar", "Hold")}
          </button>
        </div>
      )}

      {phase === "garage" && !car.eliminated && !over && (
        <>
          {!qualifying && (
            <div className="lv-ctl lv-ctl--stack">
              <span>{t("Programa", "Programme")}</span>
              <Segmented
                label={t("Programa", "Programme")}
                value={plan.programme}
                onChange={(value) => onPlan({ programme: value, laps: SESSION_BALANCE.programmes[value].laps, fuel: null })}
                options={PROGRAMMES.map((value) => ({ value, label: value === "quali" ? t("Clasif.", "Quali") : value === "longrun" ? t("Tanda larga", "Long run") : t("Setup", "Setup") }))}
              />
            </div>
          )}
          <div className="lv-ctl lv-ctl--stack">
            <span>{t("Neumático", "Tyre")}</span>
            <TyrePicker sets={car.tyres} compound={segment.tyre || plan.compound} set={plan.set} locked={Boolean(segment.tyre)} wet={engine.wetness >= 0.15} onChange={(patch) => onPlan(patch)} />
          </div>
          <div className="lv-ctl lv-ctl--stack">
            <span>{qualifying ? t("Intentos", "Attempts") : t("Vueltas", "Laps")}</span>
            {qualifying ? (
              segment.singleLap ? (
                <div className="lv-ctl__value">
                  <b>1</b>
                  <small>{t("una vuelta lanzada", "one flying lap")}</small>
                </div>
              ) : (
                <Stepper label={t("Intentos", "Attempts")} value={plan.push || 1} min={LIMITS.pushLaps[0]} max={LIMITS.pushLaps[1]} onChange={(value) => onPlan({ push: value })} />
              )
            ) : (
              <Stepper label={t("Vueltas", "Laps")} value={plan.laps || 1} min={LIMITS.practiceLaps[0]} max={LIMITS.practiceLaps[1]} onChange={(value) => onPlan({ laps: value, fuel: null })} />
            )}
          </div>
          <div className="lv-ctl lv-ctl--stack">
            <span>{t("Combustible", "Fuel")}</span>
            {raceFuelLocked ? (
              <div className="lv-ctl__value">
                <IconLock size={16} />
                <b>{fuel} v</b>
                <small>{t("parque cerrado", "parc fermé")}</small>
              </div>
            ) : qualifying && !segment.raceFuel ? (
              <div className="lv-ctl__value">
                <b>{fuel} v</b>
                <small>{t("lo justo para la tanda", "just enough for the run")}</small>
              </div>
            ) : (
              <Stepper label={t("Combustible", "Fuel")} value={fuel} min={Math.max(LIMITS.fuelLaps[0], neededFuel)} max={LIMITS.fuelLaps[1]} unit="v" onChange={(value) => onPlan({ fuel: value })} />
            )}
          </div>
          {qualifying && (
            <div className="lv-ctl lv-ctl--stack">
              <span>{t("Estilo", "Style")}</span>
              <Segmented label={t("Estilo", "Style")} value={plan.style || "normal"} onChange={(value) => onPlan({ style: value })} options={Object.keys(SESSION_BALANCE.pace.styles).map((value) => ({ value, label: QUALI_STYLE[value]() }))} />
            </div>
          )}
          {segment.raceFuel && !raceFuelLocked && <p className="lv-card__status">{t("El combustible de esta tanda será el de la salida del domingo.", "This run's fuel is the fuel you start the race with.")}</p>}
          {lastRun && !qualifying && (
            <p className="lv-card__status">
              {t("Última tanda", "Last run")}: {PROGRAM[lastRun.programme]()} · {lastRun.laps} v{lastRun.average ? ` · ${t("media", "avg")} ${lapTime(lastRun.average)}` : ""}
            </p>
          )}
          <div className="lv-box">
            {segment.singleLap ? (
              <span className="lv-box__slot">
                {car.history.length ? t("Vuelta hecha", "Lap done") : t(`Sale en ${mmss(Math.max(0, (slotAt ?? 0) - now))}`, `Out in ${mmss(Math.max(0, (slotAt ?? 0) - now))}`)}
              </span>
            ) : (
              <button type="button" className="mn-btn mn-btn--sm lv-box__go" onClick={send} disabled={!canLeave}>
                <IconPlay size={16} />
                {t("Salir a pista", "Go out")}
              </button>
            )}
            {lapsLeft !== null && <small className="lv-box__issue">{t(`${lapsLeft} v disponibles`, `${lapsLeft} laps left`)}</small>}
          </div>
        </>
      )}

      {(over || car.eliminated) && (
        <p className="lv-card__status">
          {status.best !== null ? `${lapTime(status.best)}${pole !== null && status.best > pole ? ` · +${(status.best - pole).toFixed(3)}` : ""}` : t("Sin tiempo", "No time")}
        </p>
      )}
    </section>
  );
}
