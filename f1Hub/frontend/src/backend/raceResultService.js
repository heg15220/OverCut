// === src/backend/raceResultService.js ===
import { appFetch, fetchConfig } from "./appFetch";

export const getRaceResults = (raceId, onSuccess, onErrors) =>
  appFetch(`/races/${raceId}/results`, fetchConfig("GET"), onSuccess, onErrors);

export const getQualifyingResults = (raceId, onSuccess, onError) =>
  appFetch(`/races/${raceId}/qualifying`, fetchConfig("GET"), onSuccess, onError);

export const getSprintResults = (raceId, onSuccess, onErrors) =>
  appFetch(`/races/${raceId}/sprint`, fetchConfig("GET"), onSuccess, onErrors);