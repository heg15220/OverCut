/**
 * One Grand Prix.
 *
 * The player never watches a race - Trayectoria simulates whole seasons and shows
 * the numbers - but the numbers have to come from somewhere honest, so every round
 * of every season is actually run here, start to flag.
 *
 * The model, in order:
 *
 *   1. Weather      drawn from the venue's real record and the era.
 *   2. Pace         car and driver combined with the era's weight, then bent by
 *                   how the circuit suits the car and how far into the season we
 *                   are (development).
 *   3. Compression  rain and safety cars pull the field together. This is the
 *                   main reason upsets happen, and the main calibration dial.
 *   4. Qualifying   pace plus a one-lap skill term plus noise, sorted.
 *   5. Race         pace plus racecraft plus a grid-position term whose weight is
 *                   how hard the circuit is to overtake on, ordered by
 *                   Plackett-Luce (Gumbel noise on the score, then sort).
 *   6. Attrition    a per-entrant failure draw against the car's reliability and
 *                   the circuit's attrition, plus first-lap and wet incidents.
 *   7. Scoring      the era's points table and its fastest-lap rule.
 *
 * Plackett-Luce is the right family here: it is exactly "repeatedly pick the next
 * finisher in proportion to strength", which is what a race is, and adding one
 * Gumbel draw per entrant and sorting samples it in a single pass.
 */

import { clamp } from "./rng.js";
import { WEATHER, drawWeather, gripFactorFor } from "./weather.js";

/**
 * How hard it is to pass, expressed as how many pace points a grid slot is worth.
 * At Monaco track position is nearly everything; at Monza it is worth very little.
 */
const gridHoldFor = (profile, era) => (0.075 * (1 - profile.overtaking) + 0.008) * era.fieldSigma;

/**
 * Temperature of the Plackett-Luce draw: how much the ordering respects the
 * scores. Lower means the fastest car almost always wins.
 */
const PL_TEMPERATURE = 3.1;

/**
 * Mean and spread of a set of numbers, with a floor on the spread so a field
 * where every car is identical does not divide by zero.
 */
const momentsOf = (values) => {
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length);
  return { mean, sd: Math.max(Math.sqrt(variance), 0.75) };
};

/**
 * The field, measured before anyone races.
 *
 * Car and driver ratings are standardised separately, and this is not a detail -
 * it is what makes the era's car/driver weighting mean what it says. The two
 * ratings live on different scales: in 2024 the cars span about twenty points
 * while the drivers span fifty, because a driver rating is a whole career and a
 * car rating is one season. Mixing the raw numbers under a 73/27 weight quietly
 * hands the driver more influence than the car, and the fastest car stops
 * winning. Standardising first makes 73/27 a real share of the variance.
 */
export const fieldMomentsOf = (entrants) => ({
  car: momentsOf(entrants.map((entrant) => entrant.carRating)),
  driver: momentsOf(entrants.map((entrant) => entrant.driverRating)),
});

/**
 * Turn an entrant's ratings into the pace it will race with, before noise.
 *
 * Pace is centred on zero: everything downstream - the grid-position term, the
 * day's form, the wet edge - is measured in the same pace points, scaled by the
 * era's field sigma.
 *
 * `carFit` is the part people argue about in real life: the same car is a second
 * quicker at Monza than at Budapest relative to its rivals, because it was built
 * for straights. Each car carries a power/aero bias and the circuit asks for one
 * or the other.
 */
export const paceOf = ({ entrant, race, era, seasonProgress, weather, moments }) => {
  const profile = race.profile;

  const carZ = (entrant.carRating - moments.car.mean) / moments.car.sd;
  const driverZ = (entrant.driverRating - moments.driver.mean) / moments.driver.sd;

  const combined = era.carWeight * carZ + era.driverWeight * driverZ;
  const base = combined * era.fieldSigma;

  const fitAxis = profile.power * entrant.powerBias + profile.aero * entrant.aeroBias;
  const fitNeutral = (profile.power + profile.aero) * 0.5;
  const carFit = (fitAxis - fitNeutral) * era.fieldSigma * 0.5;

  // Development across the year: teams that get their season right pull away
  // from the ones that stop bringing parts.
  const development = entrant.developmentSlope * (seasonProgress - 0.5) * 2;

  const raw = base + carFit + development + wetSkillBonus(entrant, weather, era);

  // Conditions compress the hierarchy towards the middle of the field. This is
  // what makes a wet race at Spa a different sport from a dry one at Barcelona.
  return raw * gripFactorFor(weather);
};

