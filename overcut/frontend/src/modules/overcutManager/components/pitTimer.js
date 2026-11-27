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
 *
 * HUD-C2 (F1M24-CHINA VIEW-16 «panel de boxes por fase», GS-15 the menu): the steps of the stop by the engine's
 * phase (pitStepsOf, hud.json pitTimer.steps) and the estimate the pit dialog gave when the stop was called
 * (previewPit lineToLine, the same line-to-line definition as this stopwatch, PIT-C1), with the difference once the
 * car is out.
 */

import HUD from "../data/balance/hud.json";

const LEAVING = ["RELEASE", "EXIT_ROAD"];

/** A fresh memory for one car. */
export const createPitClock = () => ({ enteredAt: null, stopFrom: null, stopTo: null, exitAt: null, exitReal: null, stage: null, seen: [], estimate: null, nextEstimate: null });

/**
 * GS-15 (HUD-C2, hud.json pitTimer.estimate): remember previewPit's line-to-line time for the stop just called
 * (`sec`, and `kind` green | sc | vsc); it is shown next to the stopwatch on the next entry. Null forgets it.
 */
export const setPitEstimate = (memo, estimate, hud = HUD) => {
  if (!hud.pitTimer?.estimate?.enabled) return memo;
  memo.nextEstimate = estimate && Number.isFinite(estimate.sec) ? { sec: estimate.sec, kind: estimate.kind || "green" } : null;
  return memo;
};

/** The stage name of pose.pitStage: a string, or PIT-C2's { name, t }. */
const stageName = (stage) => (typeof stage === "string" ? stage : stage && (stage.name || stage.stage)) || null;

/**
 * VIEW-16 (HUD-C2): the steps of a stop in order (hud.json pitTimer.steps), each "done", "now" or "next", from the
 * engine's phase now and the phases seen on this stop (`done` once the car is out). A step marked onlyIfSeen (the
 * queue of a double stack) shows only if the car went through it. [] without phases (the quick-mode replay).
 */
export const pitStepsOf = (phase, seen = [], done = false, hud = HUD) => {
  const steps = hud.pitTimer?.steps || [];
  if (!steps.length || (!phase && !seen.length)) return [];
  const kept = steps.filter((step) => !step.onlyIfSeen || step.phases.some((value) => seen.includes(value) || value === phase));
  let current = done ? kept.length : kept.findIndex((step) => step.phases.includes(phase));
  // A phase no step names (TRACK on the entry line): the first step not yet seen is the one under way.
  if (current < 0) current = Math.max(0, kept.findIndex((step) => !step.phases.some((value) => seen.includes(value))));
  return kept.map((step, index) => ({ id: step.id, state: index < current ? "done" : index === current ? "now" : "next" }));
};

/**
 * Move one car's pit clock to race time `tau` (`realNow` real seconds, for the hold of the frozen
 * total). `pose` is the car's pose. Returns the widget's state or null when there is nothing to show.
 */
export const stepPitClock = (memo, pose, tau, realNow, hud = HUD) => {
  const inPit = Boolean(pose && pose.inPit);
  const phase = pose?.pitPhase ?? null;
  if (!Array.isArray(memo.seen)) memo.seen = [];
  if (inPit) {
    if (memo.enteredAt === null || memo.exitAt !== null) {
      const estimate = memo.nextEstimate ?? null;
      Object.assign(memo, createPitClock(), { enteredAt: tau, estimate });
    }
    if (phase && !memo.seen.includes(phase)) memo.seen.push(phase);
    if (phase === "STATIONARY") {
      if (memo.stopFrom === null) memo.stopFrom = tau;
      memo.stopTo = null;
    } else if (memo.stopFrom !== null && memo.stopTo === null) memo.stopTo = tau;
    if (pose.pitStage) memo.stage = stageName(pose.pitStage);
    const stationary = memo.stopFrom === null ? null : (memo.stopTo ?? tau) - memo.stopFrom;
    const state = phase === "STATIONARY" ? "stationary" : LEAVING.includes(phase) ? "leaving" : memo.stopTo !== null ? "leaving" : "lane";
    return { state, laneSec: tau - memo.enteredAt, stationarySec: stationary, totalSec: null, stage: phase === "STATIONARY" ? memo.stage : null, phase, steps: pitStepsOf(phase, memo.seen, false, hud), estimate: memo.estimate ?? null, deltaSec: null };
  }
  if (memo.enteredAt === null) return null;
  if (memo.exitAt === null) {
    memo.exitAt = tau;
    memo.exitReal = realNow;
    if (memo.stopFrom !== null && memo.stopTo === null) memo.stopTo = tau;
    memo.nextEstimate = null;
  }
  if (realNow - memo.exitReal > (hud.pitTimer?.holdRealSec ?? 0)) return null;
  const stationary = memo.stopFrom === null ? null : memo.stopTo - memo.stopFrom;
  const total = memo.exitAt - memo.enteredAt;
  const deltaSec = memo.estimate ? Math.round((total - memo.estimate.sec) * 10) / 10 : null;
  return { state: "done", laneSec: total, stationarySec: stationary, totalSec: total, stage: null, phase: null, steps: pitStepsOf(null, memo.seen, true, hud), estimate: memo.estimate ?? null, deltaSec };
};
