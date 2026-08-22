/**
 * The world a season is raced in.
 *
 * Turns the f1db bootstrap into something the race engine can drive: for a given
 * year, the real calendar, the real teams, the real line-ups, and - the part that
 * takes actual work - an honest number for how fast each car was and how good each
 * driver was *that year*, not across their whole career.
 *
 * Two things this module refuses to do naively:
 *
 * 1. Championship points are not pace. A 2016 Manor scored 1 point to Mercedes'
 *    765, and it was not 765 times slower; it was about 3% slower. So points are
 *    mapped onto a compressed pace scale whose width depends on the era, because
 *    the spread between first and last really was much wider in 1954 than in 2019.
 *
 * 2. A career rating is not a season rating. The bootstrap rates Fangio on his
 *    whole career, which would make him a five-time champion in his rookie year
 *    and still one at 46. Ratings are bent through an age/experience curve and
 *    nudged by what the driver actually did that season.
 *
 * Past the last year the caches cover, `generateFutureSeason` keeps the world
 * running: cars drift, regulations reset the order every few years, drivers age
 * out and rookies come up.
 */

import { clamp, createStream, lerp, substream } from "./rng.js";
import { eraProfileFor } from "./eras.js";
import { circuitProfile } from "./circuits.js";

const DEFAULT_RATING = 58;
const PEAK_AGE = 30;

/** Normalise whatever the endpoint (or the offline fallback) handed us. */
export const prepareBootstrap = (data, { fallbackMode = false } = {}) => {
  const racesByYear = data?.racesByYear || {};
  const seasonYears = (data?.seasonYears || Object.keys(racesByYear).map(Number))
    .map(Number)
    .filter((year) => Number.isFinite(year) && year >= 1950)
    .sort((a, b) => a - b);

  return {
    fallbackMode,
    dataSource: data?.dataSource || "fallback",
    seasonYears,
    firstYear: seasonYears[0] ?? 1950,
    lastDataYear: seasonYears[seasonYears.length - 1] ?? 2024,
    decades: data?.decades || buildDecades(seasonYears),
    racesByYear,
    lineupsByYear: data?.lineupsByYear || {},
    constructorStandingsByYear: data?.constructorStandingsByYear || {},
    championsByYear: data?.championsByYear || {},
    constructorChampionsByYear: data?.constructorChampionsByYear || {},
    winsBySeason: data?.winsBySeason || {},
    podiumsBySeason: data?.podiumsBySeason || {},
    driverProfiles: indexProfiles(data?.driverProfiles || []),
    recordBook: data?.recordBook || { titles: [], wins: [], podiums: [], seasons: [] },
  };
};

const indexProfiles = (profiles) => {
  const byName = {};
  profiles.forEach((profile) => {
    byName[profile.name] = profile;
  });
  return byName;
};

const buildDecades = (years) => {
  const decades = [];
  const seen = new Set();
  years.forEach((year) => {
    const from = Math.floor(year / 10) * 10;
    const key = `${from}s`;
    if (seen.has(key)) return;
    seen.add(key);
    decades.push({ key, label: key, from, to: from + 9 });
  });
  return decades;
};

/** Decades that actually have a playable season behind them. */
export const playableDecades = (bootstrap) =>
  (bootstrap.decades || []).filter((decade) =>
    bootstrap.seasonYears.some((year) => year >= decade.from && year <= decade.to));

export const yearsInDecade = (bootstrap, decade) =>
  bootstrap.seasonYears.filter((year) => year >= decade.from && year <= decade.to);

// ---------------------------------------------------------------- car strength

/**
 * How wide the field was, in pace points, between the best car and the worst.
 *
 * The 1950s ran works Ferraris against privateer Maseratis two seconds a lap
 * slower; a 2020 grid fits inside about two and a half percent. Everything in
 * between interpolates.
 */
const fieldSpreadFor = (year) => clamp(lerp(46, 22, (year - 1950) / 75), 20, 48);

const carBaseFor = (year) => clamp(lerp(48, 68, (year - 1950) / 75), 46, 70);

/**
 * Map a constructor championship result onto a pace rating.
 *
 * Rank and points say different things and both matter: rank knows the running
 * order, points know whether second was a close second or a distant one. Points
 * go through a square root first, which is the crude but effective way to undo
 * how badly a points table exaggerates the gap to the back of the grid.
 */
