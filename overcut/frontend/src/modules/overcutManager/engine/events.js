/**
 * What lands on the principal's desk between two Grands Prix.
 *
 * Each event has a condition, a set of options and an effect per option. The
 * engine never holds a sentence: an event carries a template id and numbers, and
 * the interface writes it. Effects are applied here, so a test can play every
 * branch without rendering anything.
 *
 * At most one event per gap between races, and a template does not repeat for a
 * few rounds, so the inbox reads like a season rather than a slot machine.
 */

import { clamp, substream } from "../../overcutTrayectoria/engine/rng";
import { PACE_AREAS } from "./car";
import { moneyScale, roundMoney } from "./economy";
import { addInbox } from "./inbox";
import { inventPerson } from "./names";
import { ledger, userTeam } from "./market";
import { driversOf } from "./world";

const money = (career, amount) => roundMoney(amount * moneyScale(career.year));

const ownDrivers = (career) => driversOf(career.world, career.teamId);

const lastResults = (career, count = 3) => career.season.results.slice(-count);

/** Points each of the player's drivers scored over the last few races. */
const recentPoints = (career, count = 3) => {
  const totals = {};
  lastResults(career, count).forEach((summary) => {
    summary.rows.forEach((row) => {
      if (row.teamId === career.teamId) totals[row.driverId] = (totals[row.driverId] || 0) + (row.points || 0);
    });
  });
  return totals;
};

