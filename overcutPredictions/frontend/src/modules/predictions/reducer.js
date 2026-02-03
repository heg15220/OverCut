import * as actionTypes from "./actionTypes";

const initialState = {
  season: null,
  fromRound: null,
  totalRounds: null,

  completedRaces: [],

  driverStandings: [],
  constructorStandings: [],

  // ✅ mapping driverId -> constructorId (para sumar puntos por equipo en simulación)
  driverToConstructor: {},

  // ✅ lookup maps para mostrar nombres en UI (drivers, constructors, races)
  lookups: {
    driverNames: {},        // { [driverId]: "Forename Surname" }
    constructorNames: {},   // { [constructorId]: "Ferrari" }
    raceNamesByRound: {},   // { [round]: "Spanish Grand Prix" }
  },

  loading: false,
  error: null,
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.BOOTSTRAP_REQUESTED:
    case actionTypes.SIMULATION_REQUESTED:
    case actionTypes.SIMULATION_BATCH_REQUESTED:
      return { ...state, loading: true, error: null };

    case actionTypes.BOOTSTRAP_COMPLETED: {
      const data = action.data || {};
      const lookups = data.lookups || {};

      return {
        ...state,
        loading: false,
        error: null,

        season: data.season ?? null,
        fromRound: data.simulatedFromRound ?? null,
        totalRounds: data.totalRounds ?? null,

        completedRaces: data.completedRaces || [],

        driverStandings: data.driverStandings || [],
        constructorStandings: data.constructorStandings || [],

        // ✅ viene ya del backend (si lo añades)
        driverToConstructor: data.driverToConstructor || {},

        // ✅ lookups para UI (con defaults seguros)
        lookups: {
          driverNames: lookups.driverNames || {},
          constructorNames: lookups.constructorNames || {},
          raceNamesByRound: lookups.raceNamesByRound || {},
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

        // ✅ actualizamos solo standings (no tocamos lookups, mapping, etc.)
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
