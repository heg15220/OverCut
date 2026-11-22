/**
 * The manager engine, end to end, without rendering anything.
 *
 * Every test runs on the offline bootstrap (one real season per decade) and the
 * generated f1db reference tables, which is exactly what a player without a
 * connection gets.
 */

import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import {
  PHASES, closeWeekend, completeRace, constructorStandings, createCareer, createContext, createWeekendRace,
  driverStandings, nextAction, openOffseason, projectQuote, runPractice, runQualifyingSession, simulateWeekend,
  startProject, startableYears, entrantsFor,
} from "./career";
import { startNextSeason } from "./offseason";
import { askingTerms, makeOffer, signDriver, marketStatusOf } from "./market";
import { resolveEvent } from "./events";
import { requestPit, runningOrder, setMode, stepLap, suggestPlan, tyreTime } from "./race";
import { enginesFor } from "./identity";
import { validateCareer } from "./save";
import { carRatingOf } from "./car";

const context = createContext(fallbackBootstrap, reference);

const playSeason = (career) => {
  let guard = 0;
  while (career.phase !== PHASES.REVIEW && !career.ended && guard < 40) {
    simulateWeekend(career);
    const { stops } = closeWeekend(career);
    // Answer whatever lands on the desk with the first option.
    (stops || []).forEach((stop) => {
      const item = career.inbox.find((entry) => entry.id === stop.id);
      if (item?.kind === "event") resolveEvent(career, item.id, item.event.options[0]);
    });
    guard += 1;
  }
  return career;
};

describe("manager world", () => {
  it("offers every offline season", () => {
    expect(startableYears(context)).toEqual(expect.arrayContaining([1976, 1988, 2008, 2024]));
  });

  it("builds a real grid with real ages, contracts and a calendar", () => {
    const career = createCareer(context, { year: 2024, teamId: "mclaren", managerName: "Test", seed: "t1" });
    const earlier = createCareer(context, { year: 2016, teamId: "williams", seed: "t1b" });
    const { world } = career;
    expect(Object.keys(world.teams).length).toBe(10);
    expect(world.races.length).toBeGreaterThanOrEqual(20);
    expect(world.races[0]).toMatchObject({ name: "Bahrain Grand Prix", laps: 57 });
    const verstappen = world.drivers["max-verstappen"];
    expect(verstappen.age).toBe(27);
    expect(verstappen.nat).toBe("nl");
    expect(verstappen.contract.teamId).toBe("red-bull");
    expect(world.teams.mclaren.drivers).toHaveLength(2);
    // Tomorrow's names are on the market as juniors.
    const leclerc = earlier.world.drivers["charles-leclerc"];
    expect(leclerc).toMatchObject({ status: "junior", real: true, age: 19 });
  });

  it("leaves the Indianapolis 500 and its one-off entries out of the 1950s", () => {
    const career = createCareer(context, { year: 1955, teamId: "ferrari", seed: "t2" });
    expect(career.world.races.some((race) => race.name === "Indianapolis 500")).toBe(false);
    expect(Object.keys(career.world.teams).length).toBeLessThan(12);
  });
});

