#!/usr/bin/env node
/**
 * RF-SIM-09 / RF-SIM-14 / RF-SIM-10: retirement and incident rates of the race engine by era,
 * against the real ones from f1db (data/balance/race-reliability.json `measured`).
 *
 *   node scripts/measureIncidents.js                      quick mode, 2 seasons per era
 *   node scripts/measureIncidents.js --mode step --seasons 1
 *   node scripts/measureIncidents.js --years 2012,2024 --seasons 3
 *   node scripts/measureIncidents.js --json out.json
 *
 * Each season is a spectator career (all teams rivals, strict mode) whose weekends run in
 * the chosen mode; every race is counted: starters, mechanical retirements per car-race by
 * component, accidents/collisions/punctures in the opening laps (retired on lap 1 or 2, the
 * f1db race_result laps = 0/1) and later, races with an opening-lap incident retirement,
 * safety cars, VSCs and red flags per race. Prints a table sim / real / ratio.
 */

const fs = require("fs");
const path = require("path");

const FRONTEND = path.resolve(__dirname, "..");
const MODULES = path.join(FRONTEND, "src", "modules");
const MANAGER = path.join(MODULES, "overcutManager");
const SEASONS = path.join(MANAGER, "data", "seasons");

// eslint-disable-next-line import/no-extraneous-dependencies
require(path.join(FRONTEND, "node_modules", "sucrase", "register"));
/* eslint-disable global-require, import/no-dynamic-require */
const { fallbackBootstrap } = require(path.join(MODULES, "overcutTrayectoria", "data", "fallbackBootstrap"));
const { reference } = require(path.join(MANAGER, "data", "reference"));
const career = require(path.join(MANAGER, "engine", "career"));
const { runToFinish } = require(path.join(MANAGER, "engine", "race"));
const { createStepRace, runStepToFinish } = require(path.join(MANAGER, "engine", "sim"));
const RELIABILITY = require(path.join(MANAGER, "data", "balance", "race-reliability.json"));
/* eslint-enable global-require, import/no-dynamic-require */

const args = { mode: "quick", seasons: 2, years: null, json: null, rounds: 0 };
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const flag = argv[index];
  const next = () => argv[++index]; // eslint-disable-line no-plusplus
  if (flag === "--mode") args.mode = next();
  else if (flag === "--seasons") args.seasons = Number(next());
  else if (flag === "--years") args.years = next().split(",").map(Number);
  else if (flag === "--json") args.json = next();
  else if (flag === "--rounds") args.rounds = Number(next());
  else throw new Error(`unknown flag ${flag}`);
}

const packYears = fs.readdirSync(SEASONS).map((file) => /^(\d{4})\.json$/.exec(file)).filter(Boolean).map((m) => Number(m[1]));
const eras = RELIABILITY.measured.eras;
const eraOfYear = (year) => eras.find((era) => year >= era.years[0] && year <= era.years[1]);
const years = args.years || packYears;

const packs = {};
years.forEach((year) => {
  packs[year] = JSON.parse(fs.readFileSync(path.join(SEASONS, `${year}.json`), "utf8"));
});
const context = career.createContext(fallbackBootstrap, reference, packs);

const blank = () => ({ races: 0, starts: 0, mech: {}, mechTotal: 0, inc: { accident: { opening: 0, later: 0 }, collision: { opening: 0, later: 0 }, puncture: { opening: 0, later: 0 } }, racesOpening: 0, opening: 0, sc: 0, vsc: 0, red: 0, contacts: 0, ms: 0 });
const byEra = {};

const count = (acc, state) => {
  acc.races += 1;
  acc.starts += state.cars.length;
  let opening = 0;
  state.cars.forEach((car) => {
    if (car.status !== "retired") return;
    const reason = car.retireReason;
    if (reason === "mechanical") {
      const comp = car.failedComponent || "unknown";
      acc.mech[comp] = (acc.mech[comp] || 0) + 1;
      acc.mechTotal += 1;
      return;
    }
    const kind = reason === "collision" ? "collision" : reason === "puncture" ? "puncture" : reason === "accident" ? "accident" : null;
    if (!kind) return;
    const early = car.retiredLap <= 2;
    acc.inc[kind][early ? "opening" : "later"] += 1;
    if (early) opening += 1;
  });
  acc.opening += opening;
  if (opening > 0) acc.racesOpening += 1;
  state.events.forEach((event) => {
    if (event.type === "sc") acc.sc += 1;
    else if (event.type === "vsc") acc.vsc += 1;
    else if (event.type === "red" || event.type === "red-flag") acc.red += 1;
    else if (event.type === "contact") acc.contacts += 1;
  });
};

