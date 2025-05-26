const getModuleState = state => state.charts;

export const getChartByEndpoint = (state, endpoint) =>
  getModuleState(state).charts[endpoint];

export const getChartCategories = state =>
  getModuleState(state).categories;
