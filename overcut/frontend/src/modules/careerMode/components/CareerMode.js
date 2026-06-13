import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowLeftShort,
  AwardFill,
  BriefcaseFill,
  Dice5Fill,
  FlagFill,
  PersonFill,
  TrophyFill,
} from "react-bootstrap-icons";
import racingHelmetUrl from "../../../assets/images/miniGames/RacingHelmet.png";
import {
  HELMET_COLORS,
  completeRace,
  createCareerSeason,
  fetchCareerBootstrap,
  generateContracts,
  normalizeColor,
  playableDecades,
  prepareCareerBootstrap,
  randomYearInDecade,
  retirementSummary,
  simulateCareerRace,
  evaluateSeason,
} from "./careerModeEngine";
import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import "./CareerMode.css";

const INITIAL_PROFILE = {
  name: "",
  helmetColor: HELMET_COLORS[0],
  rating: 58,
  reputation: 28,
  consistency: 58,
  aggression: 55,
  seasons: 0,
  status: "rookie",
  stats: {
    points: 0,
    wins: 0,
    podiums: 0,
    titles: 0,
    teams: [],
  },
};

const HelmetIcon = ({ color, size = 34 }) => (
  <span
    className="cm-helmet"
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      backgroundColor: normalizeColor(color),
      WebkitMaskImage: `url(${racingHelmetUrl})`,
      maskImage: `url(${racingHelmetUrl})`,
    }}
  />
);

const stat = (label, value) => (
  <div className="cm-stat" key={label}>
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

const SetupPanel = ({ draft, setDraft, onSubmit }) => {
  const validName = draft.name.trim().length >= 2;
  return (
    <section className="cm-panel cm-setup">
      <div className="cm-panel-head">
        <PersonFill />
        <div>
          <span>Paso 1</span>
          <h2>Crea tu piloto</h2>
        </div>
      </div>
      <label className="cm-field">
        <span>Nombre del piloto</span>
        <input
          type="text"
          value={draft.name}
          maxLength={32}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder="Nombre y apellido"
        />
      </label>
      <div className="cm-color-picker" aria-label="Color del casco">
        {HELMET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={draft.helmetColor === color ? "is-selected" : ""}
            onClick={() => setDraft({ ...draft, helmetColor: color })}
            style={{ "--helmet-choice": normalizeColor(color) }}
            aria-label={`Casco ${color}`}
          >
            <HelmetIcon color={color} size={28} />
          </button>
        ))}
      </div>
      <div className="cm-driver-preview">
        <HelmetIcon color={draft.helmetColor} size={76} />
        <div>
          <span>Perfil inicial</span>
          <b>{draft.name.trim() || "Nuevo piloto"}</b>
          <small>Rating 58 · Reputacion 28 · Status rookie</small>
        </div>
      </div>
      <button className="cm-btn cm-btn-primary" type="button" disabled={!validName} onClick={onSubmit}>
        <FlagFill />
        Entrar en la Formula 1
      </button>
    </section>
  );
};

const DicePanel = ({ phase, decadeRoll, yearRoll, onRollDecade, onRollYear }) => (
  <section className="cm-panel cm-dice-panel">
    <div className="cm-dice-visual" aria-hidden="true">
      <Dice5Fill />
      <span />
    </div>
    <div className="cm-panel-head">
      <Dice5Fill />
      <div>
        <span>{phase === "decade" ? "Paso 2" : "Paso 3"}</span>
        <h2>{phase === "decade" ? "Tira por decada" : "Tira por anio"}</h2>
      </div>
    </div>
    <div className="cm-roll-result">
      <span>{phase === "decade" ? "Decada sorteada" : "Temporada exacta"}</span>
      <b>{phase === "decade" ? decadeRoll?.label || "--" : yearRoll || "--"}</b>
      <small>
        {phase === "decade"
          ? "La carrera empieza en una epoca aleatoria disponible en la cache."
          : `Dentro de ${decadeRoll?.label || "la decada"}, se decide el calendario de debut.`}
      </small>
    </div>
    {phase === "decade" ? (
      <button className="cm-btn cm-btn-primary" type="button" onClick={onRollDecade}>
        <Dice5Fill />
        Tirar dado
      </button>
    ) : (
      <button className="cm-btn cm-btn-primary" type="button" onClick={onRollYear}>
        <Dice5Fill />
        Decidir anio
      </button>
    )}
  </section>
);

