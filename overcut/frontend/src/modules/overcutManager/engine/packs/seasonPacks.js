/**
 * Season packs: which seasons have one and how to load it (SRS 6.3, RF-CAR-02).
 *
 * Each pack is code-split (~200 KB each, 38 seasons), so nothing is loaded at
 * startup: `seasonPackYears()` lists the seasons without touching them and
 * `ensureSeasonPack(context, year)` downloads, validates and adds one pack to
 * `context.packs` when the game needs it (the season chosen in Setup, the next
 * season at the off-season, a saved career's year on resume). A pack that fails
 * validation is never handed to the game: "sin pack validado, una temporada no
 * se puede jugar" (SRS 6, criterio 7.2).
 *
 * Packs are generated, not written by hand:
 *   python overcut/src/main/resources/scripts/generate_season_packs.py --f1db f1db.db --all
 */

import { validateSeasonPack } from "./validatePack";

const LOADERS = {
  1976: () => import(/* webpackChunkName: "season-1976" */ "../../data/seasons/1976.json"),
  1986: () => import(/* webpackChunkName: "season-1986" */ "../../data/seasons/1986.json"),
  1988: () => import(/* webpackChunkName: "season-1988" */ "../../data/seasons/1988.json"),
  1990: () => import(/* webpackChunkName: "season-1990" */ "../../data/seasons/1990.json"),
  1991: () => import(/* webpackChunkName: "season-1991" */ "../../data/seasons/1991.json"),
  1992: () => import(/* webpackChunkName: "season-1992" */ "../../data/seasons/1992.json"),
  1993: () => import(/* webpackChunkName: "season-1993" */ "../../data/seasons/1993.json"),
  1994: () => import(/* webpackChunkName: "season-1994" */ "../../data/seasons/1994.json"),
  1995: () => import(/* webpackChunkName: "season-1995" */ "../../data/seasons/1995.json"),
  1996: () => import(/* webpackChunkName: "season-1996" */ "../../data/seasons/1996.json"),
  1997: () => import(/* webpackChunkName: "season-1997" */ "../../data/seasons/1997.json"),
  1998: () => import(/* webpackChunkName: "season-1998" */ "../../data/seasons/1998.json"),
  1999: () => import(/* webpackChunkName: "season-1999" */ "../../data/seasons/1999.json"),
  2000: () => import(/* webpackChunkName: "season-2000" */ "../../data/seasons/2000.json"),
  2001: () => import(/* webpackChunkName: "season-2001" */ "../../data/seasons/2001.json"),
  2002: () => import(/* webpackChunkName: "season-2002" */ "../../data/seasons/2002.json"),
  2003: () => import(/* webpackChunkName: "season-2003" */ "../../data/seasons/2003.json"),
  2004: () => import(/* webpackChunkName: "season-2004" */ "../../data/seasons/2004.json"),
  2005: () => import(/* webpackChunkName: "season-2005" */ "../../data/seasons/2005.json"),
  2006: () => import(/* webpackChunkName: "season-2006" */ "../../data/seasons/2006.json"),
  2007: () => import(/* webpackChunkName: "season-2007" */ "../../data/seasons/2007.json"),
  2008: () => import(/* webpackChunkName: "season-2008" */ "../../data/seasons/2008.json"),
  2009: () => import(/* webpackChunkName: "season-2009" */ "../../data/seasons/2009.json"),
  2010: () => import(/* webpackChunkName: "season-2010" */ "../../data/seasons/2010.json"),
  2011: () => import(/* webpackChunkName: "season-2011" */ "../../data/seasons/2011.json"),
  2012: () => import(/* webpackChunkName: "season-2012" */ "../../data/seasons/2012.json"),
  2013: () => import(/* webpackChunkName: "season-2013" */ "../../data/seasons/2013.json"),
  2014: () => import(/* webpackChunkName: "season-2014" */ "../../data/seasons/2014.json"),
  2016: () => import(/* webpackChunkName: "season-2016" */ "../../data/seasons/2016.json"),
  2018: () => import(/* webpackChunkName: "season-2018" */ "../../data/seasons/2018.json"),
  2019: () => import(/* webpackChunkName: "season-2019" */ "../../data/seasons/2019.json"),
  2020: () => import(/* webpackChunkName: "season-2020" */ "../../data/seasons/2020.json"),
  2021: () => import(/* webpackChunkName: "season-2021" */ "../../data/seasons/2021.json"),
  2022: () => import(/* webpackChunkName: "season-2022" */ "../../data/seasons/2022.json"),
  2023: () => import(/* webpackChunkName: "season-2023" */ "../../data/seasons/2023.json"),
  2024: () => import(/* webpackChunkName: "season-2024" */ "../../data/seasons/2024.json"),
  2025: () => import(/* webpackChunkName: "season-2025" */ "../../data/seasons/2025.json"),
  2026: () => import(/* webpackChunkName: "season-2026" */ "../../data/seasons/2026.json"),
};

export class SeasonPackError extends Error {
  constructor(year, errors) {
    super(`El pack de ${year} no es válido: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? ` (+${errors.length - 3})` : ""}`);
    this.name = "SeasonPackError";
    this.year = year;
    this.errors = errors;
  }
}

/** Seasons with a generated pack, oldest first. */
export const seasonPackYears = () => Object.keys(LOADERS).map(Number).sort((a, b) => a - b);

export const hasSeasonPack = (year) => Object.prototype.hasOwnProperty.call(LOADERS, year);

const cache = new Map();

/**
 * Load and validate one season. Resolves to { pack, warnings }; rejects with a
 * SeasonPackError when the season has no pack or its pack is invalid.
 */
export const loadSeasonPack = (year) => {
  if (!hasSeasonPack(year)) return Promise.reject(new SeasonPackError(year, [`no hay pack para ${year}`]));
  if (!cache.has(year)) {
    const pending = LOADERS[year]().then((module) => {
      const pack = module.default || module;
      const { ok, errors, warnings } = validateSeasonPack(pack);
      if (!ok) throw new SeasonPackError(year, errors);
      return { pack, warnings };
    });
    // A failed load must not stick in the cache.
    pending.catch(() => cache.delete(year));
    cache.set(year, pending);
  }
  return cache.get(year);
};

/**
 * Make sure `context.packs[year]` holds the validated pack of `year` (lazy,
 * RF-CAR-02). Resolves to the pack, or to null when the year has no pack or
 * its pack is invalid - the caller then falls back to the bootstrap world.
 * Never rejects, so the UI can always go on.
 */
export const ensureSeasonPack = (context, year) => {
  if (!context || !hasSeasonPack(year)) return Promise.resolve(null);
  if (!context.packs) context.packs = {};
  if (context.packs[year]) return Promise.resolve(context.packs[year]);
  return loadSeasonPack(year).then(
    ({ pack }) => {
      context.packs[year] = pack;
      return pack;
    },
    (failure) => {
      // eslint-disable-next-line no-console
      console.warn(String(failure?.message || failure));
      return null;
    },
  );
};

/** Several seasons at once (tests, or a career that spans years). */
export const ensureSeasonPacks = (context, years) => Promise.all(years.map((year) => ensureSeasonPack(context, year)));

/** The regulation fields of a pack still waiting for an FIA check. */
export const pendingRegulations = (pack) =>
  Object.entries(pack.regulationsProvenance)
    .filter(([, provenance]) => provenance.status === "pending")
    .map(([field]) => field)
    .sort();

/** Entries of one round, as the grid the weekend should show. */
export const entriesForRound = (pack, round) => pack.entries.filter((entry) => entry.round === round);
