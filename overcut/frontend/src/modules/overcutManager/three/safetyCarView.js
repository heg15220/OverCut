/**
 * The safety car as the view draws it, pure (F1M24-GAMEPLAY §2.11 sc-pose-from-sim, CAM-5;
 * RF-SIM-10, RF-3D-04, RNF-05, RNF-07). No three.js, no randomness, nothing written back.
 *
 * Before CAM-5 the 3D view put a safety car 90 m ahead of the leader whenever a neutralisation
 * was on. Now the engine says where it is: `snapshot.sc` (§1.7, SIM-5)
 *   { phase: "DEPLOYED"|"PICKUP"|"TRAIN"|"UNLAPPING"|"IN_THIS_LAP"|"RESTART", s, v, lap, lightsOn }
 * and the view only draws it. Without it nothing is drawn (the view invents nothing).
 *
 * - `s` is where the safety car is on the lap. The engine gives positions on the lap as a share
 *   (0..1, as `yellow.s`); a value above 1 is read as metres along the lap. `progress` (laps) or
 *   `x`/`y`/`heading` in the sim plane win when the snapshot carries them.
 * - Which phases put the car on the road, and the lights when `lightsOn` is missing, are
 *   data/balance/broadcast.json `scView`; the flashing of the light bar is `scLights`.
 * - SRS §6: no safety car before its era (engine/rules.js raceControl.safetyCar, from 1993).
 */

import broadcast from "../data/balance/broadcast.json";
import { poseAt } from "../engine/trackGeometry";
import { rulesFor } from "../engine/rules";

const VIEW = broadcast.scView;
const LIGHTS = broadcast.scLights;
const wrap = (value) => ((value % 1) + 1) % 1;

/** Does the season have a safety car at all? (SRS §6.2: from 1993; no year → no.) */
export const scInEra = (year) => Number.isFinite(year) && Boolean(rulesFor(year).raceControl.safetyCar);

/** Is `value` the engine's snapshot.sc (and not a pose handed over by an older view)? */
export const isScSnapshot = (value) => Boolean(value) && typeof value === "object" && typeof value.phase === "string";

/** Is the safety car on the road in this snapshot, in this season? */
export const scDrawn = (sc, year, cfg = VIEW) => isScSnapshot(sc) && scInEra(year) && cfg.drawPhases.includes(sc.phase);

/** Its share of the lap (0..1), or null if the snapshot does not say. */
export const scShareOf = (sc, circuit) => {
  if (!sc) return null;
  if (Number.isFinite(sc.progress)) return wrap(sc.progress);
  if (!Number.isFinite(sc.s)) return null;
  if (sc.s >= 0 && sc.s <= 1) return sc.s;
  return circuit?.length > 0 ? wrap(sc.s / circuit.length) : null;
};

/** Where to draw it: { x, y, heading, progress, v } in the sim plane, or null. */
export const scPoseOf = (sc, circuit, year, cfg = VIEW) => {
  if (!scDrawn(sc, year, cfg) || !circuit?.length) return null;
  const share = scShareOf(sc, circuit);
  const v = Number.isFinite(sc.v) ? sc.v : null;
  if (Number.isFinite(sc.x) && Number.isFinite(sc.y) && Number.isFinite(sc.heading)) return { x: sc.x, y: sc.y, heading: sc.heading, progress: share, v };
  if (share === null) return null;
  return { ...poseAt(circuit, share), progress: share, v };
};

/**
 * Are its orange lights on? The engine's `lightsOn` when it sends one; otherwise off in the phases
 * of scView.lightsOffPhases (FIA: the lights go out when "safety car in this lap" is shown).
 */
export const scLightsOn = (sc, cfg = VIEW) => {
  if (!isScSnapshot(sc)) return false;
  if (typeof sc.lightsOn === "boolean") return sc.lightsOn;
  return !cfg.lightsOffPhases.includes(sc.phase);
};

/**
 * How bright each half of the light bar is now, [left, right] in 0..1. With `flashHz` the halves
 * alternate (pattern "alternate") or flash together ("together") with the duty cycle of scLights;
 * with flashHz null they stay lit. `timeSec` is the view's own clock (a flash rate in race time
 * would strobe at 16x; nothing here touches the race, RNF-05).
 */
export const scLightLevels = (timeSec, on, cfg = LIGHTS) => {
  if (!on) return [0, 0];
  if (!Number.isFinite(cfg.flashHz) || cfg.flashHz <= 0) return [1, 1];
  const phase = wrap((Number.isFinite(timeSec) ? timeSec : 0) * cfg.flashHz);
  const duty = cfg.dutyCycle;
  if (cfg.pattern === "together") {
    const lit = phase < duty ? 1 : cfg.offLevel;
    return [lit, lit];
  }
  const half = wrap(phase + 0.5);
  return [phase < duty ? 1 : cfg.offLevel, half < duty ? 1 : cfg.offLevel];
};

export default scPoseOf;
