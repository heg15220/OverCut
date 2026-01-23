// src/modules/tower/reducer.js
import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  hint: null,
  themesCatalog: null, // ✅ NUEVO
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.TOWER_START_COMPLETED:
    case actionTypes.TOWER_GUESS_COMPLETED:
    case actionTypes.TOWER_STATUS_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.TOWER_HINT_COMPLETED:
      return { ...state, hint: action.hint };

    // ✅ NUEVO
    case actionTypes.TOWER_THEMES_COMPLETED:
      return { ...state, themesCatalog: action.themes };

    case actionTypes.TOWER_CLEAR:
      // OJO: normalmente queremos mantener themesCatalog para no recargar,
      // pero si prefieres limpiarlo, usa initialState tal cual.
      return { ...initialState, themesCatalog: state.themesCatalog };

    case actionTypes.TOWER_ANSWER_COMPLETED:
      return { ...state, game: action.game };


    default:
      return state;
  }
}
