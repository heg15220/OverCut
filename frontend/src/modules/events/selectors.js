

const getModuleState = state => state.events;
export const getEvents = (state) => getModuleState(state).events;

export const getAllNotifications = (state) => getModuleState(state).notifications;

export const getEventDetails = (state) => getModuleState(state).event;

export const deleteEvent = (state) => getModuleState(state).event;
