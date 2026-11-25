/**
 * SIM-6 (termica-neumatico, docs/manager/F1M24-GAMEPLAY.md §2.8; RF-SIM-03, RF-SIM-07, RNF-07):
 * the tyre's heat in °C, with two nodes - the surface (the tread the driver works) and the
 * carcass (the body under it, slower) - and the same equation in both modes (SRS 4.2):
 *
 *   dTs/dt = q·load − kAir·(Ts − Tair) − kTrack·(Ts − Ttrack) − kSC·(Ts − Tc)
 *   dTc/dt = kCS·(Ts − Tc) − kCLoss·(Tc − Tair)
 *
 * q is the heat the driving puts in (°C/s at load 1): the pace mode, the wake of the car ahead,
 * the water and the safety car scale it. `load` is 1 in the quick mode (the lap's mean); the step
 * simulator passes the car's g at that step over its mean on its last green lap, so the heat goes in
 * where the corners and the brakes are and the lap still averages 1. Every step is an exact
 * relaxation of one node with the other held (stable at any dt), surface first.
 *
 * The grip reads a blend of both nodes (`gripCarcassShare`) against the compound's working window
 * (race-tyres.json `windows`): under it a cold tyre costs `coldSecPerC` a degree, over it a hot one
 * costs `hotSecPerC` and wears `hotWearPerC` faster. The quick mode integrates a whole lap in
 * `integration.dtSec` steps (lapHeat), the step simulator its own 0.25 s steps (heatStep) - for
 * the display - while the lap's budget, in both modes, comes from lapHeat (so the equivalence of
 * SRS 4.2 holds by construction).
 *
 * Tyre blankets by era (`blankets`): a new set leaves the box at the blanket's temperature, or at
 * the air's in the years without them. Nothing here draws a random number (RF-SIM-15, RNF-05).
 * Every number is in data/balance/race-tyres.json (schema engine/packs/schema/race-tyres.schema.json);
 * what is not sourced there is marked `pending`.
 */

import data from "../../data/balance/race-tyres.json";
import { byYear } from "../rules";

export const TYRE_THERMAL = data;

const M = data.model;

/** The working window [lo, hi] (°C) of `compound` in `year` (race-tyres.json windows; unknown compounds use `dry`). */
export const windowFor = (compound, year) => {
  const table = byYear(data.windows, year) || data.windows[data.windows.length - 1];
  return table.compounds[compound] || table.compounds.dry;
};

/** The era's tyre blankets: `{ allowed, tempC, status }` (race-tyres.json blankets; tempC null without them). */
export const blanketsFor = (year) => {
  const row = byYear(data.blankets, year);
  return { allowed: Boolean(row && row.allowed), tempC: row && row.allowed ? row.tempC : null, status: (row && row.status) || null };
};

/** The air around the car: the weather's air on that lap, or the track's minus race-tyres.json `model.airBelowTrackC`. */
export const airOf = (state, lap = 0) => {
  const air = state && state.weather && state.weather.air;
  if (air && air.length) {
    const value = air[Math.min(Math.max(0, lap), air.length - 1)];
    if (Number.isFinite(value)) return value;
  }
  return ((state && state.trackTemp) ?? M.fallbackTrackC) - M.airBelowTrackC;
};

/** A new set as it leaves the box (or the grid's blankets): blanket temperature, or the air in the years without blankets. */
export const freshSet = (year, airC) => {
  const blankets = blanketsFor(year);
  const t = blankets.allowed ? blankets.tempC : airC;
  return { surface: t, carcass: t };
};

/**
 * The heat input of a lap (q in °C/s at load 1) and the sinks, for a car driven at `mode`, `dirty`
 * (0..1, the share of a second of wake), on a track `wetness` wet, behind a safety car or VSC (`sc`).
 */
export const heatInputs = ({ mode = "normal", dirty = 0, wetness = 0, sc = null, trackC = M.fallbackTrackC, airC = trackC - M.airBelowTrackC }) => {
  const pace = data.paceHeat[mode] ?? data.paceHeat.normal;
  const neutral = sc ? (sc.virtual ? data.neutralHeat.vsc : data.neutralHeat.sc) : 1;
  const wet = 1 - Math.min(1, Math.max(0, wetness)) * data.wet.heatCut;
  const q = M.surfaceHeatCPerSec * pace * (1 + Math.max(0, dirty) * data.dirtyAirHeat) * neutral * wet;
  // The sinks see the ambient pulled toward its reference (model.ambientShare): the driver and the set-up work a tyre harder on a cold day.
  const track = trackC - Math.min(1, Math.max(0, wetness)) * data.wet.trackDropC;
  return {
    q,
    neutral,
    airC: M.ambientRefAirC + (airC - M.ambientRefAirC) * M.ambientShare,
    trackC: M.ambientRefTrackC + (track - M.ambientRefTrackC) * M.ambientShare,
  };
};

