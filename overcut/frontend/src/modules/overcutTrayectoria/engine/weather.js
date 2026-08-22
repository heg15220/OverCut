/**
 * Weather, and what it does to a field.
 *
 * Rain is the single biggest source of upsets in Formula 1 and the game needs it
 * to behave like the real thing: not "random results", but a smaller gap between
 * the good car and the bad one, so that skill and luck can reach across it.
 *
 * That is what `gripFactorFor` is. Every entrant's pace gets pulled towards the
 * field mean by this factor before anything else happens, so:
 *
 *   dry    1.00  the hierarchy stands. The best car wins most days.
 *   mixed  0.60  a changeable race. The order is still there, but reachable.
 *   wet    0.40  a lottery with a memory - the great wet drivers still rise.
 *
 * The numbers are the calibration dial for how surprising the game feels; they
 * are checked in calibration.test.js against win-share targets per condition.
 */

import { clamp } from "./rng.js";

export const WEATHER = {
  DRY: "dry",
  MIXED: "mixed",
  WET: "wet",
};

const GRIP = {
  [WEATHER.DRY]: 1,
  [WEATHER.MIXED]: 0.6,
  [WEATHER.WET]: 0.4,
};

export const gripFactorFor = (weather) => GRIP[weather] ?? 1;

/**
 * Draw the weather for a race.
 *
 * The base probability is the venue's own record (Spa 0.38, Bahrain 0.02). Older
 * eras get a small bump: not because it rained more, but because races were run
 * in conditions a modern stewards' meeting would red-flag, so a wet 1957 Nurburgring
 * was raced where a wet 2017 one would have waited.
 */
export const drawWeather = ({ profile, era, stream }) => {
  const eraBump = era.year < 1990 ? 1.18 : 1;
  const chanceOfRain = clamp((profile.rain ?? 0.15) * eraBump, 0, 0.6);

  if (!stream.chance(chanceOfRain)) return WEATHER.DRY;
  // Once it rains, most races are changeable rather than fully wet - drying
  // lines, one shower, a late stop.
  return stream.chance(0.42) ? WEATHER.WET : WEATHER.MIXED;
};