const TEMPLATES = {
  "sponsor-offer": {
    weight: 1.2,
    when: (career) => career.round >= 1,
    params: (career, stream) => ({ amount: money(career, stream.range(0.6e6, 2.4e6) * (0.6 + userTeam(career).prestige)) }),
    options: {
      accept: (career, params) => addSponsor(career, params.amount),
      negotiate: (career, params, stream) => {
        if (stream.chance(0.5)) return addSponsor(career, Math.round(params.amount * 1.3));
        return { outcome: "walked" };
      },
      decline: () => ({ outcome: "declined" }),
    },
  },
  "driver-role": {
    weight: 1.4,
    when: (career) => {
      const drivers = ownDrivers(career);
      if (drivers.length < 2 || career.season.results.length < 3) return false;
      const points = recentPoints(career);
      const second = drivers.find((driver) => driver.contract?.role === "second");
      const first = drivers.find((driver) => driver.contract?.role === "first");
      return Boolean(second && first && (points[second.id] || 0) > (points[first.id] || 0));
    },
    params: (career) => {
      const drivers = ownDrivers(career);
      return { driverId: drivers.find((driver) => driver.contract?.role === "second").id, otherId: drivers.find((driver) => driver.contract?.role === "first").id };
    },
    options: {
      equal: (career, params) => {
        const driver = career.world.drivers[params.driverId];
        const other = career.world.drivers[params.otherId];
        driver.contract.role = "equal";
        other.contract.role = "equal";
        driver.morale = clamp(driver.morale + 12, 0, 100);
        other.morale = clamp(other.morale - 8, 0, 100);
        return { outcome: "equal" };
      },
      promise: (career, params) => {
        const driver = career.world.drivers[params.driverId];
        driver.morale = clamp(driver.morale + 6, 0, 100);
        career.promises.push({ kind: "role", driverId: params.driverId, year: career.year });
        return { outcome: "promise" };
      },
      keep: (career, params) => {
        const driver = career.world.drivers[params.driverId];
        driver.morale = clamp(driver.morale - 10, 0, 100);
        return { outcome: "keep" };
      },
    },
  },
  "poach-staff": {
    weight: 0.8,
    when: (career) => career.staff.technical?.rating >= 66 && career.round >= 3,
    params: (career, stream) => {
      const rivals = Object.values(career.world.teams).filter((team) => team.id !== career.teamId);
      return { teamId: stream.pick(rivals)?.id, role: "technical", raise: roundMoney(career.staff.technical.salary * 0.35) };
    },
    options: {
      counter: (career, params) => {
        career.staff.technical.salary += params.raise;
        return { outcome: "stays" };
      },
      release: (career, params, stream) => {
        const old = career.staff.technical;
        const fee = roundMoney(old.salary * 0.5);
        career.finances.balance += fee;
        ledger(career, fee, "staff-fee");
        career.staff.technical = { ...old, ...inventPerson(stream), id: `${old.id}-deputy`, rating: Math.max(40, old.rating - 15), salary: roundMoney(old.salary * 0.5), interim: true };
        return { outcome: "left" };
      },
    },
  },
  "rule-clarification": {
    weight: 0.8,
    when: (career) => career.year >= 1970 && career.round >= 2,
    params: (career, stream) => ({ area: stream.pick(["aero", "chassis"]), cost: money(career, 1.2e6) }),
    options: {
      comply: (career, params) => {
        const car = userTeam(career).car;
        car[params.area] = clamp(car[params.area] - 1.2, 20, 100);
        return { outcome: "complied" };
      },
      appeal: (career, params, stream) => {
        career.finances.balance -= params.cost;
        ledger(career, -params.cost, "appeal");
        if (stream.chance(0.55)) return { outcome: "won" };
        const car = userTeam(career).car;
        car[params.area] = clamp(car[params.area] - 2, 20, 100);
        return { outcome: "lost" };
      },
    },
  },
  "press-criticism": {
    weight: 1,
    when: (career) => ownDrivers(career).some((driver) => driver.morale < 55),
    params: (career) => ({ driverId: [...ownDrivers(career)].sort((a, b) => a.morale - b.morale)[0].id }),
    options: {
      back: (career, params) => {
        const driver = career.world.drivers[params.driverId];
        driver.morale = clamp(driver.morale + 10, 0, 100);
        career.board.confidence = clamp(career.board.confidence - 3, 0, 100);
        return { outcome: "backed" };
      },
      fine: (career, params) => {
        const driver = career.world.drivers[params.driverId];
        driver.morale = clamp(driver.morale - 8, 0, 100);
        career.board.confidence = clamp(career.board.confidence + 2, 0, 100);
        return { outcome: "fined" };
      },
    },
  },
  "supplier-price": {
    weight: 0.7,
    when: (career) => career.round >= 2,
    params: (career, stream) => ({ cost: money(career, stream.range(0.8e6, 2.2e6)) }),
    options: {
      pay: (career, params) => {
        career.finances.balance -= params.cost;
        ledger(career, -params.cost, "supplier");
        return { outcome: "paid" };
      },
      refuse: (career) => {
        const car = userTeam(career).car;
        car.reliability = clamp(car.reliability - 2.5, 5, 99);
        return { outcome: "refused" };
      },
    },
  },
  "facility-upgrade": {
    weight: 0.6,
    when: (career) => (userTeam(career).facility ?? 2) < 5 && career.finances.balance > money(career, 60e6),
    params: (career) => ({ cost: money(career, 28e6 + (userTeam(career).facility ?? 2) * 8e6) }),
    options: {
      invest: (career, params) => {
        career.finances.balance -= params.cost;
        ledger(career, -params.cost, "facility");
        const team = userTeam(career);
        team.facility = clamp((team.facility ?? 2) + 1, 1, 5);
        return { outcome: "built" };
      },
      later: () => ({ outcome: "later" }),
    },
  },
  "junior-test": {
    weight: 0.8,
    when: (career) => Object.values(career.world.drivers).some((driver) => driver.status === "junior" && !driver.scouted),
    params: (career, stream) => {
      const juniors = Object.values(career.world.drivers).filter((driver) => driver.status === "junior" && !driver.scouted);
      return { driverId: stream.pick(juniors).id, cost: money(career, 0.35e6) };
    },
    options: {
      test: (career, params) => {
        career.finances.balance -= params.cost;
        ledger(career, -params.cost, "test");
        const driver = career.world.drivers[params.driverId];
        driver.scouted = true;
        driver.morale = clamp((driver.morale ?? 70) + 10, 0, 100);
        if (!career.market.shortlist.includes(driver.id)) career.market.shortlist.push(driver.id);
        return { outcome: "tested", talent: driver.talent };
      },
      skip: () => ({ outcome: "skipped" }),
    },
  },
  "fan-day": {
    weight: 0.7,
    when: () => true,
    params: (career) => ({ income: money(career, 0.5e6) }),
    options: {
      host: (career, params) => {
        career.finances.balance += params.income;
        ledger(career, params.income, "fans");
        career.fans = clamp((career.fans ?? 60) + 4, 0, 100);
        ownDrivers(career).forEach((driver) => {
          driver.morale = clamp(driver.morale - 2, 0, 100);
        });
        return { outcome: "hosted" };
      },
      skip: () => ({ outcome: "skipped" }),
    },
  },
  "reliability-scare": {
    weight: 1.6,
    when: (career) => {
      const last = lastResults(career, 1)[0];
      return Boolean(last && last.rows.some((row) => row.teamId === career.teamId && row.status === "mechanical"));
    },
    params: (career) => ({ cost: money(career, 2.2e6) }),
    options: {
      rebuild: (career, params) => {
        career.finances.balance -= params.cost;
        ledger(career, -params.cost, "rebuild");
        const car = userTeam(career).car;
        car.reliability = clamp(car.reliability + 2.2, 5, 99);
        return { outcome: "rebuilt" };
      },
      ignore: () => ({ outcome: "ignored" }),
    },
  },
  "poach-driver": {
    weight: 0.7,
    when: (career) => career.round >= Math.ceil(career.world.races.length * 0.4) && ownDrivers(career).some((driver) => driver.rating >= 72),
    params: (career, stream) => {
      const star = [...ownDrivers(career)].sort((a, b) => b.rating - a.rating)[0];
      const rivals = Object.values(career.world.teams).filter((team) => team.id !== career.teamId && team.prestige >= userTeam(career).prestige - 0.1);
      const rival = stream.pick(rivals.length ? rivals : Object.values(career.world.teams).filter((team) => team.id !== career.teamId));
      return { driverId: star.id, teamId: rival?.id, fee: roundMoney(star.contract.salary * stream.range(1.4, 2.4)) };
    },
    options: {
      sell: (career, params) => {
        career.finances.balance += params.fee;
        ledger(career, params.fee, "transfer-fee");
        if (!career.market.leaving.includes(params.driverId)) career.market.leaving.push(params.driverId);
        career.market.poached[params.driverId] = params.teamId;
        return { outcome: "sold" };
      },
      refuse: (career, params) => {
        const driver = career.world.drivers[params.driverId];
        driver.morale = clamp(driver.morale - 5, 0, 100);
        return { outcome: "refused" };
      },
    },
  },
  "investor": {
    weight: 1,
    when: (career) => career.owner && career.finances.balance < money(career, 30e6),
    params: (career) => ({ amount: money(career, 45e6) }),
    options: {
      accept: (career, params) => {
        career.finances.balance += params.amount;
        ledger(career, params.amount, "investment");
        const objective = career.board.objectives.find((entry) => entry.type === "constructors");
        if (objective) objective.target = Math.max(1, objective.target - 1);
        return { outcome: "accepted" };
      },
      decline: () => ({ outcome: "declined" }),
    },
  },
  "driver-unhappy": {
    weight: 1.2,
    when: (career) => ownDrivers(career).some((driver) => driver.morale < 35),
    params: (career) => ({ driverId: [...ownDrivers(career)].sort((a, b) => a.morale - b.morale)[0].id }),
    options: {
      talk: (career, params, stream) => {
        const driver = career.world.drivers[params.driverId];
        const worked = stream.chance(0.55);
        driver.morale = clamp(driver.morale + (worked ? 14 : 3), 0, 100);
        return { outcome: worked ? "calmed" : "unmoved" };
      },
      release: (career, params) => {
        if (!career.market.leaving.includes(params.driverId)) career.market.leaving.push(params.driverId);
        return { outcome: "leaving" };
      },
    },
  },
};

