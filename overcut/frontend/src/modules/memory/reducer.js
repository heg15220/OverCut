import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  feedback: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.SET_MEMORY_GAME:
      return { ...state, game: action.game, feedback: null };

    case actionTypes.VALIDATE_MEMORY_PAIR_COMPLETED: {
      if (!state.game) return state;

      const { res, request } = action;
      const { firstCardId, secondCardId } = request;

      const updatedCards = state.game.cards.map(c => {
        if (res.matchedCardIds?.includes(c.id)) return { ...c, matched: true };
        return c;
      });

      return {
        ...state,
        game: {
          ...state.game,
          cards: updatedCards,
          attemptsLeft: res.attemptsLeft,
          finished: res.finished,
          successful: res.successful
        }
      };
    }

    case actionTypes.SET_MEMORY_FEEDBACK:
      return { ...state, feedback: action.feedback };

    case actionTypes.RESET_MEMORY:
      return initialState;

    default:
      return state;
  }
}
