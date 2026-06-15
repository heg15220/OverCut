import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import {
  prepareCareerBootstrap,
  realTeamsForYear,
  generateContracts,
  createCareerSeason,
} from "./careerModeEngine";

// Minimal backend-shaped payload with a real 2010 lineup.
const buildBootstrap = () =>
  prepareCareerBootstrap({
    decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
    seasonYears: [2010],
    teamsByDecade: {
      "2010s": [
        { name: "Ferrari", rating: 95, firstYear: 2010, lastYear: 2010, decade: "2010s" },
        { name: "Williams", rating: 72, firstYear: 2010, lastYear: 2010, decade: "2010s" },
        { name: "Sauber", rating: 68, firstYear: 2010, lastYear: 2010, decade: "2010s" },
      ],
    },
    driversByDecade: {
      "2010s": [
        { name: "Generic Driver", rating: 70, firstYear: 2010, lastYear: 2010, decade: "2010s" },
        { name: "Decade Ace", rating: 86, firstYear: 2012, lastYear: 2012, decade: "2010s" },
        { name: "Decade Star", rating: 83, firstYear: 2013, lastYear: 2013, decade: "2010s" },
        { name: "Decade Mid", rating: 74, firstYear: 2014, lastYear: 2014, decade: "2010s" },
        { name: "Decade Backmarker", rating: 61, firstYear: 2015, lastYear: 2015, decade: "2010s" },
      ],
    },
    racesByYear: { "2010": [{ round: 1, name: "Race A" }, { round: 2, name: "Race B" }] },
    lineupsByYear: {
      "2010": [
        {
          id: "ferrari",
          team: "Ferrari",
          rating: 95,
          races: 2,
          drivers: [
            { name: "Felipe Massa", rating: 80, races: 2 },
            { name: "Fernando Alonso", rating: 92, races: 2 },
          ],
        },
        {
          id: "williams",
          team: "Williams",
          rating: 72,
          races: 2,
          drivers: [
            { name: "Rubens Barrichello", rating: 78, races: 2 },
            { name: "Nico Hulkenberg", rating: 75, races: 2 },
          ],
        },
        {
          id: "sauber",
          team: "Sauber",
          rating: 68,
          races: 2,
          drivers: [
            { name: "Kamui Kobayashi", rating: 72, races: 2 },
            { name: "Pedro de la Rosa", rating: 70, races: 1 },
          ],
        },
      ],
    },
  });

const profile = {
  name: "Debut Driver",
  helmetColor: "#123456",
  rating: 60,
  reputation: 30,
  consistency: 58,
  aggression: 55,
  seasons: 0,
  status: "rookie",
  stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
};

