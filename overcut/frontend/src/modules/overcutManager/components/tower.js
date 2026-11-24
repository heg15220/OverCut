/**
 * The timing tower's data, pure (no React): HUD-2 of docs/manager/F1M24-GAMEPLAY.md
 * (tower-modes, flag-header-sectors, garage-exit-presentation; RF-WKD-07, RF-WKD-02,
 * RF-SIM-10, RF-3D-04, RNF-07, RNF-09). Every choice is in data/balance/hud.json `tower`.
 *
 *   towerModesFor       the modes the selector offers: hud.json order (by era when byEra has
 *                       the year), only those the engine gives data for
 *   lastLapOf, stopsOf, lapSectorsOf   what a mode shows, read from the lap history up to `tau`
 *   sectorTone          purple / green / yellow of a sector, with its words (never colour alone)
 *   sectorOfShare, yellowSectorOf, yellowFlag   the yellow's sector: `yellow.sector` from the
 *                       engine when it sends it (§1.7, SIM-4 / SES-3), otherwise the corner's
 *                       place on the lap against circuit.sectors
 *   headerFlagOf        whether the tower header is tinted by the flag, and its words
 *   incidentOf          the row's diamond: investigation pending, a recent incident, an error
 *   runPhaseOf, runPhaseText, distanceText   the session phase of a car in the §1.7 contract
 *                       (GARAGE … IN_LAP, SES-2), from today's phases when the engine has none
 *
 * The view only reads (§1.4 rule 5): nothing here changes the race or the session.
 */

import HUD from "../data/balance/hud.json";
import { locale, t } from "./texts";

export { HUD };

// ------------------------------------------------------------------ modes

/**
 * The tower modes for a session ("race" or a session kind) and year. `available` (a list or
 * Set of mode ids, optional) drops the modes the engine has no data for.
 */
export const towerModesFor = ({ session = "race", year = null, available = null } = {}, hud = HUD) => {
  const tower = hud.tower;
  let modes = session === "race" ? tower.modes : tower.session.modes;
  if (session === "race" && year !== null) {
    const era = (tower.byEra || []).find((entry) => entry.from <= year && year <= entry.to);
    if (era) modes = era.modes;
  }
  if (!available) return modes.slice();
  const has = available instanceof Set ? available : new Set(available);
  const kept = modes.filter((mode) => has.has(mode));
  return kept.length ? kept : modes.slice(0, 1);
};

/** The selector's label of a mode. */
export const towerModeName = (mode) =>
  ({
    interval: () => t("Intervalo", "Interval"),
    gap: () => t("Líder", "Leader"),
    tyres: () => t("Neumáticos", "Tyres"),
    tyresPct: () => t("Neum. %", "Tyre %"),
    lastLap: () => t("Última", "Last lap"),
    sectors: () => t("Sectores", "Sectors"),
    stops: () => t("Paradas", "Stops"),
    best: () => t("Mejor", "Best"),
    status: () => t("Estado", "Status"),
  })[mode]?.() ?? mode;

// ------------------------------------------------------------------ what a mode shows

const visibleLaps = (car, tau) => (car?.history || []).filter((entry) => !entry.retired && entry.end <= tau);

/** The last lap a car has finished by `tau` (seconds), or null. Session laps carry `flying`. */
export const lastLapOf = (car, tau) => {
  const laps = visibleLaps(car, tau);
  const last = laps[laps.length - 1];
  if (!last) return null;
  if (Number.isFinite(last.flying)) return last.flying;
  return Number.isFinite(last.start) && Number.isFinite(last.end) ? last.end - last.start : null;
};

/** The stops a car has made by `tau`: laps with a stop on them. */
export const stopsOf = (car, tau) => visibleLaps(car, tau).filter((entry) => entry.pit).length;

/** The sectors of the last lap with sector times finished by `tau` (null when the engine gives none). */
export const lapSectorsOf = (car, tau) => {
  const laps = visibleLaps(car, tau).filter((entry) => Array.isArray(entry.sectors) && entry.sectors.length);
  return laps.length ? laps[laps.length - 1].sectors : null;
};

/** Does any car's history carry sector times (the race only offers the mode when it does)? */
export const hasSectorTimes = (cars) => (cars || []).some((car) => (car.history || []).some((entry) => Array.isArray(entry.sectors) && entry.sectors.length));

