import React, { useMemo } from "react";
import { BoxArrowInRight, Broadcast, Clock, People } from "react-bootstrap-icons";

function statusMeta(status) {
  switch (status) {
    case "OPEN":
      return { label: "Inscripcion", tone: "open", action: "Unirse" };
    case "POLL":
      return { label: "Encuesta", tone: "poll", action: "Votar" };
    case "LIVE":
      return { label: "Live", tone: "live", action: "Entrar" };
    default:
      return { label: "Cerrada", tone: "closed", action: "Cerrada" };
  }
}

export default function RoomCard({ room, index, onOpen }) {
  const meta = statusMeta(room.status);
  const join = Math.max(0, room.secondsRemainingToJoin ?? 0);
  const poll = Math.max(0, room.secondsRemainingToPollEnd ?? 0);
  const remaining = room.status === "OPEN" ? join : room.status === "POLL" ? poll : 0;
  const canEnter = room.status !== "CLOSED";

  const progress = useMemo(() => {
    const total = room.status === "OPEN" ? 120 : room.status === "POLL" ? 30 : 1;
    return Math.min(100, Math.max(0, (remaining / total) * 100));
  }, [remaining, room.status]);

  const timerLabel =
    room.status === "OPEN" ? "Cierra inscripcion" : room.status === "POLL" ? "Finaliza encuesta" : null;

  return (
    <button className="lobby-room" onClick={canEnter ? onOpen : undefined} disabled={!canEnter} type="button">
      <div className="lobby-room__rail">
        <span>{String(index).padStart(2, "0")}</span>
      </div>

      <div className="lobby-room__body">
        <div className="lobby-room__top">
          <span className={`status-chip status-chip--${meta.tone}`}>{meta.label}</span>
          <span className="room-stat">
            <People aria-hidden="true" />
            {room.participantsCount || 0}
          </span>
        </div>

        <h3>{room.topic}</h3>

        <div className="lobby-room__bottom">
          {timerLabel ? (
            <div className="room-timer">
              <Clock aria-hidden="true" />
              <span>{timerLabel}</span>
              <strong>{remaining}s</strong>
            </div>
          ) : (
            <div className="room-timer">
              <Broadcast aria-hidden="true" />
              <span>{room.status === "LIVE" ? "Debate en curso" : "Sala finalizada"}</span>
            </div>
          )}

          <span className="room-action">
            {meta.action}
            {canEnter && <BoxArrowInRight aria-hidden="true" />}
          </span>
        </div>

        {(room.status === "OPEN" || room.status === "POLL") && (
          <div className="room-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </button>
  );
}
