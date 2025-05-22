const getModuleState = state => state.wordle;

export const getF1WordleGame = state => getModuleState(state).game;
