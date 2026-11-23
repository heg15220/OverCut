/**
 * RF-STF-02 / RF-STF-03: the twelve driver attributes and what they do in a race.
 *
 * A real driver's attributes come from his season pack (`ratings.drivers[].skills`, derived from
 * f1db by overcut/src/main/resources/scripts/driver_attributes.py, never written by hand). A
 * driver the pack does not know (an invented junior, the market pool of a season without a pack,
 * a save made before them) gets them from his six legacy attributes (`skillsFromLegacy`): the
 * same shape as his profile, centred on the scale's mean, so nobody is better at everything
 * because his pace rating is high.
 *
 *   cornering, braking   where on the lap the driver is quick (step mode: the lap's budget per
 *                        part of the lap; braking also wins late-braking duels)
 *   control              mistakes and solo accidents (RF-SIM-09)
 *   smoothness           tyre wear (RF-SIM-03)
 *   adaptability         the wet's extra mistakes, the race-day form
 *   overtaking           the attacker's chance in a duel (RF-SIM-07)
 *   defending            the defender's chance against it, and the defence style the AI picks
 *   starts               the launch (incidents.js turnOnePlan) and lap 1
 *   accuracy             lap-to-lap scatter, and per-corner noise in the step mode
 *   aggression           the attack gap, late braking, the squeeze (contact) risk, how long an
 *                        AI driver stays stuck behind before it looks after its tyres
 *   potential            the real career's ceiling (shown; pulls the talent ceiling)
 *   commercialValue      titles, wins, podiums, poles and starts (shown)
 *
 * Every number lives in data/balance/driver-attributes.json `effects` (RNF-07). Everything here
 * is pure and deterministic (RF-SIM-15, RNF-05).
 */

import BALANCE from "../../data/balance/driver-attributes.json";

export const DRIVER_BALANCE = BALANCE;
export const SKILL_KEYS = BALANCE.keys;
export const RACE_SKILL_KEYS = SKILL_KEYS.filter((key) => key !== "potential" && key !== "commercialValue");
const SCALE = BALANCE.derivation.scale;
const FX = BALANCE.effects;

const clamp = (value, lo, hi) => (value < lo ? lo : value > hi ? hi : value);
const round1 = (value) => Math.round(value * 10) / 10;
const within = (value, [lo, hi]) => clamp(value, lo, hi);

/** The scale's z of an attribute value (centre 0, one standard deviation of the era's drivers = 1). */
export const zOf = (value) => (Number.isFinite(value) ? (value - SCALE.centre) / SCALE.perSd : 0);

/** z of a car's (or driver's) attribute `key`; a car without skills is the era's mean driver. */
export const skillZ = (holder, key) => zOf(holder?.skills?.[key]);

/**
 * RF-STF-03 fallback: the twelve from the six legacy attributes (pace, qualifying, racecraft,
 * consistency, wet, technical) and the talent ceiling. Each skill is the scale's centre plus the
 * legacy attribute(s) it reads against the driver's own mean (`effects.legacy`).
 */
export const skillsFromLegacy = (attributes = {}, { talent = null, rating = null } = {}) => {
  const L = FX.legacy;
  const keys = ["pace", "qualifying", "racecraft", "consistency", "wet", "technical"];
  const values = keys.map((key) => (Number.isFinite(attributes[key]) ? attributes[key] : 60));
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const of = (key) => (Number.isFinite(attributes[key]) ? attributes[key] : mean);
  const out = {};
  Object.entries(L.from).forEach(([skill, sources]) => {
    const offset = Object.entries(sources).reduce((sum, [source, weight]) => sum + (of(source) - mean) * weight, 0);
    out[skill] = round1(clamp(SCALE.centre + offset * L.gain, SCALE.min, SCALE.max));
  });
  const level = Number.isFinite(rating) ? rating : mean;
  out.potential = round1(clamp(SCALE.centre + ((Number.isFinite(talent) ? talent : level) - level) * L.potentialPerPoint, SCALE.min, SCALE.max));
  out.commercialValue = round1(clamp(SCALE.centre + (level - L.commercialReference) * L.commercialPerPoint, SCALE.min, SCALE.max));
  return Object.fromEntries(SKILL_KEYS.map((key) => [key, out[key] ?? SCALE.centre]));
};

