import * as actionTypes from "./actionTypes";

const initialState = {
  game: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.CREATE_RONDO_GAME_COMPLETED:
    case actionTypes.GET_RONDO_GAME_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.ANSWER_RONDO_LETTER_COMPLETED:
      return {
        ...state,
        game: {
          ...state.game,
          letters: state.game.letters.map(l =>
            l.letter === action.letterResult.letter ? action.letterResult : l
          )
        }
      };

    case actionTypes.SKIP_RONDO_LETTER_COMPLETED:
      return {
        ...state,
        game: {
          ...state.game,
          letters: state.game.letters.map(l =>
            l.letter === action.letter ? { ...l, status: "SKIPPED" } : l
          )
        }
      };

    case actionTypes.COMPLETE_RONDO_GAME_COMPLETED:
      return {
        ...state,
        game: {
          ...state.game,
          status: "COMPLETED"
        }
      };

    default:
      return state;
  }
};

export default reducer;