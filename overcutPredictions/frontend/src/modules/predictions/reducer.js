// reducer.js
import * as actionTypes from "./actionTypes";

const initialState = {
  mode: "db", // ✅ "db" | "custom"
  customConfig: null, // ✅ persistimos la última config custom para reabrir modal

  season: null,
  fromRound: null,
  totalRounds: null,

  completedRaces: [],

  driverStandings: [],
  constructorStandings: [],

  driverToConstructor: {},

  lookups: {
    driverNames: {},
    constructorNames: {},
    raceNamesByRound: {},
    seasonDrivers: [],
  },

  loading: false,
  error: null,
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.BOOTSTRAP_REQUESTED:
    case actionTypes.BOOTSTRAP_CUSTOM_REQUESTED:
    case actionTypes.SIMULATION_REQUESTED:
    case actionTypes.SIMULATION_BATCH_REQUESTED:
      return { ...state, loading: true, error: null };

    case actionTypes.BOOTSTRAP_COMPLETED: {
      const data = action.data || {};
      const lookups = data.lookups || {};

      const noDbData =
        (!data.totalRounds) &&
        ((data.completedRaces || []).length === 0) &&
        ((lookups.seasonDrivers || []).length === 0) &&
        (Object.keys(lookups.raceNamesByRound || {}).length === 0);

      const inferredMode =
        data.mode ||
        (data.customConfig ? "custom" : (noDbData ? "empty_db" : "db"));

      return {
        ...state,
        loading: false,
        error: null,

        mode: inferredMode,
        customConfig: data.customConfig || state.customConfig,

        season: data.season ?? null,
        fromRound: data.simulatedFromRound ?? null,
        totalRounds: data.totalRounds ?? null,

        completedRaces: data.completedRaces || [],

        driverStandings: data.driverStandings || [],
        constructorStandings: data.constructorStandings || [],

        driverToConstructor: data.driverToConstructor || {},

        lookups: {
          driverNames: lookups.driverNames || {},
          constructorNames: lookups.constructorNames || {},
          raceNamesByRound: lookups.raceNamesByRound || {},
          seasonDrivers: lookups.seasonDrivers || [],
        },
      };
    }

    case actionTypes.SIMULATION_UPDATED:
    case actionTypes.SIMULATION_BATCH_UPDATED: {
      const data = action.data || {};
      return {
        ...state,
        loading: false,
        error: null,
        driverStandings: data.driverStandings || [],
        constructorStandings: data.constructorStandings || [],
      };
    }

    case actionTypes.BOOTSTRAP_FAILED:
    case actionTypes.SIMULATION_FAILED:
    case actionTypes.SIMULATION_BATCH_FAILED:
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
