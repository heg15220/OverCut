import { fetchConfig, appFetch } from "./appFetch";

export const startF1WordleGame = (user, onSuccess, onErrors) =>
  appFetch("/wordle/start", fetchConfig("POST", user), onSuccess, onErrors);


export const guessF1Wordle = (request, onSuccess, onErrors) =>
  appFetch("/wordle/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getF1WordleStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/wordle/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);
