import * as actionTypes from "./actionTypes";

const initialState = {
  charts: {},
  categories: {},
  filters: {
    drivers: [],
    constructors: [],
    seasons: []
  },
  breakdowns: {}
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

    case actionTypes.FETCH_CHART_FILTERS_COMPLETED:
      return {
        ...state,
        filters: action.data
      };
    case actionTypes.FETCH_PERFORMANCE_BREAKDOWN_2_COMPLETED:
      return {
        ...state,
        breakdowns: {
          ...state.breakdowns,
          [action.key]: action.data
        }
      };


    default:
      return state;
  }
}
