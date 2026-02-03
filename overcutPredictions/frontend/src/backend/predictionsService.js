import { appFetch, fetchConfig } from "./appFetch";

export const bootstrapSeason = (season, fromRound, onSuccess, onErrors) =>
  appFetch(
    `/predictions/bootstrap?season=${season}&fromRound=${fromRound}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );

// ✅ NUEVO
export const bootstrapSeasonCustom = (payload, onSuccess, onErrors) =>
  appFetch(
    `/predictions/bootstrap-custom`,
    fetchConfig("POST", payload),
    onSuccess,
    onErrors
  );

export const applySimulation = (payload, onSuccess, onErrors) =>
  appFetch(
    `/predictions/simulate/apply`,
    fetchConfig("POST", payload),
    onSuccess,
    onErrors
  );

export const applySimulationBatch = (payload, onSuccess, onErrors) =>
  appFetch(
    `/predictions/simulate/apply-batch`,
    fetchConfig("POST", payload),
    onSuccess,
    onErrors
  );
