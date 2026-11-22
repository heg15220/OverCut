/**
 * The step race simulation (phase 3 of SRS 7.4: RF-SIM-01, RF-SIM-05..08, RF-SIM-10,
 * RF-SIM-15). race.js stays as the quick mode and owns the shared lap model and race
 * control (lapModel.js adapts it); see stepRace.js for the loop and duel.js for overtaking.
 */

export {
  DEFENCE_KEYS, RISK_KEYS, airEffect, SIM_BALANCE, cancelPit, createStepRace, fromQuickRace, requestPit, runStepToFinish, setDefence, setErs, setMix, setMode,
  setOvertakeRisk, setTeamOrder, snapshot, stepFor, stepOnce, stepToNextEvent, toRaceState, restartProcedure, yellowAt,
} from "./stepRace";
export { ROLE, duelChance } from "./duel";
