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
 *                 SIM-2 (lateral.js): every car is a box of its era; closer than a car's
 *                 length only a car's width apart sideways, inside the measured asphalt,
 *                 with a limited lateral speed; a pass is completed by speed, never by
 *                 moving P; out of the pit lane a car rejoins on the lane's side (PIT_EXIT).
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
 *   8. drive      the power unit and gearbox (powertrain.js; RF-SIM-01, RF-SIM-02, RF-DEV-01): gear,
 *                 rpm, pedals, g and body motion from the speed each car does; the launch from
 *                 the grid limited by traction and lift and coast on the lean mix shape the
 *                 trace, and the time they cost is given back inside the same lap (SRS 4.2).
 *   9. energy     the store and the fuel step by step (engine/energy.js; RF-SIM-04, RF-SIM-05,
 *                 RF-CMD-01): the lap's energy time (the quick mode's energyStep) is spent where the
 *                 mode's deployment differs from the reference one - the slowest full-power cells
 *                 first, so deploying more reaches further down the straights and harvesting more
 *                 clips earlier - and the lap still lasts its budget. The store harvests under
 *                 braking and lifting and deploys on full power within the era's per-lap and power
 *                 limits (2026: the speed taper); the fuel flow is measured from the engine's load
 *                 and rpm. The ledgers (battery %, laps of fuel) stay the quick mode's.
 *  10. start/end  SIM-3 (F1M24-GAMEPLAY §2.13, RF-SIM-10, RF-WKD-07): an optional PRE_START phase
 *                 (`preStart: { formation: "drive" | "skip" }`) - the formation lap, the grid and the
 *                 era's lights (era-defaults.json startProcedure, race-sim.json start) with the wait
 *                 drawn on its own `start` stream - and, after the flag, a `finished` event per car and
 *                 its cooldown lap as a ghost (race-sim.json cooldown). Neither touches a race stream
 *                 or the state the race reads: with or without them the race is the same (RNF-05).
 *
 * Determinism (RF-SIM-15, RNF-05): four seeded streams (laps, duels, pits, incidents),
 * a fixed step and a fixed processing order; the same seed and the same commands at the
 * same race time give byte-identical output. Hot loops run on typed arrays with no
 * per-step allocation (RNF-01).
 */

import balanceData from "../../data/balance/race-sim.json";
import { clamp, createStream } from "../../../overcutTrayectoria/engine/rng";
import {
  applyContact, applyPitStop, cancelPit as quickCancelPit, createRace, decideInvestigations, investigate, pitStopTime, delayStop as quickDelayStop, skipStop as quickSkipStop, duePitPenalty, energyStep, jumpStartChecks, markPenaltyServed, mixEffect, modeEffect, pitLaneLoss,
  rainRedFlagCheck, redFlagRestart, redFlagTyres, requestPit as quickRequestPit, restartProcedureOf, setErs as quickSetErs, setMix as quickSetMix,
  setMode as quickSetMode, setTeamOrder as quickSetTeamOrder, showRedFlag, spotOn, stateRules, waveYellow,
  activeDebris, applyDebrisPuncture, debrisPass, judgeTrackLimits, rollFloorDamage, rollTrackLimits, setTactics as quickSetTactics, tacticTime,
} from "../race";
import { byYear, raceBalance } from "../rules";
import { calibrationFor, damageOf } from "../incidents";
import { circuitFor } from "../venue";
import { DUEL_GEOMETRY, LANE_NAMES, ROLE, battleOf, battleSetup, battleStep, drsAllowed, duelGeometrySetup, duelWatch, endDuel, fightOf, lineRadio, openDuel, resolveClaim, trySwitchback } from "./duel";
import { exitBlocked, gateBoxes, lateralSetup, rejoin, roomAt, stepLateral } from "./lateral";
import { positionAt } from "../trackData";
import { cornerNoiseSigmaOf, profileFactorsOf } from "../drivers/skills";
import { beginLeaderLap, finishRace, pitDecision, planLap, pushEvent, radioFor, retire, rivalCalls, rollFailure, wetnessAt } from "./lapModel";
import physicsData from "../../data/balance/race-physics.json";
import { buildTrackTables, dAt, dirtyAt, inCorner, sensAt, tauAtD } from "./trackTables";
import { PHASE, PHASE_NAMES, PIT_LANE_BALANCE, boxPosition, buildProfile, createLaneState, laneGeometry, limitSpeed, sampleProfile, timeAtS } from "./pitLane";
import { stageAt } from "./pitStop";
import { WEATHER_BALANCE, gripRatio, sprayLevelOf, sprayLossOf, weatherSnapshot } from "../weather";
import { POWERTRAIN, coastDecel, coastPlan, createDrive, curvatureBins, driveSnapshot, launchAccel, powertrainFor, updateDrive } from "./powertrain";
import { ENERGY, cellsFor, energyPlanOf, ersSpecOf, fuelEraOf, fuelFlowOf, lapDeployOf, referenceDeployOf, storeKwAt, traceDriveOf } from "../energy";
import { SC_BALANCE, neutralAfter, neutralLeader, neutralLine, neutralStep, pitClosedFor, scLimit, scRateCap, scSnapshot, unlapExempt, vscDeltaStep, vscRate, vscSnapshot } from "./safetyCar";
import { TYRE_THERMAL, heatStep, legacyIndexOf, loadOf, windowFor } from "../tyres/thermal";

export const SIM_BALANCE = balanceData;

/** SIM-7 tacticas (race-sim.json tactics) and the error's trip off the road (race-physics.json mistake.recovery). */
const TACTICS = balanceData.tactics;
const RECOVERY = physicsData.mistake.recovery;

const frac = (value) => value - Math.floor(value);

/** g in m/s² (race-physics.json constants), to read the drive's accelerations as g for the tyre's load (SIM-6). */
const G_ACCEL = physicsData.constants.g;
const FULL_TOP_SHARE = physicsData.trace.fullThrottleTopShare;

/** The quick mode's start stagger per grid slot (race-eras.json `start.gridSpacing`); here the slot is physical. */
const START_SPACING = raceBalance.start.gridSpacing;

/** GS-03: keep this step's starting places in the ring (newest at followHead). */
const recordPlaces = (sim) => {
  const K = sim.followSteps;
  if (!sim.followHist) sim.followHist = new Float64Array(sim.n * K).fill(NaN);
  sim.followHead = (sim.followHead + 1) % K;
  const base = sim.followHead * sim.n;
  for (let i = 0; i < sim.n; i += 1) sim.followHist[base + i] = sim.P0[i];
};

/**
 * GS-03: where car `a` was `ago` seconds before the end of this step (it has already moved): between its place
 * now and its starting places of the last steps, linearly. Older than the ring holds, its oldest place.
 */
const placeAgo = (sim, a, ago) => {
  const { dt, n, followHist, followSteps: K } = sim;
  const back = ago / dt;
  const at = (k) => (k === 0 ? sim.P[a] : followHist ? followHist[((sim.followHead - (k - 1) + K * 4) % K) * n + a] : NaN);
  const k0 = Math.min(K, Math.floor(back));
  const k1 = Math.min(K, k0 + 1);
  const p0 = at(k0);
  const p1 = at(k1);
  if (!Number.isFinite(p0)) return sim.P0[a];
  if (!Number.isFinite(p1) || k1 === k0) return p0;
  return p0 + (p1 - p0) * (back - k0);
};

/**
 * GS-03 (RF-SIM-06; F1M24-CHINA §2.1, §1.5 «Seguimiento»): the least time gap (s) a car keeps behind
 * another outside a duel in `year`, from race-sim.json traffic.minFollowSec.eras ({from, to, value,
 * source, status}); 0 without the key or the era (only minGapMetres then).
 */
export const minFollowSecOf = (traffic, year) => {
  const eras = traffic && traffic.minFollowSec && traffic.minFollowSec.eras;
  if (!Array.isArray(eras) || !Number.isFinite(year)) return 0;
  const era = eras.find((entry) => year >= entry.from && year <= entry.to);
  return era && era.value > 0 ? era.value : 0;
};

/** SIM-8 (F1M24-GAMEPLAY §3.3 trafico-sesion): what the step simulator runs - a race, or a session's traffic. */
export const SIM_MODE = { RACE: "race", SESSION: "session" };

// ----------------------------------------------------------------- set up

/**
 * Wrap a fresh quick-mode race (createRace output, lap 0) as a step race. `race` is the
 * calendar entry createRace was given (for the circuit); `circuit` may be passed directly.
 */
export const fromQuickRace = (state, { race, circuit, balance = balanceData, preStart = null } = {}) => {
  if (state.lap !== 0 || state.finished) throw new Error("fromQuickRace needs a race that has not started");
  const track = circuit || circuitFor(race || state.race, state.year);
  const tables = buildTrackTables(track, { size: balance.step.tableSize, approachMetres: balance.duel.approachMetres });
  const n = state.cars.length;
  const laps = state.laps;
  // The season's rules (pack regulations or era-defaults), never a bare year (RNF-07, criterio 7.2).
  const rules = stateRules(state);
  const seed = state.seed;
  // SIM-4: each corner's span and its apex (the `s` of a yellow waved there).
  const cornerRange = new Map((track.corners || []).map((corner) => [corner.number, { from: frac(corner.from), to: frac(corner.to), apex: frac(corner.apex ?? (corner.from + corner.to) / 2) }]));
  // SIM-4 / RF-SIM-11: the circuit's three timing sectors (distance shares where each starts), as trackTables reads them.
  const sectorStarts = Array.isArray(track.sectors) && track.sectors.length === 3 ? track.sectors : [0, 1 / 3, 2 / 3];
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
      // RF-STF-02 / RNF-05: the per-corner noise of the drivers' accuracy, its own stream.
      corners: createStream(`${seed}::step::corners`),
      // SIM-4 (RF-SIM-10): how long each local yellow stays out, its own stream (no other draw moves).
      yellows: createStream(`${seed}::step::yellows`),
      // SIM-7 (RF-SIM-09/10, RF-DEV-08): track limits and damage (floor, debris), each its own stream (RNF-05).
      limits: createStream(`${seed}::step::limits`),
      damage: createStream(`${seed}::step::damage`),
    },
    rules,
    // RF-SIM-06: the era's dirty air is the quick mode's (rules.js), the tow is step-only data.
    dirtyLoss: rules.dirtyAir,
    slipGain: byYear(balance.slipstream.byEra, rules.year)?.gainPerLap ?? 0,
    // GS-03 (RF-SIM-06; F1M24-CHINA §2.1): the era's least time gap kept behind a car outside a duel (race-sim.json
    // traffic.minFollowSec.eras); 0 (absent) leaves only minGapMetres, the behaviour before.
    minFollowSec: minFollowSecOf(balance.traffic, rules.year ?? state.year),
    followSettleSec: balance.traffic.minFollowSec ? balance.traffic.minFollowSec.settleSec ?? 0 : 0,
    // GS-03: the car each one has had ahead since `followSince` (race time) with no duel between them.
    followOf: new Int32Array(n).fill(-1),
    followSince: new Float64Array(n),
    // GS-03: each car's place at the start of the last steps (ring of followSteps per car), to read where the car
    // ahead was minFollowSec ago.
    followSteps: Math.max(1, Math.ceil(minFollowSecOf(balance.traffic, rules.year ?? state.year) / balance.step.dt) + 1),
    followHist: null,
    followHead: 0,
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
    lapOut: { energyTime: 0 },
    // SIM-6 (RF-SIM-03): the tyre's two nodes in °C at this step, for the view (snapshot tyreC) and the duels;
    // the race's own heat is the lap model's (race.js heatLapOf), resynced at every line. `loadSum/loadN` the
    // lap's g load, its mean (`loadMean`, 0 until a green lap is done) and the set on the car (`set`, a new set resets).
    heat: {
      s: new Float64Array(n),
      c: new Float64Array(n),
      loadSum: new Float64Array(n),
      loadN: new Int32Array(n),
      loadMean: new Float64Array(n),
      set: new Int32Array(n),
      // 1 while the lap is all green and out of the pit lane: only such a lap sets `loadMean` (a slow lap would inflate the next).
      green: new Uint8Array(n),
      view: state.cars.map(() => ({ surface: 0, carcass: 0 })),
      inputs: { q: 0, airC: 0, trackC: 0 },
      node: { surface: 0, carcass: 0 },
    },
    // RF-SIM-10: local yellows ({ corner, from, to, until, double, sector, s }) and the red flag in progress.
    cornerRange,
    sectorStarts,
    yellows: [],
    // SIM-4: the first event a yellow sync has not looked at yet (the race.js `yellow` events it completes).
    yellowScan: 0,
    red: null,
    tau: new Float64Array(n),
    laps: new Int32Array(n),
    P: new Float64Array(n),
    P0: new Float64Array(n),
    tau0: new Float64Array(n),
    budget: new Float64Array(n),
    // WP3: share of the budget over the physical trace, spent by band (race-physics.json `budget`).
    dev: new Float64Array(n),
    // RF-SIM-11: this lap's share of the budget per sector (wetter sectors take more, mean-preserving),
    // the extra cost off the drier racing line and the water the spray comes from (engine/weather).
    sectorF: new Float64Array(n * 3).fill(1),
    offPen: new Float64Array(n),
    sprayH: new Float64Array(n),
    // Speed on the road this step (m/s), for the view and the tests (SIM-FISICA §3.7).
    v: new Float64Array(n),
    lapStart: new Float64Array(n),
    active: new Uint8Array(n),
    inPit: new Uint8Array(n),
    delay: new Float64Array(n),
    failTau: new Float64Array(n).fill(-1),
    failReason: new Array(n).fill(null),
    failCorner: new Int32Array(n),
    mistakeTau: new Float64Array(n).fill(-1),
    // RF-SIM-09: where on lap 1 a car meets its first-corner touch (state.turnOne), -1 if none.
    t1Tau: new Float64Array(n).fill(-1),
    mistakeCorner: new Int32Array(n),
    // WP8 (SIM-FISICA §3.6): how the error being paid is driven (race-physics.json mistake).
    mistakeSlow: new Float64Array(n).fill(1),
    spinLeft: new Float64Array(n),
    wideSign: new Int8Array(n),
    recoverUntil: new Float64Array(n),
    incident: new Array(n).fill(null),
    // SIM-7 errores-visibles: until when a paid error shows as LOCKUP (`lon`), and the trip through the run-off
    // (race-physics.json mistake.recovery): metres beyond the asphalt edge and on which side (+ right).
    lonUntil: new Float64Array(n),
    offM: new Float64Array(n),
    offSide: new Int8Array(n),
    // SIM-7: this lap's track-limits offence and debris puncture, at a corner (time share, -1 none; corner -1 = unknown).
    limitsTau: new Float64Array(n).fill(-1),
    limitsCorner: new Int32Array(n).fill(-1),
    debrisTau: new Float64Array(n).fill(-1),
    debrisCorner: new Int32Array(n).fill(-1),
    debrisLimp: new Float64Array(n),
    lapFlags: new Uint8Array(n),
    lat: new Float64Array(n),
    latTarget: new Float64Array(n),
    // WP4: what each car is doing sideways (lateral.js LANE), for the view.
    latState: new Uint8Array(n),
    // SIM-2 (RF-SIM-07): the era's car box, the room across this circuit's measured asphalt and
    // each car's lateral speed (lateral.js, race-physics.json lateral).
    side: lateralSetup(track, rules.year ?? state.year, n),
    // RF-STF-02 (WP8): the driver's time density in braking zones and corners, this lap's noise per
    // corner (accuracy) and the factor that keeps the lap at its budget (driverLap).
    drvBrake: new Float64Array(n).fill(1),
    drvCorner: new Float64Array(n).fill(1),
    drvNorm: new Float64Array(n).fill(1),
    cornerNoise: new Float64Array(n * Math.max(1, tables.nCorners)),
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
    // SIM-5 (F1M24-GAMEPLAY §2.11, RF-SIM-10): the safety car on the ring or the VSC delta (safetyCar.js), the SC's
    // speed profile on this circuit, and the side a lapped car let through goes by on (lateral.js).
    neutral: null,
    scProfile: null,
    unlapSide: null,
    unlapShare: SC_BALANCE.sc.unlapLateralShare,
    // RF-SIM-09: the era's scale of duel touches against f1db (race-reliability.json calibration.stepCollision).
    collisionScale: calibrationFor(rules.year ?? state.year).stepCollision,
    // RF-SIM-01 / RF-SIM-02 / RF-DEV-01: the era's power unit and gearbox, fitted to this circuit, and each car's drive state.
    ...driveSetup(rules.year ?? state.year, track, tables, n, rules),
    // SIM-3 (RF-SIM-10, RF-SIM-15): the era's start procedure with its seeded wait, the PRE_START phase if asked for,
    // and the cooldown lap after the flag (race-sim.json start / cooldown, era-defaults.json startProcedure).
    startPlan: startPlanOf(rules, balance, seed),
    pre: null,
    cool: new Uint8Array(n),
    coolEnd: new Float64Array(n),
    coolP: new Float64Array(n),
    coolLat: new Float64Array(n),
    coolV: new Float64Array(n),
    cooling: 0,
    finishedCount: 0,
    // SIM-4 (F1M24-GAMEPLAY §1.7): battle states, duel events and the battle radio (duel.js); the timing lines
    // of a lap - the two sector lines, as time shares - for `pass.confirmedAt`.
    ...battleSetup(n, [tables.tauAt(sectorStarts[1]), tables.tauAt(sectorStarts[2])].filter((tau) => tau > 0 && tau < 1).sort((a, b) => a - b)),
    // SIM-8 (SIM-FISICA §3.5): the fights per pair - tries, cool-downs, switchbacks, the claim's exit and the squeeze.
    ...duelGeometrySetup(n),
    // SIM-8 trafico-sesion: "race" (everything) or "session" (setStepMode: no duels, no grid, no pit wall).
    mode: SIM_MODE.RACE,
    onLine: null,
    sessionYield: new Uint8Array(n),
  };
  // RF-SIM-04 / RF-SIM-05 (engine/energy.js): the era's energy store and fuel flow on this circuit.
  Object.assign(sim, energySetup(state, rules, tables, sim.pt, n));
  for (let i = 0; i < n; i += 1) sim.order[i] = i;
  state._sim = sim;
  state.mode = "step";
  state.clock = 0;
  state.duels = [];
  state.safetyCarSpells = [];
  if (!state.investigations) state.investigations = [];
  sim.retireAt = (i, reason, corner) => retireCar(state, i, reason, corner);
  // RF-SIM-10: after a touch's debris race control may have called the SC/VSC or a yellow.
  sim.afterIncident = () => {
    if (state.safetyCar && state.safetyCar.since === undefined) state.safetyCar.since = scSince(state);
    syncYellows(state);
  };
  sim.raceControl = () => raceControl(state);
  state.cars.forEach((car, i) => {
    car.defence = car.defence || balance.defence.default;
    car.overtakeRisk = car.overtakeRisk || balance.risk.default;
    const profile = profileFactorsOf(car);
    sim.drvBrake[i] = profile.brake;
    sim.drvCorner[i] = profile.corner;
    // SIM-6: the view's heat starts at the grid's (race.js createRace gridSet).
    syncHeat(state, i);
  });
  if (preStart) sim.pre = preStartOf(state, preStart);
  return state;
};

