// actions.js
import * as actionTypes from "./actionTypes";
import backend from "../../backend";

export const bootstrap = (season, fromRound) => (dispatch) => {
  dispatch({ type: actionTypes.BOOTSTRAP_REQUESTED });

  backend.predictionsService.bootstrapSeason(
    season,
    fromRound,
    (data) => dispatch({ type: actionTypes.BOOTSTRAP_COMPLETED, data }),
    (err) => dispatch({ type: actionTypes.BOOTSTRAP_FAILED, error: err })
  );
};

export const bootstrapCustom = (payload) => (dispatch) => {
  dispatch({ type: actionTypes.BOOTSTRAP_CUSTOM_REQUESTED });

  backend.predictionsService.bootstrapSeasonCustom(
    payload,
    // ✅ el backend puede devolver { ... , customConfig } o no
    (data) => dispatch({ type: actionTypes.BOOTSTRAP_COMPLETED, data }),
    (err) => dispatch({ type: actionTypes.BOOTSTRAP_FAILED, error: err })
  );
};

export const applySimulation = (payload) => (dispatch) => {
  dispatch({ type: actionTypes.SIMULATION_REQUESTED });

  backend.predictionsService.applySimulation(
    payload,
    (data) => dispatch({ type: actionTypes.SIMULATION_UPDATED, data }),
    (err) => dispatch({ type: actionTypes.SIMULATION_FAILED, error: err })
  );
};

export const applySimulationBatch = (payload) => (dispatch) => {
  dispatch({ type: actionTypes.SIMULATION_BATCH_REQUESTED });

  backend.predictionsService.applySimulationBatch(
    payload,
    (data) => dispatch({ type: actionTypes.SIMULATION_BATCH_UPDATED, data }),
    (err) => dispatch({ type: actionTypes.SIMULATION_BATCH_FAILED, error: err })
  );
};

export const resetSimulation = () => ({
  type: actionTypes.RESET_SIMULATION,
});
