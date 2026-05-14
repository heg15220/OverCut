import React from "react";
import { Globe2 } from "react-bootstrap-icons";

export default function ScopeSwitch({ value, onChange }) {
  return (
    <div className="scope-switch" role="tablist" aria-label="Ambito del debate">
      <button
        className={`scope-switch__button ${value === "ES" ? "is-active" : ""}`}
        onClick={() => onChange("ES")}
        type="button"
        role="tab"
        aria-selected={value === "ES"}
      >
        ES
        <span>Espana</span>
      </button>
      <button
        className={`scope-switch__button ${value === "INT" ? "is-active" : ""}`}
        onClick={() => onChange("INT")}
        type="button"
        role="tab"
        aria-selected={value === "INT"}
      >
        <Globe2 aria-hidden="true" />
        <span>Internacional</span>
      </button>
    </div>
  );
}
