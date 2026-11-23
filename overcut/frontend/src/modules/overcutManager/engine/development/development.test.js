/**
 * The car as parts and its development (SRS 5.5 RF-DEV-01..08, RF-SIM-14,
 * 6.5, RNF-06, RNF-07).
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { substream } from "../../../overcutTrayectoria/engine/rng";
import { reference } from "../../data/reference";
import DEV from "../../data/balance/development.json";
import fixture from "../__fixtures__/careerV1.json";
import {
  PHASES, closeWeekend, createCareer, seasonWorld, createContext, createWeekendRace, entrantsFor, eraOf, openOffseason, simulateWeekend, startProject, weekendRaceArgs, MANAGER_VERSION,
} from "../career";
import { startNextSeason } from "../offseason";
import { aiDevelopmentStep, carRatingOf, roundCar } from "../car";
import { validateCareer } from "../save";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import { eraProfileFor } from "../../../overcutTrayectoria/engine/eras";
import { AREA_LIST, areasOf, partsForEra, rawAreasOf, seedParts, syncCar } from "./parts";
import { designCost, designRounds, expectedDesign } from "./design";
import { allocationFor, atrActive } from "./aero";
import { engineSupplyFor } from "./supply";
import { raceIncidents, worsen } from "./damage";
import { unitComponents } from "./units";
import {
  aeroResourcesOf, designQuote, developmentAfterRace, fitNewUnitNow, fitPart, manufactureParts, regulationCutCar, sparesOf, startDesign, unitsOfDriver,
} from "./index";

let context = null;
let bare = null;
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  context = createContext(fallbackBootstrap, reference, Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack])));
  bare = createContext(fallbackBootstrap, reference);
});

const own = (career) => career.world.teams[career.teamId];

/** Run a weekend and close it, the way the Continue button does. */
const raceOnce = (career) => {
  simulateWeekend(career);
  return closeWeekend(career);
};

describe("RF-DEV-01 parts by era, mapped onto the four areas", () => {
  it("has the era's part types: ERS from 2014, KERS in the KERS years for the teams that ran it", () => {
    expect(partsForEra(eraProfileFor(2005))).toEqual(["frontWing", "rearWing", "chassis", "sidepods", "floor", "suspension", "engine", "gearbox"]);
    expect(partsForEra(eraProfileFor(2016))).toContain("ers");
    expect(partsForEra(eraProfileFor(2016))).not.toContain("kers");
    expect(partsForEra(eraProfileFor(2012), "red-bull")).toContain("kers");
    expect(partsForEra(eraProfileFor(2012), "hrt")).not.toContain("kers");
    expect(partsForEra(eraProfileFor(2010))).not.toContain("kers");
  });

  it("seeds every real team's parts so day-one race pace is exactly the old one", () => {
    [2005, 2008, 2012].forEach((year) => {
      // Free mode: strict guidance (RF-CAR-05) moves rivals' race pace on purpose; here only the parts count.
      const career = createCareer(context, { year, teamId: Object.values(context.packs[year].teams)[3].id, seed: `seed-${year}`, mode: "free" });
      Object.values(career.world.teams).forEach((team) => {
        const raw = rawAreasOf(team.parts, 0);
        AREA_LIST.forEach((area) => expect(Math.abs(raw[area] - team.car[area])).toBeLessThan(1e-3));
        expect(areasOf(team.parts, 1)).toEqual(roundCar(team.car));
      });
      entrantsFor(career).forEach((entrant) => {
        expect(entrant.carRating).toBe(carRatingOf(career.world.teams[entrant.teamId].car));
      });
    });
    [1976, 1988, 2016, 2024].forEach((year) => {
      const career = createCareer(bare, { year, teamId: seasonWorld(bare, year, `seed-${year}`).order[0], seed: `seed-${year}` });
      Object.values(career.world.teams).forEach((team) => {
        expect(areasOf(team.parts, 0)).toEqual(roundCar(team.car));
      });
    });
  });

  it("gives each part stats with a stable per-team character", () => {
    const team = { id: "x", car: { aero: 70, power: 65, chassis: 60, reliability: 55 } };
    const a = seedParts({ team, year: 2012, era: eraProfileFor(2012) });
    const b = seedParts({ team, year: 2012, era: eraProfileFor(2012) });
    expect(a.designs).toEqual(b.designs);
    const wing = Object.values(a.designs).find((design) => design.part === "frontWing");
    expect(Object.keys(wing.stats)).toEqual(Object.keys(DEV.parts.frontWing.stats));
    expect(wing.stats.lowSpeedDownforce).not.toBe(70);
  });
});

