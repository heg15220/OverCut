/**
 * SES-C1 (docs/manager/F1M24-CHINA.md §1.5 «Radio en sesiones», §2.7 AUD-C3 engine part; RF-CMD-03,
 * RF-WKD-02, RF-SIM-15, RNF-05, RNF-07): the engineer on the radio in a playable session, with the same
 * shape as the race's (engine/race.js pushRadio, engine/sim/duel.js battleRadio):
 *
 *   state.radio[]  {lap, carId, kind, t, segment, alert, ...extra}  to the player's drivers only
 *
 * `lap` is the car's lap of the segment the message is about, `t` the session time of the instant that
 * produced it (the same instant as its event), `alert` the kind's flag in sessions.json radio.kinds (the
 * radio opens with the double tone, three/audio uiSounds). A kind repeats to the same driver only after
 * its quietSec of session time within the segment. Kinds outside sessions.json radio.kinds are not sent.
 *
 * Nothing here draws from a stream or touches a lap: the radio is a reading of what the session already
 * did, so the same seed and orders give the same messages (RNF-05), and turning it off changes nothing else.
 */

import { SESSION_BALANCE as B } from "./formats";

const round3 = (value) => Math.round(value * 1000) / 1000;

/** The kinds the session's engineer can send (sessions.json radio.kinds). */
export const SESSION_RADIO_KINDS = Object.keys(B.radio?.kinds || {});

/** The radio of `state` (created on first use: a session saved before SES-C1 has none). */
export const radioOf = (state) => {
  if (!Array.isArray(state.radio)) state.radio = [];
  return state.radio;
};

/**
 * Send `kind` to car `car` at session time `at` about lap `lap`, unless it is not the player's, the radio
 * is off, the kind is unknown, or the same kind went to the same driver less than quietSec ago in this
 * segment. Returns the message, or null.
 */
export const pushSessionRadio = (state, car, kind, at, lap, extra = {}, cfg = B.radio) => {
  if (!cfg || !cfg.enabled || !car || !car.isUser) return null;
  const spec = cfg.kinds?.[kind];
  if (!spec) return null;
  const radio = radioOf(state);
  const quiet = spec.quietSec ?? 0;
  if (quiet > 0) {
    for (let index = radio.length - 1; index >= 0; index -= 1) {
      const last = radio[index];
      if (last.segment !== state.segment) break;
      if (last.carId === car.id && last.kind === kind) {
        if (at - last.t < quiet) return null;
        break;
      }
    }
  }
  const message = { lap: Number.isFinite(lap) ? lap : null, carId: car.id, kind, t: round3(at), segment: state.segment, alert: Boolean(spec.alert), ...extra };
  radio.push(message);
  return message;
};

/** The messages of the current segment sent by session time `tau` (read-only, for the view). */
export const sessionRadioAt = (state, tau = state.clock, segment = state.segment) =>
  (Array.isArray(state.radio) ? state.radio : []).filter((message) => message.segment === segment && message.t <= tau);
