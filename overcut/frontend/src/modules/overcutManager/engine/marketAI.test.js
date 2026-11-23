/**
 * The driver market AI (RF-STF-04, RF-STF-06, RF-CAR-03, RF-CAR-05, SRS 6.5, RNF-05, RNF-07).
 *
 *   - market.json passes its schema (RNF-07);
 *   - no rival seat is ever left empty, in either mode, past the data or with an empty pool;
 *   - strict mode reproduces the real next-season line-ups of every team the player did not touch;
 *   - free mode is an open market whose turnover matches the real one of 1976-2025 (f1db, market.json real);
 *   - same seed, same market (RF-SIM-15, RNF-05);
 *   - the player's offers are accepted or rejected by desirability and money; protected drivers and
 *     rivals' pre-contracts are off limits.
 */

import Ajv from "ajv";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import balance from "../data/balance/market.json";
import schema from "./packs/schema/market.schema.json";
import { PHASES, createCareer, createContext, openOffseason, seasonWorld } from "./career";
import { askingTerms, makeOffer, marketStatusOf, signDriver } from "./market";
import { substream } from "../../overcutTrayectoria/engine/rng";
import { careerDesirability, driverValue, fillRivalSeats, isProtected, marketOpen, protectedDrivers, retainProbability } from "./marketAI";
import { openSeasonMarket, startNextSeason } from "./offseason";
import { loadSeasonPack, seasonPackYears } from "./packs/seasonPacks";

let context = null;
let packs = {};
let pairs = [];

beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
  pairs = Object.keys(packs).map(Number).filter((year) => packs[year + 1]);
});

/** Close the season without racing it and turn the year. */
const turn = (career) => {
  career.round = career.world.races.length;
  career.phase = PHASES.REVIEW;
  openOffseason(career);
  startNextSeason(context, career);
  return career;
};

const lastSelectable = (year) => Object.values(seasonWorld(context, year, "pick").teams).filter((team) => !team.partial).sort((a, b) => (a.realPosition ?? 99) - (b.realPosition ?? 99)).slice(-1)[0].id;
const lineups = (career) => Object.fromEntries(Object.values(career.world.teams).map((team) => [team.id, [...team.drivers].sort()]));

describe("RNF-07 · market balance in data", () => {
  it("market.json passes its JSON schema", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    expect(validate(balance) ? [] : validate.errors).toEqual([]);
  });

  it("desirability weights add up to one", () => {
    const { car, standing, budget, hq } = balance.desirability;
    expect(car + standing + budget + hq).toBeCloseTo(1, 6);
  });
});

describe("SRS 6.5 · desirability and value", () => {
  it("ranks the best car and richest team above the backmarker (2012)", () => {
    const career = createCareer(context, { year: 2012, teamId: "mclaren", seed: "des" });
    const des = careerDesirability(career);
    expect(des["red-bull"]).toBeGreaterThan(des.hrt);
    expect(des.mclaren).toBeGreaterThan(des.marussia);
    Object.values(des).forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
  });

  it("values a young driver's headroom, not an old one's", () => {
    const young = { rating: 70, talent: 85, age: 20 };
    const old = { rating: 70, talent: 85, age: 32 };
    expect(driverValue(young)).toBeGreaterThan(driverValue(old));
    expect(driverValue(old)).toBe(70);
  });

  it("keeps drivers more often at desirable teams and when they beat the team-mate", () => {
    expect(retainProbability({ desirability: 0.9, beat: true })).toBeGreaterThan(retainProbability({ desirability: 0.1, beat: true }));
    expect(retainProbability({ desirability: 0.5, beat: true })).toBeGreaterThan(retainProbability({ desirability: 0.5, beat: false }));
    expect(retainProbability({ desirability: 0.1, isProtected: true })).toBe(balance.real.top3Stay);
  });
});

