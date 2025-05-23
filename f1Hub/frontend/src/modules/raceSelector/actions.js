import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const fetchYears = () => dispatch => {
  backend.raceSelectorService.getAvailableYears(
    years => dispatch({ type: actionTypes.FETCH_YEARS_COMPLETED, years }),
    () => {}
  );
};

export const fetchGrandsPrix = year => dispatch => {
  backend.raceSelectorService.getGrandsPrixByYear(
    year,
    grandsPrix => dispatch({ type: actionTypes.FETCH_GRANDS_PRIX_COMPLETED, grandsPrix }),
    () => {}
  );
};

export const fetchSessions = raceId => dispatch => {
  backend.raceSelectorService.getSessionsForRace(
    raceId,
    sessions => dispatch({ type: actionTypes.FETCH_SESSIONS_COMPLETED, sessions }),
    () => {}
  );
};
