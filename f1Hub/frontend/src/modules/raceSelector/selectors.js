const getModuleState = state => state.raceSelector;

export const getYears = state => getModuleState(state).years;
export const getGrandsPrix = state => getModuleState(state).grandsPrix;
export const getSessions = state => getModuleState(state).sessions;
