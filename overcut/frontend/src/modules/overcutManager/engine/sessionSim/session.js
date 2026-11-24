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
 */

import { clamp, createStream } from "../../../overcutTrayectoria/engine/rng";
import { fieldMomentsOf, qualifyingAnchorOf, qualifyingPaceOf, raceFuelOf, tyreTime } from "../race";
import { byYear, rulesFor } from "../rules";
import { setupDistance } from "../setup";
import { climateFor, hourlyConditions } from "../weather";
import { SESSION_BALANCE as B, sessionFormat, tyreAllocation } from "./formats";

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

// ------------------------------------------------------------------ set up

/**
 * A new session. `entrants` as career.entrantsFor gives them; `practice` the weekend's
 * practice preparation (race.js qualifyingPaceOf); `raceFuel` each car's race fuel in
 * laps for a race-fuel segment (rivals' first stint); `runOrder` the single-lap order;
 * `sectorShares` the time shares of the two sector lines (trackGeometry), `pitEntryShare`
 * the time share of pit entry; `tyres` the sets each car still has (RF-WKD-05).
 */
export const createSession = ({
  kind, entrants, race, era, seed, wetness = 0, practice = {}, raceFuel = {}, runOrder = null, sectorShares = [1 / 3, 2 / 3], pitEntryShare = 0.93, tyres = null,
  sessionName = null, setups = null, crews = null,
}) => {
  const rules = rulesFor(era);
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
  }));
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
    pitEntryShare,
    runOrder: runOrder || entrants.map((entrant) => entrant.id),
    dt: B.step.dt,
    segment: -1,
    clock: 0,
    cars,
    events: [],
    log: [],
    carry: 0,
    done: false,
    evolution: evolutionOf(rules.year),
    schedule: sessionScheduleOf({ kind, race, era, sessionName }),
    climateRace: { date: race.date || null, packCircuitId: race.packCircuitId || null, circuitId: race.circuitId || null, circuit: race.circuit || null },
  };
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
  const segment = currentSegment(state);
  // Single-lap qualifying: one car at a time, in run order, a slot each.
  if (segment.singleLap) {
    const order = state.runOrder.filter((id) => !carOf(state, id)?.eliminated);
    segment.slots = Object.fromEntries(order.map((id, slot) => [id, slot * segment.spacing]));
    segment.duration = order.length * segment.spacing + state.baseLap * (B.laps.outLap + 1);
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
  return { time, sectors, mistake: mistake > 0 };
};

