/**
 * Overtaking as a duel for a corner (RF-SIM-07, SRS 2.3 point 3 and 4.2 step 3).
 *
 * When a car reaches an attack point (a fixed distance before one of the circuit's
 * braking zones, see trackTables) within `duel.triggerSec` of the car ahead on the same
 * lap, it claims the corner. Up to `duel.maxClaim` cars take part: the defender, the
 * attacker and, if it is right there too, the car behind the attacker.
 *
 * The attacker's chance is the quick mode's pass chance (race.js passChanceOf: circuit,
 * underlying pace difference, DRS, battery via race.js energyPush, racecraft, a cold tyre
 * ahead, rain) plus the
 * attacker's risk order and the defender's style (RF-CMD-01), weighted by how good a
 * place to pass this braking zone is (the length of the straight before it). Outcomes:
 *
 *   pass       the attacker goes for the inside and is let through physically: a short
 *              speed edge for it and a loss for the defender until it is a car's length
 *              clear (or `passMaxSeconds` run out).
 *   defended   both lose a little through the corner (more with Block), the attacker
 *              cools down for `cooldownSec`.
 *   incident   contact: damage and lost time, or a retirement that can bring out the
 *              safety car.
 *
 * Whoever loses the corner may try a switchback at its exit if still within
 * `switchback.gapMetres`. The third car of a claim attacks whoever is in front of it once
 * the first pair is settled, at a reduced chance. No duel is fought for a corner under a
 * local yellow (RF-SIM-10), and a contact is looked at by the stewards exactly as in the
 * quick mode (race.js collisionInvestigation, race-control stream).
 *
 * The drivers (RF-STF-02, engine/drivers/skills.js, data/balance/driver-attributes.json): the
 * attacker's overtaking, late braking and aggression against the defender's defending and
 * braking enter the chance exactly as in the quick mode (passSkillTerm); aggression also
 * widens the gap the attacker goes from and raises the squeeze (contact) risk. Geometry
 * (WP4, SIM-FISICA §3.5): before the braking zone the defender may cover the inside, its one
 * move (a block always, otherwise by defending and aggression); covered, the attacker goes
 * round the outside, and the chance of the attempt is shared between the two cases so its mean
 * stays the quick mode's (the geometry decides which attempts end in a pass, not how many).
 * The attacker brakes later than the defender by its braking and aggression; overlapping by
 * `claimOverlap` of a car at the turn-in, the two go through the corner side by side
 * (`alongside`), whoever wins it. The lateral state of each car (`LANE`) is for the view.
 *
 * A pass is completed on the road by speed (SIM-2): nobody is moved forward by hand, and the
 * boxes never overlap (lateral.js); a pass that cannot be finished within `passSettleSeconds`
 * after the corner is logged as "unfinished".
 *
 * SIM-4 (F1M24-GAMEPLAY §1.7, §2.7 eventos-duelo; RF-SIM-07, RF-CMD-03, RF-3D-04): what the view, the sound and
 * the radio read about the fights, all derived from the state above with no roll of its own (RNF-05):
 *
 *   battle[i]  RUNNING, FOLLOWING (within `followGapSec` of the car ahead on its lap), ATTACKING (in a duel as
 *              the attacker, or within `attackGapSec` with the pace or DRS to try), DEFENDING (the car it is
 *              fighting, or the one attacking it from behind) and TRAIN (following in a run of at least
 *              `trainMinCars` cars each within the follow gap, with no move on); `hysteresisSec` keeps a car in
 *              its state until the gap has opened that much more (race-physics.json duel). Nobody battles
 *              behind the safety car or the red flag, in the pit lane or past the flag.
 *   duel       events {phase: "start" | "alongside" | "resolved", carId (attacker), otherId, side ("inside" |
 *              "outside"), corner, attempt (this attacker's tries on this car in the current fight), result
 *              ("passed" | "defended" | "contact"), t}: "start" when the attempt is made at the attack point,
 *              "alongside" the first step the two overlap by a car's length, "resolved" when the corner is
 *              settled on the road (the pass done, the defence held, a touch).
 *   pass       also carries `confirmedAt`: the race time at which the attacker reaches the first timing line
 *              (sector line or the line) after the corner, at its lap's pace - the timing point that confirms
 *              the move (race-2 §4: the banner comes when the timing shows it, not at the move).
 *   radio      the engineer to the player's drivers (state.radio, kinds "battle-*"), on those events and on the
 *              gaps at the line, with the thresholds and quiet times of race-sim.json `radio`.
 *
 * SIM-8 (F1M24-GAMEPLAY §2.7 duelo-geometrico, SIM-FISICA §3.5; RF-SIM-07, RF-STF-02): the fight is kept per
 * pair. Each attacker counts its held attempts on each defender (`pairTries`) and waits `pairCooldownSec` before
 * trying the same car again; after `attemptsPerDefender.max` in a row it sits back `restLaps` base laps. The
 * loser of a corner is in SWITCHBACK until the exit while it has `switchback.attemptsPerFight` left. A third car
 * claims the corner only if three of the era's boxes fit across the measured asphalt (lateral.js fitsAbreast).
 * Every claim makes one incident roll: the calibrated touch (entryInside with the attacker on the inside, paid
 * now; exitOutside with it on the outside, paid at the exit) or, side by side with the winner on the inside, a
 * squeeze of the car on the outside at the exit (back out or pushed wide, no touch; resolveClaim). The pass
 * chance is untouched: the geometry decides which attempts end in a pass, how often a pair tries and what a
 * fight costs, while the passes per lap stay the quick mode's (equivalence.test.js, duelGeometry.test.js).
 *
 * Every number comes from data/balance/race-sim.json, race-physics.json `lateral` / `duel` and
 * driver-attributes.json (RNF-07);
 * every roll from the duel stream (RF-SIM-15).
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import { applyContact, collisionInvestigation, energyPush } from "../race";
import { contactOutcome } from "../incidents";
import { coldForPass, gripC, windowFor } from "../tyres/thermal";
import { drsOpen } from "../rules";
import { pushEvent, wetnessAt } from "./lapModel";
import { LANE, LANE_NAMES, LATERAL, fitsAbreast } from "./lateral";
import physicsData from "../../data/balance/race-physics.json";
import { DRIVER_BALANCE, contactFactorOf, coverChanceOf, lateBrakeMetresOf, passSkillTerm, switchbackSkillTerm, triggerFactorOf } from "../drivers/skills";

export const ROLE = { NONE: 0, PASSING: 1, YIELDING: 2, LOST: 3, HELD: 4 };

// ------------------------------------------------------------ SIM-4: battles

/** SIM-4 (§1.7 `battle[i]`): each car's state in the fight, for the director, the crowd and the HUD. */
export const BATTLE = { RUNNING: 0, FOLLOWING: 1, ATTACKING: 2, DEFENDING: 3, TRAIN: 4 };
export const BATTLE_NAMES = ["RUNNING", "FOLLOWING", "ATTACKING", "DEFENDING", "TRAIN"];
/** race-physics.json `duel`: the gaps of the battle states (RNF-07). */
export const BATTLE_BALANCE = physicsData.duel;

