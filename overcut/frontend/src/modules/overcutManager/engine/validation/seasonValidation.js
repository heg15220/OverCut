/**
 * Statistical validation of the seasons (criterio 7.2, SRS 7.4 phase 5).
 *
 *   For each season, 1,000 strict-mode simulations without intervention give the
 *   real constructors' champion as the most probable champion in at least 70 % of
 *   the years, and the mean Spearman correlation between the simulated and the
 *   real constructors' order is >= 0.8.
 *
 * "Without intervention" is a spectator career (createCareer `spectator: true`):
 * every team, the nominal one included, is a rival - it races its real entries,
 * develops with the AI and is guided by the strict anchors (RF-CAR-05) - and no
 * board, books, events or mail run. Each run is the quick mode (race.js) of every
 * weekend, seeded, so a run is reproducible from its seed (RNF-05).
 *
 * The driver for the whole grid of seasons, with worker threads, is
 * overcut/frontend/scripts/validateSeasons.js; this module is what each worker
 * runs, and what the tests check.
 */

import { PHASES, closeWeekend, constructorStandings, createCareer, seasonWorld, simulateWeekend } from "../career";
import { selectableTeams } from "../packs/packWorld";

export const CRITERIA = { championShare: 0.7, meanSpearman: 0.8 };

/** Spearman's rho between two orders of the same items (only the items in both count). */
export const spearman = (simulated, real) => {
  const common = real.filter((id) => simulated.includes(id));
  const n = common.length;
  if (n < 2) return null;
  const simRank = Object.fromEntries(simulated.filter((id) => common.includes(id)).map((id, index) => [id, index + 1]));
  const sum = common.reduce((total, id, index) => total + (simRank[id] - (index + 1)) ** 2, 0);
  return 1 - (6 * sum) / (n * (n * n - 1));
};

/** The real constructors' order of a season's world (pack standings or bootstrap). */
export const realOrderOf = (world) =>
  Object.values(world.teams)
    .filter((team) => team.real !== false && Number.isFinite(team.realPosition))
    .sort((a, b) => a.realPosition - b.realPosition)
    .map((team) => team.id);

/** A nominal team for a spectator: the median selectable team by the real order. */
const nominalTeam = (world) => {
  const order = realOrderOf(world);
  const selectable = new Set(selectableTeams(world).map((team) => team.id));
  const candidates = order.filter((id) => selectable.has(id));
  return candidates[Math.floor(candidates.length / 2)] || Object.keys(world.teams)[0];
};

/**
 * One season with no principal, start to flag. Returns the simulated
 * constructors' order, the points and Spearman against the real order.
 */
export const simulateSpectatorSeason = (context, { year, seed, mode = "strict" }) => {
  const career = createCareer(context, { year, seed, mode, spectator: true, ...probeTeam(context, year, seed) });
  let guard = 0;
  while (career.phase !== PHASES.REVIEW && career.round < career.world.races.length && guard < 64) {
    simulateWeekend(career);
    closeWeekend(career);
    guard += 1;
  }
  const standings = constructorStandings(career);
  const order = standings.map((row) => row.teamId);
  const real = realOrderOf(career.world);
  return {
    year,
    seed,
    order,
    points: Object.fromEntries(standings.map((row) => [row.teamId, row.total])),
    champion: order[0] || null,
    realChampion: real[0] || null,
    spearman: spearman(order, real),
  };
};

// The team id a spectator career is created with: any selectable team works, the
// median keeps createCareer's own bookkeeping ordinary. Cached per year.
const nominal = new Map();
const probeTeam = (context, year, seed) => {
  if (!nominal.has(year)) nominal.set(year, nominalTeam(seasonWorld(context, year, `${seed}::probe`)));
  return { teamId: nominal.get(year) };
};

/**
 * What the runs of one season say against criterio 7.2: the champion distribution,
 * the real champion's share and rank in it, Spearman's mean and spread, and every
 * team's mean simulated position next to its real one.
 */
export const summarizeSeason = (year, runs) => {
  const total = runs.length;
  const champions = {};
  const positions = {};
  const rhos = [];
  runs.forEach((run) => {
    champions[run.champion] = (champions[run.champion] || 0) + 1;
    run.order.forEach((teamId, index) => {
      (positions[teamId] = positions[teamId] || []).push(index + 1);
    });
    if (run.spearman !== null) rhos.push(run.spearman);
  });
  const realChampion = runs[0]?.realChampion || null;
  const distribution = Object.entries(champions).sort((a, b) => b[1] - a[1]).map(([teamId, count]) => ({ teamId, share: count / total }));
  const rank = distribution.findIndex((row) => row.teamId === realChampion) + 1;
  const meanRho = rhos.length ? rhos.reduce((sum, value) => sum + value, 0) / rhos.length : null;
  const sd = rhos.length > 1 ? Math.sqrt(rhos.reduce((sum, value) => sum + (value - meanRho) ** 2, 0) / (rhos.length - 1)) : 0;
  return {
    year,
    runs: total,
    realChampion,
    realChampionShare: (champions[realChampion] || 0) / Math.max(1, total),
    realChampionRank: rank || null,
    mostProbable: distribution[0]?.teamId || null,
    realChampionMostProbable: distribution[0]?.teamId === realChampion,
    distribution,
    meanSpearman: meanRho,
    sdSpearman: sd,
    meanPosition: Object.fromEntries(Object.entries(positions).map(([teamId, list]) => [teamId, list.reduce((sum, value) => sum + value, 0) / list.length])),
  };
};

/** The verdict over every season (criterio 7.2). */
export const verdictOf = (seasons) => {
  const scored = seasons.filter((season) => season.runs > 0);
  const hits = scored.filter((season) => season.realChampionMostProbable).length;
  const rhos = scored.map((season) => season.meanSpearman).filter((value) => value !== null);
  const championShare = scored.length ? hits / scored.length : 0;
  const meanSpearman = rhos.length ? rhos.reduce((sum, value) => sum + value, 0) / rhos.length : null;
  return {
    seasons: scored.length,
    championHits: hits,
    championShare,
    meanSpearman,
    pass: championShare >= CRITERIA.championShare && meanSpearman !== null && meanSpearman >= CRITERIA.meanSpearman,
  };
};
