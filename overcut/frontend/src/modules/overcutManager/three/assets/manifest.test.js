/**
 * Asset manifest (SRS 4.3, RF-3D-01, RF-3D-02, RF-3D-06) and its contract with
 * the data the pipeline writes (RNF-03, criterio 7.2). Pure: nothing here
 * creates a WebGL renderer or fetches a file.
 */

import * as THREE from "three";
import realManifest from "../../data/manager-assets.json";
import calibrated from "../../data/splines.json";
import { loadSeasonPack, seasonPackYears } from "../../engine/packs/seasonPacks";
import { LOD_DISTANCES, allowed, assetUrl, carAssetFor, circuitAssetFor, creditsFor, lodForDistance } from "./manifest";
import { heightSampler } from "./assetCircuit";
import { carSpec } from "../carBody";

const car = (extra) => ({
  season: 2012,
  teamRef: "red-bull",
  chassis: "RB8",
  wheelNodes: ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"],
  lods: [{ file: "cars/2012/red-bull/lod0.glb", bytes: 4_000_000, sha256: "a", triangles: 200000 }],
  metrics: { wheelbaseM: 3.4, wheelRadiusM: { wheel_fl: 0.33, wheel_fr: 0.33, wheel_rl: 0.34, wheel_rr: 0.34 } },
  author: "Someone",
  license: "CC-BY-4.0",
  source: "https://example.org/rb8",
  status: "ok",
  riskRipped: false,
  ...extra,
});

const circuit = (extra) => ({
  circuitRef: "melbourne",
  layoutRef: "albert_park",
  layoutId: "melbourne-1",
  validFrom: 1996,
  validTo: 2020,
  file: "circuits/melbourne-1.glb",
  splineId: "albert-park",
  spline: "circuits/melbourne-1.spline.json",
  author: "Someone",
  license: "CC-BY-4.0",
  riskRipped: false,
  ...extra,
});

const data = {
  version: 1,
  hash: "abc123",
  baseUrl: "/manager-assets/",
  cars: [
    car(),
    car({ teamRef: "mclaren", chassis: "MP4-27", riskRipped: null, author: "Other", license: "CC-BY-SA-4.0", status: "review" }),
    car({ teamRef: "ferrari", chassis: "F2012", riskRipped: true }),
    car({ season: 2008, teamRef: "red-bull", chassis: "RB4" }),
  ],
  circuits: [
    circuit(),
    circuit({ circuitRef: "monaco", layoutRef: "monaco", layoutId: "monaco-6", splineId: "monaco-2003", validFrom: 2003, validTo: 2014, riskRipped: true }),
  ],
};

const PRIVATE = { isPublic: false };
const PUBLIC = { isPublic: true };

describe("RF-3D-01 · manifest lookups", () => {
  it("finds the car of a team in a season, and nothing for other seasons or teams", () => {
    expect(carAssetFor(2012, "red-bull", PRIVATE, data).chassis).toBe("RB8");
    expect(carAssetFor("2008", "red-bull", PRIVATE, data).chassis).toBe("RB4");
    expect(carAssetFor(2005, "red-bull", PRIVATE, data)).toBeNull();
    expect(carAssetFor(2012, "williams", PRIVATE, data)).toBeNull();
  });

  it("finds a circuit by spline id, by layout id, or by circuit and years", () => {
    expect(circuitAssetFor({ splineId: "monaco-2003" }, PRIVATE, data).circuitRef).toBe("monaco");
    expect(circuitAssetFor({ layoutId: "melbourne-1" }, PRIVATE, data).splineId).toBe("albert-park");
    expect(circuitAssetFor({ circuitRef: "melbourne", year: 2012 }, PRIVATE, data).layoutId).toBe("melbourne-1");
    expect(circuitAssetFor({ layoutRef: "albert_park", year: 2012 }, PRIVATE, data).layoutId).toBe("melbourne-1");
    expect(circuitAssetFor({ circuitRef: "melbourne", year: 1990 }, PRIVATE, data)).toBeNull();
    expect(circuitAssetFor({ circuitRef: "melbourne" }, PRIVATE, data)).toBeNull();
    expect(circuitAssetFor({ layoutId: "spa-5" }, PRIVATE, data)).toBeNull();
    expect(circuitAssetFor({}, PRIVATE, data)).toBeNull();
  });

  it("a public build shows only assets known not to be ripped (SRS 3.3, 7.3)", () => {
    expect(allowed(null, PRIVATE)).toBe(false);
    expect(allowed({ riskRipped: true }, PRIVATE)).toBe(true);
    expect(allowed({ riskRipped: false }, PUBLIC)).toBe(true);
    expect(allowed({ riskRipped: true }, PUBLIC)).toBe(false);
    expect(allowed({ riskRipped: null }, PUBLIC)).toBe(false);
    expect(allowed({}, PUBLIC)).toBe(false);
    expect(carAssetFor(2012, "mclaren", PUBLIC, data)).toBeNull();
    expect(carAssetFor(2012, "ferrari", PUBLIC, data)).toBeNull();
    expect(carAssetFor(2012, "red-bull", PUBLIC, data).chassis).toBe("RB8");
    expect(circuitAssetFor({ splineId: "monaco-2003" }, PUBLIC, data)).toBeNull();
    expect(circuitAssetFor({ splineId: "monaco-2003" }, PRIVATE, data)).not.toBeNull();
  });

  it("versions every URL with the manifest hash (RNF-04)", () => {
    const url = assetUrl("cars/2012/red-bull/lod0.glb", data);
    expect(url).toContain("/manager-assets/cars/2012/red-bull/lod0.glb");
    expect(url).toMatch(/\?v=abc123$/);
    expect(assetUrl("x.glb", { ...data, hash: "ffff" })).not.toBe(assetUrl("x.glb", data));
  });

  it("credits every car of a season with author and licence (RF-3D-06, criterio 7.2)", () => {
    const credits = creditsFor(2012, data);
    expect(credits).toHaveLength(3);
    credits.forEach((credit) => {
      expect(credit.author).toBeTruthy();
      expect(credit.license).toBeTruthy();
    });
    expect(credits.find((credit) => credit.teamRef === "mclaren")).toMatchObject({ author: "Other", license: "CC-BY-SA-4.0", status: "review" });
    expect(creditsFor(1976, data)).toEqual([]);
  });

  it("picks the level of detail by distance (RNF-02)", () => {
    expect(LOD_DISTANCES).toEqual([0, 28, 80]);
    expect(lodForDistance(0)).toBe(0);
    expect(lodForDistance(27.9)).toBe(0);
    expect(lodForDistance(28)).toBe(1);
    expect(lodForDistance(79.9)).toBe(1);
    expect(lodForDistance(80)).toBe(2);
    expect(lodForDistance(5000)).toBe(2);
  });
});