describe("SRS 6.5 · no seat is ever left empty", () => {
  it.each(["strict", "free"])("every rival fields two drivers at every turn of a season with packs (%s)", (mode) => {
    pairs.forEach((year) => {
      const career = turn(createCareer(context, { year, teamId: lastSelectable(year), seed: `seats-${mode}-${year}`, mode }));
      Object.values(career.world.teams).forEach((team) => {
        expect([career.year, team.id, team.drivers.length]).toEqual([year + 1, team.id, 2]);
        team.drivers.forEach((id) => expect(career.world.drivers[id].status).toBe("grid"));
      });
    });
  });

  it("past the last real season, with nobody on the market, invents drivers rather than leave a seat empty", () => {
    const career = createCareer(context, { year: 2026, teamId: lastSelectable(2026), seed: "thin", mode: "free" });
    Object.values(career.world.drivers).forEach((driver) => {
      if (driver.status === "free" || driver.status === "junior") delete career.world.drivers[driver.id];
    });
    // Nobody stays: every rival contract ends now.
    Object.values(career.world.drivers).forEach((driver) => {
      if (driver.contract && driver.contract.teamId !== career.teamId) driver.contract.until = 2026;
    });
    turn(career);
    expect(career.year).toBe(2027);
    Object.values(career.world.teams).forEach((team) => expect(team.drivers).toHaveLength(2));
  });
});

describe("SRS 6.5 · an empty market", () => {
  it("fillRivalSeats invents a driver for every seat nobody can take", () => {
    const team = (id) => ({ id, drivers: [], reserve: null, car: { aero: 60, power: 60, chassis: 60, reliability: 80 }, prestige: 0.4, facility: 2 });
    const world = { year: 2030, teams: { a: team("a"), b: team("b") }, drivers: {} };
    const { invented } = fillRivalSeats({ world, previous: { teams: {}, drivers: {} }, userId: null, strict: false, desirability: { a: 0.6, b: 0.4 }, stream: substream("empty", "market") });
    expect(invented).toHaveLength(4);
    Object.values(world.teams).forEach((entry) => expect(entry.drivers).toHaveLength(2));
  });
});

describe("RF-STF-06, RF-CAR-05 · strict mode follows history", () => {
  it("reproduces every real next-season line-up when the player signs nobody", () => {
    let seats = 0;
    pairs.forEach((year) => {
      const career = turn(createCareer(context, { year, teamId: lastSelectable(year), seed: `strict-${year}` }));
      const real = seasonWorld(context, year + 1, "real");
      Object.values(career.world.teams).forEach((team) => {
        if (team.id === career.teamId || !real.teams[team.id]) return;
        expect([year + 1, team.id, [...team.drivers].sort()]).toEqual([year + 1, team.id, [...real.teams[team.id].drivers].sort()]);
        seats += team.drivers.length;
      });
    });
    expect(seats).toBeGreaterThan(600);
  });

  it("fills only the seat the player emptied; every other rival keeps its real line-up", () => {
    const career = createCareer(context, { year: 2008, teamId: "williams", seed: "poach" });
    const real = seasonWorld(context, 2009, "real");
    const realTeamOf = Object.fromEntries(Object.values(real.teams).flatMap((team) => team.drivers.map((id) => [id, team.id])));
    // A rival driver who really raced on in 2009 for a team still on the grid.
    const target = Object.values(career.world.drivers).find((driver) => driver.status === "grid" && driver.teamId !== "williams" && realTeamOf[driver.id] && realTeamOf[driver.id] !== "williams");
    career.market.signed[target.id] = { driverId: target.id, salary: 1, years: 2, role: "equal", seat: "race", fee: 0 };
    turn(career);
    const hit = realTeamOf[target.id];
    expect(career.world.drivers[target.id].teamId).toBe("williams");
    Object.values(career.world.teams).forEach((team) => {
      expect(team.drivers).toHaveLength(2);
      if (team.id === "williams" || team.id === hit || !real.teams[team.id]) return;
      expect([team.id, [...team.drivers].sort()]).toEqual([team.id, [...real.teams[team.id].drivers].sort()]);
    });
    // The team that lost him keeps its other real driver and signs someone else.
    const other = real.teams[hit].drivers.filter((id) => id !== target.id);
    other.forEach((id) => expect(career.world.teams[hit].drivers).toContain(id));
    expect(career.world.teams[hit].drivers).not.toContain(target.id);
  });

  it("announces pre-contracts during the season that are history's real moves", () => {
    const career = createCareer(context, { year: 2012, teamId: "hrt", seed: "pre-strict" });
    career.round = Math.ceil(career.world.races.length * balance.openShare);
    expect(marketOpen(career)).toBe(true);
    const plan = openSeasonMarket(context, career);
    expect(plan.year).toBe(2013);
    const real = seasonWorld(context, 2013, "real");
    const precontracts = Object.entries(career.market.precontracts);
    expect(precontracts.length).toBeGreaterThan(0);
    precontracts.forEach(([driverId, deal]) => expect(real.teams[deal.teamId].drivers).toContain(driverId));
    // Idempotent: a second call changes nothing.
    expect(openSeasonMarket(context, career)).toBe(plan);
  });
});

