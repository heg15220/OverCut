import { fetchConfig, appFetch } from "./appFetch";

export const startGuessDriverGame = (onSuccess, onErrors) =>
  appFetch("/guessDriver/start", fetchConfig("POST"), onSuccess, onErrors);

export const askGuessDriverQuestion = (request, onSuccess, onErrors) =>
  appFetch("/guessDriver/ask", fetchConfig("POST", request), onSuccess, onErrors);

export const guessPilot = (request, onSuccess, onErrors) =>
  appFetch("/guessDriver/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getGuessDriverStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/guessDriver/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const getGuessDriverRecommendations = (category, onSuccess, onErrors) =>
  appFetch(`/guessDriver/recommendations?category=${category}`, fetchConfig("GET"), onSuccess, onErrors);
