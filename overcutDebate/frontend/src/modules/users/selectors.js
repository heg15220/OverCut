const getModuleState = (state) => state.users;

export const getUser = (state) => getModuleState(state).user;
export const isLoggedIn = (state) => getUser(state) !== null;

export const isAuthLoading = (state) =>
  !!getModuleState(state).authLoading;
