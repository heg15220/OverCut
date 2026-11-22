/**
 * Reference laps of a pack's Grand Prix (WP10 of docs/manager/SIM-FISICA.md; RF-SIM-02,
 * RF-WKD-02). The pack carries the real pole, fastest race lap and winner's average per
 * event (calendar[].refLaps, from f1db via generate_season_packs.py); this turns them into
 * the two numbers the engine reads:
 *
 *   baseLap         the dry race lap of an average car (race.js lapBudget), from the real
 *                   fastest race lap - not from the winner's average, which carries stops
 *                   and safety cars the simulation adds by itself;
 *   qualifyingRef   the lap the quickest car of the field does in dry qualifying: the real
 *                   pole (race.js qualifyingAnchorOf anchors the field's best to it).
 *
 * Wet or disrupted sessions are detected from the ratio between the two laps and replaced by
 * the other one scaled by its median ratio. Coefficients: data/balance/pack-world.json
 * `refLaps` (RNF-07).
 */

import balance from "../../data/balance/pack-world.json";

const round2 = (value) => Math.round(value * 100) / 100;
const valid = (value) => Number.isFinite(value) && value > 20;

export const referenceLapsOf = (refLaps, coefficients = balance.refLaps) => {
  if (!refLaps) return null;
  const k = coefficients;
  const pole = valid(refLaps.pole) ? refLaps.pole : null;
  const fastest = valid(refLaps.fastestRaceLap) ? refLaps.fastestRaceLap : null;
  if (!pole && !fastest) return null;
  const dryRace = fastest && (!pole || fastest <= pole * k.wetRaceRatio);
  const dryPole = pole && (!fastest || pole <= fastest * k.wetPoleRatio);
  return {
    baseLap: round2(dryRace ? fastest * k.raceFromFastest : pole * k.raceFromPole),
    qualifyingRef: Math.round((dryPole ? pole : fastest * k.poleFromFastest) * 1000) / 1000,
  };
};
