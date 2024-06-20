import backend from "../../backend";
import {appFetch, fetchConfig} from "../../backend/appFetch";
import * as actionTypes from "../events/actionTypes";
import {modifyPostCompleted} from "../posts/actions";

const createEventCompleted = (event) => ({
    type: actionTypes.CREATE_EVENT_COMPLETED,
    event
});
const getEventDetailsCompleted = (event) => ({
    type: actionTypes.GET_EVENT_DETAILS_COMPLETED,
    event
});

const getAllEventsCompleted = (events) => ({
    type: actionTypes.GET_ALL_EVENTS_COMPLETED,
    events
});

const saveNotificationCompleted = (notification) => ({
    type: actionTypes.SAVE_NOTIFICATION_COMPLETED,
    notification
});

const markAsReadCompleted = (notification) => ({
    type: actionTypes.MARK_AS_READ_COMPLETED,
    notification
});

const sendNotificationToUserCompleted = (event) => ({
    type: actionTypes.SEND_NOTIFICATION_TO_USER_COMPLETED,
    event
});

const getNotificationForUserCompleted = (notifications) => ({
    type: actionTypes.GET_NOTIFICATIONS_FOR_USER_COMPLETED,
    notifications
});


export const createEvent = (event, onSuccess, onErrors) => dispatch =>
    backend.eventService.createEvent(event, event => {
        dispatch(createEventCompleted(event));
        onSuccess(event);
    },
        onErrors);

export const getEvents = (page, onSuccess) => dispatch =>
    backend.eventService.getEvents(page, events => {
        dispatch(getAllEventsCompleted(events));
        onSuccess(events);
    });

export const saveNotification = (notification, onSuccess, onErrors) => dispatch =>
    backend.eventService.saveNotification(notification, notification => {
        dispatch(saveNotificationCompleted(notification));
        onSuccess(notification);
    },
        onErrors);


export const markAsRead =(notificationId, userId, onSuccess, onErrors) => dispatch =>
    backend.eventService.markAsRead(notificationId,userId, notification => {
        dispatch(markAsReadCompleted(notification));
        onSuccess();
    },
        onErrors);

export const sendNotificationToUser = (userId, eventId, onSuccess, onErrors) => dispatch =>
    backend.eventService.sendNotificationToUser(userId,eventId,event => {
        dispatch(sendNotificationToUserCompleted(event));
        onSuccess();
    },
        onErrors);


export const getNotificationsForUser = (userId,page, onSuccess, onErrors) => dispatch =>
    backend.eventService.getNotificationsForUser(userId,page,
        notifications =>{ dispatch(getNotificationForUserCompleted(notifications));
                onSuccess();
    },
        onErrors);

export const getEventDetails  = (eventId, onSuccess, onErrors) => dispatch =>
    backend.eventService.getEventDetails(eventId,event => {
        dispatch(getEventDetailsCompleted(event));
        onSuccess();
    },
        onErrors);