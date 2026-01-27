// src/modules/app/components/Header.jsx
import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header className="Header">
      <div className="Header__inner">
        <div className="Header__brand">
          <div className="Header__title">OverCut</div>
          <div className="Header__subtitle">OverCutDebate</div>
        </div>

        <div className="Header__right">
          <span className="Header__pill">Debate</span>
        </div>
      </div>
    </header>
  );
}
