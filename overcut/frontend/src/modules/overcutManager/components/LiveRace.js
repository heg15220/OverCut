/**
 * The race, live from the pit wall.
 *
 * The engine computes the Grand Prix a lap at a time, always just ahead of the
 * pictures; a race clock then plays it back at the speed the player chooses,
 * every car where its own lap says it is (see `raceClock.js`). On top of that
 * sit the cameras (the whole map, the overhead camera locked to a driver, or a
 * TV director hunting for fights), a timing tower read at the line, and the pit
 * wall: pace, fuel mixture and battery for each car, the stop calls and team
 * orders, the engineer on the radio and the commentary - all in time with what
 * is on screen.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuFastForward, LuSkipForward } from "react-icons/lu";
import {
  ERS_KEYS, MIX_KEYS, MODE_KEYS, cancelPit, compoundsFor, energyEra, refuellingEra, requestPit, runToFinish, setErs, setMix, setMode, setTeamOrder,
  stepLap, tyreLifeUsed,
} from "../engine/race";
import { circuitFor } from "../engine/venue";
import { poseAt } from "../engine/trackGeometry";
import { useManager } from "./context";
import { Tyre } from "./atoms";
import { ConditionsPanel, Dots, PlaybackBar, TimingTower } from "./Broadcast";
import { COMPOUND, ERS, MIX, MODE, STATUS, commentary, lapTime, radioText, t } from "./texts";
import RaceStage, { MiniMap } from "./RaceStage";
import { canRender3D } from "../three/support";

import { battlesIn, carAt, computedUntil, eventTime, leaderLap, raceEndTime, safetyCarWindows, standingsAt } from "./raceClock";

// three.js is only fetched when a race is watched in 3D, so the rest of OverCut stays light.
const Race3D = React.lazy(() => import("../three/Race3D"));

/** Playback speeds against real time: 1x is a real lap, 100x a race in a minute or two. */
const SPEEDS = [1, 4, 10, 30, 100];

/** Overhead camera widths, in metres of track across the screen. */
const ZOOMS = [70, 130, 280];

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

