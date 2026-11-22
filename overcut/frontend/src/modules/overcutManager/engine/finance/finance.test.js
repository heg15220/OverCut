/**
 * Facilities, finances and the board (SRS 7.4 phase 4).
 *
 * RF-HQ-01..03, RF-FIN-01..05, RNF-06 (old saves upgrade in place), RNF-07
 * (every number from data/balance). The hooks are called here the way
 * career.js will call them (see engine/finance/index.js header).
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { createStream } from "../../../overcutTrayectoria/engine/rng";
import { reference } from "../../data/reference";
import financeData from "../../data/balance/finance.json";
import boardData from "../../data/balance/board.json";
import { PHASES, closeWeekend, createCareer, createContext, simulateWeekend } from "../career";
import { boardAfterRace, checkJobSecurity, racePar, ratingBand, setObjectives, teamRating } from "../board";
import { costCapFor, prizeMoney } from "../economy";
import { ledger } from "../market";
import { resolveEvent } from "../events";
import {
  HQ_EFFECT_KEYS, buildingLevel, ensureHq, forecastWithAccuracy, hqAdvance, hqEffect, repairBuilding, startUpgrade, startingLevels, upgradeQuote,
} from "../hq";
import {
  acceptSponsorOffer, auditFinances, bonusMet, budgetByCategory, costCapAmount, costCapLeft, costCapStatus, createFinance, engineCustomersOf, engineSupplyIncome,
  ensureFinance, financeAfterRace, financeNewSeason, financeSeasonEnd, generateSponsorOffers, seasonBudget, sponsorBonusesFor, transactions,
} from ".";

const context = createContext(fallbackBootstrap, reference);

// createCareer calls createFinance itself; calling it again must change nothing.
const newCareer = (year, teamId, seed) => {
  const career = createCareer(context, { year, teamId, seed });
  const before = JSON.stringify(career.finances);
  createFinance(career);
  expect(JSON.stringify(career.finances)).toBe(before);
  return career;
};

/** One race: closeWeekend runs hqAdvance and financeAfterRace (career.js hooks). */
const playRace = (career) => {
  simulateWeekend(career);
  const summary = career.weekend.result;
  const { stops } = closeWeekend(career);
  (stops || []).forEach((stop) => {
    const item = career.inbox.find((entry) => entry.id === stop.id);
    if (item?.kind === "event") resolveEvent(career, item.id, item.event.options[0]);
  });
  return summary;
};

const playSeason = (career) => {
  let guard = 0;
  while (career.phase !== PHASES.REVIEW && !career.ended && guard < 40) {
    playRace(career);
    guard += 1;
  }
};

const summaryWith = (career, rows) => ({ round: career.round + 1, rows, teamPoints: {} });

