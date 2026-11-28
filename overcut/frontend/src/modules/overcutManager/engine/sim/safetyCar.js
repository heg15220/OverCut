/**
 * Neutralisations: the safety car and the VSC (SIM-5, docs/manager/F1M24-GAMEPLAY.md §2.11; RF-SIM-10, RF-SIM-01,
 * RF-SIM-15, RNF-05, RNF-07).
 *
 * Shared by both modes (race.js and the step simulation):
 *
 *   deploy      an incident `{ s, onTrack, severity }` - a car stopped on the track brings the safety car, one in
 *               the run-off the VSC (or a yellow) - with the circuit's measured rate (`calendar[].scRate` of the pack,
 *               race-sim.json neutralisation.circuitRate) and the marshals' cleanup drawn on its own `seed::neutral`
 *               stream (a log-normal measured in OpenF1 race_control, neutralisation.cleanup). The quick mode turns it
 *               into whole laps (quickLapsOf); the step mode runs it as below.
 *   pit lane    closed while the train forms in the eras that closed it (era-defaults.json scPitClosed).
 *
 * Step mode only (stepRace.js calls neutralStep before the cars move and neutralAfter once they have):
 *
 *   safety car  a car of its own on the ring (`sim.neutral`), out of the end of the pit limiter, on the circuit's trace
 *               with the straights capped at the era's road car (race-sim.json safetyCar.sc.cars) and scaled so its
 *               lap lasts safetyCar.lapFactor x the base lap - the quick mode's (SRS 4.2). Phases (§1.7 `sc`):
 *               DEPLOYED (in the pit lane) → PICKUP (waiting for the leader; the cars between them are waved by) →
 *               TRAIN (≤ trainMaxLengths car lengths apart, FIA art. 55.7/55.10; until the cleanup is done and the
 *               train grouped) → UNLAPPING (the era's lapped cars pass the train and the SC, art. 55.13) →
 *               IN_THIS_LAP (lights off; into the pit lane at the next entry, art. 55.14) → RESTART (the leader sets
 *               the pace; nobody passes before the era's restart line, art. 55.8).
 *   VSC         a delta per car: the minimum time is the trace x safetyCar.virtualLapFactor, minisector by minisector
 *               (FIA art. 56.5); each driver keeps vsc.marginSec over it by his precision; «VSC ENDING» and the green
 *               anywhere on the lap between the era's minSec and maxSec later (art. 56.7).
 *
 *   wet start   SIM-C4 (F1M24-CHINA GS-12, FIA 2024 arts. 49, 51, 52): with the era's procedure and the line above
 *               the intermediate's capacity at the start, the SC leads from the grid (START_BEHIND_SC) for the laps
 *               wetStartOf counts from the forecast water, then goes in with a "standing" or "rolling" release.
 *   weave       SIM-C4 (AUD-C9): behind the SC every car zigzags and breathes on the throttle (weaveOf), measured
 *               in OpenF1 location/car_data, so nothing stays frozen for 30 s.
 *
 * Nothing here draws on a race stream: the cleanup and the VSC warning are on `seed::neutral`, the weave's phases on
 * `seed::weave` (RF-SIM-15).
 */

import balance from "../../data/balance/race-sim.json";
import { clamp, createStream } from "../../../overcutTrayectoria/engine/rng";
import { byYear } from "../rules";
import { cornerNoiseSigmaOf } from "../drivers/skills";
import { crossed, tauAtD } from "./trackTables";

export const SC_BALANCE = balance.safetyCar;
export const VSC_BALANCE = balance.vsc;
export const NEUTRAL_BALANCE = balance.neutralisation;

// SIM-C4 (GS-12): START_BEHIND_SC - the race starts behind the safety car in the wet (FIA 2024 art. 49): it leads the
// field away from the grid as a TRAIN would, for the laps race.js wetStartOf counted from the water.
export const SC_PHASE = { DEPLOYED: 0, PICKUP: 1, TRAIN: 2, UNLAPPING: 3, IN_THIS_LAP: 4, RESTART: 5, START_BEHIND_SC: 6 };
export const SC_PHASES = ["DEPLOYED", "PICKUP", "TRAIN", "UNLAPPING", "IN_THIS_LAP", "RESTART", "START_BEHIND_SC"];
export const WEAVE_BALANCE = SC_BALANCE.weave;

