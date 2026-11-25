/**
 * WKD-6 pre-race-briefing (F1M24-GAMEPLAY §2.12.2 «Informe previo», gap-view §5.4; RF-INB-01,
 * RF-SIM-10, RF-SIM-12): what the strategists tell the team about this Grand Prix before the
 * weekend - how likely a safety car is here and what a stop costs under green, a safety car and
 * a VSC. Pure: it reads the race, the era and the circuit and draws from no stream, so showing
 * it never changes a result (RF-SIM-15, RNF-05).
 *
 * Every number comes from the engine, never from this file (RNF-07):
 *
 *   scRate      the pack's `calendar[].scRate` (generate_season_packs.py from
 *               curated/circuit-sc-rates.json: share of races here with at least one safety car,
 *               measured in OpenF1 race_control). The same value the engine scales its safety-car
 *               chance with (sim/safetyCar.js circuitScFactor). Null where it was not measured
 *               (before 2023, or a circuit OpenF1 has not raced): the card says so, it does not
 *               invent one (F1M24-GAMEPLAY §1.6: the game's 75 % is not copied).
 *   lane*       the pit-lane loss the race will charge (race.js pitLaneOf: the era's limit, the
 *               lane's geometry, braking into the box and the launch, less the same stretch of
 *               track at race / SC / VSC pace) - the same `state.pitLane` createRace keeps.
 *   stationary  the typical stop for the crew and era (pitStop.js expectedStationary via
 *               race.js stationaryTime), without fuel: in a refuelling era the litres add to it.
 *   loss*       lane + stationary: the net time lost against staying out, which is what
 *               previewPit calls lossGreen / lossSc / lossVsc (not a line-to-line lane time).
 *
 * SC and VSC losses are null in an era without that procedure (SC from 1993, VSC from 2015,
 * rules.raceControl), so nothing outside its era is shown (SRS §6, criterio 7.2).
 */

import { pitLaneOf, rulesOf, stationaryTime } from "./race";
import { circuitFor } from "./venue";
import scRates from "../data/seasons/curated/circuit-sc-rates.json";

const round = (x, digits = 3) => (Number.isFinite(x) ? Math.round(x * 10 ** digits) / 10 ** digits : null);

/** Where the measured safety-car rates come from, for the card's note. */
export const SC_RATE_SOURCE = Object.freeze({
  source: scRates.source,
  years: scRates.years.slice(),
  appliesFrom: scRates.appliesFrom,
  appliesTo: scRates.appliesTo,
});

/**
 * The briefing of `race` under its era (`era` from career eraOf, or the bare `year`).
 * `circuit` may be passed to reuse the one already built (venue.circuitFor); `crew` is the
 * operations rating that scales the stop (default: the engine's).
 */
export const preRaceBriefing = ({ race, era = null, year, circuit = null, crew } = {}) => {
  if (!race) return null;
  const rules = rulesOf(era, year);
  const control = rules.raceControl || {};
  const scAllowed = Boolean(control.safetyCar);
  const vscAllowed = Boolean(control.vsc);
  const scRate = Number.isFinite(race.scRate) ? race.scRate : null;

  let lane = null;
  if (race.baseLap > 0) {
    const track = circuit || circuitFor(race, year);
    lane = pitLaneOf({ circuit: track, race, rules });
  }
  const tyres = rules.tyres?.changesInRace !== false;
  const stationary = stationaryTime({ era: era ?? year, crew: Number.isFinite(crew) ? crew : undefined, fuelOnly: !tyres });
  const total = (laneLoss) => (lane && Number.isFinite(laneLoss) ? round(laneLoss + stationary) : null);

  return {
    laps: Number.isFinite(race.laps) ? race.laps : null,
    scAllowed,
    vscAllowed,
    scRate: scAllowed ? scRate : null,
    scMeasured: scAllowed && scRate !== null,
    pitLimitKmh: lane && Number.isFinite(lane.kmh) ? lane.kmh : null,
    laneGreen: lane ? round(lane.stop) : null,
    laneSc: lane && scAllowed ? round(lane.sc) : null,
    laneVsc: lane && vscAllowed ? round(lane.vsc) : null,
    stationary: round(stationary),
    tyresChanged: tyres,
    refuelling: Boolean(rules.refuelling),
    lossGreen: total(lane?.stop),
    lossSc: scAllowed ? total(lane?.sc) : null,
    lossVsc: vscAllowed ? total(lane?.vsc) : null,
  };
};
