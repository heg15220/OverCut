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
 * SIM-C2 (F1M24-CHINA §2.2 GS-04 / VIEW-09, §1.5 «Claves del duelo»; RF-SIM-07, RF-SIM-08, RF-SIM-15, SRS 4.2): the
 * pass with DRS on the straight, STRAIGHT_PASS. On a braking zone fed by a DRS zone, a car with the flap open makes
 * its attempt `straightPass.decideAfterM` into the zone instead of at the attack point, if its gap then, less what the
 * flap gains it by the attack point (race-sim.json drs.speedGain), is within the trigger. The roll is the attack
 * point's own - the same chance, the same draws in the same order, one per braking zone and lap - so the passes per
 * lap stay the quick mode's: only where the pass happens changes. A pass won there is driven on the straight in three
 * readable phases: `pullOut` (the attacker moves over at lateral.maxRate), `alongside` (overlapping by less than a
 * car's length, at a closing speed that keeps it there between `minAlongsideSec` and `maxAlongsideSec`) and `ahead`
 * (in front by `confirmLengths` car lengths, before `completeBeforeBrakeM` short of the braking point). Its `pass`
 * event is told then, with `confirmedAt` at the next timing line from there (`straight: true`); a pass that cannot be
 * finished on the straight goes on into the braking zone as every other pass does and is told when it leaves the
 * straight. A held attempt, a touch or a squeeze drawn on the straight is settled at the attack point, where it
 * always was. No draw of its own (RNF-05).
 *
 * SIM-C3 (F1M24-CHINA §2.2 GS-05 / VIEW-09, §1.5 «Claves del duelo»; RF-SIM-07, RF-SIM-15, SRS 4.2): the cost of a pass,
 * `duel.rePass`. A car passed by another (a pass, a switchback, a team order) makes no attempt of its own on that car for
 * `rePassLaps` base laps unless it is faster by `rePassPaceSec` a lap (the quick mode's pace, as the duel reads it): no
 * ping-pong. Its answer in the same corner is still the switchback at the exit (SIM-8), which is part of the fight. The
 * hold is per pair and ordered: passing the car back undoes the other's. No draw (RNF-05).
 *
 * Every number comes from data/balance/race-sim.json, race-physics.json `lateral` / `duel` and
 * driver-attributes.json (RNF-07);
 * every roll from the duel stream (RF-SIM-15).
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import { applyContact, collisionInvestigation, energyPush } from "../race";
import { contactConfirmMetres, contactOutcome, crowdFactor, crowdWindowMetres } from "../incidents";
import { coldForPass, gripC, windowFor } from "../tyres/thermal";
import { drsOpen } from "../rules";
import { pushEvent, wetnessAt } from "./lapModel";
import { LANE, LANE_NAMES, LATERAL, fitsAbreast, roomAt } from "./lateral";
import { dAt } from "./trackTables";
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
const CLAIM = { NONE: 0, CONTACT_EXIT: 1, SQUEEZE: 2, CONTACT_ENTRY: 3 };

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
  // SIM-C3 (GS-05): until when `i` makes no attempt on `j` (rePassUntil[i·n+j]), the car that has just passed it.
  rePassUntil: new Float64Array(n * n),
  // SIM-C3 (VIEW-09): the pass of each attacker waiting to be made on the road before it is told (passTellStep).
  passPending: new Array(n).fill(null),
});

/**
 * SIM-C3 (GS-05 / VIEW-09, race-sim.json duel.rePass): `b` has just been passed by `a` - it holds off `a` for
 * rePassLaps base laps; and `a`'s own hold on `b`, if it had one, is over. Without the block or the arrays, nothing.
 */
export const passedBy = (state, b, a) => {
  const sim = state._sim;
  const cfg = sim.balance.duel.rePass;
  if (!cfg || !sim.rePassUntil || a < 0 || b < 0) return;
  sim.rePassUntil[b * sim.n + a] = sim.clock + cfg.rePassLaps * state.race.baseLap;
  sim.rePassUntil[a * sim.n + b] = 0;
};

/**
 * SIM-C3: is `i` still holding off `j`, the car that passed it - inside rePassLaps and not faster by rePassPaceSec a
 * lap (j's expected lap less i's)? A pure read (RNF-05).
 */
