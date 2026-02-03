import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="ocp-footer">
      <div className="ocp-footer__inner">
        <span>© {new Date().getFullYear()} OverCut Predictions</span>
        <span className="ocp-footer__sep">·</span>
        <span className="ocp-footer__muted">Simulador de campeonatos (F1DB)</span>
      </div>
    </footer>
  );
}
