import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const createTop10Game = (lang, onSuccess, onErrors) => dispatch => {
  dispatch({ type: "RESET_TOP10_STATE" });
  backend.top10Service.createGame(lang, game => {
    dispatch({ type: actionTypes.CREATE_TOP10_GAME_COMPLETED, gameId: game.id });
    onSuccess(game.id);
  }, onErrors);
};


export const getTop10Board = (gameId, onSuccess, onErrors) => dispatch => {
    backend.top10Service.getGameBoard(gameId, board => {
        dispatch({ type: actionTypes.GET_TOP10_BOARD_COMPLETED, board });
        onSuccess(board);
    }, onErrors);
};

export const validatePilot = (gameId, pilotName, onSuccess, onErrors) => dispatch => {
    backend.top10Service.validatePilot(gameId, pilotName, result => {
      const { validPositions, pilotName, nationalityCode } = result; // ✅

      validPositions.forEach(pos => {
        dispatch({
          type: actionTypes.VALIDATE_TOP10_SLOT_COMPLETED,
          position: pos,
          pilotName,
          nationalityCode // ✅ ya está definida
        });
      });

      onSuccess(result);
    }, onErrors);

};

export const fetchPilotSuggestions = (gameId, query, onSuccess, onErrors) => dispatch => {
    backend.top10Service.autocomplete(gameId, query, suggestions => {
        dispatch({ type: actionTypes.AUTOCOMPLETE_TOP10_PILOTS_COMPLETED, suggestions });
        onSuccess(suggestions);
    }, onErrors);
};

export const revealAllAnswers = (gameId, onSuccess, onErrors) => dispatch => {
    backend.top10Service.revealAll(gameId, result => {
        dispatch({ type: actionTypes.REVEAL_ALL_TOP10_COMPLETED, slots: result });
        onSuccess?.(result);
    }, onErrors);
};