const began = Date.now();
years.forEach((year) => {
  const era = eraOfYear(year);
  const key = `${era.years[0]}-${era.years[1]}`;
  byEra[key] = byEra[key] || blank();
  for (let s = 0; s < args.seasons; s += 1) {
    const c = career.createCareer(context, { year, seed: `inc-${year}-${s}`, mode: "strict", spectator: true, teamId: Object.keys(career.seasonWorld(context, year, "probe").teams)[0] });
    let guard = 0;
    while (c.round < c.world.races.length && guard < 64 && (!args.rounds || guard < args.rounds)) {
      guard += 1;
      career.startWeekend(c);
      if (!c.weekend.practice) career.runPractice(c, {});
      if (!c.weekend.qualifying) career.runQualifyingSession(c, {});
      const raceArgs = career.weekendRaceArgs(c);
      const t0 = Date.now();
      let state;
      if (args.mode === "step") {
        state = createStepRace(raceArgs);
        runStepToFinish(state);
      } else {
        state = career.createWeekendRace(c);
        runToFinish(state);
      }
      byEra[key].ms += Date.now() - t0;
      count(byEra[key], state);
      career.completeRace(c, state);
      career.closeWeekend(c);
    }
  }
});

const f = (v, d = 4) => (Number.isFinite(v) ? v.toFixed(d) : "-");
const ratio = (sim, real) => (real > 0 ? f(sim / real, 2) : "-");
const out = {};
Object.entries(byEra).forEach(([key, acc]) => {
  const real = eras.find((era) => `${era.years[0]}-${era.years[1]}` === key);
  const per = (n) => n / Math.max(1, acc.starts);
  const sim = {
    races: acc.races,
    mechanicalPerCarRace: per(acc.mechTotal),
    mechanicalByGroup: Object.fromEntries(Object.entries(acc.mech).map(([k, v]) => [k, per(v)])),
    accidentOpening: per(acc.inc.accident.opening),
    accidentLater: per(acc.inc.accident.later),
    collisionOpening: per(acc.inc.collision.opening),
    collisionLater: per(acc.inc.collision.later),
    punctureLater: per(acc.inc.puncture.later + acc.inc.puncture.opening),
    openingPerRace: acc.opening / acc.races,
    racesWithOpening: acc.racesOpening / acc.races,
    scPerRace: acc.sc / acc.races,
    vscPerRace: acc.vsc / acc.races,
    redPerRace: acc.red / acc.races,
    contactsPerRace: acc.contacts / acc.races,
    msPerRace: acc.ms / acc.races,
  };
  out[key] = sim;
  const ri = real.incidentsPerCarRace;
  const rows = [
    ["mechanical / car-race", sim.mechanicalPerCarRace, real.mechanicalPerCarRace],
    ["accident later", sim.accidentLater, ri.accident.later],
    ["collision later", sim.collisionLater, ri.collision.later],
    ["accident+collision later", sim.accidentLater + sim.collisionLater, ri.accident.later + ri.collision.later],
    ["opening (laps 0/1) per race", sim.openingPerRace, real.openingIncidentRetirementsPerRace],
    ["races with opening incident", sim.racesWithOpening, real.racesWithOpeningIncidentRetirement],
    ["puncture", sim.punctureLater, ri.puncture.later + ri.puncture.opening],
  ];
  console.log(`\n== ${key} (${acc.races} races, ${args.mode}, ${f(sim.msPerRace, 0)} ms/race) SC ${f(sim.scPerRace, 2)} VSC ${f(sim.vscPerRace, 2)} red ${f(sim.redPerRace, 2)} contacts ${f(sim.contactsPerRace, 2)}`);
  rows.forEach(([label, s, r]) => console.log(`  ${label.padEnd(30)} sim ${f(s)}  real ${f(r)}  ratio ${ratio(s, r)}`));
  const groups = Object.keys(real.mechanicalByGroup);
  console.log(`  by group: ${groups.map((g) => `${g} ${f(sim.mechanicalByGroup[g] || 0, 3)}/${f(real.mechanicalByGroup[g], 3)}`).join("  ")}${sim.mechanicalByGroup.unknown ? `  unknown ${f(sim.mechanicalByGroup.unknown, 3)}` : ""}`);
});
console.log(`\n${((Date.now() - began) / 1000).toFixed(1)} s`);
if (args.json) fs.writeFileSync(args.json, JSON.stringify(out, null, 1));
