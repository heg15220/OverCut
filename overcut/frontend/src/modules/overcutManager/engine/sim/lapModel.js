/**
 * The per-lap model the step simulation shares with the quick mode (SRS 4.2: "el modo
 * rápido usa el mismo modelo").
 *
 * At every line crossing a car's next lap is planned with exactly the ingredients of
 * race.js `stepLap` - pace, tyres, heat, fuel, battery, track evolution, mode, problems
 * and the driver's scatter - and the result is the lap-time *budget* the step sim then
 * spends along the speed trace (RF-SIM-01, RF-SIM-02..05). Traffic, dirty air, the
 * safety car, pit-lane time and mistakes are not in the budget: the step sim plays them
 * out physically.
 *
 * TODO(race.js): race.js does not export the pieces below, and another agent owns it
 * while its year rules move into the season regulations. Each mirrored function names
 * its original; once race.js exports them (see the report: MODES, MIXES, ERS_MODES,
 * tyreSpec, pitLaneLoss, outLapTemp, TEMP_TARGET, FUEL_PER_LAP, START_SPACING,
 * REFERENCE_ATTRITION, RADIO_COOLDOWN, weatherClass, rivalCalls, pitDecision,
 * strategyCall, nextPlannedCompound, dryCompoundFor, fuelToNextStop, radioFor,
 * finishRace, plus a per-car "lap time" function split out of stepLap) this file
 * should shrink to imports. The equivalence test (sim/equivalence.test.js) fails if the
 * two copies drift apart.
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import { WEATHER } from "../../../overcutTrayectoria/engine/weather";
import { compoundsFor, isWetTyre, refuellingEra, runningOrder, stationaryTime, tyreForWetness, tyreLifeUsed, tyreTime } from "../race";

// ------------------------------------------------------------ mirrored constants

/** TODO(race.js): mirror of race.js `MODES`. */
export const MODES = {
  save: { time: 0.38, wear: 0.72, risk: 0.7, mistake: 0.6 },
  normal: { time: 0, wear: 1, risk: 1, mistake: 1 },
  push: { time: -0.3, wear: 1.38, risk: 1.25, mistake: 1.6 },
};

/** TODO(race.js): mirror of race.js `MIXES`. */
export const MIXES = {
  lean: { time: 0.24, burn: 0.93 },
  standard: { time: 0, burn: 1 },
  rich: { time: -0.18, burn: 1.07 },
};

/** TODO(race.js): mirror of race.js `ERS_MODES`. */
export const ERS_MODES = {
  harvest: { time: 0.3, charge: 26 },
  balanced: { time: 0, charge: 3 },
  deploy: { time: -0.34, charge: -30 },
};

/** TODO(race.js): mirrors of race.js `START_SPACING`, `REFERENCE_ATTRITION`, `FUEL_PER_LAP`, `TEMP_TARGET`, `RADIO_COOLDOWN`. */
export const START_SPACING = 0.32;
const REFERENCE_ATTRITION = 1.15;
const FUEL_PER_LAP = 0.032;
const TEMP_TARGET = { save: 0.46, normal: 0.56, push: 0.68 };
const RADIO_COOLDOWN = { drs: 15, hot: 8, fuel: 6, battery: 6, issue: 12, cliff: 6 };

const DRY_TYRES = {
  dry: { offset: 0, wear: 0.012, life: 400 },
  soft: { offset: -0.75, wear: 0.075, life: 17 },
  medium: { offset: -0.38, wear: 0.05, life: 27 },
  hard: { offset: 0, wear: 0.032, life: 40 },
};

/** TODO(race.js): mirror of race.js `tyreSpec`. */
export const tyreSpec = (compound, year) => {
  const spec = DRY_TYRES[compound] || DRY_TYRES.hard;
  if (year >= 2007 || compound === "dry") return spec;
  return { offset: spec.offset * 0.7, wear: spec.wear * 0.75, life: Math.round(spec.life * 1.35) };
};

/** TODO(race.js): mirror of race.js `pitLaneLoss`. */
export const pitLaneLoss = (baseLap) => clamp(baseLap * 0.21, 14, 34);

/** TODO(race.js): mirror of race.js `outLapTemp`. */
export const outLapTemp = (year) => (year >= 1995 ? 0.36 : 0.22);

