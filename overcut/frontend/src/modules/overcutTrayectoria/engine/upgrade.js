/**
 * The winter upgrade.
 *
 * Every other preseason choice makes the driver better. This one makes the car
 * better, which is the only kind of improvement that actually moves you up a
 * grid - and it is the reason technical work is a gamble rather than a slower
 * version of the other three.
 *
 * A team does not hand a driver a development programme for turning up. They do
 * it when last year said it was worth doing: the objective was met, the driver
 * beat the car's other occupant, the team finished above what its machinery was
 * worth. That is what the odds are made of, and it is why the answer to "should
 * I spend the winter in the factory" depends on the season that just ended.
 */

import { clamp } from "./rng.js";
import { PRESEASON_FOCUS } from "./attributes.js";

/**
 * How much a granted upgrade is worth, as a share of the car's rating.
 *
 * Three per cent is about 2.7 points on a front-running car, which is the same
 * order as the gap that separated Ferrari and McLaren across the whole of 2008.
 * Enough to change where you start the year from; not enough to invent a car
 * the era never had.
 */
export const UPGRADE_GAIN = 0.03;

const MIN_CHANCE = 0.05;
const MAX_CHANCE = 0.75;

/**
 * Whether the team is even in a position to promise anything.
 *
 * Two gates, both about having a year behind you: a debutant has no season to be
 * judged on, and a driver who just signed spent last year making somebody else's
 * car better.
 */
export const canEarnUpgrade = (career) =>
  Boolean(career?.contract) && career.history.length > 0 && career.yearsAtTeam > 1;

/** Where the team finished against where its car said it should. */
const overachievementOf = (career) => {
  const carRank = career.lastSeason?.player?.carRank ?? 0;
  const standing = (career.lastSeason?.constructorStandings || []).find(
    (row) => row.teamId === career.contract.teamId,
  );
  if (!carRank || !standing?.position) return 0;
  return carRank - standing.position;
};

/**
 * The odds the factory comes good, before the winter is spent.
 *
 * Shown on the preseason screen rather than hidden, for the same reason the
 * negotiation shows its odds: choosing between four winters is a decision only
 * if you can see what you are choosing between.
 */
export const upgradeChanceFor = ({ career }) => {
  if (!canEarnUpgrade(career)) return 0;

  const objective = career.objective || { met: false, beatTeammate: false };
  const technical = career.driver?.attributes?.technical ?? 55;

  const chance =
    0.12 +
    (objective.met ? 0.28 : 0) +
    (objective.beatTeammate ? 0.12 : 0) +
    clamp(overachievementOf(career) * 0.06, -0.1, 0.18) +
    clamp((technical - 55) * 0.004, -0.06, 0.08);

  return clamp(chance, MIN_CHANCE, MAX_CHANCE);
};

/**
 * Spend the winter in the factory and find out.
 *
 * Losing the roll costs nothing but the winter: the car is exactly the car it
 * was. The cost of technical work is the qualifying, racecraft or consistency
 * you did not train instead.
 */
export const rollUpgrade = ({ career, stream }) => {
  if (career.focus !== PRESEASON_FOCUS.TECHNICAL) {
    return { chance: 0, granted: false, gain: 0 };
  }

  const chance = upgradeChanceFor({ career });
  const granted = chance > 0 && stream.chance(chance);

  return { chance, granted, gain: granted ? UPGRADE_GAIN : 0 };
};

/**
 * The same season with a quicker car in one garage.
 *
 * Returns a new world rather than editing the one it is given: worlds are cached
 * per year and shared by every career in the session, so an upgrade written into
 * one would follow the player into seasons they never raced. Reliability is left
 * alone - a development step is bodywork and engine, not a cure for a fragile
 * gearbox.
 */
export const worldWithUpgrade = (world, teamId, gain) => {
  if (!gain) return world;

  const teams = world.teams
    .map((team) =>
      team.id === teamId ? { ...team, carRating: clamp(team.carRating * (1 + gain), 30, 100) } : team,
    )
    .sort((a, b) => b.carRating - a.carRating);

  return { ...world, teams };
};
