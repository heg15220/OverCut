/**
 * RF-DEV-04: aerodynamic resources - wind tunnel runs and CFD items.
 *
 * From 2021 (or whenever a season pack says aeroTestingRestriction) each team
 * gets a share of a base allowance per testing period, inversely proportional
 * to its constructors' position: the champion gets least. The allocation is set
 * from the previous season's order at the start of the year and recomputed from
 * the live table at the season share `recalcAtShare`. Before that, aero work is
 * limited only by money - and, where in-season testing was banned, by a higher
 * risk that a design does not work as the tunnel promised.
 *
 * All tables in data/balance/development.json (aeroResources).
 */

import DEV from "../../data/balance/development.json";
import { byYear, rulesFor } from "../rules";

const AERO = DEV.aeroResources;

/** Does this era restrict aero testing by position? */
export const atrActive = (era, year) => {
  const regs = rulesFor(era).regulations || {};
  if (typeof regs.aeroTestingRestriction === "boolean") return regs.aeroTestingRestriction;
  return year >= AERO.from;
};

/** The allocation (% of the base) for a constructors' position, 1-based. */
export const allocationFor = (year, position) => {
  const row = byYear(AERO.allocation, year);
  if (!row) return 100;
  const index = Math.max(0, Math.min(row.percent.length - 1, (position || row.percent.length) - 1));
  return row.percent[index];
};

/** Mean allocation of a field of `count` teams, to keep the rivals' average development unchanged. */
export const meanAllocation = (year, count) => {
  let sum = 0;
  for (let position = 1; position <= count; position += 1) sum += allocationFor(year, position);
  return count ? sum / count : 100;
};

/** Which testing period a round falls in ("W" = the winter before next season). */
export const periodOf = (round, raceCount, winter = false) => {
  if (winter) return "W";
  return String(Math.min(AERO.periodsPerSeason - 1, Math.floor((round / Math.max(1, raceCount)) * AERO.periodsPerSeason)));
};

export const allowanceFor = (percent) => ({
  windTunnelRuns: Math.round((AERO.base.windTunnelRuns * percent) / 100),
  cfdItems: Math.round((AERO.base.cfdItems * percent) / 100),
});

/** What one aero design consumes at a pace. */
export const aeroCostOf = (part, pace) => {
  const cost = AERO.cost[part];
  if (!cost) return null;
  const factor = DEV.paces[pace]?.aero ?? 1;
  return { windTunnelRuns: Math.round(cost.windTunnelRuns * factor), cfdItems: Math.round(cost.cfdItems * factor) };
};

/** Was in-season testing banned this year? */
export const testingBanned = (year) => Boolean(byYear(AERO.testingBan, year)?.ban);

export const testingRisk = (year) => (testingBanned(year) ? AERO.testingBanRisk : 1);

/**
 * The player's aero resources right now: active?, the allocation, the period
 * and what is left in it. `state` is career.rd.aero ({ period, used, percent, position }).
 */
export const aeroStatus = ({ state, era, year, round, raceCount, winter, position }) => {
  if (!atrActive(era, year)) return { active: false };
  const period = periodOf(round, raceCount, winter);
  const percent = allocationFor(year, position);
  const allowance = allowanceFor(percent);
  const used = state && state.period === period && state.year === year ? state.used : { windTunnelRuns: 0, cfdItems: 0 };
  return {
    active: true,
    period,
    position,
    percent,
    allowance,
    used,
    left: { windTunnelRuns: allowance.windTunnelRuns - used.windTunnelRuns, cfdItems: allowance.cfdItems - used.cfdItems },
  };
};

export const AERO_BALANCE = AERO;
