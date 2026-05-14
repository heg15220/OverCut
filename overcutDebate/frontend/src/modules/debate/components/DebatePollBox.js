import React from "react";
import { BarChart, CheckCircle } from "react-bootstrap-icons";
import "./Debate.css";

export default function DebatePollBox({ status, joined, pollAnswer, secondsRemaining, onAnswer }) {
  const canVote = joined && status === "POLL" && !pollAnswer;

  return (
    <section className={`poll-panel ${status === "POLL" ? "is-active" : ""}`}>
      <div className="poll-panel__header">
        <div className="poll-panel__icon">
          <BarChart aria-hidden="true" />
        </div>
        <div>
          <span>Encuesta inicial</span>
          <h2>Estas de acuerdo con la tematica?</h2>
        </div>
        {status === "POLL" && <strong>{Math.max(0, secondsRemaining || 0)}s</strong>}
      </div>

      {!joined && <p className="poll-panel__hint">Unete a la sala para responder antes de que empiece el chat.</p>}

      {joined && status !== "POLL" && (
        <p className="poll-panel__hint">
          {status === "LIVE"
            ? "La encuesta ya termino. El debate esta en directo."
            : "La encuesta se activara cuando cierre la inscripcion."}
        </p>
      )}

      {joined && status === "POLL" && (
        <div className="poll-panel__actions">
          {pollAnswer ? (
            <span className="answer-chip">
              <CheckCircle aria-hidden="true" />
              Has respondido {pollAnswer === "YES" ? "SI" : "NO"}
            </span>
          ) : (
            <>
              <button className="vote-button vote-button--yes" disabled={!canVote} onClick={() => onAnswer("YES")}>
                SI
              </button>
              <button className="vote-button vote-button--no" disabled={!canVote} onClick={() => onAnswer("NO")}>
                NO
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
