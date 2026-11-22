/**
 * A season's world built from its pack (RF-CAR-02, SRS 6.3).
 *
 * When a season has a validated pack, the pack is the only source of what is
 * fixed (SRS 6.1): the teams and drivers entered in every Grand Prix, the
 * calendar, the regulations and the points. Ratings come from the pack's
 * v1-qualifying-gap derivation (RF-STF-03), turned into the Manager's scale
 * with the coefficients in `data/balance/pack-world.json` (RNF-07).
 *
 * Years without a pack keep the older bootstrap world (`buildManagerWorld`);
 * `worldForSeason` picks one or the other, so every caller - the setup wizard,
 * `createCareer` and the off-season - builds the same world for the same year.
 *
 * What the pack does not hold is still borrowed from the bootstrap: the market
 * of free agents and future debutants (RF-STF-06), and how long a driver really
 * stayed at a team, which is the length of his first contract.
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import { eraProfileFor } from "../../../overcutTrayectoria/engine/eras";
import { circuitProfile } from "../../../overcutTrayectoria/engine/circuits";
import balance from "../../data/balance/pack-world.json";
import { carFromRating } from "../car";
import { driverSalary } from "../economy";
import { shortCode, teamIdentity } from "../identity";
import { addMarketPool, buildManagerWorld, fillEmptySeats, makeDriver, prepareReference, prestigeFor } from "../world";

const lerp = (from, to, t) => from + (to - from) * t;

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

// ------------------------------------------------------------ regulations

/**
 * The era profile of a year with the pack's regulations laid over it. The
 * fixed rules (points, safety car, VSC, DRS, refuelling, qualifying format)
 * come from the pack; what the pack does not describe stays the era's.
 */
export const eraWithRegulations = (year, regulations) => {
  const era = eraProfileFor(year);
  if (!regulations) return era;
  const scheme = regulations.pointsScheme;
  return {
    ...era,
    points: scheme.race,
    fastestLap: { ...era.fastestLap, point: scheme.fastestLap },
    polePoints: scheme.pole,
    sprintPoints: scheme.sprint,
    doubleLastRace: scheme.doubleLastRace,
    bestResults: scheme.bestResults,
    constructorsBestCarOnly: scheme.constructorsBestCarOnly,
    features: {
      ...era.features,
      safetyCar: regulations.safetyCar,
      virtualSafetyCar: regulations.vsc,
      drs: regulations.drs,
      activeAero: regulations.activeAero,
      refuelling: regulations.refuelling,
      energySystem: regulations.energySystem,
      hybrid: regulations.energySystem === "ers" || regulations.energySystem === "ers2026",
      knockoutQualifying: (regulations.qualifyingFormats || []).includes("KNOCKOUT"),
      sprintWeekends: regulations.sprintWeekends > 0,
      tyreChangesInRace: regulations.tyreChangesInRace,
      mandatoryDryCompounds: regulations.mandatoryDryCompounds,
    },
    regulations,
  };
};

// ---------------------------------------------------------------- calendar

/**
 * The pack's calendar in the shape the race engine reads. The bootstrap's
 * names ("Australian Grand Prix") key the circuit profiles and the reference
 * lap times, so each pack round is matched to its reference race by date.
 */
