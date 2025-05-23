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

export const fetchQualifyingResults = (raceId) => dispatch => {
  backend.raceResultService.getQualifyingResults(
    raceId,
    results => dispatch({ type: actionTypes.FETCH_QUALIFYING_RESULTS_COMPLETED, results }),
    () => {}
  );
};

export const clearQualifyingResults = () => ({
  type: actionTypes.CLEAR_QUALIFYING_RESULTS
});

export const fetchSprintResults = (raceId) => dispatch => {
  backend.raceResultService.getSprintResults(
    raceId,
    results => dispatch({ type: actionTypes.FETCH_SPRINT_RESULTS_COMPLETED, results }),
    () => {}
  );
};

export const clearSprintResults = () => ({
  type: actionTypes.CLEAR_SPRINT_RESULTS
});