/** TODO(race.js): mirror of race.js `weatherClass`. */
export const weatherClass = (wetness) => (wetness >= 0.55 ? WEATHER.WET : wetness >= 0.2 ? WEATHER.MIXED : WEATHER.DRY);

export const wetnessAt = (state, lap) => state.weather.wetness[Math.min(Math.max(0, lap), state.laps)] ?? 0;

// ------------------------------------------------------------------ events

/** Events carry the lap of the car they are about (raceClock times them on that car's lap). */
export const pushEvent = (state, lap, event) => {
  state.events.push({ lap, ...event });
};

/** TODO(race.js): mirror of race.js `pushRadio`, with the car's own lap. */
const pushRadio = (state, lap, car, kind, extra = {}) => {
  const last = state.radio.filter((message) => message.carId === car.id && message.kind === kind).pop();
  if (last && lap - last.lap < (RADIO_COOLDOWN[kind] ?? 4)) return;
  state.radio.push({ lap, carId: car.id, kind, ...extra });
};

// --------------------------------------------------------------- the world

/**
 * Start of lap `lap` for the race as a whole, when the leader begins it: the track
 * temperature, rubber, and rain or drying messages. Mirrors the head of race.js `stepLap`.
 */
export const beginLeaderLap = (state, lap) => {
  const wetness = wetnessAt(state, lap);
  const previousWetness = wetnessAt(state, lap - 1);
  if (state.trackTempBase !== undefined) {
    const drift = Math.sin((lap / state.laps) * Math.PI) * 3 - (lap / state.laps) * 2;
    const target = state.trackTempBase + drift - wetness * 16;
    state.trackTemp = Math.round((state.trackTemp + (target - state.trackTemp) * (wetness > previousWetness ? 0.35 : 0.12)) * 10) / 10;
    state.trackTemps.push(state.trackTemp);
  }
  state.evolution = wetness > 0.3 ? 0 : Math.min(1, (state.evolution || 0) + 1 / Math.max(10, state.laps * 0.55));
  if (weatherClass(previousWetness) !== weatherClass(wetness) && lap > 1) {
    pushEvent(state, lap, { type: wetness > previousWetness ? "rain" : "drying", wetness });
  }
};

// ----------------------------------------------------------- rival pit walls

/** TODO(race.js): mirror of race.js `rivalCalls`, for the car's own lap. */
export const rivalCalls = (state, car, lap) => {
  const remaining = state.laps - lap + 1;
  const life = tyreLifeUsed(car, state.year);
  const attacking = car.gapAhead !== null && car.gapAhead < 1.2;
  const defending = car.gapBehind !== null && car.gapBehind < 1;
  const lonely = (car.gapAhead === null || car.gapAhead > 3) && (car.gapBehind === null || car.gapBehind > 4);
  const nextStop = car.plan.stops.find((stop) => stop >= lap);
  const stintLeft = (nextStop ?? state.laps) - lap + 1;
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
 * Plan one car's lap `lap`: the "lap times" block of race.js `stepLap` for one car,
 * without the wake (the step sim applies dirty air by distance), without the safety
 * car floor (the step sim runs a real train) and without the mistake's time (the step
 * sim loses it at the corner). Mutates tyres, fuel, battery and heat exactly as the
 * quick mode does and returns the budget in seconds.
 *
 * `gridIndex` is the car's place in the order at the start of the lap (lap 1 only),
 * `scrumShare` the fraction of the quick mode's first-lap traffic term kept (data).
 */
