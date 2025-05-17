import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (lang, onSuccess, onErrors) =>
  appFetch(`/f1Impostor/start?lang=${lang}`, fetchConfig("POST"), onSuccess, onErrors);



export const validateSelection = (request, onSuccess, onErrors) =>
  appFetch("/f1Impostor/validate", fetchConfig("POST", request), onSuccess, onErrors);

export const getGameStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/f1Impostor/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);