/**
 * The tone of a sector time: "best" (session best, purple), "pb" (personal best, green) or
 * "slow" (yellow), each with its words for screen readers and tooltips.
 */
export const sectorTone = (value, sessionBest, personalBest) => {
  if (!Number.isFinite(value)) return { tone: "", text: "" };
  if (Number.isFinite(sessionBest) && value <= sessionBest + 1e-9) return { tone: "best", text: t("mejor de la sesión", "session best") };
  if (!Number.isFinite(personalBest) || value <= personalBest + 1e-9) return { tone: "pb", text: t("mejor propio", "personal best") };
  return { tone: "slow", text: t("más lento", "slower") };
};

// ------------------------------------------------------------------ yellows by sector

const frac = (value) => ((value % 1) + 1) % 1;

/** The sector (1-based) of a share of the lap, from circuit.sectors (the start share of each). */
export const sectorOfShare = (circuit, share) => {
  const starts = circuit?.sectors;
  if (!Array.isArray(starts) || starts.length === 0 || !Number.isFinite(share)) return null;
  const s = frac(share);
  let sector = 1;
  starts.forEach((start, index) => {
    if (s >= start) sector = index + 1;
  });
  return sector;
};

/**
 * The sector of a yellow: `sector` from the engine (§1.7 yellow event), else the share `s`
 * (metres along the lap when above 1), else the corner's start on the lap.
 */
export const yellowSectorOf = (circuit, zone) => {
  if (!zone) return null;
  if (Number.isFinite(zone.sector)) return zone.sector;
  if (Number.isFinite(zone.s)) return sectorOfShare(circuit, zone.s > 1 && circuit?.length ? zone.s / circuit.length : zone.s);
  const corner = (circuit?.corners || []).find((entry) => entry.number === zone.corner);
  if (corner && Number.isFinite(corner.from)) return sectorOfShare(circuit, corner.from);
  return null;
};

/**
 * The yellow over the tower and the picture: { kind: "yellow", label, sectors, double } or null
 * without yellows. The words always say it (RNF-09): "Amarilla · sector 2 · C4".
 */
export const yellowFlag = (circuit, zones, hud = HUD) => {
  if (!zones || zones.length === 0) return null;
  const sectors = hud.tower.header.sectorLabel ? [...new Set(zones.map((zone) => yellowSectorOf(circuit, zone)).filter((value) => value !== null))].sort((a, b) => a - b) : [];
  const corners = zones.map((zone) => zone.corner).filter((value) => value !== undefined && value !== null);
  const double = zones.some((zone) => zone.double);
  const parts = [double ? t("Doble amarilla", "Double yellow") : t("Amarilla", "Yellow")];
  if (sectors.length) parts.push(sectors.length === 1 ? t(`sector ${sectors[0]}`, `sector ${sectors[0]}`) : t(`sectores ${sectors.join(", ")}`, `sectors ${sectors.join(", ")}`));
  if (corners.length) parts.push(corners.map((corner) => `${t("C", "T")}${corner}`).join(" "));
  return { kind: "yellow", label: parts.join(" · "), sectors, double };
};

/** The header's flag: the flag itself when hud.json header.kinds tints it, else null. Never without words. */
export const headerFlagOf = (flag, hud = HUD) => {
  if (!flag || !flag.kind || !hud.tower.header.kinds.includes(flag.kind)) return null;
  const label = typeof flag.label === "string" && flag.label.trim() ? flag.label : flagWords(flag.kind);
  return { kind: flag.kind, label };
};

/**
 * Yellows of a session at `now` (SES-3, §1.7): the engine's `yellowZones` and its `yellow`
 * events still waved (`until` after now). Without them, none - the view never invents one.
 */
export const sessionYellowsAt = (engine, now) => {
  const waved = (zone) => Number.isFinite(zone.until) && zone.until > now;
  const zones = (engine?.yellowZones || []).filter((zone) => zone.until === undefined || zone.until === null || zone.until > now);
  const events = (engine?.events || []).filter((event) => event.type === "yellow" && (event.t ?? event.at ?? 0) <= now && waved(event));
  return [...zones, ...events];
};

/** The words of a flag state on its own (the fallback when a caller gave none). */
export const flagWords = (kind) =>
  ({
    green: () => t("Bandera verde", "Green flag"),
    yellow: () => t("Amarilla", "Yellow"),
    sc: () => t("Coche de seguridad", "Safety car"),
    vsc: () => t("Coche de seguridad virtual", "Virtual safety car"),
    red: () => t("Bandera roja", "Red flag"),
    chequered: () => t("Bandera a cuadros", "Chequered flag"),
    session: () => t("Sesión", "Session"),
  })[kind]?.() ?? kind;

