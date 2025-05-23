import * as actionTypes from "./actionTypes";

const initialState = {
  years: [],
  grandsPrix: [],
  sessions: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_YEARS_COMPLETED:
      return { ...state, years: action.years };

    case actionTypes.FETCH_GRANDS_PRIX_COMPLETED:
      return { ...state, grandsPrix: action.grandsPrix };

    case actionTypes.FETCH_SESSIONS_COMPLETED:
      return { ...state, sessions: action.sessions };

    default:
      return state;
  }
}
