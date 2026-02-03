import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="ocp-home">
      <h1 className="ocp-home__title">
        OverCut <span>Predictions</span>
      </h1>

      <p className="ocp-home__subtitle">
        Simula un campeonato desde la ronda que elijas y recalcula el mundial en tiempo real.
      </p>

      <div className="ocp-home__actions">
        <Link to="/simulate" className="ocp-btn ocp-btn--primary">
          Empezar simulación
        </Link>

        <a href="http://localhost:3000/" className="ocp-btn ocp-btn--ghost">
          Volver a OverCut
        </a>
      </div>
    </div>
  );
}
