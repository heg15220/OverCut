/**
 * Season packs: which seasons have one and how to load it (SRS 6.3, RF-CAR-02).
 *
 * Each pack is code-split, so choosing a season downloads only that year. A
 * pack that fails validation is never handed to the game: "sin pack validado,
 * una temporada no se puede jugar".
 *
 * Packs are generated, not written by hand:
 *   python overcut/src/main/resources/scripts/generate_season_packs.py --f1db f1db.db --years 2005 2008 2012
 */

import { validateSeasonPack } from "./validatePack";

const LOADERS = {
  2005: () => import("../../data/seasons/2005.json"),
  2008: () => import("../../data/seasons/2008.json"),
  2012: () => import("../../data/seasons/2012.json"),
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

/** The regulation fields of a pack still waiting for an FIA check. */
export const pendingRegulations = (pack) =>
  Object.entries(pack.regulationsProvenance)
    .filter(([, provenance]) => provenance.status === "pending")
    .map(([field]) => field)
    .sort();

/** Entries of one round, as the grid the weekend should show. */
export const entriesForRound = (pack, round) => pack.entries.filter((entry) => entry.round === round);
