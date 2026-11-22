/**
 * The race in fixed time steps (RF-SIM-01, SRS 4.2), the mode the live view will watch;
 * race.js stays as the quick mode.
 *
 * Each step (`step.dt`, 0.25 s) every car advances along the circuit's speed trace:
 *
 *   1. pace       at each line crossing the car's lap-time budget is planned with the
 *                 quick mode's own model (lapModel.planLap: pace, tyres, heat, fuel,
 *                 battery, rubber, mode, problems, scatter). With nothing in the way the
 *                 car covers the lap in exactly that budget, slowing where the trace
 *                 slows (trackTables). Both modes therefore share balance (SRS 4.2).
 *   2. air        dirty air in corners and the tow on straights, by the time gap to the
 *                 car ahead and by era (RF-SIM-06); DRS opens on its zones (RF-SIM-08).
 *   3. traffic    nobody drives through the car in front: a follower is held a car's
 *                 length back unless it wins a duel for a corner (duel.js, RF-SIM-07).
 *   4. the lap    wear, fuel, battery and reliability move per lap at the line, as in the
 *                 quick mode; failures and mistakes are rolled there but happen at a real
 *                 point of the lap (a corner apex for accidents and mistakes).
 *   5. control    race control is the quick mode's (race.js retire, investigate,
 *                 decideInvestigations, redFlag pieces, on its `seed::control` stream),
 *                 played out on the track (RF-SIM-10): a local yellow at the incident's
 *                 corner (slower there, no duel for that corner), the safety car where
 *                 the era has it as a real train, the VSC as a delta (pace cap), the red
 *                 flag with the era's restart (aggregate, standing grid or rolling behind
 *                 the SC, tyres by the rules) and drive-through / stop-go penalties
 *                 driven through the pit lane. SC laps count down on the leader's line.
 *   6. strategy   every pit wall decides at pit entry (lapModel.pitDecision, the quick
 *                 mode's); the car then drives the physical pit lane (pitLane.js, RF-SIM-12):
 *                 limiter, a real stop in its own box (v = 0, stages from pitStop.js on the
 *                 `crew` stream), release and exit, with speeding and unsafe releases judged
 *                 by their cause. Its loss is the one the quick mode charges (SRS 4.2).
 *   7. timing     line crossings are interpolated inside the step and written to each
 *                 car's `history` exactly as the quick mode writes it, so raceClock,
 *                 LiveRace and career.completeRace read a step race unchanged.
 *
 * Determinism (RF-SIM-15, RNF-05): four seeded streams (laps, duels, pits, incidents),
 * a fixed step and a fixed processing order; the same seed and the same commands at the
 * same race time give byte-identical output. Hot loops run on typed arrays with no
 * per-step allocation (RNF-01).
 */

import balanceData from "../../data/balance/race-sim.json";
import { clamp, createStream } from "../../../overcutTrayectoria/engine/rng";
import {
  applyPitStop, cancelPit as quickCancelPit, createRace, decideInvestigations, investigate, pitStopTime, delayStop as quickDelayStop, skipStop as quickSkipStop, duePitPenalty, energyStep, jumpStartChecks, markPenaltyServed, mixEffect, modeEffect, pitLaneLoss,
  rainRedFlagCheck, redFlagRestart, redFlagTyres, requestPit as quickRequestPit, restartProcedureOf, setErs as quickSetErs, setMix as quickSetMix,
  setMode as quickSetMode, setTeamOrder as quickSetTeamOrder, showRedFlag, spotOn, stateRules, waveYellow,
} from "../race";
import { byYear, raceBalance } from "../rules";
import { circuitFor } from "../venue";
import { ROLE, drsAllowed, endDuel, openDuel, trySwitchback } from "./duel";
import { beginLeaderLap, finishRace, pitDecision, planLap, pushEvent, radioFor, retire, rivalCalls, rollFailure, wetnessAt } from "./lapModel";
import { buildTrackTables, dAt, inCorner, tauAtD } from "./trackTables";
import { PHASE, PHASE_NAMES, PIT_LANE_BALANCE, boxPosition, buildProfile, createLaneState, laneGeometry, limitSpeed, sampleProfile, timeAtS } from "./pitLane";
import { stageAt } from "./pitStop";

export const SIM_BALANCE = balanceData;

const frac = (value) => value - Math.floor(value);

/** The quick mode's start stagger per grid slot (race-eras.json `start.gridSpacing`); here the slot is physical. */
const START_SPACING = raceBalance.start.gridSpacing;

// ----------------------------------------------------------------- set up

/**
 * Wrap a fresh quick-mode race (createRace output, lap 0) as a step race. `race` is the
 * calendar entry createRace was given (for the circuit); `circuit` may be passed directly.
 */
export const fromQuickRace = (state, { race, circuit, balance = balanceData } = {}) => {
  if (state.lap !== 0 || state.finished) throw new Error("fromQuickRace needs a race that has not started");
  const track = circuit || circuitFor(race || state.race, state.year);
  const tables = buildTrackTables(track, { size: balance.step.tableSize, approachMetres: balance.duel.approachMetres });
  const n = state.cars.length;
  const laps = state.laps;
  // The season's rules (pack regulations or era-defaults), never a bare year (RNF-07, criterio 7.2).
  const rules = stateRules(state);
  const seed = state.seed;
  const cornerRange = new Map((track.corners || []).map((corner) => [corner.number, { from: frac(corner.from), to: frac(corner.to) }]));
  const sim = {
    balance,
    tables,
    circuitRef: track.ref || track.id,
    dt: balance.step.dt,
    n,
    clock: 0,
    steps: 0,
    requested: 0,
    leaderLap: 1,
    started: false,
    streams: {
      laps: createStream(`${seed}::step::laps`),
      duel: createStream(`${seed}::step::duels`),
      pits: createStream(`${seed}::step::pits`),
      incidents: createStream(`${seed}::step::incidents`),
      // RF-SIM-12 / RNF-05: the crew's own stream (stop stages, release, the limiter).
      crew: createStream(`${seed}::step::crew`),
    },
    rules,
    // RF-SIM-06: the era's dirty air is the quick mode's (rules.js), the tow is step-only data.
    dirtyLoss: rules.dirtyAir,
    slipGain: byYear(balance.slipstream.byEra, rules.year)?.gainPerLap ?? 0,
    // RF-SIM-05: 2026's overtake mode, run by distance: the extra over "deploy" per lap, from the era's energy balance.
    overtake: rules.energy.overtakeMode
      ? {
          gap: rules.energy.balance.overtakeGap,
          gain: rules.energy.balance.modes.deploy.time - rules.energy.balance.modes.overtake.time,
          drain: rules.energy.balance.modes.deploy.charge - rules.energy.balance.modes.overtake.charge,
          minCharge: rules.energy.balance.minChargeToAttack,
        }
      : null,
    overtakeOn: new Uint8Array(n),
    // RF-SIM-10: local yellows ({ corner, from, to, until }) and the red flag in progress.
    cornerRange,
    yellows: [],
    red: null,
    tau: new Float64Array(n),
    laps: new Int32Array(n),
    P: new Float64Array(n),
    P0: new Float64Array(n),
    tau0: new Float64Array(n),
    budget: new Float64Array(n),
    lapStart: new Float64Array(n),
    active: new Uint8Array(n),
    inPit: new Uint8Array(n),
    pitRate: new Float64Array(n),
    delay: new Float64Array(n),
    failTau: new Float64Array(n).fill(-1),
    failReason: new Array(n).fill(null),
    failCorner: new Int32Array(n),
    mistakeTau: new Float64Array(n).fill(-1),
    mistakeCorner: new Int32Array(n),
    lapFlags: new Uint8Array(n),
    lat: new Float64Array(n),
    latTarget: new Float64Array(n),
    cooldownUntil: new Float64Array(n),
    duelOther: new Int32Array(n).fill(-1),
    duelRole: new Uint8Array(n),
    duelMult: new Float64Array(n),
    duelUntil: new Float64Array(n),
    switchTarget: new Int32Array(n).fill(-1),
    switchTau: new Float64Array(n),
    switchCorner: new Int32Array(n),
    drsOpen: new Int8Array(n),
    blueUntil: new Float64Array(n),
    blueBy: new Int32Array(n).fill(-1),
    blueDelay: new Float64Array(n),
    ahead: new Int32Array(n).fill(-1),
    behind: new Int32Array(n).fill(-1),
    gapM: new Float64Array(n),
    gapS: new Float64Array(n),
    lapDiff: new Int32Array(n),
    ring: new Int32Array(n),
    ringSize: 0,
    order: new Int32Array(n),
    firstCross: new Float64Array(laps + 2).fill(-1),
    firstCrossCar: new Int32Array(laps + 2).fill(-1),
    lastCross: new Float64Array(laps + 2).fill(-1),
    lastCrossCar: new Int32Array(laps + 2).fill(-1),
    boxFree: {},
    // RF-SIM-12 (WP6): the physical pit lane - geometry, limit, garages and per-car state.
    lane: laneSetup(state, track, n),
    retireAt: null,
    scOpen: null,
  };
  for (let i = 0; i < n; i += 1) sim.order[i] = i;
  state._sim = sim;
  state.mode = "step";
  state.clock = 0;
  state.duels = [];
  state.safetyCarSpells = [];
  if (!state.investigations) state.investigations = [];
  sim.retireAt = (i, reason, corner) => retireCar(state, i, reason, corner);
  sim.raceControl = () => raceControl(state);
  state.cars.forEach((car) => {
    car.defence = car.defence || balance.defence.default;
    car.overtakeRisk = car.overtakeRisk || balance.risk.default;
  });
  return state;
};

