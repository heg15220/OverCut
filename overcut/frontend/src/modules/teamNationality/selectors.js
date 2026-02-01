const getModuleState = (state) => state.teamNationality;

export const getGame = (state) => getModuleState(state).game;
export const getSuggestions = (state) => getModuleState(state).suggestions;
