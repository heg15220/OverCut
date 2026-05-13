import React from "react";
import { useConsent } from "../../../cookies/ConsentContext";
import { AD_VIGNETTES_ENABLED } from "./AdVignetteConfig";

const AdPreviewCard = ({ slot, className = "" }) => {
  const { loaded, ads } = useConsent();
  const advertisingAllowed = AD_VIGNETTES_ENABLED && loaded && ads;
  const canLink = advertisingAllowed && slot?.targetUrl;
  const RootTag = canLink ? "a" : "article";
  const rootProps = canLink
    ? { href: slot.targetUrl, target: "_blank", rel: "noreferrer" }
    : {};

  if (!advertisingAllowed) {
    return null;
  }

  return (
    <RootTag
      {...rootProps}
      className={["overcut-ad-card", className].filter(Boolean).join(" ")}
      data-provider={slot?.provider || "placeholder"}
      data-ad-consent="granted"
      data-linked={canLink ? "true" : "false"}
      aria-label="Publicidad"
    />
  );
};

export default AdPreviewCard;
