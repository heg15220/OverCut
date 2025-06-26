import { fetchConfig, appFetch } from "./appFetch";

export const startGuessDriverGame = (user, onSuccess, onErrors) =>
  appFetch("/guessDriver/start", fetchConfig("POST", user), onSuccess, onErrors);


export const askGuessDriverQuestion = (request, onSuccess, onErrors) =>
  appFetch("/guessDriver/ask", fetchConfig("POST", request), onSuccess, onErrors);

export const guessPilot = (request, onSuccess, onErrors) =>
  appFetch("/guessDriver/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getGuessDriverStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/guessDriver/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const getGuessDriverRecommendations = (category, lang, onSuccess, onErrors) =>
  appFetch(`/guessDriver/recommendations?category=${category}&lang=${lang}`, fetchConfig("GET"), onSuccess, onErrors);

export const getPilotSuggestions = (partial, onSuccess, onError) =>
  appFetch(`/guessDriver/autocomplete?partial=${partial}`, fetchConfig("GET"), onSuccess, onError);
