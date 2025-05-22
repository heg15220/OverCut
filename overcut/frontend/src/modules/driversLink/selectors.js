const getModuleState = state => state.driversLink;

export const getDriversLinkGame = state => getModuleState(state).game;
export const getDriverSuggestions = state => getModuleState(state).driverSuggestions;
