import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const fetchTracking = (year) => dispatch =>
  backend.championshipService.getChampionshipTracking(
    year,
    data => dispatch({ type: actionTypes.FETCH_TRACKING_COMPLETED, data }),
    () => {}
  );
