import * as actionTypes from "./actionTypes";
import backend from "../../backend";
import { getUser } from "../users/selectors";
import { fetchCooldown } from "../cooldown/actions";
import { getCooldownForGame } from "../cooldown/selectors";

export const startConnectionsGame = () => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());

  backend.driversConnectionsService.startConnectionsGame(lang, user.id, game =>
    dispatch({ type: actionTypes.START_CONNECTIONS_GAME_COMPLETED, game })
  );
};


export const validateGroup = (request) => dispatch =>
  backend.driversConnectionsService.validateConnectionsGroup(request, isValid =>
    dispatch({ type: actionTypes.VALIDATE_CONNECTIONS_GROUP_COMPLETED, isValid })
  );

export const revealAnswers = (gameId) => dispatch =>
  backend.driversConnectionsService.revealConnectionsAnswers(gameId, game =>
    dispatch({ type: actionTypes.REVEAL_CONNECTIONS_ANSWERS_COMPLETED, game })
  );

export const clearValidation = () => ({ type: actionTypes.CLEAR_VALIDATION_RESULT });