/** A step race from the same arguments as race.js createRace (RF-SIM-01). */
export const createStepRace = (args) => fromQuickRace(createRace(args), { race: args.race });

/** The lights go out: grid slots behind the line and every car's first lap planned. */
const start = (state) => {
  const sim = state._sim;
  const { tables, balance } = sim;
  sim.started = true;
  beginLeaderLap(state, 1);
  state.cars.forEach((car, i) => {
    const back = (balance.grid.poleBackMetres + i * balance.grid.gapMetres) / tables.length;
    sim.P[i] = -back;
    sim.tau[i] = tauAtD(tables, 1 - back) - 1;
    sim.laps[i] = 0;
    sim.active[i] = car.status === "running" ? 1 : 0;
    sim.lat[i] = (car.grid % 2 ? -1 : 1) * 2.6;
    beginLap(state, i, 1, 0);
  });
  // RF-SIM-10: race control watches the lights (the quick mode's check and stream).
  jumpStartChecks(state, state.cars.filter((car) => car.status === "running"), 1);
};

// ------------------------------------------------------------------ laps

/** Weighted pick of a corner for a mistake or an accident (race.js spotOn, "mistake"). */
const mistakeCorner = (state, stream) => spotOn(state, stream, "mistake");

const apexTauOf = (sim, corner, stream) => {
  const known = corner !== null && sim.tables.apexTau.get(corner);
  return known !== undefined && known !== false ? known : stream.range(0.08, 0.95);
};

/** Plan car `i`'s lap `lap`, starting at race time `t`. */
const beginLap = (state, i, lap, t) => {
  const sim = state._sim;
  const car = state.cars[i];
  const stream = sim.streams.laps;
  sim.lapStart[i] = t;
  sim.lapFlags[i] = state.safetyCar ? 1 : 0;
  rivalCalls(state, car, lap);
  let budget = planLap(state, car, lap, stream, { gridIndex: i, scrumShare: sim.balance.lapOne.scrumShare });
  if (lap === 1) {
    // The quick mode staggers the start by START_SPACING a slot; here the slot is physical.
    budget = (budget + i * START_SPACING) / (1 - sim.tau[i]);
  }
  sim.budget[i] = Math.max(1, budget);
  sim.mistakeTau[i] = -1;
  if (car.pendingMistake) {
    const corner = mistakeCorner(state, stream);
    sim.mistakeCorner[i] = corner ?? 0;
    sim.mistakeTau[i] = apexTauOf(sim, corner, stream);
  }
  sim.failTau[i] = -1;
  const failure = rollFailure(state, car, lap, sim.streams.incidents);
  if (failure) {
    const inc = sim.streams.incidents;
    let at;
    let corner = null;
    if (failure.at === "early") at = inc.range(0.02, 0.18);
    else if (failure.at === "mistake" && sim.mistakeTau[i] >= 0) {
      at = Math.min(0.999, sim.mistakeTau[i] + 1e-6);
      corner = sim.mistakeCorner[i];
    } else if (failure.at === "corner" || failure.at === "mistake") {
      corner = mistakeCorner(state, inc);
      at = apexTauOf(sim, corner, inc);
    } else at = inc.range(0.08, 0.95);
    sim.failTau[i] = at;
    sim.failReason[i] = failure.reason;
    sim.failCorner[i] = corner ?? 0;
  }
};

/** Order of the running cars by distance covered (the timing tower's order). */
const runningCars = (state) => {
  const sim = state._sim;
  const out = [];
  for (let k = 0; k < sim.n; k += 1) {
    const car = state.cars[sim.order[k]];
    if (car.status === "running") out.push(car);
  }
  return out;
};