const carRatingFromStanding = ({ year, position, points, topPoints, teamCount }) => {
  const spread = fieldSpreadFor(year);
  const base = carBaseFor(year);

  const rankScore = teamCount > 1 ? 1 - (position - 1) / (teamCount - 1) : 0.5;
  const pointsScore = topPoints > 0 ? Math.sqrt(clamp(points / topPoints, 0, 1)) : rankScore;

  const blended = clamp(0.42 * rankScore + 0.58 * pointsScore, 0, 1);
  return clamp(base + spread * blended, 30, 100);
};

/**
 * Car strength for a season with no constructors' championship behind it.
 *
 * The title was not awarded until 1958, and a few minor entrants never appear in
 * it afterwards. Falling back on the team's career reputation gets those years
 * badly wrong - it makes Ferrari the class of 1955, when the season belonged to
 * Mercedes - so the real per-season record is used instead: how many races that
 * team's drivers actually won that year, taken from f1db.
 *
 * Wins alone cannot separate the two thirds of the grid that never won anything,
 * so career reputation still carries the rest.
 */
const carRatingFromSeasonWins = ({ year, teamWins, topTeamWins, careerRating }) => {
  const spread = fieldSpreadFor(year);
  const base = carBaseFor(year);

  const winScore = topTeamWins > 0 ? Math.sqrt(clamp(teamWins / topTeamWins, 0, 1)) : 0;
  const reputationScore = clamp((careerRating - 45) / 45, 0, 1);

  const blended = clamp(0.62 * winScore + 0.38 * reputationScore, 0, 1);
  return clamp(base + spread * blended, 30, 100);
};

/**
 * Reliability as its own axis. A car can be quick and fragile (Lotus 1988,
 * Renault 1983) and the standings alone will not tell you which.
 *
 * Two terms on top of the era baseline. The first is the front-of-grid effect:
 * a works team with the budget to build the fastest car also has the budget to
 * make it last, and it is a big effect - the 1988 McLarens finished almost
 * everything in a season where half the field did not. The second is a stable
 * per-team offset, which is what leaves room for the quick-and-fragile car.
 *
 * `meanCarRating` is the field's own average, so the era's overall finish rate
 * comes out where the historical record says it should instead of drifting up.
 */
const reliabilityFor = ({ year, carRating, meanCarRating, stream }) => {
  const era = eraProfileFor(year);
  const fromPace = (carRating - meanCarRating) * 0.009;
  const teamOffset = stream.normal(0, 0.06);
  return clamp(era.finishRate + fromPace + teamOffset, 0.28, 0.985);
};

// ------------------------------------------------------------- driver strength

/**
 * How much of a season rating comes from that season rather than the career.
 *
 * Not 1: one year of podiums is a small sample, and the career rating carries
 * everything the podium count cannot see - a driver dragging a bad car into
 * seventh every Sunday scores nothing and is still the best driver on the grid.
 */
const SEASON_WEIGHT = 0.45;

/** The most a bad season may take off a reputation. Results cut deeper up than down. */
const SEASON_FLOOR = 0.85;

/**
 * What a season's own record says about a driver, 0..1.
 *
 * Two halves, because either alone lies. The rate is how often they were on the
 * podium, which knows the level but is half the car. The share is how much of
 * their own team's podium haul was theirs, which knows nothing about the level
 * but is the only car-neutral number in Formula 1: a team-mate is the one rival
 * with identical machinery.
 */
const seasonFormScore = ({ seasonWins, seasonPodiums, driverRaces, teamPodiums }) => {
  const podiumRate = clamp(seasonPodiums / driverRaces, 0, 1);
  const winRate = clamp(seasonWins / driverRaces, 0, 1);
  const level = 0.62 * Math.sqrt(podiumRate) + 0.38 * Math.sqrt(winRate);
  const share = clamp(seasonPodiums / teamPodiums, 0, 1);

  return clamp(0.55 * level + 0.45 * share, 0, 1);
};

