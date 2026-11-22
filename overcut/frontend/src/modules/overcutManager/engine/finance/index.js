/**
 * Finances (RF-FIN-01..05): budget by category, the cost cap, income and the
 * hooks the career loop calls.
 *
 * Hooks (career.js owns the loop; these are the call sites):
 *
 *   createFinance(career)            createCareer, after the career object exists and before setObjectives
 *   financeAfterRace(career, summary) closeWeekend, in place of the private raceFinances(career)
 *   hqAdvance(career, 1)             closeWeekend, next to progressDevelopment (engine/hq)
 *   financeSeasonEnd(career)         endSeason, right after seasonReview(career)
 *   financeNewSeason(career)         offseason.startNextSeason, after the new world, teamId and
 *                                    finances.season are set (end of the function)
 *   costCapLeft(career)              replacement for career.developmentCapLeft (full cap, projected)
 *
 * Save upgrade (RNF-06): ensureFinance(career) and ensureHq(career) (engine/hq)
 * add every new field to an old career in place; both are idempotent.
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import finance from "../../data/balance/finance.json";
import { adjustConfidence, ensureBoard } from "../board";
import { fullCostCapFor, moneyScale, operatingCostPerRace, prizeMoney, roundMoney, sponsorIncome } from "../economy";
import { addInbox } from "../inbox";
import { eraWithRegulations } from "../packs/packWorld";
import { RULES_YEAR_MAX, rulesFor } from "../rules";
import { engineFeePerRace } from "../development";
import { driversOf } from "../world";
import { ensureHq, hqAdvance, hqEffect, hqMaintenancePerRace, hqNewSeason } from "../hq";
import { CATEGORIES, capYearOf, categoryCountsForCap, categoryOf, compactRow, ensureBooks, legacyCategory, postTransaction, txView } from "./ledger";
import { midSeasonOfferCount, refreshSponsorOffers, sponsorBonusesFor } from "./sponsors";

export * from "./ledger";
export * from "./sponsors";
export { hqAdvance };

const userTeamOf = (career) => career.world.teams[career.teamId];
const scaled = (career, amount) => roundMoney(amount * moneyScale(career.year));

// ------------------------------------------------------------ save upgrade

/**
 * RNF-06: upgrade a career in place. Old ledger rows get a category, an id and
 * cap fields; aggregates are rebuilt from the rows that survived; the year's
 * opening balance is set so the audit holds from here on.
 */
export const ensureFinance = (career) => {
  if (!career?.finances) return null;
  const f = career.finances;
  // Version-1 rows have a kind and no category; migrate them whenever they show up.
  const migrate = f.booksVersion !== 1 || (Array.isArray(f.ledger) && f.ledger.some((row) => !row.category));
  ensureBooks(career);
  if (!Array.isArray(f.sponsors)) f.sponsors = [];
  if (!Array.isArray(f.sponsorOffers)) f.sponsorOffers = [];
  if (!Array.isArray(f.capReports)) f.capReports = [];
  if (f.capPenalty === undefined) f.capPenalty = null;
  if (!f.opening) f.opening = {};
  if (migrate) {
    // Rows written by the version-1 ledger: { year, round, amount, kind, ...extra }.
    f.ledger.forEach((row, index) => {
      if (row.category) return;
      const mapped = legacyCategory(row.kind);
      const { year, round, amount, kind, ...extra } = row;
      const capYear = year;
      const counts = mapped.countsForCap === undefined ? categoryCountsForCap(mapped.category, capYear) : mapped.countsForCap;
      const share = categoryOf(mapped.category).capShare ?? 1;
      Object.keys(row).forEach((key) => delete row[key]);
      Object.assign(row, compactRow({ id: `tx-legacy-${f.ledger.length - index}`, year, round, capYear, category: mapped.category, amount, countsForCap: counts, capAmount: counts && amount < 0 ? Math.round(-amount * share) : 0, kind, meta: extra }));
    });
    f.byYear = {};
    f.capSpend = {};
    f.ledger.map(txView).forEach((row) => {
      const year = (f.byYear[row.year] = f.byYear[row.year] || { income: 0, spend: 0, byCategory: {} });
      if (row.amount >= 0) year.income += row.amount;
      else year.spend -= row.amount;
      year.byCategory[row.category] = (year.byCategory[row.category] || 0) + row.amount;
      if (row.capAmount) f.capSpend[row.capYear] = (f.capSpend[row.capYear] || 0) + row.capAmount;
    });
    f.booksVersion = 1;
  }
  if (f.opening[career.year] === undefined) {
    const net = Object.values(f.byYear[career.year]?.byCategory || {}).reduce((sum, value) => sum + value, 0);
    f.opening[career.year] = f.balance - net;
  }
  ensureBoard(career);
  // One batch of sponsor offers per season, even for a save that never had any.
  if (f.offersYear !== career.year && career.world?.teams?.[career.teamId]) {
    f.offersYear = career.year;
    refreshSponsorOffers(career, { reason: "season" });
  }
  return f;
};

