// frontend/src/modules/debate/components/DebateOpinionBox.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./debateV2.css";

export default function DebateOpinionBox({ scope, myOpinion, isAdmin, onSubmit }) {
  const [text, setText] = useState("");

  // ✅ si ya había opinión y el usuario es admin, precargamos para editar
  useEffect(() => {
    if (myOpinion?.text && isAdmin) {
      setText(myOpinion.text);
    }
    if (!myOpinion && text) {
      // no tocamos, por si el user estaba escribiendo
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myOpinion?.id, isAdmin]);

  const locked = !!myOpinion && !isAdmin; // ✅ no-admin: bloqueado; admin: editable

  const remaining = useMemo(() => 500 - (text?.length || 0), [text]);

  const ctaLabel = locked
    ? "Opinión enviada"
    : myOpinion && isAdmin
    ? "Actualizar opinión (admin)"
    : "Enviar opinión";

  const helper = locked
    ? "Ya has enviado tu opinión hoy para este scope."
    : myOpinion && isAdmin
    ? "Eres admin: puedes editar y actualizar tu opinión de hoy."
    : "Escribe una opinión impopular (1..500).";

  const submit = () => {
    const cleaned = (text || "").trim();
    if (!cleaned) return;
    onSubmit?.(cleaned);
  };

  return (
    <div className="ocD-opBox">
      <div className="ocD-muted" style={{ marginBottom: 8 }}>
        {helper}
      </div>

      {/* Si no-admin y ya existe opinión, mostramos caja de solo lectura */}
      {locked ? (
        <div className="ocD-opinionRead">
          <div className="ocD-opinionText">{myOpinion?.text}</div>
          <div className="ocD-muted" style={{ marginTop: 6 }}>
            Scope: <b>{scope}</b>
          </div>
        </div>
      ) : (
        <>
          <textarea
            className="ocD-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={scope === "ES" ? "Tu opinión impopular..." : "Your unpopular opinion..."}
            maxLength={500}
            rows={4}
          />

          <div className="ocD-row">
            <span className={`ocD-muted ${remaining < 0 ? "ocD-bad" : ""}`}>
              {remaining} chars
            </span>

            <button
              className="ocD-btn"
              onClick={submit}
              disabled={!text.trim()}
              title={ctaLabel}
            >
              {ctaLabel}
            </button>
          </div>

          {/* Si admin y hay opinión existente, avisito */}
          {myOpinion && isAdmin && (
            <div className="ocD-muted" style={{ marginTop: 8 }}>
              ⚙️ Se actualizará la misma opinión (no crea una nueva).
            </div>
          )}
        </>
      )}
    </div>
  );
}
