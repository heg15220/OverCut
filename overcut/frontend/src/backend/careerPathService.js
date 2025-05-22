import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (onSuccess, onErrors) =>
  appFetch("/careerPath/start", fetchConfig("POST"), onSuccess, onErrors);

export const guessDriver = (request, onSuccess, onErrors) =>
  appFetch("/careerPath/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getGameStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/careerPath/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocompletePilotNames = (partial, onSuccess, onErrors) =>
  appFetch(`/careerPath/autocomplete?partial=${partial}`, fetchConfig("GET"), onSuccess, onErrors);

export const skipClue = (gameId, onSuccess, onErrors) =>
  appFetch(`/careerPath/skip/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);
