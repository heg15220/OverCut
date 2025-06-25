import * as actionTypes from "./actionTypes";
import backend from "../../backend";

export const fetchCooldown = (gameType) => dispatch => {
  backend.cooldownService.checkCooldown(
    gameType,
    res => dispatch({ type: actionTypes.FETCH_COOLDOWN_SUCCESS, gameType, payload: res }),
    err => dispatch({ type: actionTypes.FETCH_COOLDOWN_FAILURE, gameType, error: err })
  );
};
