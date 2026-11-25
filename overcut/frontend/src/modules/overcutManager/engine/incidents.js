/**
 * Failures, incidents and the first corner (RF-SIM-09, RF-SIM-14, RF-SIM-10, RF-DEV-08),
 * shared by the quick mode (race.js) and the step simulation (engine/sim): both read the
 * same hazards and the same turn-one plan, so their retirements agree (SRS 4.2).
 *
 *   mechanical  per car and race, by component group (engine, gearbox, hydraulics,
 *               electrics, suspension, ...): the era's real rate from f1db
 *               (race-reliability.json `measured`, written by
 *               overcut/src/main/resources/scripts/reliability_from_f1db.py) × the car's
 *               reliability relative to the field × the wear of the unit that carries the
 *               component (engine/development/units.js) × the damage state of the body part
 *               (RF-DEV-08). Spread over the laps.
 *   accident    a solo crash: the era's real rate after the opening laps × the driver's
 *               control (RF-STF-02) × the circuit's attrition, by lap × pace mode, water, the wrong
 *               tyre.
 *   contact     what a touch between two cars does to each of them: retirement on the spot,
 *               suspension broken (retires at the line), puncture (limps to the pits),
 *               front wing (slower until changed) or only time; debris may bring yellows,
 *               the VSC or the safety car by era.
 *   turn one    how bunched the field reaches the first braking zone: the run from each
 *               grid slot to it on the real circuit, the launch (reaction, the era's start
 *               procedure, the starts attribute and car) and, pair by pair, the overlap in time; the
 *               closer the pair and the less consistent its drivers, the likelier the touch.
 *
 * Every number is in data/balance/race-reliability.json (RNF-07); every draw is on a stream
 * the caller passes (RF-SIM-15, RNF-05).
 */

import { clamp } from "../../overcutTrayectoria/engine/rng";
import REL from "../data/balance/race-reliability.json";
import { byYear } from "./rules";
import { controlRiskOf, skillZ } from "./drivers/skills";

export const RELIABILITY = REL;

const ERAS = REL.measured.eras;

/** The f1db figures of the era window that holds `year` (the nearest window outside them). */
export const measuredFor = (year) => {
  const hit = ERAS.find((era) => year >= era.years[0] && year <= era.years[1]);
  if (hit) return hit;
  return year < ERAS[0].years[0] ? ERAS[0] : ERAS[ERAS.length - 1];
};

/** The calibration scales of `year` (race-reliability.json calibration.eras). */
export const calibrationFor = (year) => byYear(REL.calibration.eras, year);

/** A per-race probability spread evenly over `laps` laps. */
export const perLapOf = (probability, laps) => 1 - Math.pow(1 - clamp(probability, 0, 0.95), 1 / Math.max(1, laps));

export const MECHANICAL_GROUPS = Object.keys(ERAS[0].mechanicalByGroup);

/** RF-SIM-14: wear (0 new .. 1 end of life) of a unit → the hazard multiplier of its group. */
export const wearFactorOf = (wear) => {
  const spec = REL.mechanical.wear;
  if (!Number.isFinite(wear)) return 1;
  return clamp(1 + spec.slope * (wear - spec.pivot), spec.min, spec.max);
};

/** RF-DEV-08: a damaged body part → the hazard multiplier of its group. */
export const damageFactorOf = (condition) => REL.mechanical.damage.factor[condition] ?? 1;

/**
 * The unit wear a car carries, by failure group, from a units record (units.js
 * `career.units.drivers[driverId]`): the most worn counted component of each group.
 */
export const unitWearOf = (record) => {
  if (!record) return null;
  const out = {};
  Object.entries(REL.mechanical.unitGroups).forEach(([group, comps]) => {
    if (group.startsWith("$")) return;
    comps.forEach((comp) => {
      const wear = record[comp]?.wear;
      if (Number.isFinite(wear)) out[group] = Math.max(out[group] ?? 0, wear);
    });
  });
  return Object.keys(out).length ? out : null;
};

