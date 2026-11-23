/**
 * RF-CAR-05 (Histórico estricto / Libre), SRS 6.1 guided anchor, SRS 6.5 season
 * mix, RNF-06 save v4 and the criterio 7.2 harness (spectator seasons, Spearman).
 * The full 1,000-run validation is scripts/validateSeasons.js (report in
 * docs/manager/validation/); here only a smoke of it runs.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import anchors from "../../data/balance/historical-anchors.json";
import {
  DEFAULT_MODE, MANAGER_VERSION, MODES, PHASES, closeWeekend, openOffseason, createCareer, createContext, entrantsFor, guidanceFor, isStrict, seasonMixOf,
  simulateWeekend,
} from "../career";
import { carRatingOf } from "../car";
import { validateCareer } from "../save";
import { startNextSeason } from "../offseason";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import { CRITERIA, realOrderOf, simulateSpectatorSeason, spearman, summarizeSeason, verdictOf } from "./seasonValidation";

let context = null;
let packs = {};

beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

describe("RF-CAR-05 · historical modes", () => {
  it("defaults to strict, persists the mode and reads it with isStrict", () => {
    expect(DEFAULT_MODE).toBe(MODES.STRICT);
    const strict = createCareer(context, { year: 2012, teamId: "williams", seed: "mode-a" });
    const free = createCareer(context, { year: 2012, teamId: "williams", seed: "mode-a", mode: "free" });
    expect(strict.mode).toBe("strict");
    expect(isStrict(strict)).toBe(true);
    expect(free.mode).toBe("free");
    expect(isStrict(free)).toBe(false);
    expect(JSON.parse(JSON.stringify(strict)).mode).toBe("strict");
  });

  it("SRS 6.5: k comes from data, 0.6 strict and 0.2 free", () => {
    expect(seasonMixOf({ mode: "strict" })).toBe(anchors.seasonMix.strict);
    expect(seasonMixOf({ mode: "free" })).toBe(anchors.seasonMix.free);
    expect(anchors.seasonMix).toMatchObject({ strict: 0.6, free: 0.2 });
  });

  it("SRS 6.5: between seasons a rival is pulled k = 0.6 (strict) or 0.2 (free) towards its real next year", () => {
    const next = (mode) => {
      const career = createCareer(context, { year: 2008, teamId: "williams", seed: "mix", mode });
      while (career.phase !== PHASES.REVIEW && !career.ended) {
        simulateWeekend(career);
        closeWeekend(career);
      }
      openOffseason(career);
      startNextSeason(context, career);
      return career;
    };
    const strict = next("strict");
    const free = next("free");
    expect(strict.year).toBe(2009);
    expect(free.mode).toBe("free");
    // Same simulated 2008, different pull: the 2009 rivals differ, and strict sits closer to the real 2009 cars.
    const realWorld = createCareer(context, { year: 2009, teamId: "williams", seed: "mix" }).world;
    const real = realWorld.teams;
    const spread = (career) => {
      const ids = Object.keys(real).filter((id) => id !== "williams" && career.world.teams[id]);
      const mean = (teams) => ids.reduce((sum, id) => sum + carRatingOf(teams[id].car), 0) / ids.length;
      const simMean = mean(career.world.teams);
      const realMean = mean(real);
      return ids.reduce((sum, id) => sum + Math.abs(carRatingOf(career.world.teams[id].car) - simMean - (carRatingOf(real[id].car) - realMean)), 0) / ids.length;
    };
    expect(spread(strict)).toBeLessThan(spread(free));
    expect(strict.world.anchors).toBeTruthy();
    // The new year's fixed rules come with it (RF-CAR-02).
    expect(strict.world.regulations).toEqual(realWorld.regulations);
  });

  it("guides rivals towards the pack's race-by-race anchors in strict mode only, never the player", () => {
    const strict = createCareer(context, { year: 2012, teamId: "mclaren", seed: "guide" });
    const free = createCareer(context, { year: 2012, teamId: "mclaren", seed: "guide", mode: "free" });
    expect(strict.world.anchors["red-bull"]).toHaveLength(packs[2012].calendar.length);
    const guidance = guidanceFor(strict);
    expect(guidance.mclaren).toBeUndefined();
    expect(Object.keys(guidance).length).toBe(Object.keys(strict.world.teams).length - 1);
    expect(Object.values(guidance).some((entry) => Math.abs(entry.pace) > 0.5)).toBe(true);
    expect(guidanceFor(free)).toEqual({});
    // Free mode races on the cars as they are; strict moves rivals by their guidance, the player not at all.
    entrantsFor(free).forEach((entrant) => expect(entrant.carRating).toBe(carRatingOf(free.world.teams[entrant.teamId].car)));
    entrantsFor(strict)
      .filter((entrant) => entrant.teamId === "mclaren")
      .forEach((entrant) => expect(entrant.carRating).toBe(carRatingOf(strict.world.teams.mclaren.car)));
    // Re-centred: the guided field is neither inflated nor deflated.
    const total = Object.values(guidance).reduce((sum, entry) => sum + entry.pace, 0);
    expect(Math.abs(total)).toBeLessThan(1e-6);
  });

  it("RNF-06: a v3 save migrates (v4, then v5 with the driver attributes) with the default mode", () => {
    const career = createCareer(context, { year: 2008, teamId: "williams", seed: "v3" });
    const saved = JSON.parse(JSON.stringify(career));
    saved.v = 3;
    delete saved.mode;
    const loaded = validateCareer(saved);
    expect(MANAGER_VERSION).toBe(5);
    expect(loaded.v).toBe(5);
    expect(loaded.mode).toBe(DEFAULT_MODE);
    // A saved world without anchors is simply not guided.
    delete loaded.world.anchors;
    expect(guidanceFor(loaded)).toEqual({});
  });
});

describe("criterio 7.2 · validation harness", () => {
  it("computes Spearman's rho on the common items", () => {
    expect(spearman(["a", "b", "c", "d"], ["a", "b", "c", "d"])).toBe(1);
    expect(spearman(["d", "c", "b", "a"], ["a", "b", "c", "d"])).toBe(-1);
    expect(spearman(["b", "a", "c", "x"], ["a", "b", "c"])).toBeCloseTo(0.5, 6);
  });

  it("runs a spectator season with no principal, reproducibly (RNF-05)", () => {
    const one = simulateSpectatorSeason(context, { year: 2008, seed: "spec-1" });
    const two = simulateSpectatorSeason(context, { year: 2008, seed: "spec-1" });
    expect(one).toEqual(two);
    expect(one.order).toHaveLength(Object.keys(packs[2008].teams).length);
    expect(one.realChampion).toBe("ferrari");
    expect(one.spearman).toBeGreaterThan(0.5);
  });

  it("a spectator career has no player: every car races its real entries and nothing is managed", () => {
    const career = createCareer(context, { year: 2012, teamId: "sauber", seed: "spec-2", spectator: true });
    expect(entrantsFor(career).some((entrant) => entrant.isUser)).toBe(false);
    expect(guidanceFor(career).sauber).toBeDefined();
    const confidence = career.board.confidence;
    const balance = career.finances.balance;
    simulateWeekend(career);
    closeWeekend(career);
    expect(career.round).toBe(1);
    expect(career.board.confidence).toBe(confidence);
    expect(career.finances.balance).toBe(balance);
    expect(career.inbox.filter((item) => item.kind === "event")).toHaveLength(0);
    expect(career.phase).not.toBe(PHASES.REVIEW);
  });

  it("summarises runs and gives the verdict", () => {
    const world = createCareer(context, { year: 2008, teamId: "williams", seed: "real" }).world;
    expect(realOrderOf(world).slice(0, 3)).toEqual(["ferrari", "mclaren", "bmw-sauber"]);
    const runs = [
      { order: ["ferrari", "mclaren"], champion: "ferrari", realChampion: "ferrari", spearman: 1 },
      { order: ["mclaren", "ferrari"], champion: "mclaren", realChampion: "ferrari", spearman: -1 },
      { order: ["ferrari", "mclaren"], champion: "ferrari", realChampion: "ferrari", spearman: 1 },
    ];
    const season = summarizeSeason(2008, runs);
    expect(season).toMatchObject({ realChampion: "ferrari", realChampionRank: 1, realChampionMostProbable: true });
    expect(season.realChampionShare).toBeCloseTo(2 / 3, 6);
    expect(season.meanSpearman).toBeCloseTo(1 / 3, 6);
    expect(verdictOf([season]).pass).toBe(season.meanSpearman >= CRITERIA.meanSpearman);
  });

  it("smoke: a few strict seasons of every pack correlate with history", () => {
    seasonPackYears().forEach((year) => {
      const runs = [0, 1, 2].map((index) => simulateSpectatorSeason(context, { year, seed: `smoke-${year}-${index}` }));
      const season = summarizeSeason(year, runs);
      expect(season.meanSpearman).toBeGreaterThan(0.6);
    });
  });
});
