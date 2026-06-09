/* eslint-disable no-console */
import { simulateChampionship } from "./racingEngine";

// Representative modern-ish grid (best drivers aligned to best teams).
const TEAMS = [
  { id: "t-rbr", name: "Red Bull", rating: 96 },
  { id: "t-fer", name: "Ferrari", rating: 94 },
  { id: "t-mcl", name: "McLaren", rating: 93 },
  { id: "t-mer", name: "Mercedes", rating: 92 },
  { id: "t-ast", name: "Aston Martin", rating: 84 },
  { id: "t-alp", name: "Alpine", rating: 80 },
  { id: "t-wil", name: "Williams", rating: 78 },
  { id: "t-rb", name: "Racing Bulls", rating: 75 },
  { id: "t-haa", name: "Haas F1 Team", rating: 73 },
  { id: "t-sau", name: "Sauber", rating: 71 },
];

// Grid A: realistic flat top (4 teams within 4 pts -> 8 near-equal stars).
const DRIVERS = [
  ["Verstappen", 96], ["Perez", 82],
  ["Leclerc", 92], ["Sainz", 88],
  ["Norris", 90], ["Piastri", 86],
  ["Hamilton", 91], ["Russell", 87],
  ["Alonso", 90], ["Stroll", 76],
  ["Gasly", 81], ["Ocon", 80],
  ["Albon", 80], ["Sargeant", 70],
  ["Tsunoda", 78], ["Ricciardo", 79],
  ["Hulkenberg", 80], ["Magnussen", 76],
  ["Bottas", 80], ["Zhou", 74],
].map(([name, rating], i) => ({ id: `d-${i}`, name, rating, helmetColor: "#cccccc" }));

// Grid B: a clearly tiered field (a distinct top-4, then a real gap). Same
// engine constants must push the dry favourite share toward ~80% here.
const TEAMS_B = [
  { id: "b-1", name: "Red Bull", rating: 98 },
  { id: "b-2", name: "Ferrari", rating: 95 },
  { id: "b-3", name: "McLaren", rating: 90 },
  { id: "b-4", name: "Mercedes", rating: 86 },
  { id: "b-5", name: "Aston Martin", rating: 79 },
  { id: "b-6", name: "Alpine", rating: 77 },
  { id: "b-7", name: "Williams", rating: 75 },
  { id: "b-8", name: "Racing Bulls", rating: 73 },
  { id: "b-9", name: "Haas F1 Team", rating: 71 },
  { id: "b-10", name: "Sauber", rating: 69 },
];
const DRIVERS_B = [
  ["A. Star", 97], ["A. Two", 84],
  ["B. Star", 93], ["B. Two", 86],
  ["C. Star", 89], ["C. Two", 83],
  ["D. Star", 86], ["D. Two", 81],
  ["E. Mid", 80], ["E. Two", 75],
  ["F. Mid", 78], ["F. Two", 76],
  ["G. Mid", 76], ["G. Two", 70],
  ["H. Mid", 75], ["H. Two", 74],
  ["I. Mid", 76], ["I. Two", 72],
  ["J. Mid", 74], ["J. Two", 70],
].map(([name, rating], i) => ({ id: `db-${i}`, name, rating, helmetColor: "#cccccc" }));

const RACE_NAMES = [
  "Bahrain Grand Prix", "Saudi Arabian Grand Prix", "Australian Grand Prix",
  "Japanese Grand Prix", "Chinese Grand Prix", "Miami Grand Prix",
  "Emilia Romagna Grand Prix", "Monaco Grand Prix", "Canadian Grand Prix",
  "Spanish Grand Prix", "Austrian Grand Prix", "British Grand Prix",
  "Hungarian Grand Prix", "Belgian Grand Prix", "Dutch Grand Prix",
  "Italian Grand Prix", "Azerbaijan Grand Prix", "Singapore Grand Prix",
  "United States Grand Prix", "Mexico City Grand Prix", "Sao Paulo Grand Prix",
  "Las Vegas Grand Prix", "Qatar Grand Prix", "Abu Dhabi Grand Prix",
];
const RACES = RACE_NAMES.map((name, i) => ({
  name,
  round: i + 1,
  country: "",
  circuit: "",
  locality: "",
}));

const SEASONS = 400;
const FAVORITE_TOP = 4; // "grupo de cabeza": baseRank <= 4

const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) : "—");

const newBucket = () => ({ total: 0, top1: 0, top2: 0, top4: 0, top6: 0, top8: 0, rankSum: 0 });
const record = (b, rank) => {
  b.total += 1;
  b.rankSum += rank;
  if (rank <= 1) b.top1 += 1;
  if (rank <= 2) b.top2 += 1;
  if (rank <= 4) b.top4 += 1;
  if (rank <= 6) b.top6 += 1;
  if (rank <= 8) b.top8 += 1;
};
const row = (label, b) =>
  `${label.padEnd(11)} n=${String(b.total).padStart(5)} | top2 ${pct(b.top2, b.total).padStart(5)} | top4 ${pct(b.top4, b.total).padStart(5)} | top6 ${pct(b.top6, b.total).padStart(5)} | top8 ${pct(b.top8, b.total).padStart(5)} | meanRank ${(b.rankSum / b.total).toFixed(2)}`;

const runGrid = (label, teams, drivers, nDrivers) => {
  const buckets = { dry: newBucket(), sc: newBucket(), wet: newBucket(), all: newBucket() };
  const uniquePerSeason = [];
  for (let s = 0; s < SEASONS; s += 1) {
    const champ = simulateChampionship({ teams, drivers, races: RACES, seasonYear: 1900 + s });
    uniquePerSeason.push(new Set(champ.races.map((r) => r.winner.driver)).size);
    champ.races.forEach((r) => {
      const rank = r.winner.baseRank;
      let key;
      if (r.conditions.weatherCode && r.conditions.weatherCode !== "dry") key = "wet";
      else if (r.conditions.safetyCar) key = "sc";
      else key = "dry";
      record(buckets[key], rank);
      record(buckets.all, rank);
    });
  }
  const avgUnique = uniquePerSeason.reduce((a, b) => a + b, 0) / uniquePerSeason.length;
  console.log(`\n--- ${label} ---  (target top-4: DRY 80 / SC 65 / WET 55)`);
  console.log(row("ALL", buckets.all));
  console.log(row("DRY clean", buckets.dry));
  console.log(row("SAFETY CAR", buckets.sc));
  console.log(row("WET/MIXED", buckets.wet));
  console.log(`Avg distinct winners/season: ${avgUnique.toFixed(1)} of ${nDrivers}`);
};

// Manual tuning harness — skipped by default so it never slows the CI suite.
// Run it on demand with:  RUN_CALIBRATION=1 npx react-scripts test calibration --watchAll=false
const maybeTest = process.env.RUN_CALIBRATION === "1" ? test : test.skip;

maybeTest("calibration: favorite win share by condition across grids", () => {
  console.log(`\n================= CALIBRATION (${SEASONS} seasons each) =================`);
  runGrid("GRID A flat-top", TEAMS, DRIVERS, DRIVERS.length);
  runGrid("GRID B tiered", TEAMS_B, DRIVERS_B, DRIVERS_B.length);
  console.log("======================================================\n");
  expect(true).toBe(true);
});
