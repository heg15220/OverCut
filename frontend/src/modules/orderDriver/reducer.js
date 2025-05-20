import * as actionTypes from "./actionTypes";

const initialState = {
  game: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_ORDER_GAME_COMPLETED:
    case actionTypes.SUBMIT_ORDER_COMPLETED:
    case actionTypes.GET_ORDER_GAME_COMPLETED:
      return { ...state, game: action.game };
    default:
      return state;
  }
}