import * as actionTypes from "./actionTypes";

const initialState = {
  data: {},
  loadingByGameType: {}
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_COOLDOWN_REQUEST: {
      return {
        ...state,
        loadingByGameType: {
          ...state.loadingByGameType,
          [action.gameType]: true
        }
      };
    }

    case actionTypes.FETCH_COOLDOWN_SUCCESS: {
      const { gameType, payload } = action;
      return {
        ...state,
        data: {
          ...state.data,
          [gameType]: payload
        },
        loadingByGameType: {
          ...state.loadingByGameType,
          [gameType]: false
        }
      };
    }

    case actionTypes.FETCH_COOLDOWN_FAILURE: {
      return {
        ...state,
        loadingByGameType: {
          ...state.loadingByGameType,
          [action.gameType]: false
        }
      };
    }

    default:
      return state;
  }
}

