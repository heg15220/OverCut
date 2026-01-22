import backend from "../../backend";
import * as actionTypes from "./actionTypes";
import { getUser } from "../users/selectors";

export const createTop10QualiGame = (lang, onSuccess, onErrors) => (dispatch, getState) => {
  const user = getUser(getState());

  dispatch({ type: actionTypes.RESET_TOP10QUALI_STATE });

  backend.top10QualiService.createGame(user.id, lang, game => {
    dispatch({ type: actionTypes.CREATE_TOP10QUALI_GAME_COMPLETED, gameId: game.id });
    onSuccess(game.id);
  }, onErrors);
};

export const getTop10QualiBoard = (gameId, onSuccess, onErrors) => dispatch => {
  backend.top10QualiService.getGameBoard(gameId, board => {
    dispatch({ type: actionTypes.GET_TOP10QUALI_BOARD_COMPLETED, board });
    onSuccess(board);
  }, onErrors);
};

export const validatePilot = (gameId, pilotName, onSuccess, onErrors) => dispatch => {
  backend.top10QualiService.validatePilot(gameId, pilotName, result => {
    const { validPositions, pilotName: returnedName, nationalityCode } = result;

    validPositions.forEach(pos => {
      dispatch({
        type: actionTypes.VALIDATE_TOP10QUALI_SLOT_COMPLETED,
        position: pos,
        pilotName: returnedName,
        nationalityCode
      });
    });

    onSuccess(result);
  }, onErrors);
};

export const fetchPilotSuggestions = (gameId, query, onSuccess, onErrors) => dispatch => {
  backend.top10QualiService.autocomplete(gameId, query, suggestions => {
    dispatch({ type: actionTypes.AUTOCOMPLETE_TOP10QUALI_PILOTS_COMPLETED, suggestions });
    onSuccess(suggestions);
  }, onErrors);
};

export const revealAllAnswers = (gameId, onSuccess, onErrors) => dispatch => {
  backend.top10QualiService.revealAll(gameId, result => {
    dispatch({ type: actionTypes.REVEAL_ALL_TOP10QUALI_COMPLETED, slots: result });
    onSuccess?.(result);
  }, onErrors);
};