const r3 = (value) => Math.round(value * 1000) / 1000;
const fracOf = (value) => value - Math.floor(value);

/** SIM-4: the per-car arrays of the battle states, duel events and battle radio (allocated once, RNF-01). */
export const battleSetup = (n, timingTau) => ({
  battle: new Uint8Array(n),
  battleTmp: new Uint8Array(n),
  battleLink: new Uint8Array(n),
  // The current fight: whom this car attacks, how many tries so far, and the duel being told.
  attemptOn: new Int32Array(n).fill(-1),
  attemptN: new Int32Array(n),
  duelLive: new Uint8Array(n),
  duelAlong: new Uint8Array(n),
  duelCorner: new Int32Array(n),
  duelLine: new Int8Array(n),
  duelQueue: [],
  // The gaps at the last line (for "you're catching him" / "he's coming"), and the radio's quiet times.
  lineAheadGap: new Float64Array(n).fill(NaN),
  lineAheadOf: new Int32Array(n).fill(-1),
  lineBehindGap: new Float64Array(n).fill(NaN),
  lineBehindOf: new Int32Array(n).fill(-1),
  radioQuiet: new Map(),
  // Time shares of the timing lines of a lap (sector lines; the line is 1), for `pass.confirmedAt`.
  timingTau,
});

/**
 * SIM-4 (§1.7 `pass.confirmedAt`): the race time at which car `a` reaches the first timing line after time
 * share `fromTau` of its lap (a sector line from the circuit's sectors, or the line), at its lap's pace.
 */
export const confirmTimeOf = (sim, a, fromTau) => {
  const lines = sim.timingTau;
  const from = fracOf(fromTau);
  let next = 1;
  for (let k = 0; k < lines.length; k += 1) {
    if (lines[k] > from + 1e-9) {
      next = lines[k];
      break;
    }
  }
  const now = fracOf(sim.tau[a]);
  // The timing line ahead of the car: past the corner's exit, so never behind it (the exit may wrap the line).
  let share = next - now;
  if (share <= 0) share += 1;
  return r3(sim.clock + share * sim.budget[a]);
};

/** SIM-4: a `duel` event of the attacker `a` on `b` (§1.7). */
const duelEvent = (state, a, b, phase, extra = {}) => {
  const sim = state._sim;
  pushEvent(state, sim.laps[a] + 1, {
    type: "duel",
    phase,
    carId: state.cars[a].id,
    otherId: state.cars[b].id,
    side: sim.duelLine[a] < 0 ? "outside" : "inside",
    corner: sim.duelCorner[a] || null,
    attempt: sim.attemptN[a],
    t: r3(sim.clock),
    ...extra,
  });
};

// ------------------------------------------------------------ SIM-8: the duel's geometry

/** race-physics.json `duel.geometry` (SIM-8, RNF-07). */
export const DUEL_GEOMETRY = physicsData.duel.geometry;

/** SIM-8: what a claim leaves for the corner's exit (claimKind). */
const CLAIM = { NONE: 0, CONTACT_EXIT: 1, SQUEEZE: 2 };

/**
 * SIM-8 (SIM-FISICA §3.5): the per-pair state of the fights (allocated once, RNF-01). `pairTries[i·n+j]` the
 * attempts of `i` on `j` held in the current fight, `pairCool` until when `i` does not try `j` again,
 * `pairSwitch` the switchbacks of `i` on `j` in the fight; the claim's incident left for the exit of the
 * corner (`claim*`, on the attacker's index) and the squeeze being paid (`squeeze*`, on the victim's).
 */
export const duelGeometrySetup = (n) => ({
  pairTries: new Int32Array(n * n),
  pairCool: new Float64Array(n * n),
  pairSwitch: new Int32Array(n * n),
  claimTau: new Float64Array(n).fill(-1),
  claimKind: new Uint8Array(n),
  claimOther: new Int32Array(n).fill(-1),
  claimVictim: new Int32Array(n).fill(-1),
  claimCorner: new Int32Array(n),
  claimSign: new Int8Array(n),
  squeezeUntil: new Float64Array(n),
  // The time the squeeze costs, paid as a lift (stepRace advance, squeeze.liftFactor).
  squeezeDelay: new Float64Array(n),
  squeezeSide: new Int8Array(n),
  squeezeWide: new Uint8Array(n),
  squeezeShare: DUEL_GEOMETRY.squeeze.edgeShare,
});

/** SIM-8: may `i` try `j` now (its pair's cool-down over)? Without the pair arrays, always. */
export const pairOpen = (sim, i, j) => !sim.pairCool || sim.pairCool[i * sim.n + j] <= sim.clock;

/**
 * SIM-8: an attempt of `i` on `j` held. The next one on that car waits `pairCooldownSec`; after
 * `attemptsPerDefender.max` held in a row, the attacker sits back for `restLaps` base laps (its tyres).
 * Without the pair arrays, the old single cool-down of the attacker.
 */
export const heldAttempt = (state, i, j) => {
  const sim = state._sim;
  if (!sim.pairCool) {
    sim.cooldownUntil[i] = sim.clock + sim.balance.duel.cooldownSec;
    return;
  }
  const A = DUEL_GEOMETRY.attemptsPerDefender;
  const k = i * sim.n + j;
  sim.pairTries[k] += 1;
  if (sim.pairTries[k] >= A.max) {
    sim.pairTries[k] = 0;
    sim.pairCool[k] = sim.clock + A.restLaps * state.race.baseLap;
  } else sim.pairCool[k] = sim.clock + A.pairCooldownSec;
};

