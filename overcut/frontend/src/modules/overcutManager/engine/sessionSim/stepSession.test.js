/**
 * SES-8 trafico-sesion (docs/manager/F1M24-GAMEPLAY.md §2.12.3, §3.3; RF-WKD-02, RF-SIM-01, RF-SIM-06, RF-SIM-15,
 * RNF-05, RNF-07, SRS §6): traffic in the playable sessions on the step race's own air model, without duels.
 *
 *   - Q times against f1db q1/q2/q3: the scatter of what each driver gains Q1 -> Q2 (IQR) is near f1db's in every
 *     knockout era, closer than without traffic, and the Q1 -> Q3 improvement of evolucion-q stays where it was
 *     (that test lives in session.test.js and runs with traffic on);
 *   - the air term is stepRace's airEffect: dirty air costs in corners, the tow pays on straights, nothing past the
 *     window, and the era's numbers (race-eras.json dirtyAir, race-sim.json slipstream);
 *   - impeding: met once per pair and lap, the §1.7-style event, race control notes as many as OpenF1 2023-2024
 *     saw, no penalty while its FIA text is pending, an abandoned attempt leaves no time;
 *   - ai.spacingSec: rivals wait for a gap at the pit exit, never longer than spacingMaxHoldSec;
 *   - determinism: the same seed gives the same session however the view slices time; traffic off is the
 *     session as drawn.
 */

import Ajv from "ajv";
import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import balance from "../../data/balance/sessions.json";
import packWorldBalance from "../../data/balance/pack-world.json";
import schema from "../packs/schema/sessions.schema.json";
import { createCareer, createContext, currentRace, entrantsFor, eraOf, runPractice, sessionOptions } from "../career";
import { loadSeasonPack } from "../packs/seasonPacks";
import { rulesFor } from "../rules";
import { SIM_BALANCE } from "../sim/stepRace";
import { advanceTo, carStatus, command, createSession, nextSegment, runSegmentToEnd, runSessionToEnd, sessionResult } from ".";
import { dAt, dirtyAt, inCorner } from "../sim/trackTables";
import { evolutionImprovement, exitTrafficOf } from "./session";
import { TRAFFIC, airDeltaSec, impedingPenaltyOf, trafficContextOf } from "./stepSession";