describe("RF-3D-01 · road height from the circuit spline", () => {
  // A 40 m square, [x, y, z] with y up: flat at 0, then a 2 m crest on the far side.
  const spline = { points: [[0, 0, 0], [10, 0, 0], [20, 2, 0], [20, 2, 10], [20, 0, 20], [0, 0, 20], [0, 0, 10]] };

  it("interpolates between samples by distance along the lap", () => {
    const heightAt = heightSampler(spline);
    // Total horizontal length: 10 + 10 + 10 + 10 + 20 + 10 + 10 = 80 m.
    expect(heightAt(0)).toBe(0);
    expect(heightAt(5 / 80)).toBeCloseTo(0, 6);
    expect(heightAt(15 / 80)).toBeCloseTo(1, 6);
    expect(heightAt(20 / 80)).toBeCloseTo(2, 6);
    expect(heightAt(25 / 80)).toBeCloseTo(2, 6);
    expect(heightAt(35 / 80)).toBeCloseTo(1, 6);
  });

  it("wraps around the line, whatever the share", () => {
    const heightAt = heightSampler(spline);
    expect(heightAt(1 + 15 / 80)).toBeCloseTo(heightAt(15 / 80), 9);
    expect(heightAt(-1 + 15 / 80)).toBeCloseTo(heightAt(15 / 80), 9);
    expect(heightAt(1)).toBeCloseTo(heightAt(0), 9);
    // The closing leg (0,0,10) -> (0,0,0) is flat.
    expect(heightAt(75 / 80)).toBeCloseTo(0, 9);
  });

  it("is flat without a spline", () => {
    expect(heightSampler(null)(0.3)).toBe(0);
    expect(heightSampler({ points: [] })(0.7)).toBe(0);
  });
});

/* ------------------------------------------------------------------ contract */

const MB = 1024 * 1024;

