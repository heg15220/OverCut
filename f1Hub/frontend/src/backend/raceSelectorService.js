// src/backend/raceSelectorService.js
import { appFetch, fetchConfig } from "./appFetch";

export const getAvailableYears = (onSuccess, onError) =>
  appFetch("/races/years", fetchConfig("GET"), onSuccess, onError);

export const getGrandsPrixByYear = (year, onSuccess, onError) =>
  appFetch(`/races/year/${year}/grands-prix`, fetchConfig("GET"), onSuccess, onError);

export const getSessionsForRace = (raceId, onSuccess, onError) =>
  appFetch(`/races/race/${raceId}/sessions`, fetchConfig("GET"), onSuccess, onError);
