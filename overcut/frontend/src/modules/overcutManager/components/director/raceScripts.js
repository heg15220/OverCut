/**
 * The director's scripts for the start and the end of a race, and its onboard inserts, as pure
 * steps (F1M24-GAMEPLAY §2.5 / §2.13 start-finish-scripts and onboard-inserts, CAM-4; RF-3D-04,
 * RF-SIM-10, RF-SIM-15, RNF-05, RNF-07).
 *
 * A broadcast does not film the build-up, the lights and the flag by zones: before the start it
 * shows the grid, the safety car parked behind it (an era with one) and the driver; it holds a
 * high shot of the grid while the lights come on, goes head-on as they go out and cuts fast
 * through the first corners; at the flag it stays with the winner and then gives every car that
 * crosses the line a short shot of its own. On the straights it sometimes cuts to the driver's
 * view for a few seconds. Which shots, in what order and for how long is data
 * (data/balance/broadcast.json sequences.preRace / start / finish, finisherShots, inserts.onboard,
 * cameras of `scriptRig`); this module only walks it.
 *
 *   stepScript(prev, input, scripts?) → state
 *   stepInsert(prev, input, cfg?)     → state
 *
 * `input` of stepScript: { start, events, tau, viewSec, seed, year, subjectId, rows, skipPreRace, zones }.
 * - CAM-C3 (F1M24-CHINA §2.5 VIEW-10, the script): the start is `startLightsLow` (the gantry in
 *   frame, low by the pole) from the first light until lights out plus sequences.start.holdShotSec,
 *   then `startHigh` (high and wide from the line) until the leader brakes for the first corner
 *   (`until: "zone:braking"` on three/cameraZones `zones`; its maxSec when the view gives no zones),
 *   then the trackside burst. A held shot (`until`) also ends at its maxSec, if it has one.
 * - `start` is the engine's snapshot.start (§1.7, SIM-3: { phase, lights, t }); without it there is
 *   no pre-race and no lights script (the view invents nothing), only the finish.
 * - `events` the race events seen so far (the `finished` events of §1.7: { carId, t, pos }).
 * - Time is race time (RF-SIM-15 / RNF-05: a replayed race is filmed the same): `viewSec` when the
 *   view gives one (its own clock, running during an intro too); else the procedure time of
 *   `start` (start.t, then start.t + tau once the lights are out); else `tau`. The finish runs on
 *   `tau` itself: the `finished` events carry race time.
 * - Every drawn shot length depends only on the seed, the script, the shot and its car: the same
 *   seed films the same, a different seed another way.
 * - Shots the season cannot have are left out (SRS §6): `requires` names a race-control rule of
 *   engine/rules.js (rulesFor(year).raceControl; `safetyCar`:the car parked behind the grid only from 1993) and an onboard camera only exists
 *   in the years of data/balance/cameras.json. With no year nothing era-bound is filmed.
 *
 * State: { name (null | "preRace" | "start" | "finish"), index, cam, subject, subjectId, since,
 * dur, active, scParked, done{}, finisher, skipped }. `active` with a `cam` means the script has the
 * shot; `cam` null (between finishers) leaves the TV to the zones. It never reads or writes the race.
 */

import broadcast from "../../data/balance/broadcast.json";
import cameraData from "../../data/balance/cameras.json";
import { rulesFor } from "../../engine/rules";

const SCRIPTS = broadcast.sequences;
const INSERTS = broadcast.inserts.onboard;
export const SCRIPT_NAMES = ["preRace", "start", "finish"];

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
const frac = (value) => value - Math.floor(value);

const ONBOARD_IDS = new Set(cameraData.onboard.map((entry) => entry.id));
const onboardInYear = (id, year) => {
  const entry = cameraData.onboard.find((item) => item.id === id);
  return Boolean(entry) && Number.isFinite(year) && entry.eras.some((era) => year >= era.from && year <= era.to);
};

/** Is a camera id an onboard of data/balance/cameras.json? */
export const isOnboardCam = (cam) => ONBOARD_IDS.has(cam);

