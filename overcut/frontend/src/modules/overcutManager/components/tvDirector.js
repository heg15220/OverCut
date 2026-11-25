/**
 * The TV in the live race, pure (no React): HUD-2 of docs/manager/F1M24-GAMEPLAY.md hooks
 * CAM-1's directorState into LiveRace (director-follow-focus; RF-3D-04, RNF-07, RNF-09).
 *
 *   tvShotOf({ focusId, rows, events, battle, cars, prev, now, tau?, seed?, start? }) →
 *     { shot, subjectId, rivalId, target, label }
 *
 * The TV films the car the player picked - in the tower, on the map or with the car arrows -
 * and frames its rival with it when the two are racing. It never swaps the subject behind the
 * player's back unless data/balance/broadcast.json director.followAction is on (it used to
 * hunt fights every 7 s of wall clock in LiveRace.js). `battle` is SIM-4's battle state per
 * car index (§1.7) when the engine sends it; without it the gap decides, as before.
 * `prev` is the last shot (so the director keeps its camera and hold), `now` wall seconds.
 */

import { directorState } from "./director/directorState";
import { t } from "./texts";

export const tvShotOf = ({ focusId, rows = [], events = [], battle = null, cars = [], rig = [], prev = null, now = 0, tau, seed, start = null, config } = {}) => {
  const directorRows = Array.isArray(battle) ? rows.map((row) => ({ ...row, battle: battle[cars.indexOf(row.car)] })) : rows;
  // HUD-4 (start-finish-scripts, the hook): the race clock and seed for the pit sequences (CAM-3) and the
  // start (§1.7 snapshot.start) for CAM-4's start sequence; `events` already carries each car's `finished`.
  const clock = { now, prev, ...(Number.isFinite(tau) ? { tau } : {}), ...(seed !== undefined && seed !== null ? { seed } : {}), ...(start ? { start } : {}) };
  const shot = config ? directorState(focusId, directorRows, events, rig, clock, config) : directorState(focusId, directorRows, events, rig, clock);
  const rowOf = Object.fromEntries(rows.map((row) => [row.car.id, row]));
  const [subjectId = null, rivalId = null] = shot.subjectIds;
  const subject = subjectId !== null ? rowOf[subjectId] : null;
  const rival = rivalId !== null ? rowOf[rivalId] : null;
  if (!subject) return { shot, subjectId: null, rivalId: null, target: null, label: "" };
  if (rival) {
    const ahead = subject.position < rival.position ? subject : rival;
    return {
      shot,
      subjectId,
      rivalId,
      target: { x: (subject.pose.x + rival.pose.x) / 2, y: (subject.pose.y + rival.pose.y) / 2, heading: ahead.pose.heading },
      label: t(`${subject.car.name} · lucha por P${ahead.position}`, `${subject.car.name} · battle for P${ahead.position}`),
    };
  }
  return { shot, subjectId, rivalId: null, target: subject.pose, label: subject.car.name };
};

export default tvShotOf;
