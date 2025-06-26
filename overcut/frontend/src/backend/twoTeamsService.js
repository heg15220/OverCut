import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (user, onSuccess, onErrors) =>
  appFetch("/twoTeamsGame/start", fetchConfig("POST", user), onSuccess, onErrors);


export const guessDriver = (request, onSuccess, onErrors) =>
  appFetch("/twoTeamsGame/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const skipPair = (gameId, onSuccess, onErrors) =>
  appFetch(`/twoTeamsGame/skip/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);

export const getGameStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/twoTeamsGame/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocompletePilotNames = (partial, onSuccess, onErrors) =>
  appFetch(`/twoTeamsGame/autocomplete?partial=${partial}`, fetchConfig("GET"), onSuccess, onErrors);
