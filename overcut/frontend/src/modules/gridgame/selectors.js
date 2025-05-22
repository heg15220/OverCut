const getModuleState = state => state.gridgame;

export const createCrosswordGame = (state) => getModuleState(state).gameId;

export const getGameId = (state) => getModuleState(state).gameId;
export const getGridBoard = (state) => getModuleState(state).board;
export const getValidatedSlots = (state) => getModuleState(state).validatedSlots;
export const getPilotSuggestions = (state) => getModuleState(state).suggestions;
export const getRevealedSlots = (state) => state.gridgame.revealedSlots;
