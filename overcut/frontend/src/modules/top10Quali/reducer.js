import { combineReducers } from "redux";
import * as actionTypes from "./actionTypes";

const gameId = (state = null, action) =>
  action.type === actionTypes.CREATE_TOP10QUALI_GAME_COMPLETED ? action.gameId : state;

const board = (state = null, action) =>
  action.type === actionTypes.GET_TOP10QUALI_BOARD_COMPLETED ? action.board : state;

const validatedSlots = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.VALIDATE_TOP10QUALI_SLOT_COMPLETED:
      return {
        ...state,
        [action.position]: {
          pilotName: action.pilotName,
          nationalityCode: action.nationalityCode
        }
      };

    case actionTypes.RESET_TOP10QUALI_STATE:
      return {};

    default:
      return state;
  }
};

const suggestions = (state = [], action) => {
  switch (action.type) {
    case actionTypes.AUTOCOMPLETE_TOP10QUALI_PILOTS_COMPLETED:
      return action.suggestions;

    case actionTypes.SET_TOP10QUALI_SUGGESTIONS:
      return action.suggestions;

    default:
      return state;
  }
};

const revealedSlots = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.REVEAL_ALL_TOP10QUALI_COMPLETED: {
      const updated = {};
      action.slots.forEach(slot => {
        updated[slot.position] = { pilotName: slot.pilotName };
      });
      return updated;
    }

    case actionTypes.RESET_TOP10QUALI_STATE:
      return {};

    default:
      return state;
  }
};

export default combineReducers({
  gameId,
  board,
  validatedSlots,
  suggestions,
  revealedSlots
});
