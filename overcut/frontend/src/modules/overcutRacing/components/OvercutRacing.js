import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowClockwise, ArrowLeftShort, Dice5Fill, FlagFill, LightningChargeFill } from "react-bootstrap-icons";
import { config } from "../../../config/constants";
import racingHelmetUrl from "../../../assets/images/miniGames/RacingHelmet.png";
import { fallbackBootstrap } from "./fallbackData";
import { buildGrid, simulateChampionship } from "./racingEngine";
import { strings } from "./i18n";
import "./OvercutRacing.css";

const TARGET_TEAMS = 11;
const TARGET_DRIVERS = 22;
const DRIVER_CANDIDATES_PER_ROLL = 11;
const DRIVER_CANDIDATE_MAX_SPREAD = 10;
const SIMULATION_DURATION_MS = 2500;

const HELMET_COLORS = [
  "#e6194b", "#f58231", "#ffe119", "#bcf60c", "#3cb44b",
  "#469990", "#42d4f4", "#4363d8", "#911eb4", "#f032e6",
  "#fabed4", "#9a6324", "#800000", "#aaffc3", "#808000",
  "#ffd8b1", "#000075", "#a9a9a9", "#ff6e54", "#1976d2",
  "#26a69a", "#7e57c2",
];

const HelmetIcon = ({ color, size = 28 }) => (
  <span
    className="ocr-helmet"
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      WebkitMaskImage: `url(${racingHelmetUrl})`,
      maskImage: `url(${racingHelmetUrl})`,
    }}
  />
);

const pickHelmetColor = (usedColors) => {
  const available = HELMET_COLORS.filter((color) => !usedColors.has(color));
  const pool = available.length ? available : HELMET_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
};

const normalizeName = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const hasBuckets = (buckets) =>
  Object.values(buckets || {}).some((items) => Array.isArray(items) && items.length > 0);

const getSeasonYearsFromRaces = (racesByYear = {}) =>
  Object.entries(racesByYear)
    .filter(([, races]) => Array.isArray(races) && races.length > 0)
    .map(([year]) => Number(year))
    .filter((year) => Number.isFinite(year) && year >= 1950)
    .sort((a, b) => a - b);

