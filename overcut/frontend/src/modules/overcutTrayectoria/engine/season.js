/**
 * A season, start to finish.
 *
 * Builds the grid the player is actually on - their team's second car, with the
 * real driver they displaced stepping aside - runs every round through the race
 * engine, and adds it all up under the rules that year used, including the
 * dropped-scores schemes that decided several early championships.
 *
 * Nothing here knows about contracts, the press or the market. It takes a world
 * and a driver, and returns what happened.
 */

import { clamp, substream } from "./rng.js";
import { countingRoundsFor } from "./eras.js";
import { deriveAttributes, overallOf, toEntrant } from "./attributes.js";
import { ROOKIE_FIRST_NAMES, ROOKIE_SURNAMES } from "./world.js";
import { simulateRace } from "./race.js";
import { WEATHER } from "./weather.js";

/**
 * Each car's aerodynamic character. Not in f1db in any usable form, so it is
 * drawn deterministically per team and season: what matters for the game is that
 * a car has a consistent character across its year, so a driver can have a track
 * that suits them and one that does not.
 */
const carBiases = (teamName, year) => {
  const stream = substream("bias", teamName, year);
  const power = clamp(stream.normal(0.55, 0.16), 0.15, 0.95);
  return { powerBias: power, aeroBias: clamp(1.1 - power + stream.normal(0, 0.1), 0.15, 0.95) };
};

/**
 * The field, with the player in it.
 *
 * The player takes the seat of their team's second driver: the grid keeps its
 * real size and its real names, minus the one person whose drive you took. That
 * displaced driver is returned too, because the press and the market care.
 */
/**
 * How likely a driver is to miss at least one race in a season.
 *
 * Read off the era's finish rate, which is the model's measure of how hard the
 * sport was on cars and on the people in them: a third of the 1955 grid sat a
 * weekend out at some point, against roughly one driver in ten in the 2020s -
 * which is about what an appendix and a stewards' ban come to nowadays.
 */
const absenceChanceFor = (era) => clamp(0.55 - era.finishRate * 0.5, 0.03, 0.35);

/** How much slower the reserve is than the driver whose seat they are keeping warm. */
const RESERVE_GAP = 14;

const reserveFor = (entrant, stream) =>
  toEntrant({
    id: `${entrant.id}::reserve`,
    driverName: `${stream.pick(ROOKIE_FIRST_NAMES)} ${stream.pick(ROOKIE_SURNAMES)}`,
    teamName: entrant.teamName,
    teamId: entrant.teamId,
    carRating: entrant.carRating,
    reliability: entrant.reliability,
    developmentSlope: entrant.developmentSlope,
    powerBias: entrant.powerBias,
    aeroBias: entrant.aeroBias,
    attributes: deriveAttributes({
      name: `${entrant.driverName} reserve`,
      rating: clamp(entrant.driverRating - RESERVE_GAP, 38, 90),
      age: 24,
    }),
  });

/**
 * Who is not on the grid, and who takes the seat.
 *
 * A constructors' championship is what a car scored; a drivers' championship is
 * what a person scored. Lauda missed two Grands Prix in 1976, lost the title by
 * one point, and Ferrari won the constructors' anyway because his car kept
 * racing without him. That gap between the two titles has to be able to open,
 * and a seat that never falls empty cannot open it.
 *
 * The player is never included: losing races without being told would read as a
 * bug rather than as a season.
 */
export const buildAbsences = ({ entrants, raceCount, era, seed, year }) => {
  const missedRounds = new Map();
  const coverRounds = new Map();
  const reserves = [];

  if (raceCount < 3) return { missedRounds, coverRounds, reserves };

  const chance = absenceChanceFor(era);

  entrants.forEach((entrant) => {
    if (entrant.isPlayer) return;

    const stream = substream(seed, "absence", year, entrant.id);
    if (!stream.chance(chance)) return;

    const spell = stream.int(1, Math.min(3, raceCount - 1));
    const from = stream.int(0, raceCount - spell);
    const rounds = new Set();
    for (let round = from; round < from + spell; round += 1) rounds.add(round);

    const reserve = reserveFor(entrant, stream);
    missedRounds.set(entrant.id, rounds);
    coverRounds.set(reserve.id, rounds);
    reserves.push(reserve);
  });

  return { missedRounds, coverRounds, reserves };
};

