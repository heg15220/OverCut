const getModuleState = state => state.raceResults;

export const getRaceResults = state => getModuleState(state).results;
export const getQualifyingResults = state => getModuleState(state).results;
export const getSprintResults = state => getModuleState(state).results;