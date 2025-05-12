import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (onSuccess, onErrors) =>
  appFetch("/driversLink/start", fetchConfig("POST"), onSuccess, onErrors);

export const guessDriver = (request, onSuccess, onErrors) =>
  appFetch("/driversLink/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getGameStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/driversLink/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocompletePilotNames = (partial, onSuccess, onErrors) =>
  appFetch(`/driversLink/autocomplete?partial=${partial}`, fetchConfig("GET"), onSuccess, onErrors);

export const skipClue = (gameId, onSuccess, onErrors) =>
  appFetch(`/driversLink/skip/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);
