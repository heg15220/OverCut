import backend from "../../backend";
import {appFetch, fetchConfig} from "../../backend/appFetch";
import * as actionTypes from './actionTypes';

const createCrosswordGameCompleted = (gameId) => ({
    type: actionTypes.CREATE_CROSSWORD_GAME_COMPLETED,
    gameId
});

const getCrosswordGameCompleted = (game) => ({
    type: actionTypes.GET_CROSSWORD_GAME_COMPLETED,
    game
});

const getCrosswordCellsCompleted = (cells) => ({
    type: actionTypes.GET_CELLS_COMPLETED,
    cells
});


const getCrosswordWordsCompleted = (words) => ({
    type: actionTypes.GET_WORDS_COMPLETED,
    words
});



const updateCellCompleted = (userInput) => ({
    type: actionTypes.UPDATE_USER_INPUT_COMPLETED,
    userInput
});


const checkCellCompleted = (cell) => ({
    type: actionTypes.CHECK_CELL_COMPLETED,
    cell
});



const checkWordCompleted = (word) => ({
    type: actionTypes.CHECK_WORD_COMPLETED,
    word
});



const checkCrossWordGameCompleted = (game) => ({
    type: actionTypes.CHECK_CROSSWORD_GAME_COMPLETED,
    game
});

const resetCrosswordGameCompleted = (reset) => ({
    type: actionTypes.RESET_GAME_COMPLETED,
    reset
});

export const createCrosswordGame = (request, onSuccess, onErrors ) => dispatch =>
    backend.crosswordService.createCrosswordGame(request, gameId => {
            dispatch(createCrosswordGameCompleted(gameId));
            onSuccess(gameId);
        },
        onErrors);

export const getCrosswordGame = (gameId, onSuccess, onErrors ) => dispatch =>
    backend.crosswordService.getCrosswordGame(gameId, game => {
            dispatch(getCrosswordGameCompleted(game));
            onSuccess(game);
        },
        onErrors);

export const getCrosswordCells = (gameId, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.getCrosswordCells(gameId, cells => {
        dispatch(getCrosswordCellsCompleted(cells));
        onSuccess(cells);
    },
    onErrors);

export const getCrosswordWords = (gameId, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.getCrosswordWords(gameId, words => {
        dispatch(getCrosswordWordsCompleted(words));
        onSuccess(words);
    },
    onErrors);

export const updateCellUserInput = (cellId, userInput, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.updateCellUserInput(cellId, userInput, userInput => {
        dispatch(updateCellCompleted(userInput));
        onSuccess(userInput);
    },
    onErrors);

export const checkCell = (cellId, userInput, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.checkCell(cellId, userInput, cell => {
        dispatch(checkCellCompleted(cell));
        onSuccess(cell);
    },
    onErrors);

export const checkWord = (wordId, userInput, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.checkWord(wordId, userInput, word => {
        dispatch(checkWordCompleted(word));
        onSuccess(word);
    },
    onErrors);

export const checkGameCompleted = (gameId, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.checkGameCompleted(gameId, game => {
        dispatch(checkCrossWordGameCompleted(game));
        onSuccess(game);
    },
    onErrors);

export const resetCrosswordGame = (gameId, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.resetCrosswordGame(gameId, reset => {
        dispatch(resetCrosswordGameCompleted(reset));
        onSuccess(reset);
    },
    onErrors);
