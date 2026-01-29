const getModuleState = (state) => state.thirtySeconds;

export const getGame = (state) => getModuleState(state).game;
export const getSuggestions = (state) => getModuleState(state).suggestions;
