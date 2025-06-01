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

  const driversWithMostWinsSameConstructor = useSelector(statisticsSelectors.getDriversWithMostWinsSameConstructor);
  const driversWithMostConstructorsWithWins = useSelector(statisticsSelectors.getDriversWithMostConstructorsWithWins);
  const winsByGrandPrix = useSelector(statisticsSelectors.getWinsByGrandPrix);
  const consecutiveWinsByGrandPrix = useSelector(statisticsSelectors.getConsecutiveWinsByGrandPrix);
  const driversWithMostDifferentGPsWon = useSelector(statisticsSelectors.getDriversWithMostDifferentGPsWon);
  const driversWithMostCircuitWins = useSelector(statisticsSelectors.getDriversWithMostCircuitWins);
  const driversWithMostDifferentCircuitWins = useSelector(statisticsSelectors.getDriversWithMostDifferentCircuitWins);
  const winsByStartingGridPosition = useSelector(statisticsSelectors.getWinsByStartingGridPosition);
  const driversWithMostGridPositionsWithWins = useSelector(statisticsSelectors.getDriversWithMostGridPositionsWithWins);
  const driversWithHomeGPWins = useSelector(statisticsSelectors.getDriversWithHomeGPWins);
  const winsWithoutLeadingAnyLap = useSelector(statisticsSelectors.getWinsWithoutLeadingAnyLap);
  const winsWithoutPolePosition = useSelector(statisticsSelectors.getWinsWithoutPolePosition);
  const winsWithFastestLap = useSelector(statisticsSelectors.getWinsWithFastestLap);


const secondPlacePodiums = useSelector(statisticsSelectors.getSecondPlacePodiums);
const thirdPlacePodiums = useSelector(statisticsSelectors.getThirdPlacePodiums);
const secondThirdPlacePodiums = useSelector(statisticsSelectors.getSecondThirdPlacePodiums);
const podiumChronology = useSelector(statisticsSelectors.getPodiumChronology);
const teamPodiumChronology = useSelector(statisticsSelectors.getTeamPodiumChronology);
const youngestPodiumDrivers = useSelector(statisticsSelectors.getYoungestPodiumDrivers);
const podiumsOnBirthday = useSelector(statisticsSelectors.getPodiumsOnBirthday);
const oldestPodiumDriversByNationality = useSelector(statisticsSelectors.getOldestPodiumDriversByNationality);


const longestPodiumStreaks = useSelector(statisticsSelectors.getLongestPodiumStreaks);
const seasonStartPodiumStreaks = useSelector(statisticsSelectors.getSeasonStartPodiumStreaks);
const lastPodiumPerDriver = useSelector(statisticsSelectors.getLastPodiumPerDriver);
const biggestGapBetweenPodiums = useSelector(statisticsSelectors.getBiggestGapBetweenPodiums);
const gapBetweenFirstAndLastPodium = useSelector(statisticsSelectors.getGapBetweenFirstAndLastPodium);
const mostPodiumsInSingleYear = useSelector(statisticsSelectors.getMostPodiumsInSingleYear);
const podiumYearsCount = useSelector(statisticsSelectors.getPodiumYearsCount);
const consecutivePodiumYears = useSelector(statisticsSelectors.getConsecutivePodiumYears);
const gpCountBeforeFirstPodium = useSelector(statisticsSelectors.getGpCountBeforeFirstPodium);
const podiumsBeforeFirstWin = useSelector(statisticsSelectors.getPodiumsBeforeFirstWin);
const podiumsWithSingleConstructor = useSelector(statisticsSelectors.getPodiumsWithSingleConstructor);
const podiumsWithNoWins = useSelector(statisticsSelectors.getPodiumsWithNoWins);
const podiumsWithMostConstructors = useSelector(statisticsSelectors.getPodiumsWithMostConstructors);
const podiumsByGrandPrix = useSelector(statisticsSelectors.getPodiumsByGrandPrix);
const mostDifferentGPsWithPodium = useSelector(statisticsSelectors.getDriversWithMostDifferentGPsWithPodium);
const mostDifferentCircuitsWithPodium = useSelector(statisticsSelectors.getDriversWithMostDifferentCircuitsWithPodium);
const podiumsAtHomeGP = useSelector(statisticsSelectors.getPodiumsAtHomeGP);

