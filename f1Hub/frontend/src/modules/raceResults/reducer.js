import * as actionTypes from "./actionTypes";

const initialState = {
  results: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_RACE_RESULTS_COMPLETED:
    case actionTypes.FETCH_QUALIFYING_RESULTS_COMPLETED:
    case actionTypes.FETCH_SPRINT_RESULTS_COMPLETED:
      return { ...state, results: action.results };

    case actionTypes.CLEAR_RACE_RESULTS:
    case actionTypes.CLEAR_QUALIFYING_RESULTS:
    case actionTypes.CLEAR_SPRINT_RESULTS:
      return { ...state, results: [] };

    default:
      return state;
  }
}
