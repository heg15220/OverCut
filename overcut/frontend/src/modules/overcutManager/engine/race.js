/**
 * A Grand Prix, lap by lap.
 *
 * Trayectoria runs a race in one draw because the player never watches it. The
 * manager does watch: from the pit wall, with the timing tower ticking, the rain
 * coming in and two cars to call into the pits. So this engine keeps the same
 * idea of pace - Trayectoria's `paceOf`, car and driver standardised against the
 * field and weighted by era - and spends it one lap at a time.
 *
 * A lap time is built from, in order:
 *
 *   base       the real winner's average lap at that venue, from f1db, so Monaco
 *              laps look like Monaco laps and the 1950s Nürburgring like itself.
 *   pace       Trayectoria's pace points, converted to seconds. Rain compresses
 *              them, which is why wet races are where upsets live.
 *   tyres      compound offset plus accumulated wear, with a cliff past the
 *              tyre's life, and a heavy price for the wrong tyre on a wet or
 *              drying track. Wear runs faster for a hot tyre, a hot track, a
 *              pushing driver and a car sitting in someone's wake.
 *   heat       a tyre has a working window: a cold out-lap costs time (less with
 *              blankets, from 1995) and so does overheating.
 *   fuel       the weight on board - the stint's load in the refuelling years,
 *              the whole race's otherwise - and the mixture: rich is quicker,
 *              thirstier, and a car that runs dry is out.
 *   battery    KERS (2009, 2011-13) and hybrid ERS (2014-): harvest, hold or
 *              deploy, against the charge left.
 *   track      rubber going down through a dry race makes it quicker.
 *   wake       dirty air behind a car less than a second ahead, by era.
 *   mode       save / normal / push, traded against wear, failures and mistakes.
 *   problems   setup, damage and a slow puncture of a problem - a misfire, a
 *              stuck gear - that can be fixed in the pits or end the race.
 *   noise      a driver's own lap-to-lap scatter, wider for the inconsistent.
 *
 * Then the field is ordered by elapsed time and the one thing a stopwatch does
 * not know is applied: you cannot drive through the car in front. A car that
 * catches another has to pass it, with a chance set by the circuit, the
 * difference in underlying pace (not a lucky lap), DRS, the battery, a cold
 * tyre on the car ahead and racecraft; if it fails it sits in the dirty air.
 * Passes and mistakes happen at real corners of the circuit (see `venue.js`),
 * leaders lap backmarkers under blue flags, and every lap leaves each car's
 * line crossings behind so the live view can replay it on the track.
 *
 * Everything is driven by one seeded stream, so the same weekend with the same
 * calls replays identically, and a headless run (`runToFinish`) is the exact
 * race the live view would have shown. Race control (yellows, red flags,
 * investigations and penalties) draws from a second stream of the same seed, so
 * adding it did not reshuffle the race it watches.
 *
 * Rules by era (SRS 6.2, RNF-07, criterio 7.2): nothing here asks for the year.
 * Every rule - refuelling, energy system, compounds, tyre changes, two-compound
 * rule, qualifying format, top-ten start tyres, DRS, SC/VSC, red-flag restart,
 * penalty types, unit limits, fastest-lap point - comes from `rulesFor(era)`
 * (engine/rules.js: the season pack, or curated/era-defaults.json), and every
 * balance number by era from data/balance/race-eras.json. The year-taking
 * exports (`compoundsFor(year)`, `refuellingEra(year)`, ...) still accept a
 * year, or an era profile, and answer through the same resolver.
 */

import { clamp, createStream } from "../../overcutTrayectoria/engine/rng";
import { fieldMomentsOf, paceOf } from "../../overcutTrayectoria/engine/race";
import { WEATHER } from "../../overcutTrayectoria/engine/weather";
import {
  WEATHER_BALANCE as WB, aquaplaningOf, depthOfWetness, gripRatio, sprayLossOf, sprayRiskOf, tyreForWetness as tyreForWater, trackTargetOf, updateLapWater, wetTyreAgeTime,
  weatherTimeline as weatherOf,
} from "./weather";
import { circuitFor } from "./venue";
import { commandsFor, drsOpen, penaltyFor, pitLaneSpeedFor, raceBalance as BALANCE, rulesFor } from "./rules";
import { circuitIdOf, pitLaneFor } from "./sim/pitLane";
import { expectedStationary, planStop } from "./sim/pitStop";
import { fuelSpecOf } from "./energy";
import { RELIABILITY as REL, calibrationFor, contactOutcome, leavesDebris, pickGroup, raceHazards, turnOnePlan, wetRiskOf } from "./incidents";
import simBalance from "../data/balance/race-sim.json";
import { circuitScFactor, deployNeutralisation, pitClosedFor } from "./sim/safetyCar";
import {
  DRIVER_BALANCE, aiDefenceStyleOf, contactFactorOf, mistakeFactorOf, passSkillTerm, raceFormOf, skillZ, startSkillTime, volatilityFactorOf, wearSkillOf,
} from "./drivers/skills";

export { commandsFor, drsOpen, rulesFor };

/** The rules of a race: its era profile when it has one (pack regulations or a year), else the bare year. */
export const rulesOf = (era, year) => rulesFor(era && typeof era === "object" && (era.year !== undefined || era.regulations) ? era : year);

// ------------------------------------------------------------------ tyres

/** The compounds a team could choose between, by era (RF-WKD-05; era-defaults `compounds`). Takes a year or an era. */
export const compoundsFor = (eraOrYear) => [...rulesFor(eraOrYear).tyres.compounds];

/** Wear in seconds per lap of age, and how many laps before the cliff (race-eras.json `tyres.dry`). */
const DRY_TYRES = BALANCE.tyres.dry;

/**
 * Era softening: older dry tyres wore less but the difference between them was
 * smaller too (race-eras.json `tyres.eraScale`: 1982-2006 two compounds,
 * closer together, and longer lives). Pure; for the step simulator.
 */
export const tyreSpec = (compound, eraOrYear) => {
  const spec = DRY_TYRES[compound] || DRY_TYRES.hard;
  const scale = rulesFor(eraOrYear).tyres.scale;
  if (compound === "dry" || (scale.offset === 1 && scale.wear === 1 && scale.life === 1)) return spec;
  return { offset: spec.offset * scale.offset, wear: spec.wear * scale.wear, life: Math.round(spec.life * scale.life) };
};

export const isWetTyre = (compound) => compound === "inter" || compound === "wet";

/**
 * Seconds a tyre costs on a track that is `wetness` wet (0 dry, 1 = the full wet's water
 * capacity), over the dry race pace `baseLap` (RF-SIM-03, RF-SIM-11): the compound's grip
 * against the water on the line (engine/weather gripRatio: slick, inter and wet cross where
 * they did in real wet races, OpenF1) plus, on slicks, the compound offset, wear and cliff, and
 * on the wet-weather tyres their wear and overheating on a dry track. Outside its window the
 * price climbs steeply - calling the switch at the right lap is the decision of a wet race.
 */
export const tyreTime = ({ compound, age, wetness, year, era, wearFactor = 1, baseLap = WB.grip.fallbackBaseLap }) => {
  const h = depthOfWetness(wetness);
  const water = baseLap * (gripRatio(compound, h) - 1);
  if (compound === "inter" || compound === "wet") return water + wetTyreAgeTime(compound, age, h);
  const spec = tyreSpec(compound, era ?? year);
  const wear = spec.wear * wearFactor * age;
  const cliff = age > spec.life ? (age - spec.life) * BALANCE.tyres.cliffPerLap * wearFactor : 0;
  return spec.offset + wear + cliff + water;
};

/** Which tyre a sensible team wants for this much water: the crossovers (engine/weather). */
export const tyreForWetness = tyreForWater;

// ------------------------------------------------------------- the weekend

/** How much each grid slot holds you up at the start, in seconds. */
const START_SPACING = BALANCE.start.gridSpacing;

/** Save / normal / push (race-eras.json `modes`): time, wear, failure risk and mistakes. */
const MODES = BALANCE.modes;

export const MODE_KEYS = Object.keys(MODES);

/** Pure: the effect of a pace mode, for the step simulator. */
export const modeEffect = (mode) => MODES[mode] || MODES.normal;

const PIT = BALANCE.pit;

/**
 * RF-SIM-12 / SRS 6.2 (WP6): the pit lane of a race - its speed limit for the era, circuit and
 * date (rules.js pitLaneSpeedFor), and what driving it costs against the track
 * (engine/sim/pitLane.js pitLaneFor: the lane's geometry, the limit, braking into the box and
 * the launch out of it). Computed once in createRace and kept on `state.pitLane`, so the quick
 * mode charges exactly the loss the step mode drives (SRS 4.2).
 */
export const pitLaneOf = ({ circuit, race, rules, baseLap = race.baseLap }) => {
  const circuitId = circuitIdOf(race, circuit.ref);
  const kmh = pitLaneSpeedFor(rules, { circuitId, date: race.date || null });
  const lane = pitLaneFor(circuit, { kmh, baseLap, circuitId });
  const r = (x) => Math.round(x * 1000) / 1000;
  return { kmh, circuitId, stop: r(lane.stop), through: r(lane.through), sc: r(lane.sc), vsc: r(lane.vsc) };
};

/**
 * Time lost in the pit lane at racing speed (RF-SIM-12), less under a safety car or VSC.
 * Takes the race state (its physical pit lane, `state.pitLane`) or, for callers without a
 * circuit (strategy read-outs, old saves), a base lap: then the old share-of-the-lap estimate.
 * `through` = a drive-through (no braking to a stop in the box).
 */
export const pitLaneLoss = (stateOrBaseLap, sc = null, { through = false } = {}) => {
  const lane = stateOrBaseLap && typeof stateOrBaseLap === "object" ? stateOrBaseLap.pitLane : null;
  if (lane) return sc ? (sc.virtual ? lane.vsc : lane.sc) : through ? lane.through : lane.stop;
  const baseLap = typeof stateOrBaseLap === "number" ? stateOrBaseLap : stateOrBaseLap.race.baseLap;
  return clamp(baseLap * PIT.laneShare, PIT.laneMin, PIT.laneMax) * (sc ? (sc.virtual ? PIT.laneUnderVsc : PIT.laneUnderSc) : 1);
};

/**
 * Seconds a strategist expects the car to stand in the box (RF-SIM-12, RF-STF-07): the era's
 * stop by stages (engine/sim/pitStop.js expectedStationary, race-pit.json `pitStop`) with the
 * fuel in the refuelling years running alongside the wheels, scaled by the crew. `fuelOnly` is
 * a stop that changes no tyres (2005). Takes `year` or `era`.
 */
export const stationaryTime = ({ year, era, refuel = 0, crew = 60, fuelOnly = false, kgPerLap = null }) =>
  expectedStationary({ rules: rulesFor(era ?? year), crew, tyres: !fuelOnly, refuelLaps: refuel, kgPerLap });

/** The crew's own stream (RF-SIM-12, RNF-05): same seed, its own draws, so a stop never reshuffles the race. */
export const crewStream = (state) => {
  if (!state._crew) state._crew = createStream(`${state.seed}::crew`);
  return state._crew;
};

/** RF-SIM-04: does this era refuel in the race? Takes a year or an era. */
export const refuellingEra = (eraOrYear) => rulesFor(eraOrYear).refuelling;

/**
 * RF-SIM-04 (engine/energy.js fuelSpecOf): this race's fuel - kg a lap on the standard mix (the
 * era's flow along the circuit's trace), what a lap of fuel on board costs a lap (kg x s/kg), the
 * era's limit and, without refuelling, the laps of fuel a car starts with. The fuel ledger
 * (`car.fuel`) is kept in laps of fuel; kg = laps x kgPerLap.
 */
export const raceFuelOf = ({ race, rules, laps = Math.max(5, race.laps || 60), year = rules.year }) =>
  fuelSpecOf({ rules, circuit: circuitFor(race, year), laps, baseLap: race.baseLap, lengthKm: race.lengthKm ?? null });

/** A race state's fuel spec (computed again for an old save or a postMessage copy without it). */
const fuelOfState = (state) => {
  if (!state.fuelSpec) state.fuelSpec = raceFuelOf({ race: state.race, rules: stateRules(state), laps: state.laps, year: state.year });
  return state.fuelSpec;
};

/**
 * Pure (RF-SIM-04): seconds the fuel on board costs a lap, `perLap` the seconds a lap of fuel
 * costs (raceFuelOf secPerLap). In the refuelling years the stint's load; otherwise the race's
 * load against the half-tank the reference lap was run on.
 */
export const fuelTime = ({ fuel, refuel, fuelStart, perLap }) => (refuel ? fuel * perLap : (fuel - fuelStart / 2) * perLap);

// ------------------------------------------------------------- strategy

/**
 * Total tyre-and-fuel cost of a plan, in seconds, against a perfect car - the
 * number the strategist compares candidate plans on.
 */
const planCost = ({ plan, laps, year, era, baseLap, wearFactor, crew = 60, laneLoss = null, stopScale = 1, fuel = null }) => {
  const rules = rulesFor(era ?? year);
  // RF-SIM-04: the race's fuel (raceFuelOf: a lap of fuel in seconds a lap, kg a lap); without a circuit, the era's fallback.
  const fuelSpec = fuel ?? fuelSpecOf({ rules, circuit: null, laps, baseLap });
  const FUEL_PER_LAP = fuelSpec.secPerLap;
  const stints = stintLengths(plan, laps);
  const refuelling = rules.refuelling;
  const tyreChanges = rules.tyres.changesInRace;
  let cost = 0;
  const tyreCost = (compound, length) => {
    const spec = tyreSpec(compound, era ?? year);
    cost += spec.offset * length;
    cost += spec.wear * wearFactor * (length * (length - 1)) / 2;
    // The cliff as the race charges it (tyreTime on car.tyreWear): wear accrues at `wearFactor` a
    // lap, so a gentle circuit stretches the tyre's life in laps and a harsh one shortens it (WP11).
    for (let lap = 0; lap < length; lap += 1) {
      const age = lap * wearFactor;
      if (age > spec.life) cost += (age - spec.life) * BALANCE.tyres.cliffPerLap;
    }
  };
  const fuelCost = (length) => (cost += FUEL_PER_LAP * (length * (length + 1)) / 2);
  if (tyreChanges) {
    stints.forEach((length, index) => {
      tyreCost(plan.compounds[index], length);
      if (refuelling) fuelCost(length);
    });
  } else {
    // Without tyre changes (2005) one set runs the whole race, whatever the fuel stops.
    tyreCost(plan.compounds[0], laps);
    if (refuelling) stints.forEach(fuelCost);
  }
  const stops = plan.stops.length;
  // The two-compound rule (from 2007): a dry race on one compound costs a penalty; the plan pays it up front.
  const mandatory = rules.tyres.mandatoryDryCompounds;
  if (mandatory >= 2 && new Set(plan.compounds).size < mandatory) cost += rules.strategy.twoCompoundPenalty;
  if (refuelling && stops === 0) cost += rules.strategy.refuelNoStopCost;
  const refuel = refuelling ? laps / Math.max(1, stops + 1) : 0;
  cost += stops * stopScale * ((laneLoss ?? pitLaneLoss(baseLap)) + stationaryTime({ era: era ?? year, refuel, crew, fuelOnly: refuelling && !tyreChanges, kgPerLap: fuelSpec.kgPerLap }));
  return cost;
};

export const stintLengths = (plan, laps) => {
  const marks = [0, ...plan.stops, laps];
  const lengths = [];
  for (let index = 1; index < marks.length; index += 1) lengths.push(Math.max(1, marks[index] - marks[index - 1]));
  return lengths;
};

/** Evenly spaced stop laps for a number of stops. */
export const spacedStops = (count, laps) =>
  Array.from({ length: count }, (_, index) => Math.round((laps * (index + 1)) / (count + 1)));

/**
 * The plans a strategist would consider: zero to three stops, every sensible
 * sequence of compounds, and - from 2007 - only those that use two different
 * dry compounds, because the rules said so.
 */