/**
 * A driver's rating in one specific season.
 *
 * `career` is what the bootstrap knows about them across everything they ever
 * did. Four corrections turn that into a number for one year:
 *
 *   experience  rookies are not their career selves. Ramps over the first four
 *               seasons, which is roughly how long real drivers take to arrive.
 *   age         the peak sits at 30 with a gentle decline after; before that,
 *               raw speed is already there and racecraft is not.
 *   form        what they actually did that year, from the podium tables. A
 *               career rating is built out of a whole career, so it cannot
 *               describe a driver who has not had one yet - Piastri won two
 *               races in 2024 with the career record of a second-year driver,
 *               and without this the fastest car on the grid was handed the two
 *               worst-rated drivers in the field.
 *   evidence    a season only counts for as much of it as the driver started,
 *               and only when their team scored a podium at all. No podiums
 *               anywhere is not evidence about the driver; it is evidence about
 *               the car, and `carRating` already carries that.
 */
export const seasonDriverRating = ({
  careerRating,
  seasonsRaced,
  age,
  seasonWins = 0,
  seasonPodiums = 0,
  driverRaces = 0,
  seasonRaces = 0,
  teamPodiums = 0,
  stream,
}) => {
  const experience = clamp(0.82 + 0.045 * Math.min(seasonsRaced, 4), 0.82, 1);

  let ageCurve;
  if (age <= PEAK_AGE) {
    ageCurve = lerp(0.9, 1, clamp((age - 20) / (PEAK_AGE - 20), 0, 1));
  } else {
    ageCurve = clamp(1 - (age - PEAK_AGE) * 0.012, 0.78, 1);
  }

  const reputation = careerRating * experience * ageCurve;
  const noise = stream ? stream.normal(0, 1.1) : 0;

  const hasEvidence = teamPodiums > 0 && driverRaces > 0;
  if (!hasEvidence) return clamp(reputation + noise, 38, 99);

  const form = seasonFormScore({ seasonWins, seasonPodiums, driverRaces, teamPodiums });
  const fromSeason = 46 + 53 * form;

  const started = seasonRaces > 0 ? clamp(driverRaces / seasonRaces, 0, 1) : 1;
  const weight = SEASON_WEIGHT * started;
  const blended = reputation + (fromSeason - reputation) * weight;

  return clamp(Math.max(blended, reputation * SEASON_FLOOR) + noise, 38, 99);
};

const ageOf = (profile, year) => {
  if (!profile?.firstYear) return 27;
  // f1db gives no birth dates in the caches, so debut age stands in: most
  // drivers arrive at about 23, and the error washes out inside the age curve.
  return clamp(23 + (year - profile.firstYear), 18, 48);
};

// ------------------------------------------------------------------ the season

/**
 * Everything about one season of racing: calendar, teams, cars, drivers.
 *
 * Pure given (bootstrap, year, seed) - the same three inputs always produce the
 * same world, which is what makes a save reloadable.
 */
