/**
 * HUD-7 of docs/manager/F1M24-GAMEPLAY.md (tacticas and danos-visibles, the UI part; §2.8, §2.10, §1.7
 * `damage[i]`; RF-CMD-01, RF-CMD-02, RF-SIM-05, RF-SIM-09, RF-DEV-08, RNF-05, RNF-07, RNF-09). Pure, no React.
 *
 *   engineSupports(commandsTable)   which orders the engine behind the view takes, by name: the race worker's
 *                                   COMMANDS for a step race, race.js's exports for a quick one. An order the
 *                                   engine does not take is never offered (the worker throws on one).
 *   tacticsFor({commands, supports, energyModes, defenceKeys, riskKeys})
 *                                   the tactics tab of one era: defence styles and overtaking risk (when the
 *                                   engine has setDefence / setOvertakeRisk - both modes once SIM-7 is in), and
 *                                   the on/off tactics (avoid kerbs, clean air, battle assist) when the engine
 *                                   has setTactics and the era's commandsFor allows them; battle assist only
 *                                   in an era with KERS or ERS (SRS §6).
 *   tacticValue(car, key), tacticsPatch(car, toggles, key, value)
 *                                   the car's tactic as the engine has it, and the whole set to send with one
 *                                   changed (§2.8 setTactics(state, carId, {avoidKerbs, cleanAir, battleAssist})).
 *   mirrorDamage(mirror, view)      a worker tick's `snapshot[i].damage` (or `view.damage[i]`) into the
 *                                   mirror's cars as car.damageLive (view data only, RNF-05).
 *   damageOf(car)                   the car's damage now: §1.7 {frontWing, floor, puncture, lossSecPerLap}
 *                                   from SIM-7 when it is there; before that the engine's own front-wing
 *                                   loss (car.damage, s a lap) and puncture (car.puncture). Null = none.
 *   damageVerdict(damage, opts)     tone and what to do: change the wing at the next stop (from the engine's
 *                                   own repair threshold, race-reliability.json contact.repairAbove, so the
 *                                   advice matches what the rival strategists do) or box for the puncture.
 *
 * Every presentation value is in data/balance/hud.json driverPanel.tactics / driverPanel.damage (RNF-07).
 * Nothing here is sent to the engine except through `command` (RNF-05).
 */

import HUD from "../data/balance/hud.json";
import RELIABILITY from "../data/balance/race-reliability.json";
import { t } from "./texts";

export const TACTICS = HUD.driverPanel.tactics;
export const DAMAGE = HUD.driverPanel.damage;

const finite = (value) => typeof value === "number" && Number.isFinite(value);

// ------------------------------------------------------------------ tactics

/**
 * `supports(name)` for a table of orders by name (the worker's COMMANDS, or a module namespace). Read by a
 * variable key so a missing export is not a build error before SIM-7 adds it.
 */
export const engineSupports = (table) => (name) => Boolean(table) && typeof table[name] === "function";

