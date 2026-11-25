/**
 * The conditions strip over the picture, pure (no React): HUD-4 of docs/manager/F1M24-GAMEPLAY.md
 * (status-strip-data, §2.12.1; RF-SIM-11, RF-WKD-03, RNF-07). What the strip says comes from the
 * engine and the season's data, never from a formula of the view:
 *
 *   raceStartOf(race)          local start time of the race: the pack's calendar[].sessions (f1db, local
 *                              time), else the circuit's start hour (data/weather/climate.json, ERA5), else
 *                              sessions.json clock.fallbackRaceStartHour. The official start time is the
 *                              start of the formation lap, so the clock runs on through the procedure.
 *   clockLabel(seconds)        hh:mm:ss of a time of day
 *   raceConditionsOf(state, lap, live)
 *                              air (engine/weather timeline, ERA5), track (the engine's own track
 *                              temperatures), water on the racing line in mm (the engine's water, or
 *                              depthOfWetness of its wetness index) and rubber (the engine's `evolution`,
 *                              race.js; or the live weather the race worker sends, weatherNow)
 *   sessionConditionsOf(session, tau)
 *                              the same for a practice or qualifying session (engine/sessionSim: its
 *                              local clock and hourly conditions, and the rubber of sessions.json evolution)
 *   rubberLevel / gripLevel    the words, by race-weather.json display.rubberBands / gripBands
 */

import WEATHER from "../data/balance/race-weather.json";
import SESSIONS from "../data/balance/sessions.json";
import { climateFor, depthOfWetness } from "../engine/weather";
import { localClockOf, sessionConditions } from "../engine/sessionSim/session";
import { t } from "./texts";

export const DISPLAY = WEATHER.display;

const DAY = 86400;
const hmToSec = (value) => {
  const match = typeof value === "string" ? /^(\d{1,2}):(\d{2})/.exec(value) : null;
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 : null;
};

/** The race's local start time: { startSec, source: "pack" | "climate" | "fallback" }. */
export const raceStartOf = (race = {}) => {
  const own = (Array.isArray(race?.sessions) ? race.sessions : []).find((entry) => entry.kind === "race" && hmToSec(entry.startLocal) !== null);
  if (own) return { startSec: hmToSec(own.startLocal), source: "pack" };
  const climate = climateFor(race || {});
  if (climate.key !== "global" && Number.isFinite(climate.startHour)) return { startSec: Math.round(climate.startHour * 3600), source: "climate" };
  return { startSec: Math.round(SESSIONS.clock.fallbackRaceStartHour * 3600), source: "fallback" };
};

/** hh:mm:ss of `seconds` of the day. */
export const clockLabel = (seconds) => {
  const whole = ((Math.floor(seconds) % DAY) + DAY) % DAY;
  return [Math.floor(whole / 3600), Math.floor(whole / 60) % 60, whole % 60].map((v) => String(v).padStart(2, "0")).join(":");
};

const at = (list, lap) => (Array.isArray(list) && list.length ? list[Math.max(0, Math.min(lap, list.length - 1))] : null);
const finite = (value) => (Number.isFinite(value) ? value : null);

/**
 * The race's conditions on lap `lap`. `live` is the race worker's weatherNow for the step race (rubber,
 * water and track temperature as the engine has them now); without it, the race state's own timeline.
 * Returns { airC, trackC, waterMm, wetness, rubber } - a value the engine does not give is null.
 */
export const raceConditionsOf = (state, lap, live = null) => {
  const weather = state.weather || {};
  const wetness = finite(at(weather.wetness, lap)) ?? finite(live?.wetness) ?? 0;
  const trackC = finite(live?.trackTemp) ?? finite(at(state.trackTemps, lap)) ?? finite(state.trackTemp);
  const waterMm = finite(live?.waterMm) ?? finite(at(weather.water, lap)) ?? depthOfWetness(wetness);
  const rubber = finite(live?.rubber) ?? finite(state.evolution) ?? null;
  return { airC: finite(at(weather.air, lap)), trackC, waterMm, wetness, rubber };
};

/**
 * A session's conditions at session time `tau`: the local clock (null without a schedule), air and track
 * from the hour (engine/weather hourlyConditions), the wetness, and the rubber as the share of the era's
 * evolution the field has laid down (sessions.json evolution: carry + field laps × perFieldLap, up to max).
 */
export const sessionConditionsOf = (session, tau = session.clock) => {
  const conditions = session.schedule ? sessionConditions(session, tau) : null;
  const clock = session.schedule ? localClockOf(session, tau) : null;
  const evo = session.evolution || null;
  let rubber = null;
  if (evo && Number.isFinite(evo.max) && evo.max !== 0) {
    const gained = Math.max(evo.max, (session.carry || 0) + (session.fieldLaps || 0) * evo.perFieldLap);
    rubber = Math.max(0, Math.min(1, gained / evo.max));
  }
  return { clock: clock ? clock.label : null, airC: finite(conditions?.airC), trackC: finite(conditions?.trackC), wetness: session.wetness || 0, rubber };
};

const bandOf = (bands, value) => bands.find((band) => band.below === null || value < band.below) || bands[bands.length - 1];

const RUBBER_WORDS = {
  veryLow: () => t("Muy poca", "Very low"),
  low: () => t("Poca", "Low"),
  medium: () => t("Media", "Medium"),
  high: () => t("Mucha", "High"),
};
const GRIP_WORDS = {
  veryLow: () => t("Muy bajo", "Very low"),
  low: () => t("Bajo", "Low"),
  normal: () => t("Normal", "Normal"),
  high: () => t("Alto", "High"),
};

/** The rubber in words (race-weather.json display.rubberBands); "—" when the engine gives none. */
export const rubberLevel = (rubber, display = DISPLAY) => {
  if (!Number.isFinite(rubber)) return { id: null, label: "—" };
  const band = bandOf(display.rubberBands, rubber);
  return { id: band.id, label: RUBBER_WORDS[band.id]() };
};

/** The grip in words: by the wetness first (display.gripBands.wet), then by the rubber in the dry. */
export const gripLevel = (wetness, rubber, display = DISPLAY) => {
  const wet = display.gripBands.wet.find((band) => wetness > band.above);
  if (wet) return { id: wet.id, label: GRIP_WORDS[wet.id]() };
  const dry = Number.isFinite(rubber) ? display.gripBands.dry.find((band) => rubber > band.above) : null;
  const id = dry ? dry.id : display.gripBands.dryDefault;
  return { id, label: GRIP_WORDS[id]() };
};

/** Show the water on the line (mm) rather than the chance of rain from this wetness on. */
export const showsWater = (wetness, display = DISPLAY) => wetness > display.waterShownAbove;

/** The rain icon from this wetness on, the cloud from this chance of rain (%) on. */
export const skyOf = (wetness, rainChance, display = DISPLAY) => (wetness > display.sky.rainAbove ? "rain" : rainChance > display.sky.cloudAbovePct ? "cloud" : "sun");
