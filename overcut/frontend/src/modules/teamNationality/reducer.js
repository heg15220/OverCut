import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  suggestions: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_TEAMNAT_GAME_COMPLETED:
    case actionTypes.GUESS_TEAMNAT_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.GET_TEAMNAT_SUGGESTIONS_COMPLETED:
      return { ...state, suggestions: action.suggestions };

    case actionTypes.CLEAR_TEAMNAT_SUGGESTIONS:
      return { ...state, suggestions: [] };

    default:
      return state;
  }
}
