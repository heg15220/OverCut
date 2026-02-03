import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="ocp-footer">
      <span>© {new Date().getFullYear()} OverCut Predictions</span>
    </footer>
  );
}
