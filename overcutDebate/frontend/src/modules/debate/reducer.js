import * as types from "./actionTypes";

const initialState = {
  // ✅ global
  loading: false,
  error: null,
  me: null,

  // ✅ por scope
  roomsByScope: {},
  myTodayOpinionByScope: {},

  // roomsById[roomId] = RoomDetailDto
  roomsById: {},

  // joinedByRoom[roomId] = true/false
  joinedByRoom: {},

  // pollAnswerByRoom[roomId] = "YES" | "NO" | null
  pollAnswerByRoom: {},

  // historyByRoom[roomId] = ChatMessageHistoryDto[]
  historyByRoom: {},

  // liveByRoom[roomId] = ws ChatMessageDto[]
  liveByRoom: {},

  // loading flags
  loadingRoomById: {},
  loadingMessagesByRoom: {},
  joiningByRoom: {},

  // errors
  joinErrorByRoom: {},
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    // -------- Global flags --------
    case types.DEBATE_SET_LOADING:
      return { ...state, loading: action.loading };

    case types.DEBATE_SET_ERROR:
      return { ...state, error: action.error };

    case types.DEBATE_CLEAR_ERROR:
      return { ...state, error: null };

    case types.DEBATE_SET_ME:
      return { ...state, me: action.me };

    case types.DEBATE_SET_MY_TODAY_OPINION:
      return {
        ...state,
        myTodayOpinionByScope: {
          ...(state.myTodayOpinionByScope || {}),
          [action.scope]: action.opinion || null,
        },
      };

    case types.DEBATE_SET_ROOMS:
      return {
        ...state,
        roomsByScope: {
          ...(state.roomsByScope || {}),
          [action.scope]: action.rooms || [],
        },
      };

    case types.DEBATE_SET_POLL_ANSWER:
      return {
        ...state,
        pollAnswerByRoom: {
          ...(state.pollAnswerByRoom || {}),
          [action.roomId]: action.pollAnswer || null,
        },
      };

    case types.DEBATE_CLEAR_LIVE:
      return {
        ...state,
        liveByRoom: {
          ...state.liveByRoom,
          [action.roomId]: [],
        },
      };

    // -------- Room detail --------
    case types.DEBATE_ROOM_DETAIL_REQUEST:
      return {
        ...state,
        loadingRoomById: { ...state.loadingRoomById, [action.roomId]: true },
      };

    case types.DEBATE_ROOM_DETAIL_SUCCESS:
      return {
        ...state,
        loadingRoomById: { ...state.loadingRoomById, [action.roomId]: false },
        roomsById: { ...state.roomsById, [action.roomId]: action.room },
      };

    case types.DEBATE_ROOM_DETAIL_FAILURE:
      return {
        ...state,
        loadingRoomById: { ...state.loadingRoomById, [action.roomId]: false },
        error: action.error,
      };

    // -------- Join room --------
    case types.DEBATE_JOIN_ROOM_REQUEST:
      return {
        ...state,
        joiningByRoom: { ...state.joiningByRoom, [action.roomId]: true },
        joinErrorByRoom: { ...state.joinErrorByRoom, [action.roomId]: null },
      };

    case types.DEBATE_JOIN_ROOM_SUCCESS:
      return {
        ...state,
        joiningByRoom: { ...state.joiningByRoom, [action.roomId]: false },
        joinedByRoom: { ...state.joinedByRoom, [action.roomId]: true },
      };

    case types.DEBATE_JOIN_ROOM_FAILURE:
      return {
        ...state,
        joiningByRoom: { ...state.joiningByRoom, [action.roomId]: false },
        joinErrorByRoom: { ...state.joinErrorByRoom, [action.roomId]: action.error },
      };

    // -------- Room messages --------
    case types.DEBATE_ROOM_MESSAGES_REQUEST:
      return {
        ...state,
        loadingMessagesByRoom: { ...state.loadingMessagesByRoom, [action.roomId]: true },
      };

    case types.DEBATE_ROOM_MESSAGES_SUCCESS:
      return {
        ...state,
        loadingMessagesByRoom: { ...state.loadingMessagesByRoom, [action.roomId]: false },
        historyByRoom: { ...state.historyByRoom, [action.roomId]: action.messages || [] },
      };

    case types.DEBATE_ROOM_MESSAGES_FAILURE:
      return {
        ...state,
        loadingMessagesByRoom: { ...state.loadingMessagesByRoom, [action.roomId]: false },
        error: action.error,
      };

    // -------- WS/live messages --------
    case types.DEBATE_LIVE_MESSAGE_RECEIVED: {
      const prev = state.liveByRoom[action.roomId] || [];
      return {
        ...state,
        liveByRoom: {
          ...state.liveByRoom,
          [action.roomId]: [...prev, action.msg],
        },
      };
    }

    default:
      return state;
  }
}
