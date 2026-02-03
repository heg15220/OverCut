import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="ocp-header">
      <Link to="/" className="ocp-brand">
        <span className="ocp-brand__over">OVER</span>
        <span className="ocp-brand__cut">CUT</span>
        <span className="ocp-brand__sub">Predictions</span>
      </Link>

      <nav className="ocp-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
          Inicio
        </NavLink>
        <NavLink
          to="/simulate"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Simular
        </NavLink>

        {/* Enlace a OverCut (ajusta URL prod cuando toque) */}
        <a className="ocp-nav__overcut" href="http://localhost:3000/">
          OverCut
        </a>
      </nav>
    </header>
  );
}
