
import { fetchConfig, appFetch } from "./appFetch";

export const startGame = (onSuccess, onErrors) =>
  appFetch("/wordSearch/start", fetchConfig("POST"), onSuccess, onErrors);

export const getGame = (gameId, onSuccess, onErrors) =>
  appFetch(`/wordSearch/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const validateWord = (request, onSuccess, onErrors) =>
  appFetch("/wordSearch/validate", fetchConfig("POST", request), onSuccess, onErrors);

export const submitSolution = (request, onSuccess, onErrors) =>
  appFetch("/wordSearch/submit", fetchConfig("POST", request), onSuccess, onErrors);

export const revealWords = (request, onSuccess, onErrors) =>
    appFetch("/wordSearch/reveal", fetchConfig("POST", request), onSuccess, onErrors);