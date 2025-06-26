// src/modules/f1impostor/actions.js
import backend from "../../backend";
import * as actionTypes from "./actionTypes";

import { getUser } from "../users/selectors";

export const startF1ImpostorGame = () => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());
  backend.f1ImpostorService.startGame(lang, user.id, game =>
    dispatch({ type: actionTypes.START_F1_IMPOSTOR_GAME_COMPLETED, game })
  );
};


export const validateF1ImpostorSelection = (request) => dispatch =>
  backend.f1ImpostorService.validateSelection(request, game =>
    dispatch({ type: actionTypes.VALIDATE_F1_IMPOSTOR_COMPLETED, game })
  );

export const getF1ImpostorStatus = (gameId) => dispatch =>
  backend.f1ImpostorService.getGameStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_F1_IMPOSTOR_STATUS_COMPLETED, game })
  );
