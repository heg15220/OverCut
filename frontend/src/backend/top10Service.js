import { fetchConfig, appFetch } from "./appFetch";

export const createGame = (lang, onSuccess, onErrors) => {
  appFetch(
    `/top10/start?lang=${lang}`, // ⬅️ nuevo parámetro
    fetchConfig("POST"),
    onSuccess,
    onErrors
  );
};


export const getGameBoard = (gameId, onSuccess, onErrors) => {
  appFetch(
    `/top10/${gameId}/grid`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );
};

export const validatePilot = (gameId, pilotName, onSuccess, onErrors) => {
  appFetch(
    `/top10/${gameId}/validate`,
    fetchConfig("POST", { pilotName }),
    onSuccess,
    onErrors
  );
};

export const autocomplete = (gameId, query, onSuccess, onErrors) => {
  appFetch(
    `/top10/${gameId}/autocomplete?q=${query}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );
};

export const revealAll = (gameId, onSuccess, onErrors) => {
  appFetch(
    `/top10/${gameId}/reveal-all`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );
};
