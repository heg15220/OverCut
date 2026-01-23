import backend from "../../backend";
import * as actionTypes from "./actionTypes";
import { getUser } from "../users/selectors";


// 1) cargar catálogo de temas (para desplegables)
export const loadTowerThemes = () => (dispatch) => {
  backend.towerService.themes(
    (data) => dispatch({ type: actionTypes.TOWER_THEMES_COMPLETED, themes: data }),
    (err) => console.error("Tower themes error", err)
  );
};

// 2) arrancar partida (random o forzada)
export const startTowerGame = (themeType = null, themeKey = null) => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());

  // ✅ si no hay themeType => random
  // ✅ si hay themeType y themeKey (si aplica) => forzado
  backend.towerService.startGame(
    lang,
    themeType,
    themeKey,
    user,
    (game) => dispatch({ type: actionTypes.TOWER_START_COMPLETED, game }),
    (err) => console.error("Tower start error", err)
  );
};

export const guessTower = (gameId, driverName, driverId = null) => (dispatch, getState) => {
  const user = getUser(getState());
  backend.towerService.guess(
    { gameId, driverName, driverId },
    user,
    (game) => dispatch({ type: actionTypes.TOWER_GUESS_COMPLETED, game }),
    (err) => console.error("Tower guess error", err)
  );
};


export const requestTowerHint = (gameId) => (dispatch) => {
  backend.towerService.hint(gameId, (hint) =>
    dispatch({ type: actionTypes.TOWER_HINT_COMPLETED, hint })
  );
};

export const getTowerStatus = (gameId) => (dispatch) => {
  backend.towerService.status(gameId, (game) =>
    dispatch({ type: actionTypes.TOWER_STATUS_COMPLETED, game })
  );
};

export const clearTower = () => ({ type: actionTypes.TOWER_CLEAR });


export const answerTower = (gameId, themeType, themeKey) => (dispatch, getState) => {
  const user = getUser(getState());

  backend.towerService.answer(
    { gameId, themeType, themeKey },
    user,
    (game) => dispatch({ type: actionTypes.TOWER_ANSWER_COMPLETED, game }),
    (err) => console.error("Tower answer error", err)
  );
};
