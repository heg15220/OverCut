// frontend/src/modules/debate/actions.js
import * as types from "./actionTypes";
import * as debateService from "../../backend/debateService";

// helpers
const setLoading = (loading) => ({ type: types.DEBATE_SET_LOADING, loading });
const setError = (error) => ({ type: types.DEBATE_SET_ERROR, error });

export const fetchMe = () => (dispatch) => {
  dispatch(setLoading(true));
  debateService.getMe(
    (me) => {
      dispatch({ type: types.DEBATE_SET_ME, me });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(err));
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
      dispatch(setError(err));
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
      // refresca estado local
      dispatch({ type: types.DEBATE_SET_MY_TODAY_OPINION, scope, opinion });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(err));
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
      dispatch(setError(err));
      dispatch(setLoading(false));
    }
  );
};

export const getRoomDetail = (roomId) => (dispatch) => {
  dispatch(setLoading(true));
  debateService.getRoomDetail(
    roomId,
    (room) => {
      dispatch({ type: types.DEBATE_SET_ROOM_DETAIL, room });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(err));
      dispatch(setLoading(false));
    }
  );
};

export const joinRoom = (roomId, onDone) => (dispatch) => {
  dispatch(setLoading(true));
  debateService.joinRoom(
    roomId,
    (resp) => {
      dispatch({ type: types.DEBATE_SET_JOINED, roomId, joined: true, userName: resp?.userName });
      dispatch(setLoading(false));
      if (onDone) onDone(resp);
    },
    (err) => {
      dispatch(setError(err));
      dispatch(setLoading(false));
    }
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
      dispatch(setError(err));
      dispatch(setLoading(false));
    }
  );
};

export const fetchRoomMessages = (roomId, limit = 50) => (dispatch) => {
  dispatch(setLoading(true));
  debateService.getRoomMessages(
    roomId,
    limit,
    (msgs) => {
      dispatch({ type: types.DEBATE_SET_ROOM_HISTORY, roomId, messages: msgs || [] });
      dispatch(setLoading(false));
    },
    (err) => {
      dispatch(setError(err));
      dispatch(setLoading(false));
    }
  );
};

// WS live
export const liveMessageReceived = (roomId, msg) => ({
  type: types.DEBATE_PUSH_LIVE_MESSAGE,
  roomId,
  msg,
});

export const clearLiveMessages = (roomId) => ({
  type: types.DEBATE_CLEAR_LIVE,
  roomId,
});
