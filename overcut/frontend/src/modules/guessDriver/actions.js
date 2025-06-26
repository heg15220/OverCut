import * as actionTypes from "./actionTypes";
import backend from "../../backend";

import { getUser } from "../users/selectors";

export const startGuessDriverGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  backend.guessDriverService.startGuessDriverGame(user.id, game => {
    dispatch({ type: actionTypes.CREATE_GUESS_DRIVER_GAME_COMPLETED, game });
  });
};


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

export const getRecommendations = (category, lang) => dispatch =>
  backend.guessDriverService.getGuessDriverRecommendations(category, lang, recs => {
    dispatch({ type: actionTypes.GET_RECOMMENDATIONS_COMPLETED, recs });
  });

export const fetchPilotSuggestions = (partial) => dispatch =>
  backend.guessDriverService.getPilotSuggestions(partial, suggestions => {
    dispatch({ type: actionTypes.GET_PILOT_SUGGESTIONS_COMPLETED, suggestions });
  });

export const clearPilotSuggestions = () => ({
  type: actionTypes.CLEAR_PILOT_SUGGESTIONS
});
