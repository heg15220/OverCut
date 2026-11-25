/**
 * Traffic in the playable sessions (SES-8, F1M24-GAMEPLAY §2.12.3 `trafico-sesion`; RF-WKD-02, RF-SIM-01,
 * RF-SIM-06, RF-SIM-15, RNF-05, RNF-07).
 *
 * A session lap is decided when it starts (session.js); what the other cars do to it on the way round is
 * decided here, step by step, on the step race's own model and without duels (nobody fights for a place
 * in practice or qualifying):
 *
 *   air        a car on a timed lap within the window of the car ahead on the track loses the era's dirty
 *              air in the corners and gains the era's tow on the straights - the step race's airEffect
 *              (engine/sim/stepRace.js) on the same track tables (engine/sim/trackTables.js), with the
 *              same race-sim.json windows, race-eras.json dirty air and race-sim.json slipstream by era.
 *   impeding   a car on a timed lap that closes on a slow one (out-lap, cool-down, fuel burn, in-lap, an
 *              aborted lap) meets it once per lap: the slow car is in the way or not, the loss and whether
 *              the attempt is spoilt come from the timed car's own traffic stream (four draws per meeting,
 *              in a fixed order), and race control notes some meetings (OpenF1 race_control "- IMPEDING").
 *              The penalty is the era's row of sessions.json traffic.impeding.penalty (pending: not applied).
 *   spacing    a rival pit wall holds its car in the garage while another car passes the pit exit within
 *              ai.spacingSec of the moment it would join (no draw: geometry and the lap timelines).
 *
 * Everything here reads the positions session.js hands it (time share of the trace, lap seconds, kind of
 * lap) and returns what to do; session.js applies it to the lap records. Nothing in the view calls it.
 * When engine/sim/stepRace.js exports a session-mode `advance` (SIM-8, §3.2), the air term can move there;
 * until then the same airEffect is called with a session-sized context.
 */

import balance from "../../data/balance/sessions.json";
import { byYear, rulesFor } from "../rules";
import { SIM_BALANCE, airEffect } from "../sim/stepRace";
import { buildTrackTables, dAt, dirtyAt, inCorner } from "../sim/trackTables";

export const TRAFFIC = balance.traffic;

const frac = (x) => x - Math.floor(x);
const round3 = (value) => Math.round(value * 1000) / 1000;

const contextCache = new WeakMap();

/**
 * The air context of a session: the step race's tables of the built circuit and its era's dirty air and
 * tow, cached per circuit and year (geometry, never serialised). Null without a circuit or a trace.
 */
export const trafficContextOf = (circuit, era) => {
  if (!circuit || !(circuit.length > 0)) return null;
  const rules = rulesFor(era);
  if (!contextCache.has(circuit)) contextCache.set(circuit, new Map());
  const memo = contextCache.get(circuit);
  if (!memo.has(rules.year)) {
    const tables = buildTrackTables(circuit, { size: SIM_BALANCE.step.tableSize, approachMetres: SIM_BALANCE.duel.approachMetres });
    memo.set(rules.year, {
      tables,
      length: circuit.length,
      sim: { balance: SIM_BALANCE, tables, dirtyLoss: rules.dirtyAir, slipGain: byYear(SIM_BALANCE.slipstream.byEra, rules.year)?.gainPerLap ?? 0 },
    });
  }
  return memo.get(rules.year);
};

/** The widest window anything here looks through (s behind the car ahead). */
const windowOf = (ctx) => Math.max(ctx.sim.balance.dirtyAir.windowSec, ctx.sim.balance.slipstream.windowSec, TRAFFIC.impeding.windowSec);

/**
 * The car directly ahead on the track of each car in `cars` ({index, tau, lapSec}), within the widest
 * window: {ahead (its entry), gapSec (the follower's seconds), gapM}. Positions are time shares of the
 * trace, the same for every car, so the gap in time is the share between them times the follower's lap.
 */
