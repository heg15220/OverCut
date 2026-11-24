#!/usr/bin/env node
/**
 * evolucion-q (docs/manager/F1M24-GAMEPLAY.md §2.12.3, §3.1; RF-WKD-02, RF-SIM-11, RNF-07): how much
 * the top ten improve from Q1 to Q2 and Q3 in real knockout qualifying, by era, against the
 * playable session (engine/sessionSim) with data/balance/sessions.json `evolution.byEra`.
 *
 *   node scripts/measureEvolution.js --f1db path/to/f1db.db          measure f1db, print `measured`
 *   node scripts/measureEvolution.js --sim [--rounds 6]               simulate with the current balance
 *   node scripts/measureEvolution.js --f1db path/to/f1db.db --sim     both, side by side
 *
 * Measure. For every KNOCKOUT qualifying of f1db (2006-, `qualifying_result` q1/q2/q3) on a dry
 * day - the pack's refLaps rule (pole not slower than the fastest race lap x pack-world.json
 * refLaps.wetPoleRatio) - the median over the cars that reached Q3 of (Q1 - Q3) and (Q1 - Q2),
 * in seconds; then the median of those per race over the era rows of sessions.json
 * `evolution.byEra`. What it measures is everything the field gains between segments (rubber,
 * track temperature, the effort and fuel each team saves for later), not the rubber alone.
 * f1db has no wet flag: a dry pole can still hide a session that dried or got wetter between
 * segments, so the median (not the mean) is reported. Under race-fuel Q3 (2006-2009) Q3 is
 * slower than Q2 and the number is negative.
 *
 * Simulate. Each era's `simYear` pack, its first `rounds` dry rounds, one playable qualifying
 * each (seed `evo-<year>-<round>`), the same statistic.
 *
 * No personal data, no network: f1db is a local file (CC BY 4.0, release in the pack's sources).
 */

const fs = require("fs");
const path = require("path");

const FRONTEND = path.resolve(__dirname, "..");
const MODULES = path.join(FRONTEND, "src", "modules");
const MANAGER = path.join(MODULES, "overcutManager");
const SEASONS = path.join(MANAGER, "data", "seasons");
const S = require(path.join(MANAGER, "data", "balance", "sessions.json"));
const PW = require(path.join(MANAGER, "data", "balance", "pack-world.json"));

const args = { f1db: null, sim: false, rounds: 6 };
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const flag = argv[index];
  const next = () => argv[++index]; // eslint-disable-line no-plusplus
  if (flag === "--f1db") args.f1db = next();
  else if (flag === "--sim") args.sim = true;
  else if (flag === "--rounds") args.rounds = Number(next());
  else throw new Error(`unknown flag ${flag}`);
}
if (!args.f1db && !args.sim) throw new Error("give --f1db path and/or --sim");

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const round3 = (value) => (value === null ? null : Math.round(value * 1000) / 1000);
const eraRowOf = (year) => S.evolution.byEra.find((row) => year >= row.from && year <= row.to) || null;

const packCache = {};
const packOf = (year) => {
  if (!(year in packCache)) {
    const file = path.join(SEASONS, `${year}.json`);
    packCache[year] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  }
  return packCache[year];
};
const isDry = (refLaps) => Boolean(refLaps?.pole && refLaps?.fastestRaceLap && refLaps.pole <= refLaps.fastestRaceLap * PW.refLaps.wetPoleRatio);

/** f1db: per era, the median over dry races of each race's top-ten median Q1-Q3 and Q1-Q2. */
const measure = (file) => {
  // eslint-disable-next-line global-require
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(file, { readOnly: true });
  const races = db.prepare("select id, year, round from race where qualifying_format = 'KNOCKOUT' and year >= 2006 order by year, round").all();
  const rows = db.prepare("select q1_millis, q2_millis, q3_millis from qualifying_result where race_id = ?");
  const byEra = {};
  races.forEach((race) => {
    const row = eraRowOf(race.year);
    if (!row) return;
    // The dry rule needs the pack's refLaps; a year without a pack is skipped.
    const event = packOf(race.year)?.calendar.find((item) => item.round === race.round);
    if (!event || !isDry(event.refLaps)) return;
    const cars = rows.all(race.id).filter((car) => car.q1_millis && car.q3_millis);
    if (cars.length < 6) return;
    const q3 = median(cars.map((car) => (car.q1_millis - car.q3_millis) / 1000));
    const q2 = median(cars.filter((car) => car.q2_millis).map((car) => (car.q1_millis - car.q2_millis) / 1000));
    const key = `${row.from}-${row.to}`;
    (byEra[key] = byEra[key] || { q3: [], q2: [] }).q3.push(q3);
    byEra[key].q2.push(q2);
  });
  return Object.fromEntries(Object.entries(byEra).map(([key, v]) => [key, { q1ToQ3: round3(median(v.q3)), q1ToQ2: round3(median(v.q2)), races: v.q3.length }]));
};

/** The playable session with the current balance, the same statistic. */
const simulate = () => {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  require(path.join(FRONTEND, "node_modules", "sucrase", "register"));
  /* eslint-disable global-require, import/no-dynamic-require */
  const { fallbackBootstrap } = require(path.join(MODULES, "overcutTrayectoria", "data", "fallbackBootstrap"));
  const { reference } = require(path.join(MANAGER, "data", "reference"));
  const career = require(path.join(MANAGER, "engine", "career"));
  const { evolutionImprovement } = require(path.join(MANAGER, "engine", "sessionSim", "session"));
  /* eslint-enable global-require, import/no-dynamic-require */
  const years = S.evolution.byEra.map((row) => row.simYear).filter((year) => packOf(year));
  const packs = Object.fromEntries(years.map((year) => [year, packOf(year)]));
  const context = career.createContext(fallbackBootstrap, reference, packs);
  const out = {};
  S.evolution.byEra.forEach((row) => {
    if (!packs[row.simYear]) return;
    const c = career.createCareer(context, { year: row.simYear, teamId: "ferrari", seed: `evo-${row.simYear}` });
    const dry = packs[row.simYear].calendar.map((event, index) => ({ event, index })).filter(({ event }) => isDry(event.refLaps)).slice(0, args.rounds);
    const q3 = [];
    const q2 = [];
    dry.forEach(({ event, index }) => {
      c.round = index;
      career.runPractice(c, {});
      // The weekend's own session arguments (race fuel of each rival where the era has it), on a dry track.
      const r = evolutionImprovement({ ...career.sessionOptions(c, "qualifying"), wetness: 0, seed: `evo-${row.simYear}-${event.round}` });
      if (r.q1ToQ3 !== null) q3.push(r.q1ToQ3);
      if (r.q1ToQ2 !== null) q2.push(r.q1ToQ2);
    });
    out[`${row.from}-${row.to}`] = { simYear: row.simYear, q1ToQ3: round3(median(q3)), q1ToQ2: round3(median(q2)), races: q3.length };
  });
  return out;
};

const result = {};
if (args.f1db) result.measured = measure(args.f1db);
if (args.sim) result.simulated = simulate();
process.stdout.write(`${JSON.stringify(result, null, 1)}\n`);
