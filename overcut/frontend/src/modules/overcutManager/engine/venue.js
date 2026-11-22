/**
 * Which circuit a Grand Prix is run on, and its geometry for that year.
 *
 * The f1db calendar carries the circuit reference for every real race; a
 * generated or offline season may only carry the Grand Prix name, so a table
 * maps names to their usual home, and anything still unknown is given one of
 * the sketched circuits by a stable hash of its name - the same venue every
 * time, which is all a fictional race needs.
 */

import { buildCircuit } from "./trackGeometry";
import { LAYOUTS, LAYOUT_REFS, layoutFor } from "./layouts";

const GP_VENUES = {
  "70th Anniversary Grand Prix": "silverstone",
  "Abu Dhabi Grand Prix": "yas_marina",
  "Argentine Grand Prix": "galvez",
  "Australian Grand Prix": "albert_park",
  "Austrian Grand Prix": "red_bull_ring",
  "Azerbaijan Grand Prix": "baku",
  "Bahrain Grand Prix": "bahrain",
  "Belgian Grand Prix": "spa",
  "Brazilian Grand Prix": "interlagos",
  "British Grand Prix": "silverstone",
  "Caesars Palace Grand Prix": "las_vegas",
  "Canadian Grand Prix": "villeneuve",
  "Chinese Grand Prix": "shanghai",
  "Dallas Grand Prix": "dallas",
  "Detroit Grand Prix": "detroit",
  "Dutch Grand Prix": "zandvoort",
  "Eifel Grand Prix": "nurburgring",
  "Emilia Romagna Grand Prix": "imola",
  "European Grand Prix": "nurburgring",
  "French Grand Prix": "ricard",
  "German Grand Prix": "hockenheimring",
  "Hungarian Grand Prix": "hungaroring",
  "Indian Grand Prix": "buddh",
  "Indianapolis 500": "indianapolis",
  "Italian Grand Prix": "monza",
  "Japanese Grand Prix": "suzuka",
  "Korean Grand Prix": "yeongam",
  "Las Vegas Grand Prix": "vegas",
  "Luxembourg Grand Prix": "nurburgring",
  "Malaysian Grand Prix": "sepang",
  "Mexican Grand Prix": "rodriguez",
  "Mexico City Grand Prix": "rodriguez",
  "Miami Grand Prix": "miami",
  "Monaco Grand Prix": "monaco",
  "Moroccan Grand Prix": "ain-diab",
  "Pacific Grand Prix": "okayama",
  "Pescara Grand Prix": "pescara",
  "Portuguese Grand Prix": "estoril",
  "Qatar Grand Prix": "losail",
  "Russian Grand Prix": "sochi",
  "Sakhir Grand Prix": "bahrain",
  "San Marino Grand Prix": "imola",
  "Saudi Arabian Grand Prix": "jeddah",
  "Singapore Grand Prix": "marina_bay",
  "South African Grand Prix": "kyalami",
  "Spanish Grand Prix": "catalunya",
  "Styrian Grand Prix": "red_bull_ring",
  "Swedish Grand Prix": "anderstorp",
  "Swiss Grand Prix": "bremgarten",
  "São Paulo Grand Prix": "interlagos",
  "Turkish Grand Prix": "istanbul",
  "Tuscan Grand Prix": "mugello",
  "United States Grand Prix": "americas",
  "United States Grand Prix West": "long_beach",
};

