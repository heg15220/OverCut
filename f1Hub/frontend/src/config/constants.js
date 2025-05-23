// frontend/src/config/constants.js
const isDev = process.env.NODE_ENV === "development";

export const config = {
  BASE_PATH: isDev
    ? "http://localhost:8082/f1hub/api"  // ← llama al backend real en desarrollo
    : "/f1hub/api",                     // ← cuando se haga build, es relativo
  SERVICE_TOKEN_NAME: "serviceToken"
};

