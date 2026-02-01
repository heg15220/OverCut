// src/modules/debate/components/DebateChatBox.jsx
import React, { useState } from "react";
import "./Debate.css";

export default function DebateChatBox({ status, onSend }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = status === "LIVE";

  const submit = () => {
    if (!canSend || sending) return;

    const cleaned = (text || "").trim();
    if (!cleaned) return;

    setSending(true);

    // ✅ Nuevo contrato: onSend(text, onDone, onError)
    onSend?.(
      cleaned,
      () => {
        setText("");        // ✅ limpiar solo si OK
        setSending(false);
      },
      () => {
        // ✅ si falla, NO borramos el input
        setSending(false);
      }
    );
  };

  return (
    <div className="debate-chatbox">
      <input
        className="debate-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={canSend ? "Write a message..." : "Chat disabled until LIVE"}
        disabled={!canSend || sending}
        maxLength={400}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />

      <button
        className="debate-btn"
        disabled={!canSend || sending || text.trim().length === 0}
        onClick={submit}
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
