import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (lang, onSuccess, onErrors) =>
  appFetch(`/teamNationalityGame/start?lang=${lang}`, fetchConfig("POST"), onSuccess, onErrors);

export const guess = (request, onSuccess, onErrors) =>
  appFetch("/teamNationalityGame/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/teamNationalityGame/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocompletePilotNames = (partial, onSuccess, onErrors) =>
  appFetch(`/teamNationalityGame/autocomplete?partial=${encodeURIComponent(partial)}`, fetchConfig("GET"), onSuccess, onErrors);
