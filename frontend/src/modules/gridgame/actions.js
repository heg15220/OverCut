import backend from "../../backend";
import {appFetch, fetchConfig} from "../../backend/appFetch";
import * as actionTypes from './actionTypes'

export const createGridGame = (onSuccess, onErrors) => dispatch =>
    backend.gridGameService.createGridGame(game => {
        dispatch({ type: actionTypes.CREATE_GRID_GAME_COMPLETED, gameId: game.id });
        onSuccess(game.id);
    }, onErrors);

export const getGridGameBoard = (gameId, onSuccess, onErrors) => dispatch =>
    backend.gridGameService.getGridGame(gameId, board => {
        dispatch({ type: actionTypes.GET_GRID_GAME_BOARD_COMPLETED, board });
        onSuccess(board);
    }, onErrors);

export const validateGridSlot = (gameId, position, pilotName, onSuccess, onErrors) => dispatch =>
    backend.gridGameService.validateGridSlot(gameId, position, pilotName, result => {
        dispatch({ type: actionTypes.VALIDATE_GRID_SLOT_COMPLETED, position, pilotName: result.pilotName });
        onSuccess(result);
    }, onErrors);

export const autocompletePilots = (gameId, query, onSuccess, onErrors) => dispatch =>
    backend.gridGameService.autocompletePilots(gameId, query, suggestions => {
        dispatch({ type: actionTypes.AUTOCOMPLETE_PILOTS_COMPLETED, suggestions });
        onSuccess(suggestions);
    }, onErrors);
