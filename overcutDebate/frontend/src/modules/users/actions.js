import * as actionTypes from "./actionTypes";
import { removeServiceToken } from "../../backend/appFetch";
import { getMe as getMeApi } from "../../backend/debateService";

export const fetchMe = () => (dispatch) => {
  dispatch({ type: actionTypes.ME_STARTED });

  getMeApi(
    (data) => {
      const user = data ? {
        id: data.userId,
        userName: data.userName,
        admin: !!data.admin,
        journalist: !!data.journalist,
      } : null;

      dispatch({ type: actionTypes.ME_COMPLETED, user });
    },
    (err) => {
      const status = err?.status;
      if (status === 401 || status === 403) removeServiceToken();
      dispatch({ type: actionTypes.ME_FAILED });
      dispatch({ type: actionTypes.ME_COMPLETED, user: null });
    }
  );
};

export const logout = () => ({ type: actionTypes.LOGOUT });
