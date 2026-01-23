// src/backend/driverSeasonService.js
import { appFetch, fetchConfig } from "./appFetch";

const BASE = "/driverSeason";

export const startGame = (lang, onSuccess, onErrors) =>
  appFetch(
    `${BASE}/start?lang=${encodeURIComponent(lang)}`,
    fetchConfig("POST"),
    onSuccess,
    onErrors
  );

export const getGame = (gameId, onSuccess, onErrors) =>
  appFetch(
    `${BASE}/game/${gameId}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );

export const validateGuess = (body, onSuccess, onErrors) =>
  appFetch(
    `${BASE}/validate`,
    fetchConfig("POST", body),
    onSuccess,
    onErrors
  );

export const reveal = (gameId, onSuccess, onErrors) =>
  appFetch(
    `${BASE}/reveal/${gameId}`,
    fetchConfig("POST"),
    onSuccess,
    onErrors
  );