export const buildSeasonWorld = ({ bootstrap, year, seed = "trayectoria" }) => {
  const key = String(year);
  const era = eraProfileFor(year);

  const races = (bootstrap.racesByYear[key] || []).map((race, index) => ({
    round: race.round ?? index + 1,
    name: race.name,
    country: race.country ?? circuitProfile(race.name).country,
    profile: circuitProfile(race.name),
  }));

  const standings = bootstrap.constructorStandingsByYear[key] || [];
  const topPoints = standings.reduce((max, row) => Math.max(max, row.points || 0), 0);
  const standingByTeam = {};
  standings.forEach((row) => {
    standingByTeam[row.team] = row;
  });

  const lineups = (bootstrap.lineupsByYear[key] || []).filter(
    (entry) => (entry.races || 0) > 0 && (entry.drivers || []).length > 0,
  );

  // Car strength is settled for the whole grid first, because reliability is
  // relative to the field: "fast for this year" is what buys you a car that
  // lasts, and that only means something once every car has a number.
  const winsThisYear = (entry) =>
    (entry.drivers || []).reduce(
      (sum, driver) => sum + Number(bootstrap.winsBySeason?.[driver.name]?.[key] || 0),
      0,
    );

  const teamWins = lineups.map(winsThisYear);
  const topTeamWins = teamWins.reduce((max, wins) => Math.max(max, wins), 0);

  // A team's podium haul is the denominator that turns a driver's podiums into
  // the one car-neutral number available: their share against their team-mate.
  const podiumsThisYear = (entry) =>
    (entry.drivers || []).reduce(
      (sum, driver) => sum + Number(bootstrap.podiumsBySeason?.[driver.name]?.[key] || 0),
      0,
    );

  const carRatings = lineups.map((entry, index) => {
    const standing = standingByTeam[entry.team];
    return standing
      ? carRatingFromStanding({
          year,
          position: standing.position || standings.length,
          points: standing.points || 0,
          topPoints,
          teamCount: standings.length,
        })
      : carRatingFromSeasonWins({
          year,
          teamWins: teamWins[index],
          topTeamWins,
          careerRating: entry.rating ?? DEFAULT_RATING,
        });
  });

  /**
 * How sure we are of a car rating, in rating points.
 *
 * A constructors' classification is the result of one season, not a measurement
 * of a car: 2008 separated Ferrari and McLaren by twenty-one points across
 * eighteen races, which is a handful of laps and one wet afternoon. Drawing the
 * rating with this much uncertainty per career is what lets a season that close
 * fall the other way sometimes, while leaving a fifteen-point gap - 1988, 1955 -
 * exactly where the record put it.
 */
const CAR_UNCERTAINTY = 1.6;

const meanCarRating =
    carRatings.reduce((sum, rating) => sum + rating, 0) / Math.max(1, carRatings.length);

  const teams = lineups
    .map((entry, index) => {
      const teamStream = substream(seed, "team", year, entry.team);
      const standing = standingByTeam[entry.team];
      const carRating = clamp(carRatings[index] + teamStream.normal(0, CAR_UNCERTAINTY), 30, 100);

      const teamPodiums = podiumsThisYear(entry);
      const drivers = (entry.drivers || [])
        .slice(0, 3)
        .map((driver) =>
          buildSeasonDriver({
            bootstrap,
            driver,
            year,
            seed,
            teamPodiums,
            seasonRaces: races.length,
          }));

      return {
        id: entry.id || slug(entry.team),
        name: entry.team,
        carRating,
        reliability: reliabilityFor({ year, carRating, meanCarRating, stream: teamStream }),
        // How much the car improves or fades across the year. Real development
        // races are won and lost on this; it is why a season is not 20 copies of
        // the first race.
        developmentSlope: teamStream.normal(0, 2.4),
        standingPosition: standing?.position ?? null,
        realPoints: standing?.points ?? null,
        drivers,
      };
    })
    .sort((a, b) => b.carRating - a.carRating);

  return { year, era, races, teams, generated: false };
};

const buildSeasonDriver = ({ bootstrap, driver, year, seed, teamPodiums = 0, seasonRaces = 0 }) => {
  const profile = bootstrap.driverProfiles[driver.name];
  const age = ageOf(profile, year);
  const seasonsRaced = profile ? clamp(year - profile.firstYear, 0, 25) : 3;
  const seasonWins = Number(bootstrap.winsBySeason?.[driver.name]?.[String(year)] || 0);
  const seasonPodiums = Number(bootstrap.podiumsBySeason?.[driver.name]?.[String(year)] || 0);
  const stream = substream(seed, "driver", year, driver.name);

  return {
    id: slug(driver.name),
    name: driver.name,
    age,
    rating: seasonDriverRating({
      careerRating: driver.rating ?? DEFAULT_RATING,
      seasonsRaced,
      age,
      seasonWins,
      seasonPodiums,
      driverRaces: driver.races ?? 0,
      seasonRaces,
      teamPodiums,
      stream,
    }),
    careerRating: driver.rating ?? DEFAULT_RATING,
    races: driver.races ?? 0,
    real: true,
  };
};

// ------------------------------------------------------------- generated years

export const ROOKIE_FIRST_NAMES = [
  "Luca", "Mateo", "Elias", "Noah", "Kai", "Nico", "Tomas", "Arthur", "Rafael", "Jonas",
  "Diego", "Milan", "Oskar", "Felix", "Ruben", "Leon", "Marcus", "Aiden", "Enzo", "Ivan",
];

export const ROOKIE_SURNAMES = [
  "Vanterpool", "Okafor", "Bergqvist", "Lindqvist", "Marchetti", "Delacroix", "Kowalski",
  "Sorensen", "Navarro", "Yamashita", "Van Dijk", "Ferreira", "Nakamura", "Antonelli",
  "Brandt", "Oliveira", "Ricciardi", "Halvorsen", "Castillo", "Duval",
];