describe("RF-STF-06, SRS 6.1 · free mode is an open market", () => {
  it("never puts a real driver on the grid before the season he really debuted", () => {
    const profiles = context.bootstrap.driverProfiles;
    pairs.forEach((year) => {
      const career = turn(createCareer(context, { year, teamId: lastSelectable(year), seed: `debut-${year}`, mode: "free" }));
      Object.values(career.world.teams).forEach((team) => {
        if (team.id === career.teamId) return;
        team.drivers.forEach((id) => {
          const driver = career.world.drivers[id];
          const first = driver.real ? profiles[driver.name]?.firstYear : null;
          if (first) expect([driver.name, first <= year + 1]).toEqual([driver.name, true]);
        });
      });
    });
  });

  it("turns drivers over like the real paddock did in 1976-2025 (f1db, market.json real)", () => {
    const t = { n: 0, stay: 0, left: 0, up: 0, upN: 0, rook: 0, seats: 0, tier: { top: [0, 0], mid: [0, 0], low: [0, 0] }, top3: [0, 0], beat: [0, 0], lost: [0, 0] };
    const profiles = context.bootstrap.driverProfiles;
    pairs.forEach((year) => {
      [0, 1].forEach((run) => {
        const career = createCareer(context, { year, teamId: Object.values(seasonWorld(context, year, "pick").teams).filter((team) => !team.partial)[0].id, seed: `cal${year}-${run}`, mode: "free" });
        const prev = career.world;
        const count = Object.keys(prev.teams).length;
        const grid = Object.values(prev.teams).flatMap((team) => team.drivers.map((id) => ({ id, team })));
        const top3 = protectedDrivers(prev);
        const beats = {};
        Object.values(prev.teams).forEach((team) => {
          const [a, b] = team.drivers.map((id) => prev.drivers[id]);
          if (a && b) {
            beats[a.id] = a.rating >= b.rating;
            beats[b.id] = !beats[a.id];
          }
        });
        const pos = Object.fromEntries(Object.values(prev.teams).map((team) => [team.id, team.realPosition ?? count]));
        const everGrid = new Set(grid.map((row) => row.id));
        turn(career);
        const now = {};
        Object.values(career.world.teams).forEach((team) => {
          team.drivers.forEach((id) => {
            now[id] = team.id;
          });
          if (team.id === career.teamId) return;
          team.drivers.forEach((id) => {
            const driver = career.world.drivers[id];
            const profile = profiles[driver.name];
            t.seats += 1;
            if (!everGrid.has(id) && (!driver.real || !profile || profile.firstYear >= year + 1)) t.rook += 1;
          });
        });
        grid.forEach(({ id, team }) => {
          if (team.id === career.teamId) return;
          const stayed = now[id] === team.id;
          t.n += 1;
          t.stay += stayed;
          if (!now[id]) t.left += 1;
          else if (!stayed && pos[now[id]] !== undefined) {
            t.upN += 1;
            t.up += pos[now[id]] < pos[team.id];
          }
          const frac = (pos[team.id] - 1) / Math.max(1, count - 1);
          const tier = frac < 1 / 3 ? "top" : frac < 2 / 3 ? "mid" : "low";
          t.tier[tier][0] += stayed;
          t.tier[tier][1] += 1;
          if (top3.has(id)) {
            t.top3[0] += stayed;
            t.top3[1] += 1;
          }
          if (beats[id] !== undefined) {
            const key = beats[id] ? "beat" : "lost";
            t[key][0] += stayed;
            t[key][1] += 1;
          }
        });
      });
    });
    const real = balance.real;
    const tol = real.tolerance;
    const measured = {
      stayRate: t.stay / t.n,
      top: t.tier.top[0] / t.tier.top[1],
      mid: t.tier.mid[0] / t.tier.mid[1],
      low: t.tier.low[0] / t.tier.low[1],
      top3Stay: t.top3[0] / t.top3[1],
      beatMateStay: t.beat[0] / t.beat[1],
      lostMateStay: t.lost[0] / t.lost[1],
      rookieSeatShare: t.rook / t.seats,
      leftF1Rate: t.left / t.n,
      moversToBetterTeam: t.up / t.upN,
    };
    const target = { ...real, ...real.stayByTier };
    Object.entries(measured).forEach(([key, value]) => expect([key, Math.abs(value - target[key]) <= tol]).toEqual([key, true]));
    // The ordering by tier is the real one.
    expect(measured.top).toBeGreaterThan(measured.mid);
    expect(measured.mid).toBeGreaterThan(measured.low);
    expect(measured.beatMateStay).toBeGreaterThan(measured.lostMateStay);
  });

  it("does not copy history: free mode moves drivers that history kept, and vice versa", () => {
    let differ = 0;
    [2005, 2010, 2019].forEach((year) => {
      const career = turn(createCareer(context, { year, teamId: lastSelectable(year), seed: `open-${year}`, mode: "free" }));
      const real = seasonWorld(context, year + 1, "real");
      Object.values(career.world.teams).forEach((team) => {
        if (real.teams[team.id] && [...team.drivers].sort().join() !== [...real.teams[team.id].drivers].sort().join()) differ += 1;
      });
    });
    expect(differ).toBeGreaterThan(3);
  });

  it("announces pre-contracts, keeps them off the player's table and honours them at the turn of the year", () => {
    const career = createCareer(context, { year: 2010, teamId: "williams", seed: "pre-free", mode: "free" });
    career.round = Math.ceil(career.world.races.length * balance.openShare);
    openSeasonMarket(context, career);
    const deals = Object.entries(career.market.precontracts);
    expect(deals.length).toBeGreaterThan(0);
    const [driverId] = deals[0];
    const driver = career.world.drivers[driverId];
    expect(marketStatusOf(career, driver)).toBe("precontract");
    expect(askingTerms(career, driver)).toMatchObject({ willing: false, reason: "precontract" });
    expect(makeOffer(career, driverId, { salary: 1e9, years: 2, role: "first", start: "next" }).status).toBe("precontract");
    // Renewals are visible now as longer contracts.
    (career.market.ai.renewals || []).forEach((id) => expect(career.world.drivers[id].contract.until).toBeGreaterThanOrEqual(2011));
    turn(career);
    deals.forEach(([id, deal]) => {
      if (career.world.teams[deal.teamId]) expect([id, career.world.drivers[id].teamId]).toEqual([id, deal.teamId]);
    });
  });
});

