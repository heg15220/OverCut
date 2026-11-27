/**
 * Playback of a live session, pure (no React): HUD-1 of docs/manager/F1M24-GAMEPLAY.md
 * (speeds-unify, auto-velocidad, auto-speed-drop, user-camera-lock; RF-CMD-04, RF-3D-04,
 * RNF-05, RNF-07, RNF-09). Every number is in data/balance/live-view.json and hud.json.
 *
 *   speedsOf / defaultSpeedOf     one 1-16 scale for the race and the sessions
 *   engineChunk                   how much race the view asks the worker for (never changes the race)
 *   createAutoSpeed / notify /    the auto-speed machine: drops the playback speed when something
 *   tickAutoSpeed / chooseSpeed   happens to your team or on the track, and gives it back afterwards
 *   raceTriggers / sessionTriggers  engine events and phases turned into trigger ids
 *   viewsOf / camerasOf /         the view (map, TV, camera) apart from the camera, and the car
 *   cameraModeOf / stepCar        before or after the focused one by position
 *   cameraRingOf / mirrorCameraOf /  HUD-C2 (F1M24-CHINA VIEW-14, VIEW-17): the camera ring by era from cameras.json in
 *   cameraOnFocus / fastForwardStep  broadcast.json's order, the held rear-view camera, the camera kept when the focus
 *                                 moves, and the optional switch to the map in fast forward with the camera given back
 *
 * The view only reads the engine (§1.4 rule 5): auto-speed changes how many seconds of race
 * the view asks for per real second, and the race worker cuts any request into the same fixed
 * steps (RF-SIM-15), so the same seed and orders give the same race with it or without it.
 */

import LIVE_VIEW from "../data/balance/live-view.json";
import HUD from "../data/balance/hud.json";
import CAMERAS from "../data/balance/cameras.json";
import BROADCAST from "../data/balance/broadcast.json";
import { advanceTo, carStatus } from "../engine/sessionSim";
import { t } from "./texts";

export { LIVE_VIEW, HUD };

// ------------------------------------------------------------------ speeds

/** RF-CMD-04: the speed scale, the same in every session. */
export const speedsOf = (config = LIVE_VIEW) => config.speeds.list.slice();

/** The speed a session starts at: race, raceReplay, practice, qualifying or shootout. */
export const defaultSpeedOf = (kind, config = LIVE_VIEW) => {
  const speeds = speedsOf(config);
  const wanted = config.defaultSpeed[kind] ?? config.defaultSpeed.race;
  return speeds.includes(wanted) ? wanted : speeds[0];
};

/**
 * Step race: the race seconds to ask the worker for now (0 = enough is coming), so the
 * engine stays a little ahead of the clock at every speed.
 */
export const engineChunk = (requested, tau, speed, config = LIVE_VIEW) => {
  const chunk = Math.max(config.engineLead.minChunkSec, speed * config.engineLead.chunkPerSpeedSec);
  if (requested - tau > chunk / 2) return 0;
  return Math.max(requested, tau) + chunk - requested;
};

// ------------------------------------------------------------------ auto-speed

const priorityOf = (id, config) => config.eventPriority.map[id] ?? 0;

/** The speed cap of a priority (null: it does not slow anything). */
const capOf = (priority, config) => {
  const level = config.autoSpeed.levels.filter((entry) => priority >= entry.minPriority).sort((a, b) => b.minPriority - a.minPriority)[0];
  return level ? level.speed : null;
};

/**
 * The machine, one per live session. `speed` is what plays now, `base` what the player
 * chose; `target` the cap of the last drop (null when none is pending).
 */
export const createAutoSpeed = ({ speed, speeds = speedsOf(), config = LIVE_VIEW, enabled = config.autoSpeed.enabledByDefault } = {}) => ({
  speeds: [...speeds].sort((a, b) => a - b),
  config,
  enabled,
  speed,
  base: speed,
  target: null,
  reason: null,
  lastTriggerSim: -Infinity,
  lastNotchReal: -Infinity,
  callout: null,
  changes: 0,
});

const setSpeed = (machine, speed, reason, realNow) => {
  if (machine.speed === speed) return false;
  machine.speed = speed;
  machine.changes += 1;
  machine.callout = { speed, reason, at: realNow };
  return true;
};

