/**
 * The director's safety-car deployment, as a pure step (F1M24-GAMEPLAY §2.11 sc-pose-from-sim,
 * CAM-5; RF-SIM-10, RF-3D-04, RF-SIM-15, RNF-05, RNF-07).
 *
 * When race control sends the safety car out, a broadcast leaves the car it was following for a
 * few seconds: the safety car coming out of the pit lane, then riding with it until the field
 * catches it. Which shots, in what order and for how long is data
 * (data/balance/broadcast.json sequences.scDeploy); this module only walks it.
 *
 *   stepScDeploy(prev, { sc, tau, seed, year }, sequence?) → state
 *
 * - `sc` is the engine's snapshot.sc (§1.7, SIM-5). Without it nothing happens (the view invents
 *   nothing); with it, a shot with trigger `sc:<PHASE>` starts the sequence the first time the
 *   phase is seen after another one (a new deployment, or the view joining one), and `next`
 *   shots follow with a length drawn with the seed between minSec and maxSec.
 * - `tau` is race time: a replayed race is filmed the same (RF-SIM-15 / RNF-05).
 * - Shots the season cannot have are left out (SRS §6: `requires: "safetyCar"`, from 1993).
 * - It ends after its last shot, when the safety car leaves the road (no snapshot, or a phase not
 *   in scView.drawPhases), or in a season without one.
 *
 * State: { active, index, cam, subject, since, dur, lastPhase, deployments }. It never reads or
 * writes the race.
 */

import broadcast from "../../data/balance/broadcast.json";
import { shotAvailable } from "./raceScripts";
import { isScSnapshot, scDrawn, scInEra } from "../../three/safetyCarView";

const SEQUENCE = broadcast.sequences.scDeploy;

const fnv = (text) => {
  let h = 0x811c9dc5;
  const str = String(text);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};
