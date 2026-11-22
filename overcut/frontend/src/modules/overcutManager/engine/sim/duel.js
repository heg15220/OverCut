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
 * Every number comes from data/balance/race-sim.json (RNF-07); every roll from the duel
 * stream (RF-SIM-15).
 */

import { clamp } from "../../../overcutTrayectoria/engine/rng";
import { collisionInvestigation, energyPush } from "../race";
import { drsOpen } from "../rules";
import { pushEvent, wetnessAt } from "./lapModel";

export const ROLE = { NONE: 0, PASSING: 1, YIELDING: 2, LOST: 3, HELD: 4 };

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
    (attacker.racecraft - defender.racecraft) * d.racecraft +
    (wet ? d.wet : 0) +
    attack -
    defend +
    (defender.tyreTemp < d.coldTyreTemp ? d.coldTyre : 0) +
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
  const { duel, lateral } = sim.balance;
  const style = styleOf(sim.balance, state.cars[b]);
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
  if (extra.event !== false) {
    pushEvent(state, sim.laps[a] + 1, {
      type: extra.type || "pass", carId: state.cars[a].id, otherId: state.cars[b].id, corner: extra.corner ?? null, drs: Boolean(extra.drs),
      ...(extra.switchback ? { switchback: true } : {}),
      ...(state.cars[a].overtakeActive ? { overtakeMode: true } : {}),
    });
  }
};

/** The duel is over: both back to their own pace and line. */
export const endDuel = (sim, i) => {
  const other = sim.duelOther[i];
  sim.duelRole[i] = ROLE.NONE;
  sim.duelMult[i] = 0;
  sim.duelUntil[i] = 0;
  sim.duelOther[i] = -1;
  sim.latTarget[i] = 0;
  if (other >= 0 && sim.duelOther[other] === i) {
    sim.duelRole[other] = ROLE.NONE;
    sim.duelMult[other] = 0;
    sim.duelUntil[other] = 0;
    sim.duelOther[other] = -1;
    sim.latTarget[other] = 0;
  }
};

const contact = (state, a, b, corner, stream, lap) => {
  const sim = state._sim;
  const inc = sim.balance.duel.incident;
  const victim = stream.chance(0.5) ? b : a;
  const other = victim === a ? b : a;
  logDuel(state, { t: round(sim.clock), lap, corner, attacker: state.cars[a].id, defender: state.cars[b].id, outcome: "incident", victim: state.cars[victim].id });
  if (stream.chance(inc.retireShare)) {
    sim.retireAt(victim, "collision", corner);
    stewards(state, a, b);
    return;
  }
  const car = state.cars[victim];
  car.damage += stream.range(inc.damageMin, inc.damageMax);
  sim.delay[victim] += stream.range(inc.delayMin, inc.delayMax);
  pushEvent(state, sim.laps[victim] + 1, { type: "contact", carId: car.id, otherId: state.cars[other].id, corner });
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
  if (ahead < 0 || gapSec > d.triggerSec) return;
  if (sim.cooldownUntil[i] > sim.clock || sim.duelRole[i] !== ROLE.NONE || sim.duelRole[ahead] === ROLE.PASSING || sim.duelRole[ahead] === ROLE.YIELDING) return;
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
  const third = d.maxClaim >= 3 && behind >= 0 && behindGap <= d.triggerSec && sim.duelRole[behind] === ROLE.NONE && sim.cooldownUntil[behind] <= sim.clock ? behind : -1;
  const style = styleOf(balance, defender);
  const incidentChance = d.incident.base * (1 + wetnessAt(state, lap) * d.incident.wet) * riskOf(balance, attacker).incident * style.incident * (third >= 0 ? d.incident.threeWide : 1);
  const success = stream.next() < chance;
  const entry = { t: round(sim.clock), lap, corner: zone.corner, attacker: attacker.id, defender: defender.id, chance: round(chance), drs, claim: third >= 0 ? 3 : 2 };

  if (stream.chance(incidentChance * (success ? 1 : d.incident.onDefended))) {
    contact(state, i, ahead, zone.corner, stream, lap);
    sim.cooldownUntil[i] = sim.clock + d.cooldownSec;
    return;
  }
  if (success) {
    startPass(state, i, ahead, zone.sign, { corner: zone.corner, drs });
    logDuel(state, { ...entry, outcome: "pass" });
    // The one who lost the corner may come back at its exit.
    sim.switchTarget[ahead] = i;
    sim.switchTau[ahead] = zone.exitTau;
    sim.switchCorner[ahead] = zone.corner;
  } else {
    sim.duelRole[i] = ROLE.LOST;
    sim.duelRole[ahead] = ROLE.HELD;
    sim.duelOther[i] = ahead;
    sim.duelOther[ahead] = i;
    sim.duelMult[i] = -style.attackerLoss;
    sim.duelMult[ahead] = -style.defenderLoss;
    sim.duelUntil[i] = sim.clock + d.passMaxSeconds * 0.5;
    sim.duelUntil[ahead] = sim.clock + d.passMaxSeconds * 0.5;
    sim.latTarget[i] = zone.sign * balance.lateral.attackMetres;
    sim.latTarget[ahead] = defender.defence === "block" ? zone.sign * balance.lateral.blockMetres : 0;
    sim.cooldownUntil[i] = sim.clock + d.cooldownSec;
    sim.switchTarget[i] = ahead;
    sim.switchTau[i] = zone.exitTau;
    sim.switchCorner[i] = zone.corner;
    logDuel(state, { ...entry, outcome: "defended" });
  }

  // Three into one corner: the third car goes for whoever is now in front of it.
  if (third >= 0) {
    const target = success ? ahead : i;
    if (sim.duelRole[target] === ROLE.PASSING || sim.duelRole[target] === ROLE.YIELDING) {
      sim.cooldownUntil[third] = sim.clock + d.cooldownSec;
      return;
    }
    const thirdChance = duelChance(state, state.cars[third], state.cars[target], zone, { drs: false, lap }) * d.thirdCarFactor;
    const made = stream.next() < thirdChance;
    logDuel(state, { t: round(sim.clock), lap, corner: zone.corner, attacker: state.cars[third].id, defender: state.cars[target].id, chance: round(thirdChance), drs: false, claim: 3, outcome: made ? "pass" : "defended" });
    if (made) startPass(state, third, target, -zone.sign, { corner: zone.corner });
    else sim.cooldownUntil[third] = sim.clock + d.cooldownSec;
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
  const me = state.cars[i];
  const them = state.cars[target];
  const delta = (them.expected ?? 0) - (me.expected ?? 0);
  const chance = clamp(sb.base + delta * sb.pace + (me.racecraft - them.racecraft) * sb.racecraft + riskOf(sim.balance, me).chance, 0, sb.max);
  const made = sim.streams.duel.next() < chance;
  logDuel(state, { t: round(sim.clock), lap: sim.laps[i] + 1, corner, attacker: me.id, defender: them.id, chance: round(chance), drs: false, claim: 2, outcome: made ? "switchback" : "switchback-failed" });
  if (made) {
    if (sim.duelOther[i] >= 0) endDuel(sim, i);
    if (sim.duelOther[target] >= 0) endDuel(sim, target);
    startPass(state, i, target, -1, { corner, switchback: true });
    sim.cooldownUntil[target] = sim.clock + sim.balance.duel.cooldownSec;
  }
  sim.cooldownUntil[i] = sim.clock + sim.balance.duel.cooldownSec;
};