/** One notch towards the target (or all the way when there is no ramp). */
const stepDown = (machine, realNow) => {
  if (machine.target === null || machine.speed <= machine.target) return false;
  const ramp = machine.config.autoSpeed.rampRealSec;
  if (ramp > 0 && realNow - machine.lastNotchReal < ramp) return false;
  const lower = machine.speeds.filter((value) => value < machine.speed && value >= machine.target);
  const next = ramp > 0 ? lower[lower.length - 1] : machine.target;
  machine.lastNotchReal = realNow;
  return setSpeed(machine, next ?? machine.target, machine.reason, realNow);
};

/**
 * Triggers seen at `simTime` (session seconds) and `realNow` (real seconds): the speed drops
 * to the cap of the highest priority, never above what the player chose. True if it changed.
 */
export const notify = (machine, triggers, simTime, realNow) => {
  if (!machine.enabled || !triggers || triggers.length === 0) return false;
  const top = triggers.reduce((best, id) => (priorityOf(id, machine.config) > priorityOf(best, machine.config) ? id : best), triggers[0]);
  const cap = capOf(priorityOf(top, machine.config), machine.config);
  if (cap === null) return false;
  if (machine.target === null && machine.speed <= cap) return false;
  if (machine.target === null) machine.base = machine.speed;
  if (machine.target === null || cap <= machine.target) {
    machine.target = machine.target === null ? cap : Math.min(machine.target, cap);
    machine.reason = top;
  }
  machine.lastTriggerSim = simTime;
  return stepDown(machine, realNow);
};

/** Every frame: the next notch of a ramp, and the player's speed back once things calm down. */
export const tickAutoSpeed = (machine, simTime, realNow) => {
  if (machine.target === null) return false;
  if (machine.speed > machine.target) return stepDown(machine, realNow);
  const restore = machine.config.autoSpeed.restoreAfter;
  if (restore.enabled && simTime - machine.lastTriggerSim >= restore.simSec) {
    machine.target = null;
    machine.reason = null;
    return setSpeed(machine, Math.max(machine.speed, machine.base), "restore", realNow);
  }
  return false;
};

/** The player picks a speed: it is theirs from now on (any pending drop is forgotten). */
export const chooseSpeed = (machine, speed, realNow) => {
  machine.base = speed;
  machine.target = null;
  machine.reason = null;
  return setSpeed(machine, speed, "manual", realNow);
};

/** Auto-speed on or off; turning it off keeps the speed playing now as the player's. */
export const setAutoSpeedEnabled = (machine, enabled) => {
  machine.enabled = enabled;
  if (!enabled) {
    machine.base = machine.speed;
    machine.target = null;
    machine.reason = null;
  }
};

// ------------------------------------------------------------------ triggers

const isOwn = (event, isUser) => Boolean(isUser(event.carId) || (event.otherId !== undefined && isUser(event.otherId)));

/**
 * Race triggers from events that have just become visible and the player's cars that have
 * just entered the pit lane. `isUser(carId)` says which cars are the player's.
 */
export const raceTriggers = ({ events = [], pitEntries = [], isUser = () => false, config = LIVE_VIEW } = {}) => {
  const map = config.triggers;
  const out = [];
  events.forEach((event) => {
    if (map.raceEvents[event.type]) out.push(map.raceEvents[event.type]);
    if (map.ownRaceEvents[event.type] && isOwn(event, isUser)) out.push(map.ownRaceEvents[event.type]);
  });
  if (pitEntries.length > 0) out.push(map.ownPitEntry);
  return out;
};

/** Session triggers from new engine events and the phases your cars have just entered. */
export const sessionTriggers = ({ events = [], phases = [], isUser = () => false, config = LIVE_VIEW } = {}) => {
  const map = config.triggers;
  const out = [];
  events.forEach((event) => {
    if (map.sessionEvents[event.type]) out.push(map.sessionEvents[event.type]);
    if (map.ownSessionEvents[event.type] && isOwn(event, isUser)) out.push(map.ownSessionEvents[event.type]);
  });
  phases.forEach((phase) => {
    if (map.ownSessionPhases[phase]) out.push(map.ownSessionPhases[phase]);
  });
  return out;
};

/** RF-CMD-04 "next event" in a session: does this engine event stop the skip? */
export const stopsSessionSkip = (event, isUser, config = LIVE_VIEW) =>
  config.nextEvent.session.includes(event.type) || (config.nextEvent.ownSession.includes(event.type) && isOwn(event, isUser));

/**
 * RF-CMD-04 "saltar al siguiente evento" in a session: the engine's own fixed steps
 * (advanceTo one step at a time) up to the next event of nextEvent, or until one of your
 * cars changes phase, never past maxSimSec or the end of the segment. Returns the new clock.
 */
