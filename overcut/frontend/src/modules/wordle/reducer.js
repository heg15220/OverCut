import * as actionTypes from "./actionTypes";

const initialState = {
  game: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_WORDLE_GAME_COMPLETED:
    case actionTypes.GUESS_WORDLE_COMPLETED:
    case actionTypes.GET_WORDLE_STATUS_COMPLETED:
      return { ...state, game: action.game };

    default:
      return state;
  }
}