describe("a custom team", () => {
  it("joins the chosen season's grid with its own drivers and engine", () => {
    const base = createCareer(context, { year: 2008, teamId: "ferrari", seed: "t3" });
    const free = Object.values(base.world.drivers).filter((driver) => driver.status === "free").slice(0, 2);
    const engine = enginesFor(2008)[0];
    const career = createCareer(context, {
      year: 2008,
      seed: "t3",
      managerName: "Owner",
      custom: { name: "Seam Racing", short: "SEA", color: "#f2b705", color2: "#10294f", country: "es", hq: "barcelona", engineId: engine.id, backer: "corporate", driverIds: free.map((driver) => driver.id) },
    });
    const team = career.world.teams[career.teamId];
    expect(team.custom).toBe(true);
    expect(career.owner).toBe(true);
    expect(Object.keys(career.world.teams).length).toBe(Object.keys(base.world.teams).length + 1);
    expect(team.drivers).toEqual(free.map((driver) => driver.id));
    expect(team.engine.id).toBe(engine.id);
    expect(entrantsFor(career).length).toBe(Object.keys(career.world.teams).length * 2);
  });

  it("can take a real driver off another team, which fills the seat", () => {
    const base = createCareer(context, { year: 2016, teamId: "ferrari", seed: "t4" });
    const star = base.world.drivers["lewis-hamilton"];
    expect(star).toBeTruthy();
    const career = createCareer(context, { year: 2016, seed: "t4", custom: { name: "Garage 16", backer: "manufacturer", driverIds: [star.id] } });
    expect(career.world.teams[career.teamId].drivers).toContain(star.id);
    expect(career.world.teams.mercedes.drivers).toHaveLength(2);
    expect(career.world.teams.mercedes.drivers).not.toContain(star.id);
  });
});

