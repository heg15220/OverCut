#!/usr/bin/env node
/**
 * Criterio 7.2 (SRS 7.2, phase 5): N strict-mode spectator seasons per season pack,
 * in parallel worker threads, and a report of champions and Spearman correlations.
 *
 *   node scripts/validateSeasons.js                 200 runs per season pack, all packs
 *   node scripts/validateSeasons.js --full          1,000 runs per season (the criterion)
 *   node scripts/validateSeasons.js --years 2005,2012 --runs 300 --workers 8
 *   node scripts/validateSeasons.js --mode free     the same in Libre mode (RF-CAR-05)
 *   node scripts/validateSeasons.js --set anchors.guidance.strength=0.5 --out <dir>
 *                                                   try a balance value without editing data
 *                                                   (anchors = historical-anchors.json,
 *                                                   packWorld = pack-world.json)
 *   node scripts/validateSeasons.js --bootstrap     also the bootstrap seasons without a pack
 *   node scripts/validateSeasons.js --compare <report.json>  add "before" columns from an earlier report
 *   node scripts/validateSeasons.js --no-validate   play packs even if they fail the schema (calibration only)
 *
 * Writes <out>/report.json and <out>/report.md (default docs/manager/validation/).
 * The engine is ES modules for CRA; here it is loaded through sucrase's require hook.
 * Exit code 1 when the criterion fails (handy in CI with --full).
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

const FRONTEND = path.resolve(__dirname, "..");
const MODULES = path.join(FRONTEND, "src", "modules");
const MANAGER = path.join(MODULES, "overcutManager");
const SEASONS = path.join(MANAGER, "data", "seasons");
const BALANCE = { anchors: "historical-anchors.json", packWorld: "pack-world.json", development: "development.json", raceEras: "race-eras.json" };

const register = () => {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  require(path.join(FRONTEND, "node_modules", "sucrase", "register"));
};

const packYears = () =>
  fs
    .readdirSync(SEASONS)
    .map((file) => /^(\d{4})\.json$/.exec(file))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .sort((a, b) => a - b);

const applyOverrides = (sets) => {
  sets.forEach((assignment) => {
    const [key, raw] = assignment.split("=");
    const [file, ...route] = key.split(".");
    if (!BALANCE[file]) throw new Error(`--set: unknown balance file '${file}' (${Object.keys(BALANCE).join(", ")})`);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const data = require(path.join(MANAGER, "data", "balance", BALANCE[file]));
    let node = data;
    route.slice(0, -1).forEach((step) => {
      node = node[step];
    });
    node[route[route.length - 1]] = JSON.parse(raw);
  });
};

const loadContext = (years, bootstrapYears, validate = true) => {
  /* eslint-disable global-require, import/no-dynamic-require */
  const { fallbackBootstrap } = require(path.join(MODULES, "overcutTrayectoria", "data", "fallbackBootstrap"));
  const { reference } = require(path.join(MANAGER, "data", "reference"));
  const { createContext } = require(path.join(MANAGER, "engine", "career"));
  const { validateSeasonPack } = require(path.join(MANAGER, "engine", "packs", "validatePack"));
  const packs = {};
  years.filter((year) => !bootstrapYears.includes(year)).forEach((year) => {
    const pack = require(path.join(SEASONS, `${year}.json`));
    const { ok, errors } = validate ? validateSeasonPack(pack) : { ok: true, errors: [] };
    if (!ok) throw new Error(`pack ${year} invalid: ${errors.slice(0, 3).join("; ")}`);
    packs[year] = pack;
  });
  return createContext(fallbackBootstrap, reference, packs);
  /* eslint-enable global-require, import/no-dynamic-require */
};

// ------------------------------------------------------------------ worker

if (!isMainThread) {
  register();
  applyOverrides(workerData.sets);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { simulateSpectatorSeason } = require(path.join(MANAGER, "engine", "validation", "seasonValidation"));
  const context = loadContext(workerData.years, workerData.bootstrapYears, workerData.validate);
  parentPort.on("message", (job) => {
    if (job === null) {
      process.exit(0);
      return;
    }
    const runs = [];
    for (let index = job.start; index < job.start + job.count; index += 1) {
      const run = simulateSpectatorSeason(context, { year: job.year, seed: `val-${job.year}-${index}`, mode: workerData.mode });
      runs.push({ order: run.order, champion: run.champion, realChampion: run.realChampion, spearman: run.spearman });
    }
    parentPort.postMessage({ year: job.year, runs });
  });
  return;
}

// -------------------------------------------------------------------- main

