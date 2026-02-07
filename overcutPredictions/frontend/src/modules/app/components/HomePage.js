import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import { t } from "../../../i18n/translations";

export default function HomePage() {
const overcutUrl = useMemo(() => {
  // Dev: tu OverCut local
  if (process.env.NODE_ENV === "development") return "http://localhost:3000/";
  // Prod: OverCut vive en la raíz del mismo dominio
  return "/";
}, []);


  return (
    <div className="ocp-home">
      <div className="ocp-hero">
        <div className="ocp-hero__badge">{t("home.badge")}</div>

        <h1 className="ocp-home__title">
          OverCut <span>Predictions</span>
        </h1>

        <p className="ocp-home__subtitle">{t("home.subtitle")}</p>

        <div className="ocp-home__actions">
          <Link to="/simulate" className="ocp-btn ocp-btn--primary">
            {t("home.ctaStart")}
          </Link>

          <a href={overcutUrl} className="ocp-btn ocp-btn--ghost" target="_blank" rel="noreferrer">
            {t("home.ctaOvercut")}
          </a>
        </div>
      </div>
    </div>
  );
}
