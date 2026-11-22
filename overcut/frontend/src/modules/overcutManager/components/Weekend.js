/**
 * A race weekend, from the pit wall: Friday's programme, Saturday's risk,
 * Sunday's strategy and then the race itself, live or simulated.
 */

import React, { useMemo, useState } from "react";
import { LuCloudRain, LuFastForward, LuFlag, LuPlay, LuX } from "react-icons/lu";
import {
  PRACTICE_PROGRAMS, PRACTICE_RUNS, QUALI_STYLES, completeRace, createWeekendRace, currentRace, defaultPlan, entrantsFor, planDelta, runPractice,
  runQualifyingSession, runSetupLap, setPlan, setSetup, setupStateOf, weekendForecast,
} from "../engine/career";
import { FEELINGS, SLIDERS } from "../engine/setup";
import CircuitCard from "./CircuitCard";
import SessionLive from "./SessionLive";
import { practiceTimeline, qualifyingTimeline } from "../engine/sessions";
import { circuitFor } from "../engine/venue";
import LapChart from "./LapChart";
import { compoundsFor, refuellingEra, runToFinish, spacedStops, stintLengths } from "../engine/race";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Flag, Panel, Segmented, TeamBadge, Tyre } from "./atoms";
import { COMPOUND, PROGRAM, PROGRAM_HINT, QUALI_STYLE, lapTime, ordinal, raceName, shortDate, t } from "./texts";
import { Classification } from "./Calendar";
import LiveRace from "./LiveRace";
import { canRender3D } from "../three/support";

// The 3D podium brings three.js with it; fetched only when a result is shown in a browser that can draw it.
const Podium = React.lazy(() => import("../three/Podium"));

const STAGES = ["practice", "qualifying", "strategy", "race", "result"];