const candidatePlans = (eraOrYear, laps, firstCompound = null) => {
  const rules = rulesFor(eraOrYear);
  const compounds = rules.tyres.compounds;
  const { minStops, maxStops } = rules.strategy;
  const mandatory = rules.tyres.mandatoryDryCompounds;
  const tyreChanges = rules.tyres.changesInRace;
  const plans = [];
  for (let stops = minStops; stops <= maxStops; stops += 1) {
    const sequences = [[]];
    for (let stint = 0; stint <= stops; stint += 1) {
      const next = [];
      sequences.forEach((sequence) => compounds.forEach((compound) => next.push([...sequence, compound])));
      sequences.splice(0, sequences.length, ...next);
    }
    sequences
      .filter((sequence) => mandatory < 2 || new Set(sequence).size >= mandatory)
      // No tyre changes in the race (2005): the stops are for fuel, the set stays on.
      .filter((sequence) => tyreChanges || new Set(sequence).size === 1)
      // Top-ten start tyres (2010-2021): the first stint is the qualifying tyre.
      .filter((sequence) => !firstCompound || sequence[0] === firstCompound)
      .forEach((sequence) => {
        // Softer tyres early, when the car is heaviest and the order is decided.
        const stopsAt = spacedStops(stops, laps);
        plans.push({ stops: stopsAt, compounds: sequence });
        if (stops === 1) {
          plans.push({ stops: [Math.round(laps * 0.36)], compounds: sequence });
          plans.push({ stops: [Math.round(laps * 0.62)], compounds: sequence });
        }
      });
  }
  return plans;
};

/** How hard a circuit is on tyres. */
export const wearFactorFor = (profile) => clamp(0.75 + (profile.aero ?? 0.6) * 0.35 + ((profile.attrition ?? 1) - 1) * 0.4, 0.6, 1.35);

/** The best plan for a dry race, plus its cost so alternatives can be compared. */
export const suggestPlan = ({ year, era, laps, baseLap, profile, crew = 60, firstCompound = null, laneLoss = null, wearScale = 1, stopScale = 1, fuel = null }) => {
  const wearFactor = wearFactorFor(profile) * wearScale;
  const ranked = candidatePlans(era ?? year, laps, firstCompound)
    .map((plan) => ({ plan, cost: planCost({ plan, laps, year, era, baseLap, wearFactor, crew, laneLoss, stopScale, fuel }) }))
    .sort((a, b) => a.cost - b.cost);
  if (!ranked[0] && firstCompound) return suggestPlan({ year, era, laps, baseLap, profile, crew, laneLoss, wearScale, stopScale, fuel });
  return ranked[0] ? { ...ranked[0].plan, cost: ranked[0].cost } : { stops: [], compounds: [compoundsFor(era ?? year)[0]], cost: 0 };
};

/** The cost of any plan the player builds, for the "+4.2 s against the best" read-out. */
export const evaluatePlan = ({ plan, year, era, laps, baseLap, profile, crew, laneLoss = null, wearScale = 1, stopScale = 1, fuel = null }) =>
  planCost({ plan, laps, year, era, baseLap, wearFactor: wearFactorFor(profile) * wearScale, crew, laneLoss, stopScale, fuel });

/**
 * WP11 (SIM-FISICA §5; RF-SIM-13, SRS 6.1 guided anchor): the real stops of this Grand Prix
 * (race.pitStops, f1db median via the pack) decide how its strategists plan, through one scale
 * found so that the best dry plan of an average car has that many stops
 * (race-eras.json strategy.realStops):
 *   wearScale  without refuelling, where tyres are changed: how hard the circuit was on tyres
 *              that year. It scales the wear the race charges too (car.wearFactor).
 *   stopScale  in refuelling eras, where fuel and track position decide: what a stop is worth
 *              to the strategist (planning only; the race charges the physical loss).
 * Both 1 without real stops, where tyres are not changed and fuel is not taken (2005 is fuel
 * only: it calibrates stopScale), or when the real race was wet (refLaps). With a half-stop
 * median (1.5) the scale sits where the plan changes from one count to the other.
 */
const scaleCache = new Map();

/**
 * What a strategist plans with before the race is built (career.js defaultPlan, planDelta): this
 * circuit's pit-lane loss (pitLaneOf) and the scales of strategyScales, the same createRace uses.
 */
export const strategyContextOf = ({ race, era, year }) => {
  const rules = rulesOf(era, year);
  const laps = Math.max(5, race.laps || 60);
  const pitLane = pitLaneOf({ circuit: circuitFor(race, year), race, rules });
  const fuel = raceFuelOf({ race, rules, laps, year: rules.year ?? year });
  return { laneLoss: pitLane.stop, fuel, ...strategyScales({ race, rules, laps, laneLoss: pitLane.stop, fuel }) };
};
export const strategyScales = ({ race, rules, laps, baseLap = race.baseLap, laneLoss = null, fuel = null }) => {
  const neutral = { wearScale: 1, stopScale: 1 };
  const real = race.pitStops;
  const cfg = BALANCE.strategy.realStops;
  if (!real || !(real.median >= 0)) return neutral;
  const kind = rules.refuelling ? "stopScale" : rules.tyres.changesInRace ? "wearScale" : null;
  if (!kind) return neutral;
  const ref = race.refLaps;
  if (ref && ref.pole > 0 && ref.fastestRaceLap > ref.pole * cfg.wetRaceRatio) return neutral;
  const key = `${kind}|${rules.year}|${race.round}|${race.name}|${laps}|${baseLap}|${laneLoss}|${real.median}|${fuel ? fuel.secPerLap : null}`;
  if (scaleCache.has(key)) return scaleCache.get(key);
  const stopsWith = (scale) => suggestPlan({ era: rules, laps, baseLap, profile: race.profile, laneLoss, fuel, [kind]: scale }).stops.length;
  const ratio = (cfg.scaleMax / cfg.scaleMin) ** (1 / (cfg.steps - 1));
  const grid = Array.from({ length: cfg.steps }, (_, k) => cfg.scaleMin * ratio ** k);
  // More wear means more stops; a dearer stop means fewer: read the grid so the count rises.
  const counts = grid.map(stopsWith);
  if (kind === "stopScale") {
    grid.reverse();
    counts.reverse();
  }
  const lo = Math.floor(real.median);
  const hi = Math.ceil(real.median);
  let scale;
  if (lo === hi) {
    // The geometric middle of the scales that give exactly the real count (or the nearest count).
    const best = Math.min(...counts.map((count) => Math.abs(count - lo)));
    const hits = grid.filter((_, k) => Math.abs(counts[k] - lo) === best);
    scale = Math.sqrt(hits[0] * hits[hits.length - 1]);
  } else {
    // Between two counts: the step where the plan goes from `lo` stops to `hi`.
    const k = counts.findIndex((count) => count >= hi);
    scale = k > 0 ? Math.sqrt(grid[k - 1] * grid[k]) : k === 0 ? grid[0] : grid[grid.length - 1];
  }
  const out = { ...neutral, [kind]: scale };
  scaleCache.set(key, out);
  return out;
};

// ------------------------------------------------------------- weather

/**
 * The whole afternoon's weather, decided before the start (RF-SIM-11): engine/weather's seven
 * states on the circuit's own chain (ERA5 climatology by month), the water on the line, off it
 * and per sector, and Friday's forecast with the weather centre's accuracy (RF-HQ-02). Its own
 * streams (`seed::weather`, `seed::forecast`), so the forecast never moves the race.
 */
export const weatherTimeline = ({ race, laps, seed, cars = 20, accuracy, startState = null }) => weatherOf({ race, laps, seed, cars, accuracy, startState });

// ------------------------------------------------------------- qualifying

/**
 * Saturday. One flying lap per session, the car's pace plus a qualifying skill
 * and a mistake term that the player's risk choice trades against speed.
 */
/**
 * The deterministic part of a qualifying lap (no style, mistake or scatter): the car's
 * pace on the day, the driver's one-lap skill and what practice prepared. Shared by the
 * quick qualifying below and the playable sessions (engine/sessionSim), so both read the
 * same field (RF-WKD-02).
 */
export const qualifyingPaceOf = ({ entrant, race, era, wetness = 0, practice = {}, moments, anchor = null }) => {
  const spp = race.baseLap * 0.0012;
  const edge = qualifyingEdgeOf({ entrant, race, era, wetness, moments });
  const prep = practice[entrant.id] || {};
  // WP10 (RF-WKD-02): with the real pole of the pack, the field's quickest car in the dry is
  // anchored to it and everyone else keeps their gap; otherwise the old reference.
  const reference = anchor ? anchor.pole + anchor.top * spp + 0.1 * wetness * race.baseLap : race.baseLap * (0.985 + 0.1 * wetness);
  return reference - edge * spp + (prep.setup ?? 0) + (prep.quali ?? 0);
};

/** Pace plus one-lap skill, in pace points: what separates cars in qualifying. */
const qualifyingEdgeOf = ({ entrant, race, era, wetness = 0, moments }) => {
  const weather = wetness >= 0.55 ? WEATHER.WET : wetness >= 0.2 ? WEATHER.MIXED : WEATHER.DRY;
  const pace = paceOf({ entrant, race, era, seasonProgress: 0.5, weather, moments });
  const skill = (((entrant.qualifying ?? 50) - 50) / 20) * era.fieldSigma * 0.32;
  return pace + skill;
};

/**
 * WP10 (SIM-FISICA §5; RF-SIM-02, RF-WKD-02): the pole the field is anchored to - the pack's
 * real pole (race.qualifyingRef, engine/packs/refLaps.js) for the best dry edge of these
 * entrants - or null without a reference (seasons without a pack, older saves).
 */
export const qualifyingAnchorOf = ({ entrants, race, era, moments = fieldMomentsOf(entrants) }) => {
  if (!(race.qualifyingRef > 0) || !entrants.length) return null;
  const top = Math.max(...entrants.map((entrant) => qualifyingEdgeOf({ entrant, race, era, wetness: 0, moments })));
  return { pole: race.qualifyingRef, top };
};

export { fieldMomentsOf };

export const runQualifying = ({ entrants, race, era, year, wetness = 0, practice = {}, risk = {}, stream }) => {
  const moments = fieldMomentsOf(entrants);
  const anchor = qualifyingAnchorOf({ entrants, race, era, moments });
  // Knockout Q1-Q3 or a single session, as the era's qualifying format says (RF-WKD-01).
  const sessions = rulesOf(era, year).qualifying.knockout ? knockoutSplit(entrants.length) : null;

  const lapOf = (entrant) => {
    const base = qualifyingPaceOf({ entrant, race, era, wetness, practice, moments, anchor });
    const style = risk[entrant.id] || "normal";
    const styleGain = style === "push" ? -0.14 : style === "safe" ? 0.12 : 0;
    const mistakeChance = (style === "push" ? 0.09 : style === "safe" ? 0.02 : 0.045) * (1 + wetness);
    const mistake = stream.chance(mistakeChance) ? stream.range(0.6, 2.4) : 0;
    const noise = stream.normal(0, era.paceVolatility * 0.042 * (1 + wetness));
    return base + styleGain + mistake + noise;
  };

  if (!sessions) {
    const times = entrants.map((entrant) => ({ id: entrant.id, time: lapOf(entrant) })).sort((a, b) => a.time - b.time);
    return { format: "single", order: times.map((row) => row.id), times: Object.fromEntries(times.map((row) => [row.id, row.time])), sessions: null };
  }

  // Q1, Q2, Q3: everyone runs, the slowest drop out, the rest run again.
  let alive = entrants.map((entrant) => entrant.id);
  const byId = Object.fromEntries(entrants.map((entrant) => [entrant.id, entrant]));
  const best = {};
  const out = [];
  const record = [];
  sessions.forEach((cut, index) => {
    const lap = alive.map((id) => ({ id, time: lapOf(byId[id]) })).sort((a, b) => a.time - b.time);
    lap.forEach((row) => {
      best[row.id] = row.time;
    });
    record.push(lap.map((row) => ({ ...row })));
    if (index < sessions.length - 1) {
      const dropped = lap.slice(lap.length - cut);
      out.unshift(...dropped.map((row) => row.id));
      alive = lap.slice(0, lap.length - cut).map((row) => row.id);
    } else {
      alive = lap.map((row) => row.id);
    }
  });
  return { format: "knockout", order: [...alive, ...out], times: best, sessions: record };
};

/** How many cars drop out of Q1 and Q2 for a field of this size. */
export const knockoutSplit = (size) => {
  if (size <= 12) return [Math.max(1, size - 10), 0];
  const q3 = 10;
  const rest = size - q3;
  const q1 = Math.ceil(rest / 2);
  return [q1, rest - q1, 0];
};

// ------------------------------------------------------------------ race

/**
 * Fuel mixture, for the years a car carried the whole race's fuel from the
 * start: richer is faster and thirstier, and a car that runs dry is out. The
 * tank holds the race plus a small margin, so a driver left on rich all
 * afternoon will not see the flag - the Motorsport Manager trade-off.
 */
const MIXES = BALANCE.fuel.mixes;

export const MIX_KEYS = Object.keys(MIXES);

/** Pure: the effect of a fuel mixture, for the step simulator. */
export const mixEffect = (mix) => MIXES[mix] || MIXES.standard;


/**
 * RF-SIM-05: the era's energy system, or null - "kers" (2009, 2011-13), "ers"
 * (2014-2025), "ers2026" (the 50 % electric split with the manual overtake
 * mode). Takes a year or an era.
 */
export const energyEra = (eraOrYear) => {
  const system = rulesFor(eraOrYear).energy.system;
  return system === "none" ? null : system;
};

/** Battery strategies, as an F1 Manager pit wall sets them (the hybrid ERS table: time against charge per lap). */
const ERS_MODES = BALANCE.energy.ers.modes;

export const ERS_KEYS = Object.keys(ERS_MODES);

/** RF-CMD-01: the energy modes the pit wall can set in this era ([] before 2009 and in 2010; "overtake" only in 2026). */
export const ersModesFor = (eraOrYear) => [...rulesFor(eraOrYear).energy.modes];

/**
 * Seconds a following car loses per lap in the wake of the one ahead, for each
 * second of gap under one (RF-SIM-06, race-eras.json `dirtyAir`). Small before
 * wings, worst in the outwash years, eased again by the 2022 ground-effect cars.
 */
export const dirtyAirFor = (eraOrYear) => rulesFor(eraOrYear).dirtyAir;

/** Pure: seconds lost in the wake this lap, for a car `gapAhead` behind (null = clean air). */
export const dirtyAirTime = ({ gapAhead, rules }) => (gapAhead !== null && gapAhead !== undefined && gapAhead < 1 ? (1 - gapAhead) * rules.dirtyAir : 0);

/** Tyre blankets, from the mid-1990s, send a car out on a warmer tyre. */
export const outLapTemp = (eraOrYear) => rulesFor(eraOrYear).tyres.outLapTemp;

/** Where a tyre's temperature settles for each pace: 0.45-0.7 is the working window. */
const TEMP_TARGET = BALANCE.tyres.tempTarget;

/** RNF-07 (rnf07-race): the tyre's heat window, its wear and drift (race-eras.json tyres.thermal). */
const THERMAL = BALANCE.tyres.thermal;
/** RNF-07: a driver's mistakes (race-eras.json mistake), lap-to-lap scatter (noise) and the start (start). */
const MISTAKE = BALANCE.mistake;
const NOISE = BALANCE.noise;
const START = BALANCE.start;
/** RNF-07: the fuel of the paces without their own burn, and behind the safety car (race-eras.json fuel). */
const MODE_BURN = BALANCE.fuel.modeBurn;
const SC_BURN = BALANCE.fuel.scBurn;
/** RNF-07 (RF-SIM-07): the pass chance's terms, the same block the step simulator's duel reads (race-sim.json duel). */
const PASS = simBalance.duel;

/** Share of the tyre's life used, 0..1+ (past 1 the tyre is on the cliff). Takes a year or an era. */
export const tyreLifeUsed = (car, eraOrYear) => {
  if (isWetTyre(car.compound)) return clamp(car.tyreAge / BALANCE.tyres.wetLifeLaps, 0, 1.2);
  const spec = tyreSpec(car.compound, eraOrYear);
  return car.tyreWear / spec.life;
};

