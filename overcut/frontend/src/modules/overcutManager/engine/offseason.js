/**
 * The turn of the year.
 *
 * Two forces decide next season, and the manager needs both:
 *
 *   what you did   your car is built from this year's car, the advantage that
 *                  carries over and the work your factory put into next year's
 *                  design. Your drivers are the ones you kept and signed.
 *   what happened  while history has data, every rival is pulled most of the way
 *                  towards where it really was the following year - its car, its
 *                  line-up, the teams that really arrived and folded. You can
 *                  bend Formula 1 history; you cannot stop Brawn turning up in
 *                  2009. Past the last real season, the world runs on its own.
 *
 * A real driver who really retired, retires - unless he is under contract to
 * you, in which case he races on in your car.
 */

import { clamp, substream } from "../../overcutTrayectoria/engine/rng";
import { growAttributes } from "../../overcutTrayectoria/engine/attributes";
import { AREAS, PACE_AREAS, carRatingOf, fieldMeanOf, nextYearCar, roundCar } from "./car";
import { driverSalary, prizeMoney, sponsorIncome } from "./economy";
import { addInbox, addNews } from "./inbox";
import { setObjectives } from "./board";
import { startingStaff } from "./market";
import { constructorStandings, emptySeason, driverStandings } from "./standings";
import { developmentNewSeason, pendingNextGains, regulationCutCar } from "./development";
import { worldForSeason } from "./packs/packWorld";
import { financeNewSeason } from "./finance";
import { deliverHistoryEvents } from "./history";
import { addInventedJuniors, buildManagerWorld, fillEmptySeats, prestigeFor, refreshRating, signForTeam, teamsByPace } from "./world";
import { PHASES, seasonMixOf } from "./career";
import { pullSkills } from "./drivers/skills";

const realWorldFor = (context, year, seed) => {
  const { bootstrap } = context;
  // A season with a pack is built from it, whatever the bootstrap holds (RF-CAR-02, RF-CAR-03).
  if (context.packs?.[year]) return worldForSeason({ bootstrap, reference: context.reference, year, seed, packs: context.packs });
  if (year > bootstrap.lastDataYear || !(bootstrap.lineupsByYear[String(year)] || []).length) return null;
  return buildManagerWorld({ bootstrap, reference: context.reference, year, seed });
};

/** A season score for growth: how a driver did against the car and the team-mate. */
const seasonScores = (career) => {
  const scores = {};
  const standings = driverStandings(career);
  const byTeam = {};
  standings.forEach((row) => {
    (byTeam[row.teamId] ||= []).push(row);
  });
  Object.values(byTeam).forEach((rows) => {
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    rows.forEach((row) => {
      const share = total > 0 ? row.total / total : 0.5;
      scores[row.driverId] = clamp(0.45 + (share - 0.5) * 0.6 + (row.wins > 0 ? 0.05 : 0), 0, 1);
    });
  });
  return scores;
};

const ageAndGrow = (career, scores) => {
  const nextYear = career.year + 1;
  Object.values(career.world.drivers).forEach((driver) => {
    driver.age += 1;
    const grown = growAttributes({
      attributes: { ...driver.attributes, talent: driver.talent },
      age: driver.age,
      focus: null,
      seasonScore: scores[driver.id] ?? 0.42,
      seed: career.seed,
      year: nextYear,
    });
    delete grown.talent;
    driver.attributes = grown;
    refreshRating(driver);
    driver.morale = clamp(70 + ((driver.morale ?? 70) - 70) * 0.4, 0, 100);
  });
};

/** Nudge a driver's attributes towards the rating history gives him next year. */
const pullTowards = (driver, rating, pull) => {
  const delta = (rating - driver.rating) * pull;
  Object.keys(driver.attributes).forEach((key) => {
    driver.attributes[key] = clamp(driver.attributes[key] + delta, 30, 99);
  });
  refreshRating(driver);
};

