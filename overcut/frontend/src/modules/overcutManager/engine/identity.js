/**
 * What a team looks like and what it can bolt into the back of its car.
 *
 * f1db knows a constructor's name and nationality and nothing about its paint,
 * so the liveries live here: the colour each team is remembered in, with the
 * handful of famous changes (McLaren's Marlboro red, Lotus in black and gold)
 * keyed by year. Colours are facts about the sport, not artwork, and anything
 * this table has never heard of gets a stable colour out of a hash.
 *
 * The engine table is what a team built from scratch chooses from. It is an
 * honest approximation of who supplied what and when, with a 0..3 tier for how
 * good the unit was in each period - from memory of the record books, not a
 * measurement, and flagged as such in the UI.
 */

import { hashSeed } from "../../overcutTrayectoria/engine/rng";

const L = (from, to, color, color2) => ({ from, to, color, color2 });

/** name -> list of liveries, first match on the year wins. */
const LIVERIES = {
  Ferrari: [L(1950, 2100, "#dc0000", "#fff200")],
  McLaren: [
    L(1966, 1973, "#ff8000", "#1e1e1e"),
    L(1974, 1996, "#e10600", "#f4f4f4"),
    L(1997, 2016, "#9aa0a6", "#e10600"),
    L(2017, 2100, "#ff8000", "#47c7fc"),
  ],
  Mercedes: [L(1954, 1955, "#c0c0c0", "#1b1b1b"), L(2010, 2100, "#27f4d2", "#c0c0c0")],
  Williams: [
    L(1977, 1993, "#ffffff", "#0a3f8f"),
    L(1994, 1999, "#0a3f8f", "#ffffff"),
    L(2000, 2005, "#1c3f94", "#ffffff"),
    L(2006, 2100, "#00a0de", "#041e42"),
  ],
  "Red Bull": [L(2005, 2100, "#3671c6", "#ffcc00")],
  Lotus: [
    L(1958, 1967, "#0b6e3b", "#f2c200"),
    L(1968, 1971, "#c8102e", "#f2c200"),
    L(1972, 1986, "#111111", "#c9a227"),
    L(1987, 1990, "#f2d500", "#1e4b9b"),
    L(1991, 1994, "#0b6e3b", "#ffffff"),
    L(2012, 2015, "#111111", "#c9a227"),
  ],
  "Team Lotus": [L(2010, 2011, "#0b6e3b", "#f2c200")],
  Brabham: [
    L(1962, 1971, "#0b6e3b", "#f2c200"),
    L(1972, 1975, "#ffffff", "#1e4b9b"),
    L(1976, 1981, "#c8102e", "#ffffff"),
    L(1982, 1992, "#1e4b9b", "#ffffff"),
  ],
  Renault: [L(1977, 1985, "#f8d90f", "#111111"), L(2002, 2010, "#f8d90f", "#1e4b9b"), L(2016, 2020, "#fff500", "#111111")],
  "Alpine F1 Team": [L(2021, 2100, "#0093cc", "#ff87bc")],
  Benetton: [L(1986, 1993, "#2e8b57", "#f2c200"), L(1994, 2001, "#1e4b9b", "#00a651")],
  Tyrrell: [L(1970, 1998, "#0a3f8f", "#ffffff")],
  "Aston Martin": [L(1959, 1960, "#0b6e3b", "#ffffff"), L(2021, 2100, "#229971", "#cedc00")],
  "Racing Point": [L(2019, 2020, "#f596c8", "#1e4b9b")],
  "Force India": [L(2008, 2018, "#f596c8", "#ff8000")],
  Jordan: [L(1991, 1995, "#00a651", "#1e4b9b"), L(1996, 2005, "#f8d90f", "#111111")],
  Sauber: [L(1993, 2018, "#1e4b9b", "#c0c0c0"), L(2024, 2100, "#52e252", "#111111")],
  "Alfa Romeo": [L(1950, 1985, "#a6192e", "#ffffff"), L(2019, 2023, "#a6192e", "#ffffff")],
  "BMW Sauber": [L(2006, 2010, "#ffffff", "#1e4b9b")],
  "Toro Rosso": [L(2006, 2019, "#1e41ff", "#e10600")],
  AlphaTauri: [L(2020, 2023, "#2b4562", "#ffffff")],
  "RB F1 Team": [L(2024, 2100, "#6692ff", "#ffffff")],
  Minardi: [L(1985, 2005, "#111111", "#f8d90f")],
  Ligier: [L(1976, 1996, "#1e4b9b", "#ffffff")],
  Arrows: [L(1978, 2002, "#ff8000", "#111111")],
  March: [L(1970, 1992, "#ff8000", "#ffffff")],
  Matra: [L(1967, 1972, "#1e4b9b", "#ffffff")],
  BRM: [L(1951, 1977, "#0b6e3b", "#ff8000")],
  Cooper: [L(1950, 1969, "#0b6e3b", "#ffffff")],
  Vanwall: [L(1954, 1960, "#0b6e3b", "#f2c200")],
  Maserati: [L(1950, 1960, "#c8102e", "#1e4b9b")],
  Honda: [L(1964, 1968, "#ffffff", "#c8102e"), L(2006, 2008, "#ffffff", "#c8102e")],
  "Brawn": [L(2009, 2009, "#ffffff", "#c6f700")],
  Toyota: [L(2002, 2009, "#ffffff", "#c8102e")],
  Jaguar: [L(2000, 2004, "#0b6e3b", "#ffffff")],
  Stewart: [L(1997, 1999, "#ffffff", "#c8102e")],
  "Haas F1 Team": [L(2016, 2100, "#b6babd", "#e10600")],
  Haas: [L(2016, 2100, "#b6babd", "#e10600")],
  Shadow: [L(1973, 1980, "#111111", "#ffffff")],
  Surtees: [L(1970, 1978, "#ffffff", "#c8102e")],
  Hesketh: [L(1973, 1978, "#ffffff", "#c8102e")],
  Wolf: [L(1977, 1979, "#1e2a5a", "#c9a227")],
  Prost: [L(1997, 2001, "#1e4b9b", "#ffffff")],
  "Super Aguri": [L(2006, 2008, "#ffffff", "#c8102e")],
  Spyker: [L(2007, 2007, "#ff8000", "#c0c0c0")],
  Caterham: [L(2012, 2014, "#0b6e3b", "#f2c200")],
  Marussia: [L(2012, 2015, "#c8102e", "#111111")],
  Manor: [L(2016, 2016, "#1e4b9b", "#c8102e")],
  Virgin: [L(2010, 2011, "#c8102e", "#111111")],
  HRT: [L(2010, 2012, "#c0c0c0", "#c8102e")],
  Footwork: [L(1991, 1996, "#ffffff", "#c8102e")],
  Larrousse: [L(1987, 1994, "#1e4b9b", "#ffffff")],
  Dallara: [L(1988, 1992, "#c8102e", "#ffffff")],
  Gordini: [L(1950, 1956, "#1e4b9b", "#ffffff")],
  "Talbot-Lago": [L(1950, 1951, "#1e4b9b", "#ffffff")],
  Lancia: [L(1954, 1955, "#c8102e", "#ffffff")],
};