describe("RF-SIM-15, RNF-05 · deterministic per seed", () => {
  it("the same seed gives the same market; another seed, another market", () => {
    const run = (seed) => lineups(turn(createCareer(context, { year: 2005, teamId: "minardi", seed, mode: "free" })));
    expect(run("same")).toEqual(run("same"));
    const others = ["a", "b", "c"].map(run);
    expect(others.some((other) => JSON.stringify(other) !== JSON.stringify(others[0]))).toBe(true);
  });

  it("the mid-season plan is reproducible too", () => {
    const plan = (seed) => {
      const career = createCareer(context, { year: 2016, teamId: "sauber", seed, mode: "free" });
      career.round = Math.ceil(career.world.races.length * balance.openShare);
      openSeasonMarket(context, career);
      return career.market.precontracts;
    };
    expect(plan("p1")).toEqual(plan("p1"));
  });
});

describe("RF-STF-04 · the player's offers: desirability and money", () => {
  const freeDriver = (career) =>
    Object.values(career.world.drivers)
      .filter((driver) => marketStatusOf(career, driver) === "free" && driver.age >= 20 && driver.rating < balance.asking.eliteRating)
      .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id))[0];

  it("the same driver is keener on a desirable team and asks it for less", () => {
    const top = createCareer(context, { year: 2012, teamId: "red-bull", seed: "offer" });
    const bottom = createCareer(context, { year: 2012, teamId: "hrt", seed: "offer" });
    const driver = freeDriver(top);
    const askTop = askingTerms(top, top.world.drivers[driver.id]);
    const askBottom = askingTerms(bottom, bottom.world.drivers[driver.id]);
    expect(askTop.desirability).toBeGreaterThan(askBottom.desirability);
    expect(askTop.interest).toBeGreaterThan(askBottom.interest);
  });

  it("the same share of his ask is accepted by the desirable team and not by the backmarker, until it pays more", () => {
    const top = createCareer(context, { year: 2012, teamId: "red-bull", seed: "money" });
    const bottom = createCareer(context, { year: 2012, teamId: "hrt", seed: "money" });
    const driver = freeDriver(top);
    const askTop = askingTerms(top, top.world.drivers[driver.id]);
    const askBottom = askingTerms(bottom, bottom.world.drivers[driver.id]);
    // The money share each team needs to reach the accept mark (market.json offer), with his role and years.
    const O = balance.offer;
    const needed = (ask) => (O.accept + O.offset - O.roleWeight - O.yearsWeight - O.interestWeight * ask.interest) / O.moneyWeight;
    expect(needed(askTop)).toBeLessThan(needed(askBottom));
    const share = (needed(askTop) + needed(askBottom)) / 2;
    const offer = (career, ask, ratio) => makeOffer(career, driver.id, { salary: Math.round(ask.salary * ratio), years: ask.years, role: ask.role, start: "next" }).status;
    expect(offer(top, askTop, share)).toBe("accepted");
    expect(offer(bottom, askBottom, share)).not.toBe("accepted");
    // More money closes the deal at the backmarker.
    const again = createCareer(context, { year: 2012, teamId: "hrt", seed: "money" });
    expect(offer(again, askBottom, Math.min(O.moneyCap, needed(askBottom) + 0.02))).toBe("accepted");
    expect(signDriver(again, driver.id, { start: "next", seat: "race" }).ok).toBe(true);
  });

  it("a protected driver under contract is not for sale, and will not talk to a backmarker", () => {
    const career = createCareer(context, { year: 2012, teamId: "hrt", seed: "star" });
    const stars = [...protectedDrivers(career.world)];
    expect(stars).toHaveLength(balance.protected.topCount);
    const star = career.world.drivers[stars[0]];
    expect(isProtected(career.world, star.id)).toBe(true);
    const ask = askingTerms(career, star);
    expect(ask).toMatchObject({ willing: false, reason: "protected", protected: true, role: "first" });
    expect(makeOffer(career, star.id, { salary: ask.salary * 1.35, years: ask.years, role: "first", start: "next" }).status).toBe("protected");
  });
});
