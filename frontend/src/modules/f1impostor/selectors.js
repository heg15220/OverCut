// src/modules/f1impostor/selectors.js
const getModuleState = state => state.f1impostor;

export const getGame = state => getModuleState(state).game;
