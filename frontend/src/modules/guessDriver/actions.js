import * as actionTypes from "./actionTypes";
import backend from "../../backend";

export const startGuessDriverGame = () => dispatch =>
  backend.guessDriverService.startGuessDriverGame(game => {
    dispatch({ type: actionTypes.CREATE_GUESS_DRIVER_GAME_COMPLETED, game });
  });

export const askQuestion = (request) => dispatch =>
  backend.guessDriverService.askGuessDriverQuestion(request, question => {
    dispatch({ type: actionTypes.ASK_QUESTION_COMPLETED, question });
  });

export const guessPilot = (request) => dispatch =>
  backend.guessDriverService.guessPilot(request, game => {
    dispatch({ type: actionTypes.GUESS_PILOT_COMPLETED, game });
  });

export const getGameStatus = (gameId) => dispatch =>
  backend.guessDriverService.getGuessDriverStatus(gameId, game => {
    dispatch({ type: actionTypes.GET_GUESS_DRIVER_GAME_COMPLETED, game });
  });

export const getRecommendations = (category) => dispatch =>
  backend.guessDriverService.getGuessDriverRecommendations(category, recs => {
    dispatch({ type: actionTypes.GET_RECOMMENDATIONS_COMPLETED, recs });
  });