/** SIM-8: may the loser `i` of a corner come back at `j` at its exit (switchbacks left in the fight)? */
export const switchbackLeft = (sim, i, j) => !sim.pairSwitch || sim.pairSwitch[i * sim.n + j] < DUEL_GEOMETRY.switchback.attemptsPerFight;

/** SIM-8: car `i` no longer follows anyone - its fight is over: the counts of its pairs start again. */
export const resetFight = (sim, i) => {
  if (!sim.pairTries) return;
  const row = i * sim.n;
  for (let j = 0; j < sim.n; j += 1) {
    sim.pairTries[row + j] = 0;
    sim.pairSwitch[row + j] = 0;
  }
};

/** SIM-8: leave the claim's incident (a touch or a squeeze) for the exit of the corner, on the attacker `a`. */
const leaveClaim = (sim, a, b, kind, victim, zone) => {
  sim.claimTau[a] = zone.exitTau;
  sim.claimKind[a] = kind;
  sim.claimOther[a] = b;
  sim.claimVictim[a] = victim;
  sim.claimCorner[a] = zone.corner || 0;
  sim.claimSign[a] = zone.sign || 1;
};

/**
 * SIM-8: the attacker `a` reaches the exit of a claimed corner whose single incident roll left something
 * there. A touch on the outside (exitOutside) is paid now, as contact() pays one at the entry. A squeeze
 * only happens if the two are still within `squeeze.withinMetres`: the one on the outside backs out (it
 * lifts behind) or is pushed wide towards the edge, and loses its switchback. Rolls on the duel stream.
 */
export const resolveClaim = (state, a) => {
  const sim = state._sim;
  const kind = sim.claimKind[a];
  const b = sim.claimOther[a];
  const victim = sim.claimVictim[a];
  const corner = sim.claimCorner[a] || null;
  const sign = sim.claimSign[a];
  sim.claimTau[a] = -1;
  sim.claimKind[a] = CLAIM.NONE;
  sim.claimOther[a] = -1;
  sim.claimVictim[a] = -1;
  const lap = sim.laps[a] + 1;
  if (b < 0 || !sim.active[a] || !sim.active[b] || sim.inPit[a] !== 0 || sim.inPit[b] !== 0) return;
  // Neutralised before the exit (safety car, VSC, red flag): the fight is off, and so is what it left there.
  if (state.safetyCar || sim.red) return;
  if (kind === CLAIM.CONTACT_EXIT) {
    contact(state, a, b, corner, sim.streams.duel, lap, "exitOutside");
    sim.cooldownUntil[a] = sim.clock + sim.balance.duel.cooldownSec;
    return;
  }
  if (kind !== CLAIM.SQUEEZE || victim < 0) return;
  const other = victim === a ? b : a;
  const S = DUEL_GEOMETRY.squeeze;
  const gap = sim.P[victim] - sim.P[other];
  const apart = Math.abs(gap - Math.round(gap)) * sim.tables.length;
  if (apart > S.withinMetres) return;
  const backOut = sim.streams.duel.next() < S.backOutShare;
  sim.squeezeDelay[victim] += backOut ? S.backOutSec : S.pushWideSec;
  sim.squeezeUntil[victim] = sim.clock + S.wideSec;
  sim.squeezeWide[victim] = backOut ? 0 : 1;
  // The outside of the corner (sign + = right-hander, so its outside is to the left).
  sim.squeezeSide[victim] = -sign;
  // The counter-attack is gone with the room.
  if (sim.switchTarget[victim] >= 0) sim.switchTarget[victim] = -1;
  logDuel(state, { t: round(sim.clock), lap, corner, attacker: state.cars[a].id, defender: state.cars[b].id, outcome: "squeeze", kind: backOut ? "back-out" : "push-wide", victim: state.cars[victim].id, by: state.cars[other].id });
};

/**
 * SIM-8 (SIM-FISICA §3.5 `SWITCHBACK`): the state of car `i` in its fight for the view - "CLAIM" while it
 * fights for a corner, "SWITCHBACK" from losing a corner to its exit with a counter-attack left,
 * "SQUEEZED" while it pays a squeeze; null otherwise. No roll (RNF-05).
 */
export const fightOf = (sim, i) => {
  if (sim.squeezeUntil && sim.squeezeUntil[i] > sim.clock) return "SQUEEZED";
  if (sim.switchTarget[i] >= 0) return "SWITCHBACK";
  if (sim.duelRole[i] !== ROLE.NONE) return "CLAIM";
  return null;
};

/** SIM-4: a new attempt of `a` on `b` - the counter restarts when the target changes or the fight broke up (battleStep). */
const countAttempt = (sim, a, b, corner, line) => {
  if (sim.attemptOn[a] !== b) {
    sim.attemptOn[a] = b;
    sim.attemptN[a] = 0;
  }
  sim.attemptN[a] += 1;
  sim.duelCorner[a] = corner || 0;
  sim.duelLine[a] = line;
  sim.duelAlong[a] = 0;
};

/** RF-CMD-03: the engineer to a player's driver, unless it said the same thing less than `quietSec` ago. */
const battleRadio = (state, i, kind, extra = {}) => {
  const sim = state._sim;
  const cfg = sim.balance.radio;
  const car = state.cars[i];
  if (!cfg || !cfg.enabled || !car.isUser) return;
  const key = `${kind}:${car.id}`;
  const last = sim.radioQuiet.get(key);
  const quiet = cfg.quietSec[kind.replace("battle-", "")] ?? 0;
  if (last !== undefined && sim.clock - last < quiet) return;
  sim.radioQuiet.set(key, sim.clock);
  state.radio.push({ lap: sim.laps[i] + 1, carId: car.id, kind, t: r3(sim.clock), ...extra });
};

