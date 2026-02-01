import * as types from "./actionTypes";
import * as debateService from "../../backend/debateService";

// helpers
const setLoading = (loading) => ({ type: types.DEBATE_SET_LOADING, loading });
const setError = (error) => ({ type: types.DEBATE_SET_ERROR, error });

// 🔹 helper: normaliza errores (por si appFetch pasa distinto formato)
function normalizeError(err) {
  if (!err) return { message: "Unknown error" };
  if (typeof err === "string") return { message: err };
  if (err.message) return { message: err.message, ...err };
  return { message: "Request failed", ...err };
}

export const clearError = () => ({ type: types.DEBATE_CLEAR_ERROR });

export const fetchMe = () => (dispatch) => {
  dispatch(setLoading(true));
  debateService.getMe(
    (me) => {
      dispatch({ type: types.DEBATE_SET_ME, me });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(normalizeError(err)));
      dispatch(setLoading(false));
    }
  );
};

export const fetchMyTodayOpinion = (scope) => (dispatch) => {
  dispatch(setLoading(true));
  debateService.getMyTodayOpinion(
    scope,
    (opinion) => {
      dispatch({ type: types.DEBATE_SET_MY_TODAY_OPINION, scope, opinion });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(normalizeError(err)));
      dispatch(setLoading(false));
    }
  );
};

export const submitOpinion = (scope, text) => (dispatch) => {
  const cleaned = (text || "").trim();
  if (!cleaned) return;

  dispatch(setLoading(true));
  debateService.submitOpinion(
    scope,
    cleaned,
    (opinion) => {
      dispatch({ type: types.DEBATE_SET_MY_TODAY_OPINION, scope, opinion });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(normalizeError(err)));
      dispatch(setLoading(false));
    }
  );
};

export const listRoomsToday = (scope) => (dispatch) => {
  dispatch(setLoading(true));
  debateService.listRoomsToday(
    scope,
    (rooms) => {
      dispatch({ type: types.DEBATE_SET_ROOMS, scope, rooms: rooms || [] });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(normalizeError(err)));
      dispatch(setLoading(false));
    }
  );
};

export const getRoomDetail = (roomId) => (dispatch) => {
  dispatch({ type: types.DEBATE_ROOM_DETAIL_REQUEST, roomId });
  debateService.getRoomDetail(
    roomId,
    (room) => dispatch({ type: types.DEBATE_ROOM_DETAIL_SUCCESS, roomId, room }),
    (err) => dispatch({ type: types.DEBATE_ROOM_DETAIL_FAILURE, roomId, error: normalizeError(err) })
  );
};

export const answerPoll = (roomId, answer, onDone) => (dispatch) => {
  dispatch(setLoading(true));
  debateService.answerPoll(
    roomId,
    answer,
    () => {
      dispatch({ type: types.DEBATE_SET_POLL_ANSWER, roomId, pollAnswer: answer });
      dispatch(setLoading(false));
      if (onDone) onDone();
    },
    (err) => {
      dispatch(setError(normalizeError(err)));
      dispatch(setLoading(false));
    }
  );
};

export const clearLiveMessages = (roomId) => ({
  type: types.DEBATE_CLEAR_LIVE,
  roomId,
});

// ✅ join permitido en OPEN/POLL/LIVE por backend
export const joinRoom = (roomId, onSuccess, onError) => (dispatch) => {
  dispatch({ type: types.DEBATE_JOIN_ROOM_REQUEST, roomId });

  debateService.joinRoom(
    roomId,
    (res) => {
      dispatch({ type: types.DEBATE_JOIN_ROOM_SUCCESS, roomId, payload: res });
      onSuccess?.(res);
    },
    (err) => {
      const e = normalizeError(err);
      dispatch({ type: types.DEBATE_JOIN_ROOM_FAILURE, roomId, error: e });
      onError?.(e);
    }
  );
};

export const fetchRoomMessages = (roomId, limit = 50) => (dispatch) => {
  dispatch({ type: types.DEBATE_ROOM_MESSAGES_REQUEST, roomId });

  debateService.getRoomMessages(
    roomId,
    limit,
    (messages) => dispatch({ type: types.DEBATE_ROOM_MESSAGES_SUCCESS, roomId, messages }),
    (err) =>
      dispatch({
        type: types.DEBATE_ROOM_MESSAGES_FAILURE,
        roomId,
        error: normalizeError(err),
      })
  );
};

export const liveMessageReceived = (roomId, msg) => ({
  type: types.DEBATE_LIVE_MESSAGE_RECEIVED,
  roomId,
  msg,
});

export const sendRoomMessage = (roomId, text, onDone, onError) => (dispatch) => {
  const cleaned = (text || "").trim();
  if (!cleaned) return;

  dispatch(setLoading(true));

  debateService.sendRoomMessage(
    roomId,
    cleaned,
    (savedMsg) => {
      // ✅ para que aparezca instantáneo
      dispatch(liveMessageReceived(roomId, savedMsg));
      dispatch(setLoading(false));
      onDone?.();
    },
    (err) => {
      const e = normalizeError(err);
      dispatch(setError(e));
      dispatch(setLoading(false));
      onError?.(e);
    }
  );
};