export const packCalendar = ({ pack, reference }) => {
  const known = reference.racesByYear[String(pack.year)] || {};
  const byDate = {};
  Object.entries(known).forEach(([name, facts]) => {
    byDate[facts.date] = { name, ...facts };
  });
  const entered = {};
  pack.entries.forEach((entry) => {
    const round = (entered[entry.round] = entered[entry.round] || {});
    (round[entry.teamId] = round[entry.teamId] || []).push(entry.driverId);
  });
  return pack.calendar.map((event) => {
    const facts = byDate[event.date.slice(5)] || {};
    const name = facts.name || `${event.name} Grand Prix`;
    const profile = circuitProfile(name);
    const avgLap = facts.avgLap && facts.avgLap > 40 ? facts.avgLap : null;
    // Without a reference lap, the distance over an era-typical average speed.
    const fallbackLap = event.lengthKm ? Math.round((event.lengthKm / lerp(180, 215, clamp((pack.year - 1990) / 30, 0, 1))) * 3600 * 100) / 100 : 90;
    return {
      round: event.round,
      name,
      country: event.country || profile.country,
      date: event.date,
      baseLap: avgLap ? Math.round(avgLap * 0.985 * 100) / 100 : fallbackLap,
      laps: event.laps,
      circuit: facts.circuit || null,
      location: event.place || facts.location || null,
      packCircuitId: event.circuitId,
      layoutId: event.layoutId,
      lengthKm: event.lengthKm,
      sprint: Boolean(event.sprint),
      qualifyingFormat: event.qualifyingFormat,
      // Fixed anchor: who entered this Grand Prix, team by team.
      entries: entered[event.round] || {},
      profile: {
        overtaking: profile.overtaking, power: profile.power, aero: profile.aero, attrition: profile.attrition,
        rain: profile.rain, prestige: profile.prestige,
      },
    };
  });
};

// ------------------------------------------------------------------ ratings

const carScaleFor = (year) => {
  const scale = balance.car;
  const t = (year - scale.yearFrom) / scale.yearSpan;
  return {
    base: clamp(lerp(scale.baseFrom, scale.baseTo, t), scale.baseMin, scale.baseMax),
    spread: clamp(lerp(scale.spreadFrom, scale.spreadTo, t), scale.spreadMin, scale.spreadMax),
  };
};

/** 0 for the slowest car of the pack, 1 for the quickest. */
const paceScores = (pack) => {
  const paces = pack.ratings.teams.map((team) => team.paceIndex);
  const low = Math.min(...paces);
  const high = Math.max(...paces);
  return Object.fromEntries(pack.ratings.teams.map((team) => [team.teamId, high > low ? (team.paceIndex - low) / (high - low) : 0.5]));
};

export const carRatingFromPack = (year, score) => {
  const { base, spread } = carScaleFor(year);
  return clamp(base + spread * score, balance.car.ratingMin, balance.car.ratingMax);
};

export const reliabilityFromPack = (rating, era) => {
  const { starts = 0, mechanicalDnf = 0, otherDnf = 0 } = rating?.reliability || {};
  const prior = balance.reliability.priorStarts;
  const finishes = starts - mechanicalDnf - otherDnf + prior * era.finishRate;
  return clamp(finishes / Math.max(1, starts + prior), balance.reliability.min, balance.reliability.max);
};

/** How much a car improved over the year: the gap to pole, first half against second. */
export const developmentFromPack = (pack, teamId) => {
  const rounds = pack.calendar.length;
  const best = {};
  pack.realResults.forEach((row) => {
    if (row.teamId !== teamId || row.qualifyingGapPct === null || row.qualifyingGapPct === undefined) return;
    best[row.round] = Math.min(best[row.round] ?? Infinity, row.qualifyingGapPct);
  });
  const half = Math.ceil(rounds / 2);
  const early = median(Object.entries(best).filter(([round]) => Number(round) <= half).map(([, gap]) => gap));
  const late = median(Object.entries(best).filter(([round]) => Number(round) > half).map(([, gap]) => gap));
  if (early === null || late === null) return 0;
  const { perGapPct, min, max } = balance.development;
  return Math.round(clamp((early - late) * perGapPct, min, max) * 100) / 100;
};

export const driverRatingFromPack = (teamScore, driverRating) => {
  const model = balance.driver;
  const mate = driverRating?.teammateIndex ?? model.mateNeutral;
  return clamp(model.base + model.carWeight * teamScore + model.mateWeight * (mate - model.mateNeutral), model.min, model.max);
};

