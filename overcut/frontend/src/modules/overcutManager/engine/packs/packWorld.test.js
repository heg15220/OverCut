/**
 * RF-CAR-02: a season with a pack is played from its pack - grid, drivers,
 * calendar, regulations and points - and criterio 7.2: no Grand Prix shows a
 * team or driver that was not entered in it, nor a rule outside its era.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import { PHASES, closeWeekend, createCareer, createContext, entrantsFor, eraOf, simulateWeekend, startableYears } from "../career";
import { carRatingOf } from "../car";
import { energyEra, refuellingEra, rulesFor } from "../race";
import { scoreRace } from "../standings";
import { validateCareer } from "../save";
import { loadSeasonPack, seasonPackYears } from "./seasonPacks";
import { buildPackWorld, eraWithRegulations, selectableTeams } from "./packWorld";

let packs = {};
let context = null;

beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

const entered = (pack, round) => {
  const byTeam = {};
  pack.entries.filter((entry) => entry.round === round).forEach((entry) => {
    (byTeam[entry.teamId] = byTeam[entry.teamId] || []).push(entry.driverId);
  });
  return byTeam;
};

describe("RF-CAR-02 · world from the season pack", () => {
  it("offers every pack year as a start season, even without bootstrap data for it", () => {
    expect(startableYears(context)).toEqual(expect.arrayContaining([2005, 2008, 2012]));
  });

  it("builds 2012 from its pack: twelve teams, the real calendar, regulations and race drivers", () => {
    const career = createCareer(context, { year: 2012, teamId: "red-bull", seed: "pack-2012" });
    const { world } = career;
    const pack = packs[2012];
    expect(Object.keys(world.teams).sort()).toEqual(pack.teams.map((team) => team.id).sort());
    expect(world.races).toHaveLength(pack.calendar.length);
    world.races.forEach((race, index) => {
      expect(race.date).toBe(pack.calendar[index].date);
      expect(race.laps).toBe(pack.calendar[index].laps);
    });
    expect(world.races[0]).toMatchObject({ name: "Australian Grand Prix", round: 1, laps: 58 });
    expect(world.regulations).toEqual(pack.regulations);
    expect(world.pack).toMatchObject({ year: 2012, schemaVersion: pack.schemaVersion, ratings: "v1-qualifying-gap" });
    expect(world.teams["red-bull"].drivers.sort()).toEqual(["mark-webber", "sebastian-vettel"]);
    expect(world.teams["red-bull"].chassis).toEqual(["RB8"]);
    expect(world.drivers["sebastian-vettel"]).toMatchObject({ age: 24, nat: "de", status: "grid" });
    expect(() => validateCareer(JSON.parse(JSON.stringify(career)))).not.toThrow();
  });

  it("orders the cars by the pack's real qualifying pace", () => {
    const { world } = createCareer(context, { year: 2012, teamId: "ferrari", seed: "pack-pace" });
    const byPace = Object.values(world.teams).sort((a, b) => carRatingOf(b.car) - carRatingOf(a.car)).map((team) => team.id);
    const realOrder = [...packs[2012].ratings.teams].sort((a, b) => b.paceIndex - a.paceIndex).map((team) => team.teamId);
    expect(byPace[byPace.length - 1]).toBe("hrt");
    expect(byPace.slice(0, 3)).toEqual(expect.arrayContaining(realOrder.slice(0, 2)));
  });

  it("is deterministic for the same seed (RF-SIM-15)", () => {
    const one = buildPackWorld({ pack: packs[2008], bootstrap: context.bootstrap, reference: context.reference, seed: "same" });
    const two = buildPackWorld({ pack: packs[2008], bootstrap: context.bootstrap, reference: context.reference, seed: "same" });
    expect(JSON.stringify(one)).toBe(JSON.stringify(two));
  });
});

describe("criterio 7.2 · fixed anchors per Grand Prix", () => {
  it("keeps Super Aguri 2008 out of the player's choice and off the grid after its last Grand Prix", () => {
    const career = createCareer(context, { year: 2008, teamId: "ferrari", seed: "aguri" });
    expect(career.world.teams["super-aguri"]).toMatchObject({ partial: true, rounds: 4 });
    expect(selectableTeams(career.world).map((team) => team.id)).not.toContain("super-aguri");
    expect(() => createCareer(context, { year: 2008, teamId: "super-aguri", seed: "aguri" })).toThrow("team-unavailable");
    expect(entrantsFor(career).some((entrant) => entrant.teamId === "super-aguri")).toBe(true);
    career.round = 4;
    expect(entrantsFor(career).some((entrant) => entrant.teamId === "super-aguri")).toBe(false);
    expect(entrantsFor(career)).toHaveLength(20);
  });

  it("fields the real substitute: d'Ambrosio for Lotus at Monza 2012", () => {
    const career = createCareer(context, { year: 2012, teamId: "ferrari", seed: "monza" });
    const monza = career.world.races.findIndex((race) => race.name === "Italian Grand Prix");
    career.round = monza;
    const lotus = entrantsFor(career).filter((entrant) => entrant.teamId === "lotus-f1").map((entrant) => entrant.driverId).sort();
    expect(lotus).toEqual(entered(packs[2012], monza + 1)["lotus-f1"].sort());
    expect(lotus).toContain("jerome-dambrosio");
  });

  it("runs a whole 2008 season with only entered rivals in every classification", () => {
    const career = createCareer(context, { year: 2008, teamId: "williams", seed: "season-2008" });
    let guard = 0;
    while (career.phase !== PHASES.REVIEW && !career.ended && guard < 30) {
      const round = career.round + 1;
      const summary = simulateWeekend(career);
      const real = entered(packs[2008], round);
      summary.rows.forEach((row) => {
        if (row.teamId === career.teamId) return;
        expect(real[row.teamId]).toEqual(expect.arrayContaining([row.driverId]));
      });
      closeWeekend(career);
      guard += 1;
    }
    expect(career.season.results).toHaveLength(packs[2008].calendar.length);
  });
});

describe("criterio 7.2 · regulations of the pack", () => {
  it("lays the pack's regulations over the era profile", () => {
    const career2008 = createCareer(context, { year: 2008, teamId: "ferrari", seed: "rules-08" });
    const career2012 = createCareer(context, { year: 2012, teamId: "ferrari", seed: "rules-12" });
    expect(eraOf(career2008).features).toMatchObject({ drs: false, refuelling: true, virtualSafetyCar: false, knockoutQualifying: true });
    expect(eraOf(career2012).features).toMatchObject({ drs: true, refuelling: false, energySystem: "kers" });
    expect(eraOf(career2012).points).toEqual(packs[2012].regulations.pointsScheme.race);
  });

  it("scores with the pack's points scheme", () => {
    const era = eraWithRegulations(2005, packs[2005].regulations);
    const rows = Array.from({ length: 10 }, (_, index) => ({ driverId: `d${index}`, teamId: `t${index}`, position: index + 1, status: "finished" }));
    const { driverPoints } = scoreRace({ rows, fastestLapDriverId: "d9", year: 2005, era });
    expect(Object.values(driverPoints)).toEqual(packs[2005].regulations.pointsScheme.race);
  });

  it("agrees with the race engine's rules for every pack season", () => {
    // Fase 3: race.js reads its rules from the era (engine/rules.js); with the pack's era they are the pack's,
    // and the era-defaults of the bare year must not contradict the pack either.
    Object.values(packs).forEach((pack) => {
      const { regulations, year } = pack;
      [eraWithRegulations(year, regulations), year].forEach((era) => {
        expect(refuellingEra(era)).toBe(regulations.refuelling);
        expect(energyEra(era) || "none").toBe(regulations.energySystem);
        expect(rulesFor(era).tyres.mandatoryDryCompounds).toBe(regulations.mandatoryDryCompounds);
        expect(rulesFor(era).tyres.changesInRace).toBe(regulations.tyreChangesInRace);
        expect(rulesFor(era).drs.enabled).toBe(regulations.drs);
      });
    });
  });

  it("criterio 7.2: a rival fields its real substitute even when his home team is another (Ferrari, Adelaide 1991)", () => {
    const career = createCareer(context, { year: 1991, teamId: "williams", seed: "sub-91" });
    career.round = 15;
    const ferrari = entrantsFor(career).filter((entrant) => entrant.teamId === "ferrari").map((entrant) => entrant.driverId).sort();
    expect(ferrari).toEqual(["gianni-morbidelli", "jean-alesi"]);
    // Every rival car of that Grand Prix is one of its real entries.
    const entries = entered(packs[1991], 16);
    entrantsFor(career).filter((entrant) => entrant.teamId !== "williams").forEach((entrant) => {
      expect(entries[entrant.teamId]).toContain(entrant.driverId);
    });
  });

  it("a driver the player has signed is not fielded by his old team", () => {
    const career = createCareer(context, { year: 1991, teamId: "minardi", seed: "sub-91b" });
    career.round = 15;
    const ferrari = entrantsFor(career).filter((entrant) => entrant.teamId === "ferrari").map((entrant) => entrant.driverId);
    expect(ferrari).not.toContain("gianni-morbidelli");
    expect(entrantsFor(career).filter((entrant) => entrant.driverId === "gianni-morbidelli").map((entrant) => entrant.teamId)).toEqual(["minardi"]);
  });

  it("only a team that arrived late or left early is partial, not one that skipped a Grand Prix (SRS 6.1)", () => {
    const ids = (year) => selectableTeams(buildPackWorld({ pack: packs[year], bootstrap: fallbackBootstrap, reference, seed: "partial" })).map((team) => team.id);
    expect(ids(1976)).toContain("ferrari");
    expect(ids(2008)).not.toContain("super-aguri");
    expect(ids(2002)).not.toContain("arrows");
    expect(createCareer(context, { year: 1976, teamId: "ferrari", seed: "f76" }).teamId).toBe("ferrari");
  });
});