const frac = (value) => value - Math.floor(value);
const round = (value, digits = 3) => Math.round(value * 10 ** digits) / 10 ** digits;
const Z90 = 1.2815515655446004;

// ------------------------------------------------------------------ both modes

/** The race's own stream for neutralisations (RF-SIM-15): its draws never move another one. */
export const neutralStream = (state) => {
  if (!state._neutral) state._neutral = createStream(`${state.seed}::neutral`);
  return state._neutral;
};

/** The circuit's safety-car factor: the pack's measured scRate over the reference, clamped; 1 without one. */
export const circuitScFactor = (race) => {
  const rate = race && Number.isFinite(race.scRate) ? race.scRate : null;
  if (rate === null) return 1;
  const c = NEUTRAL_BALANCE.circuitRate;
  return clamp(rate / c.reference, c.min, c.max);
};

/** How bad the incident is for the marshals, by the retirement's reason (neutralisation.severity). */
export const severityOf = (reason, debris = false) => (debris ? NEUTRAL_BALANCE.severity.debris : NEUTRAL_BALANCE.severity.byReason[reason] || NEUTRAL_BALANCE.severity.default);

/** Seconds the marshals need (a log-normal on its measured median and p90, cut to [p10, p90]), VSC shorter. */
export const cleanupOf = (stream, { virtual, severity }) => {
  const c = NEUTRAL_BALANCE.cleanup;
  const spread = c.base;
  const sigma = Math.log(spread.p90 / spread.median) / Z90;
  const held = clamp(spread.median * Math.exp(sigma * stream.normal()), spread.p10, spread.p90);
  return held * (virtual ? c.offTrackFactor : 1) * (c.perSeverity[severity] ?? 1);
};

/** The quick mode's whole laps for a neutralisation of `cleanupSec` (neutralisation.laps). */
export const quickLapsOf = ({ cleanupSec, virtual, rules, baseLap }) => {
  const L = NEUTRAL_BALANCE.laps;
  if (virtual) {
    const warn = rules.raceControl.vscEndingWarn;
    const wait = warn ? (warn.minSec + warn.maxSec) / 2 : 0;
    return Math.max(L.minVsc, Math.round((cleanupSec + wait) / (baseLap * SC_BALANCE.virtualLapFactor)));
  }
  const unlap = rules.raceControl.sc && rules.raceControl.sc.unlapping ? L.unlappingSec : 0;
  return Math.max(L.minSc, Math.round((cleanupSec + unlap) / (baseLap * SC_BALANCE.lapFactor)) + L.inThisLapLaps);
};

/**
 * RF-SIM-10: race control neutralises the race for an incident: `state.safetyCar` with the quick mode's laps, the
 * cleanup (s), the incident `{ s, onTrack, severity, corner }` and the leader's lap it came out on. The caller pushes
 * the event. `virtual` = the car is off the racing surface (the VSC).
 */
export const deployNeutralisation = (state, { virtual, reason = null, share = null, corner = null, rules, lap, debris = false }) => {
  const severity = severityOf(reason, debris);
  const cleanupSec = cleanupOf(neutralStream(state), { virtual, severity });
  state.safetyCar = {
    laps: quickLapsOf({ cleanupSec, virtual, rules, baseLap: state.race.baseLap }),
    virtual: Boolean(virtual),
    cleanupSec: round(cleanupSec, 1),
    incident: { s: Number.isFinite(share) ? round(frac(share), 4) : null, onTrack: !virtual, severity, corner: corner ?? null },
    deployedLap: lap,
  };
  return state.safetyCar;
};

/**
 * RF-SIM-12 / SIM-5 (era-defaults.json scPitClosed, 2007-08 pending): is the pit lane closed to this car now? Only
 * under a real safety car in an era that closed it, until the train has formed (step mode) or on the lap the SC came
 * out (quick mode); a punctured car may always come in.
 */
export const pitClosedFor = (state, car, rules, lap) => {
  const sc = state.safetyCar;
  if (!sc || sc.virtual || sc.red || !rules.raceControl.sc || !rules.raceControl.sc.pitClosed || car.puncture) return false;
  const N = state._sim && state._sim.neutral;
  if (N && N.ref === sc) return !N.groupedOnce;
  return sc.deployedLap === lap;
};