/** Racing colours for anything unknown: picked by hash so a team keeps its colour. */
export const PALETTE = [
  "#dc0000", "#0b6e3b", "#1e4b9b", "#ff8000", "#f8d90f", "#ffffff", "#111111", "#9aa0a6",
  "#00a0de", "#a6192e", "#27f4d2", "#f596c8", "#2e8b57", "#6a3d9a", "#c9a227", "#47c7fc",
];

const darkOrLight = (hex) => {
  const value = String(hex || "#000").replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) || 0;
  const g = parseInt(value.slice(2, 4), 16) || 0;
  const b = parseInt(value.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** Text colour that reads on top of a team colour. */
export const inkOn = (hex) => (darkOrLight(hex) > 0.6 ? "#0a0a0c" : "#f3f1e9");

export const teamIdentity = (name, year) => {
  const liveries = LIVERIES[name];
  const match = liveries && (liveries.find((entry) => year >= entry.from && year <= entry.to) || liveries[liveries.length - 1]);
  if (match) return { color: match.color, color2: match.color2 };
  const hash = hashSeed(name);
  return { color: PALETTE[hash % PALETTE.length], color2: PALETTE[(hash >> 5) % PALETTE.length] };
};

/** A three-letter code for the timing tower: "Red Bull" -> RBR-ish, "Ferrari" -> FER. */
export const shortCode = (name = "") => {
  const words = String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !["F1", "Team", "Racing", "Formula", "One", "Scuderia"].includes(word));
  if (!words.length) return "TBD";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
};

