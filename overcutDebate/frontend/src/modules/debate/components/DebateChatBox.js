// src/modules/debate/components/DebateChatBox.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Debate.css";

export default function DebateChatBox({ status, onSend, replyTo, onClearReply }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = status === "LIVE";

  const replySnippet = useMemo(() => {
    if (!replyTo) return "";
    return String(replyTo.text || "").replace(/\s+/g, " ").trim().slice(0, 110);
  }, [replyTo]);

  // opcional: si se activa reply, no borres texto, pero sí enfoca UX (si quieres)
  useEffect(() => {}, [replyTo]);

  const submit = () => {
    if (!canSend || sending) return;
    const cleaned = (text || "").trim();
    if (!cleaned) return;

    setSending(true);
    onSend?.(
      cleaned,
      () => {
        setText("");
        setSending(false);
      },
      () => setSending(false)
    );
  };

  return (
    <div className="chat__composerInner">
      {replyTo && (
        <div className="replybar">
          <div className="replybar__left">
            <div className="replybar__title">Respondiendo a <b>{replyTo.userName}</b></div>
            <div className="replybar__snippet">{replySnippet}</div>
          </div>

          <button
            className="replybar__close"
            type="button"
            onClick={() => onClearReply?.()}
            title="Cancelar respuesta"
          >
            ✕
          </button>
        </div>
      )}

      <input
        className="chat__input"
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
        className="send-btn"
        disabled={!canSend || sending || text.trim().length === 0}
        onClick={submit}
        type="button"
        title={sending ? "Sending..." : "Send"}
      >
        {sending ? "…" : "➤"}
      </button>
    </div>
  );
}
