import { combineReducers } from 'redux';
import app from '../modules/app';
// Agrega solo los módulos que uses realmente en f1Hub

const rootReducer = combineReducers({
  app: app.reducer,
  // quiz: quiz.reducer,
  // circuits: circuits.reducer,
  // analytics: analytics.reducer,
});

export default rootReducer;
