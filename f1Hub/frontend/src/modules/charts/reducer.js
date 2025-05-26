import * as actionTypes from "./actionTypes";

const initialState = {
  charts: {},            // endpoint => ChartDataDTO
  categories: {}         // categoría => [endpoints]
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_CHART_DATA_COMPLETED:
      return {
        ...state,
        charts: {
          ...state.charts,
          [action.endpoint]: action.data
        }
      };

    case actionTypes.FETCH_CHART_CATEGORIES_COMPLETED:
      return {
        ...state,
        categories: action.data
      };

    case actionTypes.CLEAR_CHART_DATA:
      return {
        ...state,
        charts: {}
      };

    default:
      return state;
  }
}