/** RF-CMD-03: the radio of a settled corner, to whichever of the two is the player's. */
const battleRadioOf = (state, a, b, passed) => {
  const other = { otherId: state.cars[b].id };
  battleRadio(state, a, passed ? "battle-passed" : "battle-attack-failed", other);
  battleRadio(state, b, passed ? "battle-lost" : "battle-defended", { otherId: state.cars[a].id });
};

/**
 * RF-CMD-03 at car `i`'s line: closing on the car ahead, or the car behind closing in, by more than
 * `gaining.minGainSecPerLap` since the last line and within `gaining.withinSec` / `closing.withinSec`.
 */
export const lineRadio = (state, i) => {
  const sim = state._sim;
  const cfg = sim.balance.radio;
  const car = state.cars[i];
  const a = sim.ahead[i];
  const b = sim.behind[i];
  const aheadGap = car.gapAhead;
  const behindGap = car.gapBehind;
  if (cfg && cfg.enabled && car.isUser && !state.safetyCar && !sim.red) {
    const was = sim.lineAheadGap[i];
    if (a >= 0 && sim.lineAheadOf[i] === a && Number.isFinite(aheadGap) && Number.isFinite(was)) {
      const gain = was - aheadGap;
      if (aheadGap <= cfg.gaining.withinSec && gain >= cfg.gaining.minGainSecPerLap) battleRadio(state, i, "battle-gaining", { otherId: state.cars[a].id, gap: r3(aheadGap), gain: r3(gain) });
    }
    const wasBehind = sim.lineBehindGap[i];
    if (b >= 0 && sim.lineBehindOf[i] === b && Number.isFinite(behindGap) && Number.isFinite(wasBehind)) {
      const gain = wasBehind - behindGap;
      if (behindGap <= cfg.closing.withinSec && gain >= cfg.closing.minGainSecPerLap) battleRadio(state, i, "battle-closing", { otherId: state.cars[b].id, gap: r3(behindGap), gain: r3(gain) });
    }
  }
  sim.lineAheadGap[i] = Number.isFinite(aheadGap) ? aheadGap : NaN;
  sim.lineAheadOf[i] = a;
  sim.lineBehindGap[i] = Number.isFinite(behindGap) ? behindGap : NaN;
  sim.lineBehindOf[i] = b;
};

/**
 * SIM-4, every step after the duels are settled: the "alongside" of live duels (the two within a car's length)
 * and the "resolved" of the duels that ended this step (queued by endDuel), with their radio.
 */
export const duelWatch = (state) => {
  const sim = state._sim;
  // Without its arrays (a test turning the telling off) nothing is told; the race is the same either way.
  if (!sim.duelLive) return;
  const L = sim.side.spec.carLength / sim.tables.length;
  for (let a = 0; a < sim.n; a += 1) {
    if (!sim.duelLive[a] || sim.duelAlong[a]) continue;
    const b = sim.duelOther[a];
    if (b < 0) continue;
    const d = sim.P[a] - sim.P[b];
    if (d > -L && d < L) {
      sim.duelAlong[a] = 1;
      duelEvent(state, a, b, "alongside");
    }
  }
  flushResolved(state);
};

/** SIM-4: tell the duels endDuel closed (their "resolved" event and the radio). */
const flushResolved = (state) => {
  const sim = state._sim;
  if (!sim.duelQueue.length) return;
  for (let k = 0; k < sim.duelQueue.length; k += 1) {
    const { a, b, passed } = sim.duelQueue[k];
    duelEvent(state, a, b, "resolved", { result: passed ? "passed" : "defended" });
    battleRadioOf(state, a, b, passed);
  }
  sim.duelQueue.length = 0;
};

/**
 * SIM-4 (§1.7 `battle[i]`), every step: the battle state of each car from the gaps measured at the start of
 * the step, the duel roles and the last states (hysteresis). No roll, no state the race reads (RNF-05).
 */
export const battleStep = (state) => {
  const sim = state._sim;
  const B = BATTLE_BALANCE;
  const out = sim.battleTmp;
  const link = sim.battleLink;
  const neutral = Boolean(state.safetyCar) || Boolean(sim.red);
  for (let i = 0; i < sim.n; i += 1) {
    out[i] = BATTLE.RUNNING;
    link[i] = 0;
    if (neutral || !sim.active[i] || sim.inPit[i] !== 0 || (sim.cool && sim.cool[i])) continue;
    const role = sim.duelRole[i];
    if (role === ROLE.PASSING || role === ROLE.LOST) {
      out[i] = BATTLE.ATTACKING;
      link[i] = 1;
      continue;
    }
    const a = sim.ahead[i];
    if (a < 0 || sim.lapDiff[i] !== 0 || !sim.active[a] || sim.inPit[a] !== 0) continue;
    const prev = sim.battle[i];
    const g = sim.gapS[i];
    const followLimit = B.followGapSec + (prev === BATTLE.FOLLOWING || prev === BATTLE.ATTACKING || prev === BATTLE.TRAIN ? B.hysteresisSec : 0);
    const attackLimit = B.attackGapSec + (prev === BATTLE.ATTACKING ? B.hysteresisSec : 0);
    const pace = (state.cars[a].expected ?? 0) - (state.cars[i].expected ?? 0);
    if (g <= attackLimit && (pace > B.attackMinPaceSec || sim.drsOpen[i] > 0)) out[i] = BATTLE.ATTACKING;
    else if (g <= followLimit) out[i] = BATTLE.FOLLOWING;
    if (g <= followLimit) link[i] = 1;
  }
  // The car being fought: the duel's other car, or the one ahead of an attacker.
  for (let i = 0; i < sim.n; i += 1) {
    const role = sim.duelRole[i];
    if ((role === ROLE.YIELDING || role === ROLE.HELD) && out[i] !== BATTLE.ATTACKING && !neutral && sim.active[i] && sim.inPit[i] === 0) out[i] = BATTLE.DEFENDING;
  }
  for (let i = 0; i < sim.n; i += 1) {
    if (out[i] !== BATTLE.ATTACKING) continue;
    const target = sim.duelOther[i] >= 0 ? sim.duelOther[i] : sim.ahead[i];
    if (target >= 0 && out[target] !== BATTLE.ATTACKING && sim.active[target] && sim.inPit[target] === 0) out[target] = BATTLE.DEFENDING;
  }
  // A train: a run of at least trainMinCars cars, each within the follow gap of the next; its followers with no move on.
  for (let i = 0; i < sim.n; i += 1) {
    if (out[i] !== BATTLE.FOLLOWING) continue;
    let cars = 1;
    let j = i;
    for (let k = 0; k < sim.n && link[j]; k += 1) {
      cars += 1;
      j = sim.ahead[j];
      if (j < 0 || j === i) break;
    }
    j = sim.behind[i];
    for (let k = 0; k < sim.n && j >= 0 && j !== i && link[j]; k += 1) {
      cars += 1;
      j = sim.behind[j];
    }
    if (cars >= B.trainMinCars) out[i] = BATTLE.TRAIN;
  }
  for (let i = 0; i < sim.n; i += 1) {
    // The fight is over when the car no longer follows anyone: the next try is a first one again.
    if (out[i] === BATTLE.RUNNING && sim.attemptOn[i] >= 0 && !(sim.duelLive && sim.duelLive[i])) sim.attemptOn[i] = -1;
    // SIM-8: so do the counts of its pairs (tries and switchbacks); a pair's cool-down runs on.
    if (out[i] === BATTLE.RUNNING && sim.battle[i] !== BATTLE.RUNNING) resetFight(sim, i);
    sim.battle[i] = out[i];
  }
};

