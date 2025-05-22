const getModuleState = state => state.guessDriver;

export const getGuessDriverGame = state => getModuleState(state).game;
export const getGuessDriverRecommendations = state => getModuleState(state).recommendations;
export const getGuessDriverPilotSuggestions = state => getModuleState(state).pilotSuggestions;
