import * as actionTypes from "./actionTypes";

const initialState = { game: null };

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.TEAM_HISTORY_START_COMPLETED:
    case actionTypes.TEAM_HISTORY_GET_COMPLETED:
    case actionTypes.TEAM_HISTORY_REVEAL_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.TEAM_HISTORY_VALIDATE_COMPLETED: {
      if (!state.game || state.game.gameId !== action.gameId) return state;

      const updatedSeasons = (state.game.seasons || []).map((s) => {
        if (s.seasonYear !== action.seasonYear) return s;
        const isCorrect = !!action.res?.correct;
        const correctPosition = action.res?.correctPosition;
        return {
          ...s,
          userGuess: action.guessPosition,
          isCorrect,
          ...(correctPosition != null ? { correctPosition } : {})
        };
      });

      return {
        ...state,
        game: {
          ...state.game,
          completed: action.res?.completed ?? state.game.completed,
          seasons: updatedSeasons
        }
      };
    }

    case actionTypes.TEAM_HISTORY_CLEAR:
      return initialState;

    default:
      return state;
  }
};

export default reducer;
