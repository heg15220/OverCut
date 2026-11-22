/**
 * The paddock of one season, as a team principal sees it.
 *
 * Built on top of Trayectoria's world: its car ratings (constructors' points
 * turned into pace, era by era) and its season ratings for every driver are the
 * honest part and are reused as they are. On top of that this module adds what a
 * manager needs and a driver never did:
 *
 *   - each car split into aero, power, chassis and reliability;
 *   - the money a team has, from how prestigious it is;
 *   - every driver's real age (f1db birth dates) and a contract whose length is
 *     how long they really stayed at that team;
 *   - a market: drivers without a seat who raced recently, and the real drivers
 *     who will debut in the next few seasons, at the age they were then;
 *   - the real calendar with dates, distances and lap times.
 *
 * The 1950s championship counted the Indianapolis 500, which the Formula 1 teams
 * did not race. Its one-off American entries would turn a manager's grid into
 * forty teams, so the Indy 500 is left out of the calendar and of the grid.
 */

import { clamp, substream } from "../../overcutTrayectoria/engine/rng";
import { buildSeasonWorld, seasonDriverRating, slug } from "../../overcutTrayectoria/engine/world";
import { eraProfileFor } from "../../overcutTrayectoria/engine/eras";
import { circuitProfile } from "../../overcutTrayectoria/engine/circuits";
import { deriveAttributes, overallOf } from "../../overcutTrayectoria/engine/attributes";
import { carFromRating, carRatingOf } from "./car";
import { driverSalary } from "./economy";
import { shortCode, teamIdentity } from "./identity";
import { inventPerson } from "./names";

const EXCLUDED_RACES = new Set(["Indianapolis 500"]);
const MAX_POOL = 14;

/** Names whose prestige is older than any single season. */
const LEGACY = {
  Ferrari: 0.34, McLaren: 0.24, Mercedes: 0.24, Williams: 0.2, "Red Bull": 0.18, "Team Lotus": 0.2, Lotus: 0.14,
  Brabham: 0.14, Renault: 0.14, Maserati: 0.16, "Alfa Romeo": 0.12, BRM: 0.1, Cooper: 0.12, Tyrrell: 0.1,
  Benetton: 0.1, Ligier: 0.06, Vanwall: 0.08, Matra: 0.06, Jordan: 0.05, "Aston Martin": 0.1, Honda: 0.1, Toyota: 0.1,
  "BMW Sauber": 0.08, Sauber: 0.04, Brawn: 0.08, "Alpine F1 Team": 0.1, "Force India": 0.02, "Haas F1 Team": 0.02,
};

// ------------------------------------------------------------- reference

/** Index the generated f1db tables once per session. */
export const prepareReference = (reference) => {
  const racesByYear = {};
  Object.entries(reference?.races || {}).forEach(([year, races]) => {
    const byName = {};
    races.forEach(([name, date, laps, avgLap, circuit, location]) => {
      byName[name] = { date, laps, avgLap, circuit, location };
    });
    racesByYear[year] = byName;
  });
  return { drivers: reference?.drivers || {}, constructors: reference?.constructors || {}, racesByYear, source: reference?.source };
};

const emptyReference = { drivers: {}, constructors: {}, racesByYear: {} };

/** A lap time for a venue with no record: modern circuits sit near 90 s, old ones far longer. */
const guessBaseLap = (year) => clamp(130 - (year - 1950) * 0.55, 82, 130);

const pad = (value) => String(value).padStart(2, "0");

/**
 * Spread a calendar with no dates across the racing months of its era, so a
 * generated year or an offline season still has a shape on the calendar.
 */
const fallbackDate = (year, index, count) => {
  const startMonth = year < 1960 ? 5 : 3;
  const endMonth = year < 1960 ? 9 : year < 2000 ? 10 : 11;
  const span = (endMonth - startMonth) * 30 + 20;
  const day = Math.round(index * (span / Math.max(1, count - 1)));
  const month = startMonth + Math.floor(day / 30);
  return `${pad(Math.min(12, month))}-${pad(Math.min(28, (day % 30) + 1))}`;
};

