import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const startDriversLinkGame = () => dispatch =>
  backend.driversLinkService.startGame(game =>
    dispatch({ type: actionTypes.START_DRIVERS_LINK_GAME_COMPLETED, game })
  );

export const guessDriver = (request) => dispatch =>
  backend.driversLinkService.guessDriver(request, game =>
    dispatch({ type: actionTypes.GUESS_DRIVER_COMPLETED, game })
  );

export const getDriversLinkStatus = (gameId) => dispatch =>
  backend.driversLinkService.getGameStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_DRIVERS_LINK_STATUS_COMPLETED, game })
  );

export const fetchDriverSuggestions = (partial) => dispatch =>
  backend.driversLinkService.autocompletePilotNames(partial, suggestions =>
    dispatch({ type: actionTypes.GET_DRIVER_SUGGESTIONS_COMPLETED, suggestions })
  );

export const clearDriverSuggestions = () => ({
  type: actionTypes.CLEAR_DRIVER_SUGGESTIONS
});

export const skipClue = (gameId) => dispatch =>
  backend.driversLinkService.skipClue(gameId, game =>
    dispatch({ type: actionTypes.GUESS_DRIVER_COMPLETED, game }) // Reutilizamos el mismo tipo
  );

