import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as statisticsActions from "../actions";
import * as statisticsSelectors from "../selectors";
import "./StatisticsTable.css";

const RankingsView = () => {
  const dispatch = useDispatch();

  const [section, setSection] = useState("rankings");
  const [mode, setMode] = useState("wins");
  const [team, setTeam] = useState("");
  const [recordMode, setRecordMode] = useState("titles_by_count");

  const constructors = useSelector(statisticsSelectors.getConstructors);

  const wins = useSelector(statisticsSelectors.getDriverWins);
  const podiums = useSelector(statisticsSelectors.getDriverPodiums);
  const poles = useSelector(statisticsSelectors.getDriverPoles);
  const grandChelems = useSelector(statisticsSelectors.getDriverGrandChelems);

  const winsByTeam = useSelector(statisticsSelectors.getDriverWinsByTeam);
  const podiumsByTeam = useSelector(statisticsSelectors.getDriverPodiumsByTeam);
  const polesByTeam = useSelector(statisticsSelectors.getDriverPolesByTeam);

  const championsByTitleCount = useSelector(statisticsSelectors.getChampionsByTitleCount);
  const championsChronologically = useSelector(statisticsSelectors.getChampionsChronologically);
  const championsByAge = useSelector(statisticsSelectors.getChampionsByAge);
  const consecutiveTitles = useSelector(statisticsSelectors.getConsecutiveTitles);
  const longestGapBetweenTitles = useSelector(statisticsSelectors.getLongestGapBetweenTitles);
  const gpCountBeforeTitle = useSelector(statisticsSelectors.getGpCountBeforeTitle);

  const showTeamSelector = section === "team_rankings";

  useEffect(() => {
    if (section === "team_rankings") {
      dispatch(statisticsActions.fetchConstructors());
    }
  }, [dispatch, section]);

  useEffect(() => {
    if (section === "rankings") {
      switch (mode) {
        case "wins":
          dispatch(statisticsActions.fetchDriverWins());
          break;
        case "podiums":
          dispatch(statisticsActions.fetchDriverPodiums());
          break;
        case "poles":
          dispatch(statisticsActions.fetchDriverPoles());
          break;
        case "grand_chelems":
          dispatch(statisticsActions.fetchDriverGrandChelems());
          break;
        default:
          break;
      }
    }
  }, [dispatch, section, mode]);

  useEffect(() => {
    if (section !== "team_rankings" || !team) return;

    switch (mode) {
      case "wins_team":
        dispatch(statisticsActions.fetchDriverWinsByTeam(team));
        break;
      case "podiums_team":
        dispatch(statisticsActions.fetchDriverPodiumsByTeam(team));
        break;
      case "poles_team":
        dispatch(statisticsActions.fetchDriverPolesByTeam(team));
        break;
      default:
        break;
    }
  }, [dispatch, team, section, mode]);

  useEffect(() => {
    if (section === "records") {
      switch (recordMode) {
        case "titles_by_count":
          dispatch(statisticsActions.fetchChampionsByTitleCount());
          break;
        case "titles_chronological":
          dispatch(statisticsActions.fetchChampionsChronologically());
          break;
        case "titles_by_age":
          dispatch(statisticsActions.fetchChampionsByAge());
          break;
        case "titles_consecutive":
          dispatch(statisticsActions.fetchConsecutiveChampions());
          break;
        case "titles_gap":
          dispatch(statisticsActions.fetchLongestGapBetweenTitles());
          break;
        case "titles_gp_before":
          dispatch(statisticsActions.fetchGpCountBeforeFirstTitle());
          break;
        default:
          break;
      }
    }
  }, [dispatch, section, recordMode]);

  const data =
    section === "records"
      ? recordMode === "titles_by_count"
        ? championsByTitleCount
        : recordMode === "titles_chronological"
        ? championsChronologically
        : recordMode === "titles_by_age"
        ? championsByAge
        : recordMode === "titles_consecutive"
        ? consecutiveTitles
        : recordMode === "titles_gap"
        ? longestGapBetweenTitles
        : recordMode === "titles_gp_before"
        ? gpCountBeforeTitle
        : []
      : section === "rankings"
      ? mode === "wins"
        ? wins
        : mode === "podiums"
        ? podiums
        : mode === "poles"
        ? poles
        : grandChelems
      : mode === "wins_team"
      ? winsByTeam
      : mode === "podiums_team"
      ? podiumsByTeam
      : polesByTeam;

  const getLabel = () => {
    if (section === "records") {
      switch (recordMode) {
        case "titles_by_count": return "Títulos";
        case "titles_chronological": return "Año";
        case "titles_by_age": return "Edad";
        case "titles_consecutive": return "Títulos consecutivos";
        case "titles_gap": return "Años de diferencia";
        case "titles_gp_before": return "GPs antes del título";
        default: return "Valor";
      }
    }
    if (mode.includes("wins")) return "Victorias";
    if (mode.includes("podiums")) return "Podios";
    if (mode.includes("poles")) return "Poles";
    if (mode.includes("grand_chelems")) return "Grand Chelems";
    return "Valor";
  };

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">📈 Rankings y Récords</h2>

      <div className="tab-selector">
        <button onClick={() => setSection("rankings")} className={section === "rankings" ? "active" : ""}>Rankings</button>
        <button onClick={() => setSection("team_rankings")} className={section === "team_rankings" ? "active" : ""}>Rankings por Equipo</button>
        <button onClick={() => setSection("records")} className={section === "records" ? "active" : ""}>Récords</button>
      </div>

      {section === "records" && (
        <div className="stat-controls">
          <select value={recordMode} onChange={e => setRecordMode(e.target.value)}>
            <optgroup label="🏆 Campeones del Mundo">
              <option value="titles_by_count">Por número de títulos</option>
              <option value="titles_chronological">Orden cronológico</option>
              <option value="titles_by_age">Por edad</option>
              <option value="titles_consecutive">Títulos consecutivos</option>
              <option value="titles_gap">Mayor intervalo entre títulos</option>
              <option value="titles_gp_before">GPs antes del primer título</option>
            </optgroup>
          </select>
        </div>
      )}

      {section !== "records" && (
        <div className="stat-controls">
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setTeam("");
            }}
          >
            {section === "rankings" && (
              <>
                <option value="wins">Pilotos con más Victorias</option>
                <option value="podiums">Pilotos con más Podios</option>
                <option value="poles">Pilotos con más Poles (desde 2003)</option>
                <option value="grand_chelems">Pilotos con más Grand Chelems</option>
              </>
            )}
            {section === "team_rankings" && (
              <>
                <option value="wins_team">Victorias por Equipo</option>
                <option value="podiums_team">Podios por Equipo</option>
                <option value="poles_team">Poles por Equipo (desde 2003)</option>
              </>
            )}
          </select>

          {showTeamSelector && (
            <select value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Selecciona equipo</option>
              {constructors.map((c) => (
                <option key={c.constructorId} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="table-container">
        <table className="result-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Piloto</th>
              <th>{getLabel()}</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div className="pilot-cell">
                    {item.flagUrl && (
                      <img
                        src={item.flagUrl}
                        className="flag"
                        alt={item.nationality}
                      />
                    )}
                    <span className="pilot-name">{item.driverName}</span>
                  </div>
                </td>
                <td>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingsView;
