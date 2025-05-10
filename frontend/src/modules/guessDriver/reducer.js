import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  recommendations: [],
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.CREATE_GUESS_DRIVER_GAME_COMPLETED:
    case actionTypes.GET_GUESS_DRIVER_GAME_COMPLETED:
    case actionTypes.GUESS_PILOT_COMPLETED:
      return { ...state, game: action.game };
    case actionTypes.ASK_QUESTION_COMPLETED:
      return {
        ...state,
        game: {
          ...state.game,
          questions: [...(state.game?.questions || []), action.question],
          questionCount: state.game.questionCount + 1
        }
      };
    case actionTypes.GET_RECOMMENDATIONS_COMPLETED:
      return { ...state, recommendations: action.recs };
    default:
      return state;
  }
};

export default reducer;
