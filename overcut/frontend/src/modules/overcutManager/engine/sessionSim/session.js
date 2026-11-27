/**
 * Practice, qualifying and the sprint shootout as sessions you play (RF-WKD-02/03/05,
 * RF-SIM-15): a state machine over a session clock that advances in fixed steps and
 * takes the pit wall's orders, the way the step race does for Sunday (engine/sim).
 *
 * Every car is in its garage until someone sends it out. A run is an out-lap, timed (or
 * push) laps - with a cool-down lap between pushes in qualifying - and an in-lap back to
 * the box; the engineers' plan (programme, laps, fuel, tyre set, style) says how many.
 * The player sends each of their cars out with a plan ("Salir a pista"), aborts a lap
 * ("Abortar vuelta": the rest of it at cool-down pace, no time) or calls the car in
 * ("Volver a boxes": this lap if it has not passed pit entry, else at the end of it - a
 * flying lap is finished first). Rival pit walls plan their own runs. At the flag a car
 * may finish the lap it started; then the segment is over, the slowest drop out of a
 * knockout, and the next segment starts on its own clock.
 *
 * Each lap's time is decided when it starts, from the same deterministic qualifying pace
 * as the quick mode (race.js qualifyingPaceOf), the tyre model (race.js tyreTime, age and
 * compound against the best tyre for the conditions), the fuel aboard, the rubber the
 * field has laid down, the driver's style and a seeded scatter. Laps are written as the
 * line-crossing records the broadcast clock draws (components/raceClock.carAt), with
 * sector times, so the view shows every car on the circuit at any instant.
 *
 * Determinism (RF-SIM-15, RNF-05): one seeded stream per car and segment for its laps and
 * one for the rival plan, lap ends processed in time order, orders taking effect at the
 * step boundary they arrive on and kept in a log. The same seed and the same orders at the
 * same session times give the same session byte for byte, however the view slices time.
 *
 * The weekend around it (F1M24-GAMEPLAY §2.12.3; RF-WKD-01/03, RF-SIM-11):
 *   localClock   the local time of day of every instant: the session's start from the pack
 *                (race.sessions, f1db) or the era's template, plus the segments and the
 *                breaks between them (sessions.json durations.*.breakMinutes), which the
 *                session does not play but the clock counts. Conditions by hour from
 *                engine/weather hourlyConditions. Read-only: nothing here draws or moves a lap.
 *   evolution    the rubber the field lays down, by era (sessions.json evolution.byEra),
 *                calibrated on f1db's Q1->Q3 improvement (scripts/measureEvolution.js).
 *   garage work  a car back in the garage leaves again only when the work its next plan asks
 *                for is done: the base turnaround, another tyre set, the fuel added and a setup
 *                change, scaled by the pit crew (sessions.json garage.work; garageWorkOf shows
 *                it before the order is confirmed).
 *
 * The physical garage (SES-2, F1M24-GAMEPLAY §2.2 salida-boxes-sesion; RF-WKD-02, RF-SIM-12):
 *   garage exit  a run starts in the team's garage: the car is rolled out into the fast lane
 *                (sessions.json garage.exit.rollOutSec, from OpenF1), drives the pit lane on the
 *                race's own physical profile from its box to the end of the white exit line
 *                (engine/sim/pitLane.js garageExitProfile, the era's limit from era-defaults.json
 *                pitLaneSpeed) and joins the track when the exit is clear: cars that reach it
 *                together queue at the light, one behind the other (race-pit.json queueOffsetMetres).
 *   in-lap       ends in the garage: the track to pit entry at in-lap pace, then the lane on the same
 *                profile down to the team's box (v = 0 there). No fixed pit-lane seconds any more.
 *   phases       carStatus(...).runPhase is the §1.7 contract: GARAGE, GARAGE_EXIT, OUT_LAP,
 *                PUSH_PREP (past the last corner before the line that starts a push lap), PUSH,
 *                IN_LAP; with `garageExit` {s, v, queued, toTrack} while leaving and `boxRequest`
 *                {distanceM} (metres to pit entry) once the car has been called in.
 * Nothing in the lane draws from a stream: the lane is geometry, the same for every seed.
 *
 * Local yellows (SES-3, F1M24-GAMEPLAY §1.5 / §1.7 `yellow`, §2.12.1 flag-header-sectors; RF-SIM-10,
 * RF-WKD-02): a mistake on a timed lap may be an off - sessions.json yellow.chance by kind, calibrated on
 * OpenF1 race_control - and the marshals wave a yellow (or a double, yellow.doubleShare) where it happened,
 * for a log-normal time from the measured durations. The event {t, type: "yellow", carId, segment, sector
 * (circuit.sectors), marshalPost, corner, double, s, until} is pushed at its own instant inside the step.
 * Its draws come from a stream of their own, so the yellows never change which laps are drawn.
 *
 * The lap under a yellow (SES-4, F1M24-GAMEPLAY §2.10 amarilla-sector; RF-SIM-10, RF-WKD-02, RNF-07):
 * every other car on a timed lap that reaches the place of a yellow while it is waved meets it, at the
 * instant it gets there (the lap's own timeline, warped like raceClock reads it). What it does is the
 * era's rule for that flag (sessions.json yellow.laps.eras): "lift" - the driver slows through the
 * marshal sector and loses some time; "delete" - the same, and the time is deleted at the line (race
 * control, 2023-2024 double yellows); "abandon" - the attempt must be given up there (the rest at
 * cool-down pace, no time). Under "lift" and "delete" the driver still gives the lap up as often as
 * OpenF1's drivers did (yellow.laps.abandonShare). Events
 * {type: "yellowLap", outcome, double, lossSec} and {type: "lapDeleted", time, reason}. The choice and
 * the loss draw from one more stream of the car's own (two draws per meeting), so the same seed and
 * orders give the same session (RF-SIM-15, RNF-05).
 *
 * Traffic (SES-8, F1M24-GAMEPLAY §2.12.3 trafico-sesion; RF-WKD-02, RF-SIM-01, RF-SIM-06, RNF-07): at the start
 * of every step the cars on the track are placed on the step race's trace and stepSession.js says what the car
 * ahead does to each timed lap over the step - the era's dirty air in the corners and tow on the straights
 * (stepRace airEffect), or a meeting with a slow car that may be in the way (`impeding`, its own stream). The
 * change is written into the lap like a lift (a warp at the step's start), so the view and the timing read it.
 * Rival pit walls hold their car in the garage while another car passes the pit exit within ai.spacingSec of the
 * moment it would join. carStatus(...).traffic {aheadId, gapSec, effect} and exitTrafficOf() only read.
 *
 * Radio and events with the race's shape (SES-C1, F1M24-CHINA §1.5 «Radio en sesiones», §2.7 AUD-C3; RF-CMD-03,
 * RF-WKD-02, RNF-05, RNF-07): besides the session's own log, two events carry the car's `lap` like the race's
 * ({t, lap, type, carId, segment, ...}) -
 *   garageExit   {queueSec, laneSec, heldSec?}  the car crosses the end of the pit-exit line and joins the track
 *                (the end of GARAGE_EXIT), at that instant inside the step (the `out` event is its release);
 *   lapComplete  {kind, time, sectors, compound, improved, deleted, position, gapSec, cutoff?, dropZone?}  a timed
 *                lap finished at the line, kept or deleted (not an aborted one), with the order after it;
 * and the `flag` stays the session's chequered flag. state.radio[] (sessionRadio.js, sessions.json radio) has the
 * race's {lap, carId, kind, t} for the player's drivers at those instants and at a yellow met, an impeding, a push
 * lap starting, the flag and the end of a segment. None of it draws from a stream or moves a lap.
 */

import { clamp, createStream } from "../../../overcutTrayectoria/engine/rng";
import { fieldMomentsOf, qualifyingAnchorOf, qualifyingPaceOf, raceFuelOf, tyreTime } from "../race";
import { byYear, pitLaneSpeedFor, rulesFor } from "../rules";
import { setupDistance } from "../setup";
import { buildProfile, circuitIdOf, garageExitAt, garageExitProfile, laneGeometry, limitSpeed, PIT_LANE_BALANCE } from "../sim/pitLane";
import { distanceAtTimeShare, timeShareAtDistance } from "../trackGeometry";
import { circuitFor } from "../venue";
import { climateFor, hourlyConditions } from "../weather";
import { SESSION_BALANCE as B, sessionFormat, tyreAllocation } from "./formats";
import { impedingPenaltyOf, trafficContextOf, trafficStep } from "./stepSession";
import { pushSessionRadio } from "./sessionRadio";

const EPS = 1e-9;
const round3 = (value) => Math.round(value * 1000) / 1000;
const DAY = 86400;

// ------------------------------------------------------------------ era tables

/** evolucion-q: the era's track evolution (sessions.json evolution.byEra, else its default). */
export const evolutionOf = (year) => B.evolution.byEra.find((row) => year >= row.from && year <= row.to) || B.evolution.default;

// ------------------------------------------------------------------ the local clock

const hmToSec = (text) => {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(text || ""));
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0) : null;
};
const dayIndex = (iso) => (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}/.test(iso) ? Math.round(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / (DAY * 1000)) : null);

/**
 * reloj-sesion (RF-WKD-01): when this session starts on the weekend's local clock. The pack's
 * calendar[].sessions[] (f1db, local time) when the race carries them, the one named
 * `sessionName` or the first of the kind; else the era's template (sessions.json clock) around
 * the circuit's race start hour (climate.json startHour, ERA5). `day` counts from race day (-1 =
 * the day before). Null when neither knows the session.
 */
export const sessionScheduleOf = ({ kind, race = {}, era, sessionName = null }) => {
  const pick = (list) => (sessionName && list.find((entry) => entry.name === sessionName)) || list[0] || null;
  const own = pick((Array.isArray(race?.sessions) ? race.sessions : []).filter((entry) => entry.kind === kind && hmToSec(entry.startLocal) !== null));
  if (own) {
    const a = dayIndex(own.date);
    const b = dayIndex(race.date);
    return { source: "pack", kind, name: own.name || null, day: a !== null && b !== null ? a - b : null, startSec: hmToSec(own.startLocal) };
  }
  const template = byYear(B.clock.templates, rulesFor(era).year);
  const row = pick((template?.sessions || []).filter((entry) => entry.kind === kind));
  if (!row) return null;
  const climate = climateFor(race || {});
  const raceHour = Number.isFinite(climate.startHour) ? climate.startHour : B.clock.fallbackRaceStartHour;
  const startSec = Math.round((raceHour + row.offsetHours) * 3600);
  return { source: "template", kind, name: row.name, day: row.day + Math.floor(startSec / DAY), startSec: ((startSec % DAY) + DAY) % DAY };
};