/** Car `i` crossed the line at race time `tc`, ending lap `lap`. */
const endLap = (state, i, lap, tc) => {
  const sim = state._sim;
  const car = state.cars[i];
  const lapTime = tc - sim.lapStart[i];
  car.time = tc;
  car.lastLap = lapTime;
  car.lapTime = lapTime;
  car.lastLapRaced = lap;
  const pit = sim.inPit[i] === 1 ? car.pit || null : null;
  if (sim.inPit[i] === 1) sim.inPit[i] = 2;
  const entry = { lap, start: sim.lapStart[i], end: tc, pit, compound: car.compound };
  // A lap spent in someone's air, held up or in a fight (not visible at the line).
  if (sim.lapFlags[i] & 24) entry.held = true;
  // A lap through a local yellow (RF-SIM-10).
  if (sim.lapFlags[i] & 32) entry.yellow = true;
  car.history.push(entry);
  car.pit = null;
  if (!(sim.lapFlags[i] & 7) && (car.bestLap === null || lapTime < car.bestLap)) car.bestLap = lapTime;

  // Timing at the line: who crossed this line just before, and the leader.
  const baseLap = state.race.baseLap;
  if (sim.firstCross[lap] < 0) {
    sim.firstCross[lap] = tc;
    sim.firstCrossCar[lap] = i;
    state.lap = lap;
    sim.leaderLap = lap + 1;
    const sc = state.safetyCar;
    if (sim.red) {
      // RF-SIM-10: the field has come round behind the red flag; restart by the era's procedure.
      sim.red.lineUpLap = lap;
    } else if (sc && lap > sc.since) {
      sc.laps -= 1;
      if (sc.laps <= 0) {
        state.safetyCar = null;
        // DRS waits after a restart (RF-SIM-08), as in the quick mode.
        state.restartLap = lap;
        pushEvent(state, lap, { type: "sc-in", virtual: sc.virtual });
      }
    }
    if (lap > 1 && sim.firstCrossCar[lap - 1] !== i) pushEvent(state, lap, { type: "lead", carId: car.id });
    // RF-SIM-10: the stewards decide at the leader's line, and rain no car can race in stops the race.
    decideInvestigations(state, sim.rules, lap);
    if (!sim.red) rainRedFlagCheck(state, wetnessAt(state, lap), lap);
    if (lap < state.laps) beginLeaderLap(state, lap + 1);
    car.gapAhead = null;
  } else {
    const gap = tc - sim.lastCross[lap];
    car.gapAhead = gap < baseLap * 0.5 ? gap : null;
    const ahead = state.cars[sim.lastCrossCar[lap]];
    if (ahead) ahead.gapBehind = gap;
  }
  sim.lastCross[lap] = tc;
  sim.lastCrossCar[lap] = i;
  car.gap = tc - sim.firstCross[lap];
  car.lapsDown = Math.max(0, state.lap - lap);

  if (car.bestLap !== null && (!state.fastestLap || car.bestLap < state.fastestLap.time)) {
    const changed = state.fastestLap && state.fastestLap.carId !== car.id;
    state.fastestLap = { carId: car.id, time: car.bestLap, lap };
    if (changed && lap > 3) pushEvent(state, lap, { type: "fastest", carId: car.id, time: car.bestLap });
  }
  if (car.isUser) radioFor(state, car, lap);

  if (lap >= state.laps) {
    car.status = "finished";
    sim.active[i] = 0;
    return false;
  }
  beginLap(state, i, lap + 1, tc);
  return true;
};

/**
 * The leader's lap after which a new safety car's laps count down (SRS 4.2): the quick
 * mode neutralises exactly `laps` whole laps; here the SC comes out mid-lap and goes in at
 * the line, so the partial lap counts when the leader was in its first half - on average
 * the same neutralised time.
 */
const scSince = (state) => {
  const sim = state._sim;
  return frac(sim.P[sim.order[0]]) < 0.5 ? sim.leaderLap - 1 : sim.leaderLap;
};

/** Car `i` stops for good where it is. */
const retireCar = (state, i, reason, corner) => {
  const sim = state._sim;
  const car = state.cars[i];
  if (car.status !== "running") return;
  const lap = sim.laps[i] + 1;
  const share = clamp(frac(sim.tau[i]), 0.001, 0.999);
  retire(state, car, lap, reason, corner || null, sim.streams.incidents, share);
  if (state.safetyCar && state.safetyCar.since === undefined) state.safetyCar.since = scSince(state);
  syncYellows(state);
  car.history.push({ lap, start: sim.lapStart[i], end: sim.clock, retired: true, share });
  sim.active[i] = 0;
  sim.inPit[i] = 0;
  if (sim.duelOther[i] >= 0) endDuel(sim, i);
};

// ------------------------------------------------------------------ a step

/** Insertion sort of `keys`-ordered indices (nearly sorted already: cheap). */
const sortRing = (sim) => {
  const ring = sim.ring;
  const P = sim.P;
  for (let a = 1; a < sim.ringSize; a += 1) {
    const value = ring[a];
    const key = frac(P[value]);
    let b = a - 1;
    while (b >= 0 && frac(P[ring[b]]) > key) {
      ring[b + 1] = ring[b];
      b -= 1;
    }
    ring[b + 1] = value;
  }
};

const raceKey = (state, i) => {
  const car = state.cars[i];
  if (car.status === "finished") return 1e6 - car.time * 1e-3;
  if (car.status === "running") return state._sim.P[i];
  return -1e6 + (car.retiredLap ?? 0);
};

const sortOrder = (state) => {
  const sim = state._sim;
  const order = sim.order;
  for (let a = 1; a < sim.n; a += 1) {
    const value = order[a];
    const key = raceKey(state, value);
    let b = a - 1;
    while (b >= 0 && raceKey(state, order[b]) < key) {
      order[b + 1] = order[b];
      b -= 1;
    }
    order[b + 1] = value;
  }
  for (let k = 0; k < sim.n; k += 1) state.cars[order[k]].position = k + 1;
};

/** Rebuild the ring of cars on track (not retired, finished or in the pit lane). */
const buildRing = (sim) => {
  let size = 0;
  // Keep the previous ring order for the cars still in it, then add rejoining ones.
  const seen = sim.seen || (sim.seen = new Uint8Array(sim.n));
  seen.fill(0);
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[k];
    if (sim.active[i] && sim.inPit[i] === 0) {
      sim.ring[size] = i;
      size += 1;
      seen[i] = 1;
    }
  }
  for (let i = 0; i < sim.n; i += 1) {
    if (!seen[i] && sim.active[i] && sim.inPit[i] === 0) {
      sim.ring[size] = i;
      size += 1;
    }
  }
  sim.ringSize = size;
  sortRing(sim);
};

/** Who is in front of whom on the road, at the start of the step. */
const measureGaps = (sim) => {
  const { ring, ringSize, P, tau, budget, tables } = sim;
  sim.ahead.fill(-1);
  sim.behind.fill(-1);
  let best = -1;
  let bestGap = -1;
  for (let k = 0; k < ringSize; k += 1) {
    const i = ring[k];
    if (ringSize < 2) {
      sim.gapM[i] = Infinity;
      sim.gapS[i] = Infinity;
      best = k;
      break;
    }
    const a = ring[(k + 1) % ringSize];
    sim.ahead[i] = a;
    sim.behind[a] = i;
    const gapD = frac(P[a] - P[i]);
    sim.gapM[i] = gapD * tables.length;
    sim.gapS[i] = frac(tauAtD(tables, frac(P[a])) - frac(tau[i])) * budget[i];
    sim.lapDiff[i] = Math.round(P[a] - P[i] - gapD);
    if (sim.gapM[i] > bestGap) {
      bestGap = sim.gapM[i];
      best = k;
    }
  }
  return best;
};

/**
 * RF-SIM-06: the change in speed (a fraction) for a car `gapSec` behind another, in a
 * corner (dirty air: the era's loss per lap, spent in the corners) or on a straight (the
 * tow: the era's gain per lap, spent on the straights). Zero outside the windows.
 */
export const airEffect = (sim, budget, gapSec, corner) => {
  const { dirtyAir, slipstream } = sim.balance;
  if (corner) return gapSec < dirtyAir.windowSec ? -(sim.dirtyLoss * (1 - gapSec / dirtyAir.windowSec)) / budget / sim.tables.cornerTime : 0;
  return gapSec < slipstream.windowSec ? (sim.slipGain * (1 - gapSec / slipstream.windowSec)) / budget / sim.tables.straightTime : 0;
};

