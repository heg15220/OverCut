/**
 * The circuit as the step simulation reads it (RF-SIM-01): uniform lookup tables so the
 * hot loop never searches.
 *
 * A car's place on the lap is kept as `tau`, the share of the speed trace's lap time
 * reached (0 at the line, 1 at the next crossing). Because the trace is the same for
 * every car, `tau` maps to the same distance for all of them; a car whose lap-time budget
 * is B seconds advances dtau = dt / B per step, so with nothing in the way it covers the
 * lap in exactly B seconds while slowing for corners and accelerating out of them the way
 * the trace does. Distance share d(tau) and its inverse come from trackGeometry's own
 * Hermite interpolation, sampled once per circuit.
 *
 * Everything here is plain numbers and typed arrays; built once per circuit and cached.
 */

import physicsData from "../../data/balance/race-physics.json";
import { distanceAtTimeShare, timeShareAtDistance } from "../trackGeometry";

const cache = new WeakMap();

const frac = (value) => value - Math.floor(value);

/** Circular "x is in (a, b]" on the unit loop. */
export const crossed = (from, to, x) => (to >= from ? x > from && x <= to : x > from || x <= to);

export const buildTrackTables = (circuit, { size = 2048, approachMetres = 160 } = {}) => {
  const key = `${size}:${approachMetres}`;
  const known = cache.get(circuit);
  if (known && known.key === key) return known;
  const M = size;
  const dOfTau = new Float64Array(M + 1);
  const tauOfD = new Float64Array(M + 1);
  for (let i = 0; i <= M; i += 1) {
    dOfTau[i] = i === M ? 1 : distanceAtTimeShare(circuit, i / M);
    tauOfD[i] = i === M ? 1 : timeShareAtDistance(circuit, i / M);
  }
  // Keep both tables monotone (the Hermite pieces are monotone; this guards rounding).
  for (let i = 1; i <= M; i += 1) {
    if (dOfTau[i] < dOfTau[i - 1]) dOfTau[i] = dOfTau[i - 1];
    if (tauOfD[i] < tauOfD[i - 1]) tauOfD[i] = tauOfD[i - 1];
  }

  // Corner mask by distance bin: dirty air bites in corners, the tow works on straights.
  const corner = new Uint8Array(M);
  (circuit.corners || []).forEach((c) => {
    const from = Math.floor(c.from * M);
    const to = Math.ceil(c.to * M);
    for (let i = from; i <= to; i += 1) corner[((i % M) + M) % M] = 1;
  });
  // Share of the lap's *time* spent in corners and on straights.
  let cornerTime = 0;
  for (let i = 0; i < M; i += 1) if (corner[i]) cornerTime += tauOfD[i + 1] - tauOfD[i];
  cornerTime = Math.min(0.95, Math.max(0.05, cornerTime));

  // WP3 (SIM-FISICA §3.0, RF-SIM-01): where a car slower than the physical trace spends the
  // extra time. Per time-share bin: the trace's speed there (m/s, `vRef`) and the weight of its
  // band (race-physics.json `budget.sensitivity`: corners by speed band, straights), normalised so
  // its mean over the lap is 1 (`sens`) - a lap still lasts exactly its budget.
  const traceLap = circuit.simulatedLap > 0 ? circuit.simulatedLap : null;
  const vRef = new Float64Array(M);
  const sens = new Float64Array(M);
  const { slowMaxKmh, fastMinKmh } = physicsData.bands;
  const weight = physicsData.budget.sensitivity;
  let sensSum = 0;
  for (let j = 0; j < M; j += 1) {
    const dd = (dOfTau[j + 1] - dOfTau[j]) * M;
    vRef[j] = traceLap ? (dd * circuit.length) / traceLap : 0;
    const bin = Math.min(M - 1, Math.floor(((dOfTau[j] + dOfTau[j + 1]) / 2) * M));
    const kmh = vRef[j] * 3.6;
    const w = !corner[bin] ? weight.straight : kmh < slowMaxKmh ? weight.slow : kmh > fastMinKmh ? weight.fast : weight.medium;
    sens[j] = w;
    sensSum += w;
  }
  for (let j = 0; j < M; j += 1) sens[j] = traceLap ? (sens[j] * M) / sensSum : 1;
  // WP5 (SIM-FISICA §3.4, RF-SIM-06): dirty air takes downforce, so it bites in fast corners and
  // hardly in slow ones. Weight per bin (race-physics.json wake.dirtyBand by the trace's speed band;
  // 0 on straights), normalised so its mean over the corners' time is 1: the lap loses the same.
  const dirtyW = new Float64Array(M);
  const band = physicsData.wake.dirtyBand;
  let dirtySum = 0;
  let cornerBins = 0;
  for (let j = 0; j < M; j += 1) {
    const bin = Math.min(M - 1, Math.floor(((dOfTau[j] + dOfTau[j + 1]) / 2) * M));
    if (!corner[bin]) continue;
    const kmh = vRef[j] * 3.6;
    dirtyW[j] = !traceLap ? 1 : kmh < slowMaxKmh ? band.slow : kmh > fastMinKmh ? band.fast : band.medium;
    dirtySum += dirtyW[j];
    cornerBins += 1;
  }
  for (let j = 0; j < M; j += 1) dirtyW[j] = dirtySum > 0 ? (dirtyW[j] * cornerBins) / dirtySum : 1;
  // The corners' share of the weighted time (∫ sens over corner time shares): with a share `dev`
  // spent by band, a car spends (1 − dev)·cornerTime + dev·cornerSens of its lap in corners.
  let cornerSens = 0;
  for (let j = 0; j < M; j += 1) if (corner[Math.min(M - 1, Math.floor(((dOfTau[j] + dOfTau[j + 1]) / 2) * M))]) cornerSens += sens[j] / M;

  // Attack points: approachMetres before each braking zone, with the corner that follows
  // it, how much the zone is worth (its straight against the longest) and whether a DRS
  // zone feeds it.
  const length = circuit.length;
  const zones = circuit.brakingZones || [];
  // A zone's share of the lap's passing chances: its straight against all of them, so the
  // per-lap chance matches the quick mode's however many braking zones a circuit has.
  const totalMetres = zones.reduce((sum, zone) => sum + (zone.metres || 0), 0) || 1;
  const drsZones = (circuit.drsZones || []).map((zone) => ({ from: frac(zone.from), to: frac(zone.to), tauFrom: 0, tauTo: 0 }));
  const tauAt = (d) => {
    const x = frac(d) * M;
    const i = Math.min(M - 1, Math.floor(x));
    return tauOfD[i] + (tauOfD[i + 1] - tauOfD[i]) * (x - i);
  };
  drsZones.forEach((zone) => {
    zone.tauFrom = tauAt(zone.from);
    zone.tauTo = tauAt(zone.to);
  });
  const attacks = zones.map((zone) => {
    const turn = (circuit.corners || []).find((c) => c.number === zone.corner) || null;
    const point = frac(zone.at - approachMetres / length);
    const exit = turn ? frac(turn.to) : frac(zone.at + 0.02);
    const drs = drsZones.findIndex((d) => Math.abs(frac(d.to - zone.at + 0.5) - 0.5) < 0.03);
    return {
      corner: zone.corner,
      tau: tauAt(point),
      exitTau: tauAt(exit),
      weight: Math.max(0.05, (zone.metres || 0) / totalMetres),
      sign: turn?.sign ?? 1,
      drs,
    };
  });
  // Corners for mistakes and accidents, by apex time share.
  const apexTau = new Map();
  (circuit.corners || []).forEach((c) => apexTau.set(c.number, tauAt(c.apex)));

  const pit = circuit.pit || { entry: 0.96, exit: 0.04 };
  const tables = {
    key,
    M,
    length,
    dOfTau,
    tauOfD,
    corner,
    cornerTime,
    straightTime: 1 - cornerTime,
    traceLap,
    vRef,
    sens,
    cornerSens,
    dirtyW,
    attacks,
    drsZones,
    apexTau,
    pitEntryTau: tauAt(pit.entry),
    pitExitTau: tauAt(pit.exit),
    tauAt,
  };
  cache.set(circuit, tables);
  return tables;
};

