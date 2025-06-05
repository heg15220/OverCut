import React from "react";
import { useNavigate } from "react-router-dom";
import translations from "../../../i18n/translations";
import "./TableMenu.css";

const lang = navigator.language.startsWith("es") ? "es" : "en";
const t = translations[lang];

const TableMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="table-menu">
      <h2 className="table-menu-title">{t.selectTableType}</h2>
      <div className="table-menu-options">
        <button onClick={() => navigate("/tables/grands-prix")}>{t.grandsPrix}</button>
        <button onClick={() => navigate("/tables/championships")}>{t.championships}</button>
        <button onClick={() => navigate("/tracking")}>{t.championshipTracking}</button>
        <button onClick={() => navigate("/tables/rankings")}>{t.rankings}</button>
      </div>
    </div>
  );
};

export default TableMenu;
