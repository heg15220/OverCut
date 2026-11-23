#!/usr/bin/env node
/**
 * RF-SIM-04 / RF-SIM-05: fuel and energy of the race engine by season, against the regulation and
 * the published figures cited in data/balance/race-energy.json (SIM-FISICA §7 "Energía y combustible").
 *
 *   node scripts/measureEnergy.js                         every season pack, quick figures only
 *   node scripts/measureEnergy.js --step 2016,2024        plus one step race per listed season
 *
 * Per season: the circuit fuel a lap at race pace (engine/energy.js lapFuelOf) and the race it adds up
 * to (median, min, max over the calendar, kg/km) against the era's maximum, how many circuits need the
 * cars to save (race + margin over the limit). With --step, per season one step race (first round,
 * seed "measure"): measured fuel / quick-mode model on green laps, under the safety car, on the lean
 * mix; the store's deployment and harvest a lap (mean, max) against the per-lap limits; share of
 * full-power steps clipping; run time.
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
const { circuitFor } = require(path.join(MANAGER, "engine", "venue"));
const { geometryScaleOf, lapFuelOf, maxRaceKgOf, ENERGY } = require(path.join(MANAGER, "engine", "energy"));
const kit = require(path.join(MANAGER, "engine", "sim", "simTestKit"));
const { fromQuickRace, snapshot, stepOnce } = require(path.join(MANAGER, "engine", "sim"));
/* eslint-enable global-require, import/no-dynamic-require */

const argv = process.argv.slice(2);
const stepYears = argv.includes("--step") ? argv[argv.indexOf("--step") + 1].split(",").map(Number) : [];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[sorted.length >> 1] : NaN;
};

const years = fs
  .readdirSync(SEASONS)
  .filter((name) => /^\d{4}\.json$/.test(name))
  .map((name) => Number(name.slice(0, 4)))
  .sort((a, b) => a - b);

console.log("season  max kg  race kg median [min-max]  kg/km  circuits that must save");
years.forEach((year) => {
  const pack = JSON.parse(fs.readFileSync(path.join(SEASONS, `${year}.json`), "utf8"));
  const max = maxRaceKgOf(year);
  const rows = pack.calendar.map((race) => {
    const circuit = circuitFor({ ...race, circuit: race.circuitId }, year);
    // Race pace ~ 1.07 x the trace (qualifying) lap, as the packs' fastest race laps sit on the poles.
    const lap = race.refLaps?.fastestRaceLap || (circuit.simulatedLap || 90) * 1.07;
    const kg = lapFuelOf(circuit, year, lap).kg * geometryScaleOf(circuit, race.lengthKm);
    return { id: race.circuitId, race: kg * race.laps, km: race.distanceKm || race.laps * race.lengthKm, need: kg * (race.laps + ENERGY.fuel.margin) };
  });
  const races = rows.map((row) => row.race);
  const save = max === null ? [] : rows.filter((row) => row.need > max).map((row) => `${row.id} ${((row.need / max - 1) * 100).toFixed(0)}%`);
  console.log(
    `${year}  ${max === null ? "  -  " : max.toFixed(0).padStart(5)}  ${median(races).toFixed(0).padStart(4)} [${Math.min(...races).toFixed(0)}-${Math.max(...races).toFixed(0)}]  ${median(rows.map((row) => row.race / row.km)).toFixed(3)}  ${save.length}${save.length ? `: ${save.join(", ")}` : ""}`,
  );
});

if (!stepYears.length) process.exit(0);

(async () => {
  const context = await kit.packContext();
  console.log("\nstep race: fuel measured/model (green, SC, lean) | store MJ a lap deploy mean/max, harvest mean/max | clipping share of full-power steps | ms");
  stepYears.forEach((year) => {
    const { make, race } = kit.weekend({ year, teamId: "williams", seed: "measure", context });
    const state = fromQuickRace(make(), { race });
    const t0 = Date.now();
    let full = 0;
    let clip = 0;
    let guard = 0;
    while (!state.finished && guard < 200000) {
      stepOnce(state);
      guard += 1;
      snapshot(state).forEach((shot) => {
        if (!shot.energy || shot.throttle < 0.999) return;
        full += 1;
        if (shot.energy.clipping) clip += 1;
      });
    }
    const ms = Date.now() - t0;
    const spells = state.safetyCarSpells || [];
    const sums = { green: [0, 0], sc: [0, 0], lean: [0, 0] };
    const ers = [];
    state.cars.forEach((car) =>
      car.history.forEach((entry, k) => {
        if (!entry.fuel || entry.lap < 2 || entry.pit || car.history[k - 1]?.pit || !(entry.fuel.model > 0)) return;
        const underSc = spells.some((spell) => spell.from < entry.end && (spell.to ?? Infinity) > entry.start);
        const bucket = underSc ? "sc" : "green";
        sums[bucket][0] += entry.fuel.kg;
        sums[bucket][1] += entry.fuel.model;
        if (entry.ers && !underSc) ers.push(entry.ers);
      }),
    );
    const ratio = (key) => (sums[key][1] > 0 ? (sums[key][0] / sums[key][1]).toFixed(3) : "  -  ");
    const stat = (key) => (ers.length ? `${(ers.reduce((s, e) => s + e[key], 0) / ers.length).toFixed(2)}/${Math.max(...ers.map((e) => e[key])).toFixed(2)}` : "-");
    console.log(`${year} ${race.name}: fuel ${ratio("green")} green, ${ratio("sc")} SC | deploy ${stat("deploy")} harvest ${stat("harvest")} | clipping ${full ? ((100 * clip) / full).toFixed(1) : "-"} % | ${ms} ms`);
  });
})();
