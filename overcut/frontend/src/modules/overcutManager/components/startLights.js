/**
 * The start as the live view shows it, pure (no React): HUD-4 of docs/manager/F1M24-GAMEPLAY.md
 * (start-lights-sound-and-timing, the view; RF-SIM-10, RF-SIM-15, RNF-05, RNF-07; §1.5 "Semáforo de
 * salida": the engine decides the instants with its seed, the view only reads them).
 *
 *   startProcedureOf(rules)          the season's procedure (era-defaults.json startProcedure or the pack)
 *                                    and its timing (race-sim.json start.procedures): five reds or red-green
 *   startTimelineOf(events)          the engine's PRE_START events (SIM-3: formation, grid, light n,
 *                                    lightsOut), each at `t` seconds of the procedure clock
 *   replayTimelineOf({ rules, seed }) the same timeline for a race that has no PRE_START of its own (the
 *                                    quick mode's replay): the era's procedure, the wait after the last light
 *                                    drawn on the race's own start stream (`seed::step::start`), as the step
 *                                    engine draws it - so the same seed shows the same lights in both
 *   startStateAt(timeline, t, proc)  §1.7 `snapshot.start` at procedure time `t`:
 *                                    { phase: "formation"|"grid"|"lights"|"out", lights, lamps, t, outAt, procedure }
 *   procedureLimit(timeline, t)      how far the view may run the procedure clock (never past lights out)
 *
 * Nothing here draws a number the race reads (§1.4 rule 5): the replay timeline opens a stream of its own
 * from the seed's name and never touches the engine's.
 */

import RACE_SIM from "../data/balance/race-sim.json";
import { createStream } from "../../overcutTrayectoria/engine/rng";

const PRE_TYPES = new Set(["formation", "grid", "light", "lightsOut"]);
const round3 = (value) => Math.round(value * 1000) / 1000;

/** The season's start procedure and its timing, or null (no procedure known: the lights go out at once). */
export const startProcedureOf = (rules, balance = RACE_SIM) => {
  const era = rules && rules.regulations && rules.regulations.startProcedure;
  const name = era && balance.start && balance.start.procedures[era.lights] ? era.lights : null;
  if (!name) return null;
  return { name, spec: balance.start.procedures[name], formationLap: Boolean(era.formationLap) };
};

/** The PRE_START events the engine sent (SIM-3), in procedure order, as { type, n?, t }. */
export const startTimelineOf = (events = []) =>
  events
    .filter((event) => PRE_TYPES.has(event.type) && Number.isFinite(event.t))
    .map((event) => ({ type: event.type, ...(event.n ? { n: event.n } : {}), t: event.t }))
    .sort((a, b) => a.t - b.t);

/**
 * A quick race's start: no formation lap is driven (the quick mode has none), the grid settles for
 * race-sim.json gridSettleSec, the era's lights come on one every lightIntervalSec and go out after the
 * seeded wait. Without a procedure, lights out at 0.
 */
export const replayTimelineOf = ({ rules, seed = "race", balance = RACE_SIM } = {}) => {
  const procedure = startProcedureOf(rules, balance);
  if (!procedure) return [{ type: "lightsOut", t: 0 }];
  const { spec } = procedure;
  const hold = createStream(`${seed}::step::start`).range(spec.holdSec.min, spec.holdSec.max);
  const timeline = [{ type: "grid", t: 0 }];
  let last = 0;
  for (let k = 0; k < spec.lights; k += 1) {
    last = balance.start.gridSettleSec + k * spec.lightIntervalSec;
    timeline.push({ type: "light", n: k + 1, t: round3(last) });
  }
  timeline.push({ type: "lightsOut", t: round3(last + hold) });
  return timeline;
};

/** The time of lights out in a timeline, or null while it has not come. */
export const lightsOutOf = (timeline = []) => {
  const out = timeline.find((entry) => entry.type === "lightsOut");
  return out ? out.t : null;
};

/**
 * §1.7 `snapshot.start` at procedure time `t` (seconds since the procedure began). `lamps` is how many
 * lights the era's gantry has (five reds, or the one red of red-green); with red-green, "out" is the green.
 */
export const startStateAt = (timeline = [], t = 0, procedure = null) => {
  const outAt = lightsOutOf(timeline);
  const lamps = procedure ? procedure.spec.lights : 0;
  const name = procedure ? procedure.name : null;
  if (outAt !== null && t + 1e-9 >= outAt) return { phase: "out", lights: 0, lamps, t: outAt, outAt, procedure: name };
  let lights = 0;
  let grid = false;
  let formation = false;
  timeline.forEach((entry) => {
    if (entry.t > t + 1e-9) return;
    if (entry.type === "light") lights = Math.max(lights, entry.n || 0);
    if (entry.type === "grid") grid = true;
    if (entry.type === "formation") formation = true;
  });
  const phase = lights > 0 ? "lights" : formation && !grid ? "formation" : "grid";
  return { phase, lights: Math.min(lights, lamps || lights), lamps, t: Math.max(0, t), outAt, procedure: name };
};

/** The procedure clock the view may show: up to lights out once it is known, else up to `engineAt`. */
export const procedureLimit = (timeline, wanted, engineAt = Infinity) => {
  const outAt = lightsOutOf(timeline);
  if (outAt !== null) return Math.min(wanted, outAt);
  return Math.max(0, Math.min(wanted, engineAt));
};