// ------------------------------------------------------------------- engines

const E = (id, name, country, periods) => ({ id, name, country, periods });

/** [from, to, tier] - tier 0 weak, 1 average, 2 good, 3 the class of the field. */
export const ENGINES = [
  E("ferrari", "Ferrari", "it", [
    [1950, 1953, 3], [1954, 1958, 2], [1959, 1960, 1], [1961, 1961, 3], [1962, 1963, 1], [1964, 1964, 2],
    [1965, 1969, 1], [1970, 1973, 2], [1974, 1979, 3], [1980, 1980, 0], [1981, 1983, 2], [1984, 1987, 1],
    [1988, 1990, 2], [1991, 1995, 1], [1996, 1999, 2], [2000, 2004, 3], [2005, 2005, 1], [2006, 2008, 3],
    [2009, 2013, 2], [2014, 2016, 1], [2017, 2019, 3], [2020, 2020, 0], [2021, 2100, 2],
  ]),
  E("alfa", "Alfa Romeo", "it", [[1950, 1951, 3], [1976, 1985, 1]]),
  E("maserati", "Maserati", "it", [[1950, 1953, 1], [1954, 1957, 2], [1958, 1960, 1], [1966, 1967, 1]]),
  E("talbot", "Talbot-Lago", "fr", [[1950, 1951, 1]]),
  E("gordini", "Gordini", "fr", [[1952, 1956, 0]]),
  E("lancia", "Lancia", "it", [[1954, 1955, 2]]),
  E("mercedes", "Mercedes", "de", [
    [1954, 1955, 3], [1994, 1996, 1], [1997, 2000, 3], [2001, 2004, 2], [2005, 2005, 3], [2006, 2008, 2],
    [2009, 2009, 3], [2010, 2013, 2], [2014, 2021, 3], [2022, 2023, 2], [2024, 2100, 3],
  ]),
  E("vanwall", "Vanwall", "gb", [[1956, 1958, 3]]),
  E("climax", "Coventry Climax", "gb", [[1957, 1958, 1], [1959, 1960, 3], [1961, 1961, 1], [1962, 1965, 3], [1966, 1966, 0]]),
  E("brm", "BRM", "gb", [[1951, 1951, 0], [1956, 1961, 1], [1962, 1965, 3], [1966, 1969, 1], [1970, 1972, 2], [1973, 1977, 0]]),
  E("porsche", "Porsche", "de", [[1961, 1962, 1], [1991, 1991, 0]]),
  E("tag", "TAG-Porsche", "de", [[1983, 1983, 1], [1984, 1986, 3], [1987, 1987, 2]]),
  E("honda", "Honda", "jp", [
    [1964, 1968, 1], [1983, 1985, 1], [1986, 1991, 3], [1992, 1992, 2], [2000, 2005, 2], [2006, 2008, 1],
    [2015, 2017, 0], [2018, 2018, 1], [2019, 2021, 3],
  ]),
  E("rbpt", "Honda RBPT", "jp", [[2022, 2025, 3]]),
  E("repco", "Repco", "au", [[1966, 1967, 3], [1968, 1969, 0]]),
  E("cosworth", "Ford Cosworth", "gb", [
    [1967, 1974, 3], [1975, 1982, 2], [1983, 1993, 1], [1994, 1994, 2], [1995, 2004, 1], [2005, 2006, 1], [2010, 2013, 0],
  ]),
  E("matra", "Matra", "fr", [[1968, 1972, 1], [1975, 1978, 1], [1981, 1982, 1]]),
  E("renault", "Renault", "fr", [
    [1977, 1978, 1], [1979, 1986, 2], [1989, 1990, 2], [1991, 1991, 3], [1992, 1997, 3], [2001, 2004, 2],
    [2005, 2006, 3], [2007, 2009, 2], [2010, 2013, 3], [2014, 2020, 1], [2021, 2100, 1],
  ]),
  E("bmw", "BMW", "de", [[1982, 1983, 3], [1984, 1987, 2], [2000, 2000, 2], [2001, 2005, 3], [2006, 2009, 2]]),
  E("hart", "Hart", "gb", [[1981, 1986, 0], [1993, 1997, 0]]),
  E("judd", "Judd", "gb", [[1988, 1992, 0]]),
  E("ilmor", "Ilmor", "gb", [[1991, 1993, 1]]),
  E("lamborghini", "Lamborghini", "it", [[1989, 1993, 0]]),
  E("yamaha", "Yamaha", "jp", [[1989, 1989, 0], [1991, 1997, 0]]),
  E("mugen", "Mugen-Honda", "jp", [[1991, 1997, 1], [1998, 1999, 2], [2000, 2000, 1]]),
  E("peugeot", "Peugeot", "fr", [[1994, 2000, 1]]),
  E("supertec", "Supertec", "fr", [[1999, 2000, 1]]),
  E("petronas", "Petronas", "my", [[1997, 2005, 1]]),
  E("toyota", "Toyota", "jp", [[2002, 2004, 1], [2005, 2009, 2]]),
  E("audi", "Audi", "de", [[2026, 2100, 1]]),
  E("rbford", "Red Bull Ford", "at", [[2026, 2100, 2]]),
];

