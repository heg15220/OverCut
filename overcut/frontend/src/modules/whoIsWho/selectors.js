const getModuleState = (state) => state.whoIsWho;

export const getWhoIsWhoGame = (state) => getModuleState(state).game;
export const getWhoIsWhoGuessResult = (state) => getModuleState(state).guessResult;

export const getWhoIsWhoAutocompleteItems = (state) =>
  getModuleState(state).autocompleteItems || [];

export const getWhoIsWhoRevealedAnswer = (state) =>
  getModuleState(state).revealedAnswer;