describe("RF-DEV-02/03 design, manufacture and fit", () => {
  it("prices the four paces ×1, ×1.5, ×3, ×4 and shortens the lead time", () => {
    const normal = designCost("floor", "normal", 2012);
    expect(designCost("floor", "accelerated", 2012) / normal).toBeCloseTo(1.5, 1);
    expect(designCost("floor", "intense", 2012) / normal).toBeCloseTo(3, 1);
    expect(designCost("floor", "emergency", 2012) / normal).toBeCloseTo(4, 1);
    expect(designRounds("floor", "emergency")).toBeLessThan(designRounds("floor", "normal"));
  });

  it("designs a front wing, builds two units and fits them, moving the aero area", () => {
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "dev-1" });
    const team = own(career);
    const balance = career.finances.balance;
    const quote = designQuote(career, { part: "frontWing", pace: "intense", target: "now", focus: "lowSpeedDownforce" });
    expect(quote.blocked).toEqual([]);
    expect(quote.expected.areas.aero).toBeGreaterThan(0);
    const started = startDesign(career, { part: "frontWing", pace: "intense", target: "now", focus: "lowSpeedDownforce" });
    expect(started.ok).toBe(true);
    expect(career.finances.balance).toBe(balance - quote.cost);
    const before = { ...team.parts.expertise.frontWing };
    for (let round = 0; round < quote.rounds; round += 1) raceOnce(career);
    const fresh = Object.values(team.parts.designs).find((design) => design.part === "frontWing" && design.version === 2);
    expect(fresh).toBeTruthy();
    // RF-DEV-03: Intense gives +50 % expertise, more on the focused stat.
    const growth = team.parts.expertise.frontWing.dirtyAir - before.dirtyAir;
    expect(growth).toBeCloseTo(DEV.expertise.growth * DEV.paces.intense.expertise * (fresh.failed ? DEV.expertise.failedGrowth : 1), 5);
    expect(team.parts.expertise.frontWing.lowSpeedDownforce - before.lowSpeedDownforce).toBeGreaterThan(growth);
    expect(manufactureParts(career, { designId: fresh.id, count: 99, fit: "both" }).units).toBe(DEV.parts.frontWing.maxUnits);
    expect(manufactureParts(career, { designId: fresh.id, count: 1 }).error).toBe("units");
    const aeroBefore = team.car.aero;
    raceOnce(career);
    expect(team.parts.items.filter((item) => item.design === fresh.id)).toHaveLength(DEV.parts.frontWing.maxUnits);
    [0, 1].forEach((car) => expect(team.parts.items.find((item) => item.id === team.parts.loadout[car].frontWing).design).toBe(fresh.id));
    expect(fresh.failed || team.car.aero > aeroBefore - 0.6).toBe(true);
    // Fitting an old spare back is allowed between races, and changes the car.
    const spare = sparesOf(team.parts, "frontWing").find((item) => item.design !== fresh.id && item.condition === "perfect");
    expect(spare).toBeTruthy();
    expect(fitPart(career, { itemId: spare.id, car: 1 }).ok).toBe(true);
    expect(team.parts.cars[1]).not.toEqual(team.parts.cars[0]);
  });

  it("lets expertise raise both the quality and the ceiling of a design", () => {
    const career = createCareer(context, { year: 2012, teamId: "red-bull", seed: "dev-2" });
    const team = own(career);
    const args = { part: "floor", pace: "normal", target: "now", car: team.car, bestRival: { aero: team.car.aero - 4, power: 60, chassis: 60, reliability: 60 }, technical: 70, facility: 4 };
    const low = expectedDesign({ ...args, parts: { ...team.parts, expertise: { floor: { lowSpeedDownforce: 30, mediumSpeedDownforce: 30, highSpeedDownforce: 30, dirtyAir: 30 } } } });
    const high = expectedDesign({ ...args, parts: { ...team.parts, expertise: { floor: { lowSpeedDownforce: 95, mediumSpeedDownforce: 95, highSpeedDownforce: 95, dirtyAir: 95 } } } });
    expect(high.areas.aero).toBeGreaterThan(low.areas.aero * 1.3);
  });

  it("charges design and build money against the cost cap from 2021", () => {
    const career = createCareer(bare, { year: 2024, teamId: "williams", seed: "cap" });
    career.rd.spend = 1e12;
    expect(startDesign(career, { part: "suspension", pace: "normal" }).error).toBe("cap");
  });
});

