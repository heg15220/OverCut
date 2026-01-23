import { fetchConfig, appFetch } from "./appFetch";

export const themes = (onSuccess, onErrors) =>
  appFetch(`/tower/themes`, fetchConfig("GET"), onSuccess, onErrors);

export const startGame = (lang, themeType, themeKey, user, onSuccess, onErrors) => {
  const qs = new URLSearchParams();
  qs.set("lang", lang);
  if (themeType) qs.set("themeType", themeType);
  if (themeKey) qs.set("themeKey", themeKey);

  return appFetch(`/tower/start?${qs.toString()}`, fetchConfig("POST", user), onSuccess, onErrors);
};

export const guess = (request, user, onSuccess, onErrors) =>
  appFetch("/tower/guess", fetchConfig("POST", request, user), onSuccess, onErrors);

export const hint = (gameId, onSuccess, onErrors) =>
  appFetch(`/tower/hint/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);

export const status = (gameId, onSuccess, onErrors) =>
  appFetch(`/tower/status/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const autocomplete = (gameId, q, onSuccess, onErrors) =>
  appFetch(
    `/tower/${gameId}/autocomplete?q=${encodeURIComponent(q)}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );

export const answer = (request, user, onSuccess, onErrors) =>
  appFetch("/tower/answer", fetchConfig("POST", request, user), onSuccess, onErrors);
