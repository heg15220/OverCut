import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  filled: {}, // { [cellId]: { driverId, driverName } }
  remainingSeconds: 60,
  queueIndex: 0,
  feedback: null,
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.START_BINGO_GAME_COMPLETED: {
      const game = action.game;

      return {
        ...state,
        game,
        filled: {},
        remainingSeconds: game?.durationSeconds ?? 60,
        queueIndex: 0,
        feedback: null,
      };
    }

    case actionTypes.TICK_BINGO_TIMER: {
      if (!state.game || state.game.finished) return state;
      return {
        ...state,
        remainingSeconds: Math.max(0, (state.remainingSeconds ?? 0) - 1),
      };
    }

    case actionTypes.SELECT_BINGO_CELL_COMPLETED: {
      const { response, request } = action;

      // si no hay juego, nada
      if (!state.game) return state;

      // ✅ si correcto: marca casilla y avanza al siguiente piloto
      if (response?.correct) {
        const maxIdx = Math.max(0, (state.game?.driversQueue?.length ?? 1) - 1);
        const nextIdx = clamp((state.queueIndex ?? 0) + 1, 0, maxIdx);

        return {
          ...state,
          filled: {
            ...state.filled,
            [String(request.cellId)]: { driverId: request.driverId, driverName: request.driverName },
          },
          queueIndex: nextIdx,
        };
      }

      // ❌ incorrecto: no avanza
      return state;
    }

    case actionTypes.NEXT_BINGO_DRIVER: {
      if (!state.game || state.game.finished) return state;

      const maxIdx = Math.max(0, (state.game?.driversQueue?.length ?? 1) - 1);
      const nextIdx = clamp((state.queueIndex ?? 0) + 1, 0, maxIdx);

      return { ...state, queueIndex: nextIdx };
    }

    case actionTypes.FINISH_BINGO_GAME_COMPLETED: {
      return {
        ...state,
        game: action.game,
      };
    }

    case actionTypes.SET_BINGO_FEEDBACK:
      return { ...state, feedback: action.feedback };

    case actionTypes.CLEAR_BINGO_FEEDBACK:
      return { ...state, feedback: null };

    case actionTypes.RESET_BINGO_STATE:
      return initialState;

    default:
      return state;
  }
};

export default reducer;
