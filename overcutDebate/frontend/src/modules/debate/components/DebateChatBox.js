// src/modules/debate/components/DebateChatBox.jsx
import React, { useState } from "react";
import "./Debate.css";

export default function DebateChatBox({ status, onSend }) {
  const [text, setText] = useState("");

  const canSend = status === "LIVE";

  return (
    <div className="debate-chatbox">
      <input
        className="debate-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={canSend ? "Write a message..." : "Chat disabled until LIVE"}
        disabled={!canSend}
        maxLength={400}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const cleaned = text.trim();
            if (!cleaned) return;
            onSend(cleaned);
            setText("");
          }
        }}
      />

      <button
        className="debate-btn"
        disabled={!canSend || text.trim().length === 0}
        onClick={() => {
          const cleaned = text.trim();
          if (!cleaned) return;
          onSend(cleaned);
          setText("");
        }}
      >
        Send
      </button>
    </div>
  );
}
