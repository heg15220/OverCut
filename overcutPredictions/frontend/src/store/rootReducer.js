import { combineReducers } from 'redux';
import app from '../modules/app';
// Agrega solo los módulos que uses realmente en f1Hub
import predictions from "../modules/predictions";


const rootReducer = combineReducers({
  app: app.reducer,
  predictions: predictions.reducer,
});

export default rootReducer;
