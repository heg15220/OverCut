/**
 * Safety car and VSC sound (sc-vsc-sound, AUD-5; RF-SIM-10, RNF-07; F1M24-GAMEPLAY §2.11).
 *
 * The F1 cars already slow down by themselves under a neutralisation: the engine hands
 * pose.rpm/gear (race-powertrain.json shift.underSc, PT-1) or a lower pose speed. What this
 * adds, all from data/balance/audio.json `safetyCar`:
 *
 *   the safety car's voice   the season's road car (safetyCar.cars[], engineSynth
 *                            safetyCarSpecFor) on the pooled voices, while the engine's
 *                            snapshot.sc (§1.7, SIM-5) is in a phase of `voicePhases` and has a
 *                            place: x/y in the snapshot, a pose the view hands, or `s` along the
 *                            frame's circuit. Without snapshot.sc there is no safety car to hear:
 *                            nothing is placed 90 m ahead of the leader.
 *   the cues                 an alert and the wordless «radio» (uiSounds) when the SC or the VSC
 *                            is deployed and when it is withdrawn (SC in `withdrawPhases`, VSC
 *                            `ending`, or the neutralisation gone without a warning), once each.
 *
 * Era coherence (SRS 6.2): no safety car voice or cue before 1993 and no VSC cue before 2015
 * (rules.js, pack or era-defaults). Pure and seedless: nothing here draws a random number or
 * touches the race (RF-SIM-15, RNF-05).
 */

import audioData from "../../data/balance/audio.json";
import { poseAt } from "../../engine/trackGeometry";
import { neutralisationsOf } from "./engineSynth";

const SC = audioData.safetyCar;

/** The id the safety car's voice goes by among the cars of a frame. */
export const SAFETY_CAR_ID = "__safety-car__";

const isObject = (value) => Boolean(value) && typeof value === "object";

/** Is the snapshot's safety car on the road (a phase of voicePhases)? */
export const scOnTrack = (sc, cfg = SC) => isObject(sc) && cfg.voicePhases.includes(sc.phase);

const usableCircuit = (circuit) =>
  isObject(circuit) && Number(circuit.length) > 0 && Array.isArray(circuit.points) && circuit.points.length > 1 && circuit.dist && circuit.heading && circuit.speed;

/**
 * Where the safety car is: { x, y, heading, v } (v in m/s) or null. In order: x/y in the
 * snapshot itself, a pose the view hands (`pose`, e.g. the one it draws), or the snapshot's
 * `s` (metres along the lap) on the frame's circuit geometry. Never a guess.
 */
export const scPoseOf = (sc, { pose = null, circuit = null } = {}) => {
  if (!isObject(sc)) return null;
  const v = Number.isFinite(sc.v) ? sc.v : undefined;
  if (Number.isFinite(sc.x) && Number.isFinite(sc.y)) return { x: sc.x, y: sc.y, heading: Number.isFinite(sc.heading) ? sc.heading : 0, v };
  if (isObject(pose) && Number.isFinite(pose.x) && Number.isFinite(pose.y)) return { x: pose.x, y: pose.y, heading: Number.isFinite(pose.heading) ? pose.heading : 0, v: Number.isFinite(pose.v) ? pose.v : v };
  if (Number.isFinite(sc.s) && usableCircuit(circuit)) {
    const at = poseAt(circuit, sc.s / circuit.length);
    return { x: at.x, y: at.y, heading: at.heading, v };
  }
  return null;
};

/**
 * The safety car as one more car of the frame ({ id, pose }) for the voice pool, or null:
 * no spec (no safety car that season, before 1993), not on the road, or nowhere to put it.
 */
export const scCarOf = (spec, sc, where = {}, cfg = SC) => {
  if (!spec || !scOnTrack(sc, cfg)) return null;
  const pose = scPoseOf(sc, where);
  return pose ? { id: SAFETY_CAR_ID, pose } : null;
};

/** A fresh state for scCuesStep. */
export const createScCueState = () => ({ seen: false, sc: false, scWithdrawn: false, vsc: false, vscWithdrawn: false });

const cuesOf = (cue) => {
  const out = [];
  if (cue.alert && audioData.ui.alert.levels[cue.alert]) out.push({ kind: "alert", opts: { level: cue.alert } });
  if (cue.radio) out.push({ kind: "radio", opts: { alert: true } });
  return out;
};

/**
 * The cues a frame's neutralisations call for: [{ kind: "alert"|"radio", opts }], in order
 * (the caller gates them with the interface cooldowns). `frame`: { sc, vsc } (snapshot.sc and
 * snapshot.vsc, §1.7, both optional) and `year`. The first frame only takes note (no burst when
 * the view opens in the middle of a safety car). Updates `state`.
 */
export const scCuesStep = (state, { sc = null, vsc = null, year }, cfg = SC) => {
  const has = neutralisationsOf(year);
  const scOn = has.safetyCar && scOnTrack(sc, cfg);
  const scLeaving = scOn && cfg.withdrawPhases.includes(sc.phase);
  const vscOn = has.vsc && isObject(vsc);
  const vscLeaving = vscOn && Boolean(vsc.ending);
  const cues = [];
  if (state.seen) {
    if (scOn && !state.sc) cues.push(...cuesOf(cfg.cues.deploy));
    if ((scLeaving && state.sc && !state.scWithdrawn) || (!scOn && state.sc && !state.scWithdrawn)) cues.push(...cuesOf(cfg.cues.withdraw));
    if (vscOn && !state.vsc) cues.push(...cuesOf(cfg.cues.vscDeploy));
    if ((vscLeaving && state.vsc && !state.vscWithdrawn) || (!vscOn && state.vsc && !state.vscWithdrawn)) cues.push(...cuesOf(cfg.cues.vscEnding));
  }
  // A spell that opens already leaving counts as warned only once it has been heard opening.
  state.scWithdrawn = scOn ? (state.sc || !state.seen ? state.scWithdrawn || scLeaving : false) : false;
  state.vscWithdrawn = vscOn ? (state.vsc || !state.seen ? state.vscWithdrawn || vscLeaving : false) : false;
  state.sc = scOn;
  state.vsc = vscOn;
  state.seen = true;
  return cues;
};