// ------------------------------------------------------------------ wet start (SIM-C4, GS-12), both modes

const WET = balance.raceControl.wet;

/**
 * RF-SIM-10 / F1M24-CHINA GS-12 (FIA 2024 arts. 49, 51 and 52; era-defaults.json wetStart, race-sim.json
 * raceControl.wet.startBehindSc): does this race start behind the safety car? Null unless the era has the procedure
 * (`rules.raceControl.wetStart`) and the water on the racing line at the start (`weather.water[0]`) reaches
 * interCapacityShare × the year's intermediate capacity (`capacityMm`, engine/weather capacityFor). Otherwise
 * `{ laps, standingAfter, tyre, mandatory, capacityMm }`: the safety car leads `laps` laps - up to the first lap whose
 * forecast water is below endShare × that capacity, within [minLaps, maxLaps]; no draw, so both modes and every
 * replay count the same - and every car starts on `tyre`: the full wet where the era makes it compulsory, otherwise
 * the tyre for the water (`tyreFor`, an inter only where the era allows it). Pure.
 */
export const wetStartOf = ({ rules, weather, laps, capacityMm, tyreFor = () => "wet" }) => {
  const procedure = rules && rules.raceControl && rules.raceControl.wetStart;
  const water = weather && Array.isArray(weather.water) ? weather.water : null;
  if (!procedure || !water || !(capacityMm > 0)) return null;
  const cfg = WET.startBehindSc;
  const h0 = water[0] ?? 0;
  if (!(h0 >= cfg.interCapacityShare * capacityMm)) return null;
  const last = Math.max(1, Math.min(cfg.maxLaps, laps - 1));
  let count = Math.min(cfg.minLaps, last);
  while (count < last && (water[count] ?? 0) >= cfg.endShare * capacityMm) count += 1;
  const own = tyreFor(h0);
  const tyre = procedure.wetTyresMandatory ? "wet" : own === "inter" && !procedure.intersAllowed ? "wet" : own || "wet";
  return { laps: count, standingAfter: procedure.standingAfter, tyre, mandatory: procedure.wetTyresMandatory, capacityMm };
};

/**
 * SIM-C4 (FIA 2024 art. 51 / 52): how the race starts as the wet-start safety car comes in on lap `lap`: "standing"
 * (back to the grid) where the era has it and the water is below rollingAboveShare × the capacity, else "rolling".
 */
export const wetReleaseOf = (state, lap) => {
  const wet = state.wetStart;
  if (!wet) return null;
  const water = state.weather && state.weather.water ? state.weather.water[Math.min(Math.max(0, lap), state.weather.water.length - 1)] ?? 0 : 0;
  return wet.standingAfter && water < WET.startBehindSc.rollingAboveShare * wet.capacityMm ? "standing" : "rolling";
};

/** The control event of the wet start's release (`{type: "control", kind: "standingStart"|"rollingStart", lap}`). */
export const wetReleaseEvent = (release, lap) => ({ type: "control", kind: release === "standing" ? "standingStart" : "rollingStart", lap });

// ------------------------------------------------------------------ step mode

/** Race-sim.json safetyCar.sc.cars for the year (the road car that sets the straights' cap). */
const carOf = (year) => byYear(SC_BALANCE.sc.cars, year) || null;

/**
 * The safety car's speed per time-share bin (m/s): the circuit's trace shape × k, capped at the car's top speed,
 * with k such that the lap lasts `lapSec` (bisection; monotone in k). Cached per sim.
 */
