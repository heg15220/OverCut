/**
 * Engine sanity: the things that must be true of every season the game ever
 * simulates, checked against the real 1955/1988/2016/2024 data in the offline
 * bootstrap rather than against a fixture invented for the test.
 */

import { fallbackBootstrap } from "../data/fallbackBootstrap";
import { createStream, substream } from "./rng";
import { countingRoundsFor, fastestLapRuleFor, pointsTableFor } from "./eras";
import { buildSeasonWorld, prepareBootstrap, seasonDriverRating, worldForYear } from "./world";
import { createDriverAttributes } from "./attributes";
import { simulateSeason } from "./season";
import { allEvents, presentEvent } from "./events";

const bootstrap = prepareBootstrap(fallbackBootstrap, { fallbackMode: true });

const player = {
  name: "Test Driver",
  age: 21,
  attributes: createDriverAttributes({ seed: "test-driver", talent: 80 }),
};

const seasonFor = (year, options = {}) => {
  const world = buildSeasonWorld({ bootstrap, year, seed: "test" });
  const teamId = options.teamId || world.teams[Math.floor(world.teams.length / 2)].id;
  return {
    world,
    season: simulateSeason({
      world,
      player,
      teamId,
      focus: "consistency",
      seed: options.seed || `test-${year}`,
    }),
  };
};

describe("rng", () => {
  it("is deterministic for a given seed", () => {
    const a = createStream("same-seed");
    const b = createStream("same-seed");
    const drawsA = [a.next(), a.next(), a.normal(), a.gumbel()];
    const drawsB = [b.next(), b.next(), b.normal(), b.gumbel()];
    expect(drawsA).toEqual(drawsB);
  });

  it("gives independent substreams", () => {
    const first = substream("career", "race", 1).next();
    const second = substream("career", "race", 2).next();
    expect(first).not.toEqual(second);
  });
});

describe("era rules", () => {
  it("uses the points table that year actually used", () => {
    expect(pointsTableFor(1955)).toEqual([8, 6, 4, 3, 2]);
    expect(pointsTableFor(1975)).toEqual([9, 6, 4, 3, 2, 1]);
    expect(pointsTableFor(1995)).toEqual([10, 6, 4, 3, 2, 1]);
    expect(pointsTableFor(2005)).toEqual([10, 8, 6, 5, 4, 3, 2, 1]);
    expect(pointsTableFor(2024)[0]).toBe(25);
  });

  it("awards the fastest lap point only in the two eras that had it", () => {
    expect(fastestLapRuleFor(1955).point).toBe(1);
    expect(fastestLapRuleFor(1955).requiresTopTen).toBe(false);
    expect(fastestLapRuleFor(1988).point).toBe(0);
    expect(fastestLapRuleFor(2021).point).toBe(1);
    expect(fastestLapRuleFor(2021).requiresTopTen).toBe(true);
    expect(fastestLapRuleFor(2025).point).toBe(0);
  });

  it("drops the worst results before 1991 and keeps them after", () => {
    expect(countingRoundsFor(1955, 7)).toBeLessThan(7);
    expect(countingRoundsFor(1988, 16)).toBe(11);
    expect(countingRoundsFor(2016, 21)).toBe(21);
  });
});

describe("season world", () => {
  it("builds the real grid of a real year", () => {
    const world = buildSeasonWorld({ bootstrap, year: 1988, seed: "test" });
    expect(world.races.length).toBeGreaterThan(10);
    expect(world.teams.length).toBeGreaterThan(5);

    const teamNames = world.teams.map((team) => team.name);
    expect(teamNames).toContain("McLaren");
    // 1988 is the most dominant season on record: McLaren has to come out top.
    expect(world.teams[0].name).toBe("McLaren");
  });

  it("orders cars by strength and keeps ratings on a sane scale", () => {
    const world = buildSeasonWorld({ bootstrap, year: 2016, seed: "test" });
    const ratings = world.teams.map((team) => team.carRating);
    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
    ratings.forEach((rating) => {
      expect(rating).toBeGreaterThan(30);
      expect(rating).toBeLessThanOrEqual(100);
    });
  });

  it("rates a driver on the season they actually had, not only their career", () => {
    // 2024 is the case that exposed this: McLaren built the fastest car and the
    // bootstrap rates Norris and Piastri on career records they had not yet had.
    const world = buildSeasonWorld({ bootstrap, year: 2024, seed: "form" });
    const mclaren = world.teams.find((team) => team.name === "McLaren");
    const norris = mclaren.drivers.find((driver) => driver.name === "Lando Norris");

    expect(norris.rating).toBeGreaterThan(norris.careerRating + 4);
  });

  it("does not settle a season decided by a few points the same way in every career", () => {
    // Ferrari finished 2008 twenty-one points clear of McLaren. That is a real
    // gap and Ferrari must be favourite for it, but a margin that thin is a
    // summary of one season, not a measurement of the car: some careers have to
    // meet a 2008 where McLaren had the better package.
    const leaders = new Set();
    for (let i = 0; i < 40; i += 1) {
      const world = buildSeasonWorld({ bootstrap, year: 2008, seed: `close-${i}` });
      leaders.add(world.teams[0].name);
    }

    expect(leaders.has("Ferrari")).toBe(true);
    expect(leaders.has("McLaren")).toBe(true);
  });

  it("still gives a dominant car the same season in every career", () => {
    // The 1988 McLaren won fifteen of sixteen. No amount of uncertainty about a
    // final classification should ever put anybody else at the front of it.
    for (let i = 0; i < 40; i += 1) {
      const world = buildSeasonWorld({ bootstrap, year: 1988, seed: `sure-${i}` });
      expect(world.teams[0].name).toBe("McLaren");
    }
  });

  it("generates a coherent season past the end of the data", () => {
    const cache = {};
    const future = worldForYear({ bootstrap, year: bootstrap.lastDataYear + 3, seed: "test", cache });
    expect(future.generated).toBe(true);
    expect(future.teams.length).toBeGreaterThan(5);
    future.teams.forEach((team) => {
      expect(team.drivers.length).toBeGreaterThan(0);
      team.drivers.forEach((driver) => {
        expect(driver.age).toBeLessThan(45);
        expect(driver.rating).toBeGreaterThan(30);
      });
    });
  });
});

