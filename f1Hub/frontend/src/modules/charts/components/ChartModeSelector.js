import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import "./ChartStyles.css";

const ChartModeSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="chart-selector-container text-center">
      <h1 className="chart-selector-title">📈 ¿Qué tipo de gráficas quieres explorar?</h1>

      <div className="race-selector">
        <button onClick={() => navigate("standard")}>📊 Ver Gráficas por Categoría</button>
        <button onClick={() => navigate("advanced")}>🎛️ Gráficas con Filtros Avanzados</button>
      </div>

      <Outlet />
    </div>
  );
};

export default ChartModeSelector;