describe("headquarters (RF-HQ-01..03)", () => {
  it("starts every team at the size it really had that year (RF-HQ-03)", () => {
    const career = newCareer(2024, "mclaren", "hq1");
    const teams = Object.values(career.world.teams);
    const big = startingLevels(career.world.teams["red-bull"], 2024, { teamCount: teams.length });
    const small = startingLevels(career.world.teams["haas-f1-team"], 2024, { teamCount: teams.length });
    expect(big.factory).toBeGreaterThan(small.factory);
    expect(big.windTunnel).toBeGreaterThanOrEqual(small.windTunnel);
    // CFD only from the late 1990s, simulators from the mid-2000s: in the data, not in code.
    const old = startingLevels({ prestige: 0.9, realPosition: 1 }, 1990, { teamCount: 12 });
    expect(old.cfd).toBe(0);
    expect(old.simulator).toBe(0);
    expect(startingLevels({ prestige: 0.9, realPosition: 1 }, 2005, { teamCount: 10 }).cfd).toBeGreaterThan(0);
    expect(career.world.teams.mclaren.facility).toBe(buildingLevel(career, "factory"));
  });

  it("exposes measurable effects by key, neutral where the building does not exist yet (RF-HQ-02)", () => {
    const career = newCareer(2024, "mclaren", "hq2");
    HQ_EFFECT_KEYS.forEach((key) => expect(Number.isFinite(hqEffect(career, key))).toBe(true));
    expect(() => hqEffect(career, "nonsense")).toThrow();
    expect(hqEffect({ prestige: 0.9, realPosition: 1 }, "cfdEfficiency", { year: 1990 })).toBe(1);
    expect(hqEffect({ prestige: 0.9, realPosition: 1 }, "forecastAccuracy", { year: 2024 })).toBeGreaterThan(hqEffect({ prestige: 0.1, realPosition: 10 }, "forecastAccuracy", { year: 2024 }));
    // A rival through the career.
    expect(hqEffect(career, "manufacturingSlots", { teamId: "red-bull" })).toBeGreaterThanOrEqual(2);
  });

  it("upgrades take money and rounds, are booked under facilities and raise the effect", () => {
    const career = newCareer(2024, "williams", "hq3");
    career.finances.balance += 500e6;
    const slots = hqEffect(career, "manufacturingSlots");
    const level = buildingLevel(career, "factory");
    const quote = upgradeQuote(career, "factory");
    const before = career.finances.balance;
    expect(startUpgrade(career, "factory").ok).toBe(true);
    expect(career.finances.balance).toBe(before - quote.cost);
    expect(transactions(career, { category: "facilities" })[0]).toMatchObject({ kind: "hq-upgrade", amount: -quote.cost });
    expect(startUpgrade(career, "factory").error).toBe("busy");
    hqAdvance(career, quote.rounds - 1);
    expect(buildingLevel(career, "factory")).toBe(level);
    hqAdvance(career, 1);
    expect(buildingLevel(career, "factory")).toBe(level + 1);
    expect(hqEffect(career, "manufacturingSlots")).toBe(slots + 1);
    expect(career.world.teams.williams.facility).toBe(level + 1);
  });

  it("buildings wear and lose effect until repaired", () => {
    const career = newCareer(2024, "mclaren", "hq4");
    career.finances.balance += 500e6;
    const fresh = hqEffect(career, "tunnelEfficiency");
    hqAdvance(career, 90);
    const worn = hqEffect(career, "tunnelEfficiency");
    expect(Math.abs(worn - 1)).toBeLessThan(Math.abs(fresh - 1));
    expect(repairBuilding(career, "windTunnel").ok).toBe(true);
    expect(hqEffect(career, "tunnelEfficiency")).toBe(fresh);
  });

  it("a better weather centre gives a better forecast", () => {
    const error = (accuracy) => {
      const stream = createStream("forecast");
      let sum = 0;
      for (let i = 0; i < 400; i += 1) {
        const kind = i % 3 === 0 ? "wet" : i % 3 === 1 ? "mixed" : "dry";
        const truth = { dry: 0, mixed: 55, wet: 85 }[kind];
        sum += Math.abs(forecastWithAccuracy({ kind, rain: 0.3, accuracy, stream }) - truth);
      }
      return sum / 400;
    };
    expect(error(0.9)).toBeLessThan(error(0.55));
  });
});

describe("budget and transactions (RF-FIN-01)", () => {
  it("maps old ledger kinds to categories and keeps the books auditable through a season", () => {
    const career = newCareer(2024, "williams", "fin1");
    career.finances.balance -= 1000;
    ledger(career, -1000, "buyout");
    expect(transactions(career)[0]).toMatchObject({ category: "salaries", kind: "buyout", countsForCap: false, amount: -1000 });
    playSeason(career);
    const audit = auditFinances(career);
    expect(audit.ok).toBe(true);
    expect(audit.balanceDelta).toBe(audit.categorySum);
    const categories = budgetByCategory(career);
    expect(categories.find((c) => c.id === "salaries").amount).toBeLessThan(0);
    expect(categories.find((c) => c.id === "prize").amount).toBeGreaterThan(0);
    expect(categories.find((c) => c.id === "facilities").amount).toBeLessThan(0);
    expect(new Set(career.finances.ledger.map((row) => row.id)).size).toBe(career.finances.ledger.length);
    // Saves must stay small (RNF-06).
    expect(JSON.stringify(career).length).toBeLessThan(240 * 1024);
  });

  it("upgrades a version-1 career in place (RNF-06)", () => {
    const career = createCareer(context, { year: 2024, teamId: "williams", seed: "fin2" });
    // What a version-1 save looked like: rows with kind and no category, no HQ, no board history.
    career.finances.ledger = [
      { year: 2024, round: 0, amount: -2e6, kind: "development", area: "aero" },
      { year: 2024, round: 0, amount: 5e6, kind: "race-income" },
    ];
    delete career.finances.byYear;
    delete career.finances.capSpend;
    delete career.finances.txSerial;
    delete career.finances.booksVersion;
    delete career.finances.opening;
    delete career.finances.offersYear;
    delete career.board.history;
    delete career.board.band;
    delete career.hq;
    ensureFinance(career);
    ensureHq(career);
    expect(transactions(career)[0]).toMatchObject({ category: "development", kind: "development", countsForCap: true, capAmount: 2e6, meta: { area: "aero" } });
    expect(transactions(career)[1].category).toBe("sponsorship");
    expect(career.finances.capSpend[2024]).toBe(2e6);
    expect(career.board.history).toEqual([]);
    expect(career.hq.buildings.factory.level).toBeGreaterThan(0);
    expect(auditFinances(career).ok).toBe(true);
    // Idempotent.
    const copy = JSON.stringify(career);
    ensureFinance(career);
    ensureHq(career);
    expect(JSON.stringify(career)).toBe(copy);
  });
});