export const aheadOf = (ctx, cars, me) => {
  const window = windowOf(ctx);
  let best = null;
  cars.forEach((other) => {
    if (other === me) return;
    const share = frac(other.tau - me.tau);
    if (share <= 0) return;
    const gapSec = share * me.lapSec;
    if (gapSec >= window || (best && gapSec >= best.gapSec)) return;
    best = { ahead: other, gapSec };
  });
  if (!best) return null;
  const gapM = frac(dAt(ctx.tables, best.ahead.tau) - dAt(ctx.tables, me.tau)) * ctx.length;
  return { ...best, gapM };
};

/**
 * RF-SIM-06: the seconds a timed lap loses (> 0) or gains (< 0) over `dt` seconds behind a car `gapSec`
 * ahead, at trace share `tau`: the step race's speed change (airEffect, weighted by the corner's band as
 * stepRace does) turned into time. Zero outside the windows.
 */
export const airDeltaSec = (ctx, { tau, lapSec, gapSec, dt }) => {
  const d = dAt(ctx.tables, tau);
  const corner = inCorner(ctx.tables, d);
  const mult = airEffect(ctx.sim, lapSec, gapSec, corner, 0) * (corner ? dirtyAt(ctx.tables, tau) : 1);
  return mult ? -mult * dt : 0;
};

/** The session kind's key in the by-kind tables (the sprint shootout is its own). */
export const trafficKindOf = (state) => (state.format === "shootout" ? "shootout" : state.kind === "practice" ? "practice" : "qualifying");

/** The era's row of traffic.impeding.penalty.eras (every year has one, pending until the FIA text is copied). */
export const impedingPenaltyOf = (year) => TRAFFIC.impeding.penalty.eras.find((row) => year >= row.from && year <= row.to) || null;

/**
 * A meeting with a slow car ahead (RF-WKD-02): four draws from the timed car's traffic stream, always all
 * four and in this order, so the same seed gives the same meetings (RF-SIM-15, RNF-05). Returns null when
 * the slow car is out of the way, else {lossSec, outcome: "lift"|"abandon", noted}.
 */
export const drawImpeding = (state, stream) => {
  const I = TRAFFIC.impeding;
  const kind = trafficKindOf(state);
  const inWay = stream.range(0, 1);
  const pick = stream.range(0, 1);
  const giveUp = stream.range(0, 1);
  const note = stream.range(0, 1);
  if (inWay >= I.chance[kind]) return null;
  const lossSec = I.lossSec.p25 + pick * (I.lossSec.p75 - I.lossSec.p25);
  return { lossSec: round3(lossSec), outcome: giveUp < I.abandonShare ? "abandon" : "lift", noted: note < I.noteShare[kind] };
};

/**
 * One step of traffic (RF-SIM-01): for every car on a timed lap in `cars` ({car, index, tau, lapSec, timed,
 * slow, met}), what the car ahead does to it over the step [now, now + dt]. Returns actions in car order:
 *   {kind: "air", entry, deltaSec, aheadId, gapSec, effect: "tow"|"dirty"}
 *   {kind: "impeding", entry, slowId, gapSec, gapM, ...drawImpeding}
 *   {kind: "follow", entry, aheadId, gapSec}  (a slow car already met, out of the way: nothing to apply)
 */
export const trafficStep = (state, ctx, cars, dt) => {
  if (!ctx) return [];
  const out = [];
  cars.forEach((entry) => {
    if (!entry.timed) return;
    const near = aheadOf(ctx, cars, entry);
    if (!near) return;
    const { ahead, gapSec, gapM } = near;
    if (ahead.slow) {
      if (gapSec >= TRAFFIC.impeding.windowSec || entry.met.includes(ahead.car.id)) {
        out.push({ kind: "follow", entry, aheadId: ahead.car.id, gapSec: round3(gapSec) });
        return;
      }
      const meeting = drawImpeding(state, entry.car.trafficStream);
      out.push({ kind: "impeding", entry, slowId: ahead.car.id, gapSec: round3(gapSec), gapM: Math.round(gapM), meeting });
      return;
    }
    const deltaSec = airDeltaSec(ctx, { tau: entry.tau, lapSec: entry.lapSec, gapSec, dt });
    out.push({ kind: "air", entry, deltaSec, aheadId: ahead.car.id, gapSec: round3(gapSec), effect: deltaSec < 0 ? "tow" : deltaSec > 0 ? "dirty" : null });
  });
  return out;
};
