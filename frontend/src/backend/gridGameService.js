import { fetchConfig, appFetch } from "./appFetch";

export const createGridGame = (onSuccess, onErrors) => {
    appFetch(
        `/gridGame/start`,
        fetchConfig("POST"),
        onSuccess,
        onErrors
    );
};

export const getGridGame = (gameId, onSuccess, onErrors) => {
    appFetch(
        `/gridGame/${gameId}/grid`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const validateGridSlot = (gameId, position, pilotName, onSuccess, onErrors) => {
    appFetch(
        `/gridGame/${gameId}/validate`,
        fetchConfig("POST", { position, pilotName }),
        onSuccess,
        onErrors
    );
};

export const autocompletePilots = (gameId, query, onSuccess, onErrors) => {
    appFetch(
        `/gridGame/${gameId}/autocomplete?q=${query}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};
