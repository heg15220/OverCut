import { fetchConfig, appFetch } from "./appFetch";

export const startOrderGame = (lang, user, onSuccess, onErrors) =>
  appFetch(`/orderDriver/start?lang=${lang}`, fetchConfig("POST", user), onSuccess, onErrors);



export const submitOrder = (request, onSuccess, onErrors) =>
  appFetch("/orderDriver/submit", fetchConfig("POST", request), onSuccess, onErrors);

export const getOrderGame = (gameId, onSuccess, onErrors) =>
  appFetch(`/orderDriver/${gameId}`, fetchConfig("GET"), onSuccess, onErrors);