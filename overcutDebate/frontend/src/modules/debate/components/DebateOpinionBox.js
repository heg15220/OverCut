// src/modules/debate/components/DebateOpinionBox.jsx
import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Send } from "react-bootstrap-icons";
import "./Debate.css";

export default function DebateOpinionBox({ scope, myOpinion, isAdmin, onSubmit }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (myOpinion?.text && isAdmin) setText(myOpinion.text);
  }, [myOpinion?.id, myOpinion?.text, isAdmin]);

  const locked = !!myOpinion && !isAdmin;
  const remaining = useMemo(() => 500 - (text?.length || 0), [text]);

  const submit = () => {
    const cleaned = (text || "").trim();
    if (!cleaned) return;
    onSubmit?.(cleaned);
  };

  if (locked) {
    return (
      <div className="opinion-submitted">
        <div className="opinion-submitted__icon">
          <CheckCircle aria-hidden="true" />
        </div>
        <div>
          <span>Opinion enviada para {scope}</span>
          <p>{myOpinion?.text}</p>
          <small>Solo se permite una opinion diaria por ambito.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="opinion-form">
      <label htmlFor="daily-opinion">Escribe una unpopular opinion</label>
      <textarea
        id="daily-opinion"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          scope === "ES"
            ? "Ejemplo: una opinion impopular sobre la actualidad espanola..."
            : "Example: an unpopular opinion about an international topic..."
        }
        maxLength={500}
      />

      <div className="opinion-form__footer">
        <span className={remaining <= 40 ? "is-warn" : ""}>{remaining} caracteres</span>
        <button className="primary-action" onClick={submit} disabled={!text.trim()} type="button">
          <Send aria-hidden="true" />
          Enviar opinion
        </button>
      </div>

      {myOpinion && isAdmin && <small className="form-note">Modo admin: se actualizara tu opinion actual.</small>}
    </div>
  );
}