const hash01 = (seed, n) => {
  let h = (seed ^ Math.imul(n | 0, 0x27d4eb2d)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/** Seconds a shot stays on air: drawn with the seed, the deployment and the shot between minSec and maxSec. */
export const scShotLength = (shot, { seed = 0, deployment = 0, index = 0 } = {}) => {
  const lo = shot.minSec ?? 0;
  const hi = Math.max(lo, shot.maxSec ?? lo);
  return lo + (hi - lo) * hash01(fnv(`${seed}|scDeploy|${deployment}`), index + 1);
};

const triggerPhase = (trigger) => {
  const [kind, value] = String(trigger || "").split(":");
  return kind === "sc" ? value : null;
};

const IDLE = (lastPhase = null, deployments = 0) => ({ active: false, index: -1, cam: null, subject: null, since: null, dur: null, lastPhase, deployments });

export const stepScDeploy = (prev, { sc = null, tau, seed = 0, year } = {}, sequence = SEQUENCE) => {
  const now = Number.isFinite(tau) ? tau : 0;
  const lastPhase = prev?.lastPhase ?? null;
  const deployments = prev?.deployments ?? 0;
  const phase = sc && typeof sc.phase === "string" ? sc.phase : null;
  const shots = sequence?.shots || [];
  if (!scInEra(year) || !scDrawn(sc, year)) return IDLE(phase, deployments);
  const usable = (index) => index >= 0 && index < shots.length && shotAvailable(shots[index], year);
  const nextFrom = (from) => {
    for (let k = from; k < shots.length; k += 1) if (usable(k) && shots[k].trigger === "next") return k;
    return -1;
  };
  const cutTo = (index, count) => ({ active: true, index, cam: shots[index].cam, subject: shots[index].subject || "safetyCar", since: now, dur: scShotLength(shots[index], { seed, deployment: count, index }), lastPhase: phase, deployments: count });

  if (prev?.active) {
    if (now - prev.since < prev.dur) return { ...prev, lastPhase: phase };
    const k = nextFrom(prev.index + 1);
    return k >= 0 ? cutTo(k, deployments) : IDLE(phase, deployments);
  }
  // A phase seen for the first time since another one: the shot it triggers, if any.
  if (phase !== lastPhase) {
    const k = shots.findIndex((shot, index) => usable(index) && triggerPhase(shot.trigger) === phase);
    if (k >= 0) return cutTo(k, deployments + 1);
  }
  return IDLE(phase, deployments);
};

/** Every camera id the sequence names (for the tests). */
export const scSequenceCameras = (sequence = SEQUENCE) => [...new Set((sequence?.shots || []).map((shot) => shot.cam))];

// ------------------------------------------------------------- the restart (CAM-C3, VIEW-13)

const RESTART = broadcast.sequences.scRestart;
const TRAIN = broadcast.framing.train;

/** Seconds a restart shot stays on air: drawn with the seed, the restart and the shot (RNF-05). */
export const scRestartShotLength = (shot, { seed = 0, restart = 0, index = 0 } = {}) => {
  const lo = shot.minSec ?? 0;
  const hi = Math.max(lo, shot.maxSec ?? lo);
  return lo + (hi - lo) * hash01(fnv(`${seed}|scRestart|${restart}`), index + 1);
};

const RESTART_IDLE = (lastPhase = null, restarts = 0) => ({ active: false, index: -1, cam: null, subject: null, since: null, dur: null, lastPhase, restarts });

/**
 * One step of the restart after the safety car (F1M24-CHINA §2.5 VIEW-13, CAM-C3; broadcast.json
 * sequences.scRestart): with "safety car in this lap" (sc:IN_THIS_LAP, snapshot.sc of
 * F1M24-GAMEPLAY §1.7, SIM-5) the TV takes the train from the side, then from above, and with the
 * restart (sc:RESTART) the head-on of the straight. A shot whose trigger is a phase starts the first
 * time that phase is seen after another one - the restart cuts in over whatever shot of the
 * sequence is on air - and `next` shots follow with a length drawn with the seed. Between the last
 * `next` shot and a phase still to come the TV goes back to its zones. On the race clock `tau`
 * (RF-SIM-15 / RNF-05).
 *
 *   stepScRestart(prev, { sc, tau, seed, year }, sequence?) → { active, index, cam, subject, since, dur, lastPhase, restarts }
 *
 * Nothing without snapshot.sc (the view invents nothing) or before 1993 (SRS §6: `requires`); the
 * shot the restart itself triggered runs to its end even if the engine drops snapshot.sc after it.
 */
export const stepScRestart = (prev, { sc = null, tau, seed = 0, year } = {}, sequence = RESTART) => {
  const now = Number.isFinite(tau) ? tau : 0;
  const lastPhase = prev?.lastPhase ?? null;
  const restarts = prev?.restarts ?? 0;
  const phase = isScSnapshot(sc) ? sc.phase : null;
  const shots = sequence?.shots || [];
  if (!scInEra(year)) return RESTART_IDLE(phase, restarts);
  const usable = (index) => index >= 0 && index < shots.length && shotAvailable(shots[index], year);
  const opening = shots.findIndex((shot) => triggerPhase(shot.trigger) !== null);
  const cutTo = (index, count) => ({ active: true, index, cam: shots[index].cam, subject: shots[index].subject || "leader", since: now, dur: scRestartShotLength(shots[index], { seed, restart: count, index }), lastPhase: phase, restarts: count });

  // A phase seen for the first time since another one: the shot it triggers, if any (the opening
  // phase counts a new restart; a later phase belongs to the same one).
  if (phase !== null && phase !== lastPhase) {
    const k = shots.findIndex((shot, index) => usable(index) && triggerPhase(shot.trigger) === phase);
    if (k >= 0) return cutTo(k, k === opening || !restarts ? restarts + 1 : restarts);
  }
  if (prev?.active) {
    const byLaterPhase = prev.index !== opening && triggerPhase(shots[prev.index]?.trigger) !== null;
    if (phase === null && !byLaterPhase) return RESTART_IDLE(null, restarts);
    if (now - prev.since < prev.dur) return { ...prev, lastPhase: phase ?? prev.lastPhase };
    for (let k = prev.index + 1; k < shots.length; k += 1) {
      if (!usable(k)) continue;
      if (shots[k].trigger === "next") return cutTo(k, restarts);
      break;
    }
    return RESTART_IDLE(phase ?? prev.lastPhase, restarts);
  }
  return RESTART_IDLE(phase, restarts);
};

/** Every camera id the restart names (for the tests). */
export const scRestartCameras = (sequence = RESTART) => [...new Set((sequence?.shots || []).map((shot) => shot.cam))];

/**
 * The train behind the safety car, for the TV's wider frame (broadcast.json framing.train, VIEW-13):
 * with snapshot.sc in one of `phases`, the subject and the cars running nose to tail with it - each
 * less than maxGapM behind the next, at most maxCars, the cars ahead of the subject first - as
 * { kind: "train", ids (front first), share }. Gaps in metres from the progress of the poses and the
 * lap length (`lengthM`) when known, else from the timing interval and the safety car's speed.
 * null when there is no train to frame (no snapshot, another phase, a lone car, an unset key).
 */
export const trainFraming = (rows = [], subjectId, { sc = null, lengthM = null } = {}, cfg = TRAIN) => {
  if (!isScSnapshot(sc) || !cfg?.phases?.includes(sc.phase)) return null;
  if (!Number.isFinite(cfg.maxCars) || !Number.isFinite(cfg.maxGapM) || !Number.isFinite(cfg.trainShare)) return null;
  const onTrack = rows.filter((row) => row && !row.out && !row.pose?.gone && !row.pose?.inPit && !row.pose?.finished);
  const at = onTrack.findIndex((row) => row.car?.id === subjectId);
  if (at < 0) return null;
  const gapM = (ahead, behind) => {
    if (Number.isFinite(lengthM) && lengthM > 0 && Number.isFinite(ahead.pose?.progress) && Number.isFinite(behind.pose?.progress)) return (ahead.pose.progress - behind.pose.progress) * lengthM;
    if (Number.isFinite(behind.interval) && Number.isFinite(sc.v) && (behind.lapsDown || 0) === (ahead.lapsDown || 0)) return behind.interval * sc.v;
    return Infinity;
  };
  /** Is car k nose to tail with the car ahead of it? */
  const linked = (k) => {
    if (k <= 0 || k >= onTrack.length) return false;
    const gap = gapM(onTrack[k - 1], onTrack[k]);
    return gap >= 0 && gap < cfg.maxGapM;
  };
  let from = at;
  let to = at;
  while (to - from + 1 < cfg.maxCars) {
    if (linked(from)) from -= 1;
    else if (linked(to + 1)) to += 1;
    else break;
  }
  if (to === from) return null;
  return { kind: "train", ids: onTrack.slice(from, to + 1).map((row) => row.car.id), share: cfg.trainShare };
};

export default stepScDeploy;
