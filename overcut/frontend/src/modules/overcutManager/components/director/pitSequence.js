/**
 * The director's pit and garage sequences, as a pure step (F1M24-GAMEPLAY §2.5 pit-sequence and
 * garage-exit-presentation, CAM-3; RF-3D-04, RF-SIM-12, RF-WKD-02, RNF-05, RNF-07).
 *
 * When the car the TV follows dives into the pits, a broadcast stops cutting by zones and tells
 * the stop in a fixed order of shots - the entry, the lane from high up, the crew waiting in the
 * box, the release, the end of the lane, the merge - and goes back to the trackside cameras when
 * the car is racing again. In a session, a car leaving its garage gets a short chain of shots of
 * its own. The shots, their triggers and how long each stays on air are data
 * (data/balance/broadcast.json sequences.pitStop / garageExit, cameras of `pitRig`).
 *
 *   stepSequence(prev, { carId, pose, tau, seed, etaSec }, sequences?) → state
 *
 * - `pose`: the car's pose as the view has it. `pose.pitPhase` is the step race's pit-lane phase
 *   (raceClock.liveCarAt, engine/sim/pitLane.js PHASE); without it (the quick replay) the phase
 *   is read from the pose: stopped in the box, in the lane before or after the stop. A session
 *   car carries `pose.runPhase` (§1.7 contract, SES-2) when the view hands it over; otherwise
 *   leaving the garage (`pose.garage`) along the lane is GARAGE_EXIT and the lap after it OUT_LAP.
 * - `tau`: race (or session) clock, seconds - shot lengths are race time, so a replayed race is
 *   filmed the same (RF-SIM-15 / RNF-05); `seed` the race seed for the drawn lengths of 'next'
 *   shots; `etaSec` the seconds before the car stops in its box (Race3D estimates it), for the
 *   shot of the crew that comes `crewLeadSec` early (`lead`).
 *
 * The state: { carId, name (null | "pitStop" | "garageExit"), index, cam, since, dur, active,
 * memory }. The sequence only moves forward (a phase that comes back - LIMITER after the box -
 * does not rewind it), holds each shot at least its minSec, and ends after the last shot's
 * maxSec, when the car is back in its garage, or when the subject changes. It never reads or
 * writes the race.
 */

import broadcast from "../../data/balance/broadcast.json";
import pitBalance from "../../data/balance/race-pit.json";

const SEQUENCES = broadcast.sequences;
const BOX_DECEL = pitBalance.pitLane.boxDecel;

/**
 * Seconds before the car stands in its box: 0 once it is there, v / boxDecel while it brakes for
 * it (race-pit.json pitLane.boxDecel, the deceleration engine/sim/pitLane.js stops cars with),
 * Infinity otherwise. For the crew's early shot (`lead`, crewLeadSec).
 */
export const etaToBox = (pose) => {
  if (!pose || !pose.inPit || pose.garage) return Infinity;
  if (pose.stopped || pose.pitPhase === "STATIONARY" || pose.pitPhase === "QUEUE") return 0;
  if (pose.pitPhase === "BOX_APPROACH" && Number.isFinite(pose.v) && BOX_DECEL > 0) return Math.max(0, pose.v) / BOX_DECEL;
  return Infinity;
};

/** Where the car will stop: its own position once stopped, else `v² / (2 boxDecel)` ahead along its heading while it brakes for the box. */
export const boxPointOf = (pose) => {
  if (!pose || !pose.inPit || pose.garage || !Number.isFinite(pose.x) || !Number.isFinite(pose.y)) return null;
  if (pose.stopped || pose.pitPhase === "STATIONARY" || pose.pitPhase === "QUEUE") return { x: pose.x, y: pose.y, heading: pose.heading };
  if (pose.pitPhase === "BOX_APPROACH" && Number.isFinite(pose.v) && BOX_DECEL > 0) {
    const d = (pose.v * pose.v) / (2 * BOX_DECEL);
    return { x: pose.x + Math.cos(pose.heading) * d, y: pose.y + Math.sin(pose.heading) * d, heading: pose.heading };
  }
  return null;
};
/** The sequences this module runs, the race stop first (a session car leaving its garage is the other). */
export const PIT_SEQUENCE_NAMES = ["pitStop", "garageExit"];

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

/**
 * The car's pit phase and session run phase from its pose. `memory` is what the sequence saw
 * earlier in this stint ({ stopped, fromGarage }): the quick replay's pose does not say whether
 * the stop is behind the car, a session pose whether it came out of the garage.
 */
export const phasesOf = (pose, memory = {}) => {
  if (!pose || pose.gone) return { pitPhase: null, runPhase: null };
  let pitPhase;
  if (typeof pose.pitPhase === "string") pitPhase = pose.pitPhase;
  else if (pose.garage) pitPhase = "GARAGE";
  else if (pose.inPit) pitPhase = pose.stopped ? "STATIONARY" : memory.stopped ? "EXIT_ROAD" : "LIMITER";
  else pitPhase = "TRACK";
  let runPhase = typeof pose.runPhase === "string" ? pose.runPhase : null;
  if (runPhase === null) {
    if (pose.garage) runPhase = "GARAGE";
    else if (memory.fromGarage) runPhase = pose.inPit ? "GARAGE_EXIT" : "OUT_LAP";
  }
  return { pitPhase, runPhase };
};

