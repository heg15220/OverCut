
const getModuleState = state => state.circuits;

export const getCircuits = state => getModuleState(state);

export const getPodium = state => getModuleState(state).podium;

export const getCircuit = state => getModuleState(state).circuit;

export const getPodiums = state => getModuleState(state).podiums;