/**
 * The next season, when history has run out.
 *
 * Cars mean-revert towards the middle with a random shock, which is what stops a
 * generated future from freezing into one dynasty; every fourth or fifth year a
 * regulation change scrambles the order much harder, the way 2009, 2014 and 2022
 * did. Drivers age, the oldest retire, and rookies come up to fill the seats.
 */
export const generateFutureSeason = ({ previousWorld, year, seed = "trayectoria" }) => {
  const era = eraProfileFor(year);
  const regulationReset = year % 5 === 0;
  const shock = regulationReset ? 9.5 : 3.4;

  const teams = previousWorld.teams.map((team) => {
    const teamStream = substream(seed, "future-team", year, team.name);
    const meanReversion = (72 - team.carRating) * (regulationReset ? 0.35 : 0.12);
    const carRating = clamp(team.carRating + meanReversion + teamStream.normal(0, shock), 34, 99);

    const drivers = team.drivers.map((driver) => ageDriver(driver, year, teamStream));

    return {
      ...team,
      carRating,
      reliability: clamp(team.reliability + teamStream.normal(0, 0.03), 0.35, 0.99),
      developmentSlope: teamStream.normal(0, 2.4),
      standingPosition: null,
      realPoints: null,
      drivers: replaceRetired(drivers, teamStream, year),
    };
  });

  // The calendar of a generated year reuses the last real one: those are the
  // circuits the sport was visiting when the data ran out, which is a better
  // guess than inventing venues.
  const races = previousWorld.races.map((race, index) => ({ ...race, round: index + 1 }));

  return {
    year,
    era,
    races,
    teams: teams.sort((a, b) => b.carRating - a.carRating),
    generated: true,
    regulationReset,
  };
};

const ageDriver = (driver, year, stream) => {
  const age = driver.age + 1;
  const seasonsRaced = (driver.seasonsRaced ?? 3) + 1;
  return {
    ...driver,
    age,
    seasonsRaced,
    rating: seasonDriverRating({
      careerRating: driver.careerRating,
      seasonsRaced,
      age,
      seasonWins: 0,
      stream,
    }),
    real: false,
  };
};

const replaceRetired = (drivers, stream, year) =>
  drivers.map((driver) => {
    const retiring = driver.age >= 38 || (driver.age >= 34 && stream.chance(0.22));
    return retiring ? generateRookie(stream, year) : driver;
  });

const generateRookie = (stream, year) => {
  const name = `${stream.pick(ROOKIE_FIRST_NAMES)} ${stream.pick(ROOKIE_SURNAMES)}`;
  const careerRating = clamp(stream.normal(64, 7), 48, 88);
  return {
    id: `${slug(name)}-${year}`,
    name,
    age: stream.int(19, 23),
    seasonsRaced: 0,
    careerRating,
    rating: seasonDriverRating({ careerRating, seasonsRaced: 0, age: 21, seasonWins: 0, stream }),
    races: 0,
    real: false,
    rookie: true,
  };
};

// --------------------------------------------------------------------- helpers

export const slug = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * The world of any year, real or generated. Generated years chain off the last
 * real one, so a career that runs past the data keeps a coherent grid instead of
 * restarting from nothing.
 */
export const worldForYear = ({ bootstrap, year, seed, cache = {} }) => {
  if (cache[year]) return cache[year];

  if (year <= bootstrap.lastDataYear && bootstrap.racesByYear[String(year)]) {
    const world = buildSeasonWorld({ bootstrap, year, seed });
    cache[year] = world;
    return world;
  }

  const previous = worldForYear({ bootstrap, year: year - 1, seed, cache });
  const world = generateFutureSeason({ previousWorld: previous, year, seed });
  cache[year] = world;
  return world;
};

/** Ranked view of the grid, best car first - what an offer screen wants. */
export const teamTiers = (world) => {
  const sorted = [...world.teams].sort((a, b) => b.carRating - a.carRating);
  const count = sorted.length || 1;
  return sorted.map((team, index) => ({
    ...team,
    tierIndex: index,
    tier: index < count * 0.2 ? "top" : index < count * 0.55 ? "midfield" : "backmarker",
  }));
};

export { createStream };