/** Rain rewards feel, and feel is the one thing a slow car cannot buy. */
const wetSkillBonus = (entrant, weather, era) => {
  if (weather === WEATHER.DRY) return 0;
  const edge = ((entrant.wet ?? 50) - 50) / 20;
  return edge * era.fieldSigma * (weather === WEATHER.WET ? 0.42 : 0.24);
};

/**
 * Run the Grand Prix.
 *
 * `entrants` is the whole field: every driver with the car they are in and the
 * handful of skills that separate them. The player is just another entrant with
 * `isPlayer` set, which is deliberate - there is no protagonist maths anywhere in
 * this file, so a bad result is a real bad result.
 */
export const simulateRace = ({ race, era, entrants, seasonProgress, stream, strategyBias = {} }) => {
  const weather = drawWeather({ profile: race.profile, era, stream });
  const grip = gripFactorFor(weather);

  const moments = fieldMomentsOf(entrants);

  const withPace = entrants.map((entrant) => ({
    entrant,
    pace: paceOf({ entrant, race, era, seasonProgress, weather, moments }),
  }));

  const grid = runQualifying({ withPace, era, stream, weather });
  const gridPosition = {};
  grid.forEach((row, index) => {
    gridPosition[row.entrant.id] = index + 1;
  });

  const gridHold = gridHoldFor(race.profile, era);
  const fieldSize = entrants.length;

  const contenders = withPace.map(({ entrant, pace }) => {
    const start = gridPosition[entrant.id];

    // Track position, worth more where passing is hard. Expressed relative to
    // mid-grid so it neither inflates nor deflates the field as a whole.
    const trackPosition = (fieldSize / 2 - start) * gridHold;

    // A clean getaway is its own small skill, and it matters most on a track
    // where you will not get another chance.
    const launch =
      stream.normal(0, era.fieldSigma * 0.28) +
      (((entrant.racecraft ?? 50) - 50) / 20) * era.fieldSigma * 0.11;

    // Strategy: the one lever a season-level game still exposes, through the
    // preseason focus. Small on purpose - it should not out-weigh the car.
    const strategy = (strategyBias[entrant.id] ?? 0) * grip;

    // Consistency is the width of a driver's own distribution, not its centre.
    const ownVolatility = era.paceVolatility * (1 + (55 - (entrant.consistency ?? 50)) * 0.006);
    const dayForm = stream.normal(0, ownVolatility * 0.55);

    const score = pace + trackPosition + launch + strategy + dayForm;

    return { entrant, pace, start, score };
  });

  const { finishers, retirements } = drawAttrition({ contenders, race, weather, stream });

  const order = plackettLuceOrder(finishers, stream);

  const results = order.map((row, index) => ({
    entrantId: row.entrant.id,
    driver: row.entrant.driverName,
    team: row.entrant.teamName,
    teamId: row.entrant.teamId,
    isPlayer: Boolean(row.entrant.isPlayer),
    grid: row.start,
    position: index + 1,
    status: "finished",
    pace: row.pace,
  }));

  // Retirements are classified behind the finishers, worst-off last, which is how
  // a real classification reads.
  const retired = retirements
    .sort((a, b) => b.lapShare - a.lapShare)
    .map((row, index) => ({
      entrantId: row.entrant.id,
      driver: row.entrant.driverName,
      team: row.entrant.teamName,
      teamId: row.entrant.teamId,
      isPlayer: Boolean(row.entrant.isPlayer),
      grid: row.start,
      position: results.length + index + 1,
      status: row.reason,
      lapShare: row.lapShare,
      pace: row.pace,
    }));

  const classification = [...results, ...retired];
  const fastestLap = drawFastestLap({ results, contenders, stream });

  return {
    race,
    weather,
    grid: grid.map((row, index) => ({
      position: index + 1,
      entrantId: row.entrant.id,
      driver: row.entrant.driverName,
      team: row.entrant.teamName,
      isPlayer: Boolean(row.entrant.isPlayer),
    })),
    classification,
    finishers: results,
    retirements: retired,
    fastestLap,
    points: awardPoints({ classification, fastestLap, era }),
  };
};

// -------------------------------------------------------------------- sessions

const runQualifying = ({ withPace, era, stream, weather }) => {
  const grip = gripFactorFor(weather);
  return [...withPace]
    .map((row) => ({
      ...row,
      // One lap is a purer test of the car and of raw speed than the race is:
      // less noise, and a dedicated qualifying skill on top.
      qualiScore:
        row.pace +
        (((row.entrant.qualifying ?? 50) - 50) / 20) * era.fieldSigma * 0.32 +
        stream.normal(0, era.paceVolatility * 0.42 * (2 - grip)),
    }))
    .sort((a, b) => b.qualiScore - a.qualiScore);
};