export const buildSeasonField = ({ world, player, teamId }) => {
  const entrants = [];
  let displaced = null;
  let teammate = null;

  world.teams.forEach((team) => {
    const { powerBias, aeroBias } = carBiases(team.name, world.year);
    const seats = team.drivers.slice(0, 2);

    if (team.id === teamId) {
      // Whoever was slower on paper loses the seat; if the team only ran one
      // car, the player simply becomes the second entry.
      const ordered = [...seats].sort((a, b) => b.rating - a.rating);
      const kept = ordered[0] ?? null;
      displaced = ordered[1] ?? null;

      if (kept) {
        teammate = kept;
        entrants.push(
          toEntrant({
            id: `${team.id}::${kept.id}`,
            driverName: kept.name,
            teamName: team.name,
            teamId: team.id,
            carRating: team.carRating,
            reliability: team.reliability,
            developmentSlope: team.developmentSlope,
            powerBias,
            aeroBias,
            attributes: deriveAttributes({ name: kept.name, rating: kept.rating, age: kept.age }),
          }),
        );
      }

      entrants.push(
        toEntrant({
          id: "player",
          driverName: player.name,
          teamName: team.name,
          teamId: team.id,
          carRating: team.carRating,
          reliability: team.reliability,
          // A driver who gives good feedback pulls their own car forward across
          // the season. This is the only place `technical` pays out, and it is
          // worth more than any single-race skill.
          developmentSlope: team.developmentSlope + (player.attributes.technical - 55) * 0.045,
          powerBias,
          aeroBias,
          attributes: player.attributes,
          isPlayer: true,
        }),
      );
      return;
    }

    seats.forEach((driver) => {
      entrants.push(
        toEntrant({
          id: `${team.id}::${driver.id}`,
          driverName: driver.name,
          teamName: team.name,
          teamId: team.id,
          carRating: team.carRating,
          reliability: team.reliability,
          developmentSlope: team.developmentSlope,
          powerBias,
          aeroBias,
          attributes: deriveAttributes({ name: driver.name, rating: driver.rating, age: driver.age }),
        }),
      );
    });
  });

  return { entrants, displaced, teammate };
};

/**
 * Preseason focus also nudges how the player races, not only how they train.
 * Small values: this is a tilt, not a cheat code.
 */
const strategyBiasFor = (focus) => {
  switch (focus) {
    case "consistency":
      return 0.8;
    case "racecraft":
      return 1.3;
    case "qualifying":
      return 0.4;
    default:
      return 0.6;
  }
};

export const simulateSeason = ({ world, player, teamId, focus, seed }) => {
  const { entrants: regulars, displaced, teammate } = buildSeasonField({ world, player, teamId });
  const stream = substream(seed, "season", world.year);
  const raceCount = world.races.length || 1;

  const { missedRounds, coverRounds, reserves } = buildAbsences({
    entrants: regulars,
    raceCount,
    era: world.era,
    seed,
    year: world.year,
  });
  const entrants = [...regulars, ...reserves];

  /** The grid that actually turns up to one round. */
  const fieldForRound = (round) =>
    reserves.length === 0
      ? entrants
      : entrants.filter((entrant) => {
          const missing = missedRounds.get(entrant.id);
          if (missing) return !missing.has(round);
          const covering = coverRounds.get(entrant.id);
          return covering ? covering.has(round) : true;
        });

  const strategyBias = { player: strategyBiasFor(focus) };

  const perRacePoints = {};
  const tally = {};
  const constructorTally = {};
  const raceResults = [];

  entrants.forEach((entrant) => {
    tally[entrant.id] = {
      entrantId: entrant.id,
      driver: entrant.driverName,
      team: entrant.teamName,
      teamId: entrant.teamId,
      isPlayer: Boolean(entrant.isPlayer),
      points: 0,
      wins: 0,
      podiums: 0,
      poles: 0,
      fastestLaps: 0,
      finishes: 0,
      retirements: 0,
      bestFinish: null,
    };
    perRacePoints[entrant.id] = [];
  });

  world.races.forEach((race, index) => {
    const raceStream = substream(seed, "race", world.year, race.round ?? index);
    const seasonProgress = raceCount > 1 ? index / (raceCount - 1) : 0.5;

    const result = simulateRace({
      race,
      era: world.era,
      entrants: fieldForRound(index),
      seasonProgress,
      stream: raceStream,
      strategyBias,
    });

    const pole = result.grid[0];
    if (pole && tally[pole.entrantId]) tally[pole.entrantId].poles += 1;
    if (result.fastestLap && tally[result.fastestLap.entrantId]) {
      tally[result.fastestLap.entrantId].fastestLaps += 1;
    }

    result.classification.forEach((row) => {
      const record = tally[row.entrantId];
      if (!record) return;
      if (row.status === "finished") {
        record.finishes += 1;
        if (row.position === 1) record.wins += 1;
        if (row.position <= 3) record.podiums += 1;
        record.bestFinish =
          record.bestFinish === null ? row.position : Math.min(record.bestFinish, row.position);
      } else {
        record.retirements += 1;
      }
    });

    entrants.forEach((entrant) => {
      const scored = result.points[entrant.id] || 0;
      perRacePoints[entrant.id].push(scored);
      constructorTally[entrant.teamId] = (constructorTally[entrant.teamId] || 0) + scored;
    });

    raceResults.push(summariseRace(result));
  });

  // Dropped scores: before 1991 only a driver's best results counted, and it
  // changed championships - Prost out-scored Senna in 1988 and lost.
  const counting = countingRoundsFor(world.year, raceCount);
  Object.keys(tally).forEach((entrantId) => {
    const scores = [...perRacePoints[entrantId]].sort((a, b) => b - a);
    tally[entrantId].points = scores.slice(0, counting).reduce((sum, value) => sum + value, 0);
    tally[entrantId].grossPoints = scores.reduce((sum, value) => sum + value, 0);
    tally[entrantId].droppedPoints = tally[entrantId].grossPoints - tally[entrantId].points;
  });

  const standings = Object.values(tally).sort(compareStandings);
  standings.forEach((row, index) => {
    row.position = index + 1;
  });

  const constructorStandings = world.teams
    .map((team) => ({
      teamId: team.id,
      team: team.name,
      points: constructorTally[team.id] || 0,
      carRating: team.carRating,
    }))
    .sort((a, b) => b.points - a.points)
    .map((row, index) => ({ ...row, position: index + 1 }));

  const playerRow = standings.find((row) => row.isPlayer) || null;
  const teammateRow = teammate
    ? standings.find((row) => row.entrantId === `${teamId}::${teammate.id}`) || null
    : null;

  return {
    year: world.year,
    generated: world.generated,
    raceCount,
    countingRounds: counting,
    races: raceResults,
    standings,
    constructorStandings,
    champion: standings[0] || null,
    constructorChampion: constructorStandings[0] || null,
    player: playerSeasonStats({ playerRow, raceResults, world, teamId }),
    teammate: teammateRow,
    teammateName: teammate?.name ?? null,
    displaced: displaced?.name ?? null,
    wetRaces: raceResults.filter((race) => race.weather !== WEATHER.DRY).length,
    seed,
    stream,
  };
};

