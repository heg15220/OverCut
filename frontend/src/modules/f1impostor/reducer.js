// src/modules/f1impostor/reducer.js
import * as actionTypes from "./actionTypes";

const initialState = {
  game: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_F1_IMPOSTOR_GAME_COMPLETED:
    case actionTypes.VALIDATE_F1_IMPOSTOR_COMPLETED:
    case actionTypes.GET_F1_IMPOSTOR_STATUS_COMPLETED:
      return { ...state, game: action.game };

    default:
      return state;
  }
}