/** Each segment's start (s) and day offset after the session's start: segments, breaks, next days. */
const segmentStartsOf = (segments) => {
  let offset = 0;
  let day = 0;
  return segments.map((segment, index) => {
    if (index > 0) {
      const previous = segments[index - 1];
      if (segment.nextDay) {
        day += 1;
        offset = 0;
      } else offset += (previous.duration || 0) + (previous.breakAfter || 0);
    }
    return { offset, day };
  });
};

/**
 * The local clock at session time `tau` of segment `segmentIndex` (§1.7 contract `localClock`):
 * {day, seconds (of the day), hour, label "HH:MM:SS", source}. Null without a schedule. Pure.
 */
export const localClockOf = (state, tau = state.clock, segmentIndex = state.segment) => {
  const schedule = state.schedule;
  if (!schedule) return null;
  const starts = segmentStartsOf(state.segments);
  const start = starts[Math.max(0, segmentIndex)] || { offset: 0, day: 0 };
  const total = schedule.startSec + start.offset + Math.max(0, tau);
  const seconds = ((Math.floor(total) % DAY) + DAY) % DAY;
  const pad = (value) => String(value).padStart(2, "0");
  return {
    day: (schedule.day ?? 0) + start.day + Math.floor(total / DAY),
    seconds,
    hour: round3(seconds / 3600),
    label: `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`,
    source: schedule.source,
  };
};

/** The conditions at the local hour of `tau` (engine/weather hourlyConditions), or null without a clock. */
export const sessionConditions = (state, tau = state.clock) => {
  const clock = localClockOf(state, tau);
  if (!clock) return null;
  return { localClock: clock, ...hourlyConditions({ race: state.climateRace, hour: clock.seconds / 3600, diurnal: B.clock.diurnal }) };
};

// ------------------------------------------------------------------ the garage and the lane (SES-2)

/** The built circuit of a session (not serialised with the state). */
const circuitOfState = (state) => state.circuit || null;

const exitCache = new WeakMap();

/** The garage-exit profile of box share `box` (pitLane.garageExitProfile), cached per circuit. Null without a lane. */
const exitProfileOf = (state, box) => {
  const circuit = circuitOfState(state);
  if (!circuit?.pit?.path) return null;
  if (!exitCache.has(circuit)) exitCache.set(circuit, new Map());
  const memo = exitCache.get(circuit);
  const key = `${state.lane.kmh}|${state.baseLap}|${box}|${state.year}`;
  if (!memo.has(key)) memo.set(key, garageExitProfile(circuit, state.era, box, { kmh: state.lane.kmh, baseLap: state.baseLap }));
  return memo.get(key);
};

/**
 * The lane of a session: the limit (km/h, null before there was one), the pit entry and exit as
 * time shares of the lap, the last corner's apex (where PUSH_PREP starts) and, per box share, the
 * seconds from the release to the track and from pit entry to the box. All geometry, no stream.
 */
const laneOf = ({ circuit, race, era, baseLap, pitEntryShare }) => {
  const rules = rulesFor(era);
  const circuitId = circuitIdOf(race || {}, circuit?.ref);
  const kmh = pitLaneSpeedFor(rules, { circuitId, date: race?.date ?? null });
  const hasLane = Boolean(circuit?.pit?.path);
  const corners = (circuit?.corners || []).map((corner) => corner.apex).filter((apex) => Number.isFinite(apex) && apex > 0 && apex < 1);
  return {
    kmh,
    hasLane,
    entryShare: Number.isFinite(pitEntryShare) ? pitEntryShare : hasLane ? timeShareAtDistance(circuit, circuit.pit.entry) : 1,
    exitShare: hasLane ? timeShareAtDistance(circuit, circuit.pit.exit) : 0,
    entryDistance: hasLane ? circuit.pit.entry : 1,
    prepFrom: corners.length ? Math.max(...corners) : null,
    length: circuit?.length || null,
    vLimit: hasLane ? limitSpeed(circuit, kmh, baseLap) : null,
  };
};

/** Seconds from pit entry to a stop at box share `box` on the session's lane (0 without a lane). */
const inLaneSecOf = (state, box) => {
  const circuit = circuitOfState(state);
  if (!state.lane.hasLane || !circuit) return 0;
  const geo = laneGeometry(circuit);
  const stopAt = geo.slotFrom + (geo.slotTo - geo.slotFrom) * clamp(box, 0, 1);
  return buildProfile(circuit, { vLimit: state.lane.vLimit, baseLap: state.baseLap, stopAt }).tStop;
};

/**
 * The gap two cars keep at the pit-exit light: the time to cover race-pit.json queueOffsetMetres
 * from rest at the lane's top acceleration (pitLane.accel.max). Derived, no number of its own.
 */
const queueGapSec = () => Math.sqrt((2 * PIT_LANE_BALANCE.queueOffsetMetres) / PIT_LANE_BALANCE.accel.max);

/** The earliest time from `arrival` at which the exit is clear of every car already joining this segment. */
const clearExitAt = (state, arrival) => {
  const gap = queueGapSec();
  const taken = state.exitQueue.slice().sort((a, b) => a - b);
  let at = arrival;
  for (let pass = 0; pass <= taken.length; pass += 1) {
    const clash = taken.find((other) => Math.abs(other - at) < gap - EPS);
    if (clash === undefined) break;
    at = clash + gap;
  }
  return at;
};

/** Where a lap record has the car on the track at `tau`: the time share of the lap (null before it is on track). */
const trackShareOf = (record, tau) => {
  const track = record.track || { at: record.start, from: 0, pace: record.end - record.start };
  if (tau < track.at) return null;
  if (record.warp) return clamp(record.warp.share + ((tau - record.warp.at) / Math.max(EPS, record.end - record.warp.at)) * (1 - record.warp.share), 0, 1);
  return clamp(track.from + (tau - track.at) / Math.max(EPS, track.pace), 0, 1);
};

/**
 * Metres to pit entry from time share `share` of the lap: on this lap (`thisLap`) or, for a car
 * that finishes the lap first, round to the line and on to the next lap's entry. Null without a lane.
 */
const metresToEntry = (state, share, thisLap) => {
  const circuit = circuitOfState(state);
  if (!circuit || !state.lane.hasLane || !state.lane.length) return null;
  const d = share >= 1 ? 1 : distanceAtTimeShare(circuit, share);
  const ahead = thisLap ? Math.max(0, state.lane.entryDistance - d) : 1 - d + state.lane.entryDistance;
  return Math.round(ahead * state.lane.length);
};

// ------------------------------------------------------------------ set up

/**
 * A new session. `entrants` as career.entrantsFor gives them; `practice` the weekend's
 * practice preparation (race.js qualifyingPaceOf); `raceFuel` each car's race fuel in
 * laps for a race-fuel segment (rivals' first stint); `runOrder` the single-lap order;
 * `sectorShares` the time shares of the two sector lines (trackGeometry), `pitEntryShare`
 * the time share of pit entry (default: the circuit's own); `tyres` the sets each car still has
 * (RF-WKD-05); `circuit` the built circuit (default venue.circuitFor(race, year)) whose pit lane the
 * garage exit and the in-lap drive (SES-2). Each team has its box along the lane in entry order.
 */
export const createSession = ({
  kind, entrants, race, era, seed, wetness = 0, practice = {}, raceFuel = {}, runOrder = null, sectorShares = [1 / 3, 2 / 3], pitEntryShare = null, tyres = null,
  sessionName = null, setups = null, crews = null, circuit = null, traffic = true,
}) => {
  const rules = rulesFor(era);
  const built = circuit || circuitFor(race, rules.year);
  // Boxes in entry order of the teams, as the view lays the garages out (share 0..1 along the slots).
  const teamOrder = [...new Set(entrants.map((entrant) => entrant.teamId))];
  const boxOf = (teamId) => (teamOrder.length > 1 ? teamOrder.indexOf(teamId) / (teamOrder.length - 1) : 0.5);
  const format = sessionFormat({ kind, era, race, field: entrants.length });
  const moments = fieldMomentsOf(entrants);
  // WP10 (RF-WKD-02): the same anchor to the real pole as the quick qualifying.
  const anchor = qualifyingAnchorOf({ entrants, race, era, moments });
  const allocation = tyreAllocation(era);
  const cars = entrants.map((entrant, index) => ({
    id: entrant.id,
    index,
    teamId: entrant.teamId,
    isUser: Boolean(entrant.isUser),
    base: qualifyingPaceOf({ entrant, race, era, wetness, practice, moments, anchor }),
    tyres: (tyres?.[entrant.id] || allocation).map((set) => ({ ...set })),
    raceFuel: Number.isFinite(raceFuel[entrant.id]) ? raceFuel[entrant.id] : null,
    declaredFuel: null,
    eliminated: false,
    results: [],
    // trabajo-garaje: the setup on the car (sliders) and its crew rating, when the weekend gives them.
    setup: setups?.[entrant.id] ? { ...setups[entrant.id] } : null,
    crew: Number.isFinite(crews?.[entrant.teamId]) ? crews[entrant.teamId] : null,
    box: boxOf(entrant.teamId),
  }));
  const lane = laneOf({ circuit: built, race, era, baseLap: race.baseLap, pitEntryShare });
  const state = {
    kind,
    format: format.format,
    combine: format.combine,
    segments: format.segments,
    seed: String(seed),
    year: rules.year,
    era,
    baseLap: race.baseLap,
    // RF-SIM-04: what a lap of fuel aboard costs a lap, the race's own number (race.js raceFuelOf, engine/energy.js).
    fuelPerLap: raceFuelOf({ race, rules, laps: Math.max(5, race.laps || 60) }).secPerLap,
    wetness,
    volatility: era.paceVolatility ?? 1,
    sectorShares,
    pitEntryShare: lane.entryShare,
    lane,
    runOrder: runOrder || entrants.map((entrant) => entrant.id),
    dt: B.step.dt,
    segment: -1,
    clock: 0,
    cars,
    events: [],
    // SES-C1: the engineer to the player's drivers, the race's shape (sessionRadio.js).
    radio: [],
    log: [],
    carry: 0,
    done: false,
    evolution: evolutionOf(rules.year),
    // SES-8: traffic on the timed laps and the rivals' spacing at the pit exit (false: every lap as drawn, as before).
    traffic: traffic !== false,
    schedule: sessionScheduleOf({ kind, race, era, sessionName }),
    climateRace: { date: race.date || null, packCircuitId: race.packCircuitId || null, circuitId: race.circuitId || null, circuit: race.circuit || null },
  };
  // The built circuit stays out of the serialised state (it is geometry, rebuilt from the race).
  Object.defineProperty(state, "circuit", { value: built, enumerable: false, writable: true });
  state.cars.forEach((car) => {
    const exit = exitProfileOf(state, car.box);
    car.lane = { exitSec: exit ? exit.T : 0, toLimitEnd: exit ? exit.toLimitEnd : 0, metres: exit ? exit.metres : 0, inSec: inLaneSecOf(state, car.box) };
  });
  startSegment(state, 0);
  return state;
};

