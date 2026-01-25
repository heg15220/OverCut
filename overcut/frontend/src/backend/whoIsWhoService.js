import { appFetch, fetchConfig } from "./appFetch";

export const startWhoIsWhoGame = (lang, userId, onSuccess, onErrors) =>
  appFetch(`/whoIsWho/start?lang=${lang}`, fetchConfig("POST", userId), onSuccess, onErrors);

export const nextWhoIsWhoHint = (gameId, onSuccess, onErrors) =>
  appFetch(`/whoIsWho/next-hint/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);

export const guessWhoIsWho = (request, onSuccess, onErrors) =>
  appFetch(`/whoIsWho/guess`, fetchConfig("POST", request), onSuccess, onErrors);

export const revealWhoIsWho = (gameId, onSuccess, onErrors) =>
  appFetch(`/whoIsWho/reveal/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);

export const autocompleteWhoIsWho = (partial, onSuccess, onErrors) =>
  appFetch(
    `/whoIsWho/autocomplete?partial=${encodeURIComponent(partial)}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );
