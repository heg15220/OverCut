const getModuleState = (state) => state.abbreviations;

export const getGame = (state) => getModuleState(state).game;
export const getSuggestions = (state) => getModuleState(state).suggestions;