/** The worst damage state of the body parts of each group, from a loadout's `{ part: condition }`. */
export const bodyDamageOf = (conditions) => {
  if (!conditions) return null;
  const rank = { perfect: 0, light: 1, heavy: 2, destroyed: 3 };
  const out = {};
  Object.entries(REL.mechanical.damage.groups).forEach(([group, parts]) => {
    parts.forEach((part) => {
      const state = conditions[part];
      if (state && (rank[state] ?? 0) > (rank[out[group]] ?? 0)) out[group] = state;
    });
  });
  return Object.keys(out).length ? out : null;
};

/**
 * Pure (RF-SIM-14, RF-SIM-09): each car's hazards for this race, given the field. Returns
 * `{ [carId]: { mech, groups: [[group, cumulative share]], accident } }` with `mech` and
 * `accident` per lap (before the pace mode, the safety car and the water).
 */
export const raceHazards = ({ cars, year, laps, attrition = REL.accident.attritionReference }) => {
  const measured = measuredFor(year);
  const cal = calibrationFor(year);
  const spec = REL.mechanical;
  const acc = REL.accident;
  const unreliability = cars.map((car) => 1 - clamp(car.reliability ?? 0.9, 0, 0.999));
  const mean = unreliability.reduce((sum, value) => sum + value, 0) / Math.max(1, cars.length) || 1;
  const attritionFactor = (attrition ?? acc.attritionReference) / acc.attritionReference;
  const out = {};
  cars.forEach((car, index) => {
    const relative = clamp(unreliability[index] / mean, spec.relative[0], spec.relative[1]);
    let total = 0;
    const parts = [];
    MECHANICAL_GROUPS.forEach((group) => {
      const base = measured.mechanicalByGroup[group] || 0;
      if (base <= 0) return;
      const wear = wearFactorOf(car.unitWear?.[group]);
      const damage = damageFactorOf(car.bodyDamage?.[group]);
      const p = base * relative * wear * damage * cal.mechanical;
      total += p;
      parts.push([group, p]);
    });
    let running = 0;
    const groups = parts.map(([group, p]) => {
      running += p / Math.max(total, 1e-12);
      return [group, running];
    });
    // RF-STF-02: the driver's control (engine/drivers/skills.js), z on the era's drivers.
    const control = controlRiskOf(car, acc);
    const accident = measured.incidentsPerCarRace.accident.later * control * attritionFactor * cal.accident;
    out[car.id] = { mech: perLapOf(total, laps), groups, accident: perLapOf(accident, laps), issue: perLapOf(total, laps) * spec.issueShare, crashScale: cal.accident };
  });
  return out;
};

/** The failure group a mechanical retirement broke (cumulative shares from raceHazards). */
export const pickGroup = (groups, roll) => {
  for (let k = 0; k < groups.length; k += 1) if (roll <= groups[k][1]) return groups[k][0];
  return groups.length ? groups[groups.length - 1][0] : "engine";
};

/** The water factor of a solo crash (race-reliability.json accident.wet). */
export const wetRiskOf = (wetness) => REL.accident.wet.find((row) => wetness >= row.from)?.factor ?? 1;

// ------------------------------------------------------------------ contact

const OUTCOMES = Object.entries(REL.contact.outcomes);
const OUTCOME_TOTAL = OUTCOMES.reduce((sum, [, weight]) => sum + weight, 0);

/**
 * Pure (RF-SIM-09): what a touch does to one car. `{ kind, loss, wing, limp }`: kind is
 * retire | suspension | puncture | wing | loss; loss in seconds now, wing in s/lap until
 * changed, limp the share of a lap a puncture costs.
 */
export const contactOutcome = (stream) => {
  const c = REL.contact;
  let roll = stream.next() * OUTCOME_TOTAL;
  let kind = OUTCOMES[OUTCOMES.length - 1][0];
  for (const [name, weight] of OUTCOMES) {
    roll -= weight;
    if (roll <= 0) {
      kind = name;
      break;
    }
  }
  if (kind === "loss") return { kind, loss: stream.range(c.lossSeconds[0], c.lossSeconds[1]) };
  if (kind === "wing") return { kind, loss: stream.range(c.lossSeconds[0], c.lossSeconds[1]) * 0.5, wing: stream.range(c.wingLoss[0], c.wingLoss[1]) };
  if (kind === "puncture") return { kind, limp: stream.range(c.limpLoss[0], c.limpLoss[1]) };
  return { kind };
};

