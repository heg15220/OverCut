// selectors.js
export const getModuleState = (state) => state.bingo;

export const getBingoGame = (state) => getModuleState(state).game;
export const getBingoFilled = (state) => getModuleState(state).filled;
export const getBingoRemainingSeconds = (state) => getModuleState(state).remainingSeconds;
export const getBingoQueueIndex = (state) => getModuleState(state).queueIndex;
export const getBingoFeedback = (state) => getModuleState(state).feedback;
