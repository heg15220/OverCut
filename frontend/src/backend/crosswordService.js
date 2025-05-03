// api/crossword.js
import { fetchConfig, appFetch } from "./appFetch";

export const createCrosswordGame = (request, onSuccess, onErrors) => {
    appFetch(
        `/crossword/create`,
        fetchConfig("POST", request),
        onSuccess,
        onErrors
    );
};

export const getCrosswordGame = (gameId, onSuccess, onErrors) => {
    appFetch(
        `/crossword/${gameId}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const getCrosswordCells = (gameId, onSuccess, onErrors) => {
    appFetch(
        `/crossword/${gameId}/cells`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const getCrosswordWords = (gameId, onSuccess, onErrors) => {
    appFetch(
        `/crossword/${gameId}/words`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const updateCellUserInput = (cellId, userInput, onSuccess, onErrors) => {
    appFetch(
        `/crossword/cell/${cellId}/input`,
        fetchConfig("PUT", { userInput }),
        onSuccess, // ahora recibes la celda
        onErrors
    );
};


export const checkCell = (cellId, userInput, onSuccess, onErrors) => {
    appFetch(
        `/crossword/cell/${cellId}/check`,
        fetchConfig("POST", { userInput }),
        onSuccess,
        onErrors
    );
};

export const checkWord = (wordId, userInput, onSuccess, onErrors) => {
    appFetch(
        `/crossword/word/${wordId}/check`,
        fetchConfig("POST", { userInput }),
        onSuccess,
        onErrors
    );
};

export const checkGameCompleted = (gameId, onSuccess, onErrors) => {
    appFetch(
        `/crossword/${gameId}/completed`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const resetCrosswordGame = (gameId, onSuccess, onErrors) => {
    appFetch(
        `/crossword/${gameId}/reset`,
        fetchConfig("POST"),
        onSuccess,
        onErrors
    );
};
