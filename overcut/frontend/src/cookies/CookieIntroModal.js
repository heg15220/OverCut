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

  // i18n: español por defecto; inglés si el navegador no empieza por "es"
  const isES = (navigator.language || navigator.userLanguage || "es")
    .toLowerCase()
    .startsWith("es");

  const t = isES
    ? {
        title: "Aviso de privacidad",
        intro1:
          "El contenido de OverCut ha sido elaborado por aficionados y colaboradores para ofrecerte información y entretenimiento sobre Fórmula 1. Puedes acceder a este sitio web mediante las siguientes opciones:",
        boxTitle: "Aceptar cookies y acceder de forma gratuita",
        boxP1a:
          "La publicidad y la analítica, basadas en cookies o tecnologías similares, nos ayudan a financiar el proyecto y mejorar tu experiencia. Al pulsar ",
        boxP1b:
          " consientes la instalación de cookies de ",
        acceptAndContinue: "Aceptar y continuar",
        prefs: "preferencias",
        analyticsLab: "analítica",
        adsLab: "publicidad",
        cookiesPolicy: "Política de Cookies",
        withdraw:
          " y retirar el consentimiento en cualquier momento desde ",
        cookieSettings: "Configuración de cookies",
        footer:
          " en el pie de página.",
        altLead: "ALTERNATIVAMENTE,",
        altTitle: "Rechazar tecnologías similares a cookies",
        altText:
          "Si pulsas “Rechazar”, solo usaremos cookies técnicas necesarias para la navegación. No analizaremos tu comportamiento ni te mostraremos publicidad personalizada (podrías ver publicidad general si la implementamos sin seguimiento). Podrás cambiar tu elección en cualquier momento con “Configurar”.",
        legalP1a:
          "Con tu consentimiento, nosotros (y en el futuro, nuestros proveedores) podremos tratar datos como identificadores en el dispositivo y la navegación en este sitio. También puedes oponerte a determinados tratamientos basados en interés legítimo desde “Configurar” o consultar nuestra ",
        privacyPolicy: "Política de Privacidad",
        purposesSummary: "Ver finalidades y características",
        purposesTitle: "Finalidades",
        purposesList: [
          "Almacenar y/o acceder a información en el dispositivo (cookies técnicas).",
          "Preferencias (idioma u opciones elegidas por ti).",
          "Analítica de uso (medición anónima o agregada para mejorar el servicio).",
          "Publicidad (mostrar y medir anuncios; personalizada solo si la activas).",
        ],
        specialTitle: "Propósitos especiales (obligatorios)",
        specialList: [
          "Garantizar la seguridad, evitar fraudes y corregir fallos.",
          "Ofrecer el contenido y los servicios solicitados.",
          "Guardar y comunicar tus preferencias de privacidad.",
        ],
        featuresTitle: "Características",
        featuresList: [
          "Posible combinación de datos procedentes de distintas fuentes propias.",
          "Guardar tus elecciones para futuras visitas.",
        ],
        cfgTitle: "Preferencias de cookies",
        necessaryTitle: "Necesarias (siempre activas)",
        necessaryText:
          "Imprescindibles para el funcionamiento del sitio y la gestión del consentimiento.",
        necessaryLabel: "Técnicas / funcionales",
        prefsTitle: "Preferencias",
        prefsText: "Guardan opciones como idioma o apariencia.",
        prefsLabel: "Permitir preferencias",
        analyticsTitle: "Analítica",
        analyticsText:
          "Nos ayuda a medir el uso (p. ej., Google Analytics) y mejorar el servicio.",
        analyticsLabel: "Permitir analítica",
        adsTitle: "Publicidad",
        adsText:
          "Permite mostrar y medir anuncios personalizados o contextuales.",
        adsLabel: "Permitir publicidad",
        cancel: "Cancelar",
        save: "Guardar preferencias",
        actionsReject: "Rechazar",
        actionsConfigure: "Configurar",
        actionsAcceptAndContinue: "Aceptar y continuar",
      }
    : {
        title: "Privacy notice",
        intro1:
          "OverCut’s content is created by fans and contributors to provide information and entertainment about Formula 1. You can access this website through the following options:",
        boxTitle: "Accept cookies for free access",
        boxP1a:
          "Advertising and analytics, based on cookies or similar technologies, help us fund the project and improve your experience. By clicking ",
        boxP1b:
          " you consent to setting ",
        acceptAndContinue: "Accept and continue",
        prefs: "preferences",
        analyticsLab: "analytics",
        adsLab: "advertising",
        cookiesPolicy: "Cookies Policy",
        withdraw:
          " and you can withdraw consent at any time from ",
        cookieSettings: "Cookie settings",
        footer: " in the footer.",
        altLead: "ALTERNATIVELY,",
        altTitle: "Reject cookie-like technologies",
        altText:
          "If you click “Reject”, we will only use technical cookies that are necessary for browsing. We will not analyze your behavior or show personalized ads (you may see general ads if implemented without tracking). You can change your choice at any time with “Configure”.",
        legalP1a:
          "With your consent, we (and in the future, our vendors) may process data such as device identifiers and browsing on this site. You may also object to certain processing based on legitimate interest from “Configure” or check our ",
        privacyPolicy: "Privacy Policy",
        purposesSummary: "View purposes and features",
        purposesTitle: "Purposes",
        purposesList: [
          "Store and/or access information on a device (technical cookies).",
          "Preferences (e.g., language or options you choose).",
          "Usage analytics (anonymous or aggregated measurement to improve the service).",
          "Advertising (show and measure ads; personalized only if you enable it).",
        ],
        specialTitle: "Special purposes (required)",
        specialList: [
          "Ensure security, prevent fraud and fix errors.",
          "Deliver the content and services requested.",
          "Store and communicate your privacy preferences.",
        ],
        featuresTitle: "Features",
        featuresList: [
          "Possible combination of data from our own sources.",
          "Save your choices for future visits.",
        ],
        cfgTitle: "Cookie preferences",
        necessaryTitle: "Necessary (always on)",
        necessaryText:
          "Essential for the site to work and for consent management.",
        necessaryLabel: "Technical / functional",
        prefsTitle: "Preferences",
        prefsText: "Save options like language or appearance.",
        prefsLabel: "Allow preferences",
        analyticsTitle: "Analytics",
        analyticsText:
          "Helps us measure usage (e.g., Google Analytics) and improve the service.",
        analyticsLabel: "Allow analytics",
        adsTitle: "Advertising",
        adsText: "Enable showing and measuring contextual or personalized ads.",
        adsLabel: "Allow advertising",
        cancel: "Cancel",
        save: "Save preferences",
        actionsReject: "Reject",
        actionsConfigure: "Configure",
        actionsAcceptAndContinue: "Accept and continue",
      };

  // Hooks: sincroniza valores y hace scroll al abrir configuración
  useEffect(() => {
    if (!bannerOpen || !configOpen) return;
    setLocal({ preferences, analytics, ads });
    requestAnimationFrame(() => {
      configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [bannerOpen, configOpen, preferences, analytics, ads]);

  const goToCookies = (e) => { e.preventDefault(); navigate("/legal/cookies"); };
  const goToPrivacy = (e) => { e.preventDefault(); navigate("/legal/privacy"); };
  const onConfigure = () => setConfigOpen(true);
  const onSave = () => {
    save(local);
    setBannerOpen(false);
    setConfigOpen(false);
  };

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
          <h2 id="cookie-intro-title">{t.title}</h2>
        </header>

        <div className="cookie-intro__body">
          <p>{t.intro1}</p>

          <div className="cookie-intro__box">
            <h3>{t.boxTitle}</h3>
            <p>
              {t.boxP1a}
              <b>“{t.acceptAndContinue}”</b>
              {t.boxP1b}
              <b>{t.prefs}</b>, <b>{t.analyticsLab}</b>
              {isES ? " y, si lo activas en el panel, de " : " and, if enabled in the panel, "}
              <b>{t.adsLab}</b>.{" "}
              {isES ? "Puedes saber más en nuestra " : "Learn more in our "}
              <button type="button" className="linklike" onClick={goToCookies}>
                {t.cookiesPolicy}
              </button>
              {t.withdraw}
              <b>{t.cookieSettings}</b>
              {t.footer}
            </p>
          </div>

          <div className="cookie-intro__alt">
            <h4>{t.altLead}</h4>
            <h3>{t.altTitle}</h3>
            <p>{t.altText}</p>
          </div>

          <p className="cookie-intro__legal">
            {t.legalP1a}
            <button type="button" className="linklike" onClick={goToPrivacy}>
              {t.privacyPolicy}
            </button>
            .
          </p>

          <details className="cookie-intro__purposes">
            <summary>{t.purposesSummary}</summary>
            <div className="purposes">
              <h4>{t.purposesTitle}</h4>
              <ul>{t.purposesList.map((li, i) => <li key={i}>{li}</li>)}</ul>

              <h4>{t.specialTitle}</h4>
              <ul>{t.specialList.map((li, i) => <li key={i}>{li}</li>)}</ul>

              <h4>{t.featuresTitle}</h4>
              <ul>{t.featuresList.map((li, i) => <li key={i}>{li}</li>)}</ul>
            </div>
          </details>

          {configOpen && (
            <section ref={configRef} className="cookie-intro__config" aria-label={t.cfgTitle}>
              <h3>{t.cfgTitle}</h3>

              <div className="config-card">
                <h4>{t.necessaryTitle}</h4>
                <p>{t.necessaryText}</p>
                <InlineSwitch checked={true} onChange={() => {}} label={t.necessaryLabel} disabled />
              </div>

              <div className="config-card">
                <h4>{t.prefsTitle}</h4>
                <p>{t.prefsText}</p>
                <InlineSwitch
                  checked={local.preferences}
                  onChange={(v) => setLocal((s) => ({ ...s, preferences: v }))}
                  label={t.prefsLabel}
                />
              </div>

              <div className="config-card">
                <h4>{t.analyticsTitle}</h4>
                <p>{t.analyticsText}</p>
                <InlineSwitch
                  checked={local.analytics}
                  onChange={(v) => setLocal((s) => ({ ...s, analytics: v }))}
                  label={t.analyticsLabel}
                />
              </div>

              <div className="config-card">
                <h4>{t.adsTitle}</h4>
                <p>{t.adsText}</p>
                <InlineSwitch
                  checked={local.ads}
                  onChange={(v) => setLocal((s) => ({ ...s, ads: v }))}
                  label={t.adsLabel}
                />
              </div>

              <div className="config-actions">
                <button className="btn btn--ghost" onClick={() => setConfigOpen(false)}>{t.cancel}</button>
                <button className="btn btn--primary" onClick={onSave}>{t.save}</button>
              </div>
            </section>
          )}
        </div>

        <footer className="cookie-intro__actions">
          <button className="btn btn--ghost" onClick={rejectAll} aria-label={t.actionsReject}>
            {t.actionsReject}
          </button>
          <button className="btn btn--secondary" onClick={() => setConfigOpen(true)} aria-label={t.actionsConfigure}>
            {t.actionsConfigure}
          </button>
          <button className="btn btn--primary" onClick={acceptAll} aria-label={t.actionsAcceptAndContinue}>
            {t.actionsAcceptAndContinue}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CookieIntroModal;