describe("season simulation", () => {
  it("classifies every entrant in every race exactly once", () => {
    const { world, season } = seasonFor(2016);
    const fieldSize = world.teams.reduce(
      (sum, team) => sum + Math.min(2, team.drivers.length),
      0,
    );

    expect(season.races.length).toBe(world.races.length);
    season.races.forEach((race) => {
      expect(race.winner).toBeTruthy();
      expect(race.pole).toBeTruthy();
      expect(race.podium.length).toBeLessThanOrEqual(3);
    });
    // The player takes a seat rather than adding one, so the grid keeps its
    // size - and a seat whose driver is out is filled by a reserve rather than
    // left empty, so every seat is started exactly once at every round.
    const seatStarts = season.standings.reduce((sum, row) => sum + row.finishes + row.retirements, 0);
    expect(seatStarts).toBe(fieldSize * season.raceCount);
    expect(season.standings.length).toBeGreaterThanOrEqual(fieldSize);
  });

  it("gives the player a coherent set of season statistics", () => {
    const { season } = seasonFor(2016);
    const stats = season.player;

    expect(stats.starts).toBe(season.raceCount);
    expect(stats.wins).toBeLessThanOrEqual(stats.podiums);
    expect(stats.podiums).toBeLessThanOrEqual(stats.starts);
    expect(stats.retirements).toBeLessThanOrEqual(stats.starts);
    expect(stats.poles).toBeLessThanOrEqual(stats.starts);
    expect(stats.fastestLaps).toBeLessThanOrEqual(stats.starts);
    expect(stats.points).toBeGreaterThanOrEqual(0);
    expect(stats.position).toBeGreaterThanOrEqual(1);
  });

  it("hands out exactly one pole and at most one fastest lap per race", () => {
    const { season } = seasonFor(1988);
    const poles = season.standings.reduce((sum, row) => sum + row.poles, 0);
    const fastestLaps = season.standings.reduce((sum, row) => sum + row.fastestLaps, 0);
    expect(poles).toBe(season.raceCount);
    expect(fastestLaps).toBeLessThanOrEqual(season.raceCount);
  });

  it("keeps the championship order consistent with the points", () => {
    const { season } = seasonFor(2024);
    for (let index = 1; index < season.standings.length; index += 1) {
      expect(season.standings[index - 1].points).toBeGreaterThanOrEqual(season.standings[index].points);
    }
    expect(season.champion.position).toBe(1);
  });

  it("actually drops points in the eras that dropped scores", () => {
    // Whether any single season throws points away depends on how many rounds a
    // driver managed to score in, which is a race outcome. Across the four
    // pre-1991 seasons in the offline data it has to happen somewhere - and the
    // accounting invariant has to hold everywhere.
    const oldSeasons = [1955, 1965, 1976, 1988].map((year) => seasonFor(year).season);

    oldSeasons.forEach((season) => {
      expect(season.countingRounds).toBeLessThan(season.raceCount);
      season.standings.forEach((row) => {
        expect(row.grossPoints).toBeGreaterThanOrEqual(row.points);
        expect(row.droppedPoints).toBe(row.grossPoints - row.points);
      });
    });

    const droppedSomewhere = oldSeasons.some((season) =>
      season.standings.some((row) => row.droppedPoints > 0),
    );
    expect(droppedSomewhere).toBe(true);
  });

  it("keeps every point when no scores are dropped", () => {
    const { season } = seasonFor(2016);
    expect(season.countingRounds).toBe(season.raceCount);
    season.standings.forEach((row) => {
      expect(row.droppedPoints).toBe(0);
      expect(row.points).toBe(row.grossPoints);
    });
  });

  it("is reproducible: the same seed replays the same season", () => {
    const first = seasonFor(2016, { seed: "replay" }).season;
    const second = seasonFor(2016, { seed: "replay" }).season;
    expect(second.player).toEqual(first.player);
    expect(second.races.map((race) => race.winner)).toEqual(first.races.map((race) => race.winner));
  });

  it("puts the best cars at the front over a whole season", () => {
    const { world, season } = seasonFor(2016);
    const topTeams = world.teams.slice(0, 3).map((team) => team.name);
    const winners = season.races.map((race) => race.winnerTeam);
    const fromTopTeams = winners.filter((team) => topTeams.includes(team)).length;
    // Not a guarantee of every race - upsets are the point of the weather model -
    // but over a season the fast cars have to dominate.
    expect(fromTopTeams / winners.length).toBeGreaterThan(0.6);
  });

  it("retires more cars in the 1950s than in the 2020s", () => {
    const old = seasonFor(1955).season;
    const modern = seasonFor(2024).season;

    const dnfRate = (season) => {
      const retirements = season.standings.reduce((sum, row) => sum + row.retirements, 0);
      const starts = season.standings.length * season.raceCount;
      return retirements / starts;
    };

    expect(dnfRate(old)).toBeGreaterThan(dnfRate(modern));
  });
});

