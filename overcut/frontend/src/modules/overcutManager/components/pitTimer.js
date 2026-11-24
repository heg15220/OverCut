/**
 * The pit-stop widget's clock, pure (no React): HUD-3 of docs/manager/F1M24-GAMEPLAY.md
 * (pit-widget-and-dialog; RF-CMD-02, RF-SIM-12, RNF-07). It reads only what the engine puts in
 * the car's pose (§1.7: `inPit`, `pitPhase`, `pitStage` from raceClock.liveCarAt) and the race
 * clock, never a time of its own:
 *
 *   lane        time in the pit lane since the car crossed the entry line
 *   stationary  time standing in the box (pitPhase STATIONARY, engine/sim/pitLane.js PHASE)
 *   leaving     the release and the exit road
 *   done        the total, frozen at the exit line, shown for hud.json pitTimer.holdRealSec
 *
 * A quick-mode replay has no phases: the widget shows the lane time and the frozen total.
 */

import HUD from "../data/balance/hud.json";

const LEAVING = ["RELEASE", "EXIT_ROAD"];

/** A fresh memory for one car. */
export const createPitClock = () => ({ enteredAt: null, stopFrom: null, stopTo: null, exitAt: null, exitReal: null, stage: null });

/**
 * Move one car's pit clock to race time `tau` (`realNow` real seconds, for the hold of the frozen
 * total). `pose` is the car's pose. Returns the widget's state or null when there is nothing to show.
 */
export const stepPitClock = (memo, pose, tau, realNow, hud = HUD) => {
  const inPit = Boolean(pose && pose.inPit);
  const phase = pose?.pitPhase ?? null;
  if (inPit) {
    if (memo.enteredAt === null || memo.exitAt !== null) {
      Object.assign(memo, createPitClock(), { enteredAt: tau });
    }
    if (phase === "STATIONARY") {
      if (memo.stopFrom === null) memo.stopFrom = tau;
      memo.stopTo = null;
    } else if (memo.stopFrom !== null && memo.stopTo === null) memo.stopTo = tau;
    if (pose.pitStage) memo.stage = typeof pose.pitStage === "string" ? pose.pitStage : pose.pitStage.name || pose.pitStage.stage || null;
    const stationary = memo.stopFrom === null ? null : (memo.stopTo ?? tau) - memo.stopFrom;
    const state = phase === "STATIONARY" ? "stationary" : LEAVING.includes(phase) ? "leaving" : memo.stopTo !== null ? "leaving" : "lane";
    return { state, laneSec: tau - memo.enteredAt, stationarySec: stationary, totalSec: null, stage: phase === "STATIONARY" ? memo.stage : null, phase };
  }
  if (memo.enteredAt === null) return null;
  if (memo.exitAt === null) {
    memo.exitAt = tau;
    memo.exitReal = realNow;
    if (memo.stopFrom !== null && memo.stopTo === null) memo.stopTo = tau;
  }
  if (realNow - memo.exitReal > (hud.pitTimer?.holdRealSec ?? 0)) return null;
  const stationary = memo.stopFrom === null ? null : memo.stopTo - memo.stopFrom;
  return { state: "done", laneSec: memo.exitAt - memo.enteredAt, stationarySec: stationary, totalSec: memo.exitAt - memo.enteredAt, stage: null, phase: null };
};
