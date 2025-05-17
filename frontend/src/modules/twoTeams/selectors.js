const getModuleState = state => state.twoTeams;

export const getGame = state => getModuleState(state).game;
export const getDriverSuggestions = state => getModuleState(state).driverSuggestions;
