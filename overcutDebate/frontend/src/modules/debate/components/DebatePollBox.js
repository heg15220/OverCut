import React from "react";
import "./Debate.css";

export default function DebatePollBox({ status, joined, pollAnswer, onAnswer }) {
  const canVote = joined && status === "POLL" && !pollAnswer;

  return (
    <div style={{ marginTop: 14 }}>
      <div className="rooms__h" style={{ marginBottom: 6 }}>Poll</div>

      {!joined && <div className="rooms__hint">Join the room to vote.</div>}

      {joined && status !== "POLL" && (
        <div className="rooms__hint">Poll is not active right now (status: {status}).</div>
      )}

      {joined && status === "POLL" && (
        <>
          {pollAnswer ? (
            <div className="room-pill">✅ You answered: {pollAnswer}</div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn--primary" disabled={!canVote} onClick={() => onAnswer("YES")}>
                YES
              </button>
              <button className="btn btn--ghost" disabled={!canVote} onClick={() => onAnswer("NO")}>
                NO
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
