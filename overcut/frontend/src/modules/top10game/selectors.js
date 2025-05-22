const getState = state => state.top10game;

export const getTop10GameId = state => getState(state).gameId;
export const getTop10Board = state => getState(state).board;
export const getTop10Validated = state => getState(state).validatedSlots;
export const getTop10Suggestions = state => getState(state).suggestions;
export const getTop10Revealed = state => getState(state).revealedSlots;
