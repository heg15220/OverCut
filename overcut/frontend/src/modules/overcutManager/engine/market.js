/**
 * The market: drivers and the people who run the team.
 *
 * A driver is not a price tag. What they ask depends on how good they are and
 * how good your car is - a champion will drive a slow car only for a lot of money
 * and the number one seat - and whether they talk to you at all depends on the
 * same. A negotiation is a few rounds of offer and counter-offer against their
 * patience; push too low too often and they stop answering.
 *
 * Who can be signed, and when:
 *
 *   free agents, juniors, reserves   now or for next season
 *   another team's race driver       next season only; if their contract runs
 *                                    past this year, their team wants a fee
 *   your own drivers                 a renewal, any time
 */

import { clamp, substream } from "../../overcutTrayectoria/engine/rng";
import { carRatingOf } from "./car";
import { driverSalary, moneyScale, roundMoney, staffSalary } from "./economy";
import { inventPerson } from "./names";
import { driversOf, releaseDriver, signForTeam, teamsByPace } from "./world";

export const ROLES = ["first", "equal", "second"];

const carRankScore = (career, teamId) => {
  const ranked = teamsByPace(career.world);
  const index = ranked.findIndex((team) => team.id === teamId);
  return ranked.length > 1 ? 1 - Math.max(0, index) / (ranked.length - 1) : 0.5;
};

export const userTeam = (career) => career.world.teams[career.teamId];

/** Where a driver is in the market, from the player's side of the table. */
export const marketStatusOf = (career, driver) => {
  if (driver.contract?.teamId === career.teamId) return "own";
  if (driver.status === "grid") return driver.contract && driver.contract.until > career.year ? "contracted" : "expiring";
  if (driver.status === "reserve") return "reserve";
  if (driver.status === "retired") return "retired";
  return driver.status === "junior" ? "junior" : "free";
};

/** What it costs to take a contracted driver from their team for next season. */
export const buyoutFee = (career, driver) => {
  if (!driver.contract || driver.contract.teamId === career.teamId) return 0;
  const yearsLeft = Math.max(0, driver.contract.until - career.year);
  return roundMoney(driver.contract.salary * yearsLeft * 0.65);
};

/**
 * What a driver wants from you, and whether they will talk at all.
 */
export const askingTerms = (career, driver) => {
  const team = userTeam(career);
  const rank = carRankScore(career, team.id);
  const own = driver.contract?.teamId === team.id;
  const elite = driver.rating >= 84;
  const status = marketStatusOf(career, driver);

  let interest = 0.32 + 0.36 * rank + 0.24 * team.prestige;
  if (status === "free" || status === "junior" || status === "reserve") interest += 0.22;
  if (elite) interest -= 0.2 * (1 - rank);
  if (own) interest += ((driver.morale ?? 70) - 55) / 180;
  if (driver.age >= 36) interest += 0.08;
  interest = clamp(interest, 0, 1);

  const mates = driversOf(career.world, team.id).filter((mate) => mate.id !== driver.id);
  const bestMate = Math.max(0, ...mates.map((mate) => mate.rating));
  const role = elite || driver.rating >= bestMate + 3 ? "first" : driver.rating <= bestMate - 6 ? "second" : "equal";

  const base = driverSalary(driver.rating, team.prestige, career.year);
  const salary = roundMoney(base * (1.2 - 0.35 * interest) * (status === "junior" ? 0.55 : 1));
  const years = driver.age < 25 ? 3 : driver.age < 32 ? 2 : 1;
  const patience = 2 + Math.round(interest * 2);

  return { salary, role, years, interest, patience, willing: interest >= 0.22 || own };
};

const ROLE_SCORE = { first: { first: 1, equal: 0.62, second: 0.3 }, equal: { first: 1, equal: 1, second: 0.55 }, second: { first: 1, equal: 1, second: 1 } };

/**
 * One round of a negotiation. `offer` is { salary, years, role, start } where
 * start is "now" or "next". Returns the driver's answer and keeps the state of
 * the talks on the career.
 */
export const makeOffer = (career, driverId, offer) => {
  const driver = career.world.drivers[driverId];
  if (!driver) return { status: "error" };
  const talks = career.market.talks[driverId] || { rounds: 0, walked: false, ask: askingTerms(career, driver) };
  career.market.talks[driverId] = talks;
  const ask = talks.ask;
  if (talks.walked) return { status: "walked", ask };
  if (!ask.willing) {
    talks.walked = true;
    return { status: "not-interested", ask };
  }

  const money = clamp(offer.salary / Math.max(1, ask.salary), 0, 1.35);
  const role = ROLE_SCORE[ask.role][offer.role] ?? 0.5;
  const years = clamp(1 - 0.12 * Math.abs((offer.years || 1) - ask.years), 0.5, 1);
  const score = money * 0.55 + role * 0.2 + years * 0.1 + ask.interest * 0.25 - 0.08;
  talks.rounds += 1;
  talks.last = { ...offer, score };

  if (score >= 0.8) {
    talks.agreed = { ...offer };
    return { status: "accepted", ask, score };
  }
  if (talks.rounds >= ask.patience || score < 0.42) {
    talks.walked = talks.rounds >= ask.patience;
    return { status: talks.walked ? "walked" : "rejected", ask, score };
  }
  // Meet in the middle, a little on their side.
  const counter = {
    salary: roundMoney(Math.max(offer.salary, ask.salary * (0.96 + (0.8 - score) * 0.25))),
    role: ROLE_SCORE[ask.role][offer.role] >= 1 ? offer.role : ask.role,
    years: ask.years,
  };
  talks.counter = counter;
  return { status: "counter", ask, counter, score };
};