/** Does this outcome leave debris on the track (RF-SIM-10)? */
export const leavesDebris = (outcome) => outcome.kind === "wing" || outcome.kind === "puncture";

// ------------------------------------------------------------------ damage (SIM-7)

const DAMAGE = REL.damage;

/**
 * Pure (SIM-7 danos-visibles, RF-DEV-08): the chances of floor damage for a car in a race of `laps`
 * laps in `year` - `perLap` from the kerbs, `offTrack` per trip off the road (a wide or a spin) - from
 * the era's floor retirements in f1db (race-reliability.json damage.floor) and the avoid-kerbs tactic
 * (`kerbFactor`, race-sim.json tactics.avoidKerbs). Zero in an era f1db has no such damage for.
 */
export const floorDamageChancesOf = ({ year, laps, kerbFactor = 1 }) => {
  const floor = DAMAGE.floor;
  const retired = byYear(floor.retiredPerCarRace, year)?.value ?? 0;
  const perRace = retired * floor.nonRetiringPerRetiring;
  return {
    perLap: clamp((perRace * floor.kerbShare * kerbFactor) / Math.max(1, laps), 0, 1),
    offTrack: clamp((floor.offTrackChance * retired) / floor.referencePerCarRace, 0, 1),
  };
};

/** The seconds a lap a damaged floor costs (uniform in damage.floor.lossSec), one draw. */
export const floorLossOf = (stream) => stream.range(DAMAGE.floor.lossSec[0], DAMAGE.floor.lossSec[1]);

/** RF-DEV-08: the state of a part for the seconds a lap it costs (damage.view; 0 = perfect). */
export const damageStateOf = (part, loss) => {
  if (!(loss > 0)) return "perfect";
  const table = DAMAGE.view[part] || [];
  const hit = table.find((row) => row.upTo === null || loss <= row.upTo);
  return hit ? hit.state : table.length ? table[table.length - 1].state : "light";
};

/**
 * F1M24-GAMEPLAY §1.7 `damage[i]`: what the car carries now - the front wing and the floor as RF-DEV-08
 * states, a puncture, and the time a lap they cost - or null on an undamaged car.
 */
export const damageOf = (car) => {
  const wing = car.damage || 0;
  const floor = car.floorDamage || 0;
  const puncture = Boolean(car.puncture);
  if (!(wing > 0) && !(floor > 0) && !puncture) return null;
  return {
    frontWing: damageStateOf("wing", wing),
    floor: damageStateOf("floor", floor),
    puncture,
    lossSecPerLap: Math.round((wing + floor) * 1000) / 1000,
  };
};

/** SIM-7: the laps debris stays at its corner (damage.debris.clearLaps, a uniform integer), one draw. */
export const debrisLapsOf = (stream) => stream.int(DAMAGE.debris.clearLaps[0], DAMAGE.debris.clearLaps[1]);

/** SIM-7: a car's chance of a puncture passing debris (damage.debris), lower behind the SC or on the VSC. */
export const debrisPunctureChanceOf = (neutralised) => DAMAGE.debris.punctureChance * (neutralised ? DAMAGE.debris.neutralFactor : 1);

// ------------------------------------------------------------------ turn one

/** Seconds to cover `x` metres from standstill: constant `accel` up to `vmax`, then flat out. */
export const timeToCover = (x, accel, vmax) => {
  const reach = (vmax * vmax) / (2 * accel);
  return x <= reach ? Math.sqrt((2 * x) / accel) : vmax / accel + (x - reach) / vmax;
};

/** The first braking zone of a circuit: the first corner slower than turnOne.brakeBelowKmh. */
export const firstBrakeOf = (circuit) => {
  const spec = REL.turnOne;
  const corners = circuit?.corners || [];
  const length = circuit?.length || (circuit?.km ? circuit.km * 1000 : 5000);
  const corner = corners.find((c) => (c.kmh ?? 0) < spec.brakeBelowKmh) || corners[0];
  if (!corner) return { corner: 1, metres: spec.metres[0], share: spec.metres[0] / length };
  const metres = clamp(((corner.from ?? 0) % 1) * length, spec.metres[0], spec.metres[1]);
  return { corner: corner.number ?? 1, metres, share: clamp(metres / length, 0.005, 0.5) };
};