/** createCareer hook: books, headquarters and the first sponsor offers. */
export const createFinance = (career) => {
  ensureFinance(career);
  ensureHq(career);
  return career.finances;
};

// ------------------------------------------------------------ the race bill

const staffSplit = (career) => {
  const people = Object.values(career.staff || {}).filter(Boolean).sort((a, b) => (b.salary || 0) - (a.salary || 0));
  const top = finance.costCap.staffTopExcluded;
  return { excluded: people.slice(0, top).reduce((sum, p) => sum + (p.salary || 0), 0), counted: people.slice(top).reduce((sum, p) => sum + (p.salary || 0), 0) };
};

/**
 * Fixed costs of one Grand Prix, by category, as positive amounts:
 * [{ category, kind, amount, countsForCap?, meta }]. Used to charge a race and to
 * project what the rest of the year will take from the cap.
 */
export const raceCostLines = (career) => {
  const team = userTeamOf(career);
  const year = career.year;
  const raceCount = career.world.races.length || 1;
  const drivers = driversOf(career.world, team.id).reduce((sum, driver) => sum + (driver.contract?.salary || 0), 0);
  const reserve = team.reserve ? career.world.drivers[team.reserve]?.contract?.salary || 0 : 0;
  const staff = staffSplit(career);
  // RF-DEV-05 (parts module): custom teams pay their engine's price, real customers the supplier's fee.
  const engine = team.engine ? team.engine.price * moneyScale(year) : engineFeePerRace(career, team) * raceCount;
  const lines = [
    { category: "operations", kind: "race-operations", amount: operatingCostPerRace(team.prestige, raceCount, year) },
    { category: "salaries", kind: "driver-salaries", amount: roundMoney((drivers + reserve) / raceCount), countsForCap: false, meta: { who: "drivers" } },
    { category: "salaries", kind: "staff-salaries", amount: roundMoney(staff.excluded / raceCount), countsForCap: false, meta: { who: "staff-top" } },
    { category: "salaries", kind: "staff-salaries", amount: roundMoney(staff.counted / raceCount), countsForCap: true, meta: { who: "staff" } },
    { category: "engine", kind: "engine-lease", amount: roundMoney(engine / raceCount), meta: { engine: team.engine?.id || null } },
    { category: "facilities", kind: "hq-maintenance", amount: hqMaintenancePerRace(career) },
  ];
  return lines.filter((line) => line.amount > 0);
};

const capAmountOf = (line, capYear) => {
  const counts = line.countsForCap === undefined ? categoryCountsForCap(line.category, capYear) : line.countsForCap;
  return counts ? line.amount * (categoryOf(line.category).capShare ?? 1) : 0;
};

