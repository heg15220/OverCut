import * as actionTypes from "./actionTypes";
import backend from "../../backend";

export const fetchChartData = (endpoint, params) => dispatch => {
  backend.chartService.getChartData(
    endpoint,
    params,
    data =>
      dispatch({
        type: actionTypes.FETCH_CHART_DATA_COMPLETED,
        endpoint: params
          ? `${endpoint}:${Object.values(params).join(":")}`
          : endpoint,
        data
      }),
    () => {}
  );
};

export const fetchChartCategories = () => dispatch => {
  backend.chartService.getChartCategories(
    data =>
      dispatch({
        type: actionTypes.FETCH_CHART_CATEGORIES_COMPLETED,
        data
      }),
    () => {}
  );
};

export const clearChartData = () => ({
  type: actionTypes.CLEAR_CHART_DATA
});

export const fetchChartFilters = () => dispatch => {
  backend.chartService.getChartFilters(
    data =>
      dispatch({
        type: actionTypes.FETCH_CHART_FILTERS_COMPLETED,
        data
      }),
    () => {}
  );
};