const compareStandings = (a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.podiums !== a.podiums) return b.podiums - a.podiums;
  return (a.bestFinish ?? 99) - (b.bestFinish ?? 99);
};

const summariseRace = (result) => ({
  round: result.race.round,
  name: result.race.name,
  country: result.race.country,
  weather: result.weather,
  winner: result.finishers[0]?.driver ?? null,
  winnerTeam: result.finishers[0]?.team ?? null,
  pole: result.grid[0]?.driver ?? null,
  fastestLap: result.fastestLap?.driver ?? null,
  podium: result.finishers.slice(0, 3).map((row) => row.driver),
  player: (() => {
    const row = result.classification.find((entry) => entry.isPlayer);
    if (!row) return null;
    return {
      grid: row.grid,
      position: row.status === "finished" ? row.position : null,
      status: row.status,
      points: result.points.player || 0,
      fastestLap: Boolean(result.fastestLap?.isPlayer),
      pole: Boolean(result.grid[0]?.isPlayer),
    };
  })(),
});

/**
 * The player's year, in the numbers the summary screen shows.
 *
 * `seasonScore` is the one derived value that matters beyond display: it is how
 * well the driver did *relative to the car they had*, and it is what growth,
 * contract renewals and the press all read. Finishing eighth in the eighth-best
 * car is a neutral season; finishing eighth in the worst car is a great one.
 */
const playerSeasonStats = ({ playerRow, raceResults, world, teamId }) => {
  if (!playerRow) return null;

  const team = world.teams.find((entry) => entry.id === teamId);
  const carRank = world.teams.findIndex((entry) => entry.id === teamId) + 1;
  const teamCount = world.teams.length || 1;

  const starts = raceResults.filter((race) => race.player).length;
  const points = playerRow.points;

  // Where the car alone should have put you, in championship terms.
  const expectedPosition = clamp(carRank * 2 - 0.5, 1, teamCount * 2);
  const actualPosition = playerRow.position;
  const overperformance = expectedPosition - actualPosition;

  const seasonScore = clamp(0.45 + overperformance * 0.06, 0, 1);

  return {
    position: actualPosition,
    points,
    grossPoints: playerRow.grossPoints,
    droppedPoints: playerRow.droppedPoints,
    starts,
    wins: playerRow.wins,
    podiums: playerRow.podiums,
    poles: playerRow.poles,
    fastestLaps: playerRow.fastestLaps,
    retirements: playerRow.retirements,
    bestFinish: playerRow.bestFinish,
    team: team?.name ?? null,
    teamId,
    carRank,
    teamCount,
    expectedPosition,
    overperformance,
    seasonScore,
    champion: actualPosition === 1,
  };
};

export { overallOf };
