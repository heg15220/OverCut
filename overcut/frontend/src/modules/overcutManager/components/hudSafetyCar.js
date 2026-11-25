/**
 * The safety car and the VSC on the HUD, pure (no React): HUD-5 of docs/manager/F1M24-GAMEPLAY.md
 * (sc-pose-from-sim, the HUD; §2.11, §1.5 "Coche de seguridad en la vista", §1.7 `sc`/`vsc`;
 * RF-SIM-10, RF-3D-04, RNF-07, RNF-09). The view reads the engine and nothing else:
 *
 *   scPhaseOf(sc)            the engine's phase (DEPLOYED, PICKUP, TRAIN, UNLAPPING, IN_THIS_LAP, RESTART) or null
 *   scPhaseLabel(phase)      its words (OverCut's own text, ES and EN)
 *   scInThisLap(opts)        "the safety car comes in this lap": snapshot.sc's IN_THIS_LAP; without it, the
 *                            engine's own count (the leader's lap that ends the spell, or state.safetyCar
 *                            with one lap to go past its deployment lap) - hud.json sc.inThisLap.engineFallback
 *   vscEnding(opts)          snapshot.vsc.ending, only
 *   vscDeltaOf(vsc, index)   one car's VSC delta: { deltaSec, marginSec, state: "margin" | "tight" | "under" }
 *   scMapPose(circuit, sc)   where to draw it on the 2D map (poseAt of its lap share), or null
 *   scBannerOf(opts)         the banner over the picture, or null
 *
 * Nothing here exists outside its era (SRS §6.2): no safety car before rules.raceControl.safetyCar
 * (1993), no VSC before rules.raceControl.vsc (2015). With no `sc` from the engine the view draws no
 * safety car - the 90 m ahead of the leader the view used to invent are gone.
 */

import HUD from "../data/balance/hud.json";
import { poseAt } from "../engine/trackGeometry";
import { t } from "./texts";

export const SC_HUD = HUD.sc;

export const SC_PHASES = ["DEPLOYED", "PICKUP", "TRAIN", "UNLAPPING", "IN_THIS_LAP", "RESTART"];

const PHASE_WORDS = {
  DEPLOYED: () => t("en pista", "deployed"),
  PICKUP: () => t("busca al líder", "picking up the leader"),
  TRAIN: () => t("pelotón en fila", "field lined up"),
  UNLAPPING: () => t("los doblados recuperan la vuelta", "lapped cars unlapping"),
  IN_THIS_LAP: () => t("entra esta vuelta", "in this lap"),
  RESTART: () => t("reanudación", "restart"),
};

const scAllowed = (rules) => Boolean(rules?.raceControl?.safetyCar);
const vscAllowed = (rules) => Boolean(rules?.raceControl?.vsc);

/** The engine's safety-car phase, or null (absent, unknown or a race without a safety car). */
export const scPhaseOf = (sc) => (sc && SC_PHASES.includes(sc.phase) ? sc.phase : null);

/** The words of a phase ("" when there is none or the labels are off). */
export const scPhaseLabel = (phase) => (SC_HUD.phaseLabels.enabled && PHASE_WORDS[phase] ? PHASE_WORDS[phase]() : "");

/**
 * Whether the safety car comes in at the end of the lap the leader is on.
 *   sc            the engine's snapshot.sc now (null/undefined without SIM-5)
 *   window        the safety-car window under way {from, to, virtual, red} (raceClock)
 *   leaderHistory the view's leader's lap history
 *   tau           race time of the pictures
 *   tolerance     seconds a spell's end may sit from the leader's line crossing (a step race: one step)
 *   engineSc      the engine's state.safetyCar now {laps, since, virtual, red} (step race), and
 *   engineLap     the laps the leader has completed in the engine (state.lap)
 *   rules         rulesOf(era, year)
 */
export const scInThisLap = ({ sc = null, window = null, leaderHistory = [], tau, tolerance = 1e-6, engineSc = null, engineLap = null, rules }) => {
  if (!scAllowed(rules) || !SC_HUD.inThisLap.enabled) return false;
  const phase = scPhaseOf(sc);
  if (phase) return phase === "IN_THIS_LAP";
  if (!SC_HUD.inThisLap.engineFallback || !window || window.virtual || window.red) return false;
  if (Number.isFinite(window.to)) {
    if (tau >= window.to) return false;
    const entry = leaderHistory.find((item) => !item.retired && Math.abs(item.end - window.to) <= tolerance + 1e-9);
    return Boolean(entry && tau >= entry.start);
  }
  // A step race whose spell is still open in the engine: one lap left, counted past the deployment lap.
  return Boolean(engineSc && !engineSc.virtual && !engineSc.red && engineSc.laps === 1 && Number.isFinite(engineSc.since) && Number.isFinite(engineLap) && engineLap >= engineSc.since);
};

/** Whether race control has called the end of the VSC (snapshot.vsc.ending; no guess without it). */
export const vscEnding = ({ vsc = null, window = null, rules }) =>
  Boolean(vscAllowed(rules) && SC_HUD.vscEnding.enabled && vsc && vsc.ending && (!window || window.virtual));

/**
 * One car's VSC delta from snapshot.vsc.deltaSec[index]: `marginSec` is positive while the car is slower
 * than the FIA minimum (hud.json sc.vscDelta.positiveMeans says how the engine signs it). Null without it.
 */
export const vscDeltaOf = (vsc, index, rules) => {
  const config = SC_HUD.vscDelta;
  if (!config.enabled || !vscAllowed(rules) || !vsc || !Array.isArray(vsc.deltaSec) || !Number.isInteger(index)) return null;
  const deltaSec = vsc.deltaSec[index];
  if (!Number.isFinite(deltaSec)) return null;
  const marginSec = config.positiveMeans === "margin" ? deltaSec : -deltaSec;
  const state = marginSec < 0 ? "under" : marginSec < config.tightBelowSec ? "tight" : "margin";
  return { deltaSec, marginSec, state };
};

/** The words and the number of a VSC delta, for the card. */
export const vscDeltaText = (delta) => {
  if (!delta) return null;
  const { decimals } = SC_HUD.vscDelta;
  const value = `${delta.marginSec >= 0 ? "+" : "−"}${Math.abs(delta.marginSec).toFixed(decimals)} s`;
  const word = {
    margin: () => t("en margen", "within the delta"),
    tight: () => t("justo", "tight"),
    under: () => t("por debajo del delta", "below the delta"),
  }[delta.state]();
  return { value, word, tone: delta.state === "under" ? "is-bad" : delta.state === "tight" ? "is-warn" : "is-good" };
};

/** Where the engine's safety car is on the 2D map: the pose at its lap share, with its lights; or null. */
export const scMapPose = (circuit, sc, rules) => {
  if (!SC_HUD.map.enabled || !scAllowed(rules) || !scPhaseOf(sc) || !Number.isFinite(sc.s)) return null;
  const share = ((sc.s % 1) + 1) % 1;
  return { ...poseAt(circuit, share), share, phase: sc.phase, lightsOn: Boolean(sc.lightsOn), v: Number.isFinite(sc.v) ? sc.v : null };
};

/**
 * The banner over the picture while it holds: { kind: "scIn" | "vscEnding", title }, or null.
 * `inThisLap` and `ending` are scInThisLap / vscEnding.
 */
export const scBannerOf = ({ inThisLap = false, ending = false }) => {
  if (inThisLap) return { kind: "scIn", title: t("El coche de seguridad entra esta vuelta", "Safety car in this lap") };
  if (ending) return { kind: "vscEnding", title: t("VSC terminando", "VSC ending") };
  return null;
};
