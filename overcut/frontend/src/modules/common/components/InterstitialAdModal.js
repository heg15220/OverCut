import React, { useEffect, useMemo, useState } from "react";
import "./InterstitialAdModal.css";

const InterstitialAdModal = ({
  open,
  onClose,
  closeDelayMs = 2500,
  closePosition = "right", // "right" | "left"
  title = "AD",
  subtitle = "Sponsored",
}) => {
  const [canClose, setCanClose] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const delaySeconds = useMemo(() => Math.ceil(closeDelayMs / 1000), [closeDelayMs]);

  useEffect(() => {
    if (!open) {
      setCanClose(false);
      setSecondsLeft(0);
      return;
    }

    setCanClose(false);
    setSecondsLeft(delaySeconds);

    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const timer = setTimeout(() => {
      setCanClose(true);
    }, closeDelayMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [open, closeDelayMs, delaySeconds]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      // Escape solo si ya puede cerrarse
      if (e.key === "Escape" && canClose) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, canClose, onClose]);

  if (!open) return null;

  return (
    <div className="oc-interstitial" role="dialog" aria-modal="true">
      <div className="oc-interstitial__backdrop" />

      <div className="oc-interstitial__content">
        <button
          className={`oc-interstitial__close oc-interstitial__close--${closePosition} ${canClose ? "is-enabled" : ""}`}
          onClick={() => canClose && onClose?.()}
          disabled={!canClose}
          aria-label="Close ad"
          title={canClose ? "Close" : `Wait ${secondsLeft}s`}
        >
          {canClose ? "✕" : `${secondsLeft}s`}
        </button>

        <div className="oc-interstitial__ad">
          <div className="oc-interstitial__badge">
            <span className="oc-interstitial__badgeTitle">{title}</span>
            <span className="oc-interstitial__badgeSub">{subtitle}</span>
          </div>

          {/* ✅ Aquí podrás meter AdSense/Provider real en el futuro */}
          <div className="oc-interstitial__adBox">
            <div className="oc-interstitial__fakeAdText">
              FULLSCREEN AD PLACEHOLDER
              <br />
              (responsive)
            </div>
          </div>

          <div className="oc-interstitial__hint">
            {canClose ? "You can close now" : "Please wait a moment…"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterstitialAdModal;