/** What kind of camera a script shot names: "onboard", "rig" (a trackside camera by type, `rig:<type>`), "chase", "heli", "tv" or "script" (scriptRig). */
export const camKindOf = (cam) => {
  if (!cam) return null;
  if (ONBOARD_IDS.has(cam)) return "onboard";
  if (String(cam).startsWith("rig:")) return "rig";
  if (cam === "chase" || cam === "heli" || cam === "tv") return cam;
  return "script";
};

/** Can the season film this shot? (SRS §6: the parked safety car from its year, onboards from theirs.) */
export const shotAvailable = (shot, year) => {
  if (shot.requires) {
    if (!Number.isFinite(year)) return false;
    if (!rulesFor(year).raceControl[shot.requires]) return false;
  }
  if (ONBOARD_IDS.has(shot.cam)) return onboardInYear(shot.cam, year);
  return true;
};

/** The script clock: the view's own seconds, else the start procedure's, else the race clock (all race time). */
export const scriptTime = ({ start = null, tau, viewSec } = {}) => {
  if (Number.isFinite(viewSec)) return viewSec;
  if (start && Number.isFinite(start.t)) return start.phase === "out" ? start.t + Math.max(0, Number.isFinite(tau) ? tau : 0) : start.t;
  return Number.isFinite(tau) ? tau : 0;
};

/** Seconds a shot stays on air when its length is drawn (it has a maxSec and no `until`), else null. */
export const drawnLength = (shot, { seed = 0, name, index, carId = "", round = 0 }) => {
  if (shot.until || !Number.isFinite(shot.maxSec)) return null;
  const lo = shot.minSec ?? 0;
  const hi = Math.max(lo, shot.maxSec);
  return lo + (hi - lo) * hash01(fnv(`${seed}|${name}|${carId}|script`), index + 1 + 131 * round);
};

const finishedEvents = (events) => (events || []).filter((event) => event && event.type === "finished" && event.carId !== undefined).slice().sort((a, b) => a.t - b.t || a.pos - b.pos);

/** The phase of the start a trigger waits for (`start:lights` fires with any light on). */
const startFires = (trigger, start) => {
  if (!start) return false;
  const [kind, value] = String(trigger || "").split(":");
  if (kind !== "start") return false;
  if (value === "lights") return start.phase === "lights" && start.lights > 0;
  if (value === "pre") return (start.phase === "formation" || start.phase === "grid") && !(start.lights > 0);
  return start.phase === value;
};

/** Zone index of a share of the lap in three/cameraZones zonesFor (-1 outside every zone). */
const zoneIndexAt = (zones, share) => {
  const L = zones.lengthM;
  const m = frac(share) * L;
  return zones.zones.findIndex((zone) => (m >= zone.fromM && m < zone.toM) || (zone.toM > L && m < zone.toM - L));
};

/**
 * Does the end condition of a held shot fire? (CAM-C3, VIEW-10.)
 * - `start:<phase>` as startFires; for `start:out` the shot also stays `hold` seconds of race time
 *   after the lights went out (broadcast.json sequences.start.holdShotSec; null = no hold).
 * - `zone:<kind>`: the shot's car, past the line on its first lap, enters a zone of that kind of
 *   three/cameraZones (`zone:braking`: the braking for the first corner). Without the zones it never
 *   fires and the shot's maxSec ends it (the view invents nothing).
 */
export const untilFires = (until, { start = null, outAt = null, now = 0, hold = null, rows = [], subjectId = null, zones = null } = {}) => {
  const [kind, value] = String(until || "").split(":");
  if (kind === "start") {
    if (!startFires(until, start)) return false;
    if (value === "out" && Number.isFinite(hold) && hold > 0) return Number.isFinite(outAt) && now - outAt >= hold - 1e-9;
    return true;
  }
  if (kind === "zone") {
    if (!zones?.zones?.length || !(zones.lengthM > 0)) return false;
    const row = (rows || []).find((entry) => entry?.car?.id === subjectId) || (rows || [])[0];
    const progress = row?.pose?.progress;
    if (!Number.isFinite(progress) || progress < 0) return false;
    if (progress >= 1) return true;
    const index = zoneIndexAt(zones, progress);
    return index >= 0 && zones.zones[index].kind === value;
  }
  return false;
};

