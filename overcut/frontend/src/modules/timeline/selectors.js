const getModuleState = state => state.timeline;

export const getTimelineGame = state => getModuleState(state).game;
export const getTimelineValidation = state => getModuleState(state).validation;