const carOf = (state, id) => state.cars.find((car) => car.id === id) || null;
const currentSegment = (state) => state.segments[state.segment];
const dryCompounds = (rules) => rules.tyres.compounds;


const startSegment = (state, index) => {
  state.segment = index;
  state.clock = 0;
  state.flag = false;
  state.over = false;
  state.fieldLaps = 0;
  // SES-2: the times at which cars join the track from the pit exit this segment (the light's queue).
  state.exitQueue = [];
  state.yellowUntil = 0;
  const segment = currentSegment(state);
  // Single-lap qualifying: one car at a time, in run order, a slot each - the last one with time to
  // drive out of the garage, its out-lap and its lap.
  if (segment.singleLap) {
    const order = state.runOrder.filter((id) => !carOf(state, id)?.eliminated);
    segment.slots = Object.fromEntries(order.map((id, slot) => [id, slot * segment.spacing]));
    const garage = Math.max(0, ...state.cars.map((car) => B.garage.exit.rollOutSec + (car.lane?.exitSec ?? 0)));
    segment.duration = order.length * segment.spacing + garage + state.baseLap * (B.laps.outLap + 1);
  }
  state.cars.forEach((car) => {
    car.history = [];
    car.state = "garage";
    car.record = null;
    car.plan = null;
    car.boxRequest = false;
    car.laps = 0;
    car.best = null;
    car.bestLap = null;
    car.bestSectors = null;
    car.run = null;
    car.runs = [];
    car.returnedAt = null;
    car.lastRun = null;
    car.pending = null;
    car.auto = !car.isUser;
    car.stream = createStream(`${state.seed}::session::${state.kind}::${segment.name}::${car.id}`);
    // SES-3: the yellows' own stream, so the laps never depend on them.
    car.yellowStream = createStream(`${state.seed}::session::${state.kind}::${segment.name}::yellow::${car.id}`);
    // SES-4: what the car does when it meets somebody else's yellow, a stream of its own as well.
    car.yellowLapStream = createStream(`${state.seed}::session::${state.kind}::${segment.name}::yellowLap::${car.id}`);
    // SES-8: the meetings with slow cars on its timed laps, a stream of its own (the laps never depend on it).
    car.trafficStream = createStream(`${state.seed}::session::${state.kind}::${segment.name}::traffic::${car.id}`);
    car.traffic = null;
    // SES-C1: the start of the out-lap whose join to the track has been announced (garageExit).
    car.joinedFrom = null;
    car.aiPlans = car.eliminated ? [] : rivalPlans(state, car, segment);
    if (segment.singleLap && !car.eliminated) car.pending = { at: segment.slots[car.id] ?? 0, plan: null, slot: true };
  });
  state.localClock = localClockOf(state);
};

// ---------------------------------------------------------------- rival plans

/** The softest dry compound of the era (the qualifying tyre), or the right one for the water. */
const qualifyingCompound = (state) => {
  const rules = rulesFor(state.era);
  if (state.wetness >= 0.62) return "wet";
  if (state.wetness >= 0.24) return "inter";
  return dryCompounds(rules)[0];
};

/** What a rival pit wall plans for this segment: when each run goes out and what it does. */
const rivalPlans = (state, car, segment) => {
  const ai = B.ai;
  const stream = createStream(`${state.seed}::session::${state.kind}::${segment.name}::plan::${car.id}`);
  const duration = segment.duration;
  const rules = rulesFor(state.era);
  const dry = dryCompounds(rules);
  const wetTyre = state.wetness >= 0.62 ? "wet" : state.wetness >= 0.24 ? "inter" : null;
  if (state.kind === "practice") {
    const hardest = wetTyre || dry[dry.length - 1];
    const middle = wetTyre || dry[Math.floor((dry.length - 1) / 2)];
    const programmes = ["setup", "quali", "longrun"];
    return ai.practiceRuns.map((share, index) => {
      const programme = programmes[index] || "setup";
      const spec = B.programmes[programme];
      const laps = programme === "longrun" ? stream.int(ai.practiceLaps[1], ai.practiceLaps[1] + 3) : programme === "quali" ? spec.laps : stream.int(ai.practiceLaps[0], ai.practiceLaps[1]);
      return {
        at: clamp(share + stream.range(-ai.practiceSpread, ai.practiceSpread), 0.01, 0.85) * duration,
        plan: { programme, laps, fuel: laps + spec.fuelExtra + 2, compound: programme === "quali" ? wetTyre || dry[0] : programme === "longrun" ? middle : hardest, set: "new", style: spec.style },
      };
    });
  }
  if (segment.singleLap) return [];
  const compound = segment.tyre || qualifyingCompound(state);
  const pushes = () => (stream.chance(ai.twoPushChance) ? 2 : 1);
  const fuelFor = (push) => (segment.raceFuel && car.raceFuel ? car.raceFuel : 2 + push * 2);
  if (segment.duration >= 45 * 60) {
    return ai.hourRuns.map((share) => {
      const push = pushes();
      return { at: clamp(share + stream.range(-ai.hourSpread, ai.hourSpread), 0.02, 0.86) * duration, plan: { programme: "quali", push, fuel: fuelFor(push), compound, set: "new", style: "normal" } };
    });
  }
  const isLast = state.segment === state.segments.length - 1;
  if (segment.fuelBurn) {
    // 2006-2007 Q3: out early on race fuel, burn laps at near race pace, then the attempt.
    const at = stream.range(ai.lastSegmentRuns[0][0], ai.lastSegmentRuns[0][1]) * duration;
    const burn = Math.max(0, Math.floor((duration * ai.fuelBurnShare - at) / (state.baseLap * B.laps.burnLap)) - 1);
    return [{ at, plan: { programme: "quali", push: 1, burn, fuel: fuelFor(1), compound, set: "new", style: "normal" } }];
  }
  const runs = isLast ? ai.lastSegmentRuns : ai.qualiRuns;
  return runs.map(([from, to]) => {
    const push = pushes();
    return { at: stream.range(from, to) * duration, plan: { programme: "quali", push, fuel: fuelFor(push), compound, set: "new", style: "normal" } };
  });
};

// ------------------------------------------------------------------ plans

const STYLES = Object.keys(B.pace.styles);

/** A plan the engine accepts: within the limits, on a tyre set the car still has, the era's rules. */
export const sanitisePlan = (state, car, plan = {}) => {
  const segment = currentSegment(state);
  const qualifying = state.kind !== "practice";
  const programme = qualifying ? "quali" : B.programmes[plan.programme] && !String(plan.programme).startsWith("$") ? plan.programme : "setup";
  const spec = B.programmes[programme];
  const [minLaps, maxLaps] = B.limits.practiceLaps;
  const [minPush, maxPush] = B.limits.pushLaps;
  const [minFuel, maxFuel] = B.limits.fuelLaps;
  const laps = qualifying ? 0 : clamp(Math.round(plan.laps ?? spec.laps), minLaps, maxLaps);
  const push = qualifying ? clamp(Math.round(plan.push ?? 1), minPush, segment.singleLap ? 1 : maxPush) : 0;
  const burn = segment.fuelBurn ? clamp(Math.round(plan.burn ?? 0), B.limits.burnLaps[0], B.limits.burnLaps[1]) : 0;
  const needed = qualifying ? 2 + push * 2 + burn : laps + 2;
  let fuel = clamp(Math.round(plan.fuel ?? needed + (spec.fuelExtra ?? 0)), Math.max(minFuel, Math.min(needed, maxFuel)), maxFuel);
  // Race fuel (2003-2009): declared on the first run, kept to the flag (parc fermé).
  if (segment.raceFuel) fuel = car.declaredFuel ?? clamp(Math.round(plan.fuel ?? car.raceFuel ?? needed), Math.max(minFuel, needed), maxFuel);
  const compound = segment.tyre || (car.tyres.some((set) => set.compound === plan.compound) ? plan.compound : defaultCompound(state));
  const out = { programme, laps, push, fuel, compound, set: segment.newTyre ? "new" : plan.set === "used" ? "used" : "new", style: STYLES.includes(plan.style) ? plan.style : spec.style };
  if (segment.fuelBurn) out.burn = burn;
  // trabajo-garaje: a setup asked for the run (sliders 0..100), kept as given.
  if (plan.setup && typeof plan.setup === "object") out.setup = { ...plan.setup };
  return out;
};

/** The tyre a plan starts with when none is given. */
export const defaultCompound = (state) => {
  const segment = currentSegment(state);
  if (segment?.tyre) return segment.tyre;
  if (state.wetness >= 0.24) return qualifyingCompound(state);
  const dry = dryCompounds(rulesFor(state.era));
  return state.kind === "practice" ? dry[dry.length - 1] : dry[0];
};

/** The set a plan takes: a new one of the compound if asked and left, else the least-used one. */
const pickSet = (car, compound, choice) => {
  const ofCompound = car.tyres.filter((set) => set.compound === compound);
  if (!ofCompound.length) return null;
  const fresh = ofCompound.find((set) => set.laps === 0);
  const used = ofCompound.filter((set) => set.laps > 0).sort((a, b) => a.laps - b.laps)[0];
  if (choice === "used") return used || fresh;
  return fresh || used;
};

// ------------------------------------------------------------------ laps

/** The time of a lap of this kind starting now (and its sectors), drawn from the car's own stream. */
const lapTimeOf = (state, car, kind) => {
  const plan = car.run.plan;
  const set = car.run.set;
  const style = B.pace.styles[plan.style] || B.pace.styles.normal;
  const fuelCost = car.fuel * state.fuelPerLap;
  if (kind === "out" || kind === "cool" || kind === "in" || kind === "burn") {
    const factor = kind === "out" ? B.laps.outLap : kind === "cool" ? B.laps.coolLap : kind === "burn" ? B.laps.burnLap : B.laps.inLap;
    const jitter = car.stream.normal(0, 0.6);
    return { time: state.baseLap * factor + fuelCost + jitter, sectors: null };
  }
  const wet = state.wetness;
  const ref = Math.min(...[...dryCompounds(rulesFor(state.era)), "inter", "wet"].map((compound) => tyreTime({ compound, age: 1, wetness: wet, era: state.era })));
  const tyre = tyreTime({ compound: set.compound, age: Math.max(1, set.laps), wetness: wet, era: state.era }) - ref;
  const evolution = (state.evolution.startSec ?? 0) + Math.max(state.evolution.max, state.carry + state.fieldLaps * state.evolution.perFieldLap);
  const offset = B.programmes[plan.programme]?.offset ? B.pace[B.programmes[plan.programme].offset] : 0;
  const mistake = car.stream.chance(style.mistake * (1 + wet)) ? car.stream.range(B.pace.mistakeCost[0], B.pace.mistakeCost[1]) : 0;
  const noise = car.stream.normal(0, state.volatility * B.pace.noiseScale * (1 + wet));
  const clean = car.base + style.time + offset + tyre + fuelCost + evolution;
  const time = clean + mistake + noise;
  // Sectors: the clean lap split by the circuit's own time shares, the scatter shared out.
  const [a, b] = state.sectorShares;
  const split = [car.stream.range(0, 1), car.stream.range(0, 1), car.stream.range(0, 1)];
  const sum = split[0] + split[1] + split[2] || 1;
  const extra = mistake + noise;
  const where = car.stream.int(0, 2);
  const shares = [a, b - a, 1 - b];
  const sectors = shares.map((share, index) => clean * share + extra * (B.pace.sectorNoiseShare * (split[index] / sum) + (index === where ? 1 - B.pace.sectorNoiseShare : 0)));
  return { time, sectors, mistake: mistake > 0, where };
};

