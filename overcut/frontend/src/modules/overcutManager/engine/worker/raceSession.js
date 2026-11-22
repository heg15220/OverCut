/**
 * The race engine behind the live view (SRS 4: "el motor corre en un Web Worker"),
 * as a pure message handler: `raceWorker.js` wraps it in a real Worker, `raceClient.js`
 * runs it in-thread where there is none (jest, SSR) - the same code either way, so the
 * race is the same either way (RF-SIM-15, RNF-05).
 *
 * The full step state - typed arrays and the seeded RNG streams, which are closures and
 * would not survive postMessage - lives only here. The view gets:
 *
 *   - `created`  once: the race as plain data (toRaceState, no history yet), the
 *                orders the era allows (rules.commandsFor) and the step size;
 *   - `tick`     after every step/next/lap/command: a compact patch - the race clock,
 *                where every car is (sim.snapshot, and a compact trail of every step
 *                since the last tick for the view to draw between), each car's changing fields, the
 *                line crossings, events, duels and radio since the last tick (events stamped
 *                with the race time they reached the view, `at`), the safety-car spells
 *                (`red: true` for a red-flag neutralisation) and the local yellows;
 *   - `finished` at the flag: the full toRaceState for career.completeRace, plus the
 *                order log (every command with the race time it was applied at), so the
 *                same seed and log replay the race byte for byte (RNF-05).
 *
 * Messages in (all carry an optional `id`, echoed back):
 *   { type: "create", args }                  args as race.js createRace (career.weekendRaceArgs)
 *   { type: "step", seconds }                 RF-CMD-04: the view asks dt × speed of race time
 *   { type: "next", types? }                  RF-CMD-04: run to the next relevant event
 *   { type: "lap" }                           run until the leader starts a new lap
 *   { type: "command", name, args }           RF-CMD-01/02: one of COMMANDS
 *   { type: "finish" }                        run to the flag (headless, RNF-01)
 *   { type: "state" }                         the full toRaceState now
 *   { type: "dispose" }
 */

import {
  cancelPit, createStepRace, delayStop, requestPit, skipStop, runStepToFinish, setDefence, setErs, setMix, setMode, setOvertakeRisk, setTeamOrder, snapshot, stepFor, stepOnce,
  stepToNextEvent, toRaceState,
} from "../sim";
import { commandsFor, rulesOf } from "../race";

/** RF-CMD-01/02: the orders the view may send, by name (the sim setters). */
export const COMMANDS = { setMode, setMix, setErs, requestPit, cancelPit, delayStop, skipStop, setTeamOrder, setDefence, setOvertakeRisk };

/** Events "saltar al siguiente evento" stops at (RF-CMD-04): passes, stops, incidents, flags. */
export const NEXT_EVENT_TYPES = ["pass", "pit", "dnf", "sc", "vsc", "sc-in", "rain", "lead", "contact", "mistake", "flag", "yellow", "red", "restart", "penalty", "swap"];

/** Car fields the view keeps on its side; history goes as new line crossings only. */
const carPatch = (car) => {
  const { history, ...rest } = car;
  return rest;
};

/** A deep copy of plain race data (no closures reach here: toRaceState strips them). */
const plain = (value) => JSON.parse(JSON.stringify(value));