/** Events the feed shows: everything at the front, everything about you. */
const worthTelling = (event, carsById, positions) => {
  if (["sc", "vsc", "sc-in", "rain", "drying", "flag", "lead"].includes(event.type)) return true;
  const car = carsById[event.carId];
  const other = carsById[event.otherId];
  if (car?.isUser || other?.isUser) return true;
  if (event.type === "dnf" || event.type === "contact") return true;
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

export default function LiveRace({ state, onFinished }) {
  const { career } = useManager();
  const stateRef = useRef(state);
  const circuit = useMemo(() => circuitFor(state.race, state.year), [state.race, state.year]);
  const lapRef = state.race.baseLap;
  const userCars = state.cars.filter((car) => car.isUser);

  const [, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(10);
  const has3D = useMemo(() => canRender3D(), []);
  const [cameraMode, setCameraMode] = useState(() => (canRender3D() ? "tv" : "follow"));
  const in3D = has3D && cameraMode !== "map";
  const in3DRef = useRef(in3D);
  in3DRef.current = in3D;
  const zoom = 1;
  const [focusId, setFocusId] = useState(userCars[0]?.id ?? state.cars[0]?.id);
  const [towerMode, setTowerMode] = useState("interval");

  const tau = useRef(0);
  const intro = useRef(0);
  const introDone = useRef(false);
  const camera = useRef(null);
  const director = useRef({ id: null, until: 0 });
  const finishedRef = useRef(false);
  const eventTimes = useRef(new Map());
  const playRef = useRef({ playing, speed });
  playRef.current = { playing, speed };

  const ensure = useCallback(() => {
    const current = stateRef.current;
    if (current.lap === 0) stepLap(current);
    let guard = 0;
    while (!current.finished && tau.current >= computedUntil(current) && guard < 60) {
      stepLap(current);
      guard += 1;
    }
  }, []);

  // The first lap exists before anything is drawn.
  if (stateRef.current.lap === 0) stepLap(stateRef.current);

  // The clock: real time times the playback speed, after the start lights.
  useEffect(() => {
    let last = now();
    let handle = null;
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
          if (intro.current >= 4.6) introDone.current = true;
        } else {
          tau.current += dt * rate;
          ensure();
        }
      }
      // The 3D view samples the clock itself every frame; the data around it
      // only needs repainting a dozen times a second.
      if (!in3DRef.current || time - lastPaint >= 90) {
        lastPaint = time;
        setFrame((value) => (value + 1) % 1e9);
      }
      handle = raf(tick);
    };
    let lastPaint = 0;
    handle = raf(tick);
    return () => cancel(handle);
  }, [ensure]);

  const sample = useCallback((car, at) => carAt(car, at, circuit, lapRef), [circuit, lapRef]);

  const current = stateRef.current;
  const raceEnd = raceEndTime(current);
  const done = tau.current >= raceEnd + 2;

  // Hand the race back once everyone is home. Keyed on `done` alone: the view
  // re-renders every frame, and a timer cleared on each render would never fire.
  const finish = useRef(onFinished);
  finish.current = onFinished;
  useEffect(() => {
    if (!done) return undefined;
    finishedRef.current = true;
    const id = setTimeout(() => finish.current(stateRef.current), 1800);
    return () => clearTimeout(id);
  }, [done]);

  const rows = standingsAt(current.cars, tau.current, circuit, lapRef);
  const byId = Object.fromEntries(current.cars.map((car) => [car.id, car]));
  const rowOf = Object.fromEntries(rows.map((row) => [row.car.id, row]));
  const positions = Object.fromEntries(rows.map((row) => [row.car.id, row.position]));
  const names = Object.fromEntries(current.cars.map((car) => [car.id, car.name]));
  const leader = rows.find((row) => !row.out);
  const displayLap = leaderLap(rows, current.laps);
  const wetness = current.weather.wetness[Math.min(displayLap, current.laps)] ?? 0;
  const leaderFinished = Boolean(leader?.pose.finished);

  const timeOf = (event) => {
    if (!eventTimes.current.has(event)) eventTimes.current.set(event, eventTime(event, byId, circuit, leader?.car.id));
    return eventTimes.current.get(event);
  };
  const visibleEvents = current.events.filter((event) => timeOf(event) <= tau.current);
  const feed = visibleEvents.filter((event) => worthTelling(event, byId, positions)).slice(-16).reverse();
  const radio = current.radio.filter((message) => (byId[message.carId]?.history?.[message.lap - 1]?.end ?? Infinity) <= tau.current).slice(-3).reverse();
  const scWindow = safetyCarWindows(current.events, byId, circuit, leader?.car.id).find((w) => tau.current >= w.from && tau.current < w.to);
  const fastest = visibleEvents.filter((event) => event.type === "fastest").pop();

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
  if (scWindow && !scWindow.virtual && leader && !leader.pose.inPit) {
    const share = ((leader.pose.progress % 1) + 1) % 1;
    safetyCar = poseAt(circuit, share + 90 / circuit.length);
  }

  const stageCars = rows.map((row) => ({ car: row.car, code: code(row.car.name), pose: row.pose, row: row.out ? null : row }));

  // ---- player calls
  const call = (fn) => {
    fn(stateRef.current);
    setFrame((value) => value + 1);
  };

  const oneLap = () => {
    introDone.current = true;
    ensure();
    const lead = standingsAt(current.cars, tau.current, circuit, lapRef).find((row) => !row.out);
    const entry = lead?.car.history?.[lead.completed];
    tau.current = entry ? entry.end + 0.01 : raceEndTime(current);
    ensure();
    setFrame((value) => value + 1);
  };

  const toFlag = () => {
    introDone.current = true;
    runToFinish(stateRef.current);
    tau.current = raceEndTime(stateRef.current) + 0.01;
    setFrame((value) => value + 1);
  };

  const compounds = [...compoundsFor(current.year), "inter", "wet"];
  const refuel = refuellingEra(current.year);
  const energy = energyEra(current.year);
  const userTeam = userCars[0]?.teamId;
  const lightsOn = introDone.current ? 0 : Math.min(5, Math.floor(intro.current / 0.8) + 1);
  const teams = useMemo(() => {
    const seen = new Map();
    state.cars.forEach((car) => {
      if (!seen.has(car.teamId)) seen.set(car.teamId, { id: car.teamId, color: car.color, slot: car.boxSlot });
    });
    return [...seen.values()].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  }, [state.cars]);
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
  const towerLabel = { interval: t("Intervalo", "Interval"), gap: t("Líder", "Leader"), tyres: t("Neumáticos", "Tyres") }[towerMode];

  const towerRows = rows.map((row, index) => {
    const { car, pose } = row;
    const out = row.out;
    let value;
    if (out) value = STATUS[car.retireReason] ? STATUS[car.retireReason]() : t("Ab", "Out");
    else if (pose.inPit) value = t("EN BOXES", "IN PIT");
    else if (towerMode === "tyres") value = <Tyre compound={car.compound} age={car.tyreAge} size={18} />;
    else if (index === 0) value = pose.finished ? "🏁" : towerMode === "gap" ? t("Líder", "Leader") : row.completed > 0 ? `${t("V", "L")}${row.completed + 1}` : t("Líder", "Leader");
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
        battle: battles.some((entry) => entry.attacker === row || entry.defender === row),
        fastest: fastest?.carId === car.id,
      },
    };
  });

  const ticker = feed.slice(0, 3);

  return (
    <div className={`bc bc--race${in3D ? " is-3d" : ""}`}>
      <div className="bc__stage">
        {in3D ? (
          <React.Suspense fallback={<div className="mn-stage__loading">{t("Cargando el circuito en 3D…", "Loading the circuit in 3D…")}</div>}>
            <Race3D
              circuit={circuit}
              year={current.year}
              cars={stageCars}
              focusId={cameraMode === "tv" ? director.current.id : focusId}
              mode={cameraMode}
              wet={wetness > 0.2}
              lights={lightsOn}
              safetyCarOn={Boolean(scWindow && !scWindow.virtual)}
              clock={tau}
              sample={sample}
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
            labels={{ map: t("Mapa del circuito", "Circuit map"), near: t("Cámara cenital", "Overhead camera"), box: "BOX" }}
          />
        )}
        {wetness > 0.2 && !in3D && <div className="mn-stage__rain" style={{ opacity: Math.min(0.85, wetness + 0.15) }} aria-hidden="true" />}
        {!introDone.current && !in3D && (
          <div className="mn-lights" aria-label={t("Semáforo de salida", "Start lights")}>
            {[0, 1, 2, 3, 4].map((index) => (
              <span key={index} className={index < lightsOn ? "is-on" : ""} />
            ))}
          </div>
        )}
        <div className="bc__banners">
          {scWindow && <span className={`bc-flag ${scWindow.virtual ? "is-vsc" : "is-sc"}`}>{scWindow.virtual ? "VIRTUAL SAFETY CAR" : "SAFETY CAR"}</span>}
          {introDone.current && tau.current < 3 && <div className="mn-stage__banner mn-stage__banner--go">{t("¡Se apagan los semáforos!", "Lights out and away we go!")}</div>}
          {leaderFinished && (
            <div className="mn-stage__banner mn-stage__banner--flag">
              <span className="mn-checker" aria-hidden="true" />
              {t("Bandera a cuadros", "Chequered flag")} · {leader?.car.name}
            </div>
          )}
          {!leaderFinished && battles[0] && cameraMode !== "tv" && (
            <div className="bc-battle">
              {t(`Lucha por P${battles[0].position}`, `Battle for P${battles[0].position}`)}: <b>{code(battles[0].attacker.car.name)}</b> → <b>{code(battles[0].defender.car.name)}</b> · {battles[0].gap.toFixed(1)}s
            </div>
          )}
        </div>
        <ol className="bc-ticker" aria-live="polite" aria-label={t("Comentarios", "Commentary")}>
          {ticker.map((event, index) => (
            <li key={`${event.lap}-${event.type}-${event.carId}-${index}`} className={`is-${event.type}`}>
              <b>{t("V", "L")}{event.lap}</b> {commentary(event, names, current.track)}
            </li>
          ))}
        </ol>
        <div className="bc-radio" aria-live="polite">
          {radio.slice(0, 2).map((message, index) => (
            <p key={`${message.lap}-${message.kind}-${index}`}>
              <b>RADIO</b> {radioText(career, message, names)}
            </p>
          ))}
        </div>
      </div>

      <TimingTower
        label={t("Torre de tiempos", "Timing tower")}
        title={t("CARRERA", "RACE")}
        subtitle={
          <>
            {t("VUELTA", "LAP")} <b>{displayLap}</b> / {current.laps}
          </>
        }
        modeLabel={towerLabel}
        onMode={(step) => setTowerMode((value) => cycle(TOWER_MODES, value, step))}
        rows={towerRows}
        onPick={setFocusId}
      />

      <ConditionsPanel title={t("VISTA DE CARRERA", "RACE VIEW")} clock={clock} airTemp={trackTemp * 0.62 + 4} rainChance={current.weather.forecast ?? 0} change={change} trackTemp={trackTemp} wetness={wetness} rubber={rubber}>
        <MiniMap circuit={circuit} cars={stageCars} focusId={cameraMode === "tv" ? director.current.id : focusId} label={t("Minimapa", "Mini map")} />
      </ConditionsPanel>

      <div className="bc-cards">
        {userCars.map((car) => (
          <DriverCard key={car.id} car={car} row={rowOf[car.id]} state={current} compounds={compounds} refuel={refuel} energy={energy} call={call} focused={focusId === car.id} onFocus={() => setFocusId(car.id)} />
        ))}
      </div>

      <PlaybackBar
        playing={playing}
        onPlay={() => setPlaying((value) => !value)}
        disabled={done}
        speedLabel={`${speed}×`}
        onSpeed={(step) => setSpeed((value) => SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, SPEEDS.indexOf(value) + step))])}
        cameraLabel={cameraMode === "tv" ? `TV · ${directorLabel}` : `${cameraLabel}${cameraMode !== "map" ? ` · ${code(focusName)}` : ""}`}
        onCamera={(step) => setCameraMode((value) => cycle(cameraList, value, step))}
      >
        <button type="button" className="bc-playback__btn" onClick={oneLap} aria-label={t("Una vuelta", "One lap")} disabled={current.finished && tau.current >= raceEnd}>
          <LuSkipForward />
        </button>
        <button type="button" className="bc-playback__text" onClick={toFlag} disabled={current.finished && tau.current >= raceEnd}>
          <LuFastForward aria-hidden="true" />
          {t("Al final", "To the flag")}
        </button>
        {userCars.length === 2 && !current.finished && (
          <button type="button" className="bc-playback__text" onClick={() => call((s) => setTeamOrder(s, userTeam, cycle(["free", "hold", "swap"], s.teamOrders[userTeam] || "free", 1)))} title={t("Órdenes de equipo", "Team orders")}>
            {t("Órdenes", "Orders")}: {{ free: t("Libres", "Race"), hold: t("Mantener", "Hold"), swap: t("Intercambiar", "Swap") }[current.teamOrders[userTeam] || "free"]}
          </button>
        )}
      </PlaybackBar>
    </div>
  );
}

