import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  validation: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_TIMELINE_GAME_COMPLETED:
    case actionTypes.REVEAL_TIMELINE_COMPLETED:
      return { ...state, game: action.game, validation: null };

    case actionTypes.VALIDATE_TIMELINE_COMPLETED:
      return { ...state, validation: action.result };

    case actionTypes.CLEAR_TIMELINE_VALIDATION:
      return { ...state, validation: null };

    default:
      return state;
  }
}