/** Advance car `i` one step. */
const advance = (state, i) => {
  const sim = state._sim;
  if (sim.inPit[i] !== 0 && sim.lane.cars.prof[i]) {
    advanceInLane(state, i);
    return;
  }
  const { balance, tables, dt } = sim;
  const car = state.cars[i];
  const sc = state.safetyCar;
  const baseLap = state.race.baseLap;
  const a = sim.ahead[i];
  const gapS = sim.gapS[i];
  const gapM = sim.gapM[i];
  const d0 = frac(sim.P[i]);
  let rate = 1 / sim.budget[i];
  let mult = 1;

  if (sc && sim.inPit[i] === 0) {
    const scRate = 1 / (baseLap * (sc.virtual ? balance.safetyCar.virtualLapFactor : balance.safetyCar.lapFactor));
    if (sc.virtual) rate = Math.min(rate, scRate);
    else if (a >= 0 && sim.lapDiff[i] >= 0 && gapM > balance.safetyCar.trainGapMetres && car.position > 1) rate = Math.min(rate, scRate * balance.safetyCar.catchUp);
    else rate = Math.min(rate, scRate);
    sim.lapFlags[i] |= 1;
  } else if (a >= 0 && sim.inPit[i] === 0) {
    mult += airEffect(sim, sim.budget[i], gapS, inCorner(tables, d0));
    if (gapS < balance.traffic.followWindowSec) sim.lapFlags[i] |= 8;
    if (sim.drsOpen[i] > 0) mult += balance.drs.speedGain;
    // Blue flags: a car about to be lapped moves over, once per car lapping it; both
    // lose the quick mode's time for it (race.js blueFlags).
    if (sim.lapDiff[i] < 0 && gapM < balance.blueFlags.windowMetres && !(sim.blueBy[a] === i && sim.blueUntil[a] > sim.clock)) {
      sim.blueBy[a] = i;
      sim.blueUntil[a] = sim.clock + balance.blueFlags.cooldownSec;
      sim.blueDelay[a] += balance.blueFlags.lappedDelay;
      sim.blueDelay[i] += balance.blueFlags.lapperDelay;
    }
  }
  if (sim.duelUntil[i] > sim.clock) {
    mult += sim.duelMult[i];
    sim.lapFlags[i] |= 16;
  }
  if (sim.inPit[i] === 1) mult *= sim.pitRate[i];
  if (sim.delay[i] > 0) {
    const slow = balance.mistake.slowFactor;
    mult *= slow;
    sim.delay[i] = Math.max(0, sim.delay[i] - dt * (1 - slow));
    sim.lapFlags[i] |= 16;
  } else if (sim.blueDelay[i] > 0) {
    const slow = balance.blueFlags.slowFactor;
    mult *= slow;
    sim.blueDelay[i] = Math.max(0, sim.blueDelay[i] - dt * (1 - slow));
    sim.lapFlags[i] |= 16;
  }
  // RF-SIM-05: 2026's overtake mode, by distance - within the era's gap of the car ahead
  // on the same lap, more deployment (the era's overtake row against deploy), more drain.
  const ot = sim.overtake;
  if (ot) {
    const on = !sc && a >= 0 && sim.inPit[i] === 0 && car.ersMode === "overtake" && sim.lapDiff[i] === 0 && gapS < ot.gap && (car.battery ?? 0) > ot.minCharge;
    if (on) {
      mult += ot.gain / sim.budget[i];
      car.battery = Math.max(0, car.battery - (ot.drain * dt) / sim.budget[i]);
    }
    car.overtakeActive = on;
  }
  // RF-SIM-10: a local yellow - everyone lifts through that corner.
  if (sim.yellows.length && !sc) {
    for (let k = 0; k < sim.yellows.length; k += 1) {
      if (inZone(d0, sim.yellows[k])) {
        mult *= balance.raceControl.yellow.slowFactor;
        sim.lapFlags[i] |= 32;
        break;
      }
    }
  }
  const tau0 = sim.tau[i];
  let tau1 = tau0 + rate * Math.max(0, mult) * dt;
  const laps = sim.laps[i];
  let P1 = laps + dAt(tables, tau1);

  // Nobody drives through the car in front (unless passing it or lapping it).
  if (a >= 0 && sim.inPit[i] === 0) {
    const exempt =
      (sim.duelOther[i] === a && (sim.duelRole[i] === ROLE.PASSING || sim.duelRole[i] === ROLE.YIELDING)) ||
      (sim.lapDiff[i] < 0 && !sc) ||
      (sim.lapDiff[i] > 0 && !sc && gapM < balance.traffic.minGapMetres);
    if (!exempt) {
      const limit = sim.P0[i] + frac(sim.P[a] - sim.P0[i]) - balance.traffic.minGapMetres / tables.length;
      if (P1 > limit) {
        P1 = Math.max(sim.P0[i], limit);
        tau1 = tauAtD(tables, P1 - laps);
        if (tau1 < tau0) tau1 = tau0;
        sim.lapFlags[i] |= 8;
      }
    }
  }
  sim.P[i] = P1;
  sim.tau[i] = tau1;
  checkpoints(state, i, tau0, Math.min(tau1, 1));
  if (sim.active[i] && tau1 >= 1) {
    const tc = sim.clock - dt + (dt * (1 - tau0)) / Math.max(1e-12, tau1 - tau0);
    sim.laps[i] = laps + 1;
    sim.tau[i] = tau1 - 1;
    const going = endLap(state, i, laps + 1, tc);
    if (going) checkpoints(state, i, 0, sim.tau[i]);
  }
};

/** Everything that happens between time shares `from` and `to` of car `i`'s lap. */
const checkpoints = (state, i, from, to) => {
  const sim = state._sim;
  const { tables } = sim;
  const car = state.cars[i];
  const lap = sim.laps[i] + 1;
  if (to <= from) return;

  if (sim.failTau[i] >= 0 && (sim.failTau[i] > from && sim.failTau[i] <= to)) {
    const corner = sim.failCorner[i] || null;
    sim.failTau[i] = -1;
    retireCar(state, i, sim.failReason[i], corner);
    return;
  }
  if (sim.mistakeTau[i] >= 0 && (sim.mistakeTau[i] > from && sim.mistakeTau[i] <= to)) {
    sim.mistakeTau[i] = -1;
    sim.delay[i] += car.pendingMistake;
    sim.lapFlags[i] |= 2;
    const corner = sim.mistakeCorner[i] || null;
    pushEvent(state, lap, { type: "mistake", carId: car.id, kind: car.mistakeKind, corner, loss: Math.round(car.pendingMistake * 10) / 10 });
    // A car stopped or off the road at a corner: yellow flags there, as in the quick mode (RF-SIM-10).
    if (!state.safetyCar && raceBalance.raceControl.yellow.mistakeKinds.includes(car.mistakeKind)) {
      waveYellow(state, corner, car.id, lap);
      syncYellows(state);
    }
  }
  if (sim.inPit[i] === 0 && (tables.pitEntryTau > from && tables.pitEntryTau <= to)) enterPit(state, i, lap);
  if (sim.inPit[i] === 2 && (tables.pitExitTau > from && tables.pitExitTau <= to)) sim.inPit[i] = 0;
  if (sim.inPit[i] !== 0) return;

  // DRS: detection at the start of each zone, closed at its end.
  for (let z = 0; z < tables.drsZones.length; z += 1) {
    const zone = tables.drsZones[z];
    if (zone.tauFrom > from && zone.tauFrom <= to) sim.drsOpen[i] = sim.ahead[i] >= 0 && drsAllowed(state, lap, sim.gapS[i]) ? z + 1 : 0;
    if ((zone.tauTo > from && zone.tauTo <= to) && sim.drsOpen[i] === z + 1) sim.drsOpen[i] = 0;
  }
  // Attack points before the braking zones.
  if (!state.safetyCar) {
    for (let z = 0; z < tables.attacks.length; z += 1) {
      if (!(tables.attacks[z].tau > from && tables.attacks[z].tau <= to)) continue;
      const a = sim.ahead[i];
      if (a >= 0 && sim.lapDiff[i] === 0) {
        const b = sim.behind[i];
        const behindGap = b >= 0 && sim.lapDiff[b] === 0 ? sim.gapS[b] : Infinity;
        openDuel(state, i, z, a, sim.gapS[i], b, behindGap);
      }
    }
  }
  // The exit of a corner lost: the switchback.
  if (sim.switchTarget[i] >= 0 && (sim.switchTau[i] > from && sim.switchTau[i] <= to)) {
    const target = sim.switchTarget[i];
    const gap = sim.active[target] && sim.inPit[target] === 0 ? (frac(sim.P[target] - sim.P[i]) * tables.length) : Infinity;
    trySwitchback(state, i, target, gap);
  }
};

