import React from "react";
import { Link } from "react-router-dom";
import translations from "../../../i18n/translations";
import "./HomePage.css";

const lang = navigator.language.startsWith("es") ? "es" : "en";
const t = translations[lang];

const HomePage = () => (
  <div className="f1hub-home">
    <h1 className="f1hub-title">{t.welcome}<span>Hub</span></h1>
    <p className="f1hub-subtitle">{t.subtitle}</p>

    <div className="f1hub-actions">
      <Link to="/tables" className="f1hub-button">{t.viewTables}</Link>
      <Link to="/graphs" className="f1hub-button">{t.viewGraphs}</Link>
    </div>
  </div>
);

export default HomePage;
