// frontend/src/config/constants.js
const isDev = process.env.NODE_ENV === "development";

export const config = {
  BASE_PATH: "/f1hub/api",                 // ← cuando se haga build, es relativo
  SERVICE_TOKEN_NAME: "serviceToken"
};

