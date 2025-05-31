import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const fetchDriverStandings = (year) => dispatch =>
  backend.statisticsService.getDriverStandings(
    year,
    standings => dispatch({ type: actionTypes.FETCH_DRIVER_STANDINGS_COMPLETED, standings }),
    () => {}
  );

export const fetchConstructorStandings = (year) => dispatch =>
  backend.statisticsService.getConstructorStandings(
    year,
    standings => dispatch({ type: actionTypes.FETCH_CONSTRUCTOR_STANDINGS_COMPLETED, standings }),
    () => {}
  );

export const fetchDriverWins = () => dispatch =>
  backend.statisticsService.getDriverWinRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_WINS_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverPodiums = () => dispatch =>
  backend.statisticsService.getDriverPodiumRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_PODIUMS_COMPLETED, ranking }),
    () => {}
  );


export const fetchDriverPoles = () => dispatch =>
  backend.statisticsService.getDriverPoleRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_POLES_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverGrandChelems = () => dispatch =>
  backend.statisticsService.getDriverGrandChelemRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_GRAND_CHELEMS_COMPLETED, ranking }),
    () => {}
  );


export const fetchDriverWinsByTeam = (team) => dispatch =>
  backend.statisticsService.getDriverWinsByTeam(
    team,
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_WINS_BY_TEAM_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverPodiumsByTeam = (team) => dispatch =>
  backend.statisticsService.getDriverPodiumsByTeam(
    team,
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_PODIUMS_BY_TEAM_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverPolesByTeam = (team) => dispatch =>
  backend.statisticsService.getDriverPolesByTeam(
    team,
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_POLES_BY_TEAM_COMPLETED, ranking }),
    () => {}
  );


export const fetchConstructors = () => dispatch =>
  backend.statisticsService.getAllConstructorOptions(
    list => dispatch({ type: actionTypes.FETCH_CONSTRUCTORS_COMPLETED, list }),
    () => {}
  );

export const fetchChampionsByTitleCount = () => dispatch =>
  backend.statisticsService.getChampionsByTitleCount(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_BY_TITLE_COUNT_COMPLETED, data }),
    () => {}
  );

export const fetchChampionsChronologically = () => dispatch =>
  backend.statisticsService.getChampionsChronologically(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_CHRONOLOGICALLY_COMPLETED, data }),
    () => {}
  );

export const fetchChampionsByAge = () => dispatch =>
  backend.statisticsService.getChampionsByAge(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_BY_AGE_COMPLETED, data }),
    () => {}
  );

export const fetchConsecutiveChampions = () => dispatch =>
  backend.statisticsService.getConsecutiveChampions(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_TITLES_COMPLETED, data }),
    () => {}
  );

export const fetchLongestGapBetweenTitles = () => dispatch =>
  backend.statisticsService.getLongestGapBetweenTitles(
    data => dispatch({ type: actionTypes.FETCH_LONGEST_GAP_TITLES_COMPLETED, data }),
    () => {}
  );

export const fetchGpCountBeforeFirstTitle = () => dispatch =>
  backend.statisticsService.getGpCountBeforeFirstTitle(
    data => dispatch({ type: actionTypes.FETCH_GP_COUNT_BEFORE_TITLE_COMPLETED, data }),
    () => {}
  );

export const fetchChampionsByConstructorVariety = () => dispatch =>
  backend.statisticsService.getChampionsByConstructorVariety(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_BY_CONSTRUCTOR_VARIETY_COMPLETED, data }),
    () => {}
  );

export const fetchDriverWinsChronologically = () => dispatch =>
  backend.statisticsService.getDriverWinsChronologically(
    data => dispatch({ type: actionTypes.FETCH_DRIVER_WINS_CHRONOLOGICALLY_COMPLETED, data }),
    () => {}
  );

export const fetchTeamWinsChronologically = () => dispatch =>
  backend.statisticsService.getTeamWinsChronologically(
    data => dispatch({ type: actionTypes.FETCH_TEAM_WINS_CHRONOLOGICALLY_COMPLETED, data }),
    () => {}
  );

export const fetchYoungestDriversAtFirstWin = () => dispatch =>
  backend.statisticsService.getYoungestDriversAtFirstWin(
    data => dispatch({ type: actionTypes.FETCH_YOUNGEST_WINNERS_COMPLETED, data }),
    () => {}
  );

