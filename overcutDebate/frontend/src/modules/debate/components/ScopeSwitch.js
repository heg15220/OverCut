import React from "react";
import "./debateV2.css";

export default function ScopeSwitch({ value, onChange }) {
  return (
    <div className="ocD-seg">
      <button
        className={`ocD-segBtn ${value === "ES" ? "active" : ""}`}
        onClick={() => onChange("ES")}
        type="button"
      >
        🇪🇸 España
      </button>
      <button
        className={`ocD-segBtn ${value === "INT" ? "active" : ""}`}
        onClick={() => onChange("INT")}
        type="button"
      >
        🌍 Internacional
      </button>
    </div>
  );
}