/** Distance share at time share `tau` (any real number; whole laps carry through). */
export const dAt = (tables, tau) => {
  const lap = Math.floor(tau);
  const x = (tau - lap) * tables.M;
  const i = Math.min(tables.M - 1, x | 0);
  const t = tables.dOfTau;
  return lap + t[i] + (t[i + 1] - t[i]) * (x - i);
};

/** Time share at distance share `d` (any real number). */
export const tauAtD = (tables, d) => {
  const lap = Math.floor(d);
  const x = (d - lap) * tables.M;
  const i = Math.min(tables.M - 1, x | 0);
  const t = tables.tauOfD;
  return lap + t[i] + (t[i + 1] - t[i]) * (x - i);
};

/** WP3: the band weight at time share `tau` (mean 1 over the lap). */
export const sensAt = (tables, tau) => tables.sens[Math.min(tables.M - 1, (frac(tau) * tables.M) | 0)];

/** WP5: the dirty-air weight at time share `tau` (mean 1 over the corners' time; 0 elsewhere). */
export const dirtyAt = (tables, tau) => tables.dirtyW[Math.min(tables.M - 1, (frac(tau) * tables.M) | 0)];

/** Is distance share `d` inside a corner? */
export const inCorner = (tables, d) => tables.corner[Math.min(tables.M - 1, (frac(d) * tables.M) | 0)] === 1;
