/**
 * A race weekend, from the pit wall (DESIGN.md §6.5, RF-WKD-01..07): the era's
 * session plan across the top, Friday's briefing and setup work, Saturday's
 * risk, Sunday's strategy and then the race itself, live or simulated, and the
 * post-race screens (classification, lap chart, pit stops, standings moves).
 */

import React, { useMemo, useState } from "react";
import {
  PRACTICE_PROGRAMS, PRACTICE_RUNS, QUALI_STYLES, completeRace, createWeekendRace, currentRace, defaultPlan, entrantsFor, eraOf, planDelta, runPractice,
  runQualifyingSession, runSetupLap, setPlan, setSetup, setupStateOf, weekendForecast, weekendRaceArgs,
} from "../engine/career";
import { FEELINGS, SLIDERS } from "../engine/setup";
import CircuitCard from "./CircuitCard";
import SessionLive from "./SessionLive";
import { practiceTimeline, qualifyingTimeline } from "../engine/sessions";
import { circuitFor } from "../engine/venue";
import LapChart from "./LapChart";
import { rulesFor, runToFinish, spacedStops, stintLengths } from "../engine/race";
import { constructorStandings, driverStandings } from "../engine/standings";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Badge, DataTable, Flag, Meter, Panel, Segmented, StatTile, Tabs, TeamBadge, TeamStripe, Tyre, readableOn } from "./atoms";
import { IconArrowDown, IconArrowUp, IconCheck, IconClose, IconFastForward, IconFlag, IconPlay, IconRadio } from "./icons";
import { COMPOUND, PROGRAM, PROGRAM_HINT, QUALI_STYLE, gapText, lapTime, ordinal, raceName, shortDate, t } from "./texts";
import LiveRace from "./LiveRace";
import { canRender3D } from "../three/support";
import "./styles/weekend.css";

// The 3D podium brings three.js with it; fetched only when a result is shown in a browser that can draw it.
const Podium = React.lazy(() => import("../three/Podium"));

const STAGES = ["practice", "qualifying", "strategy", "race", "result"];

/** The era's qualifying format, in words (SRS 6.2, rules.qualifying.formats). */
const qualifyingFormat = (rules) => {
  const formats = rules.qualifying.formats || [];
  if (formats.includes("KNOCKOUT")) return "Q1 · Q2 · Q3";
  if (formats.includes("AGGREGATE")) return t("Agregada", "Aggregate");
  if (formats.includes("ONE_LAP")) return t("Vuelta única", "Single lap");
  if (formats.includes("ONE_SESSION")) return t("Una hora", "One hour");
  return t("Dos sesiones", "Two sessions");
};

/** RF-WKD-01: the weekend as this era runs it. */
const sessionPlan = (rules, race) => ({
  practice: [t("Libres", "Practice"), t("Puesta a punto", "Setup")],
  qualifying: [t("Clasificación", "Qualifying"), qualifyingFormat(rules)],
  strategy: [t("Estrategia", "Strategy"), rules.refuelling ? t("Con repostaje", "Refuelling") : rules.tyres.mandatoryDryCompounds >= 2 ? t("Dos compuestos", "Two compounds") : t("Paradas", "Pit stops")],
  race: [t("Carrera", "Race"), t(`${race.laps} vueltas`, `${race.laps} laps`)],
  result: [t("Resultado", "Result"), t("Puntos y Mundial", "Points and standings")],
});

