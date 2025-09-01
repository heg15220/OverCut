import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getConsent, saveConsent } from "../backend/consentService";
import { loadScriptOnce, insertRawScriptOnce, unloadAllByPrefix } from "./ScriptManager";

const ConsentContext = createContext(null);

export const ConsentProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  // UI
  const [bannerOpen, setBannerOpen] = useState(true);   // muestra/oculta la modal
  const [configOpen, setConfigOpen] = useState(false);  // abre la sección de configuración dentro de la modal

  // Cargar estado desde backend al montar
  useEffect(() => {
    getConsent(
      (dto) => {
        setPreferences(!!dto.preferences);
        setAnalytics(!!dto.analytics);
        setAds(!!dto.ads);
        const hasAny = !!dto.preferences || !!dto.analytics || !!dto.ads;
        setBannerOpen(!hasAny); // si ya hay consentimiento, no mostramos modal
        setLoaded(true);
      },
      () => {
        setLoaded(true);
        setBannerOpen(true);
      }
    );
  }, []);

  // Montar / desmontar scripts en función del consentimiento
  useEffect(() => {
    if (!loaded) return;

    if (analytics) {
      loadScriptOnce("ga:gtag", "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX");
      insertRawScriptOnce("ga:init", `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXX', { anonymize_ip: true });
      `);
    } else {
      unloadAllByPrefix("ga:");
    }

    if (ads) {
      loadScriptOnce("ads:gtm", "https://www.googletagmanager.com/gtm.js?id=GTM-YYYYYYY");
    } else {
      unloadAllByPrefix("ads:");
    }
  }, [loaded, analytics, ads]);

  const setAndPersist = (next) =>
    saveConsent(next, () => {
      setPreferences(!!next.preferences);
      setAnalytics(!!next.analytics);
      setAds(!!next.ads);
    });

  const acceptAll = () => {
    setAndPersist({ preferences: true, analytics: true, ads: true });
    setBannerOpen(false);
    setConfigOpen(false);
  };

  const rejectAll = () => {
    setAndPersist({ preferences: false, analytics: false, ads: false });
    setBannerOpen(false);
    setConfigOpen(false);
  };

  // Reabrir modal directamente en "Configurar" desde cualquier parte (p.ej. footer)
  const openConfig = () => {
    setBannerOpen(true);
    setConfigOpen(true);
  };

  const value = useMemo(() => ({
    loaded,
    preferences, analytics, ads,
    bannerOpen, setBannerOpen,
    configOpen, setConfigOpen,
    openConfig,
    acceptAll, rejectAll,
    save: (flags) => setAndPersist(flags),
  }), [loaded, preferences, analytics, ads, bannerOpen, configOpen]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export const useConsent = () => {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within <ConsentProvider/>");
  return ctx;
};