describe("the race", () => {
  it("runs lap by lap with live calls and classifies everyone", () => {
    const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "t5" });
    runPractice(career, { "charles-leclerc": "longrun" });
    const grid = runQualifyingSession(career, {});
    expect(grid.order.length).toBe(20);
    expect(grid.format).toBe("knockout");
    const state = createWeekendRace(career);
    const mine = state.cars.find((car) => car.isUser);
    setMode(state, mine.id, "push");
    for (let lap = 0; lap < 10; lap += 1) stepLap(state);
    requestPit(state, mine.id, "hard");
    stepLap(state);
    expect(state.cars.find((car) => car.id === mine.id).stops).toBeGreaterThanOrEqual(1);
    const summary = completeRace(career, state);
    expect(summary.rows).toHaveLength(20);
    expect(summary.rows[0].position).toBe(1);
    expect(runningOrder(state)[0].status).toBe("finished");
    expect(Object.values(summary.teamPoints).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it("prefers sensible strategies by era", () => {
    const modern = suggestPlan({ year: 2024, laps: 57, baseLap: 95, profile: { aero: 0.5, attrition: 1.05 } });
    expect(modern.stops.length).toBeGreaterThanOrEqual(1);
    expect(new Set(modern.compounds).size).toBeGreaterThanOrEqual(2);
    const refuel = suggestPlan({ year: 2004, laps: 60, baseLap: 85, profile: { aero: 0.6, attrition: 1 } });
    expect(refuel.stops.length).toBeGreaterThanOrEqual(1);
    const classic = suggestPlan({ year: 1965, laps: 80, baseLap: 100, profile: { aero: 0.5, attrition: 1 } });
    expect(classic.stops).toHaveLength(0);
  });

  it("punishes slicks on a wet track", () => {
    expect(tyreTime({ compound: "soft", age: 2, wetness: 0.7, year: 2024 })).toBeGreaterThan(tyreTime({ compound: "inter", age: 2, wetness: 0.7, year: 2024 }) + 5);
    expect(tyreTime({ compound: "wet", age: 2, wetness: 0.05, year: 2024 })).toBeGreaterThan(tyreTime({ compound: "medium", age: 2, wetness: 0.05, year: 2024 }) + 4);
  });

  it("lets the best car win more than its share across a season", () => {
    const career = createCareer(context, { year: 1988, teamId: "williams", seed: "t6" });
    playSeason(career);
    const winners = constructorStandings(career);
    expect(winners[0].teamId).toBe("mclaren");
  });
});

describe("a season and the next", () => {
  it("plays a whole season, reviews it and starts the next with history pulling the rivals", () => {
    const career = createCareer(context, { year: 2008, teamId: "williams", seed: "t7", managerName: "Frank" });
    const quote = projectQuote(career, { area: "aero", size: "medium" });
    expect(quote.cost).toBeGreaterThan(0);
    expect(startProject(career, { area: "aero", size: "medium" }).ok).toBe(true);
    const before = career.world.teams.williams.car.aero;
    playSeason(career);
    expect(career.phase === PHASES.REVIEW || career.ended).toBeTruthy();
    expect(career.season.results.length).toBe(career.world.races.length);
    expect(driverStandings(career)[0].total).toBeGreaterThan(0);
    expect(career.history).toHaveLength(1);
    expect(career.world.teams.williams.car.aero).not.toBe(before);
    if (career.ended) return;
    openOffseason(career);
    expect(nextAction(career).kind).toBe("new-season");
    startNextSeason(context, career);
    expect(career.year).toBe(2009);
    expect(career.phase).toBe(PHASES.PRESEASON);
    // 2009 is not in the offline bootstrap, so the world runs on its own.
    expect(career.world.races.length).toBeGreaterThan(10);
    Object.values(career.world.teams).forEach((team) => expect(team.drivers.length).toBe(2));
  });

  it("follows real history into the next real season", () => {
    // The offline bootstrap has no consecutive seasons, so give it a 2025 that
    // is 2024 with Hamilton and Sainz swapped, the way it really went.
    const swap = { "Lewis Hamilton": "Carlos Sainz", "Carlos Sainz": "Lewis Hamilton" };
    const lineups2025 = fallbackBootstrap.lineupsByYear["2024"].map((entry) => ({
      ...entry,
      drivers: entry.drivers.map((driver) => (swap[driver.name] ? { ...driver, name: swap[driver.name] } : driver)),
    }));
    const bootstrap = {
      ...fallbackBootstrap,
      seasonYears: [...fallbackBootstrap.seasonYears, 2025],
      racesByYear: { ...fallbackBootstrap.racesByYear, 2025: fallbackBootstrap.racesByYear["2024"] },
      lineupsByYear: { ...fallbackBootstrap.lineupsByYear, 2025: lineups2025 },
      constructorStandingsByYear: { ...fallbackBootstrap.constructorStandingsByYear, 2025: fallbackBootstrap.constructorStandingsByYear["2024"] },
      driverProfiles: fallbackBootstrap.driverProfiles.map((profile) => ({ ...profile, lastYear: profile.lastYear === 2024 ? 2025 : profile.lastYear })),
    };
    const extended = createContext(bootstrap, reference);
    const career = createCareer(extended, { year: 2024, teamId: "williams", seed: "t8" });
    playSeason(career);
    if (career.ended) return;
    openOffseason(career);
    startNextSeason(extended, career);
    expect(career.year).toBe(2025);
    expect(career.world.drivers["lewis-hamilton"].teamId).toBe("ferrari");
    expect(career.world.drivers["carlos-sainz"].teamId).toBe("mercedes");
  });

  it("signs a junior for next season through a negotiation", () => {
    const career = createCareer(context, { year: 2024, teamId: "alpine-f1-team", seed: "t9" });
    const junior = Object.values(career.world.drivers).find((driver) => marketStatusOf(career, driver) === "junior");
    const ask = askingTerms(career, junior);
    const answer = makeOffer(career, junior.id, { salary: Math.round(ask.salary * 1.15), years: ask.years, role: ask.role, start: "next" });
    expect(answer.status).toBe("accepted");
    expect(signDriver(career, junior.id, { start: "next", seat: "race" }).ok).toBe(true);
    expect(career.market.signed[junior.id]).toBeTruthy();
  });
});

describe("saves", () => {
  it("round-trips through JSON and stays small enough for the server", () => {
    const career = createCareer(context, { year: 2024, teamId: "haas-f1-team", seed: "t10" });
    playSeason(career);
    const json = JSON.stringify(career);
    expect(json.length).toBeLessThan(240 * 1024);
    const back = validateCareer(JSON.parse(json));
    expect(back.teamId).toBe("haas-f1-team");
    expect(carRatingOf(back.world.teams["haas-f1-team"].car)).toBeGreaterThan(0);
  });
});
