// frontend/src/modules/debate/components/DebateRoomPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import * as actions from "../actions";
import * as selectors from "../selectors";
import { createDebateWsClient } from "../ws/debateWsClient";

import DebatePollBox from "./DebatePollBox";
import DebateChatBox from "./DebateChatBox";
import "./Debate.css";

export default function DebateRoomPage() {
  const { roomId } = useParams();
  const id = Number(roomId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const room = useSelector((s) => selectors.getRoomById(s, id));
  const joined = useSelector((s) => selectors.isJoined(s, id));
  const joining = useSelector((s) => selectors.isJoining(s, id));
  const joinErr = useSelector((s) => selectors.getJoinError(s, id));

  const pollAnswer = useSelector((s) => selectors.getPollAnswer(s, id));
  const history = useSelector((s) => selectors.getRoomHistory(s, id));
  const live = useSelector((s) => selectors.getRoomLive(s, id));

  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef(null);

  // 1) cargar detalle al entrar
  useEffect(() => {
    dispatch(actions.getRoomDetail(id));
  }, [dispatch, id]);

  // 2) auto-refresh del room para que pase OPEN->POLL->LIVE sin quedarse “pegado”
  useEffect(() => {
    if (!room) return;
    if (room.status === "CLOSED") return;

    const t = setInterval(() => {
      dispatch(actions.getRoomDetail(id));
    }, 1000);

    return () => clearInterval(t);
  }, [dispatch, id, room?.status]);

  // 3) si ya joined, carga historial
  useEffect(() => {
    if (joined) dispatch(actions.fetchRoomMessages(id, 50));
  }, [dispatch, id, joined]);

  // 4) WS: solo cuando joined
  useEffect(() => {
    if (!joined) return;
    if (wsRef.current) return;

    wsRef.current = createDebateWsClient({
      roomId: id,
      onConnect: () => setWsReady(true),
      onMessage: (msg) => dispatch(actions.liveMessageReceived(id, msg)),
      onError: () => {},
    });

    return () => {
      try {
        wsRef.current?.disconnect();
      } catch (e) {}
      wsRef.current = null;
      setWsReady(false);
    };
  }, [dispatch, id, joined]);

  const status = room?.status;

  const joinLabel =
    status === "LIVE"
      ? "Entrar al debate (LIVE)"
      : status === "POLL"
      ? "Entrar y votar (POLL)"
      : status === "OPEN"
      ? "Unirme a la sala"
      : "Sala cerrada";

  const canJoin = !!room && status !== "CLOSED" && !joined;

  const mergedMessages = useMemo(() => {
    const h = (history || []).map((m) => ({
      key: `h-${m.id}`,
      userName: m.userName,
      text: m.text,
      ts: new Date(m.createdAt).getTime(),
    }));

    const l = (live || []).map((m, idx) => ({
      key: `l-${idx}-${m.timestamp}`,
      userName: m.userName,
      text: m.text,
      ts: new Date(m.timestamp).getTime(),
    }));

    return [...h, ...l].sort((a, b) => a.ts - b.ts);
  }, [history, live]);

  return (
    <div className="debate-page">
      <div className="debate-card">
        <div className="debate-header">
          <button className="debate-btn secondary" onClick={() => navigate("/debate")}>
            ← Back
          </button>
          <h2>Room #{id}</h2>
          <button className="debate-btn" onClick={() => dispatch(actions.getRoomDetail(id))}>
            Refresh
          </button>
        </div>

        {!room ? (
          <div className="debate-empty">Loading room...</div>
        ) : (
          <>
            <div className="debate-room-meta">
              <span className={`debate-badge status-${(status || "").toLowerCase()}`}>{status}</span>
              <span className="debate-muted">Participants: {room.participantsCount}</span>

              {/* si la sala está en OPEN muestra joinRemaining, si está en POLL muestra pollRemaining */}
              {status === "OPEN" && (
                <span className="debate-muted">Join remaining: {room.secondsRemainingToJoin}s</span>
              )}
              {status === "POLL" && (
                <span className="debate-muted">Poll remaining: {room.secondsRemainingToPollEnd}s</span>
              )}
            </div>

            <div className="debate-topic big">{room.topic}</div>

            {/* error específico de join */}
            {joinErr?.message && (
              <div className="debate-error" style={{ marginTop: 10 }}>
                ⚠️ {joinErr.message}
              </div>
            )}

            {canJoin ? (
              <button
                className="debate-btn"
                disabled={joining}
                onClick={() =>
                  dispatch(
                    actions.joinRoom(
                      id,
                      () => {
                        dispatch(actions.getRoomDetail(id));
                        dispatch(actions.fetchRoomMessages(id, 50));
                      },
                      () => {
                        // si falla, refresca detalle igualmente (por si ya cerró/expiró)
                        dispatch(actions.getRoomDetail(id));
                      }
                    )
                  )
                }
              >
                {joining ? "Uniéndote..." : joinLabel}
              </button>
            ) : joined ? (
              <div className="debate-joined-ok">
                ✅ Unido {wsReady ? "(WS conectado)" : "(WS conectando...)"}
              </div>
            ) : (
              <div className="debate-muted">{status === "CLOSED" ? "Sala cerrada." : "Cargando..."}</div>
            )}

            <DebatePollBox
              status={status}
              joined={joined}
              pollAnswer={pollAnswer}
              onAnswer={(ans) =>
                dispatch(actions.answerPoll(id, ans, () => dispatch(actions.getRoomDetail(id))))
              }
            />

            <div className="debate-section">
              <h3>Chat</h3>

              {!joined && <div className="debate-muted">Únete a la sala para ver mensajes.</div>}

              {joined && (
                <>
                    <DebateChatBox
                      status={status}
                      onSend={(text, onDone, onError) =>
                        dispatch(actions.sendRoomMessage(id, text, onDone, onError))
                      }
                    />

                  <div className="debate-messages">
                    {mergedMessages.length === 0 && <div className="debate-empty">No messages yet.</div>}

                    {mergedMessages.map((m) => (
                      <div key={m.key} className="debate-msg">
                        <div className="debate-msg-user">{m.userName}</div>
                        <div className="debate-msg-text">{m.text}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
