import * as actionTypes from "./actionTypes";

const initialState = {
  game: null,
  foundWords: [],
  lastValidated: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.START_WORDSEARCH_GAME_COMPLETED:
    case actionTypes.GET_WORDSEARCH_GAME_COMPLETED:
    case actionTypes.SUBMIT_WORDSEARCH_SOLUTION_COMPLETED:
    case actionTypes.REVEAL_WORDS_COMPLETED:
      return { ...state, game: action.game };

    case actionTypes.VALIDATE_WORD_COMPLETED:
      return {
        ...state,
        lastValidated: {
          word: action.attempted,
          valid: action.result.valid
        }
      };

    case actionTypes.ADD_FOUND_WORD:
      return {
        ...state,
        foundWords: [...state.foundWords, action.word]
      };

    case "wordSearch/resetFoundWords":
      return {
        ...state,
        foundWords: []
      };

    default:
      return state;
  }
}
