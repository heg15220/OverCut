/**
 * Car setup, the F1 Manager way.
 *
 * Five things the engineers can change - front wing, rear wing, anti-roll
 * distribution, camber and toe - and five things the driver can feel: the
 * balance (oversteer), braking stability, cornering, traction and straight-line
 * speed. Each feeling is a mix of several settings, so no single slider fixes
 * anything: more rear wing calms the rear and helps traction but costs speed on
 * the straights, and so on.
 *
 * Somewhere there is the setup this driver wants at this circuit: the wings
 * follow the circuit (Monza almost none, Monaco everything), the mechanical
 * settings follow the driver's taste and the day. Nobody knows it at first.
 * Every run in practice the driver reports how each feeling compares with what
 * they want, and the window the engineers believe the ideal sits in narrows -
 * faster with a technical driver and good engineers. What is left at the end is
 * a satisfaction score: lap time on Sunday and, through confidence, fewer
 * mistakes.
 */

import { clamp, createStream } from "../../overcutTrayectoria/engine/rng";

export const SLIDERS = ["frontWing", "rearWing", "antiRoll", "camber", "toe"];
export const FEELINGS = ["oversteer", "braking", "cornering", "traction", "straights"];

/** How each feeling responds to each setting (columns follow SLIDERS). */
const MIX = {
  oversteer: [0.45, -0.45, 0.25, 0.1, 0],
  braking: [0.15, 0.35, -0.1, 0.25, 0.25],
  cornering: [0.35, 0.25, 0, 0.2, 0.2],
  traction: [0, 0.45, -0.35, 0.2, 0],
  straights: [-0.5, -0.5, 0, 0, 0],
};

/** Range of each feeling over all possible setups, for normalising to 0..1. */
const RANGE = Object.fromEntries(
  FEELINGS.map((feeling) => {
    const weights = MIX[feeling];
    const lo = weights.reduce((sum, w) => sum + Math.min(0, w), 0);
    const hi = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
    return [feeling, { lo, hi }];
  }),
);

/** The five feelings, 0..1, a set of sliders (each 0..100) produces. */
export const feelingsOf = (setup) =>
  Object.fromEntries(
    FEELINGS.map((feeling) => {
      const raw = MIX[feeling].reduce((sum, w, index) => sum + w * ((setup[SLIDERS[index]] ?? 50) / 100), 0);
      const { lo, hi } = RANGE[feeling];
      return [feeling, (raw - lo) / (hi - lo)];
    }),
  );

export const neutralSetup = () => Object.fromEntries(SLIDERS.map((slider) => [slider, 50]));

/**
 * The setup a driver wants at a circuit. Wings from the circuit's demand for
 * downforce against straight-line speed; the mechanical settings from the
 * driver's own taste (stable across a career) and the weekend.
 */
export const idealSetup = ({ driverId, profile = {}, seed }) => {
  const taste = createStream(`taste::${driverId}`);
  const day = createStream(`setup::${seed}::${driverId}`);
  const aero = clamp((profile.aero ?? 0.6) - (profile.power ?? 0.6) * 0.45 + 0.3, 0, 1);
  return {
    frontWing: Math.round(clamp(18 + aero * 70 + taste.normal(0, 6) + day.normal(0, 5), 4, 96)),
    rearWing: Math.round(clamp(14 + aero * 74 + taste.normal(0, 5) + day.normal(0, 5), 4, 96)),
    antiRoll: Math.round(clamp(50 + taste.normal(0, 14) + day.normal(0, 8), 6, 94)),
    camber: Math.round(clamp(45 + (profile.aero ?? 0.6) * 20 + taste.normal(0, 10) + day.normal(0, 8), 6, 94)),
    toe: Math.round(clamp(50 + taste.normal(0, 14) + day.normal(0, 10), 6, 94)),
  };
};

/** 0..1 for each feeling: how close it is to what the driver wants. */
export const feelingScores = (setup, ideal) => {
  const now = feelingsOf(setup);
  const want = feelingsOf(ideal);
  return Object.fromEntries(FEELINGS.map((feeling) => [feeling, clamp(1 - Math.abs(now[feeling] - want[feeling]) / 0.22, 0, 1)]));
};

/** Overall satisfaction, 0..1: the mean of the five feelings. */
export const satisfactionOf = (setup, ideal) => {
  const scores = feelingScores(setup, ideal);
  return FEELINGS.reduce((sum, feeling) => sum + scores[feeling], 0) / FEELINGS.length;
};

/**
 * A run in practice. Returns the driver's report: for each feeling where it is
 * now, and the window the engineers now place the ideal in. The window starts
 * wide and shrinks with every run; its centre carries an error that shrinks
 * too, so early reports can mislead a little - as real ones do.
 */
export const practiceRun = ({ setup, ideal, knowledge = 0, technical = 50, engineering = 60, stream }) => {
  const now = feelingsOf(setup);
  const want = feelingsOf(ideal);
  const gain = 0.16 + (technical - 50) / 400 + (engineering - 60) / 500;
  const next = clamp(knowledge + gain, 0, 1);
  const width = 0.34 * (1 - next) + 0.035;
  const report = Object.fromEntries(
    FEELINGS.map((feeling) => {
      const centre = clamp(want[feeling] + stream.normal(0, width * 0.35), 0, 1);
      return [feeling, { now: now[feeling], lo: clamp(centre - width / 2, 0, 1), hi: clamp(centre + width / 2, 0, 1) }];
    }),
  );
  return { knowledge: next, report, satisfaction: satisfactionOf(setup, ideal) };
};

/** Seconds a lap is worth from a setup's satisfaction (0.62 - an engineers' first guess - is par). */
export const setupLapTime = (satisfaction) => -(satisfaction - 0.62) * 0.7;
