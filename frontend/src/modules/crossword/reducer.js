import { combineReducers } from "redux";
import * as actionTypes from "./actionTypes";

const initialState = {
    gameId: null,
    game: null,
    cells: null,
    words: null,
    userInput: null,
    cell: null,
    word: null,
    gameCompleted: null,
    reset: null,
};

// ID del juego creado
const gameId = (state = initialState.gameId, action) => {
    if (action.type === actionTypes.CREATE_CROSSWORD_GAME_COMPLETED) {
        return action.gameId;
    }
    return state;
};

// Estado general del juego
const game = (state = initialState.game, action) => {
    if (action.type === actionTypes.GET_CROSSWORD_GAME_COMPLETED) {
        return action.game;
    }
    return state;
};

// Celdas del crucigrama
const cells = (state = initialState.cells, action) => {
    if (action.type === actionTypes.GET_CELLS_COMPLETED) {
        return action.cells;
    }
    return state;
};

// Palabras del crucigrama
const words = (state = initialState.words, action) => {
    if (action.type === actionTypes.GET_WORDS_COMPLETED) {
        return action.words;
    }
    return state;
};

// Último input de usuario en una celda (opcional)
const userInput = (state = initialState.userInput, action) => {
    if (action.type === actionTypes.UPDATE_USER_INPUT_COMPLETED) {
        return action.userInput;
    }
    return state;
};

// Resultado de checkCell
const cell = (state = initialState.cell, action) => {
    if (action.type === actionTypes.CHECK_CELL_COMPLETED) {
        return action.cell;
    }
    return state;
};

// Resultado de checkWord
const word = (state = initialState.word, action) => {
    if (action.type === actionTypes.CHECK_WORD_COMPLETED) {
        return action.word;
    }
    return state;
};

// Estado de completado del juego
const gameCompleted = (state = initialState.gameCompleted, action) => {
    if (action.type === actionTypes.CHECK_CROSSWORD_GAME_COMPLETED) {
        return action.game;
    }
    return state;
};

// Resultado del reset de la partida
const reset = (state = initialState.reset, action) => {
    if (action.type === actionTypes.RESET_GAME_COMPLETED) {
        return action.reset;
    }
    return state;
};

const reducer = combineReducers({
    gameId,
    game,
    cells,
    words,
    userInput,
    cell,
    word,
    gameCompleted,
    reset,
});

export default reducer;