/**
 * Build next season and move the career into its preseason. `teamId` switches
 * the principal to another team (a job offer accepted).
 */
export const startNextSeason = (context, career, { teamId = career.teamId } = {}) => {
  const year = career.year + 1;
  const stream = substream(career.seed, "turnover", year);
  const previous = career.world;
  const real = realWorldFor(context, year, career.seed);
  // How hard real history pulls a rival's car and its drivers: SRS 6.5's k, by the career's
  // historical mode (RF-CAR-05; data/balance/historical-anchors.json seasonMix: 0.6 strict, 0.2 free).
  const HISTORY_PULL = seasonMixOf(career);
  const scores = seasonScores(career);
  ageAndGrow(career, scores);
  // RF-DEV-03/04/06: what the parts layer needs from the year that ends.
  const previousTeamId = career.teamId;
  const previousParts = previous.teams[previousTeamId]?.parts || null;
  const lastStandings = constructorStandings(career);
  const pendingNext = pendingNextGains(career);

  // ---------------------------------------------------------- cars
  const previousTeams = Object.values(previous.teams);
  const mean = fieldMeanOf(previousTeams);
  const userId = career.teamId;
  const teams = {};
  previousTeams.forEach((team) => {
    const nextGains = team.id === userId ? { ...career.rd.nextGains } : aiNextGains(team, stream);
    // Projects for next year that did not finish still deliver most of what they promised.
    if (team.id === userId) {
      career.rd.projects.filter((project) => project.target === "next").forEach((project) => {
        // Winter work is delivered in full; in-season work for next year that ran out of time, mostly.
        nextGains[project.area] = (nextGains[project.area] || 0) + project.expected * (project.winter ? 1 : 0.8);
      });
      // RF-DEV-06: next year's designs still in the factory.
      Object.entries(pendingNext).forEach(([area, gain]) => {
        nextGains[area] = (nextGains[area] || 0) + gain;
      });
    }
    // RF-DEV-07: a real rule change cuts the advantage carried into the new era (data/balance/development.json).
    const carried = regulationCutCar({ car: team.car, fieldMean: mean, year, list: team.parts?.list });
    teams[team.id] = { ...team, car: nextYearCar({ car: carried, fieldMean: mean, nextGains, year, stream: substream(career.seed, "next-car", year, team.id) }) };
  });

  if (real) {
    const simMean = fieldMeanOf(Object.values(teams));
    const realTeams = Object.values(real.teams);
    const realMean = fieldMeanOf(realTeams);
    const keep = new Set([userId, ...Object.values(teams).filter((team) => team.custom).map((team) => team.id)]);
    // Rivals follow history; teams that history ended leave the grid.
    Object.keys(teams).forEach((id) => {
      if (!keep.has(id) && !real.teams[id]) delete teams[id];
    });
    realTeams.forEach((realTeam) => {
      if (keep.has(realTeam.id)) return;
      const current = teams[realTeam.id];
      const car = {};
      AREAS.forEach((area) => {
        const realEdge = realTeam.car[area] - realMean[area];
        const simEdge = current ? current.car[area] - simMean[area] : realEdge;
        car[area] = clamp(simMean[area] + HISTORY_PULL * realEdge + (1 - HISTORY_PULL) * simEdge, 5, 100);
      });
      teams[realTeam.id] = {
        ...realTeam,
        ...(current ? { facility: current.facility } : {}),
        car: roundCar(car),
        drivers: [],
        reserve: null,
      };
    });
  } else {
    Object.values(teams).forEach((team) => {
      team.drivers = [...team.drivers];
    });
  }

  // Prestige follows the order of the new cars, and the weight of the name.
  const ranked = Object.values(teams).sort((a, b) => carRatingOf(b.car) - carRatingOf(a.car));
  ranked.forEach((team, index) => {
    if (team.custom) {
      const lastPosition = career.history.find((entry) => entry.year === career.year && entry.teamId === team.id)?.position;
      team.prestige = clamp(team.prestige + (lastPosition ? (ranked.length / 2 - lastPosition) * 0.01 : 0), 0.08, 0.9);
      return;
    }
    const rankScore = ranked.length > 1 ? 1 - index / (ranked.length - 1) : 0.5;
    team.prestige = Math.round((team.prestige * 0.6 + prestigeFor({ name: team.name, rankScore }) * 0.4) * 100) / 100;
  });

  // ------------------------------------------------------- drivers
  const drivers = { ...previous.drivers };
  const signed = career.market.signed;
  const leaving = new Set(career.market.leaving);
  const userTeam = teams[userId];

  // Merge in anyone history brings that we have never met.
  if (real) {
    Object.values(real.drivers).forEach((driver) => {
      if (!drivers[driver.id]) drivers[driver.id] = { ...driver, teamId: null, contract: null, status: "free" };
    });
  }

  // Everyone off the grid first; seats are handed out below.
  Object.values(drivers).forEach((driver) => {
    if (driver.status === "grid" || driver.status === "reserve") {
      driver.previousTeam = driver.teamId;
    }
  });

  const contracted = (driver) => driver.contract && driver.contract.until >= year;
  const userNext = new Set();
  // The player's team: drivers still under contract, minus those let go, plus the new signings.
  Object.values(drivers).forEach((driver) => {
    if (driver.contract?.teamId === userId && contracted(driver) && !leaving.has(driver.id)) userNext.add(driver.id);
  });
  Object.values(signed).forEach((deal) => userNext.add(deal.driverId));

  // The new year's fixed rules and guided anchors come with history (RF-CAR-02, RF-CAR-05).
  const world = { year, races: [], teams, order: [], drivers, generated: !real, ...(real?.regulations ? { regulations: real.regulations, pack: real.pack } : {}), ...(real?.anchors ? { anchors: real.anchors } : {}) };
  Object.values(drivers).forEach((driver) => {
    if (userNext.has(driver.id)) return;
    driver.status = driver.status === "retired" ? "retired" : driver.status === "junior" ? "junior" : "free";
    driver.teamId = null;
    driver.contract = null;
  });
  Object.values(teams).forEach((team) => {
    team.drivers = [];
    team.reserve = null;
  });

  // Signings and keepers.
  [...userNext].forEach((id) => {
    const driver = drivers[id];
    const deal = signed[id];
    if (!driver || !userTeam) return;
    if (deal) {
      driver.contract = { teamId: userId, until: year + deal.years - 1, salary: deal.salary, role: deal.role };
      if (deal.seat === "reserve") {
        driver.status = "reserve";
        driver.teamId = userId;
        userTeam.reserve = driver.id;
        return;
      }
    }
    if (userTeam.drivers.length < 2) {
      driver.status = "grid";
      driver.teamId = userId;
      userTeam.drivers.push(driver.id);
    } else if (!userTeam.reserve) {
      driver.status = "reserve";
      driver.teamId = userId;
      userTeam.reserve = driver.id;
    }
  });

  // Real retirements: history said they stopped - unless history also gives them a seat.
  const realSeated = new Set(real ? Object.values(real.teams).flatMap((team) => team.drivers) : []);
  Object.values(drivers).forEach((driver) => {
    if (userNext.has(driver.id) || !driver.real || realSeated.has(driver.id)) return;
    const profile = context.bootstrap.driverProfiles[driver.name];
    if (profile && profile.lastYear < year && profile.firstYear < year && (real || driver.age >= 38)) driver.status = "retired";
  });

  // Rivals: history's line-up where there is one, otherwise their own market.
  const poached = career.market.poached || {};
  Object.values(teams).forEach((team) => {
    if (team.id === userId) return;
    const realTeam = real?.teams[team.id];
    if (realTeam && !team.custom) {
      realTeam.drivers.forEach((realId) => {
        const driver = drivers[realId];
        if (!driver || userNext.has(realId) || driver.status === "retired" || team.drivers.length >= 2) return;
        const realDriver = real.drivers[realId];
        if (realDriver && driver !== realDriver) {
          pullTowards(driver, realDriver.rating, HISTORY_PULL);
          // RF-STF-02, SRS 6.5: the twelve attributes drift towards next season's real ones too.
          pullSkills(driver, realDriver, HISTORY_PULL);
        }
        seat(driver, team, year, realDriver?.contract?.until ?? year, realDriver?.contract?.role ?? "equal");
      });
    } else {
      const previousTeam = previous.teams[team.id];
      (previousTeam?.drivers || []).forEach((id) => {
        const driver = drivers[id];
        if (!driver || userNext.has(id) || driver.status === "retired" || team.drivers.length >= 2) return;
        const stays = driver.age < 37 && (stream.chance(0.72) || driver.rating >= 80);
        if (stays) seat(driver, team, year, year + stream.int(0, 1), "equal");
      });
    }
  });
  Object.entries(poached).forEach(([driverId, teamId]) => {
    const driver = drivers[driverId];
    const team = teams[teamId];
    if (!driver || !team || userNext.has(driverId) || driver.status === "grid") return;
    if (team.drivers.length >= 2) {
      const weakest = team.drivers.map((id) => drivers[id]).sort((a, b) => a.rating - b.rating)[0];
      weakest.status = "free";
      weakest.teamId = null;
      weakest.contract = null;
      team.drivers = team.drivers.filter((id) => id !== weakest.id);
    }
    seat(driver, team, year, year + 1, "equal");
  });

  // Ageing out of the sport.
  Object.values(drivers).forEach((driver) => {
    if (driver.status !== "free") return;
    if (driver.age >= 41 || (driver.age >= 36 && stream.chance(0.45))) driver.status = "retired";
  });
  // Juniors who are old enough join the free market.
  Object.values(drivers).forEach((driver) => {
    if (driver.status === "junior" && driver.age >= 24) driver.status = "free";
  });

  // ------------------------------------------------------- calendar
  world.races = real
    ? real.races
    : previous.races.map((race) => ({ ...race, date: `${year}${race.date.slice(4)}` }));
  world.order = Object.keys(teams);
  if (!real) addInventedJuniors(world, year, career.seed, 3);
  else {
    // History's new prospects come on to the market.
    Object.values(real.drivers).forEach((driver) => {
      if (driver.status === "junior" && drivers[driver.id]?.status !== "grid") drivers[driver.id] = { ...driver };
    });
  }
  trimPool(world);
  fillEmptySeats(world, year);
  Object.values(world.teams).forEach((team) => {
    team.drivers.forEach((id) => {
      const driver = world.drivers[id];
      if (driver && !driver.contract) driver.contract = { teamId: team.id, until: year, salary: driverSalary(driver.rating, team.prestige, year), role: "equal" };
    });
  });

  // ------------------------------------------------- the principal
  const switching = teamId !== userId && world.teams[teamId];
  career.year = year;
  career.world = world;
  career.season = emptySeason(year);
  career.round = 0;
  career.weekend = null;
  career.phase = PHASES.PRESEASON;
  career.review = null;
  career.market = { talks: {}, signed: {}, leaving: [], shortlist: career.market.shortlist.filter((id) => world.drivers[id]), poached: {}, staffRefresh: 0 };
  career.rd = {
    projects: career.rd.projects.filter((project) => project.target === "now").map((project) => ({ ...project, roundsLeft: Math.max(1, project.roundsLeft) })),
    done: career.rd.done,
    nextGains: {},
    seasonGain: {},
    spend: career.rd.nextSpend || 0,
    nextSpend: 0,
  };
  career.finances.sponsors = career.finances.sponsors.filter((deal) => deal.until >= year);
  career.finances.season = { income: 0, spend: 0 };
  Object.values(career.staff).forEach((person) => {
    if (person) person.age += 1;
  });

  if (switching || !world.teams[career.teamId]) {
    const target = switching ? teamId : teamsByPace(world)[Math.floor(Object.keys(world.teams).length / 2)].id;
    const team = world.teams[target];
    career.teamId = target;
    career.owner = false;
    career.staff = startingStaff({ prestige: team.prestige, year, seed: `${career.seed}-${target}`, headquarters: 0 });
    career.rd.projects = [];
    career.finances.lastPosition = career.history[career.history.length - 1]?.constructorChampion === target ? 1 : Math.ceil(Object.keys(world.teams).length / 2);
    career.finances.balance = Math.round((sponsorIncome(team.prestige, year) + prizeMoney(career.finances.lastPosition, Object.keys(world.teams).length, year)) * 0.4);
    career.ended = null;
    career.board.confidence = 62;
    addNews(career, { kind: "new-principal", teamId: target, manager: career.managerName });
    addInbox(career, { kind: "welcome", teamId: target, year, owner: false });
  }

  // RF-DEV-01..08, RF-SIM-14: new parts for every team, the player's expertise, units and the ATR order.
  developmentNewSeason(career, { previousTeamId, previousParts, lastStandings });

  const team = world.teams[career.teamId];
  const teamCount = Object.keys(world.teams).length;
  career.finances.seasonIncome = sponsorIncome(team.prestige, year) + prizeMoney(career.finances.lastPosition, teamCount, year);
  career.board.warned = false;
  career.jobOffers = [];
  setObjectives(career);
  addInbox(career, { kind: "new-season", year, regulations: Boolean(real === null && year % 5 === 0) });
  addInbox(career, { kind: "objectives" });
  if (real) addNews(career, { kind: "history", year });
  // RF-INB-02: the new season's first historical events.
  deliverHistoryEvents(career);
  // RF-FIN-01..05, RF-HQ-01: new books, finished deals dropped, new offers, HQ into the new season.
  financeNewSeason(career);
  return career;
};

