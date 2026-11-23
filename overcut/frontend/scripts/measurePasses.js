#!/usr/bin/env node
/**
 * RF-SIM-07 / RF-STF-02: position changes per race of the race engine, by era and circuit type,
 * against the real ones from f1db (data/balance/driver-attributes.json `measured.passes`,
 * written by overcut/src/main/resources/scripts/driver_attributes.py --write-measured).
 *
 *   node scripts/measurePasses.js                      quick mode, 1 season per pack
 *   node scripts/measurePasses.js --mode step --years 2005,2012,2024
 *   node scripts/measurePasses.js --seasons 2 --json out.json
 *
 * The measure is the same on both sides: the number of pairs of classified cars whose order at
 * the flag is the reverse of their order on the grid, as a share of all pairs (net position
 * changes, independent of how many finished; f1db has no lap chart, so on-track overtakes cannot
 * be counted for every era). Also printed: the sim's pass
 * events per race (on-track passes, the step mode's switchbacks apart).
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
const DRIVERS = require(path.join(MANAGER, "data", "balance", "driver-attributes.json"));
/* eslint-enable global-require, import/no-dynamic-require */

const args = { mode: "quick", seasons: 1, years: null, json: null, rounds: 0 };
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
const eras = DRIVERS.derivation.passEras;
const eraKey = (year) => {
  const era = eras.find(([from, to]) => year >= from && year <= to);
  return era ? `${era[0]}-${era[1]}` : null;
};
const years = args.years || packYears;
const packs = {};
years.forEach((year) => {
  packs[year] = JSON.parse(fs.readFileSync(path.join(SEASONS, `${year}.json`), "utf8"));
});
const context = career.createContext(fallbackBootstrap, reference, packs);

/** Pairs of classified cars in reverse order at the flag against the grid. */
const inversions = (state) => {
  const classified = state.cars.filter((car) => car.status === "finished" && car.grid);
  let count = 0;
  for (let a = 0; a < classified.length; a += 1) {
    for (let b = a + 1; b < classified.length; b += 1) {
      if ((classified[a].grid - classified[b].grid) * (classified[a].position - classified[b].position) < 0) count += 1;
    }
  }
  return { count, classified: classified.length };
};

const acc = {};
const began = Date.now();
years.forEach((year) => {
  for (let s = 0; s < args.seasons; s += 1) {
    const c = career.createCareer(context, { year, seed: `pass-${year}-${s}`, mode: "strict", spectator: true, teamId: Object.keys(career.seasonWorld(context, year, "probe").teams)[0] });
    let guard = 0;
    while (c.round < c.world.races.length && guard < 64 && (!args.rounds || guard < args.rounds)) {
      guard += 1;
      career.startWeekend(c);
      if (!c.weekend.practice) career.runPractice(c, {});
      if (!c.weekend.qualifying) career.runQualifyingSession(c, {});
      const race = c.world.races[c.round];
      let state;
      if (args.mode === "step") {
        state = createStepRace(career.weekendRaceArgs(c));
        runStepToFinish(state);
      } else {
        state = career.createWeekendRace(c);
        runToFinish(state);
      }
      const key = `${eraKey(year)}|${race.circuitType || "RACE"}`;
      const row = (acc[key] = acc[key] || { races: 0, inversions: 0, classified: 0, pairs: 0, passes: 0 });
      const inv = inversions(state);
      row.races += 1;
      row.inversions += inv.count;
      row.classified += inv.classified;
      row.pairs += (inv.classified * (inv.classified - 1)) / 2;
      row.passes += state.events.filter((event) => event.type === "pass" && !event.switchback).length;
      career.completeRace(c, state);
      career.closeWeekend(c);
    }
  }
});

const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "-");
const out = {};
console.log(`mode ${args.mode}: era | type | races | inverted share of pairs sim / real (ratio) | inversions per race sim / real | classified sim / real | passes/race`);
Object.keys(acc)
  .sort()
  .forEach((key) => {
    const [era, type] = key.split("|");
    const row = acc[key];
    const real = DRIVERS.measured.passes.find((entry) => entry.era === era && entry.circuitType === type);
    const sim = { races: row.races, inversionShare: row.inversions / Math.max(1, row.pairs), inversionsPerRace: row.inversions / row.races, classifiedPerRace: row.classified / row.races, passesPerRace: row.passes / row.races };
    out[key] = { sim, real: real || null, ratio: real ? sim.inversionShare / real.inversionShare : null };
    console.log(
      `${era} | ${type.padEnd(6)} | ${String(row.races).padStart(4)} | ${f(sim.inversionShare, 3)} / ${real ? f(real.inversionShare, 3) : "-"} (${real ? f(out[key].ratio) : "-"}) | ${f(sim.inversionsPerRace)} / ${real ? f(real.inversionsPerRace) : "-"} | ${f(sim.classifiedPerRace)} / ${real ? f(real.classifiedPerRace) : "-"} | ${f(sim.passesPerRace, 1)}`,
    );
  });
console.log(`${((Date.now() - began) / 1000).toFixed(1)} s`);
if (args.json) fs.writeFileSync(args.json, JSON.stringify(out, null, 1));