const repeatedIdenticalPodiums = useSelector(statisticsSelectors.getRepeatedIdenticalPodiums);
const mostFrequentPodiumTrios = useSelector(statisticsSelectors.getMostFrequentPodiumTrios);
const mostFrequentPodiumPairs = useSelector(statisticsSelectors.getMostFrequentPodiumPairs);
const mostCommonFirstSecondPairs = useSelector(statisticsSelectors.getMostCommonFirstSecondPairs);






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
        case "wins_most_same_constructor": dispatch(statisticsActions.fetchDriversWithMostWinsSameConstructor()); break;
        case "wins_most_constructors": dispatch(statisticsActions.fetchDriversWithMostConstructorsWithWins()); break;
        case "wins_by_gp": dispatch(statisticsActions.fetchWinsByGrandPrix()); break;
        case "wins_consecutive_by_gp": dispatch(statisticsActions.fetchConsecutiveWinsByGrandPrix()); break;
        case "wins_most_different_gps": dispatch(statisticsActions.fetchDriversWithMostDifferentGPsWon()); break;
        case "wins_most_circuit": dispatch(statisticsActions.fetchDriversWithMostCircuitWins()); break;
        case "wins_most_different_circuits": dispatch(statisticsActions.fetchDriversWithMostDifferentCircuitWins()); break;
        case "wins_by_grid_position": dispatch(statisticsActions.fetchWinsByStartingGridPosition()); break;
        case "wins_most_grid_positions": dispatch(statisticsActions.fetchDriversWithMostGridPositionsWithWins()); break;
        case "wins_home_gp": dispatch(statisticsActions.fetchDriversWithHomeGPWins()); break;
        case "wins_no_laps_led": dispatch(statisticsActions.fetchWinsWithoutLeadingAnyLap()); break;
        case "wins_without_pole": dispatch(statisticsActions.fetchWinsWithoutPolePosition()); break;
        case "wins_with_fastest_lap": dispatch(statisticsActions.fetchWinsWithFastestLap()); break;
        case "podiums_second_place": dispatch(statisticsActions.fetchSecondPlacePodiums()); break;
        case "podiums_third_place": dispatch(statisticsActions.fetchThirdPlacePodiums()); break;
        case "podiums_second_and_third": dispatch(statisticsActions.fetchSecondAndThirdPlacePodiums()); break;
        case "podiums_chronology": dispatch(statisticsActions.fetchPodiumChronology()); break;
        case "podiums_team_chronology": dispatch(statisticsActions.fetchTeamPodiumChronology()); break;
        case "podiums_youngest": dispatch(statisticsActions.fetchYoungestPodiumDrivers()); break;
        case "podiums_on_birthday": dispatch(statisticsActions.fetchPodiumsOnBirthday()); break;
        case "podiums_oldest_by_nationality": dispatch(statisticsActions.fetchOldestPodiumDriversByNationality()); break;
        case "podiums_streaks": dispatch(statisticsActions.fetchLongestPodiumStreaks()); break;
        case "podiums_streaks_season": dispatch(statisticsActions.fetchSeasonStartPodiumStreaks()); break;
        case "podiums_last": dispatch(statisticsActions.fetchLastPodiumPerDriver()); break;
        case "podiums_gap": dispatch(statisticsActions.fetchBiggestGapBetweenPodiums()); break;
        case "podiums_gap_first_last": dispatch(statisticsActions.fetchGapBetweenFirstAndLastPodium()); break;
        case "podiums_single_year": dispatch(statisticsActions.fetchMostPodiumsInSingleYear()); break;
        case "podiums_years_count": dispatch(statisticsActions.fetchPodiumYearsCount()); break;
        case "podiums_consecutive_years": dispatch(statisticsActions.fetchConsecutivePodiumYears()); break;
        case "podiums_gp_before": dispatch(statisticsActions.fetchGpCountBeforeFirstPodium()); break;
        case "podiums_before_win": dispatch(statisticsActions.fetchPodiumsBeforeFirstWin()); break;
        case "podiums_single_constructor": dispatch(statisticsActions.fetchPodiumsWithSingleConstructor()); break;
        case "podiums_no_wins": dispatch(statisticsActions.fetchPodiumsWithNoWins()); break;
        case "podiums_most_constructors": dispatch(statisticsActions.fetchPodiumsWithMostConstructors()); break;
        case "podiums_by_gp": dispatch(statisticsActions.fetchPodiumsByGrandPrix()); break;
        case "podiums_most_different_gps": dispatch(statisticsActions.fetchDriversWithMostDifferentGPsWithPodium()); break;
        case "podiums_most_different_circuits": dispatch(statisticsActions.fetchDriversWithMostDifferentCircuitsWithPodium()); break;
        case "podiums_home_gp": dispatch(statisticsActions.fetchPodiumsAtHomeGP()); break;
        case "podiums_identical_repeats":
          dispatch(statisticsActions.fetchRepeatedIdenticalPodiums()); break;
        case "podiums_trios":
          dispatch(statisticsActions.fetchMostFrequentPodiumTrios()); break;
        case "podiums_pairs":
          dispatch(statisticsActions.fetchMostFrequentPodiumPairs()); break;
        case "podiums_first_second":
          dispatch(statisticsActions.fetchMostCommonFirstSecondPairs()); break;



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
    : recordMode === "wins_most_same_constructor" ? driversWithMostWinsSameConstructor
    : recordMode === "wins_most_constructors" ? driversWithMostConstructorsWithWins
    : recordMode === "wins_by_gp" ? winsByGrandPrix
    : recordMode === "wins_consecutive_by_gp" ? consecutiveWinsByGrandPrix
    : recordMode === "wins_most_different_gps" ? driversWithMostDifferentGPsWon
    : recordMode === "wins_most_circuit" ? driversWithMostCircuitWins
    : recordMode === "wins_most_different_circuits" ? driversWithMostDifferentCircuitWins
    : recordMode === "wins_by_grid_position" ? winsByStartingGridPosition
    : recordMode === "wins_most_grid_positions" ? driversWithMostGridPositionsWithWins
    : recordMode === "wins_home_gp" ? driversWithHomeGPWins
    : recordMode === "wins_no_laps_led" ? winsWithoutLeadingAnyLap
    : recordMode === "wins_without_pole" ? winsWithoutPolePosition
    : recordMode === "wins_with_fastest_lap" ? winsWithFastestLap
    : recordMode === "podiums_second_place" ? secondPlacePodiums
    : recordMode === "podiums_third_place" ? thirdPlacePodiums
    : recordMode === "podiums_second_and_third" ? secondThirdPlacePodiums
    : recordMode === "podiums_chronology" ? podiumChronology
    : recordMode === "podiums_team_chronology" ? teamPodiumChronology
    : recordMode === "podiums_youngest" ? youngestPodiumDrivers
    : recordMode === "podiums_on_birthday" ? podiumsOnBirthday
    : recordMode === "podiums_oldest_by_nationality" ? oldestPodiumDriversByNationality
    : recordMode === "podiums_streaks" ? longestPodiumStreaks
    : recordMode === "podiums_streaks_season" ? seasonStartPodiumStreaks
    : recordMode === "podiums_last" ? lastPodiumPerDriver
    : recordMode === "podiums_gap" ? biggestGapBetweenPodiums
    : recordMode === "podiums_gap_first_last" ? gapBetweenFirstAndLastPodium
    : recordMode === "podiums_single_year" ? mostPodiumsInSingleYear
    : recordMode === "podiums_years_count" ? podiumYearsCount
    : recordMode === "podiums_consecutive_years" ? consecutivePodiumYears
    : recordMode === "podiums_gp_before" ? gpCountBeforeFirstPodium
    : recordMode === "podiums_before_win" ? podiumsBeforeFirstWin
    : recordMode === "podiums_single_constructor" ? podiumsWithSingleConstructor
    : recordMode === "podiums_no_wins" ? podiumsWithNoWins
    : recordMode === "podiums_most_constructors" ? podiumsWithMostConstructors
    : recordMode === "podiums_by_gp" ? podiumsByGrandPrix
    : recordMode === "podiums_most_different_gps" ? mostDifferentGPsWithPodium
    : recordMode === "podiums_most_different_circuits" ? mostDifferentCircuitsWithPodium
    : recordMode === "podiums_home_gp" ? podiumsAtHomeGP
    : recordMode === "podiums_identical_repeats" ? repeatedIdenticalPodiums
    : recordMode === "podiums_trios" ? mostFrequentPodiumTrios
    : recordMode === "podiums_pairs" ? mostFrequentPodiumPairs
    : recordMode === "podiums_first_second" ? mostCommonFirstSecondPairs


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
          // Campeonatos
          case "titles_by_count": return "Títulos";
          case "titles_chronological": return "Año";
          case "titles_by_age": return "Edad";
          case "titles_consecutive": return "Títulos consecutivos";
          case "titles_gap": return "Años de diferencia";
          case "titles_gp_before": return "GPs antes del título";
          case "titles_by_constructors": return "Constructores distintos";

          // Victorias
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
          case "wins_most_same_constructor": return "Victorias con mismo constructor";
          case "wins_most_constructors": return "Constructores distintos con victoria";
          case "wins_by_gp": return "Victorias por GP";
          case "wins_consecutive_by_gp": return "Victorias consecutivas en GP";
          case "wins_most_different_gps": return "GPs diferentes ganados";
          case "wins_most_circuit": return "Victorias en mismo circuito";
          case "wins_most_different_circuits": return "Circuitos diferentes ganados";
          case "wins_by_grid_position": return "Posición de salida";
          case "wins_most_grid_positions": return "Posiciones de parrilla con victorias";
          case "wins_home_gp": return "Victorias en GP local";
          case "wins_no_laps_led": return "Victorias sin liderar";
          case "wins_without_pole": return "Victorias sin pole";
          case "wins_with_fastest_lap": return "Victorias con vuelta rápida";

          // Pódiums
          case "podiums_second_place": return "Pódiums en 2ª";
          case "podiums_third_place": return "Pódiums en 3ª";
          case "podiums_second_and_third": return "Pódiums (2ª o 3ª)";
          case "podiums_chronology": return "Año";
          case "podiums_team_chronology": return "Año";
          case "podiums_youngest": return "Edad";
          case "podiums_on_birthday": return "Año";
          case "podiums_oldest_by_nationality": return "Edad";
          case "podiums_streaks": return "Racha de pódiums";
          case "podiums_streaks_season": return "Racha inicial";
          case "podiums_last": return "Último podio";
          case "podiums_gap": return "Días entre pódiums";
          case "podiums_gap_first_last": return "Años entre primero y último";
          case "podiums_single_year": return "Pódiums en un año";
          case "podiums_years_count": return "Años con pódiums";
          case "podiums_consecutive_years": return "Años consecutivos con pódium";
          case "podiums_gp_before": return "GPs antes del primer podio";
          case "podiums_before_win": return "Pódiums antes de la primera victoria";
          case "podiums_single_constructor": return "Con un solo constructor";
          case "podiums_no_wins": return "Pódiums sin victorias";
          case "podiums_most_constructors": return "Constructores con pódiums";
          case "podiums_by_gp": return "Pódiums por GP";
          case "podiums_most_different_gps": return "GPs diferentes con podio";
          case "podiums_most_different_circuits": return "Circuitos diferentes con podio";
          case "podiums_home_gp": return "Pódiums en GP local";
          case "podiums_identical_repeats": return "Veces repetido";
          case "podiums_trios": return "Veces juntos";
          case "podiums_pairs": return "Veces juntos";
          case "podiums_first_second": return "Veces (1º y 2º)";


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
                  let newMode = "titles_by_count";
                  if (category === "victories") newMode = "wins_chronological";
                  else if (category === "podiums") newMode = "podiums_second_place";
                  setRecordMode(newMode);

                }}>
                  <option value="champions">🏆 Campeones del Mundo</option>
                  <option value="victories">🥇 Victorias</option>
                  <option value="podiums">🥈 Pódiums</option>
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
                      <option value="wins_most_same_constructor">Más victorias con mismo constructor</option>
                      <option value="wins_most_constructors">Más constructores distintos con victorias</option>
                      <option value="wins_by_gp">Victorias por Gran Premio</option>
                      <option value="wins_consecutive_by_gp">Victorias consecutivas en un GP</option>
                      <option value="wins_most_different_gps">GPs diferentes ganados</option>
                      <option value="wins_most_circuit">Más victorias en un mismo circuito</option>
                      <option value="wins_most_different_circuits">Circuitos diferentes ganados</option>
                      <option value="wins_by_grid_position">Victorias por posición de salida</option>
                      <option value="wins_most_grid_positions">Parrillas diferentes con victorias</option>
                      <option value="wins_home_gp">Victorias en GP local</option>
                      <option value="wins_no_laps_led">Victorias sin liderar ninguna vuelta</option>
                      <option value="wins_without_pole">Victorias sin pole position</option>
                      <option value="wins_with_fastest_lap">Victorias con vuelta rápida</option>
                    </optgroup>
                  )}

                  {recordCategory === "podiums" && (
                    <optgroup label="🥈 Pódiums">
                      <option value="podiums_second_place">Pódiums en 2ª posición</option>
                      <option value="podiums_third_place">Pódiums en 3ª posición</option>
                      <option value="podiums_second_and_third">Pódiums en 2ª y 3ª posición</option>
                      <option value="podiums_chronology">Primera aparición en el podio</option>
                      <option value="podiums_team_chronology">Primer podio por equipo</option>
                      <option value="podiums_youngest">Pilotos más jóvenes en el podio</option>
                      <option value="podiums_on_birthday">Pódiums en el cumpleaños</option>
                      <option value="podiums_oldest_by_nationality">Mayores en podio por país</option>
                        <option value="podiums_streaks">Racha más larga de pódiums</option>
                        <option value="podiums_streaks_season">Racha inicial de temporada</option>
                        <option value="podiums_last">Último podio</option>
                        <option value="podiums_gap_first_last">Años entre primer y último podio</option>
                        <option value="podiums_single_year">Más podios en un año</option>
                        <option value="podiums_years_count">Años diferentes con podios</option>
                        <option value="podiums_consecutive_years">Años consecutivos con podios</option>
                        <option value="podiums_gp_before">GPs antes del primer podio</option>
                        <option value="podiums_before_win">Pódiums antes de la primera victoria</option>
                        <option value="podiums_single_constructor">Pódiums con un solo constructor</option>
                        <option value="podiums_no_wins">Pódiums sin victorias</option>
                        <option value="podiums_most_constructors">Más constructores con pódiums</option>
                        <option value="podiums_by_gp">Pódiums por GP</option>
                        <option value="podiums_most_different_gps">GPs diferentes con podio</option>
                        <option value="podiums_most_different_circuits">Circuitos diferentes con podio</option>
                        <option value="podiums_home_gp">Pódiums en GP local</option>
                        <option value="podiums_identical_repeats">Pódiums idénticos repetidos</option>
                        <option value="podiums_trios">Tríos más frecuentes en el podio</option>
                        <option value="podiums_pairs">Dúos más frecuentes en el podio</option>
                        <option value="podiums_first_second">Parejas más frecuentes 1º-2º</option>

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
