// src/modules/debate/components/ChatPanel.jsx
import React, { useMemo, useState } from "react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import "./debateV2.css";

export default function ChatPanel({ status, meUserName, mergedMessages, onSend }) {
  const [text, setText] = useState("");
  const canSend = status === "LIVE";

  const listRef = useAutoScroll([mergedMessages?.length]);

  const groups = useMemo(() => mergedMessages || [], [mergedMessages]);

  return (
    <div className="ocD-chat">
      <div className="ocD-chatHeader">
        <span className={`ocD-pill ${status?.toLowerCase?.() || "closed"}`}>{status}</span>
        <span className="ocD-muted">
          {canSend ? "Puedes debatir" : "Chat bloqueado hasta LIVE"}
        </span>
      </div>

      <div ref={listRef} className="ocD-chatList">
        {groups.length === 0 ? (
          <div className="ocD-empty" style={{ padding: 14 }}>
            <div className="ocD-emptyTitle">Sin mensajes todavía</div>
            <div className="ocD-muted">Cuando empiece LIVE verás el debate aquí.</div>
          </div>
        ) : (
          groups.map((m) => {
            const mine = meUserName && m.userName === meUserName;
            return (
              <div key={m.key} className={`ocD-msg ${mine ? "mine" : ""}`}>
                <div className="ocD-msgMeta">
                  <span className="ocD-msgUser">{m.userName}</span>
                  <span className="ocD-msgTime">
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="ocD-msgBubble">{m.text}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="ocD-chatInputRow">
        <input
          className="ocD-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={canSend ? "Escribe tu argumento…" : "Esperando a LIVE…"}
          disabled={!canSend}
          maxLength={400}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const cleaned = text.trim();
              if (!cleaned) return;
              onSend(cleaned);
              setText("");
            }
          }}
        />
        <button
          className="ocD-btn"
          disabled={!canSend || !text.trim()}
          onClick={() => {
            const cleaned = text.trim();
            if (!cleaned) return;
            onSend(cleaned);
            setText("");
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
