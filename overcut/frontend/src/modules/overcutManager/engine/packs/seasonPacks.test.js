/**
 * Season packs (SRS fase 1): criterio 7.2 "cada temporada jugable carga su
 * pack y pasa la validación" and "ninguna regla fuera de su era", plus the
 * "Fijo" anchors of 6.1/6.4 checked against the f1db data inside each pack.
 */

import pack2005 from "../../data/seasons/2005.json";
import pack2008 from "../../data/seasons/2008.json";
import pack2012 from "../../data/seasons/2012.json";
import events from "../../data/seasons/curated/events.json";
import { validateSeasonPack, eraRulesFor } from "./validatePack";
import { loadSeasonPack, seasonPackYears, pendingRegulations, entriesForRound, SeasonPackError } from "./seasonPacks";

const PACKS = { 2005: pack2005, 2008: pack2008, 2012: pack2012 };
const clone = (value) => JSON.parse(JSON.stringify(value));
const winner = (pack, round) => pack.realResults.find((r) => r.round === round && r.position === 1).driverId;

describe("every season pack is valid (criterio 7.2)", () => {
  test.each(Object.keys(PACKS))("%s validates with no errors", (year) => {
    const { ok, errors } = validateSeasonPack(PACKS[year]);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  test("the loader serves the same seasons and validates them", async () => {
    expect(seasonPackYears()).toEqual([2005, 2008, 2012]);
    const { pack, warnings } = await loadSeasonPack(2012);
    expect(pack.year).toBe(2012);
    expect(warnings.length).toBe(pendingRegulations(pack).length);
  });

  test("a season without a pack cannot be played", async () => {
    await expect(loadSeasonPack(1999)).rejects.toBeInstanceOf(SeasonPackError);
  });

  test("every pack event comes from the curated list", () => {
    Object.entries(PACKS).forEach(([year, pack]) => {
      expect(pack.events.map((e) => e.id)).toEqual(events[year].map((e) => e.id));
    });
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

describe("historical anchors hold in the data (SRS 6.4)", () => {
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

  test("2008: Super Aguri only raced the first four rounds", () => {
    const rounds = [...new Set(pack2008.entries.filter((e) => e.teamId === "super-aguri").map((e) => e.round))];
    expect(rounds).toEqual([1, 2, 3, 4]);
    expect(entriesForRound(pack2008, 5).some((e) => e.teamId === "super-aguri")).toBe(false);
  });

  test("2008: Hamilton champion by one point, Ferrari constructors' champion", () => {
    const [first, second] = pack2008.standings.drivers;
    expect(first.driverId).toBe("lewis-hamilton");
    expect(first.points - second.points).toBe(1);
    expect(pack2008.standings.constructors[0].teamId).toBe("ferrari");
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

  test("2012: DRS and KERS, no refuelling, the full grid has a GLB", () => {
    expect(pack2012.regulations).toMatchObject({ drs: true, energySystem: "kers", refuelling: false });
    expect(pack2012.teams.every((t) => t.car && t.car.status === "ok")).toBe(true);
  });

  test("teams without a GLB fall back to the procedural car (RF-3D-02)", () => {
    expect(pack2005.teams.find((t) => t.id === "red-bull").car).toBeNull();
    expect(pack2008.teams.find((t) => t.id === "toyota").car).toBeNull();
    expect(pack2008.teams.find((t) => t.id === "red-bull").car.status).toBe("review");
  });
});