export default function Weekend() {
  const { career, act, setWeekendOpen, finishWeekend } = useManager();
  const weekend = career.weekend;
  const race = currentRace(career);
  const [live, setLive] = useState(null);
  const [watchQuali, setWatchQuali] = useState(false);
  if (!weekend || !race) return null;
  const stage = live ? "race" : weekend.stage;

  const startRace = (watch) => {
    const state = act((c) => createWeekendRace(c));
    if (!state) return;
    if (watch) setLive(state);
    else {
      runToFinish(state);
      act((c) => completeRace(c, state));
    }
  };

  const onFinished = (state) => {
    act((c) => completeRace(c, state));
    setLive(null);
  };

  return (
    <div className="mn-weekend" role="dialog" aria-modal="true" aria-label={raceName(race.name)}>
      <header className="mn-weekend__head">
        <Flag code={race.country} width={30} />
        <div>
          <strong>{raceName(race.name)}</strong>
          <small>
            {t("Ronda", "Round")} {race.round}/{career.world.races.length} · {shortDate(race.date)} · {race.laps} {t("vueltas", "laps")}
          </small>
        </div>
        <ol className="mn-weekend__stages">
          {STAGES.map((entry, index) => (
            <li key={entry} className={entry === stage ? "is-active" : STAGES.indexOf(stage) > index ? "is-done" : ""}>
              {{ practice: t("Libres", "Practice"), qualifying: t("Clasificación", "Qualifying"), strategy: t("Estrategia", "Strategy"), race: t("Carrera", "Race"), result: t("Resultado", "Result") }[entry]}
            </li>
          ))}
        </ol>
        {!live && weekend.stage !== "result" && (
          <button type="button" className="mn-icon-btn" onClick={() => setWeekendOpen(false)} aria-label={t("Volver a la central", "Back to headquarters")}>
            <LuX />
          </button>
        )}
      </header>
      <div className="mn-weekend__body">
        {stage === "practice" && <Practice />}
        {stage === "qualifying" && <Qualifying onQualified={() => canRender3D() && setWatchQuali(true)} />}
        {stage === "strategy" && watchQuali && <QualifyingLive onDone={() => setWatchQuali(false)} />}
        {stage === "strategy" && !watchQuali && <Strategy onStart={startRace} />}
        {stage === "race" && live && <LiveRace state={live} onFinished={onFinished} />}
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

/**
 * One driver's setup work: the five settings, and the driver's last report on
 * the five feelings - where each is now (the tick) and where the engineers now
 * think the driver wants it (the band). Each run narrows the band.
 */
function SetupBench({ driver, program }) {
  const { career, act } = useManager();
  const { setup, runs } = setupStateOf(career, driver.id);
  const maxRuns = PRACTICE_RUNS + (program === "setup" ? 1 : 0);
  const report = runs.report;
  return (
    <div className="mn-bench">
      <header>
        <strong>{driver.name}</strong>
        <span className="mn-muted">
          {t("Tandas", "Runs")} {runs.count}/{maxRuns}
          {runs.history?.length ? ` · ${t("Satisfacción", "Satisfaction")} ${runs.history.join(" → ")}%` : ""}
        </span>
      </header>
      <div className="mn-bench__grid">
        <div className="mn-bench__sliders">
          {SLIDERS.map((slider) => {
            const [label, hint] = SLIDER_TEXT[slider]();
            return (
              <label key={slider} className="mn-field mn-field--inline" title={hint}>
                <span>
                  {label} <b>{setup[slider]}</b>
                </span>
                <input type="range" className="mn-range" min={0} max={100} value={setup[slider]} aria-label={`${label} ${driver.name}`} onChange={(event) => act((c) => setSetup(c, driver.id, { ...setup, [slider]: Number(event.target.value) }))} />
              </label>
            );
          })}
        </div>
        <div className="mn-bench__feel">
          {FEELINGS.map((feeling) => {
            const entry = report?.[feeling];
            const good = entry && entry.now >= entry.lo && entry.now <= entry.hi;
            return (
              <div key={feeling} className={`mn-feel${entry ? (good ? " is-good" : " is-off") : ""}`}>
                <span>{FEELING_TEXT[feeling]()}</span>
                <div className="mn-feel__track">
                  {entry && <em style={{ left: `${entry.lo * 100}%`, width: `${Math.max(2, (entry.hi - entry.lo) * 100)}%` }} />}
                  {entry && <i style={{ left: `${entry.now * 100}%` }} />}
                </div>
              </div>
            );
          })}
          {!report && <p className="mn-hint">{t("Saca al piloto a rodar para que te cuente cómo va el coche.", "Send the driver out to hear how the car feels.")}</p>}
        </div>
      </div>
      <button type="button" className="mn-btn mn-btn--sm" disabled={runs.count >= maxRuns} onClick={() => act((c) => runSetupLap(c, driver.id, program))}>
        <LuPlay aria-hidden="true" />
        {runs.count >= maxRuns ? t("Sin tandas", "No runs left") : t("Rodar una tanda", "Do a run")}
      </button>
    </div>
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

function Practice() {
  const { career, act } = useManager();
  const race = currentRace(career);
  const drivers = driversOf(career.world, career.teamId);
  const [showLive, setShowLive] = useState(() => canRender3D());
  const [programs, setPrograms] = useState(() => Object.fromEntries(drivers.map((driver) => [driver.id, "setup"])));
  const forecast = weekendForecast(career);
  return (
    <div className="mn-grid mn-grid--weekend">
      {showLive && (
        <div className="mn-practice-live">
          <PracticeLive onHide={() => setShowLive(false)} />
        </div>
      )}
      <Panel title={t("El circuito", "The circuit")}>
        <CircuitCard race={race} year={career.year} />
        <dl className="mn-facts">
          <div>
            <dt>{t("Adelantar", "Overtaking")}</dt>
            <dd>{race.profile.overtaking >= 0.7 ? t("Fácil", "Easy") : race.profile.overtaking >= 0.4 ? t("Posible", "Possible") : t("Casi imposible", "Nearly impossible")}</dd>
          </div>
          <div>
            <dt>{t("Premia", "Rewards")}</dt>
            <dd>{race.profile.power > race.profile.aero ? t("Motor", "Power") : t("Aerodinámica", "Downforce")}</dd>
          </div>
          <div>
            <dt>{t("Vuelta de referencia", "Reference lap")}</dt>
            <dd>{lapTime(race.baseLap)}</dd>
          </div>
          <div>
            <dt>
              <LuCloudRain aria-hidden="true" /> {t("Lluvia el domingo", "Rain on Sunday")}
            </dt>
            <dd>{forecast}%</dd>
          </div>
        </dl>
        <p className="mn-hint">{race.profile.overtaking < 0.4 ? t("Aquí la clasificación lo decide casi todo.", "Here qualifying decides almost everything.") : t("Una buena estrategia puede remontar posiciones.", "A good strategy can make up places.")}</p>
      </Panel>
      <Panel title={t("Libres: puesta a punto", "Practice: setup")}>
        {drivers.map((driver) => (
          <div key={driver.id} className="mn-program">
            <Segmented label={driver.name} value={programs[driver.id]} onChange={(value) => setPrograms((current) => ({ ...current, [driver.id]: value }))} options={PRACTICE_PROGRAMS.map((value) => ({ value, label: PROGRAM[value]() }))} />
            <small>{PROGRAM_HINT[programs[driver.id]]()}</small>
            <SetupBench driver={driver} program={programs[driver.id]} />
          </div>
        ))}
        <p className="mn-hint">{t("Si no tocas nada, los ingenieros montan su propia puesta a punto.", "Leave it alone and the engineers run their own setup.")}</p>
        <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => act((c) => runPractice(c, programs))}>
          <LuPlay aria-hidden="true" />
          {t("Rodar en libres", "Run practice")}
        </button>
      </Panel>
    </div>
  );
}

function Qualifying({ onQualified }) {
  const { career, act } = useManager();
  const drivers = driversOf(career.world, career.teamId);
  const feedback = career.weekend.feedback || {};
  const [risk, setRisk] = useState(() => Object.fromEntries(drivers.map((driver) => [driver.id, "normal"])));
  const BALANCE = { good: t("El coche va equilibrado", "The car is well balanced"), understeer: t("Subviraje en curva lenta", "Understeer in slow corners"), oversteer: t("Sobreviraje a la salida", "Oversteer on exit") };
  return (
    <div className="mn-grid mn-grid--weekend">
      <Panel title={t("Lo que dicen los libres", "What practice says")}>
        {drivers.map((driver) => {
          const entry = feedback[driver.id];
          return (
            <div key={driver.id} className="mn-feedback">
              <strong>{driver.name}</strong>
              {entry ? (
                <span>
                  {PROGRAM[entry.program]()} · {t("Puesta a punto", "Setup")} {entry.score}% · {BALANCE[entry.balance]}
                  {entry.feelings && (
                    <span className="mn-feelings">
                      {FEELINGS.map((feeling) => (
                        <i key={feeling} className={entry.feelings[feeling] >= 70 ? "is-good" : entry.feelings[feeling] >= 40 ? "is-mid" : "is-off"}>
                          {FEELING_TEXT[feeling]()} {entry.feelings[feeling]}%
                        </i>
                      ))}
                    </span>
                  )}
                </span>
              ) : (
                <span className="mn-muted">—</span>
              )}
            </div>
          );
        })}
      </Panel>
      <Panel title={career.year >= 2006 ? t("Clasificación: Q1, Q2 y Q3", "Qualifying: Q1, Q2 and Q3") : t("Clasificación", "Qualifying")}>
        {drivers.map((driver) => (
          <div key={driver.id} className="mn-program">
            <strong>{driver.name}</strong>
            <Segmented label={driver.name} value={risk[driver.id]} onChange={(value) => setRisk((current) => ({ ...current, [driver.id]: value }))} options={QUALI_STYLES.map((value) => ({ value, label: QUALI_STYLE[value]() }))} />
          </div>
        ))}
        <p className="mn-hint">{t("Al límite se gana una décima y se arriesga una vuelta perdida.", "On the limit you gain a tenth and risk a ruined lap.")}</p>
        <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => { act((c) => runQualifyingSession(c, risk)); onQualified?.(); }}>
          <LuFlag aria-hidden="true" />
          {t("Salir a clasificar", "Go qualifying")}
        </button>
      </Panel>
    </div>
  );
}

function Grid() {
  const { career } = useManager();
  const quali = career.weekend.qualifying;
  const pole = quali.times[quali.order[0]];
  return (
    <ol className="mn-gridlist">
      {quali.order.map((id, index) => {
        const driver = career.world.drivers[id];
        const team = career.world.teams[quali.teams[id]];
        const own = quali.teams[id] === career.teamId;
        return (
          <li key={id} className={own ? "is-own" : ""}>
            <b>{index + 1}</b>
            <TeamBadge team={team} size={18} />
            <span>{driver?.name}</span>
            <em>{index === 0 ? lapTime(pole) : `+${(quali.times[id] - pole).toFixed(3)}`}</em>
          </li>
        );
      })}
    </ol>
  );
}

function PlanEditor({ driver }) {
  const { career, act } = useManager();
  const race = currentRace(career);
  const plan = career.weekend.plans[driver.id] || defaultPlan(career);
  const compounds = compoundsFor(career.year);
  const minStops = refuellingEra(career.year) ? 1 : 0;
  const maxStops = career.year < 1982 ? 1 : 3;
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

  return (
    <div className="mn-plan">
      <header>
        <strong>{driver.name}</strong>
        <span className={delta < 0.5 ? "mn-ok" : delta < 8 ? "mn-muted" : "mn-warn"}>{delta < 0.5 ? t("Plan óptimo", "Optimal plan") : `+${delta.toFixed(1)}s ${t("frente al óptimo", "vs the best")}`}</span>
      </header>
      <Segmented label={t("Paradas", "Stops")} value={plan.stops.length} onChange={setStops} options={Array.from({ length: maxStops - minStops + 1 }, (_, index) => ({ value: minStops + index, label: `${minStops + index} ${t("paradas", "stops")}` }))} />
      <div className="mn-stints">
        {plan.compounds.map((compound, index) => (
          <div key={`${index}-${compound}`} className="mn-stint" style={{ flex: stints[index] || 1 }}>
            <div className="mn-stint__tyres">
              {compounds.map((option) => (
                <button type="button" key={option} className={option === compound ? "is-active" : ""} onClick={() => setCompound(index, option)} aria-label={COMPOUND[option]()}>
                  <Tyre compound={option} size={20} />
                </button>
              ))}
            </div>
            <small>
              {stints[index]} {t("v.", "laps")}
            </small>
          </div>
        ))}
      </div>
      {plan.stops.map((lap, index) => (
        <label key={`stop-${index}`} className="mn-field mn-field--inline">
          <span>
            {t(`Parada ${index + 1}: vuelta`, `Stop ${index + 1}: lap`)} <b>{lap}</b>
          </span>
          <input type="range" className="mn-range" min={2} max={race.laps - 2} value={lap} onChange={(event) => setStopLap(index, Number(event.target.value))} />
        </label>
      ))}
    </div>
  );
}

function Strategy({ onStart }) {
  const { career } = useManager();
  const drivers = driversOf(career.world, career.teamId);
  const quali = career.weekend.qualifying;
  const own = quali.order.map((id, index) => ({ id, index })).filter((entry) => quali.teams[entry.id] === career.teamId);
  return (
    <div className="mn-grid mn-grid--weekend">
      <Panel title={t("Parrilla de salida", "Starting grid")}>
        <p className="mn-hint">
          {own.map((entry) => `${career.world.drivers[entry.id]?.name}: ${ordinal(entry.index + 1)}`).join(" · ")}
          {quali.wetness > 0.2 ? ` · ${t("Clasificación en mojado", "Wet qualifying")}` : ""}
        </p>
        <Grid />
      </Panel>
      <Panel title={t("Estrategia", "Strategy")}>
        <p className="mn-hint">{refuellingEra(career.year) ? t("Época de repostajes: cada parada llena el depósito para el siguiente tramo; ir ligero es ir rápido.", "Refuelling era: every stop fills the tank for the next stint; light is fast.") : career.year >= 2007 ? t("En seco es obligatorio usar dos compuestos distintos.", "In the dry two different compounds are mandatory.") : t("Elige cuándo cambiar neumáticos, si es que hace falta.", "Choose when to change tyres, if at all.")}</p>
        {drivers.map((driver) => (
          <PlanEditor key={driver.id} driver={driver} />
        ))}
        <div className="mn-row">
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => onStart(true)}>
            <LuPlay aria-hidden="true" />
            {t("Dirigir la carrera", "Run the race")}
          </button>
          <button type="button" className="mn-btn mn-btn--ghost" onClick={() => onStart(false)}>
            <LuFastForward aria-hidden="true" />
            {t("Simular la carrera", "Simulate the race")}
          </button>
        </div>
      </Panel>
    </div>
  );
}

function Result({ onContinue }) {
  const { career } = useManager();
  const summary = career.weekend.result;
  const own = summary.rows.filter((row) => row.teamId === career.teamId);
  const points = own.reduce((sum, row) => sum + row.points, 0);
  const winner = summary.rows[0];
  return (
    <div className="mn-grid mn-grid--weekend">
      <Panel title={t("Bandera a cuadros", "Chequered flag")} className="mn-result">
        {canRender3D() && (
          <React.Suspense fallback={null}>
            <Podium
              year={career.year}
              height={240}
              label={t("Podio", "Podium")}
              cars={summary.rows.slice(0, 3).map((row) => ({ color: career.world.teams[row.teamId]?.color, color2: career.world.teams[row.teamId]?.color2, name: career.world.teams[row.teamId]?.name }))}
            />
          </React.Suspense>
        )}
        <div className="mn-result__winner" style={{ "--team": career.world.teams[winner.teamId]?.color }}>
          <TeamBadge team={career.world.teams[winner.teamId]} size={48} />
          <div>
            <small>{t("Ganador", "Winner")}</small>
            <strong>{winner.name}</strong>
            <span>{career.world.teams[winner.teamId]?.name}</span>
          </div>
        </div>
        <div className="mn-own-results">
          {own.map((row) => (
            <div key={row.driverId} className={row.points > 0 ? "is-points" : ""}>
              <strong>{row.status === "finished" ? ordinal(row.position) : t("Abandono", "DNF")}</strong>
              <span>{row.name}</span>
              <small>
                {t("Salía", "Started")} {row.grid} · {row.points} {t("pts", "pts")}
              </small>
            </div>
          ))}
        </div>
        <p className="mn-hint">{t(`Tu equipo suma ${points} puntos este domingo.`, `Your team scores ${points} points this Sunday.`)}</p>
        <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={onContinue}>
          {t("Continuar", "Continue")}
        </button>
      </Panel>
      <Panel title={t("Clasificación", "Classification")}>
        <div className="mn-table-scroll">
          <Classification career={career} summary={summary} />
        </div>
      </Panel>
      {summary.chart && (
        <Panel title={t("La carrera, vuelta a vuelta", "The race, lap by lap")} className="mn-result__chart">
          <LapChart chart={summary.chart} />
        </Panel>
      )}
    </div>
  );
}
