import {
    fetchConfig,
    appFetch,
} from "./appFetch";

export const getEvents = (page, onSuccess) => {
    appFetch(`/events/events?page=${page}`, fetchConfig("GET"), onSuccess);
};

export const createEvent= (event,onSuccess, onErrors) => {
    appFetch(
        "/events/create",
        fetchConfig("POST",event),
        onSuccess,
        onErrors
    );
};

export const saveNotification = (notification, onSuccess, onErrors) => {
    appFetch("/events/notifications/create", fetchConfig("POST", notification), onSuccess, onErrors);
};

export const markAsRead = (notificationId, userId, onSuccess, onErrors) => {
    appFetch(`/events/${notificationId}/read/${userId}`, fetchConfig("PUT"), onSuccess, onErrors);
};

export const sendNotificationToUser = (userId, eventId, onSuccess, onErrors) => {
    appFetch(`/events/send/${userId}/notification/${eventId}`, fetchConfig("GET"), onSuccess, onErrors);
};

export const getNotificationsForUser = ({userId, page}, onSuccess, onErrors) => {
    appFetch(`/events/${userId}/notifications?page=${page}`, fetchConfig("GET"), onSuccess, onErrors);
};

export const getEventDetails = (eventId, onSuccess, onErrors) => {
    appFetch(`/events/${eventId}`, fetchConfig("GET"), onSuccess, onErrors);
};