/**
 * Engine sales (RF-FIN-03). A works team charges its customers. Who is a
 * customer is decided by the parts module; this reads, in order:
 *
 *   1. team.engineSupply = { customers: ["williams", …], fee? }   explicit list
 *      (fee = season fee per customer in 2024 USD; default finance.json)
 *      or team.engine.customers;
 *   2. otherwise, if team.parts.supply.works: every other team whose
 *      parts.supply has the same manufacturer and works=false, each paying its
 *      own parts.supply.fee (2024 USD; finance.json default when absent).
 *
 * Returns the season income in this year's dollars.
 */
export const engineCustomersOf = (career, teamId = career.teamId) => {
  const team = career.world.teams[teamId];
  if (!team) return [];
  const listed = team.engineSupply?.customers || team.engine?.customers;
  const fallback = team.engineSupply?.fee ?? finance.engineSupply.feePerCustomer;
  if (Array.isArray(listed)) return listed.filter((id) => id !== teamId && career.world.teams[id]).map((id) => ({ teamId: id, fee: fallback }));
  const own = team.parts?.supply;
  if (!own?.works || !own.manufacturer) return [];
  return Object.values(career.world.teams)
    .filter((other) => other.id !== teamId && other.parts?.supply && !other.parts.supply.works && other.parts.supply.manufacturer === own.manufacturer)
    .map((other) => ({ teamId: other.id, fee: other.parts.supply.fee || fallback }));
};

export const engineSupplyIncome = (career, teamId = career.teamId) =>
  scaled(career, engineCustomersOf(career, teamId).reduce((sum, customer) => sum + customer.fee, 0));

/** What a crashed car costs (RF-FIN-01 incidents). */
export const incidentCost = (career, status) => {
  const inc = finance.incidents;
  if (!inc.enabled || !inc[status]) return 0;
  return scaled(career, inc[status]);
};

/**
 * One Grand Prix of money in and out, every line a transaction. Call it from
 * closeWeekend in place of raceFinances (it pays the same base sponsorship,
 * prize instalment, extra deals and fixed costs, plus sponsor bonuses,
 * hospitality, engine sales, maintenance and crash damage).
 */
export const financeAfterRace = (career, summary) => {
  ensureFinance(career);
  ensureHq(career);
  const team = userTeamOf(career);
  const year = career.year;
  const raceCount = career.world.races.length || 1;
  const teamCount = Object.keys(career.world.teams).length;
  const posted = [];
  const post = (entry) => {
    if (!entry.amount) return;
    posted.push(postTransaction(career, entry));
  };

  const commercial = (career.staff.commercial?.rating ?? 60) - 60;
  post({ amount: roundMoney((sponsorIncome(team.prestige, year) * (1 + commercial * finance.economy.commercialPerPoint)) / raceCount), category: "sponsorship", kind: "sponsor-base" });
  post({ amount: roundMoney(prizeMoney(career.finances.lastPosition, teamCount, year) / raceCount), category: "prize", kind: "prize-instalment", meta: { position: career.finances.lastPosition } });
  career.finances.sponsors.filter((deal) => deal.until >= year).forEach((deal) => {
    post({ amount: deal.perRace, category: "sponsorship", kind: "sponsor-deal", meta: { deal: deal.id } });
    deal.earned = (deal.earned || 0) + deal.perRace;
  });
  const bonuses = summary ? sponsorBonusesFor(career, summary) : [];
  bonuses.forEach((bonus) => {
    post({ amount: bonus.amount, category: "sponsorship", kind: "sponsor-bonus", meta: { deal: bonus.dealId, type: bonus.type } });
    const deal = career.finances.sponsors.find((entry) => entry.id === bonus.dealId);
    if (deal) deal.earned = (deal.earned || 0) + bonus.amount;
  });
  post({ amount: scaled(career, hqEffect(career, "hospitalityIncome")), category: "hospitality", kind: "hospitality" });
  post({ amount: roundMoney(engineSupplyIncome(career) / raceCount), category: "engineSupply", kind: "engine-supply" });

  raceCostLines(career).forEach((line) => post({ amount: -line.amount, category: line.category, kind: line.kind, countsForCap: line.countsForCap, meta: line.meta || {} }));
  (summary?.rows || []).filter((row) => row.teamId === career.teamId).forEach((row) => {
    const cost = incidentCost(career, row.status);
    if (cost) post({ amount: -cost, category: "incidents", kind: "crash-damage", meta: { driverId: row.driverId, status: row.status } });
  });

  career.fans = clamp((career.fans ?? 60) + hqEffect(career, "fanGrowth"), 0, 100);
  if (career.round + 1 === Math.ceil(raceCount / 2) && raceCount > 2) {
    const fresh = refreshSponsorOffers(career, { count: midSeasonOfferCount, reason: "mid" });
    if (fresh.length) addInbox(career, { kind: "sponsor-offers", count: fresh.length });
  }
  const income = posted.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0);
  const costs = -posted.filter((row) => row.amount < 0).reduce((sum, row) => sum + row.amount, 0);
  return { income, costs, bonuses, rows: posted.length };
};

