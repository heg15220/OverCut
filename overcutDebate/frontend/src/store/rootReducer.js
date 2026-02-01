// frontend/src/rootReducer.js
import { combineReducers } from "redux";
import app from "../modules/app";

// ✅ Debate
import debate from "../modules/debate";
import users from "../modules/users";

const rootReducer = combineReducers({
  app: app.reducer,
  debate: debate.reducer,
  users: users.reducer,
});

export default rootReducer;
