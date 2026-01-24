import { appFetch, fetchConfig } from "./appFetch";

export const startTimelineGame = (lang, userId, onSuccess, onErrors) =>
  appFetch(`/timeline/start?lang=${lang}`, fetchConfig("POST", userId), onSuccess, onErrors);

export const validateTimelineOrder = (request, onSuccess, onErrors) =>
  appFetch("/timeline/validate", fetchConfig("POST", request), onSuccess, onErrors);

export const revealTimeline = (gameId, onSuccess, onErrors) =>
  appFetch(`/timeline/reveal/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);
