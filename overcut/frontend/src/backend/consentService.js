// src/cookies/consentService.js
import { appFetch, fetchConfig } from "./appFetch";

// Con proxy: rutas relativas y SIN credentials
export const getConsent = (onSuccess, onErrors) =>
  appFetch("/consent", fetchConfig("GET"), onSuccess, onErrors);

export const saveConsent = (consent, onSuccess, onErrors) =>
  appFetch("/consent", fetchConfig("PUT", consent), onSuccess, onErrors);
