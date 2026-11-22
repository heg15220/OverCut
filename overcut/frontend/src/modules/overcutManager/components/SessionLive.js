/**
 * Practice and qualifying, live: the same broadcast as the race - the circuit
 * in 3D, the timing tower, the conditions and your drivers - over a session
 * clock instead of laps. Cars leave their garages, set times, come back in;
 * the tower orders them by best lap, the knockout zone glows red as the clock
 * runs down, and at the flag the slowest are out and the next session starts.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuFastForward, LuFlag } from "react-icons/lu";
import { sessionStatus } from "../engine/sessions";
import { Tyre } from "./atoms";
import { ConditionsPanel, PlaybackBar, TimingTower } from "./Broadcast";
import { carAt } from "./raceClock";
import RaceStage, { MiniMap } from "./RaceStage";
import { lapTime, t } from "./texts";
import { canRender3D } from "../three/support";

const Race3D = React.lazy(() => import("../three/Race3D"));

const SPEEDS = [1, 4, 10, 30, 60];

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

const STATE_LABEL = {
  garage: () => t("EN BOXES", "IN PIT"),
  out: () => t("SALIDA", "OUT LAP"),
  in: () => t("ENTRANDO", "IN LAP"),
  flying: () => t("LANZADA", "FLYING"),
};

const cycle = (list, value, step) => list[(list.indexOf(value) + step + list.length) % list.length];

export default function SessionLive({ kind, timeline, entrants, circuit, year, baseLap, wetness = 0, trackTemp = 32, rainChance = 0, onDone, compact = false }) {
  const has3D = useMemo(() => canRender3D(), []);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(kind === "practice" ? 30 : 10);
  const [cameraMode, setCameraMode] = useState(has3D ? "tv" : "follow");
  const in3DRef = useRef(false);
  const users = entrants.filter((entry) => entry.isUser);
  const [focusId, setFocusId] = useState(users[0]?.id ?? entrants[0]?.id);
  const [, setFrame] = useState(0);
  const tau = useRef(0);
  const playRef = useRef({ playing, speed });
  playRef.current = { playing, speed };

  const session = timeline.sessions[sessionIndex];
  const teamOrder = useMemo(() => [...new Set(entrants.map((entry) => entry.teamId))], [entrants]);
  const compound = year < 1982 ? "dry" : kind === "practice" ? (year >= 2007 ? "medium" : "hard") : "soft";
  const cars = useMemo(
    () =>
      session.ids
        .map((id) => entrants.find((entry) => entry.id === id))
        .filter(Boolean)
        .map((entry) => ({
          ...entry,
          history: session.histories[entry.id] || [],
          garage: true,
          status: "session",
          compound,
          boxSlot: teamOrder.indexOf(entry.teamId) / Math.max(1, teamOrder.length - 1),
        })),
    [session, entrants, teamOrder, compound],
  );
  const teams = useMemo(() => teamOrder.map((teamId, index) => ({ id: teamId, color: entrants.find((entry) => entry.teamId === teamId)?.color, slot: index / Math.max(1, teamOrder.length - 1) })), [teamOrder, entrants]);

  // The session clock.
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
      if (playRef.current.playing) tau.current += dt * playRef.current.speed;
      if (!in3DRef.current || time - lastPaint >= 90) {
        lastPaint = time;
        setFrame((value) => (value + 1) % 1e9);
      }
      handle = raf(tick);
    };
    handle = raf(tick);
    return () => cancel(handle);
  }, []);

  const now = tau.current;
  const over = now >= session.duration;
  const status = Object.fromEntries(cars.map((car) => [car.id, sessionStatus(car.history, now)]));
  const allIn = over && cars.every((car) => status[car.id].state === "garage");
  const ordered = [...cars].sort((a, b) => {
    const ba = status[a.id].best;
    const bb = status[b.id].best;
    if (ba !== null && bb !== null) return ba - bb;
    if (ba !== null) return -1;
    if (bb !== null) return 1;
    return session.ids.indexOf(a.id) - session.ids.indexOf(b.id);
  });
  const pole = status[ordered[0]?.id]?.best;
  const cut = session.drop ? ordered.length - session.drop : Infinity;

  const rows = ordered.map((car, index) => {
    const st = status[car.id];
    const value = st.best === null ? STATE_LABEL[st.state]() : index === 0 ? lapTime(st.best) : `+${(st.best - pole).toFixed(3)}`;
    return {
      id: car.id,
      position: index + 1,
      code: code(car.name),
      color: car.color,
      value,
      flags: {
        user: car.isUser,
        pit: st.state === "garage" && st.best !== null,
        danger: index >= cut && !over,
        eliminated: index >= cut && over,
        focus: car.id === focusId,
      },
    };
  });
  const positionOf = Object.fromEntries(rows.map((row) => [row.id, row.position]));

  const stageCars = cars.map((car) => {
    const st = status[car.id];
    return {
      car,
      code: code(car.name),
      pose: carAt(car, now, circuit, baseLap),
      row: { position: positionOf[car.id] },
      tag: st.lapClock !== null ? lapTime(st.lapClock) : st.best !== null ? lapTime(st.best) : STATE_LABEL[st.state](),
    };
  });

  const sample = useCallback((car, at) => carAt(car, at, circuit, baseLap), [circuit, baseLap]);
  const next = timeline.sessions[sessionIndex + 1];
  const advance = () => {
    if (next) {
      tau.current = 0;
      setSessionIndex(sessionIndex + 1);
    } else onDone();
  };

  const cameraList = has3D ? ["tv", "chase", "drone", "heli", "tcam", "visor", "nose", "tcamRear", "map"] : ["follow", "tv", "map"];
  const CAMERA = {
    tv: "TV", chase: t("Persecución", "Chase"), drone: t("Dron", "Drone"), heli: "Helicam", tcam: "T-cam", visor: t("Visor", "Visor"), nose: t("Morro", "Nose"),
    tcamRear: t("T-cam trasera", "Rear T-cam"), follow: t("Cenital", "Overhead"), map: t("Mapa", "Map"),
  };
  const in3D = has3D && cameraMode !== "map";
  in3DRef.current = in3D;
  const focusPose = stageCars.find((item) => item.car.id === focusId)?.pose || stageCars[0]?.pose || { x: 0, y: 0, heading: 0 };
  const title = kind === "practice" ? t("LIBRES", "PRACTICE") : session.name === "Q" ? t("CLASIFICACIÓN", "QUALIFYING") : session.name;

  return (
    <div className={`bc bc--session${compact ? " is-compact" : ""}${in3D ? " is-3d" : ""}`}>
      <div className="bc__stage">
        {in3D ? (
          <React.Suspense fallback={<div className="mn-stage__loading">{t("Cargando el circuito en 3D…", "Loading the circuit in 3D…")}</div>}>
            <Race3D circuit={circuit} year={year} cars={stageCars} focusId={focusId} mode={cameraMode} wet={wetness > 0.2} lights={0} safetyCar={null} teams={teams} onPick={setFocusId} labels={{ near: title }} clock={tau} sample={sample} />
          </React.Suspense>
        ) : (
          <RaceStage
            circuit={circuit}
            year={year}
            cars={stageCars}
            camera={{ mode: cameraMode === "map" ? "map" : cameraMode === "tv" ? "tv" : "follow", x: focusPose.x, y: focusPose.y, heading: focusPose.heading, rotate: cameraMode !== "tv", view: 130 }}
            wet={wetness > 0.2}
            teams={teams}
            safetyCar={null}
            focusId={focusId}
            onPick={setFocusId}
            labels={{ map: t("Mapa del circuito", "Circuit map"), near: title, box: "BOX" }}
          />
        )}
        <div className="bc__banners">
          {over && (
            <div className="mn-stage__banner mn-stage__banner--flag">
              <span className="mn-checker" aria-hidden="true" />
              {t(`Bandera a cuadros · fin de ${title}`, `Chequered flag · end of ${title}`)}
            </div>
          )}
          {over && (allIn || now > session.duration + 200) && (
            <button type="button" className="bc-continue" onClick={advance}>
              {next ? t(`Ir a ${next.name}`, `On to ${next.name}`) : kind === "practice" ? t("Cerrar libres", "Close practice") : t("Ver la parrilla", "See the grid")}
            </button>
          )}
        </div>
      </div>

      <TimingTower
        label={t("Torre de tiempos", "Timing tower")}
        title={title}
        subtitle={<b>{over ? "0:00" : mmss(session.duration - now)}</b>}
        modeLabel={t("Mejor vuelta", "Best lap")}
        onMode={() => {}}
        rows={rows}
        onPick={setFocusId}
      />

      <ConditionsPanel
        title={kind === "practice" ? t("ENTRENAMIENTOS LIBRES", "FREE PRACTICE") : t("CLASIFICACIÓN", "QUALIFYING")}
        clock={clockOf((kind === "practice" ? 11 : 14) * 3600 + now + sessionIndex * 1200)}
        airTemp={trackTemp * 0.62 + 4}
        rainChance={rainChance}
        change={t("Condiciones estables", "Settled conditions")}
        trackTemp={trackTemp}
        wetness={wetness}
        rubber={Math.min(1, 0.2 + now / Math.max(1, session.duration) * 0.6 + sessionIndex * 0.15)}
      >
        <MiniMap circuit={circuit} cars={stageCars} focusId={focusId} label={t("Minimapa", "Mini map")} />
      </ConditionsPanel>

      <div className="bc-cards">
        {users
          .filter((user) => session.ids.includes(user.id))
          .map((user) => {
            const st = status[user.id];
            const position = positionOf[user.id];
            const danger = position > cut;
            return (
              <section key={user.id} className={`bc-card${focusId === user.id ? " is-focus" : ""}`} style={{ "--team": user.color }} aria-label={user.name}>
                <header onClick={() => setFocusId(user.id)}>
                  <b>{position}</b>
                  <i />
                  <strong>{(user.name || "").split(" ").pop().toUpperCase()}</strong>
                  <span className={`bc-card__drs${danger ? " is-danger" : ""}`}>{danger ? t("ELIMINADO", "OUT") : session.name}</span>
                  <small>{mmss(session.duration - now)}</small>
                </header>
                <div className="bc-card__grid">
                  <div className="bc-card__col">
                    <span className="bc-card__title">{t("Mejor vuelta", "Best lap")}</span>
                    <div className="bc-card__line">
                      <Tyre compound={compound} size={22} />
                      <b className="is-good">{st.best !== null ? lapTime(st.best) : "—"}</b>
                    </div>
                    <small className="bc-card__note">{st.best !== null && pole && st.best > pole ? `+${(st.best - pole).toFixed(3)}` : st.best !== null ? t("Mejor tiempo", "Fastest") : ""}</small>
                  </div>
                  <div className="bc-card__col">
                    <span className="bc-card__title">{t("Vuelta en curso", "Current lap")}</span>
                    <div className="bc-card__line">
                      <b className={st.state === "flying" ? "is-warn" : ""}>{st.lapClock !== null ? lapTime(st.lapClock) : STATE_LABEL[st.state]()}</b>
                    </div>
                    <div className="bc-meter bc-meter--fuel">
                      <i style={{ width: `${st.lapClock !== null ? Math.min(100, Math.round((st.lapClock / baseLap) * 100)) : 0}%` }} />
                    </div>
                  </div>
                  <div className="bc-card__col">
                    <span className="bc-card__title">{t("Vueltas", "Laps")}</span>
                    <div className="bc-card__line">
                      <b>{st.laps}</b>
                    </div>
                    <small className="bc-card__note">{kind === "practice" ? t("Tandas largas con combustible", "Long runs on fuel") : t("Neumático blando nuevo", "New soft tyres")}</small>
                  </div>
                </div>
              </section>
            );
          })}
      </div>

      <PlaybackBar
        playing={playing}
        onPlay={() => setPlaying((value) => !value)}
        speedLabel={`${speed}×`}
        onSpeed={(step) => setSpeed((value) => SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, SPEEDS.indexOf(value) + step))])}
        cameraLabel={`${CAMERA[cameraMode]}${cameraMode !== "map" ? ` · ${code(entrants.find((entry) => entry.id === focusId)?.name || "")}` : ""}`}
        onCamera={(step) => setCameraMode((value) => cycle(cameraList, value, step))}
      >
        {!over && (
          <button type="button" className="bc-playback__text" onClick={() => { tau.current = session.duration + 201; }}>
            <LuFastForward aria-hidden="true" />
            {t("Saltar sesión", "Skip session")}
          </button>
        )}
        {kind === "practice" && (
          <button type="button" className="bc-playback__text" onClick={onDone}>
            <LuFlag aria-hidden="true" />
            {t("Ocultar", "Hide")}
          </button>
        )}
      </PlaybackBar>
    </div>
  );
}
