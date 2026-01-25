const getModuleState = (state) => state.teamHistory;

export const getTeamHistoryGame = (state) => getModuleState(state).game;

export const getTeamHistorySeasons = (state) =>
  getTeamHistoryGame(state)?.seasons || [];

export const getTeamHistoryMaxPosition = (state) =>
  getTeamHistoryGame(state)?.maxPosition || 12;

export const getTeamHistoryCompleted = (state) =>
  !!getTeamHistoryGame(state)?.completed;

export const getTeamHistoryRevealed = (state) =>
  !!getTeamHistoryGame(state)?.revealed;

export const getTeamHistoryConstructorName = (state) =>
  getTeamHistoryGame(state)?.constructorName;
