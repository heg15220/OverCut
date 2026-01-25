import * as actionTypes from "./actionTypes";
const initialState = {
  game: null,
  guessResult: null,
  autocompleteItems: [],
  revealedAnswer: null, // ✅ nombre completo cuando termina por guess
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_WHOISWHO_GAME_COMPLETED:
      return {
        ...state,
        game: action.game,
        guessResult: null,
        autocompleteItems: [],
        revealedAnswer: null,
      };

    case actionTypes.WHOISWHO_AUTOCOMPLETE_COMPLETED:
      return { ...state, autocompleteItems: action.items || [] };

    case actionTypes.WHOISWHO_AUTOCOMPLETE_CLEARED:
      return { ...state, autocompleteItems: [] };

    case actionTypes.GUESS_WHOISWHO_COMPLETED: {
      const result = action.result;
      return {
        ...state,
        guessResult: result,
        // ✅ si el backend lo devuelve cuando finished=true
        revealedAnswer: result?.answerFullName || state.revealedAnswer,
      };
    }

    case actionTypes.REVEAL_WHOISWHO_COMPLETED:
      return {
        ...state,
        game: action.game,
        // ✅ reveal te devuelve game.answer (tu DTO)
        revealedAnswer: action.game?.answer || state.revealedAnswer,
      };

    case actionTypes.NEXT_WHOISWHO_HINT_COMPLETED:
      return { ...state, game: action.game };

    default:
      return state;
  }
}
