import * as actionTypes from "./actionTypes";
import * as service from "../../backend/wordSearchService";

export const startWordSearchGame = () => dispatch =>
  service.startGame(game =>
    dispatch({ type: actionTypes.START_WORDSEARCH_GAME_COMPLETED, game })
  );

export const getWordSearchGame = (gameId) => dispatch =>
  service.getGame(gameId, game =>
    dispatch({ type: actionTypes.GET_WORDSEARCH_GAME_COMPLETED, game })
  );

export const validateWord = (request) => dispatch =>
  service.validateWord(request, game => {
    dispatch({ type: actionTypes.GET_WORDSEARCH_GAME_COMPLETED, game }); // reusa esta acción para actualizar tablero
    dispatch({ type: actionTypes.ADD_FOUND_WORD, word: request.attemptedSurname });
  });


export const submitSolution = (request) => dispatch =>
  service.submitSolution(request, game =>
    dispatch({ type: actionTypes.SUBMIT_WORDSEARCH_SOLUTION_COMPLETED, game })
  );

export const addFoundWord = (word) => ({
  type: actionTypes.ADD_FOUND_WORD,
  word
});

export const revealWords = (request) => dispatch =>
  service.revealWords(request, game =>
    dispatch({ type: actionTypes.REVEAL_WORDS_COMPLETED, game })  // Acción para "Rendirse"
  );