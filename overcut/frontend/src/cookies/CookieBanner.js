// src/cookies/CookieBanner.jsx
import React from "react";
import { useConsent } from "./ConsentContext";
import { useNavigate } from "react-router-dom";

const CookieBanner = () => {
  const { bannerOpen, openConfig, acceptAll, rejectAll } = useConsent();
  const navigate = useNavigate();

  // Si usas SIEMPRE la modal grande, puedes no renderizar este banner en absoluto.
  if (!bannerOpen) return null;

  const goToCookies = (e) => { e.preventDefault(); navigate("/legal/cookies"); };

  return (
    <div role="dialog" aria-live="polite" className="cookie-banner">
      <div className="cookie-banner__content">
        <p>
          Usamos cookies…{" "}
          <button type="button" className="linklike" onClick={goToCookies}>Política de Cookies</button>.
        </p>
        <div className="cookie-banner__actions">
          <button onClick={rejectAll}>Rechazar todo</button>
          <button onClick={openConfig}>Configurar</button>
          <button onClick={acceptAll}>Aceptar todo</button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
