import React from "react";
import { useConsent } from "./ConsentContext";

const CookieBanner = () => {
  const { bannerOpen, setPanelOpen, acceptAll, rejectAll } = useConsent();
  if (!bannerOpen) return null;

  return (
    <div role="dialog" aria-live="polite" className="cookie-banner">
      <div className="cookie-banner__content">
        <p>
          Usamos cookies y tecnologías similares para fines técnicos, de preferencias, analítica y (si lo consientes) publicidad.
          Puedes aceptar, rechazar o configurar tus preferencias.
          Consulta nuestra <a href="/legal/cookies">Política de Cookies</a>.
        </p>
        <div className="cookie-banner__actions">
          <button onClick={rejectAll}>Rechazar todo</button>
          <button onClick={() => setPanelOpen(true)}>Configurar</button>
          <button onClick={acceptAll}>Aceptar todo</button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
