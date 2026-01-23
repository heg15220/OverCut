import { appFetch, fetchConfig } from "./appFetch";

// ✅ AHORA acepta userId como 2º parámetro (como tu action ya lo está pasando)
export const startBingoGame = (lang, userId, onSuccess, onErrors) =>
  appFetch(
    `/bingo/start?lang=${lang}`,
    fetchConfig("POST", userId),
    onSuccess,
    onErrors
  );

export const selectBingoCell = (request, onSuccess, onErrors) =>
  appFetch(`/bingo/select`, fetchConfig("POST", request), onSuccess, onErrors);

export const finishBingoGame = (gameId, onSuccess, onErrors) =>
  appFetch(`/bingo/finish/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);
