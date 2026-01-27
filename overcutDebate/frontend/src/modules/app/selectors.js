const getModuleState = (state) => state.app;

export const getLoading = (state) => getModuleState(state).loading;
export const getError = (state) => getModuleState(state).error;