/** Does the era's commandsFor allow this on/off tactic? Absent `commands.tactics` = the engine's word. */
const eraAllows = (commands, key) => {
  const table = commands && commands.tactics;
  if (table === undefined || table === null) return true;
  if (Array.isArray(table)) return table.includes(key);
  if (typeof table === "object") {
    const value = table[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }
  return false;
};

/** The levels of a picked tactic: the era's list when commandsFor gives one, else the engine's keys. */
const levelsOf = (commands, key, fallback) => {
  const table = commands && commands.tactics;
  const own = table && !Array.isArray(table) && Array.isArray(table[key]) ? table[key] : null;
  return own || fallback || [];
};

export const tacticsFor = ({ commands, supports, energyModes = [], defenceKeys = [], riskKeys = [] }) => {
  const has = typeof supports === "function" ? supports : () => false;
  const energy = energyModes.length > 0;
  const toggles = has("setTactics")
    ? TACTICS.toggles.filter((key) => eraAllows(commands, key) && (TACTICS.requires[key] !== "energy" || energy))
    : [];
  return {
    defence: has("setDefence") ? levelsOf(commands, "defence", defenceKeys) : [],
    overtakeRisk: has("setOvertakeRisk") ? levelsOf(commands, "overtakeRisk", riskKeys) : [],
    toggles,
  };
};

/** The car's tactic as the engine has it (car.tactics, SIM-7); off until the engine says otherwise. */
export const tacticValue = (car, key) => Boolean(car && car.tactics && car.tactics[key]);

/** The full set of the era's tactics with one changed, as setTactics takes it. */
export const tacticsPatch = (car, toggles, key, value) => {
  const patch = Object.fromEntries(toggles.map((name) => [name, tacticValue(car, name)]));
  patch[key] = Boolean(value);
  return patch;
};

// ------------------------------------------------------------------ damage

/** The damage of a worker tick into the mirror's cars (by id, else by index). Absent = left as it is. */
export const mirrorDamage = (mirror, view) => {
  if (!mirror || !view || !Array.isArray(mirror.cars)) return mirror;
  const byId = new Map(mirror.cars.map((car) => [car.id, car]));
  const put = (entry, index, value) => {
    if (value === undefined) return;
    const car = (entry && entry.id !== undefined && byId.get(entry.id)) || mirror.cars[index];
    if (car) car.damageLive = value && typeof value === "object" ? value : null;
  };
  const shots = Array.isArray(view.snapshot) ? view.snapshot : null;
  if (shots) shots.forEach((entry, index) => entry && put(entry, index, entry.damage));
  if (Array.isArray(view.damage)) view.damage.forEach((value, index) => put(shots ? shots[index] : null, index, value));
  return mirror;
};

const STATE_ALIAS = DAMAGE.stateAlias;
const normalState = (value) => {
  if (typeof value !== "string") return null;
  const key = STATE_ALIAS[value] || value;
  return DAMAGE.states.includes(key) ? key : null;
};

/** One part of the §1.7 shape: s a lap (number), a state (string), on/off, or {lossSecPerLap, state}. */
const partOf = (value) => {
  if (value === undefined || value === null || value === false) return null;
  let lossSec = null;
  let state = null;
  if (finite(value)) lossSec = value;
  else if (typeof value === "string") state = normalState(value);
  else if (value === true) state = DAMAGE.states[1];
  else if (typeof value === "object") {
    const loss = [value.lossSecPerLap, value.lossSec, value.loss].find(finite);
    lossSec = loss === undefined ? null : loss;
    state = normalState(value.state ?? value.level ?? null);
  }
  const damaged = (lossSec !== null && lossSec >= DAMAGE.minShownSec) || (state !== null && state !== DAMAGE.states[0]);
  return damaged ? { lossSec, state } : null;
};

const punctureOf = (value) => {
  if (!value || value === "none") return null;
  return typeof value === "string" ? { wheel: value } : { wheel: null };
};

/**
 * The car's damage now, or null. With SIM-7's `damage` (car.damageLive from the worker, or an object in
 * car.damage) every part it names; before it, the front-wing loss (car.damage, s a lap) and car.puncture.
 */
export const damageOf = (car) => {
  if (!car) return null;
  const raw = car.damageLive && typeof car.damageLive === "object" ? car.damageLive : car.damage && typeof car.damage === "object" ? car.damage : null;
  const parts = {};
  let puncture = null;
  let total = null;
  if (raw) {
    DAMAGE.parts.forEach((part) => {
      const value = partOf(raw[part]);
      if (value) parts[part] = value;
    });
    puncture = punctureOf(raw.puncture);
    if (finite(raw.lossSecPerLap)) total = raw.lossSecPerLap;
  } else {
    const wing = partOf(finite(car.damage) ? car.damage : null);
    if (wing) parts.frontWing = wing;
    puncture = punctureOf(car.puncture);
  }
  if (total === null) {
    const losses = Object.values(parts).map((part) => part.lossSec).filter(finite);
    total = losses.length ? losses.reduce((sum, value) => sum + value, 0) : null;
  }
  if (!Object.keys(parts).length && !puncture) return null;
  return { parts, puncture, lossSecPerLap: total };
};

/** The engine's own threshold for changing a front wing (race-reliability.json contact.repairAbove, s a lap). */
export const REPAIR_ABOVE = RELIABILITY.contact.repairAbove;

/**
 * Tone and advice: "bad" for a puncture or damage worth a stop, "warn" for the rest. `advice` is "puncture"
 * (box now), "wing" (change the nose at the next stop: the era's stop can change it) or null.
 */
export const damageVerdict = (damage, { canChangeWing = true, pitCalled = false } = {}) => {
  if (!damage) return null;
  const wing = damage.parts.frontWing;
  const severe = (part) => Boolean(part && part.state && DAMAGE.severeStates.includes(part.state));
  const wingWorthIt = Boolean(wing) && ((finite(wing.lossSec) && wing.lossSec >= REPAIR_ABOVE) || severe(wing));
  const anySevere = Object.values(damage.parts).some(severe);
  const costly = finite(damage.lossSecPerLap) && damage.lossSecPerLap >= REPAIR_ABOVE;
  const advice = damage.puncture ? "puncture" : wingWorthIt && canChangeWing ? "wing" : null;
  return {
    tone: damage.puncture || wingWorthIt || anySevere || costly ? "bad" : "warn",
    advice,
    // A stop already called changes a damaged nose unless told not to (race.js requestPit).
    handled: Boolean(advice) && pitCalled,
  };
};

// ------------------------------------------------------------------ words (ES and EN, RNF-08)

/** The on/off tactics (RF-CMD-01). */
export const TACTIC_LABEL = {
  avoidKerbs: () => t("Evitar pianos", "Avoid kerbs"),
  cleanAir: () => t("Buscar aire limpio", "Find clean air"),
  battleAssist: () => t("Energía en la lucha", "Battle energy assist"),
};

export const TACTIC_HINT = {
  avoidKerbs: () => t("Pierde algo en curva, menos errores y menos golpes al fondo", "A little slower in the corners, fewer errors and floor knocks"),
  cleanAir: () => t("Se aparta de la estela del de delante", "Drops out of the car ahead's wake"),
  battleAssist: () => t("Despliega energía extra a menos de un segundo", "Deploys extra energy within a second"),
};

export const DAMAGE_PART = {
  frontWing: () => t("Alerón delantero", "Front wing"),
  floor: () => t("Fondo", "Floor"),
};

export const DAMAGE_STATE = {
  perfect: () => t("Perfecto", "Perfect"),
  light: () => t("Leve", "Light"),
  heavy: () => t("Grave", "Heavy"),
  destroyed: () => t("Destruido", "Destroyed"),
};

const WHEEL = {
  fl: () => t("delantera izquierda", "front left"),
  fr: () => t("delantera derecha", "front right"),
  rl: () => t("trasera izquierda", "rear left"),
  rr: () => t("trasera derecha", "rear right"),
};

/** Seconds a lap, signed, in the panel's words. */
export const lossText = (seconds) => (finite(seconds) ? `+${seconds.toFixed(1)} ${t("s/v", "s/lap")}` : "");

/** One line per damaged part, then the puncture: words always, the loss when the engine gives it. */
export const damageLines = (damage) => {
  if (!damage) return [];
  const lines = DAMAGE.parts
    .filter((part) => damage.parts[part])
    .map((part) => {
      const { lossSec, state } = damage.parts[part];
      const bits = [DAMAGE_PART[part](), state && DAMAGE_STATE[state] ? DAMAGE_STATE[state]().toLowerCase() : null, lossText(lossSec) || null];
      return { key: part, text: bits.filter(Boolean).join(" · ") };
    });
  if (damage.puncture) {
    const wheel = damage.puncture.wheel && WHEEL[damage.puncture.wheel] ? ` ${WHEEL[damage.puncture.wheel]()}` : "";
    lines.push({ key: "puncture", text: t(`Pinchazo${wheel}`, `Puncture${wheel}`) });
  }
  return lines;
};

/** What the pit wall should do about it. */
export const adviceText = (verdict) => {
  if (!verdict || !verdict.advice) return null;
  if (verdict.handled) return verdict.advice === "puncture" ? t("Parada pedida: neumáticos nuevos", "Stop called: new tyres") : t("Parada pedida: se cambia el alerón", "Stop called: the nose is changed");
  return verdict.advice === "puncture" ? t("Box ya: pinchazo", "Box now: puncture") : t("Cambiar el alerón en la parada", "Change the nose at the stop");
};
