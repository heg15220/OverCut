const getModuleState = state => state.tictactoe;

export const createGame = (state) => getModuleState(state).gameId;

export const getGame = (state) => getModuleState(state).game;

export const playMove = (state) => getModuleState(state).checkDriver;

export const getCriteria = (state) => getModuleState(state).criteria;