const SIM_YEARS = balance.evolution.byEra.map((row) => row.simYear);
const YEARS = [...new Set([...SIM_YEARS, 2023, 2024])];
let context = null;
let packs = null;
beforeAll(async () => {
  const loaded = await Promise.all(YEARS.map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

const dry = (refLaps) => refLaps?.pole && refLaps?.fastestRaceLap && refLaps.pole <= refLaps.fastestRaceLap * packWorldBalance.refLaps.wetPoleRatio;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const setUp = ({ year = 2024, kind = "qualifying", seed = "ses8", round = 0 } = {}) => {
  const career = createCareer(context, { year, teamId: "ferrari", seed });
  career.round = round;
  runPractice(career, {});
  return { career, options: { ...sessionOptions(career, kind), wetness: 0, seed: `${seed}::wk` } };
};

describe("SES-8: traffic in the playable sessions (F1M24-GAMEPLAY §2.12.3 trafico-sesion)", () => {
  it("sessions.json traffic and ai.spacingSec match the schema; the behaviour values are pending and the penalty is pending in every year (RNF-07, SRS §6)", () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(balance) || validate.errors).toBe(true);
    expect(TRAFFIC.impeding.status).toBe("pending");
    expect(balance.ai.spacingSec).toBeGreaterThan(0);
    // Every year 1950-2026 has a penalty row, none applied until its FIA article is copied.
    const years = Array.from({ length: 2026 - 1950 + 1 }, (_, index) => 1950 + index);
    expect(years.filter((year) => !impedingPenaltyOf(year))).toEqual([]);
    expect(years.filter((year) => impedingPenaltyOf(year).status !== "source" && impedingPenaltyOf(year).value !== null)).toEqual([]);
    // The measured blocks name their sources.
    expect(TRAFFIC.measured.q1ToQ2Iqr.$comment).toMatch(/f1db/);
    expect(TRAFFIC.measured.openf1.source).toMatch(/OpenF1/);
  });

  it("Q times against f1db q1/q2/q3: the scatter of each driver's Q1 -> Q2 gain is near f1db's in every knockout era, closer than without traffic (RF-WKD-02)", () => {
    const rows = [];
    balance.evolution.byEra.forEach((row) => {
      const era = `${row.from}-${row.to}`;
      const measured = TRAFFIC.measured.q1ToQ2Iqr[era].iqr;
      const career = createCareer(context, { year: row.simYear, teamId: "ferrari", seed: `evo-${row.simYear}` });
      // The same rounds and seeds as scripts/measureEvolution.js --sim --rounds 12.
      const rounds = packs[row.simYear].calendar.map((event, index) => ({ event, index })).filter(({ event }) => dry(event.refLaps)).slice(0, 12);
      const on = [];
      const off = [];
      rounds.forEach(({ event, index }) => {
        career.round = index;
        runPractice(career, {});
        const options = { ...sessionOptions(career, "qualifying"), wetness: 0, seed: `evo-${row.simYear}-${event.round}` };
        on.push(evolutionImprovement(options).q1ToQ2Iqr);
        off.push(evolutionImprovement({ ...options, traffic: false }).q1ToQ2Iqr);
      });
      rows.push({ era, measured, on: median(on.filter((v) => v !== null)), off: median(off.filter((v) => v !== null)) });
    });
    rows.forEach(({ era, measured, on }) => {
      expect({ era, ok: Math.abs(on - measured) <= 0.12, on, measured }).toEqual({ era, ok: true, on, measured });
    });
    const error = (key) => rows.reduce((sum, row) => sum + Math.abs(row[key] - row.measured), 0) / rows.length;
    expect(error("on")).toBeLessThanOrEqual(0.07);
    expect(error("on")).toBeLessThan(error("off"));
    // Traffic adds scatter, it never takes it away on the whole.
    expect(median(rows.map((row) => row.on))).toBeGreaterThan(median(rows.map((row) => row.off)));
  });

  it("the air term is the step race's: dirty air costs in corners, the tow pays on straights, nothing past the window (RF-SIM-06)", () => {
    const { options } = setUp({ year: 2019 });
    const state = createSession(options);
    const ctx = trafficContextOf(state.circuit, state.era);
    expect(ctx).not.toBeNull();
    const lapSec = state.baseLap;
    const { tables } = ctx;
    // A trace share in a corner and one on a straight.
    const shareWhere = (inTurn) => {
      for (let k = 0; k < tables.M; k += 1) {
        const tau = (k + 0.5) / tables.M;
        if (inCorner(tables, dAt(tables, tau)) === inTurn && (!inTurn || dirtyAt(tables, tau) > 0)) return tau;
      }
      return null;
    };
    const corner = shareWhere(true);
    const straight = shareWhere(false);
    expect(airDeltaSec(ctx, { tau: corner, lapSec, gapSec: 0.3, dt: 0.5 })).toBeGreaterThan(0);
    expect(airDeltaSec(ctx, { tau: straight, lapSec, gapSec: 0.3, dt: 0.5 })).toBeLessThan(0);
    expect(airDeltaSec(ctx, { tau: corner, lapSec, gapSec: SIM_BALANCE.dirtyAir.windowSec + 0.1, dt: 0.5 })).toBe(0);
    expect(airDeltaSec(ctx, { tau: straight, lapSec, gapSec: SIM_BALANCE.slipstream.windowSec + 0.1, dt: 0.5 })).toBe(0);
    // The era's numbers: 2017-2021 cars lose more in the wake than 2022-'s (race-eras.json dirtyAir).
    expect(ctx.sim.dirtyLoss).toBe(rulesFor(state.era).dirtyAir);
    const modern = trafficContextOf(state.circuit, 2024);
    expect(modern.sim.dirtyLoss).toBeLessThan(ctx.sim.dirtyLoss);
  });

  it("impeding: met once per pair and lap, a slow car in the way of a timed lap, noted about as often as OpenF1 2023-2024 saw, never penalised while pending", () => {
    let sessions = 0;
    let noted = 0;
    let meetings = 0;
    [2023, 2024].forEach((year) => {
      for (let round = 0; round < 5; round += 1) {
        const { options } = setUp({ year, round, seed: `imp-${year}-${round}` });
        const state = createSession(options);
        for (let segment = 0; segment < state.segments.length; segment += 1) {
          runSegmentToEnd(state);
          const events = state.events.filter((event) => event.type === "impeding" && event.segment === state.segment);
          events.forEach((event) => {
            const victim = state.cars.find((car) => car.id === event.victimId);
            const lap = victim.history.find((record) => record.start <= event.t && record.end > event.t);
            expect(["push", "timed"]).toContain(lap.kind);
            const slow = state.cars.find((car) => car.id === event.carId);
            const slowLap = slow.history.find((record) => record.start <= event.t && record.end >= event.t);
            expect(slowLap && !(slowLap.flying && !slowLap.aborted)).toBe(true);
            expect(event.gapM).toBeGreaterThanOrEqual(0);
            expect(["lift", "abandon"]).toContain(event.outcome);
            expect(event.penalty).toBeNull();
            expect(event.outcome === "abandon" ? event.lossSec === null : event.lossSec >= TRAFFIC.impeding.lossSec.p25).toBe(true);
          });
          // Once per pair and lap.
          state.cars.forEach((car) => car.history.forEach((record) => expect(new Set(record.metSlow || []).size).toBe((record.metSlow || []).length)));
          meetings += events.length;
          noted += events.filter((event) => event.noted).length;
          if (segment < state.segments.length - 1) {
            nextSegment(state);
          }
        }
        sessions += 1;
      }
    });
    expect(meetings).toBeGreaterThan(0);
    const perSession = noted / sessions;
    const real = TRAFFIC.measured.openf1.qualifying.perSession;
    expect({ perSession, ok: perSession >= real * 0.4 && perSession <= real * 2 }).toEqual({ perSession, ok: true });
  });

  it("an attempt given up behind a slow car leaves no time; a lift adds its loss to the lap", () => {
    const { options } = setUp({ year: 2024, seed: "abandon" });
    const state = runSessionToEnd(createSession(options));
    const events = state.events.filter((event) => event.type === "impeding");
    const abandon = state.events.filter((event) => event.type === "abort" && event.reason === "impeding");
    expect(abandon.length).toBe(events.filter((event) => event.outcome === "abandon").length);
    expect(events.some((event) => event.outcome === "lift")).toBe(true);
  });

  it("ai.spacingSec: rival pit walls wait for a gap at the pit exit, never longer than spacingMaxHoldSec; the pit wall can read the gaps before sending its car", () => {
    const { options, career } = setUp({ year: 2024, seed: "space" });
    const state = runSessionToEnd(createSession(options));
    const held = state.events.filter((event) => event.type === "out" && event.heldSec);
    expect(held.length).toBeGreaterThan(0);
    held.forEach((event) => expect(event.heldSec).toBeLessThanOrEqual(balance.ai.spacingMaxHoldSec));
    // Nothing held with traffic off.
    const plain = runSessionToEnd(createSession({ ...options, traffic: false }));
    expect(plain.events.some((event) => event.heldSec)).toBe(false);
    // The read-only preview for the player's car.
    const live = createSession(options);
    advanceTo(live, 300);
    const user = entrantsFor(career).find((entry) => entry.isUser).id;
    const preview = exitTrafficOf(live, user);
    expect(preview).toMatchObject({ spacingSec: balance.ai.spacingSec });
    expect(preview.trackAt).toBeGreaterThan(live.clock);
    expect(JSON.stringify(sessionResult(live))).toBe(JSON.stringify(sessionResult(advanceTo(createSession(options), 300))));
  });

  it("carStatus(...).traffic names the car ahead and what it does to the lap while a timed car follows", () => {
    const { options } = setUp({ year: 2024, seed: "status" });
    const state = createSession(options);
    const followingAt = (tau) => {
      advanceTo(state, tau);
      return state.cars.map((car) => carStatus(state, car.id).traffic).find((traffic) => traffic && traffic.effect) || null;
    };
    let seen = null;
    for (let tau = 0; tau < state.segments[0].duration && !seen; tau += 0.5) seen = followingAt(tau);
    expect(seen).not.toBeNull();
    expect(typeof seen.aheadId).toBe("string");
    expect(seen.gapSec).toBeGreaterThanOrEqual(0);
    expect(["tow", "dirty", "impeded"]).toContain(seen.effect);
  });

  it("determinism: the same seed gives the same session with traffic, however the view slices time (RF-SIM-15, RNF-05)", () => {
    const { options } = setUp({ year: 2012, seed: "det" });
    // The engineers take the player's cars at the start of every segment, then the view reads in slices.
    const sliced = (slice) => {
      const state = createSession(options);
      for (let guard = 0; guard < 10 && !state.done; guard += 1) {
        state.cars.filter((car) => car.isUser && !car.eliminated).forEach((car) => command(state, "autopilot", car.id));
        while (!state.over) advanceTo(state, state.clock + slice);
        if (!state.done) nextSegment(state);
      }
      return state;
    };
    const a = sliced(7.3);
    const b = sliced(61);
    expect(a.done).toBe(true);
    expect(a.events.some((event) => event.type === "impeding")).toBe(true);
    expect(JSON.stringify(sessionResult(b))).toBe(JSON.stringify(sessionResult(a)));
    expect(JSON.stringify(b.events)).toBe(JSON.stringify(a.events));
    // And the same as the headless run to the end.
    expect(JSON.stringify(sessionResult(runSessionToEnd(createSession(options))).order)).toBe(JSON.stringify(sessionResult(a).order));
  });

  it("traffic off is the session as drawn: no meetings, no lap retimed by the car ahead", () => {
    const { options } = setUp({ year: 2019, seed: "off" });
    const state = runSessionToEnd(createSession({ ...options, traffic: false }));
    expect(state.events.some((event) => event.type === "impeding")).toBe(false);
    state.cars.forEach((car) => {
      expect(car.traffic).toBeNull();
      car.history.forEach((record) => expect(record.metSlow).toBeUndefined());
    });
    // Every era runs with traffic on (SRS §6: nothing of it is out of its era).
    [1990, 2006, 2014].filter((year) => packs[year]).forEach((year) => {
      const career = createCareer(context, { year, teamId: "ferrari", seed: `era-${year}` });
      runPractice(career, {});
      const session = runSessionToEnd(createSession({ ...sessionOptions(career, "qualifying"), entrants: entrantsFor(career), race: currentRace(career), era: eraOf(career), wetness: 0, seed: `era-${year}` }));
      expect(session.done).toBe(true);
    });
  });
});
