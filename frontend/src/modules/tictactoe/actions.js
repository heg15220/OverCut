import backend from "../../backend";
import {appFetch, fetchConfig} from "../../backend/appFetch";
import * as actionTypes from './actionTypes';


const createGameCompleted = (gameId) => ({
    type: actionTypes.CREATE_GAME_COMPLETED,
    gameId
});

const getGameCompleted = (game) => ({
    type: actionTypes.GET_GAME_COMPLETED,
    game
});

const playMoveCompleted = (checkDriver) => ({
    type: actionTypes.PLAY_MOVE_COMPLETED,
    checkDriver
});

const getCriteriaCompleted = (criteria) => ({
    type: actionTypes.GET_CRITERIA_COMPLETED,
    criteria
});

export const setPilotSuggestionsCompleted = (suggestions) => ({
  type: actionTypes.SET_PILOT_SUGGESTIONS_COMPLETED,
  suggestions
});






export const createGame = (request, onSuccess, onErrors ) => dispatch =>
    backend.tiktakService.createGame(request, gameId => {
            dispatch(createGameCompleted(gameId));
            onSuccess(gameId);
        },
        onErrors);

export const getGame = (id, onSuccess, onErrors ) => dispatch =>
    backend.tiktakService.getGame(id, game => {
            dispatch(getGameCompleted(game));
            onSuccess(game);
        },
        onErrors);

export const playMove = (id, request, onSuccess, onErrors ) => dispatch =>
    backend.tiktakService.playMove(id, request, checkDriver => {
            dispatch(playMoveCompleted(checkDriver));
            onSuccess(checkDriver);
        },
        onErrors);

export const getCriteria = (onSuccess, onErrors ) => dispatch =>
    backend.tiktakService.getCriteria(criteria => {
            dispatch(getCriteriaCompleted(criteria));
            onSuccess(criteria);
        },
        onErrors);


export const fetchPilotSuggestions = (name, onSuccess, onErrors) => dispatch =>
  backend.pilotService.autocomplete(name, suggestions => {
        dispatch(setPilotSuggestionsCompleted(suggestions));
        onSuccess(suggestions);
  },
    onErrors);

export const skipTurn = (id, onSuccess, onErrors) => dispatch =>
  backend.tiktakService.skipTurn(id,
    () => {
      dispatch(getGame(id, onSuccess, onErrors));
    },
    onErrors
  );

