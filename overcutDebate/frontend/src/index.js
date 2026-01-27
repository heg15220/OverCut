// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { IntlProvider } from "react-intl";

import messages from "./i18n/messages";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap";

import { store, persistor } from "./store";
import backend from "./backend";
import app from "./modules/app";
import App from "./modules/app/components/App";

/* Configure backend proxy. */
backend.init(() => store.dispatch(app.actions.error(new backend.NetworkError())));

/* Detect and apply browser language */
const browserLocale = navigator.language.startsWith("es") ? "es" : "en";
const defaultLocale = browserLocale in messages ? browserLocale : "en";

/* Render application. */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <IntlProvider locale={defaultLocale} messages={messages[defaultLocale]}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </IntlProvider>
    </Provider>
  </React.StrictMode>
);
