/**
 * Replays: the view's buffer of the last seconds of the race and the plan of each replay
 * (F1M24-GAMEPLAY §2.5 replays and buffer-repeticion, §1.5; CAM-3; RF-3D-04, RF-SIM-15, RNF-05,
 * RNF-07). Pure: no React, no three.js, no randomness.
 *
 * The buffer keeps `bufferSec` of race time of every car at `sampleHz` (data/balance/
 * broadcast.json replay: 22 cars × 25 s × 10 Hz by the unification decision of §1.5). It samples
 * the view's own position function - raceClock.liveCarAt for a step race, carAt for the quick
 * replay - at fixed instants of the race clock (k / sampleHz), not once per frame, so the same
 * race fills the same buffer at any frame rate or playback speed. It only reads: recording and
 * replaying never touch the engine, its streams or its step count (RNF-05).
 *
 *   createReplayBuffer(config?)                   → buffer
 *   recordReplay(buffer, tau, ids, sampleAt)      sampleAt(id, t) → pose (or null)
 *   replayPoseAt(buffer, id, t)                   → the pose at race time t, eased between samples
 *   replayTriggerOf(event, ctx)                   → "pass" | "mistake" | "dnf" | "pitOther" | "finish" | null
 *   enqueueReplay(queue, event, ctx) / nextReplay(queue, ctx) → the queue, one replay at a time
 *   planReplay(event, buffer, ctx)                → { from, to, stingSec, angles[], ... }
 *   replayFrameAt(plan, elapsed)                  → { phase, tau, angle }
 *   tracksideFor(rig, share, slot, seed)          → the trackside camera of a replay angle
 *
 * Who wires it: Race3D records into the buffer it is handed and draws a plan at the replay clock;
 * HUD-4 owns the clock, the queue and the pause of the view (replay.pauseSim) in LiveRace.
 */

import broadcast from "../../data/balance/broadcast.json";
import cameraData from "../../data/balance/cameras.json";

export const REPLAY = broadcast.replay;

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
const wrap = (value) => ((value % 1) + 1) % 1;

// ------------------------------------------------------------------ the buffer

export const createReplayBuffer = (config = REPLAY) => ({
  hz: config.sampleHz,
  cap: Math.ceil(config.bufferSec * config.sampleHz) + 1,
  frames: [],
  lastTick: null,
});

/** The race-time span the buffer holds: { from, to } (null when empty). */
export const replaySpan = (buffer) => (buffer.frames.length ? { from: buffer.frames[0].tau, to: buffer.frames[buffer.frames.length - 1].tau } : null);

/**
 * Record up to race time `tau`: one frame for every tick k / hz passed since the last call, each
 * sampled at its own instant. A clock that went back (a restart, a seek) empties the buffer; a
 * jump longer than the buffer records only its last `cap` ticks. Returns the buffer.
 */
export const recordReplay = (buffer, tau, ids, sampleAt) => {
  if (!Number.isFinite(tau) || tau < 0) return buffer;
  const last = Math.floor(tau * buffer.hz + 1e-9);
  if (buffer.lastTick !== null && last < buffer.lastTick) {
    buffer.frames.length = 0;
    buffer.lastTick = null;
  }
  const first = buffer.lastTick === null ? last : buffer.lastTick + 1;
  const start = Math.max(first, last - buffer.cap + 1);
  for (let k = start; k <= last; k += 1) {
    const t = k / buffer.hz;
    const poses = {};
    ids.forEach((id) => {
      const pose = sampleAt(id, t);
      if (pose) poses[id] = { ...pose };
    });
    buffer.frames.push({ tau: t, poses });
  }
  if (last >= first) buffer.lastTick = last;
  if (buffer.frames.length > buffer.cap) buffer.frames.splice(0, buffer.frames.length - buffer.cap);
  return buffer;
};

const unwrapAngle = (from, to) => {
  let target = to;
  while (target - from > Math.PI) target -= Math.PI * 2;
  while (target - from < -Math.PI) target += Math.PI * 2;
  return target;
};
const EASED = ["x", "y", "progress", "lateral", "v", "rpm", "throttle"];

