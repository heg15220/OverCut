import backend from "../../backend";
import * as actionTypes from "./actionTypes";
import { getUser } from "../users/selectors";

export const startHigherLowerGame = () => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());
  backend.higherLowerService.startGame(lang, user.id, game =>
    dispatch({ type: actionTypes.START_HIGHER_LOWER_COMPLETED, game })
  );
};

export const guessHigherLower = (gameId, direction) => dispatch =>
  backend.higherLowerService.guess({ gameId, direction }, game =>
    dispatch({ type: actionTypes.GUESS_HIGHER_LOWER_COMPLETED, game })
  );

export const getHigherLowerStatus = (gameId) => dispatch =>
  backend.higherLowerService.getGameStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_HIGHER_LOWER_STATUS_COMPLETED, game })
  );
