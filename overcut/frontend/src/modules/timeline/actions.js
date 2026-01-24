import * as actionTypes from "./actionTypes";
import backend from "../../backend";
import { getUser } from "../users/selectors";
import { fetchCooldown } from "../cooldown/actions";

export const startTimelineGame = () => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());

  backend.timelineService.startTimelineGame(
    lang,
    user.id,
    game => dispatch({ type: actionTypes.START_TIMELINE_GAME_COMPLETED, game })
  );
};

export const validateTimeline = (request) => dispatch =>
  backend.timelineService.validateTimelineOrder(
    request,
    result => dispatch({ type: actionTypes.VALIDATE_TIMELINE_COMPLETED, result })
  );

export const revealTimeline = (gameId) => dispatch =>
  backend.timelineService.revealTimeline(gameId, game =>
    dispatch({ type: actionTypes.REVEAL_TIMELINE_COMPLETED, game })
  );

export const clearTimelineValidation = () => ({ type: actionTypes.CLEAR_TIMELINE_VALIDATION });