/** Car `id` at race time `t` from the buffer: linear between the two frames around it (heading the short way), the rest from the nearer. */
export const replayPoseAt = (buffer, id, t) => {
  const frames = buffer.frames;
  if (!frames.length) return null;
  if (t <= frames[0].tau) return frames[0].poses[id] ? { ...frames[0].poses[id] } : null;
  const n = frames.length;
  if (t >= frames[n - 1].tau) return frames[n - 1].poses[id] ? { ...frames[n - 1].poses[id] } : null;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].tau <= t) lo = mid;
    else hi = mid;
  }
  const a = frames[lo].poses[id];
  const b = frames[hi].poses[id];
  if (!a || !b) return a ? { ...a } : b ? { ...b } : null;
  const f = (t - frames[lo].tau) / (frames[hi].tau - frames[lo].tau || 1);
  const out = { ...(f < 0.5 ? a : b) };
  // A car that went into or out of the pit lane, or crossed the line, between the two is not eased across it.
  if (a.inPit !== b.inPit || Math.abs((b.progress ?? 0) - (a.progress ?? 0)) > 0.5) return out;
  EASED.forEach((key) => {
    if (Number.isFinite(a[key]) && Number.isFinite(b[key])) out[key] = a[key] + (b[key] - a[key]) * f;
  });
  if (Number.isFinite(a.heading) && Number.isFinite(b.heading)) out.heading = a.heading + (unwrapAngle(a.heading, b.heading) - a.heading) * f;
  return out;
};

// ------------------------------------------------------------------ what triggers a replay

const kindOf = (event) => {
  if (!event) return null;
  if (event.type === "pass") return "pass";
  if (event.type === "mistake") return "mistake";
  if (event.type === "dnf") return "dnf";
  if (event.type === "pit") return "pitOther";
  // The winner over the line: the quick mode's flag, or SIM-3's `finished` (§1.7) for the winner.
  if (event.type === "flag" || (event.type === "finished" && event.pos === 1)) return "finish";
  return null;
};

/**
 * The replay an event calls for, or null. `ctx`: { userIds (Set or array of the player's car
 * ids), leaderId, config }. Off where replay.triggers says so; `scope` says whose event counts.
 */
export const replayTriggerOf = (event, { userIds = [], leaderId = null, config = REPLAY } = {}) => {
  const kind = kindOf(event);
  if (!kind || !config.triggers[kind]) return null;
  const users = userIds instanceof Set ? userIds : new Set(userIds);
  const scope = config.scope[kind];
  const involved = [event.carId, event.otherId].filter((id) => id !== undefined && id !== null);
  if (scope === "user" && !involved.some((id) => users.has(id))) return null;
  if (scope === "rival" && (event.carId === undefined || users.has(event.carId))) return null;
  if (scope === "leader" && !(event.type === "flag" || event.pos === 1 || (leaderId !== null && event.carId === leaderId))) return null;
  return kind;
};

/** Race time of an event: `at` (the step race, raceClient), else `t`. */
const timeOf = (event) => (Number.isFinite(event?.at) ? event.at : Number.isFinite(event?.t) ? event.t : null);

export const createReplayQueue = () => ({ items: [], lastAt: -Infinity });

/** Queue the replay of `event` if it calls for one (pure: a new queue). At most queueMax wait. */
export const enqueueReplay = (queue, event, ctx = {}) => {
  const config = ctx.config || REPLAY;
  const trigger = replayTriggerOf(event, { ...ctx, config });
  const at = timeOf(event);
  if (!trigger || at === null || queue.items.length >= config.queueMax) return queue;
  return { ...queue, items: [...queue.items, { trigger, event, at }] };
};

/**
 * The next replay to play now, if any (pure): { queue, item }. Nothing while `blocked` (a replay
 * on air, the pit sequence of the car the TV follows - the stop is never cut). An item waits
 * until its postSec has been recorded; items whose window has left the buffer, or that come
 * within cooldownSec of race time of the last replay, are dropped.
 */
export const nextReplay = (queue, { tau, buffer, blocked = false, config = REPLAY } = {}) => {
  if (blocked || !queue.items.length) return { queue, item: null };
  const span = buffer ? replaySpan(buffer) : null;
  const items = queue.items.slice();
  while (items.length) {
    const item = items[0];
    const stale = (span && item.at < span.from) || item.at - queue.lastAt < config.cooldownSec;
    if (stale) {
      items.shift();
      continue;
    }
    if (!Number.isFinite(tau) || tau < item.at + config.postSec) return { queue: { ...queue, items }, item: null };
    items.shift();
    return { queue: { ...queue, items, lastAt: item.at }, item };
  }
  return { queue: { ...queue, items }, item: null };
};

// ------------------------------------------------------------------ the plan of a replay

