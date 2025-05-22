const getModuleState = state => state.rondo;

export const getRondoGame = state => getModuleState(state).game;
export const getRondoLetters = state => getModuleState(state).game?.letters || [];