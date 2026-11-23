/**
 * The rivals' side of the driver market (RF-STF-04, RF-STF-06, RF-CAR-03, SRS 6.5).
 *
 * Every rival fills two race seats and a reserve for next season with rules a
 * player can read:
 *
 *   desirability  how attractive a team is to a driver, 0..1: its car (rank by
 *                 rating), its constructors' standing, its budget (sponsors and
 *                 prize money, economy.js) and its factory. The player's team is
 *                 measured the same way, so the same number decides whether a
 *                 driver talks to the player (market.js askingTerms).
 *   value         what a driver is worth to a team: rating, plus part of the
 *                 headroom to his ceiling while he is young.
 *   protected     the best `topCount` drivers of the grid. Their team always
 *                 wants to keep them and will not sell the contract; they only
 *                 talk to teams worth their time and want the no. 1 seat.
 *   retention     a contract in force is honoured. When it ends (free mode),
 *                 the team keeps the driver with a probability that grows with
 *                 its desirability and with beating the team-mate.
 *   signing       open seats are drafted: the most desirable team picks first,
 *                 one seat per turn, the best-valued driver who accepts it. A
 *                 seat is never left empty: no taker means the best available,
 *                 and an empty pool means an invented driver.
 *   strict mode   history's line-up is the plan (RF-STF-06: real debuts and real
 *                 retirements); only a seat the player emptied goes through the
 *                 draft, where whoever really raced the next year goes first
 *                 ("el siguiente candidato real del mercado", SRS 6.5).
 *   pre-contracts once the market opens (`openShare` of the season), the plan
 *                 for next year is drawn up and announced: renewals extend
 *                 contracts and moves become pre-contracts the player can no
 *                 longer sign. The turn of the year honours them.
 *
 * Every probability is drawn from a seeded stream (RF-SIM-15, RNF-05) and every
 * number lives in data/balance/market.json (RNF-07), calibrated against the
 * real turnover of 1976-2025 measured in f1db (its `real` block).
 */

import { clamp, substream } from "../../overcutTrayectoria/engine/rng";
import { slug } from "../../overcutTrayectoria/engine/world";
import balance from "../data/balance/market.json";
import { carRatingOf } from "./car";
import { driverSalary, prizeMoney, sponsorIncome } from "./economy";
import { inventPerson } from "./names";
import { constructorStandings, driverStandings } from "./standings";
import { makeDriver, signForTeam } from "./world";

export const MARKET = balance;

// ------------------------------------------------------------- desirability

const rankScores = (values) => {
  const ids = Object.keys(values).sort((a, b) => values[b] - values[a] || a.localeCompare(b));
  const out = {};
  ids.forEach((id, index) => {
    out[id] = ids.length > 1 ? 1 - index / (ids.length - 1) : 0.5;
  });
  return out;
};

/**
 * Desirability of every team of a world, 0..1 (SRS 6.5, RF-STF-04).
 * `positions` is { teamId: constructors' position } when there are results; without
 * them the standing follows the car. `year` sets the money scale.
 */
export const desirabilityOf = (world, { positions = null, year = world.year } = {}) => {
  const weights = balance.desirability;
  const teams = Object.values(world.teams);
  const count = teams.length;
  const car = rankScores(Object.fromEntries(teams.map((team) => [team.id, carRatingOf(team.car)])));
  const carOrder = Object.keys(car).sort((a, b) => car[b] - car[a] || a.localeCompare(b));
  const positionOf = (team) => positions?.[team.id] ?? carOrder.indexOf(team.id) + 1;
  const income = Object.fromEntries(teams.map((team) => [team.id, sponsorIncome(team.prestige ?? 0.4, year) + prizeMoney(positionOf(team), count, year)]));
  const richest = Math.max(1, ...Object.values(income));
  const out = {};
  teams.forEach((team) => {
    const standing = count > 1 ? 1 - (clamp(positionOf(team), 1, count) - 1) / (count - 1) : 0.5;
    const hq = clamp(((team.facility ?? 2) - 1) / 4, 0, 1);
    const score = weights.car * car[team.id] + weights.standing * standing + weights.budget * clamp(income[team.id] / richest, 0, 1) + weights.hq * hq;
    out[team.id] = Math.round(clamp(score, 0, 1) * 1000) / 1000;
  });
  return out;
};