/** Car `i` reaches pit entry on lap `lap`: a penalty to serve, a stop, or neither? */
const enterPit = (state, i, lap) => {
  const sim = state._sim;
  const car = state.cars[i];
  // Under the red flag the field comes round to line up; nobody stops on the way.
  if (sim.red) return;
  const stream = sim.streams.pits;
  // The moment the car crossed the entry inside this step.
  const tau0 = sim.tau0[i];
  const tau1 = sim.tau[i];
  const entered = sim.clock - sim.dt + (tau1 > tau0 ? (sim.dt * (sim.tables.pitEntryTau - tau0)) / (tau1 - tau0) : 0);

  // RF-SIM-10: a drive-through or stop-go is driven through the pit lane (race.js duePitPenalty).
  const penalty = duePitPenalty(state, car, state.safetyCar, lap);
  if (penalty) {
    const stopGo = penalty.type === "stopGo";
    const lane = pitLaneLoss(state, null, { through: !stopGo });
    markPenaltyServed(state, car, penalty, lane + penalty.seconds, lap);
    // The lane cannot serve a penalty and a stop at once: a stop planned for this lap waits one.
    if (car.plan.stops.includes(lap) && lap + 1 < state.laps) car.plan = { ...car.plan, stops: car.plan.stops.map((stop) => (stop === lap ? lap + 1 : stop)) };
    car.pit = { lane, stationary: penalty.seconds, penalty: penalty.type };
    intoLane(state, i, entered, { stop: stopGo, stationary: penalty.seconds, queue: 0, plan: null });
    return;
  }

  const decision = pitDecision(state, car, lap, runningCars(state), stream);
  if (!decision) return;
  const L = sim.lane;
  const box = L.boxOf[car.teamId] ?? (L.geo.slotFrom + L.geo.slotTo) / 2;
  const arrival = entered + timeAtS(buildProfile(L.circuit, { vLimit: L.vLimit, baseLap: L.baseLap, stopAt: box }), box);
  const free = sim.boxFree[car.teamId] ?? -Infinity;
  const queue = free > arrival ? free - arrival + raceBalance.pit.doubleStackWait : 0;
  // The quick mode's servicePit, with the stop by stages on the crew stream (RF-SIM-12, WP7).
  const stop = pitStopTime(car, decision, { rules: sim.rules, stream, crew: sim.streams.crew });
  const served = applyPitStop(state, car, decision, stop, { lap, queue, rules: sim.rules });
  const own = stop.stationary + served;
  sim.boxFree[car.teamId] = arrival + queue + own;
  car.pit = { lane: pitLaneLoss(state, state.safetyCar), stationary: own + queue };
  intoLane(state, i, entered, { stop: true, stationary: own + queue, queue, plan: stop, served });
};

// ------------------------------------------------------------ the pit lane (WP6)

/**
 * RF-SIM-12 / SRS 6.2: the race's pit lane for the step simulator - the circuit's lane
 * geometry (pitLane.laneGeometry), the era's limit for this circuit and date (state.pitLane,
 * set by createRace), and one garage per team between the first and last box, in entry order.
 */
const laneSetup = (state, circuit, n) => {
  const geo = laneGeometry(circuit);
  const kmh = state.pitLane ? state.pitLane.kmh : null;
  const vLimit = limitSpeed(circuit, kmh, state.race.baseLap);
  const teams = [];
  state.cars.forEach((car) => {
    if (!teams.includes(car.teamId)) teams.push(car.teamId);
  });
  const boxOf = {};
  teams.forEach((teamId, slot) => {
    boxOf[teamId] = boxPosition(geo, slot, teams.length);
  });
  // A limit only counts where the era had one and the stewards judged it (race-eras.json offences).
  const offences = raceBalance.penalties.offences;
  const year = stateRules(state).year;
  return {
    circuit,
    geo,
    kmh,
    vLimit,
    baseLap: state.race.baseLap,
    boxOf,
    judgesSpeeding: kmh !== null && year >= offences.pitSpeeding.from,
    judgesRelease: year >= offences.unsafeRelease.from,
    cars: createLaneState(n),
  };
};

/** Car `i` leaves the track into the lane at race time `entered`: its profile for this pass. */
const intoLane = (state, i, entered, { stop, stationary, queue, plan }) => {
  const sim = state._sim;
  const L = sim.lane;
  const cars = L.cars;
  const car = state.cars[i];
  const crew = sim.streams.crew;
  // RF-SIM-10 with a cause: late on the limiter (same rate as the quick mode's blind roll).
  const late = crew.next() < PIT_LANE_BALANCE.speeding.chancePerPass;
  const overKmh = PIT_LANE_BALANCE.speeding.overKmh[0] + crew.next() * (PIT_LANE_BALANCE.speeding.overKmh[1] - PIT_LANE_BALANCE.speeding.overKmh[0]);
  const over = late && L.kmh !== null ? { kmh: overKmh, metres: PIT_LANE_BALANCE.speeding.metres } : null;
  const boxS = stop ? Math.max(L.geo.limitFromS + 1, (L.boxOf[car.teamId] ?? (L.geo.slotFrom + L.geo.slotTo) / 2) - (queue > 0 ? PIT_LANE_BALANCE.queueOffsetMetres : 0)) : -1;
  cars.prof[i] = buildProfile(L.circuit, { vLimit: L.vLimit, baseLap: L.baseLap, stopAt: stop ? boxS : null, over });
  cars.plan[i] = plan;
  cars.boxS[i] = boxS;
  cars.enteredAt[i] = entered;
  cars.stopFor[i] = stop ? stationary : 0;
  cars.queue[i] = queue;
  cars.s[i] = 0;
  cars.v[i] = cars.prof[i].v[0];
  cars.maxInZone[i] = 0;
  cars.stage[i] = null;
  cars.phase[i] = PHASE.ENTRY_ROAD;
  cars.over[i] = over;
  sim.inPit[i] = 1;
  sim.lapFlags[i] |= 4;
  sim.drsOpen[i] = 0;
  if (sim.duelOther[i] >= 0) endDuel(sim, i);
};