export const planLap = (state, car, lap, stream, { gridIndex = 0, scrumShare = 1 } = {}) => {
  const wetness = wetnessAt(state, lap);
  const climate = weatherClass(wetness);
  const { year } = state;
  const baseLap = state.race.baseLap;
  const spp = baseLap * 0.0012;
  const refuel = refuellingEra(year);
  const sc = state.safetyCar;
  const trackTemp = state.trackTemp ?? 30;
  const fuelStart = state.fuelStart ?? state.laps + 1.2;
  const evolution = -0.55 * (state.evolution || 0);

  const mode = MODES[car.mode] || MODES.normal;
  const mix = MIXES[car.fuelMode] || MIXES.standard;
  const pace = car.pace[climate] ?? car.pace.dry;

  const overheat = Math.max(0, car.tyreTemp - 0.72);
  const cold = Math.max(0, 0.4 - car.tyreTemp);
  const dirty = car.gapAhead !== null && car.gapAhead < 1 && lap > 1 && !sc ? 1 - car.gapAhead : 0;
  const wing = car.wing ?? 0;
  const wearRate = car.wearFactor * mode.wear * (1 + overheat * 2.2 + dirty * 0.18 + Math.max(0, -wing) * 0.6) * (1 + (trackTemp - 30) * 0.008);
  car.tyreWear += wearRate * (sc ? 0.35 : 1);
  const tyre = isWetTyre(car.compound)
    ? tyreTime({ compound: car.compound, age: car.tyreAge, wetness, year })
    : tyreTime({ compound: car.compound, age: car.tyreWear, wetness, year, wearFactor: 1 });

  const fuel = refuel ? car.fuel * FUEL_PER_LAP : (car.fuel - fuelStart / 2) * FUEL_PER_LAP;

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
  const volatility = baseLap * 0.0036 * (1 + (55 - car.consistency) * 0.01) * (1 + wetness * 0.6);
  const expected =
    baseLap * (1 + 0.11 * wetness) - pace * spp + tyre + fuel + mode.time + mix.time + energyTime + thermal + evolution + car.setup + car.damage + car.issue -
    wing * wetness * baseLap * 0.012;
  car.expected = expected;
  let time = expected + stream.normal(0, volatility);
  if (lap === 1) time += stream.normal(0, 0.55) - ((car.racecraft - 50) / 20) * 0.25 + 1.5 + gridIndex * 0.22 * scrumShare;

  const mismatch = !isWetTyre(car.compound) && wetness > 0.3 ? 2.5 : car.compound === "wet" && wetness < 0.3 ? 0.6 : 0;
  const mistakeChance = 0.006 * (1 + (55 - car.consistency) * 0.03) * mode.mistake * (1 + mismatch + wetness * (1 - wing * 2) + cold * 2);
  car.pendingMistake = stream.chance(clamp(mistakeChance, 0.001, 0.2)) ? stream.range(1.2, 5) : 0;
  car.mistakeKind = car.pendingMistake ? (car.pendingMistake > 3.4 ? "spin" : car.pendingMistake > 2.2 ? "wide" : "lockup") : null;
  if (car.mistakeKind === "lockup") car.tyreWear += 0.8;

  car.tyreAge += 1;
  if (refuel) car.fuel = Math.max(0, car.fuel - 1);
  else car.fuel -= mix.burn * (car.mode === "push" ? 1.02 : car.mode === "save" ? 0.97 : 1) * (sc ? 0.62 : 1);

  const target = sc ? 0.3 : TEMP_TARGET[car.mode] + dirty * 0.1 + (trackTemp - 30) / 220 - wetness * 0.12;
  car.tyreTemp = clamp(car.tyreTemp + (target - car.tyreTemp) * 0.55, 0.1, 1);
  return time;
};

/**
 * Will this car's lap end its race, or bring a problem? The "failures" block of race.js
 * `stepLap`, rolled at the start of the lap. Returns null or `{ reason, at }` where `at`
 * is "corner" (an accident, placed at a real corner by the caller), "mistake" (the
 * corner of this lap's mistake), "early" (first-lap contact) or "anywhere".
 */
export const rollFailure = (state, car, lap, stream) => {
  const wetness = wetnessAt(state, lap);
  const sc = state.safetyCar;
  const attrition = (state.race.profile.attrition ?? 1) / REFERENCE_ATTRITION;
  const wetRisk = wetness >= 0.55 ? 1.28 : wetness >= 0.2 ? 1.12 : 1;
  const mode = MODES[car.mode] || MODES.normal;
  const raceRisk = clamp((1 - car.reliability) * attrition * wetRisk, 0.01, 0.86);
  const perLap = 1 - Math.pow(1 - raceRisk, 1 / state.laps);
  const mismatch = !isWetTyre(car.compound) && wetness > 0.3 ? 4 : 1;
  if (stream.chance(perLap * mode.risk * (sc ? 0.4 : 1) * (car.issue ? 1.35 : 1))) {
    const incidentShare = clamp(0.24 * wetRisk * (1 + (55 - car.consistency) * 0.013) * mismatch, 0.06, 0.8);
    const accident = stream.chance(incidentShare);
    const reason = accident ? (lap === 1 && stream.chance(0.5) ? "collision" : "accident") : "mechanical";
    return { reason, at: reason === "collision" && lap === 1 ? "early" : reason === "accident" ? "corner" : "anywhere" };
  }
  if (car.pendingMistake > 3.8 && stream.chance(0.18 * mismatch)) return { reason: "accident", at: "mistake" };
  if (!car.issue && stream.chance(perLap * 0.22)) {
    car.issue = Math.round(stream.range(0.5, 2.2) * 10) / 10;
    pushEvent(state, lap, { type: "issue", carId: car.id, loss: car.issue });
  }
  if (!refuellingEra(state.year) && car.fuel < 0) return { reason: "fuel", at: "anywhere" };
  return null;
};

