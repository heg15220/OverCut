const getModuleState = state => state.wordSearch;

export const getGame = state => getModuleState(state).game;
export const getFoundWords = state => getModuleState(state).foundWords;
export const getLastValidated = state => getModuleState(state).lastValidated;