// frontend/src/modules/debate/selectors.js

export const getModuleState = (state) => state.debate;

export const getDebateLoading = (state) => getModuleState(state).loading;
export const getDebateError = (state) => getModuleState(state).error;

export const getMe = (state) => getModuleState(state).me;

export const getMyTodayOpinion = (state, scope = "ES") =>
  getModuleState(state).myTodayOpinionByScope?.[scope] || null;

export const getRooms = (state, scope = "ES") =>
  getModuleState(state).roomsByScope?.[scope] || [];

export const getRoomById = (state, roomId) =>
  getModuleState(state).roomsById?.[roomId] || null;

export const isJoined = (state, roomId) =>
  !!getModuleState(state).joinedByRoomId?.[roomId];

export const getPollAnswer = (state, roomId) =>
  getModuleState(state).pollAnswerByRoomId?.[roomId] || null;

export const getRoomHistory = (state, roomId) =>
  getModuleState(state).historyByRoomId?.[roomId] || [];

export const getRoomLive = (state, roomId) =>
  getModuleState(state).liveByRoomId?.[roomId] || [];