const ageAt = (dateOfBirth, date) => {
  if (!dateOfBirth) return 26;
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  const on = new Date(`${date}T00:00:00Z`);
  let age = on.getUTCFullYear() - born.getUTCFullYear();
  if (on.getUTCMonth() < born.getUTCMonth() || (on.getUTCMonth() === born.getUTCMonth() && on.getUTCDate() < born.getUTCDate())) age -= 1;
  return clamp(age, 16, 55);
};

/** Seasons after this one that a driver stayed at the same team, from the bootstrap (none known: this year). */
const realTenure = (bootstrap, teamName, driverName, year) => {
  let until = year;
  for (let next = year + 1; next <= year + 3; next += 1) {
    const lineup = bootstrap?.lineupsByYear?.[String(next)] || [];
    const stays = lineup.some((entry) => entry.team === teamName && (entry.drivers || []).some((driver) => driver.name === driverName));
    if (!stays) break;
    until = next;
  }
  return until;
};

// -------------------------------------------------------------------- world

/**
 * Every team of the pack, with its real drivers: the two who started most
 * Grands Prix for it are its race drivers, the third its reserve; anyone else
 * it entered is on the market, ready to be the real substitute on the day the
 * team really used him.
 */
export const buildPackWorld = ({ pack, bootstrap, reference: rawReference, seed = "manager" }) => {
  const reference = rawReference?.racesByYear ? rawReference : prepareReference(rawReference);
  const year = pack.year;
  const era = eraWithRegulations(year, pack.regulations);
  const races = packCalendar({ pack, reference });
  const firstDate = races[0]?.date || `${year}-03-01`;
  const scores = paceScores(pack);
  const teamRatings = Object.fromEntries(pack.ratings.teams.map((rating) => [rating.teamId, rating]));
  const driverRatings = Object.fromEntries(pack.ratings.drivers.map((rating) => [`${rating.teamId}::${rating.driverId}`, rating]));
  const packDrivers = Object.fromEntries(pack.drivers.map((driver) => [driver.id, driver]));
  const position = Object.fromEntries((pack.standings.constructors || []).map((row) => [row.teamId, row.position]));

  // Rounds each driver started for each team, and each team's rounds.
  const starts = {};
  const teamRounds = {};
  pack.entries.forEach((entry) => {
    const key = `${entry.teamId}::${entry.driverId}`;
    starts[key] = (starts[key] || 0) + 1;
    (teamRounds[entry.teamId] = teamRounds[entry.teamId] || new Set()).add(entry.round);
  });
  // A driver who changed teams belongs to the one he raced most for.
  const home = {};
  Object.entries(starts).forEach(([key, count]) => {
    const [teamId, driverId] = key.split("::");
    if (!home[driverId] || count > home[driverId].count) home[driverId] = { teamId, count };
  });

  const ranked = [...pack.teams].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const teams = {};
  const drivers = {};

  const addDriver = ({ driverId, team, status, prestige, rating, until, salaryShare = 1 }) => {
    const info = packDrivers[driverId];
    const profile = bootstrap?.driverProfiles?.[info.name];
    const made = makeDriver({
      id: driverId,
      name: info.name,
      rating,
      careerRating: profile?.rating ?? rating,
      age: ageAt(info.dateOfBirth, firstDate),
      nat: info.nationality || null,
      status,
      year,
      teamId: team ? team.id : null,
      until,
      salary: team ? Math.round(driverSalary(rating, prestige, year) * salaryShare) : 0,
      seed,
    });
    drivers[made.id] = made;
    return made;
  };

  ranked.forEach((team, index) => {
    const rankScore = ranked.length > 1 ? 1 - index / (ranked.length - 1) : 0.5;
    const prestige = Math.round(prestigeFor({ name: team.name, rankScore }) * 100) / 100;
    const score = scores[team.id] ?? 0;
    const identity = teamIdentity(team.name, year);
    const own = Object.keys(home)
      .filter((driverId) => home[driverId].teamId === team.id)
      .sort((a, b) => home[b].count - home[a].count || a.localeCompare(b));
    const ratingOf = (driverId) => driverRatingFromPack(score, driverRatings[`${team.id}::${driverId}`]);

    const seated = own.slice(0, 2).map((driverId) =>
      addDriver({ driverId, team: { id: team.id }, status: "grid", prestige, rating: ratingOf(driverId), until: realTenure(bootstrap, team.name, packDrivers[driverId].name, year) }),
    );
    const reserve = own[2]
      ? addDriver({ driverId: own[2], team: { id: team.id }, status: "reserve", prestige, rating: ratingOf(own[2]), until: year, salaryShare: balance.driver.reserveSalaryShare }).id
      : null;
    own.slice(3).forEach((driverId) => addDriver({ driverId, team: null, status: "free", prestige, rating: ratingOf(driverId), until: null }));

    if (seated.length === 2 && Math.abs(seated[0].rating - seated[1].rating) >= 4) {
      const [lead, support] = seated[0].rating > seated[1].rating ? seated : [seated[1], seated[0]];
      lead.contract.role = "first";
      support.contract.role = "second";
    }

    const rounds = teamRounds[team.id]?.size || 0;
    teams[team.id] = {
      id: team.id,
      name: team.name,
      short: shortCode(team.name),
      color: identity.color,
      color2: identity.color2,
      country: team.country || null,
      real: true,
      custom: false,
      car: carFromRating({ carRating: carRatingFromPack(year, score), reliability: reliabilityFromPack(teamRatings[team.id], era), era, teamName: team.name, year }),
      devSlope: developmentFromPack(pack, team.id),
      prestige,
      drivers: seated.map((driver) => driver.id),
      reserve,
      realPosition: position[team.id] ?? null,
      engine: null,
      facility: clamp(Math.round(1 + prestige * 4), 1, 5),
      chassis: team.chassis.map((chassis) => chassis.name),
      engines: team.engines.map((engine) => engine.manufacturerName),
      tyreSuppliers: team.tyreSuppliers,
      asset: team.car || null,
      rounds,
      // Withdrew or joined mid-season (Super Aguri 2008): a fixed anchor, so the player cannot take it over.
      partial: rounds < races.length,
    };
  });

  const world = {
    year,
    races,
    teams,
    order: Object.keys(teams),
    drivers,
    generated: false,
    regulations: pack.regulations,
    pack: { year, schemaVersion: pack.schemaVersion, packVersion: pack.packVersion, ratings: pack.ratings.method, balance: balance.version },
  };
  if (bootstrap?.driverProfiles) addMarketPool({ world, bootstrap, reference, year, seed });
  fillEmptySeats(world, year);
  return world;
};

