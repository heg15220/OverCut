/**
 * Test helper for SIM-C2 (docs/manager/F1M24-CHINA.md §2.1 GS-06, §2.2 GS-04 / VIEW-09; RF-SIM-07, RF-SIM-08,
 * RF-SIM-15, RNF-05): a step race watched step by step for how its passes read on the road.
 *
 *   confirmed  every `pass` event with `confirmedAt`: when the race clock reaches it, is the attacker in front of the
 *              car it passed on the road (or one of the two gone: retired, in the pit lane)? `inverted` counts the
 *              ones that are not, unless the passed car took the place back first (a switchback, SIM-C3's business);
 *              split for the passes made on a DRS straight (`straight`) and the rest.
 *   ahead      while a straight pass is in its `ahead` phase the attacker is in front (`aheadWrong` must be 0).
 *   bands      pairs side by side (less than a car's length apart along the road, a car's width across) at the turn-in
 *              of a slow corner (one per pair, corner and lap) and of those the ones still side by side at its apex, and
 *              pair-steps in a fast corner (race-physics.json lateral.alongsideByBand, bands by the
 *              trace's apex speed), with the flanks' gap for the fast ones.
 */

import { fromQuickRace, stepOnce } from "./index";
import { SP } from "./duel";
import { weekend } from "./simTestKit";

const wrapHalf = (value) => value - Math.round(value);
const frac = (value) => value - Math.floor(value);

export const watchPasses = ({ seed, year = 2024, teamId = "ferrari", circuit = "shanghai", balance, minClear = 0.3 }) => {
  const w = weekend({ seed, year, teamId, circuit });
  const state = fromQuickRace(w.make(), balance ? { race: w.race, balance } : { race: w.race });
  const sim = state._sim;
  const { carLength: L, carWidth: W } = sim.side.spec;
  const len = sim.tables.length;
  const M = sim.tables.M;
  const id = new Map(state.cars.map((car, i) => [car.id, i]));
  // The distance bins from the apex of each slow corner to a car's length past it (bands by distance bin, alongsideSetup).
  const slowApex = new Uint8Array(M);
  const slowTurnIn = new Uint8Array(M);
  const turnIn = sim.bandCfg ? sim.bandCfg.slow.turnInMetres : 0;
  (sim.side.track.corners || []).forEach((corner, c) => {
    if (!(corner.apex >= 0)) return;
    const k0 = Math.min(M - 1, (frac(corner.apex) * M) | 0);
    if (sim.bandBin[k0] !== 1) return;
    const span = Math.max(1, Math.ceil((L / len) * M));
    for (let k = 0; k <= span; k += 1) slowApex[(k0 + k) % M] = c + 1;
    // Its turn-in: from lateral.alongsideByBand.slow.turnInMetres before the corner to its start.
    const f = Math.floor(frac(corner.from) * M);
    const back = Math.ceil((turnIn / len) * M);
    for (let k = 0; k <= back; k += 1) slowTurnIn[(f - k + M) % M] = c + 1;
  });
  const seen = { confirmed: 0, inverted: 0, straightConfirmed: 0, straightInverted: 0, aheadSteps: 0, aheadWrong: 0, slowApexPairs: 0, slowTurnInPairs: 0, fastPairs: 0, fastClear: 0, example: null };
  const pending = [];
  // Pairs side by side at a slow corner's turn-in, by visit (pair, corner, lap), and those still side by side at its apex.
  const atTurnIn = new Set();
  const atApex = new Set();
  let read = 0;
  while (!state.finished) {
    stepOnce(state);
    const events = state.events;
    for (; read < events.length; read += 1) {
      const event = events[read];
      if (event.type === "pass" && event.switchback) {
        // The passed car took the place back: the pass it answered is no longer this check's.
        for (let k = pending.length - 1; k >= 0; k -= 1) if (pending[k].a === id.get(event.otherId) && pending[k].b === id.get(event.carId)) pending.splice(k, 1);
      }
      if (event.type === "pass" && !event.switchback && Number.isFinite(event.confirmedAt)) pending.push({ a: id.get(event.carId), b: id.get(event.otherId), at: event.confirmedAt, straight: Boolean(event.straight) });
    }
    for (let k = pending.length - 1; k >= 0; k -= 1) {
      const p = pending[k];
      if (sim.clock < p.at) continue;
      pending.splice(k, 1);
      const gone = !sim.active[p.a] || !sim.active[p.b] || sim.inPit[p.a] !== 0 || sim.inPit[p.b] !== 0 || state.safetyCar || sim.red;
      const wrong = !gone && wrapHalf(sim.P[p.a] - sim.P[p.b]) <= 0;
      seen.confirmed += 1;
      if (p.straight) seen.straightConfirmed += 1;
      if (wrong) {
        seen.inverted += 1;
        if (p.straight) {
          seen.straightInverted += 1;
          if (!seen.example) seen.example = `${seed} t=${sim.clock} ${state.cars[p.a].id} on ${state.cars[p.b].id} lead ${(wrapHalf(sim.P[p.a] - sim.P[p.b]) * len).toFixed(1)} m`;
        }
      }
    }
    for (let i = 0; i < sim.n; i += 1) {
      if (!sim.active[i] || sim.inPit[i] !== 0) continue;
      if (sim.spPhase[i] === SP.AHEAD) {
        seen.aheadSteps += 1;
        const b = sim.spOther[i];
        if (b >= 0 && sim.active[b] && sim.inPit[b] === 0 && wrapHalf(sim.P[i] - sim.P[b]) <= 0) seen.aheadWrong += 1;
      }
      const j = sim.ahead[i];
      if (j < 0 || !sim.active[j] || sim.inPit[j] !== 0 || state.safetyCar || !sim.started) continue;
      const along = frac(sim.P[j] - sim.P[i]) * len;
      const across = Math.abs(sim.lat[j] - sim.lat[i]);
      if (along >= L || across < W - 1e-6) continue;
      const bin = Math.min(M - 1, (frac(sim.P[j]) * M) | 0);
      if (slowTurnIn[bin]) atTurnIn.add(`${i}:${j}:${slowTurnIn[bin]}:${sim.laps[j]}`);
      if (slowApex[bin]) atApex.add(`${i}:${j}:${slowApex[bin]}:${sim.laps[j]}`);
      if (sim.bandBin[bin] === 3) {
        seen.fastPairs += 1;
        if (across - W >= minClear) seen.fastClear += 1;
      }
    }
  }
  seen.slowTurnInPairs = atTurnIn.size;
  atApex.forEach((key) => {
    if (atTurnIn.has(key)) seen.slowApexPairs += 1;
  });
  return { state, seen };
};

export const sumOf = (runs) =>
  runs.reduce((acc, run) => {
    Object.entries(run.seen).forEach(([key, value]) => {
      if (typeof value === "number") acc[key] = (acc[key] || 0) + value;
      else if (value && !acc[key]) acc[key] = value;
    });
    return acc;
  }, {});