// ------------------------------------------------------------ the cost cap (RF-FIN-02)

const capFromRules = (career, year) => {
  // Past the last year the rules describe, finance.json extrapolates (growthAfterLast).
  if (year > RULES_YEAR_MAX) return null;
  try {
    const source = year === career.year ? eraWithRegulations(year, career.world.regulations) : year;
    return rulesFor(source).budgetCap;
  } catch (error) {
    return null;
  }
};

/** The full cap of a cap year in dollars (nominal), or null before 2021. */
export const costCapAmount = (career, year = capYearOf(career)) => fullCostCapFor(year, capFromRules(career, year));

const breachBand = (overPct) => finance.costCap.breaches.bands.find((band) => band.maxOverPct === null || overPct <= band.maxOverPct);

/**
 * Where the team stands against the cap of `year` (default: the cap year the
 * next dollar counts for). `committed` is the counted part of the fixed costs
 * still to come that year, so `left` is what can still be spent on the car.
 */
export const costCapStatus = (career, year = capYearOf(career)) => {
  ensureBooks(career);
  const cap = costCapAmount(career, year);
  if (cap === null) return { active: false, year, cap: null, spent: 0, committed: 0, left: null, share: 0, state: "free" };
  const spent = career.finances.capSpend[year] || 0;
  const raceCount = career.world.races.length || 1;
  const racesLeft = year === career.year ? Math.max(0, raceCount - career.round) : year > career.year ? raceCount : 0;
  const perRace = raceCostLines(career).reduce((sum, line) => sum + capAmountOf(line, year), 0);
  const committed = roundMoney(perRace * racesLeft);
  const left = cap - spent - committed;
  const share = (spent + committed) / cap;
  const state = spent > cap ? "breach" : share > 1 ? "over" : share > 0.92 ? "tight" : "ok";
  return { active: true, year, cap, spent, committed, left, share, state, status: finance.costCap.byYear.find((entry) => year >= entry.from && year <= entry.to)?.status || "extrapolated" };
};

/** Replacement for career.developmentCapLeft: headroom under the full cap, or null without a cap. */
export const costCapLeft = (career) => {
  const status = costCapStatus(career);
  return status.active ? Math.max(0, status.left) : null;
};

/**
 * Before 2021 there is no cap: the budget is free and sized by the team itself
 * (RF-FIN-02). The plan the board expects: projected income minus fixed costs
 * for the rest of the year, plus the cash above a reserve.
 */
