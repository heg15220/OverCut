import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  driverSuggestions: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_TWO_TEAMS_GAME_COMPLETED:
    case actionTypes.GUESS_TWO_TEAMS_DRIVER_COMPLETED:
    case actionTypes.GET_TWO_TEAMS_STATUS_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.GET_TWO_TEAMS_DRIVER_SUGGESTIONS_COMPLETED:
      return { ...state, driverSuggestions: action.suggestions };

    case actionTypes.CLEAR_TWO_TEAMS_DRIVER_SUGGESTIONS:
      return { ...state, driverSuggestions: [] };

    default:
      return state;
  }
}