/**
 * Pure (RF-SIM-05): one lap of the energy system for one car. Returns the lap
 * time it gives (negative = quicker), the battery after the lap, and whether the
 * 2026 overtake mode was live (only within `overtakeGap` of the car ahead).
 *
 *   kers     a per-lap deploy budget (400 kJ at 60 kW, ~6.7 s) restored at the
 *            line; the mode is how much of it is spent.
 *   ers      a battery carried lap to lap: harvest, hold or deploy against
 *            the charge left.
 *   ers2026  the same with bigger swings, and the overtake mode.
 */
export const energyStep = ({ rules, mode, battery, gapAhead = null }) => {
  const energy = rules.energy;
  if (energy.system === "none" || battery === null || battery === undefined) return { time: 0, battery: null, overtake: false };
  const spec = energy.balance;
  if (energy.kers) {
    const kers = spec.modes[mode] || spec.modes.balanced;
    return { time: -(kers.use * spec.perLapDeploySeconds * spec.gainPerSecond), battery: 100 * (1 - kers.use), overtake: false };
  }
  let key = spec.modes[mode] ? mode : "balanced";
  let overtake = false;
  if (key === "overtake") {
    overtake = gapAhead !== null && gapAhead !== undefined && gapAhead < spec.overtakeGap;
    if (!overtake) key = "deploy";
  }
  const ers = spec.modes[key];
  let charge = ers.charge;
  let gain = ers.time;
  if (charge < 0 && battery + charge < 0) {
    gain *= battery / -charge;
    charge = -battery;
  }
  return { time: gain, battery: clamp(battery + charge, 0, 100), overtake };
};

/** Does this car have energy to attack or defend with this lap (RF-SIM-07 modifiers)? Shared with the step simulator's duels. */
export const energyPush = (rules, car) => {
  if (car.battery === null || car.battery === undefined || !rules.energy.balance) return { attack: 0, defend: 0 };
  const spec = rules.energy.balance;
  if (rules.energy.kers) {
    const kers = spec.modes[car.ersMode] || spec.modes.balanced;
    return { attack: kers.passBonus, defend: car.ersMode === "deploy" ? spec.defendBonus : 0 };
  }
  if (car.battery <= spec.minChargeToAttack) return { attack: 0, defend: 0 };
  if (car.overtakeActive) return { attack: spec.modes.overtake.passBonus, defend: 0 };
  const deploying = car.ersMode === "deploy" || car.ersMode === "overtake";
  return { attack: deploying ? spec.modes.deploy.passBonus : 0, defend: deploying ? spec.defendBonus : 0 };
};

/**
 * Lay out a Grand Prix ready to run.
 *
 * `entrants` are the cars in grid order; `plans` maps an entrant id to its
 * strategy; `practice` carries the Friday work (setup, long-run tyre feel).
 */
export const createRace = ({
  race, era, year, entrants, grid, plans = {}, practice = {}, seed, crews = {}, strategists = {}, gridPenalties = {}, startTyres = null, sprint = false,
  forecastAccuracy, rubber = 0, weatherStart = null,
}) => {
  const stream = createStream(`${seed}::race`);
  const laps = Math.max(5, race.laps || 60);
  // RF-SIM-11 / RF-HQ-02: the weather on its own streams; the forecast with the player's weather centre.
  const timeline = weatherTimeline({ race, laps, seed, cars: entrants.length, accuracy: forecastAccuracy, startState: weatherStart });
  const moments = fieldMomentsOf(entrants);
  const circuit = circuitFor(race, year);
  const rules = rulesOf(era, year);
  // RF-SIM-12: the physical pit lane's loss on this circuit, era and date (WP6).
  const pitLane = pitLaneOf({ circuit, race, rules });
  // WP11 (RF-SIM-13): the circuit's tyre wear (or, refuelling, what a stop is worth) that year, from the real stops.
  // RF-SIM-04: kg a lap, a lap of fuel in seconds, the era's limit (engine/energy.js).
  const fuelSpec = raceFuelOf({ race, rules, laps, year });
  const { wearScale, stopScale } = strategyScales({ race, rules, laps, laneLoss: pitLane.stop, fuel: fuelSpec });
  const refuel = rules.refuelling;
  const energy = rules.energy.system === "none" ? null : rules.energy.system;
  // Track temperature: the circuit's air at the start hour (ERA5) plus the sun or the rain (OpenF1, race-weather.json temperature).
  const trackTemp = Math.round(trackTargetOf(timeline, 0) * 10) / 10;
  // Outside refuelling: the race plus a margin, never more than the era's maximum (a car that must save).
  const fuelStart = refuel ? laps : fuelSpec.startLaps;

  const paceFor = (entrant) => ({
    dry: paceOf({ entrant, race, era, seasonProgress: 0.5, weather: WEATHER.DRY, moments }),
    mixed: paceOf({ entrant, race, era, seasonProgress: 0.5, weather: WEATHER.MIXED, moments }),
    wet: paceOf({ entrant, race, era, seasonProgress: 0.5, weather: WEATHER.WET, moments }),
  });

  const byId = Object.fromEntries(entrants.map((entrant) => [entrant.id, entrant]));
  const startEvents = [];
  const order = applyGridPenalties(grid && grid.length ? grid : entrants.map((entrant) => entrant.id), gridPenalties, rules, startEvents);
  const startWet = timeline.wetness[0];
  // Top-ten start tyres (2010-2013 Q3, 2014-2021 Q2): the top ten start on the tyre they qualified on, the softest.
  const qualifyingTyre = rules.tyres.topTenStartTyres !== "none" && !tyreForWetness(startWet) ? rules.tyres.compounds[0] : null;
  // Garages along the pit lane in entry order: where each team's cars stop.
  const teamOrder = [...new Set(entrants.map((entrant) => entrant.teamId))];
  const boxSlot = (teamId) => teamOrder.indexOf(teamId) / Math.max(1, teamOrder.length - 1);

  const cars = order
    .filter((id) => byId[id])
    .map((id, index) => {
      const entrant = byId[id];
      // A played qualifying knows the tyre each of the top ten set its time on (engine/sessionSim).
      const ownTyre = qualifyingTyre && startTyres?.[id] && rules.tyres.compounds.includes(startTyres[id]) ? startTyres[id] : qualifyingTyre;
      const startsOnQualifyingTyre = ownTyre && index < 10;
      const suggested = () =>
        suggestPlan({ year, era: rules, laps, baseLap: race.baseLap, profile: race.profile, crew: crews[entrant.teamId], firstCompound: startsOnQualifyingTyre ? ownTyre : null, laneLoss: pitLane.stop, wearScale, stopScale, fuel: fuelSpec });
      let plan = normalisePlan(plans[id] || suggested(), laps, rules);
      if (startsOnQualifyingTyre && plan.compounds[0] !== ownTyre) {
        // The player's plan keeps its stops; a rival re-plans around the tyre it must start on.
        plan = entrant.isUser ? normalisePlan({ ...plan, compounds: [ownTyre, ...plan.compounds.slice(1)] }, laps, rules) : normalisePlan(suggested(), laps, rules);
      }
      const wetStart = tyreForWetness(startWet);
      // KERS was optional for some teams (2009, and the new teams of 2011-12): those cars carry none.
      const hasEnergy = Boolean(energy) && !(rules.energy.optOut.includes(entrant.teamId) && entrant.kers !== true) && entrant.kers !== false;
      return {
        id,
        teamId: entrant.teamId,
        driverId: entrant.driverId ?? id,
        name: entrant.driverName,
        short: entrant.short,
        teamName: entrant.teamName,
        nat: entrant.nat || null,
        boxSlot: boxSlot(entrant.teamId),
        color: entrant.color,
        color2: entrant.color2 || null,
        isUser: Boolean(entrant.isUser),
        grid: index + 1,
        pace: paceFor(entrant),
        // A driver happy with the car drives it more cleanly: setup confidence feeds consistency.
        consistency: (entrant.consistency ?? 50) + ((practice[id]?.confidence ?? 0.6) - 0.6) * 15,
        racecraft: entrant.racecraft ?? 50,
        // RF-STF-02: the driver's race attributes (engine/drivers/skills.js); setup confidence feeds control.
        skills: confidentSkills(entrant.skills, practice[id]?.confidence),
        reliability: entrant.reliability,
        plan,
        stint: 0,
        compound: wetStart || plan.compounds[0],
        compoundsUsed: [wetStart || plan.compounds[0]],
        tyreAge: 0,
        tyreWear: 0,
        tyreTemp: 0.48,
        fuel: refuel ? stintLengths(plan, laps)[0] : fuelStart,
        fuelMode: "standard",
        battery: hasEnergy ? 100 : null,
        ersMode: hasEnergy ? "balanced" : null,
        overtakeActive: false,
        mode: "normal",
        time: index * START_SPACING,
        lastLap: null,
        bestLap: null,
        stops: 0,
        pitRequest: null,
        status: "running",
        retiredLap: null,
        position: index + 1,
        setup: practice[id]?.setup ?? 0,
        wing: practice[id]?.wing ?? 0,
        // A car that will not put its power down cleanly spins its rear tyres up.
        // RF-STF-02 / RF-SIM-03: a smooth driver wears his tyres less.
        wearFactor: wearFactorFor(race.profile) * wearScale * (practice[id]?.wear ?? 1) * (1 + (practice[id]?.traction ?? 0) * 0.35) * wearSkillOf({ skills: entrant.skills }),
        crew: crews[entrant.teamId] ?? 60,
        strategist: strategists[entrant.teamId] ?? 55,
        lapsDown: 0,
        lastLapRaced: 0,
        damage: 0,
        issue: 0,
        // RF-SIM-14 / RF-DEV-08: unit wear by failure group and damaged body parts (career.entrantsFor).
        ...(entrant.unitWear ? { unitWear: entrant.unitWear } : {}),
        ...(entrant.bodyDamage ? { bodyDamage: entrant.bodyDamage } : {}),
        gapAhead: null,
        gapBehind: null,
        lastPitLap: 0,
        penalties: [],
        pendingTime: 0,
        history: [],
      };
    });

  // RF-STF-02 / RF-SIM-13: the defence style each AI driver picks (the player's is the default
  // until ordered otherwise, RF-CMD-01), the attack risk, and the race-day form (its own stream, so
  // both modes run the same one, SRS 4.2).
  const formStream = createStream(`${seed}::form`);
  cars.forEach((car) => {
    car.defence = car.isUser ? simBalance.defence.default : aiDefenceStyleOf(car);
    car.overtakeRisk = simBalance.risk.default;
    car.form = raceFormOf(car, rules.year ?? year, formStream, race.circuitType);
  });
  // RF-SIM-14 / RF-SIM-09: each car's failure and crash hazards for this race (engine/incidents.js, f1db by era).
  const hazards = raceHazards({ cars, year: rules.year ?? year, laps, attrition: race.profile?.attrition });
  cars.forEach((car) => {
    car.hazard = hazards[car.id];
  });
  // RF-SIM-09 / RF-SIM-10: the start and the first corner, on its own stream so both modes play the same one (SRS 4.2).
  const turnOne = turnOnePlan({ cars, circuit, year: rules.year ?? year, wetness: startWet, grid: simBalance.grid, stream: createStream(`${seed}::start`) });

  return {
    race: { name: race.name, round: race.round, country: race.country, laps, baseLap: race.baseLap, profile: race.profile, circuit: race.circuit || null, lengthKm: race.lengthKm || circuit.km || null },
    pitLane,
    turnOne,
    wearScale,
    stopScale,
    year,
    era,
    laps,
    lap: 0,
    cars,
    weather: timeline,
    trackTemp,
    trackTempBase: trackTemp,
    trackTemps: [trackTemp],
    energy,
    fuelStart,
    fuelSpec,
    // The rubber on the track at the start: a wet Saturday washed some off (race-weather.json rubber).
    evolution: rubber,
    track: {
      ref: circuit.ref,
      km: circuit.km,
      corners: circuit.corners.map((corner) => ({ number: corner.number, name: corner.name, kind: corner.kind })),
      spots: circuit.brakingZones.map((zone) => ({ corner: zone.corner, metres: zone.metres })),
      drs: circuit.drsZones.length,
    },
    safetyCar: null,
    // Race control (RF-SIM-10): the last restart (DRS waits after it), yellows this lap, red flags shown, open investigations.
    restartLap: 0,
    yellow: null,
    redFlags: 0,
    investigations: [],
    teamOrders: {},
    events: startEvents,
    radio: [],
    fastestLap: null,
    finished: false,
    seed,
    streamState: 0,
    ...(sprint ? { sprint: true } : {}),
    _stream: stream,
  };
};

const normalisePlan = (plan, laps, eraOrRules) => {
  const rules = eraOrRules && eraOrRules.tyres ? eraOrRules : rulesFor(eraOrRules);
  const compounds = rules.tyres.compounds;
  const stops = (plan?.stops || []).filter((lap) => lap > 0 && lap < laps).sort((a, b) => a - b);
  const sequence = (plan?.compounds || []).filter((compound) => compounds.includes(compound));
  while (sequence.length < stops.length + 1) sequence.push(sequence[sequence.length - 1] || compounds[0]);
  // No tyre changes in the race (2005): every stop is a fuel stop on the starting set.
  if (!rules.tyres.changesInRace) sequence.fill(sequence[0] || compounds[0]);
  return { stops, compounds: sequence.slice(0, stops.length + 1) };
};

/**
 * RF-SIM-14: grid penalties for units over the era's limit, applied before the
 * start. `penalties` maps a car id to grid places (see rules.gridPenaltyFor);
 * eras without unit limits ignore them. Cars are moved back from the front.
 */
export const applyGridPenalties = (grid, penalties = {}, rules, events = []) => {
  const order = [...grid];
  if (!rules?.unitPenalties) return order;
  grid.forEach((id) => {
    const places = Math.max(0, Math.round(penalties[id] || 0));
    if (!places) return;
    const from = order.indexOf(id);
    order.splice(from, 1);
    order.splice(Math.min(order.length, from + places), 0, id);
    events.push({ lap: 0, type: "grid-penalty", carId: id, places });
  });
  return order;
};

/** The cars in race order: most laps first, then least elapsed time. */
export const runningOrder = (state) =>
  [...state.cars].sort((a, b) => {
    const running = (car) => (car.status === "running" || car.status === "finished" ? 1 : 0);
    if (running(a) !== running(b)) return running(b) - running(a);
    if (running(a) === 0) return (b.retiredLap ?? 0) - (a.retiredLap ?? 0);
    return a.time - b.time;
  });

export const weatherClass = (wetness) => (wetness >= 0.55 ? WEATHER.WET : wetness >= 0.2 ? WEATHER.MIXED : WEATHER.DRY);

/**
 * Events carry a lap: the race's lap in this mode; the step simulator passes the lap of
 * the car the event is about (its cars are on different laps at the same moment).
 */
export const pushEvent = (state, event, lap = state.lap) => {
  state.events.push({ lap, ...event });
};

/** Laps before the engineer repeats the same message to the same driver. */
const RADIO_COOLDOWN = { drs: 15, overtake: 15, hot: 8, fuel: 6, battery: 6, issue: 12, cliff: 6, penalty: 3 };

const pushRadio = (state, car, kind, extra = {}, lap = state.lap) => {
  const last = state.radio.filter((message) => message.carId === car.id && message.kind === kind).pop();
  if (last && lap - last.lap < (RADIO_COOLDOWN[kind] ?? 4)) return;
  state.radio.push({ lap, carId: car.id, kind, ...extra });
};

/** A corner on this circuit where a move or a mistake happens: the big stops after long straights first. */
export const spotOn = (state, stream, kind = "pass") => {
  const track = state.track;
  if (!track) return null;
  if (kind === "pass" && track.spots?.length) {
    const total = track.spots.reduce((sum, spot) => sum + spot.metres, 0);
    let pick = stream.range(0, total);
    for (const spot of track.spots) {
      pick -= spot.metres;
      if (pick <= 0) return spot.corner;
    }
    return track.spots[0].corner;
  }
  const corners = track.corners || [];
  if (!corners.length) return null;
  const weighted = corners.flatMap((corner) => (corner.kind === "slow" ? [corner, corner] : corner.kind === "fast" ? [corner, corner, corner] : [corner]));
  return weighted[stream.int(0, weighted.length - 1)].number;
};

