import * as actionTypes from "./actionTypes";
import backend from "../../backend";
import { getUser } from "../users/selectors";

export const startBingoGame = () => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());

  backend.bingoService.startBingoGame(
    lang,
    user.id,
    (game) => dispatch({ type: actionTypes.START_BINGO_GAME_COMPLETED, game }),
    () =>
      dispatch({
        type: actionTypes.SET_BINGO_FEEDBACK,
        feedback: { type: "error", text: "Error starting game" },
      })
  );
};

export const selectBingoCell =
  (gameId, cellId, driverId, driverName) =>
  (dispatch) => {
    const request = { gameId, cellId, driverId, driverName };

    backend.bingoService.selectBingoCell(
      request,
      (response) => {
        // ✅ feedback con cellId (para animación por casilla)
        if (response?.correct) {
          dispatch({
            type: actionTypes.SET_BINGO_FEEDBACK,
            feedback: {
              type: "ok",
              text: "✅ Correct!",
              cellId,
            },
          });
        } else {
          // mensajes típicos del backend: INCORRECT / DRIVER_ALREADY_USED / CELL_ALREADY_FILLED
          const msg = response?.message || "INCORRECT";
          let text = "❌ Incorrect!";
          if (msg === "DRIVER_ALREADY_USED") text = "⚠️ Driver already used";
          if (msg === "CELL_ALREADY_FILLED") text = "⚠️ Cell already filled";

          dispatch({
            type: actionTypes.SET_BINGO_FEEDBACK,
            feedback: {
              type: msg === "INCORRECT" ? "bad" : "error",
              text,
              cellId,
            },
          });
        }

        dispatch({ type: actionTypes.SELECT_BINGO_CELL_COMPLETED, response, request });
      },
      () =>
        dispatch({
          type: actionTypes.SET_BINGO_FEEDBACK,
          feedback: { type: "error", text: "Error validating selection", cellId },
        })
    );
  };

export const finishBingoGame = (gameId) => (dispatch) => {
  backend.bingoService.finishBingoGame(
    gameId,
    (game) => dispatch({ type: actionTypes.FINISH_BINGO_GAME_COMPLETED, game }),
    () =>
      dispatch({
        type: actionTypes.SET_BINGO_FEEDBACK,
        feedback: { type: "error", text: "Error finishing game" },
      })
  );
};

export const tickBingoTimer = () => ({ type: actionTypes.TICK_BINGO_TIMER });
export const setBingoFeedback = (feedback) => ({ type: actionTypes.SET_BINGO_FEEDBACK, feedback });
export const clearBingoFeedback = () => ({ type: actionTypes.CLEAR_BINGO_FEEDBACK });

// ✅ NUEVO: saltar al siguiente piloto (flecha)
export const nextBingoDriver = () => ({ type: actionTypes.NEXT_BINGO_DRIVER });

export const resetBingoState = () => ({ type: actionTypes.RESET_BINGO_STATE });
