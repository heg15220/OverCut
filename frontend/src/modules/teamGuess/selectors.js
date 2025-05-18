const getModuleState = state => state.teamGuess;

export const getTeamGuessGame = state => getModuleState(state).game;
export const getTeamSuggestions = state => getModuleState(state).teamSuggestions;