// ------------------------------------------------------------------ local yellows (SES-3)

/** The standard normal's 90th percentile: turns a measured median and p90 into a log-normal spread. */
const Z90 = 1.2815515655446004;

/** SES-3: the row of sessions.json yellow.eras for `year` (every year has one, measured or pending). */
export const yellowEraOf = (year) => B.yellow.eras.find((row) => year >= row.from && year <= row.to) || null;

/** The sector (1-based) of distance share `s` against the circuit's sector starts (circuit.sectors). */
const sectorOfDistance = (circuit, s) => {
  const starts = circuit?.sectors;
  if (!Array.isArray(starts) || !starts.length || !Number.isFinite(s)) return null;
  let sector = 1;
  starts.forEach((start, index) => {
    if (s >= start) sector = index + 1;
  });
  return sector;
};

/**
 * SES-3 (F1M24-GAMEPLAY §1.5, §1.7 `yellow`; RF-SIM-10): does the mistake on timed lap `record` put
 * the car off and bring out a local yellow, and where and for how long. The draws come from the car's
 * own yellow stream (four on every mistake lap, in a fixed order), never from its lap stream: the laps
 * are the same with and without yellows (RF-SIM-15, RNF-05). The place is a corner of the timing sector
 * the time was lost in (`where`), or the middle of it; the sector in the event is circuit.sectors'.
 * Null when the mistake is only a moment (no yellow).
 */
const planYellow = (state, car, record, where) => {
  const Y = B.yellow;
  const kind = Y.chance[state.kind] !== undefined ? state.kind : "qualifying";
  const stream = car.yellowStream;
  const off = stream.chance(Y.chance[kind]);
  const pick = stream.range(0, 1);
  const double = stream.chance(Y.doubleShare[kind]);
  const z = stream.normal(0, 1);
  if (!off) return null;
  const circuit = circuitOfState(state);
  const bounds = [0, ...state.sectorShares, 1];
  const from = bounds[where] ?? 0;
  const to = bounds[where + 1] ?? 1;
  const hasTrace = Boolean(circuit?.timeShare && circuit?.distShare);
  const d0 = hasTrace ? distanceAtTimeShare(circuit, from) : from;
  const d1 = to >= 1 ? 1 : hasTrace ? distanceAtTimeShare(circuit, to) : to;
  const corners = (circuit?.corners || []).filter((corner) => Number.isFinite(corner.apex) && corner.apex >= d0 && corner.apex < d1);
  const corner = corners.length ? corners[Math.min(corners.length - 1, Math.floor(pick * corners.length))] : null;
  const s = corner ? corner.apex : hasTrace ? distanceAtTimeShare(circuit, (from + to) / 2) : (from + to) / 2;
  const share = hasTrace ? timeShareAtDistance(circuit, s) : s;
  const spread = double ? Y.durationSec.double : Y.durationSec.single;
  const sigma = Math.log(spread.p90 / spread.median) / Z90;
  const duration = clamp(spread.median * Math.exp(sigma * z), spread.p10, spread.p90);
  const at = record.start + clamp(share, 0, 1) * (record.end - record.start);
  return {
    at,
    until: at + duration,
    // SES-4: the time share of the place, to move the yellow with the lap if the driver lifts before it.
    share: clamp(share, 0, 1),
    sector: sectorOfDistance(circuit, s) ?? where + 1,
    corner: corner?.number ?? null,
    s,
    double,
    waved: false,
    dropped: false,
  };
};

/** When the car's planned yellow is due (Infinity without one, or once waved or dropped). */
const yellowDue = (car) => {
  const yellow = car.record?.yellow;
  return yellow && !yellow.waved && !yellow.dropped ? yellow.at : Infinity;
};

/**
 * Wave the yellow of `car`'s lap: the §1.7 event {sector, marshalPost, double, s, until}, plus the corner
 * (the post at that corner waves it; the FIA marshal-sector numbering is not in the circuit data) and
 * the car. The view only paints it (components/tower.js sessionYellowsAt).
 */
const waveYellow = (state, car) => {
  const yellow = car.record.yellow;
  yellow.waved = true;
  state.events.push({
    t: round3(yellow.at),
    type: "yellow",
    carId: car.id,
    segment: state.segment,
    sector: yellow.sector,
    marshalPost: yellow.corner,
    corner: yellow.corner,
    double: yellow.double,
    s: Math.round(yellow.s * 10000) / 10000,
    until: round3(yellow.until),
  });
  // SES-8: until when a waved yellow may still be met, so a lap retimed by traffic looks again.
  state.yellowUntil = Math.max(state.yellowUntil ?? 0, yellow.until);
  // SES-4: the car that went off does not meet its own yellow on this lap; everybody else may.
  const record = car.record;
  record.seenYellows = [...(record.seenYellows || []), state.events.length - 1];
  state.cars.forEach((other) => planYellowHit(state, other, yellow.at));
};

/** SES-3: the yellows of the current segment still waved at session time `tau` (the events). Read-only. */
export const sessionYellows = (state, tau = state.clock) =>
  state.events.filter((event) => event.type === "yellow" && event.segment === state.segment && event.t <= tau && event.until > tau);

// ------------------------------------------------------------------ the lap under a yellow (SES-4)

/** SES-4: the row of sessions.json yellow.laps.eras for `year`: what a driver must do at a single and a double yellow. */
export const yellowLapRuleOf = (year) => B.yellow.laps.eras.find((row) => year >= row.from && year <= row.to) || null;

const isTimedLap = (record) => Boolean(record && (record.kind === "push" || record.kind === "timed") && record.flying && !record.aborted);

/** The share of `record`'s lap gone at `tau`, on its warped timeline (the same reading as components/raceClock lapShareAt). */
const lapShareAt = (record, tau) => {
  const warp = record.warp;
  if (!warp) return clamp((tau - record.start) / Math.max(EPS, record.end - record.start), 0, 1);
  if (tau <= warp.at) return clamp(((tau - record.start) / Math.max(EPS, warp.at - record.start)) * warp.share, 0, 1);
  return clamp(warp.share + ((tau - warp.at) / Math.max(EPS, record.end - warp.at)) * (1 - warp.share), 0, 1);
};

/** When `record`'s lap reaches time share `share`, on the same warped timeline. */
const lapTimeAtShare = (record, share) => {
  const warp = record.warp;
  if (!warp) return record.start + share * (record.end - record.start);
  if (share <= warp.share) return record.start + (warp.share > EPS ? (share / warp.share) * (warp.at - record.start) : 0);
  return warp.at + ((share - warp.share) / Math.max(EPS, 1 - warp.share)) * (record.end - warp.at);
};

/** The time share of the lap at distance share `s` (the event's place). */
const timeShareOfPlace = (state, s) => {
  const circuit = circuitOfState(state);
  return circuit?.timeShare && circuit?.distShare ? timeShareAtDistance(circuit, s) : s;
};

/**
 * SES-4: the next yellow car `car` meets on its timed lap from `now`: the first waved yellow of the
 * segment whose place the lap reaches while it is out (t <= pass < until), not yet met on this lap.
 * Kept as record.yellowHit {at, event}; none on other laps. Pure geometry and the event list, no draw.
 */
const planYellowHit = (state, car, now) => {
  const record = car.record;
  if (!record) return;
  delete record.yellowHit;
  if (!isTimedLap(record)) return;
  const seen = record.seenYellows || [];
  let hit = null;
  state.events.forEach((event, index) => {
    if (event.type !== "yellow" || event.segment !== state.segment || seen.includes(index)) return;
    const at = lapTimeAtShare(record, clamp(timeShareOfPlace(state, event.s), 0, 1));
    if (at < now - EPS || at < event.t - EPS || at >= event.until || at >= record.end - EPS) return;
    if (!hit || at < hit.at - EPS) hit = { at, event: index };
  });
  if (hit) record.yellowHit = hit;
};

/** When the car meets its next yellow (Infinity without one). */
const yellowHitDue = (car) => car.record?.yellowHit?.at ?? Infinity;

/** The rest of a timed lap at cool-down pace from `at`, no time (the order "Abortar vuelta" and the yellow's "abandon"). */
const abortLapAt = (state, car, at, extra = {}) => {
  const record = car.record;
  const share = lapShareAt(record, at);
  record.aborted = true;
  record.warp = { at, share };
  // SES-3: aborted before the place of the mistake - it never happens, nor does its yellow.
  if (record.yellow && !record.yellow.waved && record.yellow.at > at) record.yellow.dropped = true;
  delete record.flying;
  delete record.sectors;
  delete record.yellowHit;
  delete record.deleteFor;
  record.end = at + (1 - share) * state.baseLap * B.laps.abortRest;
  car.state = "cool";
  state.events.push({ t: round3(at), type: "abort", carId: car.id, ...extra });
};

/** The driver lifts at `at` and the lap is `loss` seconds longer from there on (time, end and the sector it is in). */
const liftAt = (state, record, at, loss) => {
  if (!(loss > 0)) return;
  shiftLapAt(state, record, at, loss);
};

/**
 * The lap is `delta` seconds longer (> 0) or shorter (< 0) from `at` on: a warp at the car's place, the end,
 * the time and the sector it is in, and the car's own mistake further on (SES-4 lift, SES-8 traffic).
 */
const shiftLapAt = (state, record, at, delta) => {
  if (!delta) return;
  const share = lapShareAt(record, at);
  record.warp = { at, share };
  record.end += delta;
  if (Number.isFinite(record.flying)) record.flying += delta;
  const loss = delta;
  if (Array.isArray(record.sectors)) {
    const [a, b] = state.sectorShares;
    const sector = share < a ? 0 : share < b ? 1 : 2;
    record.sectors = record.sectors.map((time, index) => (index === sector ? time + loss : time));
  }
  // The car's own mistake further on comes later on the slower lap, and so does its yellow.
  const own = record.yellow;
  if (own && !own.waved && !own.dropped && own.at > at) {
    const duration = own.until - own.at;
    own.at = lapTimeAtShare(record, own.share);
    own.until = own.at + duration;
  }
};