/** Time-share of the lap equivalent to `s` metres along the lane (entry → line → exit). */
const laneTau = (sim, s) => {
  const { geo } = sim.lane;
  const { pitEntryTau, pitExitTau } = sim.tables;
  if (s < geo.lineS) return Math.min(0.999999, pitEntryTau + (1 - pitEntryTau) * (s / geo.lineS));
  return pitExitTau * ((s - geo.lineS) / Math.max(1e-9, geo.total - geo.lineS));
};

/** Seconds of driving (the stop excluded) car `i` has done at race time `t`. */
const drivenAt = (cars, i, t) => {
  const e = t - cars.enteredAt[i];
  const tStop = cars.prof[i].tStop;
  if (tStop < 0 || e <= tStop) return e;
  return e < tStop + cars.stopFor[i] ? tStop : e - cars.stopFor[i];
};

/** RF-SIM-10: is a car coming down the fast lane within `gapMetres` behind `i`'s box? */
const carComing = (state, i) => {
  const sim = state._sim;
  const cars = sim.lane.cars;
  const gap = PIT_LANE_BALANCE.unsafeRelease.gapMetres;
  for (let j = 0; j < sim.n; j += 1) {
    if (j === i || sim.inPit[j] === 0 || !cars.prof[j]) continue;
    if (cars.phase[j] === PHASE.STATIONARY || cars.phase[j] === PHASE.QUEUE) continue;
    const d = cars.boxS[i] - cars.s[j];
    if (d > 0 && d < gap) return true;
  }
  return false;
};

/** RF-SIM-10: the stewards look at a pit-lane offence (race.js investigate), with what the lane saw. */
const investigateWithCause = (state, car, offence, cause) => {
  investigate(state, car, offence, null, state._sim.leaderLap);
  state.investigations[state.investigations.length - 1].cause = cause;
  const event = state.events[state.events.length - 1];
  if (event && event.type === "investigation" && event.carId === car.id) event.cause = cause;
};

/** One step of car `i` in the pit lane: the profile, the stop, the line, the release and the exit. */
const advanceInLane = (state, i) => {
  const sim = state._sim;
  const L = sim.lane;
  const cars = L.cars;
  const prof = cars.prof[i];
  const car = state.cars[i];
  const t1 = sim.clock;
  const s0 = cars.s[i];
  const tau0 = sim.tau[i];
  const tStop = prof.tStop;
  const e1 = t1 - cars.enteredAt[i];
  const stoppedNow = tStop >= 0 && e1 >= tStop && e1 < tStop + cars.stopFor[i];
  const wasStopped = cars.phase[i] === PHASE.STATIONARY || cars.phase[i] === PHASE.QUEUE;

  // The release (RF-SIM-10): the crew holds the car while one comes down the fast lane, unless it misses it.
  if (!stoppedNow && wasStopped && tStop >= 0 && carComing(state, i)) {
    const miss = sim.streams.crew.next() < PIT_LANE_BALANCE.unsafeRelease.crewMissChance * Math.max(0, 1.4 - car.crew / 100);
    if (miss) {
      if (L.judgesRelease) investigateWithCause(state, car, "unsafeRelease", { metres: PIT_LANE_BALANCE.unsafeRelease.gapMetres });
    } else {
      const hold = PIT_LANE_BALANCE.unsafeRelease.holdSeconds;
      cars.stopFor[i] += hold;
      if (car.pit) car.pit.stationary += hold;
      cars.phase[i] = PHASE.STATIONARY;
      return;
    }
  }

  let s1;
  let v1;
  if (stoppedNow) {
    s1 = cars.boxS[i];
    v1 = 0;
    const inStop = e1 - tStop;
    const queue = cars.queue[i];
    cars.phase[i] = inStop < queue ? PHASE.QUEUE : PHASE.STATIONARY;
    cars.stage[i] = inStop < queue || !cars.plan[i] ? null : stageAt(cars.plan[i], inStop - queue);
  } else {
    const at = sampleProfile(prof, drivenAt(cars, i, t1));
    s1 = at.s;
    v1 = at.v;
    const afterBox = tStop < 0 ? -1 : s1 >= cars.boxS[i] ? 1 : s1 >= L.geo.limitFromS ? 0 : -1;
    cars.phase[i] = s1 < L.geo.limitFromS ? PHASE.ENTRY_ROAD : s1 > L.geo.limitToS ? PHASE.EXIT_ROAD : afterBox === 1 ? PHASE.RELEASE : afterBox === 0 ? PHASE.BOX_APPROACH : PHASE.LIMITER;
    cars.stage[i] = null;
  }
  cars.s[i] = s1;
  cars.v[i] = v1;
  if (s1 >= L.geo.limitFromS && s1 <= L.geo.limitToS && v1 > cars.maxInZone[i]) cars.maxInZone[i] = v1;

  // The line, inside the lane: the lap ends when the car passes it (exact time from the profile).
  const lineS = L.geo.lineS;
  if (s0 < lineS && s1 >= lineS && sim.inPit[i] === 1) {
    checkpoints(state, i, tau0, 1);
    if (!sim.active[i]) return;
    const tc = cars.enteredAt[i] + timeAtS(prof, lineS) + (tStop >= 0 && cars.boxS[i] <= lineS ? cars.stopFor[i] : 0);
    sim.laps[i] += 1;
    sim.tau[i] = 0;
    sim.P[i] = sim.laps[i];
    const going = endLap(state, i, sim.laps[i], Math.min(t1, tc));
    if (!going) {
      sim.inPit[i] = 0;
      cars.prof[i] = null;
      return;
    }
  }

  const fromTau = sim.tau[i];
  if (s1 >= L.geo.total - 1e-9) {
    // Out of the lane: back on the track at the exit, with the rest of the step at race pace.
    const tEnd = cars.enteredAt[i] + prof.T + (tStop >= 0 ? cars.stopFor[i] : 0);
    const tau = sim.tables.pitExitTau + Math.max(0, t1 - tEnd) / sim.budget[i];
    sim.tau[i] = tau;
    sim.P[i] = sim.laps[i] + dAt(sim.tables, tau);
    checkpoints(state, i, fromTau, tau);
    if (cars.over[i] && L.judgesSpeeding) investigateWithCause(state, car, "pitSpeeding", { kmh: Math.round(cars.maxInZone[i] * 3.6 * 10) / 10, limit: L.kmh });
    sim.inPit[i] = 0;
    cars.prof[i] = null;
    cars.plan[i] = null;
    cars.stage[i] = null;
    cars.phase[i] = PHASE.TRACK;
    return;
  }
  const tau = laneTau(sim, s1);
  sim.tau[i] = tau;
  sim.P[i] = sim.laps[i] + dAt(sim.tables, tau);
  if (tau > fromTau) checkpoints(state, i, fromTau, tau);
};

/** For the view and the tests: where car `i` is in the pit lane (null on the track). */
export const laneStateOf = (state, carId) => {
  const sim = state._sim;
  const i = state.cars.findIndex((car) => car.id === carId);
  if (i < 0 || sim.inPit[i] === 0 || !sim.lane.cars.prof[i]) return null;
  const cars = sim.lane.cars;
  return { phase: PHASE_NAMES[cars.phase[i]], s: cars.s[i], v: cars.v[i], stage: cars.stage[i], boxS: cars.boxS[i], vLimit: sim.lane.vLimit, kmh: sim.lane.kmh, geometry: sim.lane.geo };
};

