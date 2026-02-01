import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (lang, onSuccess, onErrors) =>
  appFetch(`/abbreviationsGame/start?lang=${lang}`, fetchConfig("POST"), onSuccess, onErrors);

export const guess = (request, onSuccess, onErrors) =>
  appFetch("/abbreviationsGame/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/abbreviationsGame/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocompletePilotNames = (partial, onSuccess, onErrors) =>
  appFetch(`/abbreviationsGame/autocomplete?partial=${partial}`, fetchConfig("GET"), onSuccess, onErrors);
