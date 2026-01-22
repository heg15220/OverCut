// ============================
// AdWindows.jsx (UPDATED)
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
      <aside className="oc-ad-slot oc-ad-left" aria-label="Publicidad lateral izquierda">
        {placeholders ? <AdPlaceholder label="AD • Left (Desktop)" /> : <AdSlot id="left" />}
      </aside>

      <main className="oc-ad-main">{children}</main>

      <aside className="oc-ad-slot oc-ad-right" aria-label="Publicidad lateral derecha">
        {placeholders ? <AdPlaceholder label="AD • Right (Desktop)" /> : <AdSlot id="right" />}
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

export const AdInline = ({ id = "inline", label = "AD • Inline", placeholders = true }) => (
  <div className="oc-ad-slot oc-ad-inline" aria-label="Publicidad inline">
    {placeholders ? <AdPlaceholder label={label} /> : <AdSlot id={id} />}
  </div>
);

export default AdWindows;