const tierIn = (engine, year) => {
  const period = engine.periods.find(([from, to]) => year >= from && year <= to);
  return period ? period[2] : null;
};

/**
 * The engines on sale in a given year, best first. Past the end of the table the
 * last year anyone is listed for stands in, so a career run into the 2030s
 * still has a choice.
 */
export const enginesFor = (year) => {
  let list = ENGINES.map((engine) => ({ engine, tier: tierIn(engine, year) })).filter((row) => row.tier !== null);
  if (list.length < 3) {
    const latest = Math.max(...ENGINES.flatMap((engine) => engine.periods.map((period) => Math.min(period[1], 2030))));
    list = ENGINES.map((engine) => ({ engine, tier: tierIn(engine, Math.min(year, latest)) })).filter((row) => row.tier !== null);
  }
  return list
    .map(({ engine, tier }) => ({
      id: engine.id,
      name: engine.name,
      country: engine.country,
      tier,
      // In car-rating points against the field's average power unit.
      power: (tier - 1.4) * 2.4,
      reliability: (tier - 1.2) * 3,
      // Season price, before the era's money scale, in dollars.
      price: [9e6, 13e6, 18e6, 24e6][tier],
    }))
    .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
};

// ------------------------------------------------------------- custom teams

/** Where a new team can set up shop. Cosmetic, plus a small hiring pull. */
export const HEADQUARTERS = [
  { id: "oxon", country: "gb", es: "Oxfordshire · Motorsport Valley", en: "Oxfordshire · Motorsport Valley", staff: 3 },
  { id: "maranello", country: "it", es: "Módena · Motor Valley", en: "Modena · Motor Valley", staff: 2 },
  { id: "cologne", country: "de", es: "Colonia", en: "Cologne", staff: 1 },
  { id: "viry", country: "fr", es: "Viry-Châtillon", en: "Viry-Châtillon", staff: 1 },
  { id: "hinwil", country: "ch", es: "Hinwil", en: "Hinwil", staff: 1 },
  { id: "salzburg", country: "at", es: "Salzburgo", en: "Salzburg", staff: 0 },
  { id: "barcelona", country: "es", es: "Barcelona", en: "Barcelona", staff: 0 },
  { id: "charlotte", country: "us", es: "Charlotte · Carolina del Norte", en: "Charlotte · North Carolina", staff: 0 },
  { id: "tokyo", country: "jp", es: "Tochigi", en: "Tochigi", staff: 0 },
  { id: "sao-paulo", country: "br", es: "São Paulo", en: "São Paulo", staff: -1 },
];

/**
 * How a team from nothing is funded. The car a new entrant can build is the
 * honest price of every choice here: money buys a faster first car, a bigger
 * factory and a longer runway before the investors want results.
 */
export const BACKERS = {
  garagiste: { id: "garagiste", prestige: 0.12, balance: 0.35, carPercentile: -1, reliability: 46, facility: 1 },
  corporate: { id: "corporate", prestige: 0.38, balance: 0.55, carPercentile: 0.2, reliability: 54, facility: 2 },
  manufacturer: { id: "manufacturer", prestige: 0.62, balance: 0.75, carPercentile: 0.45, reliability: 60, facility: 3 },
};

export const CUSTOM_COLORS = [
  "#f2b705", "#10294f", "#dc0000", "#0b6e3b", "#1e4b9b", "#ff8000", "#ffffff", "#111111",
  "#9aa0a6", "#00a0de", "#a6192e", "#27f4d2", "#f596c8", "#6a3d9a", "#c6f700", "#47c7fc",
];