export const seasonCalendar = ({ bootstrap, reference = emptyReference, year }) => {
  const names = (bootstrap.racesByYear[String(year)] || []).map((race) => race.name).filter((name) => !EXCLUDED_RACES.has(name));
  const known = reference.racesByYear[String(year)] || {};
  return names.map((name, index) => {
    const facts = known[name] || {};
    const profile = circuitProfile(name);
    const avgLap = facts.avgLap && facts.avgLap > 40 ? facts.avgLap : guessBaseLap(year);
    return {
      round: index + 1,
      name,
      country: profile.country,
      date: `${year}-${facts.date || fallbackDate(year, index, names.length)}`,
      // The winner's average includes the stops and the safety cars; a clean lap is a touch quicker.
      baseLap: Math.round(avgLap * 0.985 * 100) / 100,
      laps: facts.laps > 0 ? facts.laps : Math.max(20, Math.round(305 / Math.max(3, (avgLap / 90) * 5))),
      circuit: facts.circuit || null,
      location: facts.location || null,
      profile: {
        overtaking: profile.overtaking, power: profile.power, aero: profile.aero, attrition: profile.attrition,
        rain: profile.rain, prestige: profile.prestige,
      },
    };
  });
};

// ---------------------------------------------------------------- people

const ageFrom = ({ name, year, reference, profile }) => {
  const born = reference.drivers[name]?.[1];
  if (born) return clamp(year - born, 16, 55);
  if (profile?.firstYear) return clamp(23 + (year - profile.firstYear), 17, 48);
  return 26;
};

/**
 * How long a driver really stayed: the number of seasons after this one they
 * raced for the same team. That is their contract on day one.
 */
const realTenure = (bootstrap, teamName, driverName, year) => {
  let until = year;
  for (let next = year + 1; next <= year + 3; next += 1) {
    const lineup = bootstrap.lineupsByYear[String(next)] || [];
    const stays = lineup.some((entry) => entry.team === teamName && (entry.drivers || []).some((driver) => driver.name === driverName));
    if (!stays) break;
    until = next;
  }
  return until;
};

export const makeDriver = ({ name, rating, careerRating, age, nat = null, real = true, status = "free", year, teamId = null, until = null, salary = 0, seed, id }) => {
  const attributes = deriveAttributes({ name, rating, age });
  const stream = substream(seed || "drivers", "talent", name);
  // The ceiling a driver can still grow towards. Real careers say where it was.
  const talent = clamp(Math.max((careerRating ?? rating) + 2, rating + 1) + stream.normal(0, 1.2), 45, 98);
  return {
    id: id || slug(name),
    name,
    nat,
    age,
    real,
    attributes,
    talent: Math.round(talent * 10) / 10,
    rating: Math.round(overallOf(attributes) * 10) / 10,
    careerRating: careerRating ?? rating,
    morale: 70,
    status,
    teamId,
    contract: teamId ? { teamId, until: until ?? year, salary, role: "equal" } : null,
    since: year,
  };
};

export const refreshRating = (driver) => {
  driver.rating = Math.round(overallOf(driver.attributes) * 10) / 10;
  return driver;
};

/** The prestige of a team: this year's car and the weight of its name. */
export const prestigeFor = ({ name, rankScore }) => clamp(0.08 + rankScore * 0.6 + (LEGACY[name] ?? 0), 0.05, 1);

// ----------------------------------------------------------------- world

/**
 * Everything about one real season the manager can start in.
 */
