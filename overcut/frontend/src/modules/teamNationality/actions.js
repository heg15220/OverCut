import backend from "../../backend";
import * as actionTypes from "./actionTypes";
import { getUser } from "../users/selectors";

export const startTeamNationalityGame = () => (dispatch, getState) => {
  const user = getUser(getState()); // (no lo uses, pero sigues tu patrón)
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  backend.teamNationalityService.startGame(lang, (game) =>
    dispatch({ type: actionTypes.START_TEAMNAT_GAME_COMPLETED, game })
  );
};

export const guessTeamNationality = (request) => (dispatch) =>
  backend.teamNationalityService.guess(request, (game) =>
    dispatch({ type: actionTypes.GUESS_TEAMNAT_COMPLETED, game })
  );

export const fetchTeamNatSuggestions = (partial) => (dispatch) =>
  backend.teamNationalityService.autocompletePilotNames(partial, (suggestions) =>
    dispatch({ type: actionTypes.GET_TEAMNAT_SUGGESTIONS_COMPLETED, suggestions })
  );

export const clearTeamNatSuggestions = () => ({ type: actionTypes.CLEAR_TEAMNAT_SUGGESTIONS });
