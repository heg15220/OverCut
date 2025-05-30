import * as actionTypes from "./actionTypes";

const initialState = {
  driverStandings: [],
  constructorStandings: [],
  driverWins: [],
  driverPodiums: [],
  driverPoles: [],
  driverGrandChelems: [],
  driverWinsByTeam: [],
  driverPodiumsByTeam: [],
  driverPolesByTeam: [],
  years: [],
  constructors: []

};


export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_DRIVER_STANDINGS_COMPLETED:
      return { ...state, driverStandings: action.standings };
    case actionTypes.FETCH_CONSTRUCTOR_STANDINGS_COMPLETED:
      return { ...state, constructorStandings: action.standings };
    case actionTypes.FETCH_DRIVER_WINS_COMPLETED:
      return { ...state, driverWins: action.ranking };
    case actionTypes.FETCH_DRIVER_PODIUMS_COMPLETED:
      return { ...state, driverPodiums: action.ranking };
    case actionTypes.FETCH_DRIVER_POLES_COMPLETED:
      return { ...state, driverPoles: action.ranking };
    case actionTypes.FETCH_DRIVER_GRAND_CHELEMS_COMPLETED:
      return { ...state, driverGrandChelems: action.ranking };
    case actionTypes.FETCH_DRIVER_WINS_BY_TEAM_COMPLETED:
      return { ...state, driverWinsByTeam: action.ranking };
    case actionTypes.FETCH_DRIVER_PODIUMS_BY_TEAM_COMPLETED:
      return { ...state, driverPodiumsByTeam: action.ranking };
    case actionTypes.FETCH_DRIVER_POLES_BY_TEAM_COMPLETED:
      return { ...state, driverPolesByTeam: action.ranking };
    case actionTypes.FETCH_CONSTRUCTORS_COMPLETED:
      return { ...state, constructors: action.list };

    default:
      return state;
  }
}
