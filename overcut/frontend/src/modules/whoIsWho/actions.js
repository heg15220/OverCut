import * as actionTypes from "./actionTypes";
import backend from "../../backend";
import { getUser } from "../users/selectors";
import { fetchCooldown } from "../cooldown/actions";

export const startWhoIsWhoGame = () => (dispatch, getState) => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const user = getUser(getState());

  backend.whoIsWhoService.startWhoIsWhoGame(
    lang,
    user.id,
    (game) => dispatch({ type: actionTypes.START_WHOISWHO_GAME_COMPLETED, game }),
    () => dispatch({ type: actionTypes.CLEAR_WHOISWHO_FEEDBACK })
  );
};

export const nextHint = (gameId) => (dispatch) =>
  backend.whoIsWhoService.nextWhoIsWhoHint(
    gameId,
    (game) => dispatch({ type: actionTypes.NEXT_WHOISWHO_HINT_COMPLETED, game })
  );

export const guess = (gameId, guessText) => (dispatch) =>
  backend.whoIsWhoService.guessWhoIsWho(
    { gameId, guess: guessText },
    (result) => dispatch({ type: actionTypes.GUESS_WHOISWHO_COMPLETED, result })
  );

export const reveal = (gameId) => (dispatch) =>
  backend.whoIsWhoService.revealWhoIsWho(
    gameId,
    (game) => dispatch({ type: actionTypes.REVEAL_WHOISWHO_COMPLETED, game })
  );

export const clearFeedback = () => ({ type: actionTypes.CLEAR_WHOISWHO_FEEDBACK });

export const autocomplete = (partial) => (dispatch) => {
  if (!partial || partial.trim().length < 2) {
    dispatch({ type: actionTypes.WHOISWHO_AUTOCOMPLETE_CLEARED });
    return;
  }

  backend.whoIsWhoService.autocompleteWhoIsWho(
    partial.trim(),
    (items) => dispatch({ type: actionTypes.WHOISWHO_AUTOCOMPLETE_COMPLETED, items }),
    () => dispatch({ type: actionTypes.WHOISWHO_AUTOCOMPLETE_CLEARED })
  );
};

export const clearAutocomplete = () => ({ type: actionTypes.WHOISWHO_AUTOCOMPLETE_CLEARED });
