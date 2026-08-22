/**
 * Where a career ends up in the history of the sport.
 *
 * The record book is real: it comes out of f1db with the actual all-time leaders
 * in titles, wins, podiums and seasons. A career is placed inside that list, not
 * against an invented benchmark, so "seventh on the all-time win list" means the
 * seventh place on the actual all-time win list.
 */

import { clamp } from "./rng.js";

export const emptyTotals = () => ({
  seasons: 0,
  starts: 0,
  points: 0,
  wins: 0,
  podiums: 0,
  poles: 0,
  fastestLaps: 0,
  retirements: 0,
  titles: 0,
  bestPosition: null,
  teams: [],
});

export const foldSeasonIntoTotals = (totals, stats) => {
  if (!stats) return totals;
  const teams = totals.teams.includes(stats.team) ? totals.teams : [...totals.teams, stats.team];
  return {
    seasons: totals.seasons + 1,
    starts: totals.starts + stats.starts,
    points: totals.points + stats.points,
    wins: totals.wins + stats.wins,
    podiums: totals.podiums + stats.podiums,
    poles: totals.poles + stats.poles,
    fastestLaps: totals.fastestLaps + stats.fastestLaps,
    retirements: totals.retirements + stats.retirements,
    titles: totals.titles + (stats.champion ? 1 : 0),
    bestPosition:
      totals.bestPosition === null ? stats.position : Math.min(totals.bestPosition, stats.position),
    teams,
  };
};

/**
 * Slot the player into one of the real all-time lists.
 *
 * Returns the rank they would hold, who they just passed and who is next - which
 * is the shape of a record chase: you never care about the whole list, only about
 * the two names either side of you.
 */
export const rankAgainst = (list = [], value) => {
  if (!Array.isArray(list) || list.length === 0) return null;

  const ahead = list.filter((entry) => entry.value > value);
  const behind = list.filter((entry) => entry.value <= value);

  return {
    rank: ahead.length + 1,
    inTop: ahead.length < list.length,
    passed: behind[0] || null,
    next: ahead[ahead.length - 1] || null,
    leader: list[0] || null,
    value,
  };
};

export const recordStandings = ({ recordBook, totals }) => ({
  titles: rankAgainst(recordBook.titles, totals.titles),
  wins: rankAgainst(recordBook.wins, totals.wins),
  podiums: rankAgainst(recordBook.podiums, totals.podiums),
  seasons: rankAgainst(recordBook.seasons, totals.seasons),
});

/**
 * Records broken along the way, so the game can tell the player at the moment it
 * happens rather than only at the end.
 */
export const milestonesFor = ({ totals, previousTotals, recordBook }) => {
  const milestones = [];
  const crossed = (key, thresholds) => {
    thresholds.forEach((threshold) => {
      if (previousTotals[key] < threshold && totals[key] >= threshold) {
        milestones.push({ key, threshold });
      }
    });
  };

  crossed("wins", [1, 5, 10, 25, 50, 75, 100]);
  crossed("podiums", [1, 10, 25, 50, 100, 150]);
  crossed("poles", [1, 5, 10, 25, 50, 100]);
  crossed("titles", [1, 2, 3, 4, 5, 7]);

  const winLeader = recordBook.wins?.[0];
  if (winLeader && previousTotals.wins < winLeader.value && totals.wins >= winLeader.value) {
    milestones.push({ key: "allTimeWins", threshold: winLeader.value, passed: winLeader.name });
  }

  return milestones;
};

/**
 * The closing verdict.
 *
 * Scored on the same currency the sport uses - titles first, then wins, then
 * podiums - with a correction for how good the cars were. A driver who won two
 * races in machinery that had no business winning any is not the same as a
 * driver who won two races in the best car on the grid, and the verdict says so.
 */
export const retirementVerdict = ({ totals, history = [] }) => {
  const machineryQuality =
    history.length > 0
      ? history.reduce((sum, season) => sum + (1 - (season.carRank - 1) / Math.max(1, season.teamCount - 1)), 0) /
        history.length
      : 0.5;

  const overperformance =
    history.length > 0
      ? history.reduce((sum, season) => sum + season.overperformance, 0) / history.length
      : 0;

  const raw = totals.titles * 100 + totals.wins * 7 + totals.podiums * 2.4 + totals.poles * 1.6;
  // Doing it in bad cars is worth more; doing it in the best car is worth less.
  const adjusted = raw * clamp(1.35 - machineryQuality * 0.6, 0.75, 1.35) + overperformance * 14;

  let tier;
  if (totals.titles >= 4 || adjusted >= 520) tier = "immortal";
  else if (totals.titles >= 2 || adjusted >= 300) tier = "great";
  else if (totals.titles >= 1 || adjusted >= 165) tier = "champion";
  else if (totals.wins >= 3 || adjusted >= 85) tier = "winner";
  else if (totals.podiums >= 3 || adjusted >= 30) tier = "respected";
  else if (totals.points > 0) tier = "journeyman";
  else tier = "footnote";

  return {
    tier,
    score: Math.round(adjusted),
    machineryQuality,
    overperformance,
    // The line the player will quote: did they beat the cars they were given?
    overachiever: overperformance > 1.5,
    underachiever: overperformance < -1.5,
  };
};

/**
 * Whether it is time to stop.
 *
 * Age is the floor, but a driver who cannot find a seat retires earlier and one
 * still winning at 40 keeps going - which is how it works in life.
 */
export const shouldRetire = ({ age, seasonsWithoutSeat, lastStats }) => {
  if (age >= 45) return true;
  if (seasonsWithoutSeat >= 2) return true;
  if (age >= 38 && (!lastStats || lastStats.points === 0)) return true;
  return false;
};
