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
  const [recordCategory, setRecordCategory] = useState("champions");

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
  const championsByConstructorVariety = useSelector(statisticsSelectors.getChampionsByConstructorVariety);

  const driverWinsChronologically = useSelector(statisticsSelectors.getDriverWinsChronologically);
  const teamWinsChronologically = useSelector(statisticsSelectors.getTeamWinsChronologically);
  const youngestWinDrivers = useSelector(statisticsSelectors.getYoungestDriversAtFirstWin);
  const oldestWinDrivers = useSelector(statisticsSelectors.getOldestDriversToWin);
  const winsOnBirthday = useSelector(statisticsSelectors.getWinsOnBirthday);
  const longestConsecutiveWinStreaks = useSelector(statisticsSelectors.getLongestConsecutiveWinStreaks);
  const longestSeasonStartWinStreaks = useSelector(statisticsSelectors.getLongestSeasonStartWinStreaks);
  const lastCareerWinPerDriver = useSelector(statisticsSelectors.getLastCareerWinPerDriver);
  const biggestGapBetweenWins = useSelector(statisticsSelectors.getBiggestGapBetweenWins);
  const gapBetweenFirstAndLastWin = useSelector(statisticsSelectors.getGapBetweenFirstAndLastWin);
  const mostWinsInSingleYear = useSelector(statisticsSelectors.getMostWinsInSingleYear);
  const mostYearsWithWins = useSelector(statisticsSelectors.getMostYearsWithWins);
  const mostConsecutiveWinningYears = useSelector(statisticsSelectors.getMostConsecutiveWinningYears);
  const gpCountBeforeFirstWin = useSelector(statisticsSelectors.getGpCountBeforeFirstWin);

  const showTeamSelector = section === "team_rankings";

  useEffect(() => {
    if (section === "team_rankings") {
      dispatch(statisticsActions.fetchConstructors());
    }
  }, [dispatch, section]);

  useEffect(() => {
    if (section === "rankings") {
      switch (mode) {
        case "wins": dispatch(statisticsActions.fetchDriverWins()); break;
        case "podiums": dispatch(statisticsActions.fetchDriverPodiums()); break;
        case "poles": dispatch(statisticsActions.fetchDriverPoles()); break;
        case "grand_chelems": dispatch(statisticsActions.fetchDriverGrandChelems()); break;
        default: break;
      }
    }
  }, [dispatch, section, mode]);

  useEffect(() => {
    if (section !== "team_rankings" || !team) return;

    switch (mode) {
      case "wins_team": dispatch(statisticsActions.fetchDriverWinsByTeam(team)); break;
      case "podiums_team": dispatch(statisticsActions.fetchDriverPodiumsByTeam(team)); break;
      case "poles_team": dispatch(statisticsActions.fetchDriverPolesByTeam(team)); break;
      default: break;
    }
  }, [dispatch, team, section, mode]);

  useEffect(() => {
    if (section === "records") {
      switch (recordMode) {
        case "titles_by_count": dispatch(statisticsActions.fetchChampionsByTitleCount()); break;
        case "titles_chronological": dispatch(statisticsActions.fetchChampionsChronologically()); break;
        case "titles_by_age": dispatch(statisticsActions.fetchChampionsByAge()); break;
        case "titles_consecutive": dispatch(statisticsActions.fetchConsecutiveChampions()); break;
        case "titles_gap": dispatch(statisticsActions.fetchLongestGapBetweenTitles()); break;
        case "titles_gp_before": dispatch(statisticsActions.fetchGpCountBeforeFirstTitle()); break;
        case "titles_by_constructors": dispatch(statisticsActions.fetchChampionsByConstructorVariety()); break;
        case "wins_chronological": dispatch(statisticsActions.fetchDriverWinsChronologically()); break;
        case "wins_team_chronological": dispatch(statisticsActions.fetchTeamWinsChronologically()); break;
        case "wins_youngest": dispatch(statisticsActions.fetchYoungestDriversAtFirstWin()); break;
        case "wins_oldest": dispatch(statisticsActions.fetchOldestDriversToWin()); break;
        case "wins_on_birthday": dispatch(statisticsActions.fetchWinsOnBirthday()); break;
        case "wins_consecutive": dispatch(statisticsActions.fetchLongestConsecutiveWinStreaks()); break;
        case "wins_season_start": dispatch(statisticsActions.fetchLongestSeasonStartWinStreaks()); break;
        case "wins_last": dispatch(statisticsActions.fetchLastCareerWinPerDriver()); break;
        case "wins_biggest_gap": dispatch(statisticsActions.fetchBiggestGapBetweenWins()); break;
        case "wins_first_last_gap": dispatch(statisticsActions.fetchGapBetweenFirstAndLastWin()); break;
        case "wins_in_single_year": dispatch(statisticsActions.fetchMostWinsInSingleYear()); break;
        case "wins_years_with": dispatch(statisticsActions.fetchMostYearsWithWins()); break;
        case "wins_years_consecutive": dispatch(statisticsActions.fetchMostConsecutiveWinningYears()); break;
        case "wins_gp_before": dispatch(statisticsActions.fetchGpCountBeforeFirstWin()); break;
        default: break;
      }
    }
  }, [dispatch, section, recordMode]);

  const data = section === "records"
    ? recordMode === "titles_by_count" ? championsByTitleCount
    : recordMode === "titles_chronological" ? championsChronologically
    : recordMode === "titles_by_age" ? championsByAge
    : recordMode === "titles_consecutive" ? consecutiveTitles
    : recordMode === "titles_gap" ? longestGapBetweenTitles
    : recordMode === "titles_gp_before" ? gpCountBeforeTitle
    : recordMode === "titles_by_constructors" ? championsByConstructorVariety
    : recordMode === "wins_chronological" ? driverWinsChronologically
    : recordMode === "wins_team_chronological" ? teamWinsChronologically
    : recordMode === "wins_youngest" ? youngestWinDrivers
    : recordMode === "wins_oldest" ? oldestWinDrivers
    : recordMode === "wins_on_birthday" ? winsOnBirthday
    : recordMode === "wins_consecutive" ? longestConsecutiveWinStreaks
    : recordMode === "wins_season_start" ? longestSeasonStartWinStreaks
    : recordMode === "wins_last" ? lastCareerWinPerDriver
    : recordMode === "wins_biggest_gap" ? biggestGapBetweenWins
    : recordMode === "wins_first_last_gap" ? gapBetweenFirstAndLastWin
    : recordMode === "wins_in_single_year" ? mostWinsInSingleYear
    : recordMode === "wins_years_with" ? mostYearsWithWins
    : recordMode === "wins_years_consecutive" ? mostConsecutiveWinningYears
    : recordMode === "wins_gp_before" ? gpCountBeforeFirstWin
    : []
    : section === "rankings"
    ? mode === "wins" ? wins
    : mode === "podiums" ? podiums
    : mode === "poles" ? poles
    : grandChelems
    : mode === "wins_team" ? winsByTeam
    : mode === "podiums_team" ? podiumsByTeam
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
        case "titles_by_constructors": return "Constructores distintos";
        case "wins_chronological": return "Año";
        case "wins_team_chronological": return "Año";
        case "wins_youngest": return "Edad";
        case "wins_oldest": return "Edad";
        case "wins_on_birthday": return "Año";
        case "wins_consecutive": return "Victorias consecutivas";
        case "wins_season_start": return "Racha inicial";
        case "wins_last": return "Última victoria";
        case "wins_biggest_gap": return "Días entre victorias";
        case "wins_first_last_gap": return "Años entre primera y última";
        case "wins_in_single_year": return "Victorias en un año";
        case "wins_years_with": return "Años con victorias";
        case "wins_years_consecutive": return "Años consecutivos con victoria";
        case "wins_gp_before": return "GPs antes de la primera victoria";
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
          <select value={recordCategory} onChange={e => {
            const category = e.target.value;
            setRecordCategory(category);
            setRecordMode(category === "champions" ? "titles_by_count" : "wins_chronological");
          }}>
            <option value="champions">🏆 Campeones del Mundo</option>
            <option value="victories">🥇 Victorias</option>
          </select>

          <select value={recordMode} onChange={e => setRecordMode(e.target.value)}>
            {recordCategory === "champions" && (
              <optgroup label="🏆 Campeones del Mundo">
                <option value="titles_by_count">Por número de títulos</option>
                <option value="titles_chronological">Orden cronológico</option>
                <option value="titles_by_age">Por edad</option>
                <option value="titles_consecutive">Títulos consecutivos</option>
                <option value="titles_gap">Mayor intervalo entre títulos</option>
                <option value="titles_gp_before">GPs antes del primer título</option>
                <option value="titles_by_constructors">Por número de constructores</option>
              </optgroup>
            )}
            {recordCategory === "victories" && (
              <optgroup label="🥇 Victorias">
                <option value="wins_chronological">Primera victoria de cada piloto</option>
                <option value="wins_team_chronological">Primera victoria por constructor</option>
                <option value="wins_youngest">Más jóvenes al ganar</option>
                <option value="wins_oldest">Más veteranos al ganar</option>
                <option value="wins_on_birthday">Victorias en cumpleaños</option>
                <option value="wins_consecutive">Racha de victorias consecutivas</option>
                <option value="wins_season_start">Racha al comienzo de temporada</option>
                <option value="wins_last">Última victoria de cada piloto</option>
                <option value="wins_biggest_gap">Mayor intervalo entre victorias</option>
                <option value="wins_first_last_gap">Años entre primera y última victoria</option>
                <option value="wins_in_single_year">Más victorias en un solo año</option>
                <option value="wins_years_with">Años distintos con victoria</option>
                <option value="wins_years_consecutive">Años consecutivos con victoria</option>
                <option value="wins_gp_before">GPs antes de la primera victoria</option>
              </optgroup>
            )}
          </select>
        </div>
      )}

      {section !== "records" && (
        <div className="stat-controls">
          <select value={mode} onChange={(e) => { setMode(e.target.value); setTeam(""); }}>
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
                <option key={c.constructorId} value={c.name}>{c.name}</option>
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
              {recordMode === "titles_by_constructors" && <th>Constructores</th>}
            </tr>
          </thead>
          <tbody>
            {(data || []).map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div className="pilot-cell">
                    {item.flagUrl && <img src={item.flagUrl} className="flag" alt={item.nationality} />}
                    <span className="pilot-name">{item.driverName}</span>
                  </div>
                </td>
                <td>{item.value}</td>
                {recordMode === "titles_by_constructors" && <td>{item.extra || "-"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingsView;