const profileOf = (sim, state) => {
  if (sim.scProfile) return sim.scProfile;
  const { tables } = sim;
  const M = tables.M;
  const L = tables.length;
  const baseLap = state.race.baseLap;
  const lapSec = baseLap * SC_BALANCE.lapFactor;
  const car = carOf(sim.rules.year ?? state.year);
  const top = car ? car.topKmh / 3.6 : Infinity;
  const shape = new Float64Array(M);
  const dd = new Float64Array(M);
  for (let j = 0; j < M; j += 1) {
    dd[j] = tables.dOfTau[j + 1] - tables.dOfTau[j];
    shape[j] = tables.traceLap ? tables.vRef[j] : (dd[j] * M * L) / baseLap;
  }
  const lapAt = (k) => {
    let t = 0;
    for (let j = 0; j < M; j += 1) {
      const v = Math.min(k * shape[j], top);
      t += v > 0 ? (dd[j] * L) / v : 0;
    }
    return t;
  };
  let lo = 1e-3;
  let hi = 10;
  for (let it = 0; it < 60; it += 1) {
    const mid = (lo + hi) / 2;
    if (lapAt(mid) > lapSec) lo = mid;
    else hi = mid;
  }
  const v = new Float64Array(M);
  for (let j = 0; j < M; j += 1) v[j] = Math.max(1, Math.min(hi * shape[j], top));
  sim.scProfile = { v, top, car };
  return sim.scProfile;
};

const speedAt = (sim, profile, P) => profile.v[Math.min(sim.tables.M - 1, (frac(tauAtD(sim.tables, frac(P))) * sim.tables.M) | 0)];

/** Distance share on the track of `s` metres along the pit lane (entry → line → exit), as stepRace's laneTau. */
const laneDistance = (sim, s) => {
  const { geo } = sim.lane;
  const { pitEntryTau, pitExitTau, dOfTau, M } = sim.tables;
  const tau = s < geo.lineS ? Math.min(0.999999, pitEntryTau + (1 - pitEntryTau) * (s / geo.lineS)) : pitExitTau * ((s - geo.lineS) / Math.max(1e-9, geo.total - geo.lineS));
  const x = frac(tau) * M;
  const i = Math.min(M - 1, x | 0);
  return dOfTau[i] + (dOfTau[i + 1] - dOfTau[i]) * (x - i);
};

/** The race leader on the track (the first car in race order that is running and not in the pit lane). */
const leaderOf = (state) => {
  const sim = state._sim;
  for (let k = 0; k < sim.n; k += 1) {
    const i = sim.order[k];
    if (sim.active[i] && sim.inPit[i] === 0 && state.cars[i].status === "running") return i;
  }
  return -1;
};

/** Each driver's VSC margin (s over the delta): vsc.marginSec by his corner-noise sigma against the field's. */
const marginsOf = (state) => {
  const sim = state._sim;
  const sig = state.cars.map((car) => cornerNoiseSigmaOf(car));
  const mean = sig.reduce((sum, v) => sum + v, 0) / Math.max(1, sig.length) || 1;
  const [lo, hi] = VSC_BALANCE.precisionClamp;
  return Float64Array.from(sig, (v) => VSC_BALANCE.marginSec * clamp(mean > 0 ? v / mean : 1, lo, hi)).subarray(0, sim.n);
};

/** A new neutralisation from race.js (`state.safetyCar` the step sim has not taken on yet). */
const spawn = (state) => {
  const sim = state._sim;
  const sc = state.safetyCar;
  const lapSec = state.race.baseLap * SC_BALANCE.lapFactor;
  if (sc.virtual) {
    sim.neutral = {
      ref: sc,
      virtual: true,
      since: sim.clock,
      cleanupUntil: sim.clock + (Number.isFinite(sc.cleanupSec) ? sc.cleanupSec : Math.max(1, sc.laps) * state.race.baseLap * SC_BALANCE.virtualLapFactor),
      ending: false,
      endingAt: null,
      delta: new Float64Array(sim.n),
      margin: marginsOf(state),
    };
    sc.ending = false;
    return;
  }
  const leader = leaderOf(state);
  const profile = profileOf(sim, state);
  // A rolling restart after a red flag: the SC already leads the field, for its laps from race.js.
  // SIM-C4 (GS-12): a wet start - the SC leads the field away from the grid (START_BEHIND_SC) for sc.laps laps.
  const wetStart = Boolean(sc.wetStart);
  const rolling = wetStart || !Number.isFinite(sc.cleanupSec);
  const N = {
    ref: sc,
    virtual: false,
    wetStart,
    wetLaps: wetStart ? Math.max(1, sc.laps || 1) : 0,
    dueAt: null,
    phase: wetStart ? SC_PHASE.START_BEHIND_SC : rolling ? SC_PHASE.TRAIN : SC_PHASE.DEPLOYED,
    since: sim.clock,
    cleanupUntil: sim.clock + (rolling ? Math.max(0, (sc.laps || 1) - 1) * lapSec : sc.cleanupSec),
    P: 0,
    v: 0,
    inLane: !rolling,
    laneS: 0,
    lightsOn: true,
    gone: false,
    offAt: null,
    passedLineAt: null,
    groupedOnce: false,
    forced: false,
    unlap: new Uint8Array(sim.n),
    profile,
  };
  const Pl = leader >= 0 ? sim.P[leader] : 0;
  if (rolling) {
    N.P = Pl + SC_BALANCE.trainGapMetres / sim.tables.length;
    N.v = speedAt(sim, profile, N.P);
  } else {
    N.laneS = Math.max(0, Math.min(sim.lane.geo.limitToS, sim.lane.geo.total));
    N.v = sim.lane.vLimit;
    N.P = Pl + frac(laneDistance(sim, N.laneS) - Pl);
  }
  sim.neutral = N;
  sc.phase = SC_PHASES[N.phase];
  sc.lightsOn = true;
};