export default function Weekend() {
  const { career, act, setWeekendOpen, finishWeekend } = useManager();
  const weekend = career.weekend;
  const race = currentRace(career);
  const [live, setLive] = useState(null);
  const [watchQuali, setWatchQuali] = useState(false);
  if (!weekend || !race) return null;
  const stage = live ? "race" : weekend.stage;
  const rules = rulesFor(eraOf(career));
  const plan = sessionPlan(rules, race);
  const team = career.world.teams[career.teamId];
  const isLive = Boolean(live) || (stage === "strategy" && watchQuali);

  // RF-WKD-02: live, the step race runs in the race worker from the weekend's arguments
  // (SRS 4); instant, the quick mode runs to the flag here and now (RNF-01).
  const startRace = (watch) => {
    if (watch) {
      const args = act((c) => weekendRaceArgs(c));
      if (args) setLive({ args });
      return;
    }
    const state = act((c) => createWeekendRace(c));
    if (!state) return;
    runToFinish(state);
    act((c) => completeRace(c, state));
  };

  const onFinished = (state) => {
    act((c) => completeRace(c, state));
    setLive(null);
  };

  return (
    <div className="wk" role="dialog" aria-modal="true" aria-label={raceName(race.name)} style={{ "--team-line": readableOn(team?.color, "#0e1520") }}>
      <header className="wk-head">
        <div className="wk-head__id">
          <Flag code={race.country} width={28} />
          <div className="wk-head__text">
            <strong>{raceName(race.name)}</strong>
            <small>
              {t("Ronda", "Round")} {race.round}/{career.world.races.length} · {shortDate(race.date)} · {race.laps} {t("vueltas", "laps")}
            </small>
          </div>
        </div>
        <ol className="wk-steps" aria-label={t("Programa del fin de semana", "Weekend programme")}>
          {STAGES.map((entry, index) => {
            const state = entry === stage ? "is-active" : STAGES.indexOf(stage) > index ? "is-done" : "";
            return (
              <li key={entry} className={state} aria-current={entry === stage ? "step" : undefined}>
                <span className="wk-steps__n" aria-hidden="true">
                  {state === "is-done" ? <IconCheck size={14} /> : index + 1}
                </span>
                <span className="wk-steps__label">
                  <b>{plan[entry][0]}</b>
                  <small>{plan[entry][1]}</small>
                </span>
              </li>
            );
          })}
        </ol>
        {isLive ? (
          <span className="wk-head__live">
            <IconRadio size={16} />
            {t("En directo", "Live")}
          </span>
        ) : (
          weekend.stage !== "result" && (
            <button type="button" className="mn-icon-btn" onClick={() => setWeekendOpen(false)} aria-label={t("Volver a la central", "Back to headquarters")} title={t("Volver a la central", "Back to headquarters")}>
              <IconClose size={18} />
            </button>
          )
        )}
      </header>
      <div className={`wk-body${isLive ? " is-live" : ""}`} key={`${stage}-${isLive}`}>
        {stage === "practice" && <Practice rules={rules} />}
        {stage === "qualifying" && <Qualifying rules={rules} onQualified={() => canRender3D() && setWatchQuali(true)} />}
        {stage === "strategy" && watchQuali && <QualifyingLive onDone={() => setWatchQuali(false)} />}
        {stage === "strategy" && !watchQuali && <Strategy rules={rules} onStart={startRace} />}
        {stage === "race" && live && <LiveRace args={live.args} onFinished={onFinished} />}
        {stage === "result" && <Result onContinue={finishWeekend} />}
      </div>
    </div>
  );
}

const SLIDER_TEXT = {
  frontWing: () => [t("Alerón delantero", "Front wing"), t("Más: morro más incisivo en curva", "More: a sharper front in corners")],
  rearWing: () => [t("Alerón trasero", "Rear wing"), t("Más: trasera estable y tracción, menos punta", "More: a planted rear and traction, less top speed")],
  antiRoll: () => [t("Barras estabilizadoras", "Anti-roll distribution"), t("Más rígido delante: menos tracción, más giro", "Stiffer front: less traction, more rotation")],
  camber: () => [t("Caída", "Camber"), t("Más: agarre en apoyo, peor frenada en recta", "More: grip in long corners, less in braking")],
  toe: () => [t("Convergencia", "Toe-out"), t("Más: respuesta en la entrada, estabilidad en frenada", "More: turn-in response, braking stability")],
};

const FEELING_TEXT = {
  oversteer: () => t("Sobreviraje", "Oversteer"),
  braking: () => t("Frenada", "Braking"),
  cornering: () => t("Paso por curva", "Cornering"),
  traction: () => t("Tracción", "Traction"),
  straights: () => t("Rectas", "Straights"),
};

/** A driver's name with the team stripe, as every list on these screens shows it. */
const DriverName = ({ name, color }) => (
  <span className="wk-driver">
    <TeamStripe color={color} />
    <span>{name}</span>
  </span>
);

/**
 * One driver's setup work: the programme, the five settings, and the driver's last
 * report on the five feelings - where each is now (the tick) and where the engineers
 * now think the driver wants it (the band). Each run narrows the band (RF-WKD-03).
 */
function SetupBench({ driver, color, program, onProgram }) {
  const { career, act } = useManager();
  const { setup, runs } = setupStateOf(career, driver.id);
  const maxRuns = PRACTICE_RUNS + (program === "setup" ? 1 : 0);
  const report = runs.report;
  return (
    <section className="wk-bench" aria-label={driver.name}>
      <header className="wk-bench__head">
        <strong>
          <TeamStripe color={color} height={18} />
          {driver.name}
        </strong>
        <span className="wk-bench__meta">
          {t("Tandas", "Runs")} {runs.count}/{maxRuns}
          {runs.history?.length ? ` · ${t("satisfacción", "satisfaction")} ${runs.history.join(" → ")}%` : ""}
        </span>
      </header>
      <div className="wk-bench__program">
        <Segmented label={t(`Programa de ${driver.name}`, `${driver.name}'s programme`)} value={program} onChange={onProgram} options={PRACTICE_PROGRAMS.map((value) => ({ value, label: PROGRAM[value]() }))} />
        <small>{PROGRAM_HINT[program]()}</small>
      </div>
      <div className="wk-bench__grid">
        <div className="wk-bench__col">
          <h4>{t("Ajustes", "Settings")}</h4>
          {SLIDERS.map((slider) => {
            const [label, hint] = SLIDER_TEXT[slider]();
            return (
              <label key={slider} className="wk-slider" title={hint}>
                <span>
                  {label} <b>{setup[slider]}</b>
                </span>
                <input type="range" min={0} max={100} value={setup[slider]} aria-label={`${label} ${driver.name}`} onChange={(event) => act((c) => setSetup(c, driver.id, { ...setup, [slider]: Number(event.target.value) }))} />
              </label>
            );
          })}
        </div>
        <div className="wk-bench__col">
          <h4>{t("Lo que cuenta el piloto", "What the driver reports")}</h4>
          {FEELINGS.map((feeling) => {
            const entry = report?.[feeling];
            const good = entry && entry.now >= entry.lo && entry.now <= entry.hi;
            return (
              <div key={feeling} className={`wk-feel${entry ? (good ? " is-good" : " is-off") : ""}`}>
                <span>{FEELING_TEXT[feeling]()}</span>
                <div className="wk-feel__track">
                  {entry && <em style={{ left: `${entry.lo * 100}%`, width: `${Math.max(2, (entry.hi - entry.lo) * 100)}%` }} />}
                  {entry && <i style={{ left: `${entry.now * 100}%` }} />}
                </div>
              </div>
            );
          })}
          {!report && <p className="wk-note">{t("Saca al piloto a rodar para que te cuente cómo va el coche.", "Send the driver out to hear how the car feels.")}</p>}
        </div>
      </div>
      <div>
        <button type="button" className="mn-btn mn-btn--sm" disabled={runs.count >= maxRuns} onClick={() => act((c) => runSetupLap(c, driver.id, program))}>
          <IconPlay size={16} />
          {runs.count >= maxRuns ? t("Sin tandas", "No runs left") : t("Rodar una tanda", "Do a run")}
        </button>
      </div>
    </section>
  );
}

