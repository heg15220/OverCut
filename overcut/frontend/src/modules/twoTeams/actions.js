import backend from "../../backend";
import * as actionTypes from "./actionTypes";

import { getUser } from "../users/selectors";

export const startTwoTeamsGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  backend.twoTeamsService.startGame(user.id, game =>
    dispatch({ type: actionTypes.START_TWO_TEAMS_GAME_COMPLETED, game })
  );
};


export const guessDriver = request => dispatch =>
  backend.twoTeamsService.guessDriver(request, game =>
    dispatch({ type: actionTypes.GUESS_TWO_TEAMS_DRIVER_COMPLETED, game })
  );

export const skipPair = gameId => dispatch =>
  backend.twoTeamsService.skipPair(gameId, game =>
    dispatch({ type: actionTypes.GUESS_TWO_TEAMS_DRIVER_COMPLETED, game })
  );

export const fetchDriverSuggestions = partial => dispatch =>
  backend.twoTeamsService.autocompletePilotNames(partial, suggestions =>
    dispatch({ type: actionTypes.GET_TWO_TEAMS_DRIVER_SUGGESTIONS_COMPLETED, suggestions })
  );

export const clearDriverSuggestions = () => ({
  type: actionTypes.CLEAR_TWO_TEAMS_DRIVER_SUGGESTIONS
});