/**
 * Pure (RF-SIM-09, RF-SIM-10): the start and the first corner, decided before the lights go
 * out on its own stream so both modes play the same start (SRS 4.2). `cars` are in grid
 * order with `id`, `skills` (control, starts; RF-STF-02) and `pace.dry`; `grid` is race-sim.json's
 * physical grid ({ poleBackMetres, gapMetres }).
 *
 * Returns `{ corner, metres, share, launch: { id: s }, outcomes: { id: outcome },
 * contacts: [{ ids, w }], bunching }`: `launch` is each car's start against the median
 * (positive = slower; launchToTime of it goes on lap 1), `outcomes` contactOutcome's for every
 * car caught in a first-corner touch, `bunching` the sum of the pairs' overlap.
 */
export const turnOnePlan = ({ cars, circuit, year, wetness = 0, grid, stream }) => {
  const spec = REL.turnOne;
  const era = byYear(spec.launch, year);
  const cal = calibrationFor(year);
  const brake = firstBrakeOf(circuit);
  const paces = cars.map((car) => car.pace?.dry ?? 0);
  const paceMean = paces.reduce((s, v) => s + v, 0) / Math.max(1, paces.length);
  const paceSd = Math.sqrt(paces.reduce((s, v) => s + (v - paceMean) ** 2, 0) / Math.max(1, paces.length)) || 1;
  const launches = cars.map((car, k) => {
    const reaction = Math.max(0.1, spec.reaction.mean + stream.normal(0, spec.reaction.sigma));
    const spin = Math.abs(stream.normal(0, era.sigma));
    // RF-STF-02: the starts attribute (z) shortens the launch.
    return reaction + spin - skillZ(car, "starts") * spec.startsSigma - ((paces[k] - paceMean) / paceSd) * spec.carSigma;
  });
  const sorted = [...launches].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const arrivals = cars.map((car, k) => ({ k, t: timeToCover(brake.metres + grid.poleBackMetres + k * grid.gapMetres, era.accel, era.vmax) + launches[k] }));
  arrivals.sort((a, b) => a.t - b.t || a.k - b.k);
  const risk = (car) => controlRiskOf(car, REL.accident);
  const wet = wetness >= 0.2 ? spec.wet : 1;
  const overlap = arrivals.map((row, j) => (j === 0 ? 0 : Math.exp(-(row.t - arrivals[j - 1].t) / spec.tau)));
  const involved = new Set();
  const contacts = [];
  for (let j = 1; j < arrivals.length; j += 1) {
    const a = arrivals[j - 1].k;
    const b = arrivals[j].k;
    const p = cal.turnOne * overlap[j] * ((risk(cars[a]) + risk(cars[b])) / 2) * wet;
    if (involved.has(a) || involved.has(b) || !stream.chance(p)) continue;
    const ids = [a, b];
    for (let next = j + 1; next < arrivals.length; next += 1) {
      const c = arrivals[next].k;
      if (involved.has(c) || !stream.chance((cal.chain ?? spec.chain) * overlap[next])) break;
      ids.push(c);
    }
    ids.forEach((k) => involved.add(k));
    contacts.push({ ids: ids.map((k) => cars[k].id), w: Math.round(overlap[j] * 1000) / 1000 });
  }
  const outcomes = {};
  contacts.forEach((contact) => {
    contact.ids.forEach((id) => {
      outcomes[id] = contactOutcome(stream);
    });
  });
  return {
    corner: brake.corner,
    metres: Math.round(brake.metres),
    share: brake.share,
    launch: Object.fromEntries(cars.map((car, k) => [car.id, (launches[k] - median) * spec.launchToTime])),
    outcomes,
    contacts,
    bunching: Math.round(overlap.reduce((s, v) => s + v, 0) * 100) / 100,
  };
};
