const getState = state => state.top10quali;

export const getTop10QualiGameId = state => getState(state).gameId;
export const getTop10QualiBoard = state => getState(state).board;
export const getTop10QualiValidated = state => getState(state).validatedSlots;
export const getTop10QualiSuggestions = state => getState(state).suggestions;
export const getTop10QualiRevealed = state => getState(state).revealedSlots;
