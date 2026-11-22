/**
 * The step race simulation (phase 3 of SRS 7.4: RF-SIM-01, RF-SIM-06, RF-SIM-07,
 * RF-SIM-15). race.js stays as the quick mode; see stepRace.js for the loop and duel.js
 * for overtaking.
 */

export {
  DEFENCE_KEYS, RISK_KEYS, airEffect, SIM_BALANCE, cancelPit, createStepRace, fromQuickRace, requestPit, runStepToFinish, setDefence, setErs, setMix, setMode,
  setOvertakeRisk, setTeamOrder, snapshot, stepFor, stepOnce, stepToNextEvent, toRaceState,
} from "./stepRace";
export { ROLE, duelChance } from "./duel";