/** A complete, valid set of the twelve (from the pack when it has them). */
export const normaliseSkills = (skills, driver = {}) => {
  if (!skills || typeof skills !== "object") return skillsFromLegacy(driver.attributes, driver);
  const base = SKILL_KEYS.some((key) => !Number.isFinite(skills[key])) ? skillsFromLegacy(driver.attributes, driver) : null;
  return Object.fromEntries(SKILL_KEYS.map((key) => [key, Number.isFinite(skills[key]) ? clamp(skills[key], 0, 100) : base[key]]));
};

/** Give a driver his twelve if he has none (saves before RF-STF-02, invented drivers). */
export const ensureSkills = (driver) => {
  if (!driver) return driver;
  driver.skills = normaliseSkills(driver.skills, driver);
  return driver;
};

/** SRS 6.5: a driver's skills moved towards the ones history gives him next season (pull k). */
export const pullSkills = (driver, real, pull) => {
  if (!driver || !real?.skills) return driver;
  ensureSkills(driver);
  SKILL_KEYS.forEach((key) => {
    driver.skills[key] = round1(driver.skills[key] + (real.skills[key] - driver.skills[key]) * pull);
  });
  return driver;
};

/** The race skills an entrant carries into a race (everything but potential and commercial value). */
export const raceSkillsOf = (driver) => {
  const skills = normaliseSkills(driver?.skills, driver || {});
  return Object.fromEntries(RACE_SKILL_KEYS.map((key) => [key, skills[key]]));
};

// ------------------------------------------------------------------ race effects

/**
 * RF-SIM-07: the drivers' share of a pass chance, the same in both modes (race.js passChanceOf,
 * sim/duel.js duelChance): the attacker's overtaking and late braking against the defender's
 * defending and braking, the attacker's aggression, and the defence style and risk order.
 */
export const passSkillTerm = (attacker, defender) => {
  const p = FX.pass;
  return (
    skillZ(attacker, "overtaking") * p.overtaking -
    skillZ(defender, "defending") * p.defending +
    (skillZ(attacker, "braking") - skillZ(defender, "braking")) * p.braking +
    skillZ(attacker, "aggression") * p.aggression
  );
};

/** The switchback's share of the same (sim/duel.js trySwitchback). */
export const switchbackSkillTerm = (me, them) => skillZ(me, "overtaking") * FX.switchback.overtaking - skillZ(them, "defending") * FX.switchback.defending;

/** RF-SIM-09: the squeeze. A contact in a pass is likelier with an aggressive attacker or defender. */
export const contactFactorOf = (attacker, defender) => {
  const c = FX.contact;
  return within(1 + Math.max(0, skillZ(attacker, "aggression")) * c.aggression + Math.max(0, skillZ(defender, "aggression")) * c.defenderAggression - skillZ(defender, "defending") * c.defending, c.range);
};

/** RF-SIM-09: a mistake's chance factor from control, and in the wet also adaptability. */
export const mistakeFactorOf = (car, wetness = 0) => {
  const m = FX.mistake;
  const wet = wetness > m.wetFrom ? 1 - skillZ(car, "adaptability") * m.adaptabilityWet : 1;
  return within(m.base - skillZ(car, "control") * m.control, m.range) * wet;
};

/** RF-SIM-09: the solo-accident hazard factor from control (incidents.js raceHazards, turnOnePlan). */
export const controlRiskOf = (car, spec) => clamp(spec.controlBase - skillZ(car, "control") * spec.perControlZ, spec.control[0], spec.control[1]);

