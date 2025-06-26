import * as actionTypes from "./actionTypes";
import * as service from "../../backend/teamGuessService";

import { getUser } from "../users/selectors";

export const startTeamGuessGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  service.startGame(user.id, game =>
    dispatch({ type: actionTypes.START_TEAM_GUESS_GAME_COMPLETED, game })
  );
};


export const guessTeam = (request) => dispatch =>
  service.guessTeam(request, game =>
    dispatch({ type: actionTypes.GUESS_TEAM_COMPLETED, game })
  );

export const getTeamGuessStatus = (gameId) => dispatch =>
  service.getGameStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_TEAM_GUESS_STATUS_COMPLETED, game })
  );

export const fetchTeamSuggestions = (partial) => dispatch =>
  service.autocompleteTeamNames(partial, suggestions =>
    dispatch({ type: actionTypes.GET_TEAM_SUGGESTIONS_COMPLETED, suggestions })
  );

export const clearTeamSuggestions = () => ({
  type: actionTypes.CLEAR_TEAM_SUGGESTIONS
});