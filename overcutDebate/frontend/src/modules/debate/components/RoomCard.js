// src/modules/debate/components/RoomCard.jsx
import React, { useMemo } from "react";
import "./debateV2.css";

function statusMeta(status){
  switch(status){
    case "OPEN": return { label:"Inscripción", tone:"open" };
    case "POLL": return { label:"Poll", tone:"poll" };
    case "LIVE": return { label:"LIVE", tone:"live" };
    default: return { label:"Cerrada", tone:"closed" };
  }
}

export default function RoomCard({ room, onOpen }) {
  const meta = statusMeta(room.status);

  const join = Math.max(0, room.secondsRemainingToJoin ?? 0);
  const poll = Math.max(0, room.secondsRemainingToPollEnd ?? 0);

  const primaryTime = room.status === "OPEN" ? join : room.status === "POLL" ? poll : 0;
  const timeLabel = room.status === "OPEN" ? "Cierra en" : room.status === "POLL" ? "Poll termina en" : "";

  const canEnter = room.status !== "CLOSED";
  const cta =
    room.status === "OPEN" ? "Unirme" :
    room.status === "POLL" ? "Entrar (votar)" :
    room.status === "LIVE" ? "Entrar (LIVE)" : "Cerrada";

  const progress = useMemo(() => {
    // barra simple visual: asumimos join window 120 y poll 30 por config; si cambias config, pásalo desde backend
    const denom = room.status === "OPEN" ? 120 : room.status === "POLL" ? 30 : 1;
    return Math.min(100, Math.max(0, (primaryTime / denom) * 100));
  }, [room.status, primaryTime]);

  return (
    <button className="ocD-roomCard" onClick={canEnter ? onOpen : undefined} disabled={!canEnter}>
      <div className="ocD-roomTop">
        <span className={`ocD-pill ${meta.tone}`}>{meta.label}</span>
        <span className="ocD-muted">👥 {room.participantsCount}</span>
      </div>

      <div className="ocD-roomTopic">{room.topic}</div>

      {room.status === "OPEN" || room.status === "POLL" ? (
        <>
          <div className="ocD-roomTime">
            <span className="ocD-muted">{timeLabel}</span>
            <span className="ocD-time">{primaryTime}s</span>
          </div>
          <div className="ocD-progress">
            <div className="ocD-progressBar" style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <div className="ocD-roomTime">
          <span className="ocD-muted">
            {room.status === "LIVE" ? "🔥 Debate en curso" : "Finalizada"}
          </span>
        </div>
      )}

      <div className="ocD-roomCtaRow">
        <span className="ocD-cta">{cta} →</span>
      </div>
    </button>
  );
}
