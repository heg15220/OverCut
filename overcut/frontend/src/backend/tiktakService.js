import {
    fetchConfig,
    appFetch,
} from "./appFetch";

export const createGame = (request, onSuccess, onErrors) => {
    appFetch(
        `/ticktacktoe/create`,
        fetchConfig("POST", request),
        onSuccess,
        onErrors
    );
};

export const getGame = (id, onSuccess, onErrors) => {

    appFetch(
        `/ticktacktoe/${id}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const playMove = (id, request, onSuccess, onErrors) => {

    appFetch(
        `/ticktacktoe/${id}/move`,
        fetchConfig("POST", request),
        onSuccess,
        onErrors
    );
};

export const getCriteria = (onSuccess, onErrors) => {

    appFetch(
        `/ticktacktoe/criteria`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const skipTurn = (id, onSuccess, onErrors) => {
  appFetch(
    `/ticktacktoe/${id}/skip`,
    fetchConfig("POST"),
    onSuccess,
    onErrors
  );
};

export const forceDraw = (id, onSuccess, onErrors) => {
  appFetch(
    `/ticktacktoe/${id}/draw`,
    fetchConfig("POST"),
    onSuccess,
    onErrors
  );
};
