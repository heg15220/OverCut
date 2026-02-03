import React from 'react';
import ReactDOM from 'react-dom/client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { IntlProvider } from 'react-intl';

import { store, persistor } from './store';
import App from './modules/app/components/App';

import backend from './backend';
import app from './modules/app';
import messages from './i18n/messages';

// Opcional: Bootstrap si se usa
// import 'bootstrap/dist/css/bootstrap.css';
// import 'bootstrap';

// Inicializa backend con control de errores
backend.init(error => store.dispatch(app.actions.error(new backend.NetworkError())));

// Detecta idioma del navegador
const browserLocale = navigator.language.startsWith('es') ? 'es' : 'en';
const defaultLocale = browserLocale in messages ? browserLocale : 'en';
console.log("✅ index.js ejecutado");

const root = ReactDOM.createRoot(document.getElementById('root'));
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