/** Venues a name has used over the years, where the table's default is wrong for an era. */
const BY_ERA = {
  "Swiss Grand Prix": (year) => (year >= 1975 ? "dijon" : "bremgarten"),
  "United States Grand Prix": (year) => (year < 1960 ? "sebring" : year === 1960 ? "riverside" : year < 1981 ? "watkins_glen" : year < 1992 ? "phoenix" : year < 2008 ? "indianapolis" : "americas"),
  "German Grand Prix": (year) => (year < 1959 || (year > 1959 && year < 1970) || (year > 1970 && year < 1977) || year === 1985 ? "nurburgring" : year === 1959 ? "avus" : "hockenheimring"),
  "French Grand Prix": (year) => (year < 1969 ? "reims" : year < 1971 ? "charade" : year < 1991 ? "ricard" : year < 2009 ? "magny_cours" : "ricard"),
  "Spanish Grand Prix": (year) => (year < 1968 ? "pedralbes" : year < 1976 ? "jarama" : year < 1991 ? "jarama" : "catalunya"),
  "Brazilian Grand Prix": (year) => (year >= 1978 && year <= 1989 && year !== 1980 ? "jacarepagua" : "interlagos"),
  "Mexican Grand Prix": () => "rodriguez",
  "Portuguese Grand Prix": (year) => (year < 1959 ? "boavista" : year === 1959 ? "monsanto" : year === 1960 ? "boavista" : year < 2000 ? "estoril" : "portimao"),
  "Japanese Grand Prix": (year) => (year < 1987 || year === 2007 || year === 2008 ? "fuji" : "suzuka"),
  "Austrian Grand Prix": (year) => (year === 1964 ? "zeltweg" : "red_bull_ring"),
  "Dutch Grand Prix": () => "zandvoort",
  "Australian Grand Prix": (year) => (year < 1996 ? "adelaide" : "albert_park"),
  "South African Grand Prix": (year) => (year < 1966 ? "george" : "kyalami"),
  "European Grand Prix": (year) => (year === 1983 || year === 1985 ? "brands_hatch" : year === 1993 ? "donington" : year === 1994 || year === 1997 ? "jerez" : year >= 2008 && year <= 2012 ? "valencia" : year === 2016 ? "baku" : "nurburgring"),
  "British Grand Prix": (year) => ([1955, 1957, 1959, 1961, 1962].includes(year) ? "aintree" : year >= 1964 && year <= 1986 && year % 2 === 0 ? "brands_hatch" : "silverstone"),
  "Belgian Grand Prix": (year) => (year === 1972 || year === 1974 ? "nivelles" : year >= 1973 && year <= 1984 && year !== 1983 ? "zolder" : "spa"),
  "Canadian Grand Prix": (year) => (year < 1978 ? ([1968, 1970].includes(year) ? "tremblant" : "mosport") : "villeneuve"),
  "Italian Grand Prix": (year) => (year === 1980 ? "imola" : "monza"),
  "Argentine Grand Prix": () => "galvez",
};

const hashOf = (text) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
};

/** The f1db reference of the circuit a race uses. */
export const circuitRefFor = (race = {}, year = 2020) => {
  if (race.circuit && LAYOUTS[race.circuit]) return race.circuit;
  const byEra = BY_ERA[race.name];
  if (byEra) {
    const ref = byEra(year);
    if (LAYOUTS[ref]) return ref;
  }
  if (GP_VENUES[race.name]) return GP_VENUES[race.name];
  return LAYOUT_REFS[hashOf(race.name || "Grand Prix") % LAYOUT_REFS.length];
};

/** Era buckets the lap simulation distinguishes - circuits are cached per bucket. */
const BUCKETS = [1961, 1968, 1977, 1983, 1989, 2009, 2017];
const bucketYear = (year) => {
  const index = BUCKETS.findIndex((limit) => year < limit);
  return index === -1 ? 2020 : BUCKETS[index] - 1;
};

const cache = new Map();

/** The built circuit a race runs on in a given year (cached: geometry is pure). */
export const circuitFor = (race = {}, year = 2020) => {
  const ref = circuitRefFor(race, year);
  const layout = layoutFor(ref, year);
  const key = `${layout.id}@${bucketYear(year)}`;
  if (!cache.has(key)) cache.set(key, { ref, ...buildCircuit(layout, bucketYear(year)) });
  return cache.get(key);
};
