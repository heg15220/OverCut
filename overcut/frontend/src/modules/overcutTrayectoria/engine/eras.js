/**
 * What a given year of Formula 1 was actually like.
 *
 * The simulation runs seasons from 1950 to whatever the caches reach, and those
 * seasons are not the same sport. In 1952 half the field did not see the flag and
 * only your best four results counted; in 2021 nearly everyone finished and every
 * point was kept. Every one of those differences lives here, as a function of the
 * year, so the race and season engines can stay era-agnostic.
 *
 * Sources are the real regulations. Where a rule was fiddly (the "best N results"
 * schemes of the 50s to the 80s changed almost yearly, sometimes splitting the
 * season in halves) it is modelled by its effect rather than its letter - the
 * fraction of rounds that counted - and that is flagged in the comment.
 */

import { clamp, lerp } from "./rng.js";

/**
 * Championship points per finishing position, by era.
 *
 * Each entry is the first year the table applied; the table runs until the next
 * entry starts.
 */
const POINTS_TABLES = [
  { from: 1950, points: [8, 6, 4, 3, 2] },
  { from: 1960, points: [8, 6, 4, 3, 2, 1] },
  { from: 1961, points: [9, 6, 4, 3, 2, 1] },
  { from: 1991, points: [10, 6, 4, 3, 2, 1] },
  { from: 2003, points: [10, 8, 6, 5, 4, 3, 2, 1] },
  { from: 2010, points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
];

export const pointsTableFor = (year) => {
  let table = POINTS_TABLES[0].points;
  POINTS_TABLES.forEach((entry) => {
    if (year >= entry.from) table = entry.points;
  });
  return table;
};

/**
 * The fastest lap was worth a championship point in two separate eras, and they
 * worked differently: from 1950 to 1959 it went to whoever set it, shared between
 * drivers if they tied; from 2019 to 2024 only if that driver finished in the top
 * ten. It was worth nothing in between, and nothing again from 2025.
 */
export const fastestLapRuleFor = (year) => {
  if (year >= 1950 && year <= 1959) return { point: 1, requiresTopTen: false };
  if (year >= 2019 && year <= 2024) return { point: 1, requiresTopTen: true };
  return { point: 0, requiresTopTen: false };
};

/**
 * How many rounds counted towards the title.
 *
 * The real schemes were baroque - best 4 of 7, best 5 of 8, split half-seasons -
 * and changed nearly every year until they were dropped for good in 1991. What
 * mattered to a driver was the same in all of them: a proportion of your worst
 * results was thrown away. That is what this models.
 */
export const countingRoundsFor = (year, raceCount) => {
  if (year >= 1991) return raceCount;
  if (year >= 1981) return Math.min(raceCount, 11);
  if (year >= 1967) return Math.max(1, Math.round(raceCount * 0.8));
  return Math.max(1, Math.round(raceCount * 0.72));
};

/**
 * Share of starters that reached the flag, by decade, from the real record.
 *
 * This is the single most era-defining number in the game. A 1950s season is
 * chaotic not because the drivers were worse but because the cars broke, and a
 * career that starts in 1954 has to feel that.
 */
const FINISH_RATES = [
  { year: 1950, rate: 0.45 },
  { year: 1960, rate: 0.5 },
  { year: 1970, rate: 0.54 },
  { year: 1980, rate: 0.55 },
  { year: 1990, rate: 0.64 },
  { year: 2000, rate: 0.78 },
  { year: 2010, rate: 0.86 },
  { year: 2020, rate: 0.9 },
  { year: 2030, rate: 0.91 },
];

export const finishRateFor = (year) => {
  const first = FINISH_RATES[0];
  const last = FINISH_RATES[FINISH_RATES.length - 1];
  if (year <= first.year) return first.rate;
  if (year >= last.year) return last.rate;
  for (let index = 0; index < FINISH_RATES.length - 1; index += 1) {
    const lower = FINISH_RATES[index];
    const upper = FINISH_RATES[index + 1];
    if (year >= lower.year && year <= upper.year) {
      return lerp(lower.rate, upper.rate, (year - lower.year) / (upper.year - lower.year));
    }
  }
  return last.rate;
};

/**
 * How much of the result the car decides, against the driver.
 *
 * Formula 1 has always been a car championship, but the balance moved: early
 * fields mixed works entries with privateers and gentleman drivers, so raw skill
 * separated people more; a modern grid is twenty professionals and the machinery
 * does almost all the talking.
 */
export const carWeightFor = (year) => clamp(lerp(0.58, 0.73, (year - 1950) / 75), 0.55, 0.75);

/**
 * Spread of "performance on the day" in pace points. Wider in the early years,
 * where a single mistake or a loose road surface cost far more than it does now.
 */
export const paceVolatilityFor = (year) => clamp(lerp(7.2, 4.4, (year - 1950) / 75), 4.2, 7.5);

/**
 * How far apart the grid is, as a standard deviation in pace points.
 *
 * The race engine works in z-scores - it standardises car and driver ratings
 * against the field before combining them - and this is the number that turns
 * those back into pace. It has to shrink over time for the same reason the car
 * spread does: a 1954 grid ran from works Mercedes to privateers minutes off,
 * a modern one fits inside a couple of seconds.
 *
 * It is also what sets the scale for everything else in the race: the day-to-day
 * noise, the value of a grid slot, the size of a wet-weather edge. Change it and
 * you change how surprising the game feels; calibration.test.js measures that.
 */
export const fieldSigmaFor = (year) => clamp(lerp(11, 5.6, (year - 1950) / 75), 5.2, 11.5);

/**
 * Rules and technology that the narration and the strategy model can key off.
 * Kept as plain booleans so callers read as prose.
 */
export const eraFeaturesFor = (year) => ({
  year,
  safetyCar: year >= 1993,
  virtualSafetyCar: year >= 2015,
  drs: year >= 2011,
  refuelling: year >= 1994 && year <= 2009,
  knockoutQualifying: year >= 2006,
  singleLapQualifying: year >= 2003 && year <= 2005,
  hybrid: year >= 2014,
  turbo: (year >= 1977 && year <= 1988) || year >= 2014,
  groundEffect: (year >= 1978 && year <= 1982) || year >= 2022,
  slicks: (year >= 1971 && year <= 1997) || year >= 2009,
  grooved: year >= 1998 && year <= 2008,
  tyreWar: (year >= 1950 && year <= 1986) || (year >= 1997 && year <= 2006),
  mandatoryPitStop: year >= 1994,
  halo: year >= 2018,
  sprintWeekends: year >= 2021,
});

/** Human label for the period, used in headlines and the retirement verdict. */
export const eraNameFor = (year) => {
  if (year < 1958) return "pioneer";
  if (year < 1968) return "garagiste";
  if (year < 1978) return "cosworth";
  if (year < 1989) return "turbo";
  if (year < 1995) return "electronic";
  if (year < 2006) return "refuelling";
  if (year < 2014) return "v8";
  if (year < 2022) return "hybrid";
  return "ground-effect";
};

/**
 * Everything the engines need about a season's rules in one object, so a race or
 * a season only ever asks for its era once.
 */
export const eraProfileFor = (year) => ({
  year,
  name: eraNameFor(year),
  points: pointsTableFor(year),
  fastestLap: fastestLapRuleFor(year),
  finishRate: finishRateFor(year),
  carWeight: carWeightFor(year),
  driverWeight: 1 - carWeightFor(year),
  paceVolatility: paceVolatilityFor(year),
  fieldSigma: fieldSigmaFor(year),
  features: eraFeaturesFor(year),
});