describe("RF-DEV-04 aero resources", () => {
  it("only restricts by position from 2021, the champion getting least", () => {
    expect(atrActive(eraOf(createCareer(context, { year: 2012, teamId: "williams", seed: "a" })), 2012)).toBe(false);
    expect(atrActive(eraProfileFor(2024), 2024)).toBe(true);
    expect(allocationFor(2024, 1)).toBeLessThan(allocationFor(2024, 10));
    expect(allocationFor(2021, 1)).toBeLessThan(allocationFor(2021, 10));
  });

  it("blocks an aero design once the period's wind tunnel runs are spent", () => {
    const career = createCareer(bare, { year: 2024, teamId: "mclaren", seed: "atr" });
    career.staff.technical.rating = 60;
    const status = aeroResourcesOf(career);
    expect(status.active).toBe(true);
    expect(status.allowance.windTunnelRuns).toBeLessThan(DEV.aeroResources.base.windTunnelRuns * 1.2);
    own(career).facility = 5;
    career.finances.balance = 1e12;
    let guard = 0;
    while (!designQuote(career, { part: "floor", pace: "intense" }).blocked.includes("aero") && guard < 10) {
      startDesign(career, { part: "floor", pace: "intense" });
      guard += 1;
    }
    expect(designQuote(career, { part: "floor", pace: "intense" }).blocked).toContain("aero");
    // Mechanical work is not wind-tunnel time.
    expect(designQuote(career, { part: "suspension", pace: "normal" }).blocked).not.toContain("aero");
  });
});

describe("RF-DEV-05 engine supply", () => {
  it("tells works teams from customers using the pack's engine makers and known partnerships", () => {
    const y2012 = createCareer(context, { year: 2012, teamId: "williams", seed: "e" }).world.teams;
    expect(y2012.ferrari.parts.supply.works).toBe(true);
    expect(y2012.mercedes.parts.supply.works).toBe(true);
    expect(y2012.sauber.parts.supply).toMatchObject({ works: false, manufacturer: "ferrari" });
    expect(y2012.mclaren.parts.supply.works).toBe(false);
    expect(y2012["red-bull"].parts.supply.works).toBe(false);
    const y2008 = createCareer(context, { year: 2008, teamId: "williams", seed: "e" }).world.teams;
    expect(y2008.mclaren.parts.supply.works).toBe(true);
    expect(y2008["bmw-sauber"].parts.supply.works).toBe(true);
    expect(y2008["toro-rosso"].parts.supply.works).toBe(false);
    expect(engineSupplyFor({ id: "ferrari", name: "Ferrari" }, 1976).works).toBe(true);
    expect(engineSupplyFor({ id: "tyrrell", name: "Tyrrell" }, 1976).works).toBe(false);
  });

  it("does not let a customer design the engine, and charges it the annual fee", () => {
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "fee" });
    expect(designQuote(career, { part: "engine" }).blocked).toContain("customer");
    expect(designQuote(career, { part: "kers" }).blocked).toContain("customer");
    expect(designQuote(career, { part: "gearbox" }).blocked).not.toContain("customer");
    const works = createCareer(context, { year: 2012, teamId: "ferrari", seed: "fee" });
    expect(designQuote(works, { part: "engine" }).blocked).not.toContain("customer");
  });
});

describe("RF-DEV-06/07 next year's car and rule changes", () => {
  it("puts next-year designs into next year's car and cuts carried advantage at a real rule change", () => {
    const mean = { aero: 60, power: 60, chassis: 60, reliability: 60 };
    const cut = regulationCutCar({ car: { aero: 70, power: 70, chassis: 70, reliability: 70 }, fieldMean: mean, year: 2009 });
    expect(cut.aero).toBeLessThan(70);
    expect(cut.aero).toBeGreaterThan(60);
    expect(cut.power).toBe(70);
    expect(regulationCutCar({ car: { aero: 70 }, fieldMean: mean, year: 2010 }).aero).toBe(70);
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "next" });
    const quote = designQuote(career, { part: "floor", target: "next" });
    const now = designQuote(career, { part: "floor", target: "now" });
    expect(quote.expected.areas.aero).toBeGreaterThan(now.expected.areas.aero);
    expect(startDesign(career, { part: "floor", target: "next" }).ok).toBe(true);
    for (let round = 0; round < quote.rounds; round += 1) raceOnce(career);
    expect(career.rd.nextGains.aero).toBeDefined();
  });
});

