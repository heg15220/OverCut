import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./OvercutGp.css";

// The Godot web export is copied here by the game's tools/export_web.sh.
export const GAME_SRC = `${process.env.PUBLIC_URL || ""}/games/overcut-gp/index.html`;

// Godot's exported page always boots an `Engine`; the dev server's fallback
// (the React app's own index.html) never does, so a missing build is detectable.
const isGodotPage = (html) => /new\s+Engine\s*\(/.test(html);

const OvercutGp = () => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let alive = true;
    fetch(GAME_SRC, { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : ""))
      .then((html) => alive && setStatus(isGodotPage(html) ? "ready" : "missing"))
      .catch(() => alive && setStatus("missing"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="overcut-gp">
      <div className="overcut-gp-bar">
        <Link to="/" className="overcut-gp-back">← OverCut</Link>
        <span className="overcut-gp-title">OverCut GP</span>
        <span className="overcut-gp-badge">Prueba de conducción · F1 2012</span>
      </div>
      {status === "ready" && (
        <iframe
          className="overcut-gp-frame"
          title="OverCut GP"
          src={GAME_SRC}
          allow="autoplay; fullscreen; gamepad"
          allowFullScreen
        />
      )}
      {status === "checking" && <div className="overcut-gp-message">Cargando OverCut GP…</div>}
      {status === "missing" && (
        <div className="overcut-gp-message">
          <p>No se ha encontrado la exportación web del juego.</p>
          <p>
            Ejecuta <code>tools/export_web.sh overcut/frontend/public/games/overcut-gp</code> desde el
            proyecto Godot de OverCut GP y recarga la página.
          </p>
        </div>
      )}
    </div>
  );
};

export default OvercutGp;
