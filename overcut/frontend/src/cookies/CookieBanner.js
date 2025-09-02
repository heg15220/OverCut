import React from "react";
import { useConsent } from "./ConsentContext";
import { useNavigate } from "react-router-dom";

const CookieBanner = () => {
  const { bannerOpen, openConfig, acceptAll, rejectAll } = useConsent();
  const navigate = useNavigate();

  if (!bannerOpen) return null;

  const isES = (navigator.language || navigator.userLanguage || "es")
    .toLowerCase()
    .startsWith("es");

  const t = isES
    ? {
        text:
          "Usamos cookies y tecnologías similares para fines técnicos, de preferencias, analítica y (si lo consientes) publicidad.",
        policy: "Política de Cookies",
        rejectAll: "Rechazar todo",
        configure: "Configurar",
        acceptAll: "Aceptar todo",
      }
    : {
        text:
          "We use cookies and similar technologies for technical, preference, analytics and (if you consent) advertising purposes.",
        policy: "Cookies Policy",
        rejectAll: "Reject all",
        configure: "Configure",
        acceptAll: "Accept all",
      };

  const goToCookies = (e) => {
    e.preventDefault();
    navigate("/legal/cookies");
  };

  return (
    <div role="dialog" aria-live="polite" className="cookie-banner">
      <div className="cookie-banner__content">
        <p>
          {t.text}{" "}
          <button type="button" className="linklike" onClick={goToCookies}>
            {t.policy}
          </button>
          .
        </p>
        <div className="cookie-banner__actions">
          <button onClick={rejectAll}>{t.rejectAll}</button>
          <button onClick={openConfig}>{t.configure}</button>
          <button onClick={acceptAll}>{t.acceptAll}</button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