/** §1.7 `battle[i]` by name, for the snapshot. */
export const battleOf = (sim, i) => BATTLE_NAMES[sim.battle[i]];

/** WP4 (SIM-FISICA §3.1): what each car is doing sideways, for the view (snapshot.lane). */
/** WP4 / SIM-2: what each car is doing sideways (lateral.js), for the view (snapshot.lane). */
export { LANE, LANE_NAMES };

export const styleOf = (balance, car) => balance.defence.styles[car.defence] || balance.defence.styles[balance.defence.default];
export const riskOf = (balance, car) => balance.risk.levels[car.overtakeRisk] || balance.risk.levels[balance.risk.default];

/**
 * Is DRS usable on this lap (RF-SIM-08)? The season's rules decide (rules.drsOpen: era,
 * zones on this circuit, from which lap, restarts, water); `gapSec` adds the detection gap.
 */
export const drsAllowed = (state, lap, gapSec) => {
  const sim = state._sim;
  if (state.safetyCar || !sim.tables.drsZones.length) return false;
  return drsOpen(sim.rules, { lap, wetness: wetnessAt(state, lap), zones: sim.tables.drsZones.length, restartLap: state.restartLap || 0, gapAhead: gapSec });
};

/**
 * SIM-6 (RF-SIM-07, race-tyres.json calls.passColdBelowC): is the defender's tyre cold right now - its heat
 * at this step (`tyreC`, the step simulator's two nodes), or the model's at the line - against its window?
 */
const coldDefender = (state, car) => {
  const th = car.tyreC || car.tyreThermal;
  return Boolean(th) && coldForPass(gripC(th), windowFor(car.compound, state._sim.rules.year ?? state.year));
};

/** The attacker's chance of making it through this corner. */
export const duelChance = (state, attacker, defender, zone, { drs = false, lap }) => {
  const { balance } = state._sim;
  const d = balance.duel;
  const delta = (defender.expected ?? 0) - (attacker.expected ?? 0);
  const wet = wetnessAt(state, lap) > d.wetFrom;
  // RF-SIM-05 / RF-SIM-07: the battery to attack or defend with, as the quick mode reads it (KERS, ERS, 2026 overtake mode).
  const attack = energyPush(state._sim.rules, attacker).attack;
  const defend = energyPush(state._sim.rules, defender).defend;
  const raw =
    d.base +
    (state.race.profile.overtaking ?? 0.55) * d.overtaking +
    (delta - d.paceThreshold) * d.pace +
    (drs ? balance.drs.duelBonus : 0) +
    // RF-STF-02: the drivers, as in the quick mode (race.js passChanceOf).
    passSkillTerm(attacker, defender) +
    (wet ? d.wet : 0) +
    attack -
    defend +
    // SIM-6 (RF-SIM-07): the defender on a cold tyre, by its heat at this step (tyreC) against its compound's window.
    (coldDefender(state, defender) ? d.coldTyre : 0) +
    riskOf(balance, attacker).chance +
    styleOf(balance, defender).chance;
  return clamp(raw, d.min, d.max) * zone.weight;
};

const logDuel = (state, entry) => {
  state.duels.push(entry);
};

/** Let `a` through `b` on the road. */
export const startPass = (state, a, b, sign, extra = {}) => {
  const sim = state._sim;
  const { duel } = sim.balance;
  const lateral = LATERAL;
  const style = styleOf(sim.balance, state.cars[b]);
  // SIM-4: a car caught while it was itself attacking someone - that fight is over.
  closeLive(sim, a);
  closeLive(sim, b);
  sim.duelOther[a] = b;
  sim.duelOther[b] = a;
  sim.duelRole[a] = ROLE.PASSING;
  sim.duelRole[b] = ROLE.YIELDING;
  sim.duelMult[a] = duel.passBoost;
  sim.duelMult[b] = -(duel.passDefenderLoss + style.defenderLoss);
  sim.duelUntil[a] = sim.clock + duel.passMaxSeconds;
  sim.duelUntil[b] = sim.clock + duel.passMaxSeconds;
  sim.latTarget[a] = sign * lateral.attackMetres;
  sim.latTarget[b] = -sign * lateral.attackMetres * 0.4;
  sim.switchTarget[a] = -1;
  sim.latState[a] = extra.alongside ? LANE.ALONGSIDE : sign === (extra.inside ?? sign) ? LANE.ATTACK_IN : LANE.ATTACK_OUT;
  sim.latState[b] = extra.alongside ? LANE.ALONGSIDE : LANE.DEFEND;
  // SIM-4: a move fought for (not a team order) is a live duel until the road settles it.
  if (sim.duelLive) sim.duelLive[a] = extra.duel ? 1 : 0;
  // The corner the move is made at (also for a team order), for the log of a pass left unfinished.
  if (sim.duelCorner && extra.corner) sim.duelCorner[a] = extra.corner;
  if (extra.event !== false) {
    const type = extra.type || "pass";
    pushEvent(state, sim.laps[a] + 1, {
      type, carId: state.cars[a].id, otherId: state.cars[b].id, corner: extra.corner ?? null, drs: Boolean(extra.drs),
      ...(extra.switchback ? { switchback: true } : {}),
      ...(state.cars[a].overtakeActive ? { overtakeMode: true } : {}),
      // SIM-4 (§1.7): the timing line after the corner confirms the pass.
      ...(type === "pass" && sim.timingTau ? { confirmedAt: confirmTimeOf(sim, a, extra.exitTau ?? sim.tau[a]) } : {}),
    });
  }
};