export const rePassHeld = (state, i, j) => {
  const sim = state._sim;
  const cfg = sim.balance.duel.rePass;
  if (!cfg || !sim.rePassUntil || !(sim.rePassUntil[i * sim.n + j] > sim.clock)) return false;
  const pace = (state.cars[j].expected ?? 0) - (state.cars[i].expected ?? 0);
  return pace < cfg.rePassPaceSec;
};

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
  if (kind === CLAIM.CONTACT_EXIT || kind === CLAIM.CONTACT_ENTRY) {
    contact(state, a, b, corner, sim.streams.duel, lap, kind === CLAIM.CONTACT_ENTRY ? "entryInside" : "exitOutside");
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
 * SIM-C3 (AUD-C11 motor, GS-05), every step after the cars moved: a touch on the inside left by a claim is paid the
 * first step the two boxes are together (contactConfirmed), so the touch the view and the sound get is one they can
 * show; if they never get that close it is paid at the corner's exit as before (checkpoints, resolveClaim). The roll
 * was made at the attack point; nothing new is drawn here.
 */
export const claimTouchStep = (state) => {
  const sim = state._sim;
  if (!sim.claimKind) return;
  for (let a = 0; a < sim.n; a += 1) {
    if (sim.claimKind[a] !== CLAIM.CONTACT_ENTRY) continue;
    const b = sim.claimOther[a];
    if (b >= 0 && sim.active[a] && sim.active[b] && sim.inPit[a] === 0 && sim.inPit[b] === 0 && contactConfirmed(sim, a, b)) resolveClaim(state, a);
  }
};

/**
 * SIM-8 (SIM-FISICA §3.5 `SWITCHBACK`): the state of car `i` in its fight for the view - "CLAIM" while it
 * fights for a corner, "SWITCHBACK" from losing a corner to its exit with a counter-attack left,
 * "SQUEEZED" while it pays a squeeze; null otherwise. No roll (RNF-05).
 */
export const fightOf = (sim, i) => {
  if (sim.squeezeUntil && sim.squeezeUntil[i] > sim.clock) return "SQUEEZED";
  // SIM-C2: a pass being driven on a DRS straight (its phase is snapshot.straightPass).
  if (sim.spPhase && sim.spPhase[i] !== SP.NONE && sim.spPhase[i] !== SP.AHEAD) return "STRAIGHT_PASS";
  if (sim.switchTarget[i] >= 0) return "SWITCHBACK";
  if (sim.duelRole[i] !== ROLE.NONE) return "CLAIM";
  return null;
};

// ------------------------------------------------------------ SIM-C2: the pass on the straight

/** SIM-C2 (F1M24-CHINA §2.2 GS-04): the phases of STRAIGHT_PASS, and their names for the snapshot. */
export const SP = { NONE: 0, PULL_OUT: 1, ALONGSIDE: 2, AHEAD: 3 };
export const SP_NAMES = [null, "pullOut", "alongside", "ahead"];

const wrapHalf = (value) => value - Math.round(value);

/**
 * SIM-C2: where on each braking zone's approach the attempt is made on the straight (race-sim.json duel.straightPass).
 * For every attack point fed by a DRS zone: the time share of the decision (`decideAfterM` past the zone's start),
 * the distance share of the braking point and of the end of the straight pass (`completeBeforeBrakeM` short of it);
 * -1 where the straight left is shorter than `minRunM` or there is no DRS zone. Without the block, nothing (the
 * attempt stays at the attack point, as before). Per-car state allocated once (RNF-01).
 */
export const straightPassSetup = (n, tables, balance) => {
  const cfg = balance.duel.straightPass;
  const k = tables.attacks.length;
  const spTau = new Float64Array(k).fill(-1);
  const spBrakeD = new Float64Array(k);
  const spEndD = new Float64Array(k);
  const len = tables.length;
  if (cfg && cfg.enabled) {
    for (let z = 0; z < k; z += 1) {
      const attack = tables.attacks[z];
      if (!(attack.drs >= 0) || !tables.drsZones[attack.drs]) continue;
      const brake = fracOf(dAt(tables, attack.tau) + balance.duel.approachMetres / len);
      let start = fracOf(tables.drsZones[attack.drs].from + cfg.decideAfterM / len);
      // SIM-C3 (GS-05, SRS 4.2): a straight that crosses the line is decided decideAfterM past the line, on the lap of
      // the attack point - each car's pace there is the plan it makes at the line (the pit wall's answer to the car
      // behind included), as the attempt at the attack point reads it; decided before the line, the attacker read the
      // pace of the lap ending against a defender not yet pushing, and passed more often (Bahrain T1: +0.17 s/lap).
      if (fracOf(-start) * len < fracOf(brake - start) * len) start = fracOf(cfg.decideAfterM / len);
      const run = fracOf(brake - start) * len;
      if (run - cfg.completeBeforeBrakeM < cfg.minRunM) continue;
      spTau[z] = tables.tauAt(start);
      spBrakeD[z] = brake;
      spEndD[z] = fracOf(brake - cfg.completeBeforeBrakeM / len);
    }
  }
  return {
    spTau,
    spBrakeD,
    spEndD,
    spPhase: new Uint8Array(n),
    spOther: new Int32Array(n).fill(-1),
    spZ: new Int32Array(n).fill(-1),
    // The braking zone (z + 1) whose attempt was made on the straight, and the car's lap count when it reaches its attack point.
    spZone: new Int32Array(n),
    spLapAt: new Int32Array(n),
    spT0: new Float64Array(n),
    spLaneSec: new Float64Array(n).fill(-1),
    spAlongFrom: new Float64Array(n).fill(-1),
    spAlongSec: new Float64Array(n),
    // The pass event told when the pass is made, the duel log's entry, and an outcome left for the attack point.
    spEvent: new Array(n).fill(null),
    spEntry: new Array(n).fill(null),
    spPlan: new Array(n).fill(null),
    // The pace each car planned for the lap before its current one, and the lap its plan is for (stepRace beginLap).
    expPrev: new Float64Array(n),
    expLap: new Int32Array(n),
  };
};

/** SIM-C2: the straight pass's phase of car `i` for the snapshot ("pullOut" | "alongside" | "ahead"), null out of one. */
export const straightPassOf = (sim, i) => (sim.spPhase ? SP_NAMES[sim.spPhase[i]] : null);

/**
 * SIM-C2: is car `i`, at the decision point of attack `z` with its DRS open for that zone, within the trigger of the
 * car ahead once the flap has taken its share by the attack point? The gap it would have there (RF-SIM-08).
 */
export const straightGapOf = (sim, i, z, ahead = sim.ahead[i]) => {
  const attack = sim.tables.attacks[z];
  // A car ahead with its own flap open in the same zone (a DRS train) gives nothing back: the gap stays as it is.
  if (ahead >= 0 && sim.drsOpen[ahead] > 0 && sim.drsOpen[ahead] - 1 === attack.drs) return sim.gapS[i];
  const toAttack = fracOf(attack.tau - fracOf(sim.tau[i])) * sim.budget[i];
  return sim.gapS[i] - toAttack * sim.balance.drs.speedGain;
};

/** SIM-C2: start driving the pass won on the straight (startPass with `straight`). */
const beginStraight = (state, a, b, z, event) => {
  const sim = state._sim;
  sim.spPhase[a] = SP.PULL_OUT;
  sim.spOther[a] = b;
  sim.spZ[a] = z;
  sim.spT0[a] = sim.clock;
  sim.spLaneSec[a] = -1;
  sim.spAlongFrom[a] = -1;
  sim.spAlongSec[a] = 0;
  sim.spEvent[a] = event;
  // pullOut: the attacker moves over to its side as far as the asphalt lets it (the line before a braking zone often
  // runs by the outside edge); the defender keeps the rest of a car's width and the clearance on the other side.
  // On a straight the attacker pulls out to the side with more asphalt left to the end of the move (the corner's
  // inside or outside is decided in the braking zone, which a pass made here never reaches).
  const G = sim.side;
  const roomOf = (dd, s) => Math.max(0, s > 0 ? roomAt(G, dd, 1) : -roomAt(G, dd, -1));
  const reachOf = (s) => Math.min(LATERAL.attackMetres, roomOf(sim.P[a], s), roomOf(sim.spEndD[z], s));
  // Of the sides where the two fit across (the attacker's reach plus the room the defender has on the other side), the
  // one it gets to with the shorter move from where it is; with neither, the one with more room.
  const drawn = sim.latTarget[a] < 0 ? -1 : 1;
  const fits = (s) => reachOf(s) + roomOf(sim.P[b], -s) >= G.spec.separation;
  const moveOf = (s) => Math.abs(s * reachOf(s) - sim.lat[a]);
  let sideA = reachOf(-drawn) > reachOf(drawn) ? -drawn : drawn;
  if (fits(drawn) && fits(-drawn)) sideA = moveOf(-drawn) < moveOf(drawn) ? -drawn : drawn;
  else if (fits(-drawn) !== fits(drawn)) sideA = fits(drawn) ? drawn : -drawn;
  const reachA = reachOf(sideA);
  sim.latTarget[a] = sideA * reachA;
  // The defender holds where it is unless that leaves less than a car's width and the clearance between the two.
  const holdB = sideA > 0 ? Math.min(sim.lat[b], sim.latTarget[a] - G.spec.separation) : Math.max(sim.lat[b], sim.latTarget[a] + G.spec.separation);
  sim.latTarget[b] = holdB;
  // The car being passed makes no attempt of its own at this braking zone (passed in the braking zone, it would
  // still be giving way there): its answer is the switchback at the exit, as for any pass.
  if (sim.spZone[b] === 0) {
    const attackTau = sim.tables.attacks[z].tau;
    sim.spZone[b] = z + 1;
    sim.spLapAt[b] = sim.laps[b] + Math.floor(sim.tau[b]) + (attackTau > fracOf(sim.tau[b]) ? 0 : 1);
  }
  // The pass keeps its edge into the braking zone if it is not done on the straight (settleDuels).
  const brakeTau = sim.tables.tauAt(sim.spBrakeD[z]);
  const toBrake = fracOf(brakeTau - fracOf(sim.tau[a])) * sim.budget[a];
  sim.duelUntil[a] = sim.clock + toBrake + sim.balance.duel.passMaxSeconds;
  sim.duelUntil[b] = sim.duelUntil[a];
};

/**
 * SIM-C2: the speed of attacker `i` this step while it drives a straight pass - its own (`mult`, the flap and the
 * tow) closing on the defender at a speed that brings it alongside `alongsideTargetSec` before the end of the
 * straight pass, at most `maxClosingKmh` faster; alongside, the defender's speed plus what crosses (1 +
 * confirmLengths) car lengths in the time left, held between `minAlongsideSec` and `maxAlongsideSec` for the two
 * car lengths of the overlap; never above its own speed plus duel.straight.attackerBoost nor above what it would reach
 * itself at the braking point. Returns the new multiplier of its step (no draw).
 */
export const straightMult = (sim, i, tau0, rate, mult) => {
  const b = sim.spOther[i];
  const cfg = sim.balance.duel.straightPass;
  if (b < 0 || !sim.active[b] || sim.inPit[b] !== 0 || !cfg) return mult;
  const { tables, dt } = sim;
  const len = tables.length;
  const vNat = ((dAt(tables, tau0 + rate * mult * dt) - dAt(tables, tau0)) * len) / dt;
  if (!(vNat > 0)) return mult;
  const rest = fracOf(sim.spEndD[sim.spZ[i]] - fracOf(sim.P0[i])) * len;
  if (rest > len / 2) return mult;
  // The defender has moved first this step (front to back); its speed of this step, or of the last.
  const vb = sim.v[b] > 0 ? sim.v[b] : vNat;
  const L = sim.side.spec.carLength;
  const d = wrapHalf(sim.P0[i] - sim.P0[b]) * len;
  const tLeft = rest / Math.max(1, vb);
  const confirm = cfg.confirmLengths * L;
  // Aim to be done one alongside phase before the end of the straight pass, not on its last metre.
  const aim = cfg.alongsideTargetSec;
  let v;
  if (d <= -L) {
    const tClose = tLeft - 2 * aim;
    const most = cfg.maxClosingKmh / 3.6;
    const rel = tClose > dt ? Math.min(most, (-d - L) / tClose) : most;
    v = Math.min(vb + most, Math.max(vNat, vb + rel));
  } else {
    const lo = (2 * L) / cfg.maxAlongsideSec;
    const hi = (2 * L) / cfg.minAlongsideSec;
    const want = Math.max((confirm + L) / aim, (confirm - d) / Math.max(dt, tLeft - aim));
    v = vb + (want < lo ? lo : want > hi ? hi : want);
  }
  // At most the duel's edge on a straight above its own speed with the flap and the tow (race-sim.json
  // duel.straight.attackerBoost), and never above the speed it would reach itself at the braking point (its trace
  // there, scaled as here): the move is made with the speed carried out of the tow, the field's top speed stays
  // under the DRS-and-tow ceiling (speeds.test.js). Without a trace, never above its own speed.
  const { vRef, M } = tables;
  const here = vRef ? vRef[Math.min(M - 1, (fracOf(tau0) * M) | 0)] : 0;
  const atBrake = vRef ? vRef[Math.min(M - 1, (fracOf(tables.tauAt(sim.spBrakeD[sim.spZ[i]])) * M) | 0)] : 0;
  const top = here > 0 && atBrake > 0 ? vNat * Math.max(1, atBrake / here) : vNat;
  const most = Math.min(vNat * (1 + sim.balance.duel.straight.attackerBoost), Math.max(vNat, top));
  return mult * (Math.min(v, most) / vNat);
};

/** SIM-C2: tell the pass of a straight pass (its event, kept back since the attempt) and log how it went. */
const finishStraight = (state, a, completed) => {
  const sim = state._sim;
  const b = sim.spOther[a];
  const z = sim.spZ[a];
  const len = sim.tables.length;
  const event = sim.spEvent[a];
  if (event && !completed && sim.passPending && b >= 0) {
    // SIM-C3 (VIEW-09): carried on into the braking zone, it is told when the road makes it (passTellStep).
    sim.passPending[a] = { event: { ...event, straight: false }, b, exitTau: sim.tables.attacks[z].exitTau };
    sim.spEvent[a] = null;
  } else if (event) {
    const zone = sim.tables.attacks[z];
    pushEvent(state, sim.laps[a] + 1, {
      ...event,
      // straight: made on the straight (true) or carried on into the braking zone (false).
      straight: completed,
      // SIM-4 (§1.7): the timing line after the move confirms it - from here if it is done, else after the corner.
      ...(sim.timingTau ? { confirmedAt: confirmTimeOf(sim, a, completed ? sim.tau[a] : zone.exitTau) } : {}),
    });
    sim.spEvent[a] = null;
  }
  const entry = sim.spEntry[a];
  if (entry) {
    entry.sp = {
      completed,
      laneSec: sim.spLaneSec[a] >= 0 ? r3(sim.spLaneSec[a]) : null,
      alongsideSec: r3(sim.spAlongFrom[a] >= 0 && sim.spAlongSec[a] === 0 ? sim.clock - sim.spAlongFrom[a] : sim.spAlongSec[a]),
      // How far short of the braking point the attacker was in front by confirmLengths (null if it was not).
      aheadBeforeBrakeM: completed ? Math.round(fracOf(sim.spBrakeD[z] - fracOf(sim.P[a])) * len * 10) / 10 : null,
      t: r3(sim.clock),
    };
    logDuel(state, entry);
    sim.spEntry[a] = null;
  }
  sim.spPhase[a] = completed && b >= 0 ? SP.AHEAD : SP.NONE;
  if (!completed) {
    sim.spOther[a] = -1;
    sim.spZ[a] = -1;
    return;
  }
  // Done: both back to the line (the attacker a car's length in front), and the move is held as a pass until the
  // corner's exit - as a pass made in the braking zone is, with its edge and the loser's loss through the corner -
  // so that neither car makes or takes another attempt at this braking zone and the gap after it is a pass's; the
  // loser's answer is the switchback at the exit (straightPassStep).
  sim.latTarget[a] = 0;
  sim.latTarget[b] = 0;
  sim.latState[a] = LANE.RACING;
  sim.latState[b] = LANE.RACING;
};

/**
 * SIM-C2, every step after the cars moved (before the passes are settled): the phases of the straight passes from
 * where the two cars are - `alongside` once they overlap, done when the attacker is `confirmLengths` ahead, handed
 * to the braking zone at the end of the straight pass, or told at once if the pass broke off (an error, the pit
 * lane, a neutralisation). No draw (RNF-05).
 */
export const straightPassStep = (state) => {
  const sim = state._sim;
  if (!sim.spPhase) return;
  const len = sim.tables.length;
  const L = sim.side.spec.carLength;
  const W = sim.side.spec.carWidth;
  for (let a = 0; a < sim.n; a += 1) {
    const phase = sim.spPhase[a];
    if (phase === SP.NONE) continue;
    const b = sim.spOther[a];
    const live = b >= 0 && sim.active[a] && sim.active[b] && sim.inPit[a] === 0 && sim.inPit[b] === 0 && sim.duelRole[a] === ROLE.PASSING && sim.duelOther[a] === b && !state.safetyCar && !sim.red;
    if (phase === SP.AHEAD) {
      // Held as a pass until the attacker is through the corner's exit; then the duel ends as any other does.
      const toExit = fracOf(dAt(sim.tables, sim.tables.attacks[sim.spZ[a]].exitTau) - fracOf(sim.P[a])) * len;
      // Back behind (a lift, an error through the corner): no longer "ahead" - the move goes on as any pass does
      // (settleDuels ends it once it is clear, or logs it unfinished).
      const behindNow = live && wrapHalf(sim.P[a] - sim.P[b]) <= 0;
      if (!live || toExit > len / 2 || behindNow) {
        if (behindNow) {
          sim.spPhase[a] = SP.NONE;
          sim.spOther[a] = -1;
          sim.spZ[a] = -1;
          continue;
        }
        if (live) endDuel(sim, a);
        sim.spPhase[a] = SP.NONE;
        sim.spOther[a] = -1;
        sim.spZ[a] = -1;
      }
      continue;
    }
    if (!live) {
      finishStraight(state, a, false);
      continue;
    }
    const d = wrapHalf(sim.P[a] - sim.P[b]) * len;
    if (sim.spLaneSec[a] < 0 && Math.abs(sim.lat[a] - sim.lat[b]) >= W) sim.spLaneSec[a] = sim.clock - sim.spT0[a];
    if (phase === SP.PULL_OUT && d > -L) {
      sim.spPhase[a] = SP.ALONGSIDE;
      sim.spAlongFrom[a] = sim.clock;
      sim.latState[a] = LANE.ALONGSIDE;
      sim.latState[b] = LANE.ALONGSIDE;
    }
    if (sim.spPhase[a] === SP.ALONGSIDE && d >= L && sim.spAlongSec[a] === 0) sim.spAlongSec[a] = sim.clock - sim.spAlongFrom[a];
    if (d >= sim.balance.duel.straightPass.confirmLengths * L) {
      if (sim.spAlongSec[a] === 0 && sim.spAlongFrom[a] >= 0) sim.spAlongSec[a] = sim.clock - sim.spAlongFrom[a];
      finishStraight(state, a, true);
      continue;
    }
    const rest = fracOf(sim.spEndD[sim.spZ[a]] - fracOf(sim.P[a])) * len;
    if (rest > len / 2) finishStraight(state, a, false);
  }
};

/**
 * SIM-C2: car `i` reaches attack point `z`. If its attempt there was already made on the straight, true - and the
 * outcome left for this corner (held, a touch, a squeeze) is settled now if the two are still there to fight it.
 * Otherwise false, and stale marks of an earlier lap are dropped.
 */
export const straightAtAttack = (state, i, z) => {
  const sim = state._sim;
  if (!sim.spZone || sim.spZone[i] === 0) return false;
  const lapNow = sim.laps[i] + Math.floor(sim.tau[i]);
  // Another braking zone on the way keeps the mark, unless it is from an earlier lap (a neutralisation in between).
  if (sim.spZone[i] !== z + 1 && sim.spLapAt[i] >= lapNow) return false;
  const mine = sim.spZone[i] === z + 1 && sim.spLapAt[i] === lapNow;
  const plan = sim.spPlan[i];
  sim.spZone[i] = 0;
  sim.spPlan[i] = null;
  if (!mine) {
    // A plan left from an earlier lap (a neutralisation in between) ends without a fight: told resolved.
    if (plan && sim.duelLive && plan.ahead >= 0 && pairOpen(sim, i, plan.ahead)) duelEvent(state, i, plan.ahead, "resolved", { result: "defended" });
    return false;
  }
  if (plan) {
    const b = plan.ahead;
    // The pair cooled down meanwhile (the attacker was the third car of another claim at this corner) ends it too.
    const fit = sim.active[b] && sim.inPit[b] === 0 && sim.ahead[i] === b && sim.lapDiff[i] === 0 && sim.duelRole[i] === ROLE.NONE && sim.duelRole[b] !== ROLE.PASSING && sim.duelRole[b] !== ROLE.YIELDING && sim.cooldownUntil[i] <= sim.clock && pairOpen(sim, i, b);
    // The car ahead gone before the corner (the pit lane, an error, a car in between): the attempt ends there.
    if (fit) settleDuel(state, i, plan);
    // (Cooled down as a third car, its attempt on this car was already told resolved there.)
    else if (sim.duelLive && pairOpen(sim, i, b)) duelEvent(state, i, b, "resolved", { result: "defended" });
  }
  return true;
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
const coldDefender = (state, car, atLine = false) => {
  // SIM-C2: an attempt made on a DRS straight is for the braking zone ahead, not for the surface the straight has
  // just cooled: the model's heat at the line then (the quick mode's own reading).
  const th = (atLine ? car.tyreThermal : null) || car.tyreC || car.tyreThermal;
  return Boolean(th) && coldForPass(gripC(th), windowFor(car.compound, state._sim.rules.year ?? state.year));
};

/** The attacker's chance of making it through this corner. */
export const duelChance = (state, attacker, defender, zone, { drs = false, lap, atLine = false, defenderExpected }) => {
  const { balance } = state._sim;
  const d = balance.duel;
  // SIM-C2: on a straight that crosses the line the defender may have planned its next lap already; its pace is
  // then read from the lap the attacker is still on (defenderExpected), as the attack point compares lap with lap.
  const delta = (defenderExpected ?? defender.expected ?? 0) - (attacker.expected ?? 0);
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
    (coldDefender(state, defender, atLine) ? d.coldTyre : 0) +
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
  // SIM-C3 (GS-05): the car passed holds off the one that passed it (duel.rePass).
  passedBy(state, b, a);
  sim.latState[a] = extra.alongside ? LANE.ALONGSIDE : sign === (extra.inside ?? sign) ? LANE.ATTACK_IN : LANE.ATTACK_OUT;
  sim.latState[b] = extra.alongside ? LANE.ALONGSIDE : LANE.DEFEND;
  // SIM-4: a move fought for (not a team order) is a live duel until the road settles it.
  if (sim.duelLive) sim.duelLive[a] = extra.duel ? 1 : 0;
  // The corner the move is made at (also for a team order), for the log of a pass left unfinished.
  if (sim.duelCorner && extra.corner) sim.duelCorner[a] = extra.corner;
  if (extra.event !== false) {
    const type = extra.type || "pass";
    const event = {
      type, carId: state.cars[a].id, otherId: state.cars[b].id, corner: extra.corner ?? null, drs: Boolean(extra.drs),
      ...(extra.switchback ? { switchback: true } : {}),
      ...(state.cars[a].overtakeActive ? { overtakeMode: true } : {}),
    };
    // SIM-C2: a pass won on a DRS straight is driven there first; its event is told when it is made (finishStraight).
    if (extra.straight !== undefined && sim.spPhase) {
      beginStraight(state, a, b, extra.straight, event);
      return;
    }
    // SIM-C3 (VIEW-09): a pass fought for is told when it is made on the road (passTellStep), not at the corner.
    if (type === "pass" && extra.duel && sim.passPending) {
      sim.passPending[a] = { event, b, exitTau: extra.exitTau ?? null };
      return;
    }
    // SIM-4 (§1.7): the timing line after the corner confirms the pass.
    if (type === "pass" && sim.timingTau) event.confirmedAt = confirmTimeOf(sim, a, extra.exitTau ?? sim.tau[a]);
    pushEvent(state, sim.laps[a] + 1, event);
  }
};

/**
 * SIM-C3 (F1M24-CHINA §2.2 VIEW-09, §3.1 «0 pases invertidos tras confirmedAt»; RF-SIM-07, RNF-05), every step after the
 * passes are settled: a pass fought for (startPass with `duel`, and a straight pass carried on into the braking zone) is
 * told once the attacker is clear of the car it passed (traffic.minGapMetres ahead, as settleDuels calls it made) or,
 * the duel over, still in front of it; a pass the road never finished (left unfinished, a touch, the pit lane, an
 * error) is not told at all - the duel log keeps it. Its `confirmedAt` is the first timing line after the corner's
 * exit, or after the car if that is behind it. No draw; nothing the race reads.
 */
export const passTellStep = (state) => {
  const sim = state._sim;
  if (!sim.passPending) return;
  const len = sim.tables.length;
  const clear = sim.balance.traffic.minGapMetres / len;
  for (let a = 0; a < sim.n; a += 1) {
    const pending = sim.passPending[a];
    if (!pending) continue;
    const { b } = pending;
    const gone = !sim.active[a] || !sim.active[b] || sim.inPit[a] !== 0 || sim.inPit[b] !== 0;
    const lead = sim.P[a] - sim.P[b];
    const fighting = sim.duelRole[a] === ROLE.PASSING && sim.duelOther[a] === b;
    if (!gone && fighting && lead < clear) continue;
    sim.passPending[a] = null;
    if (gone || lead <= 0) continue;
    const event = { ...pending.event };
    if (sim.timingTau) {
      const exit = pending.exitTau;
      const from = exit !== null && fracOf(exit - fracOf(sim.tau[a])) < 0.5 ? exit : sim.tau[a];
      event.confirmedAt = confirmTimeOf(sim, a, from);
    }
    pushEvent(state, sim.laps[a] + 1, event);
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
  // SIM-C3 (AUD-C11, motor): the events of the touch say whether the two boxes were really together then.
  const from = state.events.length;
  if (outcome.kind === "retire") {
    sim.retireAt(victim, "collision", corner);
    confirmContact(state, a, b, from);
    stewards(state, a, b);
    return;
  }
  const car = state.cars[victim];
  sim.delay[victim] += applyContact(state, car, outcome, { otherId: state.cars[other].id, corner, stream, lap: sim.laps[victim] + 1, raceLap: sim.leaderLap });
  confirmContact(state, a, b, from);
  sim.afterIncident();
  stewards(state, a, b);
};

/**
 * SIM-C3 (F1M24-CHINA §3.3 `contact {confirmed}`, AUD-C11 motor; RF-SIM-09, RF-3D-04): is the touch between `a` and
 * `b` one the view can show - their boxes of the era within race-reliability.json `contact.confirmMetres` of each
 * other along and across the road (lateral.js frame) right now? A touch rolled at the attack point with the attacker
 * still lengths behind is a racing incident the stewards look at, not an impact to hear or see.
 */
export const contactConfirmed = (sim, a, b) => {
  const len = sim.tables.length;
  const { carLength: L, carWidth: W } = sim.side.spec;
  const m = contactConfirmMetres();
  // Along the road: nose to nose within the closest a car may follow another (traffic.minGapMetres, at least a
  // length) plus the margin - the boxes touch end to end or overlap side by side.
  const closest = Math.max(L, sim.balance && sim.balance.traffic ? sim.balance.traffic.minGapMetres : L);
  const along = Math.abs(wrapHalf(sim.P[a] - sim.P[b])) * len - closest;
  const across = Math.abs(sim.lat[a] - sim.lat[b]) - W;
  return along <= m && across <= m;
};

/** SIM-C3: mark the contact (or collision retirement) events told since index `from` with `confirmed` and the time. */
const confirmContact = (state, a, b, from) => {
  const sim = state._sim;
  const confirmed = contactConfirmed(sim, a, b);
  for (let k = from; k < state.events.length; k += 1) {
    const event = state.events[k];
    if (event.type === "contact" || (event.type === "dnf" && event.reason === "collision")) {
      event.confirmed = confirmed;
      if (event.t === undefined) event.t = r3(sim.clock);
    }
  }
};

/** RF-SIM-10: after a contact the stewards may look at the attacker (the quick mode's rule and stream). */
const stewards = (state, a, b) => collisionInvestigation(state, state.cars[a], state.cars[b].id, state._sim.leaderLap);

const round = (value) => Math.round(value * 100) / 100;

/**
 * SIM-C3 (GS-05): the cars in the braking zone the attacker `i` claims from `ahead` - the two, the claim's `third` car
 * (else the car right behind `i`) and the car right in front of `ahead`, each counted within
 * race-reliability.json contact.crowd.windowMetres of the pair (the gaps at the start of the step). No draw.
 */
const crowdOf = (sim, i, ahead, third) => {
  const w = crowdWindowMetres();
  let cars = 2;
  const back = third >= 0 ? third : sim.behind[i];
  if (back >= 0 && back !== ahead && sim.inPit[back] === 0 && (third >= 0 || sim.gapM[back] <= w)) cars += 1;
  const front = sim.ahead[ahead];
  if (front >= 0 && front !== i && front !== back && sim.inPit[front] === 0 && sim.gapM[ahead] <= w) cars += 1;
  return cars;
};

/**
 * Car `i` has reached attack point `z`. `ahead` is the car in front of it on the road at
 * the start of the step and `gapSec` the gap to it. SIM-C2: with `straight`, the attempt is made at the decision
 * point of a DRS straight instead (stepRace checkpoints): the same guards, chance and draws; a pass won is driven on
 * the straight, any other outcome is left for the attack point (straightAtAttack). True if an attempt was made.
 */
export const openDuel = (state, i, z, ahead, gapSec, behind, behindGap, { straight = false } = {}) => {
  const sim = state._sim;
  const { balance } = sim;
  const d = balance.duel;
  // RF-STF-02: an aggressive driver goes for it from further back.
  if (ahead < 0 || gapSec > d.triggerSec * triggerFactorOf(state.cars[i])) return false;
  // SIM-8: the cool-down is per pair (a touch still stops the attacker for a while, contact below).
  if (sim.cooldownUntil[i] > sim.clock || !pairOpen(sim, i, ahead) || sim.duelRole[i] !== ROLE.NONE || sim.duelRole[ahead] === ROLE.PASSING || sim.duelRole[ahead] === ROLE.YIELDING) return false;
  // SIM-8: a corner whose exit still owes the last claim's incident is not claimed again by the same car.
  if (sim.claimTau && sim.claimTau[i] >= 0) return false;
  // SIM-C3 (GS-05): no attempt on the car that has just passed it, unless it is faster by rePassPaceSec a lap.
  if (rePassHeld(state, i, ahead)) return false;
  // SIM-C3 (GS-05, SRS 4.2): the third car of a claim made on this straight by the car ahead joins that claim at the
  // attack point, at thirdCarFactor, as it would there; it makes no full attempt of its own on the straight.
  if (straight && sim.spPlan) {
    const held = sim.spPlan[ahead];
    if (held && held.deferred && held.third === i && held.z === z) return false;
  }
  const zone = sim.tables.attacks[z];
  // RF-SIM-10: no passing under a local yellow at this corner.
  if (sim.yellows.length && sim.yellows.some((flag) => flag.corner === zone.corner)) return false;
  const attacker = state.cars[i];
  const defender = state.cars[ahead];
  const lap = sim.laps[i] + 1;
  const stream = sim.streams.duel;

  // Team-mates: a hold order keeps them in station; a swap order is obeyed here.
  if (attacker.teamId === defender.teamId) {
    const order = state.teamOrders[attacker.teamId];
    if (order === "hold") return false;
    if (order === "swap" && gapSec <= balance.teamOrders.swapGapSec) {
      // A team order is obeyed at the corner, as it always was (not on the straight).
      if (straight) return false;
      startPass(state, i, ahead, zone.sign, { type: "swap", corner: zone.corner });
      state.teamOrders[attacker.teamId] = "free";
      return true;
    }
  }

  const drs = sim.drsOpen[i] > 0 && sim.drsOpen[i] - 1 === zone.drs && drsAllowed(state, lap);
  const defenderExpected = straight && sim.expLap && sim.expLap[ahead] > sim.expLap[i] ? sim.expPrev[ahead] : undefined;
  const chance = duelChance(state, attacker, defender, zone, { drs, lap, atLine: straight, defenderExpected });
  // SIM-8 (SIM-FISICA §3.5 claim): a third car only if three of the era's boxes fit across the asphalt here
  // (SIM-C2: on the straight, at the braking point the claim is for).
  const claimAt = straight ? sim.spBrakeD[z] : sim.P[ahead];
  const third =
    Math.min(d.maxClaim, DUEL_GEOMETRY.claim.maxCars) >= 3 && behind >= 0 && behindGap <= d.triggerSec && sim.duelRole[behind] === ROLE.NONE && sim.cooldownUntil[behind] <= sim.clock && fitsAbreast(sim.side, claimAt, 3)
      ? behind
      : -1;
  const style = styleOf(balance, defender);
  // RF-SIM-09: the era's calibration of duel touches against f1db (race-reliability.json calibration.stepCollision).
  // RF-STF-02: the squeeze - aggressive drivers touch more (drivers/skills.js contactFactorOf, as the quick mode).
  // SIM-C3 (GS-05): the crowd in the braking zone - the pair, the third car and any other right there
  // (incidents.js crowdFactor, race-reliability.json contact.crowd): touches gather where three arrive together.
  const crowd = crowdOf(sim, i, ahead, third);
  const incidentChance =
    d.incident.base * sim.collisionScale * (1 + wetnessAt(state, lap) * d.incident.wet) * riskOf(balance, attacker).incident * style.incident * contactFactorOf(attacker, defender) * crowdFactor(crowd);
  // WP4: the defender's one move - cover the inside or not - and the attacker's line.
  const geo = DRIVER_BALANCE.effects.step;
  const cover = coverChanceOf(defender, defender.defence);
  const covered = stream.next() < cover;
  const open = cover < 1 ? (1 - cover * geo.cover.coveredFactor) / (1 - cover) : 1;
  // SRS 4.2: `stepScale` calibrates the step mode's passes per race on the quick mode's (equivalence.test.js).
  // SIM-C3 (GS-05, SRS 4.2): an attempt made on a DRS straight keeps the attack point's chance as it is. Decided on the
  // attack point's lap (straightPassSetup) and with the claim's third car joining at the attack point (above), it adds
  // no attempts, so the scale SIM-C2 needed for them (straightPass.chanceScale) is gone.
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
    line: side === zone.sign ? "inside" : "outside", covered, overlap: round(overlap), alongside, crowd,
    // SIM-C3: where the attempt was decided (on a DRS straight, or at the attack point); not `at`, which the race
    // worker stamps on every streamed row (engine/worker).
    ...(straight ? { decided: "straight" } : {}),
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
  const plan = { z, ahead, side, covered, alongside, success, roll, contactChance, squeezeChance, third, drs, entry };
  if (straight) {
    // SIM-C2: won on the straight - driven there now; anything else is settled at the corner, where it always was.
    if (success && roll >= contactChance) settleDuel(state, i, plan, true);
    else {
      plan.deferred = true;
      sim.spPlan[i] = plan;
    }
    return true;
  }
  settleDuel(state, i, plan, false);
  return true;
};

/**
 * The outcome of an attempt whose draws are made (openDuel): a touch, a pass (SIM-C2: driven on the straight with
 * `straight`) or a defence, and the third car of a claim. A plan left on the straight for the attack point is
 * settled here when the car gets there (straightAtAttack), with the corner's own lap and time.
 */
const settleDuel = (state, i, plan, straight) => {
  const sim = state._sim;
  const d = sim.balance.duel;
  const stream = sim.streams.duel;
  const { z, ahead, side, covered, alongside, success, roll, contactChance, squeezeChance, drs, entry } = plan;
  const zone = sim.tables.attacks[z];
  const lap = sim.laps[i] + 1;
  const style = styleOf(sim.balance, state.cars[ahead]);
  const loser = success ? ahead : i;
  // SIM-C2: an outcome left on the straight is logged when the corner settles it (its time and lap there).
  if (plan.deferred) {
    entry.t = round(sim.clock);
    entry.lap = lap;
  }
  // A third car left for the corner joins only if it is still the one right behind.
  // SIM-C2: nor a third car with an attempt of its own already made on this straight (settled at its own attack point).
  const third = plan.third >= 0 && !(sim.spPlan && sim.spPlan[plan.third]) && (!plan.deferred || (sim.behind[i] === plan.third && sim.active[plan.third] && sim.inPit[plan.third] === 0 && sim.duelRole[plan.third] === ROLE.NONE && sim.spZone[plan.third] === 0)) ? plan.third : -1;
  if (roll < contactChance) {
    if (!sim.claimTau) {
      contact(state, i, ahead, zone.corner, stream, lap, "entryInside");
      sim.cooldownUntil[i] = sim.clock + d.cooldownSec;
      return;
    }
    if (side === zone.sign) {
      // SIM-C3 (AUD-C11): the touch on the inside happens where the two meet in the braking zone - the first step
      // their boxes are together (claimTouchStep) - or at the corner's exit at the latest; not at the attack point.
      closeLive(sim, ahead);
      holdCorner(state, i, ahead, zone, side, covered, alongside, style);
      leaveClaim(sim, i, ahead, CLAIM.CONTACT_ENTRY, -1, zone);
      logDuel(state, { ...entry, outcome: "claim-contact" });
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
    startPass(state, i, ahead, side, { corner: zone.corner, drs, alongside, inside: zone.sign, duel: true, exitTau: zone.exitTau, ...(straight ? { straight: z } : {}) });
    const logged = { ...entry, outcome: "pass", ...(squeeze ? { squeeze: true } : {}), ...(straight ? { straight: true } : {}) };
    // SIM-C2: a straight pass is logged when it is told, with how it went (finishStraight): rows already logged are
    // never changed afterwards (the race worker streams the log, engine/worker).
    if (straight && sim.spEntry) sim.spEntry[i] = logged;
    else logDuel(state, logged);
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
    // SIM-C3 (GS-05): nor on a car that has just passed it.
    if (rePassHeld(state, third, target)) return;
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
