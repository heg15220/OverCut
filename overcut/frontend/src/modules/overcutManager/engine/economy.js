/**
 * Money.
 *
 * Everything is priced in 2024 dollars and then scaled to the season, because a
 * 1955 works team ran on what a 2024 team spends on catering. The curve is a
 * plain compound growth that puts a modern top budget near half a billion and a
 * 1950s one in the low millions - the shape matters more than the decimals.
 *
 * What a season costs and earns, in order of size:
 *
 *   sponsors     prestige buys partners. Paid race by race.
 *   prize money  where you finished last year in the constructors' table.
 *   operations   travel, freight, the factory lights. Per race.
 *   salaries     two drivers and the four people who run the team.
 *   development  whatever the player decides to spend on the car - the only
 *                discretionary line, and from 2021 the one the cost cap bites.
 */

import { clamp } from "../../overcutTrayectoria/engine/rng";
import finance from "../data/balance/finance.json";

// RNF-07: every number below comes from data/balance/finance.json.
const E = finance.economy;

export const moneyScale = (year) => Math.max(E.moneyFloor, Math.pow(E.moneyGrowth, year - 2024));

export const roundMoney = (value) => {
  const abs = Math.abs(value);
  const step = abs >= 1e8 ? 1e6 : abs >= 1e7 ? 1e5 : abs >= 1e6 ? 1e4 : abs >= 1e5 ? 1e3 : 100;
  return Math.round(value / step) * step;
};

/** Season sponsorship for a team of this prestige (0..1). */
export const sponsorIncome = (prestige, year) => roundMoney((E.sponsorBase + E.sponsorPerPrestige * clamp(prestige, 0, 1)) * moneyScale(year));

const prizeEraFor = (year) =>
  finance.prizeFund.eras.find((era) => year >= era.from && (era.to === null || year <= era.to)) || finance.prizeFund.eras[finance.prizeFund.eras.length - 1];

/**
 * Prize money for a constructors' position (RF-FIN-03), by era. The real fund is
 * secret in detail and public in shape: the champion takes a few times what the
 * last team does. The curve per era lives in finance.json `prizeFund`.
 */
export const prizeMoney = (position, teamCount, year) => {
  const era = prizeEraFor(year);
  const pos = clamp(position || teamCount, 1, Math.max(teamCount, 1));
  const top = era.top;
  const bottom = teamCount > finance.prizeFund.largeGridTeams ? era.bottomLargeGrid : era.bottom;
  const share = teamCount > 1 ? (pos - 1) / (teamCount - 1) : 0;
  return roundMoney((top - (top - bottom) * Math.pow(share, era.exponent)) * moneyScale(year));
};

/** Running the team for one Grand Prix. */
export const operatingCostPerRace = (prestige, raceCount, year) =>
  roundMoney(((E.operationsBase + E.operationsPerPrestige * clamp(prestige, 0, 1)) / Math.max(1, raceCount)) * moneyScale(year));

/** A driver's season salary at a team of this prestige. */
export const driverSalary = (rating, prestige, year) => {
  const d = E.driverSalary;
  return roundMoney(d.base * Math.exp((clamp(rating, 40, 99) - d.ratingFrom) * d.ratingSlope) * (d.prestigeFloor + d.prestigeSlope * clamp(prestige, 0, 1)) * moneyScale(year));
};

export const staffSalary = (rating, year) => {
  const s = E.staffSalary;
  return roundMoney(s.base * Math.exp((clamp(rating, 30, 99) - s.ratingFrom) * s.ratingSlope) * moneyScale(year));
};

/**
 * The full cost cap of a year in nominal dollars (RF-FIN-02), or null before it
 * existed. `fromRules` is rulesFor(era).budgetCap when the caller has it (pack
 * or era-defaults, in millions); finance.json `costCap.byYear` covers the rest.
 */
export const fullCostCapFor = (year, fromRules) => {
  const cap = finance.costCap;
  if (year < cap.introducedIn) return null;
  if (fromRules !== undefined && fromRules !== null) return fromRules < 1e4 ? fromRules * 1e6 : fromRules;
  const known = cap.byYear.find((entry) => year >= entry.from && year <= entry.to);
  if (known) return known.amountM * 1e6;
  const last = cap.byYear[cap.byYear.length - 1];
  return roundMoney(last.amountM * 1e6 * Math.pow(1 + cap.growthAfterLast, year - last.to));
};

/**
 * Legacy development-only cap (career.developmentCapLeft): the share of the
 * full cap a real team spends on development. The full, category-aware cap is
 * engine/finance `costCapStatus` / `costCapLeft`.
 */
export const costCapFor = (year) => {
  const cap = fullCostCapFor(year);
  return cap === null ? null : roundMoney(cap * finance.costCap.legacyDevelopmentShare);
};

/**
 * Format for the UI: "$12.4M", "$850K". Dollars because Formula 1 has been paid
 * in dollars for longer than most of its teams have existed.
 */
export const formatMoney = (value, locale = "es") => {
  const abs = Math.abs(value || 0);
  const sign = value < 0 ? "−" : "";
  const decimal = locale === "es" ? "," : ".";
  const fmt = (number, digits) => number.toFixed(digits).replace(".", decimal);
  if (abs >= 1e9) return `${sign}$${fmt(abs / 1e9, 2)}B`;
  if (abs >= 1e6) return `${sign}$${fmt(abs / 1e6, abs >= 1e8 ? 0 : 1)}M`;
  if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}K`;
  return `${sign}$${Math.round(abs)}`;
};