/**
 * SES-4 (RF-SIM-10, RF-WKD-02): car `car` reaches the yellow it was due to meet. The era's rule for the
 * flag decides; under "lift" the driver still gives the lap up as often as OpenF1's drivers did. Two
 * draws on every meeting, in a fixed order, from the car's yellowLap stream.
 */
const meetYellow = (state, car) => {
  const record = car.record;
  const { at, event: index } = record.yellowHit;
  const event = state.events[index];
  record.seenYellows = [...(record.seenYellows || []), index];
  delete record.yellowHit;
  const L = B.yellow.laps;
  const flag = event.double ? "double" : "single";
  const rule = yellowLapRuleOf(state.year)?.[flag] || "lift";
  const giveUp = car.yellowLapStream.range(0, 1);
  const pick = car.yellowLapStream.range(0, 1);
  // The lap is spoilt either way: drivers give it up as often as the measured ones did (forced under "abandon").
  const outcome = rule === "abandon" || giveUp < L.abandonShare[flag] ? "abandon" : rule;
  const base = { carId: car.id, segment: state.segment, double: event.double, yellowAt: event.t };
  // SES-C1: the engineer tells the player's driver what the flag costs.
  const radio = { outcome, double: event.double, sector: event.sector ?? null };
  if (outcome === "abandon") {
    state.events.push({ t: round3(at), type: "yellowLap", ...base, outcome, lossSec: null });
    pushSessionRadio(state, car, "session-yellow", at, record.lap, radio);
    abortLapAt(state, car, at, { reason: "yellow" });
    return;
  }
  const spread = L.lossSec[flag];
  const loss = spread.p25 + pick * (spread.p75 - spread.p25);
  liftAt(state, record, at, loss);
  if (outcome === "delete") record.deleteFor = event.double ? "doubleYellow" : "yellow";
  state.events.push({ t: round3(at), type: "yellowLap", ...base, outcome, lossSec: round3(loss) });
  pushSessionRadio(state, car, "session-yellow", at, record.lap, radio);
  planYellowHit(state, car, at);
};

/**
 * SES-2: make `record` the in-lap that ends in the garage. The car is on the track from `trackAt` at
 * time share `from` of the lap at `pace` seconds a lap; it reaches pit entry, then drives the lane on
 * the physical profile down to its box (v = 0 there). `pit.entryAt` is when it turns in.
 */
const toInLap = (state, car, record, trackAt, from, pace) => {
  const entryAt = trackAt + Math.max(0, state.pitEntryShare - from) * pace;
  record.in = true;
  record.box = true;
  record.track = { at: trackAt, from, pace };
  record.pit = { lane: car.lane.inSec, stationary: 0, entryAt };
  record.end = entryAt + car.lane.inSec;
  return record;
};

/** Start a lap of `kind` at session time `at` (an out-lap with its garage exit, see leave). */
const beginLap = (state, car, kind, at, garageExit = null) => {
  const { time, sectors, mistake, where } = lapTimeOf(state, car, kind);
  car.laps += 1;
  const record = { lap: car.history.length + 1, start: at, end: at + time, kind, compound: car.run.set.compound };
  if (kind === "out") {
    record.out = true;
    if (garageExit) {
      // On the track from the pit exit to the line only: the share of the lap after the exit.
      const from = state.lane.exitShare;
      record.garageExit = garageExit;
      record.track = { at: garageExit.trackAt, from, pace: time };
      record.end = garageExit.trackAt + (1 - from) * time;
    }
  }
  if (kind === "push" || kind === "timed") {
    record.flying = time;
    record.sectors = sectors;
    if (mistake) {
      record.mistake = true;
      const yellow = planYellow(state, car, record, where);
      if (yellow) record.yellow = yellow;
    }
  }
  if (kind === "in") toInLap(state, car, record, at, 0, time);
  car.history.push(record);
  car.record = record;
  car.state = kind === "push" || kind === "timed" ? "flying" : kind;
  // SES-4: a yellow already waved ahead of the lap.
  planYellowHit(state, car, at);
  // SES-C1: a qualifying attempt starts at the line.
  if (kind === "push") pushSessionRadio(state, car, "session-push", at, record.lap, { attempt: car.run.pushes + 1, of: car.run.plan.push ?? null, compound: record.compound });
  return record;
};

/** The lap that follows the one just finished. */
const nextLapKind = (state, car, finished) => {
  const segment = currentSegment(state);
  const run = car.run;
  if (finished.kind === "in") return null;
  const limitLeft = segment.lapLimit ? segment.lapLimit - car.laps : Infinity;
  if (car.boxRequest || state.flag || car.fuel < 1.5 || limitLeft <= 1) return "in";
  if (state.kind === "practice") return run.timed < run.plan.laps ? "timed" : "in";
  // Fuel burn (2006-2007 Q3): the burn laps first, straight after the out-lap.
  if ((finished.kind === "out" || finished.kind === "burn") && (run.burned ?? 0) < (run.plan.burn ?? 0)) return "burn";
  if (run.pushes >= run.plan.push) return "in";
  // Two pushes back to back only on the out-lap's heat; between attempts a cool-down lap.
  if (finished.kind === "out" || finished.kind === "cool" || finished.kind === "burn") return "push";
  return limitLeft <= 2 ? "in" : "cool";
};

// ------------------------------------------------------------------ the race's shape (SES-C1)

/**
 * The car's place in the segment now: position (1-based, null without a time), the gap of its best to the
 * top and, in a knockout segment, the last place that goes through (`cutoff`) and whether it is below it.
 */
const standingOf = (state, car) => {
  const ranked = rankOf(state);
  const top = ranked[0]?.best ?? null;
  const position = car.best === null ? null : ranked.indexOf(car) + 1 || null;
  const out = { position, gapSec: car.best === null || top === null ? null : round3(car.best - top) };
  const drop = currentSegment(state)?.drop;
  if (drop) {
    out.cutoff = Math.max(0, ranked.length - drop);
    out.dropZone = position === null || position > out.cutoff;
  }
  return out;
};

/** SES-C1: a timed lap finished at the line (kept or deleted): the `lapComplete` event and the engineer's call. */
const lapComplete = (state, car, record, at, improved) => {
  const deleted = record.deleted ? record.deleted.reason : null;
  const time = deleted ? record.deleted.time : record.flying;
  const sectors = deleted ? record.deleted.sectors : record.sectors;
  const standing = standingOf(state, car);
  state.events.push({
    t: round3(at),
    lap: record.lap,
    type: "lapComplete",
    carId: car.id,
    segment: state.segment,
    kind: record.kind,
    time: round3(time),
    sectors: Array.isArray(sectors) ? sectors.map(round3) : null,
    compound: record.compound,
    improved: Boolean(improved),
    deleted,
    ...standing,
  });
  if (deleted) pushSessionRadio(state, car, "session-lap-deleted", at, record.lap, { time: round3(time), reason: deleted, ...standing });
  else pushSessionRadio(state, car, "session-lap", at, record.lap, { time: round3(time), improved: Boolean(improved), ...standing });
};

/** SES-C1: when the car on its way out of the garage joins the track (Infinity once announced, or without one). */
const joinDue = (car) => {
  const record = car.record;
  const exit = record?.garageExit;
  return exit && car.joinedFrom !== record.start ? exit.trackAt : Infinity;
};

/** SES-C1: the car crosses the end of the pit-exit line and joins the track: `garageExit` and the radio. */
const joinTrack = (state, car) => {
  const record = car.record;
  const exit = record.garageExit;
  car.joinedFrom = record.start;
  const event = { t: round3(exit.trackAt), lap: record.lap, type: "garageExit", carId: car.id, segment: state.segment, queueSec: round3(exit.queueSec), laneSec: round3(exit.laneSec) };
  // The wait a rival pit wall took for a gap (SES-8), noted on the release.
  for (let index = state.events.length - 1; index >= 0; index -= 1) {
    const other = state.events[index];
    if (other.type !== "out" || other.carId !== car.id) continue;
    if (other.heldSec) event.heldSec = other.heldSec;
    break;
  }
  state.events.push(event);
  pushSessionRadio(state, car, "session-garage-exit", exit.trackAt, record.lap, { queueSec: event.queueSec, compound: record.compound, inLap: Boolean(record.in) });
};

/** The chequered flag of the segment: the event, and the call to each of the player's drivers out on the track. */
const raiseFlag = (state, segment) => {
  state.flag = true;
  state.events.push({ t: round3(segment.duration), type: "flag", segment: state.segment });
  state.cars.forEach((car) => {
    const record = car.record;
    if (!record || car.eliminated) return;
    // A timed lap under way still counts; any other lap is the last one before the garage.
    pushSessionRadio(state, car, "session-flag", segment.duration, record.lap, { onLap: record.kind, counts: isTimedLap(record) });
  });
};

/** The segment is classified: through or knocked out in a knockout, else the final place, to the player's drivers. */
const segmentRadio = (state, segment, ranked) => {
  state.cars.forEach((car) => {
    if (car.eliminated) return;
    const index = ranked.indexOf(car);
    const position = index >= 0 ? index + 1 : null;
    const base = { position, time: car.best === null ? null : round3(car.best) };
    if (segment.drop) pushSessionRadio(state, car, car.out === state.segment ? "session-knocked-out" : "session-through", state.clock, car.laps, base);
    else pushSessionRadio(state, car, "session-result", state.clock, car.laps, base);
  });
};

/** A lap ends: count it, time it, and start the next one (or put the car back in the garage). */
const endLap = (state, car) => {
  const record = car.record;
  const at = record.end;
  const set = car.run.set;
  set.laps += 1;
  car.fuel = Math.max(0, car.fuel - 1);
  state.fieldLaps += 1;
  if (record.kind === "burn") car.run.burned += 1;
  const bestBefore = car.best;
  if (record.flying && !record.aborted && record.deleteFor) {
    // SES-4: a time set through a yellow the era deletes - the attempt counts, the time does not.
    record.deleted = { time: record.flying, sectors: record.sectors || null, reason: record.deleteFor };
    delete record.flying;
    delete record.sectors;
    if (record.kind === "push") car.run.pushes += 1;
    else car.run.timed += 1;
    state.events.push({ t: round3(at), type: "lapDeleted", carId: car.id, time: round3(record.deleted.time), reason: record.deleteFor, segment: state.segment });
  } else if (record.flying && !record.aborted) {
    if (record.kind === "push") car.run.pushes += 1;
    else car.run.timed += 1;
    car.run.times.push(record.flying);
    const first = car.best === null;
    if (first || record.flying < car.best) {
      car.best = record.flying;
      car.bestLap = record.lap;
      car.bestSectors = record.sectors;
      car.bestCompound = set.compound;
      const overall = state.cars.every((other) => other === car || other.best === null || other.best > record.flying);
      state.events.push({ t: round3(at), type: overall ? "best" : "pb", carId: car.id, time: round3(record.flying), segment: state.segment });
    }
  } else if (record.aborted) {
    if (record.kind === "push") car.run.pushes += 1;
    else car.run.timed += 1;
  }
  if (!record.aborted && (Number.isFinite(record.flying) || record.deleted)) lapComplete(state, car, record, at, car.best !== bestBefore);
  const kind = nextLapKind(state, car, record);
  if (!kind) {
    car.state = "garage";
    car.record = null;
    car.boxRequest = false;
    car.returnedAt = at;
    car.lastRun = { setId: set.id, fuel: car.fuel, setup: car.setup ? { ...car.setup } : null };
    const times = car.run.times;
    const summary = {
      carId: car.id,
      programme: car.run.plan.programme,
      compound: set.compound,
      fuel: car.run.plan.fuel,
      laps: times.length,
      best: times.length ? round3(Math.min(...times)) : null,
      average: times.length ? round3(times.reduce((sum, time) => sum + time, 0) / times.length) : null,
      times: times.map(round3),
      from: car.run.from,
      to: round3(at),
    };
    car.runs.push(summary);
    state.events.push({ t: round3(at), type: "run", ...summary });
    car.run = null;
    return;
  }
  beginLap(state, car, kind, at);
};