/** Lap-to-lap scatter factor from accuracy (race.js lapBudget volatility). */
export const volatilityFactorOf = (car) => within(FX.volatility.base - skillZ(car, "accuracy") * FX.volatility.accuracy, FX.volatility.range);

/** RF-SIM-03: tyre wear factor from smoothness. */
export const wearSkillOf = (car) => within(1 - skillZ(car, "smoothness") * FX.wear.smoothness, FX.wear.range);

/** Lap 1 (race.js startTerm): seconds gained by a good starter over the scrum. */
export const startSkillTime = (car) => FX.lapOne.base + skillZ(car, "starts") * FX.lapOne.starts;

/**
 * Race-day form: a driver's pace on Sunday is not his Saturday pace (tyres, set-up, the day). One
 * offset per car and race, s per lap as a share of the base lap, drawn on its own stream so both
 * modes run the same one (SRS 4.2); its size by era is calibrated on the real position changes
 * between grid and flag (driver-attributes.json measured.passes, scripts/measurePasses.js), a
 * more adaptable driver has a narrower one.
 */
export const formSigmaOf = (year) => {
  const row = FX.form.byEra.find((entry) => year >= entry.from && year <= entry.to) || FX.form.byEra[FX.form.byEra.length - 1];
  return row.sigma;
};
export const raceFormOf = (car, year, stream, circuitType = null) =>
  stream.normal(0, formSigmaOf(year) * (FX.form.byCircuitType[circuitType] ?? 1)) * within(1 - skillZ(car, "adaptability") * FX.form.adaptability, FX.form.range);

// ------------------------------------------------------------------ step mode

/** Aggression widens the gap a driver attacks from (sim/duel.js openDuel). */
export const triggerFactorOf = (car) => within(1 + skillZ(car, "aggression") * FX.step.trigger.aggression, FX.step.trigger.range);

/**
 * The defence style a driver picks when the pit wall has not set one (RF-CMD-01, SRS 2.3): an
 * aggressive good defender blocks, a cautious one holds the racing line, the rest hold the car
 * behind (effects.ai.defenceStyle).
 */
export const aiDefenceStyleOf = (car) => {
  const s = FX.ai.defenceStyle;
  const def = skillZ(car, "defending");
  const agg = skillZ(car, "aggression");
  if (def * s.block.defending + agg * s.block.aggression >= s.block.above) return "block";
  if (agg <= s.holdRacingLine.aggressionBelow) return "holdRacingLine";
  return "holdCarBehind";
};

/**
 * WP4 (SIM-FISICA §3.5): does the defender cover the inside before the braking zone? A block
 * always does; otherwise its chance grows with defending and aggression.
 */
export const coverChanceOf = (defender, style) => {
  const c = FX.step.cover;
  if (style === "block") return c.block;
  if (style === "holdRacingLine") return c.holdRacingLine;
  return within(c.base + skillZ(defender, "defending") * c.defending + skillZ(defender, "aggression") * c.aggression, c.range);
};

/** Metres the attacker brakes later than the defender (overlap at the turn-in, §3.3). */
export const lateBrakeMetresOf = (attacker, defender, riskBonus = 0) => {
  const l = FX.step.lateBrake;
  return Math.max(0, l.base + (skillZ(attacker, "braking") - skillZ(defender, "braking")) * l.braking + skillZ(attacker, "aggression") * l.aggression + riskBonus * l.risk);
};

/** Per-lap noise of each corner's time share (accuracy), zero mean over the lap (§3.6). */
export const cornerNoiseSigmaOf = (car) => FX.step.cornerNoise.sigma * within(1 - skillZ(car, "accuracy") * FX.step.cornerNoise.accuracy, FX.step.cornerNoise.range);

/** Where the driver is quick: time-density factors for braking zones and corners (mean 1 on the lap). */
export const profileFactorsOf = (car) => ({
  brake: 1 - skillZ(car, "braking") * FX.step.profile.braking,
  corner: 1 - skillZ(car, "cornering") * FX.step.profile.cornering,
});
