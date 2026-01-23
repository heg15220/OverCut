// src/modules/tower/selectors.js
const getModuleState = (state) => state.tower;

export const getTowerGame = (state) => getModuleState(state).game;
export const getTowerHint = (state) => getModuleState(state).hint;

// ✅ NUEVO
export const getTowerThemesCatalog = (state) => getModuleState(state).themesCatalog;
