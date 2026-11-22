/**
 * Shared set-up for the step-sim tests: a real weekend from the offline bootstrap, and
 * the clean-air lap filter both modes are measured with (SRS 4.2 equivalence).
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import { createCareer, createContext, createWeekendRace, currentRace, runPractice, runQualifyingSession } from "../career";

let context = null;
const contextOf = () => {
  if (!context) context = createContext(fallbackBootstrap, reference);
  return context;
};

/** A career at its first Sunday: `make()` returns a fresh quick-mode race of that weekend. */
export const weekend = ({ year = 2024, teamId = "ferrari", seed = "sim" } = {}) => {
  const career = createCareer(contextOf(), { year, teamId, seed });
  runPractice(career, {});
  runQualifyingSession(career, {});
  return { career, race: currentRace(career), make: () => createWeekendRace(career) };
};

/** Laps under (or just after) a safety car, by the leader's lap numbers in the events. */
const safetyCarLaps = (state) => {
  const laps = new Set();
  let open = null;
  state.events.forEach((event) => {
    if ((event.type === "sc" || event.type === "vsc") && open === null) open = event.lap;
    if (event.type === "sc-in" && open !== null) {
      for (let lap = open; lap <= event.lap + 1; lap += 1) laps.add(lap);
      open = null;
    }
  });
  if (open !== null) for (let lap = open; lap <= state.laps; lap += 1) laps.add(lap);
  return laps;
};

/**
 * Clean-air lap times per car: not lap 1, not an in-lap or out-lap, not under a safety
 * car, no mistake or contact, and at least `clear` seconds to the cars ahead and behind
 * at both lines of the lap. The same filter for both modes, read only from history and
 * events.
 */
export const cleanLaps = (state, clear = 1.5) => {
  const sc = safetyCarLaps(state);
  const troubled = new Set(state.events.filter((event) => event.type === "mistake" || event.type === "contact").map((event) => `${event.carId}:${event.lap}`));
  // Crossing times at every line, sorted, to read intervals ahead and behind.
  const lines = [];
  state.cars.forEach((car) => {
    car.history.forEach((entry) => {
      if (entry.retired) return;
      (lines[entry.lap] = lines[entry.lap] || []).push(entry.end);
    });
  });
  lines.forEach((times) => times && times.sort((a, b) => a - b));
  const isolated = (lap, time) => {
    if (lap === 0) return false;
    const times = lines[lap] || [];
    const index = times.indexOf(time);
    const ahead = index > 0 ? time - times[index - 1] : Infinity;
    const behind = index < times.length - 1 ? times[index + 1] - time : Infinity;
    return ahead >= clear && behind >= clear;
  };
  const spells = state.safetyCarSpells || [];
  const out = {};
  state.cars.forEach((car) => {
    const laps = [];
    car.history.forEach((entry, index) => {
      const previous = car.history[index - 1];
      if (spells.some((spell) => spell.from < entry.end + 2 && (spell.to ?? Infinity) > entry.start - 2)) return;
      if (entry.lap < 2 || entry.retired || entry.held || entry.pit || previous?.pit || sc.has(entry.lap) || troubled.has(`${car.id}:${entry.lap}`)) return;
      if (!isolated(entry.lap - 1, previous.end) || !isolated(entry.lap, entry.end)) return;
      laps.push(entry.end - entry.start);
    });
    out[car.id] = laps;
  });
  return out;
};

export const meanOf = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
export const stdOf = (values) => {
  const mean = meanOf(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1));
};