/** The neutralisation is over: green flag, DRS waits after it (RF-SIM-08), `sc-in` as the quick mode pushes it. */
const endNeutral = (state, push) => {
  const sim = state._sim;
  const N = sim.neutral;
  const lap = state.lap;
  state.safetyCar = null;
  state.restartLap = lap;
  sim.neutral = null;
  if (sim.unlapSide) sim.unlapSide.fill(0);
  push(state, sim.leaderLap, { type: "sc-in", virtual: N.virtual, t: round(sim.clock) });
};

const setPhase = (state, N, phase, push, extra = {}) => {
  N.phase = phase;
  state.safetyCar.phase = SC_PHASES[phase];
  push(state, state._sim.leaderLap, { type: "sc-phase", phase: SC_PHASES[phase], t: round(state._sim.clock), ...extra });
};

/**
 * Before the cars move: take on a new neutralisation, drop one race.js has ended (a red flag), move the safety car,
 * and run the VSC's clock. `push` is lapModel.pushEvent.
 */
export const neutralStep = (state, push) => {
  const sim = state._sim;
  const sc = state.safetyCar;
  if (!sc || sc.red) {
    sim.neutral = null;
    return;
  }
  if (!sim.neutral || sim.neutral.ref !== sc) spawn(state);
  const N = sim.neutral;
  const { dt, tables } = sim;
  if (N.virtual) {
    if (!N.ending && sim.clock >= N.cleanupUntil) {
      const warn = sim.rules.raceControl.vscEndingWarn;
      N.ending = true;
      sc.ending = true;
      N.endingAt = sim.clock + (warn ? neutralStream(state).range(warn.minSec, warn.maxSec) : 0);
      push(state, sim.leaderLap, { type: "vsc-ending", t: round(sim.clock), greenAt: round(N.endingAt) });
    }
    if (N.ending && sim.clock >= N.endingAt) endNeutral(state, push);
    return;
  }
  if (N.gone) return;
  N.prevP = N.P;
  if (N.inLane) {
    const geo = sim.lane.geo;
    const target = speedAt(sim, N.profile, N.P);
    N.v = Math.min(Math.max(target, sim.lane.vLimit), N.v + SC_BALANCE.sc.exitAccelMps2 * dt);
    N.laneS += N.v * dt;
    if (N.laneS >= geo.total) {
      N.inLane = false;
      N.laneS = geo.total;
    }
    const d = laneDistance(sim, Math.min(N.laneS, geo.total - 1e-9));
    N.P = N.P + frac(d - N.P + 0.5) - 0.5;
    if (!N.inLane) setPhase(state, N, SC_PHASE.PICKUP, push);
    return;
  }
  const share = N.phase === SC_PHASE.PICKUP ? SC_BALANCE.sc.pickupPaceShare : 1;
  const target = speedAt(sim, N.profile, N.P) * share;
  N.v = Math.min(target, N.v + SC_BALANCE.sc.exitAccelMps2 * dt);
  N.P += (N.v * dt) / tables.length;
  // The control line: UNLAPPING ends there once the lapped cars are through (art. 55.13 "the following lap").
  if (Math.floor(N.P) > Math.floor(N.prevP)) N.passedLineAt = sim.clock;
  if (N.phase === SC_PHASE.IN_THIS_LAP) {
    const entry = sim.tables.dOfTau ? dAtEntry(sim) : 0;
    if (crossed(frac(N.prevP), frac(N.P), entry) && N.P - N.offAt >= SC_BALANCE.sc.inThisLapMinShare) {
      N.gone = true;
      N.v = 0;
      if (sim.rules.raceControl.sc && sim.rules.raceControl.sc.restartLine === "sc1") {
        setPhase(state, N, SC_PHASE.RESTART, push);
        endNeutral(state, push);
      } else setPhase(state, N, SC_PHASE.RESTART, push);
    }
  }
};