/** Desirability as a career sees it this season: the simulated standings once there are results. */
export const careerDesirability = (career) => {
  const hasResults = (career.season?.results || []).length > 0;
  const positions = hasResults ? Object.fromEntries(constructorStandings(career).map((row) => [row.teamId, row.position])) : null;
  return desirabilityOf(career.world, { positions, year: career.year });
};

// -------------------------------------------------------------------- value

/** What a driver is worth to a team: rating plus part of his headroom while young. */
export const driverValue = (driver) => {
  const { potentialWeight, youthAge, primeAge } = balance.value;
  const youth = driver.age <= youthAge ? 1 : driver.age >= primeAge ? 0 : (primeAge - driver.age) / (primeAge - youthAge);
  return driver.rating + potentialWeight * Math.max(0, (driver.talent ?? driver.rating) - driver.rating) * youth;
};

/** The protected drivers of a world: its best `topCount` race drivers by rating. */
export const protectedDrivers = (world) =>
  new Set(
    Object.values(world.drivers)
      .filter((driver) => driver.status === "grid")
      .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id))
      .slice(0, balance.protected.topCount)
      .map((driver) => driver.id),
  );

export const isProtected = (world, driverId) => protectedDrivers(world).has(driverId);

/** Contract length for a new signing, by age (market.json signing.contractYears). */
export const contractYearsFor = (age) => (balance.signing.contractYears.find((row) => age <= row.maxAge) || { years: 1 }).years;

/** RF-STF-04: no. 1 and no. 2 when the ratings are `roles.gap` apart, equals otherwise. */
export const assignRoles = (world, team) => {
  const seated = team.drivers.map((id) => world.drivers[id]).filter(Boolean);
  seated.forEach((driver) => {
    if (driver.contract) driver.contract.role = "equal";
  });
  if (seated.length === 2 && Math.abs(seated[0].rating - seated[1].rating) >= balance.roles.gap) {
    const [lead, support] = seated[0].rating > seated[1].rating ? seated : [seated[1], seated[0]];
    if (lead.contract) lead.contract.role = "first";
    if (support.contract) support.contract.role = "second";
  }
};

/** Did the driver beat his team-mate this season? Points when there are any, rating otherwise. */
export const beatsMateOf = (career) => {
  const out = {};
  const hasResults = (career.season?.results || []).length > 0;
  const points = hasResults ? Object.fromEntries(driverStandings(career).map((row) => [row.driverId, row.total])) : {};
  Object.values(career.world.teams).forEach((team) => {
    const [a, b] = team.drivers.map((id) => career.world.drivers[id]).filter(Boolean);
    if (!a || !b) return;
    const pa = points[a.id];
    const pb = points[b.id];
    const aAhead = pa !== undefined && pb !== undefined && pa !== pb ? pa > pb : a.rating >= b.rating;
    out[a.id] = aAhead;
    out[b.id] = !aAhead;
  });
  return out;
};

// --------------------------------------------------------------------- plan

/**
 * RF-STF-06: may a driver race in `year`? A real prospect only from the season he
 * really debuted (nothing outside its era, SRS 6.2); an invented one when old enough.
 */
export const eligibleIn = (driver, year, profiles = {}, { strictReal = false } = {}) => {
  if (driver.status === "retired") return false;
  if (driver.age < balance.signing.minAge) return false;
  if (!driver.real) return true;
  const profile = profiles[driver.name];
  if (profile?.firstYear && profile.firstYear > year) return false;
  // Strict mode with history ahead: a driver whose real career ended before `year` has retired.
  return !(strictReal && profile?.lastYear && profile.lastYear < year && profile.firstYear < year);
};

