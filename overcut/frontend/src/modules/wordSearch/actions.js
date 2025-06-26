import * as actionTypes from "./actionTypes";
import * as service from "../../backend/wordSearchService";

import { getUser } from "../users/selectors";

export const startWordSearchGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  service.startGame(user.id, game => {
    dispatch({ type: actionTypes.START_WORDSEARCH_GAME_COMPLETED, game });
  });
};


export const getWordSearchGame = (gameId) => dispatch =>
  service.getGame(gameId, game =>
    dispatch({ type: actionTypes.GET_WORDSEARCH_GAME_COMPLETED, game })
  );

export const validateWord = (request, onSuccess) => dispatch =>
  service.validateWord(request, game => {
    // Verificamos que al menos una palabra se haya marcado como revelada
    const matched = game.words?.some(word => word.revealed && word.surname.toUpperCase() === request.attemptedSurname.toUpperCase());

    dispatch({ type: actionTypes.GET_WORDSEARCH_GAME_COMPLETED, game });

    if (matched) {
      dispatch({ type: actionTypes.ADD_FOUND_WORD, word: request.attemptedSurname });
    }

    if (onSuccess) onSuccess({ valid: matched });
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