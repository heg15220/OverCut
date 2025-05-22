const getModuleState = state => state.careerPath;

export const getCareerPathGame = state => getModuleState(state).game;
export const getDriverSuggestions = state => getModuleState(state).driverSuggestions;
