import * as actionTypes from "./actionTypes";
import * as service from "../../backend/orderDriverService";

import { getUser } from "../users/selectors";

export const startOrderGame = () => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());

  service.startOrderGame(lang, user.id, game =>
    dispatch({ type: actionTypes.START_ORDER_GAME_COMPLETED, game })
  );
};




export const submitDriverOrder = (gameId, orderedDriverIds) => dispatch =>
  service.submitOrder({ gameId, orderedDriverIds }, game =>
    dispatch({ type: actionTypes.SUBMIT_ORDER_COMPLETED, game })
  );

export const getOrderGame = (gameId) => dispatch =>
  service.getOrderGame(gameId, game =>
    dispatch({ type: actionTypes.GET_ORDER_GAME_COMPLETED, game })
  );