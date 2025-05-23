import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => (
  <div className="f1hub-home">
    <h1 className="f1hub-title">🏎️ Bienvenido a <span>F1Hub</span></h1>
    <p className="f1hub-subtitle">
      Explora datos históricos, estadísticas avanzadas y análisis inteligentes de Fórmula 1 desde 1950 hasta hoy.
    </p>

    <div className="f1hub-actions">
      <Link to="/tables" className="f1hub-button">📊 Ver Tablas</Link>
      <Link to="/graphs" className="f1hub-button">📈 Ver Gráficas</Link>
    </div>
  </div>
);

export default HomePage;
