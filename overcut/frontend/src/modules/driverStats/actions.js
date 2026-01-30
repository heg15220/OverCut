import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const startDriverStatsGame = () => (dispatch) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  backend.driverStatsService.startGame(
    lang,
    (game) => dispatch({ type: actionTypes.START_DRIVER_STATS_GAME_COMPLETED, game })
  );
};

export const submitDriverStats = (request) => (dispatch) =>
  backend.driverStatsService.submit(
    request,
    (game) => dispatch({ type: actionTypes.SUBMIT_DRIVER_STATS_GAME_COMPLETED, game })
  );
