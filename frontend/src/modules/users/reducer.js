import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    user: null,
    points: null,
};

const user = (state = initialState.user, action) => {

    switch (action.type) {

        case actionTypes.SIGN_UP_COMPLETED:
            return action.authenticatedUser.user;
        case actionTypes.LOGIN_COMPLETED:
            return action.authenticatedUser.user;
        case actionTypes.LOGOUT:
            return initialState.user;
        case actionTypes.UPDATE_PROFILE_COMPLETED:
            return action.user;
        case actionTypes.ADD_IMAGE_COMPLETED:
            return action.user;
        default:
            return state;
    }

}

const points = (state = initialState.points, action) => {
    switch (action.type) {
        case actionTypes.GET_USER_POINTS_COMPLETED:
            return action.points;
        default:
            return state;
    }

}

const reducer = combineReducers({
    user,
    points
});

export default reducer;