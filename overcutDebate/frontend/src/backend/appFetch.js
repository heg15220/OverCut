// src/backend/appFetch.js
import NetworkError from "./NetworkError";
import { config } from "../config/constants";

export const setServiceToken = (serviceToken) => {
  if (!serviceToken) return;
  localStorage.setItem(config.SERVICE_TOKEN_NAME, serviceToken);
};

export const getServiceToken = () => localStorage.getItem(config.SERVICE_TOKEN_NAME);

export const removeServiceToken = () => localStorage.removeItem(config.SERVICE_TOKEN_NAME);

export const fetchConfig = (method, body) => {
  const headers = {};
  const token = getServiceToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Si body es FormData NO ponemos JSON headers
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData) headers["Content-Type"] = "application/json";

  return {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  };
};

export const appFetch = (path, options, onSuccess, onErrors) => {
  const url = `${config.BASE_PATH}${path}`;

  fetch(url, options)
    .then(async (res) => {
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        onSuccess?.(data);
        return;
      }

      let payload = null;
      try { payload = await res.json(); } catch (_) {}

      onErrors?.(payload || { message: "Request failed", status: res.status });
    })
    .catch((err) => {
      onErrors?.({ message: err.message || "Network error" });
      if (onNetworkError) onNetworkError(); // ✅ SOLO aquí
    });
};


let onNetworkError = null;

export const init = (cb) => {
  onNetworkError = cb;
};

