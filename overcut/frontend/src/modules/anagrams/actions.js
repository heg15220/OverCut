import * as actionTypes from "./actionTypes";
import backend from "../../backend";
import { getUser } from "../users/selectors";

export const startAnagramsGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  backend.anagramsService.startAnagramsGame(user.id, game =>
    dispatch({ type: actionTypes.START_ANAGRAMS_GAME_COMPLETED, game })
  );
};

export const guessAnagrams = request => dispatch =>
  backend.anagramsService.guessAnagrams(request, game =>
    dispatch({ type: actionTypes.GUESS_ANAGRAMS_COMPLETED, game })
  );

export const getAnagramsStatus = gameId => dispatch =>
  backend.anagramsService.getAnagramsStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_ANAGRAMS_STATUS_COMPLETED, game })
  );
