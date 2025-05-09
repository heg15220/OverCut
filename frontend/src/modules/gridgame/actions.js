import backend from "../../backend";
import {appFetch, fetchConfig} from "../../backend/appFetch";
import * as actionTypes from './actionTypes'

export const createGridGame = (onSuccess, onErrors) => dispatch => {
    dispatch({ type: "RESET_GRID_GAME_STATE" }); // 🧹 Limpieza aquí
    backend.gridGameService.createGridGame(game => {
        dispatch({ type: actionTypes.CREATE_GRID_GAME_COMPLETED, gameId: game.id });
        onSuccess(game.id);
    }, onErrors);
};


export const getGridGameBoard = (gameId, onSuccess, onErrors) => dispatch =>
    backend.gridGameService.getGridGame(gameId, board => {
        dispatch({ type: actionTypes.GET_GRID_GAME_BOARD_COMPLETED, board });
        onSuccess(board);
    }, onErrors);

export const validatePilotInGrid = (gameId, pilotName, onSuccess, onErrors) => dispatch =>
    backend.gridGameService.validatePilotInGrid(gameId, pilotName, result => {
        result.validPositions.forEach(pos => {
            dispatch({ type: actionTypes.VALIDATE_GRID_SLOT_COMPLETED, position: pos, pilotName: result.pilotName });
        });
        onSuccess(result);
    }, onErrors);

export const autocompletePilots = (gameId, query, onSuccess, onErrors) => dispatch =>
    backend.gridGameService.autocompletePilots(gameId, query, suggestions => {
        dispatch({ type: actionTypes.AUTOCOMPLETE_PILOTS_COMPLETED, suggestions });
        onSuccess(suggestions);
    }, onErrors);

export const setGridPilotSuggestionsCompleted = (suggestions) => ({
  type: "SET_GRID_PILOT_SUGGESTIONS_COMPLETED",
  suggestions,
});

export const fetchGridPilotSuggestions = (gameId, query, onSuccess, onErrors) => dispatch =>
  backend.gridGameService.autocompletePilots(gameId, query, suggestions => {
    dispatch(setGridPilotSuggestionsCompleted(suggestions));
    onSuccess(suggestions);
  }, onErrors);


