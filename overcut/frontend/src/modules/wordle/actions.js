import * as actionTypes from "./actionTypes";
import backend from "../../backend";

import { getUser } from "../users/selectors";

export const startWordleGame = () => (dispatch, getState) => {
  const user = getUser(getState());
  backend.wordleService.startF1WordleGame(user.id, game =>
    dispatch({ type: actionTypes.START_WORDLE_GAME_COMPLETED, game })
  );
};


export const guessWordle = request => dispatch =>
  backend.wordleService.guessF1Wordle(request, game =>
    dispatch({ type: actionTypes.GUESS_WORDLE_COMPLETED, game })
  );

export const getWordleStatus = gameId => dispatch =>
  backend.wordleService.getF1WordleStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_WORDLE_STATUS_COMPLETED, game })
  );