const ContractCard = ({ contract, onSelect }) => (
  <button
    className="cm-contract-card"
    type="button"
    onClick={() => onSelect(contract)}
    style={{ "--team-color": normalizeColor(contract.team.color, "#0f4c81") }}
  >
    <span className="cm-contract-tier">{contract.objectives.tier}</span>
    <div className="cm-contract-team">
      <span className="cm-team-stripe" />
      <div>
        <h3>{contract.team.name}</h3>
        <small>Rating coche {contract.team.rating} · Salario {contract.salary}</small>
      </div>
    </div>
    <p>{contract.promise}</p>
    <dl>
      <div>
        <dt>Puntos objetivo</dt>
        <dd>{contract.objectives.points}</dd>
      </div>
      <div>
        <dt>Constructores</dt>
        <dd>Top {contract.objectives.constructorPosition}</dd>
      </div>
      <div>
        <dt>Reputacion</dt>
        <dd>+{contract.objectives.reputationBonus}</dd>
      </div>
    </dl>
  </button>
);

const ContractSelection = ({ contracts, year, profile, onSelect }) => (
  <section className="cm-panel cm-contracts">
    <div className="cm-panel-head">
      <BriefcaseFill />
      <div>
        <span>{year}</span>
        <h2>Elige tu primer contrato</h2>
      </div>
    </div>
    <p className="cm-panel-copy">
      {profile.name} llega como {profile.status}. Las ofertas priorizan equipos medios y bajos: objetivos realistas,
      bonus de reputacion y riesgo de perder el asiento si queda lejos.
    </p>
    <div className="cm-contract-grid">
      {contracts.map((contract) => (
        <ContractCard key={contract.id} contract={contract} onSelect={onSelect} />
      ))}
    </div>
  </section>
);

const StandingsTable = ({ title, rows, playerOnly = false }) => {
  const visibleRows = playerOnly ? rows : rows.slice(0, 10);
  return (
    <section className="cm-standings">
      <h3>{title}</h3>
      <ol>
        {visibleRows.map((row) => (
          <li
            key={row.id || row.name}
            className={row.isPlayer ? "is-player" : ""}
            style={{ "--row-color": normalizeColor(row.color || "#d8a11d", "#d8a11d") }}
          >
            <b>{row.position}</b>
            <span className="cm-row-stripe" />
            <div>
              <strong>{row.name}</strong>
              <small>{row.team || `${row.wins || 0} victorias`}</small>
            </div>
            <em>{row.points}</em>
          </li>
        ))}
      </ol>
    </section>
  );
};

const RaceSimulation = ({ raceResult, visibleEvents, onFinish, onSkipToResult, lang, simulationSpeed, onSpeedChange }) => {
  const player = raceResult.playerResult;
  const feedRef = useRef(null);
  const eventText = (event) => (lang === "en" && event.textEn ? event.textEn : event.text);
  const isComplete = visibleEvents.length >= raceResult.events.length;
  const livePlayerPosition =
    [...visibleEvents].reverse().find((event) => Number.isFinite(event.playerPosition))?.playerPosition ||
    raceResult.startingPosition ||
    player.gridPosition ||
    player.position;

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleEvents.length]);

  return (
    <section className="cm-panel cm-race-live">
      <div className="cm-panel-head">
        <FlagFill />
        <div>
          <span>Vuelta {visibleEvents.length ? visibleEvents[visibleEvents.length - 1].lap : 1}/{raceResult.race.lapCount}</span>
          <h2>{raceResult.race.name}</h2>
        </div>
      </div>
      <div className="cm-sim-controls" aria-label="Velocidad de simulacion">
        <button
          className={simulationSpeed === "normal" ? "is-active" : ""}
          type="button"
          onClick={() => onSpeedChange("normal")}
          disabled={isComplete}
        >
          Normal
        </button>
        <button
          className={simulationSpeed === "x2" ? "is-active" : ""}
          type="button"
          onClick={() => onSpeedChange("x2")}
          disabled={isComplete}
        >
          x2
        </button>
        <button className="cm-sim-skip" type="button" onClick={onSkipToResult}>
          Simular carrera
        </button>
      </div>
      <div className={`cm-track-scene cm-weather-${raceResult.conditions.weather}`}>
        <div className="cm-track-line" />
        <div className="cm-career-car" style={{ "--car-color": normalizeColor(player.teamColor, "#0f4c81") }}>
          <HelmetIcon color={player.helmetColor} size={30} />
          <span>{livePlayerPosition ? `P${livePlayerPosition}` : "RUN"}</span>
        </div>
      </div>
      <div className="cm-race-meta">
        {stat("Clima", raceResult.conditions.weather)}
        {stat("Degradacion", `${Math.round(raceResult.conditions.degradation * 100)}%`)}
        {stat("Safety car", raceResult.conditions.safetyCar ? `V${raceResult.conditions.safetyCarLap}` : "No")}
        {stat("Bandera roja", raceResult.conditions.redFlag ? `V${raceResult.conditions.redFlagLap}` : "No")}
      </div>
      <ol className="cm-lap-feed" ref={feedRef}>
        {visibleEvents.map((event, index) => (
          <li key={`${event.lap}-${index}`} className={`cm-event-${event.type}${event.important ? " is-important" : ""}`}>
            <b>V{event.lap}</b>
            <span>
              {Number.isFinite(event.playerPosition) && event.important ? <em>P{event.playerPosition}</em> : null}
              {eventText(event)}
            </span>
          </li>
        ))}
      </ol>
      {isComplete && (
        <button className="cm-btn cm-btn-primary" type="button" onClick={onFinish}>
          Ver resultado
        </button>
      )}
    </section>
  );
};