// ------------------------------------------------------------ race control

/** Circular "d is inside the zone" on the unit lap. */
const inZone = (d, zone) => (zone.from <= zone.to ? d >= zone.from && d <= zone.to : d >= zone.from || d <= zone.to);

/**
 * RF-SIM-10: race.js waveYellow marks a corner on `state.yellow`; here it becomes a
 * local yellow on the track - from `approachMetres` before the corner to `afterMetres`
 * after it, for `durationSec` - where cars lift and no duel is fought for that corner.
 */
const syncYellows = (state) => {
  const sim = state._sim;
  const flagged = state.yellow;
  if (!flagged) return;
  const cfg = sim.balance.raceControl.yellow;
  flagged.corners.forEach((corner) => {
    const range = sim.cornerRange.get(corner);
    if (!range) return;
    const until = sim.clock + cfg.durationSec;
    const known = sim.yellows.find((zone) => zone.corner === corner);
    if (known) known.until = until;
    else sim.yellows.push({ corner, from: frac(range.from - cfg.approachMetres / sim.tables.length), to: frac(range.to + cfg.afterMetres / sim.tables.length), until });
  });
  state.yellow = null;
  state.yellowZones = sim.yellows.map((zone) => ({ corner: zone.corner, until: zone.until }));
};

/** Is the corner of attack zone `corner` under a local yellow (no passing there)? */
export const yellowAt = (sim, corner) => {
  for (let k = 0; k < sim.yellows.length; k += 1) if (sim.yellows[k].corner === corner) return true;
  return false;
};

/**
 * RF-SIM-10: race.js decided the race must stop (`state.pendingRed`, from a heavy crash
 * or rain, on the race-control stream). Aggregate eras restart at once with the gaps
 * standing; otherwise the field is neutralised (a train, no passing, no stops) until
 * the leader reaches the line, where it lines up and restarts by the era's procedure.
 */
const startRed = (state) => {
  const sim = state._sim;
  const reason = state.pendingRed;
  state.pendingRed = null;
  const lap = sim.leaderLap;
  showRedFlag(state, reason, lap);
  sim.yellows.length = 0;
  state.yellowZones = [];
  if (sim.rules.raceControl.redFlag.aggregate) {
    redFlagTyres(state, runningCars(state), wetnessAt(state, lap), lap);
    redFlagRestart(state, lap);
    if (state.safetyCar) state.safetyCar.since = scSince(state);
    return;
  }
  sim.red = { reason, lineUpLap: null };
  state.safetyCar = { laps: 0, virtual: false, red: true, since: lap };
  for (let i = 0; i < sim.n; i += 1) if (sim.duelOther[i] >= 0) endDuel(sim, i);
};

/** The leader is at the line behind the red flag: tyres by the rules, the grid formation, the restart. */
const finishRed = (state) => {
  const sim = state._sim;
  const { tables, balance } = sim;
  const lap = sim.red.lineUpLap;
  const running = runningCars(state);
  redFlagTyres(state, running, wetnessAt(state, lap), lap);
  // Line up behind the line in race order: cars on the leader's lap only (lapped cars stay lapped).
  const ordered = [];
  for (let k = 0; k < sim.n; k += 1) {
    const i = sim.order[k];
    if (state.cars[i].status === "running" && sim.active[i] && sim.inPit[i] === 0) ordered.push(i);
  }
  ordered.sort((x, y) => sim.P[y] - sim.P[x]);
  const front = ordered.length ? sim.P[ordered[0]] : 0;
  ordered.forEach((i, k) => {
    if (k === 0 || sim.laps[i] >= lap || front - sim.P[i] >= 1) return;
    const slot = lap - (balance.grid.poleBackMetres + k * balance.grid.gapMetres) / tables.length;
    if (slot <= sim.laps[i]) return;
    sim.P[i] = slot;
    sim.tau[i] = Math.min(0.9999, tauAtD(tables, slot - sim.laps[i]));
  });
  sim.red = null;
  state.safetyCar = null;
  redFlagRestart(state, lap);
  if (state.safetyCar) state.safetyCar.since = lap;
};

/** Race control's moves after a step: a red flag to show or to restart from, yellows to expire. */
const raceControl = (state) => {
  const sim = state._sim;
  if (state.yellow) syncYellows(state);
  if (state.pendingRed && !sim.red) startRed(state);
  if (sim.red && sim.red.lineUpLap !== null) finishRed(state);
  if (sim.yellows.length) {
    let kept = 0;
    for (let k = 0; k < sim.yellows.length; k += 1) if (sim.yellows[k].until > sim.clock) sim.yellows[kept++] = sim.yellows[k];
    if (kept !== sim.yellows.length) {
      sim.yellows.length = kept;
      state.yellowZones = sim.yellows.map((zone) => ({ corner: zone.corner, until: zone.until }));
    }
  }
};

/** The restart procedure the era uses after a red flag (race.js restartProcedureOf), for the view. */
export const restartProcedure = (state) => restartProcedureOf(state._sim.rules);

/** Passes in progress: done once clear by a car's length, or when time runs out. */
const settleDuels = (state) => {
  const sim = state._sim;
  const minGap = sim.balance.traffic.minGapMetres / sim.tables.length;
  for (let i = 0; i < sim.n; i += 1) {
    if (sim.duelRole[i] === ROLE.NONE) continue;
    const other = sim.duelOther[i];
    if (sim.duelRole[i] === ROLE.PASSING && other >= 0) {
      const lead = sim.P[i] - sim.P[other];
      if (lead > minGap || !sim.active[other] || !sim.active[i]) {
        endDuel(sim, i);
        continue;
      }
      if (sim.clock >= sim.duelUntil[i]) {
        // Out of road: the move is made by the end of the corner, so put it there.
        if (lead > -0.01) sim.P[i] = sim.P[other] + minGap * 1.05;
        sim.tau[i] = Math.min(0.9999, tauAtD(sim.tables, sim.P[i] - sim.laps[i]));
        endDuel(sim, i);
      }
    } else if (sim.duelRole[i] !== ROLE.YIELDING && sim.clock >= sim.duelUntil[i]) {
      endDuel(sim, i);
    }
  }
};

/** Sideways: the attacker on the inside, nobody on top of anybody (presentation only). */
const lateral = (sim) => {
  const { lateral: L } = sim.balance;
  const stepMove = L.rate * sim.dt;
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[k];
    const target = sim.duelRole[i] === ROLE.NONE ? 0 : sim.latTarget[i];
    const diff = target - sim.lat[i];
    sim.lat[i] += Math.abs(diff) <= stepMove ? diff : Math.sign(diff) * stepMove;
  }
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[k];
    const a = sim.ahead[i];
    if (a < 0) continue;
    const gap = frac(sim.P[a] - sim.P[i]) * sim.tables.length;
    if (gap > L.carLength && gap < sim.tables.length - L.carLength) continue;
    const apart = sim.lat[i] - sim.lat[a];
    if (Math.abs(apart) >= L.carWidth) continue;
    const side = apart !== 0 ? Math.sign(apart) : sim.latTarget[i] !== 0 ? Math.sign(sim.latTarget[i]) : 1;
    sim.lat[i] = clamp(sim.lat[a] + side * L.carWidth, -L.halfWidth, L.halfWidth);
    if (Math.abs(sim.lat[i] - sim.lat[a]) < L.carWidth) sim.lat[a] = clamp(sim.lat[i] - side * L.carWidth, -L.halfWidth, L.halfWidth);
  }
};