describe("manifest contract: data/manager-assets.json as the pipeline wrote it", () => {
  const cars = realManifest.cars || [];
  const circuits = realManifest.circuits || [];

  it("has the shape of SRS 4.3", () => {
    expect(Array.isArray(cars)).toBe(true);
    expect(Array.isArray(circuits)).toBe(true);
    expect(typeof realManifest.hash).toBe("string");
    expect(realManifest.hash.length).toBeGreaterThan(0);
  });

  it("every car: author and licence (criterio 7.2), four wheel nodes (RF-3D-05), each LOD within 8 MB (RNF-03)", () => {
    cars.forEach((entry) => {
      const name = `${entry.season} ${entry.teamRef}`;
      expect([name, Boolean(entry.author), Boolean(entry.license)]).toEqual([name, true, true]);
      expect(Number.isInteger(entry.season)).toBe(true);
      expect(entry.teamRef).toBeTruthy();
      // Four wheel nodes, or none when the model's tyres are welded to the suspension (metrics.wheels = "static").
      if (entry.metrics?.wheels === "static") expect(entry.wheelNodes).toEqual([]);
      else expect(new Set(entry.wheelNodes)).toEqual(new Set(["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"]));
      expect(entry.lods.length).toBeGreaterThan(0);
      entry.lods.forEach((lod) => {
        expect(lod.file).toBeTruthy();
        expect([name, lod.file, lod.bytes <= 8 * MB]).toEqual([name, lod.file, true]);
      });
      expect([null, true, false]).toContain(entry.riskRipped ?? null);
    });
  });

  it("the showroom-only hero level (RF-3D-06) stays within 8 MB (RNF-03), sits next to the LODs and is never sharper geometry than LOD0", () => {
    cars
      .filter((entry) => entry.hero)
      .forEach((entry) => {
        const name = `${entry.season} ${entry.teamRef}`;
        expect([name, entry.hero.bytes <= 8 * MB]).toEqual([name, true]);
        expect(entry.hero.file).toMatch(new RegExp(`^cars/${entry.season}/.+\\.hero\\.glb$`));
        expect(entry.hero.triangles).toBe(entry.lods[0].triangles);
        expect(Math.max(...entry.hero.textureSize)).toBeGreaterThan(512);
      });
  });

  it("every circuit: author and licence, within 60 MB (RNF-03), spline within 2 m of the mesh (criterio 7.2), a sane year range", () => {
    circuits.forEach((entry) => {
      const name = entry.layoutId || entry.splineId;
      expect([name, Boolean(entry.author), Boolean(entry.license)]).toEqual([name, true, true]);
      expect([name, entry.bytes <= 60 * MB]).toEqual([name, true]);
      // Criterio 7.2: <= 2 m medido en >= 60 % de la vuelta. Donde no se puede medir (escapatorias de asfalto,
      // asfalto partido en mallas) solo entra con revisión manual aprobada, y el manifiesto lo deja dicho.
      const meets = entry.deviation.maxM <= 2 && entry.deviation.measuredShare >= 0.6;
      expect([name, entry.meetsCriterion]).toEqual([name, meets]);
      expect([name, meets || entry.reviewApproved === true]).toEqual([name, true]);
      expect([name, entry.start?.confidence]).toEqual([name, "reviewed"]);
      expect([name, entry.validFrom <= entry.validTo]).toEqual([name, true]);
    });
  });

  it("every circuit has its calibrated spline in data/splines.json, for the same layout (RF-3D-03)", () => {
    const splines = calibrated.splines || {};
    circuits.forEach((entry) => {
      const spline = splines[entry.splineId] || Object.values(splines).find((candidate) => candidate.layoutId === entry.layoutId);
      expect([entry.splineId, Boolean(spline)]).toEqual([entry.splineId, true]);
      expect(spline.layoutId).toBe(entry.layoutId);
      expect(spline.points.length % 2).toBe(0);
      expect(spline.points.length).toBeGreaterThan(100);
    });
  });

  it("no car or circuit is listed twice", () => {
    const carKeys = cars.map((entry) => `${entry.season}:${entry.teamRef}`);
    expect(new Set(carKeys).size).toBe(carKeys.length);
    const circuitKeys = circuits.map((entry) => entry.splineId);
    expect(new Set(circuitKeys).size).toBe(circuitKeys.length);
  });
});

describe("criterio 7.2 · every team of every pack season has a visible car", () => {
  it("is the manifest's car when there is one and the build may show it, else the procedural car of its era (RF-3D-02)", async () => {
    const years = seasonPackYears();
    expect(years).toEqual(expect.arrayContaining([2005, 2008, 2012]));
    const packs = await Promise.all(years.map((year) => loadSeasonPack(year)));
    packs.forEach(({ pack }) => {
      expect(pack.teams.length).toBeGreaterThan(0);
      [PRIVATE, PUBLIC].forEach((options) => {
        pack.teams.forEach((team) => {
          const asset = carAssetFor(pack.year, team.id, options);
          if (asset) {
            expect(asset.lods.length).toBeGreaterThan(0);
            expect(allowed(asset, options)).toBe(true);
          } else {
            // The fallback: the procedural car of the season's era, which needs no file at all.
            const spec = carSpec(pack.year);
            expect(spec.era).toBeTruthy();
            expect(spec.front).toBeGreaterThan(spec.rear);
          }
        });
      });
    });
  });

  it("the procedural fallback really builds, with the four wheels the race view animates", () => {
    // jsdom has no 2D canvas: give the livery textures a do-nothing context.
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
      new Proxy({}, { get: (target, key) => (key in target ? target[key] : () => ({ addColorStop: () => {} })), set: (target, key, value) => { target[key] = value; return true; } }),
    );
    try {
      // eslint-disable-next-line global-require
      const { buildCar } = require("../carModel");
      [2005, 2008, 2012].forEach((year) => {
        const object = buildCar({ year, color: "#1e41ff", color2: "#ffd700", name: "Test", number: 1, compound: year >= 2007 ? "soft" : null });
        expect(object).toBeInstanceOf(THREE.Group);
        expect(object.userData.wheels).toHaveLength(4);
        object.userData.wheels.forEach((wheel) => {
          expect(wheel.spin).toBeInstanceOf(THREE.Object3D);
          expect(wheel.radius).toBeGreaterThan(0.2);
        });
      });
    } finally {
      getContext.mockRestore();
    }
  });
});
