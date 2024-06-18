import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    event: null,
    events: null,
    notification: null,
    notifications: null,
};

const event = (state = initialState.event, action) => {
    switch (action.type) {
        case actionTypes.SEND_NOTIFICATION_TO_USER_COMPLETED:
            return action.event;
        case actionTypes.GET_EVENT_DETAILS_COMPLETED:
            return action.event;
        case actionTypes.CREATE_EVENT_COMPLETED:
            return action.event;
        default:
            return state;
    }
}

const events = (state = initialState.events, action) => {
    switch (action.type) {
        case actionTypes.GET_ALL_EVENTS_COMPLETED:
            return action.events;
        default:
            return state;
    }
}

const notification = (state = initialState.notification, action) => {
    switch (action.type) {
        case actionTypes.SAVE_NOTIFICATION_COMPLETED:
            return action.notification;
        case actionTypes.MARK_AS_READ_COMPLETED:
            return action.notification;
        default:
            return state;
    }
}

const notifications = (state = initialState.notifications, action) => {
    switch (action.type) {
        case actionTypes.GET_NOTIFICATIONS_FOR_USER_COMPLETED:
            return action.notifications;
        default:
            return state;
    }
}


const reducer = combineReducers({
    event,
    events,
    notification,
    notifications,
});
export default reducer;
