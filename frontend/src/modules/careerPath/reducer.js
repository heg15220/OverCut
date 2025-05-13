import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  driverSuggestions: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_CAREER_PATH_GAME_COMPLETED:
    case actionTypes.GUESS_DRIVER_COMPLETED:
    case actionTypes.GET_GAME_STATUS_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.GET_DRIVER_SUGGESTIONS_COMPLETED:
      return { ...state, driverSuggestions: action.suggestions };

    case actionTypes.CLEAR_DRIVER_SUGGESTIONS:
      return { ...state, driverSuggestions: [] };

    default:
      return state;
  }
}
