const getModuleState = state => state.users; // Asegúrate de que esta línea esté apuntando al reducer correcto

export const getUser = state =>
    getModuleState(state).user;

export const isLoggedIn = state =>
    getUser(state) !== null;

export const getUserName = state =>
    isLoggedIn(state) ? getUser(state).userName : null;
// En ../../users/selectors.js
export const getUserById = (state, userId) => state.users[userId];