/** The weekend's entrants as the session view wants them. */
const sessionEntrants = (career) =>
  entrantsFor(career).map((entrant) => ({
    id: entrant.id,
    name: entrant.driverName,
    nat: entrant.nat,
    teamId: entrant.teamId,
    teamName: entrant.teamName,
    color: entrant.color,
    color2: entrant.color2,
    isUser: entrant.isUser,
    carRating: entrant.carRating,
    driverRating: entrant.driverRating,
  }));

const weekendSeedOf = (career) => `${career.seed}::${career.year}::${career.round}`;

/** Qualifying, watched: Q1 to Q3 (or the single hour) live, then the grid. */
function QualifyingLive({ onDone }) {
  const { career } = useManager();
  const race = currentRace(career);
  const quali = career.weekend.qualifying;
  const entrants = useMemo(() => sessionEntrants(career), [career]);
  const timeline = useMemo(
    () => qualifyingTimeline({ quali, baseLap: race.baseLap * (1 + 0.1 * (quali.wetness || 0)), seed: weekendSeedOf(career), ids: entrants.map((entry) => entry.id) }),
    [quali, race.baseLap, career, entrants],
  );
  const circuit = useMemo(() => circuitFor(race, career.year), [race, career.year]);
  return <SessionLive kind="qualifying" timeline={timeline} entrants={entrants} circuit={circuit} year={career.year} baseLap={race.baseLap} wetness={quali.wetness || 0} trackTemp={34} rainChance={Math.round((race.profile.rain ?? 0.15) * 100)} onDone={onDone} />;
}

/** Practice, watched: the field out on long runs while you work on the setup. */
function PracticeLive({ onHide }) {
  const { career } = useManager();
  const race = currentRace(career);
  const entrants = useMemo(() => sessionEntrants(career), [career]);
  const timeline = useMemo(() => {
    const paces = Object.fromEntries(entrants.map((entry) => [entry.id, race.baseLap * 0.985 - ((entry.carRating ?? 70) - 70) * 0.05 - ((entry.driverRating ?? 70) - 70) * 0.025]));
    return practiceTimeline({ ids: entrants.map((entry) => entry.id), paces, baseLap: race.baseLap, seed: weekendSeedOf(career) });
  }, [entrants, race.baseLap, career]);
  const circuit = useMemo(() => circuitFor(race, career.year), [race, career.year]);
  return <SessionLive kind="practice" compact timeline={timeline} entrants={entrants} circuit={circuit} year={career.year} baseLap={race.baseLap} trackTemp={30} rainChance={Math.round((race.profile.rain ?? 0.15) * 100)} onDone={onHide} />;
}

