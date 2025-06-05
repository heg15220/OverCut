import { appFetch, fetchConfig } from "./appFetch";


export const getChartData = (endpoint, params = {}, onSuccess, onError) => {
  // Detectar idioma del navegador: "en" o "es"
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  // Incluir `lang` en los parámetros
  const queryParams = { ...params, lang };

  const query = new URLSearchParams(queryParams).toString();
  const url = `/charts/${endpoint}?${query}`;

  appFetch(url, fetchConfig("GET"), onSuccess, onError);
};



export const getChartCategories = (onSuccess, onError) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  appFetch(`/charts/by-category?lang=${lang}`, fetchConfig("GET"), onSuccess, onError);
};


export const getChartFilters = (onSuccess, onError) =>
  appFetch("/charts/filters", fetchConfig("GET"), onSuccess, onError);
