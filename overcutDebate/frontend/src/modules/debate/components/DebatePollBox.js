// src/modules/debate/components/DebatePollBox.jsx
import React from "react";
import "./Debate.css";

export default function DebatePollBox({ status, joined, pollAnswer, onAnswer }) {
  const canVote = joined && status === "POLL" && !pollAnswer;

  return (
    <div className="debate-section">
      <h3>Poll</h3>

      {!joined && <div className="debate-muted">Join the room to vote.</div>}

      {joined && status !== "POLL" && (
        <div className="debate-muted">
          Poll is not active right now (status: {status}).
        </div>
      )}

      {joined && status === "POLL" && (
        <>
          {pollAnswer ? (
            <div className="debate-joined-ok">✅ You answered: {pollAnswer}</div>
          ) : (
            <div className="debate-row">
              <button className="debate-btn" disabled={!canVote} onClick={() => onAnswer("YES")}>
                YES
              </button>
              <button className="debate-btn danger" disabled={!canVote} onClick={() => onAnswer("NO")}>
                NO
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