// ----------------------------------------------------------- player calls

export const stateRules = (state) => rulesOf(state.era, state.year);

export const setMode = (state, carId, mode) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (car && MODES[mode]) car.mode = mode;
  return state;
};

export const setMix = (state, carId, mix) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (car && MIXES[mix]) car.fuelMode = mix;
  return state;
};

/** RF-CMD-01: an energy mode is only accepted in an era with KERS/ERS, on a car that has it ("overtake" only in 2026). */
export const setErs = (state, carId, mode) => {
  const car = state.cars.find((entry) => entry.id === carId);
  const modes = rulesOf(state.era, state.year).energy.modes;
  if (car && car.battery !== null && car.battery !== undefined && modes.includes(mode)) car.ersMode = mode;
  return state;
};

/**
 * RF-CMD-02: box at the next pit entry. `options.fuel` (laps, refuelling eras only) sets
 * the load instead of the strategist's; `options.frontWing: false` keeps the nose (the
 * crew otherwise changes a damaged one); `options.replace` makes it the next planned stop
 * brought forward instead of an extra one.
 */
export const requestPit = (state, carId, compound, options = {}) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (!car || car.status !== "running") return state;
  const request = { compound, lap: state.lap + 1 };
  if (Number.isFinite(options?.fuel) && rulesOf(state.era, state.year).refuelling) request.fuel = Math.max(1, Math.round(options.fuel));
  if (options?.frontWing === false) request.frontWing = false;
  if (options?.replace) request.replace = true;
  car.pitRequest = request;
  return state;
};

/** RF-CMD-02 "retrasar una vuelta": the next planned stop one lap later (never past the last lap). */
export const delayStop = (state, carId) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (!car || car.status !== "running") return state;
  const next = car.plan.stops.find((stop) => stop >= state.lap);
  if (next === undefined || next + 1 >= state.laps) return state;
  car.plan = { ...car.plan, stops: car.plan.stops.map((stop) => (stop === next ? next + 1 : stop)).sort((a, b) => a - b) };
  return state;
};

/** RF-CMD-02: cancel the next planned stop (its stint runs on; in a refuelling era, mind the fuel). */
export const skipStop = (state, carId) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (!car || car.status !== "running") return state;
  const next = car.plan.stops.find((stop) => stop >= state.lap);
  if (next === undefined) return state;
  // The stint that stop would have started goes with it.
  const drop = Math.min(car.plan.compounds.length - 1, car.stint + 1);
  const compounds = car.plan.compounds.length > 1 ? car.plan.compounds.filter((_, position) => position !== drop) : car.plan.compounds;
  car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== next), compounds };
  return state;
};

export const cancelPit = (state, carId) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (car) car.pitRequest = null;
  return state;
};

/**
 * Team orders between the two cars of one team. "swap" asks the car in front to
 * let the other through on the next lap; "hold" stops them racing each other.
 */
export const setTeamOrder = (state, teamId, order) => {
  state.teamOrders[teamId] = order;
  return state;
};

/**
 * The rival pit walls. Every team manages its cars the way the player can:
 * pace by tyre life and heat, mixture by what is left in the tank, the
 * battery by who is in front. `lap` is the lap about to be run (the step simulator
 * calls it at each car's own line crossing).
 */
/** The running car one place ahead of `car` on the road (by position), or null. */
const carAheadOf = (state, car) => state.cars.find((other) => other.status === "running" && other.position === car.position - 1) || null;

/**
 * RF-SIM-13: the rival pit walls' team orders, at the start of each race lap (both modes, SRS
 * 4.2), only where the rules allow them (rules.teamOrdersBanned; driver-attributes.json
 * effects.teamOrders). Two cars of one team running together swap when the one behind is
 * clearly quicker; with a rival right behind the second car they hold station instead of
 * fighting. The player's team is never touched: its orders are the player's (RF-CMD-01).
 */
export const aiTeamOrders = (state, lap) => {
  const rules = stateRules(state);
  const spec = DRIVER_BALANCE.effects.teamOrders;
  if (rules.teamOrdersBanned || state.safetyCar || lap < state.laps * spec.fromRaceShare || lap >= state.laps) return;
  state.aiOrders = state.aiOrders || {};
  const byTeam = {};
  state.cars.forEach((car) => {
    if (car.status === "running" && !car.isUser) (byTeam[car.teamId] = byTeam[car.teamId] || []).push(car);
  });
  Object.entries(byTeam).forEach(([teamId, pair]) => {
    if (pair.length !== 2) return;
    const [front, back] = pair[0].position < pair[1].position ? pair : [pair[1], pair[0]];
    const memory = (state.aiOrders[teamId] = state.aiOrders[teamId] || { lastSwap: -Infinity, set: null });
    const together = back.position === front.position + 1 && back.gapAhead !== null && back.gapAhead < spec.windowSec;
    let order = "free";
    if (together) {
      const edge = (front.expected ?? 0) - (back.expected ?? 0);
      const threat = state.cars.find((car) => car.status === "running" && car.teamId !== teamId && car.position === back.position + 1);
      if (edge > spec.swapPaceSec && lap - memory.lastSwap >= spec.cooldownLaps) {
        order = "swap";
        memory.lastSwap = lap;
      } else if (threat && threat.gapAhead !== null && threat.gapAhead < spec.holdThreatSec) order = "hold";
    }
    // Only undo what the AI itself set: a swap is cleared by the move once made.
    if (order !== "free" || memory.set === "hold") {
      if (state.teamOrders[teamId] !== "swap" || order === "swap") state.teamOrders[teamId] = order;
      memory.set = order;
    }
  });
};

export const rivalCalls = (state, car, lap = state.lap) => {
  const rules = stateRules(state);
  // Called at the start of a lap: the lap about to be run still counts.
  const remaining = state.laps - lap + 1;
  const life = tyreLifeUsed(car, rules);
  const attacking = car.gapAhead !== null && car.gapAhead < 1.2;
  const defending = car.gapBehind !== null && car.gapBehind < 1;
  const lonely = (car.gapAhead === null || car.gapAhead > 3) && (car.gapBehind === null || car.gapBehind > 4);
  // RF-SIM-13 / RF-STF-02 (driver-attributes.json effects.ai): stuck behind a car it has not the
  // pace to pass, an AI driver drops back into clean air to look after its tyres (sooner if it is
  // not aggressive); in a DRS train (both cars with DRS) it does not push; defending on old
  // tyres it keeps them and defends in the braking zones.
  const ai = DRIVER_BALANCE.effects.ai;
  const following = car.gapAhead !== null && car.gapAhead < ai.followGapSec;
  car.followLaps = following ? (car.followLaps || 0) + 1 : 0;
  const ahead = following ? carAheadOf(state, car) : null;
  const edge = ahead && Number.isFinite(ahead.expected) && Number.isFinite(car.expected) ? ahead.expected - car.expected : 0;
  const stuck = following && car.followLaps >= ai.stuckLaps + skillZ(car, "aggression") * ai.stuckAggression && edge < ai.paceEdge;
  const gapDrs = rules.drs?.detectionGap ?? 1;
  const train = Boolean(rules.drs?.enabled && ahead && car.gapAhead < gapDrs && ahead.gapAhead !== null && ahead.gapAhead < gapDrs);
  // How far the tyres must still go: to the next stop, or the flag.
  const nextStop = car.plan.stops.find((stop) => stop >= lap);
  const stintLeft = (nextStop ?? state.laps) - lap + 1;
  const spare = 1 - life - (stintLeft * (car.wearFactor ?? 1)) / Math.max(1, tyreSpec(car.compound, rules).life);
  if (car.tyreTemp > 0.74 || life > 0.92) car.mode = "save";
  else if (car.outLap) car.mode = "push";
  else if (stuck && remaining > 3) car.mode = ai.cleanAirMode;
  else if (defending && !attacking && life > ai.defendTyreLife && remaining > 3) car.mode = "normal";
  else if (((attacking && !train) || defending) && life < 0.8 && remaining > 1) car.mode = spare > -0.05 ? "push" : "normal";
  else if (lonely && remaining > 4 && spare < 0.1) car.mode = "save";
  else car.mode = "normal";
  car.outLap = false;
  if (!rules.refuelling) {
    const need = remaining + 0.6;
    car.fuelMode = car.fuel < need ? "lean" : remaining < 15 && car.fuel > need * 1.07 + 0.3 ? "rich" : "standard";
    // RF-SIM-04: started short of the race (the era's limit, engine/energy.js) by more than the lean
    // mix saves - the conserve pace on top (its burn, race-eras.json modes), as the fuel-saving laps.
    if (car.fuel < need * MIXES.lean.burn && MODES.conserve?.burn) car.mode = "conserve";
  }
  if (car.battery !== null && car.battery !== undefined) {
    const fight = (car.gapAhead !== null && car.gapAhead < 1) || (car.gapBehind !== null && car.gapBehind < 0.8);
    if (rules.energy.kers) {
      // KERS: the budget comes back every lap, so it is spent every lap; all of it on the straight when fighting.
      car.ersMode = fight || remaining <= 2 ? "deploy" : "balanced";
    } else {
      car.ersMode = car.battery < 22 ? "harvest" : fight && car.battery > 40 ? "deploy" : remaining <= 2 && car.battery > 15 ? "deploy" : "balanced";
      // 2026: within a second of the car ahead, the manual overtake mode replaces DRS.
      if (rules.energy.overtakeMode && car.gapAhead !== null && car.gapAhead < rules.energy.balance.overtakeGap && car.battery > 40) car.ersMode = "overtake";
    }
  }
};

// ----------------------------------------------------------------- a lap

/**
 * Pure (RF-SIM-09): the chance of a driver's mistake on one lap - a lock-up, a
 * trip wide, a spin - from the driver's control (RF-STF-02), pace mode, the wrong tyre for the water,
 * the wing and a cold tyre. For the step simulator, spread it over the lap.
 */
export const mistakeChanceOf = ({ driver = 1, mode = "normal", compound, wetness, wing = 0, cold = 0, rubber = 0 }) => {
  // RF-SIM-09 / RF-SIM-11: a tyre past its water capacity floats (aquaplaning), a wet on a dry
  // track slides, rubber on a wet line is slippery (race-weather.json mistakes).
  const m = WB.mistakes;
  const h = depthOfWetness(wetness);
  const floating = m.aquaplane * aquaplaningOf(compound, h);
  const wetOnDry = compound === "wet" && wetness < 0.3 ? m.wetOnDry : 0;
  const slip = wetness > WB.wetness.atSlickInter ? m.rubberSlip * Math.max(0, rubber) : 0;
  const mismatch = floating + wetOnDry + slip;
  // RF-STF-02: `driver` is the driver's factor (control, and adaptability in the wet: drivers/skills.js mistakeFactorOf).
  const chance = MISTAKE.chancePerLap * driver * modeEffect(mode).mistake * (1 + mismatch + m.wetFactor * wetness * (1 - wing * 2) + cold * MISTAKE.coldGain);
  return clamp(chance, MISTAKE.min, MISTAKE.max);
};

/**
 * Pure (RF-SIM-09, RF-SIM-14): the chances that a car stops for good on one lap - a failure
 * (`mechanical`) or a solo crash (`accident`) - from its hazards for the race
 * (engine/incidents.js raceHazards: the era's real rates from f1db, the car's reliability
 * against the field, unit wear and part damage, the driver's consistency, the circuit), the
 * pace mode, the safety car, a problem already on the car, the water and the wrong tyre.
 */
export const incidentChanceOf = ({ hazard, wetness = 0, mode = "normal", sc = false, issue = 0, compound = "hard", gapAhead = null }) => {
  const mech = REL.mechanical;
  const acc = REL.accident;
  const risk = modeEffect(mode).risk;
  const mismatch = !isWetTyre(compound) && wetness > 0.3 ? acc.mismatch : 1;
  return {
    mechanical: hazard.mech * risk * (sc ? mech.scFactor : 1) * (issue ? mech.issueFactor : 1),
    // RF-SIM-11: following in the spray raises the risk (race-weather.json spray).
    accident: hazard.accident * risk * wetRiskOf(wetness) * mismatch * (sc ? acc.scFactor : 1) * (sc ? 1 : sprayRiskOf(depthOfWetness(wetness), gapAhead)),
    issue: hazard.issue,
    mismatch,
  };
};

/**
 * Pure (RF-SIM-07, RF-SIM-08): the chance a car that has caught the one ahead
 * gets past this lap. `delta` is the difference in underlying pace (s/lap),
 * `drs` the DRS bonus (0 when closed), `energy` the attack and defence bonuses.
 */
export const passChanceOf = ({ overtaking = 0.55, delta, drs = 0, skill = 0, style = 0, wetness = 0, attack = 0, defend = 0, aheadColdTyre = false, yellow = false }) => {
  // RF-STF-02: `skill` is the drivers' share (drivers/skills.js passSkillTerm: overtaking, defending,
  // braking, aggression), `style` the defender's style and the attacker's risk order (RF-CMD-01).
  const chance = clamp(
    PASS.base + overtaking * PASS.overtaking + (delta - PASS.paceThreshold) * PASS.pace + drs + skill + style + (wetness > PASS.wetFrom ? PASS.wet : 0) + attack - defend + (aheadColdTyre ? PASS.coldTyre : 0),
    PASS.min,
    PASS.max,
  );
  return yellow ? chance * BALANCE.raceControl.yellow.passFactor : chance;
};

/** RF-SIM-08: the DRS bonus on this circuit, more for more zones. */
export const drsBonusFor = (rules, zones) => (zones > 0 ? rules.drs.passBonus * (1 + rules.drs.extraPerZone * (zones - 1)) : 0);

/** The race-control stream: same seed, its own draws, so it never reshuffles the race. Shared with the step simulator (RF-SIM-10). */
export const controlStream = (state) => {
  if (!state._control) state._control = createStream(`${state.seed}::control`);
  return state._control;
};

/** Wetness of the track on lap `lap` (the weather timeline is per lap). */
export const wetnessOn = (state, lap) => state.weather.wetness[Math.min(Math.max(0, lap), state.laps)] ?? 0;

/**
 * The race as a whole at the start of lap `lap` (RF-SIM-11): the track temperature,
 * the rubber going down or washed off, and the rain or drying message. The quick mode
 * calls it as the field starts a lap, the step simulator as the leader does.
 */
export const beginLapWorld = (state, lap) => {
  const weather = state.weather;
  // RF-SIM-13: the rival pit walls' team orders for this lap.
  aiTeamOrders(state, lap);
  // RF-SIM-11: this lap's water for real - the previous lap's with the cars running now, the
  // safety car and the track temperature (engine/weather updateLapWater; lap 0 is the start).
  if (weather.sectors && lap >= 1 && lap <= state.laps) {
    const cars = state.cars.reduce((count, car) => count + (car.status === "running" ? 1 : 0), 0);
    updateLapWater(weather, lap, { cars, sc: Boolean(state.safetyCar), trackC: state.trackTemp ?? 30, baseLap: state.race.baseLap });
  }
  const wetness = weather.wetness[Math.min(lap, state.laps)] ?? 0;
  const previousWetness = weather.wetness[Math.max(0, lap - 1)] ?? 0;
  const climate = weatherClass(wetness);
  // The track: the start's temperature (air and sun, engine/weather) and the afternoon's drift; rain
  // pulls it towards the air plus the rain's offset (race-weather.json temperature, OpenF1). A cloud
  // passing in the dry does not move it lap by lap.
  if (state.trackTempBase !== undefined) {
    const drift = Math.sin((lap / state.laps) * Math.PI) * 3 - (lap / state.laps) * 2;
    const raining = weather.states && weather.states[Math.min(lap, state.laps)] >= WB.states.rainFrom;
    const target = (raining ? Math.min(state.trackTempBase, trackTargetOf(weather, lap)) : weather.states ? state.trackTempBase : state.trackTempBase - wetness * 16) + drift;
    state.trackTemp = Math.round((state.trackTemp + (target - state.trackTemp) * WB.temperature.relaxPerLap) * 10) / 10;
    state.trackTemps.push(state.trackTemp);
  }

  // Rubber goes down through a dry race and the track quickens; water washes it off (race-weather.json rubber).
  const h = weather.water ? weather.water[Math.min(lap, state.laps)] ?? 0 : depthOfWetness(wetness);
  state.evolution =
    h > WB.grip.dryBelowMm ? Math.max(Math.min(0, state.evolution || 0), (state.evolution || 0) - WB.rubber.washPerMm * h) : Math.min(1, (state.evolution || 0) + 1 / Math.max(10, state.laps * 0.55));

  if (weatherClass(previousWetness) !== climate && lap > 1) {
    pushEvent(state, { type: wetness > previousWetness ? "rain" : "drying", wetness }, lap);
  }
};

