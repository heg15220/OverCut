import { fetchConfig, appFetch } from "./appFetch";

export const startRondoGame = (user, lang = "es", onSuccess, onErrors) =>
  appFetch(`/rondo/start?language=${lang}`, fetchConfig("POST", user), onSuccess, onErrors);



export const getRondoGame = (gameId, onSuccess, onErrors) =>
  appFetch(`/rondo/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);

export const answerRondoLetter = (gameId, letter, answer, onSuccess, onErrors) =>
  appFetch(`/rondo/${gameId}/answer?letter=${letter}&answer=${encodeURIComponent(answer)}`, fetchConfig("POST"), onSuccess, onErrors);

export const skipRondoLetter = (gameId, letter, onSuccess, onErrors) =>
  appFetch(`/rondo/${gameId}/skip?letter=${letter}`, fetchConfig("POST"), onSuccess, onErrors);

export const completeRondoGame = (gameId, onSuccess, onErrors) =>
  appFetch(`/rondo/${gameId}/complete`, fetchConfig("POST"), onSuccess, onErrors);