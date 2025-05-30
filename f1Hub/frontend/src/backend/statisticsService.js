import { appFetch, fetchConfig } from "./appFetch";

export const getDriverStandings = (year, onSuccess, onError) =>
  appFetch(`/statistics/drivers/year/${year}`, fetchConfig("GET"), onSuccess, onError);

export const getConstructorStandings = (year, onSuccess, onError) =>
  appFetch(`/statistics/constructors/year/${year}`, fetchConfig("GET"), onSuccess, onError);

export const getDriverWinRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/wins`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPodiumRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/podiums`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPoleRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/poles`, fetchConfig("GET"), onSuccess, onError);

export const getDriverGrandChelemRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/grand-chelems`, fetchConfig("GET"), onSuccess, onError);

export const getDriverWinsByTeam = (constructorRef, onSuccess, onError) =>
  appFetch(`/statistics/drivers/wins/team/${constructorRef}`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPodiumsByTeam = (constructorRef, onSuccess, onError) =>
  appFetch(`/statistics/drivers/podiums/team/${constructorRef}`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPolesByTeam = (constructorRef, onSuccess, onError) =>
  appFetch(`/statistics/drivers/poles/team/${constructorRef}`, fetchConfig("GET"), onSuccess, onError);

export const getAllConstructorOptions = (onSuccess, onError) =>
  appFetch(`/statistics/constructor-options`, fetchConfig("GET"), onSuccess, onError);
