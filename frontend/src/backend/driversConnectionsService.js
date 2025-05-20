import { appFetch, fetchConfig } from "./appFetch";

export const startConnectionsGame = (lang, onSuccess, onErrors) =>
  appFetch(`/driversConnections/start?lang=${lang}`, fetchConfig("POST"), onSuccess, onErrors);

export const validateConnectionsGroup = (request, onSuccess, onErrors) =>
  appFetch("/driversConnections/validate", fetchConfig("POST", request), onSuccess, onErrors);

export const revealConnectionsAnswers = (gameId, onSuccess, onErrors) =>
  appFetch(`/driversConnections/reveal/${gameId}`, fetchConfig("POST"), onSuccess, onErrors);