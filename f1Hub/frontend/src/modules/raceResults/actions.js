import * as actionTypes from "./actionTypes";
import backend from "../../backend";

export const fetchRaceResults = (raceId) => dispatch => {
  backend.raceResultService.getRaceResults(
    raceId,
    results => dispatch({ type: actionTypes.FETCH_RACE_RESULTS_COMPLETED, results }),
    () => {} // gestión de errores si se desea
  );
};

export const clearRaceResults = () => ({
  type: actionTypes.CLEAR_RACE_RESULTS
});