/**
 * Fill the rivals' seats for `year` (SRS 6.5). Mutates `world` (the next season's
 * world: its teams' `drivers` and `reserve`, its drivers' status and contracts).
 *
 *   previous      the world of the season that ends (who drove where, contracts)
 *   userId        the player's team (never touched here)
 *   locked        Set of driver ids already decided (the player's line-up)
 *   fixed         { driverId: { teamId, until } } seats agreed beforehand (pre-contracts, sales to a rival)
 *   real          next year's real world, or null past the data
 *   strict        RF-CAR-05 strict mode
 *   desirability  { teamId: 0..1 } for next season
 *   beats         { driverId: true/false } beat his team-mate this season
 *   protectedIds  Set of protected drivers (this season's best)
 *   profiles      bootstrap.driverProfiles (real debut years)
 *   stream        seeded stream
 *
 * Returns { moves: [{ driverId, from, to }], invented: [ids] }.
 */
export const fillRivalSeats = ({ world, previous, userId, locked = new Set(), fixed = {}, real = null, strict = true, desirability, beats = {}, protectedIds = new Set(), profiles = {}, stream }) => {
  const year = world.year;
  const drivers = world.drivers;
  // A team history ends before `year` takes no part (it is off next year's grid, SRS 6.1 fixed anchor).
  const rivals = Object.values(world.teams)
    .filter((team) => team.id !== userId && !(real && !team.custom && !real.teams[team.id]))
    .sort((a, b) => (desirability[b.id] ?? 0) - (desirability[a.id] ?? 0) || a.id.localeCompare(b.id));
  // History's line-ups are laid down before any team runs its own market.
  const followsHistory = (team) => Boolean(strict && real && !team.custom && real.teams[team.id]);
  const taken = new Set(locked);
  Object.values(world.teams).forEach((team) => {
    [...team.drivers, team.reserve].filter(Boolean).forEach((id) => taken.add(id));
  });
  const invented = [];

  const place = (driver, team, { until, role = "equal", reserve = false } = {}) => {
    const salary = driverSalary(driver.rating, team.prestige ?? 0.4, year);
    if (reserve) {
      driver.status = "reserve";
      driver.teamId = team.id;
      driver.contract = { teamId: team.id, until: Math.max(year, until ?? year), salary: Math.round(salary * 0.35), role: "second" };
      team.reserve = driver.id;
    } else {
      signForTeam({ teams: { [team.id]: team } }, driver, team, { year, until: Math.max(year, until ?? year + contractYearsFor(driver.age) - 1), salary, role });
    }
    taken.add(driver.id);
  };
  const free = (id) => drivers[id] && !taken.has(id) && drivers[id].status !== "retired";
  const eligible = (driver) => eligibleIn(driver, year, profiles, { strictReal: strict && Boolean(real) });

  // 1. Seats agreed beforehand.
  Object.entries(fixed)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([driverId, deal]) => {
      const team = world.teams[deal.teamId];
      if (!team || team.id === userId || !free(driverId) || team.drivers.length >= 2) return;
      place(drivers[driverId], team, { until: deal.until });
    });

  // 2. History's line-up (strict), or each team's own drivers (free, or past the data).
  rivals.filter(followsHistory).forEach((team) => {
    real.teams[team.id].drivers.forEach((id) => {
      if (team.drivers.length >= 2 || !free(id)) return;
      place(drivers[id], team, { until: real.drivers[id]?.contract?.until ?? year });
    });
  });
  rivals.filter((team) => !followsHistory(team)).forEach((team) => {
    const before = previous.teams[team.id];
    (before?.drivers || []).forEach((id) => {
      const driver = drivers[id];
      if (team.drivers.length >= 2 || !free(id) || !eligible(driver)) return;
      const contract = previous.drivers[id]?.contract;
      if (contract && contract.teamId === team.id && contract.until >= year) {
        place(driver, team, { until: contract.until });
        return;
      }
      if (retains({ driver, team, desirability: desirability[team.id] ?? 0.5, beat: beats[id], isProtected: protectedIds.has(id), stream })) {
        place(driver, team, {});
      }
    });
  });

  // 3. The draft: most desirable team first, one seat per turn.
  const realNext = new Set(real ? Object.values(real.teams).flatMap((team) => [...team.drivers, team.reserve].filter(Boolean)) : []);
  const noise = {};
  const candidates = () =>
    Object.values(drivers).filter((driver) => free(driver.id) && ["free", "junior", "reserve", "grid"].includes(driver.status) && !driver.teamId && eligible(driver));
  const scoreOf = (driver, team) => {
    if (noise[`${team.id}:${driver.id}`] === undefined) noise[`${team.id}:${driver.id}`] = stream.normal(0, balance.value.pickNoise);
    const incumbent = previous.drivers[driver.id]?.status === "grid" ? balance.value.incumbentBonus : 0;
    return driverValue(driver) + incumbent + noise[`${team.id}:${driver.id}`] + (strict && realNext.has(driver.id) ? balance.signing.strictRealBonus : 0);
  };
  let open = rivals.filter((team) => team.drivers.length < 2);
  let guard = 0;
  while (open.length && guard < 200) {
    guard += 1;
    open.forEach((team) => {
      if (team.drivers.length >= 2) return;
      const everyone = candidates();
      // While history has a next season, invented drivers are a last resort (SRS 6.2 coherence, market.json signing).
      const realOnes = real && balance.signing.inventedPastDataOnly ? everyone.filter((driver) => driver.real) : everyone;
      const pool = realOnes.length ? realOnes : everyone;
      const ranked = [...pool].sort((a, b) => driverValue(b) - driverValue(a) || a.id.localeCompare(b.id));
      const quantile = Object.fromEntries(ranked.map((driver, index) => [driver.id, ranked.length > 1 ? 1 - index / (ranked.length - 1) : 0.5]));
      const des = desirability[team.id] ?? 0.5;
      const realReserve = strict && real?.teams[team.id]?.reserve;
      const accepting = pool.filter((driver) => accepts({ driver, desirability: des, quantile: quantile[driver.id], isProtected: protectedIds.has(driver.id) }));
      const choices = (accepting.length ? accepting : pool).map((driver) => ({ driver, score: scoreOf(driver, team) + (driver.id === realReserve ? balance.signing.strictRealBonus : 0) }));
      choices.sort((a, b) => b.score - a.score || a.driver.id.localeCompare(b.driver.id));
      let pick = choices[0]?.driver;
      if (!pick) {
        pick = inventDriver(world, year, stream);
        invented.push(pick.id);
      }
      place(pick, team, {});
    });
    open = open.filter((team) => team.drivers.length < 2);
  }

  // 4. Reserves: history's (strict), otherwise the best young driver left.
  rivals.forEach((team) => {
    if (team.reserve) return;
    const realReserve = strict && real?.teams[team.id]?.reserve;
    if (realReserve && free(realReserve) && !drivers[realReserve].teamId) {
      place(drivers[realReserve], team, { reserve: true });
      return;
    }
    if (strict && real && !team.custom) return;
    const pick = candidates()
      .filter((driver) => driver.age <= balance.reserves.maxAge)
      .sort((a, b) => driverValue(b) - driverValue(a) || a.id.localeCompare(b.id))[0];
    if (pick) place(pick, team, { reserve: true });
  });

  rivals.forEach((team) => assignRoles(world, team));

  const moves = [];
  rivals.forEach((team) => {
    team.drivers.forEach((id) => {
      const from = previous.drivers[id]?.teamId && previous.drivers[id]?.status === "grid" ? previous.drivers[id].teamId : null;
      if (from !== team.id) moves.push({ driverId: id, from, to: team.id });
    });
  });
  return { moves, invented };
};