/**
 * Retire a car where it is. TODO(race.js): mirror of race.js `retire` (the share is
 * the real one, the safety-car call the same).
 */
export const retire = (state, car, lap, reason, corner, stream) => {
  car.status = "retired";
  car.retiredLap = lap;
  car.retireReason = reason;
  pushEvent(state, lap, { type: "dnf", carId: car.id, reason, corner: reason === "mechanical" || reason === "fuel" ? null : corner ?? null });
  const raceLap = state._sim ? state._sim.leaderLap : lap;
  if (reason !== "mechanical" && reason !== "fuel" && state.era.features.safetyCar && !state.safetyCar && raceLap < state.laps - 1) {
    if (stream.chance(state.year < 2000 ? 0.3 : 0.45)) {
      const virtual = state.era.features.virtualSafetyCar && stream.chance(0.38);
      state.safetyCar = { laps: virtual ? stream.int(1, 3) : stream.int(3, 5), virtual };
      pushEvent(state, raceLap, { type: virtual ? "vsc" : "sc" });
    }
  } else if ((reason === "mechanical" || reason === "fuel") && state.era.features.virtualSafetyCar && !state.safetyCar && stream.chance(0.1)) {
    state.safetyCar = { laps: 1, virtual: true };
    pushEvent(state, raceLap, { type: "vsc" });
  }
};

// ----------------------------------------------------------------- strategy

/** TODO(race.js): mirror of race.js `nextPlannedCompound`. */
export const nextPlannedCompound = (car, year) => {
  const sequence = car.plan.compounds;
  const next = sequence[Math.min(sequence.length - 1, car.stint + 1)];
  if (next && (next !== car.compound || year < 2007 || car.compoundsUsed.length >= 2)) return next;
  return compoundsFor(year).find((compound) => compound !== car.compound) || next || compoundsFor(year)[0];
};

/** TODO(race.js): mirror of race.js `dryCompoundFor`. */
const dryCompoundFor = (remaining, year) => {
  const options = compoundsFor(year);
  const fits = options.filter((compound) => tyreSpec(compound, year).life >= remaining * 0.9);
  return fits[0] || options[options.length - 1];
};

/** TODO(race.js): mirror of race.js `fuelToNextStop`. */
const fuelToNextStop = (car, lap, laps) => {
  const next = car.plan.stops.find((stop) => stop > lap);
  return Math.max(1, (next || laps) - lap);
};

/**
 * TODO(race.js): mirror of race.js `strategyCall`, for the car's lap. `order` is the
 * running order (the step sim's, by distance covered: race.js reads elapsed time).
 */
const strategyCall = (state, car, lap, order, stream) => {
  const remaining = state.laps - lap;
  const year = state.year;
  if (refuellingEra(year) || state.safetyCar) return null;
  const life = tyreLifeUsed(car, year);
  const sees = (chance) => stream.chance(clamp(chance * (0.5 + car.strategist / 100), 0, 0.95));
  const index = order.indexOf(car);
  const ahead = order[index - 1];
  const behind = order[index + 1];
  const nextStop = car.plan.stops.find((stop) => stop >= lap);
  const lane = pitLaneLoss(state.race.baseLap) + stationaryTime({ year, crew: car.crew });

  if (nextStop === lap && ahead && ahead.lastPitLap >= lap - 1 && life < 0.68 && remaining > 8 && sees(0.6)) {
    car.plan = { ...car.plan, stops: car.plan.stops.map((stop) => (stop === lap ? lap + 2 : stop)) };
    pushEvent(state, lap, { type: "call", carId: car.id, call: "overcut" });
    return null;
  }
  if (!nextStop || remaining <= 6) {
    if (year >= 2019 && year <= 2024 && remaining <= 3 && remaining >= 1 && car.position <= 10 && !car.flapStop && car.gapBehind !== null && car.gapBehind > lane + 4 && sees(0.7)) {
      car.flapStop = true;
      return { compound: compoundsFor(year)[0], planned: false, fuel: 0, call: "fastest" };
    }
    return null;
  }
  const due = nextStop - lap;
  if (behind && behind.lastPitLap >= lap - 1 && car.lastPitLap < lap - 4 && car.gapBehind !== null && car.gapBehind < lane * 0.85 && due <= 5 && life > 0.4 && sees(0.45)) {
    car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== nextStop) };
    return { compound: nextPlannedCompound(car, year), planned: true, fuel: 0, call: "cover" };
  }
  if (ahead && car.gapAhead !== null && car.gapAhead < 1.6 && due >= 1 && due <= 3 && life > 0.55 && ahead.lastPitLap < lap - 3 && ahead.plan?.stops.some((stop) => stop > lap) && sees(0.16)) {
    car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== nextStop) };
    return { compound: nextPlannedCompound(car, year), planned: true, fuel: 0, call: "undercut" };
  }
  return null;
};

