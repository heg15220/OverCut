import * as actionTypes from "./actionTypes";
import * as service from "../../backend/orderDriverService";

export const startOrderGame = () => dispatch =>
  service.startOrderGame(game =>
    dispatch({ type: actionTypes.START_ORDER_GAME_COMPLETED, game })
  );

export const submitDriverOrder = (gameId, orderedDriverIds) => dispatch =>
  service.submitOrder({ gameId, orderedDriverIds }, game =>
    dispatch({ type: actionTypes.SUBMIT_ORDER_COMPLETED, game })
  );

export const getOrderGame = (gameId) => dispatch =>
  service.getOrderGame(gameId, game =>
    dispatch({ type: actionTypes.GET_ORDER_GAME_COMPLETED, game })
  );