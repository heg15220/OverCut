#!/usr/bin/env node
/**
 * RF-SIM-11 / RF-SIM-03: the weather and the wet track of the race engine against real data
 * (data/balance/race-weather.json `measured`).
 *
 *   node scripts/measureWeather.js                    climate: wet-tyre races 2023-2025, 40 seeds
 *   node scripts/measureWeather.js --seeds 100 --years 2023,2024,2025
 *   node scripts/measureWeather.js --races 3          also run whole quick and step races in the rain
 *
 * 1. Usage. For every Grand Prix of the given seasons and `seeds` seeds, the race's weather
 *    (engine/weather weatherTimeline on the season pack's calendar) is drawn; a race "uses wet
 *    tyres" when its line ever reaches the slick/inter crossover. Against OpenF1: 8 of the 70
 *    races of 2023-2025 had a car on intermediates or wets (measured.usage).
 * 2. Drying. The water model from the real wet starting points to the slick crossover, against
 *    the drying minutes of measured.openf1.drying.
 * 3. Races (--races N): N quick and N step races started in light rain at Silverstone 2024: the
 *    median lap of inters and wets against the dry race pace, the lap the first slick comes on
 *    when the line dries, and each mode's time per race (RNF-01).
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
const { runToFinish, createRace } = require(path.join(MANAGER, "engine", "race"));
const { fromQuickRace, runStepToFinish } = require(path.join(MANAGER, "engine", "sim"));
const weather = require(path.join(MANAGER, "engine", "weather"));
const W = require(path.join(MANAGER, "data", "balance", "race-weather.json"));
/* eslint-enable global-require, import/no-dynamic-require */

const args = { seeds: 40, years: [2023, 2024, 2025], races: 0 };
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const flag = argv[index];
  const next = () => argv[++index]; // eslint-disable-line no-plusplus
  if (flag === "--seeds") args.seeds = Number(next());
  else if (flag === "--years") args.years = next().split(",").map(Number);
  else if (flag === "--races") args.races = Number(next());
  else throw new Error(`unknown flag ${flag}`);
}

const packs = {};
[...new Set([...args.years, 2024])].forEach((year) => {
  packs[year] = JSON.parse(fs.readFileSync(path.join(SEASONS, `${year}.json`), "utf8"));
});
const context = career.createContext(fallbackBootstrap, reference, packs);
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : NaN;
};

// 1. usage
let races = 0;
let wet = 0;
const byRace = [];
args.years.forEach((year) => {
  const world = career.seasonWorld(context, year, "probe");
  world.races.forEach((race) => {
    let n = 0;
    for (let s = 0; s < args.seeds; s += 1) {
      const t = weather.weatherTimeline({ race, laps: race.laps, seed: `wx-${year}-${race.round}-${s}`, cars: 20 });
      if (t.wetness.some((value) => value >= W.wetness.atSlickInter)) n += 1;
    }
    races += args.seeds;
    wet += n;
    byRace.push({ year, name: race.name, share: n / args.seeds, climate: weather.climateFor(race).key });
  });
});
const real = W.measured.usage.wetTyreRaces / W.measured.usage.races;
console.log(`1. races with wet tyres ${args.years.join(",")}: sim ${(100 * wet / races).toFixed(1)} % (${races} draws), real ${(100 * real).toFixed(1)} % (${W.measured.usage.wetTyreRaces}/${W.measured.usage.races}, OpenF1); ratio ${(wet / races / real).toFixed(2)}`);
byRace.sort((a, b) => b.share - a.share).slice(0, 8).forEach((row) => console.log(`   ${row.year} ${row.name.padEnd(16)} ${(100 * row.share).toFixed(0)} %  (${row.climate})`));

// 2. drying
const dryTo = (from, to, trackC) => {
  let h = from;
  let minutes = 0;
  while (h > to && minutes < 600) {
    h = weather.waterStep(h, { rain: 0, trackC, cars: 20, minutes: 0.5 });
    minutes += 0.5;
  }
  return minutes;
};
const ratioToDepth = (compound, ratio) => {
  let lo = 0;
  let hi = 3;
  for (let k = 0; k < 60; k += 1) {
    const mid = (lo + hi) / 2;
    if (weather.gripRatio(compound, mid) < ratio) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
console.log("2. drying with 20 cars (sim minutes / real minutes):");
W.measured.openf1.drying.forEach((row) => {
  const compound = row.compound === "slick" ? "soft" : row.compound;
  // toCrossover: the drying ended where slicks took over (the slick/inter crossover depth).
  const sim = dryTo(ratioToDepth(compound, row.from), row.toCrossover ? weather.SLICK_INTER_MM : ratioToDepth(compound, row.to), 25);
  console.log(`   ${row.race} laps ${row.laps} ${row.compound} ${row.from} -> ${row.to}: ${sim.toFixed(1)} / ${row.minutes} (${(sim / row.minutes).toFixed(2)})`);
});

// 3. whole races
if (args.races > 0) {
  const c = career.createCareer(context, { year: 2024, seed: "wx-race", mode: "strict", spectator: true, teamId: Object.keys(career.seasonWorld(context, 2024, "probe").teams)[0] });
  c.round = c.world.races.findIndex((race) => race.packCircuitId === "silverstone");
  career.startWeekend(c);
  career.runPractice(c, {});
  career.runQualifyingSession(c, {});
  const base = career.weekendRaceArgs(c);
  const summary = { quick: { inter: [], wet: [], firstSlick: [], ms: [] }, step: { inter: [], wet: [], firstSlick: [], ms: [] } };
  for (let r = 0; r < args.races; r += 1) {
    const raceArgs = { ...base, seed: `${base.seed}::wet${r}`, weatherStart: 4 };
    ["quick", "step"].forEach((mode) => {
      const t0 = Date.now();
      const state = mode === "quick" ? runToFinish(createRace(raceArgs)) : runStepToFinish(fromQuickRace(createRace(raceArgs), { race: base.race }));
      summary[mode].ms.push(Date.now() - t0);
      const baseLap = state.race.baseLap;
      state.cars.forEach((car) => {
        let compound = car.compoundsUsed[0];
        car.history.forEach((entry, k) => {
          if (entry.pit) compound = null;
          if (entry.retired || entry.pit || entry.lap < 3 || (k > 0 && car.history[k - 1].pit)) return;
          const tyre = car.history[k].compound || compound;
          const time = (entry.end - entry.start) / baseLap;
          if (tyre === "inter") summary[mode].inter.push(time);
          if (tyre === "wet") summary[mode].wet.push(time);
        });
      });
      const slickLaps = state.events.filter((event) => event.type === "pit" && event.compound && !["inter", "wet"].includes(event.compound)).map((event) => event.lap);
      if (slickLaps.length) summary[mode].firstSlick.push(Math.min(...slickLaps));
    });
  }
  ["quick", "step"].forEach((mode) => {
    const s = summary[mode];
    console.log(`3. ${mode}: inter laps ${median(s.inter).toFixed(3)} x dry pace (${s.inter.length}), wet ${s.wet.length ? median(s.wet).toFixed(3) : "-"} (${s.wet.length}); first slick stop lap median ${median(s.firstSlick)}; ${median(s.ms)} ms/race`);
  });
}
