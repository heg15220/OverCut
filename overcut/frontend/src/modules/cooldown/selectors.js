const getModuleState = state => state.cooldown;

export const getCooldownForGame = (state, gameType) => {
  const cooldown = getModuleState(state).data[gameType];
  const loading = getModuleState(state).loadingByGameType?.[gameType] ?? true;
  return {
    canPlay: cooldown ? cooldown.canPlay : false,
    secondsRemaining: cooldown ? cooldown.secondsRemaining : 0,
    loading
  };
};