/** The world of a season: from its pack when there is one, from the bootstrap otherwise. */
export const worldForSeason = ({ bootstrap, reference, year, seed, packs = {} }) => {
  const pack = packs[year];
  if (pack && pack.year === year) return buildPackWorld({ pack, bootstrap, reference, seed });
  return buildManagerWorld({ bootstrap, reference, year, seed });
};

/** Teams the player may run: those entered in every Grand Prix of the year. */
export const selectableTeams = (world) => Object.values(world.teams).filter((team) => !team.partial);

/**
 * The cars of one team in one Grand Prix. A rival fields the drivers it really
 * entered that day (substitutes included) unless the player has signed one of
 * them away; the player's team and a custom team field their own.
 */
export const roundLineup = ({ world, team, race, isUser }) => {
  const regulars = (team.drivers || []).map((id) => world.drivers[id]).filter(Boolean);
  if (!race?.entries || team.custom || isUser) return regulars;
  const entered = race.entries[team.id];
  if (!entered) return [];
  const lineup = [];
  entered.forEach((driverId) => {
    const driver = world.drivers[driverId];
    if (!driver) return;
    if (driver.status === "grid" && driver.teamId !== team.id) return;
    lineup.push(driver);
  });
  regulars.forEach((driver) => {
    if (lineup.length < entered.length && !lineup.includes(driver)) lineup.push(driver);
  });
  return lineup.slice(0, entered.length);
};