describe("real season grid from lineupsByYear", () => {
  const bootstrap = buildBootstrap();

  test("realTeamsForYear returns the real teams, null when absent", () => {
    expect(realTeamsForYear(bootstrap, 2010).map((team) => team.name)).toEqual([
      "Ferrari",
      "Williams",
      "Sauber",
    ]);
    expect(realTeamsForYear(bootstrap, 1999)).toBeNull();
    expect(realTeamsForYear(prepareCareerBootstrap(fallbackBootstrap, true), 2010)).toBeNull();
  });

  test("offered contracts are all real teams of that season", () => {
    const contracts = generateContracts({ bootstrap, year: 2010, playerProfile: profile });
    const realNames = new Set(realTeamsForYear(bootstrap, 2010).map((team) => team.name));
    contracts.forEach((contract) => expect(realNames.has(contract.team.name)).toBe(true));
  });

  test("debut grid uses the real lineup with the player slotted into the contract team", () => {
    const contract = { id: "c", team: { name: "Williams", rating: 72, color: "#0090ff" }, objectives: {}, duration: 1 };
    const season = createCareerSeason({ bootstrap, profile, year: 2010, contract });

    // Real teams present.
    expect(season.grid.map((team) => team.name).sort()).toEqual(["Ferrari", "Sauber", "Williams"]);

    // A non-contract team keeps its exact real pairing.
    const ferrari = season.grid.find((team) => team.name === "Ferrari");
    expect(ferrari.drivers.map((driver) => driver.name)).toEqual(["Felipe Massa", "Fernando Alonso"]);
    expect(ferrari.drivers.some((driver) => driver.isPlayer)).toBe(false);

    // Contract team: player + the real lead driver as team-mate, exactly two cars.
    const williams = season.grid.find((team) => team.name === "Williams");
    expect(williams.drivers).toHaveLength(2);
    const player = williams.drivers.find((driver) => driver.isPlayer);
    const teammate = williams.drivers.find((driver) => !driver.isPlayer);
    expect(player.name).toBe("Debut Driver");
    expect(teammate.name).toBe("Rubens Barrichello");

    // The player appears exactly once across the whole grid.
    const playerSeats = season.grid.flatMap((team) => team.drivers).filter((driver) => driver.isPlayer);
    expect(playerSeats).toHaveLength(1);
  });

  test("first visible career season still uses the real lineup when the season counter is already one", () => {
    const bootstrap2023 = prepareCareerBootstrap({
      decades: [{ key: "2020s", label: "2020s", from: 2020, to: 2029 }],
      seasonYears: [2023],
      teamsByDecade: {
        "2020s": [
          { name: "AlphaTauri", rating: 68, firstYear: 2023, lastYear: 2023, decade: "2020s" },
          { name: "Aston Martin", rating: 86, firstYear: 2023, lastYear: 2023, decade: "2020s" },
          { name: "Red Bull", rating: 97, firstYear: 2023, lastYear: 2023, decade: "2020s" },
          { name: "McLaren", rating: 88, firstYear: 2023, lastYear: 2023, decade: "2020s" },
        ],
      },
      driversByDecade: {
        "2020s": [
          { name: "Lance Stroll", rating: 77, firstYear: 2023, lastYear: 2023, decade: "2020s" },
          { name: "Fernando Alonso", rating: 94, firstYear: 2023, lastYear: 2023, decade: "2020s" },
          { name: "Max Verstappen", rating: 99, firstYear: 2023, lastYear: 2023, decade: "2020s" },
          { name: "Sergio Pérez", rating: 88, firstYear: 2023, lastYear: 2023, decade: "2020s" },
        ],
      },
      racesByYear: { "2023": [{ round: 1, name: "Race A" }] },
      lineupsByYear: {
        "2023": [
          {
            id: "alphatauri",
            team: "AlphaTauri",
            rating: 68,
            races: 22,
            drivers: [
              { name: "Yuki Tsunoda", rating: 76, races: 22 },
              { name: "Nyck de Vries", rating: 68, races: 10 },
            ],
          },
          {
            id: "aston-martin",
            team: "Aston Martin",
            rating: 86,
            races: 22,
            drivers: [
              { name: "Fernando Alonso", rating: 94, races: 22 },
              { name: "Lance Stroll", rating: 77, races: 22 },
            ],
          },
          {
            id: "red-bull",
            team: "Red Bull",
            rating: 97,
            races: 22,
            drivers: [
              { name: "Max Verstappen", rating: 99, races: 22 },
              { name: "Sergio Pérez", rating: 88, races: 22 },
            ],
          },
        ],
      },
    });
    const firstVisibleSeasonProfile = {
      ...profile,
      seasons: 1,
      stats: { ...profile.stats, teams: [] },
    };
    const contract = { id: "c", team: { name: "AlphaTauri", rating: 68, color: "#123456" }, objectives: {}, duration: 1 };
    const season = createCareerSeason({ bootstrap: bootstrap2023, profile: firstVisibleSeasonProfile, year: 2023, contract });

    const astonMartin = season.grid.find((team) => team.name === "Aston Martin");
    const redBull = season.grid.find((team) => team.name === "Red Bull");
    const alphaTauri = season.grid.find((team) => team.name === "AlphaTauri");

    expect(astonMartin.drivers.map((driver) => driver.name)).toEqual(["Fernando Alonso", "Lance Stroll"]);
    expect(redBull.drivers.map((driver) => driver.name)).toEqual(["Max Verstappen", "Sergio Pérez"]);
    expect(alphaTauri.drivers.map((driver) => driver.name)).toEqual(["Debut Driver", "Yuki Tsunoda"]);
  });

  test("from the second career season, teams can sign decade-market drivers with rating logic", () => {
    const contract = { id: "c", team: { name: "Williams", rating: 72, color: "#0090ff" }, objectives: {}, duration: 1 };
    const experiencedProfile = { ...profile, seasons: 1, stats: { ...profile.stats, teams: ["Williams"] } };
    const season = createCareerSeason({ bootstrap, profile: experiencedProfile, year: 2010, contract });

    const ferrari = season.grid.find((team) => team.name === "Ferrari");
    const ferrariDrivers = ferrari.drivers.map((driver) => driver.name);
    expect(ferrariDrivers).not.toEqual(["Felipe Massa", "Fernando Alonso"]);
    expect(ferrari.drivers.every((driver) => driver.rating >= 82)).toBe(true);

    const williams = season.grid.find((team) => team.name === "Williams");
    expect(williams.drivers.some((driver) => driver.isPlayer)).toBe(true);
    expect(williams.drivers.find((driver) => !driver.isPlayer)?.rating).toBeGreaterThanOrEqual(64);
  });
});