/** Free mode: does a team keep a driver whose contract ends? (market.json retention) */
export const retainProbability = ({ desirability, beat, isProtected }) => {
  if (isProtected) return balance.real.top3Stay;
  const r = balance.retention;
  const edge = beat === undefined ? 0 : beat ? r.mateEdge : -r.mateEdge;
  return clamp(r.base + r.tierSlope * (desirability - 0.5) + edge, r.min, r.max);
};

const retains = ({ stream, ...args }) => stream.chance(retainProbability(args));

/** Will a driver sign for a team of this desirability? (market.json signing, protected) */
export const accepts = ({ driver, desirability, quantile, isProtected }) => {
  if (isProtected && desirability < balance.protected.minDesirability) return false;
  if (driver.status === "junior") return true;
  return desirability >= balance.signing.acceptSlope * quantile - balance.signing.acceptOffset;
};

/** An invented driver, so no seat is ever left empty (a world past its data, a thin pool). */
const inventDriver = (world, year, stream) => {
  const person = inventPerson(stream);
  const age = stream.int(20, 26);
  const careerRating = clamp(stream.normal(64, 5), 50, 80);
  const driver = makeDriver({ name: person.name, rating: careerRating, careerRating, age, nat: person.nat, real: false, status: "free", year, seed: `${year}-${person.name}`, id: `${slug(person.name)}-${year}-seat` });
  world.drivers[driver.id] = driver;
  return driver;
};

