import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import "./RequireLoginPage.css";

function buildOvercutLoginUrl(returnTo) {
  const base = process.env.REACT_APP_OVERCUT_FRONTEND_URL || "http://localhost:3000/overcut/#";
  const cleanBase = base.endsWith("#") ? base : `${base}#`;

  // returnTo será una ruta hash de Debate, ej: "/debate/rooms/12"
  const next = encodeURIComponent(returnTo || "/debate");

  // OverCut login route (AJUSTA si tu OverCut usa otra)
  return `${cleanBase}/users/login?nextDebate=${next}`;
}

export default function RequireLoginPage() {
  const location = useLocation();

  const returnTo = useMemo(() => {
    // HashRouter: location.pathname ya es la ruta interna (ej: "/debate")
    const path = location.pathname || "/debate";
    const search = location.search || "";
    return `${path}${search}`;
  }, [location.pathname, location.search]);

  const goLogin = () => {
    window.location.href = buildOvercutLoginUrl(returnTo);
  };

  return (
    <div className="requireLogin">
      <div className="requireLogin__card">
        <div className="requireLogin__brand">
          <div className="requireLogin__title">OverCutDebate</div>
          <div className="requireLogin__subtitle">Necesitas iniciar sesión en OverCut</div>
        </div>

        <p className="requireLogin__text">
          Para entrar a las conversaciones LIVE necesitas iniciar sesión en OverCut. Al hacerlo,
          volverás aquí automáticamente con tu cuenta lista.
        </p>

        <button className="requireLogin__btn" onClick={goLogin}>
          Ir a OverCut a iniciar sesión
        </button>

        <div className="requireLogin__hint">
          Si ya has iniciado sesión en otra pestaña, vuelve aquí y recarga.
        </div>
      </div>
    </div>
  );
}