const prepareBootstrap = (data, fallbackMode = false) => {
  const hasBackendPayload =
    data?.decades?.length &&
    hasBuckets(data.teamsByDecade) &&
    hasBuckets(data.driversByDecade) &&
    hasBuckets(data.racesByYear);
  const source = hasBackendPayload ? data : fallbackBootstrap;
  const seasonYears = (source.seasonYears?.length ? source.seasonYears : getSeasonYearsFromRaces(source.racesByYear))
    .map(Number)
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => a - b);
  const latestSeasonYear =
    seasonYears[seasonYears.length - 1] || source.dataCoverageYear || source.currentYear || new Date().getFullYear();

  return {
    ...source,
    currentYear: source.currentYear || latestSeasonYear,
    dataCoverageYear: source.dataCoverageYear || latestSeasonYear,
    dataSource: source.dataSource || strings.dataSourceFallback,
    fallbackMode: fallbackMode || !hasBackendPayload,
    seasonYears,
  };
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const sampleRandom = (items, count) => {
  if (items.length <= count) {
    return [...items];
  }
  const pool = [...items];
  for (let i = pool.length - 1; i > pool.length - 1 - count; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(pool.length - count);
};

const buildBoundedCandidates = (pool, maxSpread, sampleSize) => {
  if (pool.length === 0) {
    return [];
  }
  const sorted = [...pool].sort((a, b) => a.rating - b.rating);
  const windows = [];
  let end = 0;
  for (let start = 0; start < sorted.length; start += 1) {
    if (end < start) {
      end = start;
    }
    while (end + 1 < sorted.length && sorted[end + 1].rating - sorted[start].rating <= maxSpread) {
      end += 1;
    }
    windows.push({ start, end });
  }
  const fullWindows = windows.filter(({ start, end: e }) => e - start + 1 >= sampleSize);
  const candidates = fullWindows.length ? fullWindows : windows;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const slice = sorted.slice(chosen.start, chosen.end + 1);
  return sampleRandom(slice, sampleSize);
};

const getEntityKey = (item) => normalizeName(item.name);

const getAvailableDecades = (bootstrap, type, selected) => {
  const selectedKeys = new Set(selected.map(getEntityKey));
  const source = type === "teams" ? bootstrap.teamsByDecade : bootstrap.driversByDecade;
  return bootstrap.decades.filter((decade) =>
    (source[decade.key] || []).some((item) => !selectedKeys.has(getEntityKey(item)))
  );
};

const fetchBootstrap = async () => {
  try {
    const response = await fetch(`${config.BASE_PATH}/overcutRacing/bootstrap`);
    if (!response.ok) {
      throw new Error("Bootstrap unavailable");
    }
    return prepareBootstrap(await response.json());
  } catch (error) {
    return prepareBootstrap(fallbackBootstrap, true);
  }
};

const fetchSeasonRaces = (year, bootstrap) => {
  const localRaces = bootstrap.racesByYear?.[String(year)] || [];
  if (localRaces.length) {
    return {
      races: localRaces,
      source: bootstrap.fallbackMode ? strings.fallbackSourceLocal : strings.fallbackSourceCache,
    };
  }

  const fallbackYear = getSeasonYearsFromRaces(fallbackBootstrap.racesByYear).pop();
  return { races: fallbackBootstrap.racesByYear[String(fallbackYear)] || [], source: strings.fallbackSourceLocal };
};

const PhaseMeter = ({ teams, drivers, phase }) => (
  <div className="ocr-phase-meter" aria-label={strings.progressAria}>
    <div className={phase === "teams" ? "is-active" : ""}>
      <span>{teams}/{TARGET_TEAMS}</span>
      <b>{strings.teamsCounter}</b>
    </div>
    <div className={phase === "drivers" ? "is-active" : ""}>
      <span>{drivers}/{TARGET_DRIVERS}</span>
      <b>{strings.driversCounter}</b>
    </div>
    <div className={phase === "ready" || phase === "season" ? "is-active" : ""}>
      <span>{strings.raceTab}</span>
      <b>{strings.championshipTab}</b>
    </div>
  </div>
);

const EntityList = ({ title, items, emptyText, variant }) => (
  <section className="ocr-list-panel">
    <div className="ocr-list-head">
      <span>{title}</span>
      <b>{items.length}</b>
    </div>
    <div className={`ocr-entity-list${variant === "drivers" ? " ocr-entity-list--drivers" : ""}`}>
      {items.length === 0 ? (
        <p className="ocr-empty">{emptyText}</p>
      ) : (
        items.map((item, index) => (
          <div
            className={`ocr-entity-row${item.helmetColor ? " ocr-entity-row--driver" : ""}`}
            key={`${item.name}-${index}`}
            style={{ "--rating": `${item.rating}%` }}
          >
            <span className="ocr-row-index">{String(index + 1).padStart(2, "0")}</span>
            {item.helmetColor ? <HelmetIcon color={item.helmetColor} size={26} /> : null}
            <div>
              <b>{item.name}</b>
              <small>{strings.decadeDetail(item.decade, item.firstYear, item.lastYear)}</small>
            </div>
            <strong>{item.rating}</strong>
          </div>
        ))
      )}
    </div>
  </section>
);

const DriverChoiceList = ({ pendingDriverRoll, onPickDriver, disabled }) => {
  if (!pendingDriverRoll) {
    return null;
  }

  return (
    <section className="ocr-choice-panel">
      <div className="ocr-choice-head">
        <span>{strings.availablePilots}</span>
        <b>{pendingDriverRoll.candidates.length}</b>
      </div>
      <div className="ocr-choice-list">
        {pendingDriverRoll.candidates.map((driver) => (
          <button
            className="ocr-choice-row"
            key={`${pendingDriverRoll.decade}-${driver.name}`}
            type="button"
            disabled={disabled}
            onClick={() => onPickDriver(driver)}
            style={{ "--rating": `${driver.rating}%` }}
          >
            <span>{driver.rating}</span>
            <div>
              <b>{driver.name}</b>
              <small>{strings.seasonsDetail(driver.firstYear, driver.lastYear, driver.seasons)}</small>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

const GridBoard = ({ teams, drivers, lastRoll, pendingDriverAssignment, onAssignSlot }) => {
  const grid = useMemo(() => buildGrid(teams, drivers), [teams, drivers]);
  const isAssigning = Boolean(pendingDriverAssignment);
  return (
    <section
      className={`ocr-grid-board${isAssigning ? " is-assigning" : ""}`}
      aria-label={strings.gridBoardAria}
    >
      <div className="ocr-track-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ocr-curb ocr-curb-left" aria-hidden="true" />
      <div className="ocr-curb ocr-curb-right" aria-hidden="true" />
      {Array.from({ length: TARGET_TEAMS }).map((_, index) => {
        const team = grid[index];
        const justAddedTeam =
          lastRoll?.type === "teams" && lastRoll.entity && team && getEntityKey(team) === getEntityKey(lastRoll.entity);
        return (
          <div className={`ocr-garage ${team ? "is-filled" : ""} ${justAddedTeam ? "is-new" : ""}`} key={index}>
            <div
              className={`ocr-garage-team ${team ? "is-filled" : ""}`}
              style={team ? { "--team-color": team.color } : undefined}
            >
              <span>{index + 1}</span>
              <b>{team?.name || strings.teamPlaceholder}</b>
            </div>
            <div className="ocr-garage-drivers">
              {[0, 1].map((driverIndex) => {
                const driver = drivers[index * 2 + driverIndex];
                const justAddedDriver =
                  lastRoll?.type === "drivers" &&
                  lastRoll.entity &&
                  driver &&
                  getEntityKey(driver) === getEntityKey(lastRoll.entity);
                const isTarget = isAssigning && Boolean(team) && !driver;
                const className = [
                  driver ? "is-filled" : "",
                  justAddedDriver ? "is-new" : "",
                  isTarget ? "is-target" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const handleClick = isTarget ? () => onAssignSlot(index, driverIndex) : undefined;
                const handleKeyDown = isTarget
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onAssignSlot(index, driverIndex);
                      }
                    }
                  : undefined;
                return (
                  <div
                    className={className}
                    key={driverIndex}
                    role={isTarget ? "button" : undefined}
                    tabIndex={isTarget ? 0 : undefined}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    style={driver?.helmetColor ? { "--helmet-color": driver.helmetColor } : undefined}
                  >
                    {driver ? <HelmetIcon color={driver.helmetColor} size={26} /> : null}
                    <span>{driver ? driver.rating : "--"}</span>
                    <b>{driver?.name || (isTarget ? strings.assignHere : strings.pilotPlaceholder)}</b>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
};

const RollPanel = ({
  phase,
  lastRoll,
  pendingDriverRoll,
  pendingDriverAssignment,
  teamsCount,
  driversCount,
  onRoll,
  onPickDriver,
  onCancelAssignment,
  onAutoComplete,
  onRace,
  loading,
  rolling,
}) => {
  const canRoll = (phase === "teams" || phase === "drivers") && !pendingDriverAssignment;
  const rollLabel = phase === "teams"
    ? strings.rollTeam
    : pendingDriverRoll
    ? strings.rollAnotherDecade
    : strings.rollDriver;
  const resultLabel = pendingDriverAssignment
    ? strings.assignTeamKicker
    : !lastRoll?.entity
    ? strings.decadeKicker
    : lastRoll.type === "drivers"
    ? strings.chosenKicker
    : strings.drawnKicker;
  return (
    <section className={`ocr-roll-panel ${rolling ? "is-rolling" : ""}${pendingDriverAssignment ? " is-assigning" : ""}`}>
      <div className="ocr-dice-stage" aria-hidden="true">
        <Dice5Fill size={56} />
        <span />
        <span />
      </div>
      <div className="ocr-roll-result">
        {pendingDriverAssignment ? (
          <>
            <span>{resultLabel}</span>
            <b>{pendingDriverAssignment.name}</b>
            <strong>{strings.ratingPrefix(pendingDriverAssignment.rating)}</strong>
            <small>{strings.assignSlotPrompt}</small>
          </>
        ) : lastRoll ? (
          <>
            <span>{resultLabel}</span>
            <b>{lastRoll.decade}</b>
            <strong>{lastRoll.entity?.name || strings.pickDriverPrompt}</strong>
            <small>
              {lastRoll.entity
                ? strings.ratingDetail(lastRoll.entity.firstYear, lastRoll.entity.lastYear, lastRoll.entity.rating)
                : strings.candidatesAvailable(pendingDriverRoll?.candidates.length || 0)}
            </small>
          </>
        ) : (
          <>
            <span>{strings.introKicker}</span>
            <b>{strings.introBrand}</b>
            <strong>{phase === "intro" ? strings.pressPlay : strings.readyToRoll}</strong>
          </>
        )}
      </div>

      {pendingDriverAssignment && (
        <button
          className="ocr-btn ocr-btn-secondary ocr-roll-button"
          type="button"
          onClick={onCancelAssignment}
        >
          {strings.cancelAssignment}
        </button>
      )}

      {canRoll && (
        <button className="ocr-btn ocr-btn-primary ocr-roll-button" type="button" onClick={onRoll} disabled={rolling}>
          <Dice5Fill size={22} />
          {rollLabel}
        </button>
      )}

      {phase === "drivers" && driversCount < TARGET_DRIVERS && !pendingDriverAssignment && (
        <button
          className="ocr-btn ocr-btn-secondary ocr-roll-button ocr-autocomplete-button"
          type="button"
          onClick={onAutoComplete}
          disabled={rolling}
        >
          <LightningChargeFill size={20} />
          {strings.autocomplete}
        </button>
      )}

      {!pendingDriverAssignment && (
        <DriverChoiceList pendingDriverRoll={pendingDriverRoll} onPickDriver={onPickDriver} disabled={rolling} />
      )}

      {phase === "ready" && (
        <button className="ocr-btn ocr-btn-race ocr-roll-button" type="button" onClick={onRace} disabled={loading}>
          <FlagFill size={22} />
          {loading ? strings.raceLoading : strings.raceButton}
        </button>
      )}

      <PhaseMeter teams={teamsCount} drivers={driversCount} phase={phase} />
    </section>
  );
};

const StandingsTable = ({ title, rows, compact }) => {
  const visibleRows = rows.slice(0, compact ? 8 : 12);
  const maxPoints = Math.max(1, ...visibleRows.map((row) => row.points));

  if (visibleRows.length === 0) {
    return (
      <section className="ocr-standings ocr-standings--empty">
        <h3>{title}</h3>
        <p className="ocr-empty">{strings.emptyStandings}</p>
      </section>
    );
  }

  return (
    <section className="ocr-standings">
      <h3>{title}</h3>
      <table>
        <tbody>
          {visibleRows.map((row, index) => (
            <tr key={row.id || row.name} style={{ "--points-share": `${(row.points / maxPoints) * 100}%` }}>
              <th>{index + 1}</th>
              <td>
                <span style={{ "--team-color": row.color || "#d6a945" }} />
                <span className="ocr-standings-driver">
                  {row.helmetColor && <HelmetIcon color={row.helmetColor} size={20} />}
                  {row.name}
                </span>
                {row.team && <small>{row.team}</small>}
              </td>
              <td className="ocr-points-cell">
                <span aria-hidden="true" />
                <b>{row.points}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

const SeasonIntro = ({ championship, onStart }) => (
  <section className="ocr-season-intro">
    <div className="ocr-season-intro-head">
      <span>{strings.season}</span>
      <h2>{championship.seasonYear}</h2>
    </div>
    <p className="ocr-season-intro-text">{championship.intro}</p>
    <div className="ocr-season-intro-meta">
      <div>
        <span>{strings.teamsCounter}</span>
        <b>{championship.grid.length}</b>
      </div>
      <div>
        <span>{strings.driversCounter}</span>
        <b>{championship.grid.reduce((acc, team) => acc + (team.drivers?.length || 0), 0)}</b>
      </div>
      <div>
        <span>{strings.racesCounter}</span>
        <b>{championship.races.length}</b>
      </div>
    </div>
    <button
      type="button"
      className="ocr-btn ocr-btn-primary ocr-roll-button ocr-season-intro-btn"
      onClick={onStart}
    >
      <FlagFill size={22} />
      {strings.startFirstRace}
    </button>
  </section>
);

const RaceSimulating = ({ race, durationMs, onComplete }) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    const id = window.setTimeout(() => onCompleteRef.current(), durationMs);
    return () => window.clearTimeout(id);
  }, [durationMs, race.round]);
  return (
    <section className="ocr-race-simulating">
      <div className="ocr-race-sim-head">
        <span>{strings.round(race.round)}</span>
        <h2>{race.name}</h2>
        {race.conditions?.weather && <small>{race.conditions.weather}</small>}
      </div>
      <div className="ocr-sim-bar" style={{ "--sim-duration": `${durationMs}ms` }}>
        <div className="ocr-sim-bar-fill" />
        <b>{strings.simulating}</b>
      </div>
    </section>
  );
};

const RaceResultStage = ({ race, isLast, onNext }) => (
  <section className="ocr-race-result" style={{ "--winner-color": race.winner.color }}>
    <header className="ocr-race-result-head">
      <span>{strings.round(race.round)}</span>
      <h2>{race.name}</h2>
      <em>{race.narrative.tag}</em>
    </header>
    <p className="ocr-race-result-text">{race.narrative.text}</p>
    <em className="ocr-race-result-decisive">{race.decisiveMoment}</em>

    <div className="ocr-race-winner-card">
      {race.winner.helmetColor && (
        <HelmetIcon color={race.winner.helmetColor} size={56} />
      )}
      <div>
        <span>{strings.winnerLabel}</span>
        <h3>{race.winner.driver}</h3>
        <small>{race.winner.team} · {race.winner.strategy}</small>
      </div>
    </div>

    <div className="ocr-top10-head">
      <span>{strings.top10}</span>
      <b>{strings.points}</b>
    </div>
    <ol className="ocr-top10-list">
      {race.top10.map((row) => (
        <li
          key={`${row.position}-${row.driver}`}
          style={{ "--row-color": row.color || "#d6a945" }}
          className={row.status === "DNF" ? "is-dnf" : undefined}
        >
          <b>{row.position}</b>
          <span className="ocr-top10-color" aria-hidden="true" />
          {row.helmetColor ? (
            <HelmetIcon color={row.helmetColor} size={26} />
          ) : (
            <span className="ocr-top10-helmet-placeholder" aria-hidden="true" />
          )}
          <div>
            <strong>{row.driver}</strong>
            <small>{row.team}</small>
          </div>
          <em>{row.points}</em>
        </li>
      ))}
    </ol>

    <button
      type="button"
      className="ocr-btn ocr-btn-primary ocr-roll-button"
      onClick={onNext}
    >
      <FlagFill size={22} />
      {isLast ? strings.viewFinalStandings : strings.nextRace}
    </button>
  </section>
);

const StandingsTransition = ({ race, isLast, onContinue }) => (
  <section className="ocr-standings-transition">
    <header className="ocr-standings-transition-head">
      <span>{strings.mundialAfter(race.round)}</span>
      <h2>{race.name}</h2>
    </header>
    <div className="ocr-standings-transition-grid">
      <div className="ocr-standings-card ocr-standings-card--drivers">
        <h3>{strings.standingsDrivers}</h3>
        <ol>
          {race.driverStandingsSnapshot.map((row, index) => (
            <li
              key={row.id || row.name}
              style={{ "--row-color": row.color || "#d6a945" }}
            >
              <b>{index + 1}</b>
              <span className="ocr-standings-color" aria-hidden="true" />
              {row.helmetColor && <HelmetIcon color={row.helmetColor} size={22} />}
              <div>
                <strong>{row.name}</strong>
                <small>{row.team}</small>
              </div>
              <em>{row.points}</em>
            </li>
          ))}
        </ol>
      </div>
      <div className="ocr-standings-card">
        <h3>{strings.constructors}</h3>
        <ol>
          {race.constructorStandingsSnapshot.map((row, index) => (
            <li
              key={row.id || row.name}
              style={{ "--row-color": row.color || "#d6a945" }}
            >
              <b>{index + 1}</b>
              <span className="ocr-standings-color" aria-hidden="true" />
              <div>
                <strong>{row.name}</strong>
              </div>
              <em>{row.points}</em>
            </li>
          ))}
        </ol>
      </div>
    </div>
    <button
      type="button"
      className="ocr-btn ocr-btn-primary ocr-roll-button"
      onClick={onContinue}
    >
      <FlagFill size={22} />
      {isLast ? strings.viewChampion : strings.continueNextRace}
    </button>
  </section>
);

const SeasonComplete = ({ championship }) => (
  <section className="ocr-season-complete">
    <div className="ocr-season-seal">
      <div>
        <span>{strings.season}</span>
        <b>{championship.seasonYear}</b>
      </div>
      <div>
        <span>{strings.champion}</span>
        <b>{championship.champion.name}</b>
      </div>
      <div>
        <span>{strings.constructors}</span>
        <b>{championship.constructorsChampion.name}</b>
      </div>
    </div>
    <div className="ocr-season-stats">
      <div>
        <span>{strings.rounds}</span>
        <b>{championship.races.length}</b>
      </div>
      <div>
        <span>{strings.winners}</span>
        <b>{championship.stats.uniqueWinners}</b>
      </div>
      <div>
        <span>{strings.surprises}</span>
        <b>{championship.stats.comebackWins}</b>
      </div>
      <div>
        <span>{strings.dnf}</span>
        <b>{championship.stats.totalDnfs}</b>
      </div>
    </div>
  </section>
);

const SeasonSchedule = ({ races, currentRaceIndex, seasonStage }) => (
  <section className="ocr-schedule">
    <div className="ocr-list-head">
      <span>{strings.scheduleTitle}</span>
      <b>{races.length}</b>
    </div>
    <ol className="ocr-schedule-list">
      {races.map((race, index) => {
        const completed =
          index < currentRaceIndex ||
          (index === currentRaceIndex &&
            (seasonStage === "standings" || seasonStage === "complete"));
        const active = index === currentRaceIndex && !completed;
        const className = completed ? "is-done" : active ? "is-active" : "is-pending";
        return (
          <li
            key={`${race.round}-${race.name}`}
            className={`ocr-schedule-item ${className}`}
            style={completed && race.winner ? { "--row-color": race.winner.color } : undefined}
          >
            <b>{`R${race.round}`}</b>
            <div>
              <strong>{race.name}</strong>
              {completed && race.winner && <small>{race.winner.driver}</small>}
            </div>
          </li>
        );
      })}
    </ol>
  </section>
);

const createEmptyDrivers = () => Array(TARGET_DRIVERS).fill(null);

const OvercutRacing = () => {
  const [bootstrap, setBootstrap] = useState(() => prepareBootstrap(fallbackBootstrap, true));
  const [phase, setPhase] = useState("intro");
  const [teams, setTeams] = useState([]);
  const [drivers, setDrivers] = useState(createEmptyDrivers);
  const [lastRoll, setLastRoll] = useState(null);
  const [pendingDriverRoll, setPendingDriverRoll] = useState(null);
  const [pendingDriverAssignment, setPendingDriverAssignment] = useState(null);
  const [championship, setChampionship] = useState(null);
  const [seasonStage, setSeasonStage] = useState("intro");
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [calendarSource, setCalendarSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);

  const assignedDrivers = useMemo(() => drivers.filter(Boolean), [drivers]);
  const assignedCount = assignedDrivers.length;
  const layoutRef = useRef(null);

  useEffect(() => {
    fetchBootstrap().then(setBootstrap);
  }, []);

  useEffect(() => {
    if (phase !== "season") return;
    if (seasonStage === "intro") return;
    const node = layoutRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, seasonStage, currentRaceIndex]);

  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        mode: "OverCutDraft",
        phase,
        teams: teams.length,
        drivers: assignedCount,
        pendingDriverChoice: pendingDriverRoll
          ? {
              decade: pendingDriverRoll.decade,
              candidates: pendingDriverRoll.candidates.length,
            }
          : null,
        pendingDriverAssignment: pendingDriverAssignment
          ? { name: pendingDriverAssignment.name, rating: pendingDriverAssignment.rating }
          : null,
        lastRoll: lastRoll
          ? {
              type: lastRoll.type,
              decade: lastRoll.decade,
              name: lastRoll.entity?.name,
            }
          : null,
        season: championship?.seasonYear,
        seasonStage,
        currentRound: championship?.races?.[currentRaceIndex]?.round,
        currentRace: championship?.races?.[currentRaceIndex]?.name,
        champion: championship?.champion?.name,
        constructorsChampion: championship?.constructorsChampion?.name,
        calendarSource,
        dataSource: bootstrap.dataSource,
        dataCoverageYear: bootstrap.dataCoverageYear,
        playableSeasonYears: bootstrap.seasonYears.length,
        races: championship?.races?.length,
      });
    window.advanceTime = () => undefined;
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    phase,
    teams.length,
    assignedCount,
    pendingDriverRoll,
    pendingDriverAssignment,
    lastRoll,
    championship,
    seasonStage,
    currentRaceIndex,
    calendarSource,
    bootstrap,
  ]);

  const start = () => {
    setTeams([]);
    setDrivers(createEmptyDrivers());
    setLastRoll(null);
    setPendingDriverRoll(null);
    setPendingDriverAssignment(null);
    setChampionship(null);
    setSeasonStage("intro");
    setCurrentRaceIndex(0);
    setCalendarSource("");
    setRolling(false);
    setPhase("teams");
  };

  const roll = () => {
    if (rolling || pendingDriverAssignment) {
      return;
    }
    const type = phase === "teams" ? "teams" : "drivers";
    const selected = type === "teams" ? teams : assignedDrivers;
    const source = type === "teams" ? bootstrap.teamsByDecade : bootstrap.driversByDecade;
    const availableDecades = getAvailableDecades(bootstrap, type, selected);
    if (!availableDecades.length) {
      return;
    }
    const selectedKeys = new Set(selected.map(getEntityKey));
    const decade = pickRandom(availableDecades);
    const pool = (source[decade.key] || []).filter((item) => !selectedKeys.has(getEntityKey(item)));
    if (!pool.length) {
      return;
    }

    setRolling(true);
    window.setTimeout(() => setRolling(false), 520);

    if (type === "teams") {
      const entity = pickRandom(pool);
      const rollResult = { type, decade: decade.label, entity };
      const nextTeams = [...teams, entity];
      setPendingDriverRoll(null);
      setLastRoll(rollResult);
      setTeams(nextTeams);
      if (nextTeams.length === TARGET_TEAMS) {
        setPhase("drivers");
      }
    } else {
      setLastRoll({ type, decade: decade.label, entity: null });
      const sampled = buildBoundedCandidates(pool, DRIVER_CANDIDATE_MAX_SPREAD, DRIVER_CANDIDATES_PER_ROLL);
      setPendingDriverRoll({
        decade: decade.label,
        decadeKey: decade.key,
        candidates: sampled.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)),
      });
    }
  };

  const pickDriver = (driver) => {
    if (phase !== "drivers" || !pendingDriverRoll || rolling) {
      return;
    }
    setPendingDriverAssignment(driver);
    setLastRoll({ type: "drivers", decade: pendingDriverRoll.decade, entity: driver });
    setPendingDriverRoll(null);
  };

  const cancelAssignment = () => {
    setPendingDriverAssignment(null);
    setLastRoll(null);
  };

  const autoCompleteDraft = () => {
    if (phase !== "drivers") {
      return;
    }
    const nextDrivers = drivers.slice();
    const usedColors = new Set(
      nextDrivers.filter(Boolean).map((d) => d.helmetColor).filter(Boolean)
    );
    const usedDriverKeys = new Set(
      nextDrivers.filter(Boolean).map((d) => getEntityKey(d))
    );
    const emptyIndices = [];
    for (let i = 0; i < TARGET_DRIVERS; i += 1) {
      if (!nextDrivers[i]) emptyIndices.push(i);
    }
    for (let i = emptyIndices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyIndices[i], emptyIndices[j]] = [emptyIndices[j], emptyIndices[i]];
    }
    for (const slotIndex of emptyIndices) {
      const availableDecades = bootstrap.decades.filter((decade) => {
        const pool = (bootstrap.driversByDecade[decade.key] || []).filter(
          (d) => !usedDriverKeys.has(getEntityKey(d))
        );
        return pool.length > 0;
      });
      if (!availableDecades.length) break;
      const decade = pickRandom(availableDecades);
      const pool = (bootstrap.driversByDecade[decade.key] || []).filter(
        (d) => !usedDriverKeys.has(getEntityKey(d))
      );
      const driver = pickRandom(pool);
      const helmetColor = pickHelmetColor(usedColors);
      nextDrivers[slotIndex] = { ...driver, helmetColor };
      usedDriverKeys.add(getEntityKey(driver));
      usedColors.add(helmetColor);
    }
    setDrivers(nextDrivers);
    setPendingDriverRoll(null);
    setPendingDriverAssignment(null);
    setLastRoll(null);
    if (nextDrivers.filter(Boolean).length === TARGET_DRIVERS) {
      setPhase("ready");
    }
  };

  const assignDriverToSlot = (teamIndex, slotIndex) => {
    if (!pendingDriverAssignment) {
      return;
    }
    if (teamIndex < 0 || teamIndex >= teams.length) {
      return;
    }
    const flatIndex = teamIndex * 2 + slotIndex;
    if (drivers[flatIndex]) {
      return;
    }
    const usedColors = new Set(assignedDrivers.map((driver) => driver.helmetColor).filter(Boolean));
    const helmetColor = pickHelmetColor(usedColors);
    const nextDrivers = drivers.slice();
    nextDrivers[flatIndex] = { ...pendingDriverAssignment, helmetColor };
    setDrivers(nextDrivers);
    setPendingDriverAssignment(null);
    const nextAssigned = nextDrivers.filter(Boolean).length;
    if (nextAssigned === TARGET_DRIVERS) {
      setPhase("ready");
    }
  };

  const race = async () => {
    setLoading(true);
    try {
      const eligibleYears = bootstrap.seasonYears?.length ? bootstrap.seasonYears : getSeasonYearsFromRaces(bootstrap.racesByYear);
      if (!eligibleYears.length) {
        setCalendarSource(strings.calendarUnavailable);
        return;
      }
      const year = pickRandom(eligibleYears);
      const { races, source } = fetchSeasonRaces(year, bootstrap);
      setCalendarSource(source);
      setChampionship(simulateChampionship({ teams, drivers: assignedDrivers, races, seasonYear: year }));
      setSeasonStage("intro");
      setCurrentRaceIndex(0);
      setPhase("season");
    } finally {
      setLoading(false);
    }
  };

  const startFirstRace = () => setSeasonStage("simulating");
  const finishSimulation = () => setSeasonStage("result");
  const showStandingsTransition = () => setSeasonStage("standings");
  const advanceToNextRace = () => {
    if (!championship) return;
    const isLast = currentRaceIndex + 1 >= championship.races.length;
    if (isLast) {
      setSeasonStage("complete");
    } else {
      setCurrentRaceIndex(currentRaceIndex + 1);
      setSeasonStage("simulating");
    }
  };

  const statusTitle =
    phase === "intro"
      ? strings.statusBuild
      : phase === "teams"
      ? strings.statusDraftTeams
      : phase === "drivers"
      ? strings.statusDraftDrivers
      : phase === "ready"
      ? strings.statusGridReady
      : seasonStage === "intro"
      ? strings.statusSeason(championship?.seasonYear || "")
      : seasonStage === "complete"
      ? strings.statusChampion(championship?.champion?.name || "")
      : strings.statusRound(
          championship?.races?.[currentRaceIndex]?.round || "",
          championship?.races?.[currentRaceIndex]?.name || ""
        );

  return (
    <main className="overcut-racing-page">
      <section className="ocr-shell">
        <header className="ocr-header">
          <div className="ocr-header-title">
            <span>{strings.headerKicker}</span>
            <h1>{strings.headerTitle}</h1>
          </div>
          <div className="ocr-header-actions">
            <Link to="/" className="ocr-home-link" aria-label={strings.homeAria}>
              <ArrowLeftShort size={28} />
              <span>{strings.homeLink}</span>
            </Link>
            <button className="ocr-btn ocr-btn-secondary" type="button" onClick={start}>
              <ArrowClockwise size={18} />
              {strings.restart}
            </button>
          </div>
        </header>

        <section className="ocr-hero-strip">
          <div>
            <span>{statusTitle}</span>
            <h2>{phase === "intro" ? strings.introTitle : statusTitle}</h2>
          </div>
          {phase === "intro" && (
            <button className="ocr-btn ocr-btn-primary ocr-start-button" type="button" onClick={start}>
              <LightningChargeFill size={22} />
              {strings.play}
            </button>
          )}
        </section>

        <div className="ocr-layout" ref={layoutRef}>
          <aside className="ocr-left">
            {phase === "season" && championship ? (
              <SeasonSchedule
                races={championship.races}
                currentRaceIndex={currentRaceIndex}
                seasonStage={seasonStage}
              />
            ) : (
              <>
                <RollPanel
                  phase={phase}
                  lastRoll={lastRoll}
                  pendingDriverRoll={pendingDriverRoll}
                  pendingDriverAssignment={pendingDriverAssignment}
                  teamsCount={teams.length}
                  driversCount={assignedCount}
                  onRoll={roll}
                  onPickDriver={pickDriver}
                  onCancelAssignment={cancelAssignment}
                  onAutoComplete={autoCompleteDraft}
                  onRace={race}
                  loading={loading}
                  rolling={rolling}
                />
                <EntityList title={strings.teamsList} items={teams} emptyText={strings.emptyTeams} />
              </>
            )}
          </aside>

          <section className="ocr-center">
            {phase === "season" && championship ? (
              <>
                {seasonStage === "intro" && (
                  <SeasonIntro championship={championship} onStart={startFirstRace} />
                )}
                {seasonStage === "simulating" && (
                  <RaceSimulating
                    race={championship.races[currentRaceIndex]}
                    durationMs={SIMULATION_DURATION_MS}
                    onComplete={finishSimulation}
                  />
                )}
                {seasonStage === "result" && (
                  <RaceResultStage
                    race={championship.races[currentRaceIndex]}
                    isLast={currentRaceIndex === championship.races.length - 1}
                    onNext={showStandingsTransition}
                  />
                )}
                {seasonStage === "standings" && (
                  <StandingsTransition
                    race={championship.races[currentRaceIndex]}
                    isLast={currentRaceIndex === championship.races.length - 1}
                    onContinue={advanceToNextRace}
                  />
                )}
                {seasonStage === "complete" && (
                  <SeasonComplete championship={championship} />
                )}
              </>
            ) : (
              <GridBoard
                teams={teams}
                drivers={drivers}
                lastRoll={lastRoll}
                pendingDriverAssignment={pendingDriverAssignment}
                onAssignSlot={assignDriverToSlot}
              />
            )}
          </section>

          <aside className="ocr-right">
            {phase === "season" && championship ? (
              (() => {
                const races = championship.races;
                const previousRace = currentRaceIndex > 0 ? races[currentRaceIndex - 1] : null;
                const currentRace = races[currentRaceIndex];
                let driverRows = [];
                let constructorRows = [];
                let standingsCaption = "";
                if (seasonStage === "complete") {
                  driverRows = championship.driverStandings;
                  constructorRows = championship.constructorStandings;
                  standingsCaption = strings.finalStandings;
                } else if (seasonStage === "intro") {
                  standingsCaption = strings.noRacesYet;
                } else if (seasonStage === "simulating") {
                  driverRows = previousRace?.driverStandingsSnapshot || [];
                  constructorRows = previousRace?.constructorStandingsSnapshot || [];
                  standingsCaption = previousRace
                    ? strings.afterRound(previousRace.round)
                    : strings.noRacesYet;
                } else if (currentRace) {
                  driverRows = currentRace.driverStandingsSnapshot;
                  constructorRows = currentRace.constructorStandingsSnapshot;
                  standingsCaption = strings.afterRound(currentRace.round);
                }
                return (
                  <>
                    {standingsCaption && (
                      <p className="ocr-standings-caption">{standingsCaption}</p>
                    )}
                    <StandingsTable title={strings.standingsDrivers} rows={driverRows} />
                    <StandingsTable title={strings.constructors} rows={constructorRows} compact />
                  </>
                );
              })()
            ) : (
              <EntityList
                title={strings.pilotsList}
                items={assignedDrivers}
                emptyText={strings.emptyDrivers}
                variant="drivers"
              />
            )}
          </aside>
        </div>
      </section>
    </main>
  );
};

export default OvercutRacing;
