import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const startTeamHistoryGame = (lang, onSuccess, onErrors) => (dispatch) =>
  backend.teamHistoryService.startGame(lang, (game) => {
    dispatch({ type: actionTypes.TEAM_HISTORY_START_COMPLETED, game });
    onSuccess && onSuccess(game);
  }, onErrors);

export const fetchTeamHistoryGame = (gameId, onSuccess, onErrors) => (dispatch) =>
  backend.teamHistoryService.getGame(gameId, (game) => {
    dispatch({ type: actionTypes.TEAM_HISTORY_GET_COMPLETED, game });
    onSuccess && onSuccess(game);
  }, onErrors);


export const validateTeamHistoryGuess =
  (gameId, seasonYear, guessPosition, onSuccess, onErrors) => (dispatch) =>
    backend.teamHistoryService.validateGuess(
      { gameId, seasonYear, guessPosition },
      (res) => {
        dispatch({
          type: actionTypes.TEAM_HISTORY_VALIDATE_COMPLETED,
          gameId,
          seasonYear,
          guessPosition,
          res
        });
        onSuccess && onSuccess(res);
      },
      onErrors
    );

export const revealTeamHistoryGame = (gameId, onSuccess, onErrors) => (dispatch) =>
  backend.teamHistoryService.reveal(gameId, (game) => {
    dispatch({ type: actionTypes.TEAM_HISTORY_REVEAL_COMPLETED, game });
    onSuccess && onSuccess(game);
  }, onErrors);

export const clearTeamHistory = () => ({ type: actionTypes.TEAM_HISTORY_CLEAR });
