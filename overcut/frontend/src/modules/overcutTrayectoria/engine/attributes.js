/**
 * What a driver is made of.
 *
 * The race engine only ever asks for a handful of numbers, and this is where they
 * come from - for the player, who has real attributes that grow and decay, and
 * for the hundreds of historical drivers, who only have a single rating in the
 * caches and need it spread plausibly across the same axes.
 *
 * The six attributes, and where each one is felt:
 *
 *   pace         raw speed. The bulk of the rating the race engine races with.
 *   qualifying   one lap on the limit. Only touches Saturday, but Saturday
 *                decides Sunday everywhere that is hard to overtake.
 *   racecraft    starts, wheel-to-wheel, reading a race.
 *   consistency  the width of your own distribution, and how often you bin it.
 *   wet          the one skill that reaches across a bad car.
 *   technical    feedback quality. Does not make you faster; makes your car
 *                develop faster, which over a season is worth more.
 */

import { clamp, lerp, substream } from "./rng.js";

export const ATTRIBUTE_KEYS = ["pace", "qualifying", "racecraft", "consistency", "wet", "technical"];

/**
 * Weights that collapse the six attributes into the single number the race
 * engine uses as `driverRating`. Pace dominates because it should: everything
 * else is a modifier on being quick.
 */
const RATING_WEIGHTS = {
  pace: 0.52,
  qualifying: 0.12,
  racecraft: 0.16,
  consistency: 0.12,
  wet: 0.05,
  technical: 0.03,
};

export const overallOf = (attributes) =>
  clamp(
    ATTRIBUTE_KEYS.reduce((sum, key) => sum + (attributes[key] ?? 50) * RATING_WEIGHTS[key], 0),
    30,
    99,
  );

/**
 * A starting driver. Talent is the one thing the player picks indirectly (through
 * difficulty) and never sees: it is the ceiling growth walks towards, so two
 * careers that start identically do not end identically.
 */
export const createDriverAttributes = ({ seed, talent = 78 }) => {
  const stream = substream(seed, "attributes");
  const spread = (centre) => clamp(stream.normal(centre, 5), 30, 92);

  return {
    pace: spread(58),
    qualifying: spread(56),
    racecraft: spread(55),
    consistency: spread(54),
    wet: spread(55),
    technical: spread(54),
    talent: clamp(talent, 55, 96),
  };
};

/**
 * Historical drivers get attributes derived from their one rating.
 *
 * Deterministic per name, so Jim Clark is the same Jim Clark in every career you
 * ever start, and spread around the rating rather than flat - a field where
 * everyone is equally good at everything races like a spreadsheet.
 */
export const deriveAttributes = ({ name, rating, age }) => {
  const stream = substream("historic", name);
  const around = (offset) => clamp(rating + offset + stream.normal(0, 4.5), 30, 99);

  // Young drivers are quick before they are complete; old ones are complete
  // after they stop being quick. Same shape as the real thing.
  const youth = clamp((28 - age) * 0.35, -3.5, 3.5);

  return {
    pace: around(youth),
    qualifying: around(youth * 0.6),
    racecraft: around(-youth * 0.8),
    consistency: around(-youth),
    wet: around(0),
    technical: around(-youth * 0.5),
  };
};

/**
 * The four things a driver can work on over a winter. Each is a real trade-off:
 * the time spent on one is time not spent on the others, so a career has a shape
 * rather than a plateau.
 */
export const PRESEASON_FOCUS = {
  QUALIFYING: "qualifying",
  RACECRAFT: "racecraft",
  CONSISTENCY: "consistency",
  TECHNICAL: "technical",
};

const FOCUS_GAINS = {
  [PRESEASON_FOCUS.QUALIFYING]: { qualifying: 3.1, pace: 1.2 },
  [PRESEASON_FOCUS.RACECRAFT]: { racecraft: 3.1, wet: 1.1 },
  [PRESEASON_FOCUS.CONSISTENCY]: { consistency: 3.2, pace: 0.6 },
  [PRESEASON_FOCUS.TECHNICAL]: { technical: 3.4, consistency: 0.8 },
};

/**
 * Growth over one season.
 *
 * Three forces, and they fight:
 *
 *   development  young drivers improve towards their talent ceiling, fast at 21
 *                and barely at all by 30.
 *   ageing       past 32 the decline starts and accelerates. It hits pace and
 *                qualifying first, and leaves racecraft and technical alone -
 *                which is exactly why old drivers become race-day drivers.
 *   experience   what the season itself taught, scaled by how much of it went
 *                well. A hard year in a bad car still teaches something.
 */
export const growAttributes = ({ attributes, age, focus, seasonScore, seed, year }) => {
  const stream = substream(seed, "growth", year);
  const next = { ...attributes };

  const ceiling = attributes.talent ?? 82;
  const developmentRate = clamp(lerp(1, 0, (age - 20) / 12), 0, 1);
  const ageDecline = age > 32 ? (age - 32) * 0.55 : 0;

  ATTRIBUTE_KEYS.forEach((key) => {
    const current = next[key] ?? 50;
    const headroom = Math.max(0, ceiling - current);

    const development = headroom * 0.16 * developmentRate;
    const focusGain = (FOCUS_GAINS[focus]?.[key] ?? 0) * clamp(developmentRate + 0.45, 0, 1.2);
    // `seasonScore` is 0..1: how well the year went relative to the car.
    const learned = (seasonScore - 0.45) * 2.2;

    // Age takes speed, not judgement.
    const decline = key === "pace" || key === "qualifying" ? ageDecline : ageDecline * 0.25;

    next[key] = clamp(current + development + focusGain + learned - decline + stream.normal(0, 0.8), 30, 99);
  });

  return next;
};

/**
 * The bundle the race engine wants for one entrant. Keeping the translation in
 * one place means the engine never has to know whether it is racing the player
 * or a name out of 1961.
 */
export const toEntrant = ({
  id,
  driverName,
  teamName,
  teamId,
  carRating,
  reliability,
  developmentSlope,
  powerBias,
  aeroBias,
  attributes,
  isPlayer = false,
}) => ({
  id,
  driverName,
  teamName,
  teamId,
  carRating,
  reliability,
  developmentSlope,
  powerBias,
  aeroBias,
  driverRating: overallOf(attributes),
  qualifying: attributes.qualifying,
  racecraft: attributes.racecraft,
  consistency: attributes.consistency,
  wet: attributes.wet,
  technical: attributes.technical,
  isPlayer,
});
