import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import translations from "../../../i18n/translations";
import "./ChartStyles.css";

const lang = navigator.language.startsWith("es") ? "es" : "en";
const t = translations[lang];

const ChartModeSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="chart-selector-container text-center">
      <h1 className="chart-selector-title">📈 {lang === "es" ? "¿Qué tipo de gráficas quieres explorar?" : "Which type of charts would you like to explore?"}</h1>

      <div className="race-selector">
        <button onClick={() => navigate("standard")}>📊 {t.chartsByCategory}</button>
        <button onClick={() => navigate("advanced")}>🎛️ {t.advancedCharts}</button>
      </div>

      <Outlet />
    </div>
  );
};

export default ChartModeSelector;
