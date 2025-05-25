import * as actionTypes from "./actionTypes";

const initialState = {
  tracking: []
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_TRACKING_COMPLETED:
      return { ...state, tracking: action.data };
    default:
      return state;
  }
}
