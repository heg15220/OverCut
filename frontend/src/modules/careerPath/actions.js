import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const startCareerPathGame = () => dispatch =>
  backend.careerPathService.startGame(game =>
    dispatch({ type: actionTypes.START_CAREER_PATH_GAME_COMPLETED, game })
  );

export const guessDriver = (request) => dispatch =>
  backend.careerPathService.guessDriver(request, game =>
    dispatch({ type: actionTypes.GUESS_DRIVER_COMPLETED, game })
  );

export const getCareerPathStatus = (gameId) => dispatch =>
  backend.careerPathService.getGameStatus(gameId, game =>
    dispatch({ type: actionTypes.GET_GAME_STATUS_COMPLETED, game })
  );

export const fetchDriverSuggestions = (partial) => dispatch =>
  backend.careerPathService.autocompletePilotNames(partial, suggestions =>
    dispatch({ type: actionTypes.GET_DRIVER_SUGGESTIONS_COMPLETED, suggestions })
  );

export const clearDriverSuggestions = () => ({
  type: actionTypes.CLEAR_DRIVER_SUGGESTIONS
});

export const skipClue = (gameId) => dispatch =>
  backend.careerPathService.skipClue(gameId, game =>
    dispatch({ type: actionTypes.GUESS_DRIVER_COMPLETED, game })
  );
