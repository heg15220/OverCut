import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getConsent, saveConsent } from "../backend/consentService";
import { loadScriptOnce, insertRawScriptOnce, unloadAllByPrefix } from "./ScriptManager";

const ConsentContext = createContext(null);

export const ConsentProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);

  // 1) Recuperar estado desde backend al montar
  useEffect(() => {
    getConsent(
      (dto) => {
        setPreferences(!!dto.preferences);
        setAnalytics(!!dto.analytics);
        setAds(!!dto.ads);
        // Si no hay consentimiento en nada, mostrar banner; si ya lo hay, ocultarlo
        const hasAny = !!dto.preferences || !!dto.analytics || !!dto.ads;
        setBannerOpen(!hasAny);
        setLoaded(true);
      },
      () => {
        // si falla, mostrar banner por defecto (con todo desactivado)
        setLoaded(true);
        setBannerOpen(true);
      }
    );
  }, []);

  // 2) Efecto: montar/desmontar scripts según flags
  useEffect(() => {
    if (!loaded) return;

    // ANALYTICS: ejemplo GA4 (solo si analytics === true)
    if (analytics) {
      // Cargar gtag y configurar GA4
      loadScriptOnce("ga:gtag", "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX");
      insertRawScriptOnce("ga:init", `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        // Reemplaza G-XXXXXXX por tu ID real
        gtag('config', 'G-XXXXXXX', { anonymize_ip: true });
      `);
    } else {
      // Descarga todo lo de GA si el usuario lo retira (las cookies de GA4 son 1P; se pueden limpiar adicionalmente si lo necesitas)
      unloadAllByPrefix("ga:");
    }

    // ADS: ejemplo Google Ads/Ad Manager (solo si ads === true)
    if (ads) {
      // Ejemplo básico: Google Tag (conversion linker) o AdSense
      loadScriptOnce("ads:gtm", "https://www.googletagmanager.com/gtm.js?id=GTM-YYYYYYY");
      // O Ads: loadScriptOnce("ads:adsbygoogle", "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
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
  };

  const rejectAll = () => {
    setAndPersist({ preferences: false, analytics: false, ads: false });
    setBannerOpen(false);
  };

  const value = useMemo(
    () => ({
      loaded,
      preferences, analytics, ads,
      panelOpen, setPanelOpen,
      bannerOpen, setBannerOpen,
      acceptAll, rejectAll,
      save: (flags) => setAndPersist(flags),
    }),
    [loaded, preferences, analytics, ads, panelOpen, bannerOpen]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = () => {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within <ConsentProvider/>");
  return ctx;
};