/** KERS (RF-SIM-05): the deploy budget is restored at the line every lap. */
export const restoreKers = (rules, car) => {
  if (rules.energy.kers && car.battery !== null && car.battery !== undefined) car.battery = 100;
};

/**
 * RF-SIM-02..06: one car's lap before traffic, the model both modes share (SRS 4.2).
 * Wears the tyres for the lap, spends the battery, and returns the parts: `expected`
 * (the lap with no scatter: pace, tyres, heat, fuel, battery, rubber, mode, mix, setup,
 * damage, problems, wing in the wet), `wake` (the quick mode's dirty air for the gap at
 * the line; the step simulator applies dirty air by distance instead), `volatility`
 * (the driver's scatter) and the terms the end of the lap needs. `energyGap` overrides the
 * gap the 2026 overtake mode reads at the line (the step simulator passes null and runs
 * the overtake mode by distance during the lap).
 */
export const lapBudget = (state, car, { lap = state.lap, wetness, sc = state.safetyCar, rules = stateRules(state), energyGap } = {}) => {
  const climate = weatherClass(wetness);
  const baseLap = state.race.baseLap;
  const spp = baseLap * 0.0012;
  const trackTemp = state.trackTemp ?? 30;
  const fuelSpec = fuelOfState(state);
  const fuelStart = state.fuelStart ?? fuelSpec.startLaps ?? state.laps;
  const evolution = -0.55 * (state.evolution || 0);
  const refuel = rules.refuelling;
  const mode = modeEffect(car.mode);
  const mix = mixEffect(car.fuelMode);
  const pace = car.pace[climate] ?? car.pace.dry;

  // Tyres: their heat at the start of the lap decides how they grip and wear.
  const overheat = Math.max(0, car.tyreTemp - THERMAL.overheatAbove);
  const cold = Math.max(0, THERMAL.coldBelow - car.tyreTemp);
  const dirty = car.gapAhead !== null && car.gapAhead !== undefined && car.gapAhead < 1 && lap > 1 && !sc ? 1 - car.gapAhead : 0;
  const wing = car.wing ?? 0;
  const wearRate =
    car.wearFactor * mode.wear * (1 + overheat * THERMAL.overheatWear + dirty * THERMAL.dirtyWear + Math.max(0, -wing) * THERMAL.negativeWingWear) * (1 + (trackTemp - THERMAL.trackRefC) * THERMAL.trackWearPerC);
  car.tyreWear += wearRate * (sc ? THERMAL.scWear : 1);
  const tyre = isWetTyre(car.compound)
    ? tyreTime({ compound: car.compound, age: car.tyreAge, wetness, era: rules, baseLap })
    : tyreTime({ compound: car.compound, age: car.tyreWear, wetness, era: rules, wearFactor: 1, baseLap });

  // Fuel weight: in the refuelling years the stint's load, otherwise the race's
  // load measured against the half-tank the reference lap was run on.
  const fuel = fuelTime({ fuel: car.fuel, refuel, fuelStart, perLap: fuelSpec.secPerLap });

  // The battery (RF-SIM-05).
  let energyTime = 0;
  car.overtakeActive = false;
  if (car.battery !== null && car.battery !== undefined) {
    const step = energyStep({ rules, mode: car.ersMode, battery: car.battery, gapAhead: sc ? null : energyGap !== undefined ? energyGap : car.gapAhead });
    car.battery = step.battery;
    car.overtakeActive = step.overtake;
    energyTime = step.time;
  }

  const thermal = cold * THERMAL.coldSecPerUnit + overheat * THERMAL.overheatSecPerUnit;
  // Dirty air, and in the wet the spray of the car ahead (race-weather.json spray; the step sim applies it by distance).
  const spray = sc || lap <= 1 ? 0 : sprayLossOf(depthOfWetness(wetness), car.gapAhead);
  const wake = dirty * rules.dirtyAir + spray;
  // RF-STF-02: accuracy sets the lap-to-lap scatter.
  const volatility = baseLap * NOISE.lapShare * volatilityFactorOf(car) * (1 + wetness * NOISE.wetGain);
  // What the car would do with no scatter: the speed a following driver can actually use to pass.
  const expected =
    baseLap - pace * spp + tyre + fuel + mode.time + mix.time + energyTime + thermal + evolution + car.setup + car.damage + car.issue + (car.form || 0) * baseLap -
    wing * wetness * baseLap * 0.012;
  car.expected = expected;
  return { expected, wake, volatility, dirty, cold, wing, wetness, mix, energyTime, spray, rubber: state.evolution || 0 };
};

/**
 * The start (lap 1 only): a launch is a skill and the first lap is a scrum - the further
 * back (`gridIndex`), the more of it you are stuck in, so the field strings out. The step
 * simulator keeps only `scrumShare` of the scrum, because its traffic is real.
 */
export const startTerm = (car, gridIndex, stream, scrumShare = 1) =>
  stream.normal(0, START.launchSd) - startSkillTime(car) + START.scrumSec + gridIndex * START.scrumPerSlotSec * scrumShare;

/**
 * A mistake this lap (RF-SIM-09): a lock-up, a trip wide, a spin. Sets
 * `car.pendingMistake` (seconds) and returns its kind, or null. Where it happens is the
 * caller's (a corner of the circuit); a lock-up flat-spots the tyre (+0.8 laps of wear).
 */
export const rollMistake = (car, { wetness, wing, cold, rubber = 0 }, stream) => {
  const mistakeChance = mistakeChanceOf({ driver: mistakeFactorOf(car, wetness), mode: car.mode, compound: car.compound, wetness, wing, cold, rubber });
  car.pendingMistake = stream.chance(mistakeChance) ? stream.range(MISTAKE.costSec[0], MISTAKE.costSec[1]) : 0;
  if (!car.pendingMistake) return null;
  const kind = car.pendingMistake > MISTAKE.spinAboveSec ? "spin" : car.pendingMistake > MISTAKE.wideAboveSec ? "wide" : "lockup";
  if (kind === "lockup") car.tyreWear += MISTAKE.lockupWearLaps;
  return kind;
};

/** The end of a car's lap: tyre age, fuel burnt (or the stint's lap of it), tyre heat drifting toward what the driving asks. */
export const endLapWear = (state, car, plan, { wetness, sc = state.safetyCar, rules = stateRules(state) } = {}) => {
  const trackTemp = state.trackTemp ?? 30;
  car.tyreAge += 1;
  if (rules.refuelling) car.fuel = Math.max(0, car.fuel - 1);
  else car.fuel -= plan.mix.burn * (MODES[car.mode]?.burn ?? MODE_BURN[car.mode] ?? 1) * (sc ? SC_BURN : 1);

  // Temperature drifts toward what the driving asks of it.
  const target = sc
    ? THERMAL.scTarget
    : TEMP_TARGET[car.mode] + plan.dirty * THERMAL.driftDirtyGain + (trackTemp - THERMAL.trackRefC) / THERMAL.driftTrackDivisor - wetness * THERMAL.driftWetCool;
  car.tyreTemp = clamp(car.tyreTemp + (target - car.tyreTemp) * THERMAL.driftRelax, THERMAL.min, THERMAL.max);
};

/** Race control watches the lights (RF-SIM-10): a jump start is investigated. */
export const jumpStartChecks = (state, cars, lap = state.lap) => {
  const control = controlStream(state);
  const jump = BALANCE.penalties.offences.jumpStart;
  cars.forEach((car) => {
    if (control.chance(jump.chancePerCar)) investigate(state, car, "jumpStart", null, lap);
  });
};

/**
 * RF-SIM-09 / RF-SIM-14: does this lap end the car's race - a failure, an accident, a
 * spin into the wall, an empty tank? Returns `{ reason, fromMistake }` or null; a
 * problem that only slows the car (a misfire, a stuck gear) is booked here with its event.
 */
export const failureOf = (state, car, { lap = state.lap, wetness, sc = state.safetyCar, rules = stateRules(state), stream } = {}) => {
  if (!car.hazard) ensureHazards(state);
  const risk = incidentChanceOf({ hazard: car.hazard, wetness, mode: car.mode, sc: Boolean(sc), issue: car.issue, compound: car.compound, gapAhead: lap > 1 ? car.gapAhead : null });
  const roll = stream.next();
  if (roll < risk.mechanical) {
    // RF-SIM-14: which component broke, by the era's real split (and the car's worn units).
    car.failedComponent = pickGroup(car.hazard.groups, stream.next());
    return { reason: "mechanical", component: car.failedComponent, fromMistake: false };
  }
  if (roll < risk.mechanical + risk.accident) return { reason: "accident", fromMistake: false };
  const crash = REL.accident.mistakeCrash;
  if (car.pendingMistake > crash.minLoss && stream.chance(crash.chance * risk.mismatch * car.hazard.crashScale)) return { reason: "accident", fromMistake: true };
  // A problem that does not stop the car but slows it: a misfire, a gearbox stuck in a gear.
  if (!car.issue && stream.chance(risk.issue)) {
    car.issue = Math.round(stream.range(0.5, 2.2) * 10) / 10;
    pushEvent(state, { type: "issue", carId: car.id, loss: car.issue }, lap);
  }
  if (!rules.refuelling && car.fuel < 0) return { reason: "fuel", fromMistake: false };
  return null;
};

/** Hazards for a race state that lost them (an old save, a postMessage copy): computed again from its cars. */
export const ensureHazards = (state) => {
  const hazards = raceHazards({ cars: state.cars, year: stateRules(state).year ?? state.year, laps: state.laps, attrition: state.race.profile?.attrition });
  state.cars.forEach((car) => {
    car.hazard = hazards[car.id];
  });
};

/**
 * RF-SIM-12, RF-STF-07 (WP7): the time a stop takes in the box, stage by stage
 * (engine/sim/pitStop.js planStop: marks, jacks, four wheels in parallel with the wing and,
 * in refuelling eras, the fuel, then the release, each with its crew role and its error roll)
 * - fuel only in 2005 unless the weather or damage needs tyres - and whether the tyres are
 * changed. The draws come from the crew's own stream (`crew`; the quick mode passes
 * crewStream(state), the step mode its `crew` stream), never from the race's.
 */
export const pitStopTime = (car, decision, { rules, stream, crew = stream, kgPerLap = null }) => {
  const refuelLoad = rules.refuelling ? decision.fuel : 0;
  // 2005: no tyre changes in the race - a planned stop is fuel only, unless the
  // weather changed (wet <-> dry) or the car is damaged.
  const weatherSwitch = isWetTyre(decision.compound) !== isWetTyre(car.compound) || (isWetTyre(decision.compound) && decision.compound !== car.compound);
  const tyresChanged = rules.tyres.changesInRace || weatherSwitch || (decision.repair && (car.damage > 0 || Boolean(car.puncture)));
  const wing = decision.repair && car.damage > 0 ? "change" : null;
  const plan = planStop({ rules, crew: car.crew, tyres: tyresChanged, refuelLaps: refuelLoad, wing, stream: crew, kgPerLap });
  return { stationary: plan.stationary, slow: plan.slow, tyresChanged, refuelLoad, stages: plan.stages, mistake: plan.mistake };
};

/** The wait for a team-mate already in the box (double stack), in seconds (race-eras.json `pit.doubleStackWait`). */
export const DOUBLE_STACK_WAIT = PIT.doubleStackWait;

/**
 * RF-SIM-12 / RF-SIM-10: the work done in the box - tyres, fuel, repairs, a +5/+10 s
 * penalty served before the crew touches the car - with its events and the pit-lane
 * offences the stewards may look at. `stop` is pitStopTime's answer, `queue` the
 * double-stack wait. Returns the penalty seconds served at this stop.
 */
export const applyPitStop = (state, car, decision, stop, { lap = state.lap, queue = 0, rules = stateRules(state) } = {}) => {
  const { stationary, slow, tyresChanged, refuelLoad } = stop;
  const refuel = rules.refuelling;
  const served = car.pendingTime || 0;
  if (tyresChanged) {
    car.compound = decision.compound;
    if (!car.compoundsUsed.includes(decision.compound)) car.compoundsUsed.push(decision.compound);
    car.tyreAge = 0;
    car.tyreWear = 0;
    car.tyreTemp = outLapTemp(rules);
  }
  car.stops += 1;
  car.lastPitLap = lap;
  car.outLap = true;
  car.stint += decision.planned ? 1 : 0;
  if (decision.call) pushEvent(state, { type: "call", carId: car.id, call: decision.call }, lap);
  // RF-SIM-09: what was repaired - a puncture, or a front wing (damage) - shown on the pit event.
  const repaired = decision.repair ? (car.puncture ? "puncture" : car.damage > 0 ? "wing" : null) : null;
  if (decision.repair) {
    car.damage = 0;
    car.puncture = false;
    car.issue = car.issue > 1.2 ? car.issue * 0.5 : 0;
  }
  if (refuel) car.fuel = decision.fuel;
  car.pitRequest = null;
  pushEvent(state, {
    type: "pit", carId: car.id, compound: car.compound, stationary: Math.round((stationary + queue) * 10) / 10, slow: slow > 0, stacked: queue > 0,
    ...(refuel ? { refuel: refuelLoad } : {}),
    ...(tyresChanged ? {} : { tyres: false }),
    ...(repaired ? { repair: repaired } : {}),
    ...(served ? { penalty: served } : {}),
  }, lap);
  if (served) {
    car.pendingTime = 0;
    car.penalties.filter((penalty) => penalty.kind === "time" && !penalty.served).forEach((penalty) => (penalty.served = true));
    pushEvent(state, { type: "penalty-served", carId: car.id, seconds: served }, lap);
  }
  pitLaneOffences(state, car, queue > 0, lap);
  return served;
};

/** RF-SIM-10: rain no car can race in stops the race (decided on the race-control stream). */
export const rainRedFlagCheck = (state, wetness, lap = state.lap) => {
  const redCfg = BALANCE.raceControl.redFlag;
  if (!state.pendingRed && wetness >= redCfg.rainWetness && (state.redFlags || 0) < redCfg.maxPerRace && lap < state.laps && controlStream(state).chance(redCfg.rainChance)) {
    state.pendingRed = "rain";
  }
};

/**
 * Run one lap for the whole field. Returns the events it produced, which the
 * live view turns into commentary.
 */
