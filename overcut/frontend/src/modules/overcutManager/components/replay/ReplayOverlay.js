/**
 * What sits over the picture during a replay (F1M24-GAMEPLAY §2.5 replays, CAM-3; RF-3D-04,
 * RNF-07, RNF-08, RNF-09): OverCut's own sting - the OverCut logo, wiping in and out over the
 * picture for replay.stingSec at each end (no asset, sound or text of any other game) - and,
 * while the replay runs, the rest of the HUD hidden but for a label (what happened, in words:
 * never colour alone), the driver and a skip button (Escape too). With prefers-reduced-motion the
 * sting is a still card, without the wipe.
 *
 * Controlled: `plan` (replayBuffer.planReplay) and `elapsed` (the replay clock, seconds, which
 * HUD-4 owns in LiveRace) decide what shows; `names` maps car ids to names; `onSkip` ends it.
 * It draws only: nothing here touches the race (RNF-05).
 */

import React, { useEffect, useRef, useState } from "react";
import logo from "../../../app/components/Resources/LogoOverCut.png";
import { prefersReducedMotion } from "../Transition";
import { t } from "../texts";
import { replayFrameAt } from "./replayBuffer";
import "./replay.css";

/** The words for what a replay shows (ES / EN, RNF-08). */
export const replayLabel = (trigger) => {
  switch (trigger) {
    case "pass":
      return t("Adelantamiento", "Overtake");
    case "mistake":
      return t("Error de pilotaje", "Driver error");
    case "dnf":
      return t("Abandono", "Retirement");
    case "pitOther":
      return t("Parada en boxes", "Pit stop");
    case "finish":
      return t("Bandera a cuadros", "Chequered flag");
    default:
      return t("Repetición", "Replay");
  }
};

export default function ReplayOverlay({ plan, elapsed = 0, names = {}, onSkip }) {
  const [reduced] = useState(prefersReducedMotion);
  const skip = useRef(onSkip);
  skip.current = onSkip;

  useEffect(() => {
    if (!plan) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      skip.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [plan]);

  if (!plan) return null;
  const frame = replayFrameAt(plan, elapsed);
  if (frame.phase === "done") return null;
  const sting = frame.phase === "stingIn" || frame.phase === "stingOut";
  const driver = plan.subjectId !== null ? names[plan.subjectId] : null;
  const other = plan.otherId !== null ? names[plan.otherId] : null;
  return (
    <div className={`mn-replay is-${frame.phase}${reduced ? " is-still" : ""}`} data-testid="replay-overlay" style={{ "--mn-replay-sting": `${Math.round((plan.stingSec || 0) * 1000)}ms` }}>
      {sting && (
        <div className="mn-replay__sting" aria-hidden="true">
          <img src={logo} alt="" />
        </div>
      )}
      <div className="mn-replay__bar" role="status" aria-live="polite">
        <span className="mn-replay__tag">{t("Repetición", "Replay")}</span>
        <strong className="mn-replay__label">{replayLabel(plan.trigger)}</strong>
        {driver && <span className="mn-replay__driver">{other ? `${driver} · ${other}` : driver}</span>}
        <button type="button" className="mn-btn mn-replay__skip" onClick={() => skip.current?.()}>
          {t("Saltar", "Skip")}
        </button>
      </div>
    </div>
  );
}
