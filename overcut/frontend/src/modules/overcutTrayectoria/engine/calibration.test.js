/**
 * Calibration harness. Skipped by default - it runs thousands of seasons.
 *
 *   RUN_CALIBRATION=1 npx react-scripts test calibration --watchAll=false
 *
 * It does not assert much. Its job is to print the numbers you need in order to
 * re-tune the model, and to fail only if one of them has wandered somewhere
 * indefensible. The dials it measures, and where they live:
 *
 *   win share by car rank      race.js PL_TEMPERATURE, world.js fieldSpreadFor
 *   win share by condition     weather.js GRIP
 *   finish rate by era         eras.js FINISH_RATES, world.js reliabilityFor
 *   championship spread        everything above, compounded over a season
 *
 * The targets encoded below come from the real record: the best car wins most
 * races in the dry and clearly fewer in the wet, and roughly nine cars in ten
 * saw the flag in 2020 against about half in 1955.
 */

import { fallbackBootstrap } from "../data/fallbackBootstrap";
import { buildSeasonWorld, prepareBootstrap } from "./world";
import { createDriverAttributes } from "./attributes";
import { simulateSeason } from "./season";
import { WEATHER } from "./weather";

const RUN = process.env.RUN_CALIBRATION === "1";
const describeCalibration = RUN ? describe : describe.skip;

const bootstrap = prepareBootstrap(fallbackBootstrap, { fallbackMode: true });
const YEARS = [1955, 1976, 1988, 1998, 2016, 2024];
const RUNS = 24;

const player = (seed) => ({
  name: "Calibration Driver",
  age: 26,
  attributes: createDriverAttributes({ seed, talent: 80 }),
});

const runSeasons = (year, runs) => {
  const world = buildSeasonWorld({ bootstrap, year, seed: "calibration" });
  const midfield = world.teams[Math.floor(world.teams.length / 2)].id;

  const seasons = [];
  for (let index = 0; index < runs; index += 1) {
    seasons.push(
      simulateSeason({
        world,
        player: player(`calibration-${index}`),
        teamId: midfield,
        focus: "consistency",
        seed: `calibration-${year}-${index}`,
      }),
    );
  }
  return { world, seasons };
};

describeCalibration("calibration", () => {
  it("reports win share, finish rate and championship spread by era", () => {
    const report = [];

    YEARS.forEach((year) => {
      const { world, seasons } = runSeasons(year, RUNS);
      const rankOf = {};
      world.teams.forEach((team, index) => {
        rankOf[team.name] = index + 1;
      });

      let races = 0;
      const winsByRank = {};
      const byCondition = {
        dry: { races: 0, rankSum: 0 },
        mixed: { races: 0, rankSum: 0 },
        wet: { races: 0, rankSum: 0 },
      };
      let rankSum = 0;
      let retirements = 0;
      let starts = 0;
      const titleSpread = new Set();

      seasons.forEach((season) => {
        titleSpread.add(season.champion.driver);
        season.standings.forEach((row) => {
          retirements += row.retirements;
          // Races this row actually started, not the length of the calendar: a
          // driver can miss rounds, and the reserve who covered for them has a
          // row of their own with a handful of starts in it.
          starts += row.finishes + row.retirements;
        });

        season.races.forEach((race) => {
          races += 1;
          const rank = rankOf[race.winnerTeam] ?? world.teams.length;
          winsByRank[rank] = (winsByRank[rank] || 0) + 1;
          rankSum += rank;

          const bucket = byCondition[race.weather];
          bucket.races += 1;
          bucket.rankSum += rank;
        });
      });

      const share = (rank) => ((winsByRank[rank] || 0) / races) * 100;
      const conditionRank = (key) =>
        byCondition[key].races === 0 ? null : byCondition[key].rankSum / byCondition[key].races;

      report.push({
        year,
        teams: world.teams.length,
        finishRate: Number((1 - retirements / starts).toFixed(3)),
        // Where the winning car sat in the pecking order. This is the honest
        // measure: "the top two win most races" breaks in a year like 2024, where
        // the best driver was in the third best car and won nine Grands Prix.
        meanWinnerRank: Number((rankSum / races).toFixed(2)),
        winShareTop2: Number((share(1) + share(2)).toFixed(1)),
        winShareTop4: Number([1, 2, 3, 4].reduce((sum, rank) => sum + share(rank), 0).toFixed(1)),
        winnerRankDry: conditionRank(WEATHER.DRY)?.toFixed(2) ?? "-",
        winnerRankMixed: conditionRank(WEATHER.MIXED)?.toFixed(2) ?? "-",
        winnerRankWet: conditionRank(WEATHER.WET)?.toFixed(2) ?? "-",
        differentChampions: titleSpread.size,
      });
    });

    // eslint-disable-next-line no-console
    console.table(report);

    report.forEach((row) => {
      // Races are won from the front of the pecking order. If the mean winner is
      // coming from mid-grid the field is too compressed and a season stops
      // meaning anything.
      expect(row.meanWinnerRank).toBeLessThan(4);
      expect(row.winShareTop4).toBeGreaterThan(75);
      // ...but never all of them, or upsets have stopped existing.
      expect(row.winShareTop4).toBeLessThan(99.9);
      // Finish rates have to stay inside the historical envelope.
      expect(row.finishRate).toBeGreaterThan(0.3);
      expect(row.finishRate).toBeLessThan(0.95);
    });

    // The modern grid must finish far more reliably than the 1950s one.
    const oldest = report[0];
    const newest = report[report.length - 1];
    expect(newest.finishRate).toBeGreaterThan(oldest.finishRate + 0.2);
  });

  it("shows rain reaching across the hierarchy", () => {
    const dry = { races: 0, rankSum: 0 };
    const wet = { races: 0, rankSum: 0 };

    YEARS.forEach((year) => {
      const { world, seasons } = runSeasons(year, RUNS);
      const rankOf = {};
      world.teams.forEach((team, index) => {
        rankOf[team.name] = index + 1;
      });

      seasons.forEach((season) => {
        season.races.forEach((race) => {
          const rank = rankOf[race.winnerTeam] ?? world.teams.length;
          const bucket = race.weather === WEATHER.DRY ? dry : wet;
          bucket.races += 1;
          bucket.rankSum += rank;
        });
      });
    });

    const dryRank = dry.rankSum / dry.races;
    const wetRank = wet.rankSum / wet.races;

    // eslint-disable-next-line no-console
    console.log(`mean winner car rank  dry ${dryRank.toFixed(2)}  wet/mixed ${wetRank.toFixed(2)}`);

    // Rain has to reach further down the grid than a dry race does.
    expect(wetRank).toBeGreaterThan(dryRank);
  });
});