export const seasonBudget = (career) => {
  const team = userTeamOf(career);
  const year = career.year;
  const raceCount = career.world.races.length || 1;
  const racesLeft = Math.max(0, raceCount - career.round);
  const teamCount = Object.keys(career.world.teams).length;
  const incomePerRace =
    sponsorIncome(team.prestige, year) / raceCount +
    prizeMoney(career.finances.lastPosition, teamCount, year) / raceCount +
    career.finances.sponsors.filter((deal) => deal.until >= year).reduce((sum, deal) => sum + deal.perRace, 0) +
    scaled(career, hqEffect(career, "hospitalityIncome")) +
    engineSupplyIncome(career) / raceCount;
  const costPerRace = raceCostLines(career).reduce((sum, line) => sum + line.amount, 0);
  const projectedIncome = roundMoney(incomePerRace * racesLeft);
  const projectedCosts = roundMoney(costPerRace * racesLeft);
  const reserve = roundMoney(Math.max(0, projectedIncome) * finance.freeBudget.reserveShare);
  const cap = costCapStatus(career, year);
  const free = roundMoney(career.finances.balance + projectedIncome - projectedCosts - reserve);
  return {
    mode: cap.active ? "capped" : "free",
    projectedIncome,
    projectedCosts,
    reserve,
    developmentRoom: cap.active ? Math.max(0, Math.min(free, cap.left)) : Math.max(0, free),
    cap,
  };
};

/** This year's money by category: [{ id, direction, amount, es, en }]. */
export const budgetByCategory = (career, year = career.year) => {
  ensureBooks(career);
  const totals = career.finances.byYear[year]?.byCategory || {};
  return CATEGORIES.map((category) => ({ ...category, amount: totals[category.id] || 0 }));
};

// ------------------------------------------------------------ season end and start

/**
 * endSeason hook: assess the cap for the year (RF-FIN-02), fine and penalise a
 * breach for next season, settle sponsor contracts.
 */
export const financeSeasonEnd = (career) => {
  ensureFinance(career);
  const year = career.year;
  const report = { year, cap: null, spent: 0, overPct: 0, band: null, fine: 0 };
  const cap = costCapAmount(career, year);
  if (cap !== null) {
    const spent = career.finances.capSpend[year] || 0;
    const overPct = spent > cap ? ((spent - cap) / cap) * 100 : 0;
    Object.assign(report, { cap, spent, overPct: Math.round(overPct * 100) / 100 });
    if (overPct > 0) {
      const band = breachBand(overPct);
      const fine = roundMoney(band.fineFixed + band.fineMultiplier * (spent - cap));
      report.band = band.id;
      report.fine = fine;
      if (fine) postTransaction(career, { amount: -fine, category: "penalties", kind: "cost-cap-fine", countsForCap: false, meta: { year, overPct: report.overPct, band: band.id } });
      career.finances.capPenalty = band.developmentFactor < 1 ? { year: year + 1, developmentFactor: band.developmentFactor, band: band.id, from: year } : null;
      if (band.confidence) adjustConfidence(career, band.confidence, "cost-cap");
      addInbox(career, { kind: "cost-cap-breach", year, overPct: report.overPct, fine, band: band.id, factor: band.developmentFactor, stop: true });
    } else {
      report.band = "compliant";
    }
    career.finances.capReports.push(report);
  }
  const expiring = career.finances.sponsors.filter((deal) => deal.tier && deal.until === year);
  report.expiringSponsors = expiring.map((deal) => deal.id);
  return report;
};

/**
 * startNextSeason hook (call it last): open the new year's books, drop
 * finished deals, new offers, headquarters into the new season (a new team
 * means a new HQ), and the cap penalty, if any, takes effect via hqEffect.
 */
export const financeNewSeason = (career) => {
  ensureFinance(career);
  const f = career.finances;
  f.opening[career.year] = f.balance;
  f.sponsors = f.sponsors.filter((deal) => deal.until >= career.year);
  if (f.offersYear !== career.year) {
    f.offersYear = career.year;
    refreshSponsorOffers(career, { reason: "season" });
  }
  if (f.capPenalty && f.capPenalty.year < career.year) f.capPenalty = null;
  hqNewSeason(career);
  // Keep `ledgerKeepYears` seasons of rows (data); older years live on in byYear / capSpend.
  f.ledger = f.ledger.filter((row) => row.year > career.year - finance.ledgerKeepYears);
  return f;
};