// ------------------------------------------------------------- the season

/** Has the market for next season opened? (market.json openShare of the calendar) */
export const marketOpen = (career) => career.round >= Math.ceil((career.world.races.length || 1) * balance.openShare);

/**
 * Draw up next season's plan for the rivals and announce it (pre-contracts).
 * `nextReal` is next year's real world (strict mode follows it), or null.
 * Idempotent per season. Renewals extend the driver's contract now; a move
 * becomes `career.market.precontracts[driverId] = { teamId, until }`, which the
 * player can no longer sign (market.js marketStatusOf "precontract") and which
 * startNextSeason honours.
 */
export const openAiMarket = (career, { nextReal = null, profiles = {} } = {}) => {
  const year = career.year + 1;
  if (career.market.ai?.year === year) return career.market.ai;
  const world = career.world;
  const preview = previewWorld(career, year);
  // Next year's real debutants and returning drivers are on that market too (as at the turn of the year).
  Object.values(nextReal?.drivers || {}).forEach((driver) => {
    if (!preview.drivers[driver.id]) preview.drivers[driver.id] = { ...driver, teamId: null, contract: null, status: "free" };
  });
  const locked = userLocked(career);
  const desirability = careerDesirability(career);
  fillRivalSeats({
    world: preview,
    previous: world,
    userId: career.teamId,
    locked,
    fixed: Object.fromEntries(Object.entries(career.market.poached || {}).map(([id, teamId]) => [id, { teamId, until: year + 1 }])),
    real: nextReal,
    strict: career.mode !== "free",
    desirability,
    beats: beatsMateOf(career),
    protectedIds: protectedDrivers(world),
    profiles,
    stream: substream(career.seed, "market-ai", year),
  });
  const precontracts = {};
  const renewals = [];
  Object.values(preview.teams).forEach((team) => {
    if (team.id === career.teamId) return;
    team.drivers.forEach((id) => {
      const now = world.drivers[id];
      const deal = preview.drivers[id].contract;
      if (!now) return;
      if (now.teamId === team.id && now.status === "grid") {
        if (now.contract && now.contract.until < year) {
          now.contract = { ...now.contract, until: deal.until };
          renewals.push(id);
        }
      } else {
        precontracts[id] = { teamId: team.id, until: deal.until };
      }
    });
  });
  career.market.precontracts = precontracts;
  career.market.ai = { year, renewals, opened: career.round };
  return career.market.ai;
};

const userLocked = (career) => {
  const locked = new Set(Object.keys(career.market.signed || {}));
  Object.values(career.world.drivers).forEach((driver) => {
    if (driver.contract?.teamId === career.teamId && driver.contract.until > career.year && !(career.market.leaving || []).includes(driver.id)) locked.add(driver.id);
  });
  return locked;
};

/** A copy of this season's paddock with every rival seat empty, as next year's market sees it. */
const previewWorld = (career, year) => {
  const drivers = {};
  Object.values(career.world.drivers).forEach((driver) => {
    const copy = { ...driver, contract: driver.contract ? { ...driver.contract } : null };
    if (copy.teamId !== career.teamId && copy.status !== "retired") {
      copy.status = copy.status === "junior" ? "junior" : "free";
      copy.teamId = null;
      copy.contract = null;
    }
    drivers[driver.id] = copy;
  });
  const teams = {};
  Object.values(career.world.teams).forEach((team) => {
    teams[team.id] = { ...team, drivers: team.id === career.teamId ? [...team.drivers] : [], reserve: team.id === career.teamId ? team.reserve : null };
  });
  return { year, teams, drivers };
};
