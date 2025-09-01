import React from "react";
import { useConsent } from "./ConsentContext";
import "./cookie-intro.css";

const CookieIntroModal = () => {
  const { bannerOpen, setPanelOpen, acceptAll, rejectAll } = useConsent();
  if (!bannerOpen) return null;

  const onConfigure = () => {
    setPanelOpen(true); // abre la 2ª capa
  };

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
              <a href="/legal/cookies">Política de Cookies</a> y retirar el consentimiento en cualquier
              momento desde <b>Configuración de cookies</b> en el pie de página.
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
            nuestra <a href="/legal/privacy">Política de Privacidad</a>.
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
        </div>

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
