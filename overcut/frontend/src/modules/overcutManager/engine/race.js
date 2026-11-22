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
 * race the live view would have shown.
 */

import { clamp, createStream } from "../../overcutTrayectoria/engine/rng";
import { fieldMomentsOf, paceOf } from "../../overcutTrayectoria/engine/race";
import { WEATHER, drawWeather } from "../../overcutTrayectoria/engine/weather";
import { circuitFor } from "./venue";

// ------------------------------------------------------------------ tyres

/** The compounds a team could choose between, by era. */
export const compoundsFor = (year) => {
  if (year < 1982) return ["dry"];
  if (year < 2007) return ["soft", "hard"];
  return ["soft", "medium", "hard"];
};

/** Wear in seconds per lap of age, and how many laps before the cliff. */
const DRY_TYRES = {
  dry: { offset: 0, wear: 0.012, life: 400 },
  soft: { offset: -0.75, wear: 0.075, life: 17 },
  medium: { offset: -0.38, wear: 0.05, life: 27 },
  hard: { offset: 0, wear: 0.032, life: 40 },
};

/** Era softening: older dry tyres wore less but the difference between them was smaller too. */
const tyreSpec = (compound, year) => {
  const spec = DRY_TYRES[compound] || DRY_TYRES.hard;
  if (year >= 2007 || compound === "dry") return spec;
  // 1982-2006: two compounds, closer together, and longer lives.
  return { offset: spec.offset * 0.7, wear: spec.wear * 0.75, life: Math.round(spec.life * 1.35) };
};

export const isWetTyre = (compound) => compound === "inter" || compound === "wet";

/**
 * Seconds a tyre costs on a track that is `wetness` wet (0 dry, 1 flooded).
 * Each compound has a window; outside it the price climbs steeply - that is what
 * makes calling the switch at the right lap the decision of a wet race.
 */
export const tyreTime = ({ compound, age, wetness, year, wearFactor = 1 }) => {
  if (compound === "inter") {
    const window = Math.abs(wetness - 0.42) * 6.5;
    const overheating = wetness < 0.15 ? 1.3 + age * 0.09 : 0;
    return 0.9 + window + overheating + age * 0.02;
  }
  if (compound === "wet") {
    const tooDry = wetness < 0.55 ? (0.55 - wetness) * 13 + (wetness < 0.25 ? age * 0.12 : 0) : 0;
    return 1.6 + tooDry + age * 0.015;
  }
  const spec = tyreSpec(compound, year);
  const wear = spec.wear * wearFactor * age;
  const cliff = age > spec.life ? (age - spec.life) * 0.28 * wearFactor : 0;
  const onWet = wetness > 0.18 ? (wetness - 0.18) * 32 : 0;
  return spec.offset + wear + cliff + onWet;
};

/** Which tyre a sensible team wants for this much water. */
export const tyreForWetness = (wetness) => (wetness >= 0.62 ? "wet" : wetness >= 0.24 ? "inter" : null);

// ------------------------------------------------------------- the weekend

/** How much each grid slot holds you up at the start, in seconds. */
const START_SPACING = 0.32;

const MODES = {
  save: { time: 0.38, wear: 0.72, risk: 0.7, mistake: 0.6 },
  normal: { time: 0, wear: 1, risk: 1, mistake: 1 },
  push: { time: -0.3, wear: 1.38, risk: 1.25, mistake: 1.6 },
};

export const MODE_KEYS = Object.keys(MODES);

const REFERENCE_ATTRITION = 1.15;

/** Time lost in the pit lane at racing speed, and stationary. */
const pitLaneLoss = (baseLap) => clamp(baseLap * 0.21, 14, 34);

export const stationaryTime = ({ year, refuel = 0, crew = 60 }) => {
  const skill = 1.3 - crew / 200;
  if (year < 1982) return 24 * skill;
  if (year < 1994) return 8.5 * skill;
  if (year < 2010) return (6 + refuel * 0.11) * skill;
  return 2.5 * skill + 0.2;
};

export const refuellingEra = (year) => year >= 1994 && year <= 2009;

/** Fuel weight in seconds per lap of fuel on board. */
const FUEL_PER_LAP = 0.032;

// ------------------------------------------------------------- strategy

/**
 * Total tyre-and-fuel cost of a plan, in seconds, against a perfect car - the
 * number the strategist compares candidate plans on.
 */
