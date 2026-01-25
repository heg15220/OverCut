const getModuleState = (state) => state.memory;

export const getMemoryGame = (state) => getModuleState(state).game;
export const getMemoryFeedback = (state) => getModuleState(state).feedback;
