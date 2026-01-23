import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const startDriverSeasonGame = (lang, onSuccess, onErrors) => (dispatch) =>
  backend.driverSeasonService.startGame(lang, (game) => {
    dispatch({ type: actionTypes.DRIVER_SEASON_START_COMPLETED, game });
    onSuccess && onSuccess(game);
  }, onErrors);

export const getDriverSeasonGame = (gameId, onSuccess, onErrors) => (dispatch) =>
  backend.driverSeasonService.getGame(gameId, (game) => {
    dispatch({ type: actionTypes.DRIVER_SEASON_GET_COMPLETED, game });
    onSuccess && onSuccess(game);
  }, onErrors);

export const validateDriverSeasonGuess =
  (gameId, raceId, guessPosition, onSuccess, onErrors) => (dispatch) =>
    backend.driverSeasonService.validateGuess(
      { gameId, raceId, guessPosition },
      (res) => {
        dispatch({
          type: actionTypes.DRIVER_SEASON_VALIDATE_COMPLETED,
          gameId,
          raceId,
          guessPosition,
          res
        });
        onSuccess && onSuccess(res);
      },
      onErrors
    );

export const revealDriverSeasonGame = (gameId, onSuccess, onErrors) => (dispatch) =>
  backend.driverSeasonService.reveal(gameId, (game) => {
    dispatch({ type: actionTypes.DRIVER_SEASON_REVEAL_COMPLETED, game });
    onSuccess && onSuccess(game);
  }, onErrors);

export const clearDriverSeason = () => ({ type: actionTypes.DRIVER_SEASON_CLEAR });