/** Leave the garage at `at` with a sanitised plan. */
const leave = (state, car, plan, at) => {
  const set = pickSet(car, plan.compound, plan.set);
  if (!set) return false;
  const segment = currentSegment(state);
  if (segment.raceFuel && car.declaredFuel === null) car.declaredFuel = plan.fuel;
  car.fuel = plan.fuel;
  if (plan.setup) car.setup = { ...plan.setup };
  car.run = { plan, set, pushes: 0, timed: 0, burned: 0, times: [], from: round3(at) };
  car.boxRequest = false;
  // SES-2: rolled out, down the lane from the box, then onto the track when the exit is clear.
  const rollOutSec = B.garage.exit.rollOutSec;
  const arrival = at + rollOutSec + car.lane.exitSec;
  const trackAt = clearExitAt(state, arrival);
  state.exitQueue.push(trackAt);
  const garageExit = { rollOutSec, laneSec: car.lane.exitSec, queueSec: trackAt - arrival, trackAt, box: car.box, metres: car.lane.metres };
  beginLap(state, car, "out", at, garageExit);
  state.events.push({ t: round3(at), type: "out", carId: car.id, compound: set.compound, fuel: plan.fuel, trackAt: round3(trackAt), queueSec: round3(trackAt - arrival) });
  return true;
};

// ------------------------------------------------------------------ the clock

/**
 * trabajo-garaje (RF-WKD-03, RF-STF-07): the seconds of work in the garage before a car can
 * leave with `plan` (sanitised), item by item: the base turnaround, another tyre set, the fuel
 * added and a setup change, all scaled by the crew. Nothing before the first run of a segment.
 */
const workOf = (state, car, plan) => {
  const w = B.garage.work;
  const last = car.lastRun;
  if (!last) return { total: 0, items: [], crewFactor: 1 };
  const items = [{ kind: "base", sec: w.baseSec }];
  const set = pickSet(car, plan.compound, plan.set);
  if (set && set.id !== last.setId) items.push({ kind: "tyres", sec: w.tyreSec });
  const fuel = Math.max(0, (plan.fuel ?? 0) - (last.fuel ?? 0));
  if (fuel > 0) items.push({ kind: "fuel", sec: fuel * w.fuelPerLapSec, laps: fuel });
  const points = plan.setup ? setupDistance(last.setup || car.setup, plan.setup) : 0;
  if (points > 0) items.push({ kind: "setup", sec: w.setup.baseSec + w.setup.perPoint * points, points });
  const crewFactor = car.crew === null || car.crew === undefined ? 1 : clamp(1 - w.crewPerPoint * (car.crew - w.crewRef), w.crewMin, w.crewMax);
  const total = items.reduce((sum, item) => sum + item.sec, 0) * crewFactor;
  return { total: round3(total), items: items.map((item) => ({ ...item, sec: round3(item.sec * crewFactor) })), crewFactor: round3(crewFactor) };
};

/** When the car can leave with `plan`: back in the garage plus the work it asks for. */
const readyFor = (state, car, plan) => (car.returnedAt === null ? 0 : car.returnedAt + workOf(state, car, sanitisePlan(state, car, plan || {})).total);

/**
 * What the garage has to do before car `carId` leaves with `plan`, for the pit wall to see before
 * it confirms (§2.12.3: the sum shown before the order): {total, items, crewFactor, readyAt}.
 */
export const garageWorkOf = (state, carId, plan = {}) => {
  const car = carOf(state, carId);
  if (!car) return null;
  const work = workOf(state, car, sanitisePlan(state, car, plan));
  return { ...work, readyAt: car.returnedAt === null ? 0 : round3(car.returnedAt + work.total) };
};

/** The next thing that happens to a car, and when (Infinity if nothing is due). */
const nextDue = (state, car) => {
  if (car.eliminated) return Infinity;
  if (car.record) return car.record.end;
  if (state.flag) return Infinity;
  if (car.pending) return Math.max(car.pending.at, readyFor(state, car, car.pending.plan || car.nextPlan || (car.auto ? car.aiPlans[0]?.plan : null)));
  if (car.auto && car.aiPlans.length) return Math.max(car.aiPlans[0].at, readyFor(state, car, car.aiPlans[0].plan));
  return Infinity;
};

const handleDue = (state, car, at) => {
  if (car.record) {
    endLap(state, car);
    return;
  }
  const segment = currentSegment(state);
  if (car.pending) {
    const { plan, slot } = car.pending;
    car.pending = null;
    leave(state, car, sanitisePlan(state, car, plan || car.nextPlan || (car.auto ? car.aiPlans[0]?.plan : null) || {}), at);
    if (slot) car.aiPlans = [];
    return;
  }
  const next = car.aiPlans[0];
  // SES-8 ai.spacingSec: the pit wall waits for a gap before it releases the car (one step at a time).
  if (next && at < segment.duration && spacingHold(state, car, at, next)) {
    next.at = at + state.dt;
    next.heldSec = round3((next.heldSec ?? 0) + state.dt);
    return;
  }
  car.aiPlans.shift();
  if (next && at < segment.duration && leave(state, car, sanitisePlan(state, car, next.plan), at) && next.heldSec) {
    // The wait for a gap shows on the departure.
    const out = state.events[state.events.length - 1];
    if (out?.type === "out" && out.carId === car.id) out.heldSec = next.heldSec;
  }
};

// ------------------------------------------------------------------ traffic (SES-8)

/** When the lap timeline of `record` reaches time share `share` of the lap on the track (null if it is past it or off the track). */
const timeAtTrackShare = (record, share) => {
  const track = record.track || { at: record.start, from: 0, pace: record.end - record.start };
  const warp = record.warp;
  if (warp && share >= warp.share) return warp.at + ((share - warp.share) / Math.max(EPS, 1 - warp.share)) * (record.end - warp.at);
  if (warp) return null;
  if (share < track.from) return null;
  return track.at + (share - track.from) * track.pace;
};

/**
 * The session times at which the other cars pass the pit exit around `trackAt` (the moment a car released now
 * would join): the ones on the track, on this lap or (once past it) about a lap later, and the ones already
 * leaving the garage. Geometry and the lap timelines only, no draw.
 */
const exitPassesOf = (state, car, now) => {
  const share = state.lane.exitShare;
  const passes = [...state.exitQueue];
  state.cars.forEach((other) => {
    const record = other.record;
    if (other === car || other.eliminated || !record || record.in) return;
    if (record.garageExit && now < record.garageExit.trackAt) return; // counted in the queue
    const at = timeAtTrackShare(record, share);
    passes.push(at !== null && at >= now ? at : record.end + share * state.baseLap);
  });
  return passes;
};

/** The gaps a car released at `at` would join with: seconds to the nearest car passing the exit before and after it. */
const exitGapsOf = (state, car, at) => {
  const trackAt = clearExitAt(state, at + B.garage.exit.rollOutSec + car.lane.exitSec);
  let ahead = null;
  let behind = null;
  exitPassesOf(state, car, at).forEach((pass) => {
    const gap = pass - trackAt;
    if (gap <= 0 && (ahead === null || -gap < ahead)) ahead = -gap;
    if (gap > 0 && (behind === null || gap < behind)) behind = gap;
  });
  return { trackAt, ahead, behind };
};

/**
 * SES-8: does a rival pit wall hold its car at `at`? While another car passes the exit within ai.spacingSec of
 * the moment it would join, for at most ai.spacingMaxHoldSec, and never so late that the push lap would start
 * after the flag (the out-lap from the exit at outLap pace has to fit before it).
 */
const spacingHold = (state, car, at, next) => {
  const { spacingSec, spacingMaxHoldSec } = B.ai;
  if (!state.traffic || !(spacingSec > 0)) return false;
  if ((next.heldSec ?? 0) + state.dt > spacingMaxHoldSec) return false;
  const latest = currentSegment(state).duration - (B.garage.exit.rollOutSec + car.lane.exitSec + (1 - state.lane.exitShare) * state.baseLap * B.laps.outLap) - state.dt;
  if (at + state.dt > latest) return false;
  const { ahead, behind } = exitGapsOf(state, car, at);
  return (ahead !== null && ahead < spacingSec) || (behind !== null && behind < spacingSec);
};

/**
 * What the pit wall sees before it sends car `carId` out now (SES-8, read-only): when it would join the track
 * and the seconds to the nearest car passing the pit exit before (`aheadSec`) and after it (`behindSec`).
 */
export const exitTrafficOf = (state, carId) => {
  const car = carOf(state, carId);
  if (!car) return null;
  const { trackAt, ahead, behind } = exitGapsOf(state, car, state.clock);
  return { trackAt: round3(trackAt), aheadSec: ahead === null ? null : round3(ahead), behindSec: behind === null ? null : round3(behind), spacingSec: B.ai.spacingSec };
};

/** The cars on the track at `tau`, placed on the trace for stepSession: time share, lap seconds, timed or slow. */
const trackEntriesOf = (state, tau) => {
  const out = [];
  state.cars.forEach((car) => {
    const record = car.record;
    if (car.eliminated || !record || tau < record.start || tau >= record.end) return;
    if (record.in && tau >= record.pit.entryAt) return;
    const share = trackShareOf(record, tau);
    if (share === null) return;
    const timed = isTimedLap(record);
    out.push({ car, index: car.index, tau: clamp(share, 0, 1 - EPS), lapSec: timed ? record.end - record.start : state.baseLap, timed, slow: !timed, met: record.metSlow || [] });
  });
  return out;
};

/**
 * SES-8 (RF-SIM-01, RF-SIM-06): one step of traffic from the step's start - the air term written into each
 * timed lap as a warp, and the meetings with slow cars. Only laps that do not end inside the step are touched.
 */