export const stepLap = (state) => {
  if (state.finished) return [];
  const stream = state._stream || createStream(`${state.seed}::race`);
  state._stream = stream;
  controlStream(state);
  const rules = stateRules(state);
  const firstEvent = state.events.length;
  state.lap += 1;
  const lap = state.lap;
  const wetness = state.weather.wetness[Math.min(lap, state.laps)] ?? 0;
  const baseLap = state.race.baseLap;
  state.yellow = null;
  if (!state.investigations) state.investigations = [];
  beginLapWorld(state, lap);

  const sc = state.safetyCar;
  const before = runningOrder(state).filter((car) => car.status === "running");
  const beforeIndex = Object.fromEntries(before.map((car, index) => [car.id, index]));
  const lapStart = Object.fromEntries(before.map((car) => [car.id, car.time]));
  const leaderBefore = before[0];

  // KERS: the deploy budget is restored at the line every lap.
  before.forEach((car) => restoreKers(rules, car));

  before.forEach((car) => {
    if (!car.isUser) rivalCalls(state, car);
  });

  // ---- lap times
  before.forEach((car) => {
    const plan = lapBudget(state, car, { lap, wetness, sc, rules });
    let time = plan.expected + plan.wake + stream.normal(0, plan.volatility);

    // The start: a launch is a skill and the first lap is a scrum.
    if (lap === 1) time += startTerm(car, beforeIndex[car.id] ?? 0, stream);

    // A mistake: a lock-up, a trip wide, a spin - at a corner of this circuit.
    const kind = rollMistake(car, plan, stream);
    time += car.pendingMistake;
    if (kind) {
      const corner = spotOn(state, stream, "mistake");
      pushEvent(state, { type: "mistake", carId: car.id, kind, corner, loss: Math.round(car.pendingMistake * 10) / 10 });
      // A car stopped or off the road at a corner: yellow flags there (RF-SIM-10).
      if (!sc && BALANCE.raceControl.yellow.mistakeKinds.includes(kind)) waveYellow(state, corner, car.id);
    }

    // SIM-5 (RNF-07): the pace behind the safety car or on the VSC delta, measured in OpenF1 (race-sim.json safetyCar).
    if (sc) time = Math.max(time, baseLap * (sc.virtual ? simBalance.safetyCar.virtualLapFactor : simBalance.safetyCar.lapFactor));

    car.lapTime = time;
    endLapWear(state, car, plan, { wetness, sc, rules });
  });

  // ---- jump starts: race control watches the lights (RF-SIM-10)
  if (lap === 1) jumpStartChecks(state, before);

  // ---- the first corner (RF-SIM-09): the launch and the touches of state.turnOne
  if (lap === 1) applyTurnOne(state, before, stream);

  // ---- failures, accidents, problems and empty tanks
  before.forEach((car) => {
    if (car.status !== "running") return;
    const failure = failureOf(state, car, { lap, wetness, sc, rules, stream });
    if (failure) retire(state, car, failure.reason);
  });
  // ---- a suspension broken in a touch this lap: the car reaches the line and stops (RF-SIM-09)
  before.forEach((car) => {
    if (car.status === "running" && car.retireAtLine && lap >= car.retireAtLine) retire(state, car, "collision", { share: 0.97, corner: car.retireCorner ?? null });
  });

  const running = before.filter((car) => car.status === "running");

  // ---- penalties served in the pit lane: drive-through and stop-go (RF-SIM-10)
  running.forEach((car) => servePitPenalty(state, car, rules, sc));

  // ---- pit stops at the end of the lap
  const stationaryByTeam = {};
  running.forEach((car) => {
    // SIM-5 (era-defaults.json scPitClosed): no stop on the lap the safety car came out in the eras that closed the lane.
    if (pitClosedFor(state, car, rules, lap)) return;
    const decision = pitDecision(state, car, wetness, stream);
    if (!decision) return;
    const laneLoss = pitLaneLoss(state, sc);
    const stop = pitStopTime(car, decision, { rules, stream, crew: crewStream(state), kgPerLap: fuelOfState(state).kgPerLap });
    const { stationary } = stop;
    // Double stack: the second car of a team waits for the first to leave the box.
    const queue = stationaryByTeam[car.teamId] !== undefined ? stationaryByTeam[car.teamId] + DOUBLE_STACK_WAIT : 0;
    stationaryByTeam[car.teamId] = stationary;
    // A time penalty (+5/+10 s, from 2014) is served before the crew touches the car.
    const served = car.pendingTime || 0;
    car.lapTime += laneLoss + stationary + queue + served;
    car.pit = { lane: laneLoss, stationary: stationary + queue + served };
    applyPitStop(state, car, decision, stop, { lap, queue, rules });
  });

  // ---- elapsed time
  running.forEach((car) => {
    car.time += car.lapTime;
    car.lastLap = car.lapTime;
    car.lastLapRaced = lap;
    if (!sc && !car.pendingMistake && !car.pit && (car.bestLap === null || car.lapTime < car.bestLap)) car.bestLap = car.lapTime;
  });

  // ---- the car in front, and the cars a lap ahead
  resolveTraffic(state, running, beforeIndex, stream, wetness);
  blueFlags(state, running, baseLap);

  // ---- red flag: a heavy crash this lap, or rain no car can race in (RF-SIM-10)
  rainRedFlagCheck(state, wetness, lap);
  if (state.pendingRed) {
    redFlag(state, running.filter((car) => car.status === "running"), state.pendingRed, wetness, lapStart);
    state.pendingRed = null;
  } else if (sc) {
    // ---- safety car bookkeeping
    sc.laps -= 1;
    if (sc.laps <= 0) {
      state.safetyCar = null;
      state.restartLap = lap;
      pushEvent(state, { type: "sc-in", virtual: sc.virtual });
    }
  }

  // ---- stewards: decisions on open investigations
  decideInvestigations(state, rules);

  // ---- fastest lap
  running.forEach((car) => {
    if (car.status !== "running" || car.bestLap === null) return;
    if (!state.fastestLap || car.bestLap < state.fastestLap.time) {
      const changed = state.fastestLap && state.fastestLap.carId !== car.id;
      state.fastestLap = { carId: car.id, time: car.bestLap, lap };
      if (changed && lap > 3) pushEvent(state, { type: "fastest", carId: car.id, time: car.bestLap });
    }
  });

  // ---- engineer on the radio
  state.cars.filter((car) => car.isUser && car.status === "running").forEach((car) => radioFor(state, car, wetness));

  // ---- positions and the gap to the car ahead, which next lap's dirty air reads
  const after = runningOrder(state);
  const leader = after.find((car) => car.status === "running");
  let ahead = null;
  after.forEach((car, index) => {
    car.position = index + 1;
    car.gapBehind = null;
    if (car.status === "running" && leader) {
      car.gap = car.time - leader.time;
      car.lapsDown = Math.max(0, Math.floor(car.gap / (leader.lastLap || baseLap)));
      car.gapAhead = ahead && car.time - ahead.time < baseLap * 0.5 ? car.time - ahead.time : null;
      if (ahead) ahead.gapBehind = car.time - ahead.time;
      ahead = car;
    }
  });
  if (leader && leaderBefore && leader.id !== leaderBefore.id && lap > 1) pushEvent(state, { type: "lead", carId: leader.id });

  // ---- what the live view needs to draw the lap: when each car crossed the line
  state.cars.forEach((car) => {
    if (lapStart[car.id] === undefined) return;
    if (car.status === "running") {
      // RF-CMD-01 / RF-SIM-13: the pace mode and fuel mix the lap was driven on (the pit wall's call).
      car.history.push({ lap, start: lapStart[car.id], end: car.time, pit: car.pit || null, compound: car.compound, mode: car.mode, mix: car.fuelMode });
    } else if (car.retiredLap === lap) {
      const share = car.retireShare ?? 0.5;
      car.history.push({ lap, start: lapStart[car.id], end: lapStart[car.id] + (car.lapTime || baseLap) * share, retired: true, share });
    }
    car.pit = null;
  });

  if (lap >= state.laps || !leader) finishRace(state);

  return state.events.slice(firstEvent);
};

// ----------------------------------------------------------- race control

/**
 * Yellow flags at a corner this lap (RF-SIM-10): passes there are rarer. The step
 * simulator reads `state.yellow` after each incident and turns it into a timed local
 * yellow on that corner (slow down, no passing).
 */
export const waveYellow = (state, corner, carId, lap = state.lap) => {
  if (!state.yellow) state.yellow = { lap, corners: [] };
  if (state.yellow.corners.includes(corner)) return;
  state.yellow.corners.push(corner);
  pushEvent(state, { type: "yellow", carId, corner }, lap);
};

/**
 * RF-SIM-10: the stewards open an investigation; the decision comes a lap or
 * three later, and only a penalty the era has can be given (era-defaults
 * `penaltyTypes`). `otherId` is the other car in a collision. `lap` is the race's lap
 * the stewards count from (the step simulator passes the leader's).
 */
export const investigate = (state, car, offence, otherId = null, lap = state.lap) => {
  const control = controlStream(state);
  const [from, to] = BALANCE.penalties.decisionLaps;
  if (!state.investigations) state.investigations = [];
  state.investigations.push({ carId: car.id, offence, lap, decideLap: lap + control.int(from, to), otherId });
  pushEvent(state, { type: "investigation", carId: car.id, otherId, offence }, lap);
};

/** RF-SIM-10: a contact in a fight - the stewards may look at the attacker (race-control stream). */
export const collisionInvestigation = (state, car, otherId, lap = state.lap) => {
  const collision = BALANCE.penalties.offences.collision;
  if (car.status === "running" && controlStream(state).chance(collision.investigate)) investigate(state, car, "collision", otherId, lap);
};

/** RF-SIM-10: the stewards decide every investigation due by race lap `lap`, with the era's penalties only. */
export const decideInvestigations = (state, rules, lap = state.lap) => {
  if (!state.investigations?.length) return;
  const control = controlStream(state);
  const due = state.investigations.filter((item) => item.decideLap <= lap);
  state.investigations = state.investigations.filter((item) => item.decideLap > lap);
  due.forEach((item) => {
    const car = state.cars.find((entry) => entry.id === item.carId);
    if (!car || car.status !== "running") return;
    const spec = BALANCE.penalties.offences[item.offence];
    const guilty = spec.guilty === undefined || control.chance(spec.guilty);
    const type = guilty ? penaltyFor(rules, item.offence) : null;
    if (!type) {
      pushEvent(state, { type: "no-action", carId: car.id, offence: item.offence }, lap);
      return;
    }
    givePenalty(state, car, item.offence, type, lap);
  });
};

/** Book a penalty on a car (RF-SIM-10): pit-lane penalties wait for the box, time penalties for the next stop or the flag. */
const givePenalty = (state, car, offence, type, lap = state.lap) => {
  const seconds = BALANCE.penalties.seconds;
  const penalty = { type, offence, lap, served: false };
  if (type === "time5" || type === "time10") {
    penalty.kind = "time";
    penalty.seconds = seconds[type];
    car.pendingTime = (car.pendingTime || 0) + penalty.seconds;
  } else if (type === "postRaceTime") {
    penalty.kind = "post";
    penalty.seconds = BALANCE.penalties.offences[offence]?.postRaceSeconds ?? 0;
  } else {
    penalty.kind = "pit";
    penalty.seconds = type === "stopGo" ? seconds.stopGo : 0;
    penalty.dueLap = lap + BALANCE.penalties.serveWithinLaps;
  }
  if (!car.penalties) car.penalties = [];
  car.penalties.push(penalty);
  pushEvent(state, { type: "penalty", carId: car.id, offence, penalty: type, seconds: penalty.seconds }, lap);
};

/**
 * RF-SIM-10: the drive-through or stop-go a car must serve on lap `lap`, if any: given
 * on an earlier lap, never behind the safety car, never on the last lap.
 */
export const duePitPenalty = (state, car, sc = state.safetyCar, lap = state.lap) => {
  if (sc || !car.penalties?.length) return null;
  const penalty = car.penalties.find((item) => item.kind === "pit" && !item.served && item.lap < lap);
  if (!penalty || lap >= state.laps) return null;
  return penalty;
};

/** Mark a pit-lane penalty served (`loss` = the seconds it cost) with its event. */
export const markPenaltyServed = (state, car, penalty, loss, lap = state.lap) => {
  penalty.served = true;
  pushEvent(state, { type: "penalty-served", carId: car.id, penalty: penalty.type, seconds: Math.round(loss * 10) / 10 }, lap);
};

/** A drive-through or stop-go is served the lap after it is given, never behind the safety car. */
const servePitPenalty = (state, car, rules, sc) => {
  const penalty = duePitPenalty(state, car, sc);
  if (!penalty) return;
  const loss = pitLaneLoss(state, null, { through: penalty.type !== "stopGo" }) + penalty.seconds;
  car.lapTime += loss;
  markPenaltyServed(state, car, penalty, loss);
};

/** Offences of the pit lane (RF-SIM-10): speeding (pit speed limit from 1994) and an unsafe release. */
const pitLaneOffences = (state, car, stacked, lap = state.lap) => {
  // The step simulator judges these with their cause, in the lane itself (engine/sim/pitLane.js).
  if (state._sim && state._sim.lane) return;
  const control = controlStream(state);
  const { pitSpeeding, unsafeRelease } = BALANCE.penalties.offences;
  const year = stateRules(state).year;
  if (year >= pitSpeeding.from && control.chance(pitSpeeding.chancePerStop)) investigate(state, car, "pitSpeeding", null, lap);
  else if (year >= unsafeRelease.from && control.chance(stacked ? unsafeRelease.chanceStacked : unsafeRelease.chancePerStop)) investigate(state, car, "unsafeRelease", null, lap);
};

/**
 * RF-SIM-10: the red flag. The race stops at the end of this lap and restarts by
 * the era's procedure (era-defaults `redFlag`):
 *
 *   aggregate   the old two-part race: the order and the gaps stand.
 *   standing    the field lines up in order and starts again from the grid.
 *   rolling     the field lines up and restarts behind the safety car.
 *
 * Where the era allows it, every car gets fresh tyres in the pit lane. DRS waits
 * two laps after the restart. RF-HIS-00: a heavy crash only ends that car's race;
 * no accident is ever fatal.
 */
export const redFlag = (state, running, reason, wetness = 0, lapStart = {}) => {
  const rules = stateRules(state);
  const red = rules.raceControl.redFlag;
  const cfg = BALANCE.raceControl.redFlag;
  const baseLap = state.race.baseLap;
  showRedFlag(state, reason);
  redFlagTyres(state, running, wetness);

  const ordered = [...running].sort((a, b) => a.time - b.time);
  if (!red.aggregate) {
    // Line the field up: each car a grid slot behind the one ahead, lapped cars stay lapped.
    for (let index = 1; index < ordered.length; index += 1) {
      const ahead = ordered[index - 1];
      const car = ordered[index];
      const gap = car.time - ahead.time;
      if (gap < baseLap * 0.6) car.time = Math.max(ahead.time + cfg.standingSpacing, (lapStart[car.id] ?? -Infinity) + baseLap * cfg.minLapShare);
    }
  }
  redFlagRestart(state);
};

/** RF-SIM-10: the red flag is shown (the race is stopped; any safety car is withdrawn). */
export const showRedFlag = (state, reason, lap = state.lap) => {
  state.redFlags = (state.redFlags || 0) + 1;
  state.safetyCar = null;
  pushEvent(state, { type: "red", reason }, lap);
};

/**
 * RF-SIM-10: in the pit lane under the red flag - fresh tyres where the era allows it
 * (era-defaults `redFlag.tyreChanges`, and only in eras that change tyres at all), and
 * every tyre cools to the era's out-lap temperature.
 */
export const redFlagTyres = (state, running, wetness = 0, lap = state.lap) => {
  const rules = stateRules(state);
  const red = rules.raceControl.redFlag;
  if (red.tyreChanges && rules.tyres.changesInRace) {
    const wanted = tyreForWetness(wetness);
    running.forEach((car) => {
      const requested = car.pitRequest?.compound;
      const compound = requested || (car.isUser ? car.compound : wanted || (isWetTyre(car.compound) ? dryCompoundFor(state.laps - lap, rules) : car.compound));
      car.compound = compound;
      if (!car.compoundsUsed.includes(compound)) car.compoundsUsed.push(compound);
      car.tyreAge = 0;
      car.tyreWear = 0;
      car.pitRequest = null;
    });
  }
  running.forEach((car) => {
    car.tyreTemp = rules.tyres.outLapTemp;
  });
};

/** RF-SIM-10: the era's restart procedure after a red flag ("aggregate", "standing", "rolling"; rolling falls back to standing without a safety car). */
export const restartProcedureOf = (rules) => {
  const procedure = rules.raceControl.redFlag.restart;
  return procedure === "rolling" && !rules.raceControl.safetyCar ? "standing" : procedure;
};

/**
 * RF-SIM-10: the restart after a red flag - behind the safety car for a rolling restart
 * (its laps from the race-control stream), otherwise from the grid, with DRS waiting
 * after it. Returns the procedure.
 */
