import React, { useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Header.css";

export default function Header() {
  // ✅ Webpack inyecta este valor con DefinePlugin (ver webpack.config.js)
  // Si no está definido, cae al default.
  const overcutUrl = useMemo(() => {
    const v = (process.env.REACT_APP_OVERCUT_URL || "").trim();
    return v.length ? v : "http://localhost:3000/";
  }, []);

  return (
    <header className="ocp-header">
      <Link to="/" className="ocp-brand" aria-label="OverCut Predictions Home">
        <span className="ocp-brand__over">OVERCUT</span>
        <span className="ocp-brand__cut">Predictions</span>
      </Link>

      <nav className="ocp-nav" aria-label="Main navigation">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")} end>
          Inicio
        </NavLink>

        <NavLink to="/simulate" className={({ isActive }) => (isActive ? "active" : "")}>
          Simular
        </NavLink>

        <a
          className="ocp-nav__overcut"
          href={overcutUrl}
          target="_blank"
          rel="noreferrer"
          title="Abrir OverCut"
        >
          OverCut
        </a>
      </nav>
    </header>
  );
}