const dAtEntry = (sim) => {
  const { pitEntryTau, dOfTau, M } = sim.tables;
  const x = frac(pitEntryTau) * M;
  const i = Math.min(M - 1, x | 0);
  return dOfTau[i] + (dOfTau[i + 1] - dOfTau[i]) * (x - i);
};

/** Car `i`'s VSC speed cap (time share per second): the minimum time's rate, corrected towards its margin. */
export const vscRate = (sim, N, i, baseLap) => {
  const e = N.delta[i] - N.margin[i];
  const { min, max } = VSC_BALANCE.speedShare;
  return clamp(1 + VSC_BALANCE.gain * e, min, max) / (baseLap * SC_BALANCE.virtualLapFactor);
};

/** After car `i` moved from tau0 to tau1 under the VSC: its delta (s over the minimum time). */
export const vscDeltaStep = (sim, N, i, tau0, tau1, baseLap) => {
  N.delta[i] += sim.dt - (tau1 - tau0) * baseLap * SC_BALANCE.virtualLapFactor;
};

/** Gap (m) from car `i` to the safety car ahead of it on the road, or Infinity if the SC is not just ahead. */
export const gapToSc = (sim, N, i, P = sim.P[i]) => {
  if (!N || N.virtual || N.gone) return Infinity;
  const g = frac(N.P - P);
  return g < 0.5 ? g * sim.tables.length : Infinity;
};

/**
 * Car `i`'s speed cap under the safety car (time share per second), the quick mode's pace for the train: SC pace close
 * up, catch-up pace further back (safetyCar.trainGapMetres, catchUp); a lapped car let through goes at its own pace
 * until it is past the SC; at the restart the leader goes at restartGoMetres from the line and the rest follow.
 */
export const scRateCap = (state, i, rate) => {
  const sim = state._sim;
  const N = sim.neutral;
  const baseLap = state.race.baseLap;
  const scRate = 1 / (baseLap * SC_BALANCE.lapFactor);
  const leader = N.leader;
  if (N.unlap[i] === 1) return rate;
  if (N.phase === SC_PHASE.RESTART) {
    if (i !== leader) return rate;
    const toLine = (1 - frac(sim.P[i])) * sim.tables.length;
    return toLine <= SC_BALANCE.sc.restartGoMetres ? rate : Math.min(rate, scRate);
  }
  const gap = i === leader ? gapToSc(sim, N, i) : sim.ahead[i] >= 0 ? sim.gapM[i] : Infinity;
  if (gap > SC_BALANCE.trainGapMetres) return Math.min(rate, scRate * SC_BALANCE.catchUp);
  return Math.min(rate, scRate);
};

const WEAVING = new Set([SC_PHASE.START_BEHIND_SC, SC_PHASE.TRAIN, SC_PHASE.UNLAPPING, SC_PHASE.IN_THIS_LAP]);

/**
 * SIM-C4 (F1M24-CHINA AUD-C9, race-sim.json safetyCar.weave, OpenF1 9480/9655): car `i`'s weave behind the safety car
 * now - `lat` the lateral target (m off the line) and `speed` the factor on its speed cap - or null where nobody
 * weaves (no SC, the VSC, the SC still in the pit lane or picking up the leader, the restart, a lapped car going by,
 * the pit lane). Both are sines of the race clock with zero mean, so the train's lap lasts what it did (SRS 4.2);
 * each car's phase is drawn once on its own `seed::weave` stream, so no other draw moves (RNF-05, RF-SIM-15).
 */