export const EVENT_TEMPLATES = Object.keys(TEMPLATES);

const addSponsor = (career, perRace) => {
  career.finances.sponsors.push({ id: `sp-${career.serial.events}`, perRace, until: career.year });
  return { outcome: "signed", perRace };
};

/** Maybe put an event on the desk. Returns the inbox id, or null. */
export const maybeEvent = (career) => {
  if (career.ended) return null;
  const stream = substream(career.seed, "event", career.year, career.round);
  if (!stream.chance(0.42)) return null;
  const cooldown = career.eventCooldown || {};
  const pool = Object.entries(TEMPLATES).filter(([id, template]) => (cooldown[id] ?? -99) <= career.globalRound - 4 && template.when(career));
  if (!pool.length) return null;
  const [templateId, template] = stream.pickWeighted(pool, ([, entry]) => entry.weight);
  const params = template.params(career, stream);
  career.serial.events += 1;
  const event = { id: `ev-${career.serial.events}`, template: templateId, params, options: Object.keys(template.options), resolved: null };
  cooldown[templateId] = career.globalRound;
  career.eventCooldown = cooldown;
  return addInbox(career, { kind: "event", event, stop: true });
};

/** The player's answer. */
export const resolveEvent = (career, inboxId, optionId) => {
  const item = career.inbox.find((entry) => entry.id === inboxId);
  if (!item || item.kind !== "event" || item.event.resolved) return null;
  const template = TEMPLATES[item.event.template];
  const option = template?.options[optionId];
  if (!option) return null;
  const stream = substream(career.seed, "event-choice", item.event.id, optionId);
  const result = option(career, item.event.params, stream) || {};
  item.event.resolved = { option: optionId, ...result };
  item.read = true;
  return item.event.resolved;
};

/** Promises come due at the end of the season. */
export const settlePromises = (career) => {
  career.promises = (career.promises || []).filter((promise) => {
    if (promise.year !== career.year) return true;
    const driver = career.world.drivers[promise.driverId];
    if (promise.kind === "role" && driver && driver.contract?.role === "second") driver.morale = clamp(driver.morale - 15, 0, 100);
    return false;
  });
};

export { PACE_AREAS };