/** TODO(race.js): mirror of race.js `pitDecision`, taken at pit entry on lap `lap`. */
export const pitDecision = (state, car, lap, order, stream) => {
  const remaining = state.laps - lap;
  if (remaining <= 0) return null;
  const year = state.year;
  const refuel = refuellingEra(year);
  const wetness = wetnessAt(state, lap);

  if (car.pitRequest) {
    const compound = car.pitRequest.compound || nextPlannedCompound(car, year);
    const stintsLeft = Math.max(1, car.plan.stops.filter((stop) => stop > lap).length + 1);
    return { compound, planned: car.plan.stops.some((stop) => stop >= lap), fuel: refuel ? Math.ceil(remaining / stintsLeft) : 0, repair: true };
  }
  if (refuel && car.fuel <= 0) {
    return { compound: isWetTyre(car.compound) ? car.compound : nextPlannedCompound(car, year), planned: true, fuel: fuelToNextStop(car, lap, state.laps) };
  }
  const gamble = clamp((car.position - 8) / 12, -0.4, 0.6);
  const wanted = tyreForWetness(wetness + (car.isUser ? 0 : gamble * 0.06));
  if (!car.isUser) {
    const reactsNow = stream.chance(clamp(0.45 + car.strategist / 160 + gamble * 0.2, 0.3, 0.98));
    if (wanted && wanted !== car.compound && reactsNow) {
      if (!(car.compound === "inter" && wanted === "wet" && wetness < 0.72)) {
        return { compound: wanted, planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
      }
    }
    if (!wanted && isWetTyre(car.compound) && wetness < 0.16 + gamble * 0.08 && reactsNow) {
      return { compound: dryCompoundFor(remaining, year), planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
    }
    if (isWetTyre(car.compound)) return null;
    if (car.issue > 1.4 && remaining > 6 && stream.chance(0.35)) {
      return { compound: nextPlannedCompound(car, year), planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0, repair: true };
    }
  } else if (isWetTyre(car.compound) || (wanted && !isWetTyre(car.compound))) {
    if (!car.plan.stops.includes(lap)) return null;
  }

  const plannedStop = car.plan.stops.find((stop) => stop === lap);
  if (!car.isUser && !isWetTyre(car.compound)) {
    const call = strategyCall(state, car, lap, order, stream);
    if (call) return call;
  }
  if (plannedStop && !isWetTyre(car.compound)) {
    const lastStint = !car.plan.stops.some((stop) => stop > lap);
    const planned = nextPlannedCompound(car, year);
    const compound = !car.isUser && lastStint && tyreSpec(planned, year).life < remaining * 0.85 ? dryCompoundFor(remaining, year) : planned;
    return { compound, planned: true, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
  }
  if (state.safetyCar && !car.isUser && !refuel) {
    const soon = car.plan.stops.find((stop) => stop > lap && stop - lap <= 9);
    if (soon && stream.chance(clamp(0.35 + car.strategist / 120, 0.3, 0.95))) {
      car.plan = { ...car.plan, stops: car.plan.stops.filter((stop) => stop !== soon) };
      return { compound: nextPlannedCompound(car, year), planned: true, fuel: 0 };
    }
  }
  if (!car.isUser && !isWetTyre(car.compound) && tyreLifeUsed(car, year) > 1.15 && remaining > 8) {
    return { compound: dryCompoundFor(remaining, year), planned: false, fuel: refuel ? fuelToNextStop(car, lap, state.laps) : 0 };
  }
  return null;
};

/**
 * The work done in the box, applied when the car commits to the pit lane. Mirrors the
 * pit block of race.js `stepLap`; returns the stationary time (with any queue) and the
 * lane loss. `queue` is the wait for a team-mate already in the box.
 */
export const servicePit = (state, car, lap, decision, stream, queue = 0) => {
  const { year } = state;
  const sc = state.safetyCar;
  const refuel = refuellingEra(year);
  const laneLoss = pitLaneLoss(state.race.baseLap) * (sc ? (sc.virtual ? 0.62 : 0.5) : 1);
  let stationary = stationaryTime({ year, refuel: refuel ? decision.fuel : 0, crew: car.crew });
  const slow = stream.chance(0.04 * (1.4 - car.crew / 100)) ? stream.range(2.5, 8) : 0;
  stationary += slow;
  car.compound = decision.compound;
  if (!car.compoundsUsed.includes(decision.compound)) car.compoundsUsed.push(decision.compound);
  car.tyreAge = 0;
  car.tyreWear = 0;
  car.tyreTemp = outLapTemp(year);
  car.stops += 1;
  car.lastPitLap = lap;
  car.outLap = true;
  car.stint += decision.planned ? 1 : 0;
  if (decision.call) pushEvent(state, lap, { type: "call", carId: car.id, call: decision.call });
  if (decision.repair) {
    car.damage = 0;
    car.issue = car.issue > 1.2 ? car.issue * 0.5 : 0;
  }
  if (refuel) car.fuel = decision.fuel;
  car.pitRequest = null;
  pushEvent(state, lap, { type: "pit", carId: car.id, compound: decision.compound, stationary: Math.round((stationary + queue) * 10) / 10, slow: slow > 0, stacked: queue > 0 });
  return { lane: laneLoss, stationary: stationary + queue, ownStationary: stationary };
};

/** TODO(race.js): mirror of race.js `radioFor`, after the car's lap `lap`. */
export const radioFor = (state, car, lap) => {
  const wetness = wetnessAt(state, lap);
  const wanted = tyreForWetness(wetness);
  const remaining = state.laps - lap;
  if (wanted && !isWetTyre(car.compound)) pushRadio(state, lap, car, "box-wet", { compound: wanted });
  else if (wanted === "wet" && car.compound === "inter" && wetness > 0.72) pushRadio(state, lap, car, "box-wet", { compound: "wet" });
  else if (!wanted && isWetTyre(car.compound) && wetness < 0.16) pushRadio(state, lap, car, "box-dry");
  else if (!isWetTyre(car.compound) && tyreLifeUsed(car, state.year) > 1 && remaining > 5) pushRadio(state, lap, car, "cliff");
  if (car.tyreTemp > 0.76) pushRadio(state, lap, car, "hot");
  if (!refuellingEra(state.year) && car.fuel < remaining * (MIXES[car.fuelMode]?.burn ?? 1) + 0.15 && remaining > 1) {
    pushRadio(state, lap, car, "fuel", { short: Math.round((remaining - car.fuel) * 10) / 10 });
  }
  if (car.battery !== null && car.battery < 10 && car.ersMode === "deploy") pushRadio(state, lap, car, "battery");
  if (car.issue) pushRadio(state, lap, car, "issue", { loss: car.issue });
  if (state.safetyCar && !state.safetyCar.virtual && car.plan.stops.some((stop) => stop > lap && stop - lap <= 10)) pushRadio(state, lap, car, "sc-window");
  if (car.gapAhead !== null && car.gapAhead < 1 && state.track?.drs && state.era.features.drs && lap > 2) pushRadio(state, lap, car, "drs");
  const nextStop = car.plan.stops.find((stop) => stop > lap);
  if (nextStop && nextStop - lap === 1 && !isWetTyre(car.compound)) pushRadio(state, lap, car, "box-plan", { compound: nextPlannedCompound(car, state.year) });
};

/** TODO(race.js): mirror of race.js `finishRace` (two-compound rule, positions, gaps). */
export const finishRace = (state) => {
  state.finished = true;
  state.cars.forEach((car) => {
    if (car.status === "running") car.status = "finished";
  });
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
  pushEvent(state, state.laps, { type: "flag", carId: leader?.id });
};