/**
 * A driver's rating for one season.
 *
 * The trap this guards against: a career rating cannot describe a young driver,
 * because a career rating is built out of a career they have not had yet. The
 * only per-season evidence the caches carry is podiums, and podiums are half the
 * car - so the rules below are asymmetric on purpose. Results can prove a driver
 * is fast; a lack of results cannot prove they are slow.
 */
describe("season driver rating", () => {
  const base = { seasonsRaced: 6, age: 28, seasonWins: 0, seasonPodiums: 0, driverRaces: 20, seasonRaces: 20, teamPodiums: 0 };
  const rate = (over) => seasonDriverRating({ ...base, ...over });

  it("lifts a young driver whose season was better than their reputation", () => {
    // Piastri 2024: two wins and eight podiums in his second season, while the
    // career rating the bootstrap has for him is still that of a newcomer.
    const reputationOnly = rate({ careerRating: 46, seasonsRaced: 2, age: 23 });
    const withSeason = rate({
      careerRating: 46,
      seasonsRaced: 2,
      age: 23,
      seasonWins: 2,
      seasonPodiums: 8,
      driverRaces: 24,
      seasonRaces: 24,
      teamPodiums: 21,
    });

    expect(withSeason).toBeGreaterThan(reputationOnly + 5);
  });

  it("does not drop a proven driver whose car could not score", () => {
    const stuck = rate({ careerRating: 99, seasonPodiums: 0, teamPodiums: 0 });
    expect(stuck).toBeGreaterThan(85);
  });

  it("keeps a great driver great when the car podiums only through them", () => {
    // Alonso 2008: the Renault was fourth best and every podium it scored was his.
    const alonso = rate({
      careerRating: 99,
      seasonWins: 2,
      seasonPodiums: 3,
      driverRaces: 18,
      seasonRaces: 18,
      teamPodiums: 3,
    });
    expect(alonso).toBeGreaterThan(88);
  });

  it("separates two team-mates who drove the same car", () => {
    const shared = { careerRating: 70, driverRaces: 24, seasonRaces: 24, teamPodiums: 21 };
    const leader = rate({ ...shared, seasonWins: 4, seasonPodiums: 13 });
    const follower = rate({ ...shared, seasonWins: 2, seasonPodiums: 8 });

    expect(leader).toBeGreaterThan(follower);
  });

  it("barely moves a driver who only stood in for a couple of races", () => {
    const standIn = rate({
      careerRating: 55,
      seasonWins: 0,
      seasonPodiums: 1,
      driverRaces: 2,
      seasonRaces: 24,
      teamPodiums: 14,
    });
    const reputationOnly = rate({ careerRating: 55 });

    expect(Math.abs(standIn - reputationOnly)).toBeLessThan(3);
  });

  it("leaves a season with no podium data anywhere on reputation alone", () => {
    const withoutData = seasonDriverRating({ careerRating: 64, seasonsRaced: 8, age: 29, seasonWins: 0 });
    const explicitZeroes = rate({ careerRating: 64, seasonsRaced: 8, age: 29 });

    expect(withoutData).toBeCloseTo(explicitZeroes, 5);
  });
});

