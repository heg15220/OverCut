import React, { useState } from "react";
import { useConsent } from "./ConsentContext";

const Switch = ({ checked, onChange, label, disabled }) => (
  <label className={`switch ${disabled ? "switch--disabled": ""}`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    <span className="slider" />
    <span className="switch__label">{label}</span>
  </label>
);

const CookiePanel = () => {
  const { panelOpen, setPanelOpen, preferences, analytics, ads, save } = useConsent();
  const [local, setLocal] = useState({ preferences, analytics, ads });

  if (!panelOpen) return null;

  const isES = (navigator.language || navigator.userLanguage || "es")
    .toLowerCase()
    .startsWith("es");

  const t = isES
    ? {
        title: "Preferencias de cookies",
        closeAria: "Cerrar",
        lead: "Configura qué categorías de cookies quieres permitir.",
        necessaryTitle: "Necesarias (siempre activas)",
        necessaryText:
          "Imprescindibles para el funcionamiento del sitio y la gestión del consentimiento (no requieren consentimiento).",
        necessaryLabel: "Técnicas / funcionales",
        prefsTitle: "Preferencias",
        prefsText: "Guardan opciones como idioma o apariencia.",
        prefsLabel: "Permitir preferencias",
        analyticsTitle: "Analítica",
        analyticsText: "Nos ayuda a medir el uso (p. ej., Google Analytics) y mejorar el servicio.",
        analyticsLabel: "Permitir analítica",
        adsTitle: "Publicidad",
        adsText: "Permite mostrar y medir anuncios personalizados o contextuales.",
        adsLabel: "Permitir publicidad",
        details: "Ver cookies/almacenamientos",
        th: ["Nombre","Dominio","Finalidad","Duración","Tipo","Categoría"],
        cancel: "Cancelar",
        save: "Guardar preferencias",
      }
    : {
        title: "Cookie preferences",
        closeAria: "Close",
        lead: "Choose which cookie categories you want to allow.",
        necessaryTitle: "Necessary (always on)",
        necessaryText:
          "Essential for the site to function and for consent management (no consent required).",
        necessaryLabel: "Technical / functional",
        prefsTitle: "Preferences",
        prefsText: "Stores options like language or appearance.",
        prefsLabel: "Allow preferences",
        analyticsTitle: "Analytics",
        analyticsText: "Helps measure usage (e.g., Google Analytics) and improve the service.",
        analyticsLabel: "Allow analytics",
        adsTitle: "Advertising",
        adsText: "Allows showing and measuring contextual or personalized ads.",
        adsLabel: "Allow advertising",
        details: "View cookies/storage",
        th: ["Name","Domain","Purpose","Duration","Type","Category"],
        cancel: "Cancel",
        save: "Save preferences",
      };

  const onSave = () => {
    save(local);
    setPanelOpen(false);
  };

  return (
    <div role="dialog" aria-modal="true" className="cookie-panel">
      <div className="cookie-panel__window">
        <header className="cookie-panel__header">
          <h2>{t.title}</h2>
          <button onClick={() => setPanelOpen(false)} aria-label={t.closeAria}>×</button>
        </header>

        <section className="cookie-panel__body">
          <p>{t.lead}</p>

          <div className="cookie-panel__group">
            <h3>{t.necessaryTitle}</h3>
            <p>{t.necessaryText}</p>
            <Switch checked={true} onChange={() => {}} label={t.necessaryLabel} disabled />
          </div>

          <div className="cookie-panel__group">
            <h3>{t.prefsTitle}</h3>
            <p>{t.prefsText}</p>
            <Switch
              checked={local.preferences}
              onChange={(v) => setLocal(s => ({ ...s, preferences: v }))}
              label={t.prefsLabel}
            />
          </div>

          <div className="cookie-panel__group">
            <h3>{t.analyticsTitle}</h3>
            <p>{t.analyticsText}</p>
            <Switch
              checked={local.analytics}
              onChange={(v) => setLocal(s => ({ ...s, analytics: v }))}
              label={t.analyticsLabel}
            />
          </div>

          <div className="cookie-panel__group">
            <h3>{t.adsTitle}</h3>
            <p>{t.adsText}</p>
            <Switch
              checked={local.ads}
              onChange={(v) => setLocal(s => ({ ...s, ads: v }))}
              label={t.adsLabel}
            />
          </div>

          <details className="cookie-panel__details">
            <summary>{t.details}</summary>
            <table className="cookie-table">
              <thead>
                <tr>
                  {t.th.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>oc_consent</td><td>overcutf1.com</td>
                  <td>{isES ? "Guardar preferencias de consentimiento" : "Store consent preferences"}</td>
                  <td>{isES ? "12 meses" : "12 months"}</td>
                  <td>{isES ? "Cookie propia" : "First-party cookie"}</td>
                  <td>{isES ? "Técnica" : "Technical"}</td>
                </tr>
                <tr>
                  <td>oc_cid</td><td>overcutf1.com</td>
                  <td>{isES ? "Vincular consentimiento anónimo" : "Link anonymous consent"}</td>
                  <td>{isES ? "12 meses" : "12 months"}</td>
                  <td>{isES ? "Cookie propia" : "First-party cookie"}</td>
                  <td>{isES ? "Técnica" : "Technical"}</td>
                </tr>
                <tr>
                  <td>serviceToken</td><td>overcutf1.com</td>
                  <td>{isES ? "Autenticación (JWT)" : "Authentication (JWT)"}</td>
                  <td>{isES ? "Hasta cierre sesión" : "Until sign-out"}</td>
                  <td>{isES ? "Almacenamiento local" : "Local storage"}</td>
                  <td>{isES ? "Técnica" : "Technical"}</td>
                </tr>
                {/* Añade aquí filas reales para GA/Ads cuando estén activos */}
              </tbody>
            </table>
          </details>
        </section>

        <footer className="cookie-panel__footer">
          <button onClick={() => setPanelOpen(false)}>{t.cancel}</button>
          <button onClick={onSave}>{t.save}</button>
        </footer>
      </div>
    </div>
  );
};

export default CookiePanel;