describe("cost cap (RF-FIN-02)", () => {
  it("does not exist before 2021: free budget by team size", () => {
    const career = newCareer(2016, "williams", "cap1");
    expect(costCapStatus(career).active).toBe(false);
    expect(costCapLeft(career)).toBeNull();
    expect(costCapFor(2020)).toBeNull();
    const budget = seasonBudget(career);
    expect(budget.mode).toBe("free");
    expect(budget.projectedIncome).toBeGreaterThan(0);
  });

  it("has each year's amount from 2021, with 2026 marked pending", () => {
    const career = newCareer(2024, "williams", "cap2");
    expect(costCapAmount(career, 2021)).toBe(145e6);
    expect(costCapAmount(career, 2022)).toBe(140e6);
    expect(costCapAmount(career, 2023)).toBe(135e6);
    expect(costCapAmount(career, 2024)).toBe(135e6);
    expect(costCapAmount(career, 2026)).toBe(215e6);
    expect(costCapAmount(career, 2027)).toBeGreaterThan(215e6);
    expect(financeData.costCap.byYear.find((entry) => entry.from === 2026).status).toBe("pending");
    // The legacy development-only figure still works for career.developmentCapLeft.
    expect(Math.abs(costCapFor(2024) - 135e6 * financeData.costCap.legacyDevelopmentShare)).toBeLessThan(1e5);
  });

  it("counts development and part of operations, not driver salaries; facilities only from 2026", () => {
    const career = newCareer(2024, "williams", "cap3");
    playRace(career);
    const rows = transactions(career, { year: 2024 });
    rows.filter((row) => row.kind === "driver-salaries").forEach((row) => expect(row.capAmount).toBe(0));
    const ops = rows.find((row) => row.kind === "race-operations");
    const share = financeData.categories.find((c) => c.id === "operations").capShare;
    expect(ops.capAmount).toBe(Math.round(-ops.amount * share));
    expect(rows.find((row) => row.kind === "hq-maintenance").countsForCap).toBe(false);
    const status = costCapStatus(career);
    expect(status.active).toBe(true);
    expect(status.spent).toBeGreaterThan(0);
    expect(status.committed).toBeGreaterThan(0);
    expect(costCapLeft(career)).toBeLessThan(status.cap);
  });

  it("fines a breach by band and cuts aero testing the next season", () => {
    const career = newCareer(2024, "williams", "cap4");
    const minor = newCareer(2024, "alpine-f1-team", "cap4b");
    career.finances.capSpend[2024] = 135e6 * 1.1;
    minor.finances.capSpend[2024] = 135e6 * 1.02;
    const tunnel = hqEffect(career, "tunnelEfficiency");
    const material = financeSeasonEnd(career);
    const small = financeSeasonEnd(minor);
    expect(material.band).toBe("material");
    expect(small.band).toBe("minor");
    expect(material.fine).toBeGreaterThan(small.fine);
    expect(transactions(career, { category: "penalties" })[0].kind).toBe("cost-cap-fine");
    expect(career.inbox[0].kind).toBe("cost-cap-breach");
    // The penalty is for the next season.
    career.year += 1;
    expect(hqEffect(career, "tunnelEfficiency")).toBeCloseTo(tunnel * 0.75, 2);
    const clean = newCareer(2024, "mclaren", "cap4c");
    expect(financeSeasonEnd(clean).band).toBe("compliant");
  });
});