const applyTraffic = (state, to) => {
  const now = state.clock;
  state.cars.forEach((car) => {
    car.traffic = null;
  });
  if (!state.traffic) return;
  const ctx = trafficContextOf(circuitOfState(state), state.era);
  if (!ctx) return;
  const actions = trafficStep(state, ctx, trackEntriesOf(state, now), to - now);
  actions.forEach((action) => {
    const { car } = action.entry;
    const record = car.record;
    if (action.kind === "follow") {
      car.traffic = { aheadId: action.aheadId, gapSec: action.gapSec, effect: null };
      return;
    }
    if (action.kind === "air") {
      car.traffic = { aheadId: action.aheadId, gapSec: action.gapSec, effect: action.effect };
      if (action.deltaSec && record.end - to > EPS) {
        shiftLapAt(state, record, now, action.deltaSec);
        if (record.yellowHit || state.yellowUntil > now) planYellowHit(state, car, now);
      }
      return;
    }
    // A meeting with a slow car: once per pair and lap.
    record.metSlow = [...(record.metSlow || []), action.slowId];
    const meeting = action.meeting;
    car.traffic = { aheadId: action.slowId, gapSec: action.gapSec, effect: meeting ? "impeded" : null };
    if (!meeting) return;
    const penalty = impedingPenaltyOf(state.year);
    state.events.push({
      t: round3(now),
      type: "impeding",
      carId: action.slowId,
      victimId: car.id,
      segment: state.segment,
      outcome: meeting.outcome,
      lossSec: meeting.outcome === "abandon" ? null : meeting.lossSec,
      gapM: action.gapM,
      noted: meeting.noted,
      // The stewards' decision: the era's penalty once its FIA text is copied; until then only noted.
      penalty: meeting.noted && penalty?.status === "source" ? penalty.value : null,
    });
    // SES-C1: the engineer to the player's driver held up on a timed lap.
    pushSessionRadio(state, car, "session-impeded", now, record.lap, { otherId: action.slowId, outcome: meeting.outcome, lossSec: meeting.outcome === "abandon" ? null : round3(meeting.lossSec) });
    if (meeting.outcome === "abandon") {
      abortLapAt(state, car, now, { reason: "impeding" });
      return;
    }
    if (record.end - to > EPS) {
      shiftLapAt(state, record, now, meeting.lossSec);
      if (record.yellowHit || state.yellowUntil > now) planYellowHit(state, car, now);
    }
  });
};

/** One fixed step of session time: every lap end and departure inside it, in time order. */
export const stepOnce = (state) => {
  if (state.over || state.done) return state;
  const segment = currentSegment(state);
  const to = state.clock + state.dt;
  // SES-8: what the traffic does to the timed laps over this step, before anything inside it happens.
  applyTraffic(state, to);
  for (let guard = 0; guard < 400; guard += 1) {
    let pick = null;
    let when = Infinity;
    let wave = false;
    let meet = false;
    let join = false;
    state.cars.forEach((car) => {
      const lap = nextDue(state, car);
      // SES-3: a yellow planned on the lap under way is waved at its instant, before the lap ends.
      const flagAt = yellowDue(car);
      // SES-4: and somebody else's yellow is met where it is waved, before the lap ends too.
      const hitAt = yellowHitDue(car);
      // SES-C1: a car leaving the garage joins the track (no lap of its own changes there).
      const joinAt = joinDue(car);
      const due = Math.min(lap, flagAt, hitAt, joinAt);
      if (due <= to + EPS && (due < when - EPS || (Math.abs(due - when) <= EPS && pick && car.index < pick.index))) {
        pick = car;
        when = due;
        join = joinAt <= lap && joinAt <= flagAt && joinAt <= hitAt;
        wave = !join && flagAt <= lap && flagAt <= hitAt;
        meet = !join && !wave && hitAt <= lap;
      }
    });
    if (!pick) break;
    // The chequered flag falls between: from then on nobody starts a new timed lap.
    if (!state.flag && when >= segment.duration) {
      raiseFlag(state, segment);
      continue;
    }
    if (join) {
      joinTrack(state, pick);
      continue;
    }
    if (wave) {
      waveYellow(state, pick);
      continue;
    }
    if (meet) {
      meetYellow(state, pick);
      continue;
    }
    handleDue(state, pick, Math.max(when, state.clock));
  }
  state.clock = to;
  state.localClock = localClockOf(state);
  if (!state.flag && state.clock >= segment.duration) raiseFlag(state, segment);
  if (state.flag && state.cars.every((car) => !car.record)) closeSegment(state);
  return state;
};

/** Run the clock up to session time `target` (the view's clock), a whole step at a time. */
export const advanceTo = (state, target) => {
  while (!state.over && !state.done && state.clock + state.dt <= target + EPS) stepOnce(state);
  return state;
};

/** The flag has fallen and every car is in: classify the segment. */
const closeSegment = (state) => {
  if (state.over) return;
  state.over = true;
  const ranked = rankOf(state);
  state.cars.forEach((car) => {
    car.results[state.segment] = { best: car.best, compound: car.bestCompound ?? null, laps: car.laps };
  });
  const segment = currentSegment(state);
  state.classification = ranked.map((car) => ({ id: car.id, time: car.best }));
  if (segment.drop) {
    const alive = ranked.filter((car) => !car.eliminated);
    alive.slice(alive.length - segment.drop).forEach((car) => {
      car.out = state.segment;
      state.events.push({ t: round3(state.clock), type: "eliminated", carId: car.id, segment: state.segment });
    });
  }
  segmentRadio(state, segment, ranked);
  state.events.push({ t: round3(state.clock), type: "segment-over", segment: state.segment });
  if (state.segment >= state.segments.length - 1) state.done = true;
};

/** The order of the current segment: best lap first, cars without a time after, in entry order. */
export const rankOf = (state) =>
  state.cars
    .filter((car) => !car.eliminated)
    .slice()
    .sort((a, b) => {
      if (a.best !== null && b.best !== null) return a.best - b.best || a.index - b.index;
      if (a.best !== null) return -1;
      if (b.best !== null) return 1;
      return a.index - b.index;
    });

/** On to the next segment (knockout: without those who dropped out; single lap: reversed order). */
export const nextSegment = (state) => {
  if (!state.over || state.segment >= state.segments.length - 1) return state;
  state.cars.forEach((car) => {
    if (car.out !== undefined && car.out === state.segment) car.eliminated = true;
  });
  // The rubber stays, the evening cools a little of it off.
  state.carry = Math.max(state.evolution.max, state.carry + state.fieldLaps * state.evolution.perFieldLap) * state.evolution.carryBetweenSegments;
  if (currentSegment(state).singleLap) {
    // Aggregate (2005): the second session runs in reverse order of the first.
    state.runOrder = rankOf(state).map((car) => car.id).reverse();
  }
  state.log.push({ clock: state.clock, segment: state.segment, name: "nextSegment", args: [] });
  startSegment(state, state.segment + 1);
  return state;
};

/** Skip: the engineers run your cars too, and the clock runs to the end of the segment (RF-WKD-02). */
export const runSegmentToEnd = (state, { autopilot = true } = {}) => {
  if (autopilot) {
    state.cars.forEach((car) => {
      if (car.isUser && !car.auto && !car.eliminated) command(state, "autopilot", car.id);
    });
  }
  let guard = 0;
  while (!state.over && guard < 200000) {
    stepOnce(state);
    guard += 1;
  }
  return state;
};

/** Every segment to the end (headless; tests and "simulate the rest"). */
export const runSessionToEnd = (state, options) => {
  for (let guard = 0; guard < 10; guard += 1) {
    runSegmentToEnd(state, options);
    if (state.done) break;
    nextSegment(state);
  }
  return state;
};

// ------------------------------------------------------------------ orders

/**
 * RF-WKD-03 and the qualifying pit wall: the orders a session takes. Each is applied at
 * the current step boundary and logged; see COMMANDS.
 */
const ORDERS = {
  /** "Salir a pista": out of the garage now (or as soon as the crew is done) with this plan. */
  sendOut: (state, car, plan) => {
    const segment = currentSegment(state);
    if (car.eliminated || car.record || state.flag || state.over || segment.singleLap) return false;
    car.pending = { at: state.clock, plan: sanitisePlan(state, car, plan) };
    return true;
  },
  /** The plan for the next run (single-lap qualifying: fuel, tyre and style for the car's slot). */
  setPlan: (state, car, plan) => {
    car.nextPlan = sanitisePlan(state, car, plan);
    if (car.pending?.slot) car.pending.plan = car.nextPlan;
    return true;
  },
  /** Stay in: a queued departure is cancelled. */
  hold: (state, car) => {
    if (!car.pending || car.pending.slot) return false;
    car.pending = null;
    return true;
  },
  /** "Abortar vuelta": the rest of a timed lap at cool-down pace, no time. */
  abortLap: (state, car) => {
    const record = car.record;
    if (!record || !record.flying || record.aborted) return false;
    abortLapAt(state, car, state.clock);
    return true;
  },
  /** "Volver a boxes": in this lap if pit entry is still ahead on an out/cool lap, else at the end of it. */
  boxNow: (state, car) => {
    const record = car.record;
    if (!record) return ORDERS.hold(state, car);
    if (record.in) return false;
    // Still leaving the garage: the car is in the lane and turns in at the end of its out-lap.
    const track = record.track || { at: record.start, from: 0, pace: record.end - record.start };
    const share = trackShareOf(record, state.clock) ?? track.from;
    if (!record.flying && !record.warp && share < state.pitEntryShare) {
      record.kind = "in";
      delete record.out;
      toInLap(state, car, record, track.at, track.from, track.pace);
      car.state = "in";
      car.boxRequest = { at: state.clock, distanceM: metresToEntry(state, share, true) };
      return true;
    }
    car.boxRequest = { at: state.clock, distanceM: metresToEntry(state, share, false) };
    return true;
  },
  /** Push style for the coming laps: safe, normal or push. */
  setStyle: (state, car, style) => {
    if (!STYLES.includes(style)) return false;
    if (car.run) car.run.plan = { ...car.run.plan, style };
    if (car.nextPlan) car.nextPlan = { ...car.nextPlan, style };
    return true;
  },
  /** The engineers take the car for the rest of the segment (skip). */
  autopilot: (state, car) => {
    car.auto = true;
    const segment = currentSegment(state);
    if (!segment.singleLap && car.best === null && !car.record && !car.aiPlans.length) {
      car.aiPlans = [{ at: state.clock, plan: { programme: state.kind === "practice" ? "setup" : "quali", push: 1, compound: defaultCompound(state), set: "new", style: "normal", laps: 4 } }];
    } else {
      car.aiPlans = car.aiPlans.filter((plan) => plan.at >= state.clock);
    }
    return true;
  },
};

export const COMMANDS = Object.keys(ORDERS);

