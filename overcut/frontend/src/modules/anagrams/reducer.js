import * as actionTypes from "./actionTypes";

const initialState = { game: null };

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_ANAGRAMS_GAME_COMPLETED:
    case actionTypes.GUESS_ANAGRAMS_COMPLETED:
    case actionTypes.GET_ANAGRAMS_STATUS_COMPLETED:
      return { ...state, game: action.game };
    default:
      return state;
  }
}
