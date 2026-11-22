/**
 * Criterio 7.2 "todo equipo de cada temporada tiene coche visible: GLB o
 * procedural con su librea", for every playable season (SRS 1, 3.1): 1976,
 * 1986, 1988, 1990-2014, 2016 and 2018-2026 (RF-3D-01, RF-3D-02).
 *
 * The teams of a season come from its pack when there is one (engine/packs)
 * and otherwise from f1db (__fixtures__/f1db-season-teams.json, constructor
 * ids from season_entrant_constructor), so the check does not wait for the
 * packs of fase 5.
 */

import realManifest from "../../data/manager-assets.json";
import curatedCars from "../../data/seasons/curated/car-assets.json";
import f1dbTeams from "./__fixtures__/f1db-season-teams.json";
import { hasSeasonPack, loadSeasonPack } from "../../engine/packs/seasonPacks";
import { allowed, carAssetFor } from "./manifest";
import { carSpec } from "../carBody";

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, k) => from + k);
const PLAYABLE = [1976, 1986, 1988, ...range(1990, 2014), 2016, ...range(2018, 2026)];
const PRIVATE = { isPublic: false };
const PUBLIC = { isPublic: true };

const teamsOf = async (year) => {
  if (hasSeasonPack(year)) {
    const { pack } = await loadSeasonPack(year);
    return pack.teams.map((team) => team.id);
  }
  return f1dbTeams.seasons[String(year)];
};

describe("criterio 7.2 · every team of every playable season has a visible car", () => {
  it("has an f1db team list for every playable season, and a pack's teams match it", async () => {
    PLAYABLE.forEach((year) => expect(f1dbTeams.seasons[String(year)]?.length).toBeGreaterThan(0));
    const withPack = PLAYABLE.filter(hasSeasonPack);
    const packs = await Promise.all(withPack.map(teamsOf));
    withPack.forEach((year, k) => expect([...packs[k]].sort()).toEqual([...f1dbTeams.seasons[String(year)]].sort()));
  });

  it("is the manifest's GLB when there is one and the build may show it, else the procedural car of its era (RF-3D-02)", async () => {
    const coverage = {};
    const lists = await Promise.all(PLAYABLE.map(teamsOf));
    PLAYABLE.forEach((year, k) => {
      const teams = lists[k];
      let glb = 0;
      [PRIVATE, PUBLIC].forEach((options) => {
        teams.forEach((team) => {
          const asset = carAssetFor(year, team, options);
          if (asset) {
            expect(allowed(asset, options)).toBe(true);
            expect(asset.lods.length).toBeGreaterThan(0);
            expect(asset.author).toBeTruthy();
            expect(asset.license).toBeTruthy();
            if (options === PRIVATE) glb += 1;
          } else {
            // The fallback needs no file: the procedural car of the season's era, painted by carModel.js.
            const spec = carSpec(year);
            expect(spec.era).toBeTruthy();
            expect(spec.front).toBeGreaterThan(spec.rear);
          }
        });
      });
      coverage[year] = `${glb}/${teams.length}`;
    });
    // Every team counts once, whether it is a GLB or the procedural car.
    expect(Object.keys(coverage).map(Number)).toEqual(PLAYABLE);
    // 2012 is the only season whose whole grid is in f1-3d-assets (SRS 3.1).
    expect(coverage[2012]).toBe("12/12");
  });

  it("every manifest car and every curated GLB belongs to a team that raced that season (f1db constructor id)", () => {
    realManifest.cars.forEach((car) => {
      expect(PLAYABLE).toContain(car.season);
      expect(f1dbTeams.seasons[String(car.season)]).toContain(car.teamRef);
    });
    Object.entries(curatedCars)
      .filter(([season]) => season !== "_doc")
      .forEach(([season, teams]) => {
        Object.entries(teams).forEach(([team, entry]) => {
          expect(f1dbTeams.seasons[season]).toContain(team);
          expect(["ok", "review"]).toContain(entry.status);
          expect(entry.release).toMatch(/^coches-/);
        });
      });
  });
});
