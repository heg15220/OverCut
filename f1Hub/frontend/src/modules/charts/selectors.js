const getModuleState = state => state.charts;

export const getChartByEndpoint = (state, endpoint) =>
  getModuleState(state).charts[endpoint];

export const getChartCategories = state =>
  getModuleState(state).categories;

export const getChartFilters = state =>
  getModuleState(state).filters;

export const getPerformanceBreakdown2 = (state, key) =>
  getModuleState(state).breakdowns?.[key];
