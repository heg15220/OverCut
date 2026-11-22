/**
 * Season packs (SRS fases 1 y 5): criterio 7.2 "cada temporada jugable carga su
 * pack y pasa la validación" and "ninguna regla fuera de su era", plus the
 * "Fijo" anchors of 6.1/6.4 checked against the f1db data inside each pack, for
 * every playable season (SRS 1.3: 1976, 1986, 1988, 1990-2014, 2016, 2018-2026).
 */

import pack2005 from "../../data/seasons/2005.json";
import pack2008 from "../../data/seasons/2008.json";
import pack2012 from "../../data/seasons/2012.json";
import events from "../../data/seasons/curated/events.json";
import regulations from "../../data/seasons/curated/regulations.json";
import { validateSeasonPack, eraRulesFor, standingsFromResults } from "./validatePack";
import { ensureSeasonPack, hasSeasonPack, loadSeasonPack, seasonPackYears, pendingRegulations, entriesForRound, SeasonPackError } from "./seasonPacks";

const PLAYABLE = [1976, 1986, 1988, ...Array.from({ length: 25 }, (_, i) => 1990 + i), 2016, ...Array.from({ length: 9 }, (_, i) => 2018 + i)];

/** Teams that raced at least one Grand Prix, from f1db v2026.20.0 (SRS 3.1 was written from memory). */
const TEAMS_RACED = {
  1976: 19, 1986: 14, 1988: 18, 1990: 19, 1991: 18, 1992: 16, 1993: 13, 1994: 14, 1995: 13, 1996: 11, 1997: 12, 1998: 11, 1999: 11,
  2000: 11, 2001: 11, 2002: 11, 2003: 10, 2004: 10, 2005: 10, 2006: 11, 2007: 11, 2008: 11, 2009: 10, 2010: 12, 2011: 12, 2012: 12,
  2013: 11, 2014: 11, 2016: 11, 2018: 10, 2019: 10, 2020: 10, 2021: 10, 2022: 10, 2023: 10, 2024: 10, 2025: 10, 2026: 11,
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const winner = (pack, round) => pack.realResults.find((r) => r.round === round && r.position === 1).driverId;
const roundOf = (pack, grandPrixId) => pack.calendar.find((r) => r.grandPrixId === grandPrixId)?.round;
const roundsOf = (pack, predicate) => [...new Set(pack.entries.filter(predicate).map((e) => e.round))].sort((a, b) => a - b);

const PACKS = {};
const WARNINGS = {};
beforeAll(async () => {
  const loaded = await Promise.all(PLAYABLE.map((year) => loadSeasonPack(year)));
  loaded.forEach(({ pack, warnings }) => {
    PACKS[pack.year] = pack;
    WARNINGS[pack.year] = warnings;
  });
});

describe("every playable season has a valid pack (criterio 7.2)", () => {
  test("the loader lists exactly the playable seasons", () => {
    expect(seasonPackYears()).toEqual(PLAYABLE);
    PLAYABLE.forEach((year) => expect(hasSeasonPack(year)).toBe(true));
    expect(Object.keys(regulations).filter((key) => /^\d+$/.test(key)).map(Number)).toEqual(PLAYABLE);
  });

  test.each(PLAYABLE)("%i validates with no errors", (year) => {
    const { ok, errors } = validateSeasonPack(PACKS[year]);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(PACKS[year].schemaVersion).toBe(2);
    expect(WARNINGS[year].length).toBe(pendingRegulations(PACKS[year]).length);
  });

  test("a season without a pack cannot be played", async () => {
    await expect(loadSeasonPack(1999 + 100)).rejects.toBeInstanceOf(SeasonPackError);
    await expect(loadSeasonPack(2017)).rejects.toBeInstanceOf(SeasonPackError);
  });

  test("every pack event comes from the curated list (years without events have none)", () => {
    PLAYABLE.forEach((year) => {
      expect(PACKS[year].events.map((e) => e.id)).toEqual((events[year] || []).map((e) => e.id));
    });
  });

  test("every regulation value has a provenance, and every 'source' one a url and a quote", () => {
    PLAYABLE.forEach((year) => {
      const { regulations: regs, regulationsProvenance: provenance } = PACKS[year];
      expect(Object.keys(provenance).sort()).toEqual(Object.keys(regs).sort());
      Object.values(provenance).filter((p) => p.status === "source").forEach((p) => {
        expect(p.url).toMatch(/^https:\/\//);
        expect(p.quote.length).toBeGreaterThan(10);
      });
    });
  });
});

describe("lazy loading (SRS 6.3, RF-CAR-02)", () => {
  test("ensureSeasonPack adds one validated pack to the context, once", async () => {
    const context = { packs: {} };
    const pack = await ensureSeasonPack(context, 1988);
    expect(Object.keys(context.packs)).toEqual(["1988"]);
    expect(pack.year).toBe(1988);
    expect(await ensureSeasonPack(context, 1988)).toBe(pack);
    expect(await ensureSeasonPack(context, 2017)).toBeNull();
    expect(Object.keys(context.packs)).toEqual(["1988"]);
  });
});

describe("criterio 7.2 · no rule outside its era, in every pack", () => {
  test.each(PLAYABLE)("%i", (year) => {
    const r = PACKS[year].regulations;
    expect(r.drs).toBe(year >= 2011 && year <= 2025);
    expect(r.activeAero).toBe(year === 2026);
    expect(r.refuelling).toBe(year >= 1994 && year <= 2009);
    expect(r.safetyCar).toBe(year >= 1993);
    expect(r.vsc).toBe(year >= 2015);
    expect(r.energySystem === "kers").toBe(year === 2009 || (year >= 2011 && year <= 2013));
    expect(r.energySystem === "ers").toBe(year >= 2014 && year <= 2025);
    expect(r.tyreType).toBe(year >= 1998 && year <= 2008 ? "grooved" : "slick");
    expect(r.tyreChangesInRace).toBe(year !== 2005);
    expect(r.budgetCap === null).toBe(year < 2021);
    expect(r.aeroTestingRestriction).toBe(year >= 2021);
    expect(r.sprintWeekends > 0).toBe(year >= 2021);
    expect(r.pointsScheme.fastestLap).toBe(year >= 2019 && year <= 2024 ? 1 : 0);
    expect(r.pointsScheme.bestResults !== null || r.pointsScheme.bestResultsSplit !== null).toBe(year <= 1990);
    expect(r.teamOrdersBanned).toBe(year >= 2003 && year <= 2010);
    expect(r.rule107).toBe((year >= 1996 && year <= 2002) || year >= 2011);
    expect(r.qualifyingRaceFuel).toBe(year >= 2003 && year <= 2009);
    // The calendar's real points factor is only ever half or double points where history says so.
    const factors = PACKS[year].calendar.filter((race) => race.pointsFactor !== 1).map((race) => [race.grandPrixId, race.pointsFactor]);
    expect(factors).toEqual({ 1991: [["australia", 0.5]], 2009: [["malaysia", 0.5]], 2014: [["abu-dhabi", 2]], 2021: [["belgium", 0.5]] }[year] || []);
  });

  test("the validator rejects a rule outside its era", () => {
    const errorsOf = (pack) => validateSeasonPack(pack).errors.join("\n");
    const drs1994 = clone(PACKS[1994]);
    drs1994.regulations.drs = true;
    expect(errorsOf(drs1994)).toMatch(/regulations\.drs/);
    const turbo1990 = clone(PACKS[1990]);
    turbo1990.regulations.engineFormulas = [...turbo1990.regulations.engineFormulas, "1.5 V6 turbo"];
    expect(errorsOf(turbo1990)).toMatch(/engineFormulas/);
    const sprint2019 = clone(PACKS[2019]);
    sprint2019.regulations.pointsScheme.sprint = [3, 2, 1];
    expect(errorsOf(sprint2019)).toMatch(/pointsScheme\.sprint/);
    const orders2002 = clone(PACKS[2002]);
    orders2002.regulations.teamOrdersBanned = true;
    expect(errorsOf(orders2002)).toMatch(/teamOrdersBanned/);
  });
});

describe("the validator catches what must never happen", () => {
  const errorsOf = (pack) => validateSeasonPack(pack).errors.join("\n");

  test("DRS in 2008 is outside its era", () => {
    const pack = clone(pack2008);
    pack.regulations.drs = true;
    expect(errorsOf(pack)).toMatch(/regulations\.drs/);
  });

  test("refuelling in 2012 is outside its era", () => {
    const pack = clone(pack2012);
    pack.regulations.refuelling = true;
    expect(errorsOf(pack)).toMatch(/regulations\.refuelling/);
  });

  test("the 2010-2013 top-ten tyre rule is Q3, not Q2", () => {
    const pack = clone(pack2012);
    pack.regulations.topTenStartTyres = "Q2";
    expect(errorsOf(pack)).toMatch(/topTenStartTyres/);
    expect(eraRulesFor(2010).find((r) => r.field === "topTenStartTyres").equals).toBe("Q3");
  });

  test("a driver who was not entered cannot race", () => {
    const pack = clone(pack2012);
    pack.entries.push({ round: 1, teamId: "ferrari", driverId: "nobody-real", carNumber: 99, tyreSupplier: "pirelli" });
    expect(errorsOf(pack)).toMatch(/piloto desconocido nobody-real/);
  });

  test("a driver cannot hold two seats in one round", () => {
    const pack = clone(pack2008);
    const seat = pack.entries.find((e) => e.round === 1 && e.driverId === "lewis-hamilton");
    pack.entries.push({ ...seat, teamId: "ferrari" });
    expect(errorsOf(pack)).toMatch(/dos asientos/);
  });

  test("points that do not match the scheme are rejected", () => {
    const pack = clone(pack2005);
    pack.realResults.find((r) => r.position === 1).points = 25;
    expect(errorsOf(pack)).toMatch(/^points: /m);
  });

  test("standings that do not add up under the year's rules are rejected", () => {
    const pack = clone(PACKS[1988]);
    pack.regulations.pointsScheme.bestResults = null; // every result counting would make Prost champion
    expect(errorsOf(pack)).toMatch(/standings: alain-prost suma 105/);
    const adjusted = clone(PACKS[2007]);
    adjusted.standingsAdjustments = [];
    expect(errorsOf(adjusted)).toMatch(/standings: mclaren suma 218/);
  });

  test("a sprint scored with the wrong scheme is rejected", () => {
    const pack = clone(PACKS[2023]);
    pack.regulations.pointsScheme.sprint = [3, 2, 1];
    expect(errorsOf(pack)).toMatch(/en el sprint de la ronda/);
  });

  test("a projected seat cannot sit in a raced round", () => {
    const pack = clone(PACKS[2026]);
    pack.entries.find((e) => e.round === 1).projected = true;
    expect(errorsOf(pack)).toMatch(/proyección en una ronda disputada/);
  });

  test("tyre suppliers must be the ones the entries used", () => {
    const pack = clone(pack2008);
    pack.regulations.tyreSuppliers = ["bridgestone", "michelin"];
    expect(errorsOf(pack)).toMatch(/tyreSuppliers/);
  });

  test("a sensitive event can only be a note (RF-HIS-00)", () => {
    const pack = clone(pack2005);
    pack.events[0] = { ...pack.events[0], sensitive: true, kind: "constraint" };
    expect(errorsOf(pack)).toMatch(/RF-HIS-00/);
  });

  test("a venue that never held a GP cannot be in the calendar", () => {
    const pack = clone(pack2012);
    pack.calendar[0].circuitId = "hanoi";
    expect(errorsOf(pack)).toMatch(/hanoi nunca/);
  });

  test("unknown fields fail the schema", () => {
    const pack = clone(pack2012);
    pack.regulations.turboBoost = true;
    expect(errorsOf(pack)).toMatch(/^schema: /m);
  });
});

describe("historical anchors hold in the data (SRS 3.1, 6.1, 6.4)", () => {
  test("teams that raced, per season, from f1db entries", () => {
    PLAYABLE.forEach((year) => {
      const raced = new Set(PACKS[year].entries.map((e) => e.teamId));
      expect({ year, teams: raced.size }).toEqual({ year, teams: TEAMS_RACED[year] });
      expect(PACKS[year].teams).toHaveLength(TEAMS_RACED[year]);
    });
  });

  test("1976: Nürburgring on the calendar; Lauda misses Austria and the Netherlands and is back at Monza", () => {
    const pack = PACKS[1976];
    expect(pack.calendar).toHaveLength(16);
    expect(pack.calendar.find((r) => r.grandPrixId === "germany").circuitId).toBe("nurburgring");
    const lauda = roundsOf(pack, (e) => e.driverId === "niki-lauda");
    [roundOf(pack, "austria"), roundOf(pack, "netherlands")].forEach((round) => expect(lauda).not.toContain(round));
    expect(lauda).toContain(roundOf(pack, "italy"));
    expect(pack.standings.drivers[0]).toMatchObject({ driverId: "james-hunt", points: 69 });
  });

  test("1976: best car only and best 7 of each half for the constructors (McLaren 75 -> 74)", () => {
    const pack = PACKS[1976];
    expect(pack.regulations.pointsScheme).toMatchObject({ constructorsBestCarOnly: true, dropScoresConstructors: true });
    expect(standingsFromResults(pack).constructors.mclaren).toBe(74);
    expect(pack.standings.constructors.find((row) => row.teamId === "mclaren").points).toBe(74);
  });

  test("1986 and 1988: best 11 results for the drivers; Senna 1988 champion with fewer points scored than Prost", () => {
    expect(PACKS[1986].regulations.engineFormulas.every((f) => f.endsWith("turbo"))).toBe(true);
    const pack = PACKS[1988];
    const [first, second] = pack.standings.drivers;
    expect([first.driverId, second.driverId]).toEqual(["ayrton-senna", "alain-prost"]);
    const prostScored = pack.realResults.filter((r) => r.driverId === "alain-prost").reduce((sum, r) => sum + r.points, 0);
    expect(prostScored).toBe(105);
    expect(second.points).toBe(87);
    expect(pack.realResults.filter((r) => r.position === 1 && r.teamId === "mclaren")).toHaveLength(15);
  });

  test("1993 and 1995: entrants that never turned up are not in the pack", () => {
    expect(PACKS[1993].teams.some((t) => t.id === "march")).toBe(false);
    expect(PACKS[1995].teams.some((t) => t.id === "larrousse")).toBe(false);
  });

  test("2002: Arrows withdraws after the German GP (round 12)", () => {
    expect(roundsOf(PACKS[2002], (e) => e.teamId === "arrows")).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(PACKS[2002].calendar[11].grandPrixId).toBe("germany");
  });

  test("2005: aggregate qualifying for six rounds, one lap from the European GP", () => {
    const formats = pack2005.calendar.map((r) => r.qualifyingFormat);
    expect(formats.slice(0, 6).every((f) => f === "AGGREGATE")).toBe(true);
    expect(formats.slice(6).every((f) => f === "ONE_LAP")).toBe(true);
    expect(pack2005.calendar[6].grandPrixId).toBe("europe");
  });

  test("2005 Indianapolis: only the six Bridgestone cars raced", () => {
    const race = pack2005.calendar.find((r) => r.grandPrixId === "united-states");
    const raced = pack2005.realResults.filter((r) => r.round === race.round && r.laps > 0);
    expect(raced).toHaveLength(6);
    const bridgestone = new Set(pack2005.entries.filter((e) => e.round === race.round && e.tyreSupplier === "bridgestone").map((e) => e.driverId));
    raced.forEach((r) => expect(bridgestone.has(r.driverId)).toBe(true));
  });

  test("2005: no tyre changes in the race, grooved tyres, two suppliers", () => {
    expect(pack2005.regulations.tyreChangesInRace).toBe(false);
    expect(pack2005.regulations.tyreType).toBe("grooved");
    expect(pack2005.regulations.tyreSuppliers).toEqual(["bridgestone", "michelin"]);
  });

  test("2006: Toro Rosso's restricted V10 next to everyone's V8", () => {
    expect(PACKS[2006].regulations.engineFormulas).toEqual(["2.4 V8", "3.0 V10"]);
    expect(PACKS[2006].teams.find((t) => t.id === "toro-rosso").engines[0].formula).toBe("3.0 V10");
  });

  test("2007: McLaren excluded from the constructors' championship", () => {
    expect(PACKS[2007].standings.constructors.find((row) => row.teamId === "mclaren").points).toBe(0);
    expect(PACKS[2007].standingsAdjustments).toEqual([expect.objectContaining({ table: "constructors", id: "mclaren", points: -218 })]);
  });

  test("2008: Super Aguri only raced the first four rounds", () => {
    expect(roundsOf(pack2008, (e) => e.teamId === "super-aguri")).toEqual([1, 2, 3, 4]);
    expect(entriesForRound(pack2008, 5).some((e) => e.teamId === "super-aguri")).toBe(false);
  });

  test("2008: Hamilton champion by one point, Ferrari constructors' champion", () => {
    const [first, second] = pack2008.standings.drivers;
    expect(first.driverId).toBe("lewis-hamilton");
    expect(first.points - second.points).toBe(1);
    expect(pack2008.standings.constructors[0].teamId).toBe("ferrari");
  });

  test("2009: half points in Malaysia; Brawn champions", () => {
    expect(PACKS[2009].calendar.find((r) => r.grandPrixId === "malaysia").pointsFactor).toBe(0.5);
    expect(PACKS[2009].standings.constructors[0].teamId).toBe("brawn");
  });

  test("2012: seven different winners in the first seven races", () => {
    const winners = [1, 2, 3, 4, 5, 6, 7].map((round) => winner(pack2012, round));
    expect(new Set(winners).size).toBe(7);
    expect(winner(pack2012, 8)).toBe("fernando-alonso");
  });

  test("2012: D'Ambrosio replaces the banned Grosjean at Monza", () => {
    const monza = pack2012.calendar.find((r) => r.grandPrixId === "italy");
    const lotus = entriesForRound(pack2012, monza.round).filter((e) => e.teamId === "lotus-f1").map((e) => e.driverId);
    expect(lotus.sort()).toEqual(["jerome-dambrosio", "kimi-raikkonen"]);
  });

  test("2012: Vettel champion by three points over Alonso", () => {
    const [first, second] = pack2012.standings.drivers;
    expect([first.driverId, second.driverId]).toEqual(["sebastian-vettel", "fernando-alonso"]);
    expect(first.points - second.points).toBe(3);
  });

  test("2012: DRS and KERS, no refuelling", () => {
    expect(pack2012.regulations).toMatchObject({ drs: true, energySystem: "kers", refuelling: false });
  });

  test("2014: double points at the last race, Abu Dhabi", () => {
    const pack = PACKS[2014];
    expect(pack.regulations.pointsScheme.doubleLastRace).toBe(true);
    expect(pack.calendar[pack.calendar.length - 1]).toMatchObject({ grandPrixId: "abu-dhabi", pointsFactor: 2 });
    expect(pack.realResults.find((r) => r.round === pack.calendar.length && r.position === 1).points).toBe(50);
  });

  test("2016: the elimination qualifying of the first two rounds", () => {
    expect(PACKS[2016].calendar.slice(0, 2).every((r) => r.qualifyingFormat === "ELIMINATION")).toBe(true);
    expect(PACKS[2016].calendar.slice(2).every((r) => r.qualifyingFormat === "KNOCKOUT")).toBe(true);
  });

  test("2018: Force India's two entrants are one team, and its first 59 points are gone", () => {
    const pack = PACKS[2018];
    expect(pack.teams.filter((t) => t.id === "force-india")).toHaveLength(1);
    expect(pack.standings.constructors.find((row) => row.teamId === "force-india").points).toBe(52);
  });

  test("2020: the pandemic calendar of 17 Grands Prix", () => {
    expect(PACKS[2020].calendar).toHaveLength(17);
    expect(PACKS[2020].standingsAdjustments).toEqual([expect.objectContaining({ id: "racing-point", points: -15 })]);
  });

  test("sprints: 3 with 3-2-1 in 2021, 3 with 8..1 in 2022, 6 from 2023", () => {
    expect(PACKS[2021].regulations.pointsScheme.sprint).toEqual([3, 2, 1]);
    expect(PACKS[2021].calendar.filter((r) => r.sprint).map((r) => r.grandPrixId)).toEqual(["great-britain", "italy", "sao-paulo"]);
    expect(PACKS[2022].calendar.filter((r) => r.sprint)).toHaveLength(3);
    [2023, 2024, 2025, 2026].forEach((year) => expect(PACKS[year].calendar.filter((r) => r.sprint)).toHaveLength(6));
    expect(PACKS[2023].sprintResults.find((r) => r.position === 1).points).toBe(8);
  });

  test("2023: the cancelled Imola race is not on the calendar", () => {
    expect(PACKS[2023].calendar).toHaveLength(22);
    expect(PACKS[2023].calendar.some((r) => r.grandPrixId === "emilia-romagna" || r.circuitId === "imola")).toBe(false);
  });

  test("2026: eleven teams with Audi and Cadillac, active aero instead of DRS, unraced rounds projected", () => {
    const pack = PACKS[2026];
    expect(pack.teams.map((t) => t.id)).toEqual(expect.arrayContaining(["audi", "cadillac"]));
    expect(pack.regulations).toMatchObject({ drs: false, activeAero: true, energySystem: "ers2026", budgetCap: 215 });
    const unraced = pack.calendar.filter((r) => !r.resultsAvailable).map((r) => r.round);
    unraced.forEach((round) => {
      expect(pack.realResults.some((r) => r.round === round)).toBe(false);
      expect(entriesForRound(pack, round).every((e) => e.projected)).toBe(true);
      expect(entriesForRound(pack, round)).toHaveLength(22);
    });
  });
});
