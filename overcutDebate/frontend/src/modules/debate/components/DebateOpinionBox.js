// src/modules/debate/components/DebateOpinionBox.jsx
import React, { useState } from "react";
import "./Debate.css";

export default function DebateOpinionBox({ scope, myOpinion, onSubmit }) {
  const [text, setText] = useState("");

  const disabled = !!myOpinion;

  return (
    <div className="debate-section">
      <h3>Your opinion ({scope})</h3>

      {myOpinion ? (
        <div className="debate-opinion-readonly">
          <div className="debate-muted">Already submitted today:</div>
          <div className="debate-topic">{myOpinion.text}</div>
        </div>
      ) : (
        <>
          <textarea
            className="debate-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your opinion (1..500)..."
            maxLength={500}
          />
          <div className="debate-row">
            <span className="debate-muted">{text.trim().length}/500</span>
            <button
              className="debate-btn"
              disabled={disabled || text.trim().length === 0}
              onClick={() => {
                onSubmit(text);
                setText("");
              }}
            >
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