/**
 * The defender `b` keeps the corner from `a` (held, or SIM-8: side by side to a touch at the exit): both
 * lose a little through it, the attacker on its line, the defender on its one move.
 */
const holdCorner = (state, a, b, zone, side, covered, alongside, style) => {
  const sim = state._sim;
  const d = sim.balance.duel;
  sim.duelRole[a] = ROLE.LOST;
  sim.duelRole[b] = ROLE.HELD;
  sim.duelOther[a] = b;
  sim.duelOther[b] = a;
  sim.duelMult[a] = -style.attackerLoss;
  sim.duelMult[b] = -style.defenderLoss;
  sim.duelUntil[a] = sim.clock + d.passMaxSeconds * 0.5;
  sim.duelUntil[b] = sim.clock + d.passMaxSeconds * 0.5;
  sim.latTarget[a] = side * LATERAL.attackMetres;
  // The defender's single move: to the inside if it covered, else it holds its line (FIA ISC App. L ch. IV 2b).
  sim.latTarget[b] = covered ? zone.sign * LATERAL.blockMetres : alongside ? -side * sim.side.spec.carWidth * 0.5 : 0;
  sim.latState[a] = alongside ? LANE.ALONGSIDE : side === zone.sign ? LANE.ATTACK_IN : LANE.ATTACK_OUT;
  sim.latState[b] = alongside ? LANE.ALONGSIDE : LANE.DEFEND;
};

/**
 * SIM-4: a live duel ends - queue its "resolved" event (told by duelWatch at the end of the step, where the
 * state is at hand): passed if the attacker is ahead on the road, else defended.
 */
const closeLive = (sim, k) => {
  if (!sim.duelLive || !sim.duelLive[k]) return;
  const o = sim.duelOther[k];
  sim.duelLive[k] = 0;
  if (o >= 0) sim.duelQueue.push({ a: k, b: o, passed: sim.duelRole[k] === ROLE.PASSING && sim.P[k] > sim.P[o] });
};

const queueResolved = (sim, i, other) => {
  if (!sim.duelLive) return;
  const attacking = (k) => k >= 0 && (sim.duelRole[k] === ROLE.PASSING || sim.duelRole[k] === ROLE.LOST);
  const a = attacking(i) ? i : attacking(other) ? other : -1;
  if (a < 0 || !sim.duelLive[a]) return;
  const b = sim.duelOther[a];
  sim.duelLive[a] = 0;
  if (b < 0) return;
  sim.duelQueue.push({ a, b, passed: sim.duelRole[a] === ROLE.PASSING && sim.P[a] > sim.P[b] });
};

/** The duel is over: both back to their own pace and line. */
export const endDuel = (sim, i) => {
  const other = sim.duelOther[i];
  queueResolved(sim, i, other);
  sim.duelRole[i] = ROLE.NONE;
  sim.duelMult[i] = 0;
  sim.duelUntil[i] = 0;
  sim.duelOther[i] = -1;
  sim.latTarget[i] = 0;
  sim.latState[i] = LANE.RACING;
  if (other >= 0 && sim.duelOther[other] === i) {
    sim.latState[other] = LANE.RACING;
    sim.duelRole[other] = ROLE.NONE;
    sim.duelMult[other] = 0;
    sim.duelUntil[other] = 0;
    sim.duelOther[other] = -1;
    sim.latTarget[other] = 0;
  }
};

/**
 * RF-SIM-09: a touch in a duel. The victim takes the same outcome as in the quick mode
 * (engine/incidents.js contactOutcome via race.js applyContact: retirement, broken suspension,
 * puncture, front wing or time), paid on the road as a delay; debris may bring race control.
 */
const contact = (state, a, b, corner, stream, lap, kind = "entryInside") => {
  const sim = state._sim;
  const victim = stream.chance(0.5) ? b : a;
  const other = victim === a ? b : a;
  // SIM-8: where in the corner the touch was (the claim's geometry: inside at the entry, outside at the exit).
  logDuel(state, { t: round(sim.clock), lap, corner, attacker: state.cars[a].id, defender: state.cars[b].id, outcome: "incident", kind, victim: state.cars[victim].id });
  // SIM-4: the corner is settled by the touch.
  if (sim.duelLive) duelEvent(state, a, b, "resolved", { result: "contact", victimId: state.cars[victim].id, kind });
  // A touch at the exit ends whatever the two were still doing in the corner.
  if (sim.duelOther[a] === b) endDuel(sim, a);
  const outcome = contactOutcome(stream);
  if (outcome.kind === "retire") {
    sim.retireAt(victim, "collision", corner);
    stewards(state, a, b);
    return;
  }
  const car = state.cars[victim];
  sim.delay[victim] += applyContact(state, car, outcome, { otherId: state.cars[other].id, corner, stream, lap: sim.laps[victim] + 1, raceLap: sim.leaderLap });
  sim.afterIncident();
  stewards(state, a, b);
};

/** RF-SIM-10: after a contact the stewards may look at the attacker (the quick mode's rule and stream). */
const stewards = (state, a, b) => collisionInvestigation(state, state.cars[a], state.cars[b].id, state._sim.leaderLap);

const round = (value) => Math.round(value * 100) / 100;

/**
 * Car `i` has reached attack point `z`. `ahead` is the car in front of it on the road at
 * the start of the step and `gapSec` the gap to it.
 */
