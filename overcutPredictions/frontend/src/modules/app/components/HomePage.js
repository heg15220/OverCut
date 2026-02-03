import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const overcutUrl = useMemo(() => {
    const v = (process.env.REACT_APP_OVERCUT_URL || "").trim();
    return v.length ? v : "http://localhost:3000/";
  }, []);

  return (
    <div className="ocp-home">
      <div className="ocp-hero">
        <div className="ocp-hero__badge">SIMULATOR</div>

        <h1 className="ocp-home__title">
          OverCut <span>Predictions</span>
        </h1>

        <p className="ocp-home__subtitle">
          Simula un campeonato desde la ronda que elijas y recalcula el mundial en tiempo real.
          Cambia el orden de llegada y observa cómo evoluciona la clasificación.
        </p>

        <div className="ocp-home__actions">
          <Link to="/simulate" className="ocp-btn ocp-btn--primary">
            Empezar simulación
          </Link>

          <a
            href={overcutUrl}
            className="ocp-btn ocp-btn--ghost"
            target="_blank"
            rel="noreferrer"
          >
            Abrir OverCut
          </a>
        </div>
      </div>
    </div>
  );
}
