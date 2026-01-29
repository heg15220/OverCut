import backend from "../../backend";
import * as actionTypes from "./actionTypes";
import { getUser } from "../users/selectors";

export const startThirtySecondsGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  backend.thirtySecondsService.startGame(lang, game =>
    dispatch({ type: actionTypes.START_30S_GAME_COMPLETED, game })
  );
};

export const submitThirtySeconds = (request) => (dispatch) =>
  backend.thirtySecondsService.submit(request, game =>
    dispatch({ type: actionTypes.SUBMIT_30S_GAME_COMPLETED, game })
  );

export const fetchDriverSuggestions = (partial) => (dispatch) =>
  backend.thirtySecondsService.autocompletePilotNames(partial, suggestions =>
    dispatch({ type: actionTypes.GET_30S_SUGGESTIONS_COMPLETED, suggestions })
  );

export const clearDriverSuggestions = () => ({ type: actionTypes.CLEAR_30S_SUGGESTIONS });