const planCost = ({ plan, laps, year, baseLap, wearFactor, crew = 60 }) => {
  const stints = stintLengths(plan, laps);
  let cost = 0;
  stints.forEach((length, index) => {
    const spec = tyreSpec(plan.compounds[index], year);
    cost += spec.offset * length;
    cost += spec.wear * wearFactor * (length * (length - 1)) / 2;
    if (length > spec.life) {
      const over = length - spec.life;
      cost += 0.28 * wearFactor * (over * (over + 1)) / 2;
    }
    if (refuellingEra(year)) cost += FUEL_PER_LAP * (length * (length + 1)) / 2;
  });
  const stops = plan.stops.length;
  // From 2007 a dry race on one compound costs a penalty; the plan pays it up front.
  if (year >= 2007 && new Set(plan.compounds).size < 2) cost += 30;
  if (refuellingEra(year) && stops === 0) cost += 200;
  const refuel = refuellingEra(year) ? laps / Math.max(1, stops + 1) : 0;
  cost += stops * (pitLaneLoss(baseLap) + stationaryTime({ year, refuel, crew }));
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
const candidatePlans = (year, laps) => {
  const compounds = compoundsFor(year);
  const minStops = refuellingEra(year) ? 1 : 0;
  const maxStops = year < 1982 ? 0 : 3;
  const plans = [];
  for (let stops = minStops; stops <= maxStops; stops += 1) {
    const sequences = [[]];
    for (let stint = 0; stint <= stops; stint += 1) {
      const next = [];
      sequences.forEach((sequence) => compounds.forEach((compound) => next.push([...sequence, compound])));
      sequences.splice(0, sequences.length, ...next);
    }
    sequences
      .filter((sequence) => year < 2007 || new Set(sequence).size >= 2)
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
export const suggestPlan = ({ year, laps, baseLap, profile, crew = 60 }) => {
  const wearFactor = wearFactorFor(profile);
  const ranked = candidatePlans(year, laps)
    .map((plan) => ({ plan, cost: planCost({ plan, laps, year, baseLap, wearFactor, crew }) }))
    .sort((a, b) => a.cost - b.cost);
  return ranked[0] ? { ...ranked[0].plan, cost: ranked[0].cost } : { stops: [], compounds: [compoundsFor(year)[0]], cost: 0 };
};

/** The cost of any plan the player builds, for the "+4.2 s against the best" read-out. */
export const evaluatePlan = ({ plan, year, laps, baseLap, profile, crew }) =>
  planCost({ plan, laps, year, baseLap, wearFactor: wearFactorFor(profile), crew });

// ------------------------------------------------------------- weather

/**
 * The whole afternoon's weather, decided before the start.
 *
 * Trayectoria draws one condition per race. A pit wall needs a timeline: a dry
 * start with a shower at two thirds distance is the race where strategy is
 * made, so mixed races get a wet spell placed somewhere inside the race, and
 * wet races dry out sometimes.
 */
export const weatherTimeline = ({ profile, era, laps, stream }) => {
  const kind = drawWeather({ profile, era, stream });
  const wetness = new Array(laps + 1).fill(0);
  if (kind === WEATHER.DRY) return { kind, wetness, forecast: forecastFor(profile, kind, stream) };

  if (kind === WEATHER.WET) {
    const start = stream.range(0.6, 0.9);
    const dries = stream.chance(0.35);
    const dryFrom = dries ? Math.round(laps * stream.range(0.5, 0.85)) : laps + 1;
    for (let lap = 0; lap <= laps; lap += 1) {
      const drying = lap > dryFrom ? (lap - dryFrom) * 0.045 : 0;
      wetness[lap] = clamp(start - drying + stream.normal(0, 0.02), 0, 1);
    }
    return { kind, wetness, forecast: forecastFor(profile, kind, stream) };
  }

  // Mixed: a shower that arrives, peaks and leaves.
  const startsWet = stream.chance(0.35);
  const arrive = startsWet ? 0 : Math.round(laps * stream.range(0.2, 0.7));
  const length = Math.round(laps * stream.range(0.15, 0.4));
  const peak = stream.range(0.35, 0.8);
  for (let lap = 0; lap <= laps; lap += 1) {
    const into = lap - arrive;
    let value = 0;
    if (into >= 0 && into <= length) {
      const shape = Math.sin((Math.PI * (into + 1)) / (length + 2));
      value = peak * clamp(shape * 1.4, 0, 1);
    } else if (into > length) {
      value = Math.max(0, peak * 0.4 - (into - length) * 0.06);
    }
    wetness[lap] = clamp(value + stream.normal(0, 0.015), 0, 1);
  }
  return { kind, wetness, forecast: forecastFor(profile, kind, stream) };
};

/** What the weather service says on Friday: right more often than not. */
const forecastFor = (profile, kind, stream) => {
  const base = (profile.rain ?? 0.15) * 100;
  const truth = kind === WEATHER.DRY ? 0 : kind === WEATHER.MIXED ? 55 : 85;
  return Math.round(clamp(truth * 0.7 + base * 0.3 + stream.normal(0, 9), 0, 98));
};

// ------------------------------------------------------------- qualifying

/**
 * Saturday. One flying lap per session, the car's pace plus a qualifying skill
 * and a mistake term that the player's risk choice trades against speed.
 */
export const runQualifying = ({ entrants, race, era, year, wetness = 0, practice = {}, risk = {}, stream }) => {
  const moments = fieldMomentsOf(entrants);
  const weather = wetness >= 0.55 ? WEATHER.WET : wetness >= 0.2 ? WEATHER.MIXED : WEATHER.DRY;
  const spp = race.baseLap * 0.0012;
  const sessions = year >= 2006 ? knockoutSplit(entrants.length) : null;

  const lapOf = (entrant) => {
    const pace = paceOf({ entrant, race, era, seasonProgress: 0.5, weather, moments });
    const skill = (((entrant.qualifying ?? 50) - 50) / 20) * era.fieldSigma * 0.32;
    const prep = practice[entrant.id] || {};
    const style = risk[entrant.id] || "normal";
    const styleGain = style === "push" ? -0.14 : style === "safe" ? 0.12 : 0;
    const mistakeChance = (style === "push" ? 0.09 : style === "safe" ? 0.02 : 0.045) * (1 + wetness);
    const mistake = stream.chance(mistakeChance) ? stream.range(0.6, 2.4) : 0;
    const noise = stream.normal(0, era.paceVolatility * 0.042 * (1 + wetness));
    return (
      race.baseLap * (0.985 + 0.1 * wetness) -
      (pace + skill) * spp +
      (prep.setup ?? 0) +
      (prep.quali ?? 0) +
      styleGain +
      mistake +
      noise
    );
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
const knockoutSplit = (size) => {
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
const MIXES = {
  lean: { time: 0.24, burn: 0.93 },
  standard: { time: 0, burn: 1 },
  rich: { time: -0.18, burn: 1.07 },
};

export const MIX_KEYS = Object.keys(MIXES);

/** Laps of fuel over the race distance a car starts with, outside the refuelling years. */
const FUEL_MARGIN = 1.2;

/** Energy recovery: KERS in 2009 and 2011-13, the full hybrid ERS from 2014. */
export const energyEra = (year) => (year >= 2014 ? "ers" : year === 2009 || (year >= 2011 && year <= 2013) ? "kers" : null);

/** Battery strategies, as an F1 Manager pit wall sets them: time against charge per lap. */
const ERS_MODES = {
  harvest: { time: 0.3, charge: 26 },
  balanced: { time: 0, charge: 3 },
  deploy: { time: -0.34, charge: -30 },
};

export const ERS_KEYS = Object.keys(ERS_MODES);

/**
 * Seconds a following car loses per lap in the wake of the one ahead, for each
 * second of gap under one. Small before wings, worst in the outwash years,
 * eased again by the 2022 ground-effect cars.
 */
const dirtyAirFor = (year) => (year < 1968 ? 0.12 : year < 1977 ? 0.22 : year < 2022 ? 0.42 : 0.24);

/** Tyre blankets, from the mid-1990s, send a car out on a warmer tyre. */
const outLapTemp = (year) => (year >= 1995 ? 0.36 : 0.22);

/** Where a tyre's temperature settles for each pace: 0.45-0.7 is the working window. */
const TEMP_TARGET = { save: 0.46, normal: 0.56, push: 0.68 };

/** Share of the tyre's life used, 0..1+ (past 1 the tyre is on the cliff). */
export const tyreLifeUsed = (car, year) => {
  if (isWetTyre(car.compound)) return clamp(car.tyreAge / 45, 0, 1.2);
  const spec = tyreSpec(car.compound, year);
  return car.tyreWear / spec.life;
};

/**
 * Lay out a Grand Prix ready to run.
 *
 * `entrants` are the cars in grid order; `plans` maps an entrant id to its
 * strategy; `practice` carries the Friday work (setup, long-run tyre feel).
 */
export const createRace = ({ race, era, year, entrants, grid, plans = {}, practice = {}, seed, crews = {}, strategists = {} }) => {
  const stream = createStream(`${seed}::race`);
  const laps = Math.max(5, race.laps || 60);
  const timeline = weatherTimeline({ profile: race.profile, era, laps, stream });
  const moments = fieldMomentsOf(entrants);
  const circuit = circuitFor(race, year);
  const refuel = refuellingEra(year);
  const energy = energyEra(year);
  // Track temperature: dry venues bake, wet days are cool.
  const trackTemp = Math.round(clamp(22 + (1 - (race.profile.rain ?? 0.15)) * 18 + stream.normal(0, 6) - timeline.wetness[0] * 12, 12, 55));
  const fuelStart = laps + FUEL_MARGIN;

  const paceFor = (entrant) => ({
    dry: paceOf({ entrant, race, era, seasonProgress: 0.5, weather: WEATHER.DRY, moments }),
    mixed: paceOf({ entrant, race, era, seasonProgress: 0.5, weather: WEATHER.MIXED, moments }),
    wet: paceOf({ entrant, race, era, seasonProgress: 0.5, weather: WEATHER.WET, moments }),
  });

  const order = grid && grid.length ? grid : entrants.map((entrant) => entrant.id);
  const byId = Object.fromEntries(entrants.map((entrant) => [entrant.id, entrant]));
  const startWet = timeline.wetness[0];
  // Garages along the pit lane in entry order: where each team's cars stop.
  const teamOrder = [...new Set(entrants.map((entrant) => entrant.teamId))];
  const boxSlot = (teamId) => teamOrder.indexOf(teamId) / Math.max(1, teamOrder.length - 1);

  const cars = order
    .filter((id) => byId[id])
    .map((id, index) => {
      const entrant = byId[id];
      const plan = normalisePlan(plans[id] || suggestPlan({ year, laps, baseLap: race.baseLap, profile: race.profile, crew: crews[entrant.teamId] }), laps, year);
      const wetStart = tyreForWetness(startWet);
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
        battery: energy ? 100 : null,
        ersMode: energy ? "balanced" : null,
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
        wearFactor: wearFactorFor(race.profile) * (practice[id]?.wear ?? 1) * (1 + (practice[id]?.traction ?? 0) * 0.35),
        crew: crews[entrant.teamId] ?? 60,
        strategist: strategists[entrant.teamId] ?? 55,
        lapsDown: 0,
        lastLapRaced: 0,
        damage: 0,
        issue: 0,
        gapAhead: null,
        gapBehind: null,
        lastPitLap: 0,
        history: [],
      };
    });

  return {
    race: { name: race.name, round: race.round, country: race.country, laps, baseLap: race.baseLap, profile: race.profile, circuit: race.circuit || null },
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
    evolution: 0,
    track: {
      ref: circuit.ref,
      km: circuit.km,
      corners: circuit.corners.map((corner) => ({ number: corner.number, name: corner.name, kind: corner.kind })),
      spots: circuit.brakingZones.map((zone) => ({ corner: zone.corner, metres: zone.metres })),
      drs: circuit.drsZones.length,
    },
    safetyCar: null,
    teamOrders: {},
    events: [],
    radio: [],
    fastestLap: null,
    finished: false,
    seed,
    streamState: 0,
    _stream: stream,
  };
};

const normalisePlan = (plan, laps, year) => {
  const compounds = compoundsFor(year);
  const stops = (plan?.stops || []).filter((lap) => lap > 0 && lap < laps).sort((a, b) => a - b);
  const sequence = (plan?.compounds || []).filter((compound) => compounds.includes(compound));
  while (sequence.length < stops.length + 1) sequence.push(sequence[sequence.length - 1] || compounds[0]);
  return { stops, compounds: sequence.slice(0, stops.length + 1) };
};

/** The cars in race order: most laps first, then least elapsed time. */
export const runningOrder = (state) =>
  [...state.cars].sort((a, b) => {
    const running = (car) => (car.status === "running" || car.status === "finished" ? 1 : 0);
    if (running(a) !== running(b)) return running(b) - running(a);
    if (running(a) === 0) return (b.retiredLap ?? 0) - (a.retiredLap ?? 0);
    return a.time - b.time;
  });

const weatherClass = (wetness) => (wetness >= 0.55 ? WEATHER.WET : wetness >= 0.2 ? WEATHER.MIXED : WEATHER.DRY);

const pushEvent = (state, event) => {
  state.events.push({ lap: state.lap, ...event });
};

/** Laps before the engineer repeats the same message to the same driver. */
const RADIO_COOLDOWN = { drs: 15, hot: 8, fuel: 6, battery: 6, issue: 12, cliff: 6 };

const pushRadio = (state, car, kind, extra = {}) => {
  const last = state.radio.filter((message) => message.carId === car.id && message.kind === kind).pop();
  if (last && state.lap - last.lap < (RADIO_COOLDOWN[kind] ?? 4)) return;
  state.radio.push({ lap: state.lap, carId: car.id, kind, ...extra });
};

/** A corner on this circuit where a move or a mistake happens: the big stops after long straights first. */
const spotOn = (state, stream, kind = "pass") => {
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

export const setErs = (state, carId, mode) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (car && car.battery !== null && ERS_MODES[mode]) car.ersMode = mode;
  return state;
};

export const requestPit = (state, carId, compound) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (car && car.status === "running") car.pitRequest = { compound, lap: state.lap + 1 };
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
 * battery by who is in front.
 */
const rivalCalls = (state, car) => {
  // Called at the start of a lap: the lap about to be run still counts.
  const remaining = state.laps - state.lap + 1;
  const life = tyreLifeUsed(car, state.year);
  const attacking = car.gapAhead !== null && car.gapAhead < 1.2;
  const defending = car.gapBehind !== null && car.gapBehind < 1;
  const lonely = (car.gapAhead === null || car.gapAhead > 3) && (car.gapBehind === null || car.gapBehind > 4);
  // How far the tyres must still go: to the next stop, or the flag.
  const nextStop = car.plan.stops.find((stop) => stop >= state.lap);
  const stintLeft = (nextStop ?? state.laps) - state.lap + 1;
  const spare = 1 - life - stintLeft / Math.max(1, tyreSpec(car.compound, state.year).life);
  if (car.tyreTemp > 0.74 || life > 0.92) car.mode = "save";
  else if (car.outLap) car.mode = "push";
  else if ((attacking || defending) && life < 0.8 && remaining > 1) car.mode = spare > -0.05 ? "push" : "normal";
  else if (lonely && remaining > 4 && spare < 0.1) car.mode = "save";
  else car.mode = "normal";
  car.outLap = false;
  if (!refuellingEra(state.year)) {
    const need = remaining + 0.6;
    car.fuelMode = car.fuel < need ? "lean" : remaining < 15 && car.fuel > need * 1.07 + 0.3 ? "rich" : "standard";
  }
  if (car.battery !== null) {
    const fight = (car.gapAhead !== null && car.gapAhead < 1) || (car.gapBehind !== null && car.gapBehind < 0.8);
    car.ersMode = car.battery < 22 ? "harvest" : fight && car.battery > 40 ? "deploy" : remaining <= 2 && car.battery > 15 ? "deploy" : "balanced";
  }
};

// ----------------------------------------------------------------- a lap

/**
 * Run one lap for the whole field. Returns the events it produced, which the
 * live view turns into commentary.
 */
export const stepLap = (state) => {
  if (state.finished) return [];
  const stream = state._stream || createStream(`${state.seed}::race`);
  state._stream = stream;
  const firstEvent = state.events.length;
  state.lap += 1;
  const lap = state.lap;
  const wetness = state.weather.wetness[Math.min(lap, state.laps)] ?? 0;
  const previousWetness = state.weather.wetness[Math.max(0, lap - 1)] ?? 0;
  const climate = weatherClass(wetness);
  const { year } = state;
  const baseLap = state.race.baseLap;
  const spp = baseLap * 0.0012;
  const attrition = (state.race.profile.attrition ?? 1) / REFERENCE_ATTRITION;
  const wetRisk = wetness >= 0.55 ? 1.28 : wetness >= 0.2 ? 1.12 : 1;
  const refuel = refuellingEra(year);
  // The track: the sun works on it through the afternoon, cloud and rain cool it.
  if (state.trackTempBase !== undefined) {
    const drift = Math.sin((lap / state.laps) * Math.PI) * 3 - (lap / state.laps) * 2;
    const target = state.trackTempBase + drift - wetness * 16;
    state.trackTemp = Math.round((state.trackTemp + (target - state.trackTemp) * (wetness > previousWetness ? 0.35 : 0.12)) * 10) / 10;
    state.trackTemps.push(state.trackTemp);
  }
  const trackTemp = state.trackTemp ?? 30;
  const fuelStart = state.fuelStart ?? state.laps + FUEL_MARGIN;

  // Rubber goes down through a dry race and the track quickens; rain washes it off.
  state.evolution = wetness > 0.3 ? 0 : Math.min(1, (state.evolution || 0) + 1 / Math.max(10, state.laps * 0.55));
  const evolution = -0.55 * state.evolution;

  if (weatherClass(previousWetness) !== climate && lap > 1) {
    pushEvent(state, { type: wetness > previousWetness ? "rain" : "drying", wetness });
  }

  const sc = state.safetyCar;
  const before = runningOrder(state).filter((car) => car.status === "running");
  const beforeIndex = Object.fromEntries(before.map((car, index) => [car.id, index]));
  const lapStart = Object.fromEntries(before.map((car) => [car.id, car.time]));
  const leaderBefore = before[0];

  before.forEach((car) => {
    if (!car.isUser) rivalCalls(state, car);
  });

  // ---- lap times
  before.forEach((car) => {
    const mode = MODES[car.mode] || MODES.normal;
    const mix = MIXES[car.fuelMode] || MIXES.standard;
    const pace = car.pace[climate] ?? car.pace.dry;

    // Tyres: their heat at the start of the lap decides how they grip and wear.
    const overheat = Math.max(0, car.tyreTemp - 0.72);
    const cold = Math.max(0, 0.4 - car.tyreTemp);
    const dirty = car.gapAhead !== null && car.gapAhead < 1 && lap > 1 && !sc ? 1 - car.gapAhead : 0;
    const wing = car.wing ?? 0;
    const wearRate = car.wearFactor * mode.wear * (1 + overheat * 2.2 + dirty * 0.18 + Math.max(0, -wing) * 0.6) * (1 + (trackTemp - 30) * 0.008);
    car.tyreWear += wearRate * (sc ? 0.35 : 1);
    const tyre = isWetTyre(car.compound)
      ? tyreTime({ compound: car.compound, age: car.tyreAge, wetness, year })
      : tyreTime({ compound: car.compound, age: car.tyreWear, wetness, year, wearFactor: 1 });

    // Fuel weight: in the refuelling years the stint's load, otherwise the race's
    // load measured against the half-tank the reference lap was run on.
    const fuel = refuel ? car.fuel * FUEL_PER_LAP : (car.fuel - fuelStart / 2) * FUEL_PER_LAP;

    // The battery.
    let energyTime = 0;
    if (car.battery !== null) {
      const ers = ERS_MODES[car.ersMode] || ERS_MODES.balanced;
      const kers = state.energy === "kers";
      let charge = ers.charge * (kers ? 1.2 : 1);
      let gain = ers.time * (kers ? 0.45 : 1);
      if (charge < 0 && car.battery + charge < 0) {
        gain *= car.battery / -charge;
        charge = -car.battery;
      }
      car.battery = clamp(car.battery + charge, 0, 100);
      energyTime = gain;
    }

    const thermal = cold * 3.2 + overheat * 2.5;
    const wake = dirty * dirtyAirFor(year);
    const volatility = baseLap * 0.0036 * (1 + (55 - car.consistency) * 0.01) * (1 + wetness * 0.6);
    // What the car would do with no scatter: the speed a following driver can actually use to pass.
    const expected =
      baseLap * (1 + 0.11 * wetness) - pace * spp + tyre + fuel + mode.time + mix.time + energyTime + thermal + evolution + car.setup + car.damage + car.issue -
      wing * wetness * baseLap * 0.012;
    car.expected = expected;
    let time = expected + wake + stream.normal(0, volatility);

    // The start: a launch is a skill and the first lap is a scrum - the further
    // back, the more of it you are stuck in, so the field strings out.
    if (lap === 1) time += stream.normal(0, 0.55) - ((car.racecraft - 50) / 20) * 0.25 + 1.5 + (beforeIndex[car.id] ?? 0) * 0.22;

    // A mistake: a lock-up, a trip wide, a spin - at a corner of this circuit.
    const mismatch = !isWetTyre(car.compound) && wetness > 0.3 ? 2.5 : car.compound === "wet" && wetness < 0.3 ? 0.6 : 0;
    const mistakeChance = 0.006 * (1 + (55 - car.consistency) * 0.03) * mode.mistake * (1 + mismatch + wetness * (1 - wing * 2) + cold * 2);
    car.pendingMistake = stream.chance(clamp(mistakeChance, 0.001, 0.2)) ? stream.range(1.2, 5) : 0;
    time += car.pendingMistake;
    if (car.pendingMistake) {
      const kind = car.pendingMistake > 3.4 ? "spin" : car.pendingMistake > 2.2 ? "wide" : "lockup";
      pushEvent(state, { type: "mistake", carId: car.id, kind, corner: spotOn(state, stream, "mistake"), loss: Math.round(car.pendingMistake * 10) / 10 });
      if (kind === "lockup") car.tyreWear += 0.8;
    }

    if (sc) time = Math.max(time, baseLap * (sc.virtual ? 1.36 : 1.42));

    car.lapTime = time;
    car.tyreAge += 1;
    if (refuel) car.fuel = Math.max(0, car.fuel - 1);
    else car.fuel -= mix.burn * (car.mode === "push" ? 1.02 : car.mode === "save" ? 0.97 : 1) * (sc ? 0.62 : 1);

    // Temperature drifts toward what the driving asks of it.
    const target = sc ? 0.3 : TEMP_TARGET[car.mode] + dirty * 0.1 + (trackTemp - 30) / 220 - wetness * 0.12;
    car.tyreTemp = clamp(car.tyreTemp + (target - car.tyreTemp) * 0.55, 0.1, 1);
  });

  // ---- failures, accidents, problems and empty tanks
  before.forEach((car) => {
    const mode = MODES[car.mode] || MODES.normal;
    const raceRisk = clamp((1 - car.reliability) * attrition * wetRisk, 0.01, 0.86);
    const perLap = 1 - Math.pow(1 - raceRisk, 1 / state.laps);
    const mismatch = !isWetTyre(car.compound) && wetness > 0.3 ? 4 : 1;
    if (stream.chance(perLap * mode.risk * (sc ? 0.4 : 1) * (car.issue ? 1.35 : 1))) {
      const incidentShare = clamp(0.24 * wetRisk * (1 + (55 - car.consistency) * 0.013) * mismatch, 0.06, 0.8);
      const accident = stream.chance(incidentShare);
      const reason = accident ? (lap === 1 && stream.chance(0.5) ? "collision" : "accident") : "mechanical";
      retire(state, car, reason);
      return;
    }
    if (car.pendingMistake > 3.8 && stream.chance(0.18 * mismatch)) {
      retire(state, car, "accident");
      return;
    }
    // A problem that does not stop the car but slows it: a misfire, a gearbox stuck in a gear.
    if (!car.issue && stream.chance(perLap * 0.22)) {
      car.issue = Math.round(stream.range(0.5, 2.2) * 10) / 10;
      pushEvent(state, { type: "issue", carId: car.id, loss: car.issue });
    }
    if (!refuel && car.fuel < 0) retire(state, car, "fuel");
  });

  const running = before.filter((car) => car.status === "running");

  // ---- pit stops at the end of the lap
  const stationaryByTeam = {};
  running.forEach((car) => {
    const decision = pitDecision(state, car, wetness, stream);
    if (!decision) return;
    const laneLoss = pitLaneLoss(baseLap) * (sc ? (sc.virtual ? 0.62 : 0.5) : 1);
    const refuelLoad = refuel ? decision.fuel : 0;
    let stationary = stationaryTime({ year, refuel: refuelLoad, crew: car.crew });
    const slow = stream.chance(0.04 * (1.4 - car.crew / 100)) ? stream.range(2.5, 8) : 0;
    stationary += slow;
    // Double stack: the second car of a team waits for the first to leave the box.
    const queue = stationaryByTeam[car.teamId] !== undefined ? stationaryByTeam[car.teamId] + 0.8 : 0;
    stationaryByTeam[car.teamId] = stationary;
    car.lapTime += laneLoss + stationary + queue;
    car.pit = { lane: laneLoss, stationary: stationary + queue };
    car.compound = decision.compound;
    if (!car.compoundsUsed.includes(decision.compound)) car.compoundsUsed.push(decision.compound);
    car.tyreAge = 0;
    car.tyreWear = 0;
    car.tyreTemp = outLapTemp(year);
    car.stops += 1;
    car.lastPitLap = lap;
    car.outLap = true;
    car.stint += decision.planned ? 1 : 0;
    if (decision.call) pushEvent(state, { type: "call", carId: car.id, call: decision.call });
    if (decision.repair) {
      car.damage = 0;
      car.issue = car.issue > 1.2 ? car.issue * 0.5 : 0;
    }
    if (refuel) car.fuel = decision.fuel;
    car.pitRequest = null;
    pushEvent(state, { type: "pit", carId: car.id, compound: decision.compound, stationary: Math.round((stationary + queue) * 10) / 10, slow: slow > 0, stacked: queue > 0 });
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

  // ---- safety car bookkeeping
  if (sc) {
    sc.laps -= 1;
    if (sc.laps <= 0) {
      state.safetyCar = null;
      pushEvent(state, { type: "sc-in", virtual: sc.virtual });
    }
  }

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
      car.history.push({ lap, start: lapStart[car.id], end: car.time, pit: car.pit || null, compound: car.compound });
    } else if (car.retiredLap === lap) {
      const share = car.retireShare ?? 0.5;
      car.history.push({ lap, start: lapStart[car.id], end: lapStart[car.id] + (car.lapTime || baseLap) * share, retired: true, share });
    }
    car.pit = null;
  });

  if (lap >= state.laps || !leader) finishRace(state);

  return state.events.slice(firstEvent);
};

const retire = (state, car, reason) => {
  car.status = "retired";
  car.retiredLap = state.lap;
  car.retireReason = reason;
  const stream = state._stream;
  // Where on the lap it ended: first-lap contact happens early, a failure anywhere.
  car.retireShare = reason === "collision" && state.lap === 1 ? stream.range(0.02, 0.18) : stream.range(0.08, 0.95);
  pushEvent(state, { type: "dnf", carId: car.id, reason, corner: reason === "mechanical" || reason === "fuel" ? null : spotOn(state, stream, "mistake") });
  // An accident in the safety-car era brings out the safety car most of the time.
  if (reason !== "mechanical" && reason !== "fuel" && state.era.features.safetyCar && !state.safetyCar && state.lap < state.laps - 1) {
    // Early safety-car years used it sparingly; modern race control is quicker to call one.
    if (stream.chance(state.year < 2000 ? 0.3 : 0.45)) {
      const virtual = state.era.features.virtualSafetyCar && stream.chance(0.38);
      state.safetyCar = { laps: virtual ? stream.int(1, 3) : stream.int(3, 5), virtual };
      pushEvent(state, { type: virtual ? "vsc" : "sc" });
    }
  } else if ((reason === "mechanical" || reason === "fuel") && state.era.features.virtualSafetyCar && !state.safetyCar && stream.chance(0.1)) {
    state.safetyCar = { laps: 1, virtual: true };
    pushEvent(state, { type: "vsc" });
  }
};

/**
 * Does this car stop at the end of the lap, and for what?
 *
 * The plan comes first; then the weather, which overrides any plan; then the
 * opportunistic stop under the safety car that every strategist dreams of. A
 * player's call (`pitRequest`) beats all of it.
 */
const pitDecision = (state, car, wetness, stream) => {
  const lap = state.lap;
  const remaining = state.laps - lap;
  if (remaining <= 0) return null;
  const year = state.year;
  const refuel = refuellingEra(year);

  if (car.pitRequest) {
    const compound = car.pitRequest.compound || nextPlannedCompound(car, year);
    const stintsLeft = Math.max(1, car.plan.stops.filter((stop) => stop > lap).length + 1);
    return { compound, planned: car.plan.stops.some((stop) => stop >= lap), fuel: refuel ? Math.ceil(remaining / stintsLeft) : 0, repair: true };
  }

  // Out of fuel is not a strategy question.
  if (refuel && car.fuel <= 0) {
    return { compound: isWetTyre(car.compound) ? car.compound : nextPlannedCompound(car, year), planned: true, fuel: fuelToNextStop(car, lap, state.laps) };
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
      return { compound: dryCompoundFor(remaining, year), planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
    }
    if (isWetTyre(car.compound)) return null;
    // A car with a problem comes in to have it looked at.
    if (car.issue > 1.4 && remaining > 6 && stream.chance(0.35)) {
      return { compound: nextPlannedCompound(car, year), planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0, repair: true };
    }
  } else if (isWetTyre(car.compound) || (wanted && !isWetTyre(car.compound))) {
    // A player on the wrong tyre stays out until they call it.
    if (!car.plan.stops.includes(lap)) return null;
  }

  const plannedStop = car.plan.stops.find((stop) => stop === lap);
  if (!car.isUser && !isWetTyre(car.compound)) {
    const call = strategyCall(state, car, stream);
    if (call) return call;
  }
  if (plannedStop && !isWetTyre(car.compound)) {
    const lastStint = !car.plan.stops.some((stop) => stop > lap);
    // The last set must reach the flag: a softer planned tyre gives way to one that lasts.
    const planned = nextPlannedCompound(car, year);
    const compound = !car.isUser && lastStint && tyreSpec(planned, year).life < remaining * 0.85 ? dryCompoundFor(remaining, year) : planned;
    return { compound, planned: true, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
  }

  // A cheap stop under the safety car, if one was coming within a few laps.
  if (state.safetyCar && !car.isUser && !refuel) {
    const soon = car.plan.stops.find((stop) => stop > lap && stop - lap <= 9);
    if (soon && stream.chance(clamp(0.35 + car.strategist / 120, 0.3, 0.95))) {
      car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== soon) };
      return { compound: nextPlannedCompound(car, year), planned: true, fuel: 0 };
    }
  }

  // Tyres off the cliff with a long way to go: an unplanned stop.
  if (!car.isUser && !isWetTyre(car.compound) && tyreLifeUsed(car, year) > 1.15 && remaining > 8) {
    return { compound: dryCompoundFor(remaining, year), planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
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
 *   fastest lap   a free stop at the end for soft tyres and the bonus point
 *
 * The better the strategist, the more often the call is seen and made.
 */
const strategyCall = (state, car, stream) => {
  const lap = state.lap;
  const remaining = state.laps - lap;
  const year = state.year;
  if (refuellingEra(year) || state.safetyCar) return null;
  const life = tyreLifeUsed(car, year);
  const sees = (chance) => stream.chance(clamp(chance * (0.5 + car.strategist / 100), 0, 0.95));
  const order = runningOrder(state).filter((other) => other.status === "running");
  const index = order.findIndex((other) => other.id === car.id);
  const ahead = order[index - 1];
  const behind = order[index + 1];
  const nextStop = car.plan.stops.find((stop) => stop >= lap);
  const lane = pitLaneLoss(state.race.baseLap) + stationaryTime({ year, crew: car.crew });

  // Overcut: the car ahead has just stopped, we are in clean air on good tyres.
  if (nextStop === lap && ahead && ahead.lastPitLap >= lap - 1 && life < 0.68 && remaining > 8 && sees(0.6)) {
    car.plan = { ...car.plan, stops: car.plan.stops.map((stop) => (stop === lap ? lap + 2 : stop)) };
    pushEvent(state, { type: "call", carId: car.id, call: "overcut" });
    return null;
  }
  if (!nextStop || remaining <= 6) {
    // Fastest lap: from 2019 to 2024 a point for it inside the top ten.
    if (year >= 2019 && year <= 2024 && remaining <= 3 && remaining >= 1 && car.position <= 10 && !car.flapStop && car.gapBehind !== null && car.gapBehind > lane + 4 && sees(0.7)) {
      car.flapStop = true;
      return { compound: compoundsFor(year)[0], planned: false, fuel: 0, call: "fastest" };
    }
    return null;
  }
  const due = nextStop - lap;
  // Cover: the car behind has stopped and could jump us.
  if (behind && behind.lastPitLap >= lap - 1 && car.lastPitLap < lap - 4 && car.gapBehind !== null && car.gapBehind < lane * 0.85 && due <= 5 && life > 0.4 && sees(0.45)) {
    car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== nextStop) };
    return { compound: nextPlannedCompound(car, year), planned: true, fuel: 0, call: "cover" };
  }
  // Undercut: within reach of the car ahead and due anyway.
  if (ahead && car.gapAhead !== null && car.gapAhead < 1.6 && due >= 1 && due <= 3 && life > 0.55 && ahead.lastPitLap < lap - 3 && ahead.plan?.stops.some((stop) => stop > lap) && sees(0.16)) {
    car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== nextStop) };
    return { compound: nextPlannedCompound(car, year), planned: true, fuel: 0, call: "undercut" };
  }
  return null;
};

const nextPlannedCompound = (car, year) => {
  const sequence = car.plan.compounds;
  const next = sequence[Math.min(sequence.length - 1, car.stint + 1)];
  if (next && (next !== car.compound || year < 2007 || car.compoundsUsed.length >= 2)) return next;
  return compoundsFor(year).find((compound) => compound !== car.compound) || next || compoundsFor(year)[0];
};

/** The dry tyre that gets you to the flag from here: the softest one that lasts. */
const dryCompoundFor = (remaining, year) => {
  const options = compoundsFor(year);
  const fits = options.filter((compound) => tyreSpec(compound, year).life >= remaining * 0.9);
  return fits[0] || options[options.length - 1];
};

/** Laps of fuel to the next planned stop, or to the flag. */
const fuelToNextStop = (car, lap, laps) => {
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
 * has it, the battery, and racecraft.
 */
const resolveTraffic = (state, running, beforeIndex, stream, wetness) => {
  const sc = state.safetyCar;
  const profile = state.race.profile;
  const baseLap = state.race.baseLap;
  const drs = state.era.features.drs && (state.track?.drs ?? 1) > 0 && state.lap > 2 && wetness < 0.3;
  const ordered = [...running].filter((car) => car.status === "running").sort((a, b) => (beforeIndex[a.id] ?? 99) - (beforeIndex[b.id] ?? 99));

  if (sc && !sc.virtual) {
    // Behind the safety car the field bunches up and nobody passes.
    for (let index = 1; index < ordered.length; index += 1) {
      const ahead = ordered[index - 1];
      const car = ordered[index];
      const gap = car.time - ahead.time;
      if (gap < baseLap * 0.6) car.time = ahead.time + clamp(gap * 0.35, 0.45, 1.1);
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
    const deploys = (entry) => entry.ersMode === "deploy" && (entry.battery ?? 0) > 8;
    const passChance = clamp(
      0.01 + (profile.overtaking ?? 0.55) * 0.2 + (delta - 0.25) * 0.36 + (drs ? 0.12 : 0) + (car.racecraft - ahead.racecraft) * 0.004 + (wetness > 0.3 ? 0.06 : 0) +
        (deploys(car) ? 0.06 : 0) - (deploys(ahead) ? 0.05 : 0) + (ahead.tyreTemp < 0.38 ? 0.12 : 0),
      0.02,
      0.9,
    );
    if (stream.chance(passChance)) {
      const corner = spotOn(state, stream, "pass");
      // Clean pass: positions swap. A small chance it ends in contact.
      if (stream.chance(0.012 * (1 + wetness))) {
        const victim = stream.chance(0.5) ? ahead : car;
        if (stream.chance(0.4)) retire(state, victim, "collision");
        else {
          victim.damage += stream.range(0.3, 1.2);
          victim.time += stream.range(3, 9);
          pushEvent(state, { type: "contact", carId: victim.id, otherId: victim === car ? ahead.id : car.id, corner });
        }
      } else {
        ahead.time = Math.max(ahead.time, car.time + 0.15);
        pushEvent(state, { type: "pass", carId: car.id, otherId: ahead.id, corner, drs: drs && delta < 0.9 });
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

/** What the race engineer tells the player's drivers. */
const radioFor = (state, car, wetness) => {
  const wanted = tyreForWetness(wetness);
  const remaining = state.laps - state.lap;
  if (wanted && !isWetTyre(car.compound)) pushRadio(state, car, "box-wet", { compound: wanted });
  else if (wanted === "wet" && car.compound === "inter" && wetness > 0.72) pushRadio(state, car, "box-wet", { compound: "wet" });
  else if (!wanted && isWetTyre(car.compound) && wetness < 0.16) pushRadio(state, car, "box-dry");
  else if (!isWetTyre(car.compound) && tyreLifeUsed(car, state.year) > 1 && remaining > 5) pushRadio(state, car, "cliff");
  if (car.tyreTemp > 0.76) pushRadio(state, car, "hot");
  if (!refuellingEra(state.year) && car.fuel < remaining * (MIXES[car.fuelMode]?.burn ?? 1) + 0.15 && remaining > 1) {
    pushRadio(state, car, "fuel", { short: Math.round((remaining - car.fuel) * 10) / 10 });
  }
  if (car.battery !== null && car.battery < 10 && car.ersMode === "deploy") pushRadio(state, car, "battery");
  if (car.issue) pushRadio(state, car, "issue", { loss: car.issue });
  if (state.safetyCar && !state.safetyCar.virtual && car.plan.stops.some((stop) => stop > state.lap && stop - state.lap <= 10)) {
    pushRadio(state, car, "sc-window");
  }
  if (car.gapAhead !== null && car.gapAhead < 1 && state.track?.drs && state.era.features.drs && state.lap > 2) pushRadio(state, car, "drs");
  const nextStop = car.plan.stops.find((stop) => stop > state.lap);
  if (nextStop && nextStop - state.lap === 1 && !isWetTyre(car.compound)) pushRadio(state, car, "box-plan", { compound: nextPlannedCompound(car, state.year) });
};

const finishRace = (state) => {
  state.finished = true;
  state.cars.forEach((car) => {
    if (car.status === "running") car.status = "finished";
  });
  // The two-compound rule: a dry race finished on one compound is a penalty.
  if (state.year >= 2007) {
    const wetRace = state.weather.wetness.some((value) => value >= 0.2);
    state.cars.forEach((car) => {
      if (car.status !== "finished" || wetRace) return;
      const dry = new Set(car.compoundsUsed.filter((compound) => !isWetTyre(compound)));
      if (dry.size < 2) {
        car.time += 30;
        car.penalty = 30;
      }
    });
  }
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
    penalty: car.penalty || 0,
    isUser: car.isUser,
  }));
