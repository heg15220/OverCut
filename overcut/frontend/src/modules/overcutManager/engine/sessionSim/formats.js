/**
 * What a playable session is in each era (RF-WKD-01, SRS 6.2): its segments, how long
 * each runs, who drops out, the lap limit, single-lap run order and race fuel, and the
 * tyre allocation of the weekend (RF-WKD-05). Everything comes from the season's rules
 * (engine/rules.js, the pack or era-defaults) and data/balance/sessions.json (RNF-07);
 * nothing here asks "which year is it?" beyond reading those tables.
 *
 *   practice        one session (FP), free runs
 *   KNOCKOUT        Q1 Q2 Q3 (2006-): the slowest drop out, race fuel in the last
 *                   segment where the era had it (2006-2009)
 *   ONE_SESSION     one hour, twelve laps (1996-2002)
 *   TWO_SESSION     two sessions, best time of either (-1995; 12 laps from 1993)
 *   ONE_LAP         one flying lap each, in run order, on race fuel (2003-2005)
 *   AGGREGATE       two single-lap sessions added up (2005, first six rounds)
 *   shootout        the sprint shootout SQ1 SQ2 SQ3 (2023-), new tyres set by segment
 */

import balance from "../../data/balance/sessions.json";
import { byYear, rulesFor } from "../rules";
import { knockoutSplit } from "../race";

export const SESSION_BALANCE = balance;

/** The qualifying format this Grand Prix runs (the calendar's, else the era's first). */
export const qualifyingFormatOf = (eraOrRules, race = null) => {
  const formats = rulesFor(eraOrRules).qualifying.formats || [];
  const own = race?.qualifyingFormat;
  // SPRINT_RACE (2021-2022): Friday's qualifying is a knockout; the sprint then sets the grid.
  if (own && own !== "SPRINT_RACE") return own;
  return formats.find((format) => format !== "SPRINT_RACE") || "TWO_SESSION";
};

const minutesOf = (table, year) => byYear(balance.durations[table], year);
/** Seconds of break after segment `index` of a row with breakMinutes (absent: none). */
const breakOf = (row, index) => (Array.isArray(row.breakMinutes) && Number.isFinite(row.breakMinutes[index]) ? row.breakMinutes[index] * 60 : 0);

/**
 * The segments of a session. `kind` is "practice", "qualifying" or "shootout"; `field`
 * the number of cars. Each segment: name, duration (s), drop (cars out at its end),
 * lapLimit, singleLap (+ spacing), raceFuel, tyre (a mandated compound) and newTyre;
 * for the weekend's local clock (reloj-sesion, RF-WKD-01) `breakAfter` (s between the end of
 * this segment and the start of the next: sessions.json durations.*[].breakMinutes) or
 * `nextDay` (the segment runs on the following day at the same hour: two-session and
 * aggregate qualifying).
 */
export const sessionFormat = ({ kind, era, race = null, field }) => {
  const rules = rulesFor(era);
  const year = rules.year;
  if (kind === "practice") {
    const row = minutesOf("practice", year);
    return { kind, format: "practice", combine: "best", segments: [{ name: "FP", duration: row.minutes * 60, drop: 0, lapLimit: null }] };
  }
  if (kind === "shootout") {
    const row = minutesOf("sprintShootout", year);
    const split = knockoutSplit(field);
    return {
      kind,
      format: "shootout",
      combine: "knockout",
      segments: row.minutes.map((minutes, index) => ({
        name: `SQ${index + 1}`,
        duration: minutes * 60,
        drop: index < row.minutes.length - 1 ? split[index] ?? 0 : 0,
        lapLimit: null,
        tyre: row.tyres[index],
        newTyre: true,
        breakAfter: breakOf(row, index),
      })),
    };
  }
  const format = qualifyingFormatOf(rules, race);
  const raceFuel = rules.qualifying.raceFuel;
  if (format === "KNOCKOUT") {
    const row = minutesOf("knockout", year);
    const split = knockoutSplit(field);
    return {
      kind,
      format,
      combine: "knockout",
      segments: split.map((drop, index) => ({
        name: `Q${index + 1}`,
        duration: (row.minutes[index] ?? row.minutes[row.minutes.length - 1]) * 60,
        drop: index < split.length - 1 ? drop : 0,
        lapLimit: null,
        raceFuel: raceFuel && index === split.length - 1,
        // 2006-2007: the last segment starts on race fuel and burns some of it before the attempt.
        fuelBurn: Boolean(raceFuel && row.fuelBurnLast && index === split.length - 1),
        breakAfter: breakOf(row, index),
      })),
    };
  }
  if (format === "ONE_LAP" || format === "AGGREGATE") {
    const row = minutesOf("oneLap", year);
    const single = (name, fuel) => ({ name, duration: 0, drop: 0, lapLimit: 3, singleLap: true, spacing: row.spacingSec, raceFuel: fuel });
    return format === "AGGREGATE"
      ? { kind, format, combine: "sum", segments: [single("Q1", false), { ...single("Q2", raceFuel), nextDay: true }] }
      : { kind, format, combine: "best", segments: [single("Q", raceFuel)] };
  }
  if (format === "ONE_SESSION") {
    const row = minutesOf("oneSession", year);
    return { kind, format, combine: "best", segments: [{ name: "Q", duration: row.minutes * 60, drop: 0, lapLimit: row.lapLimit ?? null }] };
  }
  const row = minutesOf("twoSession", year);
  return {
    kind,
    format: "TWO_SESSION",
    combine: "best",
    segments: [
      { name: "Q1", duration: row.minutes * 60, drop: 0, lapLimit: row.lapLimit ?? null },
      { name: "Q2", duration: row.minutes * 60, drop: 0, lapLimit: row.lapLimit ?? null, nextDay: true },
    ],
  };
};

/**
 * RF-WKD-05: each driver's tyre sets for the weekend, by era (and only the compounds the
 * era has; pre-1982 a single dry tyre). Every set: id, compound, laps on it.
 */
export const tyreAllocation = (era) => {
  const rules = rulesFor(era);
  const row = byYear(balance.allocation.byYear, rules.year);
  const sets = [];
  const add = (compound, count) => {
    for (let index = 0; index < count; index += 1) sets.push({ id: `${compound}-${index + 1}`, compound, laps: 0 });
  };
  rules.tyres.compounds.forEach((compound) => add(compound, row.sets[compound] ?? (compound === "dry" ? row.sets.dry ?? 8 : 3)));
  Object.entries(row.wet || {}).forEach(([compound, count]) => add(compound, count));
  return sets;
};

/** Sprint distance in laps (2021-): about 100 km. */
export const sprintLaps = (race) => {
  const km = race.km || race.lengthKm || (race.laps ? 305 / race.laps : 5);
  return Math.max(5, Math.ceil(balance.sprint.distanceKm / km));
};
