/**
 * The TV director, as a pure function (RF-3D-04, RNF-07, RNF-09; F1M24-GAMEPLAY §2.5
 * director-follow-focus, CAM-1). No React, no three.js, no randomness: the same inputs
 * always give the same shot, and nothing here ever touches the race (RNF-05).
 *
 * A real broadcast follows the car the viewer chose: the director cuts between the
 * trackside cameras along the lap, opens the shot to take in a rival when the two are
 * racing, but never swaps the subject behind the viewer's back. Picking the fight
 * instead ("follow the action") is an option of data/balance/broadcast.json, off by
 * default - until CAM-1 it was the only behaviour of LiveRace.js (every 7 s of wall
 * clock).
 *
 *   directorState(focusId, rows, events, rig, clock, config?) →
 *     { cameraId, camType, subjectIds[], shotKind, reason, hold }
 *
 * - `rows`: the timing rows of the live view, leader first ({ car: {id, isUser},
 *   pose: {progress, inPit, gone, finished}, position, interval, lapsDown, out,
 *   battle? }). `battle` is the SIM-4 contract (F1M24-GAMEPLAY §1.7); without it the
 *   interval to the car ahead says who is racing, as raceClock.battlesIn does.
 * - `events`: the race events so far (read by later packages - sequences and replays,
 *   CAM-3/CAM-4; ignored here).
 * - `rig`: the trackside cameras (three/cameras.js buildRig / fitRig, each with `id`,
 *   `type`, `from`, `to`, `priority`).
 * - `clock`: { now } wall-clock seconds for the follow-the-action hold, `prev` - the
 *   previous result, so the director keeps its camera while the car is still in it - and
 *   `seed`, the race seed of the zone draw on a zone rig (CAM-2).
 *
 * `shotKind`: "zone" (one car in a trackside camera), "battle" (the subject and its
 * rival framed together), "pit" (the subject in the pit lane; CAM-3 turns it into the
 * pit sequence) or "none" (nobody to film). `reason` says why the subject is the
 * subject: "focus", "focusGone" (the chosen car is out: the leader instead),
 * "leader" (nobody chosen) or "followAction".
 */

import broadcast from "../../data/balance/broadcast.json";
import { zoneChoice } from "../../three/cameraZones";

const wrap = (value) => ((value % 1) + 1) % 1;
const inSpan = (share, from, to) => {
  const s = wrap(share);
  const a = wrap(from);
  const b = wrap(to);
  return a <= b ? s >= a && s <= b : s >= a || s <= b;
};

const alive = (row) => row && !row.out && !row.pose?.gone;
const idOf = (row) => row?.car?.id ?? null;

/** Pairs racing on the road, nearest the front first (the same rule as raceClock.battlesIn). */
export const battlesOf = (rows, gapSec = broadcast.director.battleGapSec) => {
  const battles = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const ahead = rows[index - 1];
    if (!alive(row) || !alive(ahead) || row.pose?.inPit || ahead.pose?.inPit || row.pose?.finished) continue;
    if (row.interval !== undefined && row.interval < gapSec && (row.lapsDown || 0) === 0) battles.push({ position: ahead.position, attacker: row, defender: ahead, gap: row.interval });
  }
  return battles;
};

/** The rival a car is racing, if it is racing one: the SIM-4 battle state when the snapshot has it, the gap otherwise. */
export const rivalOf = (rows, subjectId, config = broadcast.director) => {
  const index = rows.findIndex((row) => idOf(row) === subjectId);
  if (index < 0) return null;
  const row = rows[index];
  if (!alive(row) || row.pose?.inPit || row.pose?.finished) return null;
  const usable = (other) => alive(other) && !other.pose?.inPit && !other.pose?.finished;
  const ahead = rows[index - 1];
  const behind = rows[index + 1];
  if (row.battle !== undefined) {
    if (!config.battleStates.includes(row.battle)) return null;
    if (row.battle === "ATTACKING" && usable(ahead)) return idOf(ahead);
    if (row.battle === "DEFENDING" && usable(behind)) return idOf(behind);
    return null;
  }
  const close = (attacker) => attacker.interval !== undefined && attacker.interval < config.battleGapSec && (attacker.lapsDown || 0) === 0;
  if (usable(ahead) && close(row)) return idOf(ahead);
  if (usable(behind) && close(behind)) return idOf(behind);
  return null;
};

/**
 * The trackside camera covering a share of the lap: the one already on air if it still covers it,
 * else, on a zone rig (CAM-2), the camera of that zone drawn for this lap with the race seed
 * (`opts.seed`, `opts.lap` - by default the whole part of the share, a car's progress), the same
 * one three/cameras.js frame puts on air; on a rig by priority, the highest priority.
 */
export const cameraFor = (rig, share, keepId = null, opts = {}) => {
  if (!rig?.length || !Number.isFinite(share)) return null;
  const covering = rig.filter((cam) => inSpan(share, cam.from, cam.to));
  const kept = keepId !== null ? covering.find((cam) => cam.id === keepId) : null;
  if (kept) return kept;
  const lap = Number.isFinite(opts.lap) ? opts.lap : Math.max(0, Math.floor(share));
  const zoned = zoneChoice(covering, share, lap, opts.seed ?? 0);
  if (zoned) return zoned[0];
  return covering.slice().sort((a, b) => b.priority - a.priority)[0] || null;
};

export const directorState = (focusId, rows = [], events = [], rig = [], clock = {}, config = broadcast.director) => {
  const prev = clock.prev || null;
  const now = Number.isFinite(clock.now) ? clock.now : 0;
  const live = rows.filter(alive);
  const leader = live[0] || null;
  const focusRow = focusId !== null && focusId !== undefined ? live.find((row) => idOf(row) === focusId) : null;

  let subject = focusRow || leader;
  let reason = focusRow ? "focus" : focusId !== null && focusId !== undefined ? "focusGone" : "leader";
  let hold = null;

  if (config.followAction.enabled) {
    const battles = battlesOf(rows, config.battleGapSec);
    const held = prev?.hold && now <= prev.hold.until && battles.some((battle) => idOf(battle.attacker) === prev.hold.id) ? prev.hold : null;
    if (held) hold = held;
    else {
      const user = config.followAction.preferUser ? battles.find((battle) => battle.attacker.car?.isUser || battle.defender.car?.isUser) : null;
      const pick = user || battles[0];
      hold = { id: idOf(pick?.attacker) ?? idOf(leader), until: now + config.followAction.holdSec };
    }
    subject = live.find((row) => idOf(row) === hold.id) || leader;
    reason = "followAction";
  }

  if (!subject) return { cameraId: null, camType: null, subjectIds: [], shotKind: "none", reason, hold };

  const subjectId = idOf(subject);
  const share = subject.pose?.progress;
  const cam = cameraFor(rig, share, prev?.cameraId ?? null, { seed: clock.seed });
  const base = { cameraId: cam?.id ?? null, camType: cam?.type ?? null, reason, hold };
  if (subject.pose?.inPit) return { ...base, subjectIds: [subjectId], shotKind: "pit" };
  const rival = rivalOf(rows, subjectId, config);
  if (rival !== null) return { ...base, subjectIds: [subjectId, rival], shotKind: "battle" };
  return { ...base, subjectIds: [subjectId], shotKind: "zone" };
};

export default directorState;
