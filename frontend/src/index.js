import React from 'react';
import ReactDOM from 'react-dom/client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { IntlProvider } from 'react-intl';


import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap';
import './index.css';

import {store, persistor} from './store';
import backend from './backend';
import app from './modules/app';
import App from './modules/app/components/App';

import messages from './i18n/messages';

/* Configure backend proxy. */
backend.init(error => store.dispatch(app.actions.error(new backend.NetworkError())));

/* Configure i18n. */
const defaultLocale = 'en';

/* Render application. */
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
    </React.StrictMode>);
