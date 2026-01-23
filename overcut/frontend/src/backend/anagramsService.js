import { fetchConfig, appFetch } from "./appFetch";

export const startAnagramsGame = (user, onSuccess, onErrors) =>
  appFetch("/anagrams/start", fetchConfig("POST", user), onSuccess, onErrors);

export const guessAnagrams = (request, onSuccess, onErrors) =>
  appFetch("/anagrams/guess", fetchConfig("POST", request), onSuccess, onErrors);

export const getAnagramsStatus = (gameId, onSuccess, onErrors) =>
  appFetch(`/anagrams/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);