export const weaveOf = (state, i) => {
  const sim = state._sim;
  const N = sim && sim.neutral;
  const W = WEAVE_BALANCE;
  if (!W || !N || N.virtual || !WEAVING.has(N.phase) || N.unlap[i] === 1 || sim.inPit[i] !== 0) return null;
  if (!sim.weavePhase) {
    const stream = createStream(`${state.seed}::weave`);
    sim.weavePhase = Float64Array.from({ length: sim.n }, () => stream.range(0, 2 * Math.PI));
  }
  const x = (2 * Math.PI * sim.clock) / W.periodSec + sim.weavePhase[i];
  return { lat: W.amplitudeM * Math.sin(x), speed: 1 + W.speedShare * Math.cos(x) };
};

/** May car `i` pass car `a` ahead of it under the safety car? Only a lapped car let through, past a car a lap ahead. */
export const unlapExempt = (sim, i) => {
  const N = sim.neutral;
  return Boolean(N && !N.virtual && N.unlap[i] === 1 && sim.lapDiff[i] > 0);
};

/** The furthest car `i` may go this step behind the safety car (only the leader is held by it; the rest are waved by). */
export const scLimit = (sim, i, P1) => {
  const N = sim.neutral;
  if (!N || N.virtual || N.gone || i !== N.leader || N.unlap[i] === 1) return P1;
  const g = frac(N.P - sim.P0[i]);
  if (g >= 0.5) return P1;
  const limit = sim.P0[i] + g - sim.balance.traffic.minGapMetres / sim.tables.length;
  return P1 > limit ? Math.max(sim.P0[i], limit) : P1;
};

/** Is the field in line behind the safety car, every car within trainMaxLengths car lengths of the one ahead? */
export const trainGrouped = (state) => {
  const sim = state._sim;
  const N = sim.neutral;
  const most = (SC_BALANCE.sc.trainMaxLengths + 1) * sim.side.spec.carLength;
  for (let i = 0; i < sim.n; i += 1) {
    if (!sim.active[i] || sim.inPit[i] !== 0 || state.cars[i].status !== "running" || N.unlap[i] === 1) continue;
    const gap = i === N.leader ? gapToSc(sim, N, i) : sim.ahead[i] >= 0 ? frac(sim.P[sim.ahead[i]] - sim.P[i]) * sim.tables.length : 0;
    if (gap > most) return false;
  }
  return true;
};

/** Running cars lapped by the leader (art. 55.13: those to pass the train and the SC). */
const lappedCars = (state, leader) => {
  const sim = state._sim;
  const out = [];
  if (leader < 0) return out;
  for (let i = 0; i < sim.n; i += 1) {
    if (i === leader || !sim.active[i] || sim.inPit[i] !== 0 || state.cars[i].status !== "running") continue;
    if (sim.P[leader] - sim.P[i] >= 1) out.push(i);
  }
  return out;
};

/** The leader this step (set before the cars move, so every car reads the same one). */
export const neutralLeader = (state) => {
  const N = state._sim.neutral;
  if (N && !N.virtual) N.leader = leaderOf(state);
};

