const getModuleState = state => state.crossword;

export const createCrosswordGame = (state) => getModuleState(state).gameId;

export const getCrosswordGame = (state) => getModuleState(state).game;

export const getCrosswordCells = (state) => getModuleState(state).cells;

export const getCrosswordWords = (state) => getModuleState(state).words;


export const checkCell = (state) => getModuleState(state).cell;

export const checkWord = (state) => getModuleState(state).word;

export const checkGameCompleted = (state) => getModuleState(state).game;

export const resetCrosswordGame = (state) => getModuleState(state).reset;

export const getWordValidation = (state) => getModuleState(state).wordValidation;
