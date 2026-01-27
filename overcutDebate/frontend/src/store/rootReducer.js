// frontend/src/rootReducer.js
import { combineReducers } from "redux";
import app from "../modules/app";

// ✅ Debate
import debate from "../modules/debate";

const rootReducer = combineReducers({
  app: app.reducer,
  debate: debate.reducer,
});

export default rootReducer;
