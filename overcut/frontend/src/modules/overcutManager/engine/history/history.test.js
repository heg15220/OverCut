/**
 * History in a career (SRS 6.1, 6.4; RF-INB-02, RF-INB-03, RF-HIS-00).
 *
 *   - curated events: valid in every playable season's pack, 5-12 per season, with a source;
 *   - RF-HIS-00: a sensitive event is a note and never has a game effect;
 *   - Fijo: Indianapolis 2005 starts only the six Bridgestone cars, whoever the player is;
 *   - Fijo en estricto: McLaren 2007 scores zero constructors' points (drivers keep theirs);
 *   - Fijo: Lauda misses rounds 11-12 in 1976 (Austria, Netherlands), also for a player-run Ferrari;
 *   - Guiado: Schumacher's 1997 exclusion only when the Jerez situation reproduces;
 *   - RF-INB-02: events reach the inbox and the news on their date, once.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import curated from "../../data/seasons/curated/events.json";
import { constructorStandings, createCareer, createContext, driverStandings, entrantsFor } from "../career";
import { roundLineup } from "../packs/packWorld";
import { loadSeasonPack, seasonPackYears } from "../packs/seasonPacks";
import { validateSeasonPack } from "../packs/validatePack";
import { emptySeason, recordRace } from "../standings";
import {
  adjustConstructorStandings, adjustDriverStandings, applyHistoricalStandings, deliverHistoryEvents, dueHistoryEvents, effectOf,
  exclusionConditionMet, historyClock, isAbsent, isDue, isStrict, lineupWithAbsences, nextRegulationsSource, raceStarters,
  regulationVoteAllowed, seasonEvents,
} from ".";

const PLAYABLE = [1976, 1986, 1988, ...Array.from({ length: 25 }, (_, i) => 1990 + i), 2016, ...Array.from({ length: 9 }, (_, i) => 2018 + i)];

let packs = {};
let context = null;

beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year).catch(() => null)));
  packs = Object.fromEntries(loaded.filter(Boolean).map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
}, 60000);

const career = (year, teamId, extra = {}) => ({ ...createCareer(context, { year, teamId, seed: `history-${year}-${teamId}` }), ...extra });
const tyreOf = (pack, round, teamId) => pack.entries.find((entry) => entry.round === round && entry.teamId === teamId)?.tyreSupplier;

describe("curated events (RF-INB-02, SRS 6.3)", () => {
  it("cover the 38 playable seasons with 5 to 12 dated, sourced, bilingual events", () => {
    expect(PLAYABLE).toHaveLength(38);
    PLAYABLE.forEach((year) => {
      const events = curated[String(year)];
      expect(events && events.length).toBeGreaterThanOrEqual(5);
      expect(events.length).toBeLessThanOrEqual(12);
      events.forEach((event) => {
        expect(event.id.startsWith(`${year}-`)).toBe(true);
        expect(event.date.startsWith(`${year}-`)).toBe(true);
        expect(event.source).toMatch(/^https:\/\//);
        expect(event.title.es && event.title.en && event.body.es && event.body.en).toBeTruthy();
        expect(["data", "source", "pending"]).toContain(event.verification);
      });
    });
  });

  it("pass the season-pack validator in every season that has a pack", () => {
    const years = Object.keys(packs).map(Number);
    expect(years.length).toBeGreaterThan(0);
    years.forEach((year) => {
      const pack = { ...packs[year], events: curated[String(year)] };
      const errors = validateSeasonPack(pack).errors.filter((error) => /events/.test(error));
      expect({ year, errors }).toEqual({ year, errors: [] });
    });
  });

  it("put every constraint with a round on a real Grand Prix of that date", () => {
    Object.entries(packs).forEach(([year, pack]) => {
      curated[year].filter((event) => event.round !== null).forEach((event) => {
        expect(pack.calendar.find((race) => race.round === event.round)?.date).toBe(event.date);
      });
    });
  });
});

describe("RF-HIS-00 · sensitive events are only notes", () => {
  const sensitive = PLAYABLE.flatMap((year) => curated[String(year)].filter((event) => event.sensitive));

  it("include the fatal accidents of the covered seasons, as notes without effect", () => {
    const ids = sensitive.map((event) => event.id);
    expect(ids).toEqual(expect.arrayContaining(["1994-ratzenberger", "1994-senna", "2014-bianchi", "1986-de-angelis"]));
    sensitive.forEach((event) => {
      expect(event.kind).toBe("note");
      expect(event.effect).toBeUndefined();
    });
  });

  it("never produce an effect, even if the data carried one", () => {
    const forged = { ...sensitive[0], kind: "constraint", effect: { type: "race-starters", teams: ["ferrari"] } };
    expect(effectOf(forged, { mode: "strict" })).toBeNull();
    expect(effectOf(forged, { mode: "free" })).toBeNull();
    const fake = { year: 1994, round: 2, world: { year: 1994, races: [{}, {}, { date: "1994-05-01" }] } };
    const entrants = [{ id: "a", teamId: "williams" }, { id: "b", teamId: "benetton" }];
    expect(raceStarters(fake, entrants, { events: [{ ...forged, round: 3 }] })).toBe(entrants);
  });

  it("reach the news as a read-only note after the Imola weekend, never before it nor as a decision", () => {
    const c = career(1994, "williams");
    c.round = 2; // next race is Imola (round 3)
    expect(dueHistoryEvents(c).map((event) => event.id)).not.toContain("1994-ratzenberger");
    expect(dueHistoryEvents(c).map((event) => event.id)).not.toContain("1994-senna");
    c.round = 3;
    deliverHistoryEvents(c);
    const notes = c.inbox.filter((item) => item.kind === "history-event" && item.sensitive);
    expect(notes.map((item) => item.eventId).sort()).toEqual(["1994-ratzenberger", "1994-senna"]);
    notes.forEach((item) => {
      expect(item.stop).toBe(false);
      expect(item.event).toBeUndefined();
    });
    expect(c.flags.stops.some((stop) => stop.kind === "history-event")).toBe(false);
  });
});

describe("Fijo · Indianapolis 2005: only the six Bridgestone cars start", () => {
  const STARTERS = ["ferrari", "jordan", "minardi"];

  it("the event names exactly the Bridgestone teams the pack enters at round 9", () => {
    const pack = packs[2005];
    const event = seasonEvents(2005, { pack }).find((item) => item.id === "2005-usa-michelin");
    const bridgestone = [...new Set(pack.entries.filter((e) => e.round === 9 && e.tyreSupplier === "bridgestone").map((e) => e.teamId))].sort();
    expect(event.effect.teams.slice().sort()).toEqual(bridgestone);
    expect(bridgestone).toEqual(STARTERS);
    expect(pack.realResults.filter((row) => row.round === 9 && row.status === "DNS")).toHaveLength(14);
  });

  it.each(["mclaren", "renault", "ferrari", "minardi"])("gives the race engine 6 Bridgestone cars when the player runs %s", (teamId) => {
    const c = career(2005, teamId);
    c.round = 8;
    const all = entrantsFor(c);
    expect(all).toHaveLength(20);
    const starters = raceStarters(c, all);
    expect(starters).toHaveLength(6);
    starters.forEach((entrant) => expect(tyreOf(packs[2005], 9, entrant.teamId)).toBe("bridgestone"));
    const own = starters.filter((entrant) => entrant.isUser);
    expect(own).toHaveLength(STARTERS.includes(teamId) ? 2 : 0);
  });

  it("applies in Libre too (fixed anchor) and only at Indianapolis", () => {
    const c = career(2005, "mclaren", { mode: "free" });
    c.round = 8;
    expect(raceStarters(c, entrantsFor(c))).toHaveLength(6);
    c.round = 9;
    expect(raceStarters(c, entrantsFor(c))).toHaveLength(entrantsFor(c).length);
  });

  it("keeps a custom team in the garage as well", () => {
    const c = createCareer(context, { year: 2005, custom: { name: "Garage Team", backer: "corporate" }, seed: "indy-custom" });
    c.round = 8;
    const starters = raceStarters(c, entrantsFor(c));
    expect(starters).toHaveLength(6);
    expect(starters.some((entrant) => entrant.isUser)).toBe(false);
  });
});

describe("Fijo en estricto · McLaren 2007 out of the constructors' championship", () => {
  const seeded = (mode, round) => {
    const c = career(2007, "williams", { mode });
    c.round = round;
    c.season.teams.mclaren = { teamId: "mclaren", points: 203, wins: 8, podiums: 20, best: 1 };
    c.season.teams.ferrari = { teamId: "ferrari", points: 204, wins: 9, podiums: 18, best: 1 };
    c.season.teams["bmw-sauber"] = { teamId: "bmw-sauber", points: 101, wins: 0, podiums: 2, best: 2 };
    c.season.drivers["lewis-hamilton"] = { driverId: "lewis-hamilton", name: "Lewis Hamilton", teamId: "mclaren", points: [109], wins: 4, podiums: 12, best: 1 };
    return c;
  };

  it("zeroes McLaren's constructors' points in strict mode once the decision (13 Sep) has passed", () => {
    const c = seeded("strict", 13); // next race Belgium, 16 Sep: the clock is 13 Sep
    const table = adjustConstructorStandings(c, constructorStandings(c));
    const mclaren = table.find((row) => row.teamId === "mclaren");
    expect(mclaren.total).toBe(0);
    expect(mclaren.excluded).toBe(true);
    expect(mclaren.position).toBe(table.length);
    expect(table[0].teamId).toBe("ferrari");
    expect(table[1].teamId).toBe("bmw-sauber");
  });

  it("keeps the drivers' points", () => {
    const c = seeded("strict", 17);
    const { drivers } = applyHistoricalStandings(c, { drivers: driverStandings(c), constructors: constructorStandings(c) });
    expect(drivers.find((row) => row.driverId === "lewis-hamilton").total).toBe(109);
  });

  it("does nothing in Libre, nor before the decision", () => {
    const free = seeded("free", 17);
    expect(adjustConstructorStandings(free, constructorStandings(free)).find((row) => row.teamId === "mclaren").total).toBe(203);
    const early = seeded("strict", 10);
    expect(adjustConstructorStandings(early, constructorStandings(early)).find((row) => row.teamId === "mclaren").total).toBe(203);
  });
});

describe("Fijo · absences in the real entries (roundLineup and the player's team)", () => {
  const lineupAt = (c, teamId, round) => {
    const race = c.world.races[round - 1];
    return roundLineup({ world: c.world, team: c.world.teams[teamId], race, isUser: teamId === c.teamId }).map((driver) => driver.id);
  };

  it("1976: Ferrari skips Austria (round 11), Lauda misses the Netherlands (12) and returns at Monza (13)", () => {
    const c = career(1976, "mclaren");
    expect(c.world.races[10].date).toBe("1976-08-15");
    expect(c.world.races[11].date).toBe("1976-08-29");
    expect(lineupAt(c, "ferrari", 10)).toContain("niki-lauda");
    expect(lineupAt(c, "ferrari", 11)).toEqual([]);
    expect(lineupAt(c, "ferrari", 12)).toEqual(["clay-regazzoni"]);
    expect(lineupAt(c, "ferrari", 13)).toContain("niki-lauda");
  });

  it("1976: Ferrari, absent from Austria only, is not partial and the player can run it", () => {
    expect(career(1976, "ferrari").world.teams.ferrari.partial).toBe(false);
  });

  it("1994: a player-run Benetton loses Schumacher for his ban (rounds 12-13) and gets him back at Jerez", () => {
    const c = career(1994, "benetton");
    const team = c.world.teams.benetton;
    const own = (round) => lineupWithAbsences(c, team, lineupAt(c, "benetton", round).map((id) => c.world.drivers[id]), { round }).map((d) => d.id);
    expect(lineupAt(c, "benetton", 12)).toContain("michael-schumacher"); // the player's team fields its own drivers...
    expect(own(12)).not.toContain("michael-schumacher"); // ...minus a real absence
    expect(own(13)).not.toContain("michael-schumacher");
    expect(own(14)).toContain("michael-schumacher");
    expect(own(11)).toContain("michael-schumacher");
  });

  it("an explicit driver-absent effect covers Lauda 1976 (11-12) even where his team did not race", () => {
    const c = career(1976, "mclaren");
    expect(isAbsent(c, "niki-lauda", { round: 11 })).toBe(true);
    expect(isAbsent(c, "niki-lauda", { round: 12 })).toBe(true);
    expect(isAbsent(c, "niki-lauda", { round: 13 })).toBe(false);
    expect(isAbsent(c, "clay-regazzoni", { round: 11 })).toBe(false);
  });

  it("1994: Schumacher's two-race ban (Monza, Estoril) is an absence; 1991: Prost's sacking is not", () => {
    const c94 = career(1994, "williams");
    expect(lineupAt(c94, "benetton", 12)).not.toContain("michael-schumacher");
    expect(isAbsent(c94, "michael-schumacher", { round: 12 })).toBe(true);
    expect(isAbsent(c94, "michael-schumacher", { round: 13 })).toBe(true);
    expect(isAbsent(c94, "michael-schumacher", { round: 14 })).toBe(false);
    const c91 = career(1991, "williams");
    expect(isAbsent(c91, "alain-prost", { round: 16 })).toBe(false);
  });

  it("2008: Super Aguri is entered in the first four rounds only", () => {
    const c = career(2008, "ferrari");
    expect(lineupAt(c, "super-aguri", 4).length).toBe(2);
    expect(lineupAt(c, "super-aguri", 5)).toEqual([]);
  });
});

describe("Guiado · Schumacher 1997, only if Jerez reproduces", () => {
  const season1997 = (c, { leader = "michael-schumacher", deciderStatus = "collision" } = {}) => {
    c.season = emptySeason(1997);
    const second = leader === "michael-schumacher" ? "jacques-villeneuve" : "michael-schumacher";
    const team = { "michael-schumacher": "ferrari", "jacques-villeneuve": "williams" };
    for (let round = 1; round <= 16; round += 1) {
      const rows = [leader, second].map((driverId, index) => ({ driverId, teamId: team[driverId], name: driverId, position: index + 1, grid: index + 1, status: "finished", points: index === 0 ? 6 : 5 }));
      recordRace(c.season, { round, rows, teamPoints: {} });
    }
    const decider = [
      { driverId: "jacques-villeneuve", teamId: "williams", name: "JV", position: 1, grid: 1, status: "finished", points: 1 },
      { driverId: "michael-schumacher", teamId: "ferrari", name: "MS", position: 2, grid: 2, status: deciderStatus, points: 0 },
    ];
    recordRace(c.season, { round: 17, rows: decider, teamPoints: {} });
    c.round = 17;
    return c;
  };
  const effect = curated["1997"].find((event) => event.id === "1997-schumacher-excluded").effect;

  it("excludes him from the drivers' table when he led, collided with Villeneuve in the decider and Villeneuve finished", () => {
    const c = season1997(career(1997, "williams"));
    expect(exclusionConditionMet(c, effect)).toBe(true);
    const table = adjustDriverStandings(c, driverStandings(c));
    expect(table[0].driverId).toBe("jacques-villeneuve");
    expect(table.find((row) => row.driverId === "michael-schumacher")).toMatchObject({ total: 0, excluded: true });
  });

  it("does not apply when the situation differs, nor in Libre", () => {
    expect(exclusionConditionMet(season1997(career(1997, "williams"), { deciderStatus: "mechanical" }), effect)).toBe(false);
    expect(exclusionConditionMet(season1997(career(1997, "williams"), { leader: "jacques-villeneuve" }), effect)).toBe(false);
    const free = season1997(career(1997, "williams", { mode: "free" }));
    expect(adjustDriverStandings(free, driverStandings(free)).find((row) => row.driverId === "michael-schumacher").excluded).toBeUndefined();
  });
});

describe("RF-INB-02 · events on their date", () => {
  it("delivers each event once: race constraints the week before, race notes after the race, others by date", () => {
    const c = career(2008, "ferrari");
    expect(historyClock(c)).toBe("2008-03-13");
    deliverHistoryEvents(c);
    const delivered = () => c.inbox.filter((item) => item.kind === "history-event").map((item) => item.eventId);
    expect(delivered()).toEqual(["2008-no-traction-control"]);
    expect(c.news.some((item) => item.kind === "history-event" && item.eventId === "2008-no-traction-control")).toBe(true);

    c.round = 4; // Spain done, Turkey (11 May) next: Super Aguri's withdrawal (6 May) is due
    deliverHistoryEvents(c);
    expect(delivered()).toContain("2008-super-aguri-withdraws");
    expect(delivered()).not.toContain("2008-singapore-night-race");

    const before = delivered().length;
    deliverHistoryEvents(c);
    expect(delivered()).toHaveLength(before);

    c.round = 15; // Singapore done
    deliverHistoryEvents(c);
    expect(delivered()).toContain("2008-singapore-night-race");
    expect(delivered()).not.toContain("2008-hamilton-champion");
    c.round = 18; // season over
    deliverHistoryEvents(c);
    expect(new Set(delivered())).toEqual(new Set(curated["2008"].map((event) => event.id)));
  });

  it("isDue: Indianapolis 2005 is announced before round 9, Alonso's title after round 17", () => {
    const c = career(2005, "renault");
    const indy = curated["2005"].find((event) => event.id === "2005-usa-michelin");
    const title = curated["2005"].find((event) => event.id === "2005-alonso-champion");
    c.round = 7;
    expect(isDue(indy, c)).toBe(false);
    c.round = 8;
    expect(isDue(indy, c)).toBe(true);
    c.round = 16;
    expect(isDue(title, c)).toBe(false);
    c.round = 17;
    expect(isDue(title, c)).toBe(true);
  });

  it("sends no mail to a spectator career", () => {
    const c = career(2008, "ferrari", { spectator: true });
    expect(deliverHistoryEvents(c)).toEqual([]);
  });
});

describe("RF-INB-03 · regulation votes only in Libre", () => {
  it("reads career.mode", () => {
    expect(isStrict({ mode: "strict" })).toBe(true);
    expect(isStrict({ mode: "free" })).toBe(false);
    expect(regulationVoteAllowed({ mode: "strict" })).toBe(false);
    expect(regulationVoteAllowed({ mode: "free" })).toBe(true);
    expect(nextRegulationsSource({ mode: "strict" })).toBe("real");
    expect(nextRegulationsSource({ mode: "free" })).toBe("vote");
  });
});
