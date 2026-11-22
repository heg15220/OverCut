/**
 * The two championships, under the rules of the year.
 *
 * Two historical rules change who wins and are kept:
 *
 *   dropped scores   until 1990 only a driver's best results counted
 *                    (Trayectoria's `countingRoundsFor`).
 *   one car counts   until 1978 a constructor scored only with its best-placed
 *                    car in each race.
 *
 * The constructors' title was first awarded in 1958; earlier seasons still keep
 * the table, because a team principal is judged by it, but it is unofficial.
 */

import { countingRoundsFor, eraProfileFor } from "../../overcutTrayectoria/engine/eras";
import { adjustConstructorStandings, adjustDriverStandings } from "./history";

export const emptySeason = (year) => ({ year, results: [], drivers: {}, teams: {} });

export const constructorsTitleAwarded = (year) => year >= 1958;
const bestCarOnly = (year) => year < 1979;

/**
 * Points for one classification. `rows` are in finishing order with a status;
 * returns driverId -> points and teamId -> points.
 */
export const scoreRace = ({ rows, fastestLapDriverId, year, era: given = null }) => {
  // A pack season brings its own points scheme (RF-CAR-02); otherwise the era's.
  const era = given || eraProfileFor(year);
  const oneCar = era.constructorsBestCarOnly ?? bestCarOnly(year);
  const driverPoints = {};
  const teamPoints = {};
  const scoredTeams = new Set();
  rows.forEach((row) => {
    if (row.status !== "finished") return;
    const value = era.points[row.position - 1] ?? 0;
    if (!value) return;
    driverPoints[row.driverId] = (driverPoints[row.driverId] || 0) + value;
    if (!oneCar || !scoredTeams.has(row.teamId)) {
      teamPoints[row.teamId] = (teamPoints[row.teamId] || 0) + value;
      scoredTeams.add(row.teamId);
    }
  });
  const rule = era.fastestLap;
  if (rule.point > 0 && fastestLapDriverId) {
    const row = rows.find((entry) => entry.driverId === fastestLapDriverId);
    if (row && (!rule.requiresTopTen || (row.status === "finished" && row.position <= 10))) {
      driverPoints[row.driverId] = (driverPoints[row.driverId] || 0) + rule.point;
      if (!oneCar) teamPoints[row.teamId] = (teamPoints[row.teamId] || 0) + rule.point;
    }
  }
  return { driverPoints, teamPoints };
};

/** Add a race to the season's tallies. */
export const recordRace = (season, summary) => {
  season.results.push(summary);
  const index = season.results.length - 1;
  summary.rows.forEach((row) => {
    const driver = (season.drivers[row.driverId] ||= {
      driverId: row.driverId, name: row.name, teamId: row.teamId, points: [], wins: 0, podiums: 0, poles: 0, fastest: 0, dnfs: 0, starts: 0, best: null,
    });
    driver.teamId = row.teamId;
    driver.name = row.name;
    while (driver.points.length < index) driver.points.push(0);
    driver.points.push(row.points || 0);
    driver.starts += 1;
    if (row.status === "finished") {
      if (row.position === 1) driver.wins += 1;
      if (row.position <= 3) driver.podiums += 1;
      driver.best = driver.best === null ? row.position : Math.min(driver.best, row.position);
    } else driver.dnfs += 1;
    if (row.grid === 1) driver.poles += 1;
    if (row.driverId === summary.fastestLap) driver.fastest += 1;

    const team = (season.teams[row.teamId] ||= { teamId: row.teamId, points: 0, wins: 0, podiums: 0, best: null });
    if (row.status === "finished") {
      if (row.position === 1) team.wins += 1;
      if (row.position <= 3) team.podiums += 1;
      team.best = team.best === null ? row.position : Math.min(team.best, row.position);
    }
  });
  Object.entries(summary.teamPoints || {}).forEach(([teamId, points]) => {
    (season.teams[teamId] ||= { teamId, points: 0, wins: 0, podiums: 0, best: null }).points += points;
  });
  return season;
};

const compare = (a, b) => b.total - a.total || b.wins - a.wins || b.podiums - a.podiums || (a.best ?? 99) - (b.best ?? 99);

export const driverStandings = (career) => {
  const season = career.season;
  const counting = countingRoundsFor(season.year, career.world.races.length || 1);
  const rows = Object.values(season.drivers)
    .map((row) => {
      const sorted = [...row.points].sort((a, b) => b - a);
      const total = sorted.slice(0, counting).reduce((sum, value) => sum + value, 0);
      const gross = row.points.reduce((sum, value) => sum + value, 0);
      return { ...row, total, gross, dropped: gross - total };
    })
    .sort(compare)
    .map((row, index) => ({ ...row, position: index + 1 }));
  // SRS 6.4: real exclusions (1997 Schumacher, only if the situation reproduces; strict mode only).
  return adjustDriverStandings(career, rows);
};

export const constructorStandings = (career) => {
  const season = career.season;
  const rows = Object.keys(career.world.teams)
    .map((teamId) => {
      const row = season.teams[teamId] || { teamId, points: 0, wins: 0, podiums: 0, best: null };
      return { ...row, teamId, total: row.points };
    })
    .sort(compare)
    .map((row, index) => ({ ...row, position: index + 1 }));
  // SRS 6.4: real exclusions (2007 McLaren from the constructors', strict mode only).
  return adjustConstructorStandings(career, rows);
};
