import * as actionTypes from "./actionTypes";

const initialState = {
  season: null,
  fromRound: null,
  completedRaces: [],
  driverStandings: [],
  constructorStandings: [],
  driverToConstructor: {},
  loading: false,
  error: null,
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.BOOTSTRAP_REQUESTED:
    case actionTypes.SIMULATION_REQUESTED:
      return { ...state, loading: true, error: null };

    case actionTypes.BOOTSTRAP_COMPLETED:
      return {
        ...state,
        loading: false,
        error: null,
        season: action.data.season,
        fromRound: action.data.simulatedFromRound,
        completedRaces: action.data.completedRaces || [],
        driverStandings: action.data.driverStandings || [],
        constructorStandings: action.data.constructorStandings || [],
      };

    case actionTypes.SIMULATION_UPDATED:
      return {
        ...state,
        loading: false,
        error: null,
        driverStandings: action.data.driverStandings || [],
        constructorStandings: action.data.constructorStandings || [],
      };

    case actionTypes.BOOTSTRAP_FAILED:
    case actionTypes.SIMULATION_FAILED:
      return {
        ...state,
        loading: false,
        error: action.error || { message: "Network error" },
      };

    case actionTypes.RESET_SIMULATION:
      return initialState;

    default:
      return state;
  }
}
