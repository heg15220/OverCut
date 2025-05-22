import * as actionTypes from "./actionTypes";
const initialState = {
  game: null,
  teamSuggestions: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_TEAM_GUESS_GAME_COMPLETED:
    case actionTypes.GUESS_TEAM_COMPLETED:
    case actionTypes.GET_TEAM_GUESS_STATUS_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.GET_TEAM_SUGGESTIONS_COMPLETED:
      return { ...state, teamSuggestions: action.suggestions };

    case actionTypes.CLEAR_TEAM_SUGGESTIONS:
      return { ...state, teamSuggestions: [] };

    default:
      return state;
  }
}