describe("income (RF-FIN-03, RF-FIN-05)", () => {
  it("pays prize money by constructors' position, by era", () => {
    expect(prizeMoney(1, 10, 2024)).toBeGreaterThan(prizeMoney(10, 10, 2024));
    expect(prizeMoney(5, 10, 2010)).toBeGreaterThan(prizeMoney(6, 10, 2010));
    // 2021 Concorde: the last team earns a larger share of the champion's money than in 2010.
    expect(prizeMoney(10, 10, 2022) / prizeMoney(1, 10, 2022)).toBeGreaterThan(prizeMoney(10, 10, 2010) / prizeMoney(1, 10, 2010));
  });

  it("generates the same fictional sponsor offers from the same seed", () => {
    const a = newCareer(2024, "mclaren", "sp1");
    const b = newCareer(2024, "mclaren", "sp1");
    expect(a.finances.sponsorOffers).toEqual(b.finances.sponsorOffers);
    expect(a.finances.sponsorOffers.length).toBeGreaterThan(0);
    a.finances.sponsorOffers.forEach((offer) => {
      expect(offer.real).toBe(false);
      expect(offer.perRace).toBeGreaterThan(0);
      expect(offer.bonuses.length).toBeGreaterThan(0);
    });
    // Real names only through a user-supplied pack.
    a.sponsorPack = { real: true, sponsors: [{ name: "User Brand", sector: "fuel" }] };
    expect(generateSponsorOffers(a, { reason: "pack" })[0]).toMatchObject({ name: "User Brand", real: true });
  });

  it("pays sponsor bonuses for race objectives", () => {
    const career = newCareer(2024, "mclaren", "sp2");
    const offer = career.finances.sponsorOffers[0];
    expect(acceptSponsorOffer(career, offer.id).ok).toBe(true);
    const deal = career.finances.sponsors[career.finances.sponsors.length - 1];
    deal.bonuses = [{ type: "podium", amount: 1e6 }, { type: "points", amount: 5e5 }, { type: "bothFinish", amount: 2e5 }];
    const [a, b] = career.world.teams.mclaren.drivers;
    const good = summaryWith(career, [
      { driverId: a, teamId: "mclaren", position: 2, status: "finished", points: 18, grid: 3 },
      { driverId: b, teamId: "mclaren", position: 7, status: "finished", points: 6, grid: 8 },
    ]);
    const bad = summaryWith(career, [
      { driverId: a, teamId: "mclaren", position: 14, status: "finished", points: 0 },
      { driverId: b, teamId: "mclaren", position: null, status: "accident", points: 0 },
    ]);
    expect(sponsorBonusesFor(career, good).map((bonus) => bonus.type)).toEqual(["podium", "points", "bothFinish"]);
    expect(sponsorBonusesFor(career, bad)).toEqual([]);
    expect(bonusMet({ type: "beatRival", rivalId: "ferrari" }, { rows: [...good.rows, { teamId: "ferrari", position: 4, status: "finished" }] }, "mclaren")).toBe(true);
    const result = financeAfterRace(career, good);
    expect(result.bonuses).toHaveLength(3);
    expect(transactions(career, { category: "sponsorship" }).some((row) => row.kind === "sponsor-bonus")).toBe(true);
    // Crash damage is charged by the parts module (spares / emergency parts), not twice here.
    const incidentsBefore = transactions(career, { category: "incidents" }).length;
    financeAfterRace(career, bad);
    expect(transactions(career, { category: "incidents" }).length).toBe(incidentsBefore);
    career.finances.balance -= 3e5;
    ledger(career, -3e5, "development", { part: "frontWing", stage: "emergency" });
    expect(transactions(career, { category: "incidents" })[0]).toMatchObject({ kind: "development", countsForCap: true, capAmount: 3e5 });
  });

  it("sells engines to the customers a works team supplies", () => {
    const career = newCareer(2024, "mercedes", "eng1");
    expect(engineSupplyIncome(career)).toBe(0);
    career.world.teams.mercedes.engineSupply = { customers: ["williams", "mclaren", "aston-martin", "ghost-team"] };
    expect(engineSupplyIncome(career)).toBe(3 * financeData.engineSupply.feePerCustomer);
    financeAfterRace(career, null);
    expect(transactions(career, { category: "engineSupply" })[0].amount).toBeGreaterThan(0);
  });

  it("finds a works team's customers from the parts module's supply records", () => {
    const career = newCareer(2024, "mercedes", "eng2");
    const teams = career.world.teams;
    teams.mercedes.parts = { ...(teams.mercedes.parts || {}), supply: { manufacturer: "mercedes", works: true, fee: 0 } };
    teams.williams.parts = { ...(teams.williams.parts || {}), supply: { manufacturer: "mercedes", works: false, fee: 20e6 } };
    teams["aston-martin"].parts = { ...(teams["aston-martin"].parts || {}), supply: { manufacturer: "mercedes", works: false, fee: 20e6 } };
    teams.ferrari.parts = { ...(teams.ferrari.parts || {}), supply: { manufacturer: "ferrari", works: true, fee: 0 } };
    expect(engineCustomersOf(career).map((c) => c.teamId).sort()).toEqual(["aston-martin", "williams"]);
    expect(engineSupplyIncome(career)).toBe(40e6);
  });

  it("hospitality pays more the bigger it is", () => {
    const career = newCareer(2024, "williams", "hosp");
    career.hq.buildings.hospitality.level = 1;
    financeAfterRace(career, null);
    const low = transactions(career, { category: "hospitality" })[0].amount;
    career.hq.buildings.hospitality.level = 5;
    financeAfterRace(career, null);
    expect(transactions(career, { category: "hospitality" })[0].amount).toBeGreaterThan(low);
  });
});

