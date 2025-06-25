import { fetchConfig, appFetch } from "./appFetch";

export const checkCooldown = (gameType, onSuccess, onErrors) =>
  appFetch(`/cooldown/${gameType}`, fetchConfig("GET"), onSuccess, onErrors);