export const openDuel = (state, i, z, ahead, gapSec, behind, behindGap) => {
  const sim = state._sim;
  const { balance } = sim;
  const d = balance.duel;
  // RF-STF-02: an aggressive driver goes for it from further back.
  if (ahead < 0 || gapSec > d.triggerSec * triggerFactorOf(state.cars[i])) return;
  // SIM-8: the cool-down is per pair (a touch still stops the attacker for a while, contact below).
  if (sim.cooldownUntil[i] > sim.clock || !pairOpen(sim, i, ahead) || sim.duelRole[i] !== ROLE.NONE || sim.duelRole[ahead] === ROLE.PASSING || sim.duelRole[ahead] === ROLE.YIELDING) return;
  // SIM-8: a corner whose exit still owes the last claim's incident is not claimed again by the same car.
  if (sim.claimTau && sim.claimTau[i] >= 0) return;
  const zone = sim.tables.attacks[z];
  // RF-SIM-10: no passing under a local yellow at this corner.
  if (sim.yellows.length && sim.yellows.some((flag) => flag.corner === zone.corner)) return;
  const attacker = state.cars[i];
  const defender = state.cars[ahead];
  const lap = sim.laps[i] + 1;
  const stream = sim.streams.duel;

  // Team-mates: a hold order keeps them in station; a swap order is obeyed here.
  if (attacker.teamId === defender.teamId) {
    const order = state.teamOrders[attacker.teamId];
    if (order === "hold") return;
    if (order === "swap" && gapSec <= balance.teamOrders.swapGapSec) {
      startPass(state, i, ahead, zone.sign, { type: "swap", corner: zone.corner });
      state.teamOrders[attacker.teamId] = "free";
      return;
    }
  }

  const drs = sim.drsOpen[i] > 0 && sim.drsOpen[i] - 1 === zone.drs && drsAllowed(state, lap);
  const chance = duelChance(state, attacker, defender, zone, { drs, lap });
  // SIM-8 (SIM-FISICA §3.5 claim): a third car only if three of the era's boxes fit across the asphalt here.
  const third =
    Math.min(d.maxClaim, DUEL_GEOMETRY.claim.maxCars) >= 3 && behind >= 0 && behindGap <= d.triggerSec && sim.duelRole[behind] === ROLE.NONE && sim.cooldownUntil[behind] <= sim.clock && fitsAbreast(sim.side, sim.P[ahead], 3)
      ? behind
      : -1;
  const style = styleOf(balance, defender);
  // RF-SIM-09: the era's calibration of duel touches against f1db (race-reliability.json calibration.stepCollision).
  // RF-STF-02: the squeeze - aggressive drivers touch more (drivers/skills.js contactFactorOf, as the quick mode).
  const incidentChance =
    d.incident.base * sim.collisionScale * (1 + wetnessAt(state, lap) * d.incident.wet) * riskOf(balance, attacker).incident * style.incident * contactFactorOf(attacker, defender) * (third >= 0 ? d.incident.threeWide : 1);
  // WP4: the defender's one move - cover the inside or not - and the attacker's line.
  const geo = DRIVER_BALANCE.effects.step;
  const cover = coverChanceOf(defender, defender.defence);
  const covered = stream.next() < cover;
  const open = cover < 1 ? (1 - cover * geo.cover.coveredFactor) / (1 - cover) : 1;
  // SRS 4.2: `stepScale` calibrates the step mode's passes per race on the quick mode's (equivalence.test.js).
  const lineChance = clamp(chance * d.stepScale * (covered ? geo.cover.coveredFactor : open), 0, d.max);
  const side = covered ? -zone.sign : zone.sign;
  // §3.3: how much later the attacker brakes; side by side if it reaches the turn-in alongside.
  // SIM-2: the era's car (race-physics.json lateral.eras, FIA technical regulations).
  const L = sim.side.spec.carLength;
  const late = lateBrakeMetresOf(attacker, defender, attacker.overtakeRisk === "high" ? 1 : 0);
  const overlap = (late - Math.max(0, sim.gapM[i] - L)) / L;
  const alongside = overlap >= geo.lateBrake.claimOverlap;
  const success = stream.next() < lineChance;
  const entry = {
    t: round(sim.clock), lap, corner: zone.corner, attacker: attacker.id, defender: defender.id, chance: round(lineChance), drs, claim: third >= 0 ? 3 : 2,
    line: side === zone.sign ? "inside" : "outside", covered, overlap: round(overlap), alongside,
  };

  // SIM-4: the attempt starts here (its outcome is already drawn; the events tell it as the road plays it out).
  if (sim.duelLive) {
    countAttempt(sim, i, ahead, zone.corner, side === zone.sign ? 1 : -1);
    duelEvent(state, i, ahead, "start", { drs, claim: entry.claim });
  }
  // SIM-8 (SIM-FISICA §3.5): one incident roll per claim. The touch keeps the calibrated chance (contacts per
  // race against the quick mode and f1db); the corner's geometry says which touch it is - the attacker on the
  // inside hits at the entry (now), on the outside at the exit (paid there, resolveClaim). The winner of the
  // corner on the inside may instead squeeze the one on the outside at the exit, if still alongside (no touch).
  const winnerInside = success ? side === zone.sign : side !== zone.sign;
  const winner = success ? i : ahead;
  const loser = success ? ahead : i;
  // The squeeze is rolled here and happens at the exit only if the two are still side by side there (resolveClaim).
  const squeezeChance = winnerInside && sim.claimTau ? DUEL_GEOMETRY.squeeze.chance * contactFactorOf(state.cars[winner], state.cars[loser]) : 0;
  const contactChance = incidentChance * (success ? 1 : d.incident.onDefended);
  const roll = stream.next();
  if (roll < contactChance) {
    if (side === zone.sign || !sim.claimTau) {
      contact(state, i, ahead, zone.corner, stream, lap, "entryInside");
      sim.cooldownUntil[i] = sim.clock + d.cooldownSec;
      return;
    }
    // On the outside: through the corner side by side, the touch at its exit; no pass, no switchback.
    closeLive(sim, ahead);
    holdCorner(state, i, ahead, zone, side, covered, alongside, style);
    leaveClaim(sim, i, ahead, CLAIM.CONTACT_EXIT, -1, zone);
    logDuel(state, { ...entry, outcome: "claim-contact" });
    return;
  }
  const squeeze = roll < contactChance + squeezeChance;
  if (success) {
    startPass(state, i, ahead, side, { corner: zone.corner, drs, alongside, inside: zone.sign, duel: true, exitTau: zone.exitTau });
    logDuel(state, { ...entry, outcome: "pass", ...(squeeze ? { squeeze: true } : {}) });
    // The one who lost the corner may come back at its exit (SIM-8: SWITCHBACK, while it has some left).
    if (switchbackLeft(sim, ahead, i)) {
      sim.switchTarget[ahead] = i;
      sim.switchTau[ahead] = zone.exitTau;
      sim.switchCorner[ahead] = zone.corner;
    }
    if (squeeze) leaveClaim(sim, i, ahead, CLAIM.SQUEEZE, loser, zone);
  } else {
    closeLive(sim, ahead);
    holdCorner(state, i, ahead, zone, side, covered, alongside, style);
    // SIM-8: the attempt is held - the pair's cool-down, and after too many a rest (race-physics.json duel.geometry).
    heldAttempt(state, i, ahead);
    if (switchbackLeft(sim, i, ahead)) {
      sim.switchTarget[i] = ahead;
      sim.switchTau[i] = zone.exitTau;
      sim.switchCorner[i] = zone.corner;
    }
    if (squeeze) leaveClaim(sim, i, ahead, CLAIM.SQUEEZE, loser, zone);
    // SIM-4: a live duel until the defence has held through the corner (settleDuels ends it).
    if (sim.duelLive) sim.duelLive[i] = 1;
    logDuel(state, { ...entry, outcome: "defended", ...(squeeze ? { squeeze: true } : {}) });
  }

  // Three into one corner: the third car goes for whoever is now in front of it.
  if (third >= 0) {
    const target = success ? ahead : i;
    if (sim.duelRole[target] === ROLE.PASSING || sim.duelRole[target] === ROLE.YIELDING) {
      sim.cooldownUntil[third] = sim.clock + d.cooldownSec;
      return;
    }
    // SIM-8: the third car's own pair - not while it is cooling down on that car.
    if (!pairOpen(sim, third, target)) return;
    const thirdChance = duelChance(state, state.cars[third], state.cars[target], zone, { drs: false, lap }) * d.thirdCarFactor;
    const made = stream.next() < thirdChance;
    logDuel(state, { t: round(sim.clock), lap, corner: zone.corner, attacker: state.cars[third].id, defender: state.cars[target].id, chance: round(thirdChance), drs: false, claim: 3, outcome: made ? "pass" : "defended" });
    // SIM-4: the third car's attempt, round the other side; a failed one is settled at once (it never gets alongside).
    if (sim.duelLive) {
      countAttempt(sim, third, target, zone.corner, -1);
      duelEvent(state, third, target, "start", { drs: false, claim: 3 });
    }
    if (made) startPass(state, third, target, -zone.sign, { corner: zone.corner, duel: true, exitTau: zone.exitTau });
    else {
      heldAttempt(state, third, target);
      if (sim.duelLive) {
        duelEvent(state, third, target, "resolved", { result: "defended", claim: 3 });
        battleRadioOf(state, third, target, false);
      }
    }
  }
};