/** Seats the player's team has for a given season. */
export const seatsFor = (career, season) => {
  const team = userTeam(career);
  const current = driversOf(career.world, team.id);
  if (season === "now") return { race: current.length, reserve: team.reserve ? 1 : 0 };
  const staying = current.filter((driver) => driver.contract && driver.contract.until > career.year && !career.market.leaving.includes(driver.id));
  const incoming = Object.values(career.market.signed).filter((deal) => deal.seat === "race").length;
  return { race: staying.length + incoming, reserve: Object.values(career.market.signed).filter((deal) => deal.seat === "reserve").length };
};

/**
 * Close the deal. A "now" signing joins the team at once (replacing the driver
 * the player named, who is released); a "next" signing is held until the turn of
 * the season.
 */
export const signDriver = (career, driverId, { start = "next", seat = "race", replace = null } = {}) => {
  const driver = career.world.drivers[driverId];
  const talks = career.market.talks[driverId];
  if (!driver || !talks?.agreed) return { error: "no-deal" };
  const terms = talks.agreed;
  const team = userTeam(career);
  const status = marketStatusOf(career, driver);
  const fee = status === "contracted" ? buyoutFee(career, driver) : 0;

  if (status === "own") {
    // A renewal runs from next season: `years` more seasons after this one.
    driver.contract = { ...driver.contract, until: career.year + terms.years, salary: terms.salary, role: terms.role };
    driver.morale = clamp(driver.morale + 8, 0, 100);
    career.market.leaving = career.market.leaving.filter((id) => id !== driverId);
    delete career.market.talks[driverId];
    return { ok: true, renewed: true };
  }

  if (start === "now") {
    if (status === "contracted" || status === "expiring") return { error: "not-now" };
    if (seat === "race") {
      const current = driversOf(career.world, team.id);
      if (current.length >= 2) {
        const out = career.world.drivers[replace] || current[current.length - 1];
        const compensation = releaseCompensation(career, out);
        career.finances.balance -= compensation;
        ledger(career, -compensation, "release");
        releaseDriver(career.world, out);
      }
      signForTeam(career.world, driver, team, { year: career.year, until: career.year + terms.years - 1, salary: terms.salary, role: terms.role });
    } else {
      if (team.reserve) releaseDriver(career.world, career.world.drivers[team.reserve]);
      Object.values(career.world.teams).forEach((other) => {
        if (other.reserve === driver.id) other.reserve = null;
      });
      driver.status = "reserve";
      driver.teamId = team.id;
      driver.contract = { teamId: team.id, until: career.year + terms.years - 1, salary: terms.salary, role: "second" };
      team.reserve = driver.id;
    }
    driver.morale = 75;
    delete career.market.talks[driverId];
    return { ok: true };
  }

  if (fee > 0) {
    if (career.finances.balance < fee) return { error: "money" };
    career.finances.balance -= fee;
    ledger(career, -fee, "buyout");
  }
  career.market.signed[driverId] = { driverId, salary: terms.salary, years: terms.years, role: terms.role, seat, fee };
  delete career.market.talks[driverId];
  return { ok: true, fee };
};

/** What it costs to let a driver go before their contract ends. */
export const releaseCompensation = (career, driver) => {
  if (!driver?.contract) return 0;
  const remainingRaces = Math.max(0, career.world.races.length - career.round);
  const thisYear = (driver.contract.salary * remainingRaces) / Math.max(1, career.world.races.length);
  const later = Math.max(0, driver.contract.until - career.year) * driver.contract.salary;
  return roundMoney(thisYear * 0.5 + later * 0.3);
};

/** Let one of your drivers go at the end of the season (or now, paying for it). */
export const releaseOwnDriver = (career, driverId, { now = false } = {}) => {
  const driver = career.world.drivers[driverId];
  if (!driver || driver.contract?.teamId !== career.teamId) return { error: "not-own" };
  if (!now) {
    if (!career.market.leaving.includes(driverId)) career.market.leaving.push(driverId);
    return { ok: true };
  }
  const team = userTeam(career);
  if (team.drivers.includes(driverId) && !team.reserve && !Object.values(career.world.drivers).some((other) => other.status === "free" || other.status === "junior")) {
    return { error: "no-replacement" };
  }
  const compensation = releaseCompensation(career, driver);
  career.finances.balance -= compensation;
  ledger(career, -compensation, "release");
  const wasRacing = team.drivers.includes(driverId);
  releaseDriver(career.world, driver);
  if (wasRacing) promoteReserve(career);
  return { ok: true, compensation };
};

