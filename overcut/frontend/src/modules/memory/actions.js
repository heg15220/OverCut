import * as actionTypes from "./actionTypes";
import backend from "../../backend";
import { fetchCooldown } from "../cooldown/actions";
import { getCooldownForGame } from "../cooldown/selectors";

export const startMemoryGame = (rows = 4, cols = 4, mode = "classic") => (dispatch) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  backend.memoryService.startMemoryGame(
    lang,
    rows,
    cols,
    mode,
    (game) => dispatch({ type: actionTypes.SET_MEMORY_GAME, game }),
    () => dispatch({
      type: actionTypes.SET_MEMORY_FEEDBACK,
      feedback: { type: "error", text: "Error starting Memory game" }
    })
  );
};

export const validateMemoryPair = (gameId, firstCardId, secondCardId) => (dispatch) => {
  const request = { gameId, firstCardId, secondCardId };

  backend.memoryService.validateMemoryPair(
    request,
    (res) => dispatch({ type: actionTypes.VALIDATE_MEMORY_PAIR_COMPLETED, res, request }),
    () => dispatch({
      type: actionTypes.SET_MEMORY_FEEDBACK,
      feedback: { type: "error", text: "Error validating pair" }
    })
  );
};

export const resetMemory = () => ({ type: actionTypes.RESET_MEMORY });
