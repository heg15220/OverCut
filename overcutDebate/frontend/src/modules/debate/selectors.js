export const getModuleState = (state) => state.debate;

export const getDebateLoading = (state) => getModuleState(state).loading;
export const getDebateError = (state) => getModuleState(state).error;

export const getMe = (state) => getModuleState(state).me;

export const getMyTodayOpinion = (state, scope = "ES") =>
  getModuleState(state).myTodayOpinionByScope?.[scope] || null;

export const getRooms = (state, scope = "ES") =>
  getModuleState(state).roomsByScope?.[scope] || [];

export const getRoomById = (state, roomId) => getModuleState(state).roomsById?.[roomId];

export const isJoined = (state, roomId) => !!getModuleState(state).joinedByRoom?.[roomId];
export const isJoining = (state, roomId) => !!getModuleState(state).joiningByRoom?.[roomId];

export const getJoinError = (state, roomId) => getModuleState(state).joinErrorByRoom?.[roomId];

export const getRoomHistory = (state, roomId) =>
  getModuleState(state).historyByRoom?.[roomId] || [];

export const getRoomLive = (state, roomId) =>
  getModuleState(state).liveByRoom?.[roomId] || [];

export const getPollAnswer = (state, roomId) =>
  getModuleState(state).pollAnswerByRoom?.[roomId] || null;
