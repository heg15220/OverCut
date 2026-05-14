// src/modules/debate/components/DebateRoomPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRepeat,
  BoxArrowInRight,
  ChatDots,
  Check2All,
  People,
  Reply,
  Wifi,
  WifiOff,
} from "react-bootstrap-icons";

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

const makeReplyPrefix = ({ userName, ts, text }) => {
  const snippet = String(text || "").replace(/\s+/g, " ").trim().slice(0, 90);
  const safeUser = String(userName || "").replace(/\|/g, " ");
  const safeSnippet = snippet.replace(/\]\]/g, "] ]").replace(/\|/g, " ");
  return `[[replyTo:${safeUser}|${ts}|${safeSnippet}]]\n`;
};

const parseReplyPrefix = (rawText) => {
  const text = String(rawText || "");
  const m = text.match(/^\[\[replyTo:(.*?)\|(.*?)\|(.*?)\]\]\n([\s\S]*)$/);
  if (!m) return null;

  return {
    reply: { userName: m[1] || "", ts: toMs(m[2]), snippet: m[3] || "" },
    body: m[4] || "",
  };
};

function roomStatusMeta(status) {
  switch (status) {
    case "OPEN":
      return {
        tone: "open",
        label: "Inscripcion abierta",
        detail: "Puedes unirte antes de que cierre el contador.",
      };
    case "POLL":
      return {
        tone: "poll",
        label: "Encuesta activa",
        detail: "Responde SI o NO. El chat empieza al terminar los 30 segundos.",
      };
    case "LIVE":
      return {
        tone: "live",
        label: "Debate en directo",
        detail: "La sala ya esta abierta para conversar.",
      };
    default:
      return {
        tone: "closed",
        label: "Sala cerrada",
        detail: "El debate ya ha finalizado.",
      };
  }
}

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
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    dispatch(actions.fetchMe());
    dispatch(actions.getRoomDetail(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!room || room.status === "CLOSED") return undefined;
    const t = setInterval(() => dispatch(actions.getRoomDetail(id)), 1000);
    return () => clearInterval(t);
  }, [dispatch, id, room?.status]);

  useEffect(() => {
    if (joined) dispatch(actions.fetchRoomMessages(id, 80));
  }, [dispatch, id, joined]);

  useEffect(() => {
    if (!joined || wsRef.current) return undefined;

    wsRef.current = createDebateWsClient({
      roomId: id,
      onConnect: () => setWsReady(true),
      onMessage: (msg) => dispatch(actions.liveMessageReceived(id, msg)),
      onError: () => setWsReady(false),
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
  const meta = roomStatusMeta(status);
  const canJoin = !!room && status !== "CLOSED" && !joined;

  const joinLabel =
    status === "LIVE"
      ? "Entrar al debate"
      : status === "POLL"
      ? "Entrar y votar"
      : status === "OPEN"
      ? "Unirme a la sala"
      : "Sala cerrada";

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

  const currentUserParticipant = useMemo(() => {
    if (!myName || !room?.participants) return null;
    return room.participants.find((p) => p.userName === myName) || null;
  }, [myName, room?.participants]);

  const displayedPollAnswer = pollAnswer || currentUserParticipant?.pollAnswer || null;

  return (
    <div className="debate-home debate-room-page">
      <div className="debate-home__content">
        <header className="room-hero">
          <div>
            <button className="text-action" onClick={() => navigate("/debate")} type="button">
              <ArrowLeft aria-hidden="true" />
              Volver al lobby
            </button>
            <span className="debate-kicker">Sala #{id}</span>
            <h1>{room?.topic || "Cargando sala..."}</h1>
            <p>{meta.detail}</p>
          </div>

          <div className="room-hero__actions">
            <span className={`status-chip status-chip--${meta.tone}`}>{meta.label}</span>
            <button
              className="icon-action"
              onClick={() => dispatch(actions.getRoomDetail(id))}
              type="button"
              title="Refrescar sala"
            >
              <ArrowRepeat aria-hidden="true" />
            </button>
          </div>
        </header>

        {!room ? (
          <div className="empty-state">
            <strong>Cargando sala...</strong>
          </div>
        ) : (
          <>
            <section className="room-status-grid">
              <div className="metric-card">
                <span>Participantes</span>
                <strong>{room.participantsCount || 0}</strong>
              </div>
              <div className="metric-card">
                <span>Inscripcion</span>
                <strong>{status === "OPEN" ? `${room.secondsRemainingToJoin || 0}s` : "Cerrada"}</strong>
              </div>
              <div className="metric-card">
                <span>Encuesta</span>
                <strong>{status === "POLL" ? `${room.secondsRemainingToPollEnd || 0}s` : status}</strong>
              </div>
              <div className="metric-card">
                <span>Conexion</span>
                <strong className="metric-card__inline">
                  {wsReady ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
                  {joined ? (wsReady ? "Online" : "Conectando") : "Fuera"}
                </strong>
              </div>
            </section>

            <section className="room-gate">
              <div>
                <span className="panel-eyebrow">Acceso</span>
                <h2>{joined ? "Estas dentro de la sala" : "Unete antes de participar"}</h2>
                <p>
                  Primero se reserva plaza. Despues, cuando la sala pase a encuesta, se vota SI o NO
                  sobre la tematica antes de abrir el chat.
                </p>
              </div>

              {canJoin ? (
                <button
                  className="primary-action"
                  disabled={joining}
                  onClick={() =>
                    dispatch(
                      actions.joinRoom(
                        id,
                        () => {
                          dispatch(actions.getRoomDetail(id));
                          dispatch(actions.fetchRoomMessages(id, 80));
                        },
                        () => dispatch(actions.getRoomDetail(id))
                      )
                    )
                  }
                  type="button"
                >
                  <BoxArrowInRight aria-hidden="true" />
                  {joining ? "Uniendo..." : joinLabel}
                </button>
              ) : (
                <span className="answer-chip">
                  <Check2All aria-hidden="true" />
                  {joined ? "Unido" : "No disponible"}
                </span>
              )}
            </section>

            {joinErr?.message && <div className="debate-alert">{joinErr.message}</div>}

            <DebatePollBox
              status={status}
              joined={joined}
              pollAnswer={displayedPollAnswer}
              secondsRemaining={room.secondsRemainingToPollEnd}
              onAnswer={(ans) => dispatch(actions.answerPoll(id, ans, () => dispatch(actions.getRoomDetail(id))))}
            />

            <section className="chat-panel">
              <div className="chat-panel__header">
                <div className="chat-panel__avatar">
                  <ChatDots aria-hidden="true" />
                </div>
                <div>
                  <span>Chat de debate</span>
                  <h2>{status === "LIVE" ? "Conversacion en directo" : "Esperando inicio del debate"}</h2>
                </div>
                <div className="chat-panel__meta">
                  <People aria-hidden="true" />
                  {room.participantsCount || 0}
                </div>
              </div>

              <div className="chat-panel__messages">
                {!joined && (
                  <div className="chat-empty">
                    Unete a la sala para cargar los mensajes y participar cuando el debate este en vivo.
                  </div>
                )}

                {joined && mergedMessages.length === 0 && (
                  <div className="chat-empty">Aun no hay mensajes en esta sala.</div>
                )}

                {joined &&
                  mergedMessages.map((m) => {
                    const mine = myName && m.userName === myName;
                    const parsed = parseReplyPrefix(m.text);
                    const body = parsed ? parsed.body : m.text;
                    const reply = parsed ? parsed.reply : null;
                    const isSelected = replyTo?.key === m.key;

                    return (
                      <article
                        key={m.key}
                        className={`message-row ${mine ? "message-row--mine" : ""} ${
                          isSelected ? "is-selected" : ""
                        }`}
                      >
                        <div className="message-bubble">
                          {!mine && <span className="message-bubble__name">{m.userName}</span>}

                          {reply && (
                            <div className="message-reply">
                              <div>
                                <strong>{reply.userName}</strong>
                                <span>{formatHHMM(reply.ts)}</span>
                              </div>
                              <p>{reply.snippet}</p>
                            </div>
                          )}

                          <p>{body}</p>

                          <footer>
                            <span>{formatHHMM(m.ts)}</span>
                            {mine && <Check2All aria-hidden="true" />}
                          </footer>

                          <button
                            className="message-reply-action"
                            type="button"
                            onClick={() => setReplyTo({ key: m.key, userName: m.userName, ts: m.ts, text: body })}
                            title="Responder"
                          >
                            <Reply aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
              </div>

              <div className="chat-panel__composer">
                {!joined ? (
                  <div className="chat-locked">Unete a la sala para escribir.</div>
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
            </section>
          </>
        )}
      </div>
    </div>
  );
}