export const buildManagerWorld = ({ bootstrap, reference: rawReference, year, seed = "manager" }) => {
  const reference = rawReference?.racesByYear ? rawReference : prepareReference(rawReference);
  const era = eraProfileFor(year);
  const races = seasonCalendar({ bootstrap, reference, year });
  const raceCount = races.length || 1;
  const historic = buildSeasonWorld({ bootstrap, year, seed });

  const lineups = (bootstrap.lineupsByYear[String(year)] || []).filter((entry) => (entry.races || 0) > 0);
  const lineupByTeam = Object.fromEntries(lineups.map((entry) => [entry.team, entry]));
  const minimumRaces = Math.max(2, Math.ceil(raceCount * 0.35));
  let historicTeams = historic.teams.filter((team) => (lineupByTeam[team.name]?.races || 0) >= minimumRaces);
  if (historicTeams.length < 6) {
    historicTeams = [...historic.teams].sort((a, b) => (lineupByTeam[b.name]?.races || 0) - (lineupByTeam[a.name]?.races || 0)).slice(0, 8);
  }

  // A driver who changed teams mid-season belongs to the one they raced most for.
  const home = {};
  lineups.forEach((entry) => {
    (entry.drivers || []).forEach((driver) => {
      const current = home[driver.name];
      if (!current || (driver.races || 0) > current.races) home[driver.name] = { team: entry.team, races: driver.races || 0 };
    });
  });

  const ranked = [...historicTeams].sort((a, b) => b.carRating - a.carRating);
  const teams = {};
  const drivers = {};

  ranked.forEach((team, index) => {
    const rankScore = ranked.length > 1 ? 1 - index / (ranked.length - 1) : 0.5;
    const prestige = prestigeFor({ name: team.name, rankScore });
    const id = team.id || slug(team.name);
    const identity = teamIdentity(team.name, year);
    const entry = lineupByTeam[team.name] || { drivers: [] };
    const racesOf = Object.fromEntries((entry.drivers || []).map((driver) => [driver.name, driver.races || 0]));

    const own = team.drivers
      .filter((driver) => home[driver.name]?.team === team.name && !drivers[slug(driver.name)])
      .sort((a, b) => (racesOf[b.name] || 0) - (racesOf[a.name] || 0));

    const seated = own.slice(0, 2).map((driver) => {
      const profile = bootstrap.driverProfiles[driver.name];
      const until = realTenure(bootstrap, team.name, driver.name, year);
      const made = makeDriver({
        name: driver.name,
        rating: driver.rating,
        careerRating: driver.careerRating,
        age: ageFrom({ name: driver.name, year, reference, profile }),
        nat: reference.drivers[driver.name]?.[0] || null,
        status: "grid",
        year,
        teamId: id,
        until,
        salary: driverSalary(driver.rating, prestige, year),
        seed,
      });
      drivers[made.id] = made;
      return made;
    });

    const reserve = own[2]
      ? (() => {
          const driver = own[2];
          const profile = bootstrap.driverProfiles[driver.name];
          const made = makeDriver({
            name: driver.name,
            rating: driver.rating,
            careerRating: driver.careerRating,
            age: ageFrom({ name: driver.name, year, reference, profile }),
            nat: reference.drivers[driver.name]?.[0] || null,
            status: "reserve",
            year,
            teamId: id,
            until: year,
            salary: Math.round(driverSalary(driver.rating, prestige, year) * 0.35),
            seed,
          });
          drivers[made.id] = made;
          return made.id;
        })()
      : null;

    // A clear gap between team-mates was a clear pecking order.
    if (seated.length === 2 && Math.abs(seated[0].rating - seated[1].rating) >= 4) {
      const [lead, support] = seated[0].rating > seated[1].rating ? seated : [seated[1], seated[0]];
      lead.contract.role = "first";
      support.contract.role = "second";
    }

    teams[id] = {
      id,
      name: team.name,
      short: shortCode(team.name),
      color: identity.color,
      color2: identity.color2,
      country: reference.constructors[team.name] || null,
      real: true,
      custom: false,
      car: carFromRating({ carRating: team.carRating, reliability: team.reliability, era, teamName: team.name, year }),
      devSlope: Math.round(team.developmentSlope * 100) / 100,
      prestige: Math.round(prestige * 100) / 100,
      drivers: seated.map((driver) => driver.id),
      reserve,
      realPosition: team.standingPosition ?? null,
      engine: null,
      facility: clamp(Math.round(1 + prestige * 4), 1, 5),
    };
  });

  const world = { year, races, teams, order: Object.keys(teams), drivers, generated: false };
  addMarketPool({ world, bootstrap, reference, year, seed });
  fillEmptySeats(world, year);
  return world;
};

/**
 * Drivers without a race seat: those who raced recently and are still young
 * enough, and the real names who are about to arrive.
 */
