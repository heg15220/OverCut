import * as actionTypes from "./actionTypes";

const initialState = { game: null };

export default function categoryGameReducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.CATEGORY_GAME_START_COMPLETED:
    case actionTypes.CATEGORY_GAME_SUBMIT_COMPLETED:
    case actionTypes.CATEGORY_GAME_STATUS_COMPLETED:
      return { ...state, game: action.game };
    default:
      return state;
  }
}