describe("the board (RF-FIN-04)", () => {
  it("sets objectives by the team's rating band", () => {
    const top = newCareer(2024, "mclaren", "b1");
    const back = newCareer(2024, "haas-f1-team", "b2");
    expect(ratingBand(900).id).toBe("champion");
    expect(ratingBand(500).id).toBe("podium");
    expect(ratingBand(300).id).toBe("points");
    expect(teamRating(top)).toBeGreaterThan(teamRating(back));
    setObjectives(top);
    setObjectives(back);
    expect(top.board.band).toBe(ratingBand(teamRating(top)).id);
    const types = (career) => career.board.objectives.map((objective) => objective.type);
    if (top.board.band === "champion") expect(types(top)).toContain("wins");
    if (back.board.band === "points") expect(types(back)).toContain("points");
    expect(types(back)).toContain("budget");
  });

  it("moves −6 below expectations and +8 above by more than one position, and logs it", () => {
    const career = newCareer(2024, "williams", "b3");
    const [a, b] = career.world.teams.williams.drivers;
    const par = racePar(career);
    const r = boardData.race;
    career.board.confidence = 60;
    const start = career.board.history.length;
    boardAfterRace(career, summaryWith(career, [{ driverId: a, teamId: "williams", position: Math.ceil(par + r.belowTolerance + 1), status: "finished" }, { driverId: b, teamId: "williams", position: 20, status: "finished" }]));
    expect(career.board.confidence).toBeCloseTo(60 + r.belowExpected * r.scale, 5);
    career.board.confidence = 60;
    const above = Math.max(2, Math.floor(par - r.aboveMargin - 1));
    boardAfterRace(career, summaryWith(career, [{ driverId: a, teamId: "williams", position: above, status: "finished" }, { driverId: b, teamId: "williams", position: 20, status: "finished" }]));
    expect(career.board.confidence).toBeCloseTo(60 + r.aboveExpected * r.scale, 5);
    expect(career.board.history.length).toBe(start + 2);
    expect(career.board.history[career.board.history.length - 1]).toMatchObject({ reason: "above" });
  });

  it("warns, then sacks the principal when confidence reaches zero", () => {
    const career = newCareer(2024, "williams", "b4");
    const [a] = career.world.teams.williams.drivers;
    const crash = () => summaryWith(career, [{ driverId: a, teamId: "williams", position: null, status: "accident" }]);
    career.board.confidence = 20;
    expect(checkJobSecurity(career)).toBe("warning");
    let outcome = null;
    for (let i = 0; i < 20 && !career.ended; i += 1) outcome = boardAfterRace(career, crash());
    expect(outcome).toBe("sacked");
    expect(career.board.confidence).toBe(0);
    expect(career.ended.reason).toBe("sacked");
  });

  it("reviews the objectives mid-season", () => {
    const career = newCareer(2024, "williams", "b5");
    playSeason(career);
    if (career.ended && !career.board.midSeason) return;
    expect(career.board.midSeason).toBeTruthy();
    expect(career.inbox.some((item) => item.kind === "board-midseason")).toBe(true);
  });

  it("carries finances and HQ into the next season", () => {
    const career = newCareer(2024, "mclaren", "b6");
    career.finances.balance += 300e6;
    startUpgrade(career, "cfd");
    const report = financeSeasonEnd(career);
    expect(report.cap).toBe(135e6);
    career.year += 1;
    financeNewSeason(career);
    expect(career.finances.opening[2025]).toBe(career.finances.balance);
    expect(career.hq.buildings.cfd.upgrade).toBeTruthy();
    expect(career.finances.sponsorOffers.every((offer) => offer.year === 2025)).toBe(true);
  });
});
