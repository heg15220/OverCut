import backend from "../../backend";
import {appFetch, fetchConfig} from "../../backend/appFetch";
import * as actionTypes from './actionTypes';
import { getUser } from "../users/selectors";

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



const updateCellCompleted = (updatedCell) => ({
    type: actionTypes.UPDATE_USER_INPUT_COMPLETED,
    updatedCell
});



const checkCellCompleted = (cell) => ({
    type: actionTypes.CHECK_CELL_COMPLETED,
    cell
});



const checkWordCompleted = (wordId, wordValidation) => ({
    type: actionTypes.CHECK_WORD_COMPLETED,
    wordId,
    wordValidation // "correct" o "incorrect"
});

export const setWordValidation = (wordId, wordValidation) => ({
    type: actionTypes.SET_WORD_VALIDATION,
    wordId,
    wordValidation
});



const checkCrossWordGameCompleted = (game) => ({
    type: actionTypes.CHECK_CROSSWORD_GAME_COMPLETED,
    game
});

const resetCrosswordGameCompleted = (reset) => ({
    type: actionTypes.RESET_GAME_COMPLETED,
    reset
});

const getCheckWordCompleted = (wordValidation) => ({
    type: actionTypes.GET_CHECK_WORD_COMPLETED,
    wordValidation
});


export const resetWordValidation = () => ({
    type: actionTypes.RESET_WORD_VALIDATION,
});

// actions.js
export const resetSingleWordValidation = (wordId) => ({
  type: actionTypes.RESET_SINGLE_WORD_VALIDATION,
  wordId
});





export const createCrosswordGame = (request, onSuccess, onErrors ) => (dispatch, getState) => {
    const user = getUser(getState());
    backend.crosswordService.createCrosswordGame(user.id, request, gameId => {
        dispatch(createCrosswordGameCompleted(gameId));
        onSuccess(gameId);
    }, onErrors);
};

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
    backend.crosswordService.updateCellUserInput(cellId, userInput, updatedCell => {
        dispatch(updateCellCompleted(updatedCell)); // puedes adaptar si combinas con las existentes
        onSuccess(updatedCell);
    }, onErrors);



export const checkCell = (cellId, userInput, onSuccess, onErrors) => dispatch =>
    backend.crosswordService.checkCell(cellId, userInput, cell => {
        dispatch(checkCellCompleted(cell));
        onSuccess(cell);
    },
    onErrors);

export const checkWord = (wordId, userInput, language, onSuccess, onErrors) => dispatch =>
  backend.crosswordService.checkWord(wordId, userInput, language, wordValidation => {
    if (wordValidation !== null) {
      dispatch({
        type: actionTypes.GET_CHECK_WORD_COMPLETED,
        wordId,
        result: wordValidation === true ? "correct" : "incorrect" // <-- CAMBIO AQUÍ
      });
    }

    onSuccess(wordValidation);
  }, onErrors);







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
