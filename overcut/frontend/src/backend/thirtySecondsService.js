import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (lang, onSuccess, onErrors) =>
  appFetch(`/thirtySecondsGame/start?lang=${lang}`, fetchConfig("POST"), onSuccess, onErrors);

export const submit = (request, onSuccess, onErrors) =>
  appFetch("/thirtySecondsGame/submit", fetchConfig("POST", request), onSuccess, onErrors);

export const getStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/thirtySecondsGame/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocompletePilotNames = (partial, onSuccess, onErrors) =>
  appFetch(`/thirtySecondsGame/autocomplete?partial=${partial}`, fetchConfig("GET"), onSuccess, onErrors);