const inEra = (id, year, replayOnly) => {
  const entry = cameraData.onboard.find((cam) => cam.id === id);
  if (!entry || (entry.replayOnly && !replayOnly)) return false;
  return !Number.isFinite(year) || entry.eras.some((era) => year >= era.from && year <= era.to);
};

/**
 * The replay of `item` ({ trigger, event, at }) from what `buffer` holds: { trigger, subjectId,
 * otherId, at, from, to, contentSec, stingSec, totalSec, angles: [{ kind, cam, slot, from, to }] }.
 * The window runs from preSec before the event to postSec after it, inside the buffer and never
 * longer than maxSec. It is cut into angles.min..max angles of at least angles.minSec: trackside
 * cameras where it happened (`slot`, resolved by tracksideFor on the rig of the view), the
 * onboard of `replay.onboard` when the season's cars carry it (cameras.json, SRS 6.2), and on the
 * winner's finish the close-up (replay only). null when the buffer holds nothing of it.
 */
export const planReplay = (item, buffer, { year = null, seed = 0, config = REPLAY } = {}) => {
  const span = replaySpan(buffer);
  if (!span || !item) return null;
  const to = Math.min(span.to, item.at + config.postSec);
  const from = Math.max(span.from, item.at - config.preSec, to - (config.maxSec ?? Infinity));
  const contentSec = to - from;
  if (!(contentSec > 0)) return null;
  const subjectId = item.event.carId ?? null;
  const otherId = item.event.otherId ?? null;
  const salt = fnv(`${seed}|${item.trigger}|${subjectId}|${Math.round(item.at * 10)}`);
  const fit = Math.max(1, Math.floor(contentSec / config.angles.minSec));
  const count = Math.max(1, Math.min(config.angles.max, Math.max(config.angles.min, fit), fit));
  const kinds = [];
  const onboard = config.onboard && inEra(config.onboard, year, false) ? config.onboard : null;
  const closeUp = item.trigger === "finish" && config.closeUp && inEra(config.closeUp, year, true) ? config.closeUp : null;
  for (let k = 0; k < count; k += 1) {
    const lastOne = k === count - 1;
    if (lastOne && closeUp && count > 1) kinds.push({ kind: "onboard", cam: closeUp });
    else if (k === 1 && onboard) kinds.push({ kind: "onboard", cam: onboard });
    else kinds.push({ kind: "trackside", slot: Math.floor(hash01(salt, k) * 1e6) + k });
  }
  const angles = kinds.map((angle, k) => ({ ...angle, from: from + (contentSec * k) / count, to: from + (contentSec * (k + 1)) / count }));
  const stingSec = config.stingSec ?? 0;
  return { trigger: item.trigger, subjectId, otherId, at: item.at, from, to, contentSec, stingSec, totalSec: contentSec + 2 * stingSec, angles };
};

/**
 * What the replay shows `elapsed` seconds after it began: { phase: "stingIn" | "content" |
 * "stingOut" | "done", tau (race time on screen), angle }.
 */
export const replayFrameAt = (plan, elapsed) => {
  const e = Math.max(0, elapsed || 0);
  const sting = plan.stingSec;
  let phase;
  let tau;
  if (e < sting) {
    phase = "stingIn";
    tau = plan.from;
  } else if (e < sting + plan.contentSec) {
    phase = "content";
    tau = plan.from + (e - sting);
  } else if (e < plan.totalSec) {
    phase = "stingOut";
    tau = plan.to;
  } else {
    phase = "done";
    tau = plan.to;
  }
  const angle = plan.angles.find((a) => tau >= a.from && tau < a.to) || plan.angles[plan.angles.length - 1];
  return { phase, tau, angle };
};

const inSpan = (share, from, to) => {
  const s = wrap(share);
  const a = wrap(from);
  const b = wrap(to);
  return a <= b ? s >= a && s <= b : s >= a || s <= b;
};

/**
 * The trackside camera of a replay angle: among the rig's fixed cameras covering `share` (the
 * subject's place at the start of the angle), the slot's pick with the seed - a different one for
 * each slot when there are several. null when none covers it (the view then uses the chase camera).
 */
export const tracksideFor = (rig, share, slot, seed = 0) => {
  if (!rig?.length || !Number.isFinite(share)) return null;
  const covering = rig.filter((cam) => cam.type !== "cable" && !cam.moving && inSpan(share, cam.from, cam.to)).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (!covering.length) return null;
  const start = Math.floor(hash01(fnv(`replay|${seed}`), slot) * covering.length);
  return covering[(start + slot) % covering.length];
};
