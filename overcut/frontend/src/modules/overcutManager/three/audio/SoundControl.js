/**
 * The sound button of the live race (RF-3D-04): the first click turns the sound on (the
 * browser only lets audio start from a gesture), then it opens the mix: mute and the
 * master, engine and ambience levels, and the interface and radio bus with its own level
 * and mute (AUD-4, radio-ui-sounds), the menus' own music level (AUD-C12; it never plays in
 * the live view), and the recorded engines on or off when this build has
 * them (engineSamples.js), saved per viewer (mixer.js). Texts in ES and EN (RNF-08).
 */

import React, { useState } from "react";
import { t } from "../../components/texts";
import "./sound.css";

const Speaker = ({ muted }) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
  </svg>
);

export default function SoundControl({ audio }) {
  const [open, setOpen] = useState(false);
  if (!audio.supported) return null;
  const { settings, update, enabled, enable } = audio;
  const silent = !enabled || settings.muted;

  const onButton = () => {
    if (!enabled) {
      enable();
      return;
    }
    setOpen((value) => !value);
  };

  const slider = (key, label) => (
    <label className="snd-row">
      <span>{label}</span>
      <input type="range" min="0" max="1" step="0.05" value={settings[key]} onChange={(event) => update({ [key]: Number(event.target.value) })} aria-label={label} />
    </label>
  );

  return (
    <div className="snd">
      <button
        type="button"
        className="mn-btn mn-btn--sm mn-btn--ghost"
        onClick={onButton}
        aria-expanded={enabled ? open : undefined}
        aria-label={enabled ? t("Sonido", "Sound") : t("Activar sonido", "Turn sound on")}
        title={enabled ? t("Mezcla de sonido", "Sound mix") : t("Activar sonido", "Turn sound on")}
      >
        <Speaker muted={silent} />
        <span className="wk-hide-md">{enabled ? t("Sonido", "Sound") : t("Activar sonido", "Sound on")}</span>
      </button>
      {enabled && open && (
        <div className="snd-panel" role="group" aria-label={t("Mezcla de sonido", "Sound mix")}>
          <label className="snd-row snd-row--check">
            <input type="checkbox" checked={settings.muted} onChange={(event) => update({ muted: event.target.checked })} />
            <span>{t("Silenciar", "Mute")}</span>
          </label>
          {slider("master", t("General", "Master"))}
          {slider("engine", t("Motores", "Engines"))}
          {slider("ambience", t("Ambiente", "Ambience"))}
          {slider("ui", t("Interfaz y radio", "Interface and radio"))}
          {slider("music", t("Música de los menús", "Menu music"))}
          <label className="snd-row snd-row--check">
            <input type="checkbox" checked={Boolean(settings.uiMuted)} onChange={(event) => update({ uiMuted: event.target.checked })} />
            <span>{t("Silenciar interfaz y radio", "Mute interface and radio")}</span>
          </label>
          {audio.recordedAvailable && (
            <label className="snd-row snd-row--check" title={t("Grabaciones de F1 2020 (Codemasters) y de Legacy_DMC (gta5-mods.com); sin licencia, solo en local", "Recordings from F1 2020 (Codemasters) and by Legacy_DMC (gta5-mods.com); no licence, local builds only")}>
              <input type="checkbox" checked={settings.recorded !== false} onChange={(event) => update({ recorded: event.target.checked })} />
              <span>{t("Motores grabados", "Recorded engines")}</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
