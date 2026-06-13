import {
  prepareCareerBootstrap,
  createCareerSeason,
  simulateCareerRace,
  completeRace,
  teammateBattleSummary,
  evaluateSeason,
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

// Hand-built season: player vs one team-mate over two races.
const seasonWith = (playerPoints, matePoints) => ({
  year: 2010,
  contract: {
    team: { name: "Williams" },
    objectives: { points: 30, minimumPoints: 8, constructorPosition: 8, reputationBonus: 8 },
  },
  grid: [
    { name: "Williams", drivers: [{ name: "Player", isPlayer: true, rating: 60 }, { name: "Mate", rating: 78 }] },
    { name: "Ferrari", drivers: [{ name: "A", rating: 90 }, { name: "B", rating: 88 }] },
  ],
  driverStandings: [
    { id: "career-player", name: "Player", team: "Williams", isPlayer: true, points: playerPoints, position: 5 },
    { id: "Mate-Williams", name: "Mate", team: "Williams", isPlayer: false, points: matePoints, position: 8 },
  ],
  constructorStandings: [{ name: "Williams", position: 6, points: playerPoints + matePoints }],
  completedRaces: [
    {
      results: [
        { isPlayer: true, team: "Williams", name: "Player", position: 5, gridPosition: 7 },
        { isPlayer: false, team: "Williams", name: "Mate", position: 8, gridPosition: 6 },
      ],
    },
    {
      results: [
        { isPlayer: true, team: "Williams", name: "Player", position: 9, gridPosition: 10 },
        { isPlayer: false, team: "Williams", name: "Mate", position: 6, gridPosition: 5 },
      ],
    },
  ],
});

describe("teammateBattleSummary", () => {
  test("counts race and quali head-to-head and the points tally", () => {
    const battle = teammateBattleSummary(seasonWith(24, 12), profile);
    expect(battle.teammateName).toBe("Mate");
    expect(battle.teammateRating).toBe(78);
    expect(battle.raceWins).toBe(1); // race 1: P5 vs P8
    expect(battle.raceLosses).toBe(1); // race 2: P9 vs P6
    expect(battle.qualiWins).toBe(0);
    expect(battle.qualiLosses).toBe(2);
    expect(battle.playerPoints).toBe(24);
    expect(battle.teammatePoints).toBe(12);
    expect(battle.pointsGap).toBe(12);
    expect(battle.beaten).toBe(true);
    expect(battle.leading).toBe(true);
  });

  test("losing the points tally is not beaten", () => {
    const battle = teammateBattleSummary(seasonWith(8, 30), profile);
    expect(battle.beaten).toBe(false);
    expect(battle.leading).toBe(false);
    expect(battle.pointsGap).toBe(-22);
  });
});

describe("evaluateSeason folds the team-mate duel into reputation/status", () => {
  test("beating the team-mate adds reputation", () => {
    const won = evaluateSeason({ season: seasonWith(24, 12), profile });
    const lost = evaluateSeason({ season: seasonWith(12, 24), profile });
    expect(won.teammateBattle.beaten).toBe(true);
    expect(won.teammateRepDelta).toBe(6);
    expect(lost.teammateRepDelta).toBe(-6);
    // The duel moves reputation, and thus status, in the right direction.
    expect(won.reputationDelta).toBeGreaterThan(lost.reputationDelta);
  });
});

describe("integration: duel tracks the real team-mate", () => {
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

  test("after a race the duel names the real team-mate", () => {
    const contract = { id: "c", team: { name: "Williams", rating: 72, color: "#0090ff" }, objectives: {}, duration: 1 };
    let season = createCareerSeason({ bootstrap, profile, year: 2010, contract });
    const result = simulateCareerRace({ season, raceIndex: 0, profile });
    season = completeRace(season, 0, result);

    const battle = teammateBattleSummary(season, profile);
    expect(battle).not.toBeNull();
    expect(battle.teammateName).toBe("Rubens Barrichello");
    expect(battle.racesCompared).toBe(1);
    expect(battle.raceWins + battle.raceLosses).toBe(1);
  });
});
