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
