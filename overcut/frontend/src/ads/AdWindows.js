// ============================
// AdWindows.jsx (2 slots/side)
// ============================
import React from "react";
import { useConsent } from "../cookies/ConsentContext";
import "./ad-windows.css";

const AdWindows = ({
  children,
  className = "",
  showBottomOnDesktop = false,
  enableTabletSide = true,
  placeholders = true,
}) => {
  const { loaded, ads } = useConsent();

  if (!loaded) return <>{children}</>;
  if (!ads) return <>{children}</>;

  return (
    <div className={`oc-ad-layout ${className}`}>
      {/* LEFT: 2 slots */}
      <aside className="oc-ad-slot oc-ad-left" aria-label="Publicidad lateral izquierda">
        <div className="oc-ad-stack">
          <div className="oc-ad-stack__item" aria-label="Publicidad lateral izquierda superior">
            {placeholders ? (
              <AdPlaceholder label="AD • Left Top (Desktop)" />
            ) : (
              <AdSlot id="left-top" />
            )}
          </div>

          <div className="oc-ad-stack__item" aria-label="Publicidad lateral izquierda inferior">
            {placeholders ? (
              <AdPlaceholder label="AD • Left Bottom (Desktop)" />
            ) : (
              <AdSlot id="left-bottom" />
            )}
          </div>
        </div>
      </aside>

      <main className="oc-ad-main">{children}</main>

      {/* RIGHT: 2 slots */}
      <aside className="oc-ad-slot oc-ad-right" aria-label="Publicidad lateral derecha">
        <div className="oc-ad-stack">
          <div className="oc-ad-stack__item" aria-label="Publicidad lateral derecha superior">
            {placeholders ? (
              <AdPlaceholder label="AD • Right Top (Desktop)" />
            ) : (
              <AdSlot id="right-top" />
            )}
          </div>

          <div className="oc-ad-stack__item" aria-label="Publicidad lateral derecha inferior">
            {placeholders ? (
              <AdPlaceholder label="AD • Right Bottom (Desktop)" />
            ) : (
              <AdSlot id="right-bottom" />
            )}
          </div>
        </div>
      </aside>

      {enableTabletSide && (
        <aside className="oc-ad-slot oc-ad-tablet-side" aria-label="Publicidad lateral tablet">
          {placeholders ? <AdPlaceholder label="AD • Tablet Side" /> : <AdSlot id="tablet-side" />}
        </aside>
      )}

      <div
        className={`oc-ad-slot oc-ad-bottom ${showBottomOnDesktop ? "oc-ad-bottom--desktop" : ""}`}
        aria-label="Publicidad inferior"
      >
        {placeholders ? <AdPlaceholder label="AD • Bottom (Sticky)" /> : <AdSlot id="bottom" />}
      </div>
    </div>
  );
};

const AdPlaceholder = ({ label }) => (
  <div className="oc-ad-placeholder">
    <div className="oc-ad-placeholder__badge">{label}</div>
    <div className="oc-ad-placeholder__box" />
  </div>
);

const AdSlot = ({ id }) => (
  <div className="oc-ad-fill" data-oc-ad-slot={id}>
    {/* Aquí irá el snippet real del proveedor */}
  </div>
);

export const AdInline = ({
  id = "inline",
  label = "AD • Inline",
  placeholders = true,
  variant = "normal",      // ✅ nuevo
  className = "",          // ✅ nuevo
}) => (
  <div
    className={`oc-ad-slot oc-ad-inline ${variant === "mini" ? "oc-ad-inline--mini" : ""} ${className}`}
    aria-label="Publicidad inline"
  >
    {placeholders ? <AdPlaceholder label={label} /> : <AdSlot id={id} />}
  </div>
);


export default AdWindows;