export const addMarketPool = ({ world, bootstrap, reference, year, seed }) => {
  const taken = new Set(Object.values(world.drivers).map((driver) => driver.name));
  const profiles = Object.values(bootstrap.driverProfiles || {});

  const veterans = profiles
    .filter((profile) => profile.firstYear < year && profile.lastYear >= year - 3 && !taken.has(profile.name))
    .map((profile) => ({ profile, age: ageFrom({ name: profile.name, year, reference, profile }) }))
    .filter(({ age }) => age <= 39)
    .map(({ profile, age }) => {
      const stream = substream(seed, "free", year, profile.name);
      const rating = seasonDriverRating({ careerRating: profile.rating, seasonsRaced: clamp(year - profile.firstYear, 0, 25), age, stream });
      return { profile, age, rating };
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, MAX_POOL);

  veterans.forEach(({ profile, age, rating }) => {
    const driver = makeDriver({ name: profile.name, rating, careerRating: profile.rating, age, nat: reference.drivers[profile.name]?.[0] || null, status: "free", year, seed });
    world.drivers[driver.id] = driver;
  });

  // Tomorrow's grid, today: real drivers who debut in the next four seasons.
  const juniors = profiles
    .filter((profile) => profile.firstYear > year && profile.firstYear <= year + 4 && !taken.has(profile.name))
    .map((profile) => ({ profile, age: ageFrom({ name: profile.name, year, reference, profile: { firstYear: profile.firstYear } }) }))
    .filter(({ age }) => age >= 16 && age <= 25)
    .sort((a, b) => b.profile.rating - a.profile.rating)
    .slice(0, MAX_POOL);

  juniors.forEach(({ profile, age }) => {
    const stream = substream(seed, "junior", year, profile.name);
    const rating = seasonDriverRating({ careerRating: profile.rating, seasonsRaced: 0, age, stream });
    const driver = makeDriver({ name: profile.name, rating, careerRating: profile.rating, age, nat: reference.drivers[profile.name]?.[0] || null, status: "junior", year, seed });
    world.drivers[driver.id] = driver;
  });

  addInventedJuniors(world, year, seed, 4);
};

/** Invented prospects, so a career past the data still has a feeder series. */
export const addInventedJuniors = (world, year, seed, count) => {
  const stream = substream(seed, "invented-juniors", year);
  for (let index = 0; index < count; index += 1) {
    const person = inventPerson(stream);
    const careerRating = clamp(stream.normal(66, 7), 50, 90);
    const age = stream.int(17, 21);
    const rating = seasonDriverRating({ careerRating, seasonsRaced: 0, age, stream });
    const driver = makeDriver({ name: person.name, rating, careerRating, age, nat: person.nat, real: false, status: "junior", year, seed, id: `${slug(person.name)}-${year}` });
    if (!world.drivers[driver.id]) world.drivers[driver.id] = driver;
  }
};

/** A team short of two drivers takes the best available free agent. */
export const fillEmptySeats = (world, year) => {
  Object.values(world.teams).forEach((team) => {
    while (team.drivers.length < 2) {
      const pick = Object.values(world.drivers)
        .filter((driver) => (driver.status === "free" || driver.status === "junior") && driver.age >= 18)
        .sort((a, b) => b.rating - a.rating)[0];
      if (!pick) break;
      signForTeam(world, pick, team, { year, until: year, salary: driverSalary(pick.rating, team.prestige, year), role: "second" });
    }
  });
};

export const signForTeam = (world, driver, team, { year, until, salary, role = "equal" }) => {
  // Out of the old seat first.
  Object.values(world.teams).forEach((other) => {
    other.drivers = other.drivers.filter((id) => id !== driver.id);
    if (other.reserve === driver.id) other.reserve = null;
  });
  driver.status = "grid";
  driver.teamId = team.id;
  driver.contract = { teamId: team.id, until, salary, role };
  driver.since = year;
  team.drivers = [...team.drivers.filter((id) => id !== driver.id), driver.id].slice(0, 2);
  return driver;
};

export const releaseDriver = (world, driver) => {
  Object.values(world.teams).forEach((team) => {
    team.drivers = team.drivers.filter((id) => id !== driver.id);
    if (team.reserve === driver.id) team.reserve = null;
  });
  driver.status = "free";
  driver.teamId = null;
  driver.contract = null;
  return driver;
};

// ---------------------------------------------------------------- views

export const teamsByPace = (world) => Object.values(world.teams).sort((a, b) => carRatingOf(b.car) - carRatingOf(a.car));

export const expectedRankOf = (world, teamId) => teamsByPace(world).findIndex((team) => team.id === teamId) + 1;

export const driversOf = (world, teamId) => (world.teams[teamId]?.drivers || []).map((id) => world.drivers[id]).filter(Boolean);
