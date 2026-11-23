/**
 * The per-lap model the step simulation shares with the quick mode (SRS 4.2: "el modo
 * rápido usa el mismo modelo").
 *
 * Nothing here is a copy: every piece is race.js's own exported function, called with
 * the season's rules (`rulesOf(state.era, state.year)` via race.js `stateRules`, never a
 * bare year) and the car's own lap - the step simulator's cars are on different laps at
 * the same moment, so where race.js reads `state.lap` this adapter passes the lap of the
 * car concerned (and the leader's lap for race-control decisions).
 *
 * At every line crossing a car's next lap is planned with exactly the ingredients of
 * race.js `stepLap` (lapBudget: pace, tyres, heat, fuel, battery, track evolution, mode,
 * problems; startTerm; rollMistake; endLapWear) and the result is the lap-time *budget*
 * the step sim then spends along the speed trace (RF-SIM-01, RF-SIM-02..05). Traffic,
 * dirty air, the safety car, pit-lane time, mistakes and the 2026 overtake mode are not
 * in the budget: the step sim plays them out physically.
 */

import {
  applyPitStop, beginLapWorld, endLapWear, failureOf, finishRace as quickFinishRace, lapBudget, pitDecision as quickPitDecision, pitLaneLoss, pitStopTime,
  pushEvent as quickPushEvent, radioFor as quickRadioFor, restoreKers, retire as quickRetire, rivalCalls as quickRivalCalls, rollMistake, startTerm, stateRules,
  wetnessOn,
} from "../race";

export const wetnessAt = wetnessOn;

/** Events carry the lap of the car they are about (raceClock times them on that car's lap). */
export const pushEvent = (state, lap, event) => quickPushEvent(state, event, lap);

/** Start of lap `lap` for the race as a whole, when the leader begins it (race.js beginLapWorld). */
export const beginLeaderLap = (state, lap) => beginLapWorld(state, lap);

/** The rival pit wall's calls at the start of the car's lap `lap` (race.js rivalCalls), after the KERS budget comes back. */
export const rivalCalls = (state, car, lap) => {
  restoreKers(stateRules(state), car);
  if (!car.isUser) quickRivalCalls(state, car, lap);
};

/**
 * Plan one car's lap `lap` (race.js lapBudget + startTerm + rollMistake + endLapWear):
 * without the wake (the step sim applies dirty air by distance), without the safety-car
 * floor (the step sim runs a real train), without the mistake's time (lost at the
 * corner) and, in 2026, without the overtake mode (run by distance). Mutates tyres,
 * fuel, battery and heat exactly as the quick mode does and returns the budget in seconds.
 *
 * `gridIndex` is the car's place in the order at the start (lap 1 only), `scrumShare`
 * the share of the quick mode's first-lap traffic term kept (race-sim.json); `out`, if given,
 * receives the lap's `energyTime`.
 */
export const planLap = (state, car, lap, stream, { gridIndex = 0, scrumShare = 1 } = {}, out = null) => {
  const rules = stateRules(state);
  const wetness = wetnessAt(state, lap);
  const sc = state.safetyCar;
  const plan = lapBudget(state, car, { lap, wetness, sc, rules, energyGap: rules.energy.overtakeMode ? null : undefined });
  // RF-SIM-05: the lap's energy time (race.js energyStep), which the step sim spends where the store deploys.
  if (out) out.energyTime = plan.energyTime;
  let time = plan.expected + stream.normal(0, plan.volatility);
  if (lap === 1) time += startTerm(car, gridIndex, stream, scrumShare);
  car.mistakeKind = rollMistake(car, plan, stream);
  endLapWear(state, car, plan, { wetness, sc, rules });
  return time;
};

/**
 * Will this car's lap end its race, or bring a problem (race.js failureOf)? Rolled at
 * the start of the lap; returns null or `{ reason, at }` where `at` is "corner" (an
 * accident, placed at a real corner by the caller), "mistake" (the corner of this lap's
 * mistake), "early" (first-lap contact) or "anywhere".
 */
export const rollFailure = (state, car, lap, stream) => {
  const failure = failureOf(state, car, { lap, wetness: wetnessAt(state, lap), sc: state.safetyCar, rules: stateRules(state), stream });
  if (!failure) return null;
  const { reason } = failure;
  const at = failure.fromMistake ? "mistake" : reason === "collision" && lap === 1 ? "early" : reason === "accident" || reason === "collision" ? "corner" : "anywhere";
  return { reason, at };
};

/**
 * Retire a car where it is (race.js retire): its lap, where on the lap and at which
 * corner are the step sim's; race control (red flag, SC/VSC, yellows) answers exactly
 * as in the quick mode, counting race laps on the leader's.
 */
export const retire = (state, car, lap, reason, corner, stream, share) =>
  quickRetire(state, car, reason, { lap, raceLap: state._sim ? state._sim.leaderLap : lap, stream, corner: corner ?? null, share });

/** race.js pitDecision at pit entry on lap `lap`, with the step sim's running order (by distance covered). */
export const pitDecision = (state, car, lap, order, stream) => quickPitDecision(state, car, wetnessAt(state, lap), stream, { lap, order });

/**
 * The work done in the box (race.js pitStopTime + applyPitStop), applied when the car
 * commits to the pit lane. Returns the lane loss, the stationary time with any queue and
 * a +5/+10 s penalty served first, and the car's own stationary time.
 */
export const servicePit = (state, car, lap, decision, stream, queue = 0) => {
  const rules = stateRules(state);
  const lane = pitLaneLoss(state.race.baseLap, state.safetyCar);
  const stop = pitStopTime(car, decision, { rules, stream, kgPerLap: state.fuelSpec?.kgPerLap ?? null });
  const served = applyPitStop(state, car, decision, stop, { lap, queue, rules });
  return { lane, stationary: stop.stationary + queue + served, ownStationary: stop.stationary + served };
};

/** The engineer after the car's lap `lap` (race.js radioFor). */
export const radioFor = (state, car, lap) => quickRadioFor(state, car, wetnessAt(state, lap), lap);

/** The flag: two-compound rule, penalties owed, positions and gaps (race.js finishRace). */
export const finishRace = (state) => quickFinishRace(state);
