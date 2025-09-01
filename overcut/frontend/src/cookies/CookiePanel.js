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

  const onSave = () => {
    save(local);
    setPanelOpen(false);
  };

  return (
    <div role="dialog" aria-modal="true" className="cookie-panel">
      <div className="cookie-panel__window">
        <header className="cookie-panel__header">
          <h2>Preferencias de cookies</h2>
          <button onClick={() => setPanelOpen(false)} aria-label="Cerrar">×</button>
        </header>

        <section className="cookie-panel__body">
          <p>Configura qué categorías de cookies quieres permitir.</p>

          <div className="cookie-panel__group">
            <h3>Necesarias (siempre activas)</h3>
            <p>Imprescindibles para el funcionamiento del sitio y la gestión del consentimiento (no requieren consentimiento).</p>
            <Switch checked={true} onChange={() => {}} label="Técnicas / funcionales" disabled />
          </div>

          <div className="cookie-panel__group">
            <h3>Preferencias</h3>
            <p>Guardan opciones como idioma o apariencia.</p>
            <Switch
              checked={local.preferences}
              onChange={(v) => setLocal(s => ({ ...s, preferences: v }))}
              label="Permitir preferencias"
            />
          </div>

          <div className="cookie-panel__group">
            <h3>Analítica</h3>
            <p>Nos ayuda a medir el uso (p. ej., Google Analytics) y mejorar el servicio.</p>
            <Switch
              checked={local.analytics}
              onChange={(v) => setLocal(s => ({ ...s, analytics: v }))}
              label="Permitir analítica"
            />
          </div>

          <div className="cookie-panel__group">
            <h3>Publicidad</h3>
            <p>Permite mostrar y medir anuncios personalizados o contextuales.</p>
            <Switch
              checked={local.ads}
              onChange={(v) => setLocal(s => ({ ...s, ads: v }))}
              label="Permitir publicidad"
            />
          </div>

          <details className="cookie-panel__details">
            <summary>Ver cookies/almacenamientos</summary>
            <table className="cookie-table">
              <thead>
                <tr>
                  <th>Nombre</th><th>Dominio</th><th>Finalidad</th><th>Duración</th><th>Tipo</th><th>Categoría</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>oc_consent</td><td>overcutf1.com</td><td>Guardar preferencias de consentimiento</td><td>12 meses</td><td>Cookie propia</td><td>Técnica</td>
                </tr>
                <tr>
                  <td>oc_cid</td><td>overcutf1.com</td><td>Vincular consentimiento anónimo</td><td>12 meses</td><td>Cookie propia</td><td>Técnica</td>
                </tr>
                <tr>
                  <td>serviceToken</td><td>overcutf1.com</td><td>Autenticación (JWT)</td><td>Hasta cierre sesión</td><td>Almacenamiento local</td><td>Técnica</td>
                </tr>
                {/* Cuando actives GA/Ads, añade filas reales aquí o genera la tabla dinámicamente */}
              </tbody>
            </table>
          </details>
        </section>

        <footer className="cookie-panel__footer">
          <button onClick={() => setPanelOpen(false)}>Cancelar</button>
          <button onClick={onSave}>Guardar preferencias</button>
        </footer>
      </div>
    </div>
  );
};

export default CookiePanel;
