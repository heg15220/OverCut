// frontend/src/modules/debate/reducer.js
import * as types from "./actionTypes";

const initialState = {
  loading: false,
  error: null,

  me: null,

  // opinión "de hoy" por scope
  myTodayOpinionByScope: {
    ES: null,
    INT: null,
  },

  // rooms list por scope
  roomsByScope: {
    ES: [],
    INT: [],
  },

  // room details por id
  roomsById: {},

  // joined + poll por room
  joinedByRoomId: {},        // { [roomId]: true/false }
  pollAnswerByRoomId: {},    // { [roomId]: "YES"/"NO"/null }

  // mensajes
  historyByRoomId: {},       // { [roomId]: [ChatMessageHistoryDto] }
  liveByRoomId: {},          // { [roomId]: [ChatMessageDto] }
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case types.DEBATE_SET_LOADING:
      return { ...state, loading: !!action.loading };

    case types.DEBATE_SET_ERROR:
      return { ...state, error: action.error || null };

    case types.DEBATE_SET_ME:
      return { ...state, me: action.me || null };

    case types.DEBATE_SET_MY_TODAY_OPINION:
      return {
        ...state,
        myTodayOpinionByScope: {
          ...state.myTodayOpinionByScope,
          [action.scope]: action.opinion || null,
        },
      };

    case types.DEBATE_SET_ROOMS:
      return {
        ...state,
        roomsByScope: {
          ...state.roomsByScope,
          [action.scope]: action.rooms || [],
        },
        // opcional: indexar también en roomsById
        roomsById: (action.rooms || []).reduce((acc, r) => {
          acc[r.id] = r;
          return acc;
        }, { ...state.roomsById }),
      };

    case types.DEBATE_SET_ROOM_DETAIL:
      if (!action.room) return state;
      return {
        ...state,
        roomsById: {
          ...state.roomsById,
          [action.room.id]: action.room,
        },
      };

    case types.DEBATE_SET_JOINED:
      return {
        ...state,
        joinedByRoomId: {
          ...state.joinedByRoomId,
          [action.roomId]: !!action.joined,
        },
      };

    case types.DEBATE_SET_POLL_ANSWER:
      return {
        ...state,
        pollAnswerByRoomId: {
          ...state.pollAnswerByRoomId,
          [action.roomId]: action.pollAnswer || null,
        },
      };

    case types.DEBATE_SET_ROOM_HISTORY:
      return {
        ...state,
        historyByRoomId: {
          ...state.historyByRoomId,
          [action.roomId]: action.messages || [],
        },
      };

    case types.DEBATE_PUSH_LIVE_MESSAGE: {
      const current = state.liveByRoomId[action.roomId] || [];
      return {
        ...state,
        liveByRoomId: {
          ...state.liveByRoomId,
          [action.roomId]: [...current, action.msg],
        },
      };
    }

    case types.DEBATE_CLEAR_LIVE:
      return {
        ...state,
        liveByRoomId: {
          ...state.liveByRoomId,
          [action.roomId]: [],
        },
      };

    default:
      return state;
  }
}
