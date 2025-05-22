const getModuleState = state => state.driversConnections;

export const getConnectionsGame = state => getModuleState(state).game;
export const getValidationResult = state => getModuleState(state).validationResult;