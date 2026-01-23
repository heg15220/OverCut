const getModuleState = (state) => state.driverSeason;

export const getDriverSeasonGame = (state) => getModuleState(state).game;

export const getDriverSeasonRounds = (state) =>
  getDriverSeasonGame(state)?.rounds || [];

export const getDriverSeasonMaxPosition = (state) =>
  getDriverSeasonGame(state)?.maxPosition || 20;

export const getDriverSeasonCompleted = (state) =>
  !!getDriverSeasonGame(state)?.completed;

export const getDriverSeasonRevealed = (state) =>
  !!getDriverSeasonGame(state)?.revealed;

// ✅ extra útiles
export const getDriverSeasonSeasonYear = (state) =>
  getDriverSeasonGame(state)?.seasonYear;

export const getDriverSeasonDriverName = (state) =>
  getDriverSeasonGame(state)?.driverName; // si lo mandas al revelar
