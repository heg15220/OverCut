import React, { useEffect, useRef, useState } from "react";
import { useConsent } from "./ConsentContext";
import { useNavigate } from "react-router-dom";
import "./cookie-intro.css";

const InlineSwitch = ({ checked, onChange, label, disabled }) => (
  <label className={`switch ${disabled ? "switch--disabled" : ""}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <span className="slider" />
    <span className="switch__label">{label}</span>
  </label>
);

const CookieIntroModal = () => {
  const {
    bannerOpen, setBannerOpen,
    preferences, analytics, ads,
    save, acceptAll, rejectAll,
    configOpen, setConfigOpen,
  } = useConsent();

  const navigate = useNavigate();
  const [local, setLocal] = useState({ preferences, analytics, ads });
  const configRef = useRef(null);

  // Este hook SIEMPRE se llama (no hay returns antes)
  useEffect(() => {
    if (!bannerOpen || !configOpen) return;

    // Sincroniza al abrir "Configurar"
    setLocal({ preferences, analytics, ads });

    // Scroll suave a la sección de configuración
    requestAnimationFrame(() => {
      configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [bannerOpen, configOpen, preferences, analytics, ads]);

  const goToCookies = (e) => {
    e.preventDefault();
    navigate("/legal/cookies");
  };
  const goToPrivacy = (e) => {
    e.preventDefault();
    navigate("/legal/privacy");
  };

  const onConfigure = () => setConfigOpen(true);

  const onSave = () => {
    save(local);
    setBannerOpen(false);
    setConfigOpen(false);
  };

  // Los hooks ya fueron declarados arriba
  if (!bannerOpen) return null;

  return (
    <div
      className="cookie-intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-intro-title"
    >
      <div className="cookie-intro">
        <header className="cookie-intro__header">
          <h2 id="cookie-intro-title">Aviso de privacidad</h2>
        </header>

        {/* Cuerpo con scroll */}
        <div className="cookie-intro__body">
          <p>
            El contenido de OverCut ha sido elaborado por aficionados y colaboradores para ofrecerte
            información y entretenimiento sobre Fórmula 1. Puedes acceder a este sitio web mediante las
            siguientes opciones:
          </p>

          <div className="cookie-intro__box">
            <h3>Aceptar cookies y acceder de forma gratuita</h3>
            <p>
              La publicidad y la analítica, basadas en cookies o tecnologías similares, nos ayudan a
              financiar el proyecto y mejorar tu experiencia. Al pulsar <b>“Aceptar y continuar”</b>
              consientes la instalación de cookies de <b>preferencias</b>, <b>analítica</b> y, si lo
              activas en el panel, de <b>publicidad</b>. Puedes saber más en nuestra{" "}
              <button type="button" className="linklike" onClick={goToCookies}>
                Política de Cookies
              </button>{" "}
              y retirar el consentimiento en cualquier momento desde <b>Configuración de cookies</b> en el pie de página.
            </p>
          </div>

          <div className="cookie-intro__alt">
            <h4>ALTERNATIVAMENTE,</h4>
            <h3>Rechazar tecnologías similares a cookies</h3>
            <p>
              Si pulsas <b>“Rechazar”</b>, solo usaremos cookies <b>técnicas</b> necesarias para la
              navegación. No analizaremos tu comportamiento ni te mostraremos publicidad personalizada
              (podrías ver publicidad general si la implementamos sin seguimiento). Podrás cambiar tu
              elección en cualquier momento con <b>Configurar</b>.
            </p>
          </div>

          <p className="cookie-intro__legal">
            Con tu consentimiento, nosotros (y en el futuro, nuestros proveedores) podremos tratar datos
            como identificadores en el dispositivo y la navegación en este sitio. También puedes oponerte
            a determinados tratamientos basados en interés legítimo desde <b>Configurar</b> o consultar
            nuestra{" "}
            <button type="button" className="linklike" onClick={goToPrivacy}>
              Política de Privacidad
            </button>.
          </p>

          <details className="cookie-intro__purposes">
            <summary>Ver finalidades y características</summary>
            <div className="purposes">
              <h4>Finalidades</h4>
              <ul>
                <li>Almacenar y/o acceder a información en el dispositivo (cookies técnicas).</li>
                <li>Preferencias (idioma u opciones elegidas por ti).</li>
                <li>Analítica de uso (medición anónima o agregada para mejorar el servicio).</li>
                <li>Publicidad (mostrar y medir anuncios; personalizada solo si la activas).</li>
              </ul>
              <h4>Propósitos especiales (obligatorios)</h4>
              <ul>
                <li>Garantizar la seguridad, evitar fraudes y corregir fallos.</li>
                <li>Ofrecer el contenido y los servicios solicitados.</li>
                <li>Guardar y comunicar tus preferencias de privacidad.</li>
              </ul>
              <h4>Características</h4>
              <ul>
                <li>Posible combinación de datos procedentes de distintas fuentes propias.</li>
                <li>Guardar tus elecciones para futuras visitas.</li>
              </ul>
            </div>
          </details>

          {/* Sección de configuración integrada */}
          {configOpen && (
            <section ref={configRef} className="cookie-intro__config" aria-label="Configuración de cookies">
              <h3>Preferencias de cookies</h3>

              <div className="config-card">
                <h4>Necesarias (siempre activas)</h4>
                <p>Imprescindibles para el funcionamiento del sitio y la gestión del consentimiento.</p>
                <InlineSwitch checked={true} onChange={() => {}} label="Técnicas / funcionales" disabled />
              </div>

              <div className="config-card">
                <h4>Preferencias</h4>
                <p>Guardan opciones como idioma o apariencia.</p>
                <InlineSwitch
                  checked={local.preferences}
                  onChange={(v) => setLocal((s) => ({ ...s, preferences: v }))}
                  label="Permitir preferencias"
                />
              </div>

              <div className="config-card">
                <h4>Analítica</h4>
                <p>Nos ayuda a medir el uso (p. ej., Google Analytics) y mejorar el servicio.</p>
                <InlineSwitch
                  checked={local.analytics}
                  onChange={(v) => setLocal((s) => ({ ...s, analytics: v }))}
                  label="Permitir analítica"
                />
              </div>

              <div className="config-card">
                <h4>Publicidad</h4>
                <p>Permite mostrar y medir anuncios personalizados o contextuales.</p>
                <InlineSwitch
                  checked={local.ads}
                  onChange={(v) => setLocal((s) => ({ ...s, ads: v }))}
                  label="Permitir publicidad"
                />
              </div>

              <div className="config-actions">
                <button className="btn btn--ghost" onClick={() => setConfigOpen(false)}>Cancelar</button>
                <button className="btn btn--primary" onClick={onSave}>Guardar preferencias</button>
              </div>
            </section>
          )}
        </div>

        {/* Acciones rápidas */}
        <footer className="cookie-intro__actions">
          <button className="btn btn--ghost" onClick={rejectAll} aria-label="Rechazar">
            Rechazar
          </button>
          <button className="btn btn--secondary" onClick={onConfigure} aria-label="Configurar">
            Configurar
          </button>
          <button className="btn btn--primary" onClick={acceptAll} aria-label="Aceptar y continuar">
            Aceptar y continuar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CookieIntroModal;
