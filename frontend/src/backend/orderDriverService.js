import { fetchConfig, appFetch } from "./appFetch";

export const startOrderGame = (onSuccess, onErrors) =>
  appFetch("/orderDriver/start", fetchConfig("POST"), onSuccess, onErrors);

export const submitOrder = (request, onSuccess, onErrors) =>
  appFetch("/orderDriver/submit", fetchConfig("POST", request), onSuccess, onErrors);

export const getOrderGame = (gameId, onSuccess, onErrors) =>
  appFetch(`/orderDriver/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);