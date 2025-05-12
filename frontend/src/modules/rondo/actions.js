import * as actionTypes from "./actionTypes";
import * as rondoService from "../../backend/rondoService";

export const startRondoGame = () => dispatch => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  rondoService.startRondoGame(lang, game => {
    dispatch({ type: actionTypes.CREATE_RONDO_GAME_COMPLETED, game });
  });
};


export const getRondoGame = gameId => dispatch =>
  rondoService.getRondoGame(gameId, game => {
    dispatch({ type: actionTypes.GET_RONDO_GAME_COMPLETED, game });
  });

export const answerRondoLetter = (gameId, letter, answer) => dispatch =>
  rondoService.answerRondoLetter(gameId, letter, answer, letterResult => {
    dispatch({ type: actionTypes.ANSWER_RONDO_LETTER_COMPLETED, letterResult });
  });

export const skipRondoLetter = (gameId, letter) => dispatch =>
  rondoService.skipRondoLetter(gameId, letter, () => {
    dispatch({ type: actionTypes.SKIP_RONDO_LETTER_COMPLETED, letter });
  });

export const completeRondoGame = gameId => dispatch =>
  rondoService.completeRondoGame(gameId, () => {
    dispatch({ type: actionTypes.COMPLETE_RONDO_GAME_COMPLETED });
  });