export const fetchOldestDriversToWin = () => dispatch =>
  backend.statisticsService.getOldestDriversToWin(
    data => dispatch({ type: actionTypes.FETCH_OLDEST_WINNERS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsOnBirthday = () => dispatch =>
  backend.statisticsService.getWinsOnBirthday(
    data => dispatch({ type: actionTypes.FETCH_WINS_ON_BIRTHDAY_COMPLETED, data }),
    () => {}
  );

export const fetchLongestConsecutiveWinStreaks = () => dispatch =>
  backend.statisticsService.getLongestConsecutiveWinStreaks(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_WIN_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchLongestSeasonStartWinStreaks = () => dispatch =>
  backend.statisticsService.getLongestSeasonStartWinStreaks(
    data => dispatch({ type: actionTypes.FETCH_SEASON_START_WIN_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchLastCareerWinPerDriver = () => dispatch =>
  backend.statisticsService.getLastCareerWinPerDriver(
    data => dispatch({ type: actionTypes.FETCH_LAST_CAREER_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchBiggestGapBetweenWins = () => dispatch =>
  backend.statisticsService.getBiggestGapBetweenWins(
    data => dispatch({ type: actionTypes.FETCH_GAP_BETWEEN_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchGapBetweenFirstAndLastWin = () => dispatch =>
  backend.statisticsService.getGapBetweenFirstAndLastWin(
    data => dispatch({ type: actionTypes.FETCH_GAP_FIRST_LAST_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchMostWinsInSingleYear = () => dispatch =>
  backend.statisticsService.getMostWinsInSingleYear(
    data => dispatch({ type: actionTypes.FETCH_MOST_WINS_SINGLE_YEAR_COMPLETED, data }),
    () => {}
  );

export const fetchMostYearsWithWins = () => dispatch =>
  backend.statisticsService.getMostYearsWithWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_YEARS_WITH_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchMostConsecutiveWinningYears = () => dispatch =>
  backend.statisticsService.getMostConsecutiveWinningYears(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_WINNING_YEARS_COMPLETED, data }),
    () => {}
  );

export const fetchGpCountBeforeFirstWin = () => dispatch =>
  backend.statisticsService.getGpCountBeforeFirstWin(
    data => dispatch({ type: actionTypes.FETCH_GPS_BEFORE_FIRST_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostWinsSameConstructor = () => dispatch =>
  backend.statisticsService.getDriversWithMostWinsSameConstructor(
    data => dispatch({ type: actionTypes.FETCH_MOST_WINS_SAME_CONSTRUCTOR_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostConstructorsWithWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostConstructorsWithWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_CONSTRUCTORS_WITH_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsByGrandPrix = () => dispatch =>
  backend.statisticsService.getWinsByGrandPrix(
    data => dispatch({ type: actionTypes.FETCH_WINS_BY_GP_COMPLETED, data }),
    () => {}
  );

export const fetchConsecutiveWinsByGrandPrix = () => dispatch =>
  backend.statisticsService.getConsecutiveWinsByGrandPrix(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_WINS_BY_GP_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostDifferentGPsWon = () => dispatch =>
  backend.statisticsService.getDriversWithMostDifferentGPsWon(
    data => dispatch({ type: actionTypes.FETCH_MOST_DIFFERENT_GPS_WON_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostCircuitWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostCircuitWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_CIRCUIT_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostDifferentCircuitWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostDifferentCircuitWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_DIFFERENT_CIRCUIT_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsByStartingGridPosition = () => dispatch =>
  backend.statisticsService.getWinsByStartingGridPosition(
    data => dispatch({ type: actionTypes.FETCH_WINS_BY_GRID_POSITION_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGridPositionsWithWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostGridPositionsWithWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_GRID_POSITIONS_WITH_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithHomeGPWins = () => dispatch =>
  backend.statisticsService.getDriversWithHomeGPWins(
    data => dispatch({ type: actionTypes.FETCH_HOME_GP_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsWithoutLeadingAnyLap = () => dispatch =>
  backend.statisticsService.getWinsWithoutLeadingAnyLap(
    data => dispatch({ type: actionTypes.FETCH_WINS_NO_LAPS_LED_COMPLETED, data }),
    () => {}
  );

export const fetchWinsWithoutPolePosition = () => dispatch =>
  backend.statisticsService.getWinsWithoutPolePosition(
    data => dispatch({ type: actionTypes.FETCH_WINS_WITHOUT_POLE_COMPLETED, data }),
    () => {}
  );

export const fetchWinsWithFastestLap = () => dispatch =>
  backend.statisticsService.getWinsWithFastestLap(
    data => dispatch({ type: actionTypes.FETCH_WINS_WITH_FASTEST_LAP_COMPLETED, data }),
    () => {}
  );

