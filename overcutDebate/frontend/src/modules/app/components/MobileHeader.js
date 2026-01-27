// src/modules/app/components/MobileHeader.jsx
import React from "react";
import "./MobileHeader.css";

export default function MobileHeader() {
  return (
    <header className="MobileHeader">
      <div className="MobileHeader__inner">
        <div className="MobileHeader__title">OverCutDebate</div>
        <span className="MobileHeader__pill">LIVE</span>
      </div>
    </header>
  );
}
