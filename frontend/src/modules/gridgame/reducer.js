import { combineReducers } from "redux";
import * as actionTypes from "./actionTypes";

const initialState = {
    gameId: null,
    board: null,
    validatedSlots: {},
    suggestions: null,
    revealedSlots: {},
};

const gameId = (state = initialState.gameId, action) =>
    action.type === actionTypes.CREATE_GRID_GAME_COMPLETED ? action.gameId : state;

const board = (state = initialState.board, action) =>
    action.type === actionTypes.GET_GRID_GAME_BOARD_COMPLETED ? action.board : state;

const validatedSlots = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.VALIDATE_GRID_SLOT_COMPLETED:
      return {
        ...state,
        [action.position]: {
          pilotName: action.pilotName,
          nationalityCode: action.nationalityCode
        }
      };
    case "RESET_GRID_GAME_STATE":
      return {};
    default:
      return state;
  }
};



const suggestions = (state = initialState.suggestions, action) => {
  if (action.type === "SET_GRID_PILOT_SUGGESTIONS_COMPLETED") {
    return action.suggestions;
  }
  return state;
};


const revealedSlots = (state = {}, action) => {
  switch (action.type) {
    case "REVEAL_ALL_SLOTS_COMPLETED":
      const updated = {};
      action.slots.forEach(slot => {
        updated[slot.position] = {
          pilotName: slot.pilotName,
          nationalityCode: slot.nationalityCode
        };
      });
      return updated;
    case "RESET_GRID_GAME_STATE":
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