/** An empty race seat goes to the reserve, or to the best driver nobody has signed. */
export const promoteReserve = (career) => {
  const team = userTeam(career);
  while (team.drivers.length < 2) {
    const reserve = team.reserve ? career.world.drivers[team.reserve] : null;
    const pick =
      reserve ||
      Object.values(career.world.drivers)
        .filter((driver) => (driver.status === "free" || driver.status === "junior") && driver.age >= 18)
        .sort((a, b) => b.rating - a.rating)[0];
    if (!pick) break;
    team.reserve = reserve ? null : team.reserve;
    signForTeam(career.world, pick, team, {
      year: career.year,
      until: pick.contract?.until ?? career.year,
      salary: pick.contract?.salary ?? driverSalary(pick.rating, team.prestige, career.year) * 0.6,
      role: "second",
    });
  }
};

/** Swap the reserve into a race seat for the rest of the season. */
export const swapWithReserve = (career, driverId) => {
  const team = userTeam(career);
  const reserve = team.reserve ? career.world.drivers[team.reserve] : null;
  const out = career.world.drivers[driverId];
  if (!reserve || !out || !team.drivers.includes(driverId)) return { error: "no-reserve" };
  team.drivers = team.drivers.map((id) => (id === driverId ? reserve.id : id));
  team.reserve = out.id;
  reserve.status = "grid";
  out.status = "reserve";
  out.morale = clamp(out.morale - 12, 0, 100);
  return { ok: true };
};

export const setRole = (career, driverId, role) => {
  const driver = career.world.drivers[driverId];
  if (!driver || driver.contract?.teamId !== career.teamId || !ROLES.includes(role)) return career;
  const previous = driver.contract.role;
  driver.contract.role = role;
  const mates = driversOf(career.world, career.teamId).filter((mate) => mate.id !== driverId);
  if (role === "first") mates.forEach((mate) => {
    if (mate.contract.role === "first") mate.contract.role = "second";
    mate.morale = clamp(mate.morale - 6, 0, 100);
  });
  if (role === "second" && previous !== "second") driver.morale = clamp(driver.morale - 10, 0, 100);
  if (role !== "second" && previous === "second") driver.morale = clamp(driver.morale + 8, 0, 100);
  return career;
};

// ------------------------------------------------------------------ staff

export const STAFF_ROLES = ["technical", "engineering", "operations", "commercial"];

/** The people the team starts with: as good as the team's money could buy. */
export const startingStaff = ({ prestige, year, seed, headquarters = 0 }) => {
  const stream = substream(seed, "staff", year);
  const staff = {};
  STAFF_ROLES.forEach((role) => {
    const person = inventPerson(stream);
    const rating = clamp(Math.round(48 + prestige * 34 + headquarters + stream.normal(0, 5)), 35, 92);
    staff[role] = { id: `${role}-${year}-0`, role, ...person, rating, age: stream.int(34, 58), salary: staffSalary(rating, year) };
  });
  return staff;
};

/** Candidates for a role this season. Better people go to better teams. */
export const staffCandidates = (career, role, count = 5) => {
  const team = userTeam(career);
  const stream = substream(career.seed, "candidates", career.year, role, career.market.staffRefresh || 0);
  const ceiling = 70 + team.prestige * 24 + (career.reputation - 40) * 0.15;
  return Array.from({ length: count }, (_, index) => {
    const person = inventPerson(stream);
    const rating = clamp(Math.round(stream.normal(60, 11)), 38, Math.round(clamp(ceiling, 70, 96)));
    return { id: `${role}-${career.year}-${career.market.staffRefresh || 0}-${index}`, role, ...person, rating, age: stream.int(31, 62), salary: roundMoney(staffSalary(rating, career.year) * 1.1) };
  }).sort((a, b) => b.rating - a.rating);
};

export const hireStaff = (career, candidate) => {
  const current = career.staff[candidate.role];
  const severance = current ? roundMoney(current.salary * 0.5) : 0;
  if (career.finances.balance < severance) return { error: "money" };
  career.finances.balance -= severance;
  if (severance) ledger(career, -severance, "severance");
  career.staff[candidate.role] = { ...candidate };
  career.market.staffRefresh = (career.market.staffRefresh || 0) + 1;
  return { ok: true, severance };
};

// ---------------------------------------------------------------- ledger

export const ledger = (career, amount, kind, extra = {}) => {
  career.finances.ledger.unshift({ year: career.year, round: career.round, amount: Math.round(amount), kind, ...extra });
  if (career.finances.ledger.length > 90) career.finances.ledger.length = 90;
  const season = career.finances.season;
  if (amount >= 0) season.income += amount;
  else season.spend -= amount;
};

/** How fast the car is, against the field, as a share: 1 = the best car. */
export const competitiveness = (career, teamId) => carRankScore(career, teamId);

export const carRankOf = (career, teamId) => teamsByPace(career.world).findIndex((team) => team.id === teamId) + 1;

export const userCarRating = (career) => carRatingOf(userTeam(career).car);

export const scaledMoney = (amount, year) => roundMoney(amount * moneyScale(year));