/** Friday: the circuit, the forecast and the setup work, with the field live on top when 3D is available. */
function Practice({ rules }) {
  const { career, act } = useManager();
  const race = currentRace(career);
  const drivers = driversOf(career.world, career.teamId);
  const color = career.world.teams[career.teamId]?.color;
  const has3D = useMemo(() => canRender3D(), []);
  const [showLive, setShowLive] = useState(has3D);
  const [programs, setPrograms] = useState(() => Object.fromEntries(drivers.map((driver) => [driver.id, "setup"])));
  const forecast = weekendForecast(career);
  const overtaking = race.profile.overtaking >= 0.7 ? t("Fácil", "Easy") : race.profile.overtaking >= 0.4 ? t("Posible", "Possible") : t("Casi imposible", "Nearly impossible");
  return (
    <div className="wk-page">
      {showLive && (
        <div className="wk-live-slot">
          <PracticeLive onHide={() => setShowLive(false)} />
        </div>
      )}
      <div className="wk-c5 wk-stack">
        {/* One 3D scene at a time (RNF-02): the real circuit only while the live practice is hidden. */}
        <Panel title={t("El circuito", "The circuit")} meta={race.track || undefined}>
          <CircuitCard race={race} year={career.year} preview3D={!showLive} drs={rules.drs.enabled} />
        </Panel>
        <Panel
          title={t("Previsión y carácter", "Forecast and character")}
          action={!showLive && has3D ? <button type="button" className="mn-link" onClick={() => setShowLive(true)}>{t("Ver los libres en directo", "Watch practice live")}</button> : null}
        >
          <div className="wk-tiles">
            <StatTile label={t("Lluvia el domingo", "Rain on Sunday")} value={forecast ?? "—"} unit="%" hint={t("previsión del equipo", "team forecast")} />
            <StatTile label={t("Vuelta de referencia", "Reference lap")} value={lapTime(race.baseLap)} hint={t("en seco, coche medio", "dry, average car")} />
            <StatTile label={t("Adelantar", "Overtaking")} value={overtaking} hint={race.profile.overtaking < 0.4 ? t("la clasificación decide", "qualifying decides") : t("la estrategia remonta", "strategy makes up places")} />
            <StatTile label={t("Premia", "Rewards")} value={race.profile.power > race.profile.aero ? t("Motor", "Power") : t("Aerodinámica", "Downforce")} hint={t("perfil del circuito", "circuit profile")} />
          </div>
        </Panel>
      </div>
      <div className="wk-c7">
        <Panel title={t("Libres: puesta a punto", "Practice: setup")} meta={t(`${drivers.length} pilotos`, `${drivers.length} drivers`)}>
          {drivers.map((driver) => (
            <SetupBench key={driver.id} driver={driver} color={color} program={programs[driver.id]} onProgram={(value) => setPrograms((current) => ({ ...current, [driver.id]: value }))} />
          ))}
          <div className="wk-actions">
            <p className="mn-hint">{t("Si no tocas nada, los ingenieros montan su propia puesta a punto.", "Leave it alone and the engineers run their own setup.")}</p>
            <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => act((c) => runPractice(c, programs))}>
              <IconPlay size={16} />
              {t("Rodar en libres", "Run practice")}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const feelTone = (value) => (value >= 70 ? "is-good" : value >= 40 ? "" : "is-warn");

/** Saturday: what practice says, and how hard each driver goes in qualifying. */
function Qualifying({ rules, onQualified }) {
  const { career, act } = useManager();
  const drivers = driversOf(career.world, career.teamId);
  const color = career.world.teams[career.teamId]?.color;
  const feedback = career.weekend.feedback || {};
  const [risk, setRisk] = useState(() => Object.fromEntries(drivers.map((driver) => [driver.id, "normal"])));
  const BALANCE = { good: t("Coche equilibrado", "Well balanced"), understeer: t("Subviraje en curva lenta", "Understeer in slow corners"), oversteer: t("Sobreviraje a la salida", "Oversteer on exit") };
  return (
    <div className="wk-page">
      <div className="wk-c7">
        <Panel title={t("Lo que dicen los libres", "What practice says")}>
          {drivers.map((driver) => {
            const entry = feedback[driver.id];
            return (
              <section key={driver.id} className="wk-report" aria-label={driver.name}>
                <header className="wk-report__head">
                  <strong>
                    <TeamStripe color={color} height={18} />
                    {driver.name}
                  </strong>
                  {entry && <Badge tone={entry.balance === "good" ? "pos" : "warn"} dot>{BALANCE[entry.balance]}</Badge>}
                  {entry && (
                    <span className="wk-report__score">
                      <span className="mn-muted">{PROGRAM[entry.program]()}</span>
                      <b>{entry.score}%</b>
                      <Meter value={entry.score} width={72} label={t("Puesta a punto", "Setup")} />
                    </span>
                  )}
                </header>
                {entry?.feelings ? (
                  <div className="wk-report__feel">
                    {FEELINGS.map((feeling) => (
                      <div key={feeling}>
                        {FEELING_TEXT[feeling]()}
                        <b className={feelTone(entry.feelings[feeling])}>{entry.feelings[feeling]}%</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  !entry && <p className="wk-note">{t("Sin datos de libres.", "No practice data.")}</p>
                )}
              </section>
            );
          })}
        </Panel>
      </div>
      <div className="wk-c5 wk-stack">
        <Panel title={t("Clasificación", "Qualifying")} meta={qualifyingFormat(rules)}>
          <div>
            {drivers.map((driver) => (
              <div key={driver.id} className="wk-choice">
                <strong>
                  <TeamStripe color={color} height={18} />
                  {driver.name}
                </strong>
                <Segmented label={driver.name} value={risk[driver.id]} onChange={(value) => setRisk((current) => ({ ...current, [driver.id]: value }))} options={QUALI_STYLES.map((value) => ({ value, label: QUALI_STYLE[value]() }))} />
              </div>
            ))}
          </div>
          <div className="wk-actions">
            <p className="mn-hint">{t("Al límite se gana una décima y se arriesga una vuelta perdida.", "On the limit you gain a tenth and risk a ruined lap.")}</p>
            <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => { act((c) => runQualifyingSession(c, risk)); onQualified?.(); }}>
              <IconFlag size={16} />
              {t("Salir a clasificar", "Go qualifying")}
            </button>
          </div>
        </Panel>
        <Panel title={t("El circuito", "The circuit")}>
          <CircuitCard race={currentRace(career)} year={career.year} preview3D drs={rules.drs.enabled} />
        </Panel>
      </div>
    </div>
  );
}

/** The starting grid as a timing table. */
function Grid() {
  const { career } = useManager();
  const quali = career.weekend.qualifying;
  const pole = quali.times[quali.order[0]];
  const rows = quali.order.map((id, index) => ({ id, index, driver: career.world.drivers[id], team: career.world.teams[quali.teams[id]], own: quali.teams[id] === career.teamId }));
  return (
    <DataTable
      dense
      caption={t("Parrilla de salida", "Starting grid")}
      rows={rows}
      highlight={(row) => row.own}
      columns={[
        { key: "pos", label: t("Pos", "Pos"), width: 44, mono: true, render: (row) => row.index + 1 },
        { key: "driver", label: t("Piloto", "Driver"), render: (row) => <DriverName name={row.driver?.name} color={row.team?.color} /> },
        { key: "team", label: t("Equipo", "Team"), className: "wk-hide-sm", render: (row) => <span className="mn-muted">{row.team?.name}</span> },
        { key: "time", label: t("Tiempo", "Time"), align: "right", mono: true, render: (row) => (row.index === 0 ? lapTime(pole) : Number.isFinite(quali.times[row.id]) ? `+${(quali.times[row.id] - pole).toFixed(3)}` : "—") },
      ]}
    />
  );
}

function PlanEditor({ driver, color }) {
  const { career, act } = useManager();
  const race = currentRace(career);
  const plan = career.weekend.plans[driver.id] || defaultPlan(career);
  // The era's rules (pack or era-defaults, engine/rules.js): compounds, refuelling, stops (SRS 6.2).
  const rules = rulesFor(eraOf(career));
  const compounds = rules.tyres.compounds;
  const minStops = rules.strategy.minStops;
  const maxStops = Math.max(1, rules.strategy.maxStops);
  const delta = useMemo(() => planDelta(career, plan), [career, plan]);
  const update = (next) => act((c) => setPlan(c, driver.id, next));

  const setStops = (count) => {
    const stops = spacedStops(count, race.laps);
    const sequence = Array.from({ length: count + 1 }, (_, index) => plan.compounds[index] || plan.compounds[plan.compounds.length - 1] || compounds[0]);
    update({ stops, compounds: sequence });
  };
  const setCompound = (index, compound) => update({ ...plan, compounds: plan.compounds.map((value, position) => (position === index ? compound : value)) });
  const setStopLap = (index, lap) => {
    const stops = [...plan.stops];
    stops[index] = lap;
    update({ ...plan, stops: stops.sort((a, b) => a - b) });
  };
  const stints = stintLengths(plan, race.laps);
  const TYRE_VAR = { soft: "var(--mn-tyre-soft)", medium: "var(--mn-tyre-medium)", hard: "var(--mn-tyre-hard)", inter: "var(--mn-tyre-inter)", wet: "var(--mn-tyre-wet)" };

  return (
    <section className="wk-plan" aria-label={driver.name}>
      <header className="wk-plan__head">
        <strong>
          <TeamStripe color={color} height={18} />
          {driver.name}
        </strong>
        <Badge tone={delta < 0.5 ? "pos" : delta < 8 ? "neutral" : "warn"} dot>
          {delta < 0.5 ? t("Plan óptimo", "Optimal plan") : t(`+${delta.toFixed(1)} s frente al óptimo`, `+${delta.toFixed(1)} s vs the best`)}
        </Badge>
      </header>
      <Segmented label={t("Paradas", "Stops")} value={plan.stops.length} onChange={setStops} options={Array.from({ length: maxStops - minStops + 1 }, (_, index) => ({ value: minStops + index, label: `${minStops + index} ${minStops + index === 1 ? t("parada", "stop") : t("paradas", "stops")}` }))} />
      <div className="wk-stints">
        {plan.compounds.map((compound, index) => (
          <div key={`${index}-${compound}`} className="wk-stint" style={{ flex: stints[index] || 1, "--tyre": TYRE_VAR[compound] }}>
            <div className="wk-stint__tyres">
              {compounds.map((option) => (
                <button type="button" key={option} className={option === compound ? "is-active" : ""} onClick={() => setCompound(index, option)} aria-label={COMPOUND[option]()} aria-pressed={option === compound} title={COMPOUND[option]()}>
                  <Tyre compound={option} size={20} />
                </button>
              ))}
            </div>
            <small>
              {stints[index]} {t("v", "laps")}
            </small>
          </div>
        ))}
      </div>
      {plan.stops.length > 0 && (
        <div className="wk-stops">
          {plan.stops.map((lap, index) => (
            <label key={`stop-${index}`} className="wk-slider">
              <span>
                {t(`Parada ${index + 1}`, `Stop ${index + 1}`)} <b>{t(`V${lap}`, `L${lap}`)}</b>
              </span>
              <input type="range" min={2} max={race.laps - 2} value={lap} aria-label={t(`Vuelta de la parada ${index + 1} de ${driver.name}`, `${driver.name} stop ${index + 1} lap`)} onChange={(event) => setStopLap(index, Number(event.target.value))} />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

/** Sunday morning: the grid, the plan for each car, and the call - run it live or simulate it. */
function Strategy({ rules, onStart }) {
  const { career } = useManager();
  const race = currentRace(career);
  const drivers = driversOf(career.world, career.teamId);
  const color = career.world.teams[career.teamId]?.color;
  const quali = career.weekend.qualifying;
  const own = quali.order.map((id, index) => ({ id, index })).filter((entry) => quali.teams[entry.id] === career.teamId);
  const best = own[0];
  const forecast = weekendForecast(career);
  const eraHint = rules.refuelling && !rules.tyres.changesInRace
    ? t("Época de repostajes sin cambio de neumáticos: cada parada es solo combustible y un juego debe durar toda la carrera.", "Refuelling without tyre changes: every stop is fuel only and one set must last the race.")
    : rules.refuelling
      ? t("Época de repostajes: cada parada llena el depósito para el siguiente tramo; ir ligero es ir rápido.", "Refuelling era: every stop fills the tank for the next stint; light is fast.")
      : rules.tyres.mandatoryDryCompounds >= 2
        ? t("En seco es obligatorio usar dos compuestos distintos.", "In the dry two different compounds are mandatory.")
        : t("Elige cuándo cambiar neumáticos, si es que hace falta.", "Choose when to change tyres, if at all.");
  return (
    <div className="wk-page">
      <div className="wk-c12 wk-tiles wk-tiles--4">
        <StatTile label={t("Mejor salida", "Best grid slot")} value={best ? ordinal(best.index + 1) : "—"} hint={best ? career.world.drivers[best.id]?.name : ""} accent />
        <StatTile label={t("Lluvia el domingo", "Rain on Sunday")} value={forecast ?? "—"} unit="%" hint={quali.wetness > 0.2 ? t("clasificación en mojado", "wet qualifying") : t("previsión del equipo", "team forecast")} />
        <StatTile label={t("Carrera", "Race")} value={race.laps} unit={t("vueltas", "laps")} hint={lapTime(race.baseLap)} />
        <StatTile label={t("Paradas", "Stops")} value={`${rules.strategy.minStops}–${Math.max(1, rules.strategy.maxStops)}`} hint={rules.refuelling ? t("con repostaje", "with refuelling") : t("sin repostaje", "no refuelling")} />
      </div>
      <div className="wk-c5">
        <Panel flush title={t("Parrilla de salida", "Starting grid")} meta={own.map((entry) => `${career.world.drivers[entry.id]?.name?.split(" ").pop()} ${ordinal(entry.index + 1)}`).join(" · ")}>
          <Grid />
        </Panel>
      </div>
      <div className="wk-c7">
        <Panel title={t("Estrategia", "Strategy")}>
          <p className="wk-note">{eraHint}</p>
          {drivers.map((driver) => (
            <PlanEditor key={driver.id} driver={driver} color={color} />
          ))}
          <div className="wk-actions">
            <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => onStart(true)}>
              <IconPlay size={16} />
              {t("Dirigir la carrera", "Run the race")}
            </button>
            <button type="button" className="mn-btn" onClick={() => onStart(false)}>
              <IconFastForward size={16} />
              {t("Simular la carrera", "Simulate the race")}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** Standings with how many places each moved in this race (none on round one: nobody had points before). */
const withMoves = (rows, gained, idOf, firstRound) => {
  const before = rows.map((row) => ({ id: idOf(row), points: row.total - (gained(row) || 0) })).sort((a, b) => b.points - a.points);
  const previous = Object.fromEntries(before.map((row, index) => [row.id, index + 1]));
  return rows.map((row) => ({ ...row, gained: gained(row) || 0, move: firstRound ? 0 : previous[idOf(row)] - row.position }));
};

const Move = ({ value }) => (
  <span className={`wk-delta${value > 0 ? " is-up" : value < 0 ? " is-down" : ""}`} aria-label={value > 0 ? t(`sube ${value}`, `up ${value}`) : value < 0 ? t(`baja ${-value}`, `down ${-value}`) : t("igual", "same")}>
    {value > 0 ? <IconArrowUp size={12} /> : value < 0 ? <IconArrowDown size={12} /> : null}
    {value ? Math.abs(value) : "–"}
  </span>
);

/** Top ten, plus the player's rows when they sit lower (DESIGN.md §5.6). */
const topWithOwn = (rows, own, size = 10) => [...rows.slice(0, size), ...rows.slice(size).filter(own)];

/** RF-WKD-07: the flag, the classification, the standings moves, the lap chart and the stops. */
function Result({ onContinue }) {
  const { career } = useManager();
  const [view, setView] = useState("teams");
  const summary = career.weekend.result;
  const teams = career.world.teams;
  const own = summary.rows.filter((row) => row.teamId === career.teamId);
  const points = own.reduce((sum, row) => sum + row.points, 0);
  const winner = summary.rows[0];
  const firstRound = (summary.round ?? 1) <= 1;
  const driverPoints = Object.fromEntries(summary.rows.map((row) => [row.driverId, row.points || 0]));
  const constructors = withMoves(constructorStandings(career), (row) => summary.teamPoints?.[row.teamId], (row) => row.teamId, firstRound);
  const drivers = withMoves(driverStandings(career), (row) => driverPoints[row.driverId], (row) => row.driverId, firstRound);
  const ownTeam = constructors.find((row) => row.teamId === career.teamId);
  const bestDriver = drivers.find((row) => row.teamId === career.teamId);
  const fastest = summary.rows.find((row) => row.driverId === summary.fastestLap);
  const chartCars = Object.fromEntries((summary.chart?.cars || []).map((car) => [car.id, car]));
  const stopRows = summary.rows
    .map((row) => {
      const car = Object.values(chartCars).find((entry) => entry.name === row.name);
      return { ...row, laps: car?.stops || [] };
    })
    .filter((row) => row.stops > 0 || row.laps.length > 0);

  return (
    <div className="wk-page">
      <div className="wk-c7">
        <Panel title={t("Bandera a cuadros", "Chequered flag")} meta={raceName(summary.name)} className="wk-podium">
          {canRender3D() && (
            <div className="wk-podium__stage">
              <React.Suspense fallback={null}>
                <Podium
                  year={career.year}
                  height={240}
                  label={t("Podio", "Podium")}
                  cars={summary.rows.slice(0, 3).map((row) => ({ color: teams[row.teamId]?.color, color2: teams[row.teamId]?.color2, name: teams[row.teamId]?.name }))}
                />
              </React.Suspense>
            </div>
          )}
          <div className="wk-winner">
            <TeamBadge team={teams[winner.teamId]} size={48} />
            <div>
              <small>{t("Ganador", "Winner")}</small>
              <strong>{winner.name}</strong>
              <span>{teams[winner.teamId]?.name}</span>
            </div>
          </div>
          <ul className="wk-own" aria-label={t("Tus pilotos", "Your drivers")}>
            {own.map((row) => (
              <li key={row.driverId} className={row.points > 0 ? "is-points" : ""}>
                <b>{row.status === "finished" ? ordinal(row.position) : t("Ab.", "DNF")}</b>
                <span>{row.name}</span>
                <small>
                  {t("Salía", "Started")} {ordinal(row.grid)} · {row.points} {t("pts", "pts")}
                </small>
              </li>
            ))}
          </ul>
          <div className="wk-actions">
            <p className="mn-hint">{t(`Tu equipo suma ${points} puntos este domingo.`, `Your team scores ${points} points this Sunday.`)}</p>
            <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={onContinue}>
              {t("Continuar", "Continue")}
            </button>
          </div>
        </Panel>
      </div>
      <div className="wk-c5 wk-stack">
        <div className="wk-tiles">
          <StatTile label={t("Puntos del equipo", "Team points")} value={points} hint={t("en esta carrera", "this race")} accent />
          <StatTile
            label={t("Constructores", "Constructors")}
            value={ownTeam ? ordinal(ownTeam.position) : "—"}
            delta={!firstRound && ownTeam?.move ? `${ownTeam.move > 0 ? "+" : "−"}${Math.abs(ownTeam.move)}` : undefined}
            trend={ownTeam?.move > 0 ? "up" : ownTeam?.move < 0 ? "down" : undefined}
            hint={ownTeam ? t(`${ownTeam.total} pts`, `${ownTeam.total} pts`) : ""}
          />
          <StatTile
            label={t("Mejor piloto", "Best driver")}
            value={bestDriver ? ordinal(bestDriver.position) : "—"}
            delta={!firstRound && bestDriver?.move ? `${bestDriver.move > 0 ? "+" : "−"}${Math.abs(bestDriver.move)}` : undefined}
            trend={bestDriver?.move > 0 ? "up" : bestDriver?.move < 0 ? "down" : undefined}
            hint={bestDriver?.name}
          />
          <StatTile label={t("Vuelta rápida", "Fastest lap")} value={fastest ? fastest.name.split(" ").pop() : "—"} hint={fastest ? teams[fastest.teamId]?.name : ""} />
        </div>
        <Panel
          flush
          title={t("Mundial", "Standings")}
          action={<Tabs label={t("Mundial", "Standings")} value={view} onChange={setView} options={[{ value: "teams", label: t("Constructores", "Constructors") }, { value: "drivers", label: t("Pilotos", "Drivers") }]} />}
        >
          {view === "teams" ? (
            <DataTable
              dense
              caption={t("Constructores", "Constructors")}
              rows={topWithOwn(constructors, (row) => row.teamId === career.teamId)}
              rowKey={(row) => row.teamId}
              highlight={(row) => row.teamId === career.teamId}
              columns={[
                { key: "pos", label: t("Pos", "Pos"), width: 44, mono: true, render: (row) => row.position },
                { key: "team", label: t("Equipo", "Team"), render: (row) => <DriverName name={teams[row.teamId]?.name} color={teams[row.teamId]?.color} /> },
                { key: "move", label: "±", align: "right", width: 48, render: (row) => <Move value={row.move} /> },
                { key: "gained", label: t("Hoy", "Today"), align: "right", mono: true, width: 56, render: (row) => (row.gained ? `+${row.gained}` : "") },
                { key: "total", label: t("Pts", "Pts"), align: "right", width: 56, render: (row) => <b>{row.total}</b> },
              ]}
            />
          ) : (
            <DataTable
              dense
              caption={t("Pilotos", "Drivers")}
              rows={topWithOwn(drivers, (row) => row.teamId === career.teamId)}
              rowKey={(row) => row.driverId}
              highlight={(row) => row.teamId === career.teamId}
              columns={[
                { key: "pos", label: t("Pos", "Pos"), width: 44, mono: true, render: (row) => row.position },
                { key: "driver", label: t("Piloto", "Driver"), render: (row) => <DriverName name={row.name} color={teams[row.teamId]?.color} /> },
                { key: "move", label: "±", align: "right", width: 48, render: (row) => <Move value={row.move} /> },
                { key: "gained", label: t("Hoy", "Today"), align: "right", mono: true, width: 56, render: (row) => (row.gained ? `+${row.gained}` : "") },
                { key: "total", label: t("Pts", "Pts"), align: "right", width: 56, render: (row) => <b>{row.total}</b> },
              ]}
            />
          )}
        </Panel>
      </div>
      <div className="wk-c7">
        <Panel flush title={t("Clasificación", "Classification")} meta={t(`${summary.laps} vueltas${summary.safetyCars ? ` · ${summary.safetyCars} coche de seguridad` : ""}`, `${summary.laps} laps${summary.safetyCars ? ` · ${summary.safetyCars} safety car` : ""}`)}>
          <DataTable
            dense
            caption={t("Clasificación", "Classification")}
            rows={summary.rows}
            rowKey={(row) => row.driverId}
            highlight={(row) => row.teamId === career.teamId}
            columns={[
              { key: "pos", label: t("Pos", "Pos"), width: 44, mono: true, render: (row) => (row.status === "finished" ? row.position : "—") },
              {
                key: "driver",
                label: t("Piloto", "Driver"),
                render: (row) => (
                  <span className="wk-driver">
                    <TeamStripe color={teams[row.teamId]?.color} />
                    <span>{row.name}</span>
                    {row.driverId === summary.fastestLap && <span className="wk-best" title={t("Vuelta rápida", "Fastest lap")}>{t("VR", "FL")}</span>}
                  </span>
                ),
              },
              { key: "team", label: t("Equipo", "Team"), className: "wk-hide-sm", render: (row) => <span className="mn-muted">{teams[row.teamId]?.name}</span> },
              { key: "grid", label: t("Sal.", "Grid"), align: "right", mono: true, width: 52, className: "wk-hide-sm", render: (row) => row.grid },
              { key: "gain", label: "±", align: "right", width: 48, render: (row) => (row.status === "finished" ? <Move value={row.grid - row.position} /> : "") },
              { key: "stops", label: t("Par.", "Stops"), align: "right", mono: true, width: 52, className: "wk-hide-sm", render: (row) => row.stops },
              { key: "gap", label: t("Diferencia", "Gap"), align: "right", mono: true, render: (row) => `${row.position === 1 && row.status === "finished" ? t("Ganador", "Winner") : gapText(row)}${row.penalty ? ` (+${row.penalty} s)` : ""}` },
              { key: "pts", label: t("Pts", "Pts"), align: "right", width: 48, render: (row) => (row.points ? <b>{row.points}</b> : "") },
            ]}
          />
        </Panel>
      </div>
      <div className="wk-c5">
        <Panel flush title={t("Paradas", "Pit stops")} meta={t(`${stopRows.reduce((sum, row) => sum + (row.stops || 0), 0)} en total`, `${stopRows.reduce((sum, row) => sum + (row.stops || 0), 0)} in total`)}>
          <DataTable
            dense
            caption={t("Paradas", "Pit stops")}
            rows={stopRows}
            rowKey={(row) => row.driverId}
            highlight={(row) => row.teamId === career.teamId}
            empty={t("Nadie paró en boxes", "Nobody pitted")}
            columns={[
              { key: "driver", label: t("Piloto", "Driver"), render: (row) => <DriverName name={row.name} color={teams[row.teamId]?.color} /> },
              { key: "laps", label: t("Vueltas", "Laps"), render: (row) => <span className="wk-stoplaps">{row.laps.map((lap) => `${t("V", "L")}${lap}`).join(" · ") || "—"}</span> },
              { key: "stops", label: t("Par.", "Stops"), align: "right", mono: true, width: 52, render: (row) => row.stops },
            ]}
          />
        </Panel>
      </div>
      {summary.chart && (
        <div className="wk-c12">
          <Panel title={t("La carrera, vuelta a vuelta", "The race, lap by lap")}>
            <LapChart chart={summary.chart} />
          </Panel>
        </div>
      )}
    </div>
  );
}