/** Apply one order to a car (by id) at the current session time, and log it (RNF-05). */
export const command = (state, name, carId, ...args) => {
  const fn = ORDERS[name];
  const car = carOf(state, carId);
  if (!fn || !car) return false;
  const applied = fn(state, car, ...args);
  if (applied) state.log.push({ clock: state.clock, segment: state.segment, name, args: [carId, ...args] });
  return applied;
};

/**
 * Replay a session from its seed and order log (RNF-05): the same orders at the same
 * session times give the same session.
 */
export const replaySession = (options, log) => {
  const state = createSession(options);
  log.forEach((entry) => {
    while (state.segment < entry.segment) {
      runSegmentToEnd(state, { autopilot: false });
      nextSegment(state);
    }
    if (entry.name === "nextSegment") return;
    advanceTo(state, entry.clock);
    command(state, entry.name, ...entry.args);
  });
  return state;
};

// ------------------------------------------------------------------ reading it

/**
 * SES-2, §1.7 contract `phase[i]`: GARAGE, GARAGE_EXIT, OUT_LAP (also cool-down and fuel-burn laps),
 * PUSH_PREP (past the last corner's apex on a lap whose next one is timed), PUSH (a timed lap not
 * aborted) or IN_LAP, with `garageExit` and `boxRequest` details. Read-only.
 */
export const RUN_PHASES = ["GARAGE", "GARAGE_EXIT", "OUT_LAP", "PUSH_PREP", "PUSH", "IN_LAP"];

const runPhaseOf = (state, car, live, tau) => {
  if (!live) return { runPhase: "GARAGE", garageExit: null, boxRequest: null };
  const share = trackShareOf(live, tau);
  if (live.in) {
    const onTrack = tau < live.pit.entryAt;
    return { runPhase: "IN_LAP", garageExit: null, boxRequest: onTrack ? { distanceM: metresToEntry(state, share ?? live.track.from, true) } : { distanceM: 0 } };
  }
  const boxRequest = car.boxRequest && car.record === live ? { distanceM: metresToEntry(state, share ?? live.track?.from ?? 0, false) } : null;
  if ((live.kind === "push" || live.kind === "timed") && !live.aborted) return { runPhase: "PUSH", garageExit: null, boxRequest };
  const exit = live.garageExit;
  if (exit && tau < exit.trackAt) {
    const elapsed = tau - live.start;
    const profile = exitProfileOf(state, exit.box);
    let at = { s: profile ? profile.s0 : 0, v: 0 };
    if (elapsed >= exit.rollOutSec && profile) at = garageExitAt(profile, elapsed - exit.rollOutSec);
    const queued = elapsed >= exit.rollOutSec + exit.laneSec;
    return { runPhase: "GARAGE_EXIT", garageExit: { elapsed, s: at.s, v: queued ? 0 : at.v, rolling: elapsed < exit.rollOutSec, queued, toTrack: exit.trackAt - tau }, boxRequest };
  }
  const prepFrom = state.lane.prepFrom;
  const next = car.record === live && car.run ? nextLapKind(state, car, live) : null;
  const prep = prepFrom !== null && share !== null && (next === "push" || next === "timed") && distanceAtTimeShare(circuitOfState(state), Math.min(share, 1 - EPS)) >= prepFrom;
  return { runPhase: prep ? "PUSH_PREP" : "OUT_LAP", garageExit: null, boxRequest };
};

/** Where a car is at session time `tau`, for the view: state, current lap clock, sector times so far. */
export const carStatus = (state, carId, tau = state.clock) => {
  const car = carOf(state, carId);
  if (!car) return null;
  const record = [...car.history].reverse().find((entry) => entry.start <= tau);
  const live = record && tau < record.end ? record : null;
  let phase = "garage";
  if (live) {
    if (live.in) phase = tau >= live.pit.entryAt ? "pitlane" : "in";
    else phase = live.kind === "push" || live.kind === "timed" ? (live.aborted ? "cool" : "flying") : live.kind === "burn" ? "cool" : live.kind;
  } else if (car.pending && !car.pending.slot) phase = "queued";
  const { runPhase, garageExit, boxRequest } = runPhaseOf(state, car, live, tau);
  const elapsed = live ? tau - live.start : null;
  // Sector lines passed on a timed lap.
  const sectors = [];
  if (live && live.sectors) {
    let sum = 0;
    live.sectors.forEach((sector, index) => {
      sum += sector;
      if (elapsed >= sum && index < 2) sectors.push(sector);
    });
  }
  const done = car.history.filter((entry) => entry.end <= tau);
  const timed = done.filter((entry) => entry.flying);
  const bestSoFar = timed.length ? Math.min(...timed.map((entry) => entry.flying)) : null;
  return {
    car, phase, runPhase, garageExit, boxRequest, localClock: localClockOf(state, tau),
    // SES-8: the car ahead within the traffic window at the last step, and what it does to this lap.
    traffic: live && car.record === live ? car.traffic : null,
    record: live, elapsed, sectors, laps: done.length, timedLaps: timed.length, best: bestSoFar, lastLap: timed.length ? timed[timed.length - 1].flying : null,
  };
};

/** Session-best sectors among laps finished by `tau` (purple), for the live deltas. */
export const sessionBestSectors = (state, tau = state.clock) => {
  const bestSectors = [Infinity, Infinity, Infinity];
  state.cars.forEach((car) =>
    car.history.forEach((entry) => {
      if (!entry.sectors || entry.end > tau) return;
      entry.sectors.forEach((sector, index) => {
        if (sector < bestSectors[index]) bestSectors[index] = sector;
      });
    }),
  );
  return bestSectors;
};

/**
 * The session's result in the shape career.weekend.qualifying keeps (race.js
 * runQualifying's): format, order, times and each segment's laps, plus what a playable
 * session adds - the race fuel each car declared and the tyre the top ten qualified on.
 */
export const sessionResult = (state) => {
  const segments = state.segments.map((segment, index) =>
    state.cars
      .filter((car) => car.results[index] && (car.out === undefined || car.out >= index))
      .map((car) => ({ id: car.id, time: car.results[index].best }))
      .filter((row) => row.time !== null)
      .sort((a, b) => a.time - b.time),
  );
  const timeOf = (car) => {
    const times = car.results.map((entry) => entry?.best ?? null);
    if (state.combine === "sum") return times.length === state.segments.length && times.every((time) => time !== null) ? times.reduce((sum, time) => sum + time, 0) : null;
    if (state.combine === "knockout") return times[car.out ?? state.segments.length - 1] ?? null;
    const valid = times.filter((time) => time !== null);
    return valid.length ? Math.min(...valid) : null;
  };
  let order;
  if (state.combine === "knockout") {
    const reached = (car) => (car.out === undefined ? state.segments.length - 1 : car.out);
    order = state.cars
      .slice()
      .sort((a, b) => {
        const ra = reached(a);
        const rb = reached(b);
        if (ra !== rb) return rb - ra;
        const ta = timeOf(a);
        const tb = timeOf(b);
        if (ta !== null && tb !== null) return ta - tb || a.index - b.index;
        if (ta !== null) return -1;
        if (tb !== null) return 1;
        return a.index - b.index;
      })
      .map((car) => car.id);
  } else {
    order = state.cars
      .slice()
      .sort((a, b) => {
        const ta = timeOf(a);
        const tb = timeOf(b);
        if (ta !== null && tb !== null) return ta - tb || a.index - b.index;
        if (ta !== null) return -1;
        if (tb !== null) return 1;
        return a.index - b.index;
      })
      .map((car) => car.id);
  }
  const times = Object.fromEntries(state.cars.map((car) => [car.id, timeOf(car) ?? NaN]));
  const fuel = Object.fromEntries(state.cars.filter((car) => car.declaredFuel !== null).map((car) => [car.id, car.declaredFuel]));
  const tyres = Object.fromEntries(state.cars.map((car) => [car.id, car.tyres.map((set) => ({ ...set }))]));
  // The tyre of each car's best lap in the segment the era's top-ten start-tyre rule names.
  const rule = rulesFor(state.era).tyres.topTenStartTyres;
  const ruleSegment = rule === "Q2" ? 1 : rule === "Q3" ? 2 : -1;
  const startTyres = {};
  if (state.kind === "qualifying" && state.combine === "knockout" && ruleSegment >= 0 && ruleSegment < state.segments.length) {
    order.slice(0, 10).forEach((id) => {
      const compound = carOf(state, id)?.results[ruleSegment]?.compound;
      if (compound) startTyres[id] = compound;
    });
  }
  return {
    format: state.combine === "knockout" ? "knockout" : "single",
    sessionFormat: state.format,
    order,
    times,
    sessions: state.combine === "knockout" ? segments : null,
    segments: segments.map((rows, index) => ({ name: state.segments[index].name, rows })),
    fuel,
    startTyres,
    tyres,
    runs: Object.fromEntries(state.cars.map((car) => [car.id, car.runs])),
    live: true,
    log: state.log.slice(),
  };
};

/**
 * evolucion-q (RF-WKD-02, RF-SIM-11): a whole playable knockout qualifying from `options`
 * (createSession's), the engineers driving every car, and the statistic scripts/measureEvolution.js
 * measures in f1db: the median over the cars that reached the last segment of their Q1 best
 * minus their best in the last segment (and in Q2). Nulls outside a three-segment knockout.
 */
export const evolutionImprovement = (options) => {
  const state = runSessionToEnd(createSession(options));
  const last = state.segments.length - 1;
  if (state.combine !== "knockout" || last !== 2) return { q1ToQ3: null, q1ToQ2: null, cars: 0, q1ToQ2Iqr: null };
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return null;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const finalists = state.cars.filter((car) => car.out === undefined && Number.isFinite(car.results[0]?.best) && Number.isFinite(car.results[last]?.best));
  const q3 = median(finalists.map((car) => car.results[0].best - car.results[last].best));
  const q2 = median(finalists.filter((car) => Number.isFinite(car.results[1]?.best)).map((car) => car.results[0].best - car.results[1].best));
  // SES-8: the scatter of what each driver gains Q1 -> Q2 (IQR over every car with both times, >= 8 of them).
  const quantile = (values, q) => {
    const sorted = [...values].sort((a, b) => a - b);
    const at = (sorted.length - 1) * q;
    const lo = Math.floor(at);
    return sorted[lo] + (sorted[Math.min(sorted.length - 1, lo + 1)] - sorted[lo]) * (at - lo);
  };
  const gains = state.cars.filter((car) => Number.isFinite(car.results[0]?.best) && Number.isFinite(car.results[1]?.best)).map((car) => car.results[0].best - car.results[1].best);
  const iqr = gains.length >= 8 ? quantile(gains, 0.75) - quantile(gains, 0.25) : null;
  return { q1ToQ3: q3 === null ? null : round3(q3), q1ToQ2: q2 === null ? null : round3(q2), cars: finalists.length, q1ToQ2Iqr: iqr === null ? null : round3(iqr) };
};