/**
 * Car `i` has reached the exit of a corner it lost: a switchback on `target` if it is
 * still close enough.
 */
export const trySwitchback = (state, i, target, gapMetres) => {
  const sim = state._sim;
  const sb = sim.balance.duel.switchback;
  const corner = sim.switchCorner[i];
  sim.switchTarget[i] = -1;
  // RF-SIM-10: no switchback under a local yellow either.
  if (sim.yellows.length && sim.yellows.some((flag) => flag.corner === corner)) return;
  if (target < 0 || gapMetres > sb.gapMetres || sim.duelRole[target] === ROLE.PASSING || sim.duelRole[target] === ROLE.YIELDING) return;
  // SIM-8: one of the fight's switchbacks used (race-physics.json duel.geometry.switchback.attemptsPerFight).
  if (sim.pairSwitch) sim.pairSwitch[i * sim.n + target] += 1;
  const me = state.cars[i];
  const them = state.cars[target];
  const delta = (them.expected ?? 0) - (me.expected ?? 0);
  // RF-STF-02: overtaking against defending (drivers/skills.js switchbackSkillTerm).
  const chance = clamp(sb.base + delta * sb.pace + switchbackSkillTerm(me, them) + riskOf(sim.balance, me).chance, 0, sb.max);
  const made = sim.streams.duel.next() < chance;
  logDuel(state, { t: round(sim.clock), lap: sim.laps[i] + 1, corner, attacker: me.id, defender: them.id, chance: round(chance), drs: false, claim: 2, outcome: made ? "switchback" : "switchback-failed" });
  if (made) {
    if (sim.duelOther[i] >= 0) endDuel(sim, i);
    if (sim.duelOther[target] >= 0) endDuel(sim, target);
    // SIM-4: the corner before is settled, and the switchback is a new attempt, on the outside of the exit.
    if (sim.duelLive) {
      flushResolved(state);
      countAttempt(sim, i, target, corner, -1);
      duelEvent(state, i, target, "start", { switchback: true });
    }
    startPass(state, i, target, -1, { corner, switchback: true, duel: true });
    // SIM-8: the car passed back waits its pair's cool-down before trying again (it was the global one before).
    if (sim.pairCool) sim.pairCool[target * sim.n + i] = sim.clock + DUEL_GEOMETRY.attemptsPerDefender.pairCooldownSec;
    else sim.cooldownUntil[target] = sim.clock + sim.balance.duel.cooldownSec;
  } else if (sim.duelLive) {
    // SIM-4: a switchback tried and not made - an attempt held at once.
    countAttempt(sim, i, target, corner, -1);
    duelEvent(state, i, target, "start", { switchback: true });
    duelEvent(state, i, target, "resolved", { result: "defended", switchback: true });
  }
  // SIM-8: the cool-down of this pair (without the pair arrays, the attacker's own as before).
  if (sim.pairCool) sim.pairCool[i * sim.n + target] = sim.clock + DUEL_GEOMETRY.attemptsPerDefender.pairCooldownSec;
  else sim.cooldownUntil[i] = sim.clock + sim.balance.duel.cooldownSec;
};
