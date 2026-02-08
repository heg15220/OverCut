// src/modules/debate/components/DebateOpinionBox.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Debate.css";

export default function DebateOpinionBox({ scope, myOpinion, isAdmin, onSubmit }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (myOpinion?.text && isAdmin) setText(myOpinion.text);
  }, [myOpinion?.id, isAdmin]);

  const locked = !!myOpinion && !isAdmin;
  const remaining = useMemo(() => 500 - (text?.length || 0), [text]);

  const submit = () => {
    const cleaned = (text || "").trim();
    if (!cleaned) return;
    onSubmit?.(cleaned);
  };

  return (
    <div style={{ marginTop: 10, marginBottom: 16 }}>
      <div className="field">
        <div className="field__label">
          Tu opinión de hoy <span className="room-pill">{scope}</span>
        </div>

        {locked ? (
          <div className="modal-card" style={{ padding: 14 }}>
            <div style={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.35 }}>{myOpinion?.text}</div>
            <div className="field__help" style={{ marginTop: 8 }}>
              Ya has enviado tu opinión hoy para este scope.
            </div>
          </div>
        ) : (
          <>
            <textarea
              className="field__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={scope === "ES" ? "Tu opinión impopular..." : "Your unpopular opinion..."}
              maxLength={500}
            />

            <div className="field__meta">
              <span className={`field__count ${remaining <= 40 ? "is-warn" : ""}`}>
                {remaining} chars
              </span>

              <button className="btn btn--primary" onClick={submit} disabled={!text.trim()}>
                Enviar
              </button>
            </div>

            {myOpinion && isAdmin && (
              <div className="field__help" style={{ marginTop: 6 }}>
                ⚙️ Admin: se actualizará la misma opinión.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
