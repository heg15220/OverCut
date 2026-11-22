/**
 * RF-DEV-08: part damage in four states - perfect, light, heavy, destroyed.
 *
 * The race engines already say what happened to every car: contact events,
 * retirements by collision or accident, spins (`mistake`) and failures. After
 * each race the career turns those into damage on the player's fitted body
 * parts (development.json damage.incidents), on a seeded stream (RF-SIM-15).
 * A destroyed part has to be replaced by a spare; without one the factory
 * builds an emergency unit at the emergency pace's price. Light and heavy
 * damage stay on the car, costing stat points, until the player fits a spare.
 *
 * Rivals are a cheap form: they always have spares and are not tracked.
 */

import { substream } from "../../../overcutTrayectoria/engine/rng";
import DEV from "../../data/balance/development.json";

const RANK = Object.fromEntries(DEV.damage.states.map((state, index) => [state, index]));

/** The race's incidents per driver, small enough to keep on the weekend result. */
export const raceIncidents = (state) => {
  const byCar = Object.fromEntries(state.cars.map((car) => [car.id, car.driverId || car.id]));
  const out = [];
  (state.events || []).forEach((event) => {
    if (event.type === "contact") out.push({ driverId: byCar[event.carId] || event.carId, kind: "contact" });
    else if (event.type === "mistake") out.push({ driverId: byCar[event.carId] || event.carId, kind: "mistake" });
    else if (event.type === "dnf" && (event.reason === "collision" || event.reason === "accident")) out.push({ driverId: byCar[event.carId] || event.carId, kind: event.reason });
  });
  return out;
};

const pick = (stream, weights) => {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = stream.range(0, total);
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1]?.[0];
};

/** A hit on a part already damaged: the worse state, and two heavy hits destroy it. */
export const worsen = (current, hit) => {
  const now = RANK[current] ?? 0;
  const add = RANK[hit] ?? 0;
  if (now >= RANK.heavy && add >= RANK.heavy) return "destroyed";
  if (now >= RANK.light && add >= RANK.light && now === add) return DEV.damage.states[Math.min(RANK.destroyed, now + 1)];
  return DEV.damage.states[Math.max(now, add)];
};

/**
 * Damage rolls for one driver's incidents: [{ part, severity }]. Only parts the
 * car has are hit.
 */
export const rollDamage = ({ incidents, seed, year, round, driverId, parts }) => {
  const stream = substream(seed, "damage", year, round, driverId);
  const hits = [];
  incidents.forEach((incident) => {
    const spec = DEV.damage.incidents[incident.kind];
    if (!spec || !stream.chance(spec.chance)) return;
    for (let hit = 0; hit < spec.hits; hit += 1) {
      const weights = Object.fromEntries(Object.entries(spec.parts).filter(([part]) => parts.includes(part)));
      const part = pick(stream, weights);
      const severity = pick(stream, spec.severity);
      if (part && severity) hits.push({ part, severity });
    }
  });
  return hits;
};

export const CONDITION_RANK = RANK;
