import React, { useMemo } from "react";
import AdPreviewCard from "./AdPreviewCard";
import {
  DESKTOP_AD_VIGNETTE_SLOTS,
  MOBILE_BOTTOM_AD_VIGNETTE_SLOT,
  TABLET_AD_VIGNETTE_SLOTS,
} from "./AdVignetteConfig";
import "./AdVignetteLayout.css";

const resolveLocale = () => {
  const lang = navigator.language || navigator.userLanguage || "es";
  return lang.toLowerCase().startsWith("es") ? "es" : "en";
};

const splitBySide = (slots) => ({
  left: slots.filter((slot) => slot.side === "left"),
  right: slots.filter((slot) => slot.side === "right"),
});

const AdColumn = ({ side, desktopSlots, tabletSlots, locale }) => (
  <aside className={`overcut-ad-column overcut-ad-column--${side}`} aria-label="Publicidad">
    <div className="overcut-ad-column__desktop">
      {desktopSlots.map((slot) => (
        <AdPreviewCard key={slot.id} slot={slot} locale={locale} className="overcut-ad-card--rail" />
      ))}
    </div>
    <div className="overcut-ad-column__tablet">
      {tabletSlots.map((slot) => (
        <AdPreviewCard key={slot.id} slot={slot} locale={locale} className="overcut-ad-card--tablet" />
      ))}
    </div>
  </aside>
);

const AdVignetteLayout = ({ children, page = "games", placement = "auto" }) => {
  const locale = useMemo(resolveLocale, []);
  const desktopSlots = useMemo(() => splitBySide(DESKTOP_AD_VIGNETTE_SLOTS), []);
  const tabletSlots = useMemo(() => splitBySide(TABLET_AD_VIGNETTE_SLOTS), []);

  return (
    <section className={`overcut-ad-layout overcut-ad-layout--${page} overcut-ad-layout--${placement}`}>
      <AdColumn
        side="left"
        desktopSlots={desktopSlots.left}
        tabletSlots={tabletSlots.left}
        locale={locale}
      />
      <main className="overcut-ad-layout__content">{children}</main>
      <AdColumn
        side="right"
        desktopSlots={desktopSlots.right}
        tabletSlots={tabletSlots.right}
        locale={locale}
      />
      <div className="overcut-ad-layout__mobile-bottom" aria-label="Publicidad">
        <AdPreviewCard
          slot={MOBILE_BOTTOM_AD_VIGNETTE_SLOT}
          locale={locale}
          className="overcut-ad-card--mobile-bottom"
        />
      </div>
    </section>
  );
};

export default AdVignetteLayout;
