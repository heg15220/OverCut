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

export const moneyScale = (year) => Math.max(0.0045, Math.pow(1.068, year - 2024));

export const roundMoney = (value) => {
  const abs = Math.abs(value);
  const step = abs >= 1e8 ? 1e6 : abs >= 1e7 ? 1e5 : abs >= 1e6 ? 1e4 : abs >= 1e5 ? 1e3 : 100;
  return Math.round(value / step) * step;
};

/** Season sponsorship for a team of this prestige (0..1). */
export const sponsorIncome = (prestige, year) => roundMoney((40e6 + 230e6 * clamp(prestige, 0, 1)) * moneyScale(year));

/**
 * Prize money for a constructors' position. The real fund is secret in detail
 * and public in shape: the champion takes roughly two and a half times what the
 * last team does.
 */
export const prizeMoney = (position, teamCount, year) => {
  const pos = clamp(position || teamCount, 1, Math.max(teamCount, 1));
  const top = 140e6;
  const bottom = teamCount > 10 ? 30e6 : 55e6;
  const share = teamCount > 1 ? (pos - 1) / (teamCount - 1) : 0;
  return roundMoney((top - (top - bottom) * Math.pow(share, 0.85)) * moneyScale(year));
};

/** Running the team for one Grand Prix. */
export const operatingCostPerRace = (prestige, raceCount, year) =>
  roundMoney(((70e6 + 60e6 * clamp(prestige, 0, 1)) / Math.max(1, raceCount)) * moneyScale(year));

/** A driver's season salary at a team of this prestige. */
export const driverSalary = (rating, prestige, year) =>
  roundMoney(0.8e6 * Math.exp((clamp(rating, 40, 99) - 60) * 0.13) * (0.7 + 0.6 * clamp(prestige, 0, 1)) * moneyScale(year));

export const staffSalary = (rating, year) => roundMoney(0.5e6 * Math.exp((clamp(rating, 30, 99) - 50) * 0.062) * moneyScale(year));

/**
 * The cost cap, from its introduction in 2021. The real cap covers almost all
 * spending; in the game it is applied to development, which is the part the
 * player controls, at the share of the cap a real team spends on it.
 */
const CAP_BY_YEAR = { 2021: 145e6, 2022: 140e6, 2023: 135e6, 2024: 135e6, 2025: 135e6, 2026: 215e6 };
const DEVELOPMENT_SHARE = 0.45;

export const costCapFor = (year) => {
  if (year < 2021) return null;
  const known = CAP_BY_YEAR[year];
  const cap = known ?? 215e6 * Math.pow(1.03, year - 2026);
  return roundMoney(cap * DEVELOPMENT_SHARE);
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