const seat = (driver, team, year, until, role) => {
  signForTeam({ teams: { [team.id]: team } }, driver, team, { year, until: Math.max(year, until), salary: driverSalary(driver.rating, team.prestige, year), role });
};

/** What a rival's winter is worth: money buys a better next car, mostly. */
const aiNextGains = (team, stream) => {
  const gains = {};
  PACE_AREAS.forEach((area) => {
    gains[area] = (team.prestige - 0.45) * 2.4 + stream.normal(0, 0.9);
  });
  gains.reliability = (team.prestige - 0.45) * 3 + stream.normal(0, 1);
  return gains;
};

/** Keep the market a market: the best free agents and prospects, and nobody long gone. */
const trimPool = (world) => {
  const seated = new Set(Object.values(world.teams).flatMap((team) => [...team.drivers, team.reserve].filter(Boolean)));
  const free = Object.values(world.drivers).filter((driver) => !seated.has(driver.id) && driver.status === "free").sort((a, b) => b.rating - a.rating);
  const juniors = Object.values(world.drivers).filter((driver) => !seated.has(driver.id) && driver.status === "junior").sort((a, b) => b.talent - a.talent);
  const keep = new Set([...seated, ...free.slice(0, 16).map((driver) => driver.id), ...juniors.slice(0, 16).map((driver) => driver.id)]);
  Object.keys(world.drivers).forEach((id) => {
    if (!keep.has(id)) delete world.drivers[id];
  });
};

/** After being sacked mid-season: the rest of the year runs without you. */
export const finishSeasonWithout = (career, { simulateWeekend, closeWeekend }) => {
  const ended = career.ended;
  career.ended = null;
  let guard = 0;
  while (career.round < career.world.races.length && guard < 40) {
    simulateWeekend(career);
    closeWeekend(career);
    guard += 1;
  }
  career.ended = ended;
  return career;
};

export const acceptJob = (context, career, teamId, helpers) => {
  if (career.round < career.world.races.length) finishSeasonWithout(career, helpers);
  return startNextSeason(context, career, { teamId });
};
