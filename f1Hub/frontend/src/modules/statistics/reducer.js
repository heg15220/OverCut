import * as actionTypes from "./actionTypes";

const initialState = {
  driverStandings: [],
  constructorStandings: [],
  driverWins: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_DRIVER_STANDINGS_COMPLETED:
      return { ...state, driverStandings: action.standings };
    case actionTypes.FETCH_CONSTRUCTOR_STANDINGS_COMPLETED:
      return { ...state, constructorStandings: action.standings };
    case actionTypes.FETCH_DRIVER_WINS_COMPLETED:
      return { ...state, driverWins: action.ranking };
    default:
      return state;
  }
}
