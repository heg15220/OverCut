import { fetchConfig, appFetch } from "./appFetch";

export const getMe = (onSuccess, onErrors) =>
  appFetch("/debate/me/", fetchConfig("GET"), onSuccess, onErrors);

export const submitOpinion = (scope, text, onSuccess, onErrors) =>
  appFetch("/debate/opinions", fetchConfig("POST", { scope, text }), onSuccess, onErrors);

export const getMyTodayOpinion = (scope, onSuccess, onErrors) =>
  appFetch(
    `/debate/opinions/me?scope=${encodeURIComponent(scope)}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );

export const listRoomsToday = (scope, onSuccess, onErrors) =>
  appFetch(
    `/debate/rooms?scope=${encodeURIComponent(scope)}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );

export const getRoomDetail = (roomId, onSuccess, onErrors) =>
  appFetch(`/debate/rooms/${roomId}`, fetchConfig("GET"), onSuccess, onErrors);

export const joinRoom = (roomId, onSuccess, onErrors) =>
  appFetch(`/debate/rooms/${roomId}/join`, fetchConfig("POST"), onSuccess, onErrors);

export const answerPoll = (roomId, answer, onSuccess, onErrors) =>
  appFetch(`/debate/rooms/${roomId}/poll`, fetchConfig("POST", { answer }), onSuccess, onErrors);

export const getRoomMessages = (roomId, limit = 50, onSuccess, onErrors) =>
  appFetch(
    `/debate/rooms/${roomId}/messages?limit=${encodeURIComponent(limit)}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );

export const sendRoomMessage = (roomId, text, onSuccess, onErrors) =>
  appFetch(`/debate/rooms/${roomId}/messages`, fetchConfig("POST", { text }), onSuccess, onErrors);
