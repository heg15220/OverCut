import { fetchConfig, appFetch } from "./appFetch";


export const startCategoryGame = (lang, onSuccess, onErrors) =>
  appFetch(`/categoryGame/start?lang=${lang}`, fetchConfig("POST"), onSuccess, onErrors);

export const submitCategoryAnswers = (data, onSuccess, onErrors) =>
  appFetch("/categoryGame/submit", fetchConfig("POST", data), onSuccess, onErrors);

export const getCategoryGameStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/categoryGame/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);