// src/modules/debate/components/DebateRoomPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import * as actions from "../actions";
import * as selectors from "../selectors";
import { createDebateWsClient } from "../ws/debateWsClient";

import DebatePollBox from "./DebatePollBox";
import DebateChatBox from "./DebateChatBox";
import "./Debate.css";

const toMs = (v) => {
  if (v == null) return Date.now();

  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;

  const asNum = Number(v);
  if (!Number.isNaN(asNum)) return asNum < 1e12 ? asNum * 1000 : asNum;

  const t = new Date(v).getTime();
  return Number.isNaN(t) ? Date.now() : t;
};

const formatHHMM = (ms) => {
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Prefijo “embebido” para reply dentro del text (sin backend)
const makeReplyPrefix = ({ userName, ts, text }) => {
  const snippet = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
  // OJO: evitamos caracteres raros que rompan el parseo
  const safeUser = String(userName || "").replace(/\|/g, " ");
  const safeSnippet = snippet.replace(/\]\]/g, "] ]").replace(/\|/g, " ");
  return `[[replyTo:${safeUser}|${ts}|${safeSnippet}]]\n`;
};

const parseReplyPrefix = (rawText) => {
  const text = String(rawText || "");
  const m = text.match(/^\[\[replyTo:(.*?)\|(.*?)\|(.*?)\]\]\n([\s\S]*)$/);
  if (!m) return null;

  const userName = m[1] || "";
  const ts = toMs(m[2]);
  const snippet = m[3] || "";
  const body = m[4] || "";

  return { reply: { userName, ts, snippet }, body };
};

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

  const me = useSelector(selectors.getMe);
  const myName = me?.userName || me?.username || me?.name || null;

  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef(null);

  // ✅ reply state
  const [replyTo, setReplyTo] = useState(null); // { key, userName, ts, text }

  useEffect(() => {
    dispatch(actions.getRoomDetail(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!room) return;
    if (room.status === "CLOSED") return;

    const t = setInterval(() => dispatch(actions.getRoomDetail(id)), 1000);
    return () => clearInterval(t);
  }, [dispatch, id, room?.status]);

  useEffect(() => {
    if (joined) dispatch(actions.fetchRoomMessages(id, 50));
  }, [dispatch, id, joined]);

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
      ts: toMs(m.createdAt),
    }));

    const l = (live || []).map((m, idx) => ({
      key: `l-${idx}-${m.timestamp || m.createdAt || idx}`,
      userName: m.userName,
      text: m.text,
      ts: toMs(m.timestamp ?? m.createdAt ?? m.ts),
    }));

    return [...h, ...l].sort((a, b) => a.ts - b.ts);
  }, [history, live]);

  const statusLower = (status || "closed").toLowerCase();

  return (
    <div className="debate-home">
      <div className="debate-home__content">
        <header className="debate-home__header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div className="debate-home__title">Room #{id}</div>
              <div className="debate-home__subtitle">{room?.topic ? room.topic : "Cargando sala..."}</div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn--ghost" onClick={() => navigate("/debate")} type="button">
                ← Back
              </button>
              <button className="btn btn--primary" onClick={() => dispatch(actions.getRoomDetail(id))} type="button">
                Refresh
              </button>
            </div>
          </div>
        </header>

        {!room ? (
          <div className="rooms__hint">Loading room...</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <span className={`room-badge ${statusLower}`}>{status}</span>
              <span className="room-pill">👥 {room.participantsCount}</span>

              {status === "OPEN" && <span className="room-pill">Join remaining: {room.secondsRemainingToJoin}s</span>}
              {status === "POLL" && <span className="room-pill">Poll remaining: {room.secondsRemainingToPollEnd}s</span>}
            </div>

            {joinErr?.message && (
              <div className="room-pill" style={{ borderColor: "rgba(255,77,109,0.35)" }}>
                ⚠️ {joinErr.message}
              </div>
            )}

            <div style={{ marginTop: 10, marginBottom: 12 }}>
              {canJoin ? (
                <button
                  className="btn btn--primary"
                  disabled={joining}
                  onClick={() =>
                    dispatch(
                      actions.joinRoom(
                        id,
                        () => {
                          dispatch(actions.getRoomDetail(id));
                          dispatch(actions.fetchRoomMessages(id, 50));
                        },
                        () => dispatch(actions.getRoomDetail(id))
                      )
                    )
                  }
                  type="button"
                >
                  {joining ? "Uniéndote..." : joinLabel}
                </button>
              ) : joined ? (
                <span className="room-pill">✅ Unido {wsReady ? "(WS conectado)" : "(WS conectando...)"}</span>
              ) : (
                <span className="rooms__hint">{status === "CLOSED" ? "Sala cerrada." : "Cargando..."}</span>
              )}
            </div>

            <DebatePollBox
              status={status}
              joined={joined}
              pollAnswer={pollAnswer}
              onAnswer={(ans) => dispatch(actions.answerPoll(id, ans, () => dispatch(actions.getRoomDetail(id))))}
            />

            <div className="chat" style={{ marginTop: 14 }}>
              <div className="chat__header">
                <div className="chat__avatar">{(room?.topic || "D").slice(0, 1).toUpperCase()}</div>

                <div className="chat__headtext">
                  <div className="chat__title">{room.topic}</div>
                  <div className="chat__subtitle">
                    {joined ? "Estás dentro" : "Únete para ver y participar"} · Status: <b>{status}</b>
                  </div>
                </div>

                <div className="chat__actions">
                  <button className="icon-btn" onClick={() => dispatch(actions.getRoomDetail(id))} type="button" title="Refresh">
                    ⟳
                  </button>
                </div>
              </div>

              <div className="chat__messages">
                {(!mergedMessages || mergedMessages.length === 0) && <div className="chat__day">No messages yet</div>}

                {(mergedMessages || []).map((m) => {
                  const mine = myName && m.userName === myName;
                  const parsed = parseReplyPrefix(m.text);
                  const body = parsed ? parsed.body : m.text;
                  const reply = parsed ? parsed.reply : null;

                  const isSelected = replyTo?.key === m.key;

                  return (
                    <div
                      key={m.key}
                      className={`msg ${mine ? "msg--out" : "msg--in"} ${isSelected ? "msg--selected" : ""}`}
                    >
                      <div style={{ display: "grid" }}>
                        {!mine && <div className="msg__name">{m.userName}</div>}

                        <div
                          className="msg__bubble"
                          title="Click para responder"
                          onClick={() => setReplyTo({ key: m.key, userName: m.userName, ts: m.ts, text: body })}
                          role="button"
                        >
                          {/* bloque de reply embebido */}
                          {reply && (
                            <div className="msg__reply">
                              <div className="msg__replyTop">
                                <span className="msg__replyUser">{reply.userName}</span>
                                <span className="msg__replyTime">{formatHHMM(reply.ts)}</span>
                              </div>
                              <div className="msg__replySnippet">{reply.snippet}</div>
                            </div>
                          )}

                          <div className="msg__text">{body}</div>

                          <div className="msg__meta">
                            <span>{formatHHMM(m.ts)}</span>
                            {mine && <span className="msg__check">✓✓</span>}
                          </div>

                          <button
                            className="msg__replyBtn"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReplyTo({ key: m.key, userName: m.userName, ts: m.ts, text: body });
                            }}
                            title="Responder"
                          >
                            ↩
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="chat__composer">
                {!joined ? (
                  <div className="rooms__hint">Únete a la sala para ver mensajes.</div>
                ) : (
                  <DebateChatBox
                    status={status}
                    replyTo={replyTo}
                    onClearReply={() => setReplyTo(null)}
                    onSend={(text, onDone, onError) => {
                      const cleaned = String(text || "").trim();
                      if (!cleaned) return;

                      const finalText = replyTo
                        ? makeReplyPrefix({ userName: replyTo.userName, ts: replyTo.ts, text: replyTo.text }) + cleaned
                        : cleaned;

                      dispatch(
                        actions.sendRoomMessage(
                          id,
                          finalText,
                          () => {
                            setReplyTo(null);
                            onDone?.();
                          },
                          onError
                        )
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
