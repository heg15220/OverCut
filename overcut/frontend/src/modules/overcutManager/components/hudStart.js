/**
 * The HUD at the start, pure (no React): HUD-C3 of docs/manager/F1M24-CHINA.md (VIEW-10, the HUD part;
 * §2.5 «el HUD nunca está con las luces»; RF-3D-04, RNF-05, RNF-07).
 *
 *   hudOpacityOf({ phase, sinceOut }, start)
 *                 the HUD's opacity 0..1 from the engine's snapshot.start (its phase: formation, grid,
 *                 lights, out) and the race seconds since lights out: 0 in hud.json start.hiddenPhases,
 *                 0 after lights out until start.hudDelaySec, then a linear fade over start.fadeSec
 *                 (null = all at once, as before). The race clock only, never the wall clock (RNF-05).
 */

import HUD from "../data/balance/hud.json";

const clamp01 = (value) => Math.max(0, Math.min(1, value));

export const hudOpacityOf = ({ phase = "out", sinceOut = 0 } = {}, start = HUD.start) => {
  if (phase !== "out") return (start.hiddenPhases || []).includes(phase) ? 0 : 1;
  const delay = start.hudDelaySec ?? 0;
  const since = Number.isFinite(sinceOut) ? sinceOut : 0;
  if (since < delay) return 0;
  const fade = start.fadeSec;
  if (!(fade > 0) || since >= delay + fade) return 1;
  return clamp01((since - delay) / fade);
};

export default hudOpacityOf;
