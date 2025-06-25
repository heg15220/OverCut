const getModuleState = state => state.cooldown;

export const getCooldownForGame = (state, gameType) =>
  getModuleState(state).data[gameType] || { canPlay: true, secondsRemaining: 0 };