export const runToNextSessionEvent = (engine, { userIds = [], from = engine.clock, config = LIVE_VIEW } = {}) => {
  const isUser = (id) => userIds.includes(id);
  const phaseOf = (id) => carStatus(engine, id, engine.clock)?.phase;
  const before = Object.fromEntries(userIds.map((id) => [id, phaseOf(id)]));
  const limit = Math.max(from, engine.clock) + config.nextEvent.maxSimSec;
  let index = engine.events.length;
  let stop = false;
  while (!stop && !engine.over && !engine.done && engine.clock < limit) {
    const clock = engine.clock;
    advanceTo(engine, clock + engine.dt);
    if (engine.clock === clock) break;
    for (; index < engine.events.length && !stop; index += 1) stop = stopsSessionSkip(engine.events[index], isUser, config);
    if (!stop) stop = userIds.some((id) => phaseOf(id) !== before[id]);
  }
  return engine.clock;
};

/** What the callout says about a speed change. */
export const reasonText = (reason) =>
  ({
    manual: () => "",
    restore: () => t("Velocidad elegida", "Your speed"),
    ownPitEntry: () => t("Tu coche entra en boxes", "Your car is pitting"),
    ownGarageExit: () => t("Tu coche sale del garaje", "Your car leaves the garage"),
    ownRetirement: () => t("Abandono de tu equipo", "Your team retires a car"),
    chequered: () => t("Bandera a cuadros", "Chequered flag"),
    redFlag: () => t("Bandera roja", "Red flag"),
    safetyCar: () => t("Coche de seguridad", "Safety car"),
    virtualSafetyCar: () => t("Coche de seguridad virtual", "Virtual safety car"),
    ownContact: () => t("Contacto de tu coche", "Contact for your car"),
    ownPenalty: () => t("Sanción a tu equipo", "Penalty for your team"),
    ownKnockedOut: () => t("Tu coche queda eliminado", "Your car is knocked out"),
    ownFlyingLap: () => t("Vuelta lanzada", "Flying lap"),
    ownPass: () => t("Adelantamiento de tu coche", "Your car in a pass"),
    ownMistake: () => t("Error de tu piloto", "Your driver's mistake"),
    rain: () => t("Lluvia", "Rain"),
  })[reason]?.() ?? "";

// ------------------------------------------------------------------ views and cameras

/** The view selector: map, TV and camera (user-camera-lock). */
export const viewsOf = (config = LIVE_VIEW) => config.views.list.slice();

/** The view a session starts in (practice: the map). */
export const defaultViewOf = (kind, has3D, config = LIVE_VIEW) => {
  const table = config.views.defaultView[has3D ? "with3D" : "without3D"];
  return table[kind] ?? table.race;
};

/**
 * The cameras of the camera selector. With a catalogue by era (data/balance/cameras.json
 * onboard[] of CAM-1: `[{ id, eras: [{ from, to }] }]`) only the year's; without one, the
 * list of live-view.json (today's cameras).
 */
export const camerasOf = ({ has3D, year = null, catalogue = null, config = LIVE_VIEW } = {}) => {
  // HUD-C1: live-view.json views.camerasByEra (the ring per era, HUD-C2) replaces the 3D list in its years.
  const byEra = has3D && year !== null ? (config.views.camerasByEra?.list || []).find((row) => row.from <= year && year <= row.to) : null;
  const fallback = (byEra ? byEra.with3D : config.views.cameras[has3D ? "with3D" : "without3D"]).slice();
  if (!has3D || !Array.isArray(catalogue) || catalogue.length === 0) return fallback;
  const inEra = catalogue
    .filter((camera) => camera && camera.id)
    .filter((camera) => !Array.isArray(camera.eras) || year === null || camera.eras.some((era) => (era.from ?? -Infinity) <= year && year <= (era.to ?? Infinity)))
    .map((camera) => camera.id);
  // The era's ring (its order) keeps only the cameras the catalogue has that year.
  const ring = byEra ? fallback.filter((id) => inEra.includes(id)) : inEra;
  return ring.length > 0 ? ring : fallback;
};

// ------------------------------------------------------------------ HUD-C2: the camera ring, the mirror, fast forward

const inYears = (eras, year) => !Array.isArray(eras) || year === null || year === undefined || eras.some((era) => (era.from ?? -Infinity) <= year && year <= (era.to ?? Infinity));

