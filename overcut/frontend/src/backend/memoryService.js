import { fetchConfig, appFetch } from "./appFetch";

export const startMemoryGame = (lang, rows, cols, mode, onSuccess, onErrors) =>
  appFetch(
    `/memory/start?lang=${lang}&rows=${rows}&cols=${cols}&mode=${mode}`,
    fetchConfig("POST"),
    onSuccess,
    onErrors
  );

export const validateMemoryPair = (request, onSuccess, onErrors) =>
  appFetch(
    `/memory/validate`,
    fetchConfig("POST", request),
    onSuccess,
    onErrors
  );
