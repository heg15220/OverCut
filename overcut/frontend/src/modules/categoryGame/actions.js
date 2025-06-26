import * as service from "../../backend/categoryGameService";
import * as actionTypes from "./actionTypes";

export const startGame = (lang, userId) => dispatch =>
  service.startCategoryGame(lang, userId, game =>
    dispatch({ type: actionTypes.CATEGORY_GAME_START_COMPLETED, game })
  );


export const submitAnswers = (gameId, answers, lang) => dispatch =>
  service.submitCategoryAnswers({ gameId, answers, lang }, game => {
    dispatch({ type: actionTypes.CATEGORY_GAME_SUBMIT_COMPLETED, game });
  });



export const getGameStatus = (gameId) => dispatch =>
  service.getCategoryGameStatus(gameId, game =>
    dispatch({ type: actionTypes.CATEGORY_GAME_STATUS_COMPLETED, game })
  );
