import { combineReducers } from "redux";
import * as actionTypes from "./actionTypes";

const gameId = (state = null, action) =>
    action.type === actionTypes.CREATE_GRID_GAME_COMPLETED ? action.gameId : state;

const board = (state = null, action) =>
    action.type === actionTypes.GET_GRID_GAME_BOARD_COMPLETED ? action.board : state;

const validatedSlots = (state = {}, action) => {
    if (action.type === actionTypes.VALIDATE_GRID_SLOT_COMPLETED) {
        return {
            ...state,
            [action.position]: action.pilotName
        };
    }
    return state;
};

const suggestions = (state = [], action) =>
    action.type === actionTypes.AUTOCOMPLETE_PILOTS_COMPLETED ? action.suggestions : state;

export default combineReducers({
    gameId,
    board,
    validatedSlots,
    suggestions
});