/**
 * VIEW-14 (HUD-C2): the ring of the camera view with 3D for `year`, in broadcast.json cycleOrder (live-view.json
 * views.ring): the exterior cameras always, each onboard of cameras.json only in its years and never a replay-only
 * one. Without 3D, live-view.json cameras.without3D. A camera the order names but nobody knows is left out; a known
 * camera the order forgets goes at the end, so nothing the catalogue has is lost.
 */
export const cameraRingOf = ({ has3D, year = null, config = LIVE_VIEW, catalogue = CAMERAS.onboard, order = BROADCAST.cycleOrder?.cameras } = {}) => {
  if (!has3D) return config.views.cameras.without3D.slice();
  const ring = config.views.ring;
  if (!ring) return camerasOf({ has3D, year, config });
  const exterior = ring.segments.exterior;
  const onboard = (catalogue || []).filter((camera) => camera && camera.id && !camera.replayOnly && inYears(camera.eras, year)).map((camera) => camera.id);
  const known = new Set([...exterior, ...onboard]);
  const ordered = (order || []).filter((id) => known.has(id));
  const rest = [...exterior, ...onboard].filter((id) => !ordered.includes(id));
  const list = [...ordered, ...rest];
  return list.length ? list : camerasOf({ has3D, year, config });
};

/** The segment of a camera in the ring: "exterior" or "onboard" (live-view.json views.ring.segments). */
export const cameraSegmentOf = (id, config = LIVE_VIEW) => (config.views.ring?.segments.exterior.includes(id) ? "exterior" : "onboard");

export const segmentName = (segment) => (segment === "exterior" ? t("Exterior", "Exterior") : t("A bordo", "Onboard"));

/**
 * VIEW-14: the rear-view camera held by its key (live-view.json views.mirror), or null when the season's cars do not
 * carry it (cameras.json eras) or there is no 3D.
 */
export const mirrorCameraOf = ({ has3D, year = null, config = LIVE_VIEW, catalogue = CAMERAS.onboard } = {}) => {
  const mirror = config.views.mirror;
  if (!has3D || !mirror?.enabled) return null;
  const camera = (catalogue || []).find((entry) => entry.id === mirror.camera);
  return camera && inYears(camera.eras, year) ? camera.id : null;
};

/** Is a key event the mirror's key (never typing in a field)? */
export const isMirrorKey = (event, config = LIVE_VIEW) => {
  const key = config.views.mirror?.key;
  if (!key || !event || typeof event.key !== "string") return false;
  const target = event.target;
  const tag = target && typeof target.tagName === "string" ? target.tagName.toUpperCase() : "";
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (target && target.isContentEditable)) return false;
  return event.key.toLowerCase() === key.toLowerCase() && !event.ctrlKey && !event.metaKey && !event.altKey;
};

/**
 * VIEW-14 "al cambiar de foco se conserva el tipo": the camera after the focus moves to another car - the same camera
 * when it is in the ring (keepTypeOnFocus), otherwise the ring's default.
 */
export const cameraOnFocus = (camera, ring, has3D, config = LIVE_VIEW) => (config.views.ring?.keepTypeOnFocus && ring.includes(camera) ? camera : defaultCameraOf(ring, has3D, config));

/**
 * VIEW-17 (HUD-C2): fast forward to the map, a pure step over what the player chose. `view` and `camera` are the
 * player's (the view's state, never changed by fast forward), `speed` the playback speed and `enabled` the player's
 * option (live-view.json fastForward.enabled at the start). Returns { view, camera, settle } to show: at mapAtSpeed
 * or more, the map; below it again, the player's view and camera as they were (restoreCamera), or `settle: "map"`
 * when restoreCamera is off so the caller keeps the map. A view the player picks while it is fast wins
 * (pickViewDuringFastForward). Without 3D nothing changes (it is the map or the overhead camera already).
 */
export const createFastForward = () => ({ active: false, userPicked: false });
export const fastForwardStep = (memo, { view, camera, speed, enabled, has3D = true }, config = LIVE_VIEW) => {
  const ff = config.fastForward;
  if (!ff || !has3D) return { view, camera, settle: null };
  const fast = Boolean(enabled) && speed >= ff.mapAtSpeed;
  if (fast) {
    if (!memo.active) {
      memo.active = true;
      memo.userPicked = false;
    }
    return memo.userPicked ? { view, camera, settle: null } : { view: "map", camera, settle: null };
  }
  if (memo.active) {
    memo.active = false;
    const keep = !ff.restoreCamera && !memo.userPicked;
    memo.userPicked = false;
    return keep ? { view: "map", camera, settle: "map" } : { view, camera, settle: null };
  }
  return { view, camera, settle: null };
};
/** The player picks a view while fast forward shows the map: theirs wins until the speed drops. */
export const pickViewDuringFastForward = (memo) => {
  if (memo && memo.active) memo.userPicked = true;
  return memo;
};