export const createRaceSession = () => {
  let state = null;
  let sent = null; // what the view already has: counts of events, radio, history per car
  let log = [];

  /** Where every car is now, compactly: one entry of the view's interpolation trail. */
  const shot = () => {
    const cars = snapshot(state);
    return {
      clock: state.clock,
      p: cars.map((car) => car.progress),
      l: cars.map((car) => car.lateral),
      pit: cars.map((car) => (car.inPit ? 1 : 0)),
      duel: cars.map((car) => car.duel),
    };
  };

  const tick = (trail = []) => {
    const at = Math.round(state.clock * 1000) / 1000;
    const events = state.events.slice(sent.events).map((event) => ({ ...event, at }));
    const radio = state.radio.slice(sent.radio).map((message) => ({ ...message, at }));
    const duels = (state.duels || []).slice(sent.duels).map((duel) => ({ ...duel, at }));
    sent.duels = (state.duels || []).length;
    sent.events = state.events.length;
    sent.radio = state.radio.length;
    const cars = state.cars.map((car, index) => {
      const patch = carPatch(car);
      const history = car.history.slice(sent.history[index]);
      sent.history[index] = car.history.length;
      return { ...patch, newHistory: history };
    });
    return plain({
      type: "tick",
      clock: state.clock,
      lap: state.lap,
      finished: Boolean(state.finished),
      safetyCar: state.safetyCar || null,
      safetyCarSpells: state.safetyCarSpells || [],
      yellowZones: state.yellowZones || [],
      fastestLap: state.fastestLap || null,
      teamOrders: state.teamOrders || {},
      restartLap: state.restartLap || 0,
      snapshot: snapshot(state),
      trail: trail.length && trail[trail.length - 1].clock === state.clock ? trail : [...trail, shot()],
      cars,
      events,
      radio,
      duels,
    });
  };

  const finished = () => ({ type: "finished", state: plain(toRaceState(state)), commands: log.slice() });

  const handlers = {
    create: ({ args }) => {
      state = createStepRace(args);
      log = [];
      const race = plain(toRaceState(state));
      sent = { duels: 0, events: state.events.length, radio: state.radio.length, history: state.cars.map((car) => car.history.length) };
      const rules = rulesOf(state.era, state.year);
      return { type: "created", state: race, commands: commandsFor(rules), dt: state._sim.dt, view: tick() };
    },
    // In pieces of one step, so the view gets every step's positions to draw between
    // (stepFor adds the pieces up exactly as it would the whole).
    step: ({ seconds }) => {
      const sim = state._sim;
      const trail = [];
      let left = seconds > 0 ? seconds : 0;
      while (left > 1e-12 && !state.finished) {
        const piece = Math.min(sim.dt, left);
        const before = sim.steps;
        stepFor(state, piece);
        left -= piece;
        if (sim.steps !== before) trail.push(shot());
      }
      return tick(trail);
    },
    next: ({ types }) => {
      stepToNextEvent(state, types && types.length ? types : NEXT_EVENT_TYPES);
      return tick();
    },
    lap: () => {
      const from = state.lap;
      const sim = state._sim;
      while (!state.finished && state.lap === from) stepOnce(state);
      sim.requested = sim.steps * sim.dt;
      return tick();
    },
    command: ({ name, args = [] }) => {
      const fn = COMMANDS[name];
      if (!fn) throw new Error(`unknown race command: ${name}`);
      fn(state, ...args);
      log.push({ clock: state.clock, name, args });
      return tick();
    },
    finish: () => {
      runStepToFinish(state);
      return { ...finished(), view: tick() };
    },
    state: () => ({ type: "state", state: plain(toRaceState(state)) }),
    dispose: () => {
      state = null;
      sent = null;
      return { type: "disposed" };
    },
  };

  /** One message in, one reply out (both structured-clone safe). */
  const handle = (message) => {
    const { id, type } = message || {};
    try {
      const fn = handlers[type];
      if (!fn) throw new Error(`unknown race message: ${type}`);
      if (type !== "create" && type !== "dispose" && !state) throw new Error("no race: send create first");
      const reply = fn(message);
      // At the flag the view is told once, with the full state for the career.
      if (reply.type === "tick" && state && state.finished && !sent.flagged) {
        sent.flagged = true;
        return { id, ...reply, final: finished() };
      }
      if (reply.type === "finished") sent.flagged = true;
      return { id, ...reply };
    } catch (error) {
      return { id, type: "error", message: String(error && error.message ? error.message : error) };
    }
  };

  return { handle, peek: () => state };
};
