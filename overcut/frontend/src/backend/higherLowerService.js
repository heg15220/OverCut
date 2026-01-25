import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (lang, user, onSuccess, onErrors) =>
  appFetch(`/higherLower/start?lang=${lang}`, fetchConfig("POST", user), onSuccess, onErrors);

export const guess = (request, onSuccess, onErrors) =>
  appFetch("/higherLower/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getGameStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/higherLower/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);