const isPre = (start) => Boolean(start) && (start.phase === "formation" || start.phase === "grid") && !(start.lights > 0);

/** Who a shot films: the director's subject, the winner, the pole sitter (first row of the timing). */
const subjectOf = (shot, input, winnerId) => {
  if (shot.subject === "winner" && winnerId !== null) return winnerId;
  if (shot.subject === "pole") return input.rows?.[0]?.car?.id ?? input.subjectId ?? null;
  return input.subjectId ?? null;
};

const IDLE = (done = {}, extra = {}) => ({ name: null, index: -1, cam: null, subject: null, subjectId: null, since: null, dur: null, active: false, scParked: false, done, finisher: null, skipped: false, ...extra });

/** The safety car stands behind the grid until the lights go out, in the years it exists (SRS §6). */
const scParkedFor = (start, year) => Boolean(start) && start.phase !== "out" && Number.isFinite(year) && Boolean(rulesFor(year).raceControl.safetyCar);

export const stepScript = (prev, input = {}, scripts = SCRIPTS) => {
  const { start = null, events = [], seed = 0, year } = input;
  const now = scriptTime(input);
  const done = { ...(prev?.done || {}) };
  const skipped = Boolean(prev?.skipped || input.skipPreRace);
  const keep = { skipped };
  const finished = finishedEvents(events);
  const winner = finished.find((event) => event.pos === 1) || null;
  const winnerId = winner ? winner.carId : null;
  const scParked = scParkedFor(start, year);

  const cutTo = (name, index, extra = {}) => {
    const shot = scripts[name].shots[index];
    const subjectId = subjectOf(shot, input, winnerId);
    return { name, index, cam: shot.cam, subject: shot.subject || "focus", subjectId, since: now, dur: drawnLength(shot, { seed, name, index, carId: subjectId ?? "" }), active: true, scParked, done, finisher: null, ...keep, ...extra };
  };
  /** The next shot of a script that this season and this phase can film, from `from` on (wrapping when the script loops). */
  const nextIndex = (name, from, { wrap = false } = {}) => {
    const shots = scripts[name].shots;
    const n = shots.length;
    for (let step = 0; step < (wrap ? n : n - from); step += 1) {
      const k = wrap ? (from + step) % n : from + step;
      const shot = shots[k];
      if (!shotAvailable(shot, year)) continue;
      if (shot.during && (!start || !shot.during.includes(start.phase))) continue;
      return k;
    }
    return -1;
  };

  // --- the finish: the winner's shots, then a short one per car that crosses the line.
  if (winner && !done.finish) {
    const cfg = scripts.finish;
    // The flag is on the race clock: the `finished` events carry race time (§1.7).
    const rt = Number.isFinite(input.tau) ? input.tau : now;
    if (!prev || prev.name !== "finish") {
      // Whatever else was on air gives way to the flag.
      const first = nextIndex("finish", 0);
      if (first >= 0) return cutTo("finish", first, { since: rt, finisher: { seen: [winner.carId], last: winner.t } });
    } else {
      const fin = prev.finisher || { seen: [winner.carId], last: winner.t };
      const elapsed = rt - prev.since;
      if (prev.index >= 0 && prev.cam && prev.subject !== "finisher") {
        // Still on the winner's shots.
        if (prev.dur !== null && elapsed >= prev.dur) {
          const next = nextIndex("finish", prev.index + 1);
          if (next >= 0) return cutTo("finish", next, { since: rt, finisher: fin });
          return { ...IDLE(done, keep), name: "finish", active: true, since: rt, finisher: fin };
        }
        return { ...prev, scParked, done, ...keep, finisher: fin };
      }
      const fs = cfg.finisherShots;
      const onAir = prev.cam && prev.dur !== null && elapsed < prev.dur;
      if (onAir || !fs) return { ...prev, done, ...keep };
      // The next car that crossed the line and is still near it (an old crossing is not filmed late).
      const seen = new Set(fin.seen);
      const fresh = finished.filter((event) => !seen.has(event.carId));
      const stale = fresh.filter((event) => rt - event.t > fs.maxLagSec);
      const due = fresh.find((event) => rt - event.t <= fs.maxLagSec && event.t <= rt + 1e-9);
      const seenNow = [...fin.seen, ...stale.map((event) => event.carId)];
      if (due) {
        const lo = fs.minSec;
        const hi = Math.max(lo, fs.maxSec);
        const dur = lo + (hi - lo) * hash01(fnv(`${seed}|finish|${due.carId}|finisher`), due.pos);
        return { name: "finish", index: -1, cam: fs.cam, subject: "finisher", subjectId: due.carId, since: rt, dur, active: true, scParked: false, done, finisher: { seen: [...seenNow, due.carId], last: due.t }, ...keep };
      }
      const last = Math.max(fin.last, ...finished.map((event) => event.t));
      const everyone = (input.rows || []).every((row) => row.out || row.pose?.gone || row.pose?.finished);
      // Nobody left to film: the director goes back to the zones and the script is over.
      if ((everyone && (input.rows || []).length > 0) || rt - last > fs.idleEndSec) return IDLE({ ...done, finish: true }, keep);
      return { ...IDLE(done, keep), name: "finish", active: true, since: prev.since, finisher: { seen: seenNow, last } };
    }
  }
  if (done.finish || winner) return IDLE(done, keep);

  // --- the start: the lights, lights out and the first corners.
  if (prev?.name === "start" && prev.active) {
    const shots = scripts.start.shots;
    const shot = shots[prev.index];
    const elapsed = now - prev.since;
    const held = elapsed >= (shot.minSec ?? 0);
    // CAM-C3 (VIEW-10): the race time the lights went out, for the low lights shot's holdShotSec.
    const outAt = Number.isFinite(prev.outAt) ? prev.outAt : start?.phase === "out" ? now : null;
    const stay = { ...prev, scParked, done, ...keep, outAt };
    const next = () => {
      const k = nextIndex("start", prev.index + 1);
      if (k >= 0 && (shots[k].trigger === "next" || startFires(shots[k].trigger, start))) return cutTo("start", k, { outAt });
      if (k >= 0) return stay;
      return IDLE({ ...done, start: true, preRace: true }, keep);
    };
    if (shot.until) {
      const capped = Number.isFinite(shot.maxSec) && elapsed >= shot.maxSec;
      return capped || (held && untilFires(shot.until, { start, outAt, now, hold: scripts.start.holdShotSec, rows: input.rows, subjectId: prev.subjectId, zones: input.zones })) ? next() : stay;
    }
    if (prev.dur !== null && elapsed >= prev.dur) return next();
    return stay;
  }
  if (!done.start && start) {
    // The lights are on: the script takes over from the pre-race. Lights already out (a race with no
    // PRE_START, a view that joined late): the shots after lights out, if it is still the start.
    const lit = startFires("start:lights", start);
    const late = start.phase === "out" && (Number.isFinite(input.tau) ? input.tau : 0) <= (scripts.start.lateSec ?? 0);
    if (lit || late) {
      const shots = scripts.start.shots;
      const k = shots.findIndex((shot) => shotAvailable(shot, year) && startFires(shot.trigger, start));
      if (k >= 0) return cutTo("start", k, { done: { ...done, preRace: true } });
    }
    if (start.phase === "out" && !late) return IDLE({ ...done, start: true, preRace: true }, keep);
  }

  // --- the pre-race: the grid and the formation lap, skippable.
  if (!done.preRace && isPre(start)) {
    if (skipped && scripts.preRace.skippable) return IDLE({ ...done, preRace: true }, keep);
    const loop = Boolean(scripts.preRace.loop);
    if (prev?.name === "preRace" && prev.active && prev.cam) {
      const shot = scripts.preRace.shots[prev.index];
      const elapsed = now - prev.since;
      const stillFits = !shot.during || shot.during.includes(start.phase);
      if (stillFits && !(prev.dur !== null && elapsed >= prev.dur)) return { ...prev, scParked, done, ...keep };
      if (!stillFits && elapsed < (shot.minSec ?? 0)) return { ...prev, scParked, done, ...keep };
      const k = nextIndex("preRace", prev.index + 1 >= scripts.preRace.shots.length && loop ? 0 : prev.index + 1, { wrap: loop });
      return k >= 0 ? cutTo("preRace", k) : { ...IDLE(done, keep), scParked };
    }
    const k = nextIndex("preRace", 0, { wrap: loop });
    return k >= 0 ? cutTo("preRace", k) : { ...IDLE(done, keep), scParked };
  }
  return { ...IDLE(done, keep), scParked };
};

