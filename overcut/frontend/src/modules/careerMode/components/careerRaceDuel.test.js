import {
  prepareCareerBootstrap,
  createCareerSeason,
  simulateCareerRace,
  interpolateRacePosition,
  raceResultRows,
} from "./careerModeEngine";

const profile = {
  name: "Player",
  helmetColor: "#123456",
  rating: 60,
  reputation: 40,
  consistency: 58,
  aggression: 55,
  seasons: 0,
  status: "rookie",
  stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
};

describe("interpolateRacePosition", () => {
  test("returns the start at the beginning and the final at the end", () => {
    expect(interpolateRacePosition(12, 4, 0)).toBe(12);
    expect(interpolateRacePosition(12, 4, 1)).toBe(4);
  });

  test("moves from the start towards the final as the race progresses", () => {
    const early = interpolateRacePosition(12, 4, 0.2);
    const late = interpolateRacePosition(12, 4, 0.8);
    expect(early).toBeLessThanOrEqual(12);
    expect(early).toBeGreaterThanOrEqual(4);
    expect(late).toBeLessThan(early); // closer to the better final position
  });

  test("never returns a position below 1", () => {
    expect(interpolateRacePosition(1, 1, 0.5)).toBe(1);
  });
});

describe("raceResultRows", () => {
  const grid = (count) =>
    Array.from({ length: count }, (_, index) => ({ id: `d${index}`, position: index + 1, isPlayer: false }));

  test("keeps the top 10 and adds nothing when the player is inside it", () => {
    const results = grid(18);
    results[3].isPlayer = true; // P4
    const { rows, playerBelow } = raceResultRows(results);
    expect(rows).toHaveLength(10);
    expect(playerBelow).toBeNull();
  });

  test("appends the player row when they finish outside the top 10", () => {
    const results = grid(18);
    results[12].isPlayer = true; // P13
    const { rows, playerBelow } = raceResultRows(results);
    expect(rows).toHaveLength(10);
    expect(playerBelow).not.toBeNull();
    expect(playerBelow.position).toBe(13);
    expect(rows.some((row) => row.isPlayer)).toBe(false);
  });
});

describe("simulateCareerRace exposes the team-mate for the live duel", () => {
  const bootstrap = prepareCareerBootstrap({
    decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
    seasonYears: [2010],
    teamsByDecade: {
      "2010s": [
        { name: "Williams", rating: 72, firstYear: 2010, lastYear: 2010, decade: "2010s" },
        { name: "Ferrari", rating: 95, firstYear: 2010, lastYear: 2010, decade: "2010s" },
      ],
    },
    driversByDecade: { "2010s": [{ name: "X", rating: 70, firstYear: 2010, lastYear: 2010, decade: "2010s" }] },
    racesByYear: { "2010": [{ round: 1, name: "Race A" }] },
    lineupsByYear: {
      "2010": [
        { id: "williams", team: "Williams", rating: 72, races: 1, drivers: [{ name: "Rubens Barrichello", rating: 78, races: 1 }, { name: "Nico Hulkenberg", rating: 75, races: 1 }] },
        { id: "ferrari", team: "Ferrari", rating: 95, races: 1, drivers: [{ name: "Felipe Massa", rating: 80, races: 1 }, { name: "Fernando Alonso", rating: 92, races: 1 }] },
      ],
    },
  });

  test("returns the real team-mate with start and final positions", () => {
    const contract = { id: "c", team: { name: "Williams", rating: 72, color: "#0090ff" }, objectives: {}, duration: 1 };
    const season = createCareerSeason({ bootstrap, profile, year: 2010, contract });
    const result = simulateCareerRace({ season, raceIndex: 0, profile });

    expect(result.teammate).not.toBeNull();
    expect(result.teammate.name).toBe("Rubens Barrichello");
    const mateResult = result.results.find((row) => !row.isPlayer && row.team === "Williams");
    expect(result.teammate.startingPosition).toBe(mateResult.gridPosition);
    expect(result.teammate.finalPosition).toBe(mateResult.position);
  });
});
