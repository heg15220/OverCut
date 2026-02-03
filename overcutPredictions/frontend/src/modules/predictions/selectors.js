const getModuleState = (state) => state.predictions;

export const getSeason = (state) => getModuleState(state).season;
export const getFromRound = (state) => getModuleState(state).fromRound;

export const getDriverStandings = (state) => getModuleState(state).driverStandings;
export const getConstructorStandings = (state) => getModuleState(state).constructorStandings;
export const getCompletedRaces = (state) => getModuleState(state).completedRaces;

export const getLoading = (state) => getModuleState(state).loading;
export const getError = (state) => getModuleState(state).error;


// si luego guardas mapping driver->constructor
export const getDriverToConstructor = (state) => getModuleState(state).driverToConstructor;