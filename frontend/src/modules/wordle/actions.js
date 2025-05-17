import * as actionTypes from "./actionTypes";
import backend from "../../backend";

export const startWordleGame = () => dispatch =>
  backend.wordleService.startF1WordleGame(game =>
    dispatch({ type: actionTypes.START_WORDLE_GAME_COMPLETED, game })
  );

export const guessWordle = request => dispatch =>
  backend.wordleService.guessF1Wordle(request, game =>
    dispatch({ type: actionTypes.GUESS_WORDLE_COMPLETED, game })
  );

export const getWordleStatus = gameId => dispatch =>
  backend.wordleService.getF1WordleStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_WORDLE_STATUS_COMPLETED, game })
  );