/**
 * Sample a finishing order from the scores.
 *
 * Adding an independent Gumbel(0,1) draw to each score and sorting is exactly a
 * Plackett-Luce sample over exp(score/temperature) - the Gumbel-max trick applied
 * repeatedly. One pass, no renormalising, correct by construction.
 */
export const plackettLuceOrder = (contenders, stream) =>
  [...contenders]
    .map((row) => ({ ...row, utility: row.score / PL_TEMPERATURE + stream.gumbel() }))
    .sort((a, b) => b.utility - a.utility);

// ------------------------------------------------------------------- attrition

/**
 * The average circuit, in attrition terms.
 *
 * Circuit attrition is a multiplier, and multiplying every race by something
 * greater than one would quietly push the whole grid below the finish rate the
 * era model promises. Dividing by the average keeps the era's number honest -
 * it stays the realised share of cars that see the flag - while Monaco still
 * breaks more cars than Barcelona.
 */
const REFERENCE_ATTRITION = 1.15;

/**
 * Who does not see the flag.
 *
 * One draw decides whether a car retires at all, so the era's finish rate means
 * what it says; a second decides what it was. That split matters because the two
 * causes behave differently once you know which happened: a car breaks anywhere
 * on the lap chart, while an incident is far more likely on lap one, in the rain,
 * or to a driver who is not consistent.
 */
const drawAttrition = ({ contenders, race, weather, stream }) => {
  const finishers = [];
  const retirements = [];

  const attrition = race.profile.attrition / REFERENCE_ATTRITION;
  const wetFactor = weather === WEATHER.WET ? 1.28 : weather === WEATHER.MIXED ? 1.12 : 1;

  contenders.forEach((row) => {
    const consistency = row.entrant.consistency ?? 50;
    const risk = clamp((1 - row.entrant.reliability) * attrition * wetFactor, 0.01, 0.86);

    if (!stream.chance(risk)) {
      finishers.push(row);
      return;
    }

    // Given that it went wrong: how much of it was the driver? Rain and a
    // shaky driver both push the blame away from the engine.
    const incidentShare = clamp(
      0.24 * wetFactor * (1 + (55 - consistency) * 0.013),
      0.06,
      0.62,
    );

    if (!stream.chance(incidentShare)) {
      retirements.push({ ...row, reason: "mechanical", lapShare: stream.range(0.05, 0.95) });
      return;
    }

    // Incidents cluster at the start, where the field is still packed.
    const firstLap = stream.chance(0.34);
    retirements.push({
      ...row,
      reason: firstLap ? "collision" : "accident",
      lapShare: firstLap ? stream.range(0, 0.05) : stream.range(0.05, 0.95),
    });
  });

  // A race with nobody classified is possible in the model and absurd in life.
  if (finishers.length === 0 && retirements.length > 0) {
    const revived = retirements.sort((a, b) => b.score - a.score).shift();
    finishers.push(revived);
  }

  return { finishers, retirements };
};

// ----------------------------------------------------------------- fastest lap

/**
 * The fastest lap goes to a quick car with a reason to use it: usually one of the
 * leaders, sometimes someone out of position on fresh tyres. Weighting by pace
 * and softly by finishing position reproduces that mix.
 */
const drawFastestLap = ({ results, contenders, stream }) => {
  if (results.length === 0) return null;
  const paceById = {};
  contenders.forEach((row) => {
    paceById[row.entrant.id] = row.pace;
  });

  const best = Math.max(...results.map((row) => paceById[row.entrantId] ?? 0));
  const winner = stream.pickWeighted(results, (row) => {
    const paceEdge = Math.exp(((paceById[row.entrantId] ?? 0) - best) / 4.2);
    const positionEdge = 1 / (1 + row.position * 0.22);
    return paceEdge * positionEdge;
  });

  return winner
    ? {
        entrantId: winner.entrantId,
        driver: winner.driver,
        team: winner.team,
        isPlayer: Boolean(winner.isPlayer),
        position: winner.position,
      }
    : null;
};

// ---------------------------------------------------------------------- points

export const awardPoints = ({ classification, fastestLap, era }) => {
  const table = era.points;
  const awarded = {};

  classification.forEach((row) => {
    if (row.status !== "finished") return;
    const value = table[row.position - 1] ?? 0;
    if (value > 0) awarded[row.entrantId] = (awarded[row.entrantId] || 0) + value;
  });

  const rule = era.fastestLap;
  if (rule.point > 0 && fastestLap) {
    const eligible = !rule.requiresTopTen || fastestLap.position <= 10;
    if (eligible) {
      awarded[fastestLap.entrantId] = (awarded[fastestLap.entrantId] || 0) + rule.point;
    }
  }

  return awarded;
};
