import {
    fetchConfig,
    appFetch,
} from "./appFetch";
export const getAllEvents = (onSuccess, onErrors) => {
    appFetch("/api/events/", fetchConfig("GET"), onSuccess, onErrors);
};

export const createEvent= (event,onSuccess, onErrors) => {
    appFetch(
        "/api/events/create",
        fetchConfig("POST",event),
        onSuccess,
        onErrors
    );
};

export const saveNotification = (notification, onSuccess, onErrors) => {
    appFetch("/api/events/notifications/create", fetchConfig("POST", notification), onSuccess, onErrors);
};

export const markAsRead = (notificationId, userId, onSuccess, onErrors) => {
    appFetch(`/api/events/${notificationId}/read/${userId}`, fetchConfig("PUT"), onSuccess, onErrors);
};

export const sendNotificationToUser = (userId, eventId, onSuccess, onErrors) => {
    appFetch(`/api/events/send/${userId}/notification/${eventId}`, fetchConfig("GET"), onSuccess, onErrors);
};

export const getNotificationsForUser = ({userId, page}, onSuccess, onErrors) => {
    appFetch(`/api/events/${userId}/notifications?page=${page}`, fetchConfig("GET"), onSuccess, onErrors);
};

export const getEventDetails = (eventId, onSuccess, onErrors) => {
    appFetch(`/api/events/${eventId}`, fetchConfig("GET"), onSuccess, onErrors);
};
