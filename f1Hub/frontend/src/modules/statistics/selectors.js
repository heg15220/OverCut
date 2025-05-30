const getModuleState = state => state.statistics;

export const getDriverStandings = state => getModuleState(state).driverStandings;
export const getConstructorStandings = state => getModuleState(state).constructorStandings;
export const getDriverWins = state => getModuleState(state).driverWins;
export const getDriverPodiums = state => getModuleState(state).driverPodiums;
export const getDriverPoles = state => getModuleState(state).driverPoles;
export const getDriverGrandChelems = state => getModuleState(state).driverGrandChelems;
export const getDriverWinsByTeam = state => getModuleState(state).driverWinsByTeam;
export const getDriverPodiumsByTeam = state => getModuleState(state).driverPodiumsByTeam;
export const getDriverPolesByTeam = state => getModuleState(state).driverPolesByTeam;
export const getConstructors = state => getModuleState(state).constructors;
