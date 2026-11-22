/**
 * Quick mode byte-identity (RF-SIM-15, RNF-05) across the race.js refactor that split
 * stepLap into exported per-car pieces for the step simulator (SRS 4.2: "el modo rápido
 * usa el mismo modelo").
 *
 * The golden file (a SHA-256 of each race's full fingerprint, plus its classification
 * for a readable diff) was written from race.js *before* the refactor (commit 7c96164b) with
 * `WRITE_GOLDEN=1`; every later race.js must reproduce it exactly: classification,
 * events, radio, fastest lap and every car's line crossings, for several eras and seeds,
 * with player orders mid-race and with race control turned up (red flags, penalties).
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { eraProfileFor } from "../../overcutTrayectoria/engine/eras";
import { reference } from "../data/reference";
import { createCareer, createContext, createWeekendRace, currentRace, entrantsFor, runPractice, runQualifyingSession, seasonWorld } from "./career";
import { classificationOf, createRace, requestPit, runToFinish, setErs, setMix, setMode, setTeamOrder, stepLap } from "./race";
import { raceBalance } from "./rules";
import { loadSeasonPack, seasonPackYears } from "./packs/seasonPacks";

const GOLDEN = path.join(__dirname, "__fixtures__", "quickRace.golden.json");
const FIELDED = [1976, 1988, 1998, 2005, 2008, 2012, 2016, 2024];
const YEARS = [1976, 1988, 1994, 2005, 2008, 2009, 2010, 2012, 2015, 2021, 2024, 2026];

let context = null;
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  const packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

/** Same set-up as rules.test.js startRace: a fielded weekend, raced under `year`'s rules. */
const startRace = (year, seed) => {
  const base = FIELDED.reduce((best, candidate) => (Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best), FIELDED[0]);
  const world = seasonWorld(context, base, seed);
  const teamId = world.order.find((id) => !world.teams[id].partial);
  const career = createCareer(context, { year: base, teamId, seed });
  runPractice(career, {});
  runQualifyingSession(career, {});
  if (base === year) return createWeekendRace(career);
  const entrants = entrantsFor(career);
  return createRace({ race: currentRace(career), era: eraProfileFor(year), year, entrants, grid: career.weekend.qualifying.order.filter((id) => entrants.some((entrant) => entrant.id === id)), seed });
};

const fingerprint = (state) =>
  JSON.parse(
    JSON.stringify(
      {
        rows: classificationOf(state),
        events: state.events,
        radio: state.radio,
        fastest: state.fastestLap,
        history: state.cars.map((car) => [car.id, car.time, car.stops, car.compoundsUsed, car.history.map((entry) => [entry.lap, entry.start, entry.end, entry.pit, entry.compound])]),
      },
    ),
  );

/** A race with the player at the pit wall: pace, mix, battery, a pit call and a team order. */
const withOrders = (state) => {
  const mine = state.cars.filter((car) => car.isUser);
  for (let lap = 0; lap < 8; lap += 1) stepLap(state);
  mine.forEach((car) => {
    setMode(state, car.id, "push");
    setMix(state, car.id, "rich");
    setErs(state, car.id, "deploy");
  });
  for (let lap = 0; lap < 6; lap += 1) stepLap(state);
  if (mine[0]) requestPit(state, mine[0].id, state.cars.find((car) => car.id === mine[0].id).compound);
  if (mine[0]) setTeamOrder(state, mine[0].teamId, "swap");
  return runToFinish(state);
};

const hot = (fn) => {
  const { offences } = raceBalance.penalties;
  const saved = JSON.parse(JSON.stringify({ offences, red: raceBalance.raceControl.redFlag }));
  offences.jumpStart.chancePerCar = 0.3;
  offences.collision.investigate = 1;
  offences.collision.guilty = 1;
  offences.pitSpeeding.chancePerStop = 0.2;
  offences.unsafeRelease.chancePerStop = 0.2;
  raceBalance.raceControl.redFlag.crashChance = 0.6;
  try {
    return fn();
  } finally {
    Object.keys(saved.offences).forEach((key) => Object.assign(offences[key], saved.offences[key]));
    Object.assign(raceBalance.raceControl.redFlag, saved.red);
  }
};

/** What the golden file keeps per race: a SHA-256 of the whole fingerprint, the event types seen and the classification. */
const digest = (print) => ({
  sha256: crypto.createHash("sha256").update(JSON.stringify(print)).digest("hex"),
  types: [...new Set(print.events.map((event) => event.type))].sort(),
  rows: print.rows.map((row) => [row.id, row.status, row.gap, row.stops, row.penalty]),
});

const runAll = () => {
  const out = {};
  YEARS.forEach((year) => {
    ["g1", "g2"].forEach((seed) => {
      out[`${year}:${seed}`] = digest(fingerprint(runToFinish(startRace(year, `golden-${year}-${seed}`))));
    });
    out[`${year}:orders`] = digest(fingerprint(withOrders(startRace(year, `golden-${year}-orders`))));
    out[`${year}:hot`] = hot(() => digest(fingerprint(runToFinish(startRace(year, `golden-${year}-hot`)))));
  });
  return out;
};

describe("RNF-05 quick mode is byte-identical across the race.js refactor", () => {
  it("reproduces the golden races of race.js before the refactor", () => {
    const now = runAll();
    if (process.env.WRITE_GOLDEN) {
      fs.mkdirSync(path.dirname(GOLDEN), { recursive: true });
      fs.writeFileSync(GOLDEN, `${JSON.stringify(now, null, 1)}
`);
    }
    const golden = JSON.parse(fs.readFileSync(GOLDEN, "utf8"));
    expect(Object.keys(now).sort()).toEqual(Object.keys(golden).sort());
    Object.keys(golden).forEach((key) => {
      expect({ key, race: now[key] }).toEqual({ key, race: golden[key] });
    });
    // And not trivially: the set covers red flags, penalties, SC and stops.
    const types = new Set(Object.values(golden).flatMap((race) => race.types));
    ["red", "restart", "penalty", "penalty-served", "pit", "pass", "dnf", "sc"].forEach((type) => expect(types.has(type)).toBe(true));
  });
});