export const redFlagRestart = (state, lap = state.lap) => {
  const rules = stateRules(state);
  const red = rules.raceControl.redFlag;
  const cfg = BALANCE.raceControl.redFlag;
  const procedure = restartProcedureOf(rules);
  if (procedure === "rolling") {
    const [from, to] = cfg.rollingScLaps;
    state.safetyCar = { laps: controlStream(state).int(from, to), virtual: false };
    pushEvent(state, { type: "restart", procedure, aggregate: Boolean(red.aggregate) }, lap);
    pushEvent(state, { type: "sc" }, lap);
  } else {
    state.restartLap = lap;
    pushEvent(state, { type: "restart", procedure, aggregate: Boolean(red.aggregate) }, lap);
  }
  return procedure;
};

/** RF-SIM-09: the quick mode's chance that a pass ends in a touch (race-reliability.json contact.passContact × the era's calibration). */
/**
 * RF-SIM-07 / RF-CMD-01: the defender's style and the attacker's risk order, as the step mode's
 * duel reads them (race-sim.json defence, risk), so both modes pass alike (SRS 4.2).
 */
export const duelStyleTerm = (attacker, defender) =>
  (simBalance.risk.levels[attacker.overtakeRisk] || simBalance.risk.levels[simBalance.risk.default]).chance +
  (simBalance.defence.styles[defender.defence] || simBalance.defence.styles[simBalance.defence.default]).chance;

/** RF-SIM-09: the same for the touch: risk, style and the drivers' squeeze (drivers/skills.js contactFactorOf). */
export const duelContactFactor = (attacker, defender) =>
  (simBalance.risk.levels[attacker.overtakeRisk] || simBalance.risk.levels[simBalance.risk.default]).incident *
  (simBalance.defence.styles[defender.defence] || simBalance.defence.styles[simBalance.defence.default]).incident *
  contactFactorOf(attacker, defender);

/** RF-STF-02: the entrant's race skills with the practice confidence on control (driver-attributes.json effects.confidence). */
const confidentSkills = (skills, confidence = 0.6) =>
  skills ? { ...skills, control: (skills.control ?? DRIVER_BALANCE.derivation.scale.centre) + ((confidence ?? 0.6) - 0.6) * DRIVER_BALANCE.effects.confidence.controlPerShare } : undefined;

export const passContactChance = (state, wetness) => REL.contact.passContact * calibrationFor(stateRules(state).year ?? state.year).collision * (1 + wetness);

/**
 * RF-SIM-09 / RF-DEV-08: a touch that did not end the car's race on the spot
 * (incidents.js contactOutcome): a broken suspension retires it at the line, a puncture
 * makes it limp to the pits (it must stop: pitDecision), a broken front wing costs time
 * every lap until it is changed; debris may bring yellows, the VSC or the safety car
 * (debrisResponse). Returns the seconds lost now; the caller adds them where its clock is.
 * `lap` is the car's lap, `raceLap` the race's (the step sim passes both).
 */
export const applyContact = (state, car, outcome, { otherId = null, corner = null, stream, lap = state.lap, raceLap = lap, turnOne = false } = {}) => {
  pushEvent(state, { type: "contact", carId: car.id, otherId, corner, outcome: outcome.kind, ...(turnOne ? { turnOne: true } : {}) }, lap);
  let lost = outcome.loss || 0;
  if (outcome.kind === "suspension") {
    car.retireAtLine = lap;
    car.retireCorner = corner;
  } else if (outcome.kind === "puncture") {
    car.puncture = true;
    lost += outcome.limp * (state.race.baseLap || 90);
  } else if (outcome.kind === "wing") {
    car.damage += outcome.wing;
  }
  if (leavesDebris(outcome) && stream.chance(REL.contact.debris.chance)) debrisResponse(state, corner, car.id, { lap, raceLap, stream });
  return lost;
};

/**
 * RF-SIM-10: debris on the track after a touch - the safety car (from 1993) or the VSC
 * (from 2015) by the era's rules and race-reliability.json contact.debris, otherwise
 * yellows at the corner. Nothing new while a safety car is already out.
 */
export const debrisResponse = (state, corner, carId, { lap = state.lap, raceLap = lap, stream } = {}) => {
  if (state.safetyCar) return;
  const rules = stateRules(state);
  const debris = REL.contact.debris;
  // SIM-5 duracion-neutralizacion: how long it lasts is the marshals' cleanup (safetyCar.js, seed::neutral stream).
  if (raceLap < state.laps - 1 && rules.raceControl.safetyCar && stream.chance(debris.sc)) {
    const sc = deployNeutralisation(state, { virtual: false, corner, rules, lap: raceLap, debris: true });
    pushEvent(state, { type: "sc", debris: true, incident: sc.incident, cleanupSec: sc.cleanupSec }, raceLap);
    return;
  }
  if (raceLap < state.laps - 1 && rules.raceControl.vsc && stream.chance(debris.vsc)) {
    const sc = deployNeutralisation(state, { virtual: true, corner, rules, lap: raceLap, debris: true });
    pushEvent(state, { type: "vsc", debris: true, incident: sc.incident, cleanupSec: sc.cleanupSec }, raceLap);
    return;
  }
  waveYellow(state, corner, carId, lap);
};

/**
 * RF-SIM-09 (quick mode, lap 1): the start and the first corner decided in createRace
 * (state.turnOne, incidents.js turnOnePlan) - each car's launch against the median goes on
 * its first lap, and every car caught in a first-corner touch takes its outcome there.
 */
const applyTurnOne = (state, cars, stream) => {
  const plan = state.turnOne;
  if (!plan) return;
  cars.forEach((car) => {
    if (car.status !== "running") return;
    car.lapTime += plan.launch[car.id] || 0;
    const outcome = plan.outcomes[car.id];
    if (!outcome) return;
    const contact = plan.contacts.find((row) => row.ids.includes(car.id));
    const otherId = contact ? contact.ids.find((id) => id !== car.id) : null;
    if (outcome.kind === "retire") {
      pushEvent(state, { type: "contact", carId: car.id, otherId, corner: plan.corner, outcome: "retire", turnOne: true });
      retire(state, car, "collision", { corner: plan.corner, share: plan.share });
    } else {
      car.lapTime += applyContact(state, car, outcome, { otherId, corner: plan.corner, stream, turnOne: true });
    }
  });
};

/**
 * A car's race is over (RF-SIM-09), and race control answers (RF-SIM-10): a heavy
 * crash may stop the race (red flag, on the race-control stream), an accident brings
 * the safety car or the VSC as the era allows, otherwise yellows at the corner; a
 * failure may bring a VSC. The step simulator passes where it happened (`corner`,
 * `share` of the lap), the car's `lap`, the race's `raceLap` and its own `stream`; the
 * quick mode draws them.
 */
export const retire = (state, car, reason, { lap = state.lap, raceLap = lap, stream = state._stream, corner: at, share } = {}) => {
  car.status = "retired";
  car.retiredLap = lap;
  car.retireReason = reason;
  const rules = stateRules(state);
  const control = BALANCE.raceControl;
  // Where on the lap it ended: first-lap contact happens early, a failure anywhere.
  car.retireShare = share !== undefined ? share : reason === "collision" && lap === 1 ? stream.range(0.02, 0.18) : stream.range(0.08, 0.95);
  const corner = reason === "mechanical" || reason === "fuel" ? null : at !== undefined ? at : spotOn(state, stream, "mistake");
  pushEvent(state, { type: "dnf", carId: car.id, reason, corner, ...(reason === "mechanical" && car.failedComponent ? { component: car.failedComponent } : {}) }, lap);
  const crash = reason !== "mechanical" && reason !== "fuel";
  // A heavy crash that leaves the barriers to repair stops the race (RF-SIM-10). RF-HIS-00: never a fatal one.
  if (crash && !state.pendingRed && (state.redFlags || 0) < control.redFlag.maxPerRace && raceLap < state.laps - 1 && controlStream(state).chance(control.redFlag.crashChance)) {
    state.pendingRed = "crash";
    return;
  }
  // An accident in the safety-car era brings out the safety car most of the time.
  if (crash && rules.raceControl.safetyCar && !state.safetyCar && raceLap < state.laps - 1) {
    // Early safety-car years used it sparingly; modern race control is quicker to call one.
    // SIM-5 duracion-neutralizacion (F1M24-GAMEPLAY §2.11): the car needs the marshals - more often where this circuit
    // has measured more safety cars (pack calendar[].scRate) - stopped on the track (SC) or in the run-off (VSC, from
    // 2015); the cleanup sets how long (safetyCar.js deployNeutralisation, its own seed::neutral stream).
    if (stream.chance(rules.raceControl.scDeployChance * circuitScFactor(state.race))) {
      const virtual = rules.raceControl.vsc && stream.chance(control.vscShare);
      const sc = deployNeutralisation(state, { virtual, reason, share: car.retireShare, corner, rules, lap: raceLap });
      pushEvent(state, { type: virtual ? "vsc" : "sc", incident: sc.incident, cleanupSec: sc.cleanupSec }, raceLap);
      return;
    }
    if (!state.safetyCar) waveYellow(state, corner, car.id, lap);
  } else if (!crash && rules.raceControl.vsc && !state.safetyCar && stream.chance(control.vscOnFailure)) {
    const sc = deployNeutralisation(state, { virtual: true, reason, share: car.retireShare, corner, rules, lap: raceLap });
    pushEvent(state, { type: "vsc", incident: sc.incident, cleanupSec: sc.cleanupSec }, raceLap);
  } else if (crash && !state.safetyCar) {
    waveYellow(state, corner, car.id, lap);
  }
};

/**
 * Does this car stop at the end of the lap, and for what?
 *
 * The plan comes first; then the weather, which overrides any plan; then the
 * opportunistic stop under the safety car that every strategist dreams of. A
 * player's call (`pitRequest`) beats all of it. The step simulator asks at pit entry,
 * with the car's own `lap` and its running `order` (by distance covered).
 */
/**
 * WP11 (RF-SIM-13): an unplanned dry stop (tyres off the cliff, a problem looked at) takes the
 * place of the next planned stop when that one was due within race-eras.json
 * strategy.realStops.consumeWithinLaps: it is the same stop made early, not one more (Monaco 2012
 * had cars stopping on laps 18 and 20). A later planned stop stays.
 */
const unplannedStop = (car, lap, compound) => {
  const next = car.plan.stops.find((stop) => stop >= lap);
  if (next === undefined || next - lap > BALANCE.strategy.realStops.consumeWithinLaps) return { compound, planned: false };
  car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== next) };
  return { compound, planned: true };
};

export const pitDecision = (state, car, wetness, stream, { lap = state.lap, order } = {}) => {
  const remaining = state.laps - lap;
  if (remaining <= 0) return null;
  const rules = stateRules(state);
  const refuel = rules.refuelling;
  const tyreChanges = rules.tyres.changesInRace;

  if (car.pitRequest) {
    const compound = car.pitRequest.compound || nextPlannedCompound(car, rules);
    const stintsLeft = Math.max(1, car.plan.stops.filter((stop) => stop > lap).length + 1);
    const fuel = refuel ? (Number.isFinite(car.pitRequest.fuel) ? Math.min(remaining + 1, car.pitRequest.fuel) : Math.ceil(remaining / stintsLeft)) : 0;
    const planned = car.plan.stops.some((stop) => stop >= lap);
    // RF-CMD-02 (`replace`): the player's stop takes the place of the next planned one, not one more on top of it.
    const next = car.pitRequest.replace ? car.plan.stops.find((stop) => stop >= lap) : undefined;
    if (next !== undefined && next !== lap) {
      const compounds = car.plan.compounds.map((value, position) => (position === car.stint + 1 ? compound : value));
      car.plan = { ...car.plan, stops: car.plan.stops.map((stop) => (stop === next ? lap : stop)).sort((a, b) => a - b), compounds };
    }
    return { compound, planned, fuel, repair: car.pitRequest.frontWing !== false };
  }

  // RF-SIM-09: a puncture is not a strategy question either - the car comes in on this lap.
  if (car.puncture) {
    return { ...unplannedStop(car, lap, isWetTyre(car.compound) ? car.compound : nextPlannedCompound(car, rules)), fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0, repair: true };
  }

  // Out of fuel is not a strategy question.
  if (refuel && car.fuel <= 0) {
    return { compound: isWetTyre(car.compound) ? car.compound : nextPlannedCompound(car, rules), planned: true, fuel: fuelToNextStop(car, lap, state.laps) };
  }

  // Players make their own wet-weather calls; the engineer only advises.
  // Cars at the back have little to lose and gamble early; the leaders wait.
  const gamble = clamp((car.position - 8) / 12, -0.4, 0.6);
  const wanted = tyreForWetness(wetness + (car.isUser ? 0 : gamble * 0.06));
  if (!car.isUser) {
    const reactsNow = stream.chance(clamp(0.45 + car.strategist / 160 + gamble * 0.2, 0.3, 0.98));
    if (wanted && wanted !== car.compound && reactsNow) {
      // Do not change inter for full wets for a passing shower.
      if (!(car.compound === "inter" && wanted === "wet" && wetness < 0.72)) {
        return { compound: wanted, planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
      }
    }
    if (!wanted && isWetTyre(car.compound) && wetness < 0.16 + gamble * 0.08 && reactsNow) {
      return { compound: dryCompoundFor(remaining, rules, car.wearFactor), planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
    }
    if (isWetTyre(car.compound)) return null;
    // RF-SIM-09: a broken front wing costing more than contact.repairAbove s a lap is changed.
    if (car.damage >= REL.contact.repairAbove && remaining > 5) {
      return { ...unplannedStop(car, lap, nextPlannedCompound(car, rules)), fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0, repair: true };
    }
    // A car with a problem comes in to have it looked at.
    if (car.issue > 1.4 && remaining > 6 && stream.chance(0.35)) {
      return { ...unplannedStop(car, lap, nextPlannedCompound(car, rules)), fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0, repair: true };
    }
  } else if (isWetTyre(car.compound) || (wanted && !isWetTyre(car.compound))) {
    // A player on the wrong tyre stays out until they call it.
    if (!car.plan.stops.includes(lap)) return null;
  }

  if (!car.isUser && !isWetTyre(car.compound)) {
    const call = strategyCall(state, car, stream, { lap, order });
    if (call) return call;
  }
  // Read after the strategist: an overcut call moves this lap's stop two laps on (WP11: it used to
  // stop now and again two laps later).
  const plannedStop = car.plan.stops.find((stop) => stop === lap);
  if (plannedStop && !isWetTyre(car.compound)) {
    const lastStint = !car.plan.stops.some((stop) => stop > lap);
    // The last set must reach the flag: a softer planned tyre gives way to one that lasts.
    const planned = nextPlannedCompound(car, rules);
    const compound = tyreChanges && !car.isUser && lastStint && tyreSpec(planned, rules).life < remaining * 0.85 * (car.wearFactor ?? 1) ? dryCompoundFor(remaining, rules, car.wearFactor) : planned;
    return { compound, planned: true, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
  }

  // A cheap stop under the safety car, if one was coming within a few laps.
  if (state.safetyCar && !car.isUser && !refuel) {
    const soon = car.plan.stops.find((stop) => stop > lap && stop - lap <= 9);
    if (soon && stream.chance(clamp(0.35 + car.strategist / 120, 0.3, 0.95))) {
      car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== soon) };
      return { compound: nextPlannedCompound(car, rules), planned: true, fuel: 0 };
    }
  }

  // Tyres off the cliff with a long way to go: an unplanned stop (only where tyres may be changed).
  if (tyreChanges && !car.isUser && !isWetTyre(car.compound) && tyreLifeUsed(car, rules) > 1.15 && remaining > 8) {
    return { ...unplannedStop(car, lap, dryCompoundFor(remaining, rules, car.wearFactor)), fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
  }

  return null;
};

/**
 * The rival pit wall reading the race, as a strategist does lap by lap:
 *
 *   undercut      close behind a car and due to stop soon: stop first and use
 *                 the new tyres while the other is still on old ones
 *   cover         the car just behind has stopped: stop now so it cannot
 *                 undercut
 *   overcut       the car in front has stopped and these tyres still have life:
 *                 stay out in clean air a couple of laps longer
 *   fastest lap   a free stop at the end for soft tyres and the bonus point,
 *                 in the eras that give one for it (2019-2024)
 *
 * The better the strategist, the more often the call is seen and made.
 */
export const strategyCall = (state, car, stream, { lap = state.lap, order: given } = {}) => {
  const remaining = state.laps - lap;
  const rules = stateRules(state);
  if (rules.refuelling || state.safetyCar || !rules.tyres.changesInRace) return null;
  const life = tyreLifeUsed(car, rules);
  const sees = (chance) => stream.chance(clamp(chance * (0.5 + car.strategist / 100), 0, 0.95));
  const order = given || runningOrder(state).filter((other) => other.status === "running");
  const index = order.findIndex((other) => other.id === car.id);
  const ahead = order[index - 1];
  const behind = order[index + 1];
  const nextStop = car.plan.stops.find((stop) => stop >= lap);
  const lane = pitLaneLoss(state) + stationaryTime({ era: rules, crew: car.crew });

  // Overcut: the car ahead has just stopped, we are in clean air on good tyres.
  if (nextStop === lap && ahead && ahead.lastPitLap >= lap - 1 && life < 0.68 && remaining > 8 && sees(0.6)) {
    car.plan = { ...car.plan, stops: car.plan.stops.map((stop) => (stop === lap ? lap + 2 : stop)) };
    pushEvent(state, { type: "call", carId: car.id, call: "overcut" }, lap);
    return null;
  }
  if (!nextStop || remaining <= 6) {
    // Fastest lap: a point for it (2019-2024: inside the top ten), in an era where cars stop for tyres.
    const point = rules.points.fastestLap;
    const window = BALANCE.strategy.fastestLapStopWindow;
    if (point.point > 0 && rules.strategy.maxStops > 0 && remaining <= window && remaining >= 1 && car.position <= 10 && !car.flapStop && car.gapBehind !== null && car.gapBehind > lane + 4 && sees(0.7)) {
      car.flapStop = true;
      return { compound: rules.tyres.compounds[0], planned: false, fuel: 0, call: "fastest" };
    }
    return null;
  }
  const due = nextStop - lap;
  // Cover: the car behind has stopped and could jump us.
  if (behind && behind.lastPitLap >= lap - 1 && car.lastPitLap < lap - 4 && car.gapBehind !== null && car.gapBehind < lane * 0.85 && due <= 5 && life > 0.4 && sees(0.45)) {
    car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== nextStop) };
    return { compound: nextPlannedCompound(car, rules), planned: true, fuel: 0, call: "cover" };
  }
  // Undercut: within reach of the car ahead and due anyway.
  if (ahead && car.gapAhead !== null && car.gapAhead < 1.6 && due >= 1 && due <= 3 && life > 0.55 && ahead.lastPitLap < lap - 3 && ahead.plan?.stops.some((stop) => stop > lap) && sees(0.16)) {
    car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== nextStop) };
    return { compound: nextPlannedCompound(car, rules), planned: true, fuel: 0, call: "undercut" };
  }
  return null;
};