/**
 * AUD-C3 (HUD-C2, F1M24-CHINA §1.5 «Radio en sesiones», §2.7): the radio messages a view hands to audio.frame, race
 * and sessions alike - those `visible(message)` says are already heard, each { key, lap, carId, kind, alert, panel,
 * pan }: `panel` the side of the player's card for that car ("left" for the first, "right" for the second, null for
 * another car; hud.json layout puts the first card on the left) and `pan` the same as −1 / +1 / 0, for the radio's
 * pan (audio.json ui.radio, AUD-C-2). The key is stable as the log grows: the message's segment, time, car and kind
 * when it is timed, its place in the log otherwise.
 */
export const radioForAudio = (messages, visible, userCars = []) => {
  const side = new Map((userCars || []).slice(0, 2).map((car, index) => [car.id, index === 0 ? "left" : "right"]));
  const out = [];
  (messages || []).forEach((message, index) => {
    if (!message || (visible && !visible(message))) return;
    const panel = side.get(message.carId) ?? null;
    const time = Number.isFinite(message.t) ? message.t : Number.isFinite(message.at) ? message.at : null;
    // Timed messages (sessions, the step race) are keyed by what they are; the quick mode's by their place in the log.
    const key = time !== null ? `radio-${message.segment ?? ""}-${time}-${message.carId ?? ""}-${message.kind ?? ""}` : `radio-${index}`;
    out.push({ key, lap: message.lap ?? null, carId: message.carId ?? null, kind: message.kind ?? null, alert: Boolean(message.alert), panel, pan: panel === "left" ? -1 : panel === "right" ? 1 : 0 });
  });
  return out;
};

export const defaultCameraOf = (cameras, has3D, config = LIVE_VIEW) => {
  const wanted = config.views.defaultCamera[has3D ? "with3D" : "without3D"];
  return cameras.includes(wanted) ? wanted : cameras[0];
};

/** The mode the stage draws (Race3D / RaceStage): the map, the TV director, or the chosen camera. */
export const cameraModeOf = (view, camera) => (view === "map" ? "map" : view === "tv" ? "tv" : camera);

/** One step through a list, wrapping. */
export const cycle = (list, value, step) => {
  if (list.length === 0) return value;
  const index = list.indexOf(value);
  return list[((index < 0 ? 0 : index + step) % list.length + list.length) % list.length];
};

/**
 * The car before or after the focused one in the tower (by position). `rows` are
 * { id, out } in position order; with hud.json carStep.skipOut the retired and the
 * eliminated are passed over.
 */
export const stepCar = (rows, currentId, step, hud = HUD) => {
  const ids = rows.filter((row) => !(hud.carStep.skipOut && row.out)).map((row) => row.id);
  if (ids.length === 0) return currentId;
  const index = ids.indexOf(currentId);
  if (index < 0) return step > 0 ? ids[0] : ids[ids.length - 1];
  return ids[(index + step + ids.length) % ids.length];
};

/** Camera names, for the selector. */
export const cameraName = (id) =>
  ({
    tv: () => "TV",
    chase: () => t("Persecución", "Chase"),
    drone: () => t("Dron", "Drone"),
    heli: () => "Helicam",
    tcam: () => "T-cam",
    visor: () => t("Visor", "Visor"),
    nose: () => t("Morro", "Nose"),
    tcamRear: () => t("T-cam trasera", "Rear T-cam"),
    halo: () => t("Halo", "Halo"),
    cockpitHigh: () => t("Cabina alta", "High cockpit"),
    cockpitSide: () => t("Lateral de cabina", "Cockpit side"),
    sidepod: () => t("Pontón", "Sidepod"),
    follow: () => t("Cenital", "Overhead"),
    map: () => t("Mapa", "Map"),
  })[id]?.() ?? id;

export const viewName = (id) => ({ map: () => t("Mapa", "Map"), tv: () => "TV", camera: () => t("Cámara", "Camera") })[id]?.() ?? id;
