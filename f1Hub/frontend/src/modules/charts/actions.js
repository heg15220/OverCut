import * as actionTypes from "./actionTypes";
import backend from "../../backend";
import { buildChartKey } from "./utils/chartKey";


export const fetchChartData = (endpoint, params) => dispatch => {
  const key = buildChartKey(endpoint, params);

  backend.chartService.getChartData(
    endpoint,
    params,
    data => {
      console.log("📊 Datos recibidos:", data); // <—— AÑADE ESTO
      dispatch({
        type: actionTypes.FETCH_CHART_DATA_COMPLETED,
        endpoint: key,
        data
      });
    },
    err => {
      console.error("❌ Error al obtener gráfica:", err);
    }
  );
};


export const fetchPerformanceBreakdown2 = (driverId, year) => dispatch => {
  const params = { driverId, year };

  // Usa tu chartService actual (ya mete lang automáticamente)
  backend.chartService.getChartData(
    "performance-breakdown-2",
    params,
    data => {
      const key = `performance-breakdown-2_${driverId}_${year}`;
      dispatch({
        type: actionTypes.FETCH_PERFORMANCE_BREAKDOWN_2_COMPLETED,
        key,
        data
      });
    },
    err => {
      console.error("❌ Error al obtener breakdown:", err);
    }
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