const TEMP_LABEL = (temp) => (temp < 0.4 ? { label: t("Fríos", "Cold"), tone: "cold" } : temp > 0.72 ? { label: t("Sobrecalentados", "Overheating"), tone: "hot" } : { label: t("En ventana", "In window"), tone: "ok" });

/**
 * One of the player's cars, the way the F1 Manager pit wall shows it: position
 * and name, then three columns - pace (tyres and how hard to push), fuel (the
 * margin and the mixture) and the battery - and the stop call underneath.
 */
function DriverCard({ car, row, state, compounds, refuel, energy, call, focused, onFocus }) {
  const running = car.status === "running";
  const life = Math.max(0, 1 - tyreLifeUsed(car, state.year));
  const temp = TEMP_LABEL(car.tyreTemp ?? 0.5);
  const remaining = Math.max(0, state.laps - state.lap);
  const burn = { lean: 0.93, standard: 1, rich: 1.07 }[car.fuelMode] ?? 1;
  const fuelMargin = refuel ? null : car.fuel / burn - remaining;
  const position = row && !row.out ? row.position : car.position;
  const drs = state.era.features.drs && running && car.gapAhead !== null && car.gapAhead < 1 && state.lap > 2;
  const surname = (car.name || "").split(" ").filter((part) => !/^(jr|sr)\.?$/i.test(part)).pop()?.toUpperCase();
  return (
    <section className={`bc-card${running ? "" : " is-out"}${focused ? " is-focus" : ""}`} style={{ "--team": car.color }} aria-label={car.name}>
      <header onClick={onFocus}>
        <b>{position}</b>
        <i />
        <strong>{surname}</strong>
        <span className={`bc-card__drs${drs ? " is-on" : ""}`}>DRS</span>
        {car.lastLap && <small>{lapTime(car.lastLap)}</small>}
      </header>
      {running ? (
        <>
          <div className="bc-card__grid">
            <div className="bc-card__col">
              <span className="bc-card__title">{t("Ritmo", "Pace")}</span>
              <div className="bc-card__line">
                <Tyre compound={car.compound} age={car.tyreAge} size={22} />
                <b className={life < 0.2 ? "is-bad" : life < 0.4 ? "is-warn" : ""}>{Math.round(life * 100)}%</b>
              </div>
              <div className={`bc-meter bc-meter--${temp.tone}`} title={temp.label}>
                <i style={{ width: `${Math.round((car.tyreTemp ?? 0.5) * 100)}%` }} />
              </div>
              <Dots label={t("Ritmo", "Pace")} value={car.mode} onChange={(mode) => call((s) => setMode(s, car.id, mode))} options={MODE_KEYS.map((mode) => ({ value: mode, label: MODE[mode]() }))} />
            </div>
            <div className="bc-card__col">
              <span className="bc-card__title">{t("Combustible", "Fuel")}</span>
              <div className="bc-card__line">
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
              </div>
              <div className="bc-meter bc-meter--fuel">
                <i style={{ width: `${Math.round(Math.min(1, car.fuel / Math.max(1, refuel ? 30 : state.fuelStart)) * 100)}%` }} />
              </div>
              {!refuel ? (
                <Dots label={t("Mezcla", "Fuel mix")} value={car.fuelMode} onChange={(mix) => call((s) => setMix(s, car.id, mix))} options={MIX_KEYS.map((mix) => ({ value: mix, label: MIX[mix]() }))} />
              ) : (
                <small className="bc-card__note">{t("Repostaje en cada parada", "Refuel at every stop")}</small>
              )}
            </div>
            <div className="bc-card__col">
              <span className="bc-card__title">{energy === "kers" ? "KERS" : energy ? "ERS" : t("Estrategia", "Strategy")}</span>
              {car.battery !== null && car.battery !== undefined ? (
                <>
                  <div className="bc-card__line">
                    <b>{Math.round(car.battery)}%</b>
                  </div>
                  <div className="bc-meter bc-meter--ers">
                    <i style={{ width: `${Math.round(car.battery)}%` }} />
                  </div>
                  <Dots tone="cyan" label="ERS" value={car.ersMode} onChange={(mode) => call((s) => setErs(s, car.id, mode))} options={ERS_KEYS.map((mode) => ({ value: mode, label: ERS[mode]() }))} />
                </>
              ) : (
                <>
                  <div className="bc-card__line">
                    <b>
                      {car.stops} {t("paradas", "stops")}
                    </b>
                  </div>
                  <small className="bc-card__note">
                    {t("Plan", "Plan")}: {car.plan.stops.filter((lap) => lap > state.lap).map((lap) => `${t("V", "L")}${lap}`).join(" · ") || "—"}
                  </small>
                </>
              )}
            </div>
          </div>
          <div className="bc-card__box">
            {car.pitRequest ? (
              <button type="button" className="bc-box is-called" onClick={() => call((s) => cancelPit(s, car.id))}>
                {t(`BOX V${car.pitRequest.lap} · ${COMPOUND[car.pitRequest.compound]()} · cancelar`, `BOX L${car.pitRequest.lap} · ${COMPOUND[car.pitRequest.compound]()} · cancel`)}
              </button>
            ) : (
              <>
                <span>BOX</span>
                {compounds.map((compound) => (
                  <button type="button" key={compound} className="mn-pit-tyre" onClick={() => call((s) => requestPit(s, car.id, compound))} aria-label={t(`Parar y montar ${COMPOUND[compound]().toLowerCase()}`, `Box for ${COMPOUND[compound]()}`)} title={t(`Box: ${COMPOUND[compound]()}`, `Box: ${COMPOUND[compound]()}`)}>
                    <Tyre compound={compound} size={22} />
                  </button>
                ))}
              </>
            )}
            {car.issue ? <em className="bc-card__issue">{t("Problema", "Issue")} +{car.issue.toFixed(1)}s</em> : null}
          </div>
        </>
      ) : (
        <p className="bc-card__status">{car.status === "finished" ? t("Terminado", "Finished") : STATUS[car.retireReason] ? STATUS[car.retireReason]() : ""}</p>
      )}
    </section>
  );
}
