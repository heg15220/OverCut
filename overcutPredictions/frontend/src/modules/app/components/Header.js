import React, { useMemo, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Header.css";
import { t } from "../../../i18n/translations";

export default function Header() {
  const overcutUrl = useMemo(() => {
    const v = (process.env.REACT_APP_OVERCUT_URL || "").trim();
    return v.length ? v : "http://localhost:3000/";
  }, []);

  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Cierra con ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // ✅ Cierra al cambiar tamaño a desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 560) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="ocp-header">
      <Link to="/" className="ocp-brand" aria-label={t("header.brandAria")}>
        <span className="ocp-brand__over">OVERCUT</span>
        <span className="ocp-brand__cut">Predictions</span>
      </Link>

      {/* ✅ NAV desktop */}
      <nav className="ocp-nav ocp-nav--desktop" aria-label={t("header.navAria")}>
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")} end>
          {t("header.home")}
        </NavLink>

        <NavLink to="/simulate" className={({ isActive }) => (isActive ? "active" : "")}>
          {t("header.simulate")}
        </NavLink>

        <a
          className="ocp-nav__overcut"
          href={overcutUrl}
          target="_blank"
          rel="noreferrer"
          title={t("header.openOvercut")}
        >
          OverCut
        </a>
      </nav>

      {/* ✅ Botón hamburguesa (solo móvil) */}
      <button
        type="button"
        className="ocp-burger"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen ? "true" : "false"}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span className="ocp-burger__bar" />
        <span className="ocp-burger__bar" />
        <span className="ocp-burger__bar" />
      </button>

      {/* ✅ Menú móvil */}
      {mobileOpen && (
        <>
          <div className="ocp-mobileOverlay" onClick={() => setMobileOpen(false)} />

          <nav className="ocp-mobileMenu" aria-label={t("header.navAria")}>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active" : "")}
              end
              onClick={() => setMobileOpen(false)}
            >
              {t("header.home")}
            </NavLink>

            <NavLink
              to="/simulate"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setMobileOpen(false)}
            >
              {t("header.simulate")}
            </NavLink>

            <a
              className="ocp-nav__overcut"
              href={overcutUrl}
              target="_blank"
              rel="noreferrer"
              title={t("header.openOvercut")}
              onClick={() => setMobileOpen(false)}
            >
              OverCut
            </a>
          </nav>
        </>
      )}
    </header>
  );
}
