/**
 * The car, and how it gets faster.
 *
 * Trayectoria gives every team one number for a season. A team principal needs
 * to know where that number comes from, so the car is split into the three
 * places speed lives and one place it dies:
 *
 *   aero         downforce. Wins Hungary, Monaco, Barcelona.
 *   power        the engine and how the car carries speed down a straight.
 *   chassis      mechanical grip, kerbs, ride, tyre treatment.
 *   reliability  how often it reaches the flag, mapped onto the era's finish rate.
 *
 * The first three blend back into the single `carRating` the race engine has
 * always used; their balance becomes the power/aero bias that makes a car love
 * Monza and hate Budapest.
 *
 * Development is projects: pick an area, a size and a season - this car or next
 * year's - pay, wait some rounds, and find out. Projects can fail, gains shrink
 * as an area pulls clear of the field, and from 2021 the cost cap limits how much
 * of it there can be. Rival teams develop too, on their own budget, all season.
 */

import { clamp, substream } from "../../overcutTrayectoria/engine/rng";
import { moneyScale, roundMoney } from "./economy";

export const AREAS = ["aero", "power", "chassis", "reliability"];
export const PACE_AREAS = ["aero", "power", "chassis"];

const WEIGHTS = { aero: 0.38, power: 0.32, chassis: 0.3 };

export const carRatingOf = (car) =>
  clamp(PACE_AREAS.reduce((sum, area) => sum + (car[area] ?? 60) * WEIGHTS[area], 0), 25, 100);

/** Reliability rating -> probability of reaching the flag, around the era's norm. */
export const reliabilityOf = (car, era) => clamp(era.finishRate + ((car.reliability ?? 60) - 60) * 0.0045, 0.28, 0.985);

/** The inverse, used once when a historical team's car is first described. */
export const reliabilityRatingFor = (probability, era) => clamp(60 + (probability - era.finishRate) / 0.0045, 5, 99);

export const biasesOf = (car) => {
  const powerBias = clamp(0.55 + ((car.power ?? 60) - (car.aero ?? 60)) * 0.045, 0.15, 0.95);
  return { powerBias, aeroBias: clamp(1.1 - powerBias, 0.15, 0.95) };
};

/**
 * A car described from a single historical rating: areas spread around it with
 * a per-team character that is stable for that team and year.
 */
export const carFromRating = ({ carRating, reliability, era, teamName, year }) => {
  const stream = substream("car-areas", teamName, year);
  const offsets = PACE_AREAS.map(() => stream.normal(0, 2.6));
  const mean = offsets.reduce((sum, value) => sum + value, 0) / offsets.length;
  const car = {};
  PACE_AREAS.forEach((area, index) => {
    car[area] = clamp(carRating + offsets[index] - mean, 20, 100);
  });
  // Re-centre so the blend lands exactly on the historical rating.
  const drift = carRating - carRatingOf(car);
  PACE_AREAS.forEach((area) => {
    car[area] = clamp(car[area] + drift, 20, 100);
  });
  car.reliability = reliabilityRatingFor(reliability, era);
  return roundCar(car);
};

export const roundCar = (car) => {
  const next = {};
  AREAS.forEach((area) => {
    next[area] = Math.round((car[area] ?? 60) * 10) / 10;
  });
  return next;
};

// ------------------------------------------------------------- projects

/**
 * Project sizes. `gain` is rating points in the area for an average technical
 * director; reliability points are cheaper because each one is worth less pace.
 * Prices are 2024 dollars.
 */
export const PROJECT_SIZES = {
  small: { rounds: 1, gain: 0.8, cost: 2.5e6, risk: 0.08 },
  medium: { rounds: 2, gain: 1.8, cost: 6e6, risk: 0.12 },
  major: { rounds: 4, gain: 4.0, cost: 14e6, risk: 0.18 },
};

const AREA_GAIN = { aero: 1, power: 0.9, chassis: 1, reliability: 2.6 };
const AREA_COST = { aero: 1.1, power: 1.15, chassis: 0.9, reliability: 0.7 };

/** Parallel projects the factory can run, by facility level 1..5. */
export const slotsFor = (facility = 2) => clamp(1 + Math.round(facility), 2, 6);

export const projectCost = (area, size, year) => roundMoney(PROJECT_SIZES[size].cost * AREA_COST[area] * moneyScale(year));

/**
 * What a project would deliver, before luck. The technical director scales it,
 * the factory adds a little, and an area that is already far ahead of the field
 * returns less: the last tenth always costs the most.
 */
