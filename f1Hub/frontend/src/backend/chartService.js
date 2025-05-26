import { appFetch, fetchConfig } from "./appFetch";

export const getChartData = (endpoint, params, onSuccess, onError) =>
  appFetch(`/charts/${endpoint}`, fetchConfig("GET", params), onSuccess, onError);

export const getChartCategories = (onSuccess, onError) =>
  appFetch("/charts/by-category", fetchConfig("GET"), onSuccess, onError);

export const getChartFilters = (onSuccess, onError) =>
  appFetch("/charts/filters", fetchConfig("GET"), onSuccess, onError);
