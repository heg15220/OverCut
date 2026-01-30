import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (lang, onSuccess, onErrors) =>
  appFetch(`/driverStatsGame/start?lang=${lang}`, fetchConfig("POST"), onSuccess, onErrors);

export const submit = (request, onSuccess, onErrors) =>
  appFetch("/driverStatsGame/submit", fetchConfig("POST", request), onSuccess, onErrors);

export const getStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/driverStatsGame/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);
