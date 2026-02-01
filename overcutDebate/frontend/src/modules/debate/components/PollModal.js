// src/modules/debate/components/PollModal.jsx
import React from "react";
import "./debateV2.css";

export default function PollModal({ open, secondsLeft, onYes, onNo }) {
  if (!open) return null;

  return (
    <div className="ocD-modalOverlay" role="dialog" aria-modal="true">
      <div className="ocD-modal">
        <div className="ocD-modalHeader">
          <span className="ocD-pill poll">POLL</span>
          <div className="ocD-modalTitle">¿Estás de acuerdo con la temática?</div>
          <div className="ocD-modalTimer">{Math.max(0, secondsLeft)}s</div>
        </div>

        <div className="ocD-modalActions">
          <button className="ocD-btn" onClick={onYes}>Sí</button>
          <button className="ocD-btn danger" onClick={onNo}>No</button>
        </div>

        <div className="ocD-muted" style={{ marginTop: 10 }}>
          Tienes 30 segundos. Al terminar, empieza el chat LIVE.
        </div>
      </div>
    </div>
  );
}
