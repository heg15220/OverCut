import { appFetch, fetchConfig } from "./appFetch";


export const getChartData = (endpoint, params, onSuccess, onError) => {
  let url = `/charts/${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    url += `?${query}`;
  }

  appFetch(url, fetchConfig("GET"), onSuccess, onError);
};


export const getChartCategories = (onSuccess, onError) =>
  appFetch("/charts/by-category", fetchConfig("GET"), onSuccess, onError);

export const getChartFilters = (onSuccess, onError) =>
  appFetch("/charts/filters", fetchConfig("GET"), onSuccess, onError);
