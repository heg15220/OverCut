import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (onSuccess, onErrors) =>
  appFetch("/teamGuess/start", fetchConfig("POST"), onSuccess, onErrors);

export const guessTeam = (request, onSuccess, onErrors) =>
  appFetch("/teamGuess/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getGameStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/teamGuess/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocompleteTeamNames = (partial, onSuccess, onErrors) =>
  appFetch(`/teamGuess/autocomplete?partial=${partial}`, fetchConfig("GET"), onSuccess, onErrors);