// ------------------------------------------------------------- the start

/**
 * SIM-3 (RF-SIM-10, RF-SIM-15, RNF-05): the season's start procedure (era-defaults.json or the pack's
 * `startProcedure`: "fiveRed" or "redGreen", with or without a formation lap) and its timing
 * (race-sim.json start.procedures). The wait after the last light is drawn here, once, on the race's
 * own `seed::step::start` stream: the other streams are untouched, so a race is the same with or
 * without its PRE_START and the same seed always gives the same lights.
 */
const startPlanOf = (rules, balance, seed) => {
  const cfg = balance.start;
  const era = (rules.regulations && rules.regulations.startProcedure) || null;
  const name = era && cfg && cfg.procedures[era.lights] ? era.lights : null;
  if (!name) return { procedure: null, formationLap: false, spec: null, holdSec: 0 };
  const spec = cfg.procedures[name];
  const hold = createStream(`${seed}::step::start`).range(spec.holdSec.min, spec.holdSec.max);
  return { procedure: name, formationLap: Boolean(era.formationLap), spec, holdSec: hold };
};

/** The grid slot of car index `i`, as a share of the lap behind the line (the quick mode's grid, race-sim.json grid). */
const gridBackOf = (sim, i) => (sim.balance.grid.poleBackMetres + i * sim.balance.grid.gapMetres) / sim.tables.length;

/**
 * SIM-3: the PRE_START phase, when the caller asks for it (`preStart: { formation: "drive" | "skip" }`;
 * without it the lights go out at the first step, as before). Times are seconds from the start of the
 * procedure: the formation lap (if the era has one and it is driven) - the pole car leaves at 0 and is
 * back in its slot after `formation.lapFactor` race laps, car k leaves k·departStaggerSec later and
 * stops k·arriveStaggerSec later (OpenF1, Baréin 2024) -, the grid settles for gridSettleSec once the
 * last car stops, the lights come on one every lightIntervalSec and go out after the seeded wait. The
 * step grid is shifted so the lights go out exactly on a step boundary: race time 0.
 */
const preStartOf = (state, options) => {
  const sim = state._sim;
  const plan = sim.startPlan;
  if (!plan.spec) return null;
  const cfg = sim.balance.start;
  const formation = plan.formationLap && options.formation !== "skip";
  const f = cfg.formation;
  const lapSec = state.race.baseLap * f.lapFactor;
  let tGrid = 0;
  if (formation) {
    for (let i = 0; i < sim.n; i += 1) if (state.cars[i].status === "running") tGrid = Math.max(tGrid, lapSec + i * f.arriveStaggerSec);
  }
  const lightTimes = [];
  for (let k = 0; k < plan.spec.lights; k += 1) lightTimes.push(tGrid + cfg.gridSettleSec + k * plan.spec.lightIntervalSec);
  const tOut = lightTimes[lightTimes.length - 1] + plan.holdSec;
  const kOut = Math.max(1, Math.ceil(tOut / sim.dt - 1e-9));
  const timeline = [];
  if (formation) timeline.push({ t: 0, type: "formation" });
  timeline.push({ t: tGrid, type: "grid" });
  lightTimes.forEach((t, k) => timeline.push({ t, type: "light", n: k + 1 }));
  const pre = { formation, skipped: false, lapSec, tGrid, lightTimes, tOut, k: 0, kOut, t0: tOut - kOut * sim.dt, t: 0, next: 0, timeline, phase: formation ? "formation" : "grid" };
  pre.t = pre.t0;
  pre.lit = 0;
  // The field on the grid (a lap before it, with a formation lap to drive), engines running and still.
  state.cars.forEach((car, i) => {
    if (car.status !== "running") return;
    sim.P[i] = -gridBackOf(sim, i) - (formation ? 1 : 0);
    sim.lat[i] = (car.grid % 2 ? -1 : 1) * sim.balance.grid.staggerMetres;
    sim.v[i] = 0;
  });
  return pre;
};

/** SIM-3: car `i`'s share of its formation lap at procedure time `t` (smooth away and smooth into its slot). */
const formationShare = (sim, pre, i, t) => {
  if (!pre.formation || pre.skipped) return 1;
  const f = sim.balance.start.formation;
  const from = i * f.departStaggerSec;
  const to = pre.lapSec + i * f.arriveStaggerSec;
  if (t <= from) return 0;
  if (t >= to) return 1;
  const u = (t - from) / (to - from);
  return u * u * (3 - 2 * u);
};

/** SIM-3: one step of the PRE_START phase - the formation lap driven, the grid, the lights (events on lap 0). */
const preStep = (state) => {
  const sim = state._sim;
  const pre = sim.pre;
  const { dt, tables } = sim;
  pre.k += 1;
  pre.t = pre.k >= pre.kOut ? pre.tOut : pre.t0 + pre.k * dt;
  const t = pre.t;
  while (pre.next < pre.timeline.length && pre.timeline[pre.next].t <= t + 1e-9) {
    const entry = pre.timeline[pre.next];
    pushEvent(state, 0, { type: entry.type, ...(entry.n ? { n: entry.n } : {}), t: Math.round(Math.max(0, entry.t) * 1000) / 1000 });
    pre.next += 1;
  }
  for (let i = 0; i < sim.n; i += 1) {
    if (state.cars[i].status !== "running") continue;
    const P = -gridBackOf(sim, i) - 1 + formationShare(sim, pre, i, t);
    sim.v[i] = Math.max(0, ((P - sim.P[i]) * tables.length) / dt);
    sim.P[i] = P;
    const bin = Math.min(tables.M - 1, (frac(P) * tables.M) | 0);
    updateDrive(sim.pt, sim.drive, i, sim.v[i], sim.kappaBin[bin], dt, { coast: false, stopped: sim.v[i] === 0, full: false });
  }
  let lit = 0;
  for (let k = 0; k < pre.lightTimes.length; k += 1) if (t + 1e-9 >= pre.lightTimes[k]) lit = k + 1;
  pre.lit = lit;
  pre.phase = lit > 0 ? "lights" : pre.formation && !pre.skipped && t < pre.tGrid - 1e-9 ? "formation" : "grid";
};

/**
 * SIM-3: the formation lap is skippable ("1x o saltable"): the field is put back in its slots and the
 * procedure goes on from the grid. Nothing the race reads changes (no stream, no car state but the pose).
 */
export const skipFormation = (state) => {
  const sim = state._sim;
  const pre = sim && sim.pre;
  if (!pre || sim.started || !pre.formation || pre.skipped || pre.t >= pre.tGrid) return state;
  pre.skipped = true;
  const left = pre.tOut - pre.tGrid;
  pre.kOut = pre.k + Math.max(1, Math.ceil(left / sim.dt - 1e-9));
  pre.t0 = pre.tOut - pre.kOut * sim.dt;
  pre.t = pre.t0 + pre.k * sim.dt;
  pre.phase = "grid";
  state.cars.forEach((car, i) => {
    if (car.status !== "running") return;
    sim.P[i] = -gridBackOf(sim, i);
    sim.v[i] = 0;
  });
  return state;
};

/**
 * SIM-3 / F1M24-GAMEPLAY §1.7 `snapshot.start`: `{ phase: "formation"|"grid"|"lights"|"out", lights: 0..5, t }`,
 * with `t` the seconds since the procedure began (the time of lights out, when they are out) and the era's
 * `procedure` ("fiveRed" | "redGreen": with "redGreen", "out" is the green light). Without a PRE_START the
 * field is on the grid until the first step and the lights go out at race time 0.
 */
export const startOf = (state) => {
  const sim = state._sim;
  const pre = sim.pre;
  const procedure = sim.startPlan.procedure;
  if (sim.started) return { phase: "out", lights: 0, t: pre ? Math.round(pre.tOut * 1000) / 1000 : 0, procedure };
  if (!pre) return { phase: "grid", lights: 0, t: 0, procedure };
  return { phase: pre.phase, lights: pre.lit, t: Math.max(0, pre.t), procedure, formation: pre.formation && !pre.skipped };
};

/**
 * RF-SIM-01 / RF-SIM-02 / RF-DEV-01 (powertrain.js): the power unit and gearbox of the era with the
 * ratios fitted to this circuit's reference top speed (or the season's, since 2014), the curvature
 * per distance bin for lateral g, the lift-and-coast plan of the lean mix (no refuelling only: its
 * time is the quick mode's lean-mix time) and the straights' band weight for each car's power share.
 */
const driveSetup = (year, track, tables, n, rules) => {
  let top = 0;
  for (let j = 0; j < tables.M; j += 1) if (tables.vRef[j] > top) top = tables.vRef[j];
  const pt = powertrainFor({ year, layoutRef: track.ref || null, circuitTop: top > 0 ? top : null });
  let straightSens = Infinity;
  for (let j = 0; j < tables.M; j += 1) if (tables.sens[j] < straightSens) straightSens = tables.sens[j];
  return {
    pt,
    drive: createDrive(n),
    kappaBin: curvatureBins(track, tables.M),
    // Where the reference trace is on the power (1), per time-share bin: full throttle there, and on
    // the top-speed plateau (holding the top speed down a straight is flat out, race-physics.json
    // trace.fullThrottleTopShare).
    fullBin: Uint8Array.from(tables.vRef, (v, j) => (tables.vRef[(j + 1) % tables.M] > v * 1.0005 || v >= top * FULL_TOP_SHARE ? 1 : 0)),
    coast: rules.refuelling ? null : coastPlan(tables, pt, mixEffect("lean").time),
    straightSens: Number.isFinite(straightSens) ? straightSens : 1,
  };
};

