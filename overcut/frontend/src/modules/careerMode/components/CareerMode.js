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
  interpolateRacePosition,
  normalizeColor,
  playableDecades,
  prepareCareerBootstrap,
  raceResultRows,
  raceStateAtLap,
  randomYearInDecade,
  retirementSummary,
  simulateCareerRace,
  teammateBattleSummary,
  evaluateSeason,
} from "./careerModeEngine";
import {
  ATTRIBUTE_KEYS,
  analyzeRaceXp,
  applyRaceXp,
  computeOverall,
  createDriverCard,
} from "./driverCard";
import { localizeRaceName } from "./careerRaceNames";
import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import "./CareerMode.css";

const STARTING_AGE = 18;
const FINAL_AGE = 41; // last season the driver may race

const createInitialProfile = () => {
  const card = createDriverCard();
  const overall = computeOverall(card);
  return {
    name: "",
    helmetColor: HELMET_COLORS[0],
    age: STARTING_AGE,
    card,
    cardXp: { pace: 0, racecraft: 0, awareness: 0, experience: 0 },
    overall,
    rating: overall,
    reputation: 28,
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
};

const INITIAL_PROFILE = createInitialProfile();

// Labels + order for the four card attributes (F1 25 style).
const ATTRIBUTE_LABELS = {
  pace: { short: "PAC", name: "Ritmo" },
  racecraft: { short: "RAC", name: "Pilotaje" },
  awareness: { short: "AWA", name: "Conciencia" },
  experience: { short: "EXP", name: "Experiencia" },
};

const ATTRIBUTE_XP_LABELS = {
  pace: "Ritmo",
  racecraft: "Pilotaje",
  awareness: "Conciencia",
  experience: "Experiencia",
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

// One attribute bar; when `delta > 0` a brighter overlay marks the points just
// gained so the post-race growth reads at a glance.
const AttributeBar = ({ value, delta = 0 }) => (
  <div className="cm-card-bar" aria-hidden="true">
    <span className="cm-card-bar-fill" style={{ width: `${value}%` }} />
    {delta > 0 && (
      <span
        className="cm-card-bar-gain"
        style={{ left: `${value - delta}%`, width: `${delta}%` }}
      />
    )}
  </div>
);

const buildRaceDevelopment = ({ profile, raceResult, season }) => {
  const xpGains = analyzeRaceXp(raceResult, season, profile);
  const progression = applyRaceXp(
    profile.card,
    profile.cardXp || { pace: 0, racecraft: 0, awareness: 0, experience: 0 },
    xpGains,
    profile.age || STARTING_AGE
  );
  const previousOverall = profile.overall ?? computeOverall(profile.card);
  const nextProfile = {
    ...profile,
    card: progression.card,
    cardXp: progression.cardXp,
    overall: progression.overall,
    rating: progression.overall,
  };
  return {
    previousProfile: profile,
    nextProfile,
    xpGains,
    deltas: progression.deltas,
    overallDelta: progression.overall - previousOverall,
    resultFactor: xpGains.resultFactor,
    expected: xpGains.expected,
    actual: xpGains.actual,
  };
};

// The driver's F1 25-style card: Pace / Racecraft / Awareness / Experience plus a
// derived Overall. `deltas` (optional) animates the points won after a race.
const DriverCardView = ({ profile, deltas = null, compact = false }) => {
  const card = profile?.card;
  if (!card) return null;
  const overall = profile.overall ?? computeOverall(card);
  return (
    <section
      className={`cm-driver-card${compact ? " is-compact" : ""}${deltas ? " is-animating" : ""}`}
      style={{ "--card-accent": normalizeColor(profile.helmetColor, "#d8a11d") }}
    >
      <header className="cm-card-head">
        <HelmetIcon color={profile.helmetColor} size={compact ? 34 : 46} />
        <div className="cm-card-id">
          <span>{profile.status} · {profile.age} años</span>
          <b>{profile.name || "Piloto"}</b>
        </div>
        <div className="cm-card-overall">
          <small>GLOBAL</small>
          <strong>{overall}</strong>
        </div>
      </header>
      <ul className="cm-card-attrs">
        {ATTRIBUTE_KEYS.map((key) => {
          const delta = deltas?.[key] || 0;
          return (
            <li key={key} className={delta > 0 ? "is-up" : ""}>
              <span className="cm-card-attr-label">
                <b>{ATTRIBUTE_LABELS[key].short}</b>
                <small>{ATTRIBUTE_LABELS[key].name}</small>
              </span>
              <AttributeBar value={card[key]} delta={delta} />
              <span className="cm-card-attr-value">
                {card[key]}
                {delta > 0 && <em className="cm-card-attr-delta">+{delta}</em>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// Live head-to-head between the player and their team-mate during the race.
const TrackDuel = ({ player, teammate, playerPosition, teammatePosition }) => {
  if (!teammate || !Number.isFinite(playerPosition) || !Number.isFinite(teammatePosition)) return null;
  const ahead = playerPosition < teammatePosition;
  const tied = playerPosition === teammatePosition;
  const gap = Math.abs(teammatePosition - playerPosition);
  return (
    <section className={`cm-track-duel ${ahead ? "is-ahead" : tied ? "is-tied" : "is-behind"}`}>
      <header>Duelo en pista</header>
      <div className="cm-duel-grid">
        <div className={`cm-duel-side${ahead || tied ? " is-leader" : ""}`}>
          <small>Tú</small>
          <HelmetIcon color={player.helmetColor} size={28} />
          <b>P{playerPosition}</b>
        </div>
        <div className="cm-duel-mid" aria-hidden="true">
          <span className="cm-duel-arrow">{tied ? "=" : ahead ? "◄" : "►"}</span>
          {!tied && <em>+{gap}</em>}
        </div>
        <div className={`cm-duel-side${!ahead && !tied ? " is-leader" : ""}`}>
          <small>Compañero</small>
          <HelmetIcon color={teammate.helmetColor} size={28} />
          <b>P{teammatePosition}</b>
        </div>
      </div>
      <p className="cm-duel-name">{teammate.name}</p>
    </section>
  );
};

// Custom inline SVG icons for the on-track race-state overlays.
const SafetyCarIcon = ({ size = 30 }) => (
  <svg className="cm-flag-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path d="M6 30l3-9a5 5 0 0 1 4.7-3.4h20.6A5 5 0 0 1 39 21l3 9v7a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-2H14v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="currentColor" />
    <path d="M12 18l2.4-6.2A4 4 0 0 1 18.1 9h11.8a4 4 0 0 1 3.7 2.8L36 18z" fill="rgba(0,0,0,.35)" />
    <circle cx="14" cy="31" r="2.6" fill="#10141b" />
    <circle cx="34" cy="31" r="2.6" fill="#10141b" />
    <rect x="20" y="6" width="8" height="4" rx="1.4" fill="#10141b" />
    <path d="M6 24h36" stroke="#10141b" strokeWidth="2.4" strokeDasharray="4 3" opacity=".5" />
  </svg>
);

const RedFlagIcon = ({ size = 30 }) => (
  <svg className="cm-flag-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <rect x="11" y="6" width="3" height="36" rx="1.5" fill="#1c1f25" />
    <path d="M14 8h24l-4 7 4 7H14z" fill="currentColor" />
  </svg>
);

const RainIcon = ({ size = 30 }) => (
  <svg className="cm-flag-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path d="M14 27a8 8 0 0 1 1.2-15.9A10 10 0 0 1 34 14.5 7 7 0 0 1 33 28z" fill="currentColor" />
    <g fill="none" stroke="#cfe6ff" strokeWidth="2.6" strokeLinecap="round">
      <path d="M16 33l-2 5" />
      <path d="M24 33l-2 5" />
      <path d="M32 33l-2 5" />
    </g>
  </svg>
);

const CONDITION_LABELS = {
  seco: "Seco",
  intermedios: "Intermedios",
  lluvia: "Lluvia",
};

// Derive the prominent track overlay from the live race state. Priority:
// red flag > safety car > rain. Returns null when the track is green and dry.
const trackOverlayFor = (state) => {
  if (state.redFlagActive) return { kind: "redflag", label: "BANDERA ROJA", icon: <RedFlagIcon size={34} /> };
  if (state.scActive) return { kind: "safetycar", label: "SAFETY CAR", icon: <SafetyCarIcon size={34} /> };
  if (state.wet) return { kind: "rain", label: state.condition === "lluvia" ? "LLUVIA" : "PISTA MOJADA", icon: <RainIcon size={34} /> };
  return null;
};

const RAIN_DROPS = Array.from({ length: 16 }, (_, index) => index);

const TeammateBattle = ({ battle }) => {
  if (!battle) return null;
  const stateClass = battle.tied ? "is-tied" : battle.leading ? "is-leading" : "is-behind";
  return (
    <section className={`cm-teammate ${stateClass}`}>
      <header>
        <span>Duelo con el compañero</span>
        <b>{battle.teammateName}</b>
      </header>
      <div className="cm-teammate-grid">
        <div>
          <small>Carreras</small>
          <strong>{battle.raceWins}-{battle.raceLosses}</strong>
        </div>
        <div>
          <small>Clasificación</small>
          <strong>{battle.qualiWins}-{battle.qualiLosses}</strong>
        </div>
        <div>
          <small>Puntos</small>
          <strong>{battle.playerPoints}-{battle.teammatePoints}</strong>
        </div>
        <div>
          <small>Balance</small>
          <strong>{battle.pointsGap >= 0 ? `+${battle.pointsGap}` : battle.pointsGap}</strong>
        </div>
      </div>
      <p className="cm-teammate-state">
        {battle.tied
          ? "Empate al límite con tu compañero."
          : battle.leading
          ? "Por delante en el cómputo de la temporada: clave para tu estatus."
          : "Por detrás del compañero: ganar el duelo cuenta para tu estatus."}
      </p>
    </section>
  );
};

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
  const playerBelow =
    !playerOnly && title === "Pilotos"
      ? rows.find((row) => row.isPlayer && !visibleRows.some((visible) => visible.isPlayer))
      : null;
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
        {playerBelow && (
          <>
            <li className="cm-standing-player-label" aria-hidden="true">
              <span>Tu posicion</span>
            </li>
            <li
              key={playerBelow.id || playerBelow.name}
              className="is-player"
              style={{ "--row-color": normalizeColor(playerBelow.color || "#d8a11d", "#d8a11d") }}
            >
              <b>{playerBelow.position}</b>
              <span className="cm-row-stripe" />
              <div>
                <strong>{playerBelow.name}</strong>
                <small>{playerBelow.team || `${playerBelow.wins || 0} victorias`}</small>
              </div>
              <em>{playerBelow.points}</em>
            </li>
          </>
        )}
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
  const currentLap = visibleEvents.length ? visibleEvents[visibleEvents.length - 1].lap : 1;
  const teammatePosition = raceResult.teammate
    ? interpolateRacePosition(
        raceResult.teammate.startingPosition,
        raceResult.teammate.finalPosition,
        currentLap / raceResult.race.lapCount
      )
    : null;
  // State is derived only from the current lap, so nothing about future safety
  // cars, red flags or rain is revealed before it actually happens.
  const liveState = raceStateAtLap(raceResult.conditions, currentLap);
  const overlay = trackOverlayFor(liveState);
  const trackStatusLabel = liveState.redFlagActive ? "Bandera roja" : liveState.scActive ? "Safety Car" : "Verde";

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
          <h2>{localizeRaceName(raceResult.race.name, lang)}</h2>
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
      <div
        className={`cm-track-scene cm-weather-${liveState.condition}${overlay ? ` cm-track-${overlay.kind}` : ""}`}
      >
        <div className="cm-track-line" />
        {liveState.wet && (
          <div className="cm-rain-layer" aria-hidden="true">
            {RAIN_DROPS.map((drop) => (
              <span
                key={drop}
                style={{
                  left: `${(drop * 6.1 + 4) % 96}%`,
                  animationDelay: `${(drop % 8) * 0.13}s`,
                  animationDuration: `${0.6 + (drop % 4) * 0.14}s`,
                }}
              />
            ))}
          </div>
        )}
        {overlay && overlay.kind !== "rain" && <span className="cm-flag-sweep" aria-hidden="true" />}
        <div className="cm-career-car" style={{ "--car-color": normalizeColor(player.teamColor, "#0f4c81") }}>
          <HelmetIcon color={player.helmetColor} size={30} />
          <span>{livePlayerPosition ? `P${livePlayerPosition}` : "RUN"}</span>
        </div>
        {overlay && (
          <div className={`cm-race-flag cm-race-flag-${overlay.kind}`} role="status">
            {overlay.icon}
            <span>{overlay.label}</span>
          </div>
        )}
      </div>
      <div className="cm-race-meta">
        {stat("Clima", CONDITION_LABELS[liveState.condition] || liveState.condition)}
        {stat("Degradacion", `${Math.round(raceResult.conditions.degradation * 100)}%`)}
        {stat("Estado de pista", trackStatusLabel)}
      </div>
      <TrackDuel
        player={player}
        teammate={raceResult.teammate}
        playerPosition={livePlayerPosition}
        teammatePosition={teammatePosition}
      />
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

const RaceResult = ({ raceResult, onContinue, lang }) => {
  const { rows, playerBelow } = raceResultRows(raceResult.results);
  const resultRow = (row) => (
    <div key={row.id} className={row.isPlayer ? "is-player" : ""}>
      <b>P{row.position}</b>
      <HelmetIcon color={row.helmetColor} size={26} />
      <span>{row.driver}</span>
      <em>{row.status === "DNF" ? "DNF" : `${row.points} pts`}</em>
    </div>
  );
  return (
    <section className="cm-panel cm-race-result">
      <div className="cm-panel-head">
        <TrophyFill />
        <div>
          <span>Resultado</span>
          <h2>{localizeRaceName(raceResult.race.name, lang)}</h2>
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
        {rows.map(resultRow)}
        {playerBelow && (
          <>
            <p className="cm-result-player-label">Tu resultado</p>
            {resultRow(playerBelow)}
          </>
        )}
      </div>
      <button className="cm-btn cm-btn-primary" type="button" onClick={onContinue}>
        Ver evolucion
      </button>
    </section>
  );
};

const RaceDevelopment = ({ development, raceResult, onContinue, lang }) => {
  const player = raceResult.playerResult;
  const totalDelta = ATTRIBUTE_KEYS.reduce((sum, key) => sum + (development.deltas[key] || 0), 0);
  return (
    <section className="cm-panel cm-race-development">
      <div className="cm-panel-head">
        <AwardFill />
        <div>
          <span>Progreso tras {localizeRaceName(raceResult.race.name, lang)}</span>
          <h2>{development.overallDelta > 0 ? "La carta sube" : "Experiencia acumulada"}</h2>
        </div>
      </div>
      <div className="cm-development-layout">
        <DriverCardView profile={development.nextProfile} deltas={development.deltas} />
        <div className="cm-development-side">
          <div className="cm-season-stats">
            {stat("Resultado", player.status === "DNF" ? "DNF" : `P${player.position}`)}
            {stat("Esperado", `P${development.expected}`)}
            {stat("Factor XP", `${development.resultFactor.toFixed(2)}x`)}
            {stat("Subidas", totalDelta > 0 ? `+${totalDelta}` : "0")}
          </div>
          <div className="cm-xp-list">
            {ATTRIBUTE_KEYS.map((key) => (
              <div
                key={key}
                className={development.deltas[key] > 0 ? "is-up" : ""}
                style={{ "--xp-width": `${Math.min(100, Math.round(development.xpGains[key] || 0))}%` }}
              >
                <span>{ATTRIBUTE_XP_LABELS[key]}</span>
                <b>+{Math.round(development.xpGains[key] || 0)} XP</b>
                <em>{development.deltas[key] > 0 ? `+${development.deltas[key]}` : "sin subida"}</em>
              </div>
            ))}
          </div>
          <p className="cm-panel-copy">
            La experiencia siempre progresa; el rendimiento sobre el objetivo del coche multiplica Ritmo,
            Pilotaje y Conciencia. La mejora ya cuenta desde la siguiente carrera.
          </p>
          <button className="cm-btn cm-btn-primary" type="button" onClick={onContinue}>
            Continuar temporada
          </button>
        </div>
      </div>
    </section>
  );
};

const SeasonDashboard = ({
  season,
  currentRaceIndex,
  profile,
  onSimulateRace,
  onRetire,
  canSimulate,
  lang,
}) => {
  const currentRace = season.races[currentRaceIndex];
  const playerStanding = season.driverStandings.find((row) => row.isPlayer);
  const constructorStanding = season.constructorStandings.find((row) => row.name === season.contract.team.name);
  const teammateBattle = teammateBattleSummary(season, profile);
  return (
    <div className="cm-season-layout">
      <aside className="cm-season-side">
        <section className="cm-panel cm-profile-card">
          <div className="cm-driver-preview">
            <HelmetIcon color={profile.helmetColor} size={68} />
            <div>
              <span>{profile.status}</span>
              <b>{profile.name}</b>
              <small>Edad actual: {profile.age} años</small>
              <small>Rating {profile.rating} · Reputacion {profile.reputation}</small>
            </div>
          </div>
          <DriverCardView profile={profile} compact />
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
        {teammateBattle && (
          <section className="cm-panel cm-teammate-panel">
            <TeammateBattle battle={teammateBattle} />
          </section>
        )}
        <section className="cm-panel cm-calendar">
          <h3>Calendario {season.year}</h3>
          <ol>
            {season.races.map((race, index) => (
              <li key={`${race.round}-${race.name}`} className={index === currentRaceIndex ? "is-active" : race.completed ? "is-done" : ""}>
                <b>{race.round}</b>
                <span>{localizeRaceName(race.name, lang)}</span>
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
            <h2>{currentRace ? localizeRaceName(currentRace.name, lang) : "Evaluacion final"}</h2>
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
    {evaluation.teammateBattle && (
      <div className="cm-review-teammate">
        <TeammateBattle battle={evaluation.teammateBattle} />
        <p className="cm-teammate-impact">
          {evaluation.teammateBattle.tied
            ? "Duelo interno igualado: sin efecto en la reputación."
            : evaluation.teammateBattle.beaten
            ? `Ganaste a tu compañero en el cómputo final (${evaluation.teammateRepDelta >= 0 ? "+" : ""}${evaluation.teammateRepDelta} reputación).`
            : `Tu compañero te superó en el cómputo final (${evaluation.teammateRepDelta} reputación).`}
        </p>
      </div>
    )}
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
  const [raceDevelopment, setRaceDevelopment] = useState(null);
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
        development: raceDevelopment
          ? {
              rating: raceDevelopment.nextProfile.rating,
              deltas: raceDevelopment.deltas,
              xpGains: ATTRIBUTE_KEYS.reduce((acc, key) => {
                acc[key] = Math.round(raceDevelopment.xpGains[key] || 0);
                return acc;
              }, {}),
            }
          : null,
        summary,
      });
    window.advanceTime = () => undefined;
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [phase, profile, decadeRoll, yearRoll, contracts, season, currentRaceIndex, raceResult, raceDevelopment, visibleEventCount, simulationSpeed, summary]);

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
    setRaceDevelopment(null);
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
    setRaceDevelopment(null);
    setPhase("season");
  };

  const simulateRace = () => {
    if (!season || currentRaceIndex >= season.races.length) return;
    const result = simulateCareerRace({ season, raceIndex: currentRaceIndex, profile });
    setRaceResult(result);
    setRaceDevelopment(null);
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

  const showRaceDevelopment = () => {
    if (!profile || !raceResult || !season) return;
    setRaceDevelopment(buildRaceDevelopment({ profile, raceResult, season }));
    setPhase("race-development");
  };

  const continueSeason = () => {
    const activeDevelopment =
      raceDevelopment || (profile && raceResult && season ? buildRaceDevelopment({ profile, raceResult, season }) : null);
    const updatedProfile = activeDevelopment?.nextProfile || profile;
    const nextSeason = completeRace(season, currentRaceIndex, raceResult);
    setSeason(nextSeason);
    setRaceResult(null);
    setRaceDevelopment(null);
    setVisibleEventCount(0);
    setSimulationSpeed("normal");
    if (currentRaceIndex + 1 >= nextSeason.races.length) {
      const seasonEvaluation = evaluateSeason({ season: nextSeason, profile: updatedProfile });
      const nextYear = (bootstrap.seasonYears || []).find((year) => year > nextSeason.year) || nextSeason.year + 1;
      if (seasonEvaluation.nextProfile.age > FINAL_AGE) {
        setProfile(seasonEvaluation.nextProfile);
        setSummary(retirementSummary(seasonEvaluation.nextProfile, nextSeason));
        setPhase("retired");
        return;
      }
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
      setProfile(updatedProfile);
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
    setRaceDevelopment(null);
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
  const displaySeasonYear = season?.year || yearRoll;

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
                ? `${profile.name} · ${profile.status} · Temporada ${profile.seasons + 1}${displaySeasonYear ? ` · ${displaySeasonYear}` : ""}`
                : "Trayectoria F1"}
            </h2>
          </div>
          {profile && (
            <div className="cm-hero-profile">
              <HelmetIcon color={profile.helmetColor} size={42} />
              <span>EDAD {profile.age}</span>
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
              lang={lang}
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
            <RaceResult raceResult={raceResult} onContinue={showRaceDevelopment} lang={lang} />
          )}
          {phase === "race-development" && raceResult && raceDevelopment && (
            <RaceDevelopment
              development={raceDevelopment}
              raceResult={raceResult}
              onContinue={continueSeason}
              lang={lang}
            />
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
