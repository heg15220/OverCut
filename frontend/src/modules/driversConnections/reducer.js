import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  validationResult: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_CONNECTIONS_GAME_COMPLETED:
    case actionTypes.REVEAL_CONNECTIONS_ANSWERS_COMPLETED:
      return { ...state, game: action.game, validationResult: null };

    case actionTypes.VALIDATE_CONNECTIONS_GROUP_COMPLETED:
      return { ...state, validationResult: action.isValid };

    case actionTypes.CLEAR_VALIDATION_RESULT:
      return { ...state, validationResult: null };

    default:
      return state;
  }
}