const RaceResult = ({ raceResult, onContinue }) => (
  <section className="cm-panel cm-race-result">
    <div className="cm-panel-head">
      <TrophyFill />
      <div>
        <span>Resultado</span>
        <h2>{raceResult.race.name}</h2>
      </div>
    </div>
    <div className="cm-winner-card" style={{ "--team-color": normalizeColor(raceResult.winner.teamColor, "#0f4c81") }}>
      <span className="cm-team-stripe" />
      <div>
        <small>Ganador</small>
        <b>{raceResult.winner.driver}</b>
        <span>{raceResult.winner.team}</span>
      </div>
    </div>
    <div className="cm-result-grid">
      {raceResult.results.slice(0, 10).map((row) => (
        <div key={row.id} className={row.isPlayer ? "is-player" : ""}>
          <b>P{row.position}</b>
          <HelmetIcon color={row.helmetColor} size={26} />
          <span>{row.driver}</span>
          <em>{row.status === "DNF" ? "DNF" : `${row.points} pts`}</em>
        </div>
      ))}
    </div>
    <button className="cm-btn cm-btn-primary" type="button" onClick={onContinue}>
      Continuar temporada
    </button>
  </section>
);

const SeasonDashboard = ({
  season,
  currentRaceIndex,
  profile,
  onSimulateRace,
  onRetire,
  canSimulate,
}) => {
  const currentRace = season.races[currentRaceIndex];
  const playerStanding = season.driverStandings.find((row) => row.isPlayer);
  const constructorStanding = season.constructorStandings.find((row) => row.name === season.contract.team.name);
  return (
    <div className="cm-season-layout">
      <aside className="cm-season-side">
        <section className="cm-panel cm-profile-card">
          <div className="cm-driver-preview">
            <HelmetIcon color={profile.helmetColor} size={68} />
            <div>
              <span>{profile.status}</span>
              <b>{profile.name}</b>
              <small>Rating {profile.rating} · Reputacion {profile.reputation}</small>
            </div>
          </div>
          <div className="cm-season-objectives">
            {stat("Equipo", season.contract.team.name)}
            {stat("Objetivo pts", season.contract.objectives.points)}
            {stat("Constructores", `Top ${season.contract.objectives.constructorPosition}`)}
            {stat("Ronda", `${Math.min(currentRaceIndex + 1, season.races.length)}/${season.races.length}`)}
          </div>
          <button className="cm-btn cm-btn-secondary" type="button" onClick={onRetire}>
            Retirarse
          </button>
        </section>
        <section className="cm-panel cm-calendar">
          <h3>Calendario {season.year}</h3>
          <ol>
            {season.races.map((race, index) => (
              <li key={`${race.round}-${race.name}`} className={index === currentRaceIndex ? "is-active" : race.completed ? "is-done" : ""}>
                <b>{race.round}</b>
                <span>{race.name}</span>
              </li>
            ))}
          </ol>
        </section>
      </aside>
      <section className="cm-panel cm-next-race">
        <div className="cm-panel-head">
          <FlagFill />
          <div>
            <span>{currentRace ? `Ronda ${currentRace.round}` : "Temporada completa"}</span>
            <h2>{currentRace?.name || "Evaluacion final"}</h2>
          </div>
        </div>
        <div className="cm-season-stats">
          {stat("Puntos piloto", playerStanding?.points || 0)}
          {stat("Posicion piloto", playerStanding ? `P${playerStanding.position}` : "--")}
          {stat("Equipo pts", constructorStanding?.points || 0)}
          {stat("Constructores", constructorStanding ? `P${constructorStanding.position}` : "--")}
        </div>
        <p className="cm-panel-copy">
          La simulacion calcula ritmo puro, adaptacion al circuito, fiabilidad, estrategia, gestion de goma,
          clima variable y eventos de carrera. La narracion destaca lo que afecta a {profile.name}.
        </p>
        <button className="cm-btn cm-btn-primary cm-big-action" type="button" disabled={!canSimulate || !currentRace} onClick={onSimulateRace}>
          <FlagFill />
          Simular carrera
        </button>
      </section>
      <aside className="cm-season-standings">
        <StandingsTable title="Pilotos" rows={season.driverStandings} />
        <StandingsTable title="Constructores" rows={season.constructorStandings} />
      </aside>
    </div>
  );
};