/** The next set of the plan, or another compound while the two-compound rule is still owed. */
export const nextPlannedCompound = (car, eraOrRules) => {
  const rules = rulesFor(eraOrRules);
  const compounds = rules.tyres.compounds;
  const sequence = car.plan.compounds;
  const next = sequence[Math.min(sequence.length - 1, car.stint + 1)];
  // The two-compound rule: the next set must be a new compound until two have been used.
  if (next && (next !== car.compound || rules.tyres.mandatoryDryCompounds < 2 || car.compoundsUsed.length >= 2)) return next;
  return compounds.find((compound) => compound !== car.compound) || next || compounds[0];
};

/** The dry tyre that gets you to the flag from here: the softest one that lasts (its life in laps at `wearFactor`). */
export const dryCompoundFor = (remaining, eraOrRules, wearFactor = 1) => {
  const rules = rulesFor(eraOrRules);
  const options = rules.tyres.compounds;
  const fits = options.filter((compound) => tyreSpec(compound, rules).life >= remaining * 0.9 * wearFactor);
  return fits[0] || options[options.length - 1];
};

/** Laps of fuel to the next planned stop, or to the flag. */
export const fuelToNextStop = (car, lap, laps) => {
  const next = car.plan.stops.find((stop) => stop > lap);
  return Math.max(1, (next || laps) - lap);
};

/**
 * The car in front.
 *
 * Elapsed time says who would be ahead on an empty track; this says who is
 * ahead on a real one. Cars are walked front to back; anyone who has caught the
 * car ahead must pass it, and a failed pass leaves them stuck a few tenths back.
 * The chance of a pass is the circuit, the speed difference, DRS where the era
 * has it (within a second at the detection point, RF-SIM-08), the energy system
 * (KERS/ERS deploy, the 2026 overtake mode), yellow flags, and racecraft.
 */
const resolveTraffic = (state, running, beforeIndex, stream, wetness) => {
  const sc = state.safetyCar;
  const rules = stateRules(state);
  const profile = state.race.profile;
  const baseLap = state.race.baseLap;
  const zones = state.track?.drs ?? 1;
  const drsLap = drsOpen(rules, { lap: state.lap, wetness, zones, restartLap: state.restartLap || 0 });
  const drsBonus = drsBonusFor(rules, zones);
  const yellow = Boolean(state.yellow && state.yellow.lap === state.lap);
  const ordered = [...running].filter((car) => car.status === "running").sort((a, b) => (beforeIndex[a.id] ?? 99) - (beforeIndex[b.id] ?? 99));

  if (sc && !sc.virtual) {
    // Behind the safety car the field bunches up and nobody passes.
    for (let index = 1; index < ordered.length; index += 1) {
      const ahead = ordered[index - 1];
      const car = ordered[index];
      const gap = car.time - ahead.time;
      if (gap < baseLap * 0.6) {
        // WP11 (RF-SIM-10): a car closes on the queue at racing speed at most - its lap can be no
        // quicker than its clean lap (car.expected) - so a long gap takes more than one lap to close.
        const lapStart = car.time - car.lapTime;
        const floor = lapStart + (car.expected ?? baseLap);
        car.time = Math.max(floor, ahead.time + clamp(gap * 0.35, 0.45, 1.1));
      }
    }
    return;
  }

  for (let index = 1; index < ordered.length; index += 1) {
    const ahead = ordered[index - 1];
    const car = ordered[index];
    const gapBefore = (car.time - car.lapTime) - (ahead.time - ahead.lapTime);
    // Lapped traffic waves the leaders through: no fight between different laps.
    if (gapBefore > baseLap * 0.5) continue;
    const minGap = 0.22;
    if (car.time > ahead.time + minGap) continue;

    const teamOrder = car.teamId === ahead.teamId ? state.teamOrders[car.teamId] : null;
    if (sc && sc.virtual) {
      car.time = Math.max(car.time, ahead.time + 0.4);
      continue;
    }
    if (teamOrder === "hold") {
      car.time = ahead.time + stream.range(0.5, 1.2);
      continue;
    }

    // A pass needs real speed, not a lucky lap: the difference in underlying pace
    // (tyres, fuel, battery, the car) decides it, with the circuit and DRS.
    const delta = (ahead.expected ?? ahead.lapTime) - (car.expected ?? car.lapTime);
    // DRS: open on the lap, and this car within the detection gap of the one ahead.
    const drs = drsLap && gapBefore < rules.drs.detectionGap;
    const attack = energyPush(rules, car).attack;
    const defend = energyPush(rules, ahead).defend;
    const passChance = passChanceOf({
      overtaking: profile.overtaking ?? 0.55, delta, drs: drs ? drsBonus : 0, skill: passSkillTerm(car, ahead), style: duelStyleTerm(car, ahead), wetness, attack, defend,
      aheadColdTyre: ahead.tyreTemp < 0.38, yellow,
    });
    if (stream.chance(passChance)) {
      const corner = spotOn(state, stream, "pass");
      // Clean pass: positions swap. A small chance it ends in contact (RF-SIM-09, race-reliability.json contact).
      if (stream.chance(passContactChance(state, wetness) * duelContactFactor(car, ahead))) {
        const victim = stream.chance(0.5) ? ahead : car;
        const outcome = contactOutcome(stream);
        if (outcome.kind === "retire") retire(state, victim, "collision", { corner });
        else victim.time += applyContact(state, victim, outcome, { otherId: victim === car ? ahead.id : car.id, corner, stream });
        // The stewards look at the move: the attacker is the one under investigation (RF-SIM-10).
        collisionInvestigation(state, car, ahead.id);
      } else {
        ahead.time = Math.max(ahead.time, car.time + 0.15);
        pushEvent(state, {
          type: "pass", carId: car.id, otherId: ahead.id, corner, drs: drs && delta < 0.9,
          ...(car.overtakeActive ? { overtakeMode: true } : {}),
        });
      }
      ordered[index - 1] = car;
      ordered[index] = ahead;
    } else {
      car.time = ahead.time + stream.range(0.25, 0.65);
    }
  }

  // Team orders: swap the two cars of a team if they are running together.
  Object.entries(state.teamOrders).forEach(([teamId, order]) => {
    if (order !== "swap") return;
    const pair = ordered.filter((car) => car.teamId === teamId);
    if (pair.length < 2) return;
    const [front, back] = pair[0].time < pair[1].time ? pair : [pair[1], pair[0]];
    if (back.time - front.time < 2.5) {
      front.time = back.time + 0.45;
      pushEvent(state, { type: "swap", carId: back.id, otherId: front.id });
    }
    state.teamOrders[teamId] = "free";
  });
};

/**
 * Blue flags. A car about to be lapped is, on the road, just ahead of the car a
 * lap up on it; it has to move over, and both lose a little doing it.
 */
const blueFlags = (state, running, baseLap) => {
  if (state.safetyCar) return;
  const live = running.filter((car) => car.status === "running");
  live.forEach((slow) => {
    live.forEach((fast) => {
      if (fast === slow || fast.time >= slow.time) return;
      const behind = slow.time - fast.time;
      const laps = Math.round(behind / baseLap);
      if (laps < 1) return;
      const residual = behind - laps * baseLap;
      if (residual > -1.6 && residual < 0.3) {
        slow.time += 0.35;
        fast.time += 0.12;
      }
    });
  });
};

/** What the race engineer tells the player's drivers (RF-CMD-03), after lap `lap`. */
export const radioFor = (state, car, wetness, lap = state.lap) => {
  const rules = stateRules(state);
  const wanted = tyreForWetness(wetness);
  const remaining = state.laps - lap;
  if (wanted && !isWetTyre(car.compound)) pushRadio(state, car, "box-wet", { compound: wanted }, lap);
  else if (wanted === "wet" && car.compound === "inter" && wetness > 0.72) pushRadio(state, car, "box-wet", { compound: "wet" }, lap);
  else if (!wanted && isWetTyre(car.compound) && wetness < 0.16) pushRadio(state, car, "box-dry", {}, lap);
  else if (!isWetTyre(car.compound) && tyreLifeUsed(car, rules) > 1 && remaining > 5) pushRadio(state, car, "cliff", {}, lap);
  if (car.tyreTemp > 0.76) pushRadio(state, car, "hot", {}, lap);
  if (!rules.refuelling && car.fuel < remaining * (MIXES[car.fuelMode]?.burn ?? 1) + 0.15 && remaining > 1) {
    pushRadio(state, car, "fuel", { short: Math.round((remaining - car.fuel) * 10) / 10 }, lap);
  }
  // A battery to run flat is a hybrid's (the KERS budget comes back every lap).
  if (rules.energy.ers && car.battery !== null && car.battery < 10 && (car.ersMode === "deploy" || car.ersMode === "overtake")) pushRadio(state, car, "battery", {}, lap);
  if (car.issue) pushRadio(state, car, "issue", { loss: car.issue }, lap);
  if (state.safetyCar && !state.safetyCar.virtual && car.plan.stops.some((stop) => stop > lap && stop - lap <= 10)) {
    pushRadio(state, car, "sc-window", {}, lap);
  }
  const zones = state.track?.drs ?? 0;
  if (drsOpen(rules, { lap: lap + 1, wetness, zones, restartLap: state.restartLap || 0, gapAhead: car.gapAhead })) pushRadio(state, car, "drs", {}, lap);
  if (rules.energy.overtakeMode && car.battery !== null && car.gapAhead !== null && car.gapAhead < rules.energy.balance.overtakeGap && car.ersMode !== "overtake") {
    pushRadio(state, car, "overtake", {}, lap);
  }
  if (car.penalties?.some((penalty) => !penalty.served && penalty.kind === "pit")) pushRadio(state, car, "penalty", {}, lap);
  const nextStop = car.plan.stops.find((stop) => stop > lap);
  if (nextStop && nextStop - lap === 1 && !isWetTyre(car.compound)) pushRadio(state, car, "box-plan", { compound: nextPlannedCompound(car, rules) }, lap);
};

/**
 * The flag (both modes): the two-compound rule, penalties still owed become time,
 * the final order and gaps.
 */
export const finishRace = (state) => {
  const rules = stateRules(state);
  state.finished = true;
  state.cars.forEach((car) => {
    if (car.status === "running") car.status = "finished";
  });
  // The two-compound rule (from 2007): a dry race finished on one compound is a penalty.
  // The two-compound rule is the Grand Prix's, not the sprint's.
  const mandatory = state.sprint ? 0 : rules.tyres.mandatoryDryCompounds;
  if (mandatory >= 2) {
    const wetRace = state.weather.wetness.some((value) => value >= 0.2);
    state.cars.forEach((car) => {
      if (car.status !== "finished" || wetRace) return;
      const dry = new Set(car.compoundsUsed.filter((compound) => !isWetTyre(compound)));
      if (dry.size < mandatory) {
        car.time += rules.strategy.twoCompoundPenalty;
        car.penalty = rules.strategy.twoCompoundPenalty;
      }
    });
  }
  // Penalties still owed at the flag become time (RF-SIM-10): an unserved
  // drive-through or stop-go, a +5/+10 s not served at a stop, a post-race penalty.
  const unserved = BALANCE.penalties.unserved;
  state.cars.forEach((car) => {
    if (car.status !== "finished" || !car.penalties?.length) return;
    let owed = 0;
    car.penalties.forEach((penalty) => {
      if (penalty.served) return;
      if (penalty.kind === "time" || penalty.kind === "post") owed += penalty.seconds;
      else if (penalty.kind === "pit") owed += unserved[penalty.type] ?? 0;
      penalty.served = true;
      penalty.atFlag = true;
    });
    car.pendingTime = 0;
    if (owed > 0) {
      car.time += owed;
      car.penalty = (car.penalty || 0) + owed;
      pushEvent(state, { type: "penalty-applied", carId: car.id, seconds: owed });
    }
  });
  const order = runningOrder(state);
  const leader = order[0];
  order.forEach((car, index) => {
    car.position = index + 1;
    if (car.status === "finished" && leader) {
      car.gap = car.time - leader.time;
      car.lapsDown = Math.max(0, Math.floor(car.gap / (state.race.baseLap * 1.02)));
    }
  });
  pushEvent(state, { type: "flag", carId: leader?.id });
};

/** Run whatever is left of the race with no one at the pit wall. */
export const runToFinish = (state) => {
  let guard = 0;
  while (!state.finished && guard < 400) {
    stepLap(state);
    guard += 1;
  }
  return state;
};

/** A race state is held in React and in saves without its stream. */
export const classificationOf = (state) =>
  runningOrder(state).map((car, index) => ({
    id: car.id,
    driverId: car.driverId,
    teamId: car.teamId,
    position: index + 1,
    grid: car.grid,
    status: car.status === "finished" ? "finished" : car.retireReason || "retired",
    gap: car.status === "finished" ? car.gap ?? 0 : null,
    lapsDown: car.lapsDown || 0,
    stops: car.stops,
    bestLap: car.bestLap,
    retiredLap: car.retiredLap,
    // RF-SIM-14: the failure group of a mechanical retirement (engine, gearbox, hydraulics, ...).
    ...(car.retireReason === "mechanical" && car.failedComponent ? { component: car.failedComponent } : {}),
    penalty: car.penalty || 0,
    penalties: (car.penalties || []).map((penalty) => ({ type: penalty.type, offence: penalty.offence, lap: penalty.lap, seconds: penalty.seconds })),
    isUser: car.isUser,
  }));