const parseArgs = (argv) => {
  const args = { runs: 200, workers: Math.max(1, os.cpus().length - 1), mode: "strict", sets: [], years: null, out: path.resolve(FRONTEND, "..", "..", "docs", "manager", "validation"), bootstrap: false, chunk: 25, validate: true };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const next = () => argv[++index]; // eslint-disable-line no-plusplus
    if (flag === "--full") args.runs = 1000;
    else if (flag === "--runs") args.runs = Number(next());
    else if (flag === "--workers") args.workers = Number(next());
    else if (flag === "--mode") args.mode = next();
    else if (flag === "--years") args.years = next().split(",").map(Number);
    else if (flag === "--set") args.sets.push(next());
    else if (flag === "--out") args.out = path.resolve(next());
    else if (flag === "--bootstrap") args.bootstrap = true;
    else if (flag === "--chunk") args.chunk = Number(next());
    else if (flag === "--no-validate") args.validate = false;
    else if (flag === "--compare") args.compare = path.resolve(next());
    else throw new Error(`unknown flag ${flag}`);
  }
  return args;
};

const fmt = (value, digits = 2) => (value === null || value === undefined ? "—" : Number(value).toFixed(digits));
const pct = (value) => `${Math.round(value * 1000) / 10} %`;

const markdown = ({ args, seasons, verdict, timing, before }) => {
  const lines = [];
  lines.push("# Validación estadística de temporadas (criterio 7.2)");
  lines.push("");
  lines.push(`Generado por \`overcut/frontend/scripts/validateSeasons.js\` el ${new Date().toISOString().slice(0, 10)}.`);
  lines.push(`Modo ${args.mode}, ${args.runs} simulaciones por temporada sin intervención (carrera espectadora, modo rápido),`);
  lines.push(`${args.workers} hilos, ${fmt(timing.seconds, 1)} s en total (${fmt((timing.seconds * 1000) / Math.max(1, timing.runs), 1)} ms por temporada simulada y hilo-equivalente ${fmt((timing.seconds * 1000 * args.workers) / Math.max(1, timing.runs), 1)} ms).`);
  if (args.sets.length) lines.push(`Valores forzados: ${args.sets.map((set) => `\`${set}\``).join(", ")}.`);
  lines.push("");
  lines.push(`**Veredicto: ${verdict.pass ? "CUMPLE" : "NO CUMPLE"}.** Campeón real como más probable en ${verdict.championHits}/${verdict.seasons} temporadas (${pct(verdict.championShare)}; mínimo 70 %), Spearman medio ${fmt(verdict.meanSpearman, 3)} (mínimo 0,8).`);
  lines.push("");
  const prior = before ? Object.fromEntries(before.seasons.map((season) => [season.year, season])) : null;
  if (before) {
    lines.push(`Antes (${before.label}): campeón real como más probable en ${before.verdict.championHits}/${before.verdict.seasons} (${pct(before.verdict.championShare)}), Spearman medio ${fmt(before.verdict.meanSpearman, 3)}.`);
    lines.push("");
  }
  lines.push(`| Año | Campeón real | P(campeón real) | Rango del real | Más probable (top 3) | Spearman medio (σ) |${prior ? " Antes: P / rango / ρ |" : ""}`);
  lines.push(`| --- | --- | --- | --- | --- | --- |${prior ? " --- |" : ""}`);
  seasons.forEach((season) => {
    const top = season.distribution.slice(0, 3).map((row) => `${row.teamId} ${pct(row.share)}`).join(", ");
    const old = prior?.[season.year];
    const then = prior ? (old ? ` ${pct(old.realChampionShare)} / ${old.realChampionRank ?? "—"} / ${fmt(old.meanSpearman, 3)} |` : " — |") : "";
    lines.push(`| ${season.year} | ${season.realChampion} | ${pct(season.realChampionShare)} | ${season.realChampionRank ?? "—"} | ${top} | ${fmt(season.meanSpearman, 3)} (${fmt(season.sdSpearman, 3)}) |${then}`);
  });
  lines.push("");
  lines.push("## Método");
  lines.push("");
  lines.push("- Cada simulación es una carrera espectadora (`createCareer({ spectator: true })`): ningún equipo es del jugador, todos corren sus inscritos reales de cada GP, desarrollan con la IA y, en modo estricto, siguen el ancla guiada del pack (RF-CAR-05, SRS 6.1; `data/balance/historical-anchors.json`). No hay junta, cuentas, dilemas ni correo.");
  lines.push("- Semilla `val-<año>-<n>`: cada ejecución se reproduce exactamente (RNF-05). Fines de semana en modo rápido (`race.js`).");
  lines.push("- Orden real: clasificación de constructores del pack (`standings.constructors`). Spearman sobre los equipos presentes en ambos órdenes.");
  lines.push("- Criterio 7.2: el campeón real debe ser el más probable en ≥ 70 % de las temporadas y la media de Spearman ≥ 0,8.");
  lines.push("");
  return lines.join("\n");
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  register();
  /* eslint-disable global-require, import/no-dynamic-require */
  const { summarizeSeason, verdictOf } = require(path.join(MANAGER, "engine", "validation", "seasonValidation"));
  let bootstrapYears = [];
  if (args.bootstrap) {
    const { fallbackBootstrap } = require(path.join(MODULES, "overcutTrayectoria", "data", "fallbackBootstrap"));
    const { prepareBootstrap } = require(path.join(MODULES, "overcutTrayectoria", "engine", "world"));
    const prepared = prepareBootstrap(fallbackBootstrap);
    const withPack = new Set(packYears());
    bootstrapYears = prepared.seasonYears.filter((year) => !withPack.has(year) && (prepared.lineupsByYear[String(year)] || []).length >= 2);
  }
  /* eslint-enable global-require, import/no-dynamic-require */
  // Only validated packs are played ("sin pack validado, una temporada no se puede jugar", SRS 6).
  const { validateSeasonPack } = require(path.join(MANAGER, "engine", "packs", "validatePack")); // eslint-disable-line global-require, import/no-dynamic-require
  const skipped = [];
  const valid = packYears().filter((year) => {
    if (!args.validate) return true;
    const { ok, errors } = validateSeasonPack(JSON.parse(fs.readFileSync(path.join(SEASONS, `${year}.json`), "utf8")));
    if (!ok) skipped.push(`${year} (${errors[0]})`);
    return ok;
  });
  if (skipped.length) console.warn(`skipped invalid packs: ${skipped.join("; ")}`);
  const years = (args.years || [...valid, ...bootstrapYears]).filter((year) => valid.includes(year) || bootstrapYears.includes(year)).sort((a, b) => a - b);
  const jobs = [];
  years.forEach((year) => {
    for (let start = 0; start < args.runs; start += args.chunk) jobs.push({ year, start, count: Math.min(args.chunk, args.runs - start) });
  });
  const results = Object.fromEntries(years.map((year) => [year, []]));
  const began = Date.now();
  const workers = Math.min(args.workers, jobs.length);
  let done = 0;
  await Promise.all(
    Array.from({ length: workers }, () =>
      new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData: { years, bootstrapYears, mode: args.mode, sets: args.sets, validate: args.validate } });
        const feed = () => {
          const job = jobs.shift();
          worker.postMessage(job || null);
        };
        worker.on("message", ({ year, runs }) => {
          results[year].push(...runs);
          done += runs.length;
          process.stderr.write(`\r${done}/${years.length * args.runs} seasons  ${Math.round((Date.now() - began) / 1000)} s   `);
          feed();
        });
        worker.on("error", reject);
        worker.on("exit", resolve);
        feed();
      }),
    ),
  );
  process.stderr.write("\n");
  const seconds = (Date.now() - began) / 1000;
  const seasons = years.map((year) => summarizeSeason(year, results[year]));
  const verdict = verdictOf(seasons);
  const timing = { seconds, runs: years.length * args.runs, workers };
  fs.mkdirSync(args.out, { recursive: true });
  fs.writeFileSync(path.join(args.out, "report.json"), `${JSON.stringify({ generated: new Date().toISOString(), mode: args.mode, runsPerSeason: args.runs, sets: args.sets, timing, verdict, seasons }, null, 1)}\n`);
  let before = null;
  if (args.compare) {
    before = JSON.parse(fs.readFileSync(args.compare, "utf8"));
    before.label = before.label || `${before.mode}, ${before.runsPerSeason} ejecuciones${before.sets?.length ? `, ${before.sets.join(" ")}` : ""}`;
  }
  fs.writeFileSync(path.join(args.out, "report.md"), markdown({ args: { ...args, workers }, seasons, verdict, timing, before }));
  seasons.forEach((season) => {
    console.log(`${season.year}  real ${season.realChampion.padEnd(12)} P=${fmt(season.realChampionShare)} rank ${season.realChampionRank ?? "-"}  top ${season.mostProbable.padEnd(12)} rho ${fmt(season.meanSpearman, 3)}`);
  });
  console.log(`champion most probable ${verdict.championHits}/${verdict.seasons} (${pct(verdict.championShare)}), mean Spearman ${fmt(verdict.meanSpearman, 3)}  ${verdict.pass ? "PASS" : "FAIL"}  (${fmt(seconds, 1)} s)`);
  process.exitCode = verdict.pass ? 0 : 1;
};

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
