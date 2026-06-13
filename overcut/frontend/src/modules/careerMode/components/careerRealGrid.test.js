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
      "2010s": [{ name: "Generic Driver", rating: 70, firstYear: 2010, lastYear: 2010, decade: "2010s" }],
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
});