/**
 * Drivers who miss races.
 *
 * The gap between the two championships is mostly made of things that cost a
 * driver points without costing their team any: Lauda missed two Grands Prix in
 * 1976, lost the title by a single point, and Ferrari won the constructors'
 * anyway because Reutemann kept scoring in his car. Without this the engine had
 * no way for a seat to keep racing while its driver did not.
 */
describe("missed races", () => {
  const seasonsOf = (year, runs) =>
    Array.from({ length: runs }, (unused, index) => {
      const world = buildSeasonWorld({ bootstrap, year, seed: `miss-${year}-${index}` });
      return simulateSeason({
        world,
        player,
        teamId: world.teams[Math.floor(world.teams.length / 2)].id,
        focus: "consistency",
        seed: `miss-${year}-${index}`,
      });
    });

  /** Races a standings row actually started. */
  const started = (row) => row.finishes + row.retirements;

  it("leaves somebody on the sidelines across a season", () => {
    const seasons = seasonsOf(1976, 6);
    const sidelined = seasons.some((season) =>
      season.standings.some((row) => !row.isPlayer && started(row) > 0 && started(row) < season.raceCount),
    );

    expect(sidelined).toBe(true);
  });

  it("keeps the seat racing for the constructor while its driver is out", () => {
    const seasons = seasonsOf(1976, 6);

    seasons.forEach((season) => {
      season.constructorStandings.forEach((team) => {
        const fromDrivers = season.standings
          .filter((row) => row.teamId === team.teamId)
          .reduce((sum, row) => sum + row.grossPoints, 0);

        // Every point a stand-in scores is the team's, so the two must agree.
        // Gross, not net: before 1991 a driver dropped their worst results and
        // a constructor never did, so only the gross totals can be compared.
        expect(team.points).toBeCloseTo(fromDrivers, 5);
      });
    });
  });

  it("never takes the player off the grid behind their back", () => {
    seasonsOf(1976, 6).forEach((season) => {
      expect(season.player.starts).toBe(season.raceCount);
    });
  });

  it("sidelines more drivers in the fifties than in the 2020s", () => {
    const missedIn = (year) =>
      seasonsOf(year, 6).reduce(
        (count, season) =>
          count +
          season.standings.filter((row) => !row.isPlayer && started(row) > 0 && started(row) < season.raceCount)
            .length,
        0,
      );

    expect(missedIn(1955)).toBeGreaterThan(missedIn(2024));
  });
});

describe("the two championships", () => {
  it("sends the drivers title away from the constructors champion in a close season", () => {
    // Measured at ~21% over 500 competitive seasons. It is bounded from above by
    // the car: `era.carWeight` gives the machinery roughly three quarters of a
    // driver's pace, so a team's two drivers rise and fall together and the two
    // titles rarely come apart. Raising this figure means lowering that weight,
    // which is the dial the whole era calibration rests on.
    // The seasons where the grid was actually competitive. The years one team
    // ran away with - 1988, 1955, 2016 - are meant to stay near zero.
    const years = [1965, 1976, 1998, 2008, 2024];
    let split = 0;
    let total = 0;

    years.forEach((year) => {
      for (let run = 0; run < 30; run += 1) {
        const world = buildSeasonWorld({ bootstrap, year, seed: `two-${year}-${run}` });
        const season = simulateSeason({
          world,
          player,
          teamId: world.teams[Math.floor(world.teams.length / 2)].id,
          focus: "consistency",
          seed: `two-${year}-${run}`,
        });

        if (season.champion?.team && season.constructorChampion?.team) {
          total += 1;
          if (season.champion.team !== season.constructorChampion.team) split += 1;
        }
      }
    });

    expect(split / total).toBeGreaterThan(0.1);
    expect(split / total).toBeLessThan(0.35);
  });

  it("still gives both titles to a team that ran away with the year", () => {
    let split = 0;
    for (let run = 0; run < 20; run += 1) {
      const world = buildSeasonWorld({ bootstrap, year: 1988, seed: `sure-${run}` });
      const season = simulateSeason({
        world,
        player,
        teamId: world.teams[Math.floor(world.teams.length / 2)].id,
        focus: "consistency",
        seed: `sure-${run}`,
      });
      if (season.champion?.team !== season.constructorChampion?.team) split += 1;
    }

    expect(split / 20).toBeLessThan(0.15);
  });
});

describe("off-track events", () => {
  it("says what kind of decision each one is", () => {
    // The category is shown on the screen, so an event without one would render
    // an empty eyebrow rather than fail loudly.
    const categories = new Set(["garage", "market", "personal", "rivalry"]);
    allEvents().forEach((event) => {
      expect(categories.has(event.category)).toBe(true);
    });
  });

  it("carries the category through to the screen", () => {
    const presented = presentEvent(allEvents()[0], "es");
    expect(presented.category).toBe(allEvents()[0].category);
  });
});