/** Skip the pre-race (the viewer's button; broadcast.json sequences.preRace.skippable). */
export const skipPreRace = (state) => (state ? { ...state, skipped: true } : IDLE({}, { skipped: true }));

// ------------------------------------------------------------- onboard inserts

/** The zones of a lap that may carry an insert this lap: `perLap` of the zones of a kind in zoneKinds, drawn with the seed per car and lap. */
export const insertZonesFor = (zones, { seed = 0, carId = "", lap = 0 }, cfg = INSERTS) => {
  const list = zones?.zones || [];
  const candidates = [];
  list.forEach((zone, index) => {
    if (cfg.zoneKinds.includes(zone.kind)) candidates.push(index);
  });
  const count = Math.min(candidates.length, Math.max(0, Math.floor(cfg.perLap ?? 0)));
  const pool = candidates.slice();
  const chosen = [];
  const base = fnv(`${seed}|${carId}|${cfg.seedSalt}`);
  for (let k = 0; k < count; k += 1) {
    const pick = Math.floor(hash01(base ^ Math.imul(lap + 1, 0x9e3779b1), k + 1) * pool.length);
    chosen.push(pool.splice(Math.min(pool.length - 1, pick), 1)[0]);
  }
  return chosen.sort((a, b) => a - b);
};