// ------------------------------------------------------------------ row flags

/**
 * Is a car in an incident at `tau`? `events` are { type, carId, otherId, at } (race seconds);
 * an investigation counts until a decision (penalty or no-action) for that car.
 */
export const incidentOf = (carId, events, tau, pose = null, hud = HUD) => {
  const cfg = hud.tower.flags.incident;
  if (pose?.incident) return true;
  let open = false;
  let recent = false;
  (events || []).forEach((event) => {
    const at = event.at ?? 0;
    if (at > tau) return;
    const involved = event.carId === carId || event.otherId === carId;
    if (cfg.investigation && event.carId === carId) {
      if (event.type === "investigation") open = true;
      else if (event.type === "penalty" || event.type === "no-action") open = false;
    }
    if (involved && cfg.events.includes(event.type) && tau - at <= cfg.holdSec) recent = true;
  });
  return open || recent;
};

/** Race: on the lap after a stop (the last lap at the line had one and the car is out of the lane). */
export const raceOutLap = (car, tau, pose) => {
  if (!HUD.tower.flags.outLap || pose?.inPit || pose?.finished) return false;
  const laps = visibleLaps(car, tau);
  return Boolean(laps.length && laps[laps.length - 1].pit);
};

/** Race: coming in this lap - the stop called and the car not yet in the lane. */
export const raceInLap = (car, pose) => Boolean(HUD.tower.flags.inLap && car?.pitRequest && !pose?.inPit && !pose?.finished && car.status === "running");

// ------------------------------------------------------------------ session phases (§1.7)

/** The §1.7 session phases, and today's engine phases (session.js carStatus) in their terms. */
export const RUN_PHASES = ["GARAGE", "GARAGE_EXIT", "OUT_LAP", "PUSH_PREP", "PUSH", "IN_LAP"];
const LEGACY_PHASE = { garage: "GARAGE", queued: "GARAGE_EXIT", out: "OUT_LAP", flying: "PUSH", cool: "COOL", in: "IN_LAP", pitlane: "PIT_LANE" };

/**
 * The phase of a car in a session: the engine's §1.7 phase when it gives one (SES-2:
 * `status.runPhase`, or `status.phase` already in capitals), else today's phase mapped.
 */
export const runPhaseOf = (status) => {
  if (!status) return null;
  if (typeof status.runPhase === "string" && status.runPhase) return status.runPhase;
  const phase = status.phase;
  if (typeof phase !== "string") return null;
  if (RUN_PHASES.includes(phase)) return phase;
  return LEGACY_PHASE[phase] ?? phase.toUpperCase();
};

/** Words for a session phase. */
export const runPhaseText = (phase) =>
  ({
    GARAGE: () => t("En el garaje", "In the garage"),
    GARAGE_EXIT: () => t("Saliendo del garaje", "Leaving the garage"),
    OUT_LAP: () => t("Vuelta de salida", "Out lap"),
    PUSH_PREP: () => t("Preparando la vuelta", "Preparing the lap"),
    PUSH: () => t("Vuelta lanzada", "Flying lap"),
    COOL: () => t("Enfriando", "Cool-down"),
    IN_LAP: () => t("Vuelta de entrada", "In lap"),
    PIT_LANE: () => t("Entrando al box", "Pit lane"),
  })[phase]?.() ?? "";

/** Is the phase an out lap or an in lap (the row tags of the tower)? */
export const isOutPhase = (phase) => phase === "GARAGE_EXIT" || phase === "OUT_LAP";
export const isInPhase = (phase) => phase === "IN_LAP" || phase === "PIT_LANE";

/** A distance for the box call: metres under a kilometre, kilometres with one decimal above. */
export const distanceText = (metres) => {
  if (!Number.isFinite(metres) || metres < 0) return "";
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toLocaleString(locale === "es" ? "es-ES" : "en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

/** The distance to the pit entry of a box call (SES-2 `boxRequest {distanceM}`), or null today. */
export const boxDistanceOf = (car) => {
  const request = car?.boxRequest;
  return request && typeof request === "object" && Number.isFinite(request.distanceM) ? request.distanceM : null;
};
