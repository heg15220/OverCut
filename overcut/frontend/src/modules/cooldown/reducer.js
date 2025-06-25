import * as actionTypes from "./actionTypes";

const initialState = {
  data: {} // { [gameType]: { canPlay, secondsRemaining } }
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_COOLDOWN_SUCCESS: {
      const { gameType, payload } = action;

      const existing = state.data[gameType];

      // Si ya está en cooldown y el nuevo valor es igual o mayor (es decir, reinicia), ignoramos
      if (
        existing &&
        !payload.canPlay &&
        !existing.canPlay &&
        payload.secondsRemaining >= existing.secondsRemaining
      ) {
        return state; // no hacer nada, mantener el anterior
      }

      return {
        ...state,
        data: {
          ...state.data,
          [gameType]: payload
        }
      };
    }

    default:
      return state;
  }
}