const zoneAt = zoneIndexAt;

/**
 * One step of the onboard inserts: while the car on air crosses one of this lap's insert zones, the
 * director cuts to the driver's view (inserts.onboard cam) for a drawn length, or until it leaves the
 * zone. `input`: { carId, progress (laps), tau (race time), seed, year, zones (three/cameraZones
 * zonesFor), blocked (a fight, the pit lane: no insert) }. Off with inserts.onboard.enabled false, with
 * no zones, or in a season without that camera (SRS §6).
 */
export const stepInsert = (prev, input = {}, cfg = INSERTS) => {
  const { carId = null, progress, tau, seed = 0, year, zones, blocked = false } = input;
  const idle = (used = null) => ({ active: false, cam: null, carId, lap: null, zone: -1, since: null, dur: null, used });
  if (!cfg.enabled || !zones?.zones?.length || !Number.isFinite(progress) || carId === null || !onboardInYear(cfg.cam, year)) return idle();
  const lap = Math.max(0, Math.floor(progress));
  const now = Number.isFinite(tau) ? tau : 0;
  const same = prev && prev.carId === carId;
  const used = same && prev.used && prev.used.lap === lap ? prev.used : { lap, zones: [] };
  const zone = zoneAt(zones, progress);
  if (same && prev.active) {
    const still = prev.lap === lap && prev.zone === zone && now - prev.since < prev.dur && !blocked;
    return still ? { ...prev, used } : idle(used);
  }
  if (blocked || zone < 0 || used.zones.includes(zone)) return idle(used);
  if (!insertZonesFor(zones, { seed, carId, lap }, cfg).includes(zone)) return idle(used);
  const lo = cfg.minSec ?? 0;
  const hi = Math.max(lo, cfg.maxSec ?? lo);
  const dur = lo + (hi - lo) * hash01(fnv(`${seed}|${carId}|${cfg.seedSalt}|len`), lap * 64 + zone + 1);
  return { active: true, cam: cfg.cam, carId, lap, zone, since: now, dur, used: { lap, zones: [...used.zones, zone] } };
};

export default stepScript;