describe("RF-DEV-08 damage", () => {
  it("reads incidents from the race and worsens parts through four states", () => {
    expect(worsen("perfect", "light")).toBe("light");
    expect(worsen("light", "light")).toBe("heavy");
    expect(worsen("heavy", "heavy")).toBe("destroyed");
    const state = { cars: [{ id: "a" }, { id: "b" }], events: [{ type: "contact", carId: "a" }, { type: "dnf", carId: "b", reason: "accident" }, { type: "dnf", carId: "b", reason: "mechanical" }] };
    expect(raceIncidents(state)).toEqual([{ driverId: "a", kind: "contact" }, { driverId: "b", kind: "accident" }]);
  });

  it("replaces a destroyed part with a spare, or builds an emergency one", () => {
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "dmg" });
    const team = own(career);
    simulateWeekend(career);
    const driverId = team.drivers[0];
    career.weekend.result.incidents = Array.from({ length: 12 }, () => ({ driverId, kind: "accident" }));
    const balance = career.finances.balance;
    closeWeekend(career);
    const damaged = career.inbox.find((item) => item.kind === "part-damage");
    expect(damaged).toBeTruthy();
    expect(damaged.damage.some((row) => row.condition === "destroyed")).toBe(true);
    const fittedItems = team.parts.loadout.flatMap((car) => Object.values(car)).map((id) => team.parts.items.find((entry) => entry.id === id)).filter(Boolean);
    expect(fittedItems.filter((item) => item.condition === "destroyed")).toEqual([]);
    const emergency = damaged.damage.some((row) => row.replaced === "emergency");
    expect(!emergency || career.finances.balance < balance).toBe(true);
  });
});

describe("RF-SIM-14 units and grid penalties", () => {
  it("counts the era's components", () => {
    expect(unitComponents(eraProfileFor(1998), 1998, 16)).toEqual([]);
    expect(unitComponents(eraProfileFor(2005), 2005, 19).map((comp) => [comp.id, comp.mode, comp.limit])).toEqual([["engine", "weekend", 2]]);
    expect(unitComponents(eraProfileFor(2012), 2012, 20).map((comp) => comp.id)).toEqual(["engine", "gearbox"]);
    expect(unitComponents(eraProfileFor(2016), 2016, 21).map((comp) => comp.id)).toEqual(["ice", "tc", "mguh", "mguk", "es", "ce", "gearbox"]);
    expect(unitComponents(eraProfileFor(2026), 2026, 24).map((comp) => comp.id)).not.toContain("mguh");
  });

  it("wears units across a season, deterministically, and feeds penalties into the next race", () => {
    const play = () => {
      const career = createCareer(context, { year: 2012, teamId: "williams", seed: "units" });
      const penalties = [];
      const applied = [];
      while (career.phase !== PHASES.REVIEW && !career.ended) {
        const args = weekendRaceArgs(career);
        Object.entries(args.gridPenalties).forEach(([id, places]) => penalties.push([career.round, id, places]));
        const state = createWeekendRace(career);
        applied.push(...state.events.filter((event) => event.type === "grid-penalty").map((event) => [career.round, event.carId]));
        raceOnce(career);
      }
      return { career, penalties, applied };
    };
    const a = play();
    const b = play();
    expect(a.penalties).toEqual(b.penalties);
    expect(a.applied).toEqual(a.penalties.map(([round, id]) => [round, id]));
    // The allocation is used up across the season: the field's median driver takes the limit or
    // up to two less (one driver alone depends on how many of its races ended early, which wear less).
    // RF-SIM-14: a mechanical retirement now breaks the unit of its real failure group - in 2006-2013
    // f1db puts a quarter of them on the engine (race-reliability.json measured) - so fewer extra engines.
    const driver = own(a.career).drivers[0];
    const engine = unitsOfDriver(a.career, driver).find((comp) => comp.id === "engine");
    const used = Object.keys(a.career.units.drivers).map((id) => a.career.units.drivers[id].engine.used).sort((x, y) => x - y);
    // eslint-disable-next-line no-console
    console.log(`engines used: ${used.join(" ")} (limit ${engine.limit}); own driver ${engine.used}`);
    expect(used[used.length >> 1]).toBeGreaterThanOrEqual(engine.limit - 2);
    expect(engine.used).toBeGreaterThanOrEqual(engine.limit - 2);
    const users = Object.values(a.career.units.drivers);
    expect(users.length).toBeGreaterThanOrEqual(24);
  });

  it("a forced new unit past the allocation costs the era's grid places", () => {
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "force" });
    raceOnce(career);
    const driverId = own(career).drivers[0];
    career.units.drivers[driverId].engine.used = 8;
    const result = fitNewUnitNow(career, { driverId, comp: "engine" });
    expect(result.penalty.places).toBe(10);
    expect(weekendRaceArgs(career).gridPenalties[driverId]).toBe(10);
  });
});

