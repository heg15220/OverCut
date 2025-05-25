import { appFetch, fetchConfig } from "./appFetch";

export const getChampionshipTracking = (year, onSuccess, onError) =>
  appFetch(`/championship/${year}`, fetchConfig("GET"), onSuccess, onError);
