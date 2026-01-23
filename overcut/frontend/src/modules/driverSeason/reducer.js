import * as actionTypes from "./actionTypes";

const initialState = {
  game: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.DRIVER_SEASON_START_COMPLETED:
    case actionTypes.DRIVER_SEASON_GET_COMPLETED:
    case actionTypes.DRIVER_SEASON_REVEAL_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.DRIVER_SEASON_VALIDATE_COMPLETED: {
      if (!state.game || state.game.gameId !== action.gameId) return state;

      const updatedRounds = (state.game.rounds || []).map((r) => {
        if (r.raceId !== action.raceId) return r;

        const isCorrect = !!action.res?.correct;
        const correctPosition = action.res?.correctPosition; // normalmente no vendrá

        return {
          ...r,
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
          rounds: updatedRounds
        }
      };
    }

    case actionTypes.DRIVER_SEASON_CLEAR:
      return initialState;

    default:
      return state;
  }
};

export default reducer;
