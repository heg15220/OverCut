import backend from "../../backend";
import * as actionTypes from "./actionTypes";
import { getUser } from "../users/selectors";

export const startAbbreviationsGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  backend.abbreviationsService.startGame(lang, game =>
    dispatch({ type: actionTypes.START_ABBR_GAME_COMPLETED, game })
  );
};

export const guessAbbreviation = (request) => (dispatch) =>
  backend.abbreviationsService.guess(request, game =>
    dispatch({ type: actionTypes.GUESS_ABBR_COMPLETED, game })
  );

export const fetchDriverSuggestions = (partial) => (dispatch) =>
  backend.abbreviationsService.autocompletePilotNames(partial, suggestions =>
    dispatch({ type: actionTypes.GET_ABBR_SUGGESTIONS_COMPLETED, suggestions })
  );

export const clearDriverSuggestions = () => ({ type: actionTypes.CLEAR_ABBR_SUGGESTIONS });
