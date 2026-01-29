import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  suggestions: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_30S_GAME_COMPLETED:
    case actionTypes.SUBMIT_30S_GAME_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.GET_30S_SUGGESTIONS_COMPLETED:
      return { ...state, suggestions: action.suggestions };

    case actionTypes.CLEAR_30S_SUGGESTIONS:
      return { ...state, suggestions: [] };

    default:
      return state;
  }
}
