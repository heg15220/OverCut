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

