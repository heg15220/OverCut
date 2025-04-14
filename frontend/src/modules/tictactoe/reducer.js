import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    gameId: null,
    game: null,
    checkDriver: null,
    criteria: null,
};

const gameId = (state = initialState.gameId, action) => {
    if (action.type === actionTypes.CREATE_GAME_COMPLETED) {
        return action.gameId;
    } else {
        return state;
    }
}

const game = (state = initialState.game, action) => {
    if (action.type === actionTypes.GET_GAME_COMPLETED) {
        return action.game;
    } else {
        return state;
    }
}

const checkDriver = (state = initialState.checkDriver, action) => {
    if (action.type === actionTypes.PLAY_MOVE_COMPLETED) {
        return action.checkDriver;
    } else {
        return state;
    }
}

const criteria = (state = initialState.criteria, action) => {
    if (action.type === actionTypes.GET_CRITERIA_COMPLETED) {
        return action.criteria;
    } else {
        return state;
    }
}

const reducer = combineReducers({
    gameId,
    game,
    checkDriver,
    criteria,
});
export default reducer;