describe("task 9: rivals develop through their parts with the old season-long progression", () => {
  it("matches aiDevelopmentStep exactly before 2021", () => {
    const career = createCareer(context, { year: 2012, teamId: "williams", seed: "ai" });
    const rival = career.world.teams.ferrari;
    let expected = { ...rival.car };
    const raceCount = career.world.races.length;
    for (let round = 0; round < 6; round += 1) {
      expected = aiDevelopmentStep({ team: { ...rival, car: expected }, raceCount, stream: substream(career.seed, "ai-dev", career.year, round, "ferrari") });
      raceOnce(career);
      expect(rival.car).toEqual(expected);
      expect(areasOf(rival.parts, 0)).toEqual(expected);
    }
  });

  it("keeps the field's average gain under the ATR from 2021", () => {
    const career = createCareer(bare, { year: 2024, teamId: "williams", seed: "ai24" });
    const start = Object.values(career.world.teams).filter((team) => team.id !== "williams").map((team) => team.car.aero);
    for (let round = 0; round < 8; round += 1) raceOnce(career);
    const end = Object.values(career.world.teams).filter((team) => team.id !== "williams").map((team) => team.car.aero);
    const gain = end.reduce((sum, value, index) => sum + value - start[index], 0) / end.length;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThan(3);
  });
});

describe("RNF-06 save migration v1 -> v2", () => {
  it("loads a v1 career, gives it parts, expertise and units, and keeps its race pace", () => {
    expect(MANAGER_VERSION).toBe(4);
    const career = validateCareer(JSON.parse(JSON.stringify(fixture.career)));
    expect(career.v).toBe(4);
    expect(own(career).parts.items.length).toBeGreaterThan(0);
    expect(own(career).parts.expertise.floor).toBeTruthy();
    expect(career.units.components.map((comp) => comp.id)).toEqual(["engine", "gearbox"]);
    expect(career.units.drivers[own(career).drivers[0]].engine.used).toBeGreaterThanOrEqual(1);
    const entrants = entrantsFor(career).map((e) => ({ id: e.id, carRating: e.carRating, reliability: e.reliability, powerBias: e.powerBias, aeroBias: e.aeroBias }));
    expect(entrants).toEqual(fixture.entrants);
    // The v1 area project in the factory keeps running and the season goes on.
    expect(career.rd.projects.length + career.rd.done.length).toBeGreaterThan(0);
    raceOnce(career);
    expect(career.round).toBe(fixture.round + 1);
  });

  it("survives a whole new season after migration", () => {
    const career = validateCareer(JSON.parse(JSON.stringify(fixture.career)));
    while (career.phase !== PHASES.REVIEW && !career.ended) raceOnce(career);
    if (career.ended) return;
    openOffseason(career);
    startNextSeason(context, career);
    expect(career.year).toBe(2013);
    expect(own(career).parts.season).toBe(2013);
    expect(own(career).parts.expertise).toBeTruthy();
    expect(career.units.year).toBe(2013);
    Object.values(career.world.teams).forEach((team) => expect(areasOf(team.parts, 0)).toEqual(roundCar(team.car)));
  });
});

describe("RNF-07 balance in data", () => {
  it("keeps every part, pace and table in development.json", () => {
    Object.values(DEV.parts).filter((spec) => spec.stats).forEach((spec) => {
      Object.keys(spec.stats).forEach((stat) => expect(DEV.stats[stat]).toBeTruthy());
    });
    expect(DEV.paces.intense.expertise).toBe(1.5);
    expect(Object.values(DEV.regulationChanges).filter((entry) => entry.changes).every((entry) => entry.status === "pending" || entry.status === "source")).toBe(true);
  });

  it("syncCar is the mean of both cars", () => {
    const team = { id: "y", car: { aero: 70, power: 65, chassis: 60, reliability: 55 } };
    team.parts = seedParts({ team, year: 2012, era: eraProfileFor(2012), withItems: true });
    expect(syncCar(team)).toEqual(roundCar({ aero: 70, power: 65, chassis: 60, reliability: 55 }));
  });
});

it("developmentAfterRace is safe before any race", () => {
  const career = createCareer(context, { year: 2005, teamId: "renault", seed: "safe" });
  expect(() => developmentAfterRace(career)).not.toThrow();
  expect(startProject(career, { area: "aero", size: "small" }).ok).toBe(true);
});