/** Start a lap of `kind` at session time `at`. */
const beginLap = (state, car, kind, at) => {
  const { time, sectors, mistake } = lapTimeOf(state, car, kind);
  car.laps += 1;
  const record = { lap: car.history.length + 1, start: at, end: at + time, kind, compound: car.run.set.compound };
  if (kind === "out") record.out = true;
  if (kind === "push" || kind === "timed") {
    record.flying = time;
    record.sectors = sectors;
    if (mistake) record.mistake = true;
  }
  if (kind === "in") {
    record.in = true;
    record.box = true;
    record.pit = { lane: B.laps.pitLaneSec, stationary: B.laps.boxStopSec };
    record.end += B.laps.pitLaneSec + B.laps.boxStopSec;
  }
  car.history.push(record);
  car.record = record;
  car.state = kind === "push" || kind === "timed" ? "flying" : kind;
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

/** A lap ends: count it, time it, and start the next one (or put the car back in the garage). */
const endLap = (state, car) => {
  const record = car.record;
  const at = record.end;
  const set = car.run.set;
  set.laps += 1;
  car.fuel = Math.max(0, car.fuel - 1);
  state.fieldLaps += 1;
  if (record.kind === "burn") car.run.burned += 1;
  if (record.flying && !record.aborted) {
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
  beginLap(state, car, "out", at);
  state.events.push({ t: round3(at), type: "out", carId: car.id, compound: set.compound, fuel: plan.fuel });
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
  const next = car.aiPlans.shift();
  if (next && at < segment.duration) leave(state, car, sanitisePlan(state, car, next.plan), at);
};

/** One fixed step of session time: every lap end and departure inside it, in time order. */
export const stepOnce = (state) => {
  if (state.over || state.done) return state;
  const segment = currentSegment(state);
  const to = state.clock + state.dt;
  for (let guard = 0; guard < 400; guard += 1) {
    let pick = null;
    let when = Infinity;
    state.cars.forEach((car) => {
      const due = nextDue(state, car);
      if (due <= to + EPS && (due < when - EPS || (Math.abs(due - when) <= EPS && pick && car.index < pick.index))) {
        pick = car;
        when = due;
      }
    });
    if (!pick) break;
    // The chequered flag falls between: from then on nobody starts a new timed lap.
    if (!state.flag && when >= segment.duration) {
      state.flag = true;
      state.events.push({ t: round3(segment.duration), type: "flag", segment: state.segment });
      continue;
    }
    handleDue(state, pick, Math.max(when, state.clock));
  }
  state.clock = to;
  state.localClock = localClockOf(state);
  if (!state.flag && state.clock >= segment.duration) {
    state.flag = true;
    state.events.push({ t: round3(segment.duration), type: "flag", segment: state.segment });
  }
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
    const share = clamp((state.clock - record.start) / (record.end - record.start), 0, 1);
    record.aborted = true;
    record.warp = { at: state.clock, share };
    delete record.flying;
    delete record.sectors;
    record.end = state.clock + (1 - share) * state.baseLap * B.laps.abortRest;
    car.state = "cool";
    state.events.push({ t: round3(state.clock), type: "abort", carId: car.id });
    return true;
  },
  /** "Volver a boxes": in this lap if pit entry is still ahead on an out/cool lap, else at the end of it. */
  boxNow: (state, car) => {
    const record = car.record;
    if (!record) return ORDERS.hold(state, car);
    if (record.in) return false;
    const share = (state.clock - record.start) / (record.end - record.start);
    if (!record.flying && !record.warp && share < state.pitEntryShare) {
      record.kind = "in";
      record.in = true;
      record.box = true;
      delete record.out;
      record.pit = { lane: B.laps.pitLaneSec, stationary: B.laps.boxStopSec };
      record.end += B.laps.pitLaneSec + B.laps.boxStopSec;
      car.state = "in";
      return true;
    }
    car.boxRequest = true;
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

/** Where a car is at session time `tau`, for the view: state, current lap clock, sector times so far. */
export const carStatus = (state, carId, tau = state.clock) => {
  const car = carOf(state, carId);
  if (!car) return null;
  const record = [...car.history].reverse().find((entry) => entry.start <= tau);
  const live = record && tau < record.end ? record : null;
  let phase = "garage";
  if (live) {
    if (live.in) {
      const racing = live.end - live.start - live.pit.lane - live.pit.stationary;
      phase = tau - live.start > racing ? "pitlane" : "in";
    } else phase = live.kind === "push" || live.kind === "timed" ? (live.aborted ? "cool" : "flying") : live.kind === "burn" ? "cool" : live.kind;
  } else if (car.pending && !car.pending.slot) phase = "queued";
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
  return { car, phase, record: live, elapsed, sectors, laps: done.length, timedLaps: timed.length, best: bestSoFar, lastLap: timed.length ? timed[timed.length - 1].flying : null };
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
  if (state.combine !== "knockout" || last !== 2) return { q1ToQ3: null, q1ToQ2: null, cars: 0 };
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return null;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const finalists = state.cars.filter((car) => car.out === undefined && Number.isFinite(car.results[0]?.best) && Number.isFinite(car.results[last]?.best));
  const q3 = median(finalists.map((car) => car.results[0].best - car.results[last].best));
  const q2 = median(finalists.filter((car) => Number.isFinite(car.results[1]?.best)).map((car) => car.results[0].best - car.results[1].best));
  return { q1ToQ3: q3 === null ? null : round3(q3), q1ToQ2: q2 === null ? null : round3(q2), cars: finalists.length };
};
