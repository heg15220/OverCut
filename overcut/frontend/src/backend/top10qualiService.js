import { fetchConfig, appFetch } from "./appFetch";

export const createGame = (user, lang, onSuccess, onErrors) => {
  appFetch(`/top10quali/start?lang=${lang}`, fetchConfig("POST", user), onSuccess, onErrors);
};

export const getGameBoard = (gameId, onSuccess, onErrors) => {
  appFetch(`/top10quali/${gameId}/grid`, fetchConfig("GET"), onSuccess, onErrors);
};

export const validatePilot = (gameId, pilotName, onSuccess, onErrors) => {
  appFetch(`/top10quali/${gameId}/validate`, fetchConfig("POST", { pilotName }), onSuccess, onErrors);
};

export const autocomplete = (gameId, query, onSuccess, onErrors) => {
  appFetch(`/top10quali/${gameId}/autocomplete?q=${query}`, fetchConfig("GET"), onSuccess, onErrors);
};

export const revealAll = (gameId, onSuccess, onErrors) => {
  appFetch(`/top10quali/${gameId}/reveal-all`, fetchConfig("GET"), onSuccess, onErrors);
};
