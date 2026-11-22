/** The one button that moves the season on, saying what it will do. */

import React from "react";
import { IconPlay, IconRadio } from "./icons";
import { nextAction } from "../engine/career";
import { useManager } from "./context";
import { raceName, t } from "./texts";

export default function ContinueButton({ size = "md" }) {
  const { career, advance, setWeekendOpen } = useManager();
  const action = nextAction(career);
  if (action.kind === "race" && action.stage !== "preview") {
    return (
      <button type="button" className={`mn-continue is-live mn-continue--${size}`} onClick={() => setWeekendOpen(true)}>
        <IconRadio size={18} />
        <span>{t("Volver al fin de semana", "Back to the weekend")}</span>
      </button>
    );
  }
  const label = {
    race: () => t(`Ir al ${raceName(action.race.name)}`, `Go to the ${raceName(action.race.name)}`),
    review: () => t("Resumen de la temporada", "Season review"),
    "new-season": () => t(`Empezar ${action.year}`, `Start ${action.year}`),
    ended: () => t("Fin de la partida", "Career over"),
  }[action.kind];
  return (
    <button type="button" className={`mn-continue mn-continue--${size}`} onClick={advance}>
      <span className="mn-continue__key" aria-hidden="true">
        <IconPlay size={14} />
      </span>
      <span>{label ? label() : t("Continuar", "Continue")}</span>
    </button>
  );
}
