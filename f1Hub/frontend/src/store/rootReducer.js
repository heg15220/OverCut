import { combineReducers } from 'redux';
import app from '../modules/app';
import raceResults from "../modules/raceResults";
import raceSelector from "../modules/raceSelector";
// Agrega solo los módulos que uses realmente en f1Hub

const rootReducer = combineReducers({
  app: app.reducer,
  raceResults: raceResults.reducer,
  raceSelector: raceSelector.reducer,
});

export default rootReducer;