export const expectedGain = ({ area, size, target, technical = 60, facility = 2, current = 60, fieldBest = 60, seasonGain = 0, regulationChange = false }) => {
  const base = PROJECT_SIZES[size].gain * AREA_GAIN[area];
  const staff = 0.7 + technical / 170;
  const factory = 0.92 + facility * 0.04;
  const lead = area === "reliability" ? 0 : Math.max(0, current - fieldBest);
  const ceiling = clamp(1 - lead / 6, 0.15, 1);
  // Each point found this season makes the next one harder: a full season of
  // flat-out development is worth a handful of points, not a new car.
  const saturation = 1 / (1 + Math.max(0, seasonGain) / (area === "reliability" ? 9 : 3));
  const nextYear = target === "next" ? (regulationChange ? 1.5 : 1.25) : 1;
  return base * staff * factory * ceiling * saturation * nextYear;
};

export const failureChance = (size, technical = 60) => clamp(PROJECT_SIZES[size].risk * (1.45 - technical / 100), 0.02, 0.4);

/**
 * Advance every project one round. Returns the projects that finished, with
 * their outcome, so the inbox can report them.
 */
export const progressProjects = ({ projects, stream }) => {
  const finished = [];
  const active = [];
  projects.forEach((project) => {
    const next = { ...project, roundsLeft: project.roundsLeft - 1 };
    if (next.roundsLeft > 0) {
      active.push(next);
      return;
    }
    const failed = stream.chance(project.failure);
    const luck = clamp(stream.normal(1, 0.22), 0.45, 1.6);
    const gain = failed ? (stream.chance(0.5) ? -0.4 : 0.15) * project.expected : project.expected * luck;
    finished.push({ ...next, gain: Math.round(gain * 100) / 100, failed });
  });
  return { active, finished };
};

// ---------------------------------------------------------- rival teams

/**
 * How much a rival develops across a whole season, in car-rating points.
 *
 * Every team develops, so the field's average drifts up by about two points a
 * year and only relative speed matters. Around that, money (prestige) and the
 * team's own season-long trend from Trayectoria decide who gains and who fades.
 */
export const aiSeasonDevelopment = (team) => 2 + 1.1 * ((team.devSlope ?? 0) / 2.4) + 2.2 * ((team.prestige ?? 0.4) - 0.45);

export const aiDevelopmentStep = ({ team, raceCount, stream }) => {
  const perRace = aiSeasonDevelopment(team) / Math.max(1, raceCount);
  const car = { ...team.car };
  PACE_AREAS.forEach((area) => {
    car[area] = clamp(car[area] + perRace * stream.range(0.4, 1.6), 20, 100);
  });
  car.reliability = clamp(car.reliability + stream.normal(0.35, 0.5), 5, 99);
  return roundCar(car);
};

// ------------------------------------------------------------ next year

/**
 * Seasons when the rules were rewritten hard enough to reshuffle the order:
 * the 1.5-litre formula, the 3-litre, flat bottoms, the turbo ban, the grooved
 * tyres, the 2009 aero reset, hybrids, wider cars, ground effect, 2026.
 */
export const REGULATION_RESETS = [1961, 1966, 1983, 1989, 1995, 1998, 2009, 2014, 2017, 2022, 2026];

export const isRegulationReset = (year) => REGULATION_RESETS.includes(year) || (year > 2026 && (year - 2026) % 5 === 0);

/**
 * Build next year's car out of this year's. Part of the advantage carries over
 * (much less across a rule change), the work done on next year's car during the
 * season lands, and a design always comes out a little better or worse than
 * planned.
 */
export const nextYearCar = ({ car, fieldMean, nextGains = {}, year, stream }) => {
  const reset = isRegulationReset(year);
  const carry = reset ? 0.38 : 0.72;
  const noise = reset ? 3.4 : 1.3;
  const next = {};
  PACE_AREAS.forEach((area) => {
    const edge = car[area] - fieldMean[area];
    next[area] = clamp(fieldMean[area] + edge * carry + (nextGains[area] || 0) + stream.normal(0, noise), 20, 100);
  });
  const reliabilityEdge = car.reliability - fieldMean.reliability;
  next.reliability = clamp(fieldMean.reliability + reliabilityEdge * (reset ? 0.3 : 0.6) + (nextGains.reliability || 0) - (reset ? 4 : 0) + stream.normal(0, 2.5), 5, 99);
  return roundCar(next);
};

export const fieldMeanOf = (teams) => {
  const mean = {};
  AREAS.forEach((area) => {
    mean[area] = teams.reduce((sum, team) => sum + (team.car[area] ?? 60), 0) / Math.max(1, teams.length);
  });
  return mean;
};

export const fieldBestOf = (teams) => {
  const best = {};
  AREAS.forEach((area) => {
    best[area] = Math.max(...teams.map((team) => team.car[area] ?? 0));
  });
  return best;
};