const SeasonReview = ({ evaluation, season, contracts, onContract, onRetire }) => (
  <section className={`cm-panel cm-season-review${evaluation.champion ? " is-champion" : evaluation.titleFight ? " is-title-fight" : ""}`}>
    <div className="cm-review-animation" aria-hidden="true">
      <TrophyFill />
      <span />
      <span />
    </div>
    <div className="cm-panel-head">
      <AwardFill />
      <div>
        <span>Fin de temporada {season.year}</span>
        <h2>
          {evaluation.champion
            ? "Campeon del mundo"
            : evaluation.titleFight
            ? "Temporada de elite"
            : evaluation.fired
            ? "El equipo rompe el contrato"
            : evaluation.met
            ? "Objetivos cumplidos"
            : "Temporada insuficiente"}
        </h2>
      </div>
    </div>
    <div className="cm-season-stats">
      {stat("Puntos", evaluation.playerStanding?.points || 0)}
      {stat("Mundial", evaluation.playerStanding ? `P${evaluation.playerStanding.position}` : "--")}
      {stat("Equipo", evaluation.constructorStanding ? `P${evaluation.constructorStanding.position}` : "--")}
      {stat("Reputacion", `${evaluation.reputationDelta >= 0 ? "+" : ""}${evaluation.reputationDelta}`)}
    </div>
    <p className="cm-panel-copy">
      {evaluation.fired
        ? "La directiva considera que el rendimiento quedo lejos del minimo. Las nuevas ofertas bajan el riesgo y el nivel."
        : evaluation.overDelivered
        ? "El paddock toma nota: el rendimiento supera el valor del coche y abre puertas mejores."
        : "El mercado reacciona de forma gradual: ofertas cercanas al estatus actual y alguna apuesta condicionada."}
    </p>
    <div className="cm-contract-grid">
      {contracts.map((contract) => (
        <ContractCard key={contract.id} contract={contract} onSelect={onContract} />
      ))}
    </div>
    <button className="cm-btn cm-btn-secondary" type="button" onClick={onRetire}>
      Retirarse ahora
    </button>
  </section>
);

const Retirement = ({ summary, onRestart }) => (
  <section className="cm-panel cm-retirement">
    <div className="cm-panel-head">
      <TrophyFill />
      <div>
        <span>Retirada</span>
        <h2>{summary.name}</h2>
      </div>
    </div>
    <div className="cm-season-stats">
      {stat("Temporadas", summary.seasons)}
      {stat("Equipos", summary.teams)}
      {stat("Puntos", summary.points)}
      {stat("Victorias", summary.wins)}
      {stat("Podios", summary.podiums)}
      {stat("Titulos", summary.titles)}
    </div>
    <button className="cm-btn cm-btn-primary" type="button" onClick={onRestart}>
      <ArrowClockwise />
      Nueva trayectoria
    </button>
  </section>
);

