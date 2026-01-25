import * as actionTypes from "./actionTypes";

const initialState = { game: null };

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_HIGHER_LOWER_COMPLETED:
    case actionTypes.GUESS_HIGHER_LOWER_COMPLETED:
    case actionTypes.GET_HIGHER_LOWER_STATUS_COMPLETED:
      return { ...state, game: action.game };
    default:
      return state;
  }
}