/** After the cars moved: the phase changes of the safety car (step mode). */
export const neutralAfter = (state, push) => {
  const sim = state._sim;
  const N = sim.neutral;
  if (!N || N.virtual || !state.safetyCar) return;
  const sc = state.safetyCar;
  const leader = N.leader;
  const most = (SC_BALANCE.sc.trainMaxLengths + 1) * sim.side.spec.carLength;
  if (N.phase === SC_PHASE.PICKUP && leader >= 0 && gapToSc(sim, N, leader) <= most) setPhase(state, N, SC_PHASE.TRAIN, push);
  const lastLap = sim.leaderLap >= state.laps;
  if (N.phase === SC_PHASE.START_BEHIND_SC) {
    // SIM-C4 (GS-12, FIA 2024 arts. 49.2, 51.1, 52.1): the SC leads its laps; on the last of them, with the field in
    // line, its lights go out and the release ("standing" or "rolling") is told - it comes in at the end of the lap.
    const grouped = trainGrouped(state);
    if (grouped) N.groupedOnce = true;
    const due = sim.leaderLap >= N.wetLaps;
    if (due && N.dueAt === null) N.dueAt = sim.clock;
    const forced = due && sim.clock - N.dueAt > SC_BALANCE.sc.maxWaitSec;
    if ((due && grouped) || forced || lastLap) {
      N.groupedOnce = true;
      const release = wetReleaseOf(state, sim.leaderLap);
      if (state.wetStart) state.wetStart.release = release;
      push(state, sim.leaderLap, wetReleaseEvent(release, sim.leaderLap));
      lightsOff(state, N, push, { grouped, forced: forced && !grouped, wetStart: true, release });
    }
  } else if (N.phase === SC_PHASE.TRAIN) {
    const grouped = trainGrouped(state);
    if (grouped) N.groupedOnce = true;
    const due = sim.clock >= N.cleanupUntil;
    const forced = due && sim.clock - N.cleanupUntil > SC_BALANCE.sc.maxWaitSec;
    if ((due && grouped) || forced || lastLap) {
      N.forced = forced && !grouped;
      N.groupedOnce = true;
      const lapped = !lastLap && sim.rules.raceControl.sc && sim.rules.raceControl.sc.unlapping ? lappedCars(state, leader) : [];
      if (lapped.length) {
        if (!sim.unlapSide) sim.unlapSide = new Int8Array(sim.n);
        lapped.forEach((i) => {
          N.unlap[i] = 1;
          sim.unlapSide[i] = -sim.side.pitSide;
        });
        N.unlapFrom = sim.clock;
        setPhase(state, N, SC_PHASE.UNLAPPING, push, { grouped, forced: N.forced, carIds: lapped.map((i) => state.cars[i].id) });
      } else {
        lightsOff(state, N, push, { grouped, forced: N.forced });
      }
    }
  } else if (N.phase === SC_PHASE.UNLAPPING) {
    let waiting = false;
    for (let i = 0; i < sim.n; i += 1) {
      if (N.unlap[i] !== 1) continue;
      // Past the SC (it is behind this car on the road), or out of the race or in the pit lane: done.
      if (!sim.active[i] || sim.inPit[i] !== 0 || gapToSc(sim, N, i) === Infinity) {
        N.unlap[i] = 2;
        sim.unlapSide[i] = 0;
      } else waiting = true;
    }
    const timedOut = sim.clock - N.unlapFrom > SC_BALANCE.sc.maxWaitSec;
    if ((!waiting && N.passedLineAt !== null && N.passedLineAt > N.unlapFrom) || timedOut || lastLap) {
      for (let i = 0; i < sim.n; i += 1) {
        if (N.unlap[i] === 1) sim.unlapSide[i] = 0;
        N.unlap[i] = 0;
      }
      lightsOff(state, N, push, { grouped: trainGrouped(state) });
    }
  }
  sc.lightsOn = N.lightsOn;
};

const lightsOff = (state, N, push, extra) => {
  N.lightsOn = false;
  N.offAt = N.P;
  setPhase(state, N, SC_PHASE.IN_THIS_LAP, push, extra);
};

/** The leader is at the control line (stepRace endLap): the restart is over there in the "control" eras. */
export const neutralLine = (state, push) => {
  const N = state._sim.neutral;
  if (!N || N.virtual || N.phase !== SC_PHASE.RESTART) return false;
  endNeutral(state, push);
  return true;
};

/** F1M24-GAMEPLAY §1.7 `snapshot.sc`: `{ phase, s, v, lap, lightsOn }` (plus `inPit`), null without a safety car. */
export const scSnapshot = (state) => {
  const N = state._sim && state._sim.neutral;
  if (!N || N.virtual || !state.safetyCar) return null;
  return { phase: SC_PHASES[N.phase], s: round(frac(N.P), 5), v: round(N.gone ? 0 : N.v, 2), lap: Math.floor(N.P) + 1, lightsOn: N.lightsOn, inPit: N.inLane || N.gone };
};

/** F1M24-GAMEPLAY §1.7 `snapshot.vsc`: `{ deltaSec[i], ending }` (s over the minimum time, by car index), null without one. */
export const vscSnapshot = (state) => {
  const N = state._sim && state._sim.neutral;
  if (!N || !N.virtual || !state.safetyCar) return null;
  return { deltaSec: Array.from(N.delta, (v) => round(v, 2)), ending: N.ending };
};