/** One fixed step of `dt` seconds for the whole field. */
export const stepOnce = (state) => {
  const sim = state._sim;
  if (state.finished) return;
  if (!sim.started) start(state);
  sim.clock += sim.dt;
  sim.steps += 1;
  if (state.safetyCar && state.safetyCar.since === undefined) state.safetyCar.since = scSince(state);

  buildRing(sim);
  const first = measureGaps(sim);
  for (let i = 0; i < sim.n; i += 1) {
    sim.P0[i] = sim.P[i];
    sim.tau0[i] = sim.tau[i];
  }
  // Front to back around the loop, starting behind the biggest gap, so each car sees
  // the car ahead where it already is this step.
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[(first - k + sim.ringSize) % sim.ringSize];
    if (sim.active[i]) advance(state, i);
  }
  // Cars in the pit lane run on their own.
  for (let i = 0; i < sim.n; i += 1) {
    if (sim.active[i] && sim.inPit[i] !== 0 && sim.P0[i] === sim.P[i] && sim.tau0[i] === sim.tau[i]) {
      sim.ahead[i] = -1;
      advance(state, i);
    }
  }
  settleDuels(state);
  raceControl(state);
  lateral(sim);
  sortOrder(state);
  state.clock = sim.clock;
  // Safety-car spells in race time, for the view and the timing.
  if (state.safetyCar && sim.scOpen && Boolean(sim.scOpen.red) !== Boolean(state.safetyCar.red)) {
    // A red flag replacing a safety car, or a rolling restart after one: a new spell.
    sim.scOpen.to = sim.clock;
    sim.scOpen = null;
  }
  if (state.safetyCar && !sim.scOpen) {
    sim.scOpen = { from: sim.clock - sim.dt, to: null, virtual: Boolean(state.safetyCar.virtual), ...(state.safetyCar.red ? { red: true } : {}) };
    state.safetyCarSpells.push(sim.scOpen);
  } else if (!state.safetyCar && sim.scOpen) {
    sim.scOpen.to = sim.clock;
    sim.scOpen = null;
  }

  let running = 0;
  for (let i = 0; i < sim.n; i += 1) if (sim.active[i]) running += 1;
  const guard = state.laps * state.race.baseLap * 4;
  if (running === 0 || sim.clock > guard) finishRace(state);
};

// ------------------------------------------------------------------ API

/** Run the race clock forward `seconds` (RF-CMD-04: the view picks ×1…×16 by how much it asks for). */
export const stepFor = (state, seconds) => {
  const sim = state._sim;
  sim.requested += seconds;
  const target = Math.floor(sim.requested / sim.dt + 1e-9);
  while (sim.steps < target && !state.finished) stepOnce(state);
  return state;
};

/** Run until the next event the view should not miss (RF-CMD-04 "saltar al siguiente evento"). */
export const stepToNextEvent = (state, types = ["pass", "pit", "dnf", "sc", "vsc", "rain", "lead", "contact", "flag"]) => {
  const sim = state._sim;
  const from = state.events.length;
  while (!state.finished) {
    stepOnce(state);
    if (state.events.slice(from).some((event) => types.includes(event.type))) break;
  }
  sim.requested = sim.steps * sim.dt;
  return state;
};

/** Headless: the whole race (RNF-01). */
export const runStepToFinish = (state) => {
  const sim = state._sim;
  while (!state.finished) stepOnce(state);
  sim.requested = sim.steps * sim.dt;
  return state;
};

/** Where every car is right now, for a live view that reads the step sim directly. */
export const snapshot = (state) => {
  const sim = state._sim;
  return state.cars.map((car, i) => ({
    id: car.id,
    lap: sim.laps[i] + 1,
    progress: sim.P[i],
    share: frac(sim.P[i]),
    lateral: sim.lat[i],
    inPit: sim.inPit[i] !== 0,
    // RF-SIM-12 (WP6/WP7): where in the pit lane, how fast, and the stage of the stop.
    pit: sim.inPit[i] !== 0 && sim.lane.cars.prof[i] ? { phase: PHASE_NAMES[sim.lane.cars.phase[i]], v: sim.lane.cars.v[i], stage: sim.lane.cars.stage[i] } : null,
    status: car.status,
    position: car.position,
    duel: sim.duelRole[i],
  }));
};

/**
 * The state as the UI and career read it (classificationOf, completeRace, raceClock): the
 * same object without the simulator's internals.
 */
export const toRaceState = (state) => {
  const { _sim, _stream, _control, ...rest } = state;
  return rest;
};

// ------------------------------------------------------------- commands

const indexOf = (state, carId) => state.cars.findIndex((car) => car.id === carId);

/**
 * RF-CMD-01: the quick mode's setters, with the pace change felt from now on rather than
 * from the next line (the rest of the lap's budget moves by the change).
 */
const retimed = (state, carId, apply, termOf) => {
  const i = indexOf(state, carId);
  if (i < 0) return state;
  const car = state.cars[i];
  const before = termOf(car);
  apply();
  const delta = termOf(car) - before;
  if (delta && state._sim && state._sim.started && car.status === "running") {
    state._sim.budget[i] = Math.max(1, state._sim.budget[i] + delta);
    car.expected = (car.expected ?? 0) + delta;
  }
  return state;
};

export const setMode = (state, carId, mode) => retimed(state, carId, () => quickSetMode(state, carId, mode), (car) => modeEffect(car.mode).time);
export const setMix = (state, carId, mix) => retimed(state, carId, () => quickSetMix(state, carId, mix), (car) => mixEffect(car.fuelMode).time);
/** RF-CMD-01 energy mode (race.js setErs, era-checked): the lap time it is worth on a charged battery (race.js energyStep); 2026's overtake mode is run by distance. */
export const setErs = (state, carId, mode) =>
  retimed(state, carId, () => quickSetErs(state, carId, mode), (car) =>
    car.battery === null || car.battery === undefined ? 0 : energyStep({ rules: stateRules(state), mode: car.ersMode, battery: 100, gapAhead: null }).time);
export const requestPit = (state, carId, compound, options) => quickRequestPit(state, carId, compound, options);
/** RF-CMD-02: the next planned stop a lap later, or not at all (read at pit entry, so it holds until the car gets there). */
export const delayStop = (state, carId) => quickDelayStop(state, carId);
export const skipStop = (state, carId) => quickSkipStop(state, carId);
export const cancelPit = (state, carId) => quickCancelPit(state, carId);
export const setTeamOrder = (state, teamId, order) => quickSetTeamOrder(state, teamId, order);

/** RF-CMD-01 defence style: "holdCarBehind", "block" or "holdRacingLine". */
export const setDefence = (state, carId, style) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (car && state._sim.balance.defence.styles[style]) car.defence = style;
  return state;
};

/** RF-CMD-01 overtaking risk: "low", "normal" or "high". */
export const setOvertakeRisk = (state, carId, level) => {
  const car = state.cars.find((entry) => entry.id === carId);
  if (car && state._sim.balance.risk.levels[level]) car.overtakeRisk = level;
  return state;
};

export const DEFENCE_KEYS = Object.keys(balanceData.defence.styles);
export const RISK_KEYS = Object.keys(balanceData.risk.levels);
