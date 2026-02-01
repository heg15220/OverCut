import { combineReducers } from "redux";
import * as actionTypes from "./actionTypes";

const user = (state = null, action) => {
  switch (action.type) {
    case actionTypes.ME_COMPLETED:
      return action.user;
    case actionTypes.LOGOUT:
      return null;
    default:
      return state;
  }
};

const authLoading = (state = true, action) => {
  switch (action.type) {
    case actionTypes.ME_STARTED:
      return true;
    case actionTypes.ME_COMPLETED:
    case actionTypes.ME_FAILED:
      return false;
    case actionTypes.LOGOUT:
      return false;
    default:
      return state;
  }
};

export default combineReducers({ user, authLoading });