/**
 * RF-SIM-04 / RF-SIM-05 (engine/energy.js): the circuit's energy plan for the era's store (deploy
 * order, the trace's harvest, the reference deployment the quick mode's energy times are measured
 * against), the fuel era, and per-car typed arrays: state of charge (MJ), the lap's deployment and
 * harvest, the energy time and where it is spent (ranks [kLo, kHi) of the plan), power now,
 * clipping, and the fuel the lap has burnt against the ledger's.
 */
const energySetup = (state, rules, tables, pt, n) => {
  const spec = ersSpecOf(rules);
  const drive = spec ? traceDriveOf(tables, pt) : null;
  const plan = spec && drive ? energyPlanOf(tables, drive, spec) : null;
  const fuelSpec = state.fuelSpec || { kgPerLap: 1 };
  return {
    ers: plan && plan.K > 0 ? { spec, plan, kers: Boolean(rules.energy.kers), refDeploy: referenceDeployOf({ rules, spec, plan }) } : null,
    fuelEra: fuelEraOf(rules.year ?? state.year),
    kgPerLap: fuelSpec.kgPerLap,
    // The race's real lap over the circuit the engine drives (engine/energy.js geometryScaleOf).
    fuelGeo: fuelSpec.geometryScale ?? 1,
    en: {
      soc: new Float64Array(n),
      planned: new Float64Array(n),
      lapDep: new Float64Array(n),
      lapHarv: new Float64Array(n),
      kCar: new Int32Array(n),
      kLo: new Int32Array(n),
      kHi: new Int32Array(n),
      eTime: new Float64Array(n),
      eRate: new Float64Array(n),
      deployKw: new Float64Array(n),
      harvestKw: new Float64Array(n),
      clip: new Uint8Array(n),
      lapFuel: new Float64Array(n),
      ledgerKg: new Float64Array(n),
      flow: new Float64Array(n),
    },
  };
};

/**
 * RF-SIM-05 / RF-CMD-01: car `i`'s energy this lap - what its mode deploys from a store that held
 * `battery` % at the line (engine/energy.js lapDeployOf), and where the lap's energy time
 * `energyTime` (s, the quick mode's) goes: the ranks between the reference deployment and the car's,
 * at least `minDeployShare` of the lap wide. Out of those cells the budget is spent as before.
 */
const planEnergy = (state, i, battery, energyTime) => {
  const sim = state._sim;
  const { en, ers } = sim;
  const car = state.cars[i];
  en.eTime[i] = 0;
  en.eRate[i] = 0;
  en.kLo[i] = 0;
  en.kHi[i] = 0;
  en.kCar[i] = 0;
  en.planned[i] = 0;
  if (!ers || car.battery === null || car.battery === undefined) return;
  // SIM-7: the battle assist's mode for this lap when it differs from the pit wall's (race.js lapBudget car.ersLap).
  const deploy = lapDeployOf({ rules: sim.rules, spec: ers.spec, plan: ers.plan, mode: car.ersLap || car.ersMode, battery });
  const kCar = cellsFor(ers.plan, deploy);
  en.kCar[i] = kCar;
  en.planned[i] = deploy;
  if (!energyTime) return;
  const kRef = cellsFor(ers.plan, ers.refDeploy);
  let lo = Math.min(kCar, kRef);
  let hi = Math.max(kCar, kRef);
  const least = Math.min(ers.plan.K, Math.ceil(ENERGY.step.minDeployShare * ers.plan.M));
  if (hi - lo < least) {
    hi = Math.min(ers.plan.K, lo + least);
    lo = Math.max(0, hi - least);
  }
  if (hi <= lo) return;
  en.kLo[i] = lo;
  en.kHi[i] = hi;
  en.eTime[i] = energyTime;
  en.eRate[i] = (energyTime * ers.plan.M) / (hi - lo);
};

/** A step race from the same arguments as race.js createRace (RF-SIM-01). */
export const createStepRace = (args) => fromQuickRace(createRace(args), { race: args.race, preStart: args.preStart || null });

