// src/modules/app/components/Footer.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";


export default function Footer() {

  return (
    <footer className="Footer">
      <div className="Footer__inner">
        <div className="Footer__left">
          <div className="Footer__brand">OverCut</div>
          <div className="Footer__muted">OverCutDebate</div>
        </div>
      </div>

      <div className="Footer__bottom">
        <span>© {new Date().getFullYear()} OverCutDebate</span>
      </div>
    </footer>
  );
}