/** The temperature the grip reads: surface and carcass blended by race-tyres.json `model.gripCarcassShare`. */
export const gripC = (th) => th.surface * (1 - M.gripCarcassShare) + th.carcass * M.gripCarcassShare;

const relax = (value, target, k, dt) => target + (value - target) * Math.exp(-k * dt);

/** One step of `dt` seconds at `load` (mutates `th`): surface toward its balance with the carcass held, then the carcass. */
export const heatStep = (th, inputs, dt, load = 1) => {
  const kS = M.airLossPerSec + M.trackLossPerSec + M.surfaceToCarcassPerSec;
  const targetS = (inputs.q * load + M.airLossPerSec * inputs.airC + M.trackLossPerSec * inputs.trackC + M.surfaceToCarcassPerSec * th.carcass) / kS;
  th.surface = relax(th.surface, targetS, kS, dt);
  const kC = M.carcassFromSurfacePerSec + M.carcassLossPerSec;
  const targetC = (M.carcassFromSurfacePerSec * th.surface + M.carcassLossPerSec * inputs.airC) / kC;
  th.carcass = relax(th.carcass, targetC, kC, dt);
  return th;
};

/**
 * A lap of `seconds` at load 1 in race-tyres.json `integration.dtSec` steps (mutates `th`). Returns the
 * lap's mean grip temperature and its mean degrees under (`coldC`) and over (`hotC`) the window.
 */
export const lapHeat = (th, inputs, seconds, window) => {
  const n = Math.max(1, Math.round(seconds / data.integration.dtSec));
  const dt = seconds / n;
  let sum = 0;
  let cold = 0;
  let hot = 0;
  for (let k = 0; k < n; k += 1) {
    heatStep(th, inputs, dt);
    const g = gripC(th);
    sum += g;
    if (g < window[0]) cold += window[0] - g;
    else if (g > window[1]) hot += g - window[1];
  }
  return { meanC: sum / n, coldC: cold / n, hotC: hot / n };
};

/** What a lap's heat costs: seconds (cold and hot) and the wear multiplier's extra share (race-tyres.json gripCurve). */
export const heatCost = ({ coldC = 0, hotC = 0 }) => ({
  time: coldC * data.gripCurve.coldSecPerC + hotC * data.gripCurve.hotSecPerC,
  wear: hotC * data.gripCurve.hotWearPerC,
});

/** The step mode's load at this step: the car's g (lateral and longitudinal, race-tyres.json `load`) over its mean. */
export const loadOf = (latG, lonG) => data.load.latWeight * Math.abs(latG) + data.load.lonWeight * Math.abs(lonG) + data.load.floor;

/**
 * The 0..1 index the older views read (race-eras.json tyres.thermal coldBelow / overheatAbove): the
 * window's ends land on those two marks. It is only a read-out; nothing in the race reads it.
 */
export const legacyIndexOf = (th, window, marks) => {
  const span = Math.max(1e-6, window[1] - window[0]);
  const idx = marks.coldBelow + ((gripC(th) - window[0]) / span) * (marks.overheatAbove - marks.coldBelow);
  return Math.min(marks.max, Math.max(marks.min, idx));
};

/** Is this grip temperature cold enough for the car behind to take a cold-tyre bonus (RF-SIM-07; race-tyres.json calls.passColdBelowC)? */
export const coldForPass = (gripTemp, window) => gripTemp < window[0] - data.calls.passColdBelowC;
/** Should a rival's pit wall call for a save (race-tyres.json calls.saveAboveC over the window)? */
export const hotForSave = (gripTemp, window) => gripTemp > window[1] + data.calls.saveAboveC;
/** Should the engineer warn of a hot tyre (race-tyres.json calls.radioHotAboveC over the window)? */
export const hotForRadio = (gripTemp, window) => gripTemp > window[1] + data.calls.radioHotAboveC;

/** The formation lap (race-tyres.json formation): the set from the blankets (or the air) after a lap weaving behind the field. */
export const gridSet = ({ year, airC, trackC, baseLap }) => {
  const th = freshSet(year, airC);
  const inputs = heatInputs({ mode: "normal", trackC, airC });
  inputs.q *= data.formation.heat;
  lapHeat(th, inputs, baseLap * data.formation.lapFactor, windowFor("dry", year));
  return th;
};
