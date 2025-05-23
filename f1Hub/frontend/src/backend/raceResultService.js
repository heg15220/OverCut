// === src/backend/raceResultService.js ===
import { appFetch, fetchConfig } from "./appFetch";

export const getRaceResults = (raceId, onSuccess, onErrors) =>
  appFetch(`/races/${raceId}/results`, fetchConfig("GET"), onSuccess, onErrors);