/** The lights go out: grid slots behind the line and every car's first lap planned. */
const start = (state) => {
  const sim = state._sim;
  const { tables, balance } = sim;
  sim.started = true;
  // SIM-3 (RNF-05): what the PRE_START did to the drive state is dropped, so the race is the one without it.
  if (sim.pre) sim.drive = createDrive(sim.n);
  beginLeaderLap(state, 1);
  // SIM-3 / F1M24-GAMEPLAY §1.7: the lights go out (race time 0; `t` on the procedure's clock).
  pushEvent(state, 1, { type: "lightsOut", t: sim.pre ? Math.round(sim.pre.tOut * 1000) / 1000 : 0 });
  state.cars.forEach((car, i) => {
    const back = gridBackOf(sim, i);
    sim.P[i] = -back;
    sim.tau[i] = tauAtD(tables, 1 - back) - 1;
    sim.laps[i] = 0;
    sim.active[i] = car.status === "running" ? 1 : 0;
    sim.v[i] = 0;
    sim.lat[i] = (car.grid % 2 ? -1 : 1) * balance.grid.staggerMetres;
    // RF-SIM-01: a standing start in first gear, limited by traction until the car reaches the trace.
    sim.drive.launching[i] = sim.active[i];
    sim.drive.vLaunch[i] = 0;
    sim.drive.gear[i] = 1;
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

/**
 * WP3 (SIM-FISICA §3.0): how much slower than the physical trace this lap's budget is, as a
 * share of the budget, within race-physics.json `budget.share`. The car spends
 * budget × (1 − dev + dev × sens(tau)) per unit of time share, so the extra time goes to the
 * corners (tyres, fuel, grip) and little to the straights (power), and the lap still lasts
 * exactly its budget (sens has mean 1). 0 without a trace (uniform scaling, as before).
 */
const devOf = (tables, budget) => {
  if (!tables.traceLap) return 0;
  const [lo, hi] = physicsData.budget.share;
  return clamp((budget - tables.traceLap) / budget, lo, hi);
};

/**
 * RF-STF-02 (WP8, SIM-FISICA §3.3/§3.6): the driver's share of the lap. A good braker spends
 * less of the lap in the braking zones, a good corner driver less in the corners (drvBrake,
 * drvCorner), and every corner gets this lap's noise of the driver's accuracy, zero mean over
 * the corners' time; `drvNorm` rescales so the lap still lasts exactly its budget (SRS 4.2).
 */
const driverLap = (state, i) => {
  const sim = state._sim;
  const { tables } = sim;
  const K = tables.nCorners;
  const base = i * Math.max(1, K);
  if (K > 0) {
    const sigma = cornerNoiseSigmaOf(state.cars[i]);
    let mean = 0;
    let weight = 0;
    for (let k = 0; k < K; k += 1) {
      const e = sim.streams.corners.normal(0, sigma);
      sim.cornerNoise[base + k] = e;
      mean += e * tables.cornerTimeK[k];
      weight += tables.cornerTimeK[k];
    }
    mean = weight > 0 ? mean / weight : 0;
    for (let k = 0; k < K; k += 1) sim.cornerNoise[base + k] = Math.max(-0.5, sim.cornerNoise[base + k] - mean);
  }
  const dev = sim.dev[i];
  let plain = 0;
  let shaped = 0;
  for (let j = 0; j < tables.M; j += 1) {
    const b = (1 - dev + dev * tables.sens[j]) * sim.sectorF[i * 3 + tables.sectorOf[j]];
    plain += b;
    shaped += b * driverShape(sim, i, j, base);
  }
  sim.drvNorm[i] = shaped > 0 ? plain / shaped : 1;
};

/** The driver's time-density factor in bin `j` before normalising (driverLap). */
const driverShape = (sim, i, j, base) => {
  const { tables } = sim;
  const c = tables.cls[j];
  const k = tables.cornerIx[j];
  return (c === 1 ? sim.drvBrake[i] : c === 2 ? sim.drvCorner[i] : 1) * (k >= 0 ? 1 + sim.cornerNoise[base + k] : 1);
};

/** Plan car `i`'s lap `lap`, starting at race time `t`. */
const beginLap = (state, i, lap, t) => {
  const sim = state._sim;
  const car = state.cars[i];
  const stream = sim.streams.laps;
  sim.lapStart[i] = t;
  sim.lapFlags[i] = state.safetyCar ? 1 : 0;
  rivalCalls(state, car, lap);
  // RF-SIM-04 / RF-SIM-05: the ledgers at the line, before the lap model moves them.
  const batteryBefore = car.battery;
  const fuelBefore = car.fuel;
  const lapOut = sim.lapOut;
  lapOut.energyTime = 0;
  // SIM-6: the view's tyre heat back on the lap model's before this lap is planned (planLap moves it to the lap's end).
  heatAtLine(state, i);
  let budget = planLap(state, car, lap, stream, { gridIndex: i, scrumShare: sim.balance.lapOne.scrumShare }, lapOut);
  const en = sim.en;
  en.lapFuel[i] = 0;
  en.lapDep[i] = 0;
  en.lapHarv[i] = 0;
  // The fuel this lap burns by the quick mode's model (laps of fuel x kg a lap).
  en.ledgerKg[i] = Math.max(0, (fuelBefore - car.fuel) * sim.kgPerLap);
  // KERS: the 400 kJ come back at the line; ERS: the store holds what the ledger says.
  if (sim.ers && batteryBefore !== null && batteryBefore !== undefined) en.soc[i] = sim.ers.kers ? sim.ers.spec.storeMJ : (batteryBefore / 100) * sim.ers.spec.storeMJ;
  planEnergy(state, i, batteryBefore, lapOut.energyTime);
  const t1 = lap === 1 && state.turnOne ? state.turnOne : null;
  if (lap === 1) {
    // The quick mode staggers the start by START_SPACING a slot; here the slot is physical.
    // RF-SIM-09: the launch against the median (state.turnOne), as the quick mode adds it to lap 1.
    budget = (budget + i * START_SPACING + (t1?.launch[car.id] || 0)) / (1 - sim.tau[i]);
  }
  sim.t1Tau[i] = -1;
  // RF-SIM-09: a first-corner touch happens at that corner's apex on lap 1.
  if (t1 && t1.outcomes[car.id]) sim.t1Tau[i] = apexTauOf(sim, t1.corner, sim.streams.incidents);
  // Lift and coast (powertrain.js coastPlan): on the lean mix the car coasts before the braking
  // zones instead of losing the mix's time evenly; the budget gives that time to the coasting.
  const drive = sim.drive;
  drive.debt[i] -= drive.allowance[i];
  drive.allowance[i] = 0;
  drive.coastZone[i] = 0;
  drive.coasting[i] = sim.coast && car.fuelMode === "lean" ? 1 : 0;
  if (drive.coasting[i]) budget -= sim.coast.loss;
  sim.budget[i] = Math.max(1, budget);
  sim.dev[i] = devOf(sim.tables, sim.budget[i]);
  // The car's share of the era's peak power: its straight-line speed against the reference trace, cubed (drag).
  const straight = sim.tables.traceLap ? sim.tables.traceLap / (sim.budget[i] * (1 - sim.dev[i] + sim.dev[i] * sim.straightSens)) : 1;
  drive.powerShare[i] = straight >= 1 ? 1 : straight * straight * straight;
  wetLap(state, i, lap);
  driverLap(state, i);
  sim.mistakeTau[i] = -1;
  if (car.pendingMistake) {
    const corner = mistakeCorner(state, stream);
    sim.mistakeCorner[i] = corner ?? 0;
    sim.mistakeTau[i] = apexTauOf(sim, corner, stream);
  }
  sim.failTau[i] = -1;
  // A car whose race ends in the first corner does not roll a failure on that lap (as in the quick mode).
  const failure = t1 && t1.outcomes[car.id]?.kind === "retire" ? null : rollFailure(state, car, lap, sim.streams.incidents);
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
  lapExtras(state, i, lap);
};

/**
 * SIM-7 (errores-visibles, danos-visibles): the quick mode's per-lap rolls, at the line on their own streams -
 * a track-limits offence (judged at its corner, checkpoints), floor damage (from the next lap, as the quick
 * mode) and a puncture on debris (paid at the debris' corner).
 */
const lapExtras = (state, i, lap) => {
  const sim = state._sim;
  const car = state.cars[i];
  const sc = state.safetyCar;
  car.lapDeleted = false;
  sim.limitsTau[i] = -1;
  const limits = rollTrackLimits(state, car, { rules: sim.rules, wetness: wetnessAt(state, lap), sc, stream: sim.streams.limits });
  if (limits !== undefined) {
    sim.limitsCorner[i] = limits ?? -1;
    sim.limitsTau[i] = apexTauOf(sim, limits ?? null, sim.streams.limits);
  }
  rollFloorDamage(state, car, { lap, kind: car.pendingMistake ? car.mistakeKind : null, rules: sim.rules, sc, stream: sim.streams.damage });
  sim.debrisTau[i] = -1;
  const debris = debrisPass(state, car, { raceLap: sim.leaderLap, stream: sim.streams.damage });
  if (debris) {
    sim.debrisCorner[i] = debris.corner ?? -1;
    sim.debrisLimp[i] = debris.limp;
    sim.debrisTau[i] = apexTauOf(sim, debris.corner ?? null, sim.streams.damage);
  }
};

/**
 * RF-SIM-11 (step mode): the wet lap of car `i`. The quick mode's budget (lapBudget, from the
 * line's mean water) is shared out over the three sectors by the compound's grip ratio on each
 * sector's water, normalised so the lap still lasts exactly its budget (SRS 4.2):
 * f_k = r_k / Σ_j G_j r_j, with G_j the sector's weighted time share. Off the racing line the
 * track is wetter: the cost of the compound there against on the line (`offPen`), paid only by
 * a car away from the line (advance). The spray comes from the line's water (lap 2 on).
 */
const wetLap = (state, i, lap) => {
  const sim = state._sim;
  const weather = state.weather;
  const base = i * 3;
  const k = Math.min(Math.max(0, lap), state.laps);
  const h = weather.water ? weather.water[k] ?? 0 : 0;
  if (!(h > 0) && !(weather.offLine && weather.offLine[k] > 0)) {
    sim.sectorF[base] = 1;
    sim.sectorF[base + 1] = 1;
    sim.sectorF[base + 2] = 1;
    sim.offPen[i] = 0;
    sim.sprayH[i] = 0;
    return;
  }
  const { sectorTime, sectorSens } = sim.tables;
  const compound = state.cars[i].compound;
  const dev = sim.dev[i];
  const sectors = weather.sectors[k];
  let norm = 0;
  for (let j = 0; j < 3; j += 1) norm += ((1 - dev) * sectorTime[j] + dev * sectorSens[j]) * gripRatio(compound, sectors[j]);
  for (let j = 0; j < 3; j += 1) sim.sectorF[base + j] = gripRatio(compound, sectors[j]) / norm;
  const onLine = gripRatio(compound, h);
  sim.offPen[i] = Math.max(0, (gripRatio(compound, weather.offLine[k]) - onLine) / onLine);
  sim.sprayH[i] = lap > 1 ? h : 0;
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
  // RF-CMD-01 / RF-SIM-13: the pace mode and fuel mix the lap was driven on, as in the quick mode.
  const entry = { lap, start: sim.lapStart[i], end: tc, pit, compound: car.compound, mode: car.mode, mix: car.fuelMode };
  // RF-SIM-04 / RF-SIM-05: the lap's fuel as measured and as the ledger burnt it (kg), and the store's lap (MJ).
  const en = sim.en;
  entry.fuel = { kg: Math.round(en.lapFuel[i] * 1000) / 1000, model: Math.round(en.ledgerKg[i] * 1000) / 1000 };
  if (sim.ers && car.battery !== null && car.battery !== undefined) {
    entry.ers = { deploy: Math.round(en.lapDep[i] * 1000) / 1000, harvest: Math.round(en.lapHarv[i] * 1000) / 1000, soc: Math.round(en.soc[i] * 1000) / 1000 };
  }
  // A lap spent in someone's air, held up or in a fight (not visible at the line).
  if (sim.lapFlags[i] & 24) entry.held = true;
  // A lap through a local yellow (RF-SIM-10).
  if (sim.lapFlags[i] & 32) entry.yellow = true;
  // SIM-7: a lap deleted for track limits (no best lap from it, as in the quick mode).
  if (sim.lapFlags[i] & 64) entry.deleted = true;
  car.history.push(entry);
  car.pit = null;
  if (!(sim.lapFlags[i] & 71) && (car.bestLap === null || lapTime < car.bestLap)) car.bestLap = lapTime;

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
    } else if (sc && sim.neutral && sim.neutral.ref === sc) {
      // SIM-5: the safety car's phases end it (safetyCar.js), the restart at this line in the "control" eras.
      neutralLine(state, pushEvent);
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
  // RF-SIM-13 / SRS 4.2: the pit wall decides this car's next lap now (rivalCalls), before the car
  // behind reaches the line; the interval to it is its time gap on the road (measureGaps), as the
  // quick mode reads the gap at the end of the same lap - not last lap's crossing (one lap stale).
  const behind = sim.behind[i];
  car.gapBehind = behind >= 0 && sim.lapDiff[behind] === 0 && sim.active[behind] && sim.gapS[behind] < baseLap * 0.5 ? sim.gapS[behind] : null;
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
  // SIM-4 (RF-CMD-03): the gaps at this line, and the engineer if the player's car is catching or being caught.
  lineRadio(state, i);

  if (lap >= state.laps) {
    car.status = "finished";
    sim.active[i] = 0;
    // SIM-3 / F1M24-GAMEPLAY §1.7: the flag for this car (`pos` = its place on the road at the line), then its cooldown lap.
    sim.finishedCount += 1;
    pushEvent(state, lap, { type: "finished", carId: car.id, t: Math.round(tc * 1000) / 1000, pos: sim.finishedCount });
    sim.cool[i] = 1;
    sim.coolEnd[i] = lap + 1;
    sim.coolP[i] = sim.P[i];
    sim.coolLat[i] = sim.lat[i];
    sim.coolV[i] = sim.v[i];
    sim.cooling += 1;
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
    // Seconds at this car's pace over that stretch: its time share times its local density (WP3).
    const dev = sim.dev[i];
    sim.gapS[i] = frac(tauAtD(tables, frac(P[a])) - frac(tau[i])) * budget[i] * (1 - dev + dev * sensAt(tables, tau[i]));
    sim.lapDiff[i] = Math.round(P[a] - P[i] - gapD);
    // SIM-8: in a session the lap counts mean nothing on the road - one lap for all, except that a car giving
    // way (on its out- or in-lap, setSessionYield) is let by as a lapped car is in a race (blue flags).
    if (sim.mode === SIM_MODE.SESSION) sim.lapDiff[i] = sim.sessionYield[a] && !sim.sessionYield[i] ? -1 : 0;
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
export const airEffect = (sim, budget, gapSec, corner, dev = 0) => {
  const { dirtyAir, slipstream } = sim.balance;
  // The share of this car's lap time spent in corners, with its budget spent by band (WP3).
  const cornerShare = (1 - dev) * sim.tables.cornerTime + dev * (sim.tables.cornerSens ?? sim.tables.cornerTime);
  if (corner) return gapSec < dirtyAir.windowSec ? -(sim.dirtyLoss * (1 - gapSec / dirtyAir.windowSec)) / budget / cornerShare : 0;
  return gapSec < slipstream.windowSec ? (sim.slipGain * (1 - gapSec / slipstream.windowSec)) / budget / (1 - cornerShare) : 0;
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
  // SIM-7 (mistake.recovery.path): out through the run-off while the error is paid, then back to the asphalt.
  if (sim.offSide[i] !== 0) {
    if (sim.incident[i]) sim.offM[i] = Math.min(RECOVERY.runoffMetres, sim.offM[i] + RECOVERY.outRate * dt);
    else {
      sim.offM[i] = Math.max(0, sim.offM[i] - RECOVERY.rejoinRate * dt);
      if (sim.offM[i] === 0) sim.offSide[i] = 0;
    }
  }
  const a = sim.ahead[i];
  const gapS = sim.gapS[i];
  const gapM = sim.gapM[i];
  const d0 = frac(sim.P[i]);
  const dev = sim.dev[i];
  const cell = Math.min(tables.M - 1, (frac(sim.tau[i]) * tables.M) | 0);
  // RF-SIM-05: the lap's energy time is spent where the deployment differs (planEnergy), the rest as before.
  const en = sim.en;
  const base = (1 - dev + dev * tables.sens[cell]) * sim.sectorF[i * 3 + tables.sectorOf[cell]] * driverShape(sim, i, cell, i * Math.max(1, tables.nCorners)) * sim.drvNorm[i];
  let span = (sim.budget[i] - en.eTime[i]) * base;
  if (en.eRate[i] !== 0) {
    const r = sim.ers.plan.rank[cell];
    if (r >= en.kLo[i] && r < en.kHi[i]) span += en.eRate[i];
  }
  const floor = 0.5 * sim.budget[i] * base;
  let rate = 1 / (span > floor ? span : floor);
  let mult = 1;

  const N = sim.neutral && sim.neutral.ref === sc ? sim.neutral : null;
  if (sc && sim.inPit[i] === 0 && N) {
    // SIM-5: the VSC delta, or the train behind the safety car on the ring (safetyCar.js).
    rate = N.virtual ? Math.min(rate, vscRate(sim, N, i, baseLap)) : scRateCap(state, i, rate);
    sim.lapFlags[i] |= 1;
  } else if (sc && sim.inPit[i] === 0) {
    const scRate = 1 / (baseLap * (sc.virtual ? balance.safetyCar.virtualLapFactor : balance.safetyCar.lapFactor));
    if (sc.virtual) rate = Math.min(rate, scRate);
    else if (a >= 0 && sim.lapDiff[i] >= 0 && gapM > balance.safetyCar.trainGapMetres && car.position > 1) rate = Math.min(rate, scRate * balance.safetyCar.catchUp);
    else rate = Math.min(rate, scRate);
    sim.lapFlags[i] |= 1;
  } else if (a >= 0 && sim.inPit[i] === 0) {
    const inTurn = inCorner(tables, d0);
    // WP5: in a corner, the era's loss spread by speed band (fast corners lose most).
    mult += airEffect(sim, sim.budget[i], gapS, inTurn, sim.dev[i]) * (inTurn ? dirtyAt(tables, sim.tau[i]) : 1);
    if (gapS < balance.traffic.followWindowSec) sim.lapFlags[i] |= 8;
    // RF-SIM-11: the spray of the car ahead, all round the lap (the quick mode adds it to the wake).
    if (sim.sprayH[i] > 0) mult -= sprayLossOf(sim.sprayH[i], gapS) / sim.budget[i];
    if (sim.drsOpen[i] > 0) mult += balance.drs.speedGain;
    // SIM-7 tacticas: in clean-air mode the driver lifts within the target gap, maxDropSecPerLap a lap (as the quick mode).
    if (car.tactics && car.tactics.cleanAir && sim.lapDiff[i] === 0 && gapS < TACTICS.cleanAir.targetGapSec) mult -= TACTICS.cleanAir.maxDropSecPerLap / sim.budget[i];
    // Blue flags: a car about to be lapped moves over, once per car lapping it; both
    // lose the quick mode's time for it (race.js blueFlags).
    if (sim.lapDiff[i] < 0 && gapM < balance.blueFlags.windowMetres && !(sim.blueBy[a] === i && sim.blueUntil[a] > sim.clock)) {
      sim.blueBy[a] = i;
      sim.blueUntil[a] = sim.clock + balance.blueFlags.cooldownSec;
      sim.blueDelay[a] += balance.blueFlags.lappedDelay;
      sim.blueDelay[i] += balance.blueFlags.lapperDelay;
    }
  }
  // SIM-2: a pass keeps its edge until it is made (settleDuels), not only through the corner.
  if (sim.duelUntil[i] > sim.clock || sim.duelRole[i] === ROLE.PASSING || sim.duelRole[i] === ROLE.YIELDING) {
    // WP4 (SIM-FISICA §3.3): on a straight the fight is tow and DRS, not extra top speed; the
    // move is made under braking and through the corner (race-sim.json duel.straight).
    const edge = sim.duelMult[i];
    const straight = balance.duel.straight;
    mult += inCorner(tables, d0) ? edge : edge > 0 ? Math.min(edge, straight.attackerBoost) : Math.max(edge, -straight.defenderLoss);
    sim.lapFlags[i] |= 16;
  }
  if (sim.delay[i] > 0) {
    // WP8: a spin stops the car first (v = 0), then it pays the rest at its kind's pace; a
    // contact's delay (duel.js) is paid at the old pace.
    if (sim.spinLeft[i] > 0) {
      mult = 0;
      const paid = Math.min(dt, sim.spinLeft[i], sim.delay[i]);
      sim.spinLeft[i] -= paid;
      sim.delay[i] = Math.max(0, sim.delay[i] - paid);
    } else {
      const slow = sim.incident[i] ? sim.mistakeSlow[i] : balance.mistake.slowFactor;
      mult *= slow;
      sim.delay[i] = Math.max(0, sim.delay[i] - dt * (1 - slow));
    }
    if (sim.delay[i] <= 0 && sim.incident[i]) {
      sim.recoverUntil[i] = sim.clock + physicsData.mistake.recoverySec;
      sim.incident[i] = null;
    }
    sim.lapFlags[i] |= 16;
  } else if (sim.blueDelay[i] > 0) {
    const slow = balance.blueFlags.slowFactor;
    mult *= slow;
    sim.blueDelay[i] = Math.max(0, sim.blueDelay[i] - dt * (1 - slow));
    sim.lapFlags[i] |= 16;
  } else if (sim.squeezeDelay[i] > 0) {
    // SIM-8: squeezed on an exit - a lift (race-physics.json duel.geometry.squeeze.liftFactor), not an error's crawl.
    const slow = DUEL_GEOMETRY.squeeze.liftFactor;
    mult *= slow;
    sim.squeezeDelay[i] = Math.max(0, sim.squeezeDelay[i] - dt * (1 - slow));
    sim.lapFlags[i] |= 16;
  }
  // RF-SIM-05: 2026's overtake mode, by distance - within the era's gap of the car ahead
  // on the same lap, more deployment (the era's overtake row against deploy), more drain.
  const ot = sim.overtake;
  if (ot) {
    const on = !sc && a >= 0 && sim.inPit[i] === 0 && (car.ersLap || car.ersMode) === "overtake" && sim.lapDiff[i] === 0 && gapS < ot.gap && (car.battery ?? 0) > ot.minCharge;
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
  // RF-SIM-11: away from the racing line the track is wetter (race-weather.json offLine).
  if (sim.offPen[i] > 0) {
    const off = WEATHER_BALANCE.offLine;
    const away = Math.abs(sim.lat[i]) - off.lineHalfWidthM;
    if (away > 0) mult /= 1 + sim.offPen[i] * Math.min(1, away / (off.fullAtM - off.lineHalfWidthM));
  }
  mult = shapeDrive(state, i, cell, rate, Math.max(0, mult), sc);
  const tau0 = sim.tau[i];
  let tau1 = tau0 + rate * mult * dt;
  const laps = sim.laps[i];
  // SIM-2: never backwards - the time-share table inverts distance to a hair, and a gated car sits
  // where the gate put it (lateral.js gateBoxes), not where its time share maps back.
  let P1 = laps + dAt(tables, tau1);
  if (P1 < sim.P0[i]) P1 = sim.P0[i];

  // Nobody drives through the car in front (unless passing it or lapping it).
  if (a >= 0 && sim.inPit[i] === 0) {
    const exempt =
      (sim.duelOther[i] === a && (sim.duelRole[i] === ROLE.PASSING || sim.duelRole[i] === ROLE.YIELDING)) ||
      (sim.lapDiff[i] < 0 && !sc) ||
      (sim.lapDiff[i] > 0 && !sc && gapM < balance.traffic.minGapMetres) ||
      // SIM-5 (art. 55.13): a lapped car let through passes the cars on the lead lap.
      unlapExempt(sim, i);
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
  // GS-03 (RF-SIM-06, F1M24-CHINA §2.1): a car settled behind another - the same car ahead for
  // traffic.minFollowSec.settleSec, no duel between them - keeps a gap in time, as a timing interval is: it is
  // never further on than the car ahead was minFollowSec ago (its own past places, followHist), nor closer than
  // minGapMetres. So it brakes where the car ahead braked, not when, and in a train it "breathes" by itself:
  // close in the slow corners, a few lengths back on the straights. Already inside that gap it gains nothing on
  // the car ahead this step - nobody is stopped or pushed back, the gap opens on pace. A car still closing in on
  // a new car ahead, or with the DRS open (an attack: the tow and the flap take it to the braking zone, where
  // the duel is decided, RF-SIM-08), runs free; so does everybody behind the safety car or the VSC, under a red
  // flag and between cars on different laps.
  if (a >= 0 && sim.inPit[i] === 0 && (sim.followOf[i] !== a || sim.duelOther[i] === a || sim.duelOther[a] === i || sim.drsOpen[i] !== 0)) {
    sim.followOf[i] = a;
    sim.followSince[i] = sim.clock;
  }
  if (
    a >= 0 && sim.inPit[i] === 0 && sim.minFollowSec > 0 && sim.clock - sim.followSince[i] >= sim.followSettleSec && !sc && !N && !sim.red &&
    sim.lapDiff[i] === 0 && !unlapExempt(sim, i)
  ) {
    const ahead = sim.P0[i] + frac(sim.P[a] - sim.P0[i]);
    const limit = Math.min(ahead - balance.traffic.minGapMetres / tables.length, ahead - (sim.P[a] - placeAgo(sim, a, sim.minFollowSec)));
    if (P1 > limit) {
      const keep = sim.P0[i] + Math.max(0, sim.P[a] - sim.P0[a]);
      const held = Math.max(sim.P0[i], Math.max(limit, Math.min(P1, keep)));
      if (held < P1) {
        P1 = held;
        tau1 = Math.max(tau0, tauAtD(tables, P1 - laps));
        sim.lapFlags[i] |= 8;
      }
    }
  }
  // SIM-5: the leader stays behind the safety car (the cars between them are waved by, art. 55.9).
  if (N && !N.virtual && sim.inPit[i] === 0) {
    const held = scLimit(sim, i, P1);
    if (held < P1) {
      P1 = held;
      tau1 = Math.max(tau0, tauAtD(tables, P1 - laps));
      sim.lapFlags[i] |= 8;
    }
  }
  // WP11: forming the grid behind a red flag - nobody drives past its slot.
  if (sim.red && sim.red.slot && Number.isFinite(sim.red.slot[i]) && P1 > sim.red.slot[i]) {
    P1 = Math.max(sim.P0[i], sim.red.slot[i]);
    tau1 = Math.max(tau0, tauAtD(tables, P1 - laps));
  }
  // SIM-2 (RF-SIM-07): no box runs into another - closer than a car's length only a car's width
  // apart sideways; otherwise the car lifts to stay nose to tail (lateral.js gateBoxes).
  if (sim.inPit[i] === 0 && a >= 0) {
    const gated = gateBoxes(sim, i, P1);
    if (gated < P1) {
      P1 = gated;
      tau1 = Math.max(tau0, tauAtD(tables, P1 - laps));
      sim.lapFlags[i] |= 8;
    }
  }
  sim.v[i] = ((P1 - sim.P0[i]) * tables.length) / dt;
  sim.P[i] = P1;
  sim.tau[i] = tau1;
  // SIM-5 (FIA art. 56.5): the VSC delta, minisector by minisector.
  if (N && N.virtual && sim.inPit[i] === 0) vscDeltaStep(sim, N, i, tau0, tau1, baseLap);
  checkpoints(state, i, tau0, Math.min(tau1, 1));
  if (sim.active[i] && tau1 >= 1) {
    const tc = sim.clock - dt + (dt * (1 - tau0)) / Math.max(1e-12, tau1 - tau0);
    sim.laps[i] = laps + 1;
    sim.tau[i] = tau1 - 1;
    // SIM-8: a session's line is its own (setStepMode onLine: timing, the next lap's budget, back to the garage).
    const going = sim.mode === SIM_MODE.SESSION && sim.onLine ? sim.onLine(state, i, laps + 1, tc) !== false : endLap(state, i, laps + 1, tc);
    if (going) checkpoints(state, i, 0, sim.tau[i]);
  }
};

/**
 * RF-SIM-01 / SRS 4.2 (powertrain.js): the two shapes of the trace the power unit makes, as a cap
 * on this step's speed, with the time they cost given back within the lap.
 *
 *   launch   from the grid the car is held to its own traction-limited launch speed until it
 *            reaches the trace (lap 1's budget already holds the quick mode's standing start);
 *   coast    on the lean mix, in a lift zone of the circuit's coast plan, it coasts on drag,
 *            engine braking and harvesting until the braking curve takes over; the zone's
 *            reference loss is the time the lap's budget gave up for it.
 *
 * `debt` is the time behind the budget the caps made (scaled by the step's multiplier, so the
 * traffic's own losses stay as they were), `allowance` the coasting the budget already paid for;
 * out of a cap the difference is repaid by at most launch.repayMaxShare of speed over the rest
 * of the lap. Under a safety car or a red flag everything is dropped (the train sets the pace).
 */
const shapeDrive = (state, i, cell, rate, mult, sc) => {
  const sim = state._sim;
  const drive = sim.drive;
  drive.lifted[i] = 0;
  if (sc || sim.inPit[i] !== 0 || sim.red) {
    drive.launching[i] = 0;
    drive.coastZone[i] = 0;
    drive.debt[i] = 0;
    drive.allowance[i] = 0;
    return mult;
  }
  const { tables, dt, pt } = sim;
  const vFree = (tables.dOfTau[cell + 1] - tables.dOfTau[cell]) * tables.M * tables.length * rate * mult;
  let capped = false;
  let out = mult;
  if (drive.launching[i]) {
    const vl = drive.vLaunch[i] + launchAccel(pt, drive.vLaunch[i]) * dt;
    drive.vLaunch[i] = vl;
    if (vFree > vl && vFree > 0) {
      const c = vl / vFree;
      drive.debt[i] += dt * mult * (1 - c);
      out = mult * c;
      capped = true;
    } else drive.launching[i] = 0;
  }
  const zone = drive.coasting[i] && sim.coast ? sim.coast.zoneOf[cell] : 0;
  if (zone > 0 && !capped) {
    if (drive.coastZone[i] !== zone) {
      drive.coastZone[i] = zone;
      drive.vCoast[i] = sim.v[i] > 0 ? sim.v[i] : vFree;
      drive.allowance[i] += sim.coast.zones[zone - 1].loss;
    }
    const vc = drive.vCoast[i] - coastDecel(pt, drive.vCoast[i], drive.rpm[i]) * dt;
    drive.vCoast[i] = vc > 1 ? vc : 1;
    if (vFree > drive.vCoast[i]) {
      const c = drive.vCoast[i] / vFree;
      drive.debt[i] += dt * mult * (1 - c);
      out = mult * c;
      capped = true;
      drive.lifted[i] = 1;
    }
  } else if (zone === 0) drive.coastZone[i] = 0;
  const owed = drive.debt[i] - drive.allowance[i];
  if (!capped && (owed > 1e-4 || owed < -1e-4)) {
    const rest = sim.budget[i] * Math.max(0.05, 1 - sim.tau[i]);
    const most = POWERTRAIN.launch.repayMaxShare;
    const g = clamp(owed / rest, -most, most);
    drive.debt[i] -= dt * mult * g;
    out = mult * (1 + g);
  }
  return out;
};

/** Where on its lap a car with a broken suspension stops (the quick mode's share of that lap). */
const RETIRE_AT_LINE_TAU = 0.97;

/**
 * RF-SIM-09: car `i` reaches the first corner's touch of state.turnOne (the quick mode's
 * outcome, on the road): retirement there, or its delay, damage or puncture. True if it is out.
 */
const firstCorner = (state, i, lap) => {
  const sim = state._sim;
  const plan = state.turnOne;
  const car = state.cars[i];
  const outcome = plan.outcomes[car.id];
  const contact = plan.contacts.find((row) => row.ids.includes(car.id));
  const otherId = contact ? contact.ids.find((id) => id !== car.id) : null;
  if (outcome.kind === "retire") {
    pushEvent(state, lap, { type: "contact", carId: car.id, otherId, corner: plan.corner, outcome: "retire", turnOne: true });
    retireCar(state, i, "collision", plan.corner);
    return true;
  }
  sim.delay[i] += applyContact(state, car, outcome, { otherId, corner: plan.corner, stream: sim.streams.incidents, lap, raceLap: sim.leaderLap, turnOne: true });
  sim.afterIncident();
  return false;
};

/**
 * May car `i` go for the car ahead now? WP8: not while paying an error or getting back on the line (SIM-7: or
 * still off the road); SIM-7 tacticas: not within the target gap in clean-air mode (race-sim.json tactics.cleanAir).
 */
const mayAttack = (state, i) => {
  const sim = state._sim;
  const car = state.cars[i];
  const recovering = sim.incident[i] !== null || sim.recoverUntil[i] > sim.clock || sim.offM[i] > 0;
  const holding = car.tactics && car.tactics.cleanAir && sim.gapS[i] < TACTICS.cleanAir.targetGapSec;
  return !recovering && !holding;
};

/** Everything that happens between time shares `from` and `to` of car `i`'s lap. */
const checkpoints = (state, i, from, to) => {
  const sim = state._sim;
  const { tables } = sim;
  const car = state.cars[i];
  const lap = sim.laps[i] + 1;
  if (to <= from) return;
  // SIM-8 trafico-sesion: a session's car has no first-corner plan, no pit wall and no duels.
  const session = sim.mode === SIM_MODE.SESSION;

  if (!session && sim.t1Tau[i] >= 0 && (sim.t1Tau[i] > from && sim.t1Tau[i] <= to)) {
    sim.t1Tau[i] = -1;
    if (firstCorner(state, i, lap)) return;
  }
  // RF-SIM-09: a suspension broken in a touch - the car limps to the line and stops there.
  if (car.retireAtLine && lap >= car.retireAtLine && to >= RETIRE_AT_LINE_TAU) {
    retireCar(state, i, "collision", car.retireCorner ?? null);
    return;
  }
  if (sim.failTau[i] >= 0 && (sim.failTau[i] > from && sim.failTau[i] <= to)) {
    const corner = sim.failCorner[i] || null;
    sim.failTau[i] = -1;
    retireCar(state, i, sim.failReason[i], corner);
    return;
  }
  if (sim.mistakeTau[i] >= 0 && (sim.mistakeTau[i] > from && sim.mistakeTau[i] <= to)) {
    sim.mistakeTau[i] = -1;
    sim.delay[i] += car.pendingMistake;
    // WP8: the kind decides how the time goes (race-physics.json mistake.kinds).
    const how = physicsData.mistake.kinds[car.mistakeKind] || physicsData.mistake.kinds.lockup;
    sim.incident[i] = car.mistakeKind || "lockup";
    sim.mistakeSlow[i] = how.slowFactor;
    sim.spinLeft[i] = car.pendingMistake * how.stopShare;
    const turn = sim.tables.attacks.find((attack) => attack.corner === sim.mistakeCorner[i]);
    // Wide on the exit: to the outside of the corner (sign + = right-hander, outside = left).
    sim.wideSign[i] = how.wide ? -(turn?.sign ?? 1) : 0;
    // SIM-7 errores-visibles (F1M24-GAMEPLAY §1.7 lon[i], §2.10): the lock-up at the start of the error, and the
    // trip through the run-off on the outside for the kinds that leave the road (race-physics.json mistake.recovery).
    sim.lonUntil[i] = sim.clock + (how.lockupSec || 0);
    const recovery = physicsData.mistake.recovery;
    sim.offSide[i] = recovery && recovery.path && recovery.kinds.includes(sim.incident[i]) ? sim.wideSign[i] || -(turn?.sign ?? 1) : 0;
    if (sim.duelOther[i] >= 0) endDuel(sim, i);
    sim.lapFlags[i] |= 2;
    const corner = sim.mistakeCorner[i] || null;
    pushEvent(state, lap, { type: "mistake", carId: car.id, kind: car.mistakeKind, corner, loss: Math.round(car.pendingMistake * 10) / 10 });
    // A car stopped or off the road at a corner: yellow flags there, as in the quick mode (RF-SIM-10).
    if (!state.safetyCar && raceBalance.raceControl.yellow.mistakeKinds.includes(car.mistakeKind)) {
      waveYellow(state, corner, car.id, lap);
      syncYellows(state);
    }
  }
  // SIM-7: the track-limits offence rolled at the line, judged at its corner (the lap deleted, the era's ladder).
  if (sim.limitsTau[i] >= 0 && (sim.limitsTau[i] > from && sim.limitsTau[i] <= to)) {
    sim.limitsTau[i] = -1;
    if (sim.inPit[i] === 0) {
      judgeTrackLimits(state, car, sim.limitsCorner[i] >= 0 ? sim.limitsCorner[i] : null, { lap, raceLap: sim.leaderLap, rules: sim.rules });
      if (car.lapDeleted) sim.lapFlags[i] |= 64;
    }
  }
  // SIM-7: a puncture on debris at the debris' corner - the car limps on (its delay) and stops at the next entry.
  if (sim.debrisTau[i] >= 0 && (sim.debrisTau[i] > from && sim.debrisTau[i] <= to)) {
    sim.debrisTau[i] = -1;
    if (sim.inPit[i] === 0 && !car.puncture) {
      sim.delay[i] += applyDebrisPuncture(state, car, { corner: sim.debrisCorner[i] >= 0 ? sim.debrisCorner[i] : null, limp: sim.debrisLimp[i] }, lap);
    }
  }
  if (!session && sim.inPit[i] === 0 && (tables.pitEntryTau > from && tables.pitEntryTau <= to)) enterPit(state, i, lap);
  if (sim.inPit[i] === 2 && (tables.pitExitTau > from && tables.pitExitTau <= to)) {
    sim.inPit[i] = 0;
    rejoin(sim, i);
  }
  if (sim.inPit[i] !== 0) return;

  // DRS: detection at the start of each zone, closed at its end.
  for (let z = 0; z < tables.drsZones.length; z += 1) {
    const zone = tables.drsZones[z];
    if (zone.tauFrom > from && zone.tauFrom <= to) sim.drsOpen[i] = sim.ahead[i] >= 0 && drsAllowed(state, lap, sim.gapS[i]) ? z + 1 : 0;
    if ((zone.tauTo > from && zone.tauTo <= to) && sim.drsOpen[i] === z + 1) sim.drsOpen[i] = 0;
  }
  if (session) return;
  // Attack points before the braking zones.
  if (!state.safetyCar) {
    for (let z = 0; z < tables.attacks.length; z += 1) {
      if (!(tables.attacks[z].tau > from && tables.attacks[z].tau <= to)) continue;
      const a = sim.ahead[i];
      if (a >= 0 && sim.lapDiff[i] === 0 && mayAttack(state, i)) {
        // SIM-8: the car behind joins the claim as a third only if it may attack too (no error, no clean-air hold).
        const b0 = sim.behind[i];
        const b = b0 >= 0 && mayAttack(state, b0) ? b0 : -1;
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
  // SIM-8: the exit of a claimed corner whose incident roll left a touch on the outside or a squeeze there.
  if (sim.claimTau[i] >= 0 && (sim.claimTau[i] > from && sim.claimTau[i] <= to)) resolveClaim(state, i);
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

  // SIM-5 (era-defaults.json scPitClosed): the pit lane closed until the train has formed.
  if (pitClosedFor(state, car, sim.rules, lap)) return;
  const decision = pitDecision(state, car, lap, runningCars(state), stream);
  if (!decision) return;
  const L = sim.lane;
  const box = L.boxOf[car.teamId] ?? (L.geo.slotFrom + L.geo.slotTo) / 2;
  const arrival = entered + timeAtS(buildProfile(L.circuit, { vLimit: L.vLimit, baseLap: L.baseLap, stopAt: box }), box);
  const free = sim.boxFree[car.teamId] ?? -Infinity;
  const queue = free > arrival ? free - arrival + raceBalance.pit.doubleStackWait : 0;
  // The quick mode's servicePit, with the stop by stages on the crew stream (RF-SIM-12, WP7).
  const stop = pitStopTime(car, decision, { rules: sim.rules, stream, crew: sim.streams.crew, kgPerLap: sim.kgPerLap });
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
    const miss = sim.streams.crew.next() < PIT_LANE_BALANCE.unsafeRelease.crewMissChance * Math.max(0, sim.balance.pitRelease.crewCeiling - car.crew / sim.balance.pitRelease.crewScale);
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
    const side = sim.side;
    const tEnd = cars.enteredAt[i] + prof.T + (tStop >= 0 ? cars.stopFor[i] : 0) + side.exitWait[i];
    const tau = sim.tables.pitExitTau + Math.max(0, t1 - tEnd) / sim.budget[i];
    const P = sim.laps[i] + dAt(sim.tables, tau);
    // SIM-2: the car coming out gives way - it waits at the end of the lane while its spot on the
    // pit side of the road is taken by a car on the track (lateral.js exitBlocked).
    if (exitBlocked(sim, i, P)) {
      const end = L.geo.total - 1e-6;
      cars.s[i] = end;
      cars.v[i] = 0;
      side.exitWait[i] += sim.dt;
      const held = laneTau(sim, end);
      sim.tau[i] = held;
      sim.P[i] = sim.laps[i] + dAt(sim.tables, held);
      if (held > fromTau) checkpoints(state, i, fromTau, held);
      return;
    }
    sim.tau[i] = tau;
    sim.P[i] = P;
    checkpoints(state, i, fromTau, tau);
    rejoin(sim, i);
    // RF-SIM-10: late on the limiter is only an offence if the car really went over it (held up in the lane, it never did).
    if (cars.over[i] && L.judgesSpeeding && Math.round(cars.maxInZone[i] * 3.6 * 10) / 10 > L.kmh) investigateWithCause(state, car, "pitSpeeding", { kmh: Math.round(cars.maxInZone[i] * 3.6 * 10) / 10, limit: L.kmh });
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

/** SIM-4: the timing sector (1-based) of distance share `s`, against the circuit's sector starts. */
const sectorAt = (sim, s) => {
  let sector = 1;
  for (let k = 1; k < sim.sectorStarts.length; k += 1) if (s >= sim.sectorStarts[k]) sector = k + 1;
  return sector;
};

/**
 * SIM-4 (amarilla-sector; FIA ISC Appendix H): is the yellow of car `i` a double one? The era must have it
 * (era-defaults.json / pack `yellowFlags.double`) and the car be stopped on the track: retired there, or in
 * one of race-sim.json raceControl.yellow.double.incidents (a spin, v = 0). A car gone wide and back is a single.
 */
const doubleYellowFor = (state, i) => {
  const sim = state._sim;
  const era = sim.rules.regulations && sim.rules.regulations.yellowFlags;
  if (i < 0 || (era && era.double === false)) return false;
  const cfg = sim.balance.raceControl.yellow.double;
  const car = state.cars[i];
  return (cfg.retired && car.status === "retired") || cfg.incidents.includes(sim.incident[i]);
};

/**
 * SIM-4: how long a yellow of this kind stays out until the marshals clear it - a log-normal with the median and
 * p90 measured in races (race-sim.json raceControl.yellow.holdSec, OpenF1 race_control), cut to [p10, p90],
 * on the race's own `yellows` stream - and never before a spun car has got going again. A yellow with no car
 * to it (none is waved so today) stays the fixed `durationSec`.
 */
const yellowHoldOf = (state, i, double) => {
  const sim = state._sim;
  const cfg = sim.balance.raceControl.yellow;
  if (i < 0) return cfg.durationSec;
  const spread = cfg.holdSec[double ? "double" : "single"];
  const sigma = Math.log(spread.p90 / spread.median) / 1.2815515655446004;
  const held = clamp(spread.median * Math.exp(sigma * sim.streams.yellows.normal()), spread.p10, spread.p90);
  return Math.max(held, i >= 0 ? sim.spinLeft[i] : 0);
};

/**
 * RF-SIM-10: race.js waveYellow marks a corner on `state.yellow`; here it becomes a
 * local yellow on the track - from `approachMetres` before the corner to `afterMetres`
 * after it, until the marshals clear it - where cars lift and no duel is fought for that corner.
 * SIM-4 (F1M24-GAMEPLAY §1.7, amarilla-sector): the zone and race.js's `yellow` event get
 * {sector, marshalPost, double, s, until}: the timing sector of the corner (circuit.sectors), the post at that
 * corner (the FIA marshal-post numbering is not in the circuit data: the corner, as the sessions do), double for
 * a car stopped on the track, the apex's distance share and the race time it clears. A second incident at a
 * yellow corner keeps it out longer and may make it double.
 */
const syncYellows = (state) => {
  const sim = state._sim;
  const flagged = state.yellow;
  if (!flagged) return;
  const cfg = sim.balance.raceControl.yellow;
  // The race.js `yellow` events this sync answers (pushed since the last one, not yet completed).
  const fresh = [];
  for (let k = sim.yellowScan; k < state.events.length; k += 1) if (state.events[k].type === "yellow" && state.events[k].until === undefined) fresh.push(state.events[k]);
  sim.yellowScan = state.events.length;
  flagged.corners.forEach((corner) => {
    const range = sim.cornerRange.get(corner);
    if (!range) return;
    const event = fresh.find((item) => item.corner === corner) || null;
    const i = event ? state.cars.findIndex((car) => car.id === event.carId) : -1;
    const double = doubleYellowFor(state, i);
    const until = sim.clock + yellowHoldOf(state, i, double);
    let zone = sim.yellows.find((item) => item.corner === corner);
    if (zone) {
      zone.until = Math.max(zone.until, until);
      zone.double = zone.double || double;
    } else {
      const s = Math.round(range.apex * 10000) / 10000;
      zone = { corner, from: frac(range.from - cfg.approachMetres / sim.tables.length), to: frac(range.to + cfg.afterMetres / sim.tables.length), until, double, sector: sectorAt(sim, range.apex), marshalPost: corner, s };
      sim.yellows.push(zone);
    }
    if (event) Object.assign(event, { t: Math.round(sim.clock * 1000) / 1000, sector: zone.sector, marshalPost: zone.marshalPost, double: zone.double, s: zone.s, until: Math.round(zone.until * 1000) / 1000 });
  });
  state.yellow = null;
  state.yellowZones = sim.yellows.map(zoneOut);
};

/** SIM-4: a local yellow as the view reads it (`state.yellowZones`, the worker's tick). */
const zoneOut = (zone) => ({ corner: zone.corner, until: zone.until, sector: zone.sector, marshalPost: zone.marshalPost, double: zone.double, s: zone.s });

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

/**
 * The leader is at the line behind the red flag (WP11, race-sim.json redFlag): the grid forms by
 * driving. Every car on the leader's lap gets its slot behind the line in race order (lapped cars
 * stay lapped); a car already past the line waits where it is (`slot` = its place now).
 */
const formGrid = (state) => {
  const sim = state._sim;
  const { tables, balance } = sim;
  const lap = sim.red.lineUpLap;
  const ordered = [];
  for (let k = 0; k < sim.n; k += 1) {
    const i = sim.order[k];
    if (state.cars[i].status === "running" && sim.active[i] && sim.inPit[i] === 0) ordered.push(i);
  }
  ordered.sort((x, y) => sim.P[y] - sim.P[x]);
  const front = ordered.length ? sim.P[ordered[0]] : 0;
  sim.red.slot = new Float64Array(sim.n).fill(NaN);
  sim.red.formingSince = sim.clock;
  ordered.forEach((i, k) => {
    if (k === 0 || sim.laps[i] >= lap) {
      sim.red.slot[i] = sim.P[i];
      return;
    }
    if (front - sim.P[i] >= 1) return;
    const slot = lap - (balance.grid.poleBackMetres + k * balance.grid.gapMetres) / tables.length;
    if (slot > sim.laps[i]) sim.red.slot[i] = slot;
  });
};

/** Is everyone with a slot in it (or has the wait run out)? */
const gridFormed = (state) => {
  const sim = state._sim;
  if (sim.clock - sim.red.formingSince > sim.balance.redFlag.lineUpTimeoutLaps * state.race.baseLap) return true;
  for (let i = 0; i < sim.n; i += 1) {
    const slot = sim.red.slot[i];
    if (Number.isFinite(slot) && sim.active[i] && state.cars[i].status === "running" && sim.P[i] < slot - 1e-9) return false;
  }
  return true;
};

/** The grid is formed behind the red flag: tyres by the rules and the restart. */
const finishRed = (state) => {
  const sim = state._sim;
  const { tables } = sim;
  const lap = sim.red.lineUpLap;
  const running = runningCars(state);
  redFlagTyres(state, running, wetnessAt(state, lap), lap);
  // Anyone the wait ran out on takes its slot now (lineUpTimeoutLaps).
  for (let i = 0; i < sim.n; i += 1) {
    const slot = sim.red.slot[i];
    if (!Number.isFinite(slot) || sim.P[i] >= slot || !sim.active[i]) continue;
    sim.P[i] = slot;
    sim.tau[i] = Math.min(0.9999, tauAtD(tables, slot - sim.laps[i]));
  }
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
  if (sim.red && sim.red.lineUpLap !== null) {
    if (!sim.red.slot) formGrid(state);
    else if (gridFormed(state)) finishRed(state);
  }
  if (sim.yellows.length) {
    let kept = 0;
    for (let k = 0; k < sim.yellows.length; k += 1) if (sim.yellows[k].until > sim.clock) sim.yellows[kept++] = sim.yellows[k];
    if (kept !== sim.yellows.length) {
      sim.yellows.length = kept;
      state.yellowZones = sim.yellows.map(zoneOut);
    }
  }
};

/** The restart procedure the era uses after a red flag (race.js restartProcedureOf), for the view. */
export const restartProcedure = (state) => restartProcedureOf(state._sim.rules);

/**
 * Passes in progress: done once clear by the follow gap (traffic.minGapMetres). SIM-2: the pass is
 * completed by speed - after the corner's `passMaxSeconds` the attacker keeps its edge for up to
 * `passSettleSeconds` more; nobody is put ahead by hand. A pass still not made then is logged as
 * "unfinished" and both go back to their own pace.
 */
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
      if (sim.clock >= sim.duelUntil[i] + sim.balance.duel.passSettleSeconds) {
        // SIM-4: with the corner it was tried at (the duels' log always names one).
        state.duels.push({ t: Math.round(sim.clock * 100) / 100, lap: sim.laps[i] + 1, corner: sim.duelCorner[i] || null, attacker: state.cars[i].id, defender: state.cars[other].id, outcome: "unfinished", lead: Math.round(lead * sim.tables.length * 10) / 10 });
        endDuel(sim, i);
      }
    } else if (sim.duelRole[i] !== ROLE.YIELDING && sim.clock >= sim.duelUntil[i]) {
      endDuel(sim, i);
    }
  }
};

/**
 * SIM-3 vuelta-enfriamiento (RF-WKD-07, RF-3D-04; FIA art. 59.3): every car past the flag drives one more lap
 * as a ghost - out of the ring (no duels, no traffic, no pit lane), no stream drawn - easing from its speed at
 * the line to cooldown.lapFactor of the base lap and over towards the pit side, then stops. Its pose lives in
 * its own arrays (coolP, coolLat, coolV; sim.P stays at the line, where race control still reads the
 * leader), so nothing the race or its classification reads moves (RNF-05).
 */
const coolStep = (state) => {
  const sim = state._sim;
  const { dt, tables } = sim;
  const cfg = sim.balance.cooldown;
  const vTarget = tables.length / (state.race.baseLap * cfg.lapFactor);
  const ease = Math.min(1, dt / cfg.slowDownSec);
  const G = sim.side;
  for (let i = 0; i < sim.n; i += 1) {
    if (sim.cool[i] !== 1) continue;
    let v = sim.coolV[i] + (vTarget - sim.coolV[i]) * ease;
    let P = sim.coolP[i] + (v * dt) / tables.length;
    if (P >= sim.coolEnd[i]) {
      P = sim.coolEnd[i];
      v = 0;
      sim.cool[i] = 2;
      sim.cooling -= 1;
    }
    sim.coolV[i] = v;
    sim.coolP[i] = P;
    const lo = roomAt(G, P, -1);
    const hi = roomAt(G, P, 1);
    const want = clamp(G.pitSide * cfg.lateralMetres, lo, hi);
    sim.coolLat[i] += (want - sim.coolLat[i]) * ease;
    const bin = Math.min(tables.M - 1, (frac(P) * tables.M) | 0);
    updateDrive(sim.pt, sim.drive, i, v, sim.kappaBin[bin], dt, { coast: true, stopped: v === 0, full: false });
  }
};

/**
 * SIM-6 (RF-SIM-03): the view's heat of car `i` back to the lap model's (race.js heatLapOf leaves the
 * heat at the line on the car as `tyreThermal`): at the start and at every line before the lap is planned.
 * A new set (a stop or a red flag bumps `car.tyreSet`, race.js fitFreshSet keeps it as `tyreFitted`) comes
 * on when the car leaves its box: until then the old set is still on the car (`fresh`).
 */
const syncHeat = (state, i, fresh = false) => {
  const { heat } = state._sim;
  const car = state.cars[i];
  const th = fresh && car.tyreFitted ? car.tyreFitted : car.tyreThermal;
  if (!th) return;
  heat.s[i] = th.surface;
  heat.c[i] = th.carcass;
  heat.set[i] = car.tyreSet || 0;
  publishStepHeat(state, i);
};

/** The car's `tyreC` (°C, F1M24-GAMEPLAY §1.7) and the 0..1 `tyreTemp` the older views read, from the step's two nodes. */
const publishStepHeat = (state, i) => {
  const { heat, rules } = state._sim;
  const car = state.cars[i];
  const view = heat.view[i];
  view.surface = heat.s[i];
  view.carcass = heat.c[i];
  car.tyreC = view;
  car.tyreTemp = legacyIndexOf(view, windowFor(car.compound, rules.year), raceBalance.tyres.thermal);
};

/**
 * SIM-6 (RF-SIM-03): one step of car `i`'s tyre heat, thermal.js heatStep with this lap's inputs (race.js
 * endLapWear leaves them on the car as `tyreLap`) and the heat put in where the car loads its tyres: its g
 * (race-tyres.json `load`) over its mean of the last lap, so the lap still takes in what the quick mode's
 * does. A safety car or VSC out now scales the heat as race-tyres.json `neutralHeat` says. Reads no stream;
 * the lap model never reads it back (only the duels' cold-tyre term does, duel.js; RF-SIM-15).
 */
const heatStepOf = (state, i) => {
  const sim = state._sim;
  const { heat, drive } = sim;
  const car = state.cars[i];
  const lapIn = car.tyreLap;
  if (!lapIn) return;
  if ((car.tyreSet || 0) !== heat.set[i] && !beforeRelease(sim, i)) syncHeat(state, i, true);
  const load = loadOf(drive.latA[i] / G_ACCEL, drive.lonA[i] / G_ACCEL);
  heat.loadSum[i] += load;
  heat.loadN[i] += 1;
  const sc = state.safetyCar;
  if (sc || sim.inPit[i] !== 0) heat.green[i] = 0;
  const neutral = sc ? (sc.virtual ? TYRE_THERMAL.neutralHeat.vsc : TYRE_THERMAL.neutralHeat.sc) : 1;
  const inputs = heat.inputs;
  inputs.q = (lapIn.q / (lapIn.neutral || 1)) * neutral;
  inputs.airC = lapIn.airC;
  inputs.trackC = lapIn.trackC;
  const node = heat.node;
  node.surface = heat.s[i];
  node.carcass = heat.c[i];
  heatStep(node, inputs, sim.dt, heat.loadMean[i] > 0 ? load / heat.loadMean[i] : 1);
  heat.s[i] = node.surface;
  heat.c[i] = node.carcass;
  publishStepHeat(state, i);
};

/** SIM-6: at the line, a green lap's mean g load (the next laps' normaliser), then the view back on the lap model. */
const heatAtLine = (state, i) => {
  const { heat } = state._sim;
  if (heat.green[i] === 1 && heat.loadN[i] > 0) heat.loadMean[i] = heat.loadSum[i] / heat.loadN[i];
  heat.loadSum[i] = 0;
  heat.loadN[i] = 0;
  heat.green[i] = 1;
  // A line crossed in the pit lane before the crew is done: the old set stays on the view until the release.
  if (beforeRelease(state._sim, i) && (state.cars[i].tyreSet || 0) !== heat.set[i]) return;
  syncHeat(state, i);
};

/** In the pit lane and not yet released from the box (pitLane.js PHASE before RELEASE). */
const beforeRelease = (sim, i) => sim.inPit[i] !== 0 && Boolean(sim.lane.cars.prof[i]) && sim.lane.cars.phase[i] < PHASE.RELEASE;

/** RF-SIM-01 / RF-SIM-02: every running car's gear, rpm, pedals and g from the speed it did this step. */
const driveStep = (state) => {
  const sim = state._sim;
  const { pt, drive, tables, dt } = sim;
  const lane = sim.lane.cars;
  for (let i = 0; i < sim.n; i += 1) {
    if (!sim.active[i]) continue;
    const inLane = sim.inPit[i] !== 0 && lane.prof[i];
    const v = inLane ? lane.v[i] : sim.v[i];
    const bin = Math.min(tables.M - 1, (frac(sim.P[i]) * tables.M) | 0);
    const stopped = Boolean(inLane) && v === 0 && (lane.phase[i] === PHASE.STATIONARY || lane.phase[i] === PHASE.QUEUE);
    const cell = Math.min(tables.M - 1, (frac(sim.tau[i]) * tables.M) | 0);
    const full = !inLane && sim.fullBin[cell] === 1 && sim.delay[i] <= 0;
    updateDrive(pt, drive, i, v, inLane ? 0 : sim.kappaBin[bin], dt, { coast: drive.lifted[i] === 1, stopped, full });
    energyStepOf(state, i, v, cell, Boolean(inLane));
    heatStepOf(state, i);
  }
};

/**
 * RF-SIM-04 / RF-SIM-05 (engine/energy.js): car `i`'s fuel and energy for this step.
 *   fuel     the era's flow at the engine's load and rpm (and the mix's map), every step;
 *   deploy   on full power in a cell its plan deploys in, the store's power at this speed (2026's
 *            taper, the overtake curve when that mode is live), cut by the era's per-lap limit and
 *            what the store holds - a cut, or full power past the plan's cells, is clipping
 *            (hybrid eras; the MGU-K can no longer push at the end of the straight);
 *   harvest  off the throttle (braking or lifting), the braking power up to the MGU-K's, within
 *            the era's per-lap harvest and the store's window.
 */
const energyStepOf = (state, i, v, cell, inLane) => {
  const sim = state._sim;
  const { en, ers, drive, dt, pt } = sim;
  const car = state.cars[i];
  const mix = sim.rules.refuelling ? 1 : ENERGY.step.mixFlow[car.fuelMode] ?? 1;
  const flow = fuelFlowOf(sim.fuelEra, pt, drive.load[i], drive.rpm[i], drive.powerShare[i]) * mix * sim.fuelGeo;
  en.flow[i] = flow;
  en.lapFuel[i] += flow * dt;
  en.deployKw[i] = 0;
  en.harvestKw[i] = 0;
  en.clip[i] = 0;
  if (!ers || car.battery === null || car.battery === undefined || inLane) return;
  const { spec } = ers;
  const kmh = v * 3.6;
  const neutral = Boolean(state.safetyCar) || Boolean(sim.red);
  let dep = 0;
  if (!neutral && drive.throttle[i] >= 0.999 && sim.fullBin[cell] === 1 && !(drive.launching[i] && kmh < spec.startMinKmh)) {
    const r = ers.plan.rank[cell];
    if (r >= 0 && r < en.kCar[i]) {
      dep = (storeKwAt(spec, kmh, car.overtakeActive) * dt) / 1000;
      const limit = spec.deployPerLapMJ === null ? Infinity : spec.deployPerLapMJ - en.lapDep[i];
      const room = en.soc[i] < limit ? en.soc[i] : limit;
      if (dep > room) {
        dep = room > 0 ? room : 0;
        if (!ers.kers) en.clip[i] = 1;
      }
    } else if (!ers.kers) en.clip[i] = 1;
  }
  let harv = 0;
  if (drive.throttle[i] === 0 && v > 5 && drive.lonA[i] < 0) {
    const braking = (pt.mass * -drive.lonA[i] * v) / 1000;
    const most = spec.harvestKw * spec.harvestShare;
    harv = ((braking < most ? braking : most) * dt) / 1000;
    const cap = spec.harvestPerLapMJ === null ? Infinity : spec.harvestPerLapMJ + (car.overtakeActive ? spec.overtakeExtraHarvestMJ || 0 : 0) - en.lapHarv[i];
    const window = spec.storeMJ - en.soc[i];
    const room = cap < window ? cap : window;
    if (harv > room) harv = room > 0 ? room : 0;
  }
  en.soc[i] += harv - dep;
  en.lapDep[i] += dep;
  en.lapHarv[i] += harv;
  en.deployKw[i] = (dep * 1000) / dt + (drive.throttle[i] >= 0.999 && !neutral ? spec.mguhDirectKw : 0);
  en.harvestKw[i] = (harv * 1000) / dt;
};

/**
 * SIM-5: the safety car and the VSC as the worker's tick carries them (`state.safetyCar` goes to the view whole):
 * `car` = snapshot.sc, `deltaSec` = snapshot.vsc.deltaSec. Plain data, nothing the race reads.
 */
const mirrorNeutral = (state) => {
  const sc = state.safetyCar;
  if (!sc || sc.red) return;
  if (sc.virtual) {
    const vsc = vscSnapshot(state);
    if (vsc) sc.deltaSec = vsc.deltaSec;
  } else {
    const car = scSnapshot(state);
    if (car) sc.car = car;
  }
};

/** One fixed step of `dt` seconds for the whole field. */
export const stepOnce = (state) => {
  const sim = state._sim;
  if (state.finished) return;
  if (!sim.started) {
    // SIM-3: the PRE_START phase runs on its own clock; the race clock starts at lights out.
    if (sim.pre && sim.pre.k < sim.pre.kOut) {
      preStep(state);
      sim.steps += 1;
      return;
    }
    start(state);
  }
  sim.clock += sim.dt;
  sim.steps += 1;
  if (state.safetyCar && state.safetyCar.since === undefined) state.safetyCar.since = scSince(state);

  // SIM-5: a new neutralisation taken on, the safety car moved and the VSC clock run before the cars move.
  neutralStep(state, pushEvent);
  buildRing(sim);
  const first = measureGaps(sim);
  neutralLeader(state);
  for (let i = 0; i < sim.n; i += 1) {
    sim.P0[i] = sim.P[i];
    sim.tau0[i] = sim.tau[i];
  }
  recordPlaces(sim);
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
  // SIM-5: the safety car's phase changes once the field has moved (train grouped, lapped cars through, lights off).
  neutralAfter(state, pushEvent);
  mirrorNeutral(state);
  // SIM-4 (§1.7): the duel events of this step and every car's battle state (no roll, nothing the race reads).
  duelWatch(state);
  battleStep(state);
  // SIM-2 (RF-SIM-07): sideways, inside the measured asphalt, nobody on top of anybody (lateral.js).
  stepLateral(sim, ROLE.NONE, physicsData.mistake, sim.balance.blueFlags.yieldShare);
  driveStep(state);
  if (sim.cooling > 0) coolStep(state);
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

// ------------------------------------------- SIM-8: the step simulator for sessions

/**
 * SIM-8 (F1M24-GAMEPLAY §3.3 trafico-sesion; RF-WKD-02, RF-SIM-01, RF-SIM-06): run a step race's machinery for a
 * practice or qualifying session (engine/sessionSim/stepSession.js, SES-8). In "session" mode a car still moves
 * on the circuit's trace with its dirty air, tow, DRS zones, local yellows, its errors and the boxes that never
 * overlap (lateral.js), but there is no first-corner plan, no pit wall (pit entry is the session's own business),
 * no duel or switchback (nobody fights in a session), and at the line `onLine(state, i, lap, t)` decides: it
 * times the lap, plans the next one (beginSessionLap) and returns false to take the car off the road (garage).
 * Without `onLine` the race's own line runs. "race" puts everything back. No stream is drawn (RNF-05).
 */
export const setStepMode = (state, mode, { onLine = null } = {}) => {
  const sim = state._sim;
  sim.mode = mode === SIM_MODE.SESSION ? SIM_MODE.SESSION : SIM_MODE.RACE;
  sim.onLine = sim.mode === SIM_MODE.SESSION ? onLine : null;
  return state;
};

/**
 * SIM-8: car `i` starts lap `lap` of a session at time `t` with a lap budget of `budget` seconds (the session's
 * own, e.g. sessionSim qualifyingPaceOf: SRS 4.2 equivalence with the quick session). The trace, the wet sectors
 * and the driver's corners are set as for a race lap (the corners' noise on its own stream, as in a race); no
 * error, failure or offence is rolled here (the session rolls its own).
 */
export const beginSessionLap = (state, i, lap, t, budget) => {
  const sim = state._sim;
  sim.lapStart[i] = t;
  sim.lapFlags[i] = 0;
  const en = sim.en;
  en.lapFuel[i] = 0;
  en.lapDep[i] = 0;
  en.lapHarv[i] = 0;
  en.ledgerKg[i] = 0;
  const drive = sim.drive;
  drive.debt[i] = 0;
  drive.allowance[i] = 0;
  drive.coastZone[i] = 0;
  drive.coasting[i] = 0;
  sim.budget[i] = Math.max(1, budget);
  sim.dev[i] = devOf(sim.tables, sim.budget[i]);
  const straight = sim.tables.traceLap ? sim.tables.traceLap / (sim.budget[i] * (1 - sim.dev[i] + sim.dev[i] * sim.straightSens)) : 1;
  drive.powerShare[i] = straight >= 1 ? 1 : straight * straight * straight;
  wetLap(state, i, lap);
  driverLap(state, i);
  sim.t1Tau[i] = -1;
  sim.mistakeTau[i] = -1;
  sim.failTau[i] = -1;
  sim.limitsTau[i] = -1;
  sim.debrisTau[i] = -1;
  return state;
};

/**
 * SIM-8: a session's car goes on the road (out of the garage, at distance share `at` of the lap, `lat` metres off
 * the line) or comes off it (`on: false`, back in the garage). Its next lap is the session's to plan
 * (beginSessionLap). The race's lights are never run in session mode.
 */
export const setOnTrack = (state, i, { on = true, at = 0, lat = 0 } = {}) => {
  const sim = state._sim;
  sim.started = true;
  if (!on) {
    sim.active[i] = 0;
    sim.v[i] = 0;
    if (sim.duelOther[i] >= 0) endDuel(sim, i);
    return state;
  }
  const d = frac(at);
  sim.P[i] = sim.laps[i] + d;
  sim.P0[i] = sim.P[i];
  sim.tau[i] = tauAtD(sim.tables, d);
  sim.tau0[i] = sim.tau[i];
  sim.lat[i] = lat;
  sim.side.prev[i] = lat;
  sim.side.nV[i] = 0;
  sim.v[i] = 0;
  sim.inPit[i] = 0;
  sim.active[i] = 1;
  return state;
};

/** SIM-8: in a session, car `i` gives way (out- or in-lap) - the car behind it goes by as past a lapped car. */
export const setSessionYield = (state, i, on) => {
  state._sim.sessionYield[i] = on ? 1 : 0;
  return state;
};

/**
 * SIM-8: one fixed step of a session's traffic (the cars on the road, front to back as in a race step), then the
 * sideways step, the drive and the order. The session's own clock, flags and garage stay in sessionSim; no race
 * control, safety car or duel runs here.
 */
export const advanceField = (state) => {
  const sim = state._sim;
  if (sim.mode !== SIM_MODE.SESSION) {
    stepOnce(state);
    return state;
  }
  sim.clock += sim.dt;
  sim.steps += 1;
  buildRing(sim);
  const first = measureGaps(sim);
  for (let i = 0; i < sim.n; i += 1) {
    sim.P0[i] = sim.P[i];
    sim.tau0[i] = sim.tau[i];
  }
  for (let k = 0; k < sim.ringSize; k += 1) {
    const i = sim.ring[(first - k + sim.ringSize) % sim.ringSize];
    if (sim.active[i]) advance(state, i);
  }
  stepLateral(sim, ROLE.NONE, physicsData.mistake, sim.balance.blueFlags.yieldShare);
  driveStep(state);
  sortOrder(state);
  state.clock = sim.clock;
  return state;
};

/** SIM-8 (F1M24-GAMEPLAY §3.2): one car's step, exported for the session mode (setStepMode). */
export { advance };

// ------------------------------------------------------------------ API

/** Run the race clock forward `seconds` (RF-CMD-04: the view picks ×1…×16 by how much it asks for). */
export const stepFor = (state, seconds) => {
  const sim = state._sim;
  sim.requested += seconds;
  const target = Math.floor(sim.requested / sim.dt + 1e-9);
  while (sim.steps < target && !state.finished) stepOnce(state);
  // SIM-3: after the flag the view may keep watching the cooldown laps (no result moves).
  while (sim.steps < target && state.finished && sim.cooling > 0) {
    sim.clock += sim.dt;
    sim.steps += 1;
    coolStep(state);
    state.clock = sim.clock;
  }
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

/** Fuel on board (kg: the ledger after this lap plus what the lap has not burnt yet), flow (kg/h), this lap's kg. */
const fuelSnapshot = (sim, car, i) => {
  const { en } = sim;
  const left = en.ledgerKg[i] - en.lapFuel[i];
  return { kg: Math.max(0, car.fuel * sim.kgPerLap + (left > 0 ? left : 0)), flowKgH: en.flow[i] * 3600, lapKg: en.lapFuel[i] };
};

/** The store now (MJ and share of its window), deploy and harvest power (kW), clipping; null without a system. */
const energySnapshot = (sim, car, i) => {
  if (!sim.ers || car.battery === null || car.battery === undefined) return null;
  const { en, ers } = sim;
  return {
    soc: en.soc[i],
    share: en.soc[i] / ers.spec.storeMJ,
    deployKw: en.deployKw[i],
    harvestKw: en.harvestKw[i],
    clipping: en.clip[i] === 1,
    lapDeploy: en.lapDep[i],
    lapHarvest: en.lapHarv[i],
    planned: en.planned[i],
  };
};

/** Where every car is right now, for a live view that reads the step sim directly. */
export const snapshot = (state) => {
  const sim = state._sim;
  const cars = state.cars.map((car, i) => ({
    id: car.id,
    lap: sim.laps[i] + 1,
    // SIM-3: past the flag, the cooldown lap's pose (its own arrays).
    progress: sim.cool[i] ? sim.coolP[i] : sim.P[i],
    share: frac(sim.cool[i] ? sim.coolP[i] : sim.P[i]),
    lateral: sim.cool[i] ? sim.coolLat[i] : sim.lat[i],
    // GS-07 / VIEW-08 (F1M24-CHINA §1.5): the racing line's offset from the centreline where the car is (metres, + right
    // of travel; engine/trackData.js positionAt, the view's own placement) and the car's distance from the centreline
    // (line + lateral), in every phase on the road - start, safety car and cooldown lap included; null in the pit lane.
    ...lineOf(sim, i),
    // SIM-FISICA §3.7: speed on the road (m/s), from the sim - the view no longer infers it.
    v: sim.cool[i] ? sim.coolV[i] : sim.inPit[i] !== 0 && sim.lane.cars.prof[i] ? sim.lane.cars.v[i] : sim.v[i],
    inPit: sim.inPit[i] !== 0,
    // RF-SIM-12 (WP6/WP7): where in the pit lane, how fast, and the stage of the stop.
    pit: sim.inPit[i] !== 0 && sim.lane.cars.prof[i] ? { phase: PHASE_NAMES[sim.lane.cars.phase[i]], v: sim.lane.cars.v[i], stage: sim.lane.cars.stage[i] } : null,
    status: car.status,
    position: car.position,
    duel: sim.duelRole[i],
    // SIM-4 (F1M24-GAMEPLAY §1.7 `battle[i]`): "RUNNING" | "FOLLOWING" | "ATTACKING" | "DEFENDING" | "TRAIN".
    battle: battleOf(sim, i),
    // SIM-8 (SIM-FISICA §3.5): the car's fight - "CLAIM" | "SWITCHBACK" | "SQUEEZED", null out of one.
    fight: fightOf(sim, i),
    // WP4: the lateral state ("racing", "attack-inside", "attack-outside", "defend", "alongside", "yield", "wide"; SIM-2:
    // "pit" in the lane, "pit-exit" back on the pit side of the road after it - F1M24-GAMEPLAY §1.7 lane[i]).
    lane: sim.inPit[i] !== 0 ? "pit" : LANE_NAMES[sim.latState[i]],
    // WP8: an error being paid ("lockup" | "wide" | "spin"), for the view.
    incident: sim.incident[i],
    // SIM-7 (F1M24-GAMEPLAY §1.7 `lon[i]`): "NORMAL" | "LOCKUP" | "SPIN" (race-physics.json mistake.kinds[].lon).
    lon: lonOf(sim, i),
    // SIM-7 (mistake.recovery.path): beyond the asphalt edge on `side` (+1 right, -1 left), going OUT or REJOINing.
    offTrack: sim.offM[i] > 0 ? { metres: Math.round(sim.offM[i] * 100) / 100, side: sim.offSide[i], phase: sim.incident[i] ? "OUT" : "REJOIN" } : null,
    // SIM-7 (§1.7 `damage[i]`): front wing and floor as RF-DEV-08 states, a puncture, s a lap lost; null undamaged.
    damage: damageOf(car),
    // SIM-7: the driver's tactics and track-limits offences so far (HUD-7).
    tactics: car.tactics || null,
    trackLimits: car.trackLimits || 0,
    // RF-SIM-01 / RF-SIM-02 (powertrain.js): gear, rpm, throttle, brake, g, pitch, roll, front load share.
    ...driveSnapshot(sim.pt, sim.drive, i),
    // RF-SIM-04 / RF-SIM-05: the fuel on board (kg) and its flow, and the energy store (MJ, kW, clipping).
    fuel: fuelSnapshot(sim, car, i),
    energy: energySnapshot(sim, car, i),
    // SIM-6 (F1M24-GAMEPLAY §1.7 `tyreC[i]`): the tyre's surface and carcass in °C at this step.
    tyreC: { surface: Math.round(sim.heat.s[i] * 10) / 10, carcass: Math.round(sim.heat.c[i] * 10) / 10 },
    // SIM-3: on its cooldown lap after the flag (a ghost: no duels, no pit lane).
    cooldown: sim.cool[i] === 1,
  }));
  // SIM-3 / F1M24-GAMEPLAY §1.7 `snapshot.start` (on the array, so `snapshot(state)[i]` stays per car).
  cars.start = startOf(state);
  // SIM-5 / F1M24-GAMEPLAY §1.7 `snapshot.sc` and `snapshot.vsc` (null without one).
  cars.sc = scSnapshot(state);
  cars.vsc = vscSnapshot(state);
  // SIM-7 danos-visibles: debris on the track, at its corner's apex (distance share `s`), for the view.
  cars.debris = activeDebris(state, sim.leaderLap).map((item) => ({ corner: item.corner, s: sim.cornerRange.get(item.corner)?.apex ?? null, until: item.until }));
  // F1M24-CHINA §1.5 «Spray» (SIM-C1 contract): the water the view and the sound read, never recomputed there.
  cars.weather = weatherOf(state);
  cars.spray = state.cars.map((car, i) => sprayOf(state, i));
  return cars;
};

/** GS-07: `lineOffset` and `axisOffset` of car `i` for the snapshot (null in the pit lane). */
const lineOf = (sim, i) => {
  if (sim.inPit[i] !== 0 || !sim.side || !sim.side.track) return { lineOffset: null, axisOffset: null };
  const cool = sim.cool[i] === 1;
  const pose = positionAt(sim.side.track, cool ? sim.coolP[i] : sim.P[i], cool ? sim.coolLat[i] : sim.lat[i]);
  return { lineOffset: Math.round(pose.lineOffset * 1000) / 1000, axisOffset: Math.round(pose.axisOffset * 1000) / 1000 };
};

/**
 * F1M24-CHINA §1.5 «Spray» / §3.2 contract of SIM-C1 (RF-SIM-11): `snapshot.weather` - the state, the rain
 * rate (mm/h) and the water (mm) on the racing line, off it and per timing sector on the leader's lap - read
 * from engine/weather weatherSnapshot (nothing computed here); null without a weather model.
 */
const weatherOf = (state) => {
  const w = weatherSnapshot(state, state._sim.leaderLap);
  if (!w) return null;
  return { state: w.state, rainRate: w.rainMmPerHour, waterMm: { line: w.waterMm, off: w.offLineMm, sectors: w.sectorsMm } };
};

/**
 * F1M24-CHINA §1.5 «Spray» (RF-SIM-11): how much spray car `i` throws now, 0..1 - engine/weather's level of
 * the water under it (its sector on its lap). WX-C2 calibrates a pure `sprayAt` in engine/weather; this is
 * where it goes in then.
 * 0 in the pit lane, stopped, on the cooldown lap or on a dry track. The view and the sound only read it.
 */
const sprayOf = (state, i) => {
  const sim = state._sim;
  const weather = state.weather;
  if (!weather || !weather.water || sim.inPit[i] !== 0 || sim.cool[i] || !sim.active[i] || !(sim.v[i] > 0)) return 0;
  const k = Math.min(Math.max(0, sim.laps[i] + 1), weather.water.length - 1);
  const sectors = weather.sectors && weather.sectors[k];
  const h = sectors ? sectors[sim.tables.sectorOf[Math.min(sim.tables.M - 1, (frac(sim.tau[i]) * sim.tables.M) | 0)]] ?? weather.water[k] : weather.water[k];
  return Math.round(sprayLevelOf(h) * 1000) / 1000;
};

/**
 * F1M24-CHINA §1.5 (contracts of wave 1, SIM-C1 declares them): the race-control messages the engine emits as
 * events `{type: "control", kind, lap, t, sector?, reason?}`. "drsEnabled" `{lap}` and "drsDisabled" `{reason}`
 * (GS-08, engine/rules.js drsOpen); the wet chain "climaticChange", "wetTrack", "slippery" (by sector) and
 * "lowGrip", with the thresholds of race-sim.json raceControl.wet (GS-12, SIM-C4). Declared here so the HUD and
 * the sound can code against them; the engine emits each kind from the package that owns it (none yet).
 */
export const CONTROL_KINDS = Object.freeze(["drsEnabled", "drsDisabled", "climaticChange", "wetTrack", "slippery", "lowGrip"]);

/** SIM-7: the longitudinal state of car `i` for the view (F1M24-GAMEPLAY §1.7 `lon[i]`). */
const lonOf = (sim, i) => {
  const kind = sim.incident[i];
  if (!kind) return "NORMAL";
  if (sim.clock < sim.lonUntil[i]) return "LOCKUP";
  const how = physicsData.mistake.kinds[kind];
  return how ? how.lon : "NORMAL";
};

/**
 * RF-SIM-11: the weather now, on the leader's lap, for the view (rain visuals) and the sound
 * agent (rain ambience): state, rain, water on and off the line per sector, spray, track
 * temperature, rubber (engine/weather weatherSnapshot).
 */
export const weatherNow = (state) => weatherSnapshot(state, state._sim ? state._sim.leaderLap : state.lap);

/**
 * The state as the UI and career read it (classificationOf, completeRace, raceClock): the
 * same object without the simulator's internals.
 */
export const toRaceState = (state) => {
  const { _sim, _stream, _control, _neutral, ...rest } = state;
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
export const setErs = (state, carId, mode) => {
  const termOf = (car) => (car.battery === null || car.battery === undefined ? 0 : energyStep({ rules: stateRules(state), mode: car.ersMode, battery: 100, gapAhead: null }).time);
  const i = indexOf(state, carId);
  const before = i >= 0 ? termOf(state.cars[i]) : 0;
  retimed(state, carId, () => quickSetErs(state, carId, mode), termOf);
  // The rest of the lap deploys by the new mode, from what the store holds now (RF-SIM-05).
  const sim = state._sim;
  if (i >= 0 && sim && sim.started && sim.ers && state.cars[i].status === "running") {
    const car = state.cars[i];
    const held = (sim.en.soc[i] / sim.ers.spec.storeMJ) * 100;
    planEnergy(state, i, sim.ers.kers ? car.battery : held, sim.en.eTime[i] + termOf(car) - before);
  }
  return state;
};
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

/**
 * SIM-7 tacticas (RF-CMD-01, F1M24-GAMEPLAY §2.8): race.js setTactics (era-checked: battleAssist only with
 * KERS/ERS), with the kerbs' time felt from now on rather than from the next line (as setMode).
 */
export const setTactics = (state, carId, tactics) => retimed(state, carId, () => quickSetTactics(state, carId, tactics), (car) => tacticTime(car, state.race.baseLap));

export const DEFENCE_KEYS = Object.keys(balanceData.defence.styles);
export const RISK_KEYS = Object.keys(balanceData.risk.levels);
