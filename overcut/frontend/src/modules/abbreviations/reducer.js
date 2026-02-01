import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  suggestions: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_ABBR_GAME_COMPLETED:
    case actionTypes.GUESS_ABBR_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.GET_ABBR_SUGGESTIONS_COMPLETED:
      return { ...state, suggestions: action.suggestions };

    case actionTypes.CLEAR_ABBR_SUGGESTIONS:
      return { ...state, suggestions: [] };

    default:
      return state;
  }
}