/** Does a shot's trigger fire for these phases? */
export const triggerFires = (trigger, phases) => {
  const [kind, value] = String(trigger).split(":");
  if (kind === "pitPhase") return phases.pitPhase === value;
  if (kind === "runPhase") return phases.runPhase === value;
  return false;
};

/** Seconds a shot stays on air when the next one is 'next' (drawn with the seed), else null (its trigger decides). */
const drawnLength = (shots, index, carId, since, seed) => {
  const next = shots[index + 1];
  const shot = shots[index];
  if (!next || next.trigger !== "next") return null;
  const lo = shot.minSec ?? 0;
  const hi = Math.max(lo, shot.maxSec ?? lo);
  const u = hash01((fnv(`${seed ?? 0}|${carId}|pit-sequence`) ^ Math.round((since || 0) * 10)) >>> 0, index + 1);
  return lo + (hi - lo) * u;
};

const IDLE = (carId, memory) => ({ carId, name: null, index: -1, cam: null, since: null, dur: null, active: false, memory });

/** Whether a lead shot (the crew waiting) may come on air: the car is due in the box within crewLeadSec. */
const leadDue = (shot, sequence, etaSec) => Boolean(shot.lead) && Number.isFinite(sequence.crewLeadSec) && Number.isFinite(etaSec) && etaSec <= sequence.crewLeadSec;

export const stepSequence = (prev, { carId, pose, tau, seed = 0, etaSec = Infinity }, sequences = SEQUENCES) => {
  const same = prev && prev.carId === carId;
  const memory = { ...(same ? prev.memory : {}) };
  if (!pose || pose.gone || carId === null || carId === undefined) return IDLE(carId ?? null, {});
  const phases = phasesOf(pose, memory);
  // What this stint has seen.
  if (phases.pitPhase === "STATIONARY" || phases.pitPhase === "QUEUE") memory.stopped = true;
  if (pose.garage || phases.runPhase === "GARAGE") memory.fromGarage = true;
  const now = Number.isFinite(tau) ? tau : 0;
  const wasActive = same && prev.active;

  if (!wasActive) {
    // Back on the road with nothing on air: the stint is over.
    if (!pose.inPit && !pose.garage) {
      if (pose.runPhase !== "OUT_LAP") delete memory.fromGarage;
      delete memory.stopped;
      delete memory.done;
    }
    if (memory.done || !pose.inPit || pose.garage) return IDLE(carId, memory);
    // Leaving the garage (a session) or a stop (a race): the first shot whose trigger fires.
    const order = phases.runPhase === "GARAGE_EXIT" ? ["garageExit", "pitStop"] : PIT_SEQUENCE_NAMES;
    for (const name of order) {
      const sequence = sequences[name];
      const shots = sequence?.shots || [];
      const index = shots.findIndex((shot) => triggerFires(shot.trigger, phases) || leadDue(shot, sequence, etaSec));
      if (index >= 0) return { carId, name, index, cam: shots[index].cam, since: now, dur: drawnLength(shots, index, carId, now, seed), active: true, memory };
    }
    return IDLE(carId, memory);
  }

  const sequence = sequences[prev.name];
  const shots = sequence.shots;
  const current = shots[prev.index];
  const elapsed = now - prev.since;
  const end = () => {
    const after = { ...memory, done: Boolean(pose.inPit) };
    if (!pose.inPit) delete after.fromGarage;
    return IDLE(carId, after);
  };
  // Back in the garage: the race stop is over (a session car coming in).
  if (prev.name === "pitStop" && phases.pitPhase === "GARAGE") return end();
  const cut = (index) => ({ carId, name: prev.name, index, cam: shots[index].cam, since: now, dur: drawnLength(shots, index, carId, now, seed), active: true, memory });
  const held = elapsed >= (current.minSec ?? 0);
  // A later shot whose trigger fires (the latest of them: a car that skipped a phase skips its shot).
  let later = -1;
  for (let k = shots.length - 1; k > prev.index; k -= 1) {
    if (triggerFires(shots[k].trigger, phases) || leadDue(shots[k], sequence, etaSec)) {
      later = k;
      break;
    }
  }
  if (later > prev.index && held) return cut(later);
  // A drawn length ran out: the next shot of the chain.
  if (prev.dur !== null && elapsed >= prev.dur) return cut(prev.index + 1);
  const last = prev.index === shots.length - 1;
  if (last && elapsed >= (current.maxSec ?? current.minSec ?? 0)) return end();
  // On the road again with no later shot for it (a chain cut short): the sequence ends once held.
  if (!last && !pose.inPit && later < 0 && prev.dur === null && held && !shots.slice(prev.index + 1).some((shot) => /:(TRACK|OUT_LAP)$/.test(shot.trigger))) return end();
  return { ...prev, memory };
};

/** Every camera id the sequences name (for the rig and the tests). */
export const sequenceCameras = (sequences = SEQUENCES) => [...new Set(PIT_SEQUENCE_NAMES.flatMap((name) => (sequences[name]?.shots || []).map((shot) => shot.cam)))];

export default stepSequence;
