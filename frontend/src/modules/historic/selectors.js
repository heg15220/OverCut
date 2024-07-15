
const getModuleState = state => state.circuits;

export const getCircuits = state => getModuleState(state).circuits;

export const getPodium = state => getModuleState(state).podium;

export const getCircuit = state => getModuleState(state).circuit;

export const getPodiums = state => getModuleState(state).podiums;

export const getVictoriesByTeam = state => getModuleState(state).victoriesByTeam;

export const getVictoriesPerCircuitAndTeam = state => getModuleState(state).victoriesCircuitsTeams;
export const getTeamsVictoriesByCircuit = state => getModuleState(state).teamVictoriesCircuit;