const CareerMode = () => {
  const [bootstrap, setBootstrap] = useState(() => prepareCareerBootstrap(fallbackBootstrap, true));
  const [phase, setPhase] = useState("setup");
  const [draft, setDraft] = useState(INITIAL_PROFILE);
  const [profile, setProfile] = useState(null);
  const [decadeRoll, setDecadeRoll] = useState(null);
  const [yearRoll, setYearRoll] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [season, setSeason] = useState(null);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [raceResult, setRaceResult] = useState(null);
  const [visibleEventCount, setVisibleEventCount] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState("normal");
  const [evaluation, setEvaluation] = useState(null);
  const [summary, setSummary] = useState(null);
  const lang = navigator.language.startsWith("en") ? "en" : "es";

  useEffect(() => {
    fetchCareerBootstrap().then(setBootstrap);
  }, []);

  useEffect(() => {
    if (phase !== "race-live" || !raceResult) return undefined;
    if (visibleEventCount >= raceResult.events.length) return undefined;
    const delay = simulationSpeed === "x2" ? 750 : 1500;
    const timer = window.setTimeout(() => {
      setVisibleEventCount((count) => Math.min(raceResult.events.length, count + 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, raceResult, simulationSpeed, visibleEventCount]);

  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        mode: "CareerMode",
        phase,
        profile: profile
          ? {
              name: profile.name,
              rating: profile.rating,
              reputation: profile.reputation,
              status: profile.status,
            }
          : null,
        decade: decadeRoll?.label,
        year: yearRoll,
        contracts: contracts.map((contract) => ({
          team: contract.team.name,
          rating: contract.team.rating,
          targetPoints: contract.objectives.points,
          constructorTarget: contract.objectives.constructorPosition,
        })),
        season: season
          ? {
              year: season.year,
              team: season.contract.team.name,
              round: currentRaceIndex + 1,
              races: season.races.length,
              playerStanding: season.driverStandings.find((row) => row.isPlayer),
            }
          : null,
        race: raceResult
          ? {
              name: raceResult.race.name,
              lapCount: raceResult.race.lapCount,
              visibleEvents: visibleEventCount,
              totalEvents: raceResult.events.length,
              simulationSpeed,
              playerResult: raceResult.playerResult,
              winner: raceResult.winner,
              eventCatalogStats: raceResult.eventCatalogStats,
            }
          : null,
        summary,
      });
    window.advanceTime = () => undefined;
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [phase, profile, decadeRoll, yearRoll, contracts, season, currentRaceIndex, raceResult, visibleEventCount, simulationSpeed, summary]);

  const reset = () => {
    setPhase("setup");
    setDraft(INITIAL_PROFILE);
    setProfile(null);
    setDecadeRoll(null);
    setYearRoll(null);
    setContracts([]);
    setSeason(null);
    setCurrentRaceIndex(0);
    setRaceResult(null);
    setVisibleEventCount(0);
    setSimulationSpeed("normal");
    setEvaluation(null);
    setSummary(null);
  };

  const startProfile = () => {
    const nextProfile = { ...INITIAL_PROFILE, name: draft.name.trim(), helmetColor: draft.helmetColor };
    setProfile(nextProfile);
    setPhase("decade");
  };

  const rollDecade = () => {
    const decades = playableDecades(bootstrap);
    const picked = decades[Math.floor(Math.random() * decades.length)] || bootstrap.decades?.[0];
    setDecadeRoll(picked);
    setPhase("year");
  };

  const rollYear = () => {
    const year = randomYearInDecade(bootstrap, decadeRoll);
    setYearRoll(year);
    const nextContracts = generateContracts({ bootstrap, year, playerProfile: profile });
    setContracts(nextContracts);
    setPhase("contracts");
  };

  const selectContract = (contract) => {
    const nextSeason = createCareerSeason({ bootstrap, profile, year: yearRoll, contract });
    setSeason(nextSeason);
    setCurrentRaceIndex(0);
    setRaceResult(null);
    setPhase("season");
  };

  const simulateRace = () => {
    if (!season || currentRaceIndex >= season.races.length) return;
    const result = simulateCareerRace({ season, raceIndex: currentRaceIndex, profile });
    setRaceResult(result);
    setVisibleEventCount(1);
    setSimulationSpeed("normal");
    setPhase("race-live");
  };

  const showRaceResult = () => setPhase("race-result");
  const skipToRaceResult = () => {
    if (raceResult) {
      setVisibleEventCount(raceResult.events.length);
    }
    setPhase("race-result");
  };

  const continueSeason = () => {
    const nextSeason = completeRace(season, currentRaceIndex, raceResult);
    setSeason(nextSeason);
    setRaceResult(null);
    setVisibleEventCount(0);
    setSimulationSpeed("normal");
    if (currentRaceIndex + 1 >= nextSeason.races.length) {
      const seasonEvaluation = evaluateSeason({ season: nextSeason, profile });
      const nextYear = (bootstrap.seasonYears || []).find((year) => year > nextSeason.year) || nextSeason.year + 1;
      const nextContracts = generateContracts({
        bootstrap,
        year: nextYear,
        playerProfile: seasonEvaluation.nextProfile,
      });
      setEvaluation({ ...seasonEvaluation, nextYear });
      setProfile(seasonEvaluation.nextProfile);
      setYearRoll(nextYear);
      setContracts(nextContracts);
      setPhase("season-review");
    } else {
      setCurrentRaceIndex(currentRaceIndex + 1);
      setPhase("season");
    }
  };

  const signNextContract = (contract) => {
    const nextSeason = createCareerSeason({ bootstrap, profile, year: yearRoll, contract });
    setSeason(nextSeason);
    setCurrentRaceIndex(0);
    setEvaluation(null);
    setRaceResult(null);
    setPhase("season");
  };

  const retire = () => {
    setSummary(retirementSummary(profile || draft, season));
    setPhase("retired");
  };

  const visibleEvents = useMemo(
    () => (raceResult ? raceResult.events.slice(0, visibleEventCount) : []),
    [raceResult, visibleEventCount]
  );

  return (
    <main className={`career-mode-page cm-phase-${phase}`}>
      <section className="cm-shell">
        <header className="cm-header">
          <div>
            <span>OverCut Career</span>
            <h1>Modo trayectoria</h1>
          </div>
          <nav className="cm-actions">
            <Link to="/minigames" className="cm-home-link" aria-label="Volver a minijuegos">
              <ArrowLeftShort size={28} />
              <span>Juegos</span>
            </Link>
            <button className="cm-btn cm-btn-secondary" type="button" onClick={reset}>
              <ArrowClockwise />
              Reiniciar
            </button>
          </nav>
        </header>

        <section className="cm-hero">
          <div>
            <span>{bootstrap.fallbackMode ? "Datos locales de respaldo" : "Cache OverCutRacing"}</span>
            <h2>
              {phase === "setup"
                ? "Crea un piloto y deja que el dado elija su epoca"
                : profile
                ? `${profile.name} · ${profile.status}`
                : "Trayectoria F1"}
            </h2>
          </div>
          {profile && (
            <div className="cm-hero-profile">
              <HelmetIcon color={profile.helmetColor} size={42} />
              <span>REP {profile.reputation}</span>
              <b>RTG {profile.rating}</b>
            </div>
          )}
        </section>

        <section className="cm-main">
          {phase === "setup" && <SetupPanel draft={draft} setDraft={setDraft} onSubmit={startProfile} />}
          {phase === "decade" && (
            <DicePanel phase="decade" decadeRoll={decadeRoll} yearRoll={yearRoll} onRollDecade={rollDecade} />
          )}
          {phase === "year" && (
            <DicePanel phase="year" decadeRoll={decadeRoll} yearRoll={yearRoll} onRollYear={rollYear} />
          )}
          {phase === "contracts" && (
            <ContractSelection contracts={contracts} year={yearRoll} profile={profile} onSelect={selectContract} />
          )}
          {phase === "season" && season && (
            <SeasonDashboard
              season={season}
              currentRaceIndex={currentRaceIndex}
              profile={profile}
              onSimulateRace={simulateRace}
              onRetire={retire}
              canSimulate
            />
          )}
          {phase === "race-live" && raceResult && (
            <RaceSimulation
              raceResult={raceResult}
              visibleEvents={visibleEvents}
              onFinish={showRaceResult}
              onSkipToResult={skipToRaceResult}
              lang={lang}
              simulationSpeed={simulationSpeed}
              onSpeedChange={setSimulationSpeed}
            />
          )}
          {phase === "race-result" && raceResult && (
            <RaceResult raceResult={raceResult} onContinue={continueSeason} />
          )}
          {phase === "season-review" && evaluation && (
            <SeasonReview
              evaluation={evaluation}
              season={season}
              contracts={contracts}
              onContract={signNextContract}
              onRetire={retire}
            />
          )}
          {phase === "retired" && summary && <Retirement summary={summary} onRestart={reset} />}
        </section>
      </section>
    </main>
  );
};

export default CareerMode;
