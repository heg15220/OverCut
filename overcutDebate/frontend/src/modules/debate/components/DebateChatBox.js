// src/modules/debate/components/DebateChatBox.jsx
import React, { useMemo, useState } from "react";
import { Send, X } from "react-bootstrap-icons";
import "./Debate.css";

export default function DebateChatBox({ status, onSend, replyTo, onClearReply }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = status === "LIVE";

  const replySnippet = useMemo(() => {
    if (!replyTo) return "";
    return String(replyTo.text || "").replace(/\s+/g, " ").trim().slice(0, 110);
  }, [replyTo]);

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
    <div className="chat-composer">
      {replyTo && (
        <div className="replybar">
          <div>
            <strong>Respondiendo a {replyTo.userName}</strong>
            <span>{replySnippet}</span>
          </div>
          <button type="button" onClick={() => onClearReply?.()} title="Cancelar respuesta">
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="chat-composer__row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={canSend ? "Escribe tu argumento..." : "El chat se habilita cuando la sala pasa a LIVE"}
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
          className="send-action"
          disabled={!canSend || sending || text.trim().length === 0}
          onClick={submit}
          type="button"
          title={sending ? "Enviando" : "Enviar"}
        >